/**
 * Comparador de cidades — a lógica pura do "duas cidades lado a lado".
 *
 * ═══ O QUE É ═══
 *
 * Recebe dois municípios do acervo do portal e devolve as linhas de comparação:
 * população, PIB, PIB por habitante, repasses federais (total e por habitante),
 * saúde e escolas (total e por 10 mil habitantes). A tabela é montada no
 * navegador; nada é consultado na rede.
 *
 * ═══ POR QUE NORMALIZAR POR HABITANTE ═══
 *
 * Cidade maior tem mais de tudo — comparar números absolutos engana. O valor
 * por habitante (per capita) é o que põe as duas na mesma régua. Mesmo assim,
 * a tela nunca diz "melhor cidade": ela mostra o número e o leitor conclui.
 * É a régua editorial do portal — dois dados verdadeiros não devem empurrar
 * uma terceira conclusão.
 *
 * ═══ FONTE ═══
 *
 * Os valores vêm do acervo `cidades-dados-completos.json` (IBGE e fontes
 * oficiais), com data de geração. A data viaja colada ao número na tela.
 */

export interface CidadeComparavel {
  id: string;
  nome: string;
  uf: string;
  regiao: string;
  tipo: string;
  populacao: number;
  /** PIB mais recente, em R$ bilhões. */
  pibBi: number;
  /** PIB por habitante, em reais. */
  pibPerCapita: number;
  /** Repasses federais anuais, em R$ milhões. */
  repassesMi: number;
  saude: number;
  escolas: number;
  slug?: string;
}

export type FormatoIndicador = "inteiro" | "decimal" | "moeda";

export interface IndicadorComparacao {
  id: string;
  rotulo: string;
  ajuda: string;
  formato: FormatoIndicador;
  valor: (c: CidadeComparavel) => number | null;
  /** Maior valor recebe realce. Não é julgamento de mérito. */
  maiorMelhor: boolean;
}

/** Repasse federal por habitante (converte R$ milhões para reais). */
export function repassesPerCapita(c: CidadeComparavel): number | null {
  if (!c.populacao || c.populacao <= 0) return null;
  return (c.repassesMi * 1_000_000) / c.populacao;
}

/** Estabelecimentos de saúde por 10 mil habitantes. */
export function saudePor10Mil(c: CidadeComparavel): number | null {
  if (!c.populacao || c.populacao <= 0) return null;
  return (c.saude / c.populacao) * 10_000;
}

/** Escolas por 10 mil habitantes. */
export function escolasPor10Mil(c: CidadeComparavel): number | null {
  if (!c.populacao || c.populacao <= 0) return null;
  return (c.escolas / c.populacao) * 10_000;
}

/** Indicadores exibidos, na ordem da tabela. */
export const INDICADORES_COMPARACAO: IndicadorComparacao[] = [
  {
    id: "populacao",
    rotulo: "População (habitantes)",
    ajuda: "Quantas pessoas moram no município.",
    formato: "inteiro",
    valor: (c) => c.populacao,
    maiorMelhor: true,
  },
  {
    id: "pib",
    rotulo: "PIB (R$ bilhões)",
    ajuda: "Produto Interno Bruto mais recente do acervo.",
    formato: "decimal",
    valor: (c) => c.pibBi,
    maiorMelhor: true,
  },
  {
    id: "pib-per-capita",
    rotulo: "PIB por habitante (R$)",
    ajuda: "PIB dividido pela população — põe cidades de tamanhos diferentes na mesma régua.",
    formato: "moeda",
    valor: (c) => c.pibPerCapita,
    maiorMelhor: true,
  },
  {
    id: "repasses",
    rotulo: "Repasses federais por ano (R$ milhões)",
    ajuda: "Transferências da União ao município no ano.",
    formato: "decimal",
    valor: (c) => c.repassesMi,
    maiorMelhor: true,
  },
  {
    id: "repasses-per-capita",
    rotulo: "Repasses federais por habitante (R$)",
    ajuda: "O repasse federal dividido pela população.",
    formato: "moeda",
    valor: (c) => repassesPerCapita(c),
    maiorMelhor: true,
  },
  {
    id: "saude",
    rotulo: "Estabelecimentos de saúde",
    ajuda: "Unidades de saúde registradas no município.",
    formato: "inteiro",
    valor: (c) => c.saude,
    maiorMelhor: true,
  },
  {
    id: "saude-10mil",
    rotulo: "Estabelecimentos de saúde por 10 mil habitantes",
    ajuda: "Densidade de unidades de saúde na população.",
    formato: "decimal",
    valor: (c) => saudePor10Mil(c),
    maiorMelhor: true,
  },
  {
    id: "escolas",
    rotulo: "Escolas",
    ajuda: "Escolas registradas no município.",
    formato: "inteiro",
    valor: (c) => c.escolas,
    maiorMelhor: true,
  },
  {
    id: "escolas-10mil",
    rotulo: "Escolas por 10 mil habitantes",
    ajuda: "Densidade de escolas na população.",
    formato: "decimal",
    valor: (c) => escolasPor10Mil(c),
    maiorMelhor: true,
  },
];

