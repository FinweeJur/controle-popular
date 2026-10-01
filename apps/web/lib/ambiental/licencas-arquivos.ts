/**
 * licencas-arquivos.ts — mapa dos acervos de licença/outorga por órgão e a
 * janela (nº de linhas) que cada um publica na página /ambiental/licencas.
 *
 * Por que existe: o acervo completo de cada órgão é grande (cetesb-sp passa
 * de 23 MB) e é lido no `next build` por `licencas-unificada.ts`. No Guara o
 * contexto de build tem teto de 256 MB, então o que vai no contexto é a
 * AMOSTRA versionada em `apps/web/data/amostras/` (mesmos metadados, só as
 * primeiras N linhas — exatamente o que a página mostra). Este módulo é a
 * única fonte da janela de cada arquivo, usada pelo leitor e pelo gerador
 * das amostras (`scripts/gerar-amostras-licencas.mts`): mudou a janela aqui,
 * muda nos dois lugares.
 *
 * Fonte dos dados: coletores estaduais/federais da Onda 1 e Onda 2
 * (`scripts/rotina-ambiental.mts`, ver docs/06-fontes/FONTES.md).
 */

/** nome do arquivo em data/ → nº máximo de linhas que a página recebe. */
export const ARQUIVOS_LICENCAS: Record<string, number> = {
  // Onda 1 — formato bruto (janela 500; ANA usa 1000 por decisão da página)
  "ibama-licencas.json": 500,
  "ibama-autos-infracao.json": 500,
  "igam-outorgas.json": 500,
  "sema-mt-licencas.json": 500,
  "inema-ba-licencas.json": 500,
  "sema-ma-licencas.json": 500,
  "semas-pa-licencas.json": 500,
  "semad-go-licencas.json": 500,
  "ana-outorgas.json": 1000,
  // Onda 2 — formato normalizado (janela 300, "Rule 1": janela do cliente)
  "fepam-rs-licencas.json": 300,
  "semar-pi-licencas.json": 300,
  "imasul-ms-licencas.json": 300,
  "iema-es-licencas.json": 300,
  "sedam-ro-licencas.json": 300,
  "ibram-df-licencas.json": 300,
  "cetesb-sp-licencas.json": 300,
  "iat-pr-licencas.json": 300,
  "ima-sc-licencas.json": 300,
};

/** Janela de um arquivo; padrão 500 para arquivo fora do mapa. */
export function janelaDe(nome: string): number {
  return ARQUIVOS_LICENCAS[nome] ?? 500;
}
