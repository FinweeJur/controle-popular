import { carregarCeapNacional } from "@/lib/congresso/ceap-nacional-dados";

interface PainelCeapParlamentarProps {
  nomeParlamentar: string;
  uf?: string | null;
}

export default function PainelCeapParlamentar({ nomeParlamentar, uf }: PainelCeapParlamentarProps) {
  const ceap = carregarCeapNacional();
  if (!ceap) return null;

  // Busca o parlamentar correspondente no acervo
  const nomeNorm = nomeParlamentar.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const p = ceap.parlamentares.find((item) => {
    const itemNorm = item.nomeParlamentar.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const casouNome = itemNorm.includes(nomeNorm) || nomeNorm.includes(itemNorm);
    if (uf && item.uf) {
      return casouNome && item.uf.toUpperCase() === uf.toUpperCase();
    }
    return casouNome;
  });

  if (!p) {
    return (
      <div className="rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-5 text-sm">
        <h3 className="font-display font-semibold text-base">Cota Parlamentar (CEAP)</h3>
        <p className="mt-1 text-xs opacity-75">
          Nenhum lançamento recente encontrado para este parlamentar na base consolidada da Câmara dos Deputados.
        </p>
      </div>
    );
  }

  const topTipos = Object.entries(p.porTipoDespesa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <section className="space-y-4 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--cp-border)] pb-3">
        <div>
          <h3 className="font-display text-xl font-bold">Cota Parlamentar (CEAP)</h3>
          <p className="text-xs opacity-75">
            Total de {p.qtdDespesas.toLocaleString("pt-BR")} reembolsos declarados na Câmara dos Deputados.
          </p>
        </div>
        <div className="text-right">
          <span className="block text-xs font-semibold opacity-70">Total Reembolsado</span>
          <span className="font-mono text-xl font-bold text-[var(--cp-accent)]">
            R$ {p.totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Principais Tipos de Despesas */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">Maiores Tipos de Despesa</h4>
          <ul className="space-y-1.5 text-xs">
            {topTipos.map(([tipo, valor]) => (
              <li key={tipo} className="flex justify-between items-baseline gap-2">
                <span className="truncate max-w-[200px]" title={tipo}>
                  {tipo}
                </span>
                <span className="font-mono font-semibold">
                  R$ {valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Fornecedores */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider opacity-70">Principais Fornecedores / Contratados</h4>
          <ul className="space-y-1.5 text-xs">
            {p.topFornecedores.slice(0, 4).map((forn, idx) => (
              <li key={idx} className="flex justify-between items-baseline gap-2">
                <span className="truncate max-w-[190px]" title={forn.nome}>
                  {forn.nome}
                </span>
                <span className="font-mono font-semibold">
                  R$ {forn.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--cp-border)] pt-3 text-[11px] leading-relaxed opacity-70">
        <span className="font-semibold">ℹ️ Ressalva Editorial: </span>
        Os gastos da Cota Parlamentar (CEAP) são reembolsos legais fiscalizados pela Câmara dos Deputados. O uso do valor não presume irregularidade nem ilicitude.
      </div>
    </section>
  );
}
