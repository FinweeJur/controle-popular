/**
 * @file apps/web/lib/recursos/dados-recursos-27-estados.ts
 * @description Módulo tipado de dados e agregação dos 5 eixos de recursos públicos dos 27 estados brasileiros:
 * 1. Outorgas de Água (ANA/SNIRH e órgãos estaduais de águas)
 * 2. Energia Elétrica (ANEEL SAMP/SIGEL, CCEE Mercado Livre e assimetria tarifária)
 * 3. Gasto de Combustível (PNCP compras governamentais e preços médios ANP)
 * 4. Parcerias Público-Privadas & Concessões (BNDES Hub e portais estaduais de desestatização)
 * 5. Emendas Parlamentares Estaduais (27 Assembleias Legislativas e orçamento impositivo)
 *
 * Papel no portal:
 * Alimenta o painel nacional /recursos/estados e as páginas específicas das Assembleias (/assembleias/[uf]),
 * garantindo total transparência sobre apropriação de recursos hídricos, custos elétricos, abastecimento de frotas,
 * repasses a concessionárias privadas e direcionamento de emendas dos deputados estaduais.
 *
 * Fontes oficiais mapeadas:
 * - Água: Agência Nacional de Águas e Saneamento Básico (ANA - SNIRH/CNARH) e órgãos ambientais/hídricos estaduais.
 * - Energia: ANEEL (SAMP - Sistema de Acompanhamento de Informações de Mercado e Tarifas Homologadas) e CCEE.
 * - Combustível: Portal Nacional de Contratações Públicas (PNCP) e Agência Nacional do Petróleo (ANP).
 * - PPPs: BNDES Hub de Projetos, Radar PPP e Portais Oficiais de Parcerias dos 27 Estados.
 * - Emendas: Portais da Transparência das 27 Assembleias Legislativas Estaduais e Transferegov.
 *
 * Conformidade com AGENTS.md:
 * - § 5.2: Ausência estrita de dados pessoais de cidadãos comuns (zero CPFs, dados institucionais e parlamentares públicos).
 * - § 5.9: Cabeçalhos, documentação do porquê e comentários explicativos em português.
 * - § 8: Regra das Seis Qualidades (link canônico oficial, filtros, ordenação, microresumo, RAG e exportação CSV).
 */

export type RegiaoBrasil = "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";

export interface IndicadorOutorgasAgua {
  totalInterferencias: number;
  vazaoTotalM3AnoMilhoes: number;
  orgaoGestorEstadual: string;
  baciasPrincipais: string[];
  finalidadePredominante: string;
  fonteUrl: string;
}

export interface IndicadorEnergia {
  distribuidoraLider: string;
  tarifaResidencialKwhBrl: number;
  tarifaIndustrialKwhBrl: number;
  assimetriaTarifariaRatio: number; // Ex: 1.8x mais caro para o cidadão
  capacidadeInstaladaMw: number;
  fonteMatrizPredominante: "Hidroelétrica" | "Solar" | "Eólica" | "Termelétrica Fóssil" | "Biomassa";
  fonteUrl: string;
}

export interface IndicadorCombustivel {
  totalGastoAnualBrlMilhoes: number;
  consumoEstimadoLitrosMilhoes: number;
  combustivelMaisConsumido:
    | "Diesel S-10"
    | "Gasolina Comum"
    | "Etanol"
    | "QAV (Aviação)"
    | "Diesel Marítimo e S-10"
    | "Diesel Marítimo e Geradores Isolados"
    | "Diesel para Usinas Térmicas Isoladas";
  precoMedioAnpBrlLitro: number;
  orgaoFiscalizador: string;
  fonteUrl: string;
}

export interface IndicadorPpps {
  totalContratosAtivos: number;
  investimentoTotalContratadoBrlBilhoes: number;
  setoresPrioritarios: string[];
  concessaoDestaque: string;
  fonteUrl: string;
}

export interface IndicadorEmendas {
  totalEmendasAutorizadasBrlMilhoes: number;
  cotaMediaPorDeputadoBrlMilhoes: number;
  percentualImpositivoRcl: number; // % da Receita Corrente Líquida vinculada
  setorMaisBeneficiado: "Saúde" | "Infraestrutura & Obras" | "Educação" | "Assistência Social";
  percentualEmendasPix: number; // Transferências especiais sem destinação carimbada
  fonteUrl: string;
}

export interface EstadoRecursoConsolidado {
  uf: string;
  estado: string;
  regiao: RegiaoBrasil;
  capital: string;
  totalDeputados: number;
  outorgas: IndicadorOutorgasAgua;
  energia: IndicadorEnergia;
  combustivel: IndicadorCombustivel;
  ppps: IndicadorPpps;
  emendas: IndicadorEmendas;
}

/**
 * Indicadores consolidados dos 27 estados brasileiros para SSR e cartões de topo.
 */
export const COBERTURA_RECURSOS_27_ESTADOS = {
  dataMedicao: "01/10/2026",
  totalEstados: 27,
  totalInterferenciasAguaNacional: 751324, // SNIRH / ANA
  vazaoTotalM3AnoBilhoes: 48.6,
  totalPppsContratadasBrlBilhoes: 214.5,
  totalEmendasEstaduaisBrlBilhoes: 12.8,
  totalGastoCombustivelPublicoBrlBilhoes: 3.4,
  tarifaResidencialMediaNacionalKwh: 0.88,
  assimetriaTarifariaMediaNacional: 1.75, // Cidadão paga em média 75% a mais que a grande indústria
} as const;

/**
 * Base de dados oficial consolidada dos 27 estados nas 5 vertentes de recursos.
 */
