/**
 * @file scripts/etl/internacional/gerar-acervo-canada-geo.mts
 * @description ETL gerador do acervo geoespacial e compacto de mineração no Canadá (/canada).
 *
 * Papel no portal:
 * 1. Mapeia sedes corporativas globais de mineradoras canadenses com forte atuação no Brasil e
 *    na América Latina (Vale Base Metals, Kinross Gold, Lundin Mining, Sigma Lithium, Belo Sun,
 *    Ero Copper, Equinox Gold, Teck Resources, Barrick Gold, First Quantum Minerals, Aura Minerals, etc.),
 *    a Bolsa de Valores de Toronto (TSX/TSX-V), principais operações/minas ativas no Canadá e
 *    órgãos reguladores federais/provinciais (NRCan/ESTMA, ECCC/NPRI, OSC, Ouvidoria CORE).
 * 2. Gera o arquivo GeoJSON oficial no padrão do Globo 3D Terras:
 *    `apps/web/public/terras/globo/dados/camadas/sedes-mineracao-canada.geojson`
 * 3. Compacta o dataset no formato esqueleto + dicionários do repositório em:
 *    `apps/web/data/internacional/canada-geo.compact.json`
 *
 * Fontes oficiais consultadas:
 * - Natural Resources Canada (NRCan) / Extractive Sector Transparency Measures Act (ESTMA).
 * - Environment and Climate Change Canada (ECCC) / National Pollutant Release Inventory (NPRI).
 * - Ontario Securities Commission (OSC) / SEDAR+ (System for Electronic Data Analysis and Retrieval+).
 * - Toronto Stock Exchange (TSX / TSX Venture Exchange - TMX Group).
 * - Impact Assessment Agency of Canada (IAAC) / British Columbia Ministry of Energy and Mines.
 * - Office of the Canadian Ombudsperson for Responsible Enterprise (CORE).
 *
 * Decisões técnicas e restrições (AGENTS.md §5.2, §5.9, §8):
 * - WGS84 FeatureCollection com coordenadas [longitude, latitude].
 * - Sanitização automática de dados pessoais (zero CPFs, zero SIN canadense).
 * - Descrições concisas em português direto com no máximo 180 caracteres.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactar } from "../../../apps/web/lib/estatico/compactar.js";
import { sanitizarDadoPessoalInternacional } from "../../../apps/web/lib/internacional/privacidade-internacional.js";

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
  "sedes-mineracao-canada.geojson"
);
const DATA_DIR = path.join(RAIZ, "apps", "web", "data", "internacional");
const JSON_COMPACTO_DESTINO = path.join(DATA_DIR, "canada-geo.compact.json");

export type TipoPontoMineracaoCanada =
  | "sede_corporativa"
  | "mina_operacao"
  | "bolsa_valores"
  | "orgao_regulador";

export type BolsaListadaCanada = "TSX" | "TSX-V" | "NYSE";

export interface PontoGeoMineracaoCanada {
  id: string;
  nome: string;
  empresa: string;
  tipo: TipoPontoMineracaoCanada;
  mineralPrincipal: string;
  cidade: string;
  provincia: string;
  bolsaListada: BolsaListadaCanada;
  latitude: number;
  longitude: number;
  fonteOficial: string;
  descricao: string;
}

export const PONTOS_MINERACAO_CANADA: PontoGeoMineracaoCanada[] = [
  // --- TORONTO & ONTÁRIO (Centro Financeiro, Sedes e Reguladores) ---
  {
    id: "ca-tsx-bolsa",
    nome: "Bolsa de Valores de Toronto (TSX / TSX Venture)",
    empresa: "TMX Group Limited",
    tipo: "bolsa_valores",
    mineralPrincipal: "Mercado de Capitais Mineral",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 43.6487,
    longitude: -79.3817,
    fonteOficial: "https://www.tsx.com",
    descricao: "Principal praça financeira de mineração global. Concentra mais de 40% das mineradoras de capital aberto do mundo, com projetos ativos em MG e na Amazônia.",
  },
  {
    id: "ca-vale-base-metals-sede",
    nome: "Sede Global da Vale Base Metals (Vale Canada)",
    empresa: "Vale Canada Limited (Vale S.A.)",
    tipo: "sede_corporativa",
    mineralPrincipal: "Níquel, Cobre e Cobalto",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "NYSE",
    latitude: 43.6468,
    longitude: -79.3795,
    fonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000917851",
    descricao: "Sede mundial da divisão de transição energética da brasileira Vale S.A., controlando minas em Sudbury, Thompson, Voisey's Bay e no Pará (Salobo e Onça Puma).",
  },
  {
    id: "ca-kinross-sede",
    nome: "Sede Corporativa Global - Kinross Gold",
    empresa: "Kinross Gold Corporation",
    tipo: "sede_corporativa",
    mineralPrincipal: "Ouro e Prata",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 43.6496,
    longitude: -79.3789,
    fonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0000701818",
    descricao: "Matriz proprietária da Mina Morro do Ouro em Paracatu (MG), maior mina de ouro a céu aberto do Brasil e uma das maiores do planeta.",
  },
  {
    id: "ca-barrick-sede",
    nome: "Sede Corporativa Global - Barrick Gold",
    empresa: "Barrick Gold Corporation",
    tipo: "sede_corporativa",
    mineralPrincipal: "Ouro e Cobre",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 43.6473,
    longitude: -79.3792,
    fonteOficial: "https://www.barrick.com",
    descricao: "Uma das maiores mineradoras de ouro do mundo, com megaprojetos na América Latina como Veladero (Argentina) e Pueblo Viejo (República Dominicana).",
  },
  {
    id: "ca-belosun-sede",
    nome: "Sede Corporativa - Belo Sun Mining Corp.",
    empresa: "Belo Sun Mining Corp. (Forbes & Manhattan)",
    tipo: "sede_corporativa",
    mineralPrincipal: "Ouro",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 43.6515,
    longitude: -79.3824,
    fonteOficial: "https://www.sedarplus.ca",
    descricao: "Canadense do grupo Forbes & Manhattan que busca implantar o Projeto Volta Grande no Rio Xingu (PA), alvo de litígio judicial por povos indígenas e MPF.",
  },
  {
    id: "ca-brazil-potash-sede",
    nome: "Sede Corporativa - Brazil Potash Corp.",
    empresa: "Brazil Potash Corp. (Forbes & Manhattan)",
    tipo: "sede_corporativa",
    mineralPrincipal: "Potássio (Silvinita)",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "NYSE",
    latitude: 43.6742,
    longitude: -79.3948,
    fonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001472326",
    descricao: "Matriz da Potássio do Brasil, que projeta extração subterrânea de fertilizante potássico em Autazes (AM), sob disputa judicial com o Povo Mura.",
  },
  {
    id: "ca-aura-minerals-sede",
    nome: "Sede Corporativa - Aura Minerals Inc.",
    empresa: "Aura Minerals Inc.",
    tipo: "sede_corporativa",
    mineralPrincipal: "Ouro e Cobre",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 43.6502,
    longitude: -79.3855,
    fonteOficial: "https://www.sedarplus.ca",
    descricao: "Mineradora multibilionária com dupla listagem na TSX e B3; opera as minas de ouro Apoena (MT), Almas (TO) e implanta o Projeto Borborema (RN).",
  },
  {
    id: "ca-jaguar-mining-sede",
    nome: "Sede Corporativa - Jaguar Mining Inc.",
    empresa: "Jaguar Mining Inc.",
    tipo: "sede_corporativa",
    mineralPrincipal: "Ouro",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 43.6481,
    longitude: -79.3804,
    fonteOficial: "https://www.sedarplus.ca",
    descricao: "Matriz da MSOL em Minas Gerais, operando minas subterrâneas de ouro em Santa Bárbara e Conceição do Pará no Quadrilátero Ferrífero.",
  },
  {
    id: "ca-osc-regulador",
    nome: "Comissão de Valores Mobiliários de Ontário (OSC)",
    empresa: "Ontario Securities Commission",
    tipo: "orgao_regulador",
    mineralPrincipal: "Regulação de Mercado e Divulgação Mineral",
    cidade: "Toronto",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 43.6521,
    longitude: -79.3811,
    fonteOficial: "https://www.osc.ca",
    descricao: "Regulador que fiscaliza as empresas listadas na TSX e o cumprimento do padrão internacional de divulgação técnica de reservas minerais NI 43-101.",
  },

  // --- VANCOUVER & BRITISH COLUMBIA (Polo TSX-V e Minerais Críticos) ---
  {
    id: "ca-lundin-mining-sede",
    nome: "Sede Corporativa Global - Lundin Mining",
    empresa: "Lundin Mining Corporation",
    tipo: "sede_corporativa",
    mineralPrincipal: "Cobre, Ouro e Zinco",
    cidade: "Vancouver",
    provincia: "British Columbia",
    bolsaListada: "TSX",
    latitude: 49.2863,
    longitude: -123.1187,
    fonteOficial: "https://www.lundinmining.com",
    descricao: "Grupo canadense controlador do Complexo Chapada em Goiás (Mina Chapada / Saúva) e da megamina Candelaria no Chile, com forte atuação em cobre e ouro.",
  },
  {
    id: "ca-sigma-lithium-sede",
    nome: "Sede Corporativa - Sigma Lithium Corporation",
    empresa: "Sigma Lithium Corporation",
    tipo: "sede_corporativa",
    mineralPrincipal: "Lítio (Espodumênio Verde)",
    cidade: "Vancouver",
    provincia: "British Columbia",
    bolsaListada: "TSX-V",
    latitude: 49.2842,
    longitude: -123.1215,
    fonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001848309",
    descricao: "Controladora do Projeto Grota do Cirilo em Araçuaí e Itinga (Vale do Jequitinhonha, MG), pioneira em empilhamento a seco de rejeitos de lítio.",
  },
  {
    id: "ca-teck-resources-sede",
    nome: "Sede Corporativa Global - Teck Resources",
    empresa: "Teck Resources Limited",
    tipo: "sede_corporativa",
    mineralPrincipal: "Cobre, Zinco e Carvão Siderúrgico",
    cidade: "Vancouver",
    provincia: "British Columbia",
    bolsaListada: "TSX",
    latitude: 49.2858,
    longitude: -123.1192,
    fonteOficial: "https://www.teck.com",
    descricao: "Maior mineradora diversificada do Canadá. Opera megaminas de cobre na América Latina como Quebrada Blanca (Chile) e Antamina (Peru).",
  },
  {
    id: "ca-first-quantum-sede",
    nome: "Sede Corporativa Global - First Quantum Minerals",
    empresa: "First Quantum Minerals Ltd.",
    tipo: "sede_corporativa",
    mineralPrincipal: "Cobre, Níquel e Ouro",
    cidade: "Vancouver",
    provincia: "British Columbia",
    bolsaListada: "TSX",
    latitude: 49.2875,
    longitude: -123.1136,
    fonteOficial: "https://www.first-quantum.com",
    descricao: "Gigante canadense de cobre. Operou a controversa mina Cobre Panamá, paralisada pela Suprema Corte panamenha após massivos protestos cívicos e populares.",
  },
  {
    id: "ca-equinox-gold-sede",
    nome: "Sede Corporativa - Equinox Gold Corp.",
    empresa: "Equinox Gold Corp.",
    tipo: "sede_corporativa",
    mineralPrincipal: "Ouro",
    cidade: "Vancouver",
    provincia: "British Columbia",
    bolsaListada: "TSX",
    latitude: 49.2851,
    longitude: -123.1179,
    fonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001756607",
    descricao: "Produtora de ouro com sede em Vancouver. Opera a mina Riacho dos Machados (MG), Aurizona (MA) e os complexos Fazenda e Santa Luz (BA).",
  },
  {
    id: "ca-ero-copper-sede",
    nome: "Sede Corporativa - Ero Copper Corp.",
    empresa: "Ero Copper Corp.",
    tipo: "sede_corporativa",
    mineralPrincipal: "Cobre e Ouro",
    cidade: "Vancouver",
    provincia: "British Columbia",
    bolsaListada: "TSX",
    latitude: 49.2849,
    longitude: -123.1154,
    fonteOficial: "https://www.sec.gov/edgar/browse/?CIK=0001853860",
    descricao: "Controladora da Mineração Caraíba na Bahia (Complexo Caraíba / Mina Pilar), do Projeto Tucumã no Pará e da mina Xavantina em Mato Grosso.",
  },

  // --- MONTREAL & CALGARY ---
  {
    id: "ca-gmining-sede",
    nome: "Sede Corporativa - G Mining Ventures Corp.",
    empresa: "G Mining Ventures Corp.",
    tipo: "sede_corporativa",
    mineralPrincipal: "Ouro",
    cidade: "Brossard (Grande Montreal)",
    provincia: "Quebec",
    bolsaListada: "TSX",
    latitude: 45.4485,
    longitude: -73.4412,
    fonteOficial: "https://www.gminingventures.com",
    descricao: "Desenvolvedora de minas de ouro que colocou em operação comercial a mina de Tocantinzinho em Itaituba (PA) e o projeto CentroGold no Maranhão.",
  },
  {
    id: "ca-nutrien-sede",
    nome: "Sede Corporativa Global - Nutrien Ltd.",
    empresa: "Nutrien Ltd.",
    tipo: "sede_corporativa",
    mineralPrincipal: "Potássio e Fertilizantes",
    cidade: "Calgary",
    provincia: "Alberta",
    bolsaListada: "TSX",
    latitude: 51.0441,
    longitude: -114.0732,
    fonteOficial: "https://www.nutrien.com",
    descricao: "Maior produtora mundial de potássio; o Canadá é a principal fonte de importação de fertilizantes potássicos para a agricultura e safra de grãos do Brasil.",
  },

  // --- MINAS E OPERAÇÕES CHAVE NO CANADÁ ---
  {
    id: "ca-vale-sudbury-operacao",
    nome: "Complexo Minerário e Fundição Copper Cliff (Vale)",
    empresa: "Vale Canada Limited",
    tipo: "mina_operacao",
    mineralPrincipal: "Níquel, Cobre e Platina",
    cidade: "Greater Sudbury",
    provincia: "Ontario",
    bolsaListada: "NYSE",
    latitude: 46.4719,
    longitude: -81.0569,
    fonteOficial: "https://pollution-waste.canada.ca/national-release-inventory/",
    descricao: "Coração histórico das minas subterrâneas de níquel da Vale no Canadá. Monitorada pelo NPRI para emissões atmosféricas e disposição de rejeitos.",
  },
  {
    id: "ca-vale-thompson-operacao",
    nome: "Mina Thompson e Usina de Níquel (Vale)",
    empresa: "Vale Canada Limited",
    tipo: "mina_operacao",
    mineralPrincipal: "Níquel e Cobalto",
    cidade: "Thompson",
    provincia: "Manitoba",
    bolsaListada: "NYSE",
    latitude: 55.7435,
    longitude: -97.8558,
    fonteOficial: "https://www.gov.mb.ca/iem/mines/",
    descricao: "Operação subterrânea de níquel da Vale no norte de Manitoba, fornecendo sulfeto de alta pureza para refino e transição energética.",
  },
  {
    id: "ca-vale-voiseys-bay-operacao",
    nome: "Mina de Níquel e Cobre de Voisey's Bay (Vale)",
    empresa: "Vale Newfoundland & Labrador Ltd.",
    tipo: "mina_operacao",
    mineralPrincipal: "Níquel, Cobre e Cobalto",
    cidade: "Voisey's Bay",
    provincia: "Newfoundland and Labrador",
    bolsaListada: "NYSE",
    latitude: 56.3353,
    longitude: -62.0911,
    fonteOficial: "https://iaac-aeic.gc.ca",
    descricao: "Mina de níquel da Vale no subártico, operada sob Acordo de Impactos e Benefícios (IBA) com os povos indígenas originários Innu e Inuit (Nunatsiavut).",
  },
  {
    id: "ca-mount-polley-desastre",
    nome: "Mina Mount Polley (Desastre de Rompimento de Barragem)",
    empresa: "Mount Polley Mining Corp. (Imperial Metals)",
    tipo: "mina_operacao",
    mineralPrincipal: "Cobre e Ouro",
    cidade: "Likely (Lago Quesnel)",
    provincia: "British Columbia",
    bolsaListada: "TSX",
    latitude: 52.5511,
    longitude: -121.6033,
    fonteOficial: "https://mines.nrs.gov.bc.ca/p/58851197aaecd9001b8227cc/overview",
    descricao: "Local do desastre de 2014 onde 25 milhões de m³ de rejeitos contaminaram o Lago Quesnel; investigado pelo mesmo perito que checou Fundão em Mariana.",
  },

  // --- ÓRGÃOS REGULADORES E OUVIDORIAS FEDERAIS ---
  {
    id: "ca-nrcan-regulador",
    nome: "Ministério de Recursos Naturais do Canadá (NRCan / ESTMA)",
    empresa: "Natural Resources Canada",
    tipo: "orgao_regulador",
    mineralPrincipal: "Políticas Minerais e Transparência ESTMA",
    cidade: "Ottawa",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 45.4011,
    longitude: -75.7072,
    fonteOficial: "https://natural-resources.canada.ca/our-natural-resources/minerals-mining/mining-policy-taxation-industry/extractive-sector-transparency-measures-act/18188",
    descricao: "Aplica a lei federal ESTMA, obrigando mineradoras canadenses a divulgar pagamentos de royalties e taxas a governos estrangeiros, incluindo a ANM no Brasil.",
  },
  {
    id: "ca-npri-regulador",
    nome: "Inventário Nacional de Emissões de Poluentes (NPRI / ECCC)",
    empresa: "Environment and Climate Change Canada",
    tipo: "orgao_regulador",
    mineralPrincipal: "Rejeitos, Efluentes e Emissões Minerais",
    cidade: "Gatineau / Ottawa",
    provincia: "Quebec",
    bolsaListada: "TSX",
    latitude: 45.4281,
    longitude: -75.7208,
    fonteOficial: "https://pollution-waste.canada.ca/national-release-inventory/",
    descricao: "Base pública federal obrigatória que rastreia descarte de rejeitos e poluentes tóxicos em todas as minas e fundições do Canadá para fiscalização socioambiental.",
  },
  {
    id: "ca-core-ombuds-regulador",
    nome: "Ouvidoria Canadense para Empresas Responsáveis (CORE)",
    empresa: "Office of the Canadian Ombudsperson for Responsible Enterprise",
    tipo: "orgao_regulador",
    mineralPrincipal: "Direitos Humanos e Mineração no Exterior",
    cidade: "Ottawa",
    provincia: "Ontario",
    bolsaListada: "TSX",
    latitude: 45.4344,
    longitude: -75.6961,
    fonteOficial: "https://core-ombuds.canada.ca",
    descricao: "Canal governamental gratuito onde comunidades brasileiras atingidas por mineradoras canadenses podem denunciar abusos socioambientais e violações de direitos.",
  },
];

/**
 * Sanitiza campos de texto de um ponto georreferenciado, garantindo conformidade com AGENTS.md §5.2.
 *
 * @param ponto Registro do ponto de mineração.
 * @returns Ponto sanitizado livre de CPFs ou identificadores pessoais.
 */
