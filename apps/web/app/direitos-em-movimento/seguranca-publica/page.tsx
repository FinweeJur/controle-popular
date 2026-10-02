import type { Metadata } from "next";
import Link from "next/link";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { obterMortesIntervencao } from "@/lib/server-only/dados-mortes-intervencao";
import TabelaMortesIntervencao from "./TabelaMortesIntervencao";

/**
 * `/direitos-em-movimento/seguranca-publica` — mortes por intervenção de agente
 * do Estado (letalidade policial), Sinesp VDE / MJSP, ano de 2025.
 *
 * ═══ O QUE ESTE DADO É (AGENTS §7) ═══
 * Contagem oficial e agregada. A participação é sobre as mortes violentas
 * intencionais (definição do FBSP). O dado não identifica vítima nem agente, e
 * não traz recorte racial — que o FBSP publica no Anuário. O portal publica o
 * número e a fatia: a interpretação é do leitor, com a fonte à vista.
 */

const acervo = obterMortesIntervencao();
const num = (n: number) => n.toLocaleString("pt-BR");
const pct = (n: number | null) => (n == null ? "—" : n.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%");

export const metadata: Metadata = {
  title: "Mortes por intervenção policial — Controle Popular",
  description:
    `Mortes por intervenção de agente do Estado no Brasil em ${acervo.ano}: ${num(acervo.brasil.mdip)} pessoas, ` +
    `${pct(acervo.brasil.participacao_pct)} das mortes violentas intencionais, por UF. Fonte: Sinesp VDE / MJSP.`,
};

function Cartao({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-1 text-sm text-text-soft">{rotulo}</p>
      {nota ? <p className="mt-2 text-xs text-text-soft">{nota}</p> : null}
    </div>
  );
}

export default function PaginaSegurancaPublica() {
  const b = acervo.brasil;
  const maior = acervo.registros[0];
  const hoje = acervo.atualizado_em ? acervo.atualizado_em.split("-").reverse().join("/") : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/direitos-em-movimento" className="hover:text-primary transition">
          Direitos em Movimento
        </Link>{" "}
        · <span className="text-foreground font-semibold">Segurança pública</span>
      </nav>

      <header className="mt-4 mb-6">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Letalidade policial · Sinesp VDE / MJSP · {acervo.ano} · dados de {hoje || "—"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Mortes por intervenção de agente do Estado</h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft"
          texto={
            `Em ${acervo.ano}, ${num(b.mdip)} pessoas morreram por intervenção de agente do Estado no Brasil — ` +
            `${pct(b.participacao_pct)} de todas as mortes violentas intencionais. É o número que o poder público ` +
            `registra; o portal o abre por estado e por sexo. O dado é agregado: não identifica vítima nem agente, ` +
            `e não traz recorte racial — que o FBSP publica no Anuário. O número é da fonte; a leitura é do leitor.`
          }
        />
      </header>

      <section aria-label="Resumo em números" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao valor={num(b.mdip)} rotulo={`mortes por intervenção (${acervo.ano})`} nota="Sinesp VDE / MJSP" />
        <Cartao valor={pct(b.participacao_pct)} rotulo="das mortes violentas intencionais" nota={`de ${num(b.mvi)} mortes violentas no ano`} />
        <Cartao valor={pct(b.mdip ? (100 * b.masculino) / b.mdip : null)} rotulo="das vítimas são homens" nota={`${num(b.masculino)} homens e ${num(b.feminino)} mulheres`} />
        <Cartao valor={maior ? maior.uf : "—"} rotulo="estado com mais casos" nota={maior ? `${num(maior.mdip)} mortes (${pct(maior.participacao_pct)} das MVI locais)` : undefined} />
      </section>

      <p className="mt-4 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
        <strong>O que o número não diz.</strong> Cada morte por intervenção tem circunstância, autoria e processo —
        e o portal não os conhece. Aqui está a contagem oficial e a fatia sobre o total de mortes violentas. O
        recorte racial (a letalidade entre pessoas negras é várias vezes maior) está no Anuário do FBSP, que não
        publica os microdados em planilha — por isso ele não aparece nesta tabela.
      </p>

      <div className="mt-6">
        <TabelaMortesIntervencao registros={acervo.registros} />
      </div>

      <section
        aria-label="Fonte e método"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed"
      >
        <h2 className="text-xl font-semibold">De onde vêm estes números</h2>
        <p className="mt-3">{acervo.metodologia}</p>
        <p className="mt-2 text-text-soft">
          Fonte:{" "}
          <a href={acervo.url_fonte} target="_blank" rel="noopener noreferrer" className="underline">
            MJSP — Dados Nacionais de Segurança Pública (Sinesp VDE)
          </a>
          {" "}(<a href={acervo.url_arquivo} target="_blank" rel="noopener noreferrer" className="underline">planilha 2025</a>).
          Coletor: <code>scripts/etl/seguranca/coletar-mortes-intervencao-policial.py</code>. Recorte racial:{" "}
          <a href="https://forumseguranca.org.br/publicacoes/anuario-brasileiro-de-seguranca-publica/" target="_blank" rel="noopener noreferrer" className="underline">
            Anuário do FBSP
          </a>
          .
        </p>
      </section>
    </main>
  );
}
