/**
 * apps/web/lib/ambiental/ecossistema-nacional.ts
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ECOSSISTEMA REGULATÓRIO, AMBIENTAL E DE CONCESSIONÁRIAS DO BRASIL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Catálogo analítico e institucional consolidado:
 * - 27 Órgãos Ambientais Estaduais (OEMAs cobrindo todas as UFs da federação);
 * - Ministérios Federais estratégicos (MMA, MME, MIDR);
 * - Autarquias e Agências Reguladoras Federais (IBAMA, ICMBio, ANA, ANEEL, ANM, ANP, FUNAI, INCRA, CPRM/SGB);
 * - Empresas Públicas e Sociedades de Economia Mista (Petrobras, Furnas, CHESF, Eletronorte, Eletrobras, Itaipu, Codevasf, Embrapa);
 * - Principais Concessionárias de Água, Esgoto e Saneamento Básico;
 * - Principais Concessionárias de Distribuição de Energia Elétrica.
 *
 * ═══ PAPEL NO PORTAL CÍVICO ═══
 * Mapeia o ecossistema completo de governança territorial e serviços essenciais do país.
 * Permite ao cidadão, pesquisador e defensor público:
 * 1. Identificar com precisão qual órgão detém a competência de fiscalização ou licenciamento;
 * 2. Localizar sistemas informatizados (ex: CAR, Sinaflor, Sisnama, SIGMINE, SEI) de cada órgão;
 * 3. Encontrar canais diretos de ouvidoria, denúncia e Lei de Acesso à Informação (LAI);
 * 4. Auditar a divisão de responsabilidades entre poder concedente e concessionárias privadas.
 *
 * ═══ FONTES OFICIAIS DE DADOS ═══
 * - SISNAMA (Sistema Nacional do Meio Ambiente / Lei Federal 6.938/1981);
 * - SNIS (Sistema Nacional de Informações sobre Saneamento) e ANA (Agência Nacional de Águas);
 * - ANEEL (Agência Nacional de Energia Elétrica) e ONS (Operador Nacional do Sistema);
 * - Diários Oficiais da União e dos 26 Estados e Distrito Federal.
 *
 * ═══ DECISÕES DE ARQUITETURA E REGRA DAS CINCO COISAS (AGENTS.md §8) ═══
 * Este módulo é puro em TypeScript e implementa os requisitos obrigatórios para páginas de grandes dados:
 * 1. Gráficos/Distribuições: Fornece agregados prontos para visualização vetorial em SVG/CSS;
 * 2. Cartões de Topo: Totais gerais, cobertura de UFs e contagem de sistemas informatizados;
 * 3. Planilha CSV (`exportarEcossistemaParaCsv`): Exportação do conjunto filtrado com delimitador
 *    ponto e vírgula (`;`), aspas escapadas e BOM UTF-8 (`\uFEFF`) para abertura nativa no Excel brasileiro;
 * 4. Filtro Multidimensional (`filtrarInstituicoes`): Busca textual por termos, categoria, região e UF;
 * 5. Ordenação e integridade dos registros públicos.
 */

import dadosBrutos from "@/data/ecossistema-ambiental-nacional.json";

/**
 * Categorias institucionais dos entes reguladores e prestadores de serviços.
 */
export type CategoriaInstituicao =
  | "Órgão Ambiental Estadual"
  | "Ministério Federal"
  | "Autarquia Federal"
  | "Empresa Pública"
  | "Concessionária de Água e Saneamento"
  | "Concessionária de Luz e Energia";

/**
 * Esferas jurídico-administrativas de atuação.
 */
export type EsferaInstituicao = "Estadual" | "Federal" | "Concessão / Mista";

/**
 * Macrorregiões geográficas brasileiras ou abrangência de âmbito nacional.
 */
export type RegiaoBrasil =
  | "Norte"
  | "Nordeste"
  | "Centro-Oeste"
  | "Sudeste"
  | "Sul"
  | "Nacional";

/**
 * Dados de contato institucional e canais de transparência pública.
 */
export interface ContatoInstitucional {
  /** E-mail oficial para contato e protocolo. */
  email: string;
  /** Telefone geral ou central telefônica institucional. */
  telefone: string;
  /** Endereço físico da sede principal. */
  endereco: string;
  /** URL do portal oficial na internet. */
  portalUrl: string;
  /** URL direta para o canal de ouvidoria, manifestações e pedidos via LAI. */
  ouvidoriaUrl: string;
}

/**
 * Registro completo de uma instituição no ecossistema regulatório.
 */
