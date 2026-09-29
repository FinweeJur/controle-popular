"use client";

/**
 * @file apps/web/app/eua/PainelEua.tsx
 * @description Painel interativo do Hub Estados Unidos (/eua) com 6 Qualidades, abas temáticas e modo trilíngue.
 *
 * Papel no portal:
 * Apresenta o acervo de transparência pública e dados transnacionais dos EUA:
 * 1. Corporações e Fundos Estratégicos (SEC EDGAR: BlackRock, Vanguard, Alcoa, Albemarle, Vale ADR).
 * 2. Meio Ambiente & Barragens: NID (High Hazard), EPA ECHO (multas) e EPA Superfund (CERCLA).
 * 3. Orçamento e Compras: USAspending.gov e comércio exterior US Census Bureau (CTY 3510).
 * 4. Institucional: Cidades FIPS (NY, DC), Congresso, Corte de NY (Brumadinho SDNY) e BIA Terras Indígenas.
 *
 * Cumpre as 6 Qualidades: link oficial direto por CIK/Award, busca sem acento, ordenação,
 * cartões de topo com COBERTURA_EUA, BarraIdiomaTrilingue e exportação CSV com BOM UTF-8.
 */

import { useState, useMemo } from "react";
import BarraIdiomaTrilingue from "@/app/components/BarraIdiomaTrilingue";
import type { IdiomaExibicao } from "@/lib/internacional/idiomas-internacional";
import type {
  RegistroEmpresaSecEua,
  RegistroAmbientalEua,
  RegistroContratosEconomiaEua,
  RegistroInstitucionalEua,
} from "../../../../scripts/coletar-eua-acervo.mts";

type AbaAtiva = "empresas" | "ambiental" | "contratos" | "institucional";

interface PainelEuaProps {
  empresas: RegistroEmpresaSecEua[];
  ambiental: RegistroAmbientalEua[];
  contratos: RegistroContratosEconomiaEua[];
  institucional: RegistroInstitucionalEua[];
}

