import { iniciativasParaopeba, iniciativasParaopebaMenosConcluidas, saldoParaopeba } from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";

export interface SaldoMunicipio {
  referencia: string;
  valorAcordoInicial: number | null;
  valorAcordoAtual: number | null;
  empenhosAutorizados: number | null;
  saldoTeto: number | null;
}

export interface IniciativaParaopeba {
  idFdi: string;
  titulo: string;
  municipiosEnvolvidos: string | null;
  grupoIniciativas: string | null;
  tipoObrigacao: string | null;
  areaTematica: string | null;
  subAreaTematica: string | null;
  status: string | null;
  investimento: number | null;
  valorTotal: number | null;
  /** Avanço físico EXECUTADO (%) — o número que a FGV mostra. */
  percentualRealizado: number | null;
  /**
   * Avanço físico PLANEJADO (%) — quanto deveria estar pronto até agora.
   * Executado < Planejado ⇒ atrasado.
   *
   * Veio da migration 0026, que nunca tinha rodado: o `comColunaOpcional()`
   * caía sempre no ramo sem ela, então esta comparação — a razão de ser da
   * 0026 — nunca funcionou em produção. Aplicada e preenchida a partir da
   * aba "Avanço Físico" da planilha da FGV: das 19 iniciativas de Betim, 5
   * estão atrasadas.
   */
  percentualPlanejado: number | null;
  produtosPrevistos: number | null;
  produtosEntregues: number | null;
  produtosEmAtraso: number | null;
  linkPublico: string | null;
  linkTermoCompromisso: string | null;
}

export interface ParaopebaData {
  configured: boolean;
  ok: boolean;
  saldo: SaldoMunicipio | null;
  iniciativas: IniciativaParaopeba[];
}

const VAZIO: ParaopebaData = { configured: false, ok: false, saldo: null, iniciativas: [] };

interface RowSaldo {
  referencia: string;
  valor_acordo_inicial: number | string | null;
  valor_acordo_atual: number | string | null;
  empenhos_autorizados: number | string | null;
  saldo_teto: number | string | null;
}

interface RowIniciativa {
  id_fdi: string;
  titulo: string;
  municipios_envolvidos: string | null;
  grupo_iniciativas: string | null;
  tipo_obrigacao: string | null;
  area_tematica: string | null;
  sub_area_tematica: string | null;
  status: string | null;
  investimento: number | string | null;
  valor_total: number | string | null;
  percentual_realizado: number | string | null;
  percentual_planejado: number | string | null;
  produtos_previstos: number | null;
  produtos_entregues: number | null;
  produtos_em_atraso: number | null;
  link_publico: string | null;
  link_termo_compromisso: string | null;
}

function mapIniciativa(r: RowIniciativa): IniciativaParaopeba {
  return {
    idFdi: r.id_fdi,
    titulo: r.titulo,
    municipiosEnvolvidos: r.municipios_envolvidos,
    grupoIniciativas: r.grupo_iniciativas,
    tipoObrigacao: r.tipo_obrigacao,
    areaTematica: r.area_tematica,
    subAreaTematica: r.sub_area_tematica,
    status: r.status,
    investimento: r.investimento != null ? Number(r.investimento) : null,
    valorTotal: r.valor_total != null ? Number(r.valor_total) : null,
    percentualRealizado: r.percentual_realizado != null ? Number(r.percentual_realizado) : null,
    percentualPlanejado: r.percentual_planejado != null ? Number(r.percentual_planejado) : null,
    produtosPrevistos: r.produtos_previstos,
    produtosEntregues: r.produtos_entregues,
    produtosEmAtraso: r.produtos_em_atraso,
    linkPublico: r.link_publico,
    linkTermoCompromisso: r.link_termo_compromisso,
  };
}

/**
 * Auditoria socioeconômica do Rio Paraopeba (FGV), projetos ligados a
 * Betim -- um dos 26 municípios signatários do Acordo Geral de
 * Reparação pelo rompimento da barragem da Vale em Brumadinho (2019).
 * `etl/apis/fgv_paraopeba.py`, migration 0022.
 */
export async function getParaopebaData(
  idMunicipio: IdMunicipio
): Promise<ParaopebaData> {
  try {
    const [saldoRes, iniciativasRes] = await Promise.all([
      saldoParaopeba(idMunicipio),
      iniciativasParaopeba(idMunicipio),
    ]);

    if (!iniciativasRes) return VAZIO;

    const saldoRow = saldoRes as RowSaldo | null;
    const saldo: SaldoMunicipio | null = saldoRow
      ? {
          referencia: saldoRow.referencia,
          valorAcordoInicial: saldoRow.valor_acordo_inicial != null ? Number(saldoRow.valor_acordo_inicial) : null,
          valorAcordoAtual: saldoRow.valor_acordo_atual != null ? Number(saldoRow.valor_acordo_atual) : null,
          empenhosAutorizados:
            saldoRow.empenhos_autorizados != null ? Number(saldoRow.empenhos_autorizados) : null,
          saldoTeto: saldoRow.saldo_teto != null ? Number(saldoRow.saldo_teto) : null,
        }
      : null;

    const iniciativas = (iniciativasRes as RowIniciativa[]).map(mapIniciativa);

    return { configured: true, ok: true, saldo, iniciativas };
  } catch {
    return { ...VAZIO, configured: true };
  }
}

/**
 * As N obras/projetos do Paraopeba MAIS LONGE de concluir — menor avanço
 * físico executado primeiro — pra um teaser na Home (pedido do usuário
 * 2026-07-24). Considera só projetos **em execução** (exclui Cancelado e
 * Concluído: não faz sentido listar como "longe de concluir" algo que foi
 * cancelado ou já entregue). Ignora quem não tem % de avanço físico.
 */
export async function getObrasParaopebaMenosConcluidas(
  idMunicipio: IdMunicipio,
  limite = 5
): Promise<IniciativaParaopeba[]> {
  try {
    const data = await iniciativasParaopebaMenosConcluidas(idMunicipio, limite);
    if (!data) return [];
    return (data as RowIniciativa[]).map(mapIniciativa);
  } catch {
    return [];
  }
}
