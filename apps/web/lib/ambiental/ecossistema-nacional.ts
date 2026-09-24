/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ECOSSISTEMA REGULATÓRIO, AMBIENTAL E DE CONCESSIONÁRIAS DO BRASIL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Catálogo analítico e institucional consolidado:
 * - 27 Órgãos Ambientais Estaduais (OEMAs cobrindo todas as UFs da federação)
 * - Ministérios Federais estratégicos (MMA, MME, MIDR)
 * - Autarquias e Agências Reguladoras Federais (IBAMA, ICMBio, ANA, ANEEL, ANM, ANP, FUNAI, INCRA, CPRM/SGB)
 * - Empresas Públicas e Sociedades de Economia Mista (Petrobras, Furnas, CHESF, Eletronorte, Eletrobras, Itaipu, Codevasf, Embrapa)
 * - Principais Concessionárias de Água e Saneamento
 * - Principais Concessionárias de Luz e Energia Elétrica
 *
 * Módulo puro em TypeScript conforme as diretrizes do portal Controle Popular e AGENTS.md.
 */

import dadosBrutos from "@/data/ecossistema-ambiental-nacional.json";

export type CategoriaInstituicao =
  | "Órgão Ambiental Estadual"
  | "Ministério Federal"
  | "Autarquia Federal"
  | "Empresa Pública"
  | "Concessionária de Água e Saneamento"
  | "Concessionária de Luz e Energia";

export type EsferaInstituicao = "Estadual" | "Federal" | "Concessão / Mista";

export type RegiaoBrasil =
  | "Norte"
  | "Nordeste"
  | "Centro-Oeste"
  | "Sudeste"
  | "Sul"
  | "Nacional";

export interface ContatoInstitucional {
  email: string;
  telefone: string;
  endereco: string;
  portalUrl: string;
  ouvidoriaUrl: string;
}

export interface InstituicaoEcossistema {
  id: string;
  sigla: string;
  nomeCompleto: string;
  categoria: CategoriaInstituicao;
  esfera: EsferaInstituicao;
  uf: string;
  regiao: RegiaoBrasil;
  papelPrincipal: string;
  sistemasInformatizados: string[];
  contatos: ContatoInstitucional;
}

export interface FiltrosEcossistema {
  termo?: string;
  categoria?: CategoriaInstituicao | "Todas";
  regiao?: RegiaoBrasil | "Todas";
  esfera?: EsferaInstituicao | "Todas";
  uf?: string | "Todas";
}

export interface EstatisticasEcossistema {
  totalGeral: number;
  porCategoria: Record<CategoriaInstituicao, number>;
  porRegiao: Record<RegiaoBrasil, number>;
  porEsfera: Record<EsferaInstituicao, number>;
  totalUfsAtendidas: number;
  ufsAtendidas: string[];
  totalSistemasMapeados: number;
  distribuicaoPorCategoriaArray: {
    categoria: CategoriaInstituicao;
    total: number;
    porcentagem: number;
  }[];
  distribuicaoPorRegiaoArray: {
    regiao: RegiaoBrasil;
    total: number;
    porcentagem: number;
  }[];
}

export const LISTA_CATEGORIAS: readonly CategoriaInstituicao[] = [
  "Órgão Ambiental Estadual",
  "Ministério Federal",
  "Autarquia Federal",
  "Empresa Pública",
  "Concessionária de Água e Saneamento",
  "Concessionária de Luz e Energia",
] as const;

export const LISTA_REGIOES: readonly RegiaoBrasil[] = [
  "Norte",
  "Nordeste",
  "Centro-Oeste",
  "Sudeste",
  "Sul",
  "Nacional",
] as const;

export const LISTA_ESFERAS: readonly EsferaInstituicao[] = [
  "Estadual",
  "Federal",
  "Concessão / Mista",
] as const;

export const ECOSSISTEMA_NACIONAL: InstituicaoEcossistema[] =
  dadosBrutos as InstituicaoEcossistema[];

/**
 * Retorna todas as instituições mapeadas no acervo.
 */
export function obterTodasInstituicoes(): InstituicaoEcossistema[] {
  return ECOSSISTEMA_NACIONAL;
}

/**
 * Busca uma instituição pelo ID único kebab-case.
 */
export function obterInstituicaoPorId(
  id: string
): InstituicaoEcossistema | undefined {
  return ECOSSISTEMA_NACIONAL.find((item) => item.id === id);
}

/**
 * Filtra instituições por categoria regulatória/institucional.
 */
export function obterInstituicoesPorCategoria(
  categoria: CategoriaInstituicao
): InstituicaoEcossistema[] {
  return ECOSSISTEMA_NACIONAL.filter((item) => item.categoria === categoria);
}

/**
 * Filtra instituições pela macrorregião brasileira ou âmbito Nacional.
 */
export function obterInstituicoesPorRegiao(
  regiao: RegiaoBrasil
): InstituicaoEcossistema[] {
  return ECOSSISTEMA_NACIONAL.filter((item) => item.regiao === regiao);
}

/**
 * Filtra instituições pela esfera de atuação.
 */
export function obterInstituicoesPorEsfera(
  esfera: EsferaInstituicao
): InstituicaoEcossistema[] {
  return ECOSSISTEMA_NACIONAL.filter((item) => item.esfera === esfera);
}

/**
 * Filtra instituições pela Unidade da Federação ou "BR / Nacional".
 */
export function obterInstituicoesPorUf(uf: string): InstituicaoEcossistema[] {
  const ufNormalizada = uf.trim().toUpperCase();
  return ECOSSISTEMA_NACIONAL.filter(
    (item) => item.uf.toUpperCase() === ufNormalizada
  );
}

/**
 * Filtro composto com busca textual, categoria, região, esfera e UF.
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
 * Calcula os agregados e estatísticas consolidadas do ecossistema.
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
 * Exporta a lista para CSV (Regra das 5 coisas: delimitador ;, BOM UTF-8).
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

  // BOM UTF-8 (\uFEFF) para garantir correta abertura no Excel brasileiro
  return `\uFEFF${csvCabecalho}\r\n${csvCorpo}\r\n`;
}
