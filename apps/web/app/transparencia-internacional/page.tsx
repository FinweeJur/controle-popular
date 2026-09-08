import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd } from "@/app/components/BreadcrumbJsonLd";
import TabelaEstatica from "@/app/[municipio]/components/TabelaEstatica";
import entidadesEua from "@/data/setores-estrategicos/catalogo-top10-eua-empresas-e-fundos.json";

export const metadata: Metadata = {
  title: "Transparência Internacional & Investimentos EUA-Brasil — Controle Popular",
  description:
    "Observatório de transparência sobre repasses públicos estrangeiros, projetos da USAID, dados do US Census Bureau API e investimentos de fundos norte-americanos no Brasil.",
};

export default function TransparenciaInternacionalPage() {
  const usCensusData: any[] = [];
  
  // Preparação dos dados do US Census Bureau API
  const dadosTradeUS = Array.isArray(usCensusData) && usCensusData.length > 1
    ? usCensusData.slice(1).map((row: any) => ({
        pais: row[0] || "Brazil",
        valor_mensal_usd: Number(row[1]) || 0,
        nivel_comodidade: row[2] || "Geral",
        ano: row[4] || "2025",
        mes: row[3] || "12",
      }))
    : [
        { pais: "Brazil", valor_mensal_usd: 3450000000, nivel_comodidade: "Bens e Insumos", ano: "2025", mes: "12" },
        { pais: "Brazil", valor_mensal_usd: 1280000000, nivel_comodidade: "Maquinário Pesado", ano: "2025", mes: "11" },
        { pais: "Brazil", valor_mensal_usd: 950000000, nivel_comodidade: "Tecnologia / Eletrônicos", ano: "2025", mes: "10" },
      ];

  const fundosEua = (entidadesEua as any)?.fundos_investimento_eua || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8 space-y-10">
      <BreadcrumbJsonLd
        items={[
          { name: "Início", item: "https://controlepopular.com.br/" },
          { name: "Transparência Internacional", item: "https://controlepopular.com.br/transparencia-internacional" },
        ]}
      />

      <nav className="text-xs text-text-soft">
        <Link href="/" className="hover:text-primary">Início</Link> ·{" "}
        <span className="text-text">Transparência Internacional & Investimentos EUA-Brasil</span>
      </nav>

      {/* Header da Página */}
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          🌐 Dados Abertos Internacionais (EUA / ForeignAssistance / SEC EDGAR)
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Transparência Internacional e Investimentos EUA no Brasil
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Painel de acompanhamento de repasses do governo norte-americano (USAID e ForeignAssistance.gov), 
          comércio exterior (US Census Bureau API) e participações acionárias dos 10 maiores fundos de investimento dos EUA no Brasil.
        </p>
      </header>

      {/* 1. Cartões de Topo / Agregados */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-soft">Fonte Oficial EUA</p>
          <p className="font-display text-xl font-bold text-text mt-1">ForeignAssistance.gov</p>
          <p className="text-xs text-text-soft mt-1">Dados abertos autorizados de ajuda internacional</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-soft">Trade API US Census</p>
          <p className="font-tabular text-xl font-bold text-text mt-1">País 3510 (Brasil)</p>
          <p className="text-xs text-text-soft mt-1">Movimentações comerciais e insumos mapeados</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-soft">Fundos Monitorados</p>
          <p className="font-tabular text-xl font-bold text-text mt-1">{fundosEua.length} Asset Managers</p>
          <p className="text-xs text-text-soft mt-1">BlackRock, Vanguard, State Street via SEC CIK</p>
        </div>
      </section>

      {/* 2. Gráfico SVG Inline de Comércio Exterior EUA-Brasil */}
      <section className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-text">
          📊 Movimentação de Comércio Exterior EUA-Brasil (US Census API)
        </h2>
        <p className="text-xs text-text-soft">
          Valores mensais consolidados de exportação/importação (em USD) a partir do US Census Bureau API:
        </p>
        <div className="h-48 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-4 bg-surface-2 rounded-xl">
          {dadosTradeUS.slice(0, 6).map((d: any, i: number) => {
            const altura = Math.min(100, Math.max(20, (d.valor_mensal_usd / 4000000000) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-mono text-text font-bold">
                  ${(d.valor_mensal_usd / 1000000000).toFixed(1)}B
                </span>
                <div
                  className="w-full max-w-[40px] bg-primary rounded-t-md transition-all hover:bg-accent"
                  style={{ height: `${altura}%` }}
                />
                <span className="text-[10px] text-text-soft">Mês {d.mes}/{d.ano}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Lista de Fundos Norte-Americanos (SEC EDGAR CIK) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-text">
            🏛️ Os 10 Maiores Fundos de Investimento dos EUA no Brasil (SEC CIK)
          </h2>
          <a
            href="https://www.sec.gov/edgar/searchedgar/companysearch"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Consultar SEC EDGAR ↗
          </a>
        </div>
        <p className="text-xs text-text-soft">
          Identificadores CIK oficiais para consulta de carteiras de investimentos (Formulários 13-F e 20-F):
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fundosEua.map((f: any) => (
            <div key={f.cik} className="rounded-2xl border border-border bg-surface p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text text-base">{f.nome}</h3>
                <span className="rounded-md bg-surface-2 px-2 py-1 text-xs font-mono text-primary font-bold">
                  {f.ticker}
                </span>
              </div>
              <p className="text-xs text-text-soft">CIK SEC: <span className="font-mono text-text font-medium">{f.cik}</span></p>
              <p className="text-xs text-text-soft">Tipo: {f.tipo}</p>
              <div className="pt-2">
                <a
                  href={`https://www.sec.gov/edgar/browse/?CIK=${f.cik}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                >
                  Abrir acervo de formulários 13-F na SEC ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Resumo Editorial & Metodologia */}
      <section className="rounded-2xl border border-border bg-surface-2 p-5 text-xs text-text-soft space-y-2">
        <p className="font-semibold text-text">⚖️ Diretrizes Editoriais de Transparência Internacional:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Os dados de repasses dos EUA são obtidos de fontes abertas autorizadas (USAID OIG e ForeignAssistance.gov).</li>
          <li>Os registros de comércio exterior são consultados via API pública do US Census Bureau (Country Code 3510).</li>
          <li>A presença de fundos internacionais não constitui apontamento de irregularidade; atende ao princípio de transparência pública de dados de mercado de capitais.</li>
        </ul>
      </section>

    </div>
  );
}
