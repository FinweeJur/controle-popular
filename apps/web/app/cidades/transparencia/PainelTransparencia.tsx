"use client";

import { useMemo, useState } from "react";

import { formatNumberBR } from "@/lib/betim/format";
import {
  filtrarLinhas,
  formatarItp,
  formatarPct,
  INDICE,
  linhasParaCsv,
  opcoesDe,
  ordenarPorItp,
  rotuloValidada,
  type DirecaoItp,
  type LinhaPntp,
} from "@/lib/pntp/pagina";

/**
 * ═══ PAINEL DA TABELA DO PNTP 2025 — TEMA CIDADES ═══
 *
 * O que é:
 *   Tabela dos 1.712 entes públicos de MG no ciclo 2025 do PNTP, com busca sem
 *   acento, filtro por poder/esfera/nível, ordenação por ITP e CSV do recorte.
 *
 * Fonte oficial:
 *   Atricon — PNTP, https://pntp.atricon.org.br/dados-abertos/. As linhas vêm
 *   do JSON versionado (`apps/web/data/pntp/avaliacoes-mg.json`), lido pelo
 *   Server Component da página.
 *
 * Por que foi feito assim:
 *   - O servidor manda SÓ o ciclo 2025, em tuplas (`LinhaPntp`): 5.286 linhas
 *     com todos os campos viram 1.712 linhas de 8 posições. Nenhum fetch no
 *     navegador — o dado já chega pronto.
 *   - `itp: null` é "Não Avaliado" e sai "—" na tela e vazio no CSV. Zero ali
 *     seria difamação com número.
 *   - Ordenação por ITP joga nulo para o fim nas duas direções: ente sem
 *     avaliação não é o "pior", não tem nota.
 *   - Paginação de 50 linhas: 1.712 `<tr>` de uma vez pesa no celular e não
 *     ajuda ninguém a ler.
 *   - Tela de 390 px mostra cartões empilhados em vez de tabela de 8 colunas;
 *     a tabela aparece a partir de `sm` (regra 5.14).
 */

const TODOS = "";
const POR_PAGINA = 50;

/** Cor do selo — sempre acompanhada do nome escrito, nunca só cor. */
const ESTILO_NIVEL: Record<string, string> = {
  Diamante: "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  Ouro: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Prata: "border-slate-400/50 bg-slate-400/15 text-slate-700 dark:text-slate-300",
  Elevado: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Intermediário: "border-primary/40 bg-primary/10 text-primary",
  Básico: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Inicial: "border-alert/40 bg-alert/10 text-alert",
  Inexistente: "border-alert/50 bg-alert/15 text-alert",
  "Não Avaliado": "border-border bg-surface-2 text-text-soft",
};

