import Link from "next/link";
import type { ReactNode } from "react";
import jurisprudencia from "@/data/resumos-realidade/jurisprudencia.json";
import jurisprudenciaPenal from "@/data/resumos-realidade/jurisprudencia-penal.json";
import mineracaoCavas from "@/data/resumos-realidade/mineracao-cavas.json";
import concursos from "@/data/resumos-realidade/concursos.json";
import {
  parseResumo,
  resumoPublicavel,
  type ResumoRealidade,
} from "@/lib/resumos-realidade";

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

const RESUMOS: Record<string, ResumoRealidade> = {
  "/jurisprudencia": jurisprudencia as ResumoRealidade,
  // Piloto F2 (08/11/2026): três rotas com dado medido, texto montado só com
  // número contado no JSON versionado da própria página. Nenhum modelo pago.
  "/jurisprudencia/penal": jurisprudenciaPenal as ResumoRealidade,
  "/mineracao/cavas": mineracaoCavas as ResumoRealidade,
  "/concursos": concursos as ResumoRealidade,
};

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

export function ResumoRealidadeBox({ rota, className = "" }: { rota: string; className?: string }) {
  const resumo = RESUMOS[rota];
  if (!resumoPublicavel(resumo)) return null;
  const blocos = parseResumo(resumo.markdown);
  // O primeiro bloco é o título do próprio resumo: vira o cabeçalho da caixa.
  // Antes ele era descartado e o título era fixo — servia a uma página só e
  // ficava errado em qualquer outra rota.
  const titulo = blocos[0]?.tipo === "h2" ? blocos[0].texto : null;
  const corpo = titulo ? blocos.slice(1) : blocos;

  return (
    <section
      aria-labelledby="resumo-realidade"
      className={`rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-5 sm:p-6 ${className}`}
    >
      <p className="text-xs uppercase tracking-wide opacity-60">
        Resumo de realidade · fonte em cada afirmação · atualizado em {resumo.geradoEm}
      </p>
      <h2 id="resumo-realidade" className="mt-2 font-display text-lg font-semibold">
        {titulo ? comNegrito(titulo) : "Resumo de realidade"}
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
