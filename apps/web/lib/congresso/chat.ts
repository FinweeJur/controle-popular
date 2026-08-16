import { agenda, autoriaDeProposicoes, coberturaAnalise, proposicoesRelevantes } from "@/lib/db/queries/congresso";
import { REGRAS_COMUNS } from "@/lib/chat-comum";

/**
 * Recuperação de contexto do assistente do /congresso.
 *
 * Mesma abordagem do /cidades (`lib/betim/chat.ts`): busca por palavra-chave
 * nas tabelas de maior valor, sem embeddings. Não é preguiça — pgvector
 * exigiria um pipeline de indexação e um modelo de embedding, e a pergunta
 * real do usuário deste eixo é lexical ("marco temporal", "PL 3611",
 * "trabalho intermitente"). O `ilike` já responde isso.
 *
 * O QUE ENTRA NO CONTEXTO, e por quê:
 *  - **cobertura da análise** sempre, para o modelo poder dizer "só 12% foi
 *    analisado" em vez de afirmar que algo não existe. A ausência de um PL
 *    nesta base não é atestado de nada, e o assistente não pode sugerir que
 *    seja — é a mesma ressalva que as páginas de alerta imprimem.
 *  - **autoria** junto de cada proposição. Sem ela o modelo responderia "há
 *    um projeto que restringe X" sem dizer de quem, que é justamente a
 *    informação que faz alguém agir.
 *  - **rótulo e dispositivo** da análise, nunca o score sozinho: score não é
 *    comparável entre modelos (medido: −6,00 no 8B contra −1,80 no Sonnet no
 *    MESMO PL), então o número só aparece acompanhado do rótulo.
 *  - **agenda**, porque "quando isso vai ser votado" é pergunta frequente e
 *    a resposta tem data e hora exatas no banco.
 */

const LIMITE = 5;

const STOPWORDS = new Set([
  "a", "o", "os", "as", "de", "da", "do", "das", "dos", "e", "em", "no", "na",
  "nos", "nas", "um", "uma", "para", "pra", "por", "com", "que", "qual", "quais",
  "quanto", "quantos", "quem", "onde", "como", "sobre", "projeto", "projetos",
  "lei", "leis", "camara", "câmara", "congresso", "deputado", "deputados",
  "portal", "tem", "foi", "são", "é", "me", "diga", "mostre", "liste", "sobre",
]);

function termos(pergunta: string): string[] {
  return pergunta
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s/]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t))
    .slice(0, 4);
}

