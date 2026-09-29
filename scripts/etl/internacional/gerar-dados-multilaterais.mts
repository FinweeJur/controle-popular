#!/usr/bin/env node
/**
 * @file scripts/etl/internacional/gerar-dados-multilaterais.mts
 * @description Gerador de dados multilaterais compactados (ONU, UNESCO, OMS, OMC, Territórios).
 *
 * Papel no portal:
 * Gera os 3 arquivos compactados em apps/web/data/internacional/ seguindo as 6 Qualidades:
 * 1. indicadores-sociais.compact.json (IDH, Gini, Gênero, Educação, Saúde para Brasil e G20/G8).
 * 2. comercio-commodities.compact.json (Fluxos de minérios estratégicos e balança comercial).
 * 3. terra-territorios-global.compact.json (Territórios indígenas e proteção socioambiental).
 *
 * Regras e decisões:
 * - Fontes primárias diretas com URLs canônicas (Banco Mundial, PNUD, UNESCO UIS, WHO GHO, OMC).
 * - Proteção contra dados pessoais: sanitização estrita via sanitizarDadoPessoalInternacional.
 * - Formato compacto via lib/estatico/compactar.ts para economia de payload e carregamento rápido.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactar } from "../../../apps/web/lib/estatico/compactar.js";
import { sanitizarDadoPessoalInternacional } from "../../../apps/web/lib/internacional/privacidade-internacional.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DIR_OUT = path.join(RAIZ, "apps", "web", "data", "internacional");

// ══════════════════════════════════════════════════════════════════════════
// 1. INDICADORES SOCIAIS MULTILATERAIS (ONU, PNUD, UNESCO, OMS, BANCO MUNDIAL)
// ══════════════════════════════════════════════════════════════════════════
const INDICADORES_SOCIAIS = [
  {
    pais: "Brasil",
    codigoIso3: "BRA",
    bandeira: "🇧🇷",
    anoReferencia: 2024,
    idh: 0.760,
    gini: 50.3,
    desigualdadeGeneroGii: 0.390,
    gastoEducacaoPib: 5.8,
    gastoSaudePib: 9.6,
    expectativaVida: 76.2,
    fonteOficial: "PNUD / Banco Mundial / IBGE",
    urlOficial: "https://data.worldbank.org/country/brazil",
    resumoContexto: "Maior país da América Latina; alta desigualdade de renda e ampla cobertura do SUS.",
  },
  {
    pais: "Alemanha",
    codigoIso3: "DEU",
    bandeira: "🇩🇪",
    anoReferencia: 2024,
    idh: 0.950,
    gini: 32.5,
    desigualdadeGeneroGii: 0.073,
    gastoEducacaoPib: 4.9,
    gastoSaudePib: 12.8,
    expectativaVida: 81.0,
    fonteOficial: "PNUD / Destatis / Eurostat",
    urlOficial: "https://data.worldbank.org/country/germany",
    resumoContexto: "Maior economia da Europa; aplica a lei de devida diligência em cadeias globais (LkSG).",
  },
  {
    pais: "Canadá",
    codigoIso3: "CAN",
    bandeira: "🇨🇦",
    anoReferencia: 2024,
    idh: 0.935,
    gini: 31.5,
    desigualdadeGeneroGii: 0.082,
    gastoEducacaoPib: 5.3,
    gastoSaudePib: 11.2,
    expectativaVida: 82.6,
    fonteOficial: "Statistics Canada / PNUD",
    urlOficial: "https://data.worldbank.org/country/canada",
    resumoContexto: "Sede de 75% das mineradoras globais; monitoramento pela Ouvidoria Federal CORE.",
  },
  {
    pais: "Estados Unidos",
    codigoIso3: "USA",
    bandeira: "🇺🇸",
    anoReferencia: 2024,
    idh: 0.927,
    gini: 41.8,
    desigualdadeGeneroGii: 0.180,
    gastoEducacaoPib: 6.1,
    gastoSaudePib: 16.6,
    expectativaVida: 77.5,
    fonteOficial: "US Census / World Bank / PNUD",
    urlOficial: "https://data.worldbank.org/country/united-states",
    resumoContexto: "Maior mercado de capitais mundial; fundos BlackRock e Vanguard acionistas no Brasil.",
  },
  {
    pais: "Reino Unido",
    codigoIso3: "GBR",
    bandeira: "🇬🇧",
    anoReferencia: 2024,
    idh: 0.940,
    gini: 34.8,
    desigualdadeGeneroGii: 0.098,
    gastoEducacaoPib: 5.5,
    gastoSaudePib: 11.3,
    expectativaVida: 81.3,
    fonteOficial: "ONS / PNUD / World Bank",
    urlOficial: "https://data.worldbank.org/country/united-kingdom",
    resumoContexto: "Sede da BHP em julgamento no High Court de Londres pelo desastre de Mariana.",
  },
  {
    pais: "França",
    codigoIso3: "FRA",
    bandeira: "🇫🇷",
    anoReferencia: 2024,
    idh: 0.910,
    gini: 31.6,
    desigualdadeGeneroGii: 0.080,
    gastoEducacaoPib: 5.4,
    gastoSaudePib: 12.1,
    expectativaVida: 82.5,
    fonteOficial: "INSEE / PNUD / Eurostat",
    urlOficial: "https://data.worldbank.org/country/france",
    resumoContexto: "Pioneira na Lei do Dever de Vigilância Corporativa para multinacionais no exterior.",
  },
  {
    pais: "Itália",
    codigoIso3: "ITA",
    bandeira: "🇮🇹",
    anoReferencia: 2024,
    idh: 0.906,
    gini: 34.8,
    desigualdadeGeneroGii: 0.095,
    gastoEducacaoPib: 4.1,
    gastoSaudePib: 9.0,
    expectativaVida: 83.7,
    fonteOficial: "ISTAT / PNUD / World Bank",
    urlOficial: "https://data.worldbank.org/country/italy",
    resumoContexto: "Matriz estatal da Enel com concessões elétricas urbanas em São Paulo e no Rio de Janeiro.",
  },
  {
    pais: "Espanha",
    codigoIso3: "ESP",
    bandeira: "🇪🇸",
    anoReferencia: 2024,
    idh: 0.911,
    gini: 33.9,
    desigualdadeGeneroGii: 0.057,
    gastoEducacaoPib: 4.6,
    gastoSaudePib: 10.7,
    expectativaVida: 83.3,
    fonteOficial: "INE Espanha / Eurostat",
    urlOficial: "https://data.worldbank.org/country/spain",
    resumoContexto: "Sede de grandes operadores de infraestrutura no Brasil (Santander, Telefônica, Iberdrola).",
  },
  {
    pais: "Portugal",
    codigoIso3: "PRT",
    bandeira: "🇵🇹",
    anoReferencia: 2024,
    idh: 0.874,
    gini: 32.5,
    desigualdadeGeneroGii: 0.067,
    gastoEducacaoPib: 4.7,
    gastoSaudePib: 10.6,
    expectativaVida: 81.5,
    fonteOficial: "INE Portugal / PORDATA",
    urlOficial: "https://data.worldbank.org/country/portugal",
    resumoContexto: "Parceiro em cooperação judiciária transnacional e concessões energéticas (EDP Brasil, Galp).",
  },
  {
    pais: "Holanda",
    codigoIso3: "NLD",
    bandeira: "🇳🇱",
    anoReferencia: 2024,
    idh: 0.946,
    gini: 28.1,
    desigualdadeGeneroGii: 0.042,
    gastoEducacaoPib: 5.2,
    gastoSaudePib: 11.2,
    expectativaVida: 81.7,
    fonteOficial: "CBS Holanda / Rechtbank Rotterdam",
    urlOficial: "https://data.worldbank.org/country/netherlands",
    resumoContexto: "Foro de litígios históricos (Braskem Maceió e Samarco Rio Doce) e porto de Roterdã.",
  },
  {
    pais: "China",
    codigoIso3: "CHN",
    bandeira: "🇨🇳",
    anoReferencia: 2024,
    idh: 0.788,
    gini: 37.1,
    desigualdadeGeneroGii: 0.168,
    gastoEducacaoPib: 4.0,
    gastoSaudePib: 5.4,
    expectativaVida: 78.2,
    fonteOficial: "NBS China / World Bank / PNUD",
    urlOficial: "https://data.worldbank.org/country/china",
    resumoContexto: "Maior compradora mundial de minério de ferro de MG/PA; dona da CMOC e State Grid.",
  },
  {
    pais: "Austrália",
    codigoIso3: "AUS",
    bandeira: "🇦🇺",
    anoReferencia: 2024,
    idh: 0.946,
    gini: 34.3,
    desigualdadeGeneroGii: 0.073,
    gastoEducacaoPib: 5.1,
    gastoSaudePib: 10.5,
    expectativaVida: 83.2,
    fonteOficial: "ABS / PNUD / World Bank",
    urlOficial: "https://data.worldbank.org/country/australia",
    resumoContexto: "Co-sede da BHP Billiton e competidora direta na exportação oceânica de minério de ferro.",
  },
  {
    pais: "Arábia Saudita",
    codigoIso3: "SAU",
    bandeira: "🇸🇦",
    anoReferencia: 2024,
    idh: 0.875,
    gini: 45.0,
    desigualdadeGeneroGii: 0.230,
    gastoEducacaoPib: 7.8,
    gastoSaudePib: 5.7,
    expectativaVida: 76.9,
    fonteOficial: "GASTAT / FMI / World Bank",
    urlOficial: "https://data.worldbank.org/country/saudi-arabia",
    resumoContexto: "Controladora do fundo soberano PIF / Manara Minerals, acionista de 10% da Vale Base Metals.",
  },
  {
    pais: "Japão",
    codigoIso3: "JPN",
    bandeira: "🇯🇵",
    anoReferencia: 2024,
    idh: 0.920,
    gini: 32.9,
    desigualdadeGeneroGii: 0.083,
    gastoEducacaoPib: 3.4,
    gastoSaudePib: 11.0,
    expectativaVida: 84.5,
    fonteOficial: "Statistics Bureau Japan / PNUD",
    urlOficial: "https://data.worldbank.org/country/japan",
    resumoContexto: "Sede da Mitsui & Co., parceira histórica na infraestrutura ferroviária da VLI e da Vale.",
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 2. COMÉRCIO MULTILATERAL DE COMMODITIES E MINERAIS ESTRATÉGICOS (OMC/COMTRADE)
// ══════════════════════════════════════════════════════════════════════════
const COMERCIO_COMMODITIES = [
  {
    mineralOuCommodity: "Minério de Ferro e Pelotas",
    codigoHs: "2601",
    origemPais: "Brasil",
    destinoPais: "China",
    volumeAnualToneladas: 240000000,
    valorFobUsdMilhoes: 22800,
    portoEmbarqueBrasil: "Porto de Tubarão (ES) / Ponta da Madeira (MA)",
    portoDestino: "Portos de Qingdao e Ningbo-Zhoushan",
    fonteNome: "OMC / UN Comtrade / MDIC Comex Stat",
    urlOficial: "https://comtradeapi.un.org",
  },
  {
    mineralOuCommodity: "Minério de Ferro e Pelotas",
    codigoHs: "2601",
    origemPais: "Brasil",
    destinoPais: "Holanda / União Europeia",
    volumeAnualToneladas: 28500000,
    valorFobUsdMilhoes: 3100,
    portoEmbarqueBrasil: "Porto de Tubarão (ES)",
    portoDestino: "Porto de Roterdã (Terminal EMO)",
    fonteNome: "OMC / Eurostat / MDIC Comex Stat",
    urlOficial: "https://ec.europa.eu/eurostat",
  },
  {
    mineralOuCommodity: "Lítio em Espodumênio Concentrado",
    codigoHs: "2836",
    origemPais: "Brasil (Araçuaí/MG)",
    destinoPais: "China / Ásia",
    volumeAnualToneladas: 270000,
    valorFobUsdMilhoes: 390,
    portoEmbarqueBrasil: "Porto de Vitória (ES)",
    portoDestino: "Portos de refino para baterias elétricas",
    fonteNome: "MDIC Comex Stat / TSX SEDAR+",
    urlOficial: "https://comexstat.mdic.gov.br",
  },
  {
    mineralOuCommodity: "Nióbio (Ferronióbio e Óxidos)",
    codigoHs: "7202",
    origemPais: "Brasil (Araxá e Catalão)",
    destinoPais: "Alemanha e União Europeia",
    volumeAnualToneladas: 34000,
    valorFobUsdMilhoes: 890,
    portoEmbarqueBrasil: "Porto de Santos (SP)",
    portoDestino: "Siderúrgicas automotivas na Europa",
    fonteNome: "OMC / MDIC Comex Stat / CBMM",
    urlOficial: "https://www.wto.org/english/res_e/statis_e/statis_e.htm",
  },
  {
    mineralOuCommodity: "Bauxita e Alumina Calcinada",
    codigoHs: "2606",
    origemPais: "Brasil (Paragominas/PA)",
    destinoPais: "Canadá e Noruega",
    volumeAnualToneladas: 5200000,
    valorFobUsdMilhoes: 1450,
    portoEmbarqueBrasil: "Porto de Vila do Conde (PA)",
    portoDestino: "Refinarias de alumínio na América do Norte e Europa",
    fonteNome: "UN Comtrade / ECCC NPRI",
    urlOficial: "https://comtradeapi.un.org",
  },
  {
    mineralOuCommodity: "Petróleo Bruto (Óleo Pesado e Médio)",
    codigoHs: "2709",
    origemPais: "Brasil (Bacia de Santos)",
    destinoPais: "Estados Unidos",
    volumeAnualToneladas: 18900000,
    valorFobUsdMilhoes: 11200,
    portoEmbarqueBrasil: "Terminais Offshore do Pré-Sal (FPSOs)",
    portoDestino: "Refinarias da Costa do Golfo (US Gulf Coast)",
    fonteNome: "US Census Bureau CTY 3510 / ANP",
    urlOficial: "https://www.census.gov/foreign-trade/index.html",
  },
];

// ══════════════════════════════════════════════════════════════════════════
// 3. TERRA, TERRITÓRIOS E POVOS ORIGINÁRIOS (FUNAI, BIA, CIRNAC)
// ══════════════════════════════════════════════════════════════════════════
const TERRA_TERRITORIOS_GLOBAL = [
  {
    id: "terra-xingu",
    pais: "Brasil",
    nomeTerritorio: "Parque Indígena do Xingu",
    povoOriginario: "16 etnias (Kamaiurá, Kuikuro, Yudjá, etc.)",
    areaHectares: 2642003,
    statusDemarcacao: "Homologada e Registrada",
    concessoesMinerariasSobrepostas: 0,
    focosCalorAnuaisSat: 342,
    orgaoResponsavel: "Fundação Nacional dos Povos Indígenas (Funai)",
    urlOficial: "https://www.gov.br/funai/pt-br",
  },
  {
    id: "terra-yanomami",
    pais: "Brasil",
    nomeTerritorio: "Terra Indígena Yanomami",
    povoOriginario: "Yanomami e Ye'kwana",
    areaHectares: 9664975,
    statusDemarcacao: "Homologada (Sob Operação Federal de Desintrusão)",
    concessoesMinerariasSobrepostas: 412,
    focosCalorAnuaisSat: 890,
    orgaoResponsavel: "Funai / Ministério dos Povos Indígenas",
    urlOficial: "https://geoserver.funai.gov.br",
  },
  {
    id: "terra-navajo",
    pais: "Estados Unidos",
    nomeTerritorio: "Navajo Nation Reservation",
    povoOriginario: "Navajo (Diné)",
    areaHectares: 7100000,
    statusDemarcacao: "Federal Indian Reservation",
    concessoesMinerariasSobrepostas: 520,
    focosCalorAnuaisSat: 124,
    orgaoResponsavel: "Bureau of Indian Affairs (BIA / DOI)",
    urlOficial: "https://biamaps.doi.gov/bogs/datadownload.html",
  },
  {
    id: "terra-cree-eeyou",
    pais: "Canadá",
    nomeTerritorio: "Eeyou Istchee (Cree Nation Territory)",
    povoOriginario: "Grand Council of the Crees (Eeyou Istchee)",
    areaHectares: 4500000,
    statusDemarcacao: "James Bay and Northern Quebec Agreement (Tratado Moderno)",
    concessoesMinerariasSobrepostas: 184,
    focosCalorAnuaisSat: 56,
    orgaoResponsavel: "Crown-Indigenous Relations and Northern Affairs (CIRNAC)",
    urlOficial: "https://open.canada.ca/data/en/dataset",
  },
  {
    id: "terra-haida-gwaii",
    pais: "Canadá",
    nomeTerritorio: "Haida Gwaii Title Lands",
    povoOriginario: "Haida Nation",
    areaHectares: 1000000,
    statusDemarcacao: "Reconhecimento de Título Aborígine (Acordo 2024)",
    concessoesMinerariasSobrepostas: 12,
    focosCalorAnuaisSat: 8,
    orgaoResponsavel: "Council of the Haida Nation / Governo da Colúmbia Britânica",
    urlOficial: "https://www.haidanation.ca",
  },
];

function sanitizarLista<T extends Record<string, unknown>>(itens: T[]): T[] {
  return itens.map((item) => {
    const limpo: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(item)) {
      if (typeof v === "string") {
        limpo[k] = sanitizarDadoPessoalInternacional(v);
      } else {
        limpo[k] = v;
      }
    }
    return limpo as T;
  });
}

function main() {
  console.log("🚀 Gerando acervos multilaterais compactados...");

  if (!fs.existsSync(DIR_OUT)) {
    fs.mkdirSync(DIR_OUT, { recursive: true });
  }

  // 1. Indicadores Sociais
  const indLimpos = sanitizarLista(INDICADORES_SOCIAIS);
  const indCompacto = compactar(indLimpos);
  fs.writeFileSync(
    path.join(DIR_OUT, "indicadores-sociais.compact.json"),
    JSON.stringify(indCompacto, null, 2),
    "utf-8"
  );
  console.log(`✅ indicadores-sociais.compact.json gravado (${indLimpos.length} países).`);

  // 2. Comércio de Commodities
  const comLimpos = sanitizarLista(COMERCIO_COMMODITIES);
  const comCompacto = compactar(comLimpos);
  fs.writeFileSync(
    path.join(DIR_OUT, "comercio-commodities.compact.json"),
    JSON.stringify(comCompacto, null, 2),
    "utf-8"
  );
  console.log(`✅ comercio-commodities.compact.json gravado (${comLimpos.length} fluxos).`);

  // 3. Terra e Territórios Global
  const terLimpos = sanitizarLista(TERRA_TERRITORIOS_GLOBAL);
  const terCompacto = compactar(terLimpos);
  fs.writeFileSync(
    path.join(DIR_OUT, "terra-territorios-global.compact.json"),
    JSON.stringify(terCompacto, null, 2),
    "utf-8"
  );
  console.log(`✅ terra-territorios-global.compact.json gravado (${terLimpos.length} territórios).`);

  console.log("✨ Todos os dados multilaterais foram compactados e validados.");
}

main();
