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
const LIMITE_CIDADES = 20;
const LIMITE_CONGRESSO = 10;
const LIMITE_JUDICIARIO = 10;

type EstadoCarregamento = "carregando" | "pronto" | "erro";

function rotuloContagem(n: number, limite: number, singular: string, plural: string): string {
  if (n === 0) return `nenhum ${singular}`;
  if (n < limite) return `${n} ${n === 1 ? singular : plural}`;
  return `${n}+ ${plural} — mostrando os mais relevantes`;
}

/** Zona -> rótulo do badge do card. */
const RÓTULO_ZONA: Record<Resultado["doc"]["f"], string> = {
  cidades: "Cidades",
  congresso: "Congresso",
  judiciario: "Judiciário",
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

  const { cidadesRes, congressoRes, judiciarioRes } = useMemo(() => {
    const vazio = { cidadesRes: [] as Resultado[], congressoRes: [] as Resultado[], judiciarioRes: [] as Resultado[] };
    if (!completo || !indice || !temFiltro) return vazio;

    // `limite` grande de propósito: preciso do conjunto INTEIRO batido antes
    // de recortar por zona, senão uma zona populosa rouba vaga do top global
    // de outra (ver `lib/busca/gerador.ts`/plano — não é limitação de
    // `buscar()`, é escolha de como bucketizar o resultado por zona aqui).
    const limiteAmplo = indice.docs.length || 1;

    // Tema/município só valem para Cidades — Congresso e Judiciário nunca
    // recebem esses dois filtros em produção (vocabulário de tema
    // incompatível, e Judiciário não tem território). Por isso são DUAS
    // chamadas a `buscar()`, não uma: passar tema/município na MESMA
    // chamada excluiria Congresso/Judiciário inteiros (não têm `.a`/`.m`).
    const doCidades = buscar(q, indice, {
      tema: tema || undefined,
      municipio: municipio || undefined,
      limite: limiteAmplo,
    }).filter((r) => r.doc.f === "cidades");

    if (!q.trim()) return { ...vazio, cidadesRes: doCidades };

    const doResto = buscar(q, indice, { limite: limiteAmplo });
    return {
      cidadesRes: doCidades,
      congressoRes: doResto.filter((r) => r.doc.f === "congresso"),
      judiciarioRes: doResto.filter((r) => r.doc.f === "judiciario"),
    };
  }, [completo, indice, temFiltro, q, tema, municipio]);

  const cidadesExibidas = cidadesRes.slice(0, LIMITE_CIDADES);
  const congressoExibidos = congressoRes.slice(0, LIMITE_CONGRESSO);
  const judiciarioExibidos = judiciarioRes.slice(0, LIMITE_JUDICIARIO);

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
        <div className="mt-10 space-y-10">
          <SecaoResultados
            titulo="Cidades"
            contagem={rotuloContagem(cidadesRes.length, LIMITE_CIDADES, "resultado", "resultados")}
            complemento={cidadeSelecionada ? `${cidadeSelecionada.nome} (${cidadeSelecionada.uf})` : `todas as ${cidades.length} cidades`}
            resultados={cidadesExibidas}
            cidadesPorSlug={cidadesPorSlug}
            vazio="Nenhuma lei, decreto, resolução ou projeto de lei municipal encontrado com esse filtro."
          />

          <SecaoResultados
            titulo="Congresso"
            contagem={q.trim() ? rotuloContagem(congressoRes.length, LIMITE_CONGRESSO, "resultado", "resultados") : null}
            resultados={congressoExibidos}
            cidadesPorSlug={cidadesPorSlug}
            semQuery={!q.trim() ? "Digite uma palavra-chave para buscar entre as proposições do Congresso — tema e território não filtram este eixo." : undefined}
            vazio="Nenhuma proposição do Congresso com esse termo."
          />

          <SecaoResultados
            titulo="Judiciário"
            contagem={q.trim() ? rotuloContagem(judiciarioRes.length, LIMITE_JUDICIARIO, "resultado", "resultados") : null}
            descricao="Composição de tribunais e magistrados — o Judiciário não produz legislação, então tema e território também não se aplicam aqui."
            resultados={judiciarioExibidos}
            cidadesPorSlug={cidadesPorSlug}
            semQuery={!q.trim() ? "Digite uma palavra-chave para buscar no Judiciário." : undefined}
            vazio="Nenhum resultado no Judiciário para esse termo."
          />
        </div>
      ) : null}
    </>
  );
}

function SecaoResultados({
  titulo,
  contagem,
  complemento,
  descricao,
  resultados,
  cidadesPorSlug,
  semQuery,
  vazio,
}: {
  titulo: string;
  contagem: string | null;
  complemento?: string;
  descricao?: string;
  resultados: Resultado[];
  cidadesPorSlug: Map<string, Cidade>;
  semQuery?: string;
  vazio: string;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">{titulo}</h2>
        {contagem ? (
          <span className="text-sm text-text-soft">
            {contagem}
            {complemento ? ` · ${complemento}` : ""}
          </span>
        ) : null}
      </div>
      {descricao ? <p className="mt-1 text-xs text-text-soft">{descricao}</p> : null}

      {semQuery ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
          {semQuery}
        </p>
      ) : resultados.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm text-text-soft">
          {vazio}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {resultados.map((r) => (
            <CardResultado key={`${r.doc.f}:${r.doc.h}:${r.doc.i}`} resultado={r} cidadesPorSlug={cidadesPorSlug} />
          ))}
        </ul>
      )}
    </section>
  );
}

function CardResultado({ resultado, cidadesPorSlug }: { resultado: Resultado; cidadesPorSlug: Map<string, Cidade> }) {
  const { doc, aproximados } = resultado;
  const cidade = doc.m ? cidadesPorSlug.get(doc.m) : undefined;

  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {RÓTULO_ZONA[doc.f]}
        </span>
        <span className="text-xs text-text-soft">
          {cidade ? `${cidade.nome} · ${cidade.uf}` : null}
          {cidade && doc.d ? " · " : null}
          {doc.d ? formatDateBR(doc.d) : null}
        </span>
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
