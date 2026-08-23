import { EMPRESAS } from "@/lib/empresas/dados";
import {
  contarContratosPorFornecedorAno,
  fornecedorCriadoNoAnoDoContrato,
  fornecedorExcedeContratosNoAno,
} from "@/lib/betim/contratos-indicios";
import type { ContratoRow } from "@/lib/betim/contratos";
import { semAcento } from "@/lib/busca/normalizar";

/**
 * ═══ PAINEL DO CIDADÃO — A LENTE RESUMO (Sprint 5) ═══
 *
 * Plano: `docs/planos/PLANO-revisao-dados-visibilizacao.md`, Sprint 5.
 * Este módulo é o contrato de dados do painel: recebe o que as telas das
 * Sprints 2-4 já produzem e devolve os números de UMA olhada. Nenhuma
 * conta nova de verdade — concentração/recém-criada reusam EXATAMENTE as
 * funções da tabela de contratos (`contratos-indicios.ts`), para o painel
 * nunca divergir da tela completa. Sem banco, tudo degrada para
 * `disponivel: false` e a página mostra o vazio honesto com link.
 */

export const REGRA_DISPENSA_PROXIMA_LIMITE = "regra_2_dispensa_proxima_limite";

/** Limiar do indício de concentração na tabela de contratos (N=3, "> N"). */
const LIMIAR_CONCENTRACAO = 3;

export interface ResumoDinheiro {
  /** false quando o banco não respondeu — painel mostra estado vazio. */
  disponivel: boolean;
  totalContratos: number;
  top5Contratos: ContratoRow[];
  /** Mesmo fornecedor com mais de N contratos no mesmo ano (> N, N=3). */
  concentracao: number;
  /** Dispensa de licitação em >= 90% do limite legal (Regra 2 do ETL). */
  dispensaLimite: number;
  /** CNPJ aberto no mesmo ano do contrato (indício, não violação). */
  recemCriada: number;
}

/**
 * Resumo do dinheiro público sobre TODAS as linhas da cidade (a chamada
 * usa `porPagina: 100_000`, igual à rota de dados da tabela).
 */
export function resumoDinheiro(rows: ContratoRow[], disponivel: boolean): ResumoDinheiro {
  if (!disponivel || rows.length === 0) {
    return { disponivel: false, totalContratos: 0, top5Contratos: [], concentracao: 0, dispensaLimite: 0, recemCriada: 0 };
  }
  const contagens = contarContratosPorFornecedorAno(rows);
  return {
    disponivel: true,
    totalContratos: rows.length,
    // Maiores por valor global; sem valor publicado não disputa o topo
    // (NULL não é pequeno nem grande — mesma decisão da tela de contratos).
    top5Contratos: [...rows]
      .filter((r) => r.valor_global != null)
      .sort((a, b) => Number(b.valor_global) - Number(a.valor_global))
      .slice(0, 5),
    concentracao: rows.filter((r) =>
      fornecedorExcedeContratosNoAno(r, contagens, LIMIAR_CONCENTRACAO)
    ).length,
    dispensaLimite: rows.filter(
      (r) => (r.motivos_alerta ?? []).includes(REGRA_DISPENSA_PROXIMA_LIMITE)
    ).length,
    recemCriada: rows.filter(fornecedorCriadoNoAnoDoContrato).length,
  };
}

export interface EmpresaDestaque {
  nomeCurto: string;
  href: string;
}

/**
 * Empresa monitorada que tem este município como área prioritária — DERIVADO
 * de `municipiosPrioridade` do observatório (`lib/empresas/dados.ts`), não
 * copiado: quando o observatório ganhar empresa/município novo, o painel
 * acompanha sem tocar aqui. Casamento por nome normalizado porque a fonte
 * guarda nomes com acento/caixa variável ("Araçuaí", "BETIM").
 */
export function empresaDoMunicipio(nomeCidade: string): EmpresaDestaque | null {
  if (!nomeCidade) return null;
  const alvo = semAcento(nomeCidade).toLowerCase().trim();
  for (const e of EMPRESAS) {
    if (
      (e.municipiosPrioridade ?? []).some(
        (m) => semAcento(m).toLowerCase().trim() === alvo
      )
    ) {
      return { nomeCurto: e.nomeCurto, href: `/empresas/${e.slug}` };
    }
  }
  return null;
}
