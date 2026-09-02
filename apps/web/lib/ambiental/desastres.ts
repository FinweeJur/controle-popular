/**
 * Biblioteca unificada de documentos dos desastres de Mariana e Brumadinho.
 *
 * ═══ O QUE É ESTE ACERVO ═══
 *
 * Metadado + link de documentos publicados por órgãos federais, estaduais
 * (MG, ES), instituições de justiça, ATIs e imprensa — sobre os dois
 * desastres de barragens de rejeitos. Mesma regra da biblioteca das ATIs
 * (`lib/paraopeba/biblioteca.ts`): **nunca o arquivo**, só a página do item
 * na fonte (Lei 9.610/98 — sem licença declarada é direitos reservados).
 *
 * O dado é gerado por `scripts/agregar-biblioteca-desastres.mts`, que funde
 * o acervo das ATIs (`biblioteca-ati.json`) com os arquivos por fonte em
 * `etl/betim/dados/desastres/*.json` e grava
 * `apps/web/public/data/biblioteca-desastres.json` (lido pelo cliente via
 * fetch de asset) + `lib/ambiental/desastres-cobertura.ts` (lido pelo
 * servidor). A régua de dado pessoal é aplicada **no agregador**, por
 * `triagem.ts::ehItemBloqueado` — o cliente recebe só o que passou.
 *
 * ═══ MARIANA NÃO É BRUMADINHO ═══
 *
 * São dois desastres diferentes — responsáveis, acordos, bacias e processos
 * distintos. Por isso `desastre` é campo obrigatório de todo item, nenhum
 * agregado mistura os dois sem rótulo, e o filtro por desastre abre a tela
 * com o caso em foco (ver o componente cliente).
 */

import { semAcento } from "@/lib/busca/normalizar";

export type Desastre = "mariana" | "brumadinho";
export type EsferaDesastre = "federal" | "estadual" | "justica" | "ati" | "imprensa";

export interface ItemDesastre {
  /** `fonteId:slug` — único no acervo inteiro. */
  id: string;
  desastre: Desastre;
  bacia: "doce" | "paraopeba";
  titulo: string;
  /** ISO `yyyy-mm-dd`; `null` quando a fonte não publicou data. */
  data: string | null;
  /**
   * Formato do material com vocabulário finito (filtra a tela sem expor o
   * léxico cru de cada fonte). Para o acervo das ATIs é a macro-categoria.
   */
  tipo: string;
  /** Rótulo cru que a própria fonte deu ao tipo — fidelidade, não filtro. */
  tipoOrigem?: string;
  /** Nome curto do órgão/instituição que publicou. */
  orgao: string;
  esfera: EsferaDesastre;
  uf: "MG" | "ES" | "BA" | "BR";
  /** Tags de assunto — filtro e busca. */
  tags: string[];
  /**
   * Descrição publicada pela PRÓPRIA fonte (metadescription/excerpt). `null`
   * quando a fonte não publica uma — escrever aqui seria o portal resumindo
   * obra de terceiro e assinando embaixo.
   */
  resumo: string | null;
  /** Página do item na fonte — nunca o PDF. */
  url: string;
  /** Slug da fonte no `REGISTRY_FONTES`. */
  fonteId: string;
  coletadoEm: string;
}

export interface FonteDesastre {
  id: string;
  nome: string;
  licenca: string;
  itens: number;
}

export interface BibliotecaDesastres {
  geradoEm: string;
  fontes: FonteDesastre[];
  /** O que o acervo sabe que NÃO cobre — exibido na tela, não só aqui. */
  ficouDeFora: string;
  itens: ItemDesastre[];
}

export const DESASTRE_LABEL: Record<Desastre, string> = {
  mariana: "Mariana (2015)",
  brumadinho: "Brumadinho (2019)",
};

export const ESFERA_LABEL: Record<EsferaDesastre, string> = {
  federal: "Federal",
  estadual: "Estadual",
  justica: "Justiça",
  ati: "Assessoria técnica",
  imprensa: "Imprensa",
};

/** Rótulo curto por desastre para o selo colado em cada item. */
export const DESASTRE_SELO: Record<Desastre, string> = {
  mariana: "Mariana",
  brumadinho: "Brumadinho",
};

function contar<T extends string>(valores: T[]): { valor: T; count: number }[] {
  const mapa = new Map<T, number>();
  for (const v of valores) mapa.set(v, (mapa.get(v) ?? 0) + 1);
  return [...mapa.entries()].map(([valor, count]) => ({ valor, count })).sort((a, b) => b.count - a.count);
}

/** Distribuição de um campo categórico, em ordem de frequência medida. */
export function distribuicaoPor<K extends keyof ItemDesastre>(
  itens: ItemDesastre[],
  campo: K
): { valor: ItemDesastre[K] & string; count: number }[] {
  const valores = itens.map((i) => String(i[campo]) as ItemDesastre[K] & string);
  return contar(valores);
}

/** Distribuição por ano, a partir da data ISO do item. Itens sem data ficam fora e contados. */
export function distribuicaoPorAno(itens: ItemDesastre[]): { ano: number; total: number; semData: number }[] {
  const mapa = new Map<number, number>();
  let semData = 0;
  for (const i of itens) {
    if (!i.data) {
      semData += 1;
      continue;
    }
    const ano = Number(i.data.slice(0, 4));
    if (Number.isFinite(ano)) mapa.set(ano, (mapa.get(ano) ?? 0) + 1);
  }
  const serie = [...mapa.entries()].map(([ano, total]) => ({ ano, total, semData: 0 })).sort((a, b) => a.ano - b.ano);
  if (semData > 0) serie.push({ ano: 0, total: semData, semData });
  return serie;
}

export interface FiltroDesastres {
  busca: string;
  desastres: Set<Desastre>;
  esferas: Set<EsferaDesastre>;
  orgao: string;
  tipo: string;
  ano: string;
  uf: string;
  tag: string;
  de: string;
  ate: string;
}

/** Filtro puro e testável — mesmo contrato que o cliente usa no `useMemo`. */
export function filtrarItens(itens: ItemDesastre[], f: FiltroDesastres): ItemDesastre[] {
  const termo = semAcento(f.busca.trim());
  return itens.filter((i) => {
    if (f.desastres.size > 0 && !f.desastres.has(i.desastre)) return false;
    if (f.esferas.size > 0 && !f.esferas.has(i.esfera)) return false;
    if (f.orgao !== "todos" && i.orgao !== f.orgao) return false;
    if (f.tipo !== "todos" && i.tipo !== f.tipo) return false;
    if (f.uf !== "todos" && i.uf !== f.uf) return false;
    if (f.tag !== "todos" && !i.tags.includes(f.tag)) return false;
    if (f.ano !== "todos") {
      const anoItem = i.data ? i.data.slice(0, 4) : "";
      if (anoItem !== f.ano) return false;
    }
    // Item sem data não some num filtro de período: "não sei quando" não é
    // "fora do intervalo". Ele só é excluído se a data existir e estiver fora.
    if (i.data && f.de && i.data < f.de) return false;
    if (i.data && f.ate && i.data > f.ate) return false;
    if (!termo) return true;
    const alvo = semAcento(
      [i.titulo, i.tipo, i.tipoOrigem ?? "", i.orgao, i.uf, i.resumo ?? "", ...i.tags].join(" ")
    );
    return alvo.includes(termo);
  });
}
