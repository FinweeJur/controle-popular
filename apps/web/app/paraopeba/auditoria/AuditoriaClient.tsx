"use client";

import { useMemo, useState } from "react";
import {
  AUDITORIA_AJRI,
  AUTOR_AUDITORIA_AJRI,
  INSTRUMENTO_AJRI_LABEL,
  INSTRUMENTO_AJRI_ORDEM,
  PERIODO_AUDITORIA_AJRI,
  TEMA_AJRI_LABEL,
  TEMA_AJRI_ORDEM,
  TIPO_DOCUMENTO_AJRI_LABEL,
  TIPO_DOCUMENTO_AJRI_ORDEM,
  urlDocumentoAjri,
  type DocumentoAuditoriaAjri,
  type InstrumentoAjri,
  type TemaAjri,
  type TipoDocumentoAjri,
} from "@/lib/paraopeba/auditoria-ajri";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

/**
 * `/paraopeba/auditoria` — os 467 documentos da auditoria independente,
 * filtráveis por instrumento jurídico, tipo, tema e período.
 *
 * ═══ POR QUE A LISTA É PAGINADA E O CLIPPING NÃO É ═══
 *
 * `ClippingClient.tsx` desenha os 254 itens dos três acervos de uma vez, e
 * cabe. Aqui são 467 fichas com descrição longa (332 caracteres em média,
 * 619 no maior) — desenhar todas de saída põe ~155 KB de texto no HTML da
 * rota, e `docs/HANDOFF-PAYLOAD-LEGISLACAO.md` é o registro de um deploy que
 * morreu por payload de rota em 15/08/2026. `POR_PAGINA` corta isso na
 * origem: o filtro roda sobre os 467 em memória (o contador diz o total real),
 * mas só o pedaço visível vira DOM.
 *
 * ═══ POR QUE O DADO NÃO CHEGA POR PROP ═══
 *
 * O acervo é importado AQUI, no componente de cliente, e não passado pela
 * `page.tsx`. É a mesma escolha de `ClippingClient.tsx`, e a razão está no
 * mesmo handoff: prop de componente de cliente é serializada no payload da
 * rota (HTML + flight), e foi assim que 4,7 MiB de ementas viraram 35,5 MiB
 * de asset. Importado, o acervo é um chunk de JS compartilhado.
 *
 * ═══ CRÉDITO DA AECOM EM CADA FICHA, E NÃO SÓ NO TOPO ═══
 *
 * O material é de autoria da auditora. Cada card diz isso, com o link para a
 * fonte oficial ao lado — mesmo tratamento que `clipping-ij.ts` dá aos
 * resumos do painel-fonte. Um aviso único no cabeçalho não acompanha a ficha
 * quando alguém copia, imprime ou compartilha um documento específico.
 */

type Ordem = "recente" | "antigo" | "codigo";

/** 24 cabe em duas telas e mantém o HTML da rota na casa dos KB. */
const POR_PAGINA = 24;

const TODOS_OS_INSTRUMENTOS = INSTRUMENTO_AJRI_ORDEM;
const TODOS_OS_TIPOS = TIPO_DOCUMENTO_AJRI_ORDEM;

/** Vazio = sem limite. Compara ISO como string: `2025-03-14` ordena sozinho. */
function dentroDoIntervalo(data: string, de: string, ate: string): boolean {
  if (de && data < de) return false;
  if (ate && data > ate) return false;
  return true;
}

/** Busca no que a ficha mostra: descrição, código e rótulo dos temas. */
function casaBusca(termo: string, doc: DocumentoAuditoriaAjri): boolean {
  const t = termo.toLowerCase().trim();
  if (!t) return true;
  if (doc.descricao.toLowerCase().includes(t)) return true;
  if (doc.codigo.toLowerCase().includes(t)) return true;
  return doc.temas.some((tema) => TEMA_AJRI_LABEL[tema].toLowerCase().includes(t));
}

const FAIXA = {
  min: PERIODO_AUDITORIA_AJRI.de,
  max: PERIODO_AUDITORIA_AJRI.ate,
};

/** Contagem por tema, medida uma vez — o `select` mostra o volume de cada um. */
const TOTAL_POR_TEMA = TEMA_AJRI_ORDEM.reduce<Record<string, number>>((acc, tema) => {
  acc[tema] = AUDITORIA_AJRI.filter((d) => d.temas.includes(tema)).length;
  return acc;
}, {});

