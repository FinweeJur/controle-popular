import React from "react";

/**
 * @file Explicador de página para quem é leigo — "Em uma frase", "O que você
 * vai ver" e "Glossário da página".
 *
 * O QUE É:
 *   Bloco que fica logo abaixo do `<h1>` das páginas de dado e responde, antes
 *   do primeiro número, três perguntas: o que esta página mostra, o que cada
 *   bloco significa e o que quer dizer cada termo técnico usado ali.
 *
 * POR QUE EXISTE (pedido do dono, 19/11/2026):
 *   As páginas novas mostravam número medido sem dizer a unidade, o recorte
 *   territorial nem o denominador da porcentagem. Quem não é da área lia
 *   "87,4%" e "ITP 54,4" sem saber de onde vinha nem do que era.
 *
 * REGRAS QUE ESTE COMPONENTE CARREGA:
 *   - Regra dura 5.10: texto do bloco nunca menor que `text-sm` (14px).
 *   - Regra dura 5.16: nenhum texto de interface abaixo de 12px.
 *   - Regra dura 5.18: frase curta, voz ativa, termo explicado na primeira
 *     aparição.
 *   - O glossário usa `<details>/<summary>` nativo: abre sem JavaScript,
 *     funciona no teclado e a seta gira no aberto (`group-open:rotate-180`).
 *   - Nenhum termo novo é inventado: a definição descreve o dado que a página
 *     publica, não uma teoria.
 */

export interface TermoDaPagina {
  /** Termo como aparece na página. */
  termo: string;
  /** Definição de dicionário, em português comum. */
  definicao: string;
}

export interface ExplicadorDaPaginaProps {
  /** Uma ou duas frases de até 13 palavras cada. */
  frase: string;
  /** Três a cinco marcadores sobre os números e blocos da página. */
  itens: string[];
  /** Termos usados na página, com definição. */
  glossario: TermoDaPagina[];
  /** Classe extra (margem, largura). */
  className?: string;
}

export default function ExplicadorDaPagina({
  frase,
  itens,
  glossario,
  className = "",
}: ExplicadorDaPaginaProps) {
  return (
    <section
      aria-label="Explicação da página para quem é leigo"
      className={`mt-4 max-w-3xl space-y-3 ${className}`}
    >
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          Em uma frase
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text sm:text-base">{frase}</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
          O que você vai ver
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text">
          {itens.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <details className="group rounded-2xl border border-border bg-surface p-4">
        <summary className="flex min-h-9 cursor-pointer list-none items-center text-sm font-semibold text-primary focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden="true"
            className="mr-1.5 inline-block text-xs opacity-70 transition-transform duration-200 group-open:rotate-180"
          >
            ▼
          </span>
          Glossário da página ({glossario.length} termos)
        </summary>
        <dl className="mt-3 space-y-2 text-sm leading-relaxed">
          {glossario.map((item) => (
            <div key={item.termo}>
              <dt className="inline font-semibold text-text">{item.termo}</dt>
              <dd className="inline text-text-soft"> — {item.definicao}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
