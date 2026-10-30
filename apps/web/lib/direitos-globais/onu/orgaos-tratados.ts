/**
 * @file apps/web/lib/direitos-globais/onu/orgaos-tratados.ts
 * @description Os 8 órgãos de tratados fundamentais de direitos humanos da ONU (Treaty Bodies) e ratificações.
 *
 * Fonte oficial: Escritório do Alto Comissariado das Nações Unidas para os Direitos Humanos (OHCHR)
 * URL: https://tbinternet.ohchr.org/_layouts/15/TreatyBodyExternal/TBSearch.aspx
 * Data de conferência: 2026-10-30.
 *
 * Mapeamento:
 * - Mulheres -> CEDAW
 * - Crianças -> CRC
 * - Tortura -> CAT
 * - Deficiência -> CRPD
 * - Migrantes -> CMW
 * - Civis e Políticos -> CCPR
 * - Econômicos, Sociais e Culturais -> CESCR
 * - Desaparecimento Forçado -> CED
 */

import type { Status } from "../tipos-comuns";
import type { TipoDireito } from "../tipos";

export interface OrgaoTratadoONU {
  id: string; // Ex: "ccpr", "cescr", "cedaw", "crc", "cat", "crpd", "cmw", "ced"
  nomeComite: string;
  tratado: string;
  siglaTratado: string;
  anoAdocao: number;
  temaPrincipal: TipoDireito;
  temasCorrelatos: TipoDireito[];
  resumo: string;
  url: string;
}

export const ORGAOS_TRATADOS_ONU: readonly OrgaoTratadoONU[] = [
  {
    id: "ccpr",
    nomeComite: "Comitê de Direitos Humanos (CCPR)",
    tratado: "Pacto Internacional sobre Direitos Civis e Políticos",
    siglaTratado: "ICCPR",
    anoAdocao: 1966,
    temaPrincipal: "humanos",
    temasCorrelatos: ["politicos", "memoria_verdade_justica"],
    resumo: "Garante o direito à vida, integridade física, proibição da tortura e escravidão, liberdade de expressão, reunião pacífica e garantias judiciais de devido processo legal.",
    url: "https://www.ohchr.org/en/treaty-bodies/ccpr",
  },
  {
    id: "cescr",
    nomeComite: "Comitê de Direitos Econômicos, Sociais e Culturais (CESCR)",
    tratado: "Pacto Internacional sobre Direitos Econômicos, Sociais e Culturais",
    siglaTratado: "ICESCR",
    anoAdocao: 1966,
    temaPrincipal: "trabalho",
    temasCorrelatos: ["saude", "educacao", "moradia", "agua", "povos"],
    resumo: "Protege o direito ao trabalho em condições dignas, seguridade social, moradia adequada, alimentação e água, saúde física e mental e educação pública universal.",
    url: "https://www.ohchr.org/en/treaty-bodies/cescr",
  },
  {
    id: "cedaw",
    nomeComite: "Comitê para a Eliminação da Discriminação contra a Mulher (CEDAW)",
    tratado: "Convenção sobre a Eliminação de Todas as Formas de Discriminação contra a Mulher",
    siglaTratado: "CEDAW",
    anoAdocao: 1979,
    temaPrincipal: "mulheres",
    temasCorrelatos: ["humanos", "trabalho", "politicos", "saude"],
    resumo: "Carta internacional de direitos das mulheres. Estabelece a obrigação do Estado de eliminar a discriminação na vida política, no trabalho, na saúde reprodutiva e na família.",
    url: "https://www.ohchr.org/en/treaty-bodies/cedaw",
  },
  {
    id: "crc",
    nomeComite: "Comitê dos Direitos da Criança (CRC)",
    tratado: "Convenção sobre os Direitos da Criança",
    siglaTratado: "CRC",
    anoAdocao: 1989,
    temaPrincipal: "criancas",
    temasCorrelatos: ["educacao", "saude", "humanos"],
    resumo: "O tratado de direitos humanos mais amplamente ratificado no mundo. Garante a proteção da infância, proibição do trabalho infantil perigoso e prioridade absoluta.",
    url: "https://www.ohchr.org/en/treaty-bodies/crc",
  },
  {
    id: "cat",
    nomeComite: "Comitê contra a Tortura (CAT)",
    tratado: "Convenção contra a Tortura e Outros Tratamentos Cruéis, Desumanos ou Degradantes",
    siglaTratado: "UNCAT",
    anoAdocao: 1984,
    temaPrincipal: "humanos",
    temasCorrelatos: ["memoria_verdade_justica", "politicos"],
    resumo: "Obriga os Estados a tipificar a tortura, investigar denúncias independentemente, excluir confissões obtidas sob coação e proibir a extradição quando há risco de tortura.",
    url: "https://www.ohchr.org/en/treaty-bodies/cat",
  },
  {
    id: "crpd",
    nomeComite: "Comitê sobre os Direitos das Pessoas com Deficiência (CRPD)",
    tratado: "Convenção sobre os Direitos das Pessoas com Deficiência",
    siglaTratado: "CRPD",
    anoAdocao: 2006,
    temaPrincipal: "deficiencia",
    temasCorrelatos: ["humanos", "trabalho", "educacao", "moradia"],
    resumo: "Consagra o modelo social da deficiência: as barreiras do ambiente é que geram a incapacitação. Garante acessibilidade plena, capacidade civil e vida independente.",
    url: "https://www.ohchr.org/en/treaty-bodies/crpd",
  },
  {
    id: "cmw",
    nomeComite: "Comitê de Trabalhadores Migrantes (CMW)",
    tratado: "Convenção Internacional sobre a Proteção dos Direitos de Todos os Trabalhadores Migrantes",
    siglaTratado: "ICRMW",
    anoAdocao: 1990,
    temaPrincipal: "migrantes_refugiados",
    temasCorrelatos: ["trabalho", "humanos"],
    resumo: "Protege os direitos humanos e laborais de trabalhadores migrantes e suas famílias, independentemente da sua situação documental ou migratória regular ou irregular.",
    url: "https://www.ohchr.org/en/treaty-bodies/cmw",
  },
  {
    id: "ced",
    nomeComite: "Comitê sobre Desaparecimentos Forçados (CED)",
    tratado: "Convenção Internacional para a Proteção de Todas as Pessoas contra o Desaparecimento Forçado",
    siglaTratado: "ICPPED",
    anoAdocao: 2006,
    temaPrincipal: "memoria_verdade_justica",
    temasCorrelatos: ["humanos"],
    resumo: "Afirma que o desaparecimento forçado generalizado é crime contra a humanidade. Obriga a busca de desaparecidos, punição de agentes e direito à verdade dos familiares.",
    url: "https://www.ohchr.org/en/treaty-bodies/ced",
  },
];

