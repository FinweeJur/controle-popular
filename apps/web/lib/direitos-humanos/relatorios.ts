import dadosRelatorios from "@/data/relatorios-direitos-humanos.json";

export interface RelatorioDireitosHumanos {
  id: string;
  titulo: string;
  orgao: "CIDH (OEA)" | "REDESCA (OEA)" | "ONU (ACNUDH)" | "CNDH (Brasil)" | "MNPCT (Brasil)" | string;
  esfera: "internacional" | "regional_interamericana" | "nacional" | string;
  tema:
    | "pidesca_socioambiental"
    | "povos_indigenas"
    | "quilombolas_afrodescendentes"
    | "combate_tortura_carcere"
    | "defensores_direitos_humanos"
    | "mineracao_barragens"
    | string;
  ano: number;
  paises: string[];
  estados: string[];
  municipios: string[];
  resumoCidadao: string;
  recomendacoesChave: string[];
  linkOficial: string;
  arquivoLocal: string;
  tamanhoKb?: number;
}

export const RELATORIOS_DIREITOS_HUMANOS: RelatorioDireitosHumanos[] =
  dadosRelatorios as RelatorioDireitosHumanos[];

/**
 * Retorna todos os relatórios catalogados.
 */
export function listarRelatorios(): RelatorioDireitosHumanos[] {
  return RELATORIOS_DIREITOS_HUMANOS;
}

/**
 * Retorna um relatório pelo ID.
 */
export function obterRelatorio(id: string): RelatorioDireitosHumanos | undefined {
  return RELATORIOS_DIREITOS_HUMANOS.find((r) => r.id === id);
}

/**
 * Filtra relatórios por município (case-insensitive).
 */
export function relatoriosPorMunicipio(nomeMunicipio: string): RelatorioDireitosHumanos[] {
  const norm = nomeMunicipio.trim().toLowerCase();
  return RELATORIOS_DIREITOS_HUMANOS.filter((r) =>
    r.municipios.some((m) => m.toLowerCase().includes(norm) || norm.includes(m.toLowerCase()))
  );
}

/**
 * Filtra relatórios por sigla de Estado (UF, ex: "MG", "SP", "RJ").
 */
export function relatoriosPorEstado(uf: string): RelatorioDireitosHumanos[] {
  const norm = uf.trim().toUpperCase();
  return RELATORIOS_DIREITOS_HUMANOS.filter((r) => r.estados.includes(norm));
}

/**
 * Filtra relatórios por tema.
 */
export function relatoriosPorTema(tema: string): RelatorioDireitosHumanos[] {
  return RELATORIOS_DIREITOS_HUMANOS.filter((r) => r.tema === tema);
}

/**
 * Filtra relatórios por órgão expedidor.
 */
export function relatoriosPorOrgao(orgao: string): RelatorioDireitosHumanos[] {
  return RELATORIOS_DIREITOS_HUMANOS.filter((r) => r.orgao.toLowerCase().includes(orgao.toLowerCase()));
}

/**
 * Agrupamento de contagem por tema.
 */
export function contagemPorTema(): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const r of RELATORIOS_DIREITOS_HUMANOS) {
    contagem[r.tema] = (contagem[r.tema] ?? 0) + 1;
  }
  return contagem;
}
