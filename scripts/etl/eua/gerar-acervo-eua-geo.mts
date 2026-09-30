/**
 * @file scripts/etl/eua/gerar-acervo-eua-geo.mts
 * @description ETL gerador do acervo geoespacial de capitais, regulação e mineração dos Estados Unidos (/eua).
 *
 * Papel no portal:
 * 1. Mapeia as principais bolsas de valores (NYSE, Nasdaq), órgãos reguladores federais (SEC, EPA, USGS, MSHA, USACE, SDNY),
 *    grandes fundos de investimento e custodiantes globais (BlackRock, Vanguard, State Street, Berkshire, JPMorgan, Morgan Stanley, Citigroup),
 *    sedes de grandes mineradoras transnacionais (Freeport-McMoRan, Newmont, Albemarle, Drummond, Alcoa, Mosaic, Caterpillar, Cleveland-Cliffs)
 *    e minas estratégicas e passivos (Morenci, Bingham Canyon, Silver Peak Lithium, Thacker Pass, Carlin Trend, Berkeley Pit).
 * 2. Gera o arquivo GeoJSON oficial no padrão WGS84 para o Globo 3D Terras:
 *    `apps/web/public/terras/globo/dados/camadas/sedes-capitais-mineracao-eua.geojson`.
 * 3. Compacta os dados com o padrão `compactar.ts` (esqueleto + rótulos internados) em:
 *    `apps/web/data/internacional/eua-geo.compact.json`.
 *
 * Decisões técnicas e conformidade:
 * - Geometrias no padrão GeoJSON RFC 7946: Point [longitude, latitude] com coordenadas decimais auditadas.
 * - Tipos normalizados em conformidade estrita com o contrato de camadas do Globo 3D:
 *   'sede_corporativa' | 'fundo_investimento' | 'bolsa_valores' | 'orgao_regulador' | 'mina_estrategica'.
 * - Zero dados pessoais (sem CPFs, sem SSNs) e verificação das fontes públicas primárias (SEC EDGAR, EPA ECHO, USGS MRDS).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactar, type TabelaCompacta } from "../../../apps/web/lib/estatico/compactar.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const GEOJSON_DESTINO = path.join(
  RAIZ,
  "apps",
  "web",
  "public",
  "terras",
  "globo",
  "dados",
  "camadas",
  "sedes-capitais-mineracao-eua.geojson"
);
const DATA_DIR = path.join(RAIZ, "apps", "web", "data", "internacional");
const COMPACT_DESTINO = path.join(DATA_DIR, "eua-geo.compact.json");

export type TipoPontoEua =
  | "sede_corporativa"
  | "fundo_investimento"
  | "bolsa_valores"
  | "orgao_regulador"
  | "mina_estrategica";

export interface PontoGeoEua {
  id: string;
  nome: string;
  entidade: string;
  tipo: TipoPontoEua;
  setor: string;
  cidade: string;
  estadoUsa: string;
  latitude: number;
  longitude: number;
  regulador: string;
  fonteOficial: string;
  descricao: string;
}

export const PONTOS_GEO_EUA: PontoGeoEua[] = [
  // --- BOLSAS DE VALORES ---
  {
    id: "eua-nyse",
    nome: "New York Stock Exchange (NYSE) — Wall Street",
    entidade: "Intercontinental Exchange (ICE) / NYSE",
    tipo: "bolsa_valores",
    setor: "Mercado de Capitais Global",
    cidade: "Nova York",
    estadoUsa: "Nova York (NY)",
    latitude: 40.7069,
    longitude: -74.0113,
    regulador: "SEC (Securities and Exchange Commission)",
    fonteOficial: "SEC / NYSE Trading Operations (nyse.com)",
    descricao: "Principal bolsa de valores do mundo onde são negociados os ADRs das maiores mineradoras globais e brasileiras (VALE, PBR, Alcoa).",
  },
  {
    id: "eua-nasdaq",
    nome: "Nasdaq MarketSite & Sede Global",
    entidade: "Nasdaq, Inc.",
    tipo: "bolsa_valores",
    setor: "Mercado Eletrônico de Capitais e Tecnologia",
    cidade: "Nova York",
    estadoUsa: "Nova York (NY)",
    latitude: 40.7567,
    longitude: -73.9857,
    regulador: "SEC (Securities and Exchange Commission)",
    fonteOficial: "SEC EDGAR / Nasdaq Corporate (nasdaq.com)",
    descricao: "Bolsa eletrônica norte-americana onde operam mineradoras de transição energética e lítio verde, como a Sigma Lithium (SGML).",
  },

  // --- ÓRGÃOS REGULADORES FEDERAIS E CIENTÍFICOS ---
  {
    id: "eua-sec-dc",
    nome: "U.S. Securities and Exchange Commission (SEC) — Sede Geral",
    entidade: "Securities and Exchange Commission (SEC)",
    tipo: "orgao_regulador",
    setor: "Regulação de Valores Mobiliários e Transparência Corporativa",
    cidade: "Washington",
    estadoUsa: "Distrito de Colúmbia (DC)",
    latitude: 38.8986,
    longitude: -77.0062,
    regulador: "Governo Federal dos EUA (Agência Independente)",
    fonteOficial: "SEC.gov / Sistema EDGAR",
    descricao: "Órgão regulador supremo do mercado de capitais dos EUA, guardião dos formulários 10-K, 20-F e denúncias de passivos socioambientais corporativos.",
  },
  {
    id: "eua-epa-dc",
    nome: "U.S. Environmental Protection Agency (EPA) — Sede Geral",
    entidade: "Environmental Protection Agency (EPA)",
    tipo: "orgao_regulador",
    setor: "Fiscalização Ambiental, Superfund e Emissões",
    cidade: "Washington",
    estadoUsa: "Distrito de Colúmbia (DC)",
    latitude: 38.8936,
    longitude: -77.029,
    regulador: "Governo Federal dos EUA",
    fonteOficial: "EPA.gov / ECHO Database (Enforcement and Compliance History)",
    descricao: "Agência federal responsável pela aplicação das leis Clean Water Act, Clean Air Act e gestão do programa Superfund de contaminação minerária e química.",
  },
  {
    id: "eua-usgs-reston",
    nome: "U.S. Geological Survey (USGS) National Center",
    entidade: "United States Geological Survey (USGS)",
    tipo: "orgao_regulador",
    setor: "Pesquisa Geológica, Recursos Minerais e Monitoramento Hidrológico",
    cidade: "Reston",
    estadoUsa: "Virgínia (VA)",
    latitude: 38.9472,
    longitude: -77.3683,
    regulador: "U.S. Department of the Interior",
    fonteOficial: "USGS.gov / MRDS (Mineral Resources Data System) e USMIN",
    descricao: "Principal autoridade científica em cartografia, sismologia e inventários minerais globais e nacionais (MRDS, USMIN).",
  },
  {
    id: "eua-msha-arlington",
    nome: "Mine Safety and Health Administration (MSHA) Headquarters",
    entidade: "MSHA (U.S. Department of Labor)",
    tipo: "orgao_regulador",
    setor: "Segurança e Saúde Ocupacional em Mineração",
    cidade: "Arlington",
    estadoUsa: "Virgínia (VA)",
    latitude: 38.8624,
    longitude: -77.0543,
    regulador: "U.S. Department of Labor",
    fonteOficial: "MSHA.gov / Data Enforcement & Dam Safety",
    descricao: "Autoridade federal responsável pela fiscalização de segurança, inspeções contínuas e padrões de estabilidade em minas subterrâneas e a céu aberto.",
  },
  {
    id: "eua-usace-dc",
    nome: "U.S. Army Corps of Engineers (USACE) — Gestão do NID",
    entidade: "U.S. Army Corps of Engineers (USACE)",
    tipo: "orgao_regulador",
    setor: "Engenharia Hidráulica e Gestão do National Inventory of Dams",
    cidade: "Washington",
    estadoUsa: "Distrito de Colúmbia (DC)",
    latitude: 38.8979,
    longitude: -77.0185,
    regulador: "U.S. Department of Defense",
    fonteOficial: "USACE / National Inventory of Dams (nid.usace.army.mil)",
    descricao: "Responsável pelo gerenciamento do Inventário Nacional de Barragens (NID), com classificação de dano potencial associado (High Hazard DPA).",
  },
  {
    id: "eua-tribunal-sdny",
    nome: "U.S. District Court for the Southern District of New York (SDNY)",
    entidade: "Poder Judiciário Federal dos EUA",
    tipo: "orgao_regulador",
    setor: "Justiça Federal e Litígios Transnacionais de Valores Mobiliários",
    cidade: "Nova York",
    estadoUsa: "Nova York (NY)",
    latitude: 40.7142,
    longitude: -74.0028,
    regulador: "Judicial Branch of the United States",
    fonteOficial: "CourtListener / US Courts SDNY",
    descricao: "Corte federal competente para as ações coletivas (class actions) movidas por investidores internacionais contra a Vale S.A. e a Petrobras decorrentes de desastres e governança.",
  },

  // --- GRANDES FUNDOS DE INVESTIMENTO E GESTORES GLOBAIS ---
  {
    id: "eua-blackrock-ny",
    nome: "Sede Corporativa Global — BlackRock, Inc.",
    entidade: "BlackRock, Inc.",
    tipo: "fundo_investimento",
    setor: "Gestão Global de Ativos e Fundos Indexados",
    cidade: "Nova York",
    estadoUsa: "Nova York (NY)",
    latitude: 40.7538,
    longitude: -74.0008,
    regulador: "SEC EDGAR (CIK: 0001364742)",
    fonteOficial: "SEC Form 10-K / EDGAR Submissions",
    descricao: "Maior gestora de investimentos do mundo com mais de US$ 10 trilhões em ativos, acionista institucional relevante da Vale S.A. e Petrobras.",
  },
  {
    id: "eua-vanguard-malvern",
    nome: "Sede Global — The Vanguard Group, Inc.",
    entidade: "The Vanguard Group, Inc.",
    tipo: "fundo_investimento",
    setor: "Gestão de Fundos Mútuos e ETFs Globais",
    cidade: "Malvern",
    estadoUsa: "Pensilvânia (PA)",
    latitude: 40.0658,
    longitude: -75.5567,
    regulador: "SEC EDGAR (CIK: 0000102909)",
    fonteOficial: "SEC Form 10-K / Form N-PORT",
    descricao: "Pioneira e gigante global em fundos de índice passivo com US$ 9,3 trilhões sob custódia, com posições massivas no mercado acionário brasileiro.",
  },
  {
    id: "eua-statestreet-boston",
    nome: "Sede Corporativa — State Street Corporation",
    entidade: "State Street Corporation",
    tipo: "fundo_investimento",
    setor: "Custódia Global, Gestão de Investimentos e Asset Servicing",
    cidade: "Boston",
    estadoUsa: "Massachusetts (MA)",
    latitude: 42.3619,
    longitude: -71.0583,
    regulador: "SEC EDGAR (CIK: 0000093496) / Federal Reserve",
    fonteOficial: "SEC Form 10-K / Federal Reserve",
    descricao: "Um dos maiores bancos custodiantes do mundo com US$ 4,1 trilhões geridos e dezenas de trilhões sob custódia global.",
  },
  {
    id: "eua-berkshire-omaha",
    nome: "Sede Corporativa — Berkshire Hathaway Inc.",
    entidade: "Berkshire Hathaway Inc.",
    tipo: "fundo_investimento",
    setor: "Conglomerado de Investimentos, Resseguros e Transporte Ferroviário",
    cidade: "Omaha",
    estadoUsa: "Nebraska (NE)",
    latitude: 41.2581,
    longitude: -95.965,
    regulador: "SEC EDGAR (CIK: 0001067983)",
    fonteOficial: "SEC Form 10-K / Berkshire Hathaway",
    descricao: "Conglomerado multinacional detentor da ferrovia BNSF e grandes resseguradoras de riscos catastróficos e industriais no mundo.",
  },
  {
    id: "eua-jpmorgan-ny",
    nome: "Sede Global — JPMorgan Chase & Co.",
    entidade: "JPMorgan Chase & Co.",
    tipo: "fundo_investimento",
    setor: "Banco de Investimento e Mercado de Capitais",
    cidade: "Nova York",
    estadoUsa: "Nova York (NY)",
    latitude: 40.7558,
    longitude: -73.9754,
    regulador: "SEC EDGAR (CIK: 0000019617) / Federal Reserve",
    fonteOficial: "SEC Form 10-K / JPMorgan Chase",
    descricao: "Maior instituição financeira dos Estados Unidos, estruturador líder de dívida soberana e títulos corporativos de exportadoras de commodities.",
  },
  {
    id: "eua-morganstanley-ny",
    nome: "Sede Global — Morgan Stanley",
    entidade: "Morgan Stanley",
    tipo: "fundo_investimento",
    setor: "Banco Global e Mercado de Capitais",
    cidade: "Nova York",
    estadoUsa: "Nova York (NY)",
    latitude: 40.7594,
    longitude: -73.985,
    regulador: "SEC EDGAR (CIK: 0000895421)",
    fonteOficial: "SEC Form 10-K / Morgan Stanley",
    descricao: "Coordenador de ofertas globais de ações e títulos corporativos de exportadores de minério e celulose das Américas.",
  },
  {
    id: "eua-citigroup-ny",
    nome: "Sede Global — Citigroup Inc.",
    entidade: "Citigroup Inc.",
    tipo: "fundo_investimento",
    setor: "Banco Global e Custódia Transnacional",
    cidade: "Nova York",
    estadoUsa: "Nova York (NY)",
    latitude: 40.7208,
    longitude: -74.0114,
    regulador: "SEC EDGAR (CIK: 0000831001)",
    fonteOficial: "SEC Form 10-K / Citigroup",
    descricao: "Banco depositário de programas de ADRs de mineradoras brasileiras negociadas na Bolsa de Nova York.",
  },

  // --- SEDES CORPORATIVAS DE MINERADORAS E FORNECEDORES GLOBAIS ---
  {
    id: "eua-freeport-phoenix",
    nome: "Sede Corporativa Global — Freeport-McMoRan Inc.",
    entidade: "Freeport-McMoRan Inc.",
    tipo: "sede_corporativa",
    setor: "Mineração de Cobre, Ouro e Molibdênio",
    cidade: "Phoenix",
    estadoUsa: "Arizona (AZ)",
    latitude: 33.4516,
    longitude: -112.074,
    regulador: "SEC EDGAR (CIK: 0000831259) / EPA",
    fonteOficial: "SEC Form 10-K / Freeport-McMoRan",
    descricao: "Uma das maiores produtoras de cobre do mundo, operadora de mega-minas nos EUA, Indonésia e América do Sul (Cerro Verde, Peru).",
  },
  {
    id: "eua-newmont-denver",
    nome: "Sede Corporativa Global — Newmont Corporation",
    entidade: "Newmont Corporation",
    tipo: "sede_corporativa",
    setor: "Mineração de Ouro, Prata e Cobre",
    cidade: "Denver",
    estadoUsa: "Colorado (CO)",
    latitude: 39.6277,
    longitude: -104.8988,
    regulador: "SEC EDGAR (CIK: 0001164727) / EPA",
    fonteOficial: "SEC Form 10-K / Newmont Corporation",
    descricao: "A maior corporação de mineração de ouro do planeta, com operações ativas nas Américas, Austrália e África.",
  },
  {
    id: "eua-albemarle-charlotte",
    nome: "Sede Corporativa Global — Albemarle Corporation",
    entidade: "Albemarle Corporation",
    tipo: "sede_corporativa",
    setor: "Lítio, Minerais Especiais e Baterias",
    cidade: "Charlotte",
    estadoUsa: "Carolina do Norte (NC)",
    latitude: 35.1558,
    longitude: -80.8358,
    regulador: "SEC EDGAR (CIK: 0000915779) / EPA",
    fonteOficial: "SEC Form 10-K / Albemarle Corporation",
    descricao: "Líder global na extração e refino químico de lítio para veículos elétricos, com explorações no Salar de Atacama (Chile), EUA e Austrália.",
  },
  {
    id: "eua-drummond-birmingham",
    nome: "Sede Corporativa Global — Drummond Company, Inc.",
    entidade: "Drummond Company, Inc.",
    tipo: "sede_corporativa",
    setor: "Mineração de Carvão e Coque Metalúrgico",
    cidade: "Birmingham",
    estadoUsa: "Alabama (AL)",
    latitude: 33.4475,
    longitude: -86.7208,
    regulador: "MSHA / EPA Region 4 / ADEM",
    fonteOficial: "Drummond Company / EPA ECHO",
    descricao: "Multinacional privada de carvão térmico e metalúrgico, dona de gigantescas concessões minerárias no estado de Cesar, Colômbia.",
  },
  {
    id: "eua-alcoa-pittsburgh",
    nome: "Sede Corporativa Global — Alcoa Corporation",
    entidade: "Alcoa Corporation",
    tipo: "sede_corporativa",
    setor: "Mineração de Bauxita, Alumina e Alumínio",
    cidade: "Pittsburgh",
    estadoUsa: "Pensilvânia (PA)",
    latitude: 40.4489,
    longitude: -80.0033,
    regulador: "SEC EDGAR (CIK: 0001675149) / EPA",
    fonteOficial: "SEC Form 10-K / Alcoa Corporation",
    descricao: "Pioneira mundial na metalurgia do alumínio, controladora da mina de bauxita de Juruti (PA) e da planta Alumar (MA) no Brasil.",
  },
  {
    id: "eua-mosaic-tampa",
    nome: "Sede Corporativa Global — The Mosaic Company",
    entidade: "The Mosaic Company",
    tipo: "sede_corporativa",
    setor: "Mineração de Fosfatos e Potássio",
    cidade: "Tampa",
    estadoUsa: "Flórida (FL)",
    latitude: 27.9478,
    longitude: -82.4583,
    regulador: "SEC EDGAR (CIK: 0001285785) / EPA",
    fonteOficial: "SEC Form 10-K / Mosaic Company",
    descricao: "Uma das maiores fornecedoras de nutrientes e fosfato do mundo, operadora do polo minerador de Tapira, Araxá e Uberaba em Minas Gerais.",
  },
  {
    id: "eua-caterpillar-irving",
    nome: "Sede Corporativa Global — Caterpillar Inc.",
    entidade: "Caterpillar Inc.",
    tipo: "sede_corporativa",
    setor: "Máquinas Pesadas e Frotas de Mineração",
    cidade: "Irving",
    estadoUsa: "Texas (TX)",
    latitude: 32.8736,
    longitude: -96.9364,
    regulador: "SEC EDGAR (CIK: 0000018230)",
    fonteOficial: "SEC Form 10-K / Caterpillar Inc.",
    descricao: "Fabricante global dos maiores caminhões basculantes e escavadeiras hidráulicas empregadas em cavas a céu aberto em todo o Brasil e mundo.",
  },
  {
    id: "eua-clevelandcliffs-cleveland",
    nome: "Sede Corporativa Global — Cleveland-Cliffs Inc.",
    entidade: "Cleveland-Cliffs Inc.",
    tipo: "sede_corporativa",
    setor: "Mineração de Ferro e Produção de Aço Laminado",
    cidade: "Cleveland",
    estadoUsa: "Ohio (OH)",
    latitude: 41.4994,
    longitude: -81.6922,
    regulador: "SEC EDGAR (CIK: 0000764065)",
    fonteOficial: "SEC Form 10-K / Cleveland-Cliffs",
    descricao: "Maior produtora de minério de ferro pelotizado da América do Norte, controladora de minas na Bacia do Lago Superior.",
  },

  // --- MINAS ESTRATÉGICAS E PASSIVOS AMBIENTAIS DE MINERAÇÃO ---
  {
    id: "eua-mina-morenci-cobre",
    nome: "Complexo Minerário de Cobre de Morenci",
    entidade: "Freeport-McMoRan (72%) / Sumitomo (28%)",
    tipo: "mina_estrategica",
    setor: "Cobre e Molibdênio",
    cidade: "Morenci",
    estadoUsa: "Arizona (AZ)",
    latitude: 33.0806,
    longitude: -109.3564,
    regulador: "EPA ECHO / ADEQ / MSHA",
    fonteOficial: "USGS MRDS / EPA ECHO (Facility ID: 110000497193)",
    descricao: "Maior mina produtora de cobre a céu aberto da América do Norte em operação contínua desde o século XIX, com usinas de extração por solvente e eletrodeposição (SX/EW).",
  },
  {
    id: "eua-mina-bingham-canyon",
    nome: "Mina Bingham Canyon (Kennecott Copper Mine)",
    entidade: "Rio Tinto Kennecott",
    tipo: "mina_estrategica",
    setor: "Cobre, Ouro, Prata e Molibdênio",
    cidade: "Salt Lake City / South Jordan",
    estadoUsa: "Utah (UT)",
    latitude: 40.5233,
    longitude: -112.1511,
    regulador: "EPA ECHO / Utah DOGM / MSHA",
    fonteOficial: "USGS MRDS / EPA Superfund (UTD000800109)",
    descricao: "A maior escavação a céu aberto feita pela humanidade, com mais de 1,2 km de profundidade e 4 km de largura, visível do espaço sideral.",
  },
  {
    id: "eua-mina-silver-peak-litio",
    nome: "Operação de Lítio Silver Peak (Clayton Valley)",
    entidade: "Albemarle Corporation",
    tipo: "mina_estrategica",
    setor: "Lítio (Salmoura e Carbonato de Lítio)",
    cidade: "Silver Peak",
    estadoUsa: "Nevada (NV)",
    latitude: 37.7553,
    longitude: -117.6322,
    regulador: "Nevada NDEP / BLM / MSHA",
    fonteOficial: "USGS Mineral Commodity Summaries / EPA ECHO",
    descricao: "Única planta comercial de extração de lítio a partir de salmoura ativa nos Estados Unidos até meados da década de 2020.",
  },
  {
    id: "eua-mina-thacker-pass-litio",
    nome: "Projeto de Lítio Thacker Pass",
    entidade: "Lithium Americas Corp. / General Motors",
    tipo: "mina_estrategica",
    setor: "Lítio (Rocha Sedimentar / Argila de Esmectita)",
    cidade: "Orovada / Humboldt County",
    estadoUsa: "Nevada (NV)",
    latitude: 41.7061,
    longitude: -118.0647,
    regulador: "U.S. Bureau of Land Management (BLM) / Nevada NDEP",
    fonteOficial: "BLM Final EIS / USGS",
    descricao: "A maior reserva comprovada de lítio em argila dos EUA na Caldeira McDermitt, objeto de litígios de direitos de povos originários e biodiversidade.",
  },
  {
    id: "eua-mina-carlin-trend-ouro",
    nome: "Complexo Minerário Carlin Trend (Nevada Gold Mines)",
    entidade: "Nevada Gold Mines (Barrick 61.5% / Newmont 38.5%)",
    tipo: "mina_estrategica",
    setor: "Ouro e Prata",
    cidade: "Elko / Carlin",
    estadoUsa: "Nevada (NV)",
    latitude: 40.9706,
    longitude: -116.3056,
    regulador: "MSHA / Nevada Division of Minerals / EPA ECHO",
    fonteOficial: "USGS MRDS / NBMG",
    descricao: "O maior complexo de mineração de ouro da América do Norte, combinando diversas minas a céu aberto e subterrâneas com processamento por autoclave e lixiviação.",
  },
  {
    id: "eua-mina-berkeley-pit",
    nome: "Berkeley Pit Superfund Site — Lago Ácido em Cava de Cobre",
    entidade: "Montana Resources / Atlantic Richfield (BP)",
    tipo: "mina_estrategica",
    setor: "Passivo Ambiental Minero-Industrial de Cobre",
    cidade: "Butte",
    estadoUsa: "Montana (MT)",
    latitude: 46.0153,
    longitude: -112.5117,
    regulador: "EPA Region 8 / Montana DEQ (Superfund NPL CERCLA-MTD980502777)",
    fonteOficial: "EPA Superfund Record of Decision / USGS MRDS",
    descricao: "Emblemática cava histórica inundada com mais de 190 bilhões de litros de água hiperácida (pH ~2.5) carregada de metais pesados, referência global para passivos de mineração.",
  },
];

/**
 * Monta o GeoJSON FeatureCollection WGS84 para a camada no Globo 3D Terras.
 */
