import type { Metadata } from "next";
import { carregarCeapNacional } from "@/lib/congresso/ceap-nacional-dados";
import TabelaCeap from "./TabelaCeap";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/cota-parlamentar", {
  title: "Cota Parlamentar (CEAP) — Controle Popular · Congresso",
  description:
    "Auditoria e monitoramento dos gastos de gabinete de todos os deputados federais do Brasil (27 UFs). Valores reembolsados e principais fornecedores contratados.",
});

export const dynamic = "force-static";

export default function CotaParlamentarPage() {
  const dados = carregarCeapNacional();

  if (!dados) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Cota Parlamentar (CEAP)</h1>
        <p className="text-text-soft">Dados em processamento. Aguarde a próxima rodada de compilação.</p>
      </div>
    );
  }

  const topUfs = Object.entries(dados.totaisPorUf)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Cota Parlamentar (CEAP)</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Gastos de gabinete e reembolsos declarados por parlamentares da Câmara dos Deputados em todo o território nacional.
          Acompanhe os valores utilizados e os fornecedores mais acionados.
        </p>
      </header>

      {/* Cartões de Topo */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <span className="block text-xs font-semibold text-text-soft">Total Reembolsado</span>
          <span className="mt-1 block font-mono text-xl font-bold text-accent">
            R$ {(dados.totalGastoNacional / 1e9).toFixed(2).replace(".", ",")} bi
          </span>
          <span className="text-[11px] text-text-soft">Desde o início da série</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <span className="block text-xs font-semibold text-text-soft">Parlamentares</span>
          <span className="mt-1 block font-mono text-xl font-bold text-text">
            {dados.totalParlamentares.toLocaleString("pt-BR")}
          </span>
          <span className="text-[11px] text-text-soft">27 Unidades da Federação</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <span className="block text-xs font-semibold text-text-soft">Lançamentos Auditados</span>
          <span className="mt-1 block font-mono text-xl font-bold text-text">
            {(dados.totalLancamentosAnalisados / 1e6).toFixed(1).replace(".", ",")} mi
          </span>
          <span className="text-[11px] text-text-soft">Comprovantes fiscais</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <span className="block text-xs font-semibold text-text-soft">Maior Gasto Estadual</span>
          <span className="mt-1 block font-mono text-xl font-bold text-primary">
            {topUfs[0]?.[0]} (R$ {((topUfs[0]?.[1] || 0) / 1e6).toFixed(0)} mi)
          </span>
          <span className="text-[11px] text-text-soft">Bancada mais volumosa</span>
        </div>
      </div>

      {/* Gráfico SVG de Gastos por Estado (Top 10 UFs) */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3">
        <h2 className="font-display text-sm font-bold text-text">Top 10 Estados por Volume de Cota Parlamentar</h2>
        <div className="space-y-2 pt-2">
          {topUfs.map(([uf, valor]) => {
            const maxVal = topUfs[0][1] || 1;
            const pct = Math.min(100, Math.round((valor / maxVal) * 100));
            return (
              <div key={uf} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-mono font-bold text-text">{uf}</span>
                <div className="h-4 flex-1 rounded bg-surface-2 overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-500 rounded" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-24 text-right font-mono text-text-soft">
                  R$ {(valor / 1e6).toFixed(1).replace(".", ",")} mi
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela Interativa de Deputados e Fornecedores */}
      <TabelaCeap
        parlamentares={dados.parlamentares}
        totaisPorUf={dados.totaisPorUf}
        ressalvaEditorial={dados.ressalvaEditorial}
      />
    </div>
  );
}