export default function PainelEua({
  empresas,
  ambiental,
  contratos,
  institucional,
}: PainelEuaProps) {
  const [aba, setAba] = useState<AbaAtiva>("empresas");
  const [busca, setBusca] = useState("");
  const [ordemAsc, setOrdemAsc] = useState(true);
  const [idioma, setIdioma] = useState<IdiomaExibicao>("pt");

  const normalizar = (txt: string) =>
    txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const termoBusca = normalizar(busca);

  const empresasFiltradas = useMemo(() => {
    return empresas
      .filter((e) => {
        if (!termoBusca) return true;
        return (
          normalizar(e.nome).includes(termoBusca) ||
          normalizar(e.ticker).includes(termoBusca) ||
          normalizar(e.setor).includes(termoBusca) ||
          normalizar(e.sedeEstado).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        const cmp = a.nome.localeCompare(b.nome);
        return ordemAsc ? cmp : -cmp;
      });
  }, [empresas, termoBusca, ordemAsc]);

  const ambientalFiltrado = useMemo(() => {
    return ambiental
      .filter((a) => {
        if (!termoBusca) return true;
        return (
          normalizar(a.titulo).includes(termoBusca) ||
          normalizar(a.categoria).includes(termoBusca) ||
          normalizar(a.orgaoFonte).includes(termoBusca)
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
          normalizar(c.programaOuAward).includes(termoBusca) ||
          normalizar(c.agenciaFederal).includes(termoBusca) ||
          normalizar(c.recipiente).includes(termoBusca)
        );
      })
      .sort((a, b) => {
        const cmp = a.programaOuAward.localeCompare(b.programaOuAward);
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
          normalizar(i.codigoOficial).includes(termoBusca)
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
    let nomeArquivo = "eua-dados.csv";

    if (aba === "empresas") {
      nomeArquivo = "empresas-sec-eua.csv";
      cabecalho = ["Nome", "CIK", "Ticker", "Setor", "Tipo", "Sede", "Ativos USD Bi", "Relação Brasil", "Link SEC"];
      linhas = empresasFiltradas.map((e) => [
        `"${e.nome}"`, `"${e.cik}"`, `"${e.ticker}"`, `"${e.setor}"`, `"${e.tipoEntidade}"`,
        `"${e.sedeEstado}"`, `${e.ativosSobGestaoUsdBilhoes}`, `"${e.relacaoBrasil}"`, `"${e.urlOficial}"`
      ]);
    } else if (aba === "ambiental") {
      nomeArquivo = "ambiental-eua.csv";
      cabecalho = ["Título", "Categoria", "Órgão", "Risco", "Métrica", "Valor", "Unidade", "Link Oficial"];
      linhas = ambientalFiltrado.map((a) => [
        `"${a.titulo}"`, `"${a.categoria}"`, `"${a.orgaoFonte}"`, `"${a.riscoOuGravidade}"`,
        `"${a.metricaPrincipalRotulo}"`, `${a.metricaPrincipalValor}`, `"${a.unidadeMetrica}"`, `"${a.urlOficial}"`
      ]);
    } else if (aba === "contratos") {
      nomeArquivo = "contratos-usaspending.csv";
      cabecalho = ["Programa", "Agência", "Recipiente", "Tipo", "Ano", "Valor USD M", "Elo Brasil", "Link Oficial"];
      linhas = contratosFiltrados.map((c) => [
        `"${c.programaOuAward}"`, `"${c.agenciaFederal}"`, `"${c.recipiente}"`, `"${c.tipoTransacao}"`,
        `${c.anoFiscal}`, `${c.valorUsdMilhoes}`, `"${c.eloBrasil}"`, `"${c.urlOficial}"`
      ]);
    } else {
      nomeArquivo = "institucional-eua.csv";
      cabecalho = ["Nome", "Frente", "Código", "Esfera", "Local", "Resumo Cívico", "Elo Brasil", "Link Oficial"];
      linhas = institucionalFiltrado.map((i) => [
        `"${i.nome}"`, `"${i.frente}"`, `"${i.codigoOficial}"`, `"${i.esfera}"`, `"${i.estadoOuLocal}"`,
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
          pt: "Painel dos Estados Unidos: corporações e fundos na SEC, inventário de barragens NID, compras federais e comércio exterior.",
          en: "United States portal: SEC EDGAR filings, corporations and asset managers, NID dams, federal spending, and foreign trade.",
          es: "Panel de Estados Unidos: corporaciones y fondos en SEC, inventario de presas NID, compras federales y comercio exterior.",
        }}
        perguntaSeuNono={{
          pt: "Quais corporações e fundos dos EUA na SEC investem no Brasil e quais os riscos?",
          en: "Which US corporations and funds in SEC EDGAR invest in Brazil and what are the risks?",
          es: "¿Cuáles corporaciones y fondos de EE. UU. en SEC invierten en Brasil y cuáles son los riesgos?",
        }}
        paisDestaque="EUA"
      />

      {/* SELETOR DE ABAS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAba("empresas")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              aba === "empresas"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            🏢 Empresas & Fundos SEC ({empresas.length})
          </button>
          <button
            onClick={() => setAba("ambiental")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              aba === "ambiental"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            🛡️ Barragens (NID) & EPA ({ambiental.length})
          </button>
          <button
            onClick={() => setAba("contratos")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              aba === "contratos"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            📊 Orçamento & Comércio ({contratos.length})
          </button>
          <button
            onClick={() => setAba("institucional")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              aba === "institucional"
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            🏛️ Congresso, SCOTUS & Cidades ({institucional.length})
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
          placeholder="Buscar no acervo dos EUA (sem acento)..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-sky-500 focus:outline-none"
        />
        <button
          onClick={() => setOrdemAsc(!ordemAsc)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted hover:text-foreground"
        >
          Ordenar {ordemAsc ? "A → Z" : "Z → A"}
        </button>
      </div>

      {/* TABELAS DE DADOS */}
      {aba === "empresas" && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-elevated text-xs font-semibold text-muted">
              <tr>
                <th className="px-4 py-3">Corporação / Fundo</th>
                <th className="px-4 py-3">CIK SEC</th>
                <th className="px-4 py-3">Ticker / Sede</th>
                <th className="px-4 py-3">Setor</th>
                <th className="px-4 py-3 text-right">Ativos (USD Bi)</th>
                <th className="px-4 py-3">Relação com o Brasil</th>
                <th className="px-4 py-3">Fonte Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {empresasFiltradas.map((e) => (
                <tr key={e.id} className="hover:bg-surface-elevated/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{e.nome}</div>
                    <div className="text-xs text-muted">{e.tipoEntidade}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-sky-600 dark:text-sky-400">
                    {e.cik}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-semibold text-foreground">{e.ticker}</span> — {e.sedeEstado}
                  </td>
                  <td className="px-4 py-3 text-xs">{e.setor}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                    ${e.ativosSobGestaoUsdBilhoes.toLocaleString()}B
                  </td>
                  <td className="px-4 py-3 text-xs text-muted max-w-xs">{e.relacaoBrasil}</td>
                  <td className="px-4 py-3">
                    <a
                      href={e.urlOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-700 hover:underline dark:text-sky-300"
                    >
                      SEC EDGAR ↗
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
              className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-sky-500/50 transition"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                    {a.categoria}
                  </span>
                  <span className="text-xs text-muted">{a.estado}</span>
                </div>
                <h3 className="font-bold text-foreground text-base">{a.titulo}</h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">{a.resumoImpacto}</p>

                <div className="mt-3 rounded-lg bg-surface-elevated p-3">
                  <div className="text-xs font-semibold text-foreground">
                    {a.metricaPrincipalRotulo}:
                  </div>
                  <div className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400">
                    {a.metricaPrincipalValor.toLocaleString()} {a.unidadeMetrica}
                  </div>
                </div>

                <p className="mt-3 text-xs italic text-muted border-l-2 border-sky-500 pl-2">
                  {a.paraleloBrasil}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted">{a.orgaoFonte}</span>
                <a
                  href={a.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
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
              className="rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-sky-500/50 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-foreground text-base">{c.programaOuAward}</h3>
                <span className="font-mono text-sm font-bold text-sky-600 dark:text-sky-400">
                  USD ${c.valorUsdMilhoes.toLocaleString()} milhões
                </span>
              </div>
              <p className="text-xs text-muted">{c.objetoContrato}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs text-muted">
                <span>Agência: {c.agenciaFederal} (Ano Fiscal {c.anoFiscal})</span>
                <a
                  href={c.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
                >
                  Ver no Portal Oficial ↗
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
              className="rounded-xl border border-border bg-surface p-5 shadow-sm hover:border-sky-500/50 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted">{i.frente}</span>
                  <span className="font-mono text-xs text-sky-600 dark:text-sky-400">
                    {i.codigoOficial}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-base">{i.nome}</h3>
                <p className="mt-2 text-xs text-muted leading-relaxed">{i.resumoCivico}</p>
                <p className="mt-3 text-xs italic text-muted border-l-2 border-sky-500 pl-2">
                  Elo Brasil: {i.eloBrasil}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs text-muted">{i.fonteOficial}</span>
                <a
                  href={i.urlOficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
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
