"use client";

import { useMemo, useState } from "react";

import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import type { AtiBiblioteca, ItemBiblioteca } from "@/lib/paraopeba/biblioteca";

/**
 * `/paraopeba/biblioteca` — filtro sobre o acervo publicado pelas ATIs.
 *
 * ═══ POR QUE OS DADOS VÊM POR PROP, E NÃO POR IMPORT ═══
 *
 * `lib/paraopeba/biblioteca.ts` lê um JSON com `node:fs` — importá-lo daqui
 * arrastaria `fs` para o pacote do navegador e quebraria o build. Só o TIPO é
 * importado (`import type`, apagado na compilação); o dado chega da página
 * servidora, que é quem tem direito a tocar o disco. É a mesma divisão que
 * `radar.ts` obriga, e a razão de `biblioteca.ts` não estar no barril
 * `lib/paraopeba/index.ts`.
 *
 * ═══ POR QUE A LISTA COMEÇA CORTADA ═══
 *
 * São 597 itens. Imprimir os 597 de uma vez faz uma página que rola por meio
 * minuto e um DOM que trava celular antigo — e o portal é lido no celular de
 * quem foi atingido. O corte é de exibição, não de acervo: o contador sempre
 * mostra o total filtrado, e o botão revela o resto sem ir à rede.
 */

type Ordem = "recente" | "antigo" | "az";

/** Quantos itens a lista mostra antes do primeiro "ver mais". */
const LOTE = 60;

interface Props {
  itens: ItemBiblioteca[];
  tipos: string[];
  temas: string[];
  macros: string[];
  tags: string[];
  atis: AtiBiblioteca[];
  atiLabel: Record<AtiBiblioteca, string>;
}

