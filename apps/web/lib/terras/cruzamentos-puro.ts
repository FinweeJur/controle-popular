import { semAcento } from "@/lib/busca/normalizar";

/**
 * ═══ CRUZAMENTOS TERRITÓRIO × EMPREENDIMENTO — LÓGICA PURA (Sprint 3) ═══
 *
 * Plano: `docs/planos/PLANO-revisao-dados-visibilizacao.md`, Sprint 3.
 * O dado bruto são as camadas de alerta JÁ COMPUTADAS pela frente do globo
 * (`public/terras/globo/dados/camadas/alerta-*`) — interseções EXATAS de
 * polígono, sem buffer. Este módulo NÃO refaz geometria: filtra por
 * município, monta a linha unificada da tabela e o CSV.
 *
 * REGRAS EDITORIAIS QUE MANDAM AQUI (AGENTS.md):
 * - Correlação nunca vira causalidade: o que a linha diz é "o polígono do
 *   território e o polígono do empreendimento se intersectam" — nunca que
 *   um causa o outro ou que haja irregularidade.
 * - Co-ocorrência municipal (empreendimento e território no MESMO município,
 *   sem teste espacial) é rotulada como tal e nunca entra na tabela de
 *   sobreposições.
 * - Lacuna é informação: território sem nome, processo sem documento
 *   público direto, barragem sem mancha publicada — cada ausência tem
 *   texto próprio, não some da tela.
 */

export type TipoCruzamento =
  | "mineracao_operacao"
  | "mineracao_interesse"
  | "barragem_mancha_quilombola";

export const LABEL_TIPO_CRUZAMENTO: Record<TipoCruzamento, string> = {
  mineracao_operacao: "Mineração — operação (SIGMINE/ANM)",
  mineracao_interesse: "Mineração — requerimento/interesse (SIGMINE/ANM)",
  barragem_mancha_quilombola: "Mancha de barragem × território quilombola (FEAM/SNISB)",
};

/** Órgão que autoriza/fiscaliza cada tipo — rótulo fixo por acervo. */
export const ORGAO_POR_TIPO: Record<TipoCruzamento, string> = {
  mineracao_operacao: "ANM",
  mineracao_interesse: "ANM",
  barragem_mancha_quilombola: "FEAM/SNISB",
};

export interface LinhaCruzamento {
  tipo: TipoCruzamento;
  tipoLabel: string;
  territorioTipoLabel: string;
  /** `null` quando a fonte não traz nome — `semNomeMotivo` explica a lacuna. */
  territorioNome: string | null;
  semNomeMotivo: string | null;
  /** Processo SIGMINE (número) ou nome oficial da estrutura/barragem. */
  empreendimento: string;
  /** Fase do processo mineiro, ou empreendedor+status do PAE na barragem. */
  detalheEmpreendimento: string | null;
  /** Rótulo do órgão autorizador/fiscalizador do acervo — espelhado da
   *  constante ORGAO_POR_TIPO na montagem, para a coluna ordenar como texto
   *  comum sem lógica derivada no cliente. */
  orgaoAutorizador: string;
  areaIntersecaoHa: number;
  municipiosTerritorio: string[];
  /** URL pública para conferir o empreendimento; `null` é lacuna declarada
   *  na tela (ex.: barragem sem documento vinculado no acervo). */
  documentoReferencia: string | null;
  /** Deep-link para o globo (`?camada=&idx=`), quando a feição foi achada. */
  mapaCamada: string | null;
  mapaIdx: number | null;
}

/**
 * Casamento de município POR NOME NORMALIZADO — os GeoJSON de FUNAI/INCRA/
 * FEAM não trazem código IBGE (diferente de `estudos-ambientais`, que traz
 * `geocodigo`). AGENTS.md adverte contra casar por nome; aqui não há
 * alternativa no dado, então: normaliza acento/caixa, compara igualdade
 * exata e quem NÃO casar fica visível como lacuna, nunca forcado.
 */
export function municipioNaLista(nomesSeparadosPorVirgula: string | null | undefined, alvo: string): boolean {
  if (!nomesSeparadosPorVirgula || !alvo) return false;
  const alvoN = semAcento(alvo).toLowerCase().trim();
  if (!alvoN) return false;
  return nomesSeparadosPorVirgula
    .split(",")
    .map((m) => semAcento(m).toLowerCase().trim())
    .includes(alvoN);
}

// ═══ Entradas (o servidor extrai das camadas; aqui são só dados) ════════

export interface EntradaSigmine {
  territorioTipo: "terra_indigena" | "quilombola";
  territorioNome: string | null;
  semNomeMotivo: string | null;
  territorioMunicipios: string[];
  sigmineProcesso: string;
  sigmineNome: string;
  sigmineSubs: string;
  sigmineFase: string;
  sigmineUso: string | null;
  areaIntersecaoHa: number;
  mapaCamada: string | null;
  mapaIdx: number | null;
}