export function gerarGeoJsonCapitaisMineracaoEua() {
  return {
    type: "FeatureCollection" as const,
    metadata: {
      fonte: "Controle Popular — Observatório de Capitais, Regulação e Mineração dos Estados Unidos (EUA)",
      dataAtualizacao: "2026-09-30",
      totalFeicoes: PONTOS_GEO_EUA.length,
      distribuicaoTipos: {
        sede_corporativa: PONTOS_GEO_EUA.filter((p) => p.tipo === "sede_corporativa").length,
        fundo_investimento: PONTOS_GEO_EUA.filter((p) => p.tipo === "fundo_investimento").length,
        bolsa_valores: PONTOS_GEO_EUA.filter((p) => p.tipo === "bolsa_valores").length,
        orgao_regulador: PONTOS_GEO_EUA.filter((p) => p.tipo === "orgao_regulador").length,
        mina_estrategica: PONTOS_GEO_EUA.filter((p) => p.tipo === "mina_estrategica").length,
      },
      aviso: "Coordenadas em datum WGS84 compiladas a partir de relatórios regulatórios oficiais (SEC EDGAR, EPA ECHO, USGS MRDS, MSHA).",
    },
    features: PONTOS_GEO_EUA.map((ponto) => ({
      type: "Feature" as const,
      id: ponto.id,
      geometry: {
        type: "Point" as const,
        coordinates: [ponto.longitude, ponto.latitude],
      },
      properties: {
        id: ponto.id,
        nome: ponto.nome,
        entidade: ponto.entidade,
        tipo: ponto.tipo,
        setor: ponto.setor,
        cidade: ponto.cidade,
        estadoUsa: ponto.estadoUsa,
        regulador: ponto.regulador,
        fonteOficial: ponto.fonteOficial,
        descricao: ponto.descricao,
      },
    })),
  };
}

