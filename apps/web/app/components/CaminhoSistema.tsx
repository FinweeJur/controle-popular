import Link from "next/link";
import { caminhoDe } from "@/lib/navegacao/mapa";

/**
 * Caminho no sistema — a trilha "Início › Eixo › Frente › Página".
 *
 * POR QUE EXISTE
 *
 * Cada página escrevia a própria trilha à mão, com nomes e links diferentes. O
 * mapa de navegação (`lib/navegacao/mapa.ts`) passou a ser a fonte única; este
 * componente só desenha o que o mapa diz.
 *
 * ACESSIBILIDADE
 *
 * - `<nav aria-label="Você está em">` + `<ol>`: leitor de tela anuncia a posição;
 * - todo nível é link, menos o último, que leva `aria-current="page"`;
 * - separador é `aria-hidden` (não se lê "maior que");
 * - alvo de toque com padding vertical, sem depender de fonte pequena.
 *
 * USO
 *
 *   <CaminhoSistema rota="/paraopeba/auxilio" />
 *
 * A rota é a do arquivo, não a do navegador: server component não lê pathname.
 */
export default function CaminhoSistema({ rota }: { rota: string }) {
  const trilha = caminhoDe(rota);
  if (trilha.length < 2) return null;

  return (
    <nav aria-label="Você está em" className="mb-4 text-[.82em] text-text-soft">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {trilha.map((nivel, indice) => {
          const ultimo = indice === trilha.length - 1;
          return (
            <li key={`${nivel.href}-${indice}`} className="flex items-center gap-1.5">
              {indice > 0 ? (
                <span aria-hidden="true" className="opacity-50">
                  ›
                </span>
              ) : null}
              {ultimo ? (
                <span aria-current="page" className="font-medium text-text">
                  {nivel.rotulo}
                </span>
              ) : (
                <Link
                  href={nivel.href}
                  className="rounded px-0.5 py-1 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {nivel.rotulo}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
