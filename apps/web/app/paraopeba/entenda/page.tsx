import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { GLOSSARIO_PARAOPEBA, PERGUNTAS_PARAOPEBA } from "@/lib/paraopeba/educacao";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/paraopeba/entenda` — o glossário e as perguntas do painel-fonte.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ═══
 *
 * O resto do bloco Paraopeba pressupõe que o leitor sabe o que é NAE, PTR,
 * ERSHRE e "zona quente" — e essas siglas aparecem em quase toda tela. Sem
 * este material, o portal explica um processo para quem já entende o
 * processo, que é a forma mais educada de não explicar nada.
 *
 * ═══ A AUTORIA NÃO É NOSSA, E ISSO APARECE NA TELA ═══
 *
 * As definições e as respostas são de quem montou o painel-fonte. O Controle
 * Popular reexibe. Assinar como nosso um texto que explica um caso em que
 * somos observador seria assumir uma autoridade que não temos — e o leitor
 * precisa saber a quem atribuir o que lê.
 */
export const metadata: Metadata = metadataEditavel("/paraopeba/entenda", {
  title: "Entenda o caso — Paraopeba | Controle Popular",
  description: `${formatNumberBR(GLOSSARIO_PARAOPEBA.length)} termos e ${formatNumberBR(PERGUNTAS_PARAOPEBA.length)} perguntas sobre a reparação do rompimento da barragem da Vale em Brumadinho, em linguagem comum.`,
});

export default function EntendaPage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · Entenda o caso
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Entenda o caso
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        As siglas que aparecem em toda página deste bloco — NAE, PTR, ERSHRE, zona
        quente — e as perguntas que mais se repetem, em linguagem comum.{" "}
        <strong className="text-text">
          O texto abaixo é de quem montou o painel de acompanhamento
        </strong>
        , não do Controle Popular: aqui ele é reexibido, não reescrito.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">
          Perguntas frequentes{" "}
          <span className="font-mono text-[.6em] font-normal text-text-soft">
            {formatNumberBR(PERGUNTAS_PARAOPEBA.length)}
          </span>
        </h2>
        <div className="mt-4 space-y-3">
          {PERGUNTAS_PARAOPEBA.map((p) => (
            /* `<details>` em vez de acordeão com JavaScript: funciona sem
               script, é navegável por teclado de graça e imprime aberto —
               e esta página é candidata a virar anexo de ofício. */
            <details key={p.pergunta} className="rounded-lg border border-border px-4 py-3">
              <summary className="cursor-pointer font-medium text-text">{p.pergunta}</summary>
              <p className="mt-2 text-[.95em] text-text-soft">{p.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">
          Glossário{" "}
          <span className="font-mono text-[.6em] font-normal text-text-soft">
            {formatNumberBR(GLOSSARIO_PARAOPEBA.length)}
          </span>
        </h2>
        <dl className="mt-4 space-y-4">
          {GLOSSARIO_PARAOPEBA.map((v) => (
            <div key={v.termo} className="border-l-2 border-border pl-4">
              <dt className="font-semibold text-text">{v.termo}</dt>
              <dd className="mt-1 text-[.95em] text-text-soft">{v.definicao}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-lg font-semibold">De onde vem</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Do mesmo painel de acompanhamento que fornece o clipping, a linha do tempo e
          os dados do auxílio. É um retrato datado: as definições valem para o estado
          do processo quando foram escritas, e processo muda. Onde a definição citar
          valor ou prazo, confira a linha do tempo antes de usar.
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
