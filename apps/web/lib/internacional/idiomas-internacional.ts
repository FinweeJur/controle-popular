/**
 * @file idiomas-internacional.ts
 * @description Dicionário trilíngue (PT-BR, EN, ES), glossário de siglas e helpers de adaptação
 * de texto para as páginas e acervos dos Estados Unidos (/eua) e Canadá (/canada).
 *
 * Papel no portal:
 * O Controle Popular tem como idioma padrão o Português Brasileiro (PT-BR), explicando cada sigla
 * em linguagem simples. Para a expansão internacional (EUA e Canadá), este módulo permite:
 * 1. Alternar a exibição dos textos principais, microresumos, alertas editoriais e cabeçalhos
 *    entre Português (`pt`), Inglês (`en`) e Espanhol (`es`) com um clique em botão.
 * 2. Alimentar a leitura em voz alta (TTS via `speechSynthesis`) no idioma selecionado.
 * 3. Enviar contexto adaptado ao chatbot cívico Seu Nonô para explicação em frases curtas
 *    (até 13 palavras) em qualquer um dos três idiomas.
 *
 * Decisões técnicas:
 * - Zero dependência externa de i18n pesada: estrutura pura e determinística que roda tanto
 *   em Server Components (com fallback padrão `pt`) quanto em Client Components sem inflar o bundle.
 */

export type IdiomaExibicao = "pt" | "en" | "es";

export interface TextoTrilingue {
  pt: string;
  en: string;
  es: string;
}

export interface SiglaExplicada {
  sigla: string;
  pais: "EUA" | "Canadá" | "Global";
  nomeOriginal: string;
  equivalenteBrasil: string;
  explicacao: TextoTrilingue;
  urlOficial: string;
}

/**
 * Retorna o texto no idioma solicitado, com fallback seguro para Português (`pt`).
 *
 * @param bloco Objeto com as traduções em `pt`, `en` e `es`.
 * @param idioma Idioma ativo selecionado pelo leitor.
 * @returns String no idioma correspondente.
 */
export function t(bloco: TextoTrilingue, idioma: IdiomaExibicao = "pt"): string {
  return bloco[idioma] || bloco.pt;
}

/**
 * Metadados dos 3 idiomas suportados na barra de leitura e adaptação textual.
 */
export const IDIOMAS_DISPONIVEIS: ReadonlyArray<{
  codigo: IdiomaExibicao;
  rotuloCurto: string;
  rotuloLongo: string;
  bandeira: string;
  langBcp47: string;
}> = [
  {
    codigo: "pt",
    rotuloCurto: "PT-BR",
    rotuloLongo: "Português (Padrão)",
    bandeira: "🇧🇷",
    langBcp47: "pt-BR",
  },
  {
    codigo: "en",
    rotuloCurto: "EN",
    rotuloLongo: "English (US / CA)",
    bandeira: "🇺🇸/🇨🇦",
    langBcp47: "en-US",
  },
  {
    codigo: "es",
    rotuloCurto: "ES",
    rotuloLongo: "Español (Américas)",
    bandeira: "🌎",
    langBcp47: "es-MX",
  },
];

/**
 * Rótulos comuns da interface das páginas internacionais (botões, filtros, avisos e rodapé).
 */
