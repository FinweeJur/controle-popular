/**
 * @file apps/web/lib/seguranca/blindagem-prompt.ts
 * @description Módulo de sanitização e blindagem contra injeção de prompt (direta e indireta)
 * e vazamento de instruções para o assistente cívico (Seu Nonô) e pipelines de IA.
 *
 * Papel no portal:
 * - Neutraliza tentativas de desvio de conduta ética, jailbreaks e injeção de prompt direto por usuários.
 * - Higieniza dados de fontes governamentais antes de inseri-los no contexto RAG, neutralizando
 *   instruções imperativas embutidas por terceiros em diários oficiais, editais ou petições públicas
 *   (injeção indireta de prompt).
 * - Protege o assistente cívico para que ele mantenha sua postura acolhedora, honesta e fundamentada em dados.
 *
 * Princípios e Restrições:
 * - Não usa modelos externos para validar (custo zero, latência 0ms).
 * - Imunidade a falsos positivos em buscas cívicas legítimas (ex.: cidadão pesquisando "lei sobre injeção de recursos").
 */

export interface DiagnosticoPrompt {
  seguro: boolean;
  tentativaInjecaoDetectada: boolean;
  motivo?: string;
  textoSanitizado: string;
}

/** Padrões típicos de ataque de injeção direta e evasão de sistema (jailbreak). */
const PADROES_INJECAO_DIRETA: { regex: RegExp; motivo: string }[] = [
  { regex: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i, motivo: "Tentativa de anular instruções do sistema." },
  { regex: /disregard\s+(all\s+)?(previous|prior)\s+prompt/i, motivo: "Tentativa de descartar diretrizes do assistente." },
  { regex: /esque(ça|ce)\s+(todas\s+as\s+)?instru(ções|coes)/i, motivo: "Tentativa em português de anular instruções." },
  { regex: /desconsidere\s+(as\s+)?instru(ções|coes)\s+anteriores/i, motivo: "Tentativa de desconsiderar regras anteriores." },
  { regex: /repeat\s+(everything|the\s+prompt)\s+above/i, motivo: "Tentativa de extrair o prompt do sistema." },
  { regex: /repita\s+(o\s+)?prompt\s+(do\s+sistema|acima)/i, motivo: "Tentativa de vazamento do prompt do sistema." },
  { regex: /you\s+are\s+now\s+in\s+DAN\s+mode/i, motivo: "Tentativa de ativação de modo DAN (jailbreak)." },
  { regex: /voc(ê|e)\s+agora\s+(é|e)\s+um\s+modo\s+sem\s+filtros/i, motivo: "Tentativa de remoção de filtros de segurança." },
  { regex: /<\/?system>/i, motivo: "Tentativa de simular tag de sistema." },
  { regex: /```(?:system|admin|developer)/i, motivo: "Tentativa de falsificar bloco de controle de desenvolvedor." },
  { regex: /---\s*END\s+(?:OF\s+)?SYSTEM\s+PROMPT\s*---/i, motivo: "Tentativa de forjar delimitador de sistema." },
];

/**
 * Sanitiza e valida a entrada de texto enviada pelo usuário no chat.
 */
export function sanitizarEntradaUsuario(pergunta: string): DiagnosticoPrompt {
  if (!pergunta || typeof pergunta !== "string") {
    return {
      seguro: true,
      tentativaInjecaoDetectada: false,
      textoSanitizado: "",
    };
  }

  const textoCru = pergunta.trim();

  // 1. Varre padrões maliciosos conhecidos
  for (const padrao of PADROES_INJECAO_DIRETA) {
    if (padrao.regex.test(textoCru)) {
      return {
        seguro: false,
        tentativaInjecaoDetectada: true,
        motivo: padrao.motivo,
        textoSanitizado: "Por favor, faça uma pergunta sobre serviços públicos, contas governamentais ou meio ambiente.",
      };
    }
  }

  // 2. Remove caracteres nulos e de controle que possam induzir bugs de parser
  const textoLimpo = textoCru
    .replace(/\0/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove caracteres invisíveis de zero-width
    .slice(0, 500); // limita tamanho para evitar estouro de contexto

  return {
    seguro: true,
    tentativaInjecaoDetectada: false,
    textoSanitizado: textoLimpo,
  };
}

/**
 * Higieniza o conteúdo de documentos externos (leis, editais, relatórios) antes de embuti-los no RAG.
 * Previne injeção indireta de prompt através de fragmentos raspados da web.
 */
export function sanitizarTextoParaContexto(textoDocumento: string): string {
  if (!textoDocumento || typeof textoDocumento !== "string") return "";

  let sanitizado = textoDocumento;

  // 1. Neutraliza delimitadores que possam induzir o modelo a achar que o contexto acabou
  sanitizado = sanitizado
    .replace(/---\s*(?:END|START)\s*---/gi, "---")
    .replace(/<\/?(?:system|instruction|prompt)>/gi, "")
    .replace(/\[\/?INST\]/gi, "");

  // 2. Neutraliza ordens imperativas embutidas no meio de citações
  sanitizado = sanitizado
    .replace(/(?:ignore|disregard)\s+previous\s+instructions/gi, "[trecho desconsiderado]")
    .replace(/esque(ça|ce)\s+as\s+instru(ções|coes)/gi, "[trecho desconsiderado]");

  return sanitizado.trim();
}
