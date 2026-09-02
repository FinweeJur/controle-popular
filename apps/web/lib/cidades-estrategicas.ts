/**
 * A fila de expansão da frente Cidades — números MEDIDOS do arquivo gerado
 * `data/cidades-estrategicas.json` (gerado por
 * `scripts/gerar-cidades-estrategicas.cjs`), nunca digitados à mão.
 *
 * ⟲ 02/09/2026, auditoria dos 40 commits: o JSON existia desde 01/09 sem
 * nenhuma tela o ler — 199 cidades mapeadas com fonte de câmara e
 * prefeitura, invisíveis para quem navega. Este módulo é a ponte: quem
 * mostra a fila lê daqui, e quando o coletor rodar de novo os números
 * mudam sozinhos.
 *
 * Régua "lacuna é informação": quem usa este módulo TEM que dizer que a
 * fila não é cobertura — cidade mapeada sem tela é promessa de trabalho,
 * não dado disponível. E `ativo` no JSON marca só o que já tem portal
 * próprio NO MAPA DE EXPANSÃO (BH e SP); a contagem de telas vivas do
 * portal sai de `listarCidades()`, não daqui.
 */
import dados from "@/data/cidades-estrategicas.json";

const cidades = dados.cidades;

export const FILA_EXPANSAO = {
  /** Total de cidades mapeadas (27 capitais + 172 polos do interior). */
  total: dados.total,
  capitais: dados.por_tipo.capital,
  polos: dados.por_tipo["polo-interior"],
  /** Cidades com o sistema/host da câmara já identificado. */
  comCamaraMapeada: cidades.filter((c) => c.camara_host !== null).length,
  /** Cidades com portal de dados abertos da prefeitura identificado. */
  comDadosAbertos: cidades.filter((c) => c.prefeitura_dados_abertos_host !== null).length,
  geradoEm: dados.gerado_em,
  fonte: dados.fonte,
} as const;
