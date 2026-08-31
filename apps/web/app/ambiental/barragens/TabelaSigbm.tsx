"use client";

import { useMemo, useState } from "react";
import Link from "@/lib/ambiental/link";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import {
  BARRAGENS_SIGBM,
  COBERTURA_SIGBM,
  ORDEM_CATEGORIA_RISCO,
  ORDEM_NIVEL_EMERGENCIA,
  ORDEM_SITUACAO,
  indiceOrdem,
  type BarragemSigbm,
} from "@/lib/ambiental/barragens-sigbm";

/**
 * As 320 barragens de mineração do SIGBM/ANM em Minas, buscáveis, filtráveis,
 * ordenáveis por coluna, com gráfico da distribuição por situação e exportação
 * em CSV do que está FILTRADO na tela.
 *
 * Componente de CLIENTE pelo mesmo motivo de sempre: busca/filtro pedem
 * estado, e o array (320 registros, ~92 KiB) cabe folgado no chunk de cliente
 * — o teto que manda é o do Worker (3 MiB gzip), que esta rota não ameaça.
 *
 * O vocabulário dos filtros é o LITERAL da fonte — "Emergência Nivel 1" (sem
 * "de"), "Nível de Alerta", "Em Descaracterização" — nunca uma paráfrase; e
 * "Nível de Alerta" é um estado separado de "Emergência Nivel 1..3", então
 * cada um tem seu balde, sem soma implícita.
 */

type ChaveColuna = keyof BarragemSigbm;
type Direcao = "asc" | "desc";
type Ordem = [ChaveColuna, Direcao];

const TODOS = "";

/** Ordinais por coluna — comparar o texto cru erraria (ex.: alfabeticamente
 *  "Alta" vem antes de "Baixa"). */
const ORDEM_POR_CHAVE: Partial<Record<ChaveColuna, readonly string[]>> = {
  situacao: ORDEM_SITUACAO,
  nivel_emergencia: ORDEM_NIVEL_EMERGENCIA,
  categoria_risco: ORDEM_CATEGORIA_RISCO,
};

const COR_POR_SITUACAO: Record<string, string> = {
  Ativa: "var(--color-ord-1)",
  Inativa: "var(--color-ord-2)",
  "Em Construção": "var(--color-ord-3)",
  "Em Descaracterização": "var(--color-ord-4)",
};

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function valorComparacao(b: BarragemSigbm, chave: ChaveColuna): string | number {
  const ordem = ORDEM_POR_CHAVE[chave];
  if (ordem) return indiceOrdem(ordem, b[chave] as string);
  const v = b[chave];
  if (v === null || v === undefined) return Number.NaN;
  if (chave === "data_finalizacao_dce") return Date.parse(v as string);
  return normalizar(String(v));
}

/** Mesma semântica do `ordenarPor` de `lib/tabela/ordenar.ts`: ausente vai
 *  para o FIM nas duas direções; a direção inverte só os presentes. */
