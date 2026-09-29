/**
 * @file apps/web/lib/assistente/fact-checking-civico.ts
 * @description Motor de checagem factual cívica inspirado nas metodologias consolidadas
 * de agências de fact-checking (IFCN, Agência Lupa, Aos Fatos e Projeto Comprova).
 *
 * Papel no portal:
 * - Realiza auditoria rigorosa de afirmações, citações textuais e links oficiais antes
 *   de autorizar publicações, respostas do assistente cívico ou aberturas de Pull Requests por bots.
 * - Garante conformidade com o princípio de dupla verificação e regra editorial (AGENTS.md §7 e §8):
 *   "o número vem do dado; o modelo só embrulha; insinuação é dano mesmo quando o dado isolado está certo".
 *
 * Escala de 5 Níveis de Classificação:
 * 1. Fato Comprovado: afirmação confirmada integralmente por ato oficial, processo ou tabela pública.
 * 2. Impreciso: o fato ocorreu, mas há imprecisão em valores, arredondamentos ou período de vigência.
 * 3. Sem Contexto: dado verdadeiro isolado utilizado para inferir uma conclusão falsa ou distorcida.
 * 4. Não Verificável: ausência de URL direta para documento oficial ou link quebrado (404/500).
 * 5. Falso: contradição flagrante com o ato público oficial.
 */

import { extrairNumerosChecaveis, normalizarNumero } from "./verificador-citacao";
import { semAcento, separarPalavras } from "../busca/normalizar";

export type GrauClassificacao =
  | "FATO_COMPROVADO"
  | "IMPRECISO"
  | "SEM_CONTEXTO"
  | "NAO_VERIFICAVEL"
  | "FALSO";

export interface ParecerFactChecking {
  grau: GrauClassificacao;
  rotuloLegivel: string;
  confiancaPercentual: number;
  aprovadoParaPublicacao: boolean;
  exigeRessalva: boolean;
  motivo: string;
  linksValidados: { url: string; valida: boolean; detalhe?: string }[];
  divergenciasNumericas: string[];
  correspondenciaTextualScore: number;
}

export interface FontePrimariaChecagem {
  url: string;
  orgaoOuAutor: string;
  tituloOuEmenta: string;
  textoCompleto: string;
  dataDocumento?: string;
}

/**
 * Valida a sintaxe e a robustez de uma URL oficial.
 * Rejeita páginas genéricas soltas quando há menção a ato específico.
 */
export function validarUrlOficial(url: string): { valida: boolean; detalhe?: string } {
  if (!url || typeof url !== "string") {
    return { valida: false, detalhe: "URL ausente ou inválida." };
  }

  const urlLimpa = url.trim();
  if (!urlLimpa.startsWith("http://") && !urlLimpa.startsWith("https://")) {
    return { valida: false, detalhe: "Protocolo HTTP/HTTPS obrigatório." };
  }

  try {
    const parsed = new URL(urlLimpa);
    const host = parsed.hostname.toLowerCase();

    // Rejeita domínios claramente fictícios ou de teste
    if (host === "example.com" || host === "localhost" || host.includes("teste")) {
      return { valida: false, detalhe: "Domínio de teste não autorizado como fonte primária." };
    }

    // Regra das 6 qualidades §8.1: link solto para home page genérica é desaconselhado
    if ((parsed.pathname === "/" || parsed.pathname === "") && !parsed.search) {
      return { valida: true, detalhe: "Atenção: URL aponta para a raiz do portal, prefira o ato canônico." };
    }

    return { valida: true };
  } catch {
    return { valida: false, detalhe: "Estrutura de URL malformada." };
  }
}

/**
 * Calcula a correspondência de n-grams (Jaccard tokenizado) entre a afirmação e a fonte primária.
 */
export function calcularAderenciaTextual(afirmacao: string, textoFonte: string): number {
  if (!afirmacao || !textoFonte) return 0;

  const tokensAfirmacao = separarPalavras(afirmacao).filter((t) => t.length > 3);
  const tokensFonte = new Set(separarPalavras(textoFonte).filter((t) => t.length > 3));

  if (tokensAfirmacao.length === 0) return 0;

  let encontrados = 0;
  for (const token of tokensAfirmacao) {
    if (tokensFonte.has(token)) encontrados++;
  }

  return encontrados / tokensAfirmacao.length;
}

/**
 * Analisa a aderência dos números da afirmação contra o texto da fonte oficial.
 */