export interface RegistroAdesaoONU {
  status: Status;
  ano: number | null;
  reservasOuDeclaracoes?: boolean;
}

/**
 * Matriz de adesão aos 8 tratados universais da ONU pelos países asiáticos da Leva 1 e Leva 2.
 * Chave primária: ID do Comitê/Tratado -> Nome do País -> RegistroAdesaoONU
 */
export const ADESAO_ONU_ASIA: Record<string, Record<string, RegistroAdesaoONU>> = {
  ccpr: {
    "China": { status: "assinado", ano: 1998, reservasOuDeclaracoes: true }, // China assinou mas nunca ratificou o ICCPR
    "Rússia": { status: "ratificado", ano: 1973 },
    "Índia": { status: "ratificado", ano: 1979, reservasOuDeclaracoes: true },
    "Vietnã": { status: "ratificado", ano: 1982 },
    "Japão": { status: "ratificado", ano: 1979 },
    "Filipinas": { status: "ratificado", ano: 1986 },
    "Indonésia": { status: "ratificado", ano: 2006 },
    "Bangladesh": { status: "ratificado", ano: 2000 },
    "Paquistão": { status: "ratificado", ano: 2010, reservasOuDeclaracoes: true },
    "Tailândia": { status: "ratificado", ano: 1996 },
    "Malásia": { status: "nao", ano: null },
    "Coreia do Sul": { status: "ratificado", ano: 1990 },
  },
  cescr: {
    "China": { status: "ratificado", ano: 2001, reservasOuDeclaracoes: true }, // Reserva ao art. 8(1)(a) sobre liberdade de sindicatos independentes
    "Rússia": { status: "ratificado", ano: 1973 },
    "Índia": { status: "ratificado", ano: 1979 },
    "Vietnã": { status: "ratificado", ano: 1982 },
    "Japão": { status: "ratificado", ano: 1979 },
    "Filipinas": { status: "ratificado", ano: 1974 },
    "Indonésia": { status: "ratificado", ano: 2006 },
    "Bangladesh": { status: "ratificado", ano: 1998 },
    "Paquistão": { status: "ratificado", ano: 2008 },
    "Tailândia": { status: "ratificado", ano: 1999 },
    "Malásia": { status: "nao", ano: null },
    "Coreia do Sul": { status: "ratificado", ano: 1990 },
  },
  cedaw: {
    "China": { status: "ratificado", ano: 1980 },
    "Rússia": { status: "ratificado", ano: 1981 },
    "Índia": { status: "ratificado", ano: 1993, reservasOuDeclaracoes: true },
    "Vietnã": { status: "ratificado", ano: 1982 },
    "Japão": { status: "ratificado", ano: 1985 },
    "Filipinas": { status: "ratificado", ano: 1981 },
    "Indonésia": { status: "ratificado", ano: 1984 },
    "Bangladesh": { status: "ratificado", ano: 1984, reservasOuDeclaracoes: true },
    "Paquistão": { status: "ratificado", ano: 1996, reservasOuDeclaracoes: true },
    "Tailândia": { status: "ratificado", ano: 1985 },
    "Malásia": { status: "ratificado", ano: 1995, reservasOuDeclaracoes: true },
    "Coreia do Sul": { status: "ratificado", ano: 1984 },
  },
  crc: {
    "China": { status: "ratificado", ano: 1992 },
    "Rússia": { status: "ratificado", ano: 1990 },
    "Índia": { status: "ratificado", ano: 1992 },
    "Vietnã": { status: "ratificado", ano: 1990 },
    "Japão": { status: "ratificado", ano: 1994 },
    "Filipinas": { status: "ratificado", ano: 1990 },
    "Indonésia": { status: "ratificado", ano: 1990 },
    "Bangladesh": { status: "ratificado", ano: 1990 },
    "Paquistão": { status: "ratificado", ano: 1990 },
    "Tailândia": { status: "ratificado", ano: 1992 },
    "Malásia": { status: "ratificado", ano: 1995 },
    "Coreia do Sul": { status: "ratificado", ano: 1991 },
  },
  cat: {
    "China": { status: "ratificado", ano: 1988 },
    "Rússia": { status: "ratificado", ano: 1987 },
    "Índia": { status: "assinado", ano: 1997 }, // Índia assinou mas nunca ratificou a Convenção contra Tortura
    "Vietnã": { status: "ratificado", ano: 2015 },
    "Japão": { status: "ratificado", ano: 1999 },
    "Filipinas": { status: "ratificado", ano: 1986 },
    "Indonésia": { status: "ratificado", ano: 1998 },
    "Bangladesh": { status: "ratificado", ano: 1998 },
    "Paquistão": { status: "ratificado", ano: 2010 },
    "Tailândia": { status: "ratificado", ano: 2007 },
    "Malásia": { status: "nao", ano: null },
    "Coreia do Sul": { status: "ratificado", ano: 1995 },
  },
  crpd: {
    "China": { status: "ratificado", ano: 2008 },
    "Rússia": { status: "ratificado", ano: 2012 },
    "Índia": { status: "ratificado", ano: 2007 },
    "Vietnã": { status: "ratificado", ano: 2015 },
    "Japão": { status: "ratificado", ano: 2014 },
    "Filipinas": { status: "ratificado", ano: 2008 },
    "Indonésia": { status: "ratificado", ano: 2011 },
    "Bangladesh": { status: "ratificado", ano: 2008 },
    "Paquistão": { status: "ratificado", ano: 2011 },
    "Tailândia": { status: "ratificado", ano: 2008 },
    "Malásia": { status: "ratificado", ano: 2010 },
    "Coreia do Sul": { status: "ratificado", ano: 2008 },
  },
  cmw: {
    "China": { status: "nao", ano: null },
    "Rússia": { status: "nao", ano: null },
    "Índia": { status: "nao", ano: null },
    "Vietnã": { status: "nao", ano: null },
    "Japão": { status: "nao", ano: null },
    "Filipinas": { status: "ratificado", ano: 1995 }, // As Filipinas são um dos raros países asiáticos signatários (grande exportador de mão de obra)
    "Indonésia": { status: "ratificado", ano: 2012 },
    "Bangladesh": { status: "ratificado", ano: 2011 },
    "Paquistão": { status: "nao", ano: null },
    "Tailândia": { status: "nao", ano: null },
    "Malásia": { status: "nao", ano: null },
    "Coreia do Sul": { status: "nao", ano: null },
  },
  ced: {
    "China": { status: "nao", ano: null },
    "Rússia": { status: "nao", ano: null },
    "Índia": { status: "assinado", ano: 2007 },
    "Vietnã": { status: "nao", ano: null },
    "Japão": { status: "ratificado", ano: 2009 },
    "Filipinas": { status: "nao", ano: null },
    "Indonésia": { status: "assinado", ano: 2010 },
    "Bangladesh": { status: "ratificado", ano: 2024 },
    "Paquistão": { status: "nao", ano: null },
    "Tailândia": { status: "ratificado", ano: 2024 },
    "Malásia": { status: "nao", ano: null },
    "Coreia do Sul": { status: "nao", ano: null },
  },
};

export function adesaoPaisONU(pais: string, comiteId: string): RegistroAdesaoONU {
  const mapa = ADESAO_ONU_ASIA[comiteId];
  if (!mapa || !mapa[pais]) {
    return { status: "desconhecido", ano: null };
  }
  return mapa[pais];
}
