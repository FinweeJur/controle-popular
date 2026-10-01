/**
 * Tipos de dados e contratos de interface para as Assembleias Legislativas Estaduais.
 *
 * Papel no portal:
 * Define os modelos tipados estritos para representação das 27 Casas Legislativas
 * estaduais brasileiras (26 estados e a Câmara Legislativa do Distrito Federal).
 * Suporta o catálogo cívico, monitoramento de proposições com impacto social,
 * composição de mesas diretoras, comissões temáticas, audiências públicas e
 * ranking de atuação parlamentar.
 *
 * Fontes oficiais:
 * - Portais oficiais de transparência e dados abertos das 27 Assembleias Legislativas.
 * - Constituição Federal de 1988 (Artigo 27: definição do número de deputados estaduais).
 * - Sistemas de Apoio ao Processo Legislativo (SAPL / Interlegis) e sistemas próprios (ALE/ALMG/ALESP).
 *
 * Decisões de design:
 * - Todos os campos de identificação e vínculos institucionais seguem tipagem estrita.
 * - Preservação estrita de privacidade: identificação pública apenas de autoridades e
 *   parlamentares no exercício do mandato público (sem inclusão de CPFs ou dados sensíveis,
 *   conforme AGENTS.md § 5.2).
 */

/** Regiões geográficas oficiais do Brasil */
export type RegiaoBrasil = "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";

/** Tipos de proposições legislativas mais frequentes */
export type TipoProposicao = "PL" | "PLC" | "PEC" | "Requerimento" | "Indicação" | "Emenda" | string;

/** Dados de um membro da Mesa Diretora */
export interface MembroMesa {
  /** Nome público do parlamentar */
  nome: string;
  /** Partido político ao qual está filiado */
  partido: string;
}

/** Membro presidente da Mesa Diretora com biografia */
export interface MembroMesaPresidente extends MembroMesa {
  /** Síntese biográfica e histórico público */
  biografiaBreve: string;
}

/** Composição oficial da Mesa Diretora da Assembleia */
export interface MesaDiretora {
  presidente: MembroMesaPresidente;
  primeiroVicePresidente: MembroMesa;
  segundoVicePresidente: MembroMesa;
  primeiroSecretario: MembroMesa;
  segundoSecretario: MembroMesa;
  ouvidor: MembroMesa;
  procuradoraMulher: MembroMesa;
}

/** Dados físicos e endereço oficial da sede parlamentar */
export interface SedeAssembleia {
  /** Nome oficial do edifício ou palácio legislativo */
  edificio: string;
  /** Logradouro, número e bairro */
  endereco: string;
  /** Código de Endereçamento Postal (CEP formatado) */
  cep: string;
  /** Município sede da capital */
  cidade: string;
}

/** Canais oficiais de contato e portais de transparência */
export interface ContatosAssembleia {
  /** Telefone geral da instituição com DDD */
  telefone: string;
  /** E-mail institucional de atendimento ao público */
  email: string;
  /** URL ou e-mail da Ouvidoria Parlamentar */
  ouvidoria: string;
  /** Endereço web oficial do Portal da Transparência */
  portalTransparencia: string;
  /** Endereço web oficial do Portal de Dados Abertos ou API */
  dadosAbertos: string;
  /** Link direto para consulta do processo legislativo (SAPL ou sistema próprio) */
  processoLegislativo: string;
}

/** Canais de transmissão ao vivo e agenda institucional */
export interface TransmissaoAssembleia {
  /** Canal oficial de transmissão no YouTube */
  youtube: string;
  /** Canal ou link da emissora pública TV Assembleia */
  tvAssembleia: string;
  /** Horários e dias habituais das sessões plenárias ordinárias */
  sessoesOrdinarias: string;
}

/** Dados orçamentários declarados da Casa Legislativa */
export interface OrcamentoAssembleia {
  /** Dotação orçamentária anual fixada em R$ milhões */
  valorMilhoes: number;
  /** Ano de referência do exercício financeiro */
  anoExercicio: number;
  /** Valor médio mensal da Cota Parlamentar / Verba Indenizatória por deputado (R$) */
  cotaMediaGabineteMensal: number;
}

/** Comissão permanente ou comissão especial temática */
export interface ComissaoEstadual {
  /** Identificador único da comissão */
  id: string;
  /** Sigla oficial da comissão (ex: CCJ, CFT, CDH) */
  sigla: string;
  /** Nome por extenso da comissão */
  nome: string;
  /** Nome do parlamentar presidente da comissão */
  presidente: string;
  /** Nome do parlamentar vice-presidente da comissão */
  vicePresidente: string;
  /** Quantidade total de membros titulares */
  totalMembros: number;
}

/** Autor parlamentar de proposição legislativa */
export interface AutorProposicao {
  /** Nome oficial do autor */
  nome: string;
  /** Sigla do partido político */
  partido: string;
}

/** Evento singular de tramitação legislativa estadual */
export interface TramitacaoItem {
  /** Sequência cronológica do evento */
  sequencia: number;
  /** Data e hora do andamento no formato ISO ou texto legível */
  dataHora: string;
  /** Sigla ou nome do órgão colegiado/comissão onde o ato ocorreu */
  siglaOrgao: string;
  /** Descrição sucinta do evento ou despacho da matéria */
  descricao: string;
  /** Despacho detalhado ou parecer do relator quando houver */
  despacho?: string;
  /** Link para documento oficial anexo ao andamento */
  urlDocumento?: string;
}

