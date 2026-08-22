import dados from "../../../../etl/betim/dados/ckan-mg-obras.json";
/**
 * Contratos de obra rodoviária do DER-MG (Departamento de Estradas de
 * Rodagem do Estado de Minas Gerais). ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por `scripts/coletar-ckan-mg.mts --conjunto=obras` a partir do CKAN
 * do `dados.mg.gov.br`, dataset `portal_obras`, tabela `contratos.csv` —
 * já carrega objeto, valor, prazo (`diasOriginais`/`diasAditados`, o mesmo
 * conceito de "prorrogação" de `convenios-mg.ts`), situação atual e a lista
 * de municípios afetados como texto. `percentualExecucao` vem pronto da
 * fonte, entre 0 e 1 — não é `%`, não multiplicar por 100 de novo.
 *
 * ═══ TABELAS SATÉLITE NÃO INGERIDAS NESTA RODADA (declarado, não escondido) ═══
 *
 * `portal_obras` publica mais seis tabelas — `municipios.csv` (8.258 linhas),
 * `obra.csv` (740, valor por sub-obra dentro do contrato), `situacao.csv`
 * (2.102, histórico de status), `trechos.csv` (612 KB) e `coordenadas.csv`
 * (a maioria vazia na amostra). `contratos.csv` já cobre o essencial
 * (situação ATUAL, município como texto); as demais ficam para quando o
 * produto pedir histórico de status ou geometria de trecho.
 *
 * ═══ ACHADO DE DADO PESSOAL EM `fiscais.csv` (NÃO nesta tabela) ═══
 *
 * `fiscais.csv` (5.336 linhas, uma por fiscal/gestor/representante nomeado
 * por contrato) tem um campo `conselho` pensado para registro profissional
 * (CREA) — mas 37 linhas trazem CPF real de pessoa física ali
 * dentro (algumas com o prefixo literal "CPF-"), confirmado por mod-11.
 * Decisão desta rodada: não publicar `fiscais.csv` linha a linha (nome +
 * papel + esse campo contaminado, sem necessidade clara de produto ainda) —
 * só o achado fica registrado aqui, como número medido, para quem for
 * ingerir essa tabela depois não repetir a descoberta do zero.
 *
 * ═══ CPF DENTRO DE `empresa`/`objeto` (campo de texto livre, não o `cnpj`) ═══
 *
 * 0 contratos têm CPF real dentro de um campo de texto —
 * mesmo padrão de `contratos_vigentes.nome` e `fiscais_contrato.objeto`.
 * `empresa` e `objeto` passam por `redigirTextoLivre` antes de gravar.
 */

export interface ContratoObraMg {
  contrato: string;
  contratoSiad: string;
  objeto: string;
  dataAssinatura: string | null;
  inicioExecucao: string | null;
  terminoExecucao: string | null;
  situacao: string;
  empresa: string;
  /** `null` quando o CNPJ não passa no dígito verificador. */
  cnpj: string | null;
  orgaoContratante: string;
  setor: string;
  modalidadeLicitacao: string;
  regimeExecucao: string;
  classificacao: string;
  naturezaContrato: string;
  obrasDoContrato: string;
  municipios: string;
  diasOriginais: number;
  diasAditados: number;
  diasParalisados: number;
  diasAtuais: number;
  valorInicial: number;
  valorAditivos: number;
  valorTotal: number;
  totalMedido: number;
  saldoContratual: number;
  /** 0–1, já calculado pela fonte. */
  percentualExecucao: number;
}

export const CONTRATOS_OBRAS_MG: ContratoObraMg[] = dados as ContratoObraMg[];

/** Importe ISTO em página de servidor, nunca o array (regra de payload). */
export const COBERTURA_CONTRATOS_OBRAS = {
  contratos: 644,
  valorTotal: 9549931133.099998,
  aditados: 147,
  percentualAditados: 22.8,
  cnpjInvalidos: 0,
  linhasComCpfEmTextoLivre: 0,
  /** `fiscais.csv` NÃO é publicado linha a linha nesta rodada (ver docstring);
   *  este número é o único vestígio do achado de dado pessoal ali. */
  fiscaisCsvLinhas: 5336,
  fiscaisCsvComCpfNoConselho: 37,
} as const;

export const OBRAS_POR_SITUACAO = [{"chave":"Execução concluída","contratos":428},{"chave":"Andamento","contratos":167},{"chave":"Rescindido","contratos":19},{"chave":"A Iniciar","contratos":13},{"chave":"Paralisado","contratos":11},{"chave":"Encerrado","contratos":4},{"chave":"Extinto","contratos":1},{"chave":"Distratado","contratos":1}] as const;
export const OBRAS_POR_MODALIDADE = [{"chave":"CONCORRÊNCIA ELETRÔNICA","contratos":453},{"chave":"RDC","contratos":57},{"chave":"TOMADA DE PREÇOS","contratos":50},{"chave":"PREGÃO ELETRÔNICO","contratos":38},{"chave":"DISPENSA DE LICITAÇÃO","contratos":14},{"chave":"CONCORRÊNCIA PRESENCIAL","contratos":10},{"chave":"REGISTRO DE PRECOS","contratos":6},{"chave":"Concorrência - Concorrência eletrônica","contratos":4},{"chave":"CONVITE","contratos":2},{"chave":"CONCORRENCIA","contratos":2},{"chave":"Dispensa de Licitação - adm direta, fundação ou au","contratos":2},{"chave":"Não Disponível","contratos":1},{"chave":"Concorrência - Concorrência presencial","contratos":1},{"chave":"Dispensa de Licitação - Bens, serviços, alienações","contratos":1},{"chave":"Inexigibilidade - Fornecedor exclusivo","contratos":1},{"chave":"Dispensa de Licitação - Contratação de inst. de pe","contratos":1},{"chave":"Compra direta - adm direta, fundação ou autarquia","contratos":1}] as const;