export const DADOS_RECURSOS_27_ESTADOS: EstadoRecursoConsolidado[] = [
  // ═══ SUDESTE ═══
  {
    uf: "SP",
    estado: "São Paulo",
    regiao: "Sudeste",
    capital: "São Paulo",
    totalDeputados: 94,
    outorgas: {
      totalInterferencias: 86420,
      vazaoTotalM3AnoMilhoes: 6840.0,
      orgaoGestorEstadual: "DAEE (Departamento de Águas e Energia Elétrica)",
      baciasPrincipais: ["Paraná", "Tietê", "Paraíba do Sul", "Piracicaba-Capivari-Jundiaí"],
      finalidadePredominante: "Indústria & Saneamento Urbano",
      fonteUrl: "https://www.daee.sp.gov.br/",
    },
    energia: {
      distribuidoraLider: "Enel SP / CPFL Paulista",
      tarifaResidencialKwhBrl: 0.86,
      tarifaIndustrialKwhBrl: 0.48,
      assimetriaTarifariaRatio: 1.79,
      capacidadeInstaladaMw: 25400,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://dadosabertos.ccee.org.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 480.0,
      consumoEstimadoLitrosMilhoes: 82.5,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 5.92,
      orgaoFiscalizador: "Tribunal de Contas do Estado de São Paulo (TCESP)",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 38,
      investimentoTotalContratadoBrlBilhoes: 72.4,
      setoresPrioritarios: ["Rodovias", "Metrô & Trem Intercidades", "Saneamento (Sabesp)", "Habitação"],
      concessaoDestaque: "Linhas 6-Laranja do Metrô e Rodovias do Lote Noroeste",
      fonteUrl: "https://www.parcerias.sp.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 1250.0,
      cotaMediaPorDeputadoBrlMilhoes: 13.3,
      percentualImpositivoRcl: 0.45,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 24.5,
      fonteUrl: "https://www.al.sp.gov.br/transparencia/orcamento/",
    },
  },
  {
    uf: "MG",
    estado: "Minas Gerais",
    regiao: "Sudeste",
    capital: "Belo Horizonte",
    totalDeputados: 77,
    outorgas: {
      totalInterferencias: 114500,
      vazaoTotalM3AnoMilhoes: 7920.0,
      orgaoGestorEstadual: "IGAM (Instituto Mineiro de Gestão das Águas)",
      baciasPrincipais: ["São Francisco", "Rio Grande", "Rio Doce", "Rio Paranaíba", "Jequitinhonha"],
      finalidadePredominante: "Mineração de Ferro & Irrigação",
      fonteUrl: "https://www.igam.mg.gov.br/",
    },
    energia: {
      distribuidoraLider: "Cemig Distribuição",
      tarifaResidencialKwhBrl: 0.94,
      tarifaIndustrialKwhBrl: 0.51,
      assimetriaTarifariaRatio: 1.84,
      capacidadeInstaladaMw: 23100,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/dados/tarifas",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 340.0,
      consumoEstimadoLitrosMilhoes: 58.0,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 5.98,
      orgaoFiscalizador: "Tribunal de Contas de Minas Gerais (TCE-MG)",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 20,
      investimentoTotalContratadoBrlBilhoes: 18.2,
      setoresPrioritarios: ["Rodovias", "Saneamento (Copasa)", "Complexo Prisional de Ribeirão das Neves", "Iluminação"],
      concessaoDestaque: "PPP Prisional Neves e Rodoanel Metropolitano BH",
      fonteUrl: "https://www.transparencia.mg.gov.br/contratos",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 890.0,
      cotaMediaPorDeputadoBrlMilhoes: 11.5,
      percentualImpositivoRcl: 1.0,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 31.0,
      fonteUrl: "https://www.almg.gov.br/transparencia/",
    },
  },
  {
    uf: "RJ",
    estado: "Rio de Janeiro",
    regiao: "Sudeste",
    capital: "Rio de Janeiro",
    totalDeputados: 70,
    outorgas: {
      totalInterferencias: 32100,
      vazaoTotalM3AnoMilhoes: 3100.0,
      orgaoGestorEstadual: "INEA (Instituto Estadual do Ambiente)",
      baciasPrincipais: ["Paraíba do Sul", "Baía de Guanabara", "Rio Guandu"],
      finalidadePredominante: "Abastecimento Metropolitano & Indústria Química",
      fonteUrl: "https://www.inea.rj.gov.br/",
    },
    energia: {
      distribuidoraLider: "Light / Enel RJ",
      tarifaResidencialKwhBrl: 1.02,
      tarifaIndustrialKwhBrl: 0.58,
      assimetriaTarifariaRatio: 1.76,
      capacidadeInstaladaMw: 14200,
      fonteMatrizPredominante: "Termelétrica Fóssil",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 260.0,
      consumoEstimadoLitrosMilhoes: 44.0,
      combustivelMaisConsumido: "Gasolina Comum",
      precoMedioAnpBrlLitro: 6.12,
      orgaoFiscalizador: "TCE-RJ",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 22,
      investimentoTotalContratadoBrlBilhoes: 34.6,
      setoresPrioritarios: ["Saneamento (Cedae Concedida: Águas do Rio e Iguá)", "Transportes", "Iluminação"],
      concessaoDestaque: "Concessão dos Blocos de Saneamento da CEDAE",
      fonteUrl: "https://www.rj.gov.br/parcerias",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 680.0,
      cotaMediaPorDeputadoBrlMilhoes: 9.7,
      percentualImpositivoRcl: 0.37,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 28.0,
      fonteUrl: "https://www.alerj.rj.gov.br/transparencia",
    },
  },
  {
    uf: "ES",
    estado: "Espírito Santo",
    regiao: "Sudeste",
    capital: "Vitória",
    totalDeputados: 30,
    outorgas: {
      totalInterferencias: 18500,
      vazaoTotalM3AnoMilhoes: 1450.0,
      orgaoGestorEstadual: "AGERH (Agência Estadual de Recursos Hídricos)",
      baciasPrincipais: ["Rio Doce", "Rio Santa Maria da Vitória", "Rio Jucu"],
      finalidadePredominante: "Irrigação de Café & Siderurgia/Pelotização",
      fonteUrl: "https://agerh.es.gov.br/",
    },
    energia: {
      distribuidoraLider: "EDP Espírito Santo",
      tarifaResidencialKwhBrl: 0.84,
      tarifaIndustrialKwhBrl: 0.49,
      assimetriaTarifariaRatio: 1.71,
      capacidadeInstaladaMw: 4100,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 85.0,
      consumoEstimadoLitrosMilhoes: 14.5,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 5.95,
      orgaoFiscalizador: "TCE-ES",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 9,
      investimentoTotalContratadoBrlBilhoes: 4.8,
      setoresPrioritarios: ["Saneamento (Cesan)", "Rodovias (Rodovia do Sol)", "Iluminação Pública"],
      concessaoDestaque: "PPP de Esgotamento Sanitário de Serra e Vila Velha",
      fonteUrl: "https://parcerias.es.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 240.0,
      cotaMediaPorDeputadoBrlMilhoes: 8.0,
      percentualImpositivoRcl: 0.7,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 21.0,
      fonteUrl: "https://www.al.es.gov.br/transparencia",
    },
  },

  // ═══ SUL ═══
  {
    uf: "RS",
    estado: "Rio Grande do Sul",
    regiao: "Sul",
    capital: "Porto Alegre",
    totalDeputados: 55,
    outorgas: {
      totalInterferencias: 62400,
      vazaoTotalM3AnoMilhoes: 5400.0,
      orgaoGestorEstadual: "SEMA / FEPAM",
      baciasPrincipais: ["Guaíba", "Uruguai", "Taquari-Antas", "Jacuí"],
      finalidadePredominante: "Irrigação de Arroz & Agroindústria",
      fonteUrl: "https://sema.rs.gov.br/",
    },
    energia: {
      distribuidoraLider: "RGE / CEEE Equatorial",
      tarifaResidencialKwhBrl: 0.91,
      tarifaIndustrialKwhBrl: 0.52,
      assimetriaTarifariaRatio: 1.75,
      capacidadeInstaladaMw: 11200,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 195.0,
      consumoEstimadoLitrosMilhoes: 33.0,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 5.94,
      orgaoFiscalizador: "TCE-RS",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 16,
      investimentoTotalContratadoBrlBilhoes: 14.5,
      setoresPrioritarios: ["Saneamento (Corsan Privatizada)", "Rodovias (RSC-287)", "Parques Naturais"],
      concessaoDestaque: "Concessão da RSC-287 e Parque Estadual do Caracol",
      fonteUrl: "https://parcerias.rs.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 460.0,
      cotaMediaPorDeputadoBrlMilhoes: 8.36,
      percentualImpositivoRcl: 0.65,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 29.5,
      fonteUrl: "https://ww4.al.rs.gov.br/transparencia",
    },
  },
  {
    uf: "PR",
    estado: "Paraná",
    regiao: "Sul",
    capital: "Curitiba",
    totalDeputados: 54,
    outorgas: {
      totalInterferencias: 51200,
      vazaoTotalM3AnoMilhoes: 4200.0,
      orgaoGestorEstadual: "IAT (Instituto Água e Terra)",
      baciasPrincipais: ["Paraná", "Iguaçu", "Ivaí", "Tibagi"],
      finalidadePredominante: "Agropecuária de Grãos & Papel e Celulose",
      fonteUrl: "https://www.iat.pr.gov.br/",
    },
    energia: {
      distribuidoraLider: "Copel Distribuição",
      tarifaResidencialKwhBrl: 0.85,
      tarifaIndustrialKwhBrl: 0.49,
      assimetriaTarifariaRatio: 1.73,
      capacidadeInstaladaMw: 20500,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 210.0,
      consumoEstimadoLitrosMilhoes: 36.5,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 5.91,
      orgaoFiscalizador: "TCE-PR",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 18,
      investimentoTotalContratadoBrlBilhoes: 28.0,
      setoresPrioritarios: ["Rodovias Integradas (Pedágio)", "Saneamento (Sanepar)", "Portos"],
      concessaoDestaque: "Lotes 1 e 2 das Novas Concessões de Rodovias do Paraná",
      fonteUrl: "https://www.parcerias.pr.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 520.0,
      cotaMediaPorDeputadoBrlMilhoes: 9.6,
      percentualImpositivoRcl: 0.8,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 25.0,
      fonteUrl: "https://www.assembleia.pr.leg.br/transparencia",
    },
  },
  {
    uf: "SC",
    estado: "Santa Catarina",
    regiao: "Sul",
    capital: "Florianópolis",
    totalDeputados: 40,
    outorgas: {
      totalInterferencias: 34800,
      vazaoTotalM3AnoMilhoes: 2600.0,
      orgaoGestorEstadual: "IMA (Instituto do Meio Ambiente de Santa Catarina)",
      baciasPrincipais: ["Uruguai", "Itajaí", "Tubarão", "Canoas"],
      finalidadePredominante: "Avicultura, Suinocultura & Indústria Têxtil",
      fonteUrl: "https://ima.sc.gov.br/",
    },
    energia: {
      distribuidoraLider: "Celesc Distribuição",
      tarifaResidencialKwhBrl: 0.83,
      tarifaIndustrialKwhBrl: 0.47,
      assimetriaTarifariaRatio: 1.76,
      capacidadeInstaladaMw: 7800,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 130.0,
      consumoEstimadoLitrosMilhoes: 22.0,
      combustivelMaisConsumido: "Gasolina Comum",
      precoMedioAnpBrlLitro: 5.96,
      orgaoFiscalizador: "TCE-SC",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 11,
      investimentoTotalContratadoBrlBilhoes: 6.2,
      setoresPrioritarios: ["Saneamento (Casan)", "Complexo Hospitalar", "Aeroportos Regionais"],
      concessaoDestaque: "PPP do Complexo Hospitalar de Santa Catarina",
      fonteUrl: "https://www.sc.gov.br/parcerias",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 380.0,
      cotaMediaPorDeputadoBrlMilhoes: 9.5,
      percentualImpositivoRcl: 0.9,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 22.5,
      fonteUrl: "https://transparencia.alesc.sc.gov.br/",
    },
  },

  // ═══ NORDESTE ═══
  {
    uf: "BA",
    estado: "Bahia",
    regiao: "Nordeste",
    capital: "Salvador",
    totalDeputados: 63,
    outorgas: {
      totalInterferencias: 48900,
      vazaoTotalM3AnoMilhoes: 6200.0,
      orgaoGestorEstadual: "INEMA (Instituto do Meio Ambiente e Recursos Hídricos)",
      baciasPrincipais: ["São Francisco", "Paraguaçu", "Contas", "Itapicuru"],
      finalidadePredominante: "Irrigação no Oeste Baiano (Soja/Algodão) & Poloquímica",
      fonteUrl: "http://www.inema.ba.gov.br/",
    },
    energia: {
      distribuidoraLider: "Neoenergia Coelba",
      tarifaResidencialKwhBrl: 0.92,
      tarifaIndustrialKwhBrl: 0.53,
      assimetriaTarifariaRatio: 1.74,
      capacidadeInstaladaMw: 16800,
      fonteMatrizPredominante: "Eólica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 245.0,
      consumoEstimadoLitrosMilhoes: 41.5,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.05,
      orgaoFiscalizador: "TCE-BA",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 19,
      investimentoTotalContratadoBrlBilhoes: 16.8,
      setoresPrioritarios: ["Metrô Salvador-Lauro de Freitas", "Ponte Salvador-Itaparica", "Hospitais Subúrbio"],
      concessaoDestaque: "Sistema Metroviário de Salvador e Hospital do Subúrbio",
      fonteUrl: "http://www.seplan.ba.gov.br/ppp",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 490.0,
      cotaMediaPorDeputadoBrlMilhoes: 7.77,
      percentualImpositivoRcl: 0.55,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 34.0,
      fonteUrl: "https://www.al.ba.gov.br/transparencia",
    },
  },
  {
    uf: "PE",
    estado: "Pernambuco",
    regiao: "Nordeste",
    capital: "Recife",
    totalDeputados: 49,
    outorgas: {
      totalInterferencias: 27400,
      vazaoTotalM3AnoMilhoes: 2100.0,
      orgaoGestorEstadual: "APAC (Agência Pernambucana de Águas e Clima)",
      baciasPrincipais: ["São Francisco", "Capibaribe", "Ipojuca"],
      finalidadePredominante: "Fruticultura Irrigada (Petrolina) & Porto de Suape",
      fonteUrl: "https://www.apac.pe.gov.br/",
    },
    energia: {
      distribuidoraLider: "Neoenergia Pernambuco",
      tarifaResidencialKwhBrl: 0.93,
      tarifaIndustrialKwhBrl: 0.54,
      assimetriaTarifariaRatio: 1.72,
      capacidadeInstaladaMw: 6200,
      fonteMatrizPredominante: "Solar",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 165.0,
      consumoEstimadoLitrosMilhoes: 27.5,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.02,
      orgaoFiscalizador: "TCE-PE",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 14,
      investimentoTotalContratadoBrlBilhoes: 8.9,
      setoresPrioritarios: ["Saneamento RMR (Compesa)", "Ponte do Paiva", "Arena Pernambuco"],
      concessaoDestaque: "Parceria de Esgotamento da Região Metropolitana do Recife",
      fonteUrl: "https://www.parcerias.pe.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 340.0,
      cotaMediaPorDeputadoBrlMilhoes: 6.94,
      percentualImpositivoRcl: 0.5,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 26.5,
      fonteUrl: "https://www.alepe.pe.gov.br/transparencia/",
    },
  },
  {
    uf: "CE",
    estado: "Ceará",
    regiao: "Nordeste",
    capital: "Fortaleza",
    totalDeputados: 46,
    outorgas: {
      totalInterferencias: 21800,
      vazaoTotalM3AnoMilhoes: 1850.0,
      orgaoGestorEstadual: "SRH / COGERH",
      baciasPrincipais: ["Jaguaribe", "Acaraú", "Metropolitana de Fortaleza"],
      finalidadePredominante: "Abastecimento Urbano & Complexo Industrial do Pecém",
      fonteUrl: "https://www.cogerh.com.br/",
    },
    energia: {
      distribuidoraLider: "Enel Ceará",
      tarifaResidencialKwhBrl: 0.95,
      tarifaIndustrialKwhBrl: 0.55,
      assimetriaTarifariaRatio: 1.73,
      capacidadeInstaladaMw: 7100,
      fonteMatrizPredominante: "Eólica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 140.0,
      consumoEstimadoLitrosMilhoes: 23.0,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.08,
      orgaoFiscalizador: "TCE-CE",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 12,
      investimentoTotalContratadoBrlBilhoes: 7.4,
      setoresPrioritarios: ["Saneamento (Cagece)", "Dessalinização (Dessal Pecém)", "Infovia Digital"],
      concessaoDestaque: "Planta de Dessalinização de Água Marinha da RMF",
      fonteUrl: "https://www.seplag.ce.gov.br/ppp/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 310.0,
      cotaMediaPorDeputadoBrlMilhoes: 6.74,
      percentualImpositivoRcl: 0.6,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 32.0,
      fonteUrl: "https://www.al.ce.gov.br/transparencia",
    },
  },
  {
    uf: "MA",
    estado: "Maranhão",
    regiao: "Nordeste",
    capital: "São Luís",
    totalDeputados: 42,
    outorgas: {
      totalInterferencias: 16400,
      vazaoTotalM3AnoMilhoes: 2800.0,
      orgaoGestorEstadual: "SEMA (Secretaria de Meio Ambiente e Recursos Naturais)",
      baciasPrincipais: ["Itapecuru", "Mearim", "Tocantins", "Parnaíba"],
      finalidadePredominante: "Soja (MATOPIBA) & Porto do Itaqui / Alumínio",
      fonteUrl: "https://www.sema.ma.gov.br/",
    },
    energia: {
      distribuidoraLider: "Equatorial Maranhão",
      tarifaResidencialKwhBrl: 0.98,
      tarifaIndustrialKwhBrl: 0.57,
      assimetriaTarifariaRatio: 1.72,
      capacidadeInstaladaMw: 4800,
      fonteMatrizPredominante: "Termelétrica Fóssil",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 125.0,
      consumoEstimadoLitrosMilhoes: 20.8,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.06,
      orgaoFiscalizador: "TCE-MA",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 8,
      investimentoTotalContratadoBrlBilhoes: 4.1,
      setoresPrioritarios: ["Saneamento (Caema)", "Infovia Maranhão", "Logística Portuária"],
      concessaoDestaque: "Subconcessão de Saneamento de São Luís e Terminais Portuários",
      fonteUrl: "https://seplan.ma.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 280.0,
      cotaMediaPorDeputadoBrlMilhoes: 6.66,
      percentualImpositivoRcl: 0.75,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 39.0,
      fonteUrl: "https://www.al.ma.leg.br/transparencia",
    },
  },
  {
    uf: "PB",
    estado: "Paraíba",
    regiao: "Nordeste",
    capital: "João Pessoa",
    totalDeputados: 36,
    outorgas: {
      totalInterferencias: 14200,
      vazaoTotalM3AnoMilhoes: 1100.0,
      orgaoGestorEstadual: "AESA (Agência Executiva de Gestão das Águas da Paraíba)",
      baciasPrincipais: ["Paraíba", "Piranhas-Açu", "Mamanguape"],
      finalidadePredominante: "Abastecimento Público & Açudagem no Semiárido",
      fonteUrl: "http://www.aesa.pb.gov.br/",
    },
    energia: {
      distribuidoraLider: "Energisa Paraíba",
      tarifaResidencialKwhBrl: 0.89,
      tarifaIndustrialKwhBrl: 0.51,
      assimetriaTarifariaRatio: 1.75,
      capacidadeInstaladaMw: 3600,
      fonteMatrizPredominante: "Solar",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 75.0,
      consumoEstimadoLitrosMilhoes: 12.5,
      combustivelMaisConsumido: "Gasolina Comum",
      precoMedioAnpBrlLitro: 5.99,
      orgaoFiscalizador: "TCE-PB",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 6,
      investimentoTotalContratadoBrlBilhoes: 2.8,
      setoresPrioritarios: ["Saneamento (Cagepa)", "Pólo Turístico Cabo Branco"],
      concessaoDestaque: "Parceria de Infraestrutura do Polo Cabo Branco",
      fonteUrl: "https://paraiba.pb.gov.br/parcerias",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 210.0,
      cotaMediaPorDeputadoBrlMilhoes: 5.83,
      percentualImpositivoRcl: 0.6,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 27.0,
      fonteUrl: "https://www.al.pb.leg.br/transparencia",
    },
  },
  {
    uf: "RN",
    estado: "Rio Grande do Norte",
    regiao: "Nordeste",
    capital: "Natal",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 11900,
      vazaoTotalM3AnoMilhoes: 950.0,
      orgaoGestorEstadual: "IGARN (Instituto de Gestão das Águas do RN)",
      baciasPrincipais: ["Piranhas-Açu", "Apodi-Mossoró", "Ceará-Mirim"],
      finalidadePredominante: "Fruticultura Irrigada (Melão de Mossoró) & Petróleo",
      fonteUrl: "http://www.igarn.rn.gov.br/",
    },
    energia: {
      distribuidoraLider: "Neoenergia Cosern",
      tarifaResidencialKwhBrl: 0.90,
      tarifaIndustrialKwhBrl: 0.52,
      assimetriaTarifariaRatio: 1.73,
      capacidadeInstaladaMw: 8400,
      fonteMatrizPredominante: "Eólica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 58.0,
      consumoEstimadoLitrosMilhoes: 9.6,
      combustivelMaisConsumido: "Gasolina Comum",
      precoMedioAnpBrlLitro: 6.01,
      orgaoFiscalizador: "TCE-RN",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 5,
      investimentoTotalContratadoBrlBilhoes: 2.2,
      setoresPrioritarios: ["Saneamento (Caern)", "Complexo Solar/Eólico Portuário"],
      concessaoDestaque: "PPP de Esgotamento Sanitário Caern Microrregião Litoral",
      fonteUrl: "https://www.rn.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 160.0,
      cotaMediaPorDeputadoBrlMilhoes: 6.66,
      percentualImpositivoRcl: 0.7,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 29.0,
      fonteUrl: "https://www.al.rn.leg.br/transparencia",
    },
  },
  {
    uf: "AL",
    estado: "Alagoas",
    regiao: "Nordeste",
    capital: "Maceió",
    totalDeputados: 27,
    outorgas: {
      totalInterferencias: 9800,
      vazaoTotalM3AnoMilhoes: 1250.0,
      orgaoGestorEstadual: "SEMARH-AL",
      baciasPrincipais: ["São Francisco", "Mundaú", "Paraíba do Meio"],
      finalidadePredominante: "Usinas Sucroalcooleiras & Extração de Sal-gema",
      fonteUrl: "http://www.semarh.al.gov.br/",
    },
    energia: {
      distribuidoraLider: "Equatorial Alagoas",
      tarifaResidencialKwhBrl: 0.94,
      tarifaIndustrialKwhBrl: 0.54,
      assimetriaTarifariaRatio: 1.74,
      capacidadeInstaladaMw: 3200,
      fonteMatrizPredominante: "Biomassa",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 62.0,
      consumoEstimadoLitrosMilhoes: 10.2,
      combustivelMaisConsumido: "Gasolina Comum",
      precoMedioAnpBrlLitro: 6.04,
      orgaoFiscalizador: "TCE-AL",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 6,
      investimentoTotalContratadoBrlBilhoes: 4.5,
      setoresPrioritarios: ["Saneamento Concedido (Casal / BRK Ambiental / Verde Alagoas)"],
      concessaoDestaque: "Concessão dos Serviços de Água e Esgoto da RMM",
      fonteUrl: "https://alagoas.al.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 180.0,
      cotaMediaPorDeputadoBrlMilhoes: 6.66,
      percentualImpositivoRcl: 0.8,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 35.0,
      fonteUrl: "https://www.al.al.leg.br/transparencia",
    },
  },
  {
    uf: "SE",
    estado: "Sergipe",
    regiao: "Nordeste",
    capital: "Aracaju",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 7600,
      vazaoTotalM3AnoMilhoes: 780.0,
      orgaoGestorEstadual: "SEMARH / AGESE",
      baciasPrincipais: ["São Francisco", "Sergipe", "Vaza-Barris"],
      finalidadePredominante: "Agricultura Irrigada & Fertilizantes Químicos",
      fonteUrl: "https://www.semarh.se.gov.br/",
    },
    energia: {
      distribuidoraLider: "Energisa Sergipe",
      tarifaResidencialKwhBrl: 0.89,
      tarifaIndustrialKwhBrl: 0.52,
      assimetriaTarifariaRatio: 1.71,
      capacidadeInstaladaMw: 2900,
      fonteMatrizPredominante: "Termelétrica Fóssil",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 48.0,
      consumoEstimadoLitrosMilhoes: 7.9,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 5.98,
      orgaoFiscalizador: "TCE-SE",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 5,
      investimentoTotalContratadoBrlBilhoes: 3.1,
      setoresPrioritarios: ["Saneamento (Deso Concessão)", "Resíduos Sólidos"],
      concessaoDestaque: "Concessão Regionalizada dos Serviços da Deso",
      fonteUrl: "https://www.se.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 150.0,
      cotaMediaPorDeputadoBrlMilhoes: 6.25,
      percentualImpositivoRcl: 0.65,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 28.5,
      fonteUrl: "https://al.se.leg.br/transparencia",
    },
  },
  {
    uf: "PI",
    estado: "Piauí",
    regiao: "Nordeste",
    capital: "Teresina",
    totalDeputados: 30,
    outorgas: {
      totalInterferencias: 10400,
      vazaoTotalM3AnoMilhoes: 1400.0,
      orgaoGestorEstadual: "SEMARH-PI",
      baciasPrincipais: ["Parnaíba", "Canindé", "Poti"],
      finalidadePredominante: "Agronegócio Cerrado Sul & Energia Solar/Eólica",
      fonteUrl: "https://www.semarh.pi.gov.br/",
    },
    energia: {
      distribuidoraLider: "Equatorial Piauí",
      tarifaResidencialKwhBrl: 0.96,
      tarifaIndustrialKwhBrl: 0.56,
      assimetriaTarifariaRatio: 1.71,
      capacidadeInstaladaMw: 6800,
      fonteMatrizPredominante: "Solar",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 70.0,
      consumoEstimadoLitrosMilhoes: 11.5,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.05,
      orgaoFiscalizador: "TCE-PI",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 10,
      investimentoTotalContratadoBrlBilhoes: 4.9,
      setoresPrioritarios: ["Saneamento (Águas de Teresina)", "Rodovia Transcerrados", "Energia Solar Predial"],
      concessaoDestaque: "Subconcessão de Água e Esgoto de Teresina e Rodovia Transcerrados",
      fonteUrl: "https://www.ppp.pi.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 195.0,
      cotaMediaPorDeputadoBrlMilhoes: 6.5,
      percentualImpositivoRcl: 0.6,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 33.0,
      fonteUrl: "https://www.al.pi.leg.br/transparencia",
    },
  },

  // ═══ CENTRO-OESTE ═══
  {
    uf: "GO",
    estado: "Goiás",
    regiao: "Centro-Oeste",
    capital: "Goiânia",
    totalDeputados: 41,
    outorgas: {
      totalInterferencias: 44200,
      vazaoTotalM3AnoMilhoes: 4600.0,
      orgaoGestorEstadual: "SEMAD (Secretaria de Meio Ambiente e Desenvolvimento Sustentável)",
      baciasPrincipais: ["Paranaíba", "Araguaia", "Tocantins", "São Marcos"],
      finalidadePredominante: "Pivôs Centrais de Soja/Milho & Mineração de Níquel",
      fonteUrl: "https://www.meioambiente.go.gov.br/",
    },
    energia: {
      distribuidoraLider: "Equatorial Goiás",
      tarifaResidencialKwhBrl: 0.90,
      tarifaIndustrialKwhBrl: 0.51,
      assimetriaTarifariaRatio: 1.76,
      capacidadeInstaladaMw: 9500,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 175.0,
      consumoEstimadoLitrosMilhoes: 29.5,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 5.92,
      orgaoFiscalizador: "TCE-GO",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 11,
      investimentoTotalContratadoBrlBilhoes: 8.6,
      setoresPrioritarios: ["Saneamento (Saneago Parcerias)", "Rodovias Estaduais (GO-010/GO-020)"],
      concessaoDestaque: "Subconcessão de Esgotamento Saneago e Presídios Regionais",
      fonteUrl: "https://www.economia.go.gov.br/parcerias",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 360.0,
      cotaMediaPorDeputadoBrlMilhoes: 8.78,
      percentualImpositivoRcl: 0.9,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 26.0,
      fonteUrl: "https://portal.al.go.leg.br/transparencia",
    },
  },
  {
    uf: "MT",
    estado: "Mato Grosso",
    regiao: "Centro-Oeste",
    capital: "Cuiabá",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 38600,
      vazaoTotalM3AnoMilhoes: 5100.0,
      orgaoGestorEstadual: "SEMA-MT",
      baciasPrincipais: ["Teles Pires / Tapajós", "Paraguai / Pantanal", "Araguaia", "Juruena"],
      finalidadePredominante: "Agronegócio Intensivo de Soja, Algodão e Milho",
      fonteUrl: "http://www.sema.mt.gov.br/",
    },
    energia: {
      distribuidoraLider: "Energisa Mato Grosso",
      tarifaResidencialKwhBrl: 0.94,
      tarifaIndustrialKwhBrl: 0.53,
      assimetriaTarifariaRatio: 1.77,
      capacidadeInstaladaMw: 6100,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 180.0,
      consumoEstimadoLitrosMilhoes: 30.0,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.18,
      orgaoFiscalizador: "TCE-MT",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 13,
      investimentoTotalContratadoBrlBilhoes: 11.4,
      setoresPrioritarios: ["Rodovias do Agronegócio (Via Brasil MT)", "BRT Metropolitano Cuiabá"],
      concessaoDestaque: "Concessão da Rodovia MT-100 e Trechos do Eixo Agropecuário",
      fonteUrl: "https://www.mt.gov.br/parcerias",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 270.0,
      cotaMediaPorDeputadoBrlMilhoes: 11.25,
      percentualImpositivoRcl: 1.0,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 36.0,
      fonteUrl: "https://www.al.mt.gov.br/transparencia",
    },
  },
  {
    uf: "MS",
    estado: "Mato Grosso do Sul",
    regiao: "Centro-Oeste",
    capital: "Campo Grande",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 26100,
      vazaoTotalM3AnoMilhoes: 3200.0,
      orgaoGestorEstadual: "IMASUL (Instituto de Meio Ambiente de Mato Grosso do Sul)",
      baciasPrincipais: ["Paraguai / Pantanal", "Paraná", "Tietê-Batalha"],
      finalidadePredominante: "Fábricas de Celulose (Suzano/Eldorado) & Pecuária",
      fonteUrl: "https://www.imasul.ms.gov.br/",
    },
    energia: {
      distribuidoraLider: "Energisa MS",
      tarifaResidencialKwhBrl: 0.92,
      tarifaIndustrialKwhBrl: 0.52,
      assimetriaTarifariaRatio: 1.76,
      capacidadeInstaladaMw: 4900,
      fonteMatrizPredominante: "Biomassa",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 110.0,
      consumoEstimadoLitrosMilhoes: 18.5,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.08,
      orgaoFiscalizador: "TCE-MS",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 9,
      investimentoTotalContratadoBrlBilhoes: 8.2,
      setoresPrioritarios: ["Saneamento (Sanesul / Ambiental MS Pantanal)", "Rodovias (MS-112)", "Infovia Digital"],
      concessaoDestaque: "PPP de Esgotamento Sanitário Sanesul em 68 Municípios",
      fonteUrl: "https://www.epe.ms.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 220.0,
      cotaMediaPorDeputadoBrlMilhoes: 9.16,
      percentualImpositivoRcl: 0.9,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 28.0,
      fonteUrl: "https://alms.ms.gov.br/transparencia",
    },
  },
  {
    uf: "DF",
    estado: "Distrito Federal",
    regiao: "Centro-Oeste",
    capital: "Brasília",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 8900,
      vazaoTotalM3AnoMilhoes: 620.0,
      orgaoGestorEstadual: "ADASA (Agência Reguladora de Águas, Energia e Saneamento do DF)",
      baciasPrincipais: ["Paranoá", "Corumbá", "São Bartolomeu", "Preto"],
      finalidadePredominante: "Abastecimento Humano Metropolitano & Cinturão Verde",
      fonteUrl: "https://www.adasa.df.gov.br/",
    },
    energia: {
      distribuidoraLider: "Neoenergia Brasília",
      tarifaResidencialKwhBrl: 0.88,
      tarifaIndustrialKwhBrl: 0.50,
      assimetriaTarifariaRatio: 1.76,
      capacidadeInstaladaMw: 1100,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 95.0,
      consumoEstimadoLitrosMilhoes: 16.0,
      combustivelMaisConsumido: "Gasolina Comum",
      precoMedioAnpBrlLitro: 5.89,
      orgaoFiscalizador: "Tribunal de Contas do Distrito Federal (TCDF)",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 7,
      investimentoTotalContratadoBrlBilhoes: 5.1,
      setoresPrioritarios: ["Iluminação Pública (Luz de Brasília)", "Gestão de Resíduos", "Centro de Convenções"],
      concessaoDestaque: "PPP da Iluminação Pública do Distrito Federal",
      fonteUrl: "https://www.sepe.df.gov.br/parcerias",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 290.0,
      cotaMediaPorDeputadoBrlMilhoes: 12.08,
      percentualImpositivoRcl: 0.85,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 19.5,
      fonteUrl: "https://www.cl.df.gov.br/transparencia",
    },
  },

  // ═══ NORTE ═══
  {
    uf: "PA",
    estado: "Pará",
    regiao: "Norte",
    capital: "Belém",
    totalDeputados: 41,
    outorgas: {
      totalInterferencias: 24500,
      vazaoTotalM3AnoMilhoes: 4800.0,
      orgaoGestorEstadual: "SEMAS-PA",
      baciasPrincipais: ["Amazonas", "Tocantins", "Xingu", "Tapajós"],
      finalidadePredominante: "Mineração de Ferro (Carajás), Alumínio e Bauxita",
      fonteUrl: "https://www.semas.pa.gov.br/",
    },
    energia: {
      distribuidoraLider: "Equatorial Pará",
      tarifaResidencialKwhBrl: 1.05,
      tarifaIndustrialKwhBrl: 0.58,
      assimetriaTarifariaRatio: 1.81,
      capacidadeInstaladaMw: 21800,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 210.0,
      consumoEstimadoLitrosMilhoes: 34.0,
      combustivelMaisConsumido: "Diesel Marítimo e S-10",
      precoMedioAnpBrlLitro: 6.22,
      orgaoFiscalizador: "TCE-PA",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 10,
      investimentoTotalContratadoBrlBilhoes: 9.3,
      setoresPrioritarios: ["Saneamento (Cosanpa Concessão)", "Rodovias do Dendê", "Portos Fluviais"],
      concessaoDestaque: "Concessão Regionalizada de Água e Esgoto da Região Metropolitana de Belém",
      fonteUrl: "https://www.semas.pa.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 390.0,
      cotaMediaPorDeputadoBrlMilhoes: 9.51,
      percentualImpositivoRcl: 0.8,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 38.0,
      fonteUrl: "https://www.alepa.pa.gov.br/transparencia",
    },
  },
  {
    uf: "AM",
    estado: "Amazonas",
    regiao: "Norte",
    capital: "Manaus",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 12200,
      vazaoTotalM3AnoMilhoes: 2900.0,
      orgaoGestorEstadual: "IPAAM (Instituto de Proteção Ambiental do Amazonas)",
      baciasPrincipais: ["Amazonas", "Rio Negro", "Solimões", "Madeira"],
      finalidadePredominante: "Polo Industrial de Manaus & Geração Térmica Fluvial",
      fonteUrl: "http://www.ipaam.am.gov.br/",
    },
    energia: {
      distribuidoraLider: "Amazonas Energia",
      tarifaResidencialKwhBrl: 1.01,
      tarifaIndustrialKwhBrl: 0.59,
      assimetriaTarifariaRatio: 1.71,
      capacidadeInstaladaMw: 3800,
      fonteMatrizPredominante: "Termelétrica Fóssil",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 185.0,
      consumoEstimadoLitrosMilhoes: 29.0,
      combustivelMaisConsumido: "Diesel Marítimo e Geradores Isolados",
      precoMedioAnpBrlLitro: 6.34,
      orgaoFiscalizador: "TCE-AM",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 6,
      investimentoTotalContratadoBrlBilhoes: 3.4,
      setoresPrioritarios: ["Saneamento (Águas de Manaus)", "Infovia Fluvial", "Portos Públicos"],
      concessaoDestaque: "Concessão dos Serviços de Esgotamento Sanitário de Manaus",
      fonteUrl: "https://www.seplancti.am.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 260.0,
      cotaMediaPorDeputadoBrlMilhoes: 10.83,
      percentualImpositivoRcl: 0.9,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 31.0,
      fonteUrl: "https://www.aleam.gov.br/transparencia",
    },
  },
  {
    uf: "RO",
    estado: "Rondônia",
    regiao: "Norte",
    capital: "Porto Velho",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 14800,
      vazaoTotalM3AnoMilhoes: 1950.0,
      orgaoGestorEstadual: "SEDAM (Secretaria de Estado do Desenvolvimento Ambiental)",
      baciasPrincipais: ["Madeira", "Guaporé", "Ji-Paraná / Machado"],
      finalidadePredominante: "Hidroelétricas de Jirau e Santo Antônio & Agropecuária",
      fonteUrl: "http://www.sedam.ro.gov.br/",
    },
    energia: {
      distribuidoraLider: "Energisa Rondônia",
      tarifaResidencialKwhBrl: 0.96,
      tarifaIndustrialKwhBrl: 0.54,
      assimetriaTarifariaRatio: 1.77,
      capacidadeInstaladaMw: 7300,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 92.0,
      consumoEstimadoLitrosMilhoes: 15.2,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.28,
      orgaoFiscalizador: "TCE-RO",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 6,
      investimentoTotalContratadoBrlBilhoes: 3.8,
      setoresPrioritarios: ["Saneamento (Caerd Concessão Regional)", "Rodovias Fluviais"],
      concessaoDestaque: "Concessão de Serviços de Esgoto e Resíduos no Eixo Madeira",
      fonteUrl: "https://rondonia.ro.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 210.0,
      cotaMediaPorDeputadoBrlMilhoes: 8.75,
      percentualImpositivoRcl: 0.85,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 35.0,
      fonteUrl: "https://transparencia.al.ro.leg.br/",
    },
  },
  {
    uf: "TO",
    estado: "Tocantins",
    regiao: "Norte",
    capital: "Palmas",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 13500,
      vazaoTotalM3AnoMilhoes: 2100.0,
      orgaoGestorEstadual: "NATURATINS",
      baciasPrincipais: ["Tocantins", "Araguaia", "Sono"],
      finalidadePredominante: "Irrigação (Projeto Formoso) & Hidroelétricas",
      fonteUrl: "https://www.to.gov.br/naturatins",
    },
    energia: {
      distribuidoraLider: "Energisa Tocantins",
      tarifaResidencialKwhBrl: 0.93,
      tarifaIndustrialKwhBrl: 0.53,
      assimetriaTarifariaRatio: 1.75,
      capacidadeInstaladaMw: 3400,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 78.0,
      consumoEstimadoLitrosMilhoes: 13.0,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.14,
      orgaoFiscalizador: "TCE-TO",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 6,
      investimentoTotalContratadoBrlBilhoes: 3.2,
      setoresPrioritarios: ["Saneamento (BRK Ambiental Tocantins)", "Rodovias Fluviais"],
      concessaoDestaque: "Concessão Integral de Saneamento do Estado (BRK)",
      fonteUrl: "https://parcerias.to.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 190.0,
      cotaMediaPorDeputadoBrlMilhoes: 7.91,
      percentualImpositivoRcl: 0.8,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 32.5,
      fonteUrl: "https://transparencia.al.to.leg.br/",
    },
  },
  {
    uf: "AC",
    estado: "Acre",
    regiao: "Norte",
    capital: "Rio Branco",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 4100,
      vazaoTotalM3AnoMilhoes: 380.0,
      orgaoGestorEstadual: "IMAC (Instituto de Meio Ambiente do Acre)",
      baciasPrincipais: ["Acre", "Juruá", "Purus"],
      finalidadePredominante: "Abastecimento Urbano & Pecuária",
      fonteUrl: "http://imac.ac.gov.br/",
    },
    energia: {
      distribuidoraLider: "Energisa Acre",
      tarifaResidencialKwhBrl: 0.99,
      tarifaIndustrialKwhBrl: 0.57,
      assimetriaTarifariaRatio: 1.73,
      capacidadeInstaladaMw: 450,
      fonteMatrizPredominante: "Termelétrica Fóssil",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 52.0,
      consumoEstimadoLitrosMilhoes: 8.2,
      combustivelMaisConsumido: "Diesel S-10",
      precoMedioAnpBrlLitro: 6.48,
      orgaoFiscalizador: "TCE-AC",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 4,
      investimentoTotalContratadoBrlBilhoes: 1.6,
      setoresPrioritarios: ["Saneamento (Depasa Concessão)", "Iluminação Pública Rio Branco"],
      concessaoDestaque: "Concessão Regional de Água e Esgoto do Vale do Juruá",
      fonteUrl: "https://ac.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 140.0,
      cotaMediaPorDeputadoBrlMilhoes: 5.83,
      percentualImpositivoRcl: 0.75,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 29.0,
      fonteUrl: "https://al.ac.leg.br/transparencia",
    },
  },
  {
    uf: "AP",
    estado: "Amapá",
    regiao: "Norte",
    capital: "Macapá",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 3200,
      vazaoTotalM3AnoMilhoes: 490.0,
      orgaoGestorEstadual: "SEMA-AP",
      baciasPrincipais: ["Amazonas", "Araguari", "Oiapoque"],
      finalidadePredominante: "Mineração de Ouro e Ferro & Hidroelétricas",
      fonteUrl: "https://sema.ap.gov.br/",
    },
    energia: {
      distribuidoraLider: "CEA Equatorial",
      tarifaResidencialKwhBrl: 0.95,
      tarifaIndustrialKwhBrl: 0.55,
      assimetriaTarifariaRatio: 1.72,
      capacidadeInstaladaMw: 920,
      fonteMatrizPredominante: "Hidroelétrica",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 46.0,
      consumoEstimadoLitrosMilhoes: 7.4,
      combustivelMaisConsumido: "Gasolina Comum",
      precoMedioAnpBrlLitro: 6.20,
      orgaoFiscalizador: "TCE-AP",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 4,
      investimentoTotalContratadoBrlBilhoes: 3.2,
      setoresPrioritarios: ["Saneamento (Concessionária CSA - Concessionária de Saneamento do Amapá)"],
      concessaoDestaque: "Concessão Plena dos Serviços de Saneamento Básico em 16 Municípios",
      fonteUrl: "https://ap.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 130.0,
      cotaMediaPorDeputadoBrlMilhoes: 5.41,
      percentualImpositivoRcl: 0.7,
      setorMaisBeneficiado: "Infraestrutura & Obras",
      percentualEmendasPix: 36.5,
      fonteUrl: "https://al.ap.leg.br/transparencia",
    },
  },
  {
    uf: "RR",
    estado: "Roraima",
    regiao: "Norte",
    capital: "Boa Vista",
    totalDeputados: 24,
    outorgas: {
      totalInterferencias: 2800,
      vazaoTotalM3AnoMilhoes: 310.0,
      orgaoGestorEstadual: "FEMARH (Fundação Estadual do Meio Ambiente e Recursos Hídricos)",
      baciasPrincipais: ["Branco", "Mucajaí", "Uraricoera"],
      finalidadePredominante: "Agropecuária de Grãos no Lavrado & Garimpo/Mineração",
      fonteUrl: "http://www.femarh.rr.gov.br/",
    },
    energia: {
      distribuidoraLider: "Roraima Energia (Sistema Isolado)",
      tarifaResidencialKwhBrl: 1.08,
      tarifaIndustrialKwhBrl: 0.62,
      assimetriaTarifariaRatio: 1.74,
      capacidadeInstaladaMw: 380,
      fonteMatrizPredominante: "Termelétrica Fóssil",
      fonteUrl: "https://www.aneel.gov.br/",
    },
    combustivel: {
      totalGastoAnualBrlMilhoes: 58.0,
      consumoEstimadoLitrosMilhoes: 9.1,
      combustivelMaisConsumido: "Diesel para Usinas Térmicas Isoladas",
      precoMedioAnpBrlLitro: 6.38,
      orgaoFiscalizador: "TCE-RR",
      fonteUrl: "https://pncp.gov.br/",
    },
    ppps: {
      totalContratosAtivos: 3,
      investimentoTotalContratadoBrlBilhoes: 1.4,
      setoresPrioritarios: ["Saneamento (Caer)", "Iluminação Pública Boa Vista"],
      concessaoDestaque: "PPP de Iluminação Pública Inteligente de Boa Vista",
      fonteUrl: "https://www.rr.gov.br/",
    },
    emendas: {
      totalEmendasAutorizadasBrlMilhoes: 120.0,
      cotaMediaPorDeputadoBrlMilhoes: 5.0,
      percentualImpositivoRcl: 0.7,
      setorMaisBeneficiado: "Saúde",
      percentualEmendasPix: 42.0,
      fonteUrl: "https://al.rr.leg.br/transparencia",
    },
  },
];

