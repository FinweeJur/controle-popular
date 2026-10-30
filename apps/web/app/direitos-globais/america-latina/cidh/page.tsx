import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  AdesaoPorPais,
  NotaCondenacoes,
  Obrigacoes,
  ResumoTratados,
  VoltarParaAmericaLatina,
} from "./Cidh";

/**
 * Sistema interamericano de direitos humanos.
 *
 * Papel: explicar a diferença entre Comissão (CIDH) e Corte IDH, mostrar o
 * que uma condenação obriga e quem ratificou cada tratado.
 *
 * Dados: OEA (assinaturas e ratificações) e texto oficial do Pacto de San
 * José. Condenações ainda não entram: a Corte bloqueia coleta automatizada.
 */

export const metadata: Metadata = {
  title: "CIDH e Corte IDH | Direitos Globais",
  description:
    "Comissão e Corte Interamericana: quais tratados cada país ratificou e o que uma condenação obriga, com texto oficial.",
};

export default function PaginaCidh() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link
          href="/direitos-globais"
          className="hover:text-primary hover:underline"
        >
          Direitos Globais
        </Link>
        <span>/</span>
        <Link
          href="/direitos-globais/america-latina"
          className="hover:text-primary hover:underline"
        >
          América Latina
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">CIDH e Corte IDH</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          CIDH e Corte IDH
        </h1>
        <p className="mt-3 text-base text-text-soft">
          A Comissão (CIDH) recebe denúncia, investiga e recomenda. A Corte
          IDH julga e condena o Estado. Só quem ratificou o Pacto de San José
          pode ser réu na Corte.
        </p>
      </header>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-lg font-semibold text-text">
            Comissão (CIDH)
          </h2>
          <p className="text-sm text-text-soft">
            Órgão da OEA. Recebe petições, abre caso, faz recomendações ao
            Estado e pode levar o caso à Corte. Não condena.
          </p>
        </section>
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 text-lg font-semibold text-text">
            Corte IDH
          </h2>
          <p className="text-sm text-text-soft">
            Tribunal autônomo. Julga apenas Estados que ratificaram o Pacto e
            aceitaram sua competência. A sentença é obrigatória.
          </p>
        </section>
      </div>

      <Obrigacoes />
      <ResumoTratados />
      <AdesaoPorPais />
      <NotaCondenacoes />

      <div className="mt-8">
        <VoltarParaAmericaLatina />
      </div>

      <FooterGlobal />
    </main>
  );
}
