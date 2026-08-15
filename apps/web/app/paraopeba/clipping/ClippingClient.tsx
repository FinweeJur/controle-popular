"use client";

import { useMemo, useState } from "react";
import {
  CLIPPING_PARAOPEBA,
  TIPO_NOTICIA_LABEL,
  type NoticiaClipping,
  type TipoNoticia,
  CLIPPING_ATI,
  ATI_LABEL,
  ATI_REGIOES,
  TEMA_ATI_LABEL,
  TEMA_ATI_ORDEM,
  PERIODO_CLIPPING_ATI,
  type NoticiaAti,
  type SiglaAti,
  type TemaAti,
} from "@/lib/paraopeba";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

/**
 * `/paraopeba/clipping` — dois acervos, dois filtros, um componente.
 *
 * ═══ POR QUE AS ATIs VÊM PRIMEIRO ═══
 *
 * Pedido do dono, e ele tem razão de conteúdo: as três Assessorias Técnicas
 * Independentes foram **eleitas pelas comunidades atingidas** e escrevem do
 * lado de quem foi atingido. O clipping geral é cobertura sobre o caso; o
 * das ATIs é a voz da assessoria da população. Ordem de leitura importa.
 *
 * ═══ POR QUE OS FILTROS VOLTARAM ═══
 *
 * O painel-fonte tinha busca, intervalo de data, ordenação, recorte por
 * fonte e por tema, com contador e "limpar filtros" — e a primeira ingestão
 * trouxe só um `select` de ano. Com 46 + 149 itens, sem filtro a página é
 * uma parede: o acervo existe mas não é consultável. Aqui os dois blocos
 * têm a mesma barra (Buscar · De · Até · Ordenar · contador · Limpar), o
 * que muda são os recortes próprios de cada acervo.
 *
 * Estado local, sem `useSearchParams()`: não precisa de link compartilhável
 * e evita o `<Suspense>` que `ListaProjetos.tsx` precisa por ler a query.
 * Os dois acervos cabem em memória (~195 itens), filtrar aqui é suficiente.
 */

type Ordem = "recente" | "antigo" | "az";

const TODOS_OS_TIPOS = Object.keys(TIPO_NOTICIA_LABEL) as TipoNoticia[];
const TODAS_AS_ATIS = Object.keys(ATI_LABEL) as SiglaAti[];

/** Vazio = sem limite. Compara ISO como string: `2025-03-14` ordena sozinho. */
function dentroDoIntervalo(data: string, de: string, ate: string): boolean {
  if (de && data < de) return false;
  if (ate && data > ate) return false;
  return true;
}

/** Busca no que o painel-fonte buscava: título, resumo, fonte e tags. */
function casaBusca(termo: string, campos: string[], tags: string[]): boolean {
  const t = termo.toLowerCase().trim();
  if (!t) return true;
  return (
    campos.some((c) => c.toLowerCase().includes(t)) ||
    tags.some((tag) => tag.toLowerCase().includes(t))
  );
}

function faixaDeDatas(datas: string[]): { min: string; max: string } {
  const ordenadas = [...datas].sort();
  return { min: ordenadas[0], max: ordenadas[ordenadas.length - 1] };
}

