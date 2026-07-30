import * as q from "@/lib/db/queries/judiciario";
import { REGRAS_COMUNS } from "@/lib/chat-comum";

/**
 * Recuperação de contexto do assistente do /judiciario.
 *
 * O dado deste eixo é pequeno e quase todo estrutural (5 tribunais, ~93
 * cadeiras, 140 nomeações), então o contexto pode ser generoso: cabe a
 * composição inteira dos tribunais citados sem estourar orçamento de token.
 *
 * DUAS ARMADILHAS DO DOMÍNIO ficam explícitas no prompt porque um modelo
 * treinado em texto da internet **erra as duas** por padrão, e errar aqui
 * invalida toda projeção do produto:
 *  - aposentadoria compulsória é **75** anos (EC 88/2015), não 70;
 *  - teto de idade para indicação é **70** (EC 122/2022), não 65.
 * Foi exatamente o erro do plano original deste projeto, que erraria em 5
 * anos toda projeção de vacância.
 */

const STOPWORDS = new Set([
  "a", "o", "os", "as", "de", "da", "do", "das", "dos", "e", "em", "no", "na",
  "um", "uma", "para", "pra", "por", "com", "que", "qual", "quais", "quanto",
  "quantos", "quem", "onde", "como", "sobre", "tribunal", "ministro", "ministros",
  "portal", "tem", "foi", "são", "é", "me", "diga", "mostre", "liste",
]);

function termos(pergunta: string): string[] {
  return pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .slice(0, 5);
}

export async function montarContexto(pergunta: string): Promise<string> {
  const secoes: string[] = [];
  const ts = termos(pergunta);

  // Composição: sempre no contexto, com a cobertura explícita. É o bloco que
  // permite ao modelo dizer "o STJ tem 33 cadeiras e o portal ainda não curou
  // quem as ocupa" em vez de inventar 33 nomes.
  try {
    const tribunais = (await q.listarTribunais()) ?? [];
    if (tribunais.length) {
      const linhas = await Promise.all(
        tribunais.map(async (t) => {
          const ocup = await q.ocupacoesAtuais(t.id);
          const comNome = ocup.filter((o) => o.magistrado_nome);
          const detalhe =
            comNome.length && ts.some((x) => t.id.includes(x) || (t.sigla ?? "").toLowerCase().includes(x))
              ? "\n  " +
                comNome
                  .map(
                    (o) =>
                      `${o.magistrado_nome} (cota ${o.cota ?? "n/d"}${
                        o.vacancia_projetada
                          ? `, completa 75 anos em ${o.vacancia_projetada}`
                          : ", data de nascimento não curada"
                      })`
                  )
                  .join("; ")
              : "";
          return (
            `- ${t.sigla} (${t.nome}): ${t.n_cadeiras ?? "?"} cadeiras previstas, ` +
            `${comNome.length} com ocupante identificado neste portal.` +
            detalhe
          );
        })
      );
      secoes.push(
        "COMPOSIÇÃO DOS TRIBUNAIS (o que este portal tem hoje):\n" + linhas.join("\n")
      );
    }
  } catch {
    /* degrada */
  }

  // Vacância projetada: o núcleo do produto.
  try {
    const vac = await q.proximasVacancias(10);
    if (vac.length) {
      secoes.push(
        "PRÓXIMAS VACÂNCIAS PROJETADAS (por aposentadoria compulsória aos 75 anos):\n" +
          vac
            .map(
              (v) =>
                `- ${v.magistrado_nome} (${(v.tribunal_id ?? "").toUpperCase()}, cota ${
                  v.cota ?? "n/d"
                }): vaga projetada em ${v.vacancia_projetada}`
            )
            .join("\n")
      );
    }
  } catch {
    /* degrada */
  }

  // Vagas abertas agora.
  try {
    const vagas = await q.listarVagas();
    if (vagas.length) {
      secoes.push(
        "VAGAS ABERTAS:\n" +
          vagas
            .slice(0, 8)
            .map(
              (v) =>
                `- aberta em ${v.data_abertura ?? "data n/d"}, motivo: ${
                  v.motivo ?? "n/d"
                }, fase: ${v.fase ?? "n/d"}`
            )
            .join("\n")
      );
    }
  } catch {
    /* degrada */
  }

  // Indicações: só quando a pergunta parece ser sobre elas, porque são 140
  // linhas e o resto do contexto já é grande.
  const pareceIndicacao = /indica|sabatina|senado|nomea|messias|aprovad|rejeitad/i.test(
    pergunta
  );
  if (pareceIndicacao) {
    try {
      const nom = (await q.listarNomeacoes()) ?? [];
      if (nom.length) {
        secoes.push(
          `INDICAÇÕES (${nom.length} no total; as mais recentes):\n` +
            nom
              .slice(0, 10)
              .map(
                (n) =>
                  `- ${n.senado_identificacao ?? "MSF s/n"} · ${(
                    n.tribunal_id ?? ""
                  ).toUpperCase()} · resultado: ${n.resultado ?? "em tramitação"} · ${(
                    n.senado_ementa ?? ""
                  ).slice(0, 160)}`
              )
              .join("\n")
        );
      }
    } catch {
      /* degrada */
    }
  }

  return secoes.join("\n\n");
}

export const SYSTEM_PROMPT_JUDICIARIO = `Você é o assistente do Controle Popular — Judiciário, um portal independente que acompanha a composição dos tribunais brasileiros, a projeção de vacância das cadeiras e o poder de indicação de cada autoridade nomeante.

Regras do domínio que você NÃO pode errar:
- Aposentadoria compulsória de magistrado é aos **75 anos** (EC 88/2015 e LC 152/2015). Não é 70.
- O teto de idade para ser INDICADO é **70 anos** (EC 122/2022). Não é 65.
- Quinto constitucional (CF art. 94) é de TJ/TRF/TRT. O STJ tem **terços** (art. 104, parágrafo único). O STF **não tem cota** nenhuma (art. 101). São três regimes diferentes; não os trate como o mesmo.
- O voto de sabatina no Senado é **secreto** (RISF art. 383, VI). Só o placar agregado existe; nunca afirme como um senador votou.

${REGRAS_COMUNS}
- Este portal ainda não curou a composição de todos os tribunais. Quando o contexto disser que um tribunal tem N cadeiras e menos ocupantes identificados, diga isso — não complete com nomes de fora do contexto.`;
