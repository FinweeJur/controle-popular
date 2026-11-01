/**
 * @file apps/web/lib/direitos-globais/asia/paises.ts
 * @description Países asiáticos categorizados por levas prioritárias para comparação com o sistema ONU.
 *
 * Levas:
 * - Leva 1 (Prioritária): China, Rússia, Índia, Vietnã, Japão, Filipinas.
 * - Leva 2: Indonésia, Bangladesh, Paquistão, Tailândia, Malásia, Coreia do Sul.
 * - Leva 3: Sri Lanka, Nepal, Camboja, Laos, Mianmar, Mongólia e Ásia Central.
 *
 * Nota explícita: A Rússia entra como país transcontinental euro-asiático, analisada sob o prisma
 * dos tratados universais da ONU e convenções internacionais aplicáveis.
 */

import type { Pais } from "../tipos-comuns";

export type LevaPrioridade = 1 | 2 | 3;

export interface PaisAsiatico extends Pais {
  leva: LevaPrioridade;
  subRegiao: "Leste Asiático" | "Sul da Ásia" | "Sudeste Asiático" | "Ásia Central" | "Norte da Ásia";
  possuiTribunalRegional: false; // A Ásia não possui tribunal regional de direitos humanos com competência vinculante
  mecanismoRegional?: string;
}

export const PAISES_ASIA: readonly PaisAsiatico[] = [
  // LEVA 1 (Prioritária)
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
    notaTranscontinental: "Estado transcontinental euro-asiático, analisado sob o prisma dos tratados universais da ONU e convenções internacionais vinculantes.",
    mecanismoRegional: "Excluída do Conselho da Europa / CEDH em 2022; vinculada apenas ao sistema ONU",
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
    mecanismoRegional: "Comissão Nacional de Direitos Humanos (instituição nacional NHRI)",
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
    mecanismoRegional: "Comissão Intergovernamental de Direitos Humanos da ASEAN (AICHR - consultiva)",
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
    mecanismoRegional: "Comissão Intergovernamental de Direitos Humanos da ASEAN (AICHR - consultiva)",
  },

  // LEVA 2
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

  // LEVA 3
  { nome: "Sri Lanka", codigo: "LK", regiao: "Ásia", subRegiao: "Sul da Ásia", capital: "Colombo", leva: 3, possuiTribunalRegional: false },
  { nome: "Nepal", codigo: "NP", regiao: "Ásia", subRegiao: "Sul da Ásia", capital: "Catmandu", leva: 3, possuiTribunalRegional: false },
  { nome: "Camboja", codigo: "KH", regiao: "Ásia", subRegiao: "Sudeste Asiático", capital: "Phnom Penh", leva: 3, possuiTribunalRegional: false, mecanismoRegional: "AICHR (ASEAN)" },
  { nome: "Laos", codigo: "LA", regiao: "Ásia", subRegiao: "Sudeste Asiático", capital: "Vientiane", leva: 3, possuiTribunalRegional: false, mecanismoRegional: "AICHR (ASEAN)" },
  { nome: "Mianmar", codigo: "MM", regiao: "Ásia", subRegiao: "Sudeste Asiático", capital: "Nepiedó", leva: 3, possuiTribunalRegional: false, mecanismoRegional: "AICHR (ASEAN)" },
  { nome: "Mongólia", codigo: "MN", regiao: "Ásia", subRegiao: "Leste Asiático", capital: "Ulan Bator", leva: 3, possuiTribunalRegional: false },
  { nome: "Cazaquistão", codigo: "KZ", regiao: "Ásia", subRegiao: "Ásia Central", capital: "Astana", leva: 3, possuiTribunalRegional: false },
  { nome: "Uzbequistão", codigo: "UZ", regiao: "Ásia", subRegiao: "Ásia Central", capital: "Tashkent", leva: 3, possuiTribunalRegional: false },
  { nome: "Quirguistão", codigo: "KG", regiao: "Ásia", subRegiao: "Ásia Central", capital: "Bishkek", leva: 3, possuiTribunalRegional: false },
  { nome: "Tajiquistão", codigo: "TJ", regiao: "Ásia", subRegiao: "Ásia Central", capital: "Dushanbe", leva: 3, possuiTribunalRegional: false },
  { nome: "Turcomenistão", codigo: "TM", regiao: "Ásia", subRegiao: "Ásia Central", capital: "Asgabate", leva: 3, possuiTribunalRegional: false },
];

export function paisesPorLeva(leva: LevaPrioridade): readonly PaisAsiatico[] {
  return PAISES_ASIA.filter((p) => p.leva === leva);
}

export function paisAsiaticoPorNome(nome: string): PaisAsiatico | undefined {
  return PAISES_ASIA.find((p) => p.nome.toLowerCase() === nome.toLowerCase());
}

export function paisAsiaticoPorCodigo(codigo: string): PaisAsiatico | undefined {
  return PAISES_ASIA.find((p) => p.codigo.toUpperCase() === codigo.toUpperCase());
}
