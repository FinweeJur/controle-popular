/**
 * @file apps/web/lib/direitos-globais/asia/paises.ts
 * @description Relação completa dos 48 países soberanos da Ásia organizados por sub-regiões geográficas.
 *
 * Sub-regiões:
 * - Leste Asiático (China, Japão, Coreia do Sul, Mongólia, Coreia do Norte, Taiwan)
 * - Sudeste Asiático (Filipinas, Vietnã, Indonésia, Tailândia, Malásia, Singapura, Camboja, Laos, Mianmar, Brunei, Timor-Leste)
 * - Sul da Ásia (Índia, Paquistão, Bangladesh, Sri Lanka, Nepal, Butão, Maldivas, Afeganistão)
 * - Ásia Central (Cazaquistão, Uzbequistão, Quirguistão, Tajiquistão, Turcomenistão)
 * - Ásia Ocidental / Oriente Médio (Arábia Saudita, Emirados Árabes Unidos, Turquia, Irã, Iraque, Israel, Palestina, Jordânia, Líbano, Síria, Iêmen, Omã, Catar, Kuwait, Bahrein, Chipre, Geórgia, Armênia, Azerbaijão)
 * - Norte da Ásia (Rússia - transcontinental)
 *
 * Nota explícita: A Rússia entra como país transcontinental euro-asiático, analisada sob o prisma
 * dos tratados universais da ONU e convenções internacionais aplicáveis.
 */

import type { Pais } from "../tipos-comuns";

export type LevaPrioridade = 1 | 2 | 3;

export type SubRegiaoAsia =
  | "Leste Asiático"
  | "Sul da Ásia"
  | "Sudeste Asiático"
  | "Ásia Central"
  | "Ásia Ocidental"
  | "Norte da Ásia";

export interface PaisAsiatico extends Pais {
  leva: LevaPrioridade;
  subRegiao: SubRegiaoAsia;
  possuiTribunalRegional: false; // A Ásia não possui tribunal regional de direitos humanos com competência vinculante
  mecanismoRegional?: string;
}

export const SUBREGIOES_ASIA: readonly SubRegiaoAsia[] = [
  "Leste Asiático",
  "Sudeste Asiático",
  "Sul da Ásia",
  "Ásia Central",
  "Ásia Ocidental",
  "Norte da Ásia",
];