export default function BibliotecaClient({ itens, tipos, temas, macros, tags, atis, atiLabel }: Props) {
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [atisAtivas, setAtisAtivas] = useState<Set<AtiBiblioteca>>(new Set(atis));
  const [tipo, setTipo] = useState<string>("todos");
  const [tema, setTema] = useState<string>("todos");
  const [macro, setMacro] = useState<string>("todos");
  const [tag, setTag] = useState<string>("todos");
  const [visiveis, setVisiveis] = useState(LOTE);

  const faixa = useMemo(() => {
    const datas = itens.map((i) => i.data).filter((d): d is string => Boolean(d)).sort();
    return { min: datas[0] ?? "", max: datas[datas.length - 1] ?? "" };
  }, [itens]);

  /**
   * Só a AEDAS classifica por tema. Sem este número ao lado do seletor, filtrar
   * por "Saúde e ERSHRE" some com o Guaicuy inteiro e a tela dá a entender que
   * ele não publicou nada sobre o assunto — quando ele só não etiqueta.
   */
  const comTema = useMemo(() => itens.filter((i) => i.temas.length > 0).length, [itens]);

  const lista = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    const filtrada = itens.filter((i) => {
      if (!atisAtivas.has(i.ati)) return false;
      if (tipo !== "todos" && i.tipo !== tipo) return false;
      if (tema !== "todos" && !i.temas.includes(tema)) return false;
      if (macro !== "todos" && i.macro_categoria !== macro) return false;
      if (tag !== "todos" && !i.tags.includes(tag)) return false;
      // Item sem data não some quando há filtro de período: sumir seria o
      // portal decidir que "não sei quando" é "fora do intervalo". Ele só é
      // excluído se a data existir e estiver fora.
      if (i.data && de && i.data < de) return false;
      if (i.data && ate && i.data > ate) return false;
      if (!termo) return true;
      return (
        i.titulo.toLowerCase().includes(termo) ||
        i.tipo.toLowerCase().includes(termo) ||
        i.macro_categoria.toLowerCase().includes(termo) ||
        i.tags.some((t) => t.toLowerCase().includes(termo)) ||
        (i.origem ?? "").toLowerCase().includes(termo) ||
        (i.autoria ?? "").toLowerCase().includes(termo) ||
        i.temas.some((t) => t.toLowerCase().includes(termo)) ||
        i.colecoes.some((c) => c.toLowerCase().includes(termo))
      );
    });
    const copia = [...filtrada];
    if (ordem === "az") {
      return copia.sort(
        (a, b) => a.titulo.localeCompare(b.titulo, "pt") || (b.data ?? "").localeCompare(a.data ?? "")
      );
    }
    const sinal = ordem === "recente" ? -1 : 1;
    return copia.sort((a, b) => sinal * (a.data ?? "").localeCompare(b.data ?? ""));
  }, [itens, atisAtivas, tipo, tema, macro, tag, de, ate, busca, ordem]);

  const filtroAtivo =
    busca !== "" || de !== "" || ate !== "" || ordem !== "recente" || tipo !== "todos" ||
    tema !== "todos" || macro !== "todos" || tag !== "todos" || atisAtivas.size !== atis.length;

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setOrdem("recente");
    setAtisAtivas(new Set(atis));
    setTipo("todos");
    setTema("todos");
    setMacro("todos");
    setTag("todos");
    setVisiveis(LOTE);
  }

  const campo =
    "rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none";

  return (
    <section className="mt-8" aria-labelledby="titulo-acervo">
      <h2 id="titulo-acervo" className="sr-only">
        Acervo filtrável
      </h2>

      <div
        role="search"
        aria-label="Filtros"
        className="rounded-2xl border border-border bg-surface-2 p-4"
      >
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
              placeholder="Título, tipo, tema, autoria ou região…"
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
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="flex min-w-[180px] flex-1 flex-col">
            <label htmlFor="bib-tipo" className="mb-1 text-xs font-medium text-text-soft">
              Tipo de material
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
              <option value="todos">Todos os tipos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[180px] flex-1 flex-col">
            <label htmlFor="bib-tema" className="mb-1 text-xs font-medium text-text-soft">
              Tema{" "}
              <span className="font-normal">
                ({formatNumberBR(comTema)} dos {formatNumberBR(itens.length)} itens têm)
              </span>
            </label>
            <select
              id="bib-tema"
              value={tema}
              onChange={(e) => {
                setTema(e.target.value);
                setVisiveis(LOTE);
              }}
              className={campo}
            >
              <option value="todos">Todos os temas</option>
              {temas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[180px] flex-1 flex-col">
            <label htmlFor="bib-macro" className="mb-1 text-xs font-medium text-text-soft">
              Categoria
            </label>
            <select
              id="bib-macro"
              value={macro}
              onChange={(e) => {
                setMacro(e.target.value);
                setVisiveis(LOTE);
              }}
              className={campo}
            >
              <option value="todos">Todas as categorias</option>
              {macros.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[180px] flex-1 flex-col">
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
              <option value="todos">Todas as tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por assessoria">
          {atis.map((sigla) => (
            <button
              key={sigla}
              type="button"
              aria-pressed={atisAtivas.has(sigla)}
              onClick={() => {
                setAtisAtivas((atual) => {
                  const novo = new Set(atual);
                  if (novo.has(sigla)) novo.delete(sigla);
                  else novo.add(sigla);
                  return novo;
                });
                setVisiveis(LOTE);
              }}
              className={`cp-btn-anim rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                atisAtivas.has(sigla)
                  ? "border-primary bg-primary text-primary-ink"
                  : "border-border bg-surface text-text-soft"
              }`}
            >
              {atiLabel[sigla]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-text-soft">
            Exibindo <strong className="text-text">{formatNumberBR(Math.min(visiveis, lista.length))}</strong>{" "}
            de {formatNumberBR(lista.length)}
            {lista.length !== itens.length && ` (acervo: ${formatNumberBR(itens.length)})`}
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

      <ul className="mt-5 flex flex-col gap-3">
        {lista.slice(0, visiveis).map((item) => (
          <ItemDaBiblioteca key={item.id} item={item} atiLabel={atiLabel} onTermo={setBusca} />
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

function ItemDaBiblioteca({
  item,
  atiLabel,
  onTermo,
}: {
  item: ItemBiblioteca;
  atiLabel: Record<AtiBiblioteca, string>;
  onTermo: (t: string) => void;
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">{item.titulo}</p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {atiLabel[item.ati]}
        </span>
      </div>
      {/* Origem e autoria entram na linha de metadado, não entre as etiquetas
          clicáveis: as etiquetas filtram por ASSUNTO, e "Produção de parceiros"
          é uma afirmação sobre quem escreveu. */}
      <p className="mt-1 text-xs text-text-soft">
        {item.data ? formatDateBR(item.data) : "sem data na fonte"} · {item.macro_categoria}
        {item.origem ? ` · ${item.origem}` : ""}
        {item.autoria ? ` · ${item.autoria}` : ""}
      </p>
      {(item.temas.length > 0 || item.colecoes.length > 0 || item.tags.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.tags.map((t) => (
            <button
              key={`tag-${t}`}
              type="button"
              onClick={() => onTermo(t)}
              aria-label={`Filtrar por tag: ${t}`}
              className="cp-btn-anim rounded-full border border-border bg-surface px-2 py-0.5 text-[.72em] text-text-soft transition-colors hover:border-primary hover:text-primary"
            >
              {t}
            </button>
          ))}
          {[...item.temas, ...item.colecoes].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTermo(t)}
              aria-label={`Filtrar por: ${t}`}
              className="cp-btn-anim rounded-full bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft transition-colors hover:bg-primary hover:text-primary-ink"
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
        Abrir na fonte original ↗
      </a>
    </li>
  );
}
