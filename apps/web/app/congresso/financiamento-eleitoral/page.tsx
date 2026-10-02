import type { Metadata } from "next";
import Link from "next/link";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { obterFornecedoresCampanha } from "@/lib/server-only/dados-fornecedores-campanha";
import TabelaFornecedoresCampanha from "./TabelaFornecedoresCampanha";

/**
 * `/congresso/financiamento-eleitoral` — fornecedores de campanha das Eleições
 * 2022 em Minas Gerais, por CNPJ.
 *
 * ═══ POR QUE FORNECEDOR, E NÃO DOADOR ═══
 * Desde 2015 (STF, ADI 4650) a pessoa jurídica está proibida de doar a campanhas
 * e partidos. O lado da receita é quase todo pessoa física (CPF), que não se
 * publica. O lado que segue sendo empresa — e sustenta o cruzamento cívico — é a
 * DESPESA contratada: quem a campanha pagou.
 *
 * ═══ FONTES E LIMITES (AGENTS §7) ═══
 * TSE — Prestação de Contas Eleitorais 2022, arquivo `despesas_contratadas`
 * (dado aberto oficial). Valor CONTRATADO não é valor pago. O acervo publica os
 * fornecedores com total ≥ ao mínimo (ver rodapé); os demais são lacuna
 * declarada. Fornecer à campanha não é ilícito: é o dado que permite conferir
 * quem vende à campanha e quem vende ao poder público (PNCP/Transparência, por
 * linha). CPF nunca é gravado.
 */

const acervo = obterFornecedoresCampanha();
const fmt = (n: number) => n.toLocaleString("pt-BR");
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const metadata: Metadata = {
  title: "Fornecedores de Campanha 2022 (MG) — Controle Popular",
  description:
    `Empresas que receberam das campanhas de 2022 em Minas Gerais: ${fmt(acervo.total_fornecedores_publicados)} ` +
    `fornecedores pessoa jurídica, ${brl(acervo.total_geral_contratado)} contratados, com CNPJ e link para ` +
    `conferir os contratos públicos. Fonte: TSE (dados abertos).`,
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

export default function PaginaFinanciamentoEleitoral() {
  const hoje = acervo.atualizado_em ? acervo.atualizado_em.split("-").reverse().join("/") : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/congresso" className="hover:text-primary transition">
          Congresso e Eleições
        </Link>{" "}
        · <span className="text-foreground font-semibold">Financiamento eleitoral</span>
      </nav>

      <header className="mt-4 mb-6">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Eleições 2022 · Fornecedores de campanha · Minas Gerais · dados de {hoje || "—"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Quem a campanha pagou: fornecedores das eleições de 2022 em MG</h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft"
          texto={
            `Desde 2015, empresa não pode doar a campanha — o dinheiro vem do fundo público e de pessoas físicas. ` +
            `Mas a campanha paga a empresas: agências, produtoras, gráficas, plataformas de anúncio. Esta página ` +
            `mostra os ${fmt(acervo.total_fornecedores_publicados)} fornecedores pessoa jurídica das campanhas de 2022 ` +
            `em Minas Gerais (${brl(acervo.total_geral_contratado)} contratados) e linka, por CNPJ, os contratos ` +
            `públicos — para o cidadão conferir quem vende à campanha e quem vende ao poder público. Fornecer à ` +
            `campanha é lícito; o dado é que abre a conferência.`
          }
        />
      </header>

      <section aria-label="Resumo em números" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          valor={fmt(acervo.total_fornecedores_publicados)}
          rotulo="fornecedores publicados"
          nota={`de ${fmt(acervo.total_fornecedores_pj)} empresas identificadas na prestação de contas`}
        />
        <Cartao valor={brl(acervo.total_geral_contratado)} rotulo="total contratado (MG 2022)" nota="soma das despesas contratadas com pessoa jurídica" />
        <Cartao valor={fmt(acervo.despesas_pessoa_fisica_ignoradas)} rotulo="despesas a pessoa física" nota="não publicadas — proteção de dado pessoal (CPF)" />
        <Cartao valor={fmt(acervo.fornecedores_abaixo_do_minimo)} rotulo="fornecedores abaixo do corte" nota={`cada um com menos de ${brl(acervo.valor_minimo)} contratados`} />
      </section>

      <p className="mt-4 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
        <strong>Aparecer aqui não é ilícito.</strong> Fornecer material ou serviço a uma campanha é legal e comum.
        O que a página entrega é o cruzamento: o mesmo CNPJ que vendeu à campanha vende ao poder público? Confira
        o contrato no PNCP e os gastos no Portal da Transparência. O valor é <em>contratado</em>, não
        necessariamente pago.
      </p>

      <div className="mt-6">
        <TabelaFornecedoresCampanha registros={acervo.registros} />
      </div>

      <section
        aria-label="Fonte e método"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed"
      >
        <h2 className="text-xl font-semibold">De onde vêm estes números</h2>
        <p className="mt-3">{acervo.metodologia}</p>
        <p className="mt-3 rounded-xl bg-surface p-3">
          <strong>Escopo:</strong> {acervo.escopo}. {fmt(acervo.linhas_lidas)} linhas lidas;{" "}
          {fmt(acervo.fornecedores_abaixo_do_minimo)} fornecedores ficaram abaixo do corte de{" "}
          {brl(acervo.valor_minimo)} e são lacuna declarada. Outras UFs estão na mesma fonte oficial.
        </p>
        <p className="mt-2 text-text-soft">
          Fonte:{" "}
          <a href={acervo.url_fonte} target="_blank" rel="noopener noreferrer" className="underline">
            TSE — Prestação de Contas Eleitorais 2022
          </a>
          {" "}(<a href={acervo.url_arquivo} target="_blank" rel="noopener noreferrer" className="underline">arquivo</a>).
          Coletor: <code>scripts/etl/eleicoes/coletar-fornecedores-campanha-2022.py</code>.
        </p>
        <p className="mt-2 text-text-soft print:hidden">
          A tabela é vetorial e sai nítida na impressão; o botão de planilha baixa exatamente o que está filtrado
          na tela, com separador <code>;</code> e BOM UTF-8 para o Excel brasileiro.
        </p>
      </section>
    </main>
  );
}
