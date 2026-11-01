/**
 * @file apps/web/lib/direitos-globais/cidh.ts
 * @description Sistema interamericano: tratados e obrigações que vinculam.
 *
 * Fonte: Departamento de Direito Internacional da OEA, páginas oficiais de
 * assinaturas e ratificações de cada tratado. O texto dos artigos 1, 2, 63 e
 * 68 vem da página oficial do Pacto de San José. Data de acesso: 2026-10-30.
 *
 * Status:
 * - "ratificado": instrumento depositado; o Estado está vinculado.
 * - "assinado": assinou, mas não depositou ratificação; ainda não vinculado.
 * - "nao": não assinou nem ratificou.
 *
 * Condenações: a Corte bloqueia cliente automatizado com Cloudflare
 * Turnstile. Com autorização do dono, a coleta usou Chrome normal e a
 * sessão liberada por humano; nenhum CAPTCHA foi resolvido por máquina.
 * O resultado está em `sentencas.ts`.
 */

import type { Dispositivo } from "./tipos";

export type StatusAdesao = "ratificado" | "assinado" | "nao";

export interface Adesao {
  status: StatusAdesao;
  ano: number | null;
}

export interface TratadoInteramericano {
  id: string;
  nome: string;
  apelido: string;
  resumo: string;
  url: string;
}

export const TRATADOS_INTERAMERICANOS: readonly TratadoInteramericano[] = [
  {
    id: "B-32",
    nome: "Convenção Americana sobre Direitos Humanos",
    apelido: "Pacto de San José",
    resumo: "Base do sistema: obriga a respeitar e garantir os direitos e a reparar violações. Só quem ratifica se submete à Corte.",
    url: "https://www.oas.org/dil/esp/tratados_B-32_Convencion_Americana_sobre_Derechos_Humanos_firmas.htm",
  },
  {
    id: "A-52",
    nome: "Protocolo de San Salvador",
    apelido: "Direitos econômicos, sociais e culturais",
    resumo: "Acrescenta direitos ao trabalho, à saúde, à educação, à moradia e à alimentação.",
    url: "https://www.oas.org/juridico/spanish/firmas/a-52.html",
  },
  {
    id: "A-61",
    nome: "Convenção de Belém do Pará",
    apelido: "Violência contra a mulher",
    resumo: "Define violência contra a mulher e obriga o Estado a prevenir, punir e erradicar.",
    url: "https://www.oas.org/juridico/spanish/firmas/a-61.html",
  },
  {
    id: "A-51",
    nome: "Convenção contra a Tortura",
    apelido: "Tortura",
    resumo: "Obriga a tipificar a tortura, investigar e excluir prova obtida por tortura.",
    url: "https://www.oas.org/juridico/spanish/firmas/a-51.html",
  },
  {
    id: "A-60",
    nome: "Convenção sobre Desaparecimento Forçado",
    apelido: "Desaparecimento forçado",
    resumo: "Obriga a tipificar o desaparecimento forçado e a cooperar entre Estados.",
    url: "https://www.oas.org/juridico/spanish/firmas/a-60.html",
  },
  {
    id: "A-65",
    nome: "Convenção contra a Discriminação por Deficiência",
    apelido: "Pessoas com deficiência",
    resumo: "Obriga a eliminar barreiras e a promover igualdade para pessoas com deficiência.",
    url: "https://www.oas.org/juridico/spanish/firmas/a-65.html",
  },
  {
    id: "A-69",
    nome: "Convenção contra Discriminação e Intolerância",
    apelido: "Discriminação e intolerância",
    resumo: "Obriga a prevenir e punir discriminação e intolerância em todas as formas.",
    url: "https://www.oas.org/es/sla/ddi/tratados_multilaterales_interamericanos_A-69_discriminacion_intolerancia_firmas.asp",
  },
  {
    id: "A-70",
    nome: "Convenção sobre Direitos das Pessoas Idosas",
    apelido: "Pessoas idosas",
    resumo: "Reconhece direitos de pessoas idosas à autonomia, saúde, cuidado e não discriminação.",
    url: "https://www.oas.org/es/sla/ddi/tratados_multilaterales_interamericanos_A-70_derechos_humanos_personas_mayores_firmas.asp",
  },
];