export const UI_INTERNACIONAL = {
  barraTitulo: {
    pt: "Modo de Exibição e Leitura Trilíngue:",
    en: "Trilingual Display & Reading Mode:",
    es: "Modo de Visualización y Lectura Trilingüe:",
  },
  botaoOuvir: {
    pt: "Ouvir resumo em PT",
    en: "Listen in English",
    es: "Escuchar en Español",
  },
  botaoParar: {
    pt: "Parar leitura",
    en: "Stop reading",
    es: "Detener lectura",
  },
  botaoSeuNono: {
    pt: "Explicar no Seu Nonô (PT)",
    en: "Ask Seu Nonô in English",
    es: "Explicar con Seu Nonô (ES)",
  },
  avisoEditorialTitulo: {
    pt: "Garantia Editorial e Dupla Verificação (6 Qualidades)",
    en: "Editorial Guarantee & Double Verification (6 Qualities)",
    es: "Garantía Editorial y Doble Verificación (6 Cualidades)",
  },
  avisoEditorialTexto: {
    pt: "Todo número tem link direto à fonte oficial. Aparecer em dois acervos é ponto de partida para investigar, nunca acusação automática.",
    en: "Every number links directly to the official source. Cross-listed records are a starting point for inquiry, never an automatic accusation.",
    es: "Cada número enlaza directamente a la fuente oficial. Aparecer en dos registros es punto de partida para investigar, nunca acusación automática.",
  },
  buscaPlaceholder: {
    pt: "Buscar por nome, órgão, cidade, estado/província, setor ou código...",
    en: "Search by name, agency, city, state/province, sector, or code...",
    es: "Buscar por nombre, agencia, ciudad, estado/provincia, sector o código...",
  },
  fonteDiretaBotao: {
    pt: "Fonte Oficial ↗",
    en: "Official Source ↗",
    es: "Fuente Oficial ↗",
  },
  transparenciaPassivaEua: {
    pt: "Transparência Passiva nos EUA: Freedom of Information Act (FOIA.gov) — o equivalente norte-americano à Lei de Acesso à Informação (LAI).",
    en: "Passive Transparency in the US: Freedom of Information Act (FOIA.gov) — any person has the right to request federal agency records.",
    es: "Transparencia Pasiva en EE. UU.: Freedom of Information Act (FOIA.gov) — derecho de acceso a documentos federales.",
  },
  transparenciaPassivaCanada: {
    pt: "Transparência Passiva no Canadá: Access to Information and Privacy (ATIP) — o canal oficial canadense equivalente à LAI brasileira.",
    en: "Passive Transparency in Canada: Access to Information and Privacy (ATIP) — official federal channel for public record requests.",
    es: "Transparencia Pasiva en Canadá: Access to Information and Privacy (ATIP) — canal oficial canadiense de acceso a la información.",
  },
} as const;

/**
 * Glossário de siglas dos EUA, Canadá e bases científicas internacionais, sempre comparando
 * com o órgão equivalente no Brasil para facilitar o entendimento de qualquer leitor.
 */