function comparar(a: BarragemSigbm, b: BarragemSigbm, chave: ChaveColuna, direcao: Direcao): number {
  const va = valorComparacao(a, chave);
  const vb = valorComparacao(b, chave);
  const aAusente = typeof va === "number" && Number.isNaN(va);
  const bAusente = typeof vb === "number" && Number.isNaN(vb);
  if (aAusente && bAusente) return 0;
  if (aAusente) return 1;
  if (bAusente) return -1;
  if (va === vb) return 0;
  const c = va < vb ? -1 : 1;
  return c * (direcao === "asc" ? 1 : -1);
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function paraCsv(linhas: BarragemSigbm[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "id",
    "nome",
    "empreendedor",
    "uf",
    "municipio",
    "situacao",
    "nivel_emergencia",
    "categoria_risco",
    "dano_potencial",
    "fase_descaracterizacao",
    "data_finalizacao_dce",
  ].join(";");
  const corpo = linhas.map((b) =>
    [
      b.id,
      b.nome,
      b.empreendedor,
      b.uf,
      b.municipio,
      b.situacao,
      b.nivel_emergencia,
      b.categoria_risco,
      b.dano_potencial,
      b.fase_descaracterizacao ?? "",
      b.data_finalizacao_dce ?? "",
    ]
      .map(csvEscape)
      .join(";"),
  );
  return BOM + [cabecalho, ...corpo].join("\r\n") + "\r\n";
}

function baixarCsv(conteudo: string, nomeArquivo: string) {
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const COLUNAS: { chave: ChaveColuna; rotulo: string }[] = [
  { chave: "nome", rotulo: "Barragem" },
  { chave: "municipio", rotulo: "Município" },
  { chave: "empreendedor", rotulo: "Empreendedor" },
  { chave: "situacao", rotulo: "Situação" },
  { chave: "nivel_emergencia", rotulo: "Nível de emergência" },
  { chave: "categoria_risco", rotulo: "Categoria de risco" },
  { chave: "dano_potencial", rotulo: "Dano potencial" },
  { chave: "fase_descaracterizacao", rotulo: "Fase da descaracterização" },
  { chave: "data_finalizacao_dce", rotulo: "DCE finalizada em" },
];

export default function TabelaSigbm() {
  const [busca, setBusca] = useState("");
  const [municipio, setMunicipio] = useState(TODOS);
  const [empreendedor, setEmpreendedor] = useState(TODOS);
  const [situacao, setSituacao] = useState(TODOS);
  const [emergencia, setEmergencia] = useState(TODOS);
  const [risco, setRisco] = useState(TODOS);
  const [tag, setTag] = useState(TODOS);
  const [ordem, setOrdem] = useState<Ordem | null>(null);

  const opcoesTag = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const b of BARRAGENS_SIGBM) {
      for (const t of b.tags) {
        contagem.set(t, (contagem.get(t) ?? 0) + 1);
      }
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt"))
      .map(([t]) => t);
  }, []);

  const municipios = useMemo(
    () => [...new Set(BARRAGENS_SIGBM.map((b) => b.municipio))].sort((x, y) => x.localeCompare(y, "pt-BR")),
    [],
  );
  const empreendedores = useMemo(
    () => [...new Set(BARRAGENS_SIGBM.map((b) => b.empreendedor))].sort((x, y) => x.localeCompare(y, "pt-BR")),
    [],
  );

  const filtradas = useMemo(() => {
    const alvo = busca.trim() ? normalizar(busca) : "";
    return BARRAGENS_SIGBM.filter((b) => {
      if (municipio !== TODOS && b.municipio !== municipio) return false;
      if (empreendedor !== TODOS && b.empreendedor !== empreendedor) return false;
      if (situacao !== TODOS && b.situacao !== situacao) return false;
      if (emergencia !== TODOS && b.nivel_emergencia !== emergencia) return false;
      if (risco !== TODOS && b.categoria_risco !== risco) return false;
      if (tag !== TODOS && !b.tags.includes(tag)) return false;
      if (
        alvo &&
        !normalizar(b.nome).includes(alvo) &&
        !normalizar(b.empreendedor).includes(alvo) &&
        !normalizar(b.municipio).includes(alvo)
      ) {
        return false;
      }
      return true;
    });
  }, [busca, municipio, empreendedor, situacao, emergencia, risco, tag]);

  const ordenadas = useMemo(() => {
    if (!ordem) return filtradas;
    const [chave, direcao] = ordem;
    return [...filtradas].sort((a, b) => comparar(a, b, chave, direcao));
  }, [filtradas, ordem]);

  function alternarOrdem(chave: ChaveColuna) {
    setOrdem((atual) => {
      if (!atual || atual[0] !== chave) return [chave, "asc"];
      if (atual[1] === "asc") return [chave, "desc"];
      return null;
    });
  }

  function exportar() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(paraCsv(ordenadas), `barragens-sigbm-mg-${hoje}.csv`);
  }

  const porSituacao = COBERTURA_SIGBM.porSituacao;

  return (
    <div>
      {/* ═══ GRÁFICO — distribuição por situação operacional ═══ */}
      <figure>
        <p className="text-sm font-semibold opacity-80">Distribuição por situação operacional</p>
        <div className="sr-only">
          {porSituacao
            .map(
              (s) =>
                `${s.valor}: ${formatNumberBR(s.total)} ${s.total === 1 ? "barragem" : "barragens"}`,
            )
            .join("; ") + `. Total: ${formatNumberBR(COBERTURA_SIGBM.total)}.`}
        </div>
        <div aria-hidden className="mt-3 space-y-2">
          {porSituacao.map((s) => (
            <div key={s.valor} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-right text-[.82em] opacity-75" title={s.valor}>
                {s.valor}
              </span>
              <div className="cp-ord-track h-4 flex-1 overflow-hidden">
                <div
                  className="cp-ord-seg h-full first:rounded-l-[3px] last:rounded-r-[3px]"
                  style={{
                    width: `${(s.total / COBERTURA_SIGBM.total) * 100}%`,
                    background: COR_POR_SITUACAO[s.valor],
                  }}
                  title={`${s.valor}: ${formatNumberBR(s.total)}`}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-tabular text-[.85em] opacity-80">
                {formatNumberBR(s.total)}
              </span>
            </div>
          ))}
        </div>
        <figcaption className="mt-3 text-xs opacity-60">
          Situação como a ANM publica no cadastro — as 73 em descaracterização aqui são o registro
          federal, fonte diferente das 45 acompanhadas pelo MPMG em{" "}
          <Link href="/barragens/descaracterizacao" className="underline">
            /barragens/descaracterizacao
          </Link>
          .
        </figcaption>
      </figure>

      {/* ═══ FILTROS ═══ */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="block text-[.82em] font-medium opacity-70">Buscar</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome da barragem, empreendedor ou município…"
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          />
        </label>
        <label>
          <span className="block text-[.82em] font-medium opacity-70">Município</span>
          <select
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium opacity-70">Empreendedor</span>
          <select
            value={empreendedor}
            onChange={(e) => setEmpreendedor(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {empreendedores.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium opacity-70">Situação</span>
          <select
            value={situacao}
            onChange={(e) => setSituacao(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todas</option>
            {ORDEM_SITUACAO.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium opacity-70">Nível de emergência</span>
          <select
            value={emergencia}
            onChange={(e) => setEmergencia(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todos</option>
            {ORDEM_NIVEL_EMERGENCIA.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium opacity-70">Categoria de risco</span>
          <select
            value={risco}
            onChange={(e) => setRisco(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todas</option>
            {ORDEM_CATEGORIA_RISCO.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-[.82em] font-medium opacity-70">Tag</span>
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
          >
            <option value={TODOS}>Todas</option>
            {opcoesTag.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[.88em] opacity-75" role="status">
          {formatNumberBR(ordenadas.length)} de {formatNumberBR(COBERTURA_SIGBM.total)} barragens
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={ordenadas.length === 0}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-[.85em] font-medium hover:border-primary disabled:opacity-50"
        >
          Baixar CSV do filtrado ({formatNumberBR(ordenadas.length)})
        </button>
      </div>

      {/* ═══ TABELA ORDENÁVEL ═══ */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {COLUNAS.map((c) => {
                const ativa = ordem?.[0] === c.chave;
                const rotulo = ativa
                  ? `${c.rotulo} (${ordem![1] === "asc" ? "crescente" : "decrescente"})`
                  : c.rotulo;
                return (
                  <th
                    key={c.chave}
                    scope="col"
                    aria-sort={ativa ? (ordem![1] === "asc" ? "ascending" : "descending") : "none"}
                    className="whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-left text-xs uppercase tracking-wide opacity-70"
                  >
                    <button
                      type="button"
                      onClick={() => alternarOrdem(c.chave)}
                      aria-label={`Ordenar por ${c.rotulo}`}
                      title={`Ordenar por ${c.rotulo}`}
                      className={`inline-flex items-center gap-1 rounded transition-colors hover:opacity-100 ${
                        ativa ? "opacity-100" : ""
                      }`}
                    >
                      {c.rotulo}
                      <span aria-hidden="true" className="font-tabular text-[0.8em]">
                        {ativa ? (ordem![1] === "asc" ? "▲" : "▼") : "⇅"}
                      </span>
                    </button>
                  </th>
                );
              })}
              <th
                scope="col"
                className="whitespace-nowrap border-b border-border bg-surface px-3 py-2 text-left text-xs uppercase tracking-wide opacity-70"
              >
                Tags
              </th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((b) => (
              <tr key={b.id} className="border-b border-border/60">
                <td className="px-3 py-2 font-medium">{b.nome}</td>
                <td className="whitespace-nowrap px-3 py-2">{b.municipio}</td>
                <td className="px-3 py-2">{b.empreendedor}</td>
                <td className="whitespace-nowrap px-3 py-2">{b.situacao}</td>
                <td className="whitespace-nowrap px-3 py-2">{b.nivel_emergencia}</td>
                <td className="whitespace-nowrap px-3 py-2">{b.categoria_risco}</td>
                <td className="whitespace-nowrap px-3 py-2">{b.dano_potencial}</td>
                <td className="px-3 py-2">{b.fase_descaracterizacao ?? "—"}</td>
                <td className="whitespace-nowrap px-3 py-2">
                  {b.data_finalizacao_dce ? formatDateBR(b.data_finalizacao_dce) : "—"}
                </td>
                <td className="px-3 py-2">
                  {b.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {b.tags.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTag(t)}
                          className="rounded-full border border-border px-2 py-0.5 text-xs opacity-80 transition-colors hover:border-primary hover:opacity-100"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ordenadas.length === 0 && (
        <p className="mt-4 text-sm opacity-70">
          Nenhuma barragem com esses filtros. O SIGBM publica {formatNumberBR(COBERTURA_SIGBM.total)}{" "}
          barragens de mineração em MG; o vazio aqui é resposta dos filtros, não ausência de cadastro.
        </p>
      )}
    </div>
  );
}