export default function ClippingClient() {
  return (
    <>
      <SecaoAti />
      <SecaoClipping />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Bloco 1 — Clipping das ATIs (logo depois da hero)
// ══════════════════════════════════════════════════════════════════════════

function SecaoAti() {
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [atisAtivas, setAtisAtivas] = useState<Set<SiglaAti>>(new Set(TODAS_AS_ATIS));
  const [tema, setTema] = useState<TemaAti | "todos">("todos");

  const faixa = useMemo(() => faixaDeDatas(CLIPPING_ATI.map((n) => n.data)), []);

  const lista = useMemo(() => {
    const filtrada = CLIPPING_ATI.filter(
      (n) =>
        atisAtivas.has(n.ati) &&
        (tema === "todos" || n.tema === tema) &&
        dentroDoIntervalo(n.data, de, ate) &&
        casaBusca(busca, [n.titulo, n.resumo, n.fonte], n.tags)
    );
    return ordenar(filtrada, ordem, (n) => ATI_LABEL[n.ati]);
  }, [atisAtivas, tema, de, ate, busca, ordem]);

  /**
   * Agrupa por tema como o painel-fonte agrupava — a ordenação escolhida
   * vale dentro de cada tema. É o que torna o acervo legível: 46 itens
   * soltos não mostram que a disputa está concentrada em perícias.
   */
  const grupos = useMemo(
    () =>
      TEMA_ATI_ORDEM.map((t) => ({ tema: t, itens: lista.filter((n) => n.tema === t) })).filter(
        (g) => g.itens.length > 0
      ),
    [lista]
  );

  const filtroAtivo =
    busca !== "" || de !== "" || ate !== "" || ordem !== "recente" || tema !== "todos" ||
    atisAtivas.size !== TODAS_AS_ATIS.length;

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setOrdem("recente");
    setAtisAtivas(new Set(TODAS_AS_ATIS));
    setTema("todos");
  }

  return (
    <section className="mt-10" aria-labelledby="titulo-ati">
      <h2
        id="titulo-ati"
        className="font-display text-[clamp(1.25em,2.6vw,1.6em)] leading-tight font-bold tracking-tight"
      >
        Notícias das assessorias técnicas independentes
      </h2>
      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        As três ATIs foram <strong className="text-text">eleitas pelas comunidades atingidas</strong>{" "}
        e dividem as cinco regiões do processo:{" "}
        {TODAS_AS_ATIS.map((s, i) => (
          <span key={s}>
            {i > 0 ? ", " : ""}
            <strong className="text-text">{ATI_LABEL[s]}</strong> ({ATI_REGIOES[s]})
          </span>
        ))}
        . Acervo de {formatDateBR(PERIODO_CLIPPING_ATI.de)} a{" "}
        {formatDateBR(PERIODO_CLIPPING_ATI.ate)}, classificado por eixo da reparação — como no
        painel-fonte, não recalculado pelo portal.
      </p>

      <BarraFiltros
        idPrefixo="ati"
        busca={busca}
        setBusca={setBusca}
        de={de}
        setDe={setDe}
        ate={ate}
        setAte={setAte}
        ordem={ordem}
        setOrdem={setOrdem}
        rotuloAz="ATI (A–Z)"
        faixa={faixa}
        exibidos={lista.length}
        total={CLIPPING_ATI.length}
        filtroAtivo={filtroAtivo}
        onLimpar={limpar}
      />

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por ATI">
        {TODAS_AS_ATIS.map((sigla) => (
          <BotaoAlternar
            key={sigla}
            ativo={atisAtivas.has(sigla)}
            onClick={() =>
              setAtisAtivas((atual) => {
                const novo = new Set(atual);
                if (novo.has(sigla)) novo.delete(sigla);
                else novo.add(sigla);
                return novo;
              })
            }
          >
            {ATI_LABEL[sigla]}
          </BotaoAlternar>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tema">
        <BotaoAlternar ativo={tema === "todos"} onClick={() => setTema("todos")}>
          Todos os temas
        </BotaoAlternar>
        {TEMA_ATI_ORDEM.map((t) => (
          <BotaoAlternar key={t} ativo={tema === t} onClick={() => setTema(t)}>
            {TEMA_ATI_LABEL[t]}
          </BotaoAlternar>
        ))}
      </div>

      {grupos.map((g) => (
        <div key={g.tema} className="mt-6">
          <h3 className="border-b border-border pb-1.5 font-display text-base font-semibold text-text">
            {TEMA_ATI_LABEL[g.tema]}{" "}
            <span className="font-normal text-text-soft">({formatNumberBR(g.itens.length)})</span>
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {g.itens.map((n) => (
              <ItemAti key={n.id} noticia={n} onTag={setBusca} />
            ))}
          </ul>
        </div>
      ))}

      {lista.length === 0 && <SemResultado onLimpar={limpar} />}
    </section>
  );
}

function ItemAti({ noticia, onTag }: { noticia: NoticiaAti; onTag: (t: string) => void }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">{noticia.titulo}</p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {ATI_LABEL[noticia.ati]}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {formatDateBR(noticia.data)} · {noticia.fonte}
      </p>
      <p className="mt-2 text-sm text-text-soft">{noticia.resumo}</p>
      <ListaTags tags={noticia.tags} onTag={onTag} />
      <a
        href={noticia.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Ver o material na fonte original ↗
      </a>
    </li>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Bloco 2 — Clipping geral (o que já estava no portal)
// ══════════════════════════════════════════════════════════════════════════

function SecaoClipping() {
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [tiposAtivos, setTiposAtivos] = useState<Set<TipoNoticia>>(new Set(TODOS_OS_TIPOS));

  const faixa = useMemo(() => faixaDeDatas(CLIPPING_PARAOPEBA.map((n) => n.data)), []);

  const lista = useMemo(() => {
    const filtrada = CLIPPING_PARAOPEBA.filter(
      (n) =>
        tiposAtivos.has(n.tipo) &&
        dentroDoIntervalo(n.data, de, ate) &&
        casaBusca(busca, [n.titulo, n.resumo, n.portal], n.tags)
    );
    return ordenar(filtrada, ordem, (n) => n.portal);
  }, [tiposAtivos, de, ate, busca, ordem]);

  const filtroAtivo =
    busca !== "" || de !== "" || ate !== "" || ordem !== "recente" ||
    tiposAtivos.size !== TODOS_OS_TIPOS.length;

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setOrdem("recente");
    setTiposAtivos(new Set(TODOS_OS_TIPOS));
  }

  return (
    <section className="mt-14 border-t border-border pt-10" aria-labelledby="titulo-clipping">
      <h2
        id="titulo-clipping"
        className="font-display text-[clamp(1.25em,2.6vw,1.6em)] leading-tight font-bold tracking-tight"
      >
        Clipping geral — imprensa, instituições e movimento
      </h2>
      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        Cobertura reunida à mão sobre o caso, separada pelo tipo de veículo que publicou.
      </p>

      <BarraFiltros
        idPrefixo="clip"
        busca={busca}
        setBusca={setBusca}
        de={de}
        setDe={setDe}
        ate={ate}
        setAte={setAte}
        ordem={ordem}
        setOrdem={setOrdem}
        rotuloAz="Portal (A–Z)"
        faixa={faixa}
        exibidos={lista.length}
        total={CLIPPING_PARAOPEBA.length}
        filtroAtivo={filtroAtivo}
        onLimpar={limpar}
      />

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por fonte">
        {TODOS_OS_TIPOS.map((tipo) => (
          <BotaoAlternar
            key={tipo}
            ativo={tiposAtivos.has(tipo)}
            onClick={() =>
              setTiposAtivos((atual) => {
                const novo = new Set(atual);
                if (novo.has(tipo)) novo.delete(tipo);
                else novo.add(tipo);
                return novo;
              })
            }
          >
            {TIPO_NOTICIA_LABEL[tipo]}
          </BotaoAlternar>
        ))}
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {lista.map((n) => (
          <ItemNoticia key={n.id} noticia={n} onTag={setBusca} />
        ))}
      </ul>

      {lista.length === 0 && <SemResultado onLimpar={limpar} />}
    </section>
  );
}

function ItemNoticia({ noticia, onTag }: { noticia: NoticiaClipping; onTag: (t: string) => void }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">{noticia.titulo}</p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {TIPO_NOTICIA_LABEL[noticia.tipo]}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {formatDateBR(noticia.data)} · {noticia.portal}
      </p>
      <p className="mt-2 text-sm text-text-soft">{noticia.resumo}</p>
      <ListaTags tags={noticia.tags} onTag={onTag} />
      <a
        href={noticia.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Ver a notícia na fonte original ↗
      </a>
    </li>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Peças compartilhadas
// ══════════════════════════════════════════════════════════════════════════

/** Ordena sem mutar o array do módulo — `CLIPPING_*` é constante importada. */
function ordenar<T extends { data: string }>(
  itens: T[],
  ordem: Ordem,
  chaveAz: (item: T) => string
): T[] {
  const copia = [...itens];
  if (ordem === "recente") return copia.sort((a, b) => b.data.localeCompare(a.data));
  if (ordem === "antigo") return copia.sort((a, b) => a.data.localeCompare(b.data));
  return copia.sort(
    (a, b) => chaveAz(a).localeCompare(chaveAz(b), "pt") || b.data.localeCompare(a.data)
  );
}

interface PropsBarra {
  idPrefixo: string;
  busca: string;
  setBusca: (v: string) => void;
  de: string;
  setDe: (v: string) => void;
  ate: string;
  setAte: (v: string) => void;
  ordem: Ordem;
  setOrdem: (v: Ordem) => void;
  rotuloAz: string;
  faixa: { min: string; max: string };
  exibidos: number;
  total: number;
  filtroAtivo: boolean;
  onLimpar: () => void;
}

function BarraFiltros(p: PropsBarra) {
  const campo =
    "rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none";
  return (
    <div
      role="search"
      aria-label="Filtros"
      className="mt-5 rounded-2xl border border-border bg-surface-2 p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[200px] flex-[2] flex-col">
          <label htmlFor={`${p.idPrefixo}-busca`} className="mb-1 text-xs font-medium text-text-soft">
            Buscar
          </label>
          <input
            id={`${p.idPrefixo}-busca`}
            type="search"
            value={p.busca}
            onChange={(e) => p.setBusca(e.target.value)}
            placeholder="Título, resumo, fonte ou tag…"
            className={campo}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor={`${p.idPrefixo}-de`} className="mb-1 text-xs font-medium text-text-soft">
            De
          </label>
          <input
            id={`${p.idPrefixo}-de`}
            type="date"
            value={p.de}
            min={p.faixa.min}
            max={p.faixa.max}
            onChange={(e) => p.setDe(e.target.value)}
            className={campo}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor={`${p.idPrefixo}-ate`} className="mb-1 text-xs font-medium text-text-soft">
            Até
          </label>
          <input
            id={`${p.idPrefixo}-ate`}
            type="date"
            value={p.ate}
            min={p.faixa.min}
            max={p.faixa.max}
            onChange={(e) => p.setAte(e.target.value)}
            className={campo}
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor={`${p.idPrefixo}-ordem`}
            className="mb-1 text-xs font-medium text-text-soft"
          >
            Ordenar
          </label>
          <select
            id={`${p.idPrefixo}-ordem`}
            value={p.ordem}
            onChange={(e) => p.setOrdem(e.target.value as Ordem)}
            className={campo}
          >
            <option value="recente">Mais recente</option>
            <option value="antigo">Mais antigo</option>
            <option value="az">{p.rotuloAz}</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-text-soft">
          Exibindo <strong className="text-text">{formatNumberBR(p.exibidos)}</strong> de{" "}
          {formatNumberBR(p.total)}
        </p>
        <button
          type="button"
          onClick={p.onLimpar}
          disabled={!p.filtroAtivo}
          className="cp-btn-anim rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-soft transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}

function BotaoAlternar({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`cp-btn-anim rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        ativo
          ? "border-primary bg-primary text-primary-ink"
          : "border-border bg-surface text-text-soft"
      }`}
    >
      {children}
    </button>
  );
}

/** Tag clicável joga o termo na busca — mesmo gesto do painel-fonte. */
function ListaTags({ tags, onTag }: { tags: string[]; onTag: (t: string) => void }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onTag(t)}
          aria-label={`Filtrar por: ${t}`}
          className="cp-btn-anim rounded-full bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft transition-colors hover:bg-primary hover:text-primary-ink"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function SemResultado({ onLimpar }: { onLimpar: () => void }) {
  return (
    <p className="mt-6 rounded-2xl border border-border bg-surface p-5 text-sm text-text-soft">
      Nenhum resultado para os filtros selecionados.{" "}
      <button
        type="button"
        onClick={onLimpar}
        className="font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Limpar filtros
      </button>
      .
    </p>
  );
}