function sanitizarPonto(ponto: PontoGeoMineracaoCanada): PontoGeoMineracaoCanada {
  return {
    ...ponto,
    nome: sanitizarDadoPessoalInternacional(ponto.nome),
    empresa: sanitizarDadoPessoalInternacional(ponto.empresa),
    cidade: sanitizarDadoPessoalInternacional(ponto.cidade),
    provincia: sanitizarDadoPessoalInternacional(ponto.provincia),
    descricao: sanitizarDadoPessoalInternacional(ponto.descricao),
    fonteOficial: sanitizarDadoPessoalInternacional(ponto.fonteOficial),
  };
}

/**
 * Converte a lista de pontos no GeoJSON FeatureCollection WGS84 para renderização no Globo 3D Terras.
 *
 * @param pontos Lista de pontos georreferenciados auditados.
 * @returns GeoJSON FeatureCollection válido.
 */
export function gerarGeoJsonMineracaoCanada(pontos: PontoGeoMineracaoCanada[]) {
  return {
    type: "FeatureCollection" as const,
    metadata: {
      fonte: "Controle Popular — Observatório Canadense de Mineração e Governança Cívica",
      dataAtualizacao: "2026-09-30",
      totalPontos: pontos.length,
      polos: ["Toronto", "Vancouver", "Montreal", "Calgary", "Sudbury", "Ottawa"],
      aviso: "Coordenadas precisas em datum WGS84 compiladas a partir de relatórios da TSX, SEDAR+, NRCan, NPRI e imagens de satélite.",
    },
    features: pontos.map((ponto) => ({
      type: "Feature" as const,
      id: ponto.id,
      geometry: {
        type: "Point" as const,
        coordinates: [ponto.longitude, ponto.latitude],
      },
      properties: {
        id: ponto.id,
        nome: ponto.nome,
        empresa: ponto.empresa,
        tipo: ponto.tipo,
        mineralPrincipal: ponto.mineralPrincipal,
        cidade: ponto.cidade,
        provincia: ponto.provincia,
        bolsaListada: ponto.bolsaListada,
        fonteOficial: ponto.fonteOficial,
        descricao: ponto.descricao,
      },
    })),
  };
}