export async function montarContexto(pergunta: string): Promise<string> {
  const secoes: string[] = [];

  // Cobertura primeiro: é a moldura de honestidade de tudo o que vem depois.
  try {
    const c = await coberturaAnalise();
    if (c.total > 0) {
      const pct = Math.round((c.analisadas / c.total) * 100);
      secoes.push(
        `COBERTURA: o portal tem ${c.total.toLocaleString("pt-BR")} proposições federais sincronizadas, ` +
          `das quais ${c.analisadas.toLocaleString("pt-BR")} (${pct}%) já passaram pela análise de direitos. ` +
          `A fila é priorizada, então uma proposição ausente da análise pode simplesmente não ter chegado a vez dela.`
      );
    }
  } catch {
    /* degrada */
  }

  const ts = termos(pergunta);

  if (ts.length === 0) return secoes.join("\n\n");

  // Proposições por RELEVÂNCIA (full-text em português), não por data.
  //
  // Os termos passam pelo extrator ANTES do full-text, e isso é necessário
  // apesar de o dicionário português já ter stopwords: "projeto", "lei",
  // "câmara" e "deputado" não são stopwords do idioma, mas são ruído NESTE
  // domínio — aparecem em quase toda ementa. Sem tirá-los, "projetos sobre
  // trabalho escravo" pontuaria alto qualquer coisa que diga "projeto".
  try {
    const brutos = await proposicoesRelevantes(ts, LIMITE);

    // EXIGE COBERTURA DE TERMOS quando a pergunta tem mais de um.
    //
    // O `or` do full-text traz recall, e o preço é casar por um termo fraco
    // quando os fortes não existem no banco — medido: "mineração em área
    // indígena" devolvia radiodifusão do "Instituto Banco de Areia". Com 2+
    // termos de conteúdo, exigir que o documento case ao menos 2 esvazia o
    // contexto nesses casos, e contexto vazio faz o assistente dizer "não
    // encontrei isso no portal", que é a resposta certa. Um resultado
    // plausível e fora de assunto é pior que um "não sei".
    //
    // Com UM termo só não há o que exigir: casar esse termo é toda a
    // evidência disponível.
    const minimo = ts.length >= 2 ? 2 : 1;
    const relevantes = brutos.filter((p) => (p.termos_casados ?? 1) >= minimo);

    const achadas = new Map<string, { linha: string }>();
    for (const p of relevantes) {
      const rotulo = p.rotulo
        ? ` — classificada como ${p.rotulo.replace(/_/g, " ")}${
            p.score != null ? ` (score ${p.score})` : ""
          }`
        : " — ainda não analisada";
      achadas.set(p.id, {
        linha:
          `- ${p.identificacao}${rotulo}. Situação: ${p.situacao ?? "não registrada"}` +
          `${p.orgao_atual ? `, em ${p.orgao_atual}` : ""}. Ementa: ${(p.ementa ?? "").slice(0, 220)}`,
      });
    }

    const ids = [...achadas.keys()];
    if (ids.length) {
      let autoria = new Map<string, string>();
      try {
        const autorias = await autoriaDeProposicoes(ids);
        autoria = new Map(
          autorias.map((a) => [
            a.proposicao_id,
            a.autores
              .map((x) => x.nome + (x.partido ? ` (${x.partido}-${x.uf ?? ""})` : ""))
              .join(", ") +
              (a.total > a.autores.length
                ? ` e mais ${a.total - a.autores.length}`
                : ""),
          ])
        );
      } catch {
        /* degrada: contexto sem autoria */
      }

      secoes.push(
        "PROPOSIÇÕES RELACIONADAS:\n" +
          ids
            .map((id) => {
              const { linha } = achadas.get(id)!;
              const autores = autoria.get(id);
              return autores ? `${linha} Autoria: ${autores}.` : linha;
            })
            .join("\n")
      );
    }
  } catch {
    /* degrada */
  }

  // Agenda: só os próximos, que é o que a pergunta "quando" quer.
  try {
    const { proximos } = await agenda({ limite: 12 });
    // Casa também pela SIGLA DO ÓRGÃO, não só pela descrição: quem pergunta
    // "quando a CCJC se reúne" digita a sigla, e a sigla mora em `orgaos` —
    // a descrição do evento raramente a repete. Sem isto, a pergunta mais
    // óbvia sobre agenda caía no fallback genérico.
    const doTermo = proximos.filter((e) =>
      ts.some(
        (t) =>
          (e.descricao ?? "").toLowerCase().includes(t) ||
          (e.orgaos ?? []).some((s) => s.toLowerCase().includes(t))
      )
    );
    const casou = doTermo.length > 0;
    const lista = (casou ? doTermo : proximos).slice(0, 4);
    if (lista.length) {
      // O rótulo DIZ quando a lista não casou com a pergunta. Sem isso, quem
      // perguntasse "quando a CCJC se reúne" receberia quatro eventos de
      // outras comissões sob o título "agenda marcada", e o modelo poderia
      // apresentá-los como resposta. Em recesso isso é o caso comum: não há
      // reunião da CCJC marcada, e dizer isso é a resposta.
      secoes.push(
        (casou
          ? "AGENDA MARCADA (horário de Brasília):\n"
          : "AGENDA GERAL PRÓXIMA — nenhum evento futuro casa com os termos da pergunta; " +
            "estes são os próximos eventos de qualquer órgão (horário de Brasília):\n") +
          lista
            .map(
              (e) =>
                `- ${e.data_br} ${e.hora_br} · ${e.tipo} · ${(e.orgaos ?? []).join(", ")} · ${(
                  e.descricao ?? ""
                )
                  .split(/\r?\n/)[0]
                  .slice(0, 140)} (situação: ${e.situacao ?? "n/d"})`
            )
            .join("\n")
      );
    }
  } catch {
    /* degrada */
  }

  return secoes.join("\n\n");
}

export const SYSTEM_PROMPT_CONGRESSO = `Você é o assistente do Controle Popular — Congresso, um portal independente que monitora proposições legislativas FEDERAIS (Câmara dos Deputados e Senado) e classifica se elas ampliam ou restringem direitos, segundo uma régua declarada e auditável.

Contexto importante sobre este portal:
- A classificação NÃO é escrita por inteligência artificial. Um modelo extrai itens (direito afetado + dispositivo legal + direção + grau + trecho citado do projeto) e o rótulo e o score saem de cálculo determinístico sobre esses itens.
- O score NÃO é comparável entre proposições analisadas por modelos diferentes. Nunca compare scores; compare rótulos.
- A análise roda em fila priorizada. Ausência de uma proposição na análise não significa que ela seja inofensiva.

${REGRAS_COMUNS}
- Ao citar uma proposição, diga sempre a AUTORIA quando o contexto a trouxer: é o dado que permite a pessoa cobrar alguém.`;
