/**
 * Tipos, ordem canônica de status e exportação CSV dos acordos TAC.
 *
 * ⟲ 2026-08-25: os dados derivados (TAC_ACORDOS_PROJETOS, TAC_STATUS_POR_ORGAO,
 * TAC_ANO_ACORDOS, COBERTURA_TAC_ACORDOS) saíram daqui pelo teto de 3 MiB gzip
 * do Worker Free (erro 10027) — hoje vivem em etl/betim/dados/
 * tac-projetos-bundle.json, lidos em build por tac-projetos-dados.ts
 * (server-only) e buscados como asset public/data/tac-projetos.json pelo
  * cliente (PainelTac.tsx). Este módulo mantém tipos, STATUS_ORDEM e o CSV.
  */

/**
 * Contrato de TAC como consumido pelo PainelTac/CSV. NÃO estende
 * `ContratoTacAmbiental`: os campos de acompanhamento (`execucao`,
 * `transferido`, anos, relato) têm nullabilidade própria do JSON do
 * bundle, e o extends anterior conflitava (null vs undefined).
 */
export interface AcordoTacContrato {
  projeto: string;
  mineradora: string;
  orgao: string;
  status: string;
  execucao: string;
  previsto: number;
  executado: number;
  transferido?: number | null;
  anoInicial?: number | null;
  anoFinal?: number | null;
  relato?: string | null;
}

export const STATUS_ORDEM = ["Não Iniciado", "Em execução", "Concluído", "Cancelado"] as const;

export interface StatusPorOrgao {
  orgao: string;
  total: number;
  porStatus: Record<(typeof STATUS_ORDEM)[number], number>;
}

export interface AnoAcordo {
  ano: number;
  previsto: number;
  executado: number;
  transferido: number;
}

const ESCAPAR_CSV = (v: string | number | null): string => {
  const s = v === null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const NUMERO_CSV = (v: number): string => v.toFixed(2).replace(".", ",");

const CABECALHO_CSV = [
  "Projeto",
  "Mineradora",
  "Órgão",
  "Status",
  "Execução",
  "Previsto (R$)",
  "Executado (R$)",
  "Transferido (R$)",
  "Ano inicial",
  "Ano final",
  "Breve relato da situação (fonte)",
];

/**
 * CSV com separador `;` (Excel pt-BR) — sem BOM; quem chama (componente de
 * cliente) prefixa o BOM UTF-8 ao criar o `Blob`, porque BOM é decisão de
 * transporte/arquivo, não de conteúdo. Números usam vírgula decimal, sem
 * separador de milhar — é como o Excel pt-BR lê coluna numérica de CSV com
 * `;`.
 */
export function contratosParaCsv(linhas: readonly AcordoTacContrato[]): string {
  const corpo = linhas.map((l) =>
    [
      l.projeto,
      l.mineradora,
      l.orgao,
      l.status,
      l.execucao,
      NUMERO_CSV(l.previsto),
      NUMERO_CSV(l.executado),
      NUMERO_CSV(l.transferido ?? 0),
      l.anoInicial ?? "",
      l.anoFinal ?? "",
      l.relato ?? "",
    ]
      .map(ESCAPAR_CSV)
      .join(";"),
  );
  return [CABECALHO_CSV.join(";"), ...corpo].join("\r\n");
}
