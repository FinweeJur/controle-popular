import { fornecedoresRanking } from "@/lib/db/queries/betim";
import type { FiltrosFornecedoresRanking } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import type { FornecedorRow } from "./fornecedores-puro";

/**
 * ═══ RANKING DE FORNECEDORES POR MUNICÍPIO — ACESSO AO BANCO (Sprint 2) ═══
 *
 * Plano: `docs/planos/PLANO-revisao-dados-visibilizacao.md`, tela 2
 * ("Maiores fornecedores"). O agregado mora no banco
 * (`fornecedoresRanking` em `lib/db/queries/betim.ts`); a lógica pura
 * (tipos, indícios, CSV) mora em `fornecedores-puro.ts` e é re-exportada
 * aqui por conveniência de quem roda no SERVIDOR. Componente de cliente
 * importa `fornecedores-puro.ts` DIRETO — importar este módulo lá
 * arrastaria a cadeia do banco pro bundle do navegador.
 *
 * REGRA EDITORIAL QUE MANDA AQUI: ranking com ressalva. Todo número de
 * concentração que esta tela mostra vem acompanhado do que ele NÃO diz —
 * somar `valor_global` não corrige inflação, e um CNPJ pode reunir
 * contratos que na prática são de grupos econômicos distintos se a fonte
 * publicou tudo sob o mesmo cadastro.
 */

export {
  LIMITE_CONTRATOS_CONCENTRACAO,
  fornecedorAbertoNoPeriodo,
  fornecedorConcentradoNoAno,
  fornecedoresToCsv,
  resumoDosFornecedores,
  type FornecedorRow,
  type ResumoFornecedores,
} from "./fornecedores-puro";

/** Wrapper que degrada: sem banco (ou com erro) devolve lista vazia com
 *  `ok: false` — a página mostra a mensagem honesta em vez de zeros. */
export async function fetchFornecedores(
  idMunicipio: IdMunicipio,
  filtros: FiltrosFornecedoresRanking = {}
): Promise<{ rows: FornecedorRow[]; ok: boolean }> {
  try {
    const linhas = await fornecedoresRanking(idMunicipio, filtros);
    if (!linhas) return { rows: [], ok: false };
    return { rows: linhas as unknown as FornecedorRow[], ok: true };
  } catch {
    return { rows: [], ok: false };
  }
}
