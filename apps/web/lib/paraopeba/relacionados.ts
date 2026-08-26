import {
  type DocumentoAuditoriaAjri,
  type TemaAjri,
} from "./auditoria-ajri";
import { type NoticiaAti, type TemaAti } from "./clipping-ati";
import {
  type NoticiaInstituicaoJustica,
  type TemaClippingIj,
} from "./clipping-ij";
import { type NoticiaClipping } from "./clipping";
import { type EstudoPericiaComTema } from "./pericia-ufmg";

/**
 * Relacionados de uma ficha da auditoria AJRI — o fim da ficha aponta para
 * o que o portal já tem sobre o mesmo assunto, em vez de repetir.
 *
 * ═══ A RÉGUA, SEM MODELO ═══
 *
 * "Relacionado" é uma regra fixa e mensurável, não uma escolha de modelo:
 *
 * · outras fichas deste catálogo com pelo menos um `TemaAjri` em comum;
 * · notícias das ATIs, das instituições de justiça e da imprensa cujo tema
 *   (ATI/IJ) ou tag (imprensa) a PONTE liga aos temas da ficha;
 * · tudo dentro de `JANELA_RELACIONADOS_DIAS` (180) antes ou depois da
 *   publicação da ficha, no máximo `MAX_ITENS_POR_ACERVO` (3) de cada
 *   acervo, os mais próximos no tempo primeiro — determinístico,
 *   idempotente e travado por teste.
 *
 * A janela de 180 dias foi escolhida por medição sobre os quatro acervos
 * (15/08/2026): com 60 dias só 231 das 467 fichas têm algum relacionado;
 * com 365 a média passa do útil e vira ruído. O teto de 3 por acervo corta
 * a cauda: sem teto, uma ficha com 14 temas chegava a 73 relacionados e a
 * média global a 11,5 — um muro, não uma régua. Com a régua fechada, a
 * medição dá 100% de cobertura (467/467 fichas com ao menos um
 * relacionado), média de 5,6 por ficha e máximo de 12. Ver
 * `relacionados.test.ts`, que pinça esses números.
 *
 * ═══ O QUE ESTE MÓDULO NÃO FAZ ═══
 *
 * Não traz a biblioteca (`biblioteca.ts`) nem os autos do processo
 * (`documentos.ts`): os temas desses dois acervos são texto livre e não há
 * slug estável para ligar — ligar por palavra seria a régua que não é régua.
 * A primeira fatia entrega o que tem chave estável; o resto fica para uma
 * fatia futura se a fonte ganhar tema estruturado.
 *
 * ═══ A PERÍCIA DA UFMG ENTROU — E SEM A JANELA DE 180 DIAS ═══
 *
 * `estudosPericia` é a segunda fatia: o acervo da perícia ganhou tema
 * estruturado em `temas-acervo.ts` e passou a ligar. Mas ele liga POR TEMA
 * SÓ, sem janela de tempo, e a diferença é deliberada.
 *
 * A janela existe para notícia: um clipping de seis meses antes ainda fala do
 * momento da ficha; um de dois anos, não. Estudo de perícia não é notícia. Os
 * 7 documentos de resultado saíram todos de uma vez (nov/2025) e são
 * referência permanente sobre o eixo, não registro de um momento. Com janela,
 * uma ficha de 2021 sobre qualidade da água não veria o estudo que mede
 * exatamente aquilo — o que seria perder a ligação mais útil da página por
 * fidelidade a uma régua feita para outro acervo.
 *
 * O teto de `MAX_ITENS_POR_ACERVO` continua valendo: são 21 documentos com
 * tema no acervo inteiro (de 445), então o teto raramente morde, mas ele
 * impede que um eixo denso vire lista.
 */

/** Janela de tempo, em dias, para um item contar como relacionado. */
export const JANELA_RELACIONADOS_DIAS = 180;

/** Teto de itens por acervo (fichas do catálogo, ATI, IJ, imprensa) — os
 *  mais próximos no tempo vencem. Temas densos (qualidade da água: 229
 *  fichas) e o clipping de imprensa (149 itens) passariam do útil sem isso. */