export const ADESAO: Record<string, Record<string, Adesao>> = {
  "B-32": {
    "Argentina": { status: "ratificado", ano: 1984 },
    "Bolívia": { status: "ratificado", ano: 1979 },
    "Brasil": { status: "ratificado", ano: 1992 },
    "Chile": { status: "ratificado", ano: 1990 },
    "Colômbia": { status: "ratificado", ano: 1973 },
    "Costa Rica": { status: "ratificado", ano: 1970 },
    "Cuba": { status: "nao", ano: null },
    "Equador": { status: "ratificado", ano: 1977 },
    "El Salvador": { status: "ratificado", ano: 1978 },
    "Guatemala": { status: "ratificado", ano: 1978 },
    "Haiti": { status: "ratificado", ano: 1977 },
    "Honduras": { status: "ratificado", ano: 1977 },
    "México": { status: "ratificado", ano: 1981 },
    "Nicarágua": { status: "ratificado", ano: 1979 },
    "Panamá": { status: "ratificado", ano: 1978 },
    "Paraguai": { status: "ratificado", ano: 1989 },
    "Peru": { status: "ratificado", ano: 1978 },
    "República Dominicana": { status: "ratificado", ano: 1978 },
    "Uruguai": { status: "ratificado", ano: 1985 },
    "Venezuela": { status: "ratificado", ano: 2019 },
  },
  "A-52": {
    "Argentina": { status: "ratificado", ano: 2003 },
    "Bolívia": { status: "ratificado", ano: 2006 },
    "Brasil": { status: "ratificado", ano: 1996 },
    "Chile": { status: "ratificado", ano: 2022 },
    "Colômbia": { status: "ratificado", ano: 1997 },
    "Costa Rica": { status: "ratificado", ano: 1999 },
    "Cuba": { status: "nao", ano: null },
    "Equador": { status: "ratificado", ano: 1993 },
    "El Salvador": { status: "ratificado", ano: 1995 },
    "Guatemala": { status: "ratificado", ano: 2000 },
    "Haiti": { status: "assinado", ano: 1988 },
    "Honduras": { status: "ratificado", ano: 2011 },
    "México": { status: "ratificado", ano: 1996 },
    "Nicarágua": { status: "ratificado", ano: 2010 },
    "Panamá": { status: "ratificado", ano: 1993 },
    "Paraguai": { status: "ratificado", ano: 1997 },
    "Peru": { status: "ratificado", ano: 1995 },
    "República Dominicana": { status: "assinado", ano: 1988 },
    "Uruguai": { status: "ratificado", ano: 1996 },
    "Venezuela": { status: "ratificado", ano: 2020 },
  },
  "A-61": {
    "Argentina": { status: "ratificado", ano: 1996 },
    "Bolívia": { status: "ratificado", ano: 1994 },
    "Brasil": { status: "ratificado", ano: 1995 },
    "Chile": { status: "ratificado", ano: 1996 },
    "Colômbia": { status: "ratificado", ano: 1996 },
    "Costa Rica": { status: "ratificado", ano: 1995 },
    "Cuba": { status: "nao", ano: null },
    "Equador": { status: "ratificado", ano: 1995 },
    "El Salvador": { status: "ratificado", ano: 1996 },
    "Guatemala": { status: "ratificado", ano: 1995 },
    "Haiti": { status: "ratificado", ano: 1997 },
    "Honduras": { status: "ratificado", ano: 1995 },
    "México": { status: "ratificado", ano: 1998 },
    "Nicarágua": { status: "ratificado", ano: 1995 },
    "Panamá": { status: "ratificado", ano: 1995 },
    "Paraguai": { status: "ratificado", ano: 1995 },
    "Peru": { status: "ratificado", ano: 1996 },
    "República Dominicana": { status: "ratificado", ano: 1996 },
    "Uruguai": { status: "ratificado", ano: 1996 },
    "Venezuela": { status: "ratificado", ano: 1995 },
  },
  "A-51": {
    "Argentina": { status: "ratificado", ano: 1989 },
    "Bolívia": { status: "ratificado", ano: 2006 },
    "Brasil": { status: "ratificado", ano: 1989 },
    "Chile": { status: "ratificado", ano: 1988 },
    "Colômbia": { status: "ratificado", ano: 1999 },
    "Costa Rica": { status: "ratificado", ano: 2000 },
    "Cuba": { status: "nao", ano: null },
    "Equador": { status: "ratificado", ano: 1999 },
    "El Salvador": { status: "ratificado", ano: 1994 },
    "Guatemala": { status: "ratificado", ano: 1987 },
    "Haiti": { status: "assinado", ano: 1986 },
    "Honduras": { status: "ratificado", ano: 2024 },
    "México": { status: "ratificado", ano: 1987 },
    "Nicarágua": { status: "ratificado", ano: 2009 },
    "Panamá": { status: "ratificado", ano: 1991 },
    "Paraguai": { status: "ratificado", ano: 1990 },
    "Peru": { status: "ratificado", ano: 1991 },
    "República Dominicana": { status: "ratificado", ano: 1987 },
    "Uruguai": { status: "ratificado", ano: 1992 },
    "Venezuela": { status: "ratificado", ano: 1991 },
  },
  "A-60": {
    "Argentina": { status: "ratificado", ano: 1996 },
    "Bolívia": { status: "ratificado", ano: 1999 },
    "Brasil": { status: "ratificado", ano: 2014 },
    "Chile": { status: "ratificado", ano: 2010 },
    "Colômbia": { status: "ratificado", ano: 2005 },
    "Costa Rica": { status: "ratificado", ano: 1996 },
    "Cuba": { status: "nao", ano: null },
    "Equador": { status: "ratificado", ano: 2006 },
    "El Salvador": { status: "nao", ano: null },
    "Guatemala": { status: "ratificado", ano: 2000 },
    "Haiti": { status: "nao", ano: null },
    "Honduras": { status: "ratificado", ano: 2005 },
    "México": { status: "ratificado", ano: 2002 },
    "Nicarágua": { status: "assinado", ano: 1994 },
    "Panamá": { status: "ratificado", ano: 1996 },
    "Paraguai": { status: "ratificado", ano: 1996 },
    "Peru": { status: "ratificado", ano: 2002 },
    "República Dominicana": { status: "nao", ano: null },
    "Uruguai": { status: "ratificado", ano: 1996 },
    "Venezuela": { status: "ratificado", ano: 1999 },
  },
  "A-65": {
    "Argentina": { status: "ratificado", ano: 2001 },
    "Bolívia": { status: "ratificado", ano: 2003 },
    "Brasil": { status: "ratificado", ano: 2001 },
    "Chile": { status: "ratificado", ano: 2002 },
    "Colômbia": { status: "ratificado", ano: 2004 },
    "Costa Rica": { status: "ratificado", ano: 2000 },
    "Cuba": { status: "nao", ano: null },
    "Equador": { status: "ratificado", ano: 2004 },
    "El Salvador": { status: "ratificado", ano: 2002 },
    "Guatemala": { status: "ratificado", ano: 2003 },
    "Haiti": { status: "ratificado", ano: 2009 },
    "Honduras": { status: "ratificado", ano: 2011 },
    "México": { status: "ratificado", ano: 2001 },
    "Nicarágua": { status: "ratificado", ano: 2002 },
    "Panamá": { status: "ratificado", ano: 2001 },
    "Paraguai": { status: "ratificado", ano: 2002 },
    "Peru": { status: "ratificado", ano: 2001 },
    "República Dominicana": { status: "ratificado", ano: 2007 },
    "Uruguai": { status: "ratificado", ano: 2001 },
    "Venezuela": { status: "ratificado", ano: 2006 },
  },
  "A-69": {
    "Argentina": { status: "assinado", ano: 2013 },
    "Bolívia": { status: "assinado", ano: 2015 },
    "Brasil": { status: "assinado", ano: 2013 },
    "Chile": { status: "assinado", ano: 2015 },
    "Colômbia": { status: "assinado", ano: 2014 },
    "Costa Rica": { status: "assinado", ano: 2019 },
    "Cuba": { status: "nao", ano: null },
    "Equador": { status: "ratificado", ano: 2024 },
    "El Salvador": { status: "nao", ano: null },
    "Guatemala": { status: "nao", ano: null },
    "Haiti": { status: "assinado", ano: 2014 },
    "Honduras": { status: "nao", ano: null },
    "México": { status: "assinado", ano: 2018 },
    "Nicarágua": { status: "nao", ano: null },
    "Panamá": { status: "assinado", ano: 2014 },
    "Paraguai": { status: "nao", ano: null },
    "Peru": { status: "assinado", ano: 2016 },
    "República Dominicana": { status: "nao", ano: null },
    "Uruguai": { status: "ratificado", ano: 2018 },
    "Venezuela": { status: "nao", ano: null },
  },
  "A-70": {
    "Argentina": { status: "ratificado", ano: 2017 },
    "Bolívia": { status: "ratificado", ano: 2017 },
    "Brasil": { status: "assinado", ano: 2015 },
    "Chile": { status: "ratificado", ano: 2017 },
    "Colômbia": { status: "nao", ano: null },
    "Costa Rica": { status: "ratificado", ano: 2016 },
    "Cuba": { status: "nao", ano: null },
    "Equador": { status: "ratificado", ano: 2019 },
    "El Salvador": { status: "ratificado", ano: 2018 },
    "Guatemala": { status: "nao", ano: null },
    "Haiti": { status: "nao", ano: null },
    "Honduras": { status: "nao", ano: null },
    "México": { status: "ratificado", ano: 2023 },
    "Nicarágua": { status: "nao", ano: null },
    "Panamá": { status: "nao", ano: null },
    "Paraguai": { status: "ratificado", ano: 2026 },
    "Peru": { status: "ratificado", ano: 2021 },
    "República Dominicana": { status: "nao", ano: null },
    "Uruguai": { status: "ratificado", ano: 2016 },
    "Venezuela": { status: "nao", ano: null },
  },
};

