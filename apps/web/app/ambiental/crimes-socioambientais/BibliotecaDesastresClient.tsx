"use client";

import { useEffect, useMemo, useState } from "react";

import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import {
  DESASTRE_LABEL,
  DESASTRE_SELO,
  ESFERA_LABEL,
  distribuicaoPor,
  distribuicaoPorAno,
  filtrarItens,
  type BibliotecaDesastres,
  type Desastre,
  type EsferaDesastre,
  type ItemDesastre,
} from "@/lib/ambiental/desastres";

/**
 * `/ambiental/crimes-socioambientais` — biblioteca unificada de documentos dos
 * dois crimes socioambientais de barragens (Mariana 2015, Brumadinho 2019).
 *
 * ═══ POR QUE OS DADOS VÊM POR FETCH, NÃO POR IMPORT ═══
 *
 * O array mora em `public/data/biblioteca-desastres.json` (asset servido como
 * estático) e o cliente o busca UMA vez por sessão com cache de módulo — mesmo
 * padrão de `PainelTac.tsx` e `ConveniosClient.tsx`. O servidor renderiza só
 * os cartões/gráfico a partir de `COBERTURA_BIBLIOTECA_DESASTRES` (nunca o
 * array inteiro), respeitando o teto de payload do AGENTS.md.
 *
 * ═══ MARIANA NÃO É BRUMADINHO ═══
 *
 * `desastre` é campo obrigatório de cada item; os dois casos ficam separados
 * por chips com contagem. A tela abre com o desastre em foco (vindo de
 * `?desastre=` na URL — `/paraopeba` envia `brumadinho`, `/ambiental/mariana`
 * envia `mariana`; entrada direta mostra os dois com o selo de cada item), e
 * clicar no chip do outro caso amplia. Nenhum agregado mistura os dois sem
 * rótulo.
 */

type Ordem = "recente" | "antigo" | "az" | "orgao";

const LOTE = 40;

let cacheAcervo: Promise<BibliotecaDesastres> | null = null;

function buscarAcervo(): Promise<BibliotecaDesastres> {
  if (!cacheAcervo) {
    cacheAcervo = fetch("/data/biblioteca-desastres.json")
      .then((r) => {
        if (!r.ok) throw new Error(`biblioteca-desastres devolveu ${r.status}`);
        return r.json() as Promise<BibliotecaDesastres>;
      })
      .catch((err) => {
        cacheAcervo = null; // próxima chamada tenta de novo
        throw err;
      });
  }
  return cacheAcervo;
}

/** Lê o desastre da URL (`?desastre=mariana|brumadinho`), se houver. */
function desastreInicial(): Set<Desastre> {
  if (typeof window === "undefined") return new Set<Desastre>(["mariana", "brumadinho"]);
  const valor = new URLSearchParams(window.location.search).get("desastre");
  if (valor === "mariana") return new Set<Desastre>(["mariana"]);
  if (valor === "brumadinho") return new Set<Desastre>(["brumadinho"]);
  return new Set<Desastre>(["mariana", "brumadinho"]);
}

function opcoes(valores: { valor: string; count: number }[]): string[] {
  return valores.map((v) => v.valor);
}

