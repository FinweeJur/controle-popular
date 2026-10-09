/**
 * @file escada-internacional.ts
 * @description Degrau 6.5 da escada determinística — expansão internacional
 * (EUA e Canadá) e pedidos em inglês/espanhol. Responde antes de chamar a IA.
 *
 * Papel no portal:
 * Reconhece quem pergunta pelo hub dos EUA ou do Canadá, inclusive pedindo a
 * resposta em outro idioma, e devolve o cartão do país naquele idioma.
 *
 * Fonte dos dados:
 * Estrutura oficial de navegação do portal (`/eua`, `/canada`) e as fontes
 * que cada hub publica (SEC EDGAR, USAspending, EPA ECHO, NID, TSX/SEDAR,
 * ECCC NPRI). Nenhum texto é gerado por máquina.
 *
 * Decisões técnicas:
 * - **Antes isto era o pior método do arquivo: complexidade ciclomática 24**,
 *   dentro de `escada-determinista.ts` (medido em 09/10/2026). Todo o custo
 *   vinha de ternários aninhados escolhendo idioma dentro do objeto do cartão:
 *   `isEn ? A : isEs ? B : C`, repetido em título, subtítulo, texto e rótulo,
 *   dois países em sequência. Virou TABELA de dados: um registro por idioma,
 *   e uma funçãozinha que escolhe o registro.
 * - O `subtitulo` dos EUA era um ternário com as TRÊS ramificações idênticas —
 *   complexidade que não decidia nada. Virou a constante `SUBTITULO_EUA`.
 * - **A ordem dos testes é regra, não detalhe:** os EUA só respondem se NÃO
 *   for assunto do Canadá (`!ehCanada`). Sem isso, "tsx canada" caía no hub
 *   errado. O Canadá tem teste próprio logo abaixo e fica sempre à espera.
 * - `idiomaEua` e `idiomaCanada` tem os critérios DIFERENTES de propósito:
 *   em inglês o Canadá também se reconhece por "canadian", e os EUA por
 *   "united states"; os EUA reconhecem "estados unidos de america" como
 *   espanhol. Trocar um pelo outro muda a resposta.
 * - Prova de equivalência: `prova-internacional.mts` roda a função ANTIGA
 *   (extraída do commit `a32a08f9`) e a nova sobre a mesma matriz de
 *   perguntas e compara o cartão inteiro, campo a campo.
 */

import type { ResultadoEscada } from "./escada-base";

/** Os três idiomas em que o portal responde neste degrau. */
type Idioma = "en" | "es" | "pt";

/** O que muda de idioma para idioma: título, texto e o rótulo do atalho principal. */
interface VersaoInternacional {
  titulo: string;
  texto: string;
  rotulo: string;
}

/** Subtítulo dos EUA — era um ternário com as três ramificações iguais. */
const SUBTITULO_EUA = "SEC EDGAR · USAspending · EPA ECHO · NID · OpenAlex · GBIF";

/** Subtítulo do Canadá — sempre o mesmo, em qualquer idioma. */
const SUBTITULO_CANADA = "TSX/SEDAR+ · Open Canada · ECCC NPRI · Mount Polley · First Nations";

const EUA: Record<Idioma, VersaoInternacional> = {
  en: {
    titulo: "United States Civic Observatory (/eua)",
    texto:
      "We audit US public contracts, SEC corporate filings, EPA penalties, 91,000 dams, and scientific data.",
    rotulo: "Open US Hub (/eua)",
  },
  es: {
    titulo: "Observatorio Cívico de EE. UU. (/eua)",
    texto: "Auditamos contratos públicos de EE. UU., balances en la SEC, multas de la EPA y represas.",
    rotulo: "Abrir Hub EE. UU. (/eua)",
  },
  pt: {
    titulo: "Observatório Cívico dos Estados Unidos (/eua)",
    texto:
      "Monitoramos contratos federais nos EUA, balanços na SEC, multas da EPA, barragens no NID e biodiversidade.",
    rotulo: "Painel Geral dos EUA (/eua)",
  },
};

const CANADA: Record<Idioma, VersaoInternacional> = {
  en: {
    titulo: "Canada Civic & Mining Observatory (/canada)",
    texto:
      "We track Canadian miners operating in Brazil, NPRI tailings emissions, Mount Polley, and First Nations treaties.",
    rotulo: "Open Canada Hub (/canada)",
  },
  es: {
    titulo: "Observatorio Cívico y Minero de Canadá (/canada)",
    texto:
      "Rastreamos mineras canadienses en Brasil, emisiones NPRI, Mount Polley y tierras de las Primeras Naciones.",
    rotulo: "Abrir Hub Canadá (/canada)",
  },
  pt: {
    titulo: "Observatório Cívico e Minerário do Canadá (/canada)",
    texto:
      "Cruzamos mineradoras canadenses na TSX que atuam no Brasil, emissões NPRI, Mount Polley e Primeiras Nações.",
    rotulo: "Painel Geral do Canadá (/canada)",
  },
};

