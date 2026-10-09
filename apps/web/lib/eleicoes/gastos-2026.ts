/**
 * Tipos dos dados publicados em `/eleicoes/2026/gastos-campanha`.
 *
 * O que é: interfaces que espelham, campo a campo, os oito JSONs gerados por
 * `scripts/etl/eleicoes/gastos-campanha-2026.py` em
 * `apps/web/data/eleicoes/gastos-2026/` (o oitavo, `meta-ads-amostra.json`,
 * vem de `scripts/etl/eleicoes/meta-ads-library-amostra.py`). A página, a rota
 * de fatias e o teste-guarda importam estes tipos para que uma mudança no ETL
 * sem mudança aqui (ou o contrário) quebre o `tsc` na hora, não em produção.
 *
 * Fonte oficial dos dados: Tribunal Superior Eleitoral (TSE) — Dados Abertos,
 * conjuntos "Prestação de contas eleitorais 2026" e "Resultados 2026"
 * (medição da coleta: 09/10/2026, dado PARCIAL — as contas definitivas valem
 * até 03/11/2026 e o 2º turno ocorre em 25/10/2026).
 *
 * Decisões técnicas não triviais:
 * - NENHUM campo de SQ (sequencial de prestação de contas) e nenhum CPF
 *   existem aqui de propósito: o repositório é público e a guarda
 *   `sem-cpf-no-repo` valida CPF por mod-11 (AGENTS.md § 5.2). SQ de
 *   candidato tem 11 dígitos, é indistinguível de CPF na varredura, e o
 *   deep-link do TSE devolve 403 (WAF) — então não saiu no output.
 * - `eleito` é número (0 = não eleito, 1 = eleito no 1º turno, 2 = pendente
 *   de 2º turno) e não união literal, para a atribuição direta do JSON
 *   importado não depender de asserção de tipo.
 * - `custoVoto` é opcional: candidaturas com "sem votacao" não têm voto
 *   nominal, e dividir por zero geraria Infinity — o ETL omite a chave.
 */

/** Uma linha da tabela pública de candidaturas (1.823 linhas, corte do ETL). */
export interface LinhaGasto {
  cargo: string;
  nome: string;
  urna: string;
  partido: string;
  uf: string;
  votos: number;
  situacao: string;
  eleito: number;
  receita: number;
  contratado: number;
  pago: number;
  digital: number;
  materiais: number;
  rua: number;
  bigtech: number;
  custoVoto?: number | null;
}

/** Metadados da coleta: fonte, selo de parcialidade, totais e agregados. */
export interface MetaGastos {
  fonte: {
    nome: string;
    url_prestacao: string;
    url_resultados: string;
    url_zip_candidatos: string;
    url_zip_partidos: string;
    url_zip_votacao: string;
  };
  coleta: {
    em: string;
    parcial: boolean;
    motivo_parcial: string;
    recoleta: string;
  };
  totais: {
    receita: number;
    contratado: number;
    pago: number;
    candidaturas: number;
    eleitos1Turno: number;
    pendentes2Turno: number;
    linhasTabela: number;
  };
  /** Grupos de despesa por natureza: materiais, digital, rua, imprensa, audiovisual, outros. */
  grupos: Record<string, { contratado: number; pago: number }>;
  receitaPorFonte: { fonte: string; total: number }[];
  naturezas: { cd: string; ds: string; contratado: number; pago: number; linhas: number }[];
  porCargo: {
    cargo: string;
    candidaturas: number;
    eleitos: number;
    receita: number;
    contratado: number;
    pago: number;
    digital: number;
    materiais: number;
    votos: number;
    custoVotoMedianoEleitos?: number;
  }[];
  porUf: {
    uf: string;
    candidaturas: number;
    eleitos: number;
    receita: number;
    contratado: number;
    pago: number;
    digital: number;
    votos: number;
  }[];
  mencaoPlataformas: Record<string, { linhas: number; total: number }>;
  lacunas: string[];
  metodologia: string;
}

/** Uma linha de fornecedor contratado (nome, CNPJ, total e quantas despesas). */
export interface FornecedorGasto {
  nome: string;
  cnpj: string;
  total: number;
  linhas: number;
  bigtech: boolean;
}