export interface InstituicaoEcossistema {
  /** Identificador único em padrão kebab-case (ex: "ibama", "semad-mg"). */
  id: string;
  /** Sigla canônica institucional (ex: "IBAMA", "FEAM", "COPASA"). */
  sigla: string;
  /** Razão social ou nome institucional por extenso. */
  nomeCompleto: string;
  /** Classificação quanto ao papel institucional. */
  categoria: CategoriaInstituicao;
  /** Esfera de controle governamental ou regime de concessão. */
  esfera: EsferaInstituicao;
  /** Sigla da Unidade Federativa de jurisdição ou "BR / Nacional". */
  uf: string;
  /** Macrorregião geográfica correspondente. */
  regiao: RegiaoBrasil;
  /** Resumo claro das atribuições legais e competências principais. */
  papelPrincipal: string;
  /** Relação de sistemas informatizados mantidos ou consultados pela entidade. */
  sistemasInformatizados: string[];
  /** Informações de contato e canais de acesso cidadão. */
  contatos: ContatoInstitucional;
}

/**
 * Critérios de filtragem aplicáveis sobre o acervo do ecossistema.
 */
export interface FiltrosEcossistema {
  /** Termo textual livre para busca em siglas, nomes, papéis e sistemas. */
  termo?: string;
  /** Categoria institucional selecionada ou "Todas". */
  categoria?: CategoriaInstituicao | "Todas";
  /** Região geográfica selecionada ou "Todas". */
  regiao?: RegiaoBrasil | "Todas";
  /** Esfera administrativa selecionada ou "Todas". */
  esfera?: EsferaInstituicao | "Todas";
  /** Sigla da UF selecionada ou "Todas". */
  uf?: string | "Todas";
}

/**
 * Métricas e agregados estatísticos consolidados do ecossistema nacional.
 */
export interface EstatisticasEcossistema {
  /** Total de instituições catalogadas no acervo. */
  totalGeral: number;
  /** Distribuição quantitativa por categoria institucional. */
  porCategoria: Record<CategoriaInstituicao, number>;
  /** Distribuição quantitativa por macrorregião geográfica. */
  porRegiao: Record<RegiaoBrasil, number>;
  /** Distribuição quantitativa por esfera jurídica. */
  porEsfera: Record<EsferaInstituicao, number>;
  /** Total de Unidades Federativas atendidas com órgãos mapeados. */
  totalUfsAtendidas: number;
  /** Relação ordenada das UFs contempladas. */
  ufsAtendidas: string[];
  /** Contagem somada de sistemas informatizados catalogados. */
  totalSistemasMapeados: number;
  /** Vetor estruturado para renderização direta de gráficos de categorias. */
  distribuicaoPorCategoriaArray: {
    categoria: CategoriaInstituicao;
    total: number;
    porcentagem: number;
  }[];
  /** Vetor estruturado para renderização direta de gráficos regionais. */
  distribuicaoPorRegiaoArray: {
    regiao: RegiaoBrasil;
    total: number;
    porcentagem: number;
  }[];
}

/** Relação canônica de todas as categorias de instituições suportadas. */
export const LISTA_CATEGORIAS: readonly CategoriaInstituicao[] = [
  "Órgão Ambiental Estadual",
  "Ministério Federal",
  "Autarquia Federal",
  "Empresa Pública",
  "Concessionária de Água e Saneamento",
  "Concessionária de Luz e Energia",
] as const;

/** Relação canônica de macrorregiões do território nacional. */
export const LISTA_REGIOES: readonly RegiaoBrasil[] = [
  "Norte",
  "Nordeste",
  "Centro-Oeste",
  "Sudeste",
  "Sul",
  "Nacional",
] as const;

/** Relação canônica de esferas federativas e regimes de prestação. */
export const LISTA_ESFERAS: readonly EsferaInstituicao[] = [
  "Estadual",
  "Federal",
  "Concessão / Mista",
] as const;

/** Conjunto integral de instituições carregadas do arquivo de dados. */
export const ECOSSISTEMA_NACIONAL: InstituicaoEcossistema[] =
  dadosBrutos as InstituicaoEcossistema[];

/**
 * Retorna todas as instituições catalogadas no ecossistema ambiental e regulatório brasileiro.
 *
 * @returns Vetor de objetos `InstituicaoEcossistema`.
 */
export function obterTodasInstituicoes(): InstituicaoEcossistema[] {
  return ECOSSISTEMA_NACIONAL;
}

/**
 * Localiza uma instituição específica pelo seu ID único em formato kebab-case.
 *
 * @param id Identificador canônico da entidade (ex: "ibama", "cetesb-sp").
 * @returns A instituição localizada ou `undefined` se inexistente.
 */
export function obterInstituicaoPorId(
  id: string
): InstituicaoEcossistema | undefined {
  return ECOSSISTEMA_NACIONAL.find((item) => item.id === id);
}

