"use client";

/**
 * Widget flutuante "Capítulos da página" (wiki lateral / scroll-spy).
 *
 * Montado no layout raiz (`app/layout.tsx`) em 13/10/2026 para valer nas
 * 100 rotas do catálogo (`data/top-100-paginas.json`) sem editar página a
 * página: a página só precisa ter headings, o resto é automático. Antes
 * disso o `MiniSumarioLateral` era montado à mão por 10 páginas.
 *
 * A coleta reutiliza `coletarSecoes` do sumário do rodapé — os ids ficam
 * idênticos nos dois componentes porque é a MESMA função que gera o slug;
 * quem chega primeiro grava o id no heading, quem chega depois reutiliza.
 *
 * Só os h2 entram aqui (não h3): o widget é uma pilha de pontinhos na
 * lateral, e h3 junto vira muitos itens. O sumário do rodapé continua
 * listando h2 e h3.
 */

import { useEffect, useState } from "react";
import { coletarSecoes, type SecaoIndice } from "@/lib/navegacao/indice-pagina";
import { MiniSumarioLateral } from "./MiniSumarioLateral";

/** Limite de itens na pilha de pontinhos — mais que isso polui a lateral. */
const LIMITE_H2 = 12;

export function CapitulosFlutuantes({ seletorConteudo = "main" }: { seletorConteudo?: string }) {
  const [itens, setItens] = useState<SecaoIndice[]>([]);

  useEffect(() => {
    const container = document.querySelector(seletorConteudo);
    if (!container) return;

    const h2 = coletarSecoes(container)
      .filter((s) => s.nivel === 2)
      .slice(0, LIMITE_H2);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- headings so existem no cliente pos-hidratacao (mesmo padrao de IndicePagina)
    setItens(h2);
  }, [seletorConteudo]);

  // O MiniSumarioLateral já devolve null com menos de 2 itens, então
  // página curta não ganha widget nenhum.
  return <MiniSumarioLateral itens={itens} />;
}