const TOTAL_POR_INSTRUMENTO = INSTRUMENTO_AJRI_ORDEM.reduce<Record<string, number>>((acc, i) => {
  acc[i] = AUDITORIA_AJRI.filter((d) => d.instrumento === i).length;
  return acc;
}, {});

export default function AuditoriaClient() {
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [instrumentos, setInstrumentos] = useState<Set<InstrumentoAjri>>(
    new Set(TODOS_OS_INSTRUMENTOS)
  );
  const [tipos, setTipos] = useState<Set<TipoDocumentoAjri>>(new Set(TODOS_OS_TIPOS));
  const [tema, setTema] = useState<TemaAjri | "todos">("todos");
  const [visiveis, setVisiveis] = useState(POR_PAGINA);

  const lista = useMemo(() => {
    const filtrada = AUDITORIA_AJRI.filter(
      (d) =>
        instrumentos.has(d.instrumento) &&
        tipos.has(d.tipo) &&
        (tema === "todos" || d.temas.includes(tema)) &&
        dentroDoIntervalo(d.data, de, ate) &&
        casaBusca(busca, d)
    );
    const copia = [...filtrada];
    if (ordem === "recente") return copia.sort((a, b) => b.data.localeCompare(a.data));
    if (ordem === "antigo") return copia.sort((a, b) => a.data.localeCompare(b.data));
    return copia.sort((a, b) => a.codigo.localeCompare(b.codigo, "pt"));
  }, [instrumentos, tipos, tema, de, ate, busca, ordem]);

  const filtroAtivo =
    busca !== "" ||
    de !== "" ||
    ate !== "" ||
    ordem !== "recente" ||
    tema !== "todos" ||
    instrumentos.size !== TODOS_OS_INSTRUMENTOS.length ||
    tipos.size !== TODOS_OS_TIPOS.length;

  /** Todo filtro volta ao começo da lista — senão a página 3 de outro recorte. */
  function aoFiltrar<T>(setter: (v: T) => void) {
    return (v: T) => {
      setVisiveis(POR_PAGINA);
      setter(v);
    };
  }

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setOrdem("recente");
    setInstrumentos(new Set(TODOS_OS_INSTRUMENTOS));
    setTipos(new Set(TODOS_OS_TIPOS));
    setTema("todos");
    setVisiveis(POR_PAGINA);
  }

  const campo =
    "rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none";

  return (
    <section className="mt-8" aria-labelledby="titulo-acervo">
      <h2
        id="titulo-acervo"
        className="font-display text-[clamp(1.25em,2.6vw,1.6em)] leading-tight font-bold tracking-tight"
      >
        O acervo da auditoria
      </h2>

      <div
        role="search"
        aria-label="Filtros do acervo da auditoria"
        className="mt-5 rounded-2xl border border-border bg-surface-2 p-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-[2] flex-col">
            <label htmlFor="ajri-busca" className="mb-1 text-xs font-medium text-text-soft">
              Buscar
            </label>
            <input
              id="ajri-busca"
              type="search"
              value={busca}
              onChange={(e) => aoFiltrar(setBusca)(e.target.value)}
              placeholder="Descrição, código do documento ou tema…"
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="ajri-de" className="mb-1 text-xs font-medium text-text-soft">
              De
            </label>
            <input
              id="ajri-de"
              type="date"
              value={de}
              min={FAIXA.min}
              max={FAIXA.max}
              onChange={(e) => aoFiltrar(setDe)(e.target.value)}
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="ajri-ate" className="mb-1 text-xs font-medium text-text-soft">
              Até
            </label>
            <input
              id="ajri-ate"
              type="date"
              value={ate}
              min={FAIXA.min}
              max={FAIXA.max}
              onChange={(e) => aoFiltrar(setAte)(e.target.value)}
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="ajri-tema" className="mb-1 text-xs font-medium text-text-soft">
              Tema
            </label>
            {/* `select`, não botão: são 25 temas. Uma parede de 25 pílulas
                empurraria a lista para fora da primeira tela. */}
            <select
              id="ajri-tema"
              value={tema}
              onChange={(e) => aoFiltrar(setTema)(e.target.value as TemaAjri | "todos")}
              className={campo}
            >
              <option value="todos">Todos os temas</option>
              {TEMA_AJRI_ORDEM.map((t) => (
                <option key={t} value={t}>
                  {TEMA_AJRI_LABEL[t]} ({formatNumberBR(TOTAL_POR_TEMA[t])})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="ajri-ordem" className="mb-1 text-xs font-medium text-text-soft">
              Ordenar
            </label>
            <select
              id="ajri-ordem"
              value={ordem}
              onChange={(e) => aoFiltrar(setOrdem)(e.target.value as Ordem)}
              className={campo}
            >
              <option value="recente">Mais recente</option>
              <option value="antigo">Mais antigo</option>
              <option value="codigo">Código (A–Z)</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-text-soft">
            Exibindo <strong className="text-text">{formatNumberBR(lista.length)}</strong> de{" "}
            {formatNumberBR(AUDITORIA_AJRI.length)} documentos
          </p>
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

      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar por instrumento jurídico"
      >
        {TODOS_OS_INSTRUMENTOS.map((i) => (
          <BotaoAlternar
            key={i}
            ativo={instrumentos.has(i)}
            onClick={() => {
              setVisiveis(POR_PAGINA);
              setInstrumentos(alternar(instrumentos, i));
            }}
          >
            {INSTRUMENTO_AJRI_LABEL[i]}{" "}
            <span className="opacity-70">({formatNumberBR(TOTAL_POR_INSTRUMENTO[i])})</span>
          </BotaoAlternar>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {TODOS_OS_TIPOS.map((t) => (
          <BotaoAlternar
            key={t}
            ativo={tipos.has(t)}
            onClick={() => {
              setVisiveis(POR_PAGINA);
              setTipos(alternar(tipos, t));
            }}
          >
            {TIPO_DOCUMENTO_AJRI_LABEL[t]}
          </BotaoAlternar>
        ))}
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {lista.slice(0, visiveis).map((d) => (
          <Ficha key={d.id} doc={d} />
        ))}
      </ul>

      {lista.length > visiveis && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisiveis((v) => v + POR_PAGINA)}
            className="cp-btn-anim rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
          >
            Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, lista.length - visiveis))} de{" "}
            {formatNumberBR(lista.length - visiveis)} restantes
          </button>
        </div>
      )}

      {lista.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-5 text-sm text-text-soft">
          Nenhum documento para os filtros selecionados.{" "}
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

      <p className="mt-8 text-xs text-text-soft">
        Acervo de {formatDateBR(PERIODO_AUDITORIA_AJRI.de)} a{" "}
        {formatDateBR(PERIODO_AUDITORIA_AJRI.ate)}, coletado do repositório público do portal da
        auditoria. Este portal não recalcula, não reclassifica e não atualiza sozinho.
      </p>
    </section>
  );
}

/** Liga/desliga um valor do conjunto sem mutar o estado anterior. */
function alternar<T>(atual: Set<T>, valor: T): Set<T> {
  const novo = new Set(atual);
  if (novo.has(valor)) novo.delete(valor);
  else novo.add(valor);
  return novo;
}

function Ficha({ doc }: { doc: DocumentoAuditoriaAjri }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">
          {INSTRUMENTO_AJRI_LABEL[doc.instrumento]}
        </p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {TIPO_DOCUMENTO_AJRI_LABEL[doc.tipo]}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {formatDateBR(doc.data)} · <span className="font-mono">{doc.codigo}</span>
      </p>
      {/* Crédito na ficha, não só no topo da página — ver o cabeçalho. */}
      <p className="mt-1 text-xs text-text-soft">
        Autoria: <strong className="text-text">{AUTOR_AUDITORIA_AJRI}</strong>, auditoria
        socioambiental independente do Acordo Judicial
      </p>
      <p className="mt-2 text-sm text-text-soft">{doc.descricao}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {doc.temas.map((t) => (
          <span
            key={t}
            className="rounded-full bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft"
          >
            {TEMA_AJRI_LABEL[t]}
          </span>
        ))}
      </div>
      <a
        href={urlDocumentoAjri(doc.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Abrir o documento no portal da auditoria ↗
      </a>{" "}
      {/* O portal gera o PDF na hora e exige cadastro. Dizer isso antes do
          clique é a diferença entre "link quebrado" e "precisa de login". */}
      <span className="text-xs text-text-soft">
        — o portal exige cadastro e gera o PDF na hora
      </span>
    </li>
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
