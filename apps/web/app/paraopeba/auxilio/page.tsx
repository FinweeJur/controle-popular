import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { PAGAMENTOS_PARAOPEBA, RESUMO_AUXILIO_PARAOPEBA } from "@/lib/paraopeba";

/**
 * Cartão de número-resumo — MESMO visual de `DataCard.tsx`
 * (`app/[municipio]/components/DataCard.tsx`: `rounded-2xl border
 * border-border bg-surface p-5 shadow-sm`, título em `font-display
 * text-base font-semibold`), mas sem importar o componente. `DataCard` é
 * `"use client"` e lê `useCidade()`/`useNomePortal()` — hooks que só
 * existem dentro do `<CidadeProvider>` montado no layout de
 * `/[municipio]`. `/paraopeba` é rota de raiz, fora dessa árvore: importar
 * `DataCard` aqui quebra em runtime ("useCidade() fora do
 * <CidadeProvider>"), confirmado ao vivo nesta integração. Sem
 * compartilhar/WhatsApp aqui de propósito — aquele botão também depende de
 * `cidade.dominio`, que não existe fora de `/[municipio]`.
 */
function CardResumo({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="cp-card-hover rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <header className="mb-3">
        <h3 className="font-display text-base font-semibold text-text">{title}</h3>
      </header>
      <div className="text-sm text-text-soft">{children}</div>
    </section>
  );
}

/**
 * `/paraopeba/auxilio` — acompanhamento mês a mês do Novo Auxílio
 * Emergencial (NAE/PNAB, Lei 14.755/2023), pago pela FGV desde dez/2025.
 *
 * ═══ POR QUE OS NÚMEROS-RESUMO NÃO TÊM FONTE PRIMÁRIA PRÓPRIA AQUI ═══
 *
 * `docs/PLANO-INGESTAO-PARAOPEBA.md` (seção 1.6) mediu: os números abaixo
 * são a AGREGAÇÃO que o painel-fonte já monta a partir de decisões
 * judiciais, FGV e TJMG — não a leitura direta de uma única fonte oficial
 * por este portal. Por isso `nota` (o texto de proveniência do próprio
 * painel-fonte) é sempre exibida junto, sem edição — nenhum número aqui
 * finge ter uma fonte mais firme do que tem.
 */
export const metadata: Metadata = {
  title: "Auxílio emergencial — Paraopeba | Controle Popular",
  description:
    "Acompanhamento mês a mês do Novo Auxílio Emergencial pago pela FGV às pessoas atingidas pelo rompimento da barragem da Vale em Brumadinho, com os números-resumo e a fonte de cada um.",
};

const RESUMO_ITENS: Array<{
  label: string;
  valor: string;
  detalhe: string;
}> = [
  {
    label: "Total pago desde 2019",
    valor: RESUMO_AUXILIO_PARAOPEBA.totalPago,
    detalhe: RESUMO_AUXILIO_PARAOPEBA.totalPagoDetalhe,
  },
  {
    label: "Pessoas atendidas",
    valor: RESUMO_AUXILIO_PARAOPEBA.pessoasAtendidas,
    detalhe: RESUMO_AUXILIO_PARAOPEBA.pessoasAtendidasDetalhe,
  },
  {
    label: "Custo mensal (NAE)",
    valor: RESUMO_AUXILIO_PARAOPEBA.valorMensal,
    detalhe: RESUMO_AUXILIO_PARAOPEBA.valorMensalDetalhe,
  },
  {
    label: "Municípios alcançados",
    valor: RESUMO_AUXILIO_PARAOPEBA.municipiosAlcancados,
    detalhe: RESUMO_AUXILIO_PARAOPEBA.municipiosAlcancadosDetalhe,
  },
  {
    label: "Status judicial",
    valor: RESUMO_AUXILIO_PARAOPEBA.statusJudicial,
    detalhe: RESUMO_AUXILIO_PARAOPEBA.statusJudicialDetalhe,
  },
  {
    label: "Próximo depósito",
    valor: RESUMO_AUXILIO_PARAOPEBA.proximoDeposito,
    detalhe: RESUMO_AUXILIO_PARAOPEBA.proximoDepositoDetalhe,
  },
  {
    label: "Novo AE acumulado",
    valor: RESUMO_AUXILIO_PARAOPEBA.novoAETotal,
    detalhe: RESUMO_AUXILIO_PARAOPEBA.novoAETotalDetalhe,
  },
  {
    label: "Meses de Novo AE pagos",
    valor: RESUMO_AUXILIO_PARAOPEBA.novoAEMeses,
    detalhe: RESUMO_AUXILIO_PARAOPEBA.novoAEMesesDetalhe,
  },
];

export default function AuxilioPage() {
  // ⟲ 13/08, revisão de onboarding: era `<div>` — mesmo conserto de
  // `clipping/page.tsx` (ver o comentário lá).
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Auxílio emergencial</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        O auxílio está sendo pago? Mês a mês
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {PAGAMENTOS_PARAOPEBA.length} pagamentos mensais do Novo Auxílio Emergencial (NAE),
        pago pela FGV desde dezembro de 2025 — cada mês com o status e a observação que o
        painel-fonte registrou.
      </p>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {RESUMO_ITENS.map((item) => (
          <CardResumo key={item.label} title={item.label}>
            <p className="font-tabular text-xl font-bold text-text">{item.valor}</p>
            <p className="mt-1 text-xs text-text-soft">{item.detalhe}</p>
          </CardResumo>
        ))}
      </section>

      <p className="mt-4 max-w-2xl text-xs text-text-soft italic">{RESUMO_AUXILIO_PARAOPEBA.nota}</p>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-text">Pagamentos mês a mês</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {PAGAMENTOS_PARAOPEBA.map((p) => (
            <li
              key={p.mes}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4"
            >
              <div>
                <p className="font-display font-semibold text-text">{p.mes}</p>
                <p className="mt-0.5 text-xs text-text-soft">{p.observacao}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-tabular text-base font-bold text-text">{p.valor}</span>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent">
                  {p.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          Dúvida sobre o seu pagamento?
        </h2>
        <p className="mt-2">
          A FGV é a gestora do programa de repasses — pagamentos até o 5º dia útil, cadastro e
          prestação de contas. Veja o contato dela em{" "}
          <a href="/paraopeba/quem-atua" className="font-medium text-accent hover:underline">
            Quem atua na reparação →
          </a>
          .
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