/**
 * Filtra instituições pela categoria funcional/institucional.
 *
 * @param categoria Categoria desejada (ex: "Órgão Ambiental Estadual", "Autarquia Federal").
 * @returns Vetor de instituições pertencentes à respectiva categoria.
 */
export function obterInstituicoesPorCategoria(
  categoria: CategoriaInstituicao
): InstituicaoEcossistema[] {
  return ECOSSISTEMA_NACIONAL.filter((item) => item.categoria === categoria);
}

/**
 * Filtra instituições pela macrorregião geográfica brasileira ou âmbito Nacional.
 *
 * @param regiao Macrorregião desejada (ex: "Sudeste", "Norte", "Nacional").
 * @returns Vetor de instituições localizadas na respectiva região.
 */
export function obterInstituicoesPorRegiao(
  regiao: RegiaoBrasil
): InstituicaoEcossistema[] {
  return ECOSSISTEMA_NACIONAL.filter((item) => item.regiao === regiao);
}

/**
 * Filtra instituições pela esfera jurídica ("Estadual", "Federal" ou "Concessão / Mista").
 *
 * @param esfera Esfera desejada.
 * @returns Vetor de instituições correspondentes.
 */
export function obterInstituicoesPorEsfera(
  esfera: EsferaInstituicao
): InstituicaoEcossistema[] {
  return ECOSSISTEMA_NACIONAL.filter((item) => item.esfera === esfera);
}

/**
 * Filtra instituições pela Unidade da Federação correspondente (ex: "MG", "SP", "PA").
 *
 * @param uf Sigla da Unidade Federativa.
 * @returns Vetor de instituições operando na UF informada.
 */
export function obterInstituicoesPorUf(uf: string): InstituicaoEcossistema[] {
  const ufNormalizada = uf.trim().toUpperCase();
  return ECOSSISTEMA_NACIONAL.filter(
    (item) => item.uf.toUpperCase() === ufNormalizada
  );
}

/**
 * Aplica filtro composto sobre o acervo combinando múltiplos critérios simultâneos.
 *
 * ═══ BUSCA MULTIDIMENSIONAL ═══
 * Permite filtrar simultaneamente por termo livre, categoria, região, esfera e UF.
 * O termo de busca textual é testado de forma insensível a maiúsculas contra:
 * 1. Sigla institucional;
 * 2. Nome completo por extenso;
 * 3. Papel regulatório / competência principal;
 * 4. Sigla da UF;
 * 5. Nomes de sistemas informatizados mantidos pelo órgão (ex: busca por "Sinaflor" ou "CAR").
 *
 * @param filtros Objeto com os critérios de seleção configurados pelo cidadão.
 * @returns Vetor de instituições que atendem cumulativamente a todos os critérios ativos.
 */