export default function BibliotecaDesastresClient() {
  const [acervo, setAcervo] = useState<BibliotecaDesastres | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [desastres, setDesastres] = useState<Set<Desastre>>(desastreInicial);
  const [esferas, setEsferas] = useState<Set<EsferaDesastre>>(new Set());
  const [orgao, setOrgao] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [ano, setAno] = useState("todos");
  const [uf, setUf] = useState("todos");
  const [tag, setTag] = useState("todos");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [visiveis, setVisiveis] = useState(LOTE);

  useEffect(() => {
    buscarAcervo()
      .then(setAcervo)
      .catch((e) => setErro(String(e?.message ?? e)));
  }, []);

  const itens = acervo?.itens ?? [];

  const faixa = useMemo(() => {
    const datas = itens.map((i) => i.data).filter((d): d is string => Boolean(d)).sort();
    return { min: datas[0] ?? "", max: datas[datas.length - 1] ?? "" };
  }, [itens]);

  const orgaos = useMemo(() => opcoes(distribuicaoPor(itens, "orgao")), [itens]);
  const tipos = useMemo(() => opcoes(distribuicaoPor(itens, "tipo")), [itens]);
  const ufs = useMemo(() => opcoes(distribuicaoPor(itens, "uf")), [itens]);
  const anos = useMemo(
    () => distribuicaoPorAno(itens).filter((a) => a.ano > 0).map((a) => String(a.ano)),
    [itens]
  );
  const tags = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const i of itens) for (const t of i.tags) mapa.set(t, (mapa.get(t) ?? 0) + 1);
    return [...mapa.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [itens]);

  const lista = useMemo(() => {
    const filtrada = filtrarItens(itens, {
      busca,
      desastres,
      esferas,
      orgao,
      tipo,
      ano,
      uf,
      tag,
      de,
      ate,
    });
    const copia = [...filtrada];
    if (ordem === "az") {
      return copia.sort(
        (a, b) => a.titulo.localeCompare(b.titulo, "pt") || (b.data ?? "").localeCompare(a.data ?? "")
      );
    }
    if (ordem === "orgao") {
      return copia.sort(
        (a, b) => a.orgao.localeCompare(b.orgao, "pt") || (b.data ?? "").localeCompare(a.data ?? "")
      );
    }
    const sinal = ordem === "recente" ? -1 : 1;
    return copia.sort((a, b) => sinal * (a.data ?? "").localeCompare(b.data ?? ""));
  }, [itens, busca, desastres, esferas, orgao, tipo, ano, uf, tag, de, ate, ordem]);

  const filtroAtivo =
    busca !== "" ||
    de !== "" ||
    ate !== "" ||
    ordem !== "recente" ||
    orgao !== "todos" ||
    tipo !== "todos" ||
    ano !== "todos" ||
    uf !== "todos" ||
    tag !== "todos" ||
    desastres.size !== 2 ||
    esferas.size !== 0;

  function atualizarDesastres(d: Desastre) {
    setDesastres((atual) => {
      const novo = new Set(atual);
      if (novo.has(d)) novo.delete(d);
      else novo.add(d);
      // Espelha na URL para o link ser compartilhável (e a abertura refletir).
      const params = new URLSearchParams(window.location.search);
      if (novo.size === 1) params.set("desastre", [...novo][0]);
      else params.delete("desastre");
      window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
      return novo;
    });
    setVisiveis(LOTE);
  }

  function limpar() {
    setBusca("");
    setDesastres(new Set<Desastre>(["mariana", "brumadinho"]));
    setEsferas(new Set());
    setOrgao("todos");
    setTipo("todos");
    setAno("todos");
    setUf("todos");
    setTag("todos");
    setDe("");
    setAte("");
    setOrdem("recente");
    setVisiveis(LOTE);
    const params = new URLSearchParams(window.location.search);
    params.delete("desastre");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  }

  function exportarCsv() {
    const hoje = new Date().toISOString().slice(0, 10);
    baixarCsv(COLUNAS, lista, `biblioteca-desastres-${hoje}.csv`);
  }

  const campo =
    "rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none";

  if (erro) {
    return (
      <section className="mt-8" aria-label="Biblioteca de documentos">
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-soft">
          A biblioteca ainda não pôde ser carregada nesta instalação. Rode{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5">
            npx tsx scripts/agregar-biblioteca-desastres.mts
          </code>{" "}
          e reconstrua o site. A lista abaixo está vazia porque o arquivo não existe — não porque
          não há documentos.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="titulo-acervo">
      <h2 id="titulo-acervo" className="sr-only">
        Biblioteca de documentos filtrável
      </h2>

      {/* ═══ SEPARADOR POR DESASTRE — Mariana ≠ Brumadinho ═══ */}
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filtrar por desastre">
        <span className="inline-flex items-center text-xs font-medium uppercase tracking-wide text-text-soft">
          Caso:
        </span>
        {(["mariana", "brumadinho"] as Desastre[]).map((d) => {
          const ativo = desastres.has(d);
          const total = itens.filter((i) => i.desastre === d).length;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={ativo}
              onClick={() => atualizarDesastres(d)}
              className={`cp-btn-anim rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                ativo
                  ? "border-primary bg-primary text-primary-ink"
                  : "border-border bg-surface text-text-soft"
              }`}
            >
              {DESASTRE_LABEL[d]}{" "}
              <span className={ativo ? "opacity-80" : "opacity-60"}>{formatNumberBR(total)}</span>
            </button>
          );
        })}
        <span className="inline-flex items-center text-xs text-text-soft">
          A tela abre com o caso em foco; clique no outro para ampliar.
        </span>
      </div>

      {/* ═══ FILTROS ═══ */}
      <div role="search" aria-label="Filtros" className="rounded-2xl border border-border bg-surface-2 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-[2] flex-col">
            <label htmlFor="bib-busca" className="mb-1 text-xs font-medium text-text-soft">
              Buscar
            </label>
            <input
              id="bib-busca"
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setVisiveis(LOTE);
              }}
              placeholder="Título, órgão, tipo, tag…"
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="bib-de" className="mb-1 text-xs font-medium text-text-soft">
              De
            </label>
            <input
              id="bib-de"
              type="date"
              value={de}
              min={faixa.min}
              max={faixa.max}
              onChange={(e) => setDe(e.target.value)}
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="bib-ate" className="mb-1 text-xs font-medium text-text-soft">
              Até
            </label>
            <input
              id="bib-ate"
              type="date"
              value={ate}
              min={faixa.min}
              max={faixa.max}
              onChange={(e) => setAte(e.target.value)}
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="bib-ordem" className="mb-1 text-xs font-medium text-text-soft">
              Ordenar
            </label>
            <select
              id="bib-ordem"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as Ordem)}
              className={campo}
            >
              <option value="recente">Mais recente</option>
              <option value="antigo">Mais antigo</option>
              <option value="az">Título (A–Z)</option>
              <option value="orgao">Órgão</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="flex flex-col">
            <label htmlFor="bib-esfera" className="mb-1 text-xs font-medium text-text-soft">
              Esfera
            </label>
            <select
              id="bib-esfera"
              value={esferas.size === 0 ? "todas" : [...esferas][0]}
              onChange={(e) => {
                const v = e.target.value;
                setEsferas(v === "todas" ? new Set() : new Set<EsferaDesastre>([v as EsferaDesastre]));
                setVisiveis(LOTE);
              }}
              className={campo}
            >
              <option value="todas">Todas</option>
              {(Object.keys(ESFERA_LABEL) as EsferaDesastre[]).map((s) => (
                <option key={s} value={s}>
                  {ESFERA_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="bib-orgao" className="mb-1 text-xs font-medium text-text-soft">
              Órgão
            </label>
            <select
              id="bib-orgao"
              value={orgao}
              onChange={(e) => {
                setOrgao(e.target.value);
                setVisiveis(LOTE);
              }}
              className={campo}
            >
              <option value="todos">Todos</option>
              {orgaos.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="bib-tipo" className="mb-1 text-xs font-medium text-text-soft">
              Formato
            </label>
            <select
              id="bib-tipo"
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setVisiveis(LOTE);
              }}
              className={campo}
            >
              <option value="todos">Todos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="bib-ano" className="mb-1 text-xs font-medium text-text-soft">
              Ano
            </label>
            <select
              id="bib-ano"
              value={ano}
              onChange={(e) => {
                setAno(e.target.value);
                setVisiveis(LOTE);
              }}
              className={campo}
            >
              <option value="todos">Todos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="bib-uf" className="mb-1 text-xs font-medium text-text-soft">
              UF
            </label>
            <select
              id="bib-uf"
              value={uf}
              onChange={(e) => {
                setUf(e.target.value);
                setVisiveis(LOTE);
              }}
              className={campo}
            >
              <option value="todos">Todas</option>
              {ufs.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="bib-tag" className="mb-1 text-xs font-medium text-text-soft">
              Tag
            </label>
            <select
              id="bib-tag"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value);
                setVisiveis(LOTE);
              }}
              className={campo}
            >
              <option value="todos">Todas</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-text-soft">
            Exibindo{" "}
            <strong className="text-text">{formatNumberBR(Math.min(visiveis, lista.length))}</strong> de{" "}
            {formatNumberBR(lista.length)}
            {lista.length !== itens.length && ` (acervo: ${formatNumberBR(itens.length)})`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportarCsv}
              disabled={lista.length === 0}
              className="cp-btn-anim rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-soft transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
            >
              Baixar CSV do filtrado ({formatNumberBR(lista.length)})
            </button>
            <button
              type="button"
              onClick={limpar}
              disabled={!filtroAtivo}
              className="cp-btn-anim rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-soft transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
            >
              Limpar filtros
            </button>
          </div>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {lista.slice(0, visiveis).map((item) => (
          <ItemDaBiblioteca key={item.id} item={item} onTermo={setBusca} />
        ))}
      </ul>

      {visiveis < lista.length && (
        <button
          type="button"
          onClick={() => setVisiveis((v) => v + LOTE)}
          className="cp-btn-anim mt-5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-text-soft transition-colors hover:text-text"
        >
          Ver mais {formatNumberBR(Math.min(LOTE, lista.length - visiveis))} de{" "}
          {formatNumberBR(lista.length - visiveis)} restantes
        </button>
      )}

      {lista.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-5 text-sm text-text-soft">
          Nenhum resultado para os filtros selecionados.{" "}
          <button
            type="button"
            onClick={limpar}
            className="font-medium text-primary underline underline-offset-2 hover:text-accent"
          >
            Limpar filtros
          </button>
          .
        </p>
      )}
    </section>
  );
}