/** Proposição legislativa de interesse social */
export interface ProposicaoEstadual {
  /** Código oficial no formato 'TIPO NUMERO/ANO' (ex: 'PL 2.450/2026') */
  codigo: string;
  /** Categoria da proposição (PL, PLC, PEC, etc.) */
  tipo: TipoProposicao;
  /** Ano de apresentação */
  ano: number;
  /** Ementa ou resumo do teor do projeto */
  ementa: string;
  /** Autores parlamentares */
  autores: AutorProposicao[];
  /** Fase ou estágio atual da tramitação */
  situacao: string;
  /** Data oficial em formato ISO (AAAA-MM-DD) */
  dataApresentacao: string;
  /** Link para acompanhamento oficial da matéria */
  urlProcesso: string;
  /** Data da última movimentação registrada */
  dataUltimaTramitacao?: string;
  /** Órgão ou comissão onde a matéria se encontra atualmente */
  orgaoAtual?: string;
  /** Histórico de andamentos e eventos da tramitação */
  tramitacoes?: TramitacaoItem[];
}

/** Audiência pública legislativa */
export interface AudienciaPublicaEstadual {
  /** Identificador único da audiência */
  id: string;
  /** Assunto ou título da matéria debatida */
  tema: string;
  /** Data e horário em formato ISO ou texto legível */
  dataHora: string;
  /** Comissão parlamentar realizadora */
  comissao: string;
  /** Local ou plenário de realização */
  local: string;
  /** Link da transmissão ao vivo ou gravação */
  urlTransmissao: string;
}

/** Deputado estadual ranqueado por pontuação de atuação cívica */
export interface DeputadoEstadual {
  /** Identificador único do parlamentar na base */
  id: string;
  /** Nome público ou parlamentar */
  nome: string;
  /** Partido político */
  partido: string;
  /** Pontuação calculada de atuação cívica (0 a 100) */
  pontuacaoCivica: number;
  /** Total de proposições apresentadas no período */
  totalProposicoes: number;
  /** Lista de siglas das comissões em que atua */
  comissoesIntegradas: string[];
  /** Percentual médio de presença nas sessões plenárias (0 a 100) */
  assiduidadePct: number;
}

/** Entidade principal que representa uma Assembleia Legislativa Estadual */
export interface AssembleiaEstadual {
  /** Sigla de 2 caracteres da Unidade Federativa (ex: 'SP', 'MG') */
  uf: string;
  /** Sigla oficial da Casa (ex: 'ALESP', 'ALMG', 'CLDF') */
  sigla: string;
  /** Nome completo da Casa Legislativa */
  nomeCompleto: string;
  /** Nome do estado ou Distrito Federal */
  estado: string;
  /** Região do país */
  regiao: RegiaoBrasil;
  /** Nome da cidade capital */
  capital: string;
  /** Total real de cadeiras parlamentares da Casa */
  totalDeputados: number;
  /** Sede física e endereço */
  sede: SedeAssembleia;
  /** Contatos e links de transparência */
  contatos: ContatosAssembleia;
  /** Canais de transmissão ao vivo */
  transmissao: TransmissaoAssembleia;
  /** Mesa Diretora em exercício */
  mesaDiretora: MesaDiretora;
  /** Orçamento declarado e cotas */
  orcamentoAnual: OrcamentoAssembleia;
  /** Lista de comissões permanentes e especiais */
  comissoes: ComissaoEstadual[];
  /** Amostra representativa de proposições de relevância social */
  proposicoes: ProposicaoEstadual[];
  /** Amostra de audiências públicas */
  audienciasPublicas: AudienciaPublicaEstadual[];
  /** Ranking representativo de atuação dos deputados */
  deputadosRanking: DeputadoEstadual[];
}

/** Critérios de filtro para consulta de proposições legislativas */
export interface FiltrosProposicoesEstaduais {
  /** Termo de busca textual para busca em código ou ementa */
  q?: string;
  /** Tipo específico de proposição (ex: 'PL', 'PEC') */
  tipo?: string;
  /** Ano específico de apresentação */
  ano?: number;
  /** Situação atual (ex: 'Sancionado', 'Em Tramitação') */
  situacao?: string;
  /** Nome de parlamentar autor */
  autor?: string;
}

/** Indicadores agregados nacionais de todas as Assembleias Legislativas */
export interface MetricasNacionais {
  /** Total de Casas Legislativas catalogadas (esperado: 27) */
  totalAssembleias: number;
  /** Total nacional de deputados estaduais e distritais (esperado: 1.059) */
  totalDeputados: number;
  /** Total de comissões temáticas catalogadas */
  totalComissoes: number;
  /** Total de proposições cadastradas na base */
  totalProposicoes: number;
  /** Total de audiências públicas registradas */
  totalAudiencias: number;
  /** Soma orçamentária estimada em R$ milhões */
  orcamentoTotalMilhoes: number;
}
