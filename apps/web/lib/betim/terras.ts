import { vazioPorMunicipio } from "@/lib/db/queries/terras";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
// Reexportado para não quebrar quem já importava daqui. A constante MUDOU DE
// CASA (ver o cabeçalho de `taxa-erro-g0.ts`): este arquivo puxa as queries
// do banco, e `lib/zonas.ts` — que precisa do mesmo número e é lido por toda
// página do portal — não pode arrastar a camada de banco junto.
export { TAXA_ERRO_G0 } from "./taxa-erro-g0";

/**
 * Composição do rollup de Terras para a zona Cidades — Terras é SEÇÃO de
 * `app/[municipio]/terras`, não zona própria (decisão de 2026-08-08: ver
 * `Controle Popular — Plano 2026-08 (Executar).md` no vault).
 *
 * `RESUMO_METODO` é cópia editorial fixa da regra de cada método — a
 * mesma disciplina de `congresso/rubrica.ts`: o leitor não deve inferir o
 * que "vazio_cadastral" significa a partir do nome da coluna.
 */
export const RESUMO_METODO: Record<string, string> = {
  vazio_cadastral:
    "Área do município que nenhum imóvel rural declarou no Cadastro Ambiental Rural (CAR), depois de removidas as classes de uso que não admitem destinação fundiária. Denominador: área municipal total.",
  candidatos_bacia:
    "Área certificada como pública (INCRA/SIGEF/SNCI) que é pastagem persistente — mesma classe do MapBiomas em todos os anos de 2020 a 2024. Denominador: só a área pública certificada, não o município inteiro.",
};


export interface VazioMunicipioResumo {
  metodo: string;
  resumoMetodo: string;
  recorte: string;
  areaUniversoHa: number;
  areaCandidataHa: number;
  percentual: number;
  qtdPoligonos: number;
  proveniencia: string;
  metodoVersaoData: string;
}

/**
 * `null` = banco não configurado (mesmo sinal de sempre). Array vazio =
 * banco respondeu e este município não tem linha nenhuma ainda — a
 * página distingue os dois, nunca funde "sem dado" com "não sei".
 */
export async function vazioResumoPorMunicipio(
  idMunicipio: IdMunicipio
): Promise<VazioMunicipioResumo[] | null> {
  const linhas = await vazioPorMunicipio(idMunicipio);
  if (linhas === null) return null;
  return linhas.map((l) => ({
    metodo: l.metodo,
    resumoMetodo: RESUMO_METODO[l.metodo] ?? l.metodo,
    recorte: l.recorte,
    areaUniversoHa: Number(l.area_universo_ha),
    areaCandidataHa: Number(l.area_candidata_ha),
    percentual: Number(l.area_universo_ha) > 0
      ? (Number(l.area_candidata_ha) / Number(l.area_universo_ha)) * 100
      : 0,
    qtdPoligonos: l.qtd_poligonos,
    proveniencia: l.proveniencia,
    metodoVersaoData: l.metodo_versao_data,
  }));
}
