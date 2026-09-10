"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Cidade } from "@/lib/db/queries/municipios";
import { TEMA_LABELS, TEMAS_ORDENADOS } from "@/lib/betim/temas";
import { formatDateBR } from "@/lib/betim/format";
import { buscar, type IndiceBusca, type Resultado } from "@/lib/busca/indice";
import { carregarIndiceBusca, type ProgressoCarregamento } from "@/lib/busca/carregarIndice";

/**
 * Motor de busca no navegador — a versão estática de `/busca`.
 *
 * NÃO usa `useSearchParams()`: é o hook que faz `output: 'export'` falhar
 * com "missing generateStaticParams()" (ver `docs/deploy-github-pages.md`
 * §8 e o comentário equivalente em `TabelaEstatica.tsx`). O estado inicial
 * de q/tema/município vem de `window.location.search`, lido num efeito
 * (depois da hidratação, sem divergir servidor/cliente), e é espelhado de
 * volta com `history.replaceState` — mesmo padrão de `TabelaEstatica.tsx`.
 *
 * A busca fica DESABILITADA até o índice inteiro carregar. Não é só a
 * caixa de texto: filtrar com o índice pela metade responderia "nenhum
 * resultado" para uma linha cujo radical só chegou na fatia 7 de
 * `vocabulario` — a mesma regra que `TabelaEstatica.tsx` já segue, aqui
 * mais rígida porque NENHUM resultado é confiável antes do índice
 * completo (ao contrário de uma tabela, que pode mostrar a fatia 0
 * enquanto o resto chega).
 */

const BASE_INDICE = "/busca-indice";
const LIMITE_RESULTADOS = 40;

type EstadoCarregamento = "carregando" | "pronto" | "erro";

function rotuloContagem(n: number, limite: number, singular: string, plural: string): string {
  if (n === 0) return `nenhum ${singular}`;
  if (n < limite) return `${n} ${n === 1 ? singular : plural}`;
  return `${n}+ ${plural} — mostrando os mais relevantes`;
}

/** Zona -> rótulo do chip do resultado. O TEXTO do chip é o canal de
 *  informação (regra de acessibilidade: cor nunca é a única via) — todos os
 *  chips compartilham o mesmo estilo neutro e a fonte fica dita por escrito. */
const RÓTULO_ZONA: Record<Resultado["doc"]["f"], string> = {
  cidades: "Cidades",
  congresso: "Congresso",
  judiciario: "Judiciário",
  estudos: "Estudos Rurais",
};

interface BuscaClientProps {
  cidades: Cidade[];
}