export function filtrarInstituicoes(
  filtros: FiltrosEcossistema
): InstituicaoEcossistema[] {
  const { termo, categoria, regiao, esfera, uf } = filtros;
  const termoLimpo = termo?.trim().toLowerCase();

  return ECOSSISTEMA_NACIONAL.filter((inst) => {
    if (categoria && categoria !== "Todas" && inst.categoria !== categoria) {
      return false;
    }
    if (regiao && regiao !== "Todas" && inst.regiao !== regiao) {
      return false;
    }
    if (esfera && esfera !== "Todas" && inst.esfera !== esfera) {
      return false;
    }
    if (uf && uf !== "Todas" && inst.uf !== uf) {
      return false;
    }

    if (termoLimpo) {
      const emSigla = inst.sigla.toLowerCase().includes(termoLimpo);
      const emNome = inst.nomeCompleto.toLowerCase().includes(termoLimpo);
      const emPapel = inst.papelPrincipal.toLowerCase().includes(termoLimpo);
      const emUf = inst.uf.toLowerCase().includes(termoLimpo);
      const emSistemas = inst.sistemasInformatizados.some((s) =>
        s.toLowerCase().includes(termoLimpo)
      );

      if (!emSigla && !emNome && !emPapel && !emUf && !emSistemas) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Calcula os agregados quantitativos e distribuições percentuais do ecossistema.
 *
 * Realiza uma única varredura O(N) para consolidar:
 * - Contagens por categoria, macrorregião e esfera;
 * - Conjunto de UFs atendidas;
 * - Total de sistemas de tecnologia públicos mapeados;
 * - Arrays estruturados para construção de gráficos CSS/SVG sem bibliotecas externas.
 *
 * @returns Objeto `EstatisticasEcossistema` consolidado.
 */
export function obterEstatisticasEcossistema(): EstatisticasEcossistema {
  const totalGeral = ECOSSISTEMA_NACIONAL.length;

  const porCategoria: Record<CategoriaInstituicao, number> = {
    "Órgão Ambiental Estadual": 0,
    "Ministério Federal": 0,
    "Autarquia Federal": 0,
    "Empresa Pública": 0,
    "Concessionária de Água e Saneamento": 0,
    "Concessionária de Luz e Energia": 0,
  };

  const porRegiao: Record<RegiaoBrasil, number> = {
    Norte: 0,
    Nordeste: 0,
    "Centro-Oeste": 0,
    Sudeste: 0,
    Sul: 0,
    Nacional: 0,
  };

  const porEsfera: Record<EsferaInstituicao, number> = {
    Estadual: 0,
    Federal: 0,
    "Concessão / Mista": 0,
  };

  const ufsSet = new Set<string>();
  let totalSistemasMapeados = 0;

  for (const inst of ECOSSISTEMA_NACIONAL) {
    porCategoria[inst.categoria] = (porCategoria[inst.categoria] || 0) + 1;
    porRegiao[inst.regiao] = (porRegiao[inst.regiao] || 0) + 1;
    porEsfera[inst.esfera] = (porEsfera[inst.esfera] || 0) + 1;
    if (inst.uf !== "BR / Nacional") {
      ufsSet.add(inst.uf);
    }
    totalSistemasMapeados += inst.sistemasInformatizados.length;
  }

  const distribuicaoPorCategoriaArray = LISTA_CATEGORIAS.map((cat) => ({
    categoria: cat,
    total: porCategoria[cat],
    porcentagem: totalGeral > 0 ? (porCategoria[cat] / totalGeral) * 100 : 0,
  }));

  const distribuicaoPorRegiaoArray = LISTA_REGIOES.map((reg) => ({
    regiao: reg,
    total: porRegiao[reg],
    porcentagem: totalGeral > 0 ? (porRegiao[reg] / totalGeral) * 100 : 0,
  }));

  const ufsAtendidas = Array.from(ufsSet).sort();

  return {
    totalGeral,
    porCategoria,
    porRegiao,
    porEsfera,
    totalUfsAtendidas: ufsAtendidas.length,
    ufsAtendidas,
    totalSistemasMapeados,
    distribuicaoPorCategoriaArray,
    distribuicaoPorRegiaoArray,
  };
}

/**
 * Exporta a coleção de instituições filtradas para formato CSV auditável.
 *
 * ═══ CONFORMIDADE COM A REGRA EDITORIAL (AGENTS.md §8) ═══
 * - Delimitador ponto e vírgula (`;`): Padrão de planilhas no Brasil (evita conflito com vírgulas de texto);
 * - Caractere de escape: Aspas duplas repetidas (`""`) para proteger campos de texto;
 * - Marcação BOM UTF-8 (`\uFEFF`): Força programas como Microsoft Excel a interpretarem
 *   corretamente caracteres especiais e acentuação da língua portuguesa sem corromper o arquivo.
 *
 * @param撼instituicoes Vetor de instituições a serem serializadas em planilha.
 * @returns String contendo o arquivo CSV completo pronto para download.
 */
export function exportarEcossistemaParaCsv(
  instituicoes: InstituicaoEcossistema[]
): string {
  const colunas = [
    "ID",
    "Sigla",
    "Nome Completo",
    "Categoria",
    "Esfera",
    "UF",
    "Região",
    "Papel Principal",
    "Sistemas Informatizados",
    "E-mail",
    "Telefone",
    "Endereço",
    "Portal Oficial",
    "Ouvidoria / Transparência",
  ];

  const escapeCampo = (val: string | undefined | null) => {
    if (!val) return '""';
    const limpo = String(val).replace(/"/g, '""');
    return `"${limpo}"`;
  };

  const linhas = instituicoes.map((inst) => [
    escapeCampo(inst.id),
    escapeCampo(inst.sigla),
    escapeCampo(inst.nomeCompleto),
    escapeCampo(inst.categoria),
    escapeCampo(inst.esfera),
    escapeCampo(inst.uf),
    escapeCampo(inst.regiao),
    escapeCampo(inst.papelPrincipal),
    escapeCampo(inst.sistemasInformatizados.join(", ")),
    escapeCampo(inst.contatos.email),
    escapeCampo(inst.contatos.telefone),
    escapeCampo(inst.contatos.endereco),
    escapeCampo(inst.contatos.portalUrl),
    escapeCampo(inst.contatos.ouvidoriaUrl),
  ]);

  const csvCabecalho = colunas.map((c) => `"${c}"`).join(";");
  const csvCorpo = linhas.map((linha) => linha.join(";")).join("\r\n");

  // Injeção do Byte Order Mark (BOM) UTF-8 (\uFEFF) para garantir abertura límpida no Excel brasileiro
  return `\uFEFF${csvCabecalho}\r\n${csvCorpo}\r\n`;
}