function BadgeNivel({ nivel }: { nivel: string }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
        ESTILO_NIVEL[nivel] ?? "border-border bg-surface-2 text-text-soft"
      }`}
    >
      {nivel}
    </span>
  );
}

/** ITP grande e legível; nulo é "—" com explicação no title. */
function CelulaItp({ itp }: { itp: number | null }) {
  if (itp === null) {
    return (
      <span className="text-text-soft" title="Não Avaliado no ciclo — a fonte não tem índice">
        —
      </span>
    );
  }
  return <span className="font-tabular font-semibold text-text">{formatarItp(itp)}</span>;
}

export default function PainelTransparencia({
  linhas,
  ano,
}: {
  linhas: LinhaPntp[];
  ano: number;
}) {
  const [poder, setPoder] = useState(TODOS);
  const [esfera, setEsfera] = useState(TODOS);
  const [nivel, setNivel] = useState(TODOS);
  const [busca, setBusca] = useState("");
  const [direcao, setDirecao] = useState<DirecaoItp>("desc");
  const [pagina, setPagina] = useState(1);

  const poderes = useMemo(() => opcoesDe(linhas, INDICE.poder), [linhas]);
  const esferas = useMemo(() => opcoesDe(linhas, INDICE.esfera), [linhas]);
  const niveis = useMemo(() => opcoesDe(linhas, INDICE.nivel), [linhas]);

  const filtradas = useMemo(
    () => ordenarPorItp(filtrarLinhas(linhas, { poder, esfera, nivel, busca }), direcao),
    [linhas, poder, esfera, nivel, busca, direcao]
  );

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const temFiltro = Boolean(poder || esfera || nivel || busca.trim());

  function mexerNoFiltro(fn: () => void) {
    fn();
    setPagina(1);
  }

  function limparFiltros() {
    setPoder(TODOS);
    setEsfera(TODOS);
    setNivel(TODOS);
    setBusca("");
    setDirecao("desc");
    setPagina(1);
  }

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    // BOM + ';' dentro de `linhasParaCsv`: é o que o Excel brasileiro abre
    // com acento no lugar e coluna no lugar.
    const csv = linhasParaCsv(filtradas, ano);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pntp-${ano}-mg-filtrado-${hoje}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function alternarDirecao() {
    setDirecao((atual) => (atual === "desc" ? "asc" : atual === "asc" ? "nenhuma" : "desc"));
    setPagina(1);
  }

  const rotuloOrdem =
    direcao === "desc"
      ? "ITP: maior primeiro"
      : direcao === "asc"
        ? "ITP: menor primeiro"
        : "ITP: ordem do arquivo";

  return (
    <div className="mt-4 w-full min-w-0">
      {/* FILTROS */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Poder</span>
            <select
              value={poder}
              onChange={(e) => mexerNoFiltro(() => setPoder(e.target.value))}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODOS}>Todos os poderes ({poderes.length})</option>
              {poderes.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Esfera</span>
            <select
              value={esfera}
              onChange={(e) => mexerNoFiltro(() => setEsfera(e.target.value))}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODOS}>Todas as esferas ({esferas.length})</option>
              {esferas.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Nível (selo do PNTP)</span>
            <select
              value={nivel}
              onChange={(e) => mexerNoFiltro(() => setNivel(e.target.value))}
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
            >
              <option value={TODOS}>Todos os níveis ({niveis.length})</option>
              {niveis.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          </label>

          <label className="block min-w-0">
            <span className="text-xs font-semibold text-text-soft">Buscar órgão ou município</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => mexerNoFiltro(() => setBusca(e.target.value))}
              placeholder="Ex.: Betim, câmara, saúde…"
              className="mt-1 min-h-11 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-soft focus:border-primary"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="font-tabular text-xs text-text-soft" aria-live="polite" aria-atomic="true">
            {formatNumberBR(filtradas.length)} de {formatNumberBR(linhas.length)} entes
            {temFiltro ? " com o filtro atual" : ""}
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex min-h-9 items-center rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary"
              >
                Limpar filtros
              </button>
            )}
            <button
              type="button"
              onClick={exportarCsv}
              disabled={filtradas.length === 0}
              className="inline-flex min-h-9 items-center rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
            >
              Baixar CSV dos filtrados
            </button>
          </div>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-text-soft">
          Nenhum ente corresponde ao filtro. A tabela cobre todos os{" "}
          {formatNumberBR(linhas.length)} entes de MG no ciclo {ano} — este resultado é
          definitivo, não é carregamento parcial.
        </p>
      ) : (
        <>
          {/* ORDENAÇÃO — botão único, serve a tabela e os cartões */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-soft">Ordenar</span>
            <button
              type="button"
              onClick={alternarDirecao}
              aria-label={`Ordenar por ITP. Agora: ${rotuloOrdem}. Clique para trocar.`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary"
            >
              <span>{rotuloOrdem}</span>
              <span aria-hidden="true" className="font-tabular text-[12px]">
                {direcao === "desc" ? "▼" : direcao === "asc" ? "▲" : "⇅"}
              </span>
            </button>
            <span className="text-xs text-text-soft">Entes sem avaliação ficam sempre no fim.</span>
          </div>

          {/* TABELA — a partir de sm */}
          <div className="mt-3 hidden overflow-x-auto rounded-xl border border-border sm:block">
            <table className="w-full min-w-[860px] text-sm">
              <caption className="sr-only">
                Entes públicos de Minas Gerais no ciclo {ano} do PNTP, com índice de transparência,
                percentual de critérios essenciais, nível e validação.
              </caption>
              <thead>
                <tr>
                  {[
                    "Órgão",
                    "Poder",
                    "Esfera",
                    "Município",
                    "ITP",
                    "% essenciais",
                    "Nível",
                    "Validada",
                  ].map((rotulo) => (
                    <th
                      key={rotulo}
                      scope="col"
                      aria-sort={
                        rotulo === "ITP"
                          ? direcao === "asc"
                            ? "ascending"
                            : direcao === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                      className={`border-b border-border bg-surface px-3 py-2 text-xs font-semibold tracking-wide text-text-soft uppercase ${
                        rotulo === "ITP" || rotulo === "% essenciais" || rotulo === "Validada"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {rotulo === "ITP" ? (
                        <button
                          type="button"
                          onClick={alternarDirecao}
                          title="Ordenar por ITP"
                          className="inline-flex items-center gap-1 rounded transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
                        >
                          {rotulo}
                          <span aria-hidden="true" className="font-tabular text-[12px]">
                            {direcao === "desc" ? "▼" : direcao === "asc" ? "▲" : "⇅"}
                          </span>
                        </button>
                      ) : (
                        rotulo
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((linha) => (
                  <tr key={`${linha[INDICE.orgao]}-${linha[INDICE.poder]}`}>
                    <th
                      scope="row"
                      className="max-w-[320px] border-b border-border px-3 py-2 text-left font-medium text-text"
                    >
                      <span className="line-clamp-2 break-words">{linha[INDICE.orgao]}</span>
                    </th>
                    <td className="border-b border-border px-3 py-2 text-text-soft">
                      {linha[INDICE.poder]}
                    </td>
                    <td className="border-b border-border px-3 py-2 text-text-soft">
                      {linha[INDICE.esfera]}
                    </td>
                    <td className="border-b border-border px-3 py-2 text-text-soft">
                      {linha[INDICE.municipio]}
                    </td>
                    <td className="border-b border-border px-3 py-2 text-right">
                      <CelulaItp itp={linha[INDICE.itp]} />
                    </td>
                    <td className="border-b border-border px-3 py-2 text-right font-tabular text-text-soft">
                      {formatarPct(linha[INDICE.pctEssenciais])}
                    </td>
                    <td className="border-b border-border px-3 py-2">
                      <BadgeNivel nivel={linha[INDICE.nivel]} />
                    </td>
                    <td className="border-b border-border px-3 py-2 text-right text-text-soft">
                      {rotuloValidada(linha[INDICE.validada])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CARTÕES — celular */}
          <ul className="mt-3 space-y-3 sm:hidden">
            {visiveis.map((linha) => (
              <li
                key={`${linha[INDICE.orgao]}-${linha[INDICE.poder]}`}
                className="min-w-0 rounded-xl border border-border bg-surface p-4 shadow-sm"
              >
                <p className="break-words font-display text-sm font-semibold text-text">
                  {linha[INDICE.orgao]}
                </p>
                <p className="mt-1 text-xs text-text-soft">
                  {linha[INDICE.poder]} · {linha[INDICE.esfera]} · {linha[INDICE.municipio]}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <BadgeNivel nivel={linha[INDICE.nivel]} />
                  <span className="font-tabular text-sm text-text">
                    ITP <CelulaItp itp={linha[INDICE.itp]} />
                  </span>
                  <span className="font-tabular text-xs text-text-soft">
                    essenciais {formatarPct(linha[INDICE.pctEssenciais])}
                  </span>
                  <span className="text-xs text-text-soft">
                    validada: {rotuloValidada(linha[INDICE.validada])}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* PAGINAÇÃO */}
          {totalPaginas > 1 && (
            <nav
              className="mt-4 flex flex-wrap items-center justify-between gap-3"
              aria-label="Paginação da tabela"
            >
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual <= 1}
                className="min-h-9 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="font-tabular text-sm text-text-soft">
                Página {paginaAtual} de {totalPaginas} ·{" "}
                {formatNumberBR(Math.min(POR_PAGINA, filtradas.length - (paginaAtual - 1) * POR_PAGINA))}{" "}
                por página
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual >= totalPaginas}
                className="min-h-9 rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
              >
                Próxima →
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