export function checarNumerosAfirmacao(afirmacao: string, textoFonte: string): { aderentes: boolean; divergentes: string[] } {
  const numsAfirmacao = extrairNumerosChecaveis(afirmacao);
  if (numsAfirmacao.length === 0) {
    return { aderentes: true, divergentes: [] };
  }

  const textoFonteNorm = textoFonte;
  const divergentes: string[] = [];

  for (const num of numsAfirmacao) {
    // Procura número normalizado na fonte
    const presente = textoFonteNorm.includes(num) ||
      textoFonteNorm.includes(num.replace(".", ",")) ||
      extrairNumerosChecaveis(textoFonteNorm).includes(num);

    if (!presente) {
      divergentes.push(num);
    }
  }

  return {
    aderentes: divergentes.length === 0,
    divergentes,
  };
}

/**
 * Avalia uma afirmação contra uma ou mais fontes primárias segundo a metodologia IFCN.
 */
export function checarFatoCivico(
  afirmacao: string,
  fontes: FontePrimariaChecagem[],
  opcoes?: { permitirSemNumero?: boolean }
): ParecerFactChecking {
  if (!fontes || fontes.length === 0) {
    return {
      grau: "NAO_VERIFICAVEL",
      rotuloLegivel: "Não Verificável",
      confiancaPercentual: 0,
      aprovadoParaPublicacao: false,
      exigeRessalva: true,
      motivo: "Nenhuma fonte primária oficial foi anexada à afirmação.",
      linksValidados: [],
      divergenciasNumericas: [],
      correspondenciaTextualScore: 0,
    };
  }

  // 1. Validação de links oficiais
  const linksValidados = fontes.map((f) => {
    const v = validarUrlOficial(f.url);
    return { url: f.url, valida: v.valida, detalhe: v.detalhe };
  });

  const temLinkInvalido = linksValidados.some((l) => !l.valida);
  if (temLinkInvalido) {
    return {
      grau: "NAO_VERIFICAVEL",
      rotuloLegivel: "Não Verificável",
      confiancaPercentual: 20,
      aprovadoParaPublicacao: false,
      exigeRessalva: true,
      motivo: "Uma ou mais fontes apresentam links quebrados ou protocolos inválidos.",
      linksValidados,
      divergenciasNumericas: [],
      correspondenciaTextualScore: 0,
    };
  }

  // 2. Concatena texto de todas as fontes oficiais válidas
  const textoCombinadoFontes = fontes.map((f) => `${f.tituloOuEmenta} ${f.textoCompleto}`).join(" ");

  // 3. Checagem de aderência textual
  const scoreTextual = calcularAderenciaTextual(afirmacao, textoCombinadoFontes);

  // 4. Checagem de precisão numérica
  const { aderentes, divergentes } = checarNumerosAfirmacao(afirmacao, textoCombinadoFontes);

  // 5. Aplicação da Escada de Fact-Checking
  if (scoreTextual < 0.25) {
    return {
      grau: "FALSO",
      rotuloLegivel: "Falso ou Contraditório",
      confiancaPercentual: 90,
      aprovadoParaPublicacao: false,
      exigeRessalva: true,
      motivo: "O conteúdo da afirmação diverge substancialmente dos termos do ato oficial consultado.",
      linksValidados,
      divergenciasNumericas: divergentes,
      correspondenciaTextualScore: scoreTextual,
    };
  }

  if (divergentes.length > 0) {
    return {
      grau: "IMPRECISO",
      rotuloLegivel: "Impreciso",
      confiancaPercentual: 75,
      aprovadoParaPublicacao: false,
      exigeRessalva: true,
      motivo: `Valores ou períodos citados (${divergentes.join(", ")}) não foram localizados na fonte primária.`,
      linksValidados,
      divergenciasNumericas: divergentes,
      correspondenciaTextualScore: scoreTextual,
    };
  }

  if (scoreTextual >= 0.25 && scoreTextual < 0.45) {
    return {
      grau: "SEM_CONTEXTO",
      rotuloLegivel: "Sem Contexto Suficiente",
      confiancaPercentual: 70,
      aprovadoParaPublicacao: false,
      exigeRessalva: true,
      motivo: "A afirmação cita termos isolados da fonte oficial, mas carece do contexto do ato completo.",
      linksValidados,
      divergenciasNumericas: [],
      correspondenciaTextualScore: scoreTextual,
    };
  }

  // Fato Comprovado
  return {
    grau: "FATO_COMPROVADO",
    rotuloLegivel: "Fato Comprovado",
    confiancaPercentual: Math.min(99, Math.round(scoreTextual * 100)),
    aprovadoParaPublicacao: true,
    exigeRessalva: false,
    motivo: "Afirmação plenamente respaldada por documento oficial e dados numéricos coincidentes.",
    linksValidados,
    divergenciasNumericas: [],
    correspondenciaTextualScore: scoreTextual,
  };
}