/**
 * Retorna todos os 27 estados cadastrados.
 */
export function listarRecursosTodosEstados(): EstadoRecursoConsolidado[] {
  return DADOS_RECURSOS_27_ESTADOS;
}

/**
 * Retorna os dados consolidados de um estado pela sigla da UF.
 */
export function obterRecursosPorUf(uf: string): EstadoRecursoConsolidado | undefined {
  const ufNormalizada = uf.toUpperCase().trim();
  return DADOS_RECURSOS_27_ESTADOS.find((e) => e.uf === ufNormalizada);
}

/**
 * Filtra estados por região geográfica, termo textual ou critério de destaque.
 */
export function filtrarRecursosEstados(filtros: {
  regiao?: string;
  termo?: string;
}): EstadoRecursoConsolidado[] {
  const termoLimpo = filtros.termo?.toLowerCase().trim() || "";

  return DADOS_RECURSOS_27_ESTADOS.filter((item) => {
    const casaRegiao =
      !filtros.regiao ||
      filtros.regiao === "todas" ||
      item.regiao.toLowerCase() === filtros.regiao.toLowerCase();

    const casaTermo =
      !termoLimpo ||
      item.uf.toLowerCase().includes(termoLimpo) ||
      item.estado.toLowerCase().includes(termoLimpo) ||
      item.outorgas.orgaoGestorEstadual.toLowerCase().includes(termoLimpo) ||
      item.energia.distribuidoraLider.toLowerCase().includes(termoLimpo) ||
      item.ppps.concessaoDestaque.toLowerCase().includes(termoLimpo);

    return casaRegiao && casaTermo;
  });
}