export const PAISES_ASIA: readonly PaisAsiatico[] = [
  // ─── LEVA 1 (Prioritários para Coleta Constitucional Inicial) ───
  {
    nome: "China",
    codigo: "CN",
    regiao: "Ásia",
    subRegiao: "Leste Asiático",
    capital: "Pequim",
    populacao: 1412000000,
    leva: 1,
    possuiTribunalRegional: false,
    mecanismoRegional: "Ausente",
  },
  {
    nome: "Rússia",
    codigo: "RU",
    regiao: "Ásia",
    subRegiao: "Norte da Ásia",
    capital: "Moscou",
    populacao: 144000000,
    leva: 1,
    possuiTribunalRegional: false,
    notaTranscontinental:
      "Estado transcontinental euro-asiático, analisado sob o prisma dos tratados universais da ONU e convenções internacionais vinculantes.",
    mecanismoRegional:
      "Excluída do Conselho da Europa / CEDH em 2022; vinculada apenas ao sistema ONU",
  },
  {
    nome: "Índia",
    codigo: "IN",
    regiao: "Ásia",
    subRegiao: "Sul da Ásia",
    capital: "Nova Délhi",
    populacao: 1408000000,
    leva: 1,
    possuiTribunalRegional: false,
    mecanismoRegional:
      "Comissão Nacional de Direitos Humanos (instituição nacional NHRI)",
  },
  {
    nome: "Vietnã",
    codigo: "VN",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Hanói",
    populacao: 98000000,
    leva: 1,
    possuiTribunalRegional: false,
    mecanismoRegional:
      "Comissão Intergovernamental de Direitos Humanos da ASEAN (AICHR - consultiva)",
  },
  {
    nome: "Japão",
    codigo: "JP",
    regiao: "Ásia",
    subRegiao: "Leste Asiático",
    capital: "Tóquio",
    populacao: 125000000,
    leva: 1,
    possuiTribunalRegional: false,
    mecanismoRegional: "Ausente",
  },
  {
    nome: "Filipinas",
    codigo: "PH",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Manila",
    populacao: 115000000,
    leva: 1,
    possuiTribunalRegional: false,
    mecanismoRegional:
      "Comissão Intergovernamental de Direitos Humanos da ASEAN (AICHR - consultiva)",
  },

  // ─── LEVA 2 (Grandes Populações e Economias) ───
  {
    nome: "Indonésia",
    codigo: "ID",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Jacarta",
    populacao: 275000000,
    leva: 2,
    possuiTribunalRegional: false,
    mecanismoRegional: "AICHR (ASEAN)",
  },
  {
    nome: "Bangladesh",
    codigo: "BD",
    regiao: "Ásia",
    subRegiao: "Sul da Ásia",
    capital: "Daca",
    populacao: 171000000,
    leva: 2,
    possuiTribunalRegional: false,
  },
  {
    nome: "Paquistão",
    codigo: "PK",
    regiao: "Ásia",
    subRegiao: "Sul da Ásia",
    capital: "Islamabad",
    populacao: 235000000,
    leva: 2,
    possuiTribunalRegional: false,
  },
  {
    nome: "Tailândia",
    codigo: "TH",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Bangkok",
    populacao: 71000000,
    leva: 2,
    possuiTribunalRegional: false,
    mecanismoRegional: "AICHR (ASEAN)",
  },
  {
    nome: "Malásia",
    codigo: "MY",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Kuala Lumpur",
    populacao: 33000000,
    leva: 2,
    possuiTribunalRegional: false,
    mecanismoRegional: "AICHR (ASEAN)",
  },
  {
    nome: "Coreia do Sul",
    codigo: "KR",
    regiao: "Ásia",
    subRegiao: "Leste Asiático",
    capital: "Seul",
    populacao: 51000000,
    leva: 2,
    possuiTribunalRegional: false,
  },

  // ─── DEMAIS PAÍSES DA ÁSIA (Classificação Geográfica Integral) ───
  // Sul da Ásia
  {
    nome: "Sri Lanka",
    codigo: "LK",
    regiao: "Ásia",
    subRegiao: "Sul da Ásia",
    capital: "Colombo",
    populacao: 22000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Nepal",
    codigo: "NP",
    regiao: "Ásia",
    subRegiao: "Sul da Ásia",
    capital: "Catmandu",
    populacao: 30000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Afeganistão",
    codigo: "AF",
    regiao: "Ásia",
    subRegiao: "Sul da Ásia",
    capital: "Cabul",
    populacao: 41000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Butão",
    codigo: "BT",
    regiao: "Ásia",
    subRegiao: "Sul da Ásia",
    capital: "Thimphu",
    populacao: 780000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Maldivas",
    codigo: "MV",
    regiao: "Ásia",
    subRegiao: "Sul da Ásia",
    capital: "Malé",
    populacao: 520000,
    leva: 3,
    possuiTribunalRegional: false,
  },

  // Sudeste Asiático
  {
    nome: "Camboja",
    codigo: "KH",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Phnom Penh",
    populacao: 16700000,
    leva: 3,
    possuiTribunalRegional: false,
    mecanismoRegional: "AICHR (ASEAN)",
  },
  {
    nome: "Laos",
    codigo: "LA",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Vientiane",
    populacao: 7500000,
    leva: 3,
    possuiTribunalRegional: false,
    mecanismoRegional: "AICHR (ASEAN)",
  },
  {
    nome: "Mianmar",
    codigo: "MM",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Nepiedó",
    populacao: 54000000,
    leva: 3,
    possuiTribunalRegional: false,
    mecanismoRegional: "AICHR (ASEAN)",
  },
  {
    nome: "Singapura",
    codigo: "SG",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Singapura",
    populacao: 5600000,
    leva: 3,
    possuiTribunalRegional: false,
    mecanismoRegional: "AICHR (ASEAN)",
  },
  {
    nome: "Brunei",
    codigo: "BN",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Bandar Seri Begawan",
    populacao: 450000,
    leva: 3,
    possuiTribunalRegional: false,
    mecanismoRegional: "AICHR (ASEAN)",
  },
  {
    nome: "Timor-Leste",
    codigo: "TL",
    regiao: "Ásia",
    subRegiao: "Sudeste Asiático",
    capital: "Díli",
    populacao: 1340000,
    leva: 3,
    possuiTribunalRegional: false,
  },

  // Leste Asiático
  {
    nome: "Mongólia",
    codigo: "MN",
    regiao: "Ásia",
    subRegiao: "Leste Asiático",
    capital: "Ulan Bator",
    populacao: 3400000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Coreia do Norte",
    codigo: "KP",
    regiao: "Ásia",
    subRegiao: "Leste Asiático",
    capital: "Pyongyang",
    populacao: 26000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Taiwan",
    codigo: "TW",
    regiao: "Ásia",
    subRegiao: "Leste Asiático",
    capital: "Taipé",
    populacao: 23500000,
    leva: 3,
    possuiTribunalRegional: false,
  },

  // Ásia Central
  {
    nome: "Cazaquistão",
    codigo: "KZ",
    regiao: "Ásia",
    subRegiao: "Ásia Central",
    capital: "Astana",
    populacao: 19600000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Uzbequistão",
    codigo: "UZ",
    regiao: "Ásia",
    subRegiao: "Ásia Central",
    capital: "Tashkent",
    populacao: 35600000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Quirguistão",
    codigo: "KG",
    regiao: "Ásia",
    subRegiao: "Ásia Central",
    capital: "Bishkek",
    populacao: 6800000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Tajiquistão",
    codigo: "TJ",
    regiao: "Ásia",
    subRegiao: "Ásia Central",
    capital: "Dushanbe",
    populacao: 10000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Turcomenistão",
    codigo: "TM",
    regiao: "Ásia",
    subRegiao: "Ásia Central",
    capital: "Asgabate",
    populacao: 6400000,
    leva: 3,
    possuiTribunalRegional: false,
  },

  // Ásia Ocidental / Oriente Médio
  {
    nome: "Turquia",
    codigo: "TR",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Ancara",
    populacao: 85000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Irã",
    codigo: "IR",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Teerã",
    populacao: 88000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Iraque",
    codigo: "IQ",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Bagdá",
    populacao: 43500000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Arábia Saudita",
    codigo: "SA",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Riad",
    populacao: 36000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Emirados Árabes Unidos",
    codigo: "AE",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Abu Dhabi",
    populacao: 9400000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Israel",
    codigo: "IL",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Jerusalém",
    populacao: 9500000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Palestina",
    codigo: "PS",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Ramallah",
    populacao: 5200000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Jordânia",
    codigo: "JO",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Amã",
    populacao: 11000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Líbano",
    codigo: "LB",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Beirute",
    populacao: 5500000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Síria",
    codigo: "SY",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Damasco",
    populacao: 22000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Iêmen",
    codigo: "YE",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Sana",
    populacao: 33000000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Omã",
    codigo: "OM",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Mascate",
    populacao: 4600000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Catar",
    codigo: "QA",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Doha",
    populacao: 2700000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Kuwait",
    codigo: "KW",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Cidade do Kuwait",
    populacao: 4300000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Bahrein",
    codigo: "BH",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Manama",
    populacao: 1500000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Armênia",
    codigo: "AM",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Yerevan",
    populacao: 2800000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Azerbaijão",
    codigo: "AZ",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Baku",
    populacao: 10100000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Geórgia",
    codigo: "GE",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Tbilisi",
    populacao: 3700000,
    leva: 3,
    possuiTribunalRegional: false,
  },
  {
    nome: "Chipre",
    codigo: "CY",
    regiao: "Ásia",
    subRegiao: "Ásia Ocidental",
    capital: "Nicósia",
    populacao: 1250000,
    leva: 3,
    possuiTribunalRegional: false,
  },
];

export function paisesPorLeva(leva: LevaPrioridade): readonly PaisAsiatico[] {
  return PAISES_ASIA.filter((p) => p.leva === leva);
}

export function paisesPorSubRegiao(subRegiao: SubRegiaoAsia): readonly PaisAsiatico[] {
  return PAISES_ASIA.filter((p) => p.subRegiao === subRegiao);
}

export function paisAsiaticoPorNome(nome: string): PaisAsiatico | undefined {
  return PAISES_ASIA.find((p) => p.nome.toLowerCase() === nome.toLowerCase());
}

export function paisAsiaticoPorCodigo(codigo: string): PaisAsiatico | undefined {
  return PAISES_ASIA.find((p) => p.codigo.toUpperCase() === codigo.toUpperCase());
}
