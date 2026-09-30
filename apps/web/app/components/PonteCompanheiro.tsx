"use client";

/**
 * @file PonteCompanheiro.tsx
 * @description Ponte responsiva do portal para o companheiro local (Seu Nonô
 * bichinho-preguiça). Manda as coordenadas dos chips de citação `[n]` e do
 * botão "Abrir página" para `http://127.0.0.1:<porta>` do companheiro.
 *
 * PAPEL NO PROJETO
 * ----------------
 * O bichinho fica ao lado do cursor e precisa saber onde clicar. Este componente
 * mede os alvos marcados com `data-companheiro-alvo` no DOM e envia a geometria
 * à ponte local. A regra pura mora em `lib/companheiro/ponte.ts`; aqui é só a
 * fiação com o navegador.
 *
 * DECISÕES TÉCNICAS
 * -----------------
 * - **Opt-in:** só liga com `NEXT_PUBLIC_COMPANHEIRO_PONTE=1`. Sem a variável,
 *   o componente não renderiza e não faz nenhuma requisição.
 * - **Posição medida na hora, nunca fixa:** recalcula em `scroll`, `resize`,
 *   `ResizeObserver` (meia tela, rotação, teclado virtual) e `MutationObserver`
 *   (nova resposta muda a altura), com throttle por `requestAnimationFrame`.
 *   Um tique periódico cobre transições/animações que não disparam eventos.
 * - **Degradação silenciosa:** se não houver companheiro local (fetch falha,
 *   sem permissão, CORS/PNA bloqueado), nada aparece e nada quebra. É o
 *   comportamento certo em toda máquina sem o app.
 * - **Privacidade:** só geometria e a URL da página saem. Sem imagem de tela,
 *   sem texto digitado (AGENTS.md §5.8).
 *
 * ⚠️ Private Network Access: a página pública chamando `127.0.0.1` dispara o
 * preflight de PNA. O servidor LOCAL do companheiro precisa responder
 * `Access-Control-Allow-Origin` (a origem do portal) e
 * `Access-Control-Allow-Private-Network: true` ao `OPTIONS`. O contrato está no
 * plano do companheiro.
 */

import { useEffect, useRef } from "react";
import { montarAlvos, montarPacotePonte, origemNaTela, type AlvoGeometrico } from "@/lib/companheiro/ponte";

/** Liga a ponte: sem `1`, o componente não faz nada. */
const LIGADA = process.env.NEXT_PUBLIC_COMPANHEIRO_PONTE === "1";
/** Endereço da ponte local do companheiro (sobrescrevível por env). */
const URL_PONTE =
  process.env.NEXT_PUBLIC_COMPANHEIRO_PONTE_URL ?? "http://127.0.0.1:8765/ponte";
/** Tique periódico: cobre movimento que não dispara evento de scroll/resize. */
const INTERVALO_MS = 1500;

export function PonteCompanheiro() {
  const sessaoRef = useRef<{ id: string } | null>(null);

  useEffect(() => {
    if (!LIGADA || typeof window === "undefined") return;

    const aoSessao = (e: Event) => {
      const detalhe = (e as CustomEvent<{ id?: string }>).detail;
      sessaoRef.current = detalhe?.id ? { id: detalhe.id } : null;
    };
    window.addEventListener("cp:sessao-companheiro", aoSessao);

    let raf = 0;
    let ativo = true;

    const medirEEnviar = () => {
      raf = 0;
      if (!ativo) return;

      const viewport = { largura: window.innerWidth, altura: window.innerHeight };
      const itens: AlvoGeometrico[] = [];
      document.querySelectorAll<HTMLElement>("[data-companheiro-alvo]").forEach((el) => {
        const bruto = el.dataset.companheiroAlvo;
        const tipo = bruto === "fonte" ? "fonte" : "abrir-pagina";
        const indiceBruto = el.dataset.companheiroIndice;
        const caixa = el.getBoundingClientRect();
        itens.push({
          tipo,
          indice: indiceBruto ? Number(indiceBruto) : undefined,
          caixa: { left: caixa.left, top: caixa.top, width: caixa.width, height: caixa.height },
        });
      });

      const alvos = montarAlvos(itens, viewport);
      const pacote = montarPacotePonte({
        sessaoId: sessaoRef.current?.id,
        url: window.location.href,
        origem: origemNaTela({
          screenX: window.screenX,
          screenY: window.screenY,
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
        }),
        viewport,
        dpr: window.devicePixelRatio || 1,
        alvos,
      });
      // Nada visível para apontar: não incomoda a ponte local.
      if (pacote.alvos.length === 0) return;

      void fetch(URL_PONTE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pacote),
      }).catch(() => {
        // Sem companheiro local: degrada em silêncio.
      });
    };

    const agendar = () => {
      if (!ativo || raf) return;
      raf = window.requestAnimationFrame(medirEEnviar);
    };

    const tique = window.setInterval(agendar, INTERVALO_MS);
    window.addEventListener("scroll", agendar, { passive: true });
    window.addEventListener("resize", agendar);

    const observadorTamanho = new ResizeObserver(agendar);
    observadorTamanho.observe(document.documentElement);

    const observadorMudanca = new MutationObserver(agendar);
    observadorMudanca.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-label", "data-companheiro-alvo"],
    });

    agendar();

    return () => {
      ativo = false;
      window.clearInterval(tique);
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", agendar);
      window.removeEventListener("resize", agendar);
      window.removeEventListener("cp:sessao-companheiro", aoSessao);
      observadorTamanho.disconnect();
      observadorMudanca.disconnect();
    };
  }, []);

  return null;
}