/**
 * Executa o ETL: gera o GeoJSON e o arquivo compacto em JSON.
 */
export function executarEtlEuaGeo(): void {
  console.log("🇺🇸 Iniciando ETL de Capitais, Regulação e Mineração dos Estados Unidos...");

  // 1. Gera e salva o GeoJSON no Globo 3D Terras
  fs.mkdirSync(path.dirname(GEOJSON_DESTINO), { recursive: true });
  const geojson = gerarGeoJsonCapitaisMineracaoEua();
  fs.writeFileSync(GEOJSON_DESTINO, JSON.stringify(geojson, null, 2), "utf-8");
  console.log(`✓ GeoJSON salvo em: ${GEOJSON_DESTINO} (${PONTOS_GEO_EUA.length} feições)`);

  // 2. Compacta a base para o frontend Next.js (esqueleto + dicionários)
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const compactado = compactar(PONTOS_GEO_EUA as unknown as Record<string, unknown>[]);
  fs.writeFileSync(COMPACT_DESTINO, JSON.stringify(compactado), "utf-8");
  console.log(`✓ Dataset compacto salvo em: ${COMPACT_DESTINO}`);
}

if (process.argv[1] && process.argv[1].endsWith("gerar-acervo-eua-geo.mts")) {
  executarEtlEuaGeo();
}