/** Obrigações gerais do Pacto de San José, transcritas da fonte oficial. */
export const OBRIGACOES: readonly Dispositivo[] = [
  {
    pais: "Pacto de San José",
    tipo: "humanos",
    citacao: "Artículo 1.1",
    titulo: "Obrigación de Respetar los Derechos",
    texto:
      "Los Estados Partes en esta Convención se comprometen a respetar los derechos y libertades reconocidos en ella y a garantizar su libre y pleno ejercicio a toda persona que esté sujeta a su jurisdicción, sin discriminación alguna por motivos de raza, color, sexo, idioma, religión, opiniones políticas o de cualquier otra índole, origen nacional o social, posición económica, nacimiento o cualquier otra condición social.",
    fonte: "OEA — Convenção Americana sobre Direitos Humanos",
    url: "https://www.oas.org/dil/esp/tratados_b-32_convencion_americana_sobre_derechos_humanos.htm",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "es",
  },
  {
    pais: "Pacto de San José",
    tipo: "humanos",
    citacao: "Artículo 2",
    titulo: "Deber de Adoptar Disposiciones de Derecho Interno",
    texto:
      "Si el ejercicio de los derechos y libertades mencionados en el artículo 1 no estuviere ya garantizado por disposiciones legislativas o de otro carácter, los Estados Partes se comprometen a adoptar, con arreglo a sus procedimientos constitucionales y a las disposiciones de esta Convención, las medidas legislativas o de otro carácter que fueren necesarias para hacer efectivos tales derechos y libertades.",
    fonte: "OEA — Convenção Americana sobre Direitos Humanos",
    url: "https://www.oas.org/dil/esp/tratados_b-32_convencion_americana_sobre_derechos_humanos.htm",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "es",
  },
  {
    pais: "Pacto de San José",
    tipo: "humanos",
    citacao: "Artículo 63.1",
    titulo: "Reparación",
    texto:
      "Cuando decida que hubo violación de un derecho o libertad protegidos en esta Convención, la Corte dispondrá que se garantice al lesionado en el goce de su derecho o libertad conculcados. Dispondrá asimismo, si ello fuera procedente, que se reparen las consecuencias de la medida o situación que ha configurado la vulneración de esos derechos y el pago de una justa indemnización a la parte lesionada.",
    fonte: "OEA — Convenção Americana sobre Direitos Humanos",
    url: "https://www.oas.org/dil/esp/tratados_b-32_convencion_americana_sobre_derechos_humanos.htm",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "es",
  },
  {
    pais: "Pacto de San José",
    tipo: "humanos",
    citacao: "Artículo 68.1",
    titulo: "Cumplimiento de las decisiones",
    texto:
      "Los Estados Partes en la Convención se comprometen a cumplir la decisión de la Corte en todo caso en que sean partes.",
    fonte: "OEA — Convenção Americana sobre Direitos Humanos",
    url: "https://www.oas.org/dil/esp/tratados_b-32_convencion_americana_sobre_derechos_humanos.htm",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "es",
  },
];

/** Adesão de um país a todos os tratados da lista. */
export function adesaoDoPais(pais: string): Array<{ tratado: TratadoInteramericano; adesao: Adesao }> {
  return TRATADOS_INTERAMERICANOS.map((tratado) => ({
    tratado,
    adesao: ADESAO[tratado.id]?.[pais] ?? { status: "nao", ano: null },
  }));
}

/** Quantos dos vinte países ratificaram cada tratado. */
export function ratificacoesPorTratado(): Array<{ tratado: TratadoInteramericano; total: number }> {
  return TRATADOS_INTERAMERICANOS.map((tratado) => ({
    tratado,
    total: Object.values(ADESAO[tratado.id] ?? {}).filter((a) => a.status === "ratificado").length,
  }));
}

/** Países da lista, na ordem em que aparecem na fonte. */
export const PAISES_CIDH: readonly string[] = ["Argentina","Bolívia","Brasil","Chile","Colômbia","Costa Rica","Cuba","Equador","El Salvador","Guatemala","Haiti","Honduras","México","Nicarágua","Panamá","Paraguai","Peru","República Dominicana","Uruguai","Venezuela"];
