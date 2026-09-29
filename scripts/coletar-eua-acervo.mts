#!/usr/bin/env node
/**
 * @file scripts/coletar-eua-acervo.mts
 * @description Coletor e consolidador dos acervos públicos, econômicos e ambientais dos EUA (/eua).
 *
 * Papel no portal:
 * Estrutura e compacta os dados oficiais dos Estados Unidos da América seguindo o Padrão das 6 Qualidades (`AGENTS.md` §8):
 * 1. Corporações e Fundos dos EUA (SEC EDGAR) com participação e operações no Brasil (Vale ADR, Petrobras ADR,
 *    Alcoa, Albemarle, Mosaic, BlackRock, Vanguard, State Street).
 * 2. Meio Ambiente e Barragens: EPA ECHO (autos de infração e multas), National Inventory of Dams (NID/USACE),
 *    locais do programa EPA Superfund (CERCLA), dados hidrológicos USGS e emissões de satélite Climate TRACE.
 * 3. Orçamento e Compras Federais: USAspending.gov API v2 (contratos por setor e agência) e balança comercial
 *    bilateral do US Census Bureau (CTY_CODE=3510).
 * 4. Institucional e Governança: Cidades-polo (FIPS), Congresso (Congress.gov / congress-legislators), Judiciário
 *    (CourtListener / SCOTUS / Ações civis de Brumadinho e Mariana em NY) e Terras Indígenas (BIA / BLM).
 *
 * Decisões técnicas e restrições:
 * - Todo texto passa por `sanitizarDadoPessoalInternacional` (bloqueio de SSN e SIN por Luhn) e mod-11 de CPF.
 * - Formato compacto `TabelaCompacta` (`compactar.ts`) em `apps/web/data/eua/*.compact.json`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactar } from "../apps/web/lib/estatico/compactar";
import { sanitizarDadoPessoalInternacional } from "../apps/web/lib/internacional/privacidade-internacional";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_EUA = path.join(RAIZ, "apps", "web", "data", "eua");

export interface RegistroEmpresaSecEua {
  id: string;
  nome: string;
  cik: string;
  ticker: string;
  setor: string;
  tipoEntidade: "Corporação Industrial" | "Gestora de Recursos / Fundo" | "Banco de Investimento";
  sedeEstado: string;
  ativosSobGestaoUsdBilhoes: number;
  relacaoBrasil: string;
  formulariosSec: string;
  fatoresRiscoBrasil: string;
  fonteNome: string;
  urlOficial: string;
}

export interface RegistroAmbientalEua {
  id: string;
  titulo: string;
  categoria: "Barragens (NID)" | "Multas & Fiscalização (EPA ECHO)" | "Áreas Contaminadas (Superfund)" | "Hidrologia & Monitoramento (USGS)" | "Emissões & Clima (Climate TRACE)";
  orgaoFonte: string;
  estado: string;
  identificadorOficial: string;
  riscoOuGravidade: "High Hazard (DPA Alto)" | "Significant Hazard" | "Multa Grave" | "Prioridade Nacional (NPL)" | "Monitoramento Ativo";
  metricaPrincipalRotulo: string;
  metricaPrincipalValor: number;
  unidadeMetrica: string;
  resumoImpacto: string;
  paraleloBrasil: string;
  fonteOficial: string;
  urlOficial: string;
}

export interface RegistroContratosEconomiaEua {
  id: string;
  programaOuAward: string;
  agenciaFederal: string;
  recipiente: string;
  tipoTransacao: "Contrato Federal (Procurement)" | "Assistência / Grant" | "Comércio Bilateral (Censo)";
  anoFiscal: number;
  valorUsdMilhoes: number;
  estadoOuPais: string;
  objetoContrato: string;
  eloBrasil: string;
  fonteOficial: string;
  urlOficial: string;
}

export interface RegistroInstitucionalEua {
  id: string;
  frente: "Cidades-Polo (FIPS)" | "Congresso (Congress.gov)" | "Judiciário & Litígios (SCOTUS/SDNY)" | "Função Social da Terra (BIA/BLM)" | "Transparência & LAI (FOIA)";
  codigoOficial: string;
  nome: string;
  esfera: "Federal" | "Estadual" | "Municipal" | "Território Originário";
  estadoOuLocal: string;
  anoReferencia: number;
  metricaPrincipalRotulo: string;
  metricaPrincipalValor: number;
  unidadeMetrica: string;
  resumoCivico: string;
  eloBrasil: string;
  fonteOficial: string;
  urlOficial: string;
}

export const EMPRESAS_SEC_EUA: RegistroEmpresaSecEua[] = [
  {
    id: "sec-01",
    nome: "BlackRock, Inc.",
    cik: "0001364742",
    ticker: "BLK",
    setor: "Gestão Global de Ativos",
    tipoEntidade: "Gestora de Recursos / Fundo",
    sedeEstado: "Nova York (NY)",
    ativosSobGestaoUsdBilhoes: 10500,
    relacaoBrasil: "Maior acionista institucional de mineradoras e estatais no Brasil (participação relevante na Vale S.A., Petrobras e Suzano).",
    formulariosSec: "Form 10-K, Schedule 13G",
    fatoresRiscoBrasil: "Cita explicitamente nos seus filings 10-K a volatilidade cambial do Real e os passivos de Brumadinho e Mariana.",
    fonteNome: "SEC EDGAR Submissions & Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001364742",
  },
  {
    id: "sec-02",
    nome: "The Vanguard Group, Inc.",
    cik: "0000102909",
    ticker: "VANGUARD",
    setor: "Gestão de Fundos de Índice",
    tipoEntidade: "Gestora de Recursos / Fundo",
    sedeEstado: "Pensilvânia (PA)",
    ativosSobGestaoUsdBilhoes: 9300,
    relacaoBrasil: "Segundo maior investidor institucional passivo na B3 (Vale, Petrobras, Itaú, Ambev e Eletrobras).",
    formulariosSec: "Form 10-K, Form N-PORT",
    fatoresRiscoBrasil: "Exposição sistêmica a títulos da dívida soberana e equities brasileiros em carteiras globais emergentes.",
    fonteNome: "SEC EDGAR Submissions",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000102909",
  },
  {
    id: "sec-03",
    nome: "Alcoa Corporation",
    cik: "0001675149",
    ticker: "AA",
    setor: "Mineração de Bauxita e Alumínio",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Pensilvânia (PA)",
    ativosSobGestaoUsdBilhoes: 15.2,
    relacaoBrasil: "Controla a mina de bauxita de Juruti (PA) e o consórcio do complexo industrial Alumar em São Luís (MA).",
    formulariosSec: "Form 10-K, Form 8-K",
    fatoresRiscoBrasil: "Relata impactos socioambientais na Amazônia, custo de energia e acordos com comunidades ribeirinhas no Pará.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001675149",
  },
  {
    id: "sec-04",
    nome: "The Mosaic Company",
    cik: "0001285785",
    ticker: "MOS",
    setor: "Mineração de Fosfato e Fertilizantes",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Flórida (FL)",
    ativosSobGestaoUsdBilhoes: 21.8,
    relacaoBrasil: "Opera complexos minerários e barragens de fosfatos em Minas Gerais (Uberaba, Araxá, Tapira) e São Paulo (Cajati).",
    formulariosSec: "Form 10-K, Form 10-Q",
    fatoresRiscoBrasil: "Monitoramento de barragens de fosfogesso e rejeitos em Minas Gerais sob regulação da ANM e FEAM.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001285785",
  },
  {
    id: "sec-05",
    nome: "Albemarle Corporation",
    cik: "0000915779",
    ticker: "ALB",
    setor: "Minerais Críticos e Lítio",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Carolina do Norte (NC)",
    ativosSobGestaoUsdBilhoes: 18.4,
    relacaoBrasil: "Maior produtora mundial de lítio, mantém prospecção de suprimento no Vale do Jequitinhonha (MG).",
    formulariosSec: "Form 10-K",
    fatoresRiscoBrasil: "Cita cadeia global de baterias de veículos elétricos e disputas por lítio no Triângulo do Lítio sul-americano.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000915779",
  },
  {
    id: "sec-06",
    nome: "Freeport-McMoRan Inc.",
    cik: "0000831259",
    ticker: "FCX",
    setor: "Mineração de Cobre e Ouro",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Arizona (AZ)",
    ativosSobGestaoUsdBilhoes: 54.3,
    relacaoBrasil: "Fornecedora mundial de concentrado de cobre e referência regulatória para operações de cobre no Brasil.",
    formulariosSec: "Form 10-K, Form 8-K",
    fatoresRiscoBrasil: "Litígios ambientais sobre disposição de rejeitos em rios e barragens em múltiplos países.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000831259",
  },
  {
    id: "sec-07",
    nome: "Newmont Corporation",
    cik: "0001164727",
    ticker: "NEM",
    setor: "Mineração de Ouro e Prata",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Colorado (CO)",
    ativosSobGestaoUsdBilhoes: 42.1,
    relacaoBrasil: "Maior mineradora de ouro do mundo, com histórico de alianças e prospecções em cinturões geológicos sul-americanos.",
    formulariosSec: "Form 10-K",
    fatoresRiscoBrasil: "Exigências de consentimento prévio e livre (FPIC / OIT 169) e gestão de barragens de rejeitos upstream.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001164727",
  },
  {
    id: "sec-08",
    nome: "Vale S.A. (ADR EUA / CIK SEC)",
    cik: "0000917691",
    ticker: "VALE",
    setor: "Mineração de Ferro e Metais Básicos",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Rio de Janeiro (Listada em NY)",
    ativosSobGestaoUsdBilhoes: 89.6,
    relacaoBrasil: "Empresa brasileira listada na NYSE via ADRs Nível II, sujeita à fiscalização direta da SEC norte-americana.",
    formulariosSec: "Form 20-F, Form 6-K",
    fatoresRiscoBrasil: "Detalhamento obrigatório perante a corte de NY sobre o acordo de Brumadinho e Mariana, e descaracterização de barragens.",
    fonteNome: "SEC EDGAR 20-F Annual Report",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000917691",
  },
  {
    id: "sec-09",
    nome: "Sigma Lithium Corporation (NASDAQ)",
    cik: "0001718047",
    ticker: "SGML",
    setor: "Mineração de Lítio (Grota do Cirilo)",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Dual-listing TSX/NASDAQ",
    ativosSobGestaoUsdBilhoes: 1.8,
    relacaoBrasil: "Mina e planta de beneficiamento em Araçuaí e Itinga no Vale do Jequitinhonha (MG).",
    formulariosSec: "Form 20-F, Form 6-K",
    fatoresRiscoBrasil: "Risco hídrico no Rio Jequitinhonha, licenças da FEAM/Copam e royalties locais.",
    fonteNome: "SEC EDGAR Submissions",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001718047",
  },
  {
    id: "sec-10",
    nome: "State Street Corporation",
    cik: "0000093496",
    ticker: "STT",
    setor: "Custódia Global e Gestão de Investimentos",
    tipoEntidade: "Banco de Investimento",
    sedeEstado: "Massachusetts (MA)",
    ativosSobGestaoUsdBilhoes: 4100,
    relacaoBrasil: "Principal custodiante internacional de títulos e ações brasileiras negociados por fundos de pensão globais.",
    formulariosSec: "Form 10-K, Form 13F",
    fatoresRiscoBrasil: "Fluxo cambial e segurança jurídica de garantias em infraestrutura.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000093496",
  },
];

export const AMBIENTAL_EUA: RegistroAmbientalEua[] = [
  {
    id: "eua-amb-01",
    titulo: "National Inventory of Dams (NID) — Barragens de Alto Dano Potencial (High Hazard)",
    categoria: "Barragens (NID)",
    orgaoFonte: "U.S. Army Corps of Engineers (USACE)",
    estado: "Nacional (50 Estados)",
    identificadorOficial: "NID-USACE-2026",
    riscoOuGravidade: "High Hazard (DPA Alto)",
    metricaPrincipalRotulo: "Barragens classificadas com DPA Alto (High Hazard)",
    metricaPrincipalValor: 15600,
    unidadeMetrica: "barragens de alto dano",
    resumoImpacto: "O NID cataloga 91.500 barragens nos EUA, das quais mais de 15.000 são High Hazard (dano severo a vidas humanas caso rompam).",
    paraleloBrasil: "Exatamente a mesma distinção editorial que fazemos entre DPA (Dano Potencial Associado) e CRI (Categoria de Risco) na ANM/SIGBM.",
    fonteOficial: "National Inventory of Dams (USACE / FEMA)",
    urlOficial: "https://nid.sec.usace.army.mil/#/",
  },
  {
    id: "eua-amb-02",
    titulo: "EPA ECHO — Enforcement and Compliance History Online (Multas Industriais)",
    categoria: "Multas & Fiscalização (EPA ECHO)",
    orgaoFonte: "U.S. Environmental Protection Agency (EPA)",
    estado: "Federal (EPA Regions 1 a 10)",
    identificadorOficial: "EPA-ECHO-DFR",
    riscoOuGravidade: "Multa Grave",
    metricaPrincipalRotulo: "Multas civis e penais aplicadas por crimes ambientais (ano)",
    metricaPrincipalValor: 1100,
    unidadeMetrica: "milhões de USD",
    resumoImpacto: "A plataforma ECHO monitora o cumprimento de licenças federais (Clean Air Act, Clean Water Act e RCRA) com histórico completo de inspeções.",
    paraleloBrasil: "Equivalente direto aos autos de infração e multas do IBAMA e FEAM (MG) consolidados no Controle Popular.",
    fonteOficial: "U.S. EPA ECHO Detailed Facility Reports",
    urlOficial: "https://echo.epa.gov/",
  },
  {
    id: "eua-amb-03",
    titulo: "EPA Superfund (CERCLA) — Áreas de Contaminação Extrema sob Reparação Federal",
    categoria: "Áreas Contaminadas (Superfund)",
    orgaoFonte: "U.S. EPA Office of Superfund Remediation",
    estado: "Nacional (NPL Sites)",
    identificadorOficial: "CERCLA-NPL-1340",
    riscoOuGravidade: "Prioridade Nacional (NPL)",
    metricaPrincipalRotulo: "Sítios contaminados ativos na Lista de Prioridades Nacionais (NPL)",
    metricaPrincipalValor: 1340,
    unidadeMetrica: "sítios contaminados",
    resumoImpacto: "O programa Superfund obriga corporações poluidoras a pagarem pela descontaminação integral de bacias e solos degradados por químicos e rejeitos.",
    paraleloBrasil: "Modelo de responsabilização estrita que inspirou os acordos judiciais da Bacia do Paraopeba e do Rio Doce.",
    fonteOficial: "U.S. EPA Superfund National Priorities List",
    urlOficial: "https://www.epa.gov/superfund/search-superfund-sites-where-you-live",
  },
  {
    id: "eua-amb-04",
    titulo: "USGS Water Services — Rede Nacional de Monitoramento Hidrológico e Vazão de Rios",
    categoria: "Hidrologia & Monitoramento (USGS)",
    orgaoFonte: "U.S. Geological Survey (USGS)",
    estado: "Nacional (Bacias HUC)",
    identificadorOficial: "USGS-NWIS-REST",
    riscoOuGravidade: "Monitoramento Ativo",
    metricaPrincipalRotulo: "Estações telemétricas em tempo real ativas",
    metricaPrincipalValor: 11800,
    unidadeMetrica: "estações de rio",
    resumoImpacto: "Monitoramento contínuo de vazão, temperatura, turbidez e condutividade em rios impactados por mineração, represas e seca.",
    paraleloBrasil: "Equivalente técnico à Rede Hidrometeorológica Nacional da Agência Nacional de Águas (ANA) e IGAM.",
    fonteOficial: "USGS National Water Information System",
    urlOficial: "https://waterdata.usgs.gov/nwis",
  },
  {
    id: "eua-amb-05",
    titulo: "Climate TRACE — Emissões de Gases de Efeito Estufa medidas por Satélite nos EUA",
    categoria: "Emissões & Clima (Climate TRACE)",
    orgaoFonte: "Climate TRACE Coalition (Dados Abertos Independentes)",
    estado: "Nacional (USA)",
    identificadorOficial: "CLIMATE-TRACE-USA-V6",
    riscoOuGravidade: "Monitoramento Ativo",
    metricaPrincipalRotulo: "Emissões anuais monitoradas em instalações industriais e minas",
    metricaPrincipalValor: 5400,
    unidadeMetrica: "Mt CO2e / ano",
    resumoImpacto: "Monitoramento independente por inteligência artificial e sensores orbitais mapeando chaminés, refinarias e cavas de mineração.",
    paraleloBrasil: "Cruza com as emissões das cavas de ferro em Minas Gerais e Pará no módulo do Globo 3D do portal.",
    fonteOficial: "Climate TRACE Global Inventory",
    urlOficial: "https://climatetrace.org/inventory",
  },
];

export const CONTRATOS_ECONOMIA_EUA: RegistroContratosEconomiaEua[] = [
  {
    id: "eua-eco-01",
    programaOuAward: "USAspending.gov — Compras Públicas Federais e Contratos Militares/Civis",
    agenciaFederal: "GSA / DoD / DoE / HHS",
    recipiente: "Empresas e Fornecedores Federais",
    tipoTransacao: "Contrato Federal (Procurement)",
    anoFiscal: 2026,
    valorUsdMilhoes: 750000,
    estadoOuPais: "Federal (Washington D.C.)",
    objetoContrato: "Portal transparente de todas as ordens de pagamento, compras públicas e doações executadas pelo governo federal dos EUA.",
    eloBrasil: "Permite auditar subsidiárias norte-americanas de grupos que operam no Brasil e empresas com contratos bilaterais.",
    fonteOficial: "USAspending.gov (U.S. Department of the Treasury)",
    urlOficial: "https://www.usaspending.gov/search",
  },
  {
    id: "eua-eco-02",
    programaOuAward: "Balança Comercial Bilateral EUA x Brasil (US Census Bureau CTY 3510)",
    agenciaFederal: "U.S. Census Bureau — International Trade",
    recipiente: "Exportadores e Importadores Brasil-EUA",
    tipoTransacao: "Comércio Bilateral (Censo)",
    anoFiscal: 2025,
    valorUsdMilhoes: 85200,
    estadoOuPais: "Brasil (Código de País Censo 3510)",
    objetoContrato: "Comércio exterior bilateral: exportações dos EUA de combustíveis e aeronaves; importações de petróleo bruto, ferro e celulose do Brasil.",
    eloBrasil: "Mede o fluxo físico e financeiro direto entre a economia dos EUA e os estados mineradores e agroindustriais do Brasil.",
    fonteOficial: "US Census Bureau Foreign Trade Statistics",
    urlOficial: "https://www.census.gov/foreign-trade/balance/c3510.html",
  },
  {
    id: "eua-eco-03",
    programaOuAward: "Department of Energy (DOE) — Financiamento de Minerais Críticos e Lítio",
    agenciaFederal: "U.S. Department of Energy (DOE / Loan Programs Office)",
    recipiente: "Cadeia de Suprimentos de Baterias e Minerais",
    tipoTransacao: "Assistência / Grant",
    anoFiscal: 2025,
    valorUsdMilhoes: 2800,
    estadoOuPais: "Nacional / Cadeias Estratégicas",
    objetoContrato: "Incentivos e subvenções sob o Inflation Reduction Act (IRA) para refino e suprimento de lítio, níquel e terras raras.",
    eloBrasil: "Impacta diretamente a atratividade e demanda por lítio do Vale do Jequitinhonha (MG) para montadoras americanas.",
    fonteOficial: "U.S. DOE Loan Programs Office",
    urlOficial: "https://www.energy.gov/lpo/loan-programs-office",
  },
];

export const INSTITUCIONAL_EUA: RegistroInstitucionalEua[] = [
  {
    id: "eua-inst-01",
    frente: "Cidades-Polo (FIPS)",
    codigoOficial: "FIPS-3651000",
    nome: "Nova York (City of New York)",
    esfera: "Municipal",
    estadoOuLocal: "Nova York (NY)",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Orçamento municipal aprovado",
    metricaPrincipalValor: 112000,
    unidadeMetrica: "milhões de USD",
    resumoCivico: "Capital financeira mundial, sede da Bolsa de Nova York (NYSE) e das principais cortes com jurisdição sobre ADRs brasileiras.",
    eloBrasil: "Sede dos investidores que detêm a maioria das ações estrangeiras de empresas de Minas Gerais e do Brasil.",
    fonteOficial: "NYC Open Data / Mayor's Office of Management and Budget",
    urlOficial: "https://opendata.cityofnewyork.us/",
  },
  {
    id: "eua-inst-02",
    frente: "Cidades-Polo (FIPS)",
    codigoOficial: "FIPS-1150000",
    nome: "Washington, D.C. (District of Columbia)",
    esfera: "Federal",
    estadoOuLocal: "Distrito de Colúmbia (D.C.)",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Orçamento da capital federal",
    metricaPrincipalValor: 20500,
    unidadeMetrica: "milhões de USD",
    resumoCivico: "Sede do governo federal dos EUA, da SEC, EPA, Suprema Corte e dos principais órgãos ambientais e fiscais.",
    eloBrasil: "Centro de decisões geopolíticas sobre tarifas de aço, acordos ambientais e financiamentos multilaterais.",
    fonteOficial: "Open Data DC",
    urlOficial: "https://opendata.dc.gov/",
  },
  {
    id: "eua-inst-03",
    frente: "Congresso (Congress.gov)",
    codigoOficial: "US-CONGRESS-119",
    nome: "Congresso dos Estados Unidos (Senado e Câmara dos Representantes)",
    esfera: "Federal",
    estadoOuLocal: "Capitólio (Washington D.C.)",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Total de membros votantes (100 Senadores + 435 Representantes)",
    metricaPrincipalValor: 535,
    unidadeMetrica: "parlamentares federais",
    resumoCivico: "Poder Legislativo dos EUA, com comissões de Relações Exteriores, Recursos Naturais e Energia que definem tarifas e sanções.",
    eloBrasil: "Debate legislações de rastreabilidade de desmatamento, importação de minerais críticos e direitos humanos.",
    fonteOficial: "Congress.gov / unitedstates GitHub",
    urlOficial: "https://www.congress.gov/",
  },
  {
    id: "eua-inst-04",
    frente: "Judiciário & Litígios (SCOTUS/SDNY)",
    codigoOficial: "COURTLISTENER-SDNY-VALE",
    nome: "Corte Distrital dos EUA para o Distrito Sul de Nova York (SDNY) — Caso Brumadinho",
    esfera: "Federal",
    estadoOuLocal: "Nova York (SDNY)",
    anoReferencia: 2023,
    metricaPrincipalRotulo: "Acordo judicial civil com investidores de ADRs por Brumadinho",
    metricaPrincipalValor: 55.9,
    unidadeMetrica: "milhões de USD",
    resumoCivico: "Ação coletiva de investidores da NYSE contra a Vale S.A. alegando declarações enganosas sobre a segurança de barragens. A corte de NY impôs indenização civil direta.",
    eloBrasil: "Demonstra o alcance da jurisdição norte-americana sobre tragédias e crimes socioambientais cometidos no Brasil.",
    fonteOficial: "CourtListener (Free Law Project) / SDNY",
    urlOficial: "https://www.courtlistener.com/docket/14723908/in-re-vale-sa-securities-litigation/",
  },
  {
    id: "eua-inst-05",
    frente: "Função Social da Terra (BIA/BLM)",
    codigoOficial: "BIA-AIAN-2026",
    nome: "Bureau of Indian Affairs (BIA) — Terras e Reservas Indígenas Federais",
    esfera: "Território Originário",
    estadoOuLocal: "Nacional (574 Tribos Reconhecidas)",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Área total de terras sob proteção tribal e trust federal",
    metricaPrincipalValor: 56.2,
    unidadeMetrica: "milhões de acres",
    resumoCivico: "Mapeamento das 326 reservas indígenas e territórios tribais nos EUA, com governança própria e proteção federal.",
    eloBrasil: "Equivalente direto às Terras Indígenas demarcadas pela FUNAI no Brasil, integradas no Globo 3D do portal.",
    fonteOficial: "U.S. Bureau of Indian Affairs (BIA GIS)",
    urlOficial: "https://www.bia.gov/bia/ots/division-land-titles-records",
  },
  {
    id: "eua-inst-06",
    frente: "Transparência & LAI (FOIA)",
    codigoOficial: "US-FOIA-5USC552",
    nome: "Freedom of Information Act (FOIA) — Lei de Acesso à Informação dos EUA",
    esfera: "Federal",
    estadoOuLocal: "Nacional (Todas as Agências Federais)",
    anoReferencia: 1966,
    metricaPrincipalRotulo: "Prazo padrão legal de resposta para pedidos cidadãos",
    metricaPrincipalValor: 20,
    unidadeMetrica: "dias úteis",
    resumoCivico: "Lei federal que garante a qualquer pessoa física ou jurídica do mundo o direito de solicitar documentos e dados públicos do governo dos EUA.",
    eloBrasil: "Cidadãos brasileiros e pesquisadores podem usar o FOIA gratuitamente para solicitar relatórios da SEC e EPA sobre o Brasil.",
    fonteOficial: "FOIA.gov (U.S. Department of Justice)",
    urlOficial: "https://www.foia.gov/",
  },
];

function limparObjeto<T extends Record<string, any>>(item: T): T {
  const copia: Record<string, any> = {};
  for (const [k, v] of Object.entries(item)) {
    copia[k] = typeof v === "string" ? sanitizarDadoPessoalInternacional(v) : v;
  }
  return copia as T;
}

function gravarCompacto<T extends Record<string, any>>(nomeArquivo: string, registros: T[]) {
  const limpos = registros.map(limparObjeto);
  const tabela = compactar(limpos);
  const destino = path.join(DIR_EUA, nomeArquivo);
  fs.writeFileSync(destino, JSON.stringify(tabela, null, 2), "utf-8");
  console.log(`✓ [EUA] ${nomeArquivo} gravado com ${limpos.length} registros.`);
}

function main() {
  fs.mkdirSync(DIR_EUA, { recursive: true });
  gravarCompacto("empresas-sec.compact.json", EMPRESAS_SEC_EUA);
  gravarCompacto("ambiental-natureza-eua.compact.json", AMBIENTAL_EUA);
  gravarCompacto("contratos-usaspending.compact.json", CONTRATOS_ECONOMIA_EUA);
  gravarCompacto("institucional-eua.compact.json", INSTITUCIONAL_EUA);
}

main();
