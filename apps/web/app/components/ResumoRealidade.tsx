import Link from "next/link";
import type { ReactNode } from "react";
import { RESUMOS } from "@/data/resumos-realidade";
import { parseResumo, resumoPublicavel } from "@/lib/resumos-realidade";

/**
 * Resumo de realidade no topo da página.
 *
 * POR QUE EXISTE
 *
 * O painel técnico responde "quanto"; nem todo leitor quer ler 22 mil
 * acórdãos. O resumo entrega o mesmo dado em linguagem direta, com fonte
 * visível por afirmação.
 *
 * REGRA DE PUBLICAÇÃO: só renderiza resumo `verificado`. Resumo velho é pior
 * que resumo ausente, então o JSON carrega a data e o verificador é quem
 * autoriza.
 *
 * O texto é markdown mínimo (título, parágrafo, lista, negrito e link). O
 * parser está em `lib/resumos-realidade.ts`.
 */

const CAIXA =
  "rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-5 sm:p-6";

function comNegrito(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((parte, indice) => {
    const negrito = /^\*\*([^*]+)\*\*$/.exec(parte);
    if (negrito) return <strong key={indice}>{negrito[1]}</strong>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(parte);
    if (link) {
      const externo = /^https?:\/\//.test(link[2]);
      return externo ? (
        <a
          key={indice}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2"
        >
          {link[1]}
        </a>
      ) : (
        <Link key={indice} href={link[2]} className="underline">
          {link[1]}
        </Link>
      );
    }
    return parte;
  });
}

export function ResumoRealidadeBox({ rota }: { rota: string }) {
  const resumo = RESUMOS[rota];
  if (!resumoPublicavel(resumo)) return null;
  const blocos = parseResumo(resumo.markdown);
  // O primeiro bloco é o título do arquivo, não um subtítulo da página.
  const corpo = blocos[0]?.tipo === "h2" ? blocos.slice(1) : blocos;

  return (
    <section
      aria-labelledby="resumo-realidade"
      className={CAIXA}
    >
      <p className="text-xs uppercase tracking-wide opacity-60">
        Resumo de realidade · fonte em cada afirmação · atualizado em {resumo.geradoEm}
      </p>
      <h2 id="resumo-realidade" className="mt-2 font-display text-lg font-semibold">
        O que os números dizem sobre quem foi atingido
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">
        {corpo.map((bloco, indice) => {
          if (bloco.tipo === "h2" || bloco.tipo === "h3") {
            return (
              <h3 key={indice} className="font-display text-base font-semibold pt-2">
                {comNegrito(bloco.texto)}
              </h3>
            );
          }
          if (bloco.tipo === "li") {
            return (
              <p key={indice} className="pl-4 -indent-4">
                · {comNegrito(bloco.texto)}
              </p>
            );
          }
          return <p key={indice}>{comNegrito(bloco.texto)}</p>;
        })}
      </div>
    </section>
  );
}
