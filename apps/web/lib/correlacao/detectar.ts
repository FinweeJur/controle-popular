export interface Cotacao {
  data: string;
  fechamento: number;
  abertura: number;
  maxima: number;
  minima: number;
  volume: number;
}

export interface Noticia {
  titulo: string;
  link: string;
  data: string | null;
  fonte: string;
  descricao: string;
}

export interface MovimentoSignificativo {
  data: string;
  fechamento: number;
  variacao: number;
  variacaoAbs: number;
  noticias: Noticia[];
}

export interface CorrelacaoConfig {
  limiarVariacao: number;
  janelaDias: number;
}

export const DEFAULT_CONFIG: CorrelacaoConfig = {
  limiarVariacao: 5,
  janelaDias: 3,
};

export function calcularVariacaoDiaria(
  cotacoes: Cotacao[]
): Array<{ data: string; variacao: number }> {
  const resultados: Array<{ data: string; variacao: number }> = [];
  for (let i = 1; i < cotacoes.length; i++) {
    const variacao =
      ((cotacoes[i].fechamento - cotacoes[i - 1].fechamento) /
        cotacoes[i - 1].fechamento) *
      100;
    resultados.push({ data: cotacoes[i].data, variacao });
  }
  return resultados;
}

export function detectarMovimentosSignificativos(
  cotacoes: Cotacao[],
  config?: Partial<CorrelacaoConfig>
): MovimentoSignificativo[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const variacoes = calcularVariacaoDiaria(cotacoes);
  return variacoes
    .filter((v) => Math.abs(v.variacao) >= cfg.limiarVariacao)
    .map((v) => {
      const cotacao = cotacoes.find((c) => c.data === v.data)!;
      return {
        data: v.data,
        fechamento: cotacao.fechamento,
        variacao: v.variacao,
        variacaoAbs: Math.abs(v.variacao),
        noticias: [],
      };
    });
}

export function correlacionarComNoticias(
  movimentos: MovimentoSignificativo[],
  noticias: Noticia[],
  cotacoes: Cotacao[],
  config?: Partial<CorrelacaoConfig>
): MovimentoSignificativo[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const datasNegociacao = cotacoes.map((c) => c.data);

  return movimentos.map((mov) => {
    const idxMov = datasNegociacao.indexOf(mov.data);
    if (idxMov === -1) return { ...mov, noticias: [] };

    const inicio = Math.max(0, idxMov - cfg.janelaDias);
    const fim = Math.min(datasNegociacao.length - 1, idxMov + cfg.janelaDias);
    const dataInicio = datasNegociacao[inicio];
    const dataFim = datasNegociacao[fim];

    const noticiasCorrelacionadas = noticias.filter((noticia) => {
      if (!noticia.data) return false;
      const dataNoticia = noticia.data.split("T")[0];
      return dataNoticia >= dataInicio && dataNoticia <= dataFim;
    });

    return { ...mov, noticias: noticiasCorrelacionadas };
  });
}
