/**
 * @file scripts/etl/internacional/gerar-acervo-europa-geo.mts
 * @description ETL gerador do acervo geoespacial de tribunais, sedes corporativas, portos e órgãos da Europa.
 *
 * Papel no portal:
 * 1. Mapeia tribunais de litígios transnacionais, sedes de multinacionais, portos de entrada de commodities
 *    e órgãos reguladores de devida diligência da Europa e Reino Unido com conexões diretas ao Brasil.
 * 2. Gera a camada oficial em formato GeoJSON para o Globo 3D Terras:
 *    `apps/web/public/terras/globo/dados/camadas/sedes-litigios-portos-europa.geojson`.
 * 3. Gera o dataset compacto em:
 *    `apps/web/data/internacional/europa-geo.compact.json` utilizando `compactar.ts`.
 *
 * Fontes oficiais mapeadas:
 * - High Court of Justice & UK Supreme Court (Find Case Law / The National Archives).
 * - Rechtbank Rotterdam (De Rechtspraak / rechtspraak.nl).
 * - Tribunal Judiciaire de Paris & Ministère de la Justice (data.gouv.fr).
 * - BAFA Alemanha (Lieferkettensorgfaltspflichtengesetz - LkSG).
 * - Comissão Europeia (TRACES-NT / Regulamento EUDR e Diretiva CSDDD).
 * - DCIAP / Procuradoria-Geral da República Portuguesa.
 * - Registros corporativos oficiais: Companies House (UK), Zefix (Suíça), RCS (Luxemburgo),
 *   Registro Mercantil (Espanha), Registro Imprese (Itália), Brønnøysundregistrene (Noruega).
 * - Autoridades portuárias: Port of Rotterdam Authority, Port of Antwerp-Bruges, Hamburg Port Authority.
 *
 * Decisões técnicas e conformidade:
 * - Zero dados pessoais / sem CPFs (AGENTS.md §5.2).
 * - Coordenadas precisas em datum WGS84 [longitude, latitude] para renderização esférica 3D.
 * - Vocabulário e resumos cívicos em orações diretas de até 13 palavras (AGENTS.md §12).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactar } from "../../../apps/web/lib/estatico/compactar.js";

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
  "sedes-litigios-portos-europa.geojson"
);
const DATA_DIR = path.join(RAIZ, "apps", "web", "data", "internacional");
const JSON_COMPACTO_DESTINO = path.join(DATA_DIR, "europa-geo.compact.json");

export type TipoEntidadeEuropa =
  | "tribunal_litigio"
  | "sede_corporativa"
  | "porto_hub"
  | "orgao_regulador";

export interface PontoGeoEuropa {
  id: string;
  nome: string;
  entidade: string;
  tipo: TipoEntidadeEuropa;
  pais: string;
  cidade: string;
  latitude: number;
  longitude: number;
  marcoLegalOuProcesso: string;
  fonteOficial: string;
  descricao: string;
}

export const PONTOS_EUROPA: PontoGeoEuropa[] = [
  // ── 1. TRIBUNAIS E LITÍGIOS HISTÓRICOS ─────────────────────────────────
  {
    id: "eu-tribunal-london-high-court",
    nome: "High Court of Justice — Tribunal Superior de Londres (TCC)",
    entidade: "High Court of Justice of England and Wales (Technology and Construction Court)",
    tipo: "tribunal_litigio",
    pais: "Reino Unido",
    cidade: "Londres",
    latitude: 51.5133,
    longitude: -0.1132,
    marcoLegalOuProcesso: "Ação Coletiva [2025] EWHC 3001 (TCC) e [2022] EWCA Civ 951",
    fonteOficial: "Judiciary UK / The National Archives (Find Case Law)",
    descricao: "Juízo responsável pelo julgamento histórico de responsabilidade da mineradora BHP pelo rompimento da barragem de Fundão em Mariana.",
  },
  {
    id: "eu-tribunal-uk-supreme-court",
    nome: "Supreme Court of the United Kingdom — Suprema Corte Britânica",
    entidade: "Supreme Court of the United Kingdom",
    tipo: "tribunal_litigio",
    pais: "Reino Unido",
    cidade: "Londres",
    latitude: 51.5000,
    longitude: -0.1275,
    marcoLegalOuProcesso: "Precedentes [2019] UKSC 20 (Vedanta) e [2021] UKSC 3 (Okpabi)",
    fonteOficial: "Supreme Court of the United Kingdom / BAILII",
    descricao: "Fixou a doutrina do dever de cuidado corporativo extraterritorial sobre subsidiárias e operações no exterior.",
  },
  {
    id: "eu-tribunal-rechtbank-rotterdam",
    nome: "Rechtbank Rotterdam — Tribunal Distrital de Roterdã",
    entidade: "Rechtbank Rotterdam (Poder Judiciário dos Países Baixos)",
    tipo: "tribunal_litigio",
    pais: "Países Baixos",
    cidade: "Roterdã",
    latitude: 51.9167,
    longitude: 4.4925,
    marcoLegalOuProcesso: "Processos C/10/646871 / HA ZA 22-835 (Braskem) e Rio Doce Claims",
    fonteOficial: "De Rechtspraak (rechtspraak.nl)",
    descricao: "Julga a responsabilidade civil da petroquímica Braskem pelo afundamento do solo em Maceió e ações do Rio Doce.",
  },
  {
    id: "eu-tribunal-paris-judiciaire",
    nome: "Tribunal Judiciaire de Paris — Tribunal Judicial de Paris",
    entidade: "Tribunal Judiciaire de Paris (Chambre Civile)",
    tipo: "tribunal_litigio",
    pais: "França",
    cidade: "Paris",
    latitude: 48.8944,
    longitude: 2.3086,
    marcoLegalOuProcesso: "Loi nº 2017-399 (Loi sur le devoir de vigilance) / Ações Casino e BNP Paribas",
    fonteOficial: "Ministère de la Justice de France / data.gouv.fr",
    descricao: "Foro exclusivo da Lei de Vigilância corporativa em litígios sobre desmatamento na Amazônia e créditos pecuários.",
  },

  // ── 2. ÓRGÃOS REGULADORES E DEVIDA DILIGÊNCIA ───────────────────────────
  {
    id: "eu-orgao-alemanha-bafa",
    nome: "BAFA — Departamento Federal de Controle de Exportação da Alemanha",
    entidade: "Bundesamt für Wirtschaft und Ausfuhrkontrolle (BAFA)",
    tipo: "orgao_regulador",
    pais: "Alemanha",
    cidade: "Eschborn",
    latitude: 50.1412,
    longitude: 8.5678,
    marcoLegalOuProcesso: "Lieferkettensorgfaltspflichtengesetz (LkSG) / Procedimentos de Queixa Cívica",
    fonteOficial: "Bundesamt für Wirtschaft und Ausfuhrkontrolle (bafa.de)",
    descricao: "Autoridade fiscalizadora de direitos humanos e meio ambiente em cadeias de soja, café e minério com destino à Alemanha.",
  },
  {
    id: "eu-orgao-ue-comissao-europeia",
    nome: "Comissão Europeia — Regulação EUDR e Diretiva CSDDD",
    entidade: "European Commission (DG Environment / TRACES-NT)",
    tipo: "orgao_regulador",
    pais: "Bélgica",
    cidade: "Bruxelas",
    latitude: 50.8436,
    longitude: 4.3824,
    marcoLegalOuProcesso: "Regulamento (UE) 2023/1115 (EUDR) e Diretiva (UE) 2024/1760 (CSDDD)",
    fonteOficial: "EUR-Lex / European Commission",
    descricao: "Órgão executivo da União Europeia formulador das regras de devida diligência e embargo a commodities de áreas desmatadas.",
  },
  {
    id: "eu-orgao-portugal-dciap",
    nome: "DCIAP — Departamento Central de Investigação e Ação Penal",
    entidade: "Ministério Público de Portugal / Polícia Judiciária",
    tipo: "orgao_regulador",
    pais: "Portugal",
    cidade: "Lisboa",
    latitude: 38.7305,
    longitude: -9.1480,
    marcoLegalOuProcesso: "Convenção de Auxílio Judiciário Mútuo em Matéria Penal da CPLP / Acordos MPF-DCIAP",
    fonteOficial: "Procuradoria-Geral da República Portuguesa (ministeriopublico.pt)",
    descricao: "Unidade de combate à corrupção transnacional, rastreamento de fluxos financeiros ilícitos e cooperação judiciária com o Brasil.",
  },

  // ── 3. SEDES CORPORATIVAS DE MULTINACIONAIS ────────────────────────────
  {
    id: "eu-sede-uk-bhp-group",
    nome: "Sede Corporativa BHP Group (UK) Limited",
    entidade: "BHP Group (UK) Limited / BHP Group Limited",
    tipo: "sede_corporativa",
    pais: "Reino Unido",
    cidade: "Londres",
    latitude: 51.5033,
    longitude: -0.1416,
    marcoLegalOuProcesso: "Companies House nº 04902083 / Ação Civil [2025] EWHC 3001 (TCC)",
    fonteOficial: "Companies House UK / London Stock Exchange",
    descricao: "Sede corporativa britânica da mineradora anglo-australiana co-controladora da Samarco no desastre de Fundão.",
  },
  {
    id: "eu-sede-uk-rio-tinto",
    nome: "Sede Corporativa Rio Tinto plc",
    entidade: "Rio Tinto plc",
    tipo: "sede_corporativa",
    pais: "Reino Unido",
    cidade: "Londres",
    latitude: 51.5074,
    longitude: -0.1472,
    marcoLegalOuProcesso: "Companies House nº 00719885 / Joint-ventures internacionais de bauxita e minério",
    fonteOficial: "Companies House UK / London Stock Exchange",
    descricao: "Segunda maior mineradora do mundo, com interesses em bauxita, alumínio e parcerias globais de exploração.",
  },
  {
    id: "eu-sede-uk-anglo-american",
    nome: "Sede Corporativa Anglo American plc",
    entidade: "Anglo American plc",
    tipo: "sede_corporativa",
    pais: "Reino Unido",
    cidade: "Londres",
    latitude: 51.5039,
    longitude: -0.1408,
    marcoLegalOuProcesso: "Companies House nº 03528412 / Sistema Minas-Rio e Níquel Goiás",
    fonteOficial: "Companies House UK / Agência Nacional de Mineração (ANM)",
    descricao: "Controladora do megaprojeto Minas-Rio, composto por lavra em Conceição do Mato Dentro e mineroduto até o Rio de Janeiro.",
  },
  {
    id: "eu-sede-uk-shell",
    nome: "Sede Corporativa Global Shell plc",
    entidade: "Shell plc",
    tipo: "sede_corporativa",
    pais: "Reino Unido",
    cidade: "Londres",
    latitude: 51.5061,
    longitude: -0.1175,
    marcoLegalOuProcesso: "Companies House nº 04366849 / Contratos de Partilha e Concessão Pré-Sal (ANP)",
    fonteOficial: "Companies House UK / Agência Nacional do Petróleo (ANP)",
    descricao: "Segunda maior produtora de petróleo e gás no Brasil, parceira nos campos gigantes do pré-sal nas Bacias de Santos e Campos.",
  },
  {
    id: "eu-sede-suica-glencore",
    nome: "Sede Corporativa Glencore International AG",
    entidade: "Glencore International AG",
    tipo: "sede_corporativa",
    pais: "Suíça",
    cidade: "Baar",
    latitude: 47.1953,
    longitude: 8.5264,
    marcoLegalOuProcesso: "Zefix CHE-106.839.238 / Acordos de Leniência MPF e CGU",
    fonteOficial: "Zefix Handelsregister Zug / SIX Swiss Exchange",
    descricao: "Maior trading diversificada de commodities e metais do mundo, compradora de ferro, soja e combustíveis brasileiros.",
  },
  {
    id: "eu-sede-italia-enel",
    nome: "Sede Corporativa Enel S.p.A.",
    entidade: "Enel S.p.A.",
    tipo: "sede_corporativa",
    pais: "Itália",
    cidade: "Roma",
    latitude: 41.9169,
    longitude: 12.4939,
    marcoLegalOuProcesso: "Registro Imprese Roma / Concessões de Distribuição Urbana ANEEL",
    fonteOficial: "Ministero dell'Economia e delle Finanze (MEF) / ANEEL",
    descricao: "Multinacional estatal italiana controladora de concessionárias de distribuição de energia em São Paulo e no Rio de Janeiro.",
  },
  {
    id: "eu-sede-espanha-santander",
    nome: "Sede Corporativa Banco Santander S.A.",
    entidade: "Banco Santander S.A.",
    tipo: "sede_corporativa",
    pais: "Espanha",
    cidade: "Boadilla del Monte",
    latitude: 40.4042,
    longitude: -3.8728,
    marcoLegalOuProcesso: "Registro Mercantil de Madrid / Sistema Financeiro Nacional (Bacen)",
    fonteOficial: "Comisión Nacional del Mercado de Valores (CNMV) / Bacen",
    descricao: "Maior banco espanhol com presença massiva no Brasil, financiador chave do agronegócio e de obras de infraestrutura.",
  },
  {
    id: "eu-sede-portugal-edp",
    nome: "Sede Corporativa EDP - Energias de Portugal S.A.",
    entidade: "EDP - Energias de Portugal S.A.",
    tipo: "sede_corporativa",
    pais: "Portugal",
    cidade: "Lisboa",
    latitude: 38.7061,
    longitude: -9.1558,
    marcoLegalOuProcesso: "Registo Comercial de Lisboa / Concessões de Geração e Distribuição ANEEL",
    fonteOficial: "Comissão do Mercado de Valores Mobiliários (CMVM) / ANEEL",
    descricao: "Conglomerado de energia de Portugal com concessões hidrelétricas, solares, eólicas e rede de distribuição no Brasil.",
  },
  {
    id: "eu-sede-luxemburgo-arcelormittal",
    nome: "Sede Corporativa ArcelorMittal S.A.",
    entidade: "ArcelorMittal S.A.",
    tipo: "sede_corporativa",
    pais: "Luxemburgo",
    cidade: "Luxemburgo",
    latitude: 49.6116,
    longitude: 6.1319,
    marcoLegalOuProcesso: "RCS Luxembourg B42180 / Concessões de Lavra e SIGBM ANM",
    fonteOficial: "Registre de Commerce et des Sociétés (Luxembourg) / ANM",
    descricao: "Maior siderúrgica do Ocidente, dona da Mina e Barragem de Serra Azul em Itatiaiuçu e usinas em Minas e Espírito Santo.",
  },
  {
    id: "eu-sede-noruega-norsk-hydro",
    nome: "Sede Corporativa Norsk Hydro ASA",
    entidade: "Norsk Hydro ASA",
    tipo: "sede_corporativa",
    pais: "Noruega",
    cidade: "Oslo",
    latitude: 59.9142,
    longitude: 10.6386,
    marcoLegalOuProcesso: "Brønnøysundregistrene 914778271 / TAC Barcarena com MPF e Governo do Pará",
    fonteOficial: "Brønnøysundregistrene / Oslo Børs / MPF Pará",
    descricao: "Multinacional norueguesa de alumínio dona da refinaria Alunorte e da mina de bauxita de Paragominas no Pará.",
  },
  {
    id: "eu-sede-espanha-telefonica",
    nome: "Sede Corporativa Telefónica S.A.",
    entidade: "Telefónica S.A.",
    tipo: "sede_corporativa",
    pais: "Espanha",
    cidade: "Madri",
    latitude: 40.5147,
    longitude: -3.6592,
    marcoLegalOuProcesso: "Registro Mercantil de Madrid / Concessão do Serviço Telefônico Fixo e Móvel (ANATEL)",
    fonteOficial: "Comisión Nacional del Mercado de Valores (CNMV) / ANATEL",
    descricao: "Empresa de telecomunicações espanhola controladora da Vivo, maior operadora de telefonia celular e dados do Brasil.",
  },
  {
    id: "eu-sede-espanha-iberdrola",
    nome: "Sede Corporativa Iberdrola S.A.",
    entidade: "Iberdrola S.A.",
    tipo: "sede_corporativa",
    pais: "Espanha",
    cidade: "Bilbau",
    latitude: 43.2683,
    longitude: -2.9372,
    marcoLegalOuProcesso: "Registro Mercantil de Vizcaya / Neoenergia e Usina Hidrelétrica Belo Monte",
    fonteOficial: "Comisión Nacional del Mercado de Valores (CNMV) / ANEEL",
    descricao: "Controladora da Neoenergia, concessionária de distribuição em estados do Nordeste e sócia da usina de Belo Monte no Pará.",
  },

  // ── 4. PORTOS E HUBS DE COMÉRCIO ─────────────────────────────────────────
  {
    id: "eu-porto-holanda-roterda",
    nome: "Porto de Roterdã — Terminal de Granéis EMO e Agronegócio",
    entidade: "Port of Rotterdam Authority / Europees Massagoed Overslagbedrijf (EMO)",
    tipo: "porto_hub",
    pais: "Países Baixos",
    cidade: "Roterdã",
    latitude: 51.9540,
    longitude: 4.0200,
    marcoLegalOuProcesso: "Regulamento Portuário de Roterdã / Diretiva Aduaneira da União Europeia",
    fonteOficial: "Havenbedrijf Rotterdam / Port of Rotterdam",
    descricao: "Maior complexo portuário marítimo da Europa e principal destino de descarregamento de minério de ferro e soja do Brasil.",
  },
  {
    id: "eu-porto-belgica-antuerpia",
    nome: "Porto de Antuérpia-Bruges — Hub Logístico de Commodities",
    entidade: "Port of Antwerp-Bruges Authority",
    tipo: "porto_hub",
    pais: "Bélgica",
    cidade: "Antuérpia",
    latitude: 51.2450,
    longitude: 4.3850,
    marcoLegalOuProcesso: "Código Alfandegário Comunitário da União Europeia / EUDR",
    fonteOficial: "Port of Antwerp-Bruges Authority / Alfândega Federal Belga",
    descricao: "Segundo maior porto europeu, receptor de café, celulose, suco cítrico e produtos siderúrgicos de portos brasileiros.",
  },
  {
    id: "eu-porto-alemanha-hamburgo",
    nome: "Porto de Hamburgo — Hub Portuário e Logístico da Alemanha",
    entidade: "Hamburg Port Authority (HPA)",
    tipo: "porto_hub",
    pais: "Alemanha",
    cidade: "Hamburgo",
    latitude: 53.5350,
    longitude: 9.9700,
    marcoLegalOuProcesso: "Hafensicherheitsgesetz / Monitoramento LkSG de Importações",
    fonteOficial: "Hamburg Port Authority (HPA) / Statistisches Bundesamt (Destatis)",
    descricao: "Porto alemão de entrada para grãos, café e minerais metálicos sujeitos a auditorias de devida diligência do LkSG.",
  },
  {
    id: "eu-hub-suica-genebra",
    nome: "Pólo de Trading de Commodities Energéticas de Genebra",
    entidade: "Trafigura Group / Vitol Holding B.V.",
    tipo: "porto_hub",
    pais: "Suíça",
    cidade: "Genebra",
    latitude: 46.2044,
    longitude: 6.1432,
    marcoLegalOuProcesso: "Code des Obligations (art. 964a) / Acordos de Cooperação com o MPF",
    fonteOficial: "Registre du Commerce du Canton de Genève / Zefix",
    descricao: "Capital do comércio global de petróleo e minérios, centro de negociações de cargas transoceânicas com o Brasil.",
  },
];

/**
 * Converte os pontos para a estrutura canônica GeoJSON FeatureCollection WGS84.
 */
