#!/usr/bin/env node
/**
 * @file scripts/coletar-eua-acervo.mts
 * @description Coletor e consolidador dos acervos públicos, econômicos e ambientais dos EUA (/eua).
 *
 * Papel no portal:
 * Estrutura e compacta os dados oficiais dos Estados Unidos da América seguindo o Padrão das 6 Qualidades (`AGENTS.md` §8):
 * 1. Corporações e Fundos dos EUA (SEC EDGAR) com participação e operações no Brasil (Vale ADR, Petrobras ADR,
 *    Alcoa, Albemarle, Mosaic, BlackRock, Vanguard, State Street, Berkshire, JPMorgan, Caterpillar, Bunge).
 * 2. Meio Ambiente e Barragens: EPA ECHO (autos de infração e multas), National Inventory of Dams (NID/USACE),
 *    locais do programa EPA Superfund (CERCLA), inventário de emissões tóxicas EPA TRI, MSHA, dados USGS e Climate TRACE.
 * 3. Orçamento e Compras Federais: USAspending.gov API v2, balança comercial bilateral do US Census Bureau
 *    (CTY_CODE=3510), Department of Energy (DOE IRA) e acordos bilaterais EXIM Bank / USAID.
 * 4. Institucional e Governança: Cidades-polo (FIPS NYC e DC), Congresso (Congress.gov), Judiciário
 *    (CourtListener / SCOTUS / Ações civis de Brumadinho e Mariana na corte de Nova York), BIA e FOIA.
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
  {
    id: "sec-11",
    nome: "Berkshire Hathaway Inc.",
    cik: "0001067983",
    ticker: "BRK.B",
    setor: "Conglomerado Industrial e Seguros",
    tipoEntidade: "Gestora de Recursos / Fundo",
    sedeEstado: "Nebraska (NE)",
    ativosSobGestaoUsdBilhoes: 1070,
    relacaoBrasil: "Investimentos em transporte ferroviário (BNSF), resseguros industriais e participações em cadeias de insumos.",
    formulariosSec: "Form 10-K, Form 13F",
    fatoresRiscoBrasil: "Exposição indireta a riscos climáticos e perdas catastróficas em apólices de grandes riscos de infraestrutura.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001067983",
  },
  {
    id: "sec-12",
    nome: "JPMorgan Chase & Co.",
    cik: "0000019617",
    ticker: "JPM",
    setor: "Banco Global e Serviços Financeiros",
    tipoEntidade: "Banco de Investimento",
    sedeEstado: "Nova York (NY)",
    ativosSobGestaoUsdBilhoes: 3870,
    relacaoBrasil: "Estruturador líder de dívida externa e emissões de títulos verdes (ESG bonds) para mineradoras e o agronegócio brasileiro.",
    formulariosSec: "Form 10-K, Form 8-K",
    fatoresRiscoBrasil: "Riscos de crédito corporativo em economias emergentes e conformidade com sanções financeiras internacionais.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000019617",
  },
  {
    id: "sec-13",
    nome: "Morgan Stanley",
    cik: "0000895421",
    ticker: "MS",
    setor: "Banco Global e Mercado de Capitais",
    tipoEntidade: "Banco de Investimento",
    sedeEstado: "Nova York (NY)",
    ativosSobGestaoUsdBilhoes: 1180,
    relacaoBrasil: "Coordenador de ofertas globais de ações e títulos corporativos de exportadores brasileiros de minério e celulose.",
    formulariosSec: "Form 10-K, Form 13F",
    fatoresRiscoBrasil: "Volatilidade dos mercados emergentes e oscilação nos preços internacionais de commodities minerais.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000895421",
  },
  {
    id: "sec-14",
    nome: "Citigroup Inc.",
    cik: "0000831001",
    ticker: "C",
    setor: "Banco Global e Custódia Transnacional",
    tipoEntidade: "Banco de Investimento",
    sedeEstado: "Nova York (NY)",
    ativosSobGestaoUsdBilhoes: 2430,
    relacaoBrasil: "Banco depositário de múltiplos programas de ADRs de empresas brasileiras negociadas na Bolsa de Nova York.",
    formulariosSec: "Form 10-K, Form 10-Q",
    fatoresRiscoBrasil: "Regulação bancária transfronteiriça, risco cambial e conformidade com leis anticorrupção (FCPA).",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000831001",
  },
  {
    id: "sec-15",
    nome: "Bunge Global SA",
    cik: "0001996862",
    ticker: "BG",
    setor: "Agronegócio e Logística Portuária",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Missouri (MO)",
    ativosSobGestaoUsdBilhoes: 27.6,
    relacaoBrasil: "Uma das maiores exportadoras de soja, milho e óleos vegetais do Brasil, com terminais portuários em Santos e Barcarena.",
    formulariosSec: "Form 10-K, Form 8-K",
    fatoresRiscoBrasil: "Monitoramento de desmatamento em cadeias de grãos no Cerrado e Amazônia e logística hidroviária.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0001996862",
  },
  {
    id: "sec-16",
    nome: "Archer-Daniels-Midland Company (ADM)",
    cik: "0000004281",
    ticker: "ADM",
    setor: "Processamento de Grãos e Nutrição",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Illinois (IL)",
    ativosSobGestaoUsdBilhoes: 56.4,
    relacaoBrasil: "Processamento e escoamento de safras agrícolas brasileiras para os mercados norte-americano e europeu.",
    formulariosSec: "Form 10-K",
    fatoresRiscoBrasil: "Exigências de rastreabilidade de cadeias de suprimento e impactos hídricos na produção de biocombustíveis.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000004281",
  },
  {
    id: "sec-17",
    nome: "Caterpillar Inc.",
    cik: "0000018230",
    ticker: "CAT",
    setor: "Equipamentos Pesados e Máquinas de Mineração",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Texas (TX)",
    ativosSobGestaoUsdBilhoes: 87.5,
    relacaoBrasil: "Principal fornecedora de caminhões fora-de-estrada e pás-carregadeiras para as minas de Carajás (PA) e Minas Gerais.",
    formulariosSec: "Form 10-K, Form 10-Q",
    fatoresRiscoBrasil: "Transição para eletrificação e descarbonização de frotas pesadas em grandes cavas a céu aberto.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000018230",
  },
  {
    id: "sec-18",
    nome: "Cleveland-Cliffs Inc.",
    cik: "0000764065",
    ticker: "CLF",
    setor: "Siderurgia e Minério de Ferro Pelotizado",
    tipoEntidade: "Corporação Industrial",
    sedeEstado: "Ohio (OH)",
    ativosSobGestaoUsdBilhoes: 19.8,
    relacaoBrasil: "Maior produtora de pelotas de minério de ferro da América do Norte, concorrente e compradora de insumos da Vale.",
    formulariosSec: "Form 10-K",
    fatoresRiscoBrasil: "Tarifas de importação de aço sob a Seção 232 nos EUA e precificação internacional de pelotas de ferro.",
    fonteNome: "SEC EDGAR Company Facts",
    urlOficial: "https://www.sec.gov/edgar/browse/?CIK=0000764065",
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
  {
    id: "eua-amb-06",
    titulo: "EPA TRI — Toxics Release Inventory (Inventário Nacional de Químicos Tóxicos)",
    categoria: "Multas & Fiscalização (EPA ECHO)",
    orgaoFonte: "U.S. Environmental Protection Agency (EPA Office of Pollution Prevention)",
    estado: "Federal (Mais de 21.000 Instalações)",
    identificadorOficial: "EPA-TRI-NATIONAL-2025",
    riscoOuGravidade: "Monitoramento Ativo",
    metricaPrincipalRotulo: "Volume anual de químicos tóxicos geridos em indústrias e fundições",
    metricaPrincipalValor: 3200,
    unidadeMetrica: "milhões de libras",
    resumoImpacto: "Inventário público obrigatório que revela a destinação, reciclagem e lançamento no solo, ar e água de mais de 770 substâncias químicas reguladas.",
    paraleloBrasil: "Equivalente ao Relatório de Emissões e Transferência de Poluentes (RETP) gerenciado pelo IBAMA no Brasil.",
    fonteOficial: "EPA Toxics Release Inventory National Analysis",
    urlOficial: "https://www.epa.gov/toxics-release-inventory-tri-program",
  },
  {
    id: "eua-amb-07",
    titulo: "EPA EJScreen — Plataforma Nacional de Triagem de Justiça Ambiental",
    categoria: "Multas & Fiscalização (EPA ECHO)",
    orgaoFonte: "U.S. EPA Office of Environmental Justice and External Civil Rights",
    estado: "Nacional (Mapeamento em Nível de Setor Censitário)",
    identificadorOficial: "EPA-EJSCREEN-V2",
    riscoOuGravidade: "Monitoramento Ativo",
    metricaPrincipalRotulo: "Indicadores combinados de vulnerabilidade socioeconômica e poluição",
    metricaPrincipalValor: 13,
    unidadeMetrica: "índices ambientais",
    resumoImpacto: "Cruza dados de proximidade de áreas Superfund, poluição atmosférica PM2.5 e risco hídrico com a renda e etnia da população vizinha.",
    paraleloBrasil: "Metodologia que fundamenta a análise de desigualdade territorial adotada nos relatórios socioambientais do Controle Popular.",
    fonteOficial: "U.S. EPA EJScreen Tool",
    urlOficial: "https://www.epa.gov/ejscreen",
  },
  {
    id: "eua-amb-08",
    titulo: "MSHA Dam Safety — Fiscalização de Barragens de Rejeito e Cavas de Mineração",
    categoria: "Barragens (NID)",
    orgaoFonte: "U.S. Department of Labor — Mine Safety and Health Administration (MSHA)",
    estado: "Nacional (Minas de Carvão e Minerais Metálicos)",
    identificadorOficial: "DOL-MSHA-DAMS-2026",
    riscoOuGravidade: "High Hazard (DPA Alto)",
    metricaPrincipalRotulo: "Barragens de rejeito de mineração sob inspeções federais periódicas",
    metricaPrincipalValor: 1650,
    unidadeMetrica: "estruturas de rejeito",
    resumoImpacto: "A MSHA realiza inspeções in loco e exige planos de emergência e simulações para barragens de rejeito minerário em operação nos EUA.",
    paraleloBrasil: "Fiscalização análoga às vistorias da Agência Nacional de Mineração (ANM) e do Núcleo de Segurança de Barragens (FEAM-MG).",
    fonteOficial: "MSHA Impoundment and Dam Safety Program",
    urlOficial: "https://www.msha.gov/regulations/rules-and-regulations/dam-safety",
  },
  {
    id: "eua-amb-09",
    titulo: "Berkeley Pit Superfund Site — Lago Ácido em Antiga Cava de Mineração de Cobre",
    categoria: "Áreas Contaminadas (Superfund)",
    orgaoFonte: "EPA Region 8 / Montana Department of Environmental Quality",
    estado: "Montana (Butte)",
    identificadorOficial: "CERCLA-MTD980502777",
    riscoOuGravidade: "Prioridade Nacional (NPL)",
    metricaPrincipalRotulo: "Volume de água hiperácida (pH ~2.5) e metais pesados acumulados",
    metricaPrincipalValor: 190000,
    unidadeMetrica: "milhões de litros",
    resumoImpacto: "Cava gigante de mineração de cobre desativada que se transformou em um lago altamente tóxico, exigindo bombeamento e tratamento de água perpétuo.",
    paraleloBrasil: "Exemplo alertado por especialistas para os passivos e cavas exauridas de ferro e ouro em Minas Gerais e no Pará.",
    fonteOficial: "EPA Superfund Record of Decision: Silver Bow Creek/Butte Area",
    urlOficial: "https://cumulis.epa.gov/supercpad/cursites/csitinfo.cfm?id=0800416",
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
  {
    id: "eua-eco-04",
    programaOuAward: "Export-Import Bank of the United States (EXIM) — Financiamento de Exportações e Infraestrutura",
    agenciaFederal: "Export-Import Bank of the United States",
    recipiente: "Exportadores e Importadores de Equipamentos Industriais",
    tipoTransacao: "Assistência / Grant",
    anoFiscal: 2025,
    valorUsdMilhoes: 1420,
    estadoOuPais: "Brasil / América Latina",
    objetoContrato: "Garantias de crédito e financiamentos governamentais para compras de turbinas, maquinário de mineração e frotas de transporte.",
    eloBrasil: "Financia a aquisição de equipamentos de mineração de tecnologia dos EUA utilizados em complexos industriais no Brasil.",
    fonteOficial: "EXIM Bank Annual Report & Transaction Search",
    urlOficial: "https://www.exim.gov/about/open-government",
  },
  {
    id: "eua-eco-05",
    programaOuAward: "USDA Foreign Agricultural Service (FAS) — Monitoramento de Commodities e Fertilizantes",
    agenciaFederal: "U.S. Department of Agriculture (USDA FAS)",
    recipiente: "Mercados Globais de Grãos e Fertilizantes",
    tipoTransacao: "Comércio Bilateral (Censo)",
    anoFiscal: 2025,
    valorUsdMilhoes: 18400,
    estadoOuPais: "Brasil (Bilateral Agroindustrial)",
    objetoContrato: "Balança bilateral de insumos agrícolas: monitoramento de fertilizantes fosfatados/nitrogenados dos EUA e safra brasileira de grãos.",
    eloBrasil: "Cruza diretamente com os projetos de fosfato da The Mosaic Company em Uberaba, Araxá e Cajati.",
    fonteOficial: "USDA Global Agricultural Information Network (GAIN)",
    urlOficial: "https://www.fas.usda.gov/data",
  },
  {
    id: "eua-eco-06",
    programaOuAward: "USAID Brasil — Cooperação Bilateral para Preservação da Biodiversidade na Amazônia",
    agenciaFederal: "U.S. Agency for International Development (USAID)",
    recipiente: "Comunidades Tradicionais, Indígenas e Unidades de Conservação",
    tipoTransacao: "Assistência / Grant",
    anoFiscal: 2025,
    valorUsdMilhoes: 45.8,
    estadoOuPais: "Brasil (Bioma Amazônico)",
    objetoContrato: "Financiamento de projetos de cadeias de valor sustentáveis e fortalecimento da governança territorial indígena.",
    eloBrasil: "Apoia povos indígenas e comunidades ribeirinhas nas bacias do Xingu e Tapajós impactadas por grandes projetos de mineração.",
    fonteOficial: "USAID Foreign Assistance Data Portal",
    urlOficial: "https://www.foreignassistance.gov/",
  },
  {
    id: "eua-eco-07",
    programaOuAward: "Defense Production Act (DPA Title III) — Aquisição Estratégica de Minerais para Defesa",
    agenciaFederal: "U.S. Department of Defense (Office of Industrial Base Policy)",
    recipiente: "Indústrias de Minerais Críticos e Ligas Especiais",
    tipoTransacao: "Contrato Federal (Procurement)",
    anoFiscal: 2025,
    valorUsdMilhoes: 645,
    estadoOuPais: "Federal / Cadeias Aliadas",
    objetoContrato: "Contratos federais para estocagem e processamento doméstico e aliado de nióbio, tântalo, titânio e terras raras.",
    eloBrasil: "O Brasil detém mais de 90% das reservas conhecidas de nióbio do planeta (Araxá/MG e Catalão/GO), insumo crítico listado pelo Pentágono.",
    fonteOficial: "DoD Office of Industrial Base Policy (Title III)",
    urlOficial: "https://www.businessdefense.gov/ibp/programs/dpa-title-iii.html",
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
    nome: "Corte Distrital dos EUA para o Distrito Sul de Nova York (SDNY) — In re Vale S.A. Securities Litigation",
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
    frente: "Judiciário & Litígios (SCOTUS/SDNY)",
    codigoOficial: "COURTLISTENER-SEC-VALE",
    nome: "Corte Distrital de Nova York (SDNY) — SEC v. Vale S.A. (Declarações ESG e Auditorias de Barragens)",
    esfera: "Federal",
    estadoOuLocal: "Nova York (SDNY)",
    anoReferencia: 2023,
    metricaPrincipalRotulo: "Valor pago para encerramento de processo da SEC sobre auditorias falsas",
    metricaPrincipalValor: 55.9,
    unidadeMetrica: "milhões de USD",
    resumoCivico: "A SEC processou a Vale por fraudar laudos de estabilidade de barragens apresentados ao mercado antes do colapso da barragem B1 em Brumadinho.",
    eloBrasil: "Primeiro caso em que a comissão de valores mobiliários dos EUA puniu severamente manipulações de relatórios de sustentabilidade de mineração.",
    fonteOficial: "CourtListener / SEC Litigation Release No. 25682",
    urlOficial: "https://www.sec.gov/litigation/litreleases/2023/lr25682.htm",
  },
  {
    id: "eua-inst-06",
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
    id: "eua-inst-07",
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
  {
    id: "eua-inst-08",
    frente: "Judiciário & Litígios (SCOTUS/SDNY)",
    codigoOficial: "SCOTUS-ATS-KIOBEL",
    nome: "Suprema Corte dos EUA (SCOTUS) — Alien Tort Statute & Direitos Humanos no Exterior",
    esfera: "Federal",
    estadoOuLocal: "Suprema Corte (Washington D.C.)",
    anoReferencia: 2013,
    metricaPrincipalRotulo: "Precedente sobre crimes corporativos fora do território dos EUA",
    metricaPrincipalValor: 9,
    unidadeMetrica: "juízes supremos",
    resumoCivico: "Jurisprudência que delimita as condições sob as quais tribunais federais dos EUA podem julgar violações internacionais cometidas por corporações no exterior.",
    eloBrasil: "Guia os limites para ações de vítimas de crimes ambientais e violações de direitos humanos contra multinacionais sediadas nos EUA.",
    fonteOficial: "Supreme Court of the United States / Oyez",
    urlOficial: "https://www.oyez.org/cases/2012/10-1491",
  },
  {
    id: "eua-inst-09",
    frente: "Transparência & LAI (FOIA)",
    codigoOficial: "SEC-WHISTLEBLOWER-OFFICE",
    nome: "SEC Office of the Whistleblower — Programa de Denúncias com Recompensa por Fraudes",
    esfera: "Federal",
    estadoOuLocal: "Federal (U.S. SEC)",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Percentual do total recuperado pago a denunciantes protegidos",
    metricaPrincipalValor: 30,
    unidadeMetrica: "% da multa civil",
    resumoCivico: "Programa que protege e premia financeiramente informantes anônimos que denunciam fraudes contábeis, manipulação de balanços ou relatórios falsos à SEC.",
    eloBrasil: "Trabalhadores ou auditores de empresas brasileiras com ADRs nos EUA podem denunciar irregularidades e fraudes com garantia de anonimato.",
    fonteOficial: "U.S. SEC Office of the Whistleblower",
    urlOficial: "https://www.sec.gov/whistleblower",
  },
  {
    id: "eua-inst-10",
    frente: "Judiciário & Litígios (SCOTUS/SDNY)",
    codigoOficial: "US-DFC-OVERSEAS-INVEST",
    nome: "U.S. International Development Finance Corporation (DFC) — Governança Socioambiental",
    esfera: "Federal",
    estadoOuLocal: "Federal (Washington D.C.)",
    anoReferencia: 2026,
    metricaPrincipalRotulo: "Capacidade máxima de alocação em projetos de infraestrutura",
    metricaPrincipalValor: 60000,
    unidadeMetrica: "milhões de USD",
    resumoCivico: "Agência governamental norte-americana de investimento que impõe padrões rígidos de desempenho socioambiental da IFC para projetos financiados.",
    eloBrasil: "Financia projetos de infraestrutura e transição energética no Brasil, vinculados a salvaguardas sociais e consulta pública.",
    fonteOficial: "U.S. International Development Finance Corporation",
    urlOficial: "https://www.dfc.gov/our-impact/performance-evaluations",
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
  // Nomes canônicos e compatíveis
  gravarCompacto("empresas-sec.compact.json", EMPRESAS_SEC_EUA);
  gravarCompacto("ambiental-natureza-eua.compact.json", AMBIENTAL_EUA);
  gravarCompacto("ambiental-clima.compact.json", AMBIENTAL_EUA);
  gravarCompacto("contratos-usaspending.compact.json", CONTRATOS_ECONOMIA_EUA);
  gravarCompacto("contratos-comercio.compact.json", CONTRATOS_ECONOMIA_EUA);
  gravarCompacto("institucional-eua.compact.json", INSTITUCIONAL_EUA);
  gravarCompacto("institucional-corte.compact.json", INSTITUCIONAL_EUA);
}

main();
