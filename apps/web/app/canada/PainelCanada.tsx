"use client";

/**
 * @file apps/web/app/canada/PainelCanada.tsx
 * @description Painel interativo do Hub Canadá (/canada) com 6 Qualidades, abas temáticas e modo trilíngue.
 *
 * Papel no portal:
 * Apresenta o acervo de transparência pública e dados transnacionais do Canadá:
 * 1. Mineradoras TSX com operação no Brasil (Grota do Cirilo, Xingu, Pará, MG).
 * 2. Meio Ambiente & Rejeitos: ECCC NPRI, caso Mount Polley (2014) e Climate TRACE.
 * 3. Compras Públicas Federais (Open Canada CKAN) e financiamentos EDC.
 * 4. Institucional: Cidades SGC (Toronto, Sudbury), Parlamento, CanLII e Primeiras Nações.
 *
 * Cumpre as 6 Qualidades: link oficial direto, busca sem acento, ordenação, cartões de topo,
 * BarraIdiomaTrilingue (PT/EN/ES + TTS + Seu Nonô) e exportação CSV com BOM UTF-8.
 */

import { useState, useMemo } from "react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type {
  RegistroMineradoraCanadaBrasil,
  RegistroAmbientalCienciaCanada,
  RegistroContratoEconomiaCanada,
  RegistroInstitucionalCanada,
} from "../../../../scripts/coletar-canada-acervo.mts";

type AbaAtiva = "mineradoras" | "ambiental" | "contratos" | "institucional";

interface PainelCanadaProps {
  mineradoras: RegistroMineradoraCanadaBrasil[];
  ambiental: RegistroAmbientalCienciaCanada[];
  contratos: RegistroContratoEconomiaCanada[];
  institucional: RegistroInstitucionalCanada[];
}

