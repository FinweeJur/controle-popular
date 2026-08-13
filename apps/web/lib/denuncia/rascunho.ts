import type { RespostasDenuncia } from "@/lib/denuncia/tipos";

/**
 * Rascunho local — OPT-IN, nunca padrão. Ver a seção "O rascunho enquanto a
 * pessoa preenche" de `docs/PLANO-ACAO-CIDADA.md` para a decisão por
 * extenso: gravar em `localStorage` ajuda (não perde uma entrevista de 20
 * minutos se o navegador fechar) e atrapalha (fica gravado no aparelho, que
 * pode ser apreendido). Quem decide é a pessoa — só ela sabe se o aparelho
 * é seu, é de uma lan house, de um telecentro, de um parente.
 *
 * `StorageLike` existe para este arquivo ser testável sem `jsdom`
 * (`vitest.config.ts` roda `environment: "node"`, de propósito — ver o
 * comentário lá). O componente cliente passa `window.localStorage`, que
 * implementa a mesma interface; o teste passa um `Map` disfarçado.
 */

export interface StorageLike {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

export const CHAVE_RASCUNHO = "cp-denuncia-rascunho-v1";

/** 24h, decisão do plano — expira sozinho, não fica esquecido no aparelho para sempre. */
export const EXPIRA_MS = 24 * 60 * 60 * 1000;

interface RascunhoArmazenado {
  respostas: RespostasDenuncia;
  salvoEm: number;
}

export function salvarRascunho(
  storage: StorageLike,
  respostas: RespostasDenuncia,
  agora: number = Date.now()
): void {
  const dado: RascunhoArmazenado = { respostas, salvoEm: agora };
  storage.setItem(CHAVE_RASCUNHO, JSON.stringify(dado));
}

export interface RascunhoCarregado {
  respostas: RespostasDenuncia;
  salvoEm: number;
}

/**
 * `null` tanto para "nunca salvou" quanto para "expirou" — quem chama não
 * precisa distinguir os dois casos, os dois significam "comece do zero". Um
 * rascunho expirado é removido no mesmo passo, para não deixar lixo com
 * dado sensível parado no aparelho além do prazo prometido na tela.
 */
export function carregarRascunho(
  storage: StorageLike,
  agora: number = Date.now()
): RascunhoCarregado | null {
  const bruto = storage.getItem(CHAVE_RASCUNHO);
  if (!bruto) return null;

  let dado: RascunhoArmazenado;
  try {
    dado = JSON.parse(bruto) as RascunhoArmazenado;
  } catch {
    storage.removeItem(CHAVE_RASCUNHO);
    return null;
  }

  if (typeof dado.salvoEm !== "number" || agora - dado.salvoEm > EXPIRA_MS) {
    storage.removeItem(CHAVE_RASCUNHO);
    return null;
  }

  return dado;
}

/**
 * "Apagar tudo agora" — o botão que o plano exige SEMPRE visível, não
 * escondido em menu, sem confirmação de duas etapas: apreensão de aparelho
 * não dá tempo para isso.
 */
export function apagarRascunho(storage: StorageLike): void {
  storage.removeItem(CHAVE_RASCUNHO);
}
