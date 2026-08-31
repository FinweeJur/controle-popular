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
 * Com a inferência por título (2026-08-31), o denominador passa a incluir o
 * NACAB: 645 itens. Os inferidos são rotulados separadamente (`temas_ajri_inferred`)
 * e NÃO entram no número travado de 238 — esse continua medindo só o que a
 * fonte declarou por tema livre.
 */
import type { TemaAjri } from "./auditoria-ajri";
import { bibliotecaAti, type ItemBiblioteca } from "./biblioteca";
import {
  MAPA_TEMA_ATI_PARA_AJRI as MAPA_BASE,
  temasAjriDoItemBiblioteca,
  temasAjriSaoInferidos,
} from "./temas-ati-utils";

export { temasAjriDoItemBiblioteca, temasAjriSaoInferidos };

/**
 * Tabela completa, incluindo os 15 temas deliberadamente sem mapa. Re-exporta
 * o mapa de `temas-ati-utils.ts` e acrescenta as entradas `[]` com a
 * justificativa de cada uma — a documentação vive aqui, o runtime em utils.
 */
export const MAPA_TEMA_ATI_PARA_AJRI: Record<string, TemaAjri[]> = {
  // ═══ mapeados — o tema livre e o eixo técnico são o mesmo assunto ═══

  ...MAPA_BASE,
  // canal/processo de informar as pessoas atingidas ~ comunicação e relacionamento com atingidos.
  // mesmo eixo de "Participação Informada": espaço/canal de participação, não um assunto à parte.
  // Auxílio Emergencial é pagamento direto às famílias — o mesmo assunto que `relacionados.ts`
  // já liga a `programas-de-compensacao`.
  // "demanda emergencial" da comunidade e "frente emergencial" da AECOM descrevem a mesma resposta.
  // ERSHRE é o próprio nome do estudo que `risco-saude-publica` audita.
  // MENOS CERTO — rótulo mais genérico do acervo; mapeado para o eixo mais abrangente.
  // "Reparação Integral" é o nome do próprio Acordo — mesmo relaxamento do item acima.

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
  // referência à cláusula do Acordo (governança do Anexo 1.1), não a um eixo temático.
  "ANEXO I.3 e I.4": [],
  // financia projetos heterogêneos — não há um único eixo técnico comum.
  "Gestão": [],
  // rótulo administrativo genérico demais.
  "Projetos Comunitários": [],
  // financiamento que pode cobrir qualquer eixo técnico.
  "Conquistas das Pessoas Atingidas": [],
  // rótulo narrativo, não um assunto.
  "Estudos e Perícias UFMG": [],
  // é a perícia judicial do CTC/UFMG — outra instituição, outro processo.
  "Ciranda": [],
  // nome de programa/projeto próprio, sem taxonomia declarada pela fonte.
};

/**
 * Quantos itens do acervo (de todas as ATIs) ganham pelo menos um `TemaAjri`
 * por esta tabela, contra o total publicado. Número travado em
 * `temas-ati.test.ts` — ver cabeçalho.
 */
export async function coberturaTemasAti(): Promise<{ comTemaAjri: number; total: number }> {
  const itens = await bibliotecaAti();
  const comTemaAjri = itens.filter((i) => temasAjriDoItemBiblioteca(i).length > 0).length;
  return { comTemaAjri, total: itens.length };
}