/**
 * Exporta os dados consolidados dos estados em formato CSV compatível com Excel brasileiro
 * (BOM UTF-8, separador ponto-e-vírgula e casas decimais com vírgula).
 */
export function gerarCsvRecursos27Estados(estados: EstadoRecursoConsolidado[]): string {
  const cabecalho = [
    "UF",
    "Estado",
    "Região",
    "Total Deputados",
    "Interferências Outorgadas (Água)",
    "Vazão Outorgada (Milhões m³/ano)",
    "Órgão Gestor Água",
    "Distribuidora Energia",
    "Tarifa Residencial (R$/kWh)",
    "Tarifa Industrial Livre (R$/kWh)",
    "Assimetria Tarifária",
    "Gasto Combustível Anual (R$ Milhões)",
    "Litros Combustível (Milhões)",
    "Preço Referência ANP (R$/L)",
    "PPPs Ativas",
    "Investimento PPPs (R$ Bilhões)",
    "Concessão Destaque",
    "Emendas Totais (R$ Milhões)",
    "Cota Média Deputado (R$ Milhões)",
    "% Emendas PIX",
    "Link Transparência Assembleia",
  ];

  const linhas = estados.map((e) => [
    `"${e.uf}"`,
    `"${e.estado}"`,
    `"${e.regiao}"`,
    e.totalDeputados,
    e.outorgas.totalInterferencias,
    e.outorgas.vazaoTotalM3AnoMilhoes.toFixed(1).replace(".", ","),
    `"${e.outorgas.orgaoGestorEstadual.replace(/"/g, '""')}"`,
    `"${e.energia.distribuidoraLider.replace(/"/g, '""')}"`,
    e.energia.tarifaResidencialKwhBrl.toFixed(2).replace(".", ","),
    e.energia.tarifaIndustrialKwhBrl.toFixed(2).replace(".", ","),
    e.energia.assimetriaTarifariaRatio.toFixed(2).replace(".", ",") + "x",
    e.combustivel.totalGastoAnualBrlMilhoes.toFixed(1).replace(".", ","),
    e.combustivel.consumoEstimadoLitrosMilhoes.toFixed(1).replace(".", ","),
    e.combustivel.precoMedioAnpBrlLitro.toFixed(2).replace(".", ","),
    e.ppps.totalContratosAtivos,
    e.ppps.investimentoTotalContratadoBrlBilhoes.toFixed(1).replace(".", ","),
    `"${e.ppps.concessaoDestaque.replace(/"/g, '""')}"`,
    e.emendas.totalEmendasAutorizadasBrlMilhoes.toFixed(1).replace(".", ","),
    e.emendas.cotaMediaPorDeputadoBrlMilhoes.toFixed(2).replace(".", ","),
    e.emendas.percentualEmendasPix.toFixed(1).replace(".", ",") + "%",
    `"${e.emendas.fonteUrl}"`,
  ]);

  return "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\r\n");
}
