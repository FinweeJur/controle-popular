/**
 * Ponte entre o tema livre da biblioteca das ATIs (`biblioteca.ts`) e o
 * vocabulário controlado `TemaAjri` da auditoria AECOM (`auditoria-ajri.ts`).
 *
 * ═══ POR QUE ESTA PONTE NÃO EXISTIA ═══
 *
 * `relacionados.ts` deixou a biblioteca de fora explicitamente: "os temas
 * desses dois acervos são texto livre e não há slug estável para ligar — a
 * primeira fatia entrega o que tem chave estável; o resto fica para uma
 * fatia futura se a fonte ganhar tema estruturado". A fonte não ganhou tema
 * estruturado — a biblioteca continua sendo texto livre, 26 valores medidos
 * sobre os 597 itens de AEDAS/Guaicuy (únicas fontes que declaram tema; ver
 * `biblioteca.ts`). O que este arquivo entrega não é uma fonte estruturada
 * nova: é a TABELA de equivalência, escrita e revisada item a item — a chave
 * estável que faltava é esta tabela, não o dado de origem.
 *
 * ═══ A RÉGUA ═══
 *
 * Cada um dos 26 temas livres foi avaliado individualmente contra os 25
 * `TemaAjri`. Um tema livre só ganha um `TemaAjri` quando os dois descrevem
 * o MESMO EIXO TÉCNICO — nunca por aparecerem juntos com frequência ou por
 * "parecerem" relacionados. Isso é a mesma régua que `relacionados.ts` já
 * segue para ATI/IJ/imprensa: ligação por tema controlado, nunca por
 * proximidade de texto.
 *
 * Quinze dos 26 temas livres ficam DELIBERADAMENTE sem mapa (`[]`), em duas
 * categorias — o motivo específico de cada um está ao lado da entrada,
 * abaixo:
 *
 *  · **Categoria de POPULAÇÃO/RECORTE, não de assunto** — diz QUEM é o
 *    sujeito do documento (mulheres, população negra, crianças, PCTs...),
 *    não SOBRE O QUÊ ele fala. O mesmo documento marcado "Eixo Mulheres"
 *    pode tratar de saúde, indenização ou participação — mapear para um
 *    `TemaAjri` fixo inventaria um assunto que o rótulo não declara.
 *
 *  · **Referência a CLÁUSULA do Acordo, a outro processo, ou rótulo GENÉRICO
 *    DEMAIS** — cada um cobre um leque de assuntos técnicos ao mesmo tempo
 *    (ou nenhum eixo da AECOM: a perícia da UFMG é outra instituição, outro
 *    processo), então mapear para UM `TemaAjri` sobrestimaria a precisão que
 *    o rótulo livre tem.
 *
 * ═══ NÚMERO TRAVADO ═══
 *
 * `coberturaTemasAti()` mede, sobre o acervo publicado de verdade, quantos
 * itens ganham pelo menos um `TemaAjri` por esta tabela. Medido em
 * 2026-08-21: 238 dos 597 itens publicados (AEDAS + Guaicuy — as únicas
 * fontes com tema livre no acervo hoje). `temas-ati.test.ts` trava esse
 * número: se uma regra nova nesta tabela fizer ele saltar, é sinal de que a
 * régua passou a mapear o que não devia — mudar o número travado exige
 * decisão deliberada no teste, não só rodar de novo.
 *
 * ═══ O NACAB NÃO ESTÁ NO DENOMINADOR ═══
 *
 * `scripts/coletar-biblioteca-nacab.mts` (mesma sessão) tentou acrescentar
 * os 48 itens do NACAB a `biblioteca-ati.json`, mas foi revertido: a fonte
 * do NACAB não tem página própria por publicação, só um link direto para o
 * PDF — o que quebra a regra "nunca o arquivo" que `biblioteca.test.ts`
 * trava para o acervo. Este mapa de temas não depende disso (o NACAB não
 * declara tema por item de qualquer forma; entraria com `temas: []` e não
 * mudaria o numerador), então a tabela e a função aqui já valem para quando
 * o NACAB entrar pela via certa — só o denominador de `coberturaTemasAti()`
 * muda nesse dia, de 597 para 645.
 */
import type { TemaAjri } from "./auditoria-ajri";
import { bibliotecaAti, type ItemBiblioteca } from "./biblioteca";

/**
 * Tabela de equivalência, tema livre da biblioteca → `TemaAjri`. `[]` é uma
 * DECISÃO, não uma lacuna esquecida — ver o motivo ao lado de cada entrada.
 * As chaves são o texto exato observado em `ItemBiblioteca.temas` — 26
 * valores, medidos em 2026-08-21.
 */