export const GLOSSARIO_SIGLAS_INTERNACIONAL: readonly SiglaExplicada[] = [
  {
    sigla: "SEC EDGAR",
    pais: "EUA",
    nomeOriginal: "U.S. Securities and Exchange Commission — EDGAR",
    equivalenteBrasil: "CVM (Comissão de Valores Mobiliários)",
    explicacao: {
      pt: "Órgão que fiscaliza a bolsa dos EUA. Guarda balanços (10-K e 20-F) de gigantes americanas e de empresas brasileiras com ações em Nova York (como Vale e Petrobras).",
      en: "US securities regulator. Hosts mandatory financial filings (Forms 10-K, 20-F) for US corporations, asset managers, and foreign issuers like Vale and Sigma Lithium.",
      es: "Regulador bursátil de EE. UU. Publica balances obligatorios (10-K y 20-F) de corporaciones, fondos de inversión y empresas brasileñas que cotizan en Nueva York.",
    },
    urlOficial: "https://www.sec.gov/edgar/searchedgar/companysearch",
  },
  {
    sigla: "USAspending.gov",
    pais: "EUA",
    nomeOriginal: "Official Open Data Source of Federal Spending Information",
    equivalenteBrasil: "PNCP + Portal da Transparência Federal",
    explicacao: {
      pt: "Portal oficial do Tesouro dos EUA que mostra todos os contratos federais, convênios (grants) e empréstimos públicos por empresa (código UEI) e cidade.",
      en: "Official US Treasury open data portal tracking federal contracts, grants, and loans by recipient UEI, agency, and place of performance.",
      es: "Portal oficial del Tesoro de EE. UU. que rastrea contratos federales, subvenciones y préstamos por empresa (UEI) y ciudad.",
    },
    urlOficial: "https://www.usaspending.gov",
  },
  {
    sigla: "EPA ECHO & Superfund",
    pais: "EUA",
    nomeOriginal: "Environmental Protection Agency — Enforcement and Compliance History Online",
    equivalenteBrasil: "IBAMA + FEAM + Cadastro de Áreas Contaminadas",
    explicacao: {
      pt: "Agência ambiental dos EUA. O sistema ECHO mostra licenças, vistorias e multas ambientais; o Superfund lista áreas gravemente contaminadas em reparação.",
      en: "US Environmental Protection Agency portal tracking facility inspections, environmental violations, penalties, and CERCLA Superfund cleanup sites.",
      es: "Agencia ambiental de EE. UU. El sistema ECHO publica inspecciones, multas ambientales y sitios contaminados bajo reparación (Superfund).",
    },
    urlOficial: "https://echo.epa.gov",
  },
  {
    sigla: "NID (USACE)",
    pais: "EUA",
    nomeOriginal: "National Inventory of Dams — U.S. Army Corps of Engineers",
    equivalenteBrasil: "SIGBM / ANM e SNISB (Cadastro Nacional de Barragens)",
    explicacao: {
      pt: "Cadastro oficial de mais de 91 mil barragens nos EUA. Classifica o Dano Potencial (High Hazard = perda de vidas se romper, igual ao DPA Alto no Brasil).",
      en: "Official US registry of 91,000+ dams maintained by the Army Corps of Engineers, tracking dam height, storage, Emergency Action Plans, and Hazard Potential.",
      es: "Inventario oficial de más de 91.000 represas en EE. UU., clasificando potencial de daño (High Hazard) y planes de emergencia.",
    },
    urlOficial: "https://nid.sec.usace.army.mil",
  },
  {
    sigla: "TSX / SEDAR+",
    pais: "Canadá",
    nomeOriginal: "Toronto Stock Exchange & System for Electronic Document Analysis and Retrieval",
    equivalenteBrasil: "B3 + CVM + ANM (Relatórios Técnicos de Mineração)",
    explicacao: {
      pt: "Mais da metade das mineradoras do mundo tem ações em Toronto. A norma canadense NI 43-101 obriga a publicar laudos técnicos detalhados de cada mina no Brasil.",
      en: "Home to over half of the world's public mining companies. Canadian rule NI 43-101 mandates public technical reports for mineral projects in Brazil and worldwide.",
      es: "Bolsa de Toronto y sistema regulador canadiense. La norma NI 43-101 exige publicar informes técnicos detallados de cada proyecto minero en Brasil.",
    },
    urlOficial: "https://www.sedarplus.ca",
  },
  {
    sigla: "ECCC — NPRI",
    pais: "Canadá",
    nomeOriginal: "Environment and Climate Change Canada — National Pollutant Release Inventory",
    equivalenteBrasil: "IBAMA RAPP (Relatório de Atividades Potencialmente Poluidoras)",
    explicacao: {
      pt: "Inventário público do governo canadense que mede quanto cada mina ou fábrica lançou de poluentes na água, no ar, no solo e em barragens de rejeitos.",
      en: "Canada's legislated, publicly accessible inventory of pollutant releases to air, water, and land, plus tailings and waste rock disposals per facility.",
      es: "Inventario público oficial de Canadá sobre emisiones contaminantes al aire, agua, suelo y depósitos de relaves mineros por instalación.",
    },
    urlOficial: "https://www.canada.ca/en/environment-climate-change/services/national-pollutant-release-inventory.html",
  },
  {
    sigla: "CORE (Canadá)",
    pais: "Canadá",
    nomeOriginal: "Canadian Ombudsperson for Responsible Enterprise",
    equivalenteBrasil: "Ouvidoria de Direitos Humanos / MPF (Atuação Transnacional)",
    explicacao: {
      pt: "Ouvidoria pública do Canadá que recebe denúncias de comunidades atingidas por empresas canadenses de mineração, petróleo e vestuário fora do Canadá.",
      en: "Canadian federal watchdog reviewing human rights abuse complaints involving Canadian mining, oil/gas, and garment companies operating abroad.",
      es: "Defensoría pública de Canadá que investiga denuncias de derechos humanos contra mineras y empresas canadienses que operan en el extranjero.",
    },
    urlOficial: "https://core-ombuds.canada.ca",
  },
  {
    sigla: "GLEIF / OpenAlex / Climate TRACE",
    pais: "Global",
    nomeOriginal: "Open Global Scientific, Corporate & Emissions Databases",
    equivalenteBrasil: "Receita Federal QSA + SciELO/CAPES + SEEG",
    explicacao: {
      pt: "Bases abertas globais sem bloqueio: GLEIF liga empresa-filial no Brasil à matriz nos EUA/Canadá; OpenAlex reúne estudos científicos; Climate TRACE mede emissões por satélite.",
      en: "Open global infrastructures: GLEIF maps parent-subsidiary corporate trees (LEI); OpenAlex indexes scientific research; Climate TRACE tracks satellite emissions.",
      es: "Bases abiertas globales: GLEIF conecta filiales en Brasil con matrices en EE. UU./Canadá; OpenAlex indexa ciencia abierta; Climate TRACE mide emisiones por satélite.",
    },
    urlOficial: "https://www.gleif.org",
  },
];
