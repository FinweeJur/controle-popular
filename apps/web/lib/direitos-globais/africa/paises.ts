/**
 * @file apps/web/lib/direitos-globais/africa/paises.ts
 * @description Os 54 países soberanos reconhecidos da África (membros da União Africana).
 *
 * Fonte de identificação e limites: União Africana (au.int) e ISO 3166-1.
 */

import type { Pais } from "../tipos-comuns";

export interface PaisAfricano extends Pais {
  subRegiao: "Norte" | "Ocidental" | "Central" | "Oriental" | "Austral";
  declarouArt34: boolean; // Declaração do Artigo 34(6) do Protocolo da Corte (acesso direto de indivíduos/ONGs)
  dataDeclaracaoArt34?: string;
  revogouArt34?: boolean; // Países que retiraram a declaração especial (ex: Ruanda, Tanzânia, Benim, Costa do Marfim)
}

export const PAISES_AFRICA: readonly PaisAfricano[] = [
  // Norte da África (6 países da ONU)
  { nome: "Argélia", codigo: "DZ", regiao: "África", subRegiao: "Norte", capital: "Argel", declarouArt34: false },
  { nome: "Egito", codigo: "EG", regiao: "África", subRegiao: "Norte", capital: "Cairo", declarouArt34: false },
  { nome: "Líbia", codigo: "LY", regiao: "África", subRegiao: "Norte", capital: "Trípoli", declarouArt34: false },
  { nome: "Marrocos", codigo: "MA", regiao: "África", subRegiao: "Norte", capital: "Rabat", declarouArt34: false },
  { nome: "Mauritânia", codigo: "MR", regiao: "África", subRegiao: "Norte", capital: "Nuaquechote", declarouArt34: false },
  { nome: "Tunísia", codigo: "TN", regiao: "África", subRegiao: "Norte", capital: "Túnis", declarouArt34: true, dataDeclaracaoArt34: "2017-04-13" },

  // África Ocidental
  { nome: "Benin", codigo: "BJ", regiao: "África", subRegiao: "Ocidental", capital: "Porto-Novo", declarouArt34: true, revogouArt34: true },
  { nome: "Burkina Faso", codigo: "BF", regiao: "África", subRegiao: "Ocidental", capital: "Uagadugu", declarouArt34: true, dataDeclaracaoArt34: "1998-07-28" },
  { nome: "Cabo Verde", codigo: "CV", regiao: "África", subRegiao: "Ocidental", capital: "Praia", declarouArt34: false },
  { nome: "Costa do Marfim", codigo: "CI", regiao: "África", subRegiao: "Ocidental", capital: "Iamussucro", declarouArt34: true, revogouArt34: true },
  { nome: "Gâmbia", codigo: "GM", regiao: "África", subRegiao: "Ocidental", capital: "Banjul", declarouArt34: true, dataDeclaracaoArt34: "2018-10-23" },
  { nome: "Gana", codigo: "GH", regiao: "África", subRegiao: "Ocidental", capital: "Acra", declarouArt34: true, dataDeclaracaoArt34: "2011-03-10" },
  { nome: "Guiné", codigo: "GN", regiao: "África", subRegiao: "Ocidental", capital: "Conacri", declarouArt34: false },
  { nome: "Guiné-Bissau", codigo: "GW", regiao: "África", subRegiao: "Ocidental", capital: "Bissau", declarouArt34: true, dataDeclaracaoArt34: "2021-11-04" },
  { nome: "Libéria", codigo: "LR", regiao: "África", subRegiao: "Ocidental", capital: "Monróvia", declarouArt34: false },
  { nome: "Mali", codigo: "ML", regiao: "África", subRegiao: "Ocidental", capital: "Bamaco", declarouArt34: true, dataDeclaracaoArt34: "2010-02-19" },
  { nome: "Níger", codigo: "NE", regiao: "África", subRegiao: "Ocidental", capital: "Niamei", declarouArt34: true, dataDeclaracaoArt34: "2021-10-26" },
  { nome: "Nigéria", codigo: "NG", regiao: "África", subRegiao: "Ocidental", capital: "Abuja", declarouArt34: false },
  { nome: "Senegal", codigo: "SN", regiao: "África", subRegiao: "Ocidental", capital: "Dakar", declarouArt34: false },
  { nome: "Serra Leoa", codigo: "SL", regiao: "África", subRegiao: "Ocidental", capital: "Freetown", declarouArt34: false },
  { nome: "Togo", codigo: "TG", regiao: "África", subRegiao: "Ocidental", capital: "Lomé", declarouArt34: false },

  // África Central
  { nome: "Angola", codigo: "AO", regiao: "África", subRegiao: "Central", capital: "Luanda", declarouArt34: false },
  { nome: "Camarões", codigo: "CM", regiao: "África", subRegiao: "Central", capital: "Iaundé", declarouArt34: false },
  { nome: "Chade", codigo: "TD", regiao: "África", subRegiao: "Central", capital: "Jamena", declarouArt34: false },
  { nome: "Congo", codigo: "CG", regiao: "África", subRegiao: "Central", capital: "Brazzaville", declarouArt34: false },
  { nome: "Gabão", codigo: "GA", regiao: "África", subRegiao: "Central", capital: "Libreville", declarouArt34: false },
  { nome: "Guiné Equatorial", codigo: "GQ", regiao: "África", subRegiao: "Central", capital: "Malabo", declarouArt34: false },
  { nome: "República Centro-Africana", codigo: "CF", regiao: "África", subRegiao: "Central", capital: "Bangui", declarouArt34: false },
  { nome: "República Democrática do Congo", codigo: "CD", regiao: "África", subRegiao: "Central", capital: "Kinshasa", declarouArt34: true, dataDeclaracaoArt34: "2020-03-12" },
  { nome: "São Tomé e Príncipe", codigo: "ST", regiao: "África", subRegiao: "Central", capital: "São Tomé", declarouArt34: false },

  // África Oriental
  { nome: "Burundi", codigo: "BI", regiao: "África", subRegiao: "Oriental", capital: "Gitega", declarouArt34: false },
  { nome: "Comores", codigo: "KM", regiao: "África", subRegiao: "Oriental", capital: "Moroni", declarouArt34: false },
  { nome: "Djibuti", codigo: "DJ", regiao: "África", subRegiao: "Oriental", capital: "Djibuti", declarouArt34: false },
  { nome: "Eritreia", codigo: "ER", regiao: "África", subRegiao: "Oriental", capital: "Asmara", declarouArt34: false },
  { nome: "Etiópia", codigo: "ET", regiao: "África", subRegiao: "Oriental", capital: "Adis Abeba", declarouArt34: false },
  { nome: "Quênia", codigo: "KE", regiao: "África", subRegiao: "Oriental", capital: "Nairóbi", declarouArt34: false },
  { nome: "Madagascar", codigo: "MG", regiao: "África", subRegiao: "Oriental", capital: "Antananarivo", declarouArt34: false },
  { nome: "Maurício", codigo: "MU", regiao: "África", subRegiao: "Oriental", capital: "Port Louis", declarouArt34: false },
  { nome: "Ruanda", codigo: "RW", regiao: "África", subRegiao: "Oriental", capital: "Kigali", declarouArt34: true, revogouArt34: true },
  { nome: "Seicheles", codigo: "SC", regiao: "África", subRegiao: "Oriental", capital: "Victoria", declarouArt34: false },
  { nome: "Somália", codigo: "SO", regiao: "África", subRegiao: "Oriental", capital: "Mogadíscio", declarouArt34: false },
  { nome: "Sudão", codigo: "SD", regiao: "África", subRegiao: "Oriental", capital: "Cartum", declarouArt34: false },
  { nome: "Sudão do Sul", codigo: "SS", regiao: "África", subRegiao: "Oriental", capital: "Juba", declarouArt34: false },
  { nome: "Tanzânia", codigo: "TZ", regiao: "África", subRegiao: "Oriental", capital: "Dodoma", declarouArt34: true, revogouArt34: true },
  { nome: "Uganda", codigo: "UG", regiao: "África", subRegiao: "Oriental", capital: "Campala", declarouArt34: false },

  // África Austral
  { nome: "África do Sul", codigo: "ZA", regiao: "África", subRegiao: "Austral", capital: "Pretória", declarouArt34: false },
  { nome: "Botsuana", codigo: "BW", regiao: "África", subRegiao: "Austral", capital: "Gaborone", declarouArt34: false },
  { nome: "Essuatíni", codigo: "SZ", regiao: "África", subRegiao: "Austral", capital: "Mbabane", declarouArt34: false },
  { nome: "Lesoto", codigo: "LS", regiao: "África", subRegiao: "Austral", capital: "Maseru", declarouArt34: false },
  { nome: "Malawi", codigo: "MW", regiao: "África", subRegiao: "Austral", capital: "Lilongwe", declarouArt34: true, dataDeclaracaoArt34: "2008-10-09" },
  { nome: "Moçambique", codigo: "MZ", regiao: "África", subRegiao: "Austral", capital: "Maputo", declarouArt34: false },
  { nome: "Namíbia", codigo: "NA", regiao: "África", subRegiao: "Austral", capital: "Windhoek", declarouArt34: false },
  { nome: "Zâmbia", codigo: "ZM", regiao: "África", subRegiao: "Austral", capital: "Lusaka", declarouArt34: false },
  { nome: "Zimbábue", codigo: "ZW", regiao: "África", subRegiao: "Austral", capital: "Harare", declarouArt34: false },
];

export function paisAfricanoPorNome(nome: string): PaisAfricano | undefined {
  return PAISES_AFRICA.find((p) => p.nome.toLowerCase() === nome.toLowerCase());
}

export function paisAfricanoPorCodigo(codigo: string): PaisAfricano | undefined {
  return PAISES_AFRICA.find((p) => p.codigo.toUpperCase() === codigo.toUpperCase());
}

export function paisesPorSubRegiao(subRegiao: PaisAfricano["subRegiao"]): PaisAfricano[] {
  return PAISES_AFRICA.filter((p) => p.subRegiao === subRegiao);
}
