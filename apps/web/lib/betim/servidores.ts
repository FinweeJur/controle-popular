import { PerfilServidor, listarServidores } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export const SERVIDORES_PAGE_SIZE = 50;

export interface ServidorRow {
  nome: string;
  cargo: string | null;
  lotacao: string | null;
  vinculo: string | null;
  orgao: string | null;
}

export interface ServidoresResult {
  rows: ServidorRow[];
  total: number;
  configured: boolean;
  ok: boolean;
}

const EMPTY: ServidoresResult = { rows: [], total: 0, configured: false, ok: false };

/**
 * Lista paginada de servidores (nome, cargo, lotação, vínculo). A tabela
 * tem ~9,8k linhas em Betim, então PAGINA sempre (teto de 1000 do
 * PostgREST) e busca no servidor por `ilike`. Remuneração individual NÃO
 * é exibida — `folha_pagamento` está vazia e nome+valor individualizado é
 * dado sensível; nome+cargo de servidor público é informação pública.
 */
export async function getServidores(
  idMunicipio: IdMunicipio,
  opts: {
    q?: string;
    orgao?: string;
    /** `comissionados` | `alto_escalao` — ver `PERFIS_SERVIDOR`. */
    perfil?: PerfilServidor;
    page?: number;
    /** Default `SERVIDORES_PAGE_SIZE`. `prefeitura/servidores` pede um
     *  valor bem maior pra buscar a cidade inteira de uma vez — ver
     *  `app/[municipio]/prefeitura/servidores/dados/[arquivo]/route.ts`. */
    porPagina?: number;
  }
): Promise<ServidoresResult> {
  try {
    const data = await listarServidores(idMunicipio, {
      q: opts.q,
      orgao: opts.orgao,
      perfil: opts.perfil,
      pagina: opts.page,
      porPagina: opts.porPagina ?? SERVIDORES_PAGE_SIZE,
    });
    if (!data) return EMPTY;

    return {
      rows: data as ServidorRow[],
      // `count(*) over ()` vem repetido em toda linha; página vazia = 0.
      total: data[0]?.total ?? 0,
      configured: true,
      ok: true,
    };
  } catch {
    return { ...EMPTY, configured: true };
  }
}