/**
 * Executa o fluxo de compilação, validação e persistência do acervo geoespacial e compacto do Canadá.
 */
export function executarEtlCanadaGeo(): void {
  console.log("🍁 Iniciando ETL do Acervo Geoespacial e Mineral do Canadá...");

  // Sanitização obrigatória
  const pontosSanitizados = PONTOS_MINERACAO_CANADA.map(sanitizarPonto);

  // Validação preventiva de tamanho de descrição
  for (const ponto of pontosSanitizados) {
    if (ponto.descricao.length > 180) {
      throw new Error(`Descrição do ponto ${ponto.id} excede 180 caracteres: ${ponto.descricao.length}`);
    }
  }

  // 1. Gera GeoJSON oficial para a camada do Globo 3D
  fs.mkdirSync(path.dirname(GEOJSON_DESTINO), { recursive: true });
  const geojson = gerarGeoJsonMineracaoCanada(pontosSanitizados);
  fs.writeFileSync(GEOJSON_DESTINO, JSON.stringify(geojson, null, 2), "utf-8");
  console.log(`✓ GeoJSON salvo em: ${GEOJSON_DESTINO} (${pontosSanitizados.length} feições)`);

  // 2. Compacta dados para o acervo de consumo Next.js
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const compactado = compactar(pontosSanitizados as unknown as Record<string, unknown>[]);
  fs.writeFileSync(JSON_COMPACTO_DESTINO, JSON.stringify(compactado, null, 2), "utf-8");
  console.log(`✓ Dataset compacto salvo em: ${JSON_COMPACTO_DESTINO}`);
}

if (process.argv[1] && process.argv[1].endsWith("gerar-acervo-canada-geo.mts")) {
  executarEtlCanadaGeo();
}
