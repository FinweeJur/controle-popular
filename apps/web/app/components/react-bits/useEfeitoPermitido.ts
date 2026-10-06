/**
 * @file useEfeitoPermitido.ts
 * @description Porteiro dos efeitos decorativos (React Bits) do portal.
 *
 * Regra do portal (AGENTS §5.9/§5.10 e cabeçalhos dos vendoriados): efeito
 * decorativo NUNCA é informação — some quando o usuário pediu menos movimento
 * ou quando o tema é de alto contraste (a decoração atrapalharia a leitura).
 *
 * O estado vive FORA do React (media queries + `data-theme` no `<html>`), então
 * é lido com `useSyncExternalStore` — o padrão que o React recomenda para
 * estado externo e que evita `setState` dentro de efeito (regra
 * `react-hooks/set-state-in-effect` deste repo). Como o snapshot é um booleano
 * simples, a comparação por `Object.is` do React funciona sem re-render extra.
 *
 * Uso: `const permitido = useEfeitoPermitido();` e, no componente do efeito,
 * condicionar montagem/efeito a ele. Quando o tema ou a preferência muda ao
 * vivo, o hook notifica e o efeito desmonta/remonta sozinho.
 */
import { useSyncExternalStore } from "react";

/** Duas media queries + o atributo de tema alimentam o mesmo store. */
function assinar(aoMudar: () => void): () => void {
  const mqMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mqPonteiro = window.matchMedia("(hover: hover) and (pointer: fine)");
  mqMovimento.addEventListener("change", aoMudar);
  mqPonteiro.addEventListener("change", aoMudar);
  // `next-themes` troca `data-theme` no `<html>` sem recarregar a página:
  // sem observar o atributo, entrar no alto contraste deixaria o efeito vivo.
  const observador = new MutationObserver(aoMudar);
  observador.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    mqMovimento.removeEventListener("change", aoMudar);
    mqPonteiro.removeEventListener("change", aoMudar);
    observador.disconnect();
  };
}

/**
 * Lê o estado atual: movimento permitido, ponteiro fino (quando exigido) e
 * tema que não seja de alto contraste.
 *
 * @param exigirPonteiroFino Para efeitos contínuos de fundo: em tela de toque
 *        não há hover e a animação só gastaria bateria — devolve `false`.
 */
function ler(exigirPonteiroFino: boolean): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (document.documentElement.dataset.theme === "high-contrast") return false;
  if (
    exigirPonteiroFino &&
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    return false;
  }
  return true;
}

/**
 * @param exigirPonteiroFino Padrão `false` (efeito pontual, como a forma na
 *        capa). `true` para efeitos contínuos de fundo.
 * @returns `true` quando o efeito pode existir (montagem e laço).
 */
export function useEfeitoPermitido(exigirPonteiroFino = false): boolean {
  return useSyncExternalStore(
    assinar,
    () => ler(exigirPonteiroFino),
    // No servidor nada disto existe: devolve `false` (HTML sem efeito) e o
    // React re-renderiza com o snapshot do cliente logo após a hidratação.
    () => false,
  );
}