export const MAX_ITENS_POR_ACERVO = 3;

/**
 * A PONTE: para cada `TemaAjri`, quais temas de ATI, temas de instituição de
 * justiça e tags da imprensa tratam do mesmo assunto. As chaves de ATI e IJ
 * são os slugs reais dos acervos; as tags são o texto real das notícias da
 * imprensa (comparação em minúsculas, sem acento sensível a caixa).
 */
const PONTE: Record<TemaAjri, { ati: TemaAti[]; ij: TemaClippingIj[]; tags: string[] }> = {
  "qualidade-da-agua": { ati: ["ambiental"], ij: [], tags: [] },
  "plano-de-reparacao": { ati: [], ij: ["acordo"], tags: ["reparação"] },
  "licenciamento-ambiental": { ati: ["ambiental"], ij: [], tags: [] },
  "sistemas-de-contencao": { ati: ["ambiental"], ij: [], tags: [] },
  "solos-e-sedimentos": { ati: ["ambiental"], ij: [], tags: [] },
  "manejo-de-rejeitos": { ati: ["ambiental"], ij: [], tags: [] },
  fauna: { ati: ["ambiental"], ij: [], tags: [] },
  dragagem: { ati: ["ambiental"], ij: [], tags: [] },
  "comunicacao-e-relacionamento": { ati: ["participacao"], ij: ["consulta_popular"], tags: [] },
  flora: { ati: ["ambiental"], ij: [], tags: [] },
  "frentes-emergenciais": { ati: ["ambiental"], ij: [], tags: [] },
  "patrimonio-cultural": { ati: [], ij: [], tags: [] },
  "qualidade-do-ar": { ati: ["ambiental"], ij: [], tags: [] },
  "seguranca-das-estruturas-remanescentes": { ati: ["ambiental"], ij: [], tags: [] },
  "sistema-de-abastecimento-de-agua": { ati: ["ambiental"], ij: [], tags: [] },
  "seguranca-hidrica": { ati: ["ambiental"], ij: [], tags: [] },
  "risco-saude-publica": { ati: ["ershre"], ij: [], tags: [] },
  "agua-subterranea": { ati: ["ambiental"], ij: [], tags: [] },
  "risco-ecologico": { ati: ["ershre", "ambiental"], ij: [], tags: [] },
  "risco-meio-ambiente": { ati: ["ershre", "ambiental"], ij: [], tags: [] },
  "agua-potavel": { ati: ["ershre"], ij: [], tags: [] },
  "programas-de-compensacao": {
    ati: ["indenizacao"],
    ij: ["indenizacao", "ptr_auxilio"],
    tags: ["auxílio", "pnab", "pagamento"],
  },
  peabp: { ati: ["participacao"], ij: [], tags: [] },
  "seguranca-do-alimento": { ati: ["ershre"], ij: [], tags: [] },
  cronograma: { ati: [], ij: [], tags: [] },
};

/** Dias entre duas datas ISO, em valor absoluto (arredondado por cima para o
 *  dia seguinte não escapar da janela por uma hora de diferença). */
function diasEntre(a: string, b: string): number {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 86_400_000;
}

export interface RelacionadosFicha {
  /** Outras fichas deste catálogo com tema em comum, até `MAX_ITENS_POR_ACERVO`. */
  mesmosTemas: DocumentoAuditoriaAjri[];
  noticiasAti: NoticiaAti[];
  noticiasIj: NoticiaInstituicaoJustica[];
  noticiasImprensa: NoticiaClipping[];
  /** Estudos da perícia da UFMG sobre o mesmo eixo. Sem janela de tempo — ver
   *  o cabeçalho deste arquivo. */
  estudosPericia: EstudoPericiaComTema[];
}

export interface AcervosExtras {
  ati: NoticiaAti[];
  ij: NoticiaInstituicaoJustica[];
  imprensa: NoticiaClipping[];
  pericia: EstudoPericiaComTema[];
}