export default function PainelCanada({
  mineradoras,
  ambiental,
  contratos,
  institucional,
}: PainelCanadaProps) {
  const [aba, setAba] = useState<AbaAtiva>("mineradoras");
  const [busca, setBusca] = useState("");
  const [ordemAsc, setOrdemAsc] = useState(true);
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  // Normalização para busca sem acentos
  const normalizar = (txt: string) =>
    txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const termoBusca = normalizar(busca);

  const mineradorasFiltradas = useMemo(() => {
    return mineradoras
      .filter((m) => {
        if (!termoBusca) return true;
        return (
          normalizar(m.empresaMae).includes(termoBusca) ||
          normalizar(m.municipiosBrasil).includes(termoBusca) ||
          normalizar(m.substancia).includes(termoBusca) ||
          normalizar(m.tickerBolsa).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        const cmp = a.empresaMae.localeCompare(b.empresaMae);
        return ordemAsc ? cmp : -cmp;
      });
  }, [mineradoras, termoBusca, ordemAsc]);

  const ambientalFiltrado = useMemo(() => {
    return ambiental
      .filter((a) => {
        if (!termoBusca) return true;
        return (
          normalizar(a.titulo).includes(termoBusca) ||
          normalizar(a.categoria).includes(termoBusca) ||
          normalizar(a.instituicaoFonte).includes(termoBusca) ||
          normalizar(a.empresaOuBacia).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        const cmp = a.titulo.localeCompare(b.titulo);
        return ordemAsc ? cmp : -cmp;
      });
  }, [ambiental, termoBusca, ordemAsc]);

  const contratosFiltrados = useMemo(() => {
    return contratos
      .filter((c) => {
        if (!termoBusca) return true;
        return (
          normalizar(c.orgaoOuFundo).includes(termoBusca) ||
          normalizar(c.beneficiarioOuEmpresa).includes(termoBusca) ||
          normalizar(c.objetoResumo).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        const cmp = a.orgaoOuFundo.localeCompare(b.orgaoOuFundo);
        return ordemAsc ? cmp : -cmp;
      });
  }, [contratos, termoBusca, ordemAsc]);

  const institucionalFiltrado = useMemo(() => {
    return institucional
      .filter((i) => {
        if (!termoBusca) return true;
        return (
          normalizar(i.nome).includes(termoBusca) ||
          normalizar(i.frente).includes(termoBusca) ||
          normalizar(i.provincia).includes(termoBusca) ||
          normalizar(i.resumoCivico).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        const cmp = a.nome.localeCompare(b.nome);
        return ordemAsc ? cmp : -cmp;
      });
  }, [institucional, termoBusca, ordemAsc]);

  function exportarCsv() {
    let cabecalho: string[] = [];
    let linhas: string[][] = [];
    let nomeArquivo = "canada-dados.csv";

    if (aba === "mineradoras") {
      nomeArquivo = "mineradoras-canada-brasil.csv";
      cabecalho = ["Empresa Mãe", "Ticker", "Sede", "Subsidiária Brasil", "UF", "Municípios", "Substância", "Processos ANM", "Barragens", "Fonte", "Link Oficial"];
      linhas = mineradorasFiltradas.map((m) => [
        `"${m.empresaMae}"`, `"${m.tickerBolsa}"`, `"${m.sedeCanada}"`, `"${m.subsidiariaBrasil}"`,
        `"${m.ufBrasil}"`, `"${m.municipiosBrasil}"`, `"${m.substancia}"`, `${m.processosAnm}`,
        `${m.barragensSigbm}`, `"${m.fonteNome}"`, `"${m.urlOficial}"`
      ]);
    } else if (aba === "ambiental") {
      nomeArquivo = "ambiental-canada.csv";
      cabecalho = ["Título", "Categoria", "Órgão / Instituição", "Região", "Indicador", "Valor", "Unidade", "Elo Brasil", "Link Oficial"];
      linhas = ambientalFiltrado.map((a) => [
        `"${a.titulo}"`, `"${a.categoria}"`, `"${a.instituicaoFonte}"`, `"${a.provinciaOuRegiao}"`,
        `"${a.indicadorPrincipal}"`, `${a.valorMedido}`, `"${a.unidade}"`,
        `"${a.eloBrasil}"`, `"${a.urlOficial}"`
      ]);
    } else if (aba === "contratos") {
      nomeArquivo = "contratos-open-canada.csv";
      cabecalho = ["Órgão / Fundo", "Beneficiário / Empresa", "Categoria", "Ano Fiscal", "Valor (CAD)", "Objeto", "Link Oficial"];
      linhas = contratosFiltrados.map((c) => [
        `"${c.orgaoOuFundo}"`, `"${c.beneficiarioOuEmpresa}"`, `"${c.categoria}"`, `"${c.anoFiscal}"`,
        `${c.valorCad}`, `"${c.objetoResumo}"`, `"${c.urlOficial}"`
      ]);
    } else {
      nomeArquivo = "institucional-canada.csv";
      cabecalho = ["Nome", "Frente", "Código Oficial", "Província", "Resumo Cívico", "Elo Brasil", "Link Oficial"];
      linhas = institucionalFiltrado.map((i) => [
        `"${i.nome}"`, `"${i.frente}"`, `"${i.codigoOficial}"`, `"${i.provincia}"`,
        `"${i.resumoCivico}"`, `"${i.eloBrasil}"`, `"${i.urlOficial}"`
      ]);
    }

    const csvContent = "\uFEFF" + [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", nomeArquivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* BARRA TRILÍNGUE (PT / EN / ES + TTS + SEU NONÔ) */}
      <BarraIdiomaTrilingue
        idioma={idioma}
        aoTrocarIdioma={setIdioma}
        resumoTrilingue={{
          pt: "Painel do Canadá: mineradoras na Bolsa de Toronto (TSX), inventário de emissões NPRI, compras públicas e Primeiras Nações.",
          en: "Canada portal: TSX mining companies in Brazil, NPRI pollutant releases, federal contracts, and First Nations territories.",
          es: "Panel de Canadá: mineras en la Bolsa de Toronto (TSX), inventario de emisiones NPRI, compras públicas y Primeras Naciones.",
        }}
        perguntaSeuNono={{
          pt: "Quais mineradoras canadenses da TSX operam no Brasil e quais os riscos ambientais?",
          en: "Which Canadian TSX mining companies operate in Brazil and what are the environmental risks?",
          es: "¿Cuáles mineras canadienses de la TSX operan en Brasil y cuáles son los riesgos ambientales?",
        }}
        paisDestaque="Canadá"
      />

      {/* SELETOR DE ABAS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAba("mineradoras")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              aba === "mineradoras"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            ⛏️ Mineradoras TSX no Brasil ({mineradoras.length})
          </button>
          <button
            onClick={() => setAba("ambiental")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              aba === "ambiental"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            🌊 Meio Ambiente & Rejeitos ({ambiental.length})
          </button>
          <button
            onClick={() => setAba("contratos")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              aba === "contratos"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            📄 Compras & Financiamentos ({contratos.length})
          </button>
          <button
            onClick={() => setAba("institucional")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              aba === "institucional"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            🏛️ Institucional & Primeiras Nações ({institucional.length})
          </button>
        </div>

        {/* BOTÃO EXPORTAR CSV */}
        <button
          onClick={exportarCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-elevated"
        >
          ⬇️ Exportar CSV (BOM UTF-8)
        </button>
      </div>

      {/* BUSCA EM TEMPO REAL E ORDENAÇÃO */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Buscar no acervo do Canadá (sem acento)..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-emerald-500 focus:outline-none"
        />
        <button
          onClick={() => setOrdemAsc(!ordemAsc)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
        >
          Ordenar {ordemAsc ? "A → Z" : "Z → A"}
        </button>
      </div>

      {/* CONTEÚDO DAS TABELAS */}
      {aba === "mineradoras" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-elevated text-xs font-semibold text-muted">
              <tr>
                <th className="px-4 py-3">Empresa (Canadá / Brasil)</th>
                <th className="px-4 py-3">Bolsa / Ticker</th>
                <th className="px-4 py-3">Localização (Brasil)</th>
                <th className="px-4 py-3">Substância</th>
                <th className="px-4 py-3 text-right">Processos ANM</th>
                <th className="px-4 py-3 text-right">Barragens</th>
                <th className="px-4 py-3">Fonte Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mineradorasFiltradas.map((m) => (
                <tr key={m.id} className="hover:bg-surface-elevated/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{m.empresaMae}</div>
                    <div className="text-xs text-muted">Subsidiária: {m.subsidiariaBrasil}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    {m.tickerBolsa}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <span className="font-semibold text-foreground">{m.ufBrasil}</span> — {m.municipiosBrasil}
                  </td>
                  <td className="px-4 py-3 text-xs">{m.substancia}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{m.processosAnm}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-alert">
                    {m.barragensSigbm}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={m.urlOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-300"
                    >
                      {m.fonteNome.split("/")[0]} ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aba === "ambiental" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {ambientalFiltrado.map((a) => (
            <div
              key={a.id}
              className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-emerald-500/50 transition"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {a.categoria}
                  </span>
                  <span className="text-xs text-muted">{a.provinciaOuRegiao}</span>
                </div>
                <h3 className="font-bold text-foreground text-base">{a.titulo}</h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">{a.empresaOuBacia}</p>

                <div className="mt-3 rounded-lg bg-surface-elevated p-3">
                  <div className="text-xs font-semibold text-foreground">
                    {a.indicadorPrincipal}:
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {a.valorMedido.toLocaleString()} {a.unidade}
                  </div>
                </div>

                <p className="mt-3 text-xs italic text-muted border-l-2 border-emerald-500 pl-2">
                  Paralelo Brasil: {a.eloBrasil}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted">{a.instituicaoFonte}</span>
                <a
                  href={a.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Fonte Oficial Direta ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === "contratos" && (
        <div className="space-y-4">
          {contratosFiltrados.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-emerald-500/50 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-foreground text-base">{c.beneficiarioOuEmpresa}</h3>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  CAD ${c.valorCad.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted">{c.objetoResumo}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs text-muted">
                <span>Órgão / Fundo: {c.orgaoOuFundo} (Ano Fiscal {c.anoFiscal})</span>
                <a
                  href={c.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Ver no Open Government Canada ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {aba === "institucional" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {institucionalFiltrado.map((i) => (
            <div
              key={i.id}
              className="rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-emerald-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted">{i.frente}</span>
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    {i.codigoOficial}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-base">{i.nome}</h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">{i.resumoCivico}</p>
                <p className="mt-3 text-xs italic text-muted border-l-2 border-emerald-500 pl-2">
                  Elo Brasil: {i.eloBrasil}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted">{i.fonteOficial}</span>
                <a
                  href={i.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Documento Oficial ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