export default function BuscaClient({ cidades }: BuscaClientProps) {
  const [indice, setIndice] = useState<IndiceBusca | null>(null);
  const [estado, setEstado] = useState<EstadoCarregamento>("carregando");
  const [progresso, setProgresso] = useState<ProgressoCarregamento>({ bytesCarregados: 0, bytesTotais: 0 });

  const [q, setQ] = useState("");
  const [tema, setTema] = useState("");
  const [municipio, setMunicipio] = useState("");
  const primeiraRenderizacao = useRef(true);

  // Estado inicial vindo da URL, uma vez, depois da hidratação.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location/sessionStorage: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    setQ(sp.get("q") ?? "");
    setTema(sp.get("tema") ?? "");
    setMunicipio(sp.get("municipio") ?? "");
  }, []);

  // Espelha de volta na URL, sem entrar no histórico.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    if (tema) sp.set("tema", tema);
    if (municipio) sp.set("municipio", municipio);
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [q, tema, municipio]);

  useEffect(() => {
    let cancelado = false;
    carregarIndiceBusca(BASE_INDICE, (p) => {
      if (!cancelado) setProgresso(p);
    })
      .then((idx) => {
        if (cancelado) return;
        setIndice(idx);
        setEstado("pronto");
      })
      .catch(() => {
        if (!cancelado) setEstado("erro");
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const completo = estado === "pronto" && indice !== null;

  const cidadesPorSlug = useMemo(() => new Map(cidades.map((c) => [c.slug, c])), [cidades]);
  const cidadeSelecionada = municipio ? (cidadesPorSlug.get(municipio) ?? null) : null;
  const municipioInvalido = Boolean(municipio) && !cidadeSelecionada;
  const temFiltro = Boolean(q.trim() || tema || municipio);

  const resultados = useMemo(() => {
    if (!completo || !indice || !temFiltro) return [] as Resultado[];

    // `limite` grande de propósito: recorto a lista EXIBIDA só depois de
    // ordenar o conjunto inteiro, senão o recorte cedo derruba resultado
    // relevante que ficou para trás na pontuação.
    const limiteAmplo = indice.docs.length || 1;
    const todos = buscar(q, indice, { limite: limiteAmplo });

    // Tema/município só valem para Cidades (vocabulário de tema municipal e
    // território não existem no Congresso, no Judiciário nem no acervo de
    // estudos) — então o filtro é aplicado por zona APÓS a busca, em vez de
    // ir para `buscar()` (que excluiria as demais zonas inteiras, pois não
    // têm `.a`/`.m`).
    const cidadePassa = (r: Resultado): boolean =>
      (!tema || (r.doc.a ?? []).includes(tema)) && (!municipio || r.doc.m === municipio);

    // Sem palavra-chave, só Cidades responde aos filtros (comportamento
    // anterior das seções: as demais zonas exibiam aviso "digite uma
    // palavra-chave" — numa lista única, a mensagem é a de vazio).
    if (!q.trim()) {
      return todos.filter((r) => r.doc.f === "cidades" && cidadePassa(r));
    }
    return todos.filter((r) => (r.doc.f === "cidades" ? cidadePassa(r) : true));
  }, [completo, indice, temFiltro, q, tema, municipio]);

  const resultadosExibidos = resultados.slice(0, LIMITE_RESULTADOS);

  const progressoPct =
    progresso.bytesTotais > 0 ? Math.min(100, Math.round((progresso.bytesCarregados / progresso.bytesTotais) * 100)) : 0;

  return (
    <>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mt-8 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-4"
      >
        <fieldset disabled={!completo} className="contents disabled:opacity-70">
          <label className="sm:col-span-2">
            <span className="text-sm text-text-soft">Palavra-chave</span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={completo ? "ex.: saúde, iluminação pública, PL 3611" : "Carregando índice de busca…"}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text disabled:cursor-not-allowed"
            />
          </label>

          <label>
            <span className="text-sm text-text-soft">Tema</span>
            <select
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text disabled:cursor-not-allowed"
            >
              <option value="">Todos</option>
              {TEMAS_ORDENADOS.map((t) => (
                <option key={t} value={t}>
                  {TEMA_LABELS[t]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm text-text-soft">Território</span>
            <select
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-bg px-3 py-2 text-text disabled:cursor-not-allowed"
            >
              <option value="">Todas as cidades</option>
              {cidades.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.nome} · {c.uf}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <div className="sm:col-span-4 flex flex-wrap items-center gap-3">
          {temFiltro ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setTema("");
                setMunicipio("");
              }}
              className="cursor-pointer text-sm text-text-soft hover:underline"
            >
              Limpar
            </button>
          ) : null}
          <span className="text-xs text-text-soft sm:ml-auto">
            Tema e território filtram só Cidades — Congresso e Judiciário respondem apenas à
            palavra-chave, porque não compartilham essa classificação.
          </span>
        </div>
      </form>

      {!completo && estado !== "erro" ? (
        <p className="mt-3 text-xs text-text-soft" aria-live="polite">
          Carregando o índice de busca ({progressoPct}%, {(progresso.bytesCarregados / 1024).toFixed(0)} KB) — a
          busca cobre o acervo inteiro, então ela abre quando o índice terminar de carregar.
        </p>
      ) : null}

      {estado === "erro" ? (
        <p className="mt-4 rounded-lg border border-alert/40 bg-alert/5 p-4 text-sm text-text">
          Não foi possível carregar o índice de busca. Recarregue a página; se persistir, o
          índice pode não ter sido publicado no último build.
        </p>
      ) : null}

      {municipioInvalido ? (
        <p className="mt-4 rounded-md border border-dashed border-border bg-surface-2 p-3 text-sm text-text-soft">
          Cidade &quot;{municipio}&quot; não encontrada — mostrando resultado de todas as cidades.
        </p>
      ) : null}

      {completo && !temFiltro ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
          <p className="font-medium text-text">Escolha um tema, uma cidade, ou digite uma palavra-chave para começar.</p>
          <p className="mt-2">
            Sem nenhum critério, não há o que listar — filtro nenhum aqui não é o mesmo que
            &quot;mostrar tudo&quot;.
          </p>
        </div>
      ) : null}

      {completo && temFiltro ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">Resultados</h2>
            <span className="text-sm text-text-soft">
              {rotuloContagem(resultados.length, LIMITE_RESULTADOS, "resultado", "resultados")}
              {cidadeSelecionada ? ` · ${cidadeSelecionada.nome} (${cidadeSelecionada.uf})` : ""}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Lista única de todas as frentes — o chip à esquerda de cada título diz a fonte.
            Tema e território filtram só Cidades; Congresso, Judiciário e Estudos Rurais
            respondem apenas à palavra-chave.
          </p>

          {resultadosExibidos.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
              {q.trim()
                ? "Nenhum resultado encontrado com esse filtro — leis municipais, proposições, tribunais e estudos rurais."
                : "Nenhuma lei, decreto, resolução ou projeto de lei municipal encontrado com esse filtro — com palavra-chave a busca cobre também Congresso, Judiciário e Estudos Rurais."}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {resultadosExibidos.map((r) => (
                <CardResultado key={`${r.doc.f}:${r.doc.h}:${r.doc.i}`} resultado={r} cidadesPorSlug={cidadesPorSlug} />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </>
  );
}

function CardResultado({ resultado, cidadesPorSlug }: { resultado: Resultado; cidadesPorSlug: Map<string, Cidade> }) {
  const { doc, aproximados } = resultado;
  const cidade = doc.m ? cidadesPorSlug.get(doc.m) : undefined;

  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {/* O chip fica à ESQUERDA do título e se identifica pelo TEXTO — cor
            é decoração, nunca o único canal (cada zona tem o mesmo estilo
            neutro, a fonte é dita por escrito). */}
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {RÓTULO_ZONA[doc.f]}
        </span>
        {cidade || doc.d ? (
          <span className="text-xs text-text-soft">
            {cidade ? `${cidade.nome} · ${cidade.uf}` : null}
            {cidade && doc.d ? " · " : null}
            {doc.d ? formatDateBR(doc.d) : null}
          </span>
        ) : null}
      </div>

      <a href={doc.h} className="mt-2 block font-medium text-text underline-offset-2 hover:text-primary hover:underline">
        {doc.t}
      </a>
      {doc.e ? <p className="mt-0.5 text-sm text-text-soft">{doc.e}</p> : null}

      {doc.a && doc.a.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1">
          {doc.a.map((t) => (
            <li key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[.85em] font-medium text-text-soft">
              {TEMA_LABELS[t] ?? t}
            </li>
          ))}
        </ul>
      ) : null}

      {aproximados.length > 0 ? (
        <p className="mt-2 text-xs text-accent">
          Encontrado por aproximação — você quis dizer &quot;{aproximados.join(", ")}&quot;?
        </p>
      ) : null}

      {doc.u ? (
        <footer className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
          <a href={doc.u} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:text-accent">
            Documento oficial ↗
          </a>
        </footer>
      ) : null}
    </li>
  );
}
