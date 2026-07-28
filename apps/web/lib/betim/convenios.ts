import * as q from "@/lib/db/queries/betim";

/** Base da URL de detalhe de um convênio no Portal da Transparência. O
 *  segmento final é o `codigo` (dimConvenio.codigo), não o id_externo —
 *  ver migration 0024. */
export const CONVENIO_URL_BASE = "https://portaldatransparencia.gov.br/convenios/";

export interface ConvenioFederal {
  id: string;
  /** `dimConvenio.codigo` — monta o link do Portal (migration 0024).
   *  `null` nas linhas que o ETL sincronizou antes da 0024. */
  codigo: string | null;
  numeroConvenio: string | null;
  objeto: string | null;
  orgaoNome: string | null;
  orgaoSigla: string | null;
  convenenteNome: string | null;
  situacao: string | null;
  tipoInstrumento: string | null;
  valor: number;
  valorLiberado: number;
  valorContrapartida: number;
  dataInicioVigencia: string | null;
  dataFinalVigencia: string | null;
  dataPublicacao: string | null;
}

export interface ConveniosFederaisResult {
  configured: boolean;
  ok: boolean;
  convenios: ConvenioFederal[];
  valorTotal: number;
  valorLiberadoTotal: number;
  /** Nº de convênios em que a própria Prefeitura é o convenente (contra entidades locais). */
  qtdComPrefeitura: number;
  porOrgao: { nome: string; valor: number; qtd: number }[];
}

const VAZIO: ConveniosFederaisResult = {
  configured: false,
  ok: false,
  convenios: [],
  valorTotal: 0,
  valorLiberadoTotal: 0,
  qtdComPrefeitura: 0,
  porOrgao: [],
};

interface ConvenioRow {
  id: string;
  codigo: string | null;
  numero_convenio: string | null;
  objeto: string | null;
  orgao_nome: string | null;
  orgao_sigla: string | null;
  convenente_nome: string | null;
  situacao: string | null;
  tipo_instrumento: string | null;
  valor: number | string | null;
  valor_liberado: number | string | null;
  valor_contrapartida: number | string | null;
  data_inicio_vigencia: string | null;
  data_final_vigencia: string | null;
  data_publicacao: string | null;
}

/**
 * Convênios e repasses federais recebidos por Betim (Portal da
 * Transparência, `etl/apis/transparencia_gov.py`, migration 0014).
 *
 * Chamado "Emendas Parlamentares/Repasses Federais" na UI (decisão do
 * usuário 2026-07-23) — mas o dado por trás é convênio, não emenda
 * individual atribuída a parlamentar: a API não devolve autor por
 * convênio. `/emendas` (o endpoint que traria essa atribuição) não filtra
 * por município nesta chave — testado ao vivo contra 3 anos inteiros,
 * achou 1 registro pra Betim com valor R$ 0. Ver `docs/F0-discovery.md`
 * e o comentário no topo de `etl/apis/transparencia_gov.py`.
 *
 * Ordenado por valor desc — maior repasse primeiro, mesmo padrão de
 * `grupos_economicos`.
 */
export async function getConveniosFederais(
  idMunicipio: string
): Promise<ConveniosFederaisResult> {
  try {
    // `codigo` (migration 0024) era lida com `comColunaOpcional()`, que
    // degradava pro select sem ela. A coluna EXISTE no banco — conferido na
    // introspecção e no PostgREST — então o fallback nunca foi usado e o
    // select agora é direto.
    const data = await q.conveniosFederais(idMunicipio);
    if (!data) return VAZIO;

    const rows = data as ConvenioRow[];
    const convenios: ConvenioFederal[] = rows.map((r) => ({
      id: r.id,
      codigo: r.codigo ?? null,
      numeroConvenio: r.numero_convenio,
      objeto: r.objeto,
      orgaoNome: r.orgao_nome,
      orgaoSigla: r.orgao_sigla,
      convenenteNome: r.convenente_nome,
      situacao: r.situacao,
      tipoInstrumento: r.tipo_instrumento,
      valor: Number(r.valor ?? 0),
      valorLiberado: Number(r.valor_liberado ?? 0),
      valorContrapartida: Number(r.valor_contrapartida ?? 0),
      dataInicioVigencia: r.data_inicio_vigencia,
      dataFinalVigencia: r.data_final_vigencia,
      dataPublicacao: r.data_publicacao,
    }));

    const porOrgaoMap = new Map<string, { valor: number; qtd: number }>();
    for (const c of convenios) {
      const nome = c.orgaoNome ?? "Sem órgão informado";
      const atual = porOrgaoMap.get(nome) ?? { valor: 0, qtd: 0 };
      atual.valor += c.valor;
      atual.qtd += 1;
      porOrgaoMap.set(nome, atual);
    }
    const porOrgao = [...porOrgaoMap.entries()]
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.valor - a.valor);

    return {
      configured: true,
      ok: true,
      convenios,
      valorTotal: convenios.reduce((acc, c) => acc + c.valor, 0),
      valorLiberadoTotal: convenios.reduce((acc, c) => acc + c.valorLiberado, 0),
      // "BETIM" literal: este é um dos casos em que a string da cidade
      // FILTRA DADO, não só decora texto — com outra cidade ativa o número
      // vira zero em silêncio. Fica na lista das 255 ocorrências de "Betim"
      // a trocar por `municipios.nome` no passe de `lib/cidade`; enquanto
      // só Betim está ativa, o resultado é o mesmo de hoje.
      qtdComPrefeitura: convenios.filter((c) =>
        (c.convenenteNome ?? "").toUpperCase().includes("MUNICIPIO DE BETIM")
      ).length,
      porOrgao,
    };
  } catch {
    return { ...VAZIO, configured: true };
  }
}
