"use client";

import { useEffect, useState } from "react";
import type { ItemIndice } from "./IndiceWiki";

/**
 * Mini-navegação lateral flutuante (Scroll-Spy / Mini-Sumário) para páginas longas.
 * Aparece na lateral direita em telas maiores após rolar 350px.
 * Destaca o capítulo ativo e, abaixo da lista, oferece duas setas pequenas:
 * ↑ volta ao topo e ↓ vai à próxima seção. Só a seta aparece; o rótulo
 * ("Topo" / "Próxima seção") entra no hover e no foco pelo teclado.
 */
/** Respeita a preferência de reduzir movimento do sistema. */
function comportamento(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

function BotaoSeta({
  rotulo,
  seta,
  onClick,
}: {
  rotulo: string;
  seta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={rotulo}
      className="group/seta relative flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-text-soft transition-colors hover:bg-surface-2 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus motion-reduce:transition-none"
    >
      <span aria-hidden="true">{seta}</span>
      {/* Rótulo à esquerda da seta: o widget fica colado na borda direita. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs font-semibold text-text opacity-0 shadow-md transition-opacity group-hover/seta:opacity-100 group-focus-visible/seta:opacity-100 motion-reduce:transition-none"
      >
        {rotulo}
      </span>
    </button>
  );
}
function ItemSumario({
  item,
  ativo,
  expandido,
  onIr,
}: {
  item: ItemIndice;
  ativo: boolean;
  expandido: boolean;
  onIr: (id: string) => void;
}) {  return (
    <li className="flex justify-end">
      <button
        type="button"
        onClick={() => onIr(item.id)}
        className={`flex items-center gap-2 rounded-lg px-2 py-1 text-right transition-colors ${
          ativo ? "bg-primary/10 font-bold text-primary" : "text-text-soft hover:bg-surface-2 hover:text-text"
        }`}
        aria-current={ativo ? "true" : undefined}
      >
        {expandido ? <span className="max-w-[200px] truncate">{item.titulo}</span> : null}
        <span
          className={`inline-block h-2 w-2 rounded-full transition-all ${
            ativo ? "scale-125 bg-primary" : "bg-border"
          }`}
        />
      </button>
    </li>
  );
}

export function MiniSumarioLateral({ itens }: { itens: ItemIndice[] }) {
  const [ativo, setAtivo] = useState<string>("");
  const [visivel, setVisivel] = useState(false);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    if (itens.length < 2) return;

    function handleScroll() {
      setVisivel(window.scrollY > 350);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // Observa os títulos na tela para destacar o item ativo
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setAtivo(entry.target.id);
          }
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    itens.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [itens]);

  if (itens.length < 2 || !visivel) return null;

  function rolarPara(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: comportamento(), block: "start" });
    }
  }

  function rolarFim() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: comportamento(),
    });
  }

  function rolarTopo() {
    window.scrollTo({
      top: 0,
      behavior: comportamento(),
    });
    // Mesmo destino de foco do botão flutuante antigo: quem usa teclado
    // continua no conteúdo, não no começo do documento.
    const principal = document.getElementById("conteudo-principal");
    if (principal) principal.focus({ preventScroll: true });
  }

  /**
   * ↓ vai à próxima seção que ainda está abaixo da dobra.
   *
   * Não usa o item "ativo" do scroll-spy: entre dois títulos ele fica vazio e
   * a seta voltaria para a primeira seção. A régua é a posição na tela.
   */
  function proximaSecao() {
    const abaixo = itens.find((item) => {
      const el = document.getElementById(item.id);
      return el ? el.getBoundingClientRect().top > 120 : false;
    });
    if (abaixo) {
      rolarPara(abaixo.id);
      return;
    }
    rolarFim();
  }

  return (
    <nav
      aria-label="Navegação rápida por seções"
      className="fixed right-6 2xl:right-8 top-24 z-30 hidden flex-col items-end gap-1.5 transition-all xl:flex"
      onMouseEnter={() => setExpandido(true)}
      onMouseLeave={() => setExpandido(false)}
      onFocus={() => setExpandido(true)}
      onBlur={() => setExpandido(false)}
    >
      {/* Minimizado e translúcido por padrão para não tapar o texto; ao passar
          o mouse (ou focar pelo teclado) fica opaco e legível. */}
      <div
        className={`flex flex-col items-end rounded-2xl border p-2 backdrop-blur transition-all duration-300 ${
          expandido
            ? "border-border bg-surface/95 opacity-100 shadow-lg"
            : "border-border/40 bg-surface/35 opacity-55 shadow-sm hover:opacity-80"
        }`}
      >
        <div
          className={`mb-1.5 flex items-center justify-between gap-2 border-b border-border/60 px-1 pb-1 text-[0.75rem] font-semibold text-text-soft transition-opacity duration-300 ${
            expandido ? "opacity-100" : "opacity-0"
          }`}
        >
          <span>{expandido ? "Capítulos da página" : "Capítulos"}</span>
        </div>

        <ol className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto py-1 text-xs">
          {itens.map((item) => (
            <ItemSumario
              key={item.id}
              item={item}
              ativo={ativo === item.id}
              expandido={expandido}
              onIr={rolarPara}
            />
          ))}
        </ol>

        {/* Par de setas do rodapé: uma volta ao topo, a outra avança uma seção.
            Ficam sempre visíveis, inclusive com o widget recolhido, e o rótulo
            só aparece no hover/foco para não ocupar a lateral. */}
        <div className="mt-1 flex items-center justify-end gap-1 border-t border-border/60 pt-1">
          <BotaoSeta rotulo="Topo" seta="↑" onClick={rolarTopo} />
          <BotaoSeta rotulo="Próxima seção" seta="↓" onClick={proximaSecao} />
        </div>
      </div>
    </nav>
  );
}
