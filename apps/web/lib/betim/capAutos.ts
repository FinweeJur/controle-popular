import { CapAutoRecente, CapResumo, capAutosRecentes, capResumo } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import type { Cidade } from "@/lib/db/queries/municipios";

export type { CapResumo, CapAutoRecente, CapFacetaAno, CapFacetaTexto } from "@/lib/db/queries/betim";

/**
 * Autuação ambiental ESTADUAL de MG (sistema CAP da SEMAD) —
 * `etl/betim/etl/apis/cap_autos_infracao.py`, migration 0050.
 *
 * ═══ POR QUE O GATE É A UF, E NÃO `temFonte` ═══
 *
 * O CAP é da SEMAD-MG e não cobre outra unidade da federação. `temFonte()`
 * devolve `true` quando a chave não está em `municipios.fontes` — ou seja, uma
 * cidade nova entra com a fonte LIGADA por default, e São Paulo mostraria uma
 * página estruturalmente vazia até alguém lembrar de rodar uma migration de
 * seed. É o mesmo modo de falha que `/defesa-civil` teve por semanas (canais
 * de Betim exibidos para BH, SP e os Vales, corrigido em `68c0eb0`).
 *
 * A UF vem da linha de `municipios` e não pode ficar desatualizada. Fonte
 * estadual, gate estadual.
 */
export const UF_DO_CAP = "MG";

export function capCobreCidade(cidade: Cidade): boolean {
  return cidade.uf === UF_DO_CAP;
}

/** Consulta pública oficial — a procedência de tudo que esta tela mostra. */
export const CAP_URL_FONTE = "https://ecosistemas.meioambiente.mg.gov.br/consulta-ai";

/**
 * Glossário editorial dos órgãos autuantes. Mesma disciplina de
 * `RESUMO_METODO` em `lib/betim/terras.ts`: o leitor não deve ter que inferir
 * o que uma sigla significa a partir da sigla.
 */
export const ORGAO_AUTUANTE: Record<string, string> = {
  SEMAD: "Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável",
  IEF: "Instituto Estadual de Florestas",
  FEAM: "Fundação Estadual do Meio Ambiente",
  IGAM: "Instituto Mineiro de Gestão das Águas",
  PMMA: "Polícia Militar de Meio Ambiente",
};

export interface CapData {
  /** `false` = banco não configurado. Distinto de "cidade sem autuação". */
  configurado: boolean;
  resumo: CapResumo | null;
  recentes: CapAutoRecente[];
}

const VAZIO: CapData = { configurado: false, resumo: null, recentes: [] };

export async function getCapData(idMunicipio: IdMunicipio): Promise<CapData> {
  try {
    const [resumo, recentes] = await Promise.all([
      capResumo(idMunicipio),
      capAutosRecentes(idMunicipio),
    ]);
    if (resumo === null) return VAZIO;
    return { configurado: true, resumo, recentes };
  } catch {
    // Degradação com o banco respondendo ERRO (não só ausência) — é o item 28
    // do plano de execução, e enquanto a Neon estiver em 402 é o caminho que
    // esta rota realmente percorre.
    return { ...VAZIO, configurado: true };
  }
}
