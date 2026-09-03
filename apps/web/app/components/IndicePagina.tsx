"use client";

import { useEffect, useState } from "react";
import { List, ChevronDown } from "lucide-react";

export interface SecaoIndice {
  id: string;
  titulo: string;
  nivel: 2 | 3;
}

interface Props {
  seletorConteudo?: string;
  titulo?: string;
}

export default function IndicePagina({
  seletorConteudo = "main",
  titulo = "Sumário desta página",
}: Props) {
  const [secoes, setSecoes] = useState<SecaoIndice[]>([]);
  const [secaoAtiva, setSecaoAtiva] = useState<string>("");
  const [aberto, setAberto] = useState(true);

  useEffect(() => {
    // Busca todos os H2 e H3 dentro do conteúdo principal
    const container = document.querySelector(seletorConteudo);
    if (!container) return;

    const headings = Array.from(
      container.querySelectorAll("h2, h3")
    ) as HTMLElement[];

    const itens: SecaoIndice[] = [];

    headings.forEach((heading, idx) => {
      // Ignora headings do próprio índice ou modais
      if (heading.closest("[aria-label='Sumário desta página']")) return;
      if (heading.closest("header") && idx === 0) return;

      const texto = heading.textContent?.trim() || "";
      if (!texto) return;

      let id = heading.id;
      if (!id) {
        id = texto
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        if (!id) id = `secao-${idx}`;
        heading.id = id;
      }

      itens.push({
        id,
        titulo: texto,
        nivel: heading.tagName.toLowerCase() === "h3" ? 3 : 2,
      });
    });

    setSecoes(itens);

    // Observador para destacar seção visível
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSecaoAtiva(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    headings.forEach((h) => observer.observe(h));

    return () => observer.disconnect();
  }, [seletorConteudo]);

  if (secoes.length < 2) return null;

  return (
    <nav
      aria-label={titulo}
      className="my-6 rounded-xl border border-border bg-surface-2/60 p-4 transition-all"
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground focus:outline-none"
          aria-expanded={aberto}
        >
          <List className="h-4 w-4 text-primary" />
          <span>{titulo} ({secoes.length})</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${
              aberto ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {aberto && (
        <ol className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          {secoes.map((s) => {
            const isAtivo = secaoAtiva === s.id;
            return (
              <li
                key={s.id}
                className={`${s.nivel === 3 ? "pl-4 text-xs" : "text-sm"}`}
              >
                <a
                  href={`#${s.id}`}
                  className={`inline-block transition-colors hover:text-primary ${
                    isAtivo
                      ? "font-semibold text-primary underline underline-offset-4"
                      : "text-muted"
                  }`}
                >
                  {s.titulo}
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