/** Uma linha do agregado por partido (órgãos partidários + candidatos). */
export interface PartidoGasto {
  partido: string;
  contratado: number;
  pago: number;
  receita: number;
  digital: number;
  bigtech: number;
  nome: string;
}

/** CNPJ/SK de big tech encontrado no arquivo de despesas contratadas. */
export interface BigTechEmpresa {
  grupo: string;
  empresa: string;
  cnpj: string;
  total: number;
  linhas: number;
  candidatos: number;
  naturezas: { despesa: string; total: number }[];
  mensal: { mes: string; total: number }[];
}

/** Cruzes de big tech: total, empresas, candidatos, partidos e lacunas. */
export interface BigTechDados {
  total: number;
  empresas: BigTechEmpresa[];
  topCandidatos: {
    nome: string;
    urna: string;
    cargo: string;
    uf: string;
    partido: string;
    bigtech: number;
    digital: number;
  }[];
  partidos: { partido: string; total: number }[];
  /**
   * Desdobramento da Meta por plataforma (WhatsApp, Instagram, Facebook e
   * "sem plataforma declarada"): heurística do portal sobre a descrição
   * livre da despesa — o TSE não informa a plataforma. Soma igual ao total
   * do grupo Meta em `empresas` (guardado no teste).
   */
  metaPlataformas: { plataforma: string; total: number; linhas: number }[];
  match: { cnpj: number; nome: number };
  naoLocalizadas: string[];
}

/**
 * Agregado de análise por partido — o universo COMPLETO dos candidatos
 * (19.724 declarados: 18.851 com votação + 873 vedadas/retiradas), não só a
 * tabela de 1.823. O `bigtech` daqui bate com `BigTechDados.partidos`
 * (mesma soma por candidato); já o `PartidoGasto` é outro universo
 * (órgãos partidários) e não é somável com este.
 */
export interface PartidoAnalise {
  partido: string;
  nome: string;
  candidaturas: number;
  eleitos: number;
  pendentes2t: number;
  receita: number;
  contratado: number;
  pago: number;
  digital: number;
  bigtech: number;
  votos: number;
  /** Mediana do custo por voto entre os eleitos da legenda; ausente sem eleitos. */
  custoVotoMedianoEleitos?: number;
}

/**
 * Agregado de análise por UF — totais do estado + partidos por dentro.
 * O "BR" (presidência) fica de fora no ETL: voto presidencial é nacional
 * e já aparece em `MetaGastos.porCargo`.
 */
export interface UfAnalise {
  uf: string;
  candidaturas: number;
  eleitos: number;
  pendentes2t: number;
  receita: number;
  contratado: number;
  pago: number;
  digital: number;
  bigtech: number;
  votos: number;
  custoVotoMedianoEleitos?: number;
  partidos: PartidoAnalise[];
}

/**
 * Um anúncio da AMOSTRA da Biblioteca de Anúncios da Meta (Meta Ads Library),
 * coletada por `scripts/etl/eleicoes/meta-ads-library-amostra.py`.
 *
 * Fonte oficial: https://www.facebook.com/ads/library/ — sem API pública para
 * este recorte; é amostra manual aprovada pelo dono (09/10/2026). `faixaGastoBRL`
 * é a faixa que a própria Meta exibe ("R$150 mil a R$175 mil"), nunca convertida
 * em número exato; ausente = não exibida na captura. `id` é a identificação da
 * biblioteca.
 */
export interface MetaAnuncioAmostra {
  id: string;
  patrocinador: string;
  periodo: string | null;
  anunciosMesmoCriativo: number;
  faixaGastoBRL: string | null;
  impressoes: string | null;
  publicoEstimado: string | null;
}

/** A amostra de um candidato: os anúncios e, às vezes, uma nota de contexto. */
export interface MetaAmostraCandidato {
  urna: string;
  nome: string;
  cargo: string;
  uf: string;
  partido: string;
  /** Total que o candidato declarou ao TSE em big tech (o que a amostra ilustra). */
  bigtechTSE: number;
  anuncios: MetaAnuncioAmostra[];
  /** Contexto honesto: busca dominada por outras páginas ou anúncios antigos descartados. */
  nota?: string;
}

/** O arquivo `meta-ads-amostra.json`: método, fonte e a amostra por candidato. */
export interface MetaAmostraDados {
  geradoEm: string;
  metodo: string;
  fonte: string;
  candidatos: MetaAmostraCandidato[];
}