/** Pergunta caiu no bloco dos EUA? Duas regex, na ordem do `if` original. */
function ePerguntaDosEua(normalizada: string): boolean {
  return (
    /\b(explain in plain english|explica en espanol|explique em portugues simples)\b/i.test(normalizada) ||
    /\b(eua|estados unidos|united states|sec edgar|usaspending|superfund|epa echo|nid dams|foia)\b/i.test(
      normalizada
    )
  );
}

/** Pergunta caiu no bloco do Canadá? */
function ePerguntaDoCanada(normalizada: string): boolean {
  return /\b(canada|canadian|tsx|sedar|mount polley|npri|eccc|first nations|primeiras nacoes|openparliament|core ombuds|sudbury)\b/i.test(
    normalizada
  );
}

/**
 * É assunto do Canadá? Se for, os EUA não respondem — o Canadá fica à espera.
 * Critérios idênticos ao `isCanada` original, na mesma ordem.
 */
function ehCanada(normalizada: string): boolean {
  return (
    normalizada.includes("canada") ||
    normalizada.includes("tsx") ||
    normalizada.includes("mount polley")
  );
}

/** Idioma do cartão dos EUA — ordem das verificações idêntica ao original. */
function idiomaEua(normalizada: string): Idioma {
  if (normalizada.includes("english") || normalizada.includes("united states")) return "en";
  if (normalizada.includes("espanol") || normalizada.includes("estados unidos de america")) return "es";
  return "pt";
}

/** Idioma do cartão do Canadá — critérios próprios, diferentes dos EUA. */
function idiomaCanada(normalizada: string): Idioma {
  if (normalizada.includes("english") || normalizada.includes("canadian")) return "en";
  if (normalizada.includes("espanol")) return "es";
  return "pt";
}

/** O que um país fixa: onde ele mora e o que todo cartão dele traz. */
interface MolduraPais {
  categoria: string;
  subtitulo: string;
  /** Rota do hub — é o destino do primeiro atalho. */
  hub: string;
  /** Atalhos iguais em qualquer idioma, depois do principal. */
  fixos: { rotulo: string; href: string }[];
}

const MOLDE_EUA: MolduraPais = {
  categoria: "Internacional · EUA",
  subtitulo: SUBTITULO_EUA,
  hub: "/eua",
  fixos: [
    { rotulo: "SEC EDGAR & Fundos (/eua/empresas)", href: "/eua/empresas" },
    { rotulo: "EPA, Barragens & Natureza (/eua/ambiental)", href: "/eua/ambiental" },
    { rotulo: "USAspending & Comércio (/eua/contratos)", href: "/eua/contratos" },
    { rotulo: "Congresso, SCOTUS & Terras (/eua/institucional)", href: "/eua/institucional" },
  ],
};

const MOLDE_CANADA: MolduraPais = {
  categoria: "Internacional · Canadá",
  subtitulo: SUBTITULO_CANADA,
  hub: "/canada",
  fixos: [
    { rotulo: "Mineradoras TSX no Brasil (/canada/mineracao)", href: "/canada/mineracao" },
    { rotulo: "NPRI, Água & Mount Polley (/canada/ambiental)", href: "/canada/ambiental" },
    { rotulo: "Compras & Subsídios (/canada/contratos)", href: "/canada/contratos" },
    { rotulo: "Parlamento, Corte & Indígenas (/canada/institucional)", href: "/canada/institucional" },
  ],
};

/**
 * Monta o cartão de um país a partir do molde dele e da versão do idioma.
 *
 * Um molde só para os dois países: a estrutura era idêntica e o CodeScene
 * marcava as duas funções como duplicadas (bloqueou o commit de 09/10/2026).
 * O que muda de país a país está em `MOLDE_EUA`/`MOLDE_CANADA`; o que muda
 * de idioma a idioma, em `EUA`/`CANADA`.
 */
function cartaoDoPais(molde: MolduraPais, v: VersaoInternacional): ResultadoEscada {
  return {
    tipo: "pagina",
    titulo: v.titulo,
    subtitulo: molde.subtitulo,
    texto: v.texto,
    categoria: molde.categoria,
    atalhos: [{ rotulo: v.rotulo, href: molde.hub, principal: true }, ...molde.fixos],
  };
}

/**
 * Degrau 6.5 — expansão internacional (EUA e Canadá) e pedido trilíngue.
 *
 * @param normalizada prompt sem acento, minúsculo, já corrigido ortográficamente.
 * @returns Cartão do hub do país, ou `null` para o degrau seguinte.
 */
export function degrau65Internacional(normalizada: string): ResultadoEscada | null {
  // ─── 6.5. DEGRAU: EXPANSÃO INTERNACIONAL (EUA & CANADÁ) E TRILÍNGUE ────
  // Os EUA só respondem se NÃO for assunto do Canadá: o Canadá tem teste
  // próprio logo abaixo e fica sempre à espera.
  if (ePerguntaDosEua(normalizada) && !ehCanada(normalizada)) {
    return cartaoDoPais(MOLDE_EUA, EUA[idiomaEua(normalizada)]);
  }

  if (ePerguntaDoCanada(normalizada)) {
    return cartaoDoPais(MOLDE_CANADA, CANADA[idiomaCanada(normalizada)]);
  }

  return null;
}
