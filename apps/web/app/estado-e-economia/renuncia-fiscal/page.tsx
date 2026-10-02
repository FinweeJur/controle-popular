import type { Metadata } from "next";
import Link from "next/link";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { obterRenunciaFiscal } from "@/lib/server-only/dados-renuncia-fiscal";
import TabelaRenunciaFiscal from "./TabelaRenunciaFiscal";

/**
 * `/estado-e-economia/renuncia-fiscal` — quanto o Governo Federal deixa de
 * arrecadar por gasto tributário, por função orçamentária e região.
 *
 * ═══ O QUE ESTE DADO É (AGENTS §7) ═══
 * Fonte: Receita Federal — "Gastos Tributários (Bases Efetivas)", Quadro I,
 * ano-base 2023 (série 2021–2026). Gasto tributário é a desoneração concedida
 * FORA do orçamento (isenção, redução, regime especial). Não é irregularidade —
 * é escolha de política pública; o dado permite perguntar quem se beneficia e a
 * que custo. A linha TOTAL da fonte é conferida por soma no coletor (2×).
 */

const acervo = obterRenunciaFiscal();
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (n: number | null) => (n == null ? "—" : (n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%");

export const metadata: Metadata = {
  title: "Renúncia Fiscal (Gastos Tributários) — Controle Popular",
  description:
    `Quanto o Governo Federal deixa de arrecadar por gasto tributário: ${brl(acervo.total_renuncia)} no ano-base ` +
    `${acervo.ano_base} (${pct(acervo.renuncia_sobre_arrecadacao)} da arrecadação), por função orçamentária e região. ` +
    `Fonte: Receita Federal (dados abertos).`,
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

export default function PaginaRenunciaFiscal() {
  const maior = acervo.registros[0];
  const reg = acervo.total_por_regiao;
  const hoje = acervo.atualizado_em ? acervo.atualizado_em.split("-").reverse().join("/") : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/estado-e-economia" className="hover:text-primary transition">
          Estado e Economia
        </Link>{" "}
        · <span className="text-foreground font-semibold">Renúncia fiscal</span>
      </nav>

      <header className="mt-4 mb-6">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Gastos Tributários · Receita Federal · ano-base {acervo.ano_base} · dados de {hoje || "—"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Renúncia fiscal: o dinheiro que o governo deixa de arrecadar</h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft"
          texto={
            `O Governo Federal abre mão de ${brl(acervo.total_renuncia)} em impostos por gastos tributários — ` +
            `isenções, reduções e regimes especiais — o equivalente a ${pct(acervo.renuncia_sobre_arrecadacao)} de tudo ` +
            `que arrecada. É dinheiro que não entra no orçamento e, por isso, não passa pelo debate anual da peça ` +
            `orçamentária. Esta página abre o número por função (setor) e por região, para o cidadão perguntar quem ` +
            `se beneficia e a que custo. Renúncia fiscal não é irregularidade: é escolha de política pública — ` +
            `o dado é que torna a escolha visível.`
          }
        />
      </header>

      <section aria-label="Resumo em números" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao valor={brl(acervo.total_renuncia)} rotulo={`renúncia total (${acervo.ano_base})`} nota="valores nominais, gastos tributários" />
        <Cartao valor={pct(acervo.renuncia_sobre_arrecadacao)} rotulo="da arrecadação federal" nota="o que se deixou de arrecadar sobre o que foi arrecadado" />
        <Cartao valor={maior ? maior.funcao : "—"} rotulo="maior função (setor)" nota={maior ? brl(maior.total) : undefined} />
        <Cartao valor={brl(reg.sudeste ?? 0)} rotulo="maior região" nota="Sudeste concentra a maior parte da renúncia" />
      </section>

      <p className="mt-4 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
        <strong>Gasto tributário não é irregularidade.</strong> É a desoneração concedida por lei para estimular
        setor ou região — e por isso não aparece no orçamento. O que a página faz é tornar visível o tamanho da
        escolha: perguntar quem são os beneficiários é uma pergunta legítima que o dado público permite fazer.
      </p>

      <div className="mt-6">
        <TabelaRenunciaFiscal registros={acervo.registros} />
      </div>

      <section
        aria-label="Fonte e método"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed"
      >
        <h2 className="text-xl font-semibold">De onde vêm estes números</h2>
        <p className="mt-3">{acervo.metodologia}</p>
        <p className="mt-3 rounded-xl bg-surface p-3">
          <strong>Renúncia por região:</strong> Norte {brl(reg.norte ?? 0)} · Nordeste {brl(reg.nordeste ?? 0)} ·{" "}
          Centro-Oeste {brl(reg.centro_oeste ?? 0)} · Sudeste {brl(reg.sudeste ?? 0)} · Sul {brl(reg.sul ?? 0)}.
          {" "}Série disponível na fonte: {acervo.serie}.
        </p>
        <p className="mt-2 text-text-soft">
          Fonte:{" "}
          <a href={acervo.url_fonte} target="_blank" rel="noopener noreferrer" className="underline">
            Receita Federal — Gastos Tributários (Bases Efetivas)
          </a>
          {" "}(<a href={acervo.url_arquivo} target="_blank" rel="noopener noreferrer" className="underline">planilha</a>).
          Coletor: <code>scripts/etl/receita/coletar-renuncia-fiscal.py</code> (confere a soma contra a linha TOTAL).
        </p>
        <p className="mt-2 text-text-soft print:hidden">
          A tabela é vetorial e sai nítida na impressão; o botão de planilha baixa exatamente o que está
          filtrado na tela, com separador <code>;</code> e BOM UTF-8 para o Excel brasileiro.
        </p>
      </section>
    </main>
  );
}