export interface EntradaBarragemQuilombola {
  territorioNome: string;
  territorioMunicipios: string[];
  territorioFase: string;
  barragem: string;
  empreendedor: string;
  municipioBarragem: string;
  statusPae: string;
  areaIntersecaoHa: number;
  mapaCamada: string | null;
  mapaIdx: number | null;
}

/** Link de conferência do processo na ANM (SCM) — ver FONTE_ANM_PROCESSOS. */
export const URL_ANM_SCM =
  "https://sistemas.anm.gov.br/SCM/Extra/site/admin/pesquisarProcessos.aspx";

/**
 * Monta as linhas da tabela a partir dos alertas já filtrados por município
 * (o filtro por nome acontece ANTES, no servidor). Ordem determinística:
 * operação antes de interesse antes de barragem; dentro do tipo, maior área
 * primeiro — desempate por empreendimento para paginação estável.
 */
export function montarLinhasCruzamento(
  sigmineOperacao: EntradaSigmine[],
  sigmineInteresse: EntradaSigmine[],
  barragensQuilombola: EntradaBarragemQuilombola[]
): LinhaCruzamento[] {
  const linhas: LinhaCruzamento[] = [];

  for (const s of sigmineOperacao) {
    linhas.push(linhaSigmine("mineracao_operacao", s));
  }
  for (const s of sigmineInteresse) {
    linhas.push(linhaSigmine("mineracao_interesse", s));
  }
  for (const b of barragensQuilombola) {
    linhas.push({
      tipo: "barragem_mancha_quilombola",
      tipoLabel: LABEL_TIPO_CRUZAMENTO.barragem_mancha_quilombola,
      territorioTipoLabel: "Território quilombola",
      territorioNome: b.territorioNome,
      semNomeMotivo: null,
      empreendimento: b.barragem,
      detalheEmpreendimento: `${b.empreendedor} · PAE: ${b.statusPae || "sem status"} · barragem em ${b.municipioBarragem}`,
      orgaoAutorizador: ORGAO_POR_TIPO.barragem_mancha_quilombola,
      areaIntersecaoHa: b.areaIntersecaoHa,
      municipiosTerritorio: b.territorioMunicipios,
      documentoReferencia: null,
      mapaCamada: b.mapaCamada,
      mapaIdx: b.mapaIdx,
    });
  }

  const ordem: Record<TipoCruzamento, number> = {
    mineracao_operacao: 0,
    mineracao_interesse: 1,
    barragem_mancha_quilombola: 2,
  };
  return linhas.sort(
    (a, b) =>
      ordem[a.tipo] - ordem[b.tipo] ||
      b.areaIntersecaoHa - a.areaIntersecaoHa ||
      a.empreendimento.localeCompare(b.empreendimento, "pt-BR")
  );
}

function linhaSigmine(tipo: TipoCruzamento, s: EntradaSigmine): LinhaCruzamento {
  return {
    tipo,
    tipoLabel: LABEL_TIPO_CRUZAMENTO[tipo],
    territorioTipoLabel: s.territorioTipo === "terra_indigena" ? "Terra Indígena" : "Território quilombola",
    territorioNome: s.territorioNome,
    semNomeMotivo: s.semNomeMotivo,
    empreendimento: s.sigmineProcesso,
    detalheEmpreendimento: [s.sigmineNome, s.sigmineSubs, `fase: ${s.sigmineFase}`, s.sigmineUso]
      .filter(Boolean)
      .join(" · "),
    orgaoAutorizador: ORGAO_POR_TIPO[tipo],
    areaIntersecaoHa: s.areaIntersecaoHa,
    municipiosTerritorio: s.territorioMunicipios,
    // A ANM não expõe URL por número de processo (checado ao vivo 13/08);
    // o link leva à busca por NUP onde o número se digita — honesto sobre isso.
    documentoReferencia: URL_ANM_SCM,
    mapaCamada: s.mapaCamada,
    mapaIdx: s.mapaIdx,
  };
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[;"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** CSV do recorte filtrado — BOM UTF-8 e separador ";" (regra do dono). */
export function cruzamentosToCsv(rows: LinhaCruzamento[]): string {
  const BOM = "\ufeff";
  const cabecalho = [
    "tipo",
    "territorio_tipo",
    "territorio_nome",
    "empreendimento",
    "detalhe_empreendimento",
    "orgao_autorizador",
    "area_intersecao_ha",
    "municipios_do_territorio",
    "documento_referencia",
    "camada_mapa",
    "indice_no_mapa",
  ].join(";");
  const linhas = rows.map((r) =>
    [
      r.tipoLabel,
      r.territorioTipoLabel,
      r.territorioNome ?? "(sem nome no dado de origem)",
      r.empreendimento,
      r.detalheEmpreendimento,
      r.orgaoAutorizador,
      r.areaIntersecaoHa,
      r.municipiosTerritorio.join(", "),
      r.documentoReferencia ?? "",
      r.mapaCamada ?? "",
      r.mapaIdx ?? "",
    ]
      .map(csvEscape)
      .join(";")
  );
  return BOM + [cabecalho, ...linhas].join("\r\n") + "\r\n";
}
