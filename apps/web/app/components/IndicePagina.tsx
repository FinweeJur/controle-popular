"use client";

/**
 * Sumário do RODAPÉ da página ("Sumário desta página").
 *
 * Montado no layout raiz (`app/layout.tsx`), então aparece no pé de TODA
 * página do portal sem a página precisar declarar nada. Varre os h2/h3 do
 * `main` no cliente e gera âncora para quem ainda não tiver id (mesma
 * receita do widget lateral de Capítulos — a coleta mora em
 * `lib/navegacao/indice-pagina.ts` para os dois usarem os MESMOS ids).
 *
 * Decisão do dono em 13/10/2026: o sumário nasce FECHADO e, fechado, é
 * visualmente MENOR que aberto — uma linha enxuta clicável. Motivo: no pé
 * da página a caixa aberta empurrava o rodapé e poluía a leitura; quem
 * quer o índice clica e abre. O "Nesta página" do topo (IndiceWiki) segue
 * aberto por decisão do dono — os dois papéis são diferentes.
 */

import { useEffect, useState } from "react";
import { List, ChevronDown } from "lucide-react";
import { type SecaoIndice } from "@/lib/navegacao/indice-pagina";
import { useColetaSecoes } from "@/lib/navegacao/use-coleta-secoes";

// Re-export para compatibilidade: o tipo vivia aqui antes da extração
// (13/10/2026) para a coleta ser compartilhável com o widget de Capítulos.
export type { SecaoIndice };

interface Props {
  seletorConteudo?: string;
  titulo?: string;
}

export default function IndicePagina({
  seletorConteudo = "main",
  titulo = "Sumário desta página",
}: Props) {
  // Re-coleta a cada navegação e quando o conteúdo chega tarde do cliente
  // (mesma peça dos Capítulos — defeito medido 14/10/2026: o sumário da
  // primeira página visitada sobrevivia às demais).
  const secoes = useColetaSecoes(seletorConteudo);
  const [secaoAtiva, setSecaoAtiva] = useState<string>("");
  // Fechado por padrão (regra do dono, 13/10/2026): caixa compacta no rodapé.
  const [aberto, setAberto] = useState(false);

  // Observador para destacar a seção visível — religa quando a lista muda
  // (navegação troca os headings; o observer antigo apontava para nós mortos).
  useEffect(() => {
    if (secoes.length === 0) return;

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

    secoes.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [secoes]);

  if (secoes.length < 2) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 my-8">
      <nav
        aria-label={titulo}
        className={`rounded-2xl border border-border bg-surface-2/80 shadow-sm backdrop-blur transition-all ${
          aberto ? "p-5 sm:p-6" : "p-2.5 sm:p-3"
        }`}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setAberto(!aberto)}
            className={`flex items-center gap-2 focus:outline-none cursor-pointer ${
              aberto
                ? "text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground"
                : "text-sm font-semibold text-foreground hover:text-primary"
            }`}
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
          <ol className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            {secoes.map((s) => {
              const isAtivo = secaoAtiva === s.id;
              return (
                <li
                  key={s.id}
                  className={`${s.nivel === 3 ? "pl-5 text-xs" : "text-sm"}`}
                >
                  <a
                    href={`#${s.id}`}
                    className={`inline-block transition-colors hover:text-primary ${
                      isAtivo
                        ? "font-semibold text-primary underline underline-offset-4"
                        : "text-muted hover:text-foreground"
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
    </div>
  );
}