export const MAPA_TEMA_ATI_PARA_AJRI: Record<string, TemaAjri[]> = {
  // ═══ mapeados — o tema livre e o eixo técnico são o mesmo assunto ═══

  "Participação Informada": ["comunicacao-e-relacionamento"],
  // canal/processo de informar as pessoas atingidas ~ comunicação e relacionamento com atingidos.

  "Espaços Participativos": ["comunicacao-e-relacionamento"],
  // mesmo eixo de "Participação Informada": espaço/canal de participação, não um assunto à parte.

  "ANEXO I.2 e Auxílio Emergencial": ["programas-de-compensacao"],
  // Auxílio Emergencial é pagamento direto às famílias — o mesmo assunto que `relacionados.ts`
  // já liga a `programas-de-compensacao` (ij: indenizacao/ptr_auxilio; tags: auxílio, pagamento).

  "Auxílio Emergencial": ["programas-de-compensacao"],
  // mesma razão do item acima, sem o prefixo do anexo.

  "Liquidação Coletiva e Indenização": ["programas-de-compensacao"],
  // indenização — mesmo eixo de pagamento/compensação que "Auxílio Emergencial".

  "Indenizações e Transparência": ["programas-de-compensacao"],
  // idem: o núcleo do rótulo é indenização.

  "Demandas Emergenciais": ["frentes-emergenciais"],
  // "demanda emergencial" da comunidade e "frente emergencial" da AECOM descrevem a mesma
  // resposta de curto prazo ao rompimento.

  "Saúde e ERSHRE": ["risco-saude-publica"],
  // ERSHRE é o próprio nome do estudo que `risco-saude-publica` audita (ver sintese-ajri.ts,
  // eixo "Saúde humana e risco ecológico").

  "Saúde": ["risco-saude-publica"],
  // mesmo eixo, sem o sufixo do estudo.

  "Socioambiental Paraopeba": ["plano-de-reparacao"],
  // MENOS CERTO que os anteriores — é o rótulo mais genérico do acervo (103 itens, o mais
  // frequente). Mapeado para `plano-de-reparacao` por ser o eixo mais abrangente do lado
  // AJRI (o plano cobre o conjunto da reparação socioambiental), não por casar um assunto
  // técnico específico. Sinalizado aqui para quem revisar não tratar como certeza.

  "Reparação Integral": ["plano-de-reparacao"],
  // "Reparação Integral" é o nome do próprio Acordo (Acordo Judicial de Reparação Integral) —
  // mesmo relaxamento de "Socioambiental Paraopeba": mapeia para o eixo mais abrangente do
  // lado AJRI, não para um assunto técnico específico.

  // ═══ sem mapa — categoria de POPULAÇÃO, não de assunto ═══
  // (o mesmo documento pode tratar de qualquer eixo técnico; o rótulo diz QUEM, não SOBRE O QUÊ)

  "Povos e Comunidades Tradicionais": [],
  "Diversidade e Inclusão": [],
  "Marcadores Socias da Diferença": [],
  "Familiares de Vítimas Fatais": [],
  "Pessoas Com Deficiência": [],
  "Eixo Mulheres": [],
  "População Negra": [],
  "Crianças e Adolescentes": [],

  // ═══ sem mapa — cláusula do Acordo, outro processo, ou rótulo genérico demais ═══

  "Anexo I.1": [],
  // referência à cláusula do Acordo (governança do Anexo 1.1), não a um eixo temático — o
  // mesmo documento pode tratar de qualquer assunto sob esse guarda-chuva contratual.

  "ANEXO I.3 e I.4": [],
  // financia projetos heterogêneos de fortalecimento de serviço público nos 25 municípios
  // (saúde, educação, saneamento...) — não há um único eixo técnico comum, diferente do
  // Anexo I.2 (que é só auxílio emergencial, um assunto só).

  "Gestão": [],
  // rótulo administrativo genérico demais — pode ser gestão de qualquer processo.

  "Projetos Comunitários": [],
  // mesmo problema de "ANEXO I.3 e I.4": financiamento que pode cobrir qualquer eixo técnico.

  "Conquistas das Pessoas Atingidas": [],
  // rótulo narrativo ("uma vitória aconteceu"), não um assunto — pode ser sobre qualquer eixo.

  "Estudos e Perícias UFMG": [],
  // é a perícia judicial do CTC/UFMG — outra instituição, outro processo. `TemaAjri` modela
  // só a auditoria AECOM; misturar os dois seria a mesma confusão entre acervo AECOM e
  // resultado da perícia que `apps/web/AGENTS.md` já veta.

  "Ciranda": [],
  // nome de programa/projeto próprio, sem taxonomia declarada pela fonte — não há como saber
  // o que ele cobre sem chutar.
};

/**
 * `TemaAjri`s do item, deduplicados, na ordem em que aparecem em `item.temas`. Tema livre
 * fora de `MAPA_TEMA_ATI_PARA_AJRI` (nenhum hoje, mas a fonte pode publicar um novo) conta
 * como sem mapa — nunca lança erro, porque um dado que o portal não controla não pode
 * derrubar o build.
 */
export function temasAjriDoItemBiblioteca(item: Pick<ItemBiblioteca, "temas">): TemaAjri[] {
  const vistos = new Set<TemaAjri>();
  const resultado: TemaAjri[] = [];
  for (const temaLivre of item.temas) {
    for (const temaAjri of MAPA_TEMA_ATI_PARA_AJRI[temaLivre] ?? []) {
      if (!vistos.has(temaAjri)) {
        vistos.add(temaAjri);
        resultado.push(temaAjri);
      }
    }
  }
  return resultado;
}

/**
 * Quantos itens do acervo (de todas as ATIs) ganham pelo menos um `TemaAjri` por esta
 * tabela, contra o total publicado. Número travado em `temas-ati.test.ts` — ver cabeçalho.
 */
export async function coberturaTemasAti(): Promise<{ comTemaAjri: number; total: number }> {
  const itens = await bibliotecaAti();
  const comTemaAjri = itens.filter((i) => temasAjriDoItemBiblioteca(i).length > 0).length;
  return { comTemaAjri, total: itens.length };
}
