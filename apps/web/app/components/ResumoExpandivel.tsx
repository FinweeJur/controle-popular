"use client";

import { useId, useState } from "react";

/**
 * Resumo de página que abre no clique — o controle "Ver + Texto".
 *
 * Papel no portal: é a descrição que fica ABAIXO do título (<h1>) de cada
 * página. Regra do dev (AGENTS.md § 5.10): o leitor está sob estresse
 * (denúncia, remoção, barragem), então letra miúda é barreira de leitura.
 * A descrição nunca é menor que `text-sm` (14px) e, quando passa de ~2
 * linhas, nasce recolhida para não empurrar o conteúdo.
 *
 * Por que existe: descrição longa empurrava os cards e tabelas para muito
 * abaixo da dobra. Aqui ela mostra 2 linhas e abre por vontade do leitor.
 *
 * Acessibilidade: o botão usa `aria-expanded` e `aria-controls`; o texto
 * recolhido continua no DOM (só cortado por `line-clamp`), então leitores
 * de tela e o "Ouvir esta página" ainda alcançam o conteúdo.
 *
 * Sem cor própria: herda a cor do contexto (`text-text-soft` no corpo,
 * `text-white` sobre foto) — preserve o contraste AA ≥ 4,5:1 de quem usa.
 */

/** Acima deste número de caracteres a descrição ganha o botão. */
const LIMITE_CARACTERES = 170;

export interface ResumoExpandivelProps {
  /** Texto da descrição da página. */
  texto: string;
  /** Classes extras aplicadas ao <p> (cor, largura, margem). */
  className?: string;
}

export default function ResumoExpandivel({ texto, className = "" }: ResumoExpandivelProps) {
  const [aberto, setAberto] = useState(false);
  // `useId` garante id único quando houver mais de um resumo na mesma página.
  const idTexto = useId();

  // Descrição curta não precisa de controle nenhum: já cabe inteira.
  const precisaBotao = texto.length > LIMITE_CARACTERES;

  // `text-sm sm:text-base` é o piso da regra § 5.10 — nunca menor que 14px.
  const classes = `text-sm sm:text-base leading-relaxed ${className}`.trim();

  if (!precisaBotao) {
    return <p className={classes}>{texto}</p>;
  }

  return (
    <div>
      <p id={idTexto} className={`${classes} ${aberto ? "" : "line-clamp-2"}`}>
        {texto}
      </p>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls={idTexto}
        className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        {aberto ? "Ver – Texto" : "Ver + Texto"}
      </button>
    </div>
  );
}
