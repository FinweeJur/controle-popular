import Link from "next/link";
import type { RegistroLugar } from "@/lib/lugares";
import PainelDialogo from "@/app/components/PainelDialogo";
import BlocoPovoGente, { type DadosImpactoPovoGente } from "./BlocoPovoGente";

interface ItemTabelaLugar {
  municipio: string;
  atoOuLicenca: string;
  situacao: string;
  ano: string;
}

interface PainelLugarProps {
  lugar: RegistroLugar;
  numeroProtagonista: {
    valor: string;
    rotulo: string;
    fonte: string;
    dataReferencia?: string;
  };
  dadosGrafico?: { rotulo: string; valor: number }[];
  impactoPovoGente: DadosImpactoPovoGente;
  variacaoPovoGente?: "povo" | "gente";
  itensTabela?: ItemTabelaLugar[];
}

export default function PainelLugar({
  lugar,
  numeroProtagonista,
  dadosGrafico = [
    { rotulo: "2020", valor: 45 },
    { rotulo: "2022", valor: 70 },
    { rotulo: "2024", valor: 110 },
    { rotulo: "2026", valor: 140 },
  ],
  impactoPovoGente,
  variacaoPovoGente = "povo",
  itensTabela = [
    { municipio: "Polo Regional", atoOuLicenca: "Monitoramento Integrado", situacao: "Ativo", ano: "2026" },
    { municipio: "Bacia Hidrográfica", atoOuLicenca: "Outorga de Captação IGAM", situacao: "Vigente", ano: "2025" },
    { municipio: "Área de Influência", atoOuLicenca: "Fiscalização Ordinária SEMAD", situacao: "Concluído", ano: "2024" },
  ],
}: PainelLugarProps) {
  const maxGrafico = Math.max(...dadosGrafico.map((d) => d.valor), 1);

  // Download CSV com BOM UTF-8 e separador ';' conforme regra do portal
  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    encodeURIComponent(
      ["Município;Ato/Licença;Situação;Ano", ...itensTabela.map((i) => `${i.municipio};${i.atoOuLicenca};${i.situacao};${i.ano}`)].join("\n")
    );

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* TRILHA (Breadcrumb) */}
      <nav aria-label="Navegação estrutural" className="text-xs text-text-soft">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:underline">Início</Link>
          </li>
          <li>›</li>
          <li>
            <Link href="/ambiental" className="hover:underline">ONSA · Meio Ambiente & Terras</Link>
          </li>
          <li>›</li>
          <li>
            <Link href="/ambiental/nossos" className="hover:underline">Nossos</Link>
          </li>
          <li>›</li>
          <li className="font-semibold text-text">{lugar.nome}</li>
        </ol>
      </nav>

      {/* CABEÇALHO & TAGS */}
      <header className="mt-5 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {lugar.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
            >
              #{tag}
            </span>
          ))}
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-text-soft border border-border">
            Bioma: {lugar.biomas.join(" / ")}
          </span>
        </div>

        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight text-text">
          {lugar.nome}
        </h1>
        <p className="mt-2 text-base text-text-soft max-w-3xl leading-relaxed">
          {lugar.resumoVozCidada}
        </p>

        {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (Cap. 6 · Terras, Salvar o Fogo) */}
        <p className="mt-4 border-l-2 border-primary/40 pl-4 text-sm italic text-text-soft">
          "A vida humana é indissociável do território. E muitas pessoas estão privadas disso." — Itamar Vieira Junior, sobre Salvar o Fogo, 2023
        </p>
      </header>

      {/* CARTOES DE TOPO & GRÁFICO NATIVO SVG */}
      <section className="mt-8 grid gap-6 md:grid-cols-3">
        {/* Número Protagonista */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Indicador Protagonista
            </span>
            <div className="mt-2 font-tabular text-3xl sm:text-4xl font-bold text-text">
              {numeroProtagonista.valor}
            </div>
            <p className="mt-1 text-sm text-text-soft">
              {numeroProtagonista.rotulo}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border text-[0.75rem] text-text-soft">
            Fonte oficial: <span className="font-semibold text-text">{numeroProtagonista.fonte}</span>
            {numeroProtagonista.dataReferencia && ` (${numeroProtagonista.dataReferencia})`}
          </div>
        </div>

        {/* Gráfico Nativo Inline SVG (sem bibliotecas externas) */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-text-soft">
                Evolução no Tempo
              </span>
              <h2 className="text-sm font-semibold text-text">Atos Oficiais e Monitoramento Ambiental</h2>
            </div>
            <span className="text-[0.72rem] text-text-soft">Gráfico nativo SVG</span>
          </div>

          <div className="mt-4 h-24 w-full">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 300 70" preserveAspectRatio="none">
              {dadosGrafico.map((d, index) => {
                const barWidth = 40;
                const gap = 35;
                const x = 20 + index * (barWidth + gap);
                const height = (d.valor / maxGrafico) * 50;
                const y = 55 - height;
                return (
                  <g key={d.rotulo}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={height}
                      rx="4"
                      className="fill-primary/80 hover:fill-primary transition-colors"
                    />
                    <text
                      x={x + barWidth / 2}
                      y="68"
                      textAnchor="middle"
                      className="fill-current text-[9px] text-text-soft font-tabular"
                    >
                      {d.rotulo}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </section>

      {/* DIÁLOGO ENTRE FRENTES (Sidebar Sanfona) */}
      <PainelDialogo
        origemRota={`/ambiental/nossos-${lugar.tipo === "rio" ? "rios" : lugar.tipo === "serra" ? "serras" : "territorios"}/${lugar.id}`}
        origemTitulo={lugar.nome}
        abertoInicialmente={true}
      />

      {/* TABELA DE ATOS COM DOWNLOAD CSV */}
      <section className="mt-10 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-text">
              Atos Oficiais Registrados em {lugar.nome}
            </h2>
            <p className="text-xs text-text-soft">
              Licenças, outorgas e deliberações oficiais de órgãos públicos vinculados ao polígono.
            </p>
          </div>

          <a
            href={csvContent}
            download={`${lugar.id}-atos-oficiais.csv`}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
          >
            <span>📥 Baixar Planilha CSV</span>
          </a>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-text">
            <thead>
              <tr className="border-b border-border text-text-soft">
                <th className="pb-2 font-semibold">Município</th>
                <th className="pb-2 font-semibold">Ato / Licença</th>
                <th className="pb-2 font-semibold">Situação</th>
                <th className="pb-2 font-semibold">Ano</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {itensTabela.map((item, idx) => (
                <tr key={idx} className="hover:bg-surface-2/50 transition-colors">
                  <td className="py-2.5 font-medium">{item.municipio}</td>
                  <td className="py-2.5 text-text-soft">{item.atoOuLicenca}</td>
                  <td className="py-2.5">
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.7rem] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {item.situacao}
                    </span>
                  </td>
                  <td className="py-2.5 font-tabular text-text-soft">{item.ano}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* BLOCO "E NOSSO POVO?" / "E NOSSA GENTE?" */}
      <BlocoPovoGente dados={impactoPovoGente} variacao={variacaoPovoGente} />
    </article>
  );
}
