import Link from "next/link";
import type { ReactNode } from "react";
import { RESUMOS } from "@/data/resumos-realidade";
import {
  parseResumo,
  resumoPublicavel,
  type BlocoResumo,
} from "@/lib/resumos-realidade";

/**
 * Bloco "Resumo de realidade" e o renderizador de markdown mínimo.
 *
 * POR QUE EXISTE
 *
 * O painel técnico responde "quanto"; nem todo leitor quer ler 22 mil
 * acórdãos. O resumo entrega o mesmo dado em linguagem direta, com fonte
 * visível por afirmação — e agora com tabelas de comparação.
 *
 * REGRA DE PUBLICAÇÃO: só renderiza resumo `verificado`. Resumo velho é pior
 * que resumo ausente.
 *
 * O markdown aceito é pequeno de propósito: título, parágrafo, lista, negrito,
 * link e tabela. Não há dependência de renderizador.
 *
 * BARRA NA TABELA: a célula `N=4.176;88%` vira barra proporcional com o N
 * centralizado dentro dela. O número fica na barra porque é ele que o leitor
 * procura; o percentual, ao lado.
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

const BARRA = /^N=([\d.]+);(\d{1,3})%$/;

/**
 * Célula de tabela em barra: `N=4.176;88%` vira barra proporcional com o N
 * centralizado DENTRO dela e o percentual fora. O N é o que o leitor procura
 * primeiro; por isso ele fica na barra, não na coluna ao lado.
 */
function CelulaBarra({ n, fatia }: { n: string; fatia: number }) {
  const limite = Math.min(100, Math.max(0, fatia));
  return (
    <span className="flex min-w-[9rem] items-center gap-2">
      <span
        className="relative block h-6 flex-1 overflow-hidden rounded bg-[var(--cp-surface-2)]"
        role="img"
        aria-label={`${n} achados, ${limite}% do tema`}
      >
        <span
          className="absolute inset-y-0 left-0 rounded bg-[var(--cp-primary)]"
          style={{ width: `${limite}%` }}
        />
        <span
          className="absolute inset-y-0 left-0 flex items-center justify-center"
          style={{ width: `${limite}%` }}
        >
          <span className="whitespace-nowrap rounded bg-[var(--cp-surface)] px-1.5 text-xs font-semibold leading-5 text-text">
            {n}
          </span>
        </span>
      </span>
      <span className="shrink-0 text-xs tabular-nums opacity-70">{limite}%</span>
    </span>
  );
}

function Celula({ texto }: { texto: string }) {
  const barra = BARRA.exec(texto);
  if (barra) return <CelulaBarra n={barra[1]} fatia={Number(barra[2])} />;
  return <>{comNegrito(texto)}</>;
}

function Tabela({ linhas }: { linhas: string[][] }) {
  const [cabecalho, ...corpo] = linhas;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-[var(--cp-border)] text-left">
            {cabecalho.map((celula, coluna) => (
              <th key={coluna} className="py-2 pr-3 font-semibold">
                {comNegrito(celula)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {corpo.map((linha, indice) => (
            <tr key={indice} className="border-b border-[var(--cp-border)]/50">
              {linha.map((celula, coluna) => (
                <td key={coluna} className="py-2 pr-3 align-top">
                  <Celula texto={celula} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Blocos({ blocos }: { blocos: BlocoResumo[] }) {
  return (
    <div className="mt-3 space-y-3 text-sm leading-relaxed">
      {blocos.map((bloco, indice) => {
        if (bloco.tipo === "h2" || bloco.tipo === "h3") {
          return (
            <h3 key={indice} className="font-display text-base font-semibold pt-2">
              {comNegrito(bloco.texto)}
            </h3>
          );
        }
        if (bloco.tipo === "tabela" && bloco.linhas?.length) {
          return <Tabela key={indice} linhas={bloco.linhas} />;
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
  );
}

/** Markdown solto, para páginas de análise que já têm o próprio título. */
export function MarkdownResumo({ markdown }: { markdown: string }) {
  return <Blocos blocos={parseResumo(markdown)} />;
}

export function ResumoRealidadeBox({
  rota,
  className = "",
}: {
  rota: string;
  className?: string;
}) {
  const resumo = RESUMOS[rota];
  if (!resumoPublicavel(resumo)) return null;
  const blocos = parseResumo(resumo.markdown);
  const temTitulo = blocos[0]?.tipo === "h2";
  const corpo = temTitulo ? blocos.slice(1) : blocos;
  if (corpo.length === 0) return null;
  const titulo = temTitulo
    ? blocos[0].texto.replace(/\*\*/g, "")
    : "O que os números dizem sobre quem foi atingido";

  return (
    <section
      aria-labelledby="resumo-realidade"
      className={`${CAIXA} ${className}`.trim()}
    >
      <p className="text-xs uppercase tracking-wide opacity-60">
        Resumo de realidade · fonte em cada afirmação · atualizado em {resumo.geradoEm}
      </p>
      <h2 id="resumo-realidade" className="mt-2 font-display text-lg font-semibold">
        {titulo}
      </h2>
      <Blocos blocos={corpo} />

      {resumo.exemplos?.length ? (
        <div className="mt-5 space-y-2 border-t border-[var(--cp-border)] pt-4">
          <h3 className="font-display text-base font-semibold">
            Ementas que exemplificam as teses
          </h3>
          <p className="text-xs opacity-70">
            Um ou dois processos por tese, com trecho da ementa. O número abre o caso no acervo.
          </p>
          {resumo.exemplos.map((grupo) => (
            <details
              key={`${grupo.tema}-${grupo.tese}`}
              className="rounded-lg border border-[var(--cp-border)] px-3 py-2"
            >
              <summary className="cursor-pointer text-sm font-medium">
                {grupo.tese}
                <span className="ml-2 text-xs font-normal opacity-60">{grupo.tema}</span>
              </summary>
              <ul className="mt-2 space-y-3">
                {grupo.casos.map((caso) => (
                  <li key={caso.processo} className="text-xs leading-relaxed">
                    <Link
                      className="font-mono underline break-all"
                      href={`/jurisprudencia?q=${encodeURIComponent(caso.processo)}#lista`}
                    >
                      {caso.processo}
                    </Link>
                    <span className="ml-2 opacity-60">{caso.lado}</span>
                    <p className="mt-1 whitespace-pre-line opacity-80">{caso.ementa}</p>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