const COLUNAS: ColunaCsv<ItemDesastre>[] = [
  { chave: "desastre", rotulo: "desastre", formatar: (v) => DESASTRE_LABEL[v as Desastre] },
  { chave: "data", rotulo: "data" },
  { chave: "titulo", rotulo: "titulo" },
  { chave: "tipo", rotulo: "formato" },
  { chave: "orgao", rotulo: "orgao" },
  { chave: "esfera", rotulo: "esfera", formatar: (v) => ESFERA_LABEL[v as EsferaDesastre] },
  { chave: "uf", rotulo: "uf" },
  { chave: "tags", rotulo: "tags", formatar: (v) => (v as string[]).join(" | ") },
  { chave: "resumo", rotulo: "resumo" },
  { chave: "url", rotulo: "url" },
];

function ItemDaBiblioteca({ item, onTermo }: { item: ItemDesastre; onTermo: (t: string) => void }) {
  const ehNacab = item.fonteId === "biblioteca-atis" && item.orgao === "NACAB";
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">{item.titulo}</p>
        <div className="flex shrink-0 gap-1.5">
          <span
            className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft"
            title="Caso a que o documento se refere"
          >
            {DESASTRE_SELO[item.desastre]}
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
            {ESFERA_LABEL[item.esfera]}
          </span>
        </div>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {item.data ? formatDateBR(item.data) : "sem data na fonte"} · {item.orgao}
        {item.uf !== "BR" ? ` · ${item.uf}` : ""}
        {item.tipo !== item.tipoOrigem ? ` · ${item.tipo}` : ""}
      </p>
      {item.resumo && <p className="mt-2 text-sm text-text-soft">{item.resumo}</p>}
      {item.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTermo(t)}
              aria-label={`Filtrar por tag: ${t}`}
              className="cp-btn-anim rounded-full border border-border bg-surface px-2 py-0.5 text-[.72em] text-text-soft transition-colors hover:border-primary hover:text-primary"
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        {ehNacab ? "Abrir arquivo na fonte original ↗" : "Abrir na fonte original ↗"}
      </a>
    </li>
  );
}
