"use client";

import { createElement } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { obterEstiloEixo, obterIconeTema, type PaginaCatalogo } from "@/lib/indice/catalogo";

/**
 * Cartão de uma página do Catálogo das 100 (grade de `/indice`).
 *
 * O QUE É: o card completo — número, badge, subfrente, título, microresumo,
 * rota no rodapé e a ação "Acessar"/"Abrir" — extraído do componente
 * `Catalogo100PaginasClient.tsx` em 08/10/2026 para enxugar o hotspot de
 * saúde 2,17 (CodeScene, leitura de 07/10 em `docs/planos/PENDENCIAS-07-10.md`).
 * As classes Tailwind, os textos e os atributos de acessibilidade são os
 * MESMOS de antes; o que mudou foi o endereço do código.
 *
 * REGRA DE LINK (AGENTS §5.13): rota interna navega no cliente — `next/link`
 * — porque um `<a href>` cru recarrega o documento inteiro e mata o áudio do
 * rádio e o estado do pet, que moram no layout raiz. `<a>` só para href
 * externo (começa com "http"), com `target="_blank"` e `rel="noopener
 * noreferrer"`.
 *
 * @param pagina registro do catálogo vindo de `data/top-100-paginas.json`.
 */
export default function CatalogoCartao({ pagina }: { pagina: PaginaCatalogo }) {
  const p = pagina;
  const isExternal = p.href.startsWith("http");
  const estilo = obterEstiloEixo(p.eixo);
  // O ícone vem de uma TABELA de lookup (lib/indice/catalogo.ts), não de uma
  // função criada aqui — mas o `react-hooks/static-components` do ESLint
  // considera QUALQUER `const X = chamada()` usado como `<X/>` um componente
  // criado durante o render (a regra existe para funções declaradas na hora).
  // `createElement` desenha o MESMO elemento sem nomeá-lo como tag: mesmo
  // resultado na tela, regra respeitada.
  const iconeTema = createElement(obterIconeTema(p), { className: "h-3.5 w-3.5" });

  const cardClassName = `group relative flex flex-col justify-between rounded-xl border p-2.5 sm:p-3 transition-all ${
    estilo.card
  } ${
    p.destaque
      ? "ring-2 ring-primary/40 border-primary/50 bg-surface shadow-xs"
      : ""
  } hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`;

  const cardContent = (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${estilo.iconBg}`}
              aria-hidden="true"
            >
              {iconeTema}
            </span>
            <span className="font-mono text-[11px] font-bold text-text-soft/70">
              #{String(p.numero).padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {p.destaque && (
              <span className="rounded bg-primary/20 border border-primary/30 px-1 py-0.5 text-[9px] font-bold uppercase text-primary">
                ✦ Destaque
              </span>
            )}
            <span
              className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${estilo.badge}`}
            >
              {p.badge}
            </span>
          </div>
        </div>

        {p.subfrente && (
          <div className="text-[10px] font-semibold text-text-soft/90 truncate">
            {p.subfrente}
          </div>
        )}

        <h3 className={`font-display text-sm ${p.destaque ? "font-bold text-foreground" : "font-semibold text-text"} group-hover:text-primary transition-colors flex items-center justify-between gap-1 line-clamp-1`}>
          <span>{p.titulo}</span>
          {isExternal && (
            <ExternalLink className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" aria-hidden="true" />
          )}
        </h3>

        <p className="line-clamp-2 text-[11px] leading-tight text-text-soft">
          {p.resumo}
        </p>
      </div>

      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
        <code className="font-mono text-text-soft/80 truncate max-w-[130px] sm:max-w-[150px]">
          {p.href.replace("https://github.com/FinweeJur/", "gh:")}
        </code>
        <span className={`font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform ${estilo.textAcc}`}>
          {isExternal ? (
            <>
              Abrir <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
            </>
          ) : (
            "Acessar →"
          )}
        </span>
      </div>
    </>
  );

  return isExternal ? (
    <a
      href={p.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClassName}
      aria-label={`Acessar ${p.titulo} (abre em nova guia)`}
    >
      {cardContent}
    </a>
  ) : (
    <Link
      href={p.href}
      className={cardClassName}
      aria-label={`Acessar ${p.titulo}`}
    >
      {cardContent}
    </Link>
  );
}