export function gerarGeoJsonEuropa(): Record<string, unknown> {
  const paises = Array.from(new Set(PONTOS_EUROPA.map((p) => p.pais)));
  return {
    type: "FeatureCollection",
    metadata: {
      fonte: "Controle Popular — Observatório de Litígios Transnacionais e Sedes da Europa",
      dataAtualizacao: "2026-09-30",
      totalPontos: PONTOS_EUROPA.length,
      paisesCobertos: paises,
      aviso: "Coordenadas precisas em datum WGS84 compiladas a partir de registros públicos judiciais, corporativos e portuários oficiais.",
    },
    features: PONTOS_EUROPA.map((ponto) => ({
      type: "Feature",
      id: ponto.id,
      geometry: {
        type: "Point",
        coordinates: [ponto.longitude, ponto.latitude],
      },
      properties: {
        id: ponto.id,
        nome: ponto.nome,
        entidade: ponto.entidade,
        tipo: ponto.tipo,
        pais: ponto.pais,
        cidade: ponto.cidade,
        marcoLegalOuProcesso: ponto.marcoLegalOuProcesso,
        fonteOficial: ponto.fonteOficial,
        descricao: ponto.descricao,
      },
    })),
  };
}

/**
 * Executa a compilação do GeoJSON e do dataset compacto.
 */
export function executarEtlEuropaGeo(): void {
  console.log("🇪🇺 Iniciando ETL do Acervo Geoespacial da Europa e Reino Unido...");

  // 1. Gravar arquivo GeoJSON para camadas do Globo 3D
  fs.mkdirSync(path.dirname(GEOJSON_DESTINO), { recursive: true });
  const geojson = gerarGeoJsonEuropa();
  fs.writeFileSync(GEOJSON_DESTINO, JSON.stringify(geojson, null, 2), "utf-8");
  console.log(`✓ GeoJSON salvo em: ${GEOJSON_DESTINO} (${PONTOS_EUROPA.length} feições)`);

  // 2. Gravar dataset compacto via compactar()
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const compacto = compactar(PONTOS_EUROPA as unknown as Record<string, unknown>[]);
  fs.writeFileSync(JSON_COMPACTO_DESTINO, JSON.stringify(compacto), "utf-8");
  console.log(`✓ Dataset compacto salvo em: ${JSON_COMPACTO_DESTINO}`);
}

if (process.argv[1] && process.argv[1].endsWith("gerar-acervo-europa-geo.mts")) {
  executarEtlEuropaGeo();
}