/** Formata um valor no padrão brasileiro, conforme o tipo do indicador. */
export function formatarIndicador(valor: number | null, formato: FormatoIndicador): string {
  if (valor === null || !Number.isFinite(valor)) return "—";
  if (formato === "moeda") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  }
  if (formato === "inteiro") {
    return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(valor);
  }
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

export interface LinhaComparacao {
  id: string;
  rotulo: string;
  ajuda: string;
  textoA: string;
  textoB: string;
  /** Diferença absoluta, já formatada; "—" quando não dá para comparar. */
  diferenca: string;
  /** Qual lado tem o maior valor (só para realce visual). */
  maior: "A" | "B" | null;
}

/**
 * Texto-resumo de uma cidade, pronto para compartilhar (WhatsApp, e-mail).
 *
 * Junta os números principais num parágrafo curto com a fonte e a data. É o
 * "cartão" da cidade: fácil de copiar sem cadastro e sem imagem, com a régua
 * editorial do portal — o número vem do dado e a fonte viaja colada.
 */
export function resumoTexto(c: CidadeComparavel, dataAcervo: string | null): string {
  const linhas = [
    `${c.nome}/${c.uf} em números`,
    "",
    `População: ${formatarIndicador(c.populacao, "inteiro")} habitantes`,
    `PIB: R$ ${formatarIndicador(c.pibBi, "decimal")} bilhões`,
    `PIB por habitante: ${formatarIndicador(c.pibPerCapita, "moeda")}`,
    `Repasses federais por ano: R$ ${formatarIndicador(c.repassesMi, "decimal")} milhões`,
    `Repasses federais por habitante: ${formatarIndicador(repassesPerCapita(c), "moeda")}`,
    `Estabelecimentos de saúde: ${formatarIndicador(c.saude, "inteiro")}`,
    `Escolas: ${formatarIndicador(c.escolas, "inteiro")}`,
    "",
    `Fonte: acervo de cidades do Controle Popular (IBGE e fontes oficiais)${
      dataAcervo ? `, ${dataAcervo}` : ""
    }.`,
    `Confira a fonte de cada número em https://www.controlepopular.com.br/${
      c.slug ?? `terra-e-territorios/cidades/${c.id}`
    }`,
  ];
  return linhas.join("\n");
}

/** Monta as linhas de comparação entre duas cidades. */
export function compararCidades(a: CidadeComparavel, b: CidadeComparavel): LinhaComparacao[] {
  return INDICADORES_COMPARACAO.map((ind) => {
    const va = ind.valor(a);
    const vb = ind.valor(b);
    const maior = va === null || vb === null || va === vb ? null : va > vb ? "A" : "B";
    const diferenca =
      va === null || vb === null ? "—" : formatarIndicador(Math.abs(va - vb), ind.formato);
    return {
      id: ind.id,
      rotulo: ind.rotulo,
      ajuda: ind.ajuda,
      textoA: formatarIndicador(va, ind.formato),
      textoB: formatarIndicador(vb, ind.formato),
      diferenca,
      maior,
    };
  });
}
