import dadosBcb from "@/data/series-economicas-bcb.json";

export interface PontoHistorico {
  data: string;
  valor: number;
}

export interface SerieEconomica {
  codigoSGS: number;
  nome: string;
  unidade: string;
  frequencia: string;
  ultimoValor: number;
  ultimaData: string;
  historico: PontoHistorico[];
}

export interface AcervoSeriesEconomicas {
  geradoEm: string;
  fonte: string;
  urlFonte: string;
  ressalvaEditorial: string;
  series: Record<string, SerieEconomica>;
}

export function obterSeriesEconomicas(): AcervoSeriesEconomicas {
  return dadosBcb as unknown as AcervoSeriesEconomicas;
}

/**
 * Gera arquivo CSV com BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula (;)
 * conforme padrão inegociável do AGENTS.md para compatibilidade direta no Excel brasileiro.
 */
export function exportarCsvSeries(
  chaveSerie: string,
  serie: SerieEconomica
): string {
  const BOM = "\uFEFF";
  const cabecalho = ["Data", "Valor", "Unidade", "Serie", "Codigo_SGS"].join(";");
  const linhas = serie.historico.map((p) => {
    const valorFmt = p.valor.toString().replace(".", ",");
    return [`"${p.data}"`, `"${valorFmt}"`, `"${serie.unidade}"`, `"${serie.nome}"`, `"${serie.codigoSGS}"`].join(";");
  });
  return BOM + [cabecalho, ...linhas].join("\r\n");
}