export function relacionadosDaFicha(
  doc: DocumentoAuditoriaAjri,
  acervo: DocumentoAuditoriaAjri[],
  acervos: AcervosExtras
): RelacionadosFicha {
  const pontes = doc.temas.map((t) => PONTE[t]);
  const temasAti = new Set(pontes.flatMap((p) => p.ati));
  const temasIj = new Set(pontes.flatMap((p) => p.ij));
  const tags = new Set(pontes.flatMap((p) => p.tags));

  const mesmosTemas = acervo
    .filter(
      (d) =>
        d.id !== doc.id &&
        d.temas.some((t) => doc.temas.includes(t)) &&
        diasEntre(d.data, doc.data) <= JANELA_RELACIONADOS_DIAS
    )
    .sort((a, b) => {
      const d = diasEntre(a.data, doc.data) - diasEntre(b.data, doc.data);
      if (d !== 0) return d;
      const data = b.data.localeCompare(a.data);
      if (data !== 0) return data;
      return a.id - b.id;
    })
    .slice(0, MAX_ITENS_POR_ACERVO);

  const sortNoticia = (a: { data: string }, b: { data: string }, referencia: string) => {
    const d = diasEntre(a.data, referencia) - diasEntre(b.data, referencia);
    if (d !== 0) return d;
    return b.data.localeCompare(a.data);
  };

  const noticiasAti = acervos.ati.filter(
    (n) => temasAti.has(n.tema) && diasEntre(n.data, doc.data) <= JANELA_RELACIONADOS_DIAS
  )
    .sort((a, b) => sortNoticia(a, b, doc.data))
    .slice(0, MAX_ITENS_POR_ACERVO);

  const noticiasIj = acervos.ij.filter(
    (n) => temasIj.has(n.tema) && diasEntre(n.data, doc.data) <= JANELA_RELACIONADOS_DIAS
  )
    .sort((a, b) => sortNoticia(a, b, doc.data))
    .slice(0, MAX_ITENS_POR_ACERVO);

  const noticiasImprensa = acervos.imprensa.filter(
    (n) =>
      n.tags.some((t) => tags.has(t.toLowerCase())) &&
      diasEntre(n.data, doc.data) <= JANELA_RELACIONADOS_DIAS
  )
    .sort((a, b) => sortNoticia(a, b, doc.data))
    .slice(0, MAX_ITENS_POR_ACERVO);

  // Sem `diasEntre`: estudo de perícia é referência sobre o eixo, não notícia
  // do momento da ficha.
  //
  // A ORDEM É O QUE FAZ O TETO DE 3 VALER A PENA. Dez documentos carregam
  // `plano-de-reparacao` (as 9 apresentações às partes mais o resumo dos
  // resultados) e só 3 cabem. Ordenar por nome fazia vencerem as atas de
  // reunião de 2020 — e o RESUMO DAS APRESENTAÇÕES DE RESULTADOS, que é a
  // peça mais útil do acervo inteiro, nunca aparecia. Resultado ganha de ata.
  const PESO_DA_SECAO: Record<string, number> = {
    apresentacao_de_resultados: 0,
    material_didatico: 1,
    subprojeto: 2,
    reuniao_com_partes: 3,
  };
  const estudosPericia = acervos.pericia.filter((e) =>
    e.temas.some((t) => doc.temas.includes(t)),
  )
    .slice()
    .sort((a, b) => {
      const peso = (PESO_DA_SECAO[a.secao] ?? 9) - (PESO_DA_SECAO[b.secao] ?? 9);
      if (peso !== 0) return peso;
      // Depois: mais recente primeiro (o `anoMes` é "AAAA-MM"; sem data vai
      // para o fim). Empate final pelo nome, para a lista não dançar.
      const data = (b.anoMes ?? "").localeCompare(a.anoMes ?? "");
      if (data !== 0) return data;
      return a.nomeArquivo.localeCompare(b.nomeArquivo);
    })
    .slice(0, MAX_ITENS_POR_ACERVO);

  return { mesmosTemas, noticiasAti, noticiasIj, noticiasImprensa, estudosPericia };
}