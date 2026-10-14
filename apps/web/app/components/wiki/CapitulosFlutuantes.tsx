"use client";

/**
 * Widget flutuante "Capítulos da página" (wiki lateral / scroll-spy).
 *
 * Montado no layout raiz (`app/layout.tsx`) em 13/10/2026 para valer nas
 * 100 rotas do catálogo (`data/top-100-paginas.json`) sem editar página a
 * página: a página só precisa ter headings, o resto é automático. Antes
 * disso o `MiniSumarioLateral` era montado à mão por 10 páginas.
 *
 * A coleta vem do `useColetaSecoes` — re-coleta a cada navegação e quando
 * o conteúdo chega tarde do cliente (defeito medido 14/10/2026: capítulos
 * da primeira página sobreviviam às demais). Os ids ficam idênticos aos do
 * sumário do rodapé porque é a MESMA `coletarSecoes` que gera o slug.
 *
 * Só os h2 entram aqui (não h3): o widget é uma pilha de pontinhos na
 * lateral, e h3 junto vira muitos itens. O sumário do rodapé continua
 * listando h2 e h3.
 */

import { MiniSumarioLateral } from "./MiniSumarioLateral";
import { useColetaSecoes } from "@/lib/navegacao/use-coleta-secoes";

/** Limite de itens na pilha de pontinhos — mais que isso polui a lateral. */
const LIMITE_H2 = 12;

export function CapitulosFlutuantes({ seletorConteudo = "main" }: { seletorConteudo?: string }) {
  const todos = useColetaSecoes(seletorConteudo);
  const itens = todos.filter((s) => s.nivel === 2).slice(0, LIMITE_H2);

  // O MiniSumarioLateral já devolve null com menos de 2 itens, então
  // página curta não ganha widget nenhum.
  return <MiniSumarioLateral itens={itens} />;
}
