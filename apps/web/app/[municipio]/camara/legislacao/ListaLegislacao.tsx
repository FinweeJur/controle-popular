"use client";

import { useSearchParams } from "next/navigation";
import Link from "@/lib/betim/link";
import RotuloBadge from "@/app/[municipio]/components/RotuloBadge";
import VicioBadge from "@/app/[municipio]/components/VicioBadge";
import type { AtoRow } from "@/lib/betim/legislacao";
import type { DireitoContagem } from "@/lib/betim/legislacao-garantista";
import { labelDoDireito } from "@/lib/congresso/rubrica";
import { RESSALVA_INDICIO } from "@/lib/congresso/rubrica_vicio";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

/**
 * Formulário + lista de `/camara/legislacao`, com os quatro filtros
 * (categoria, tema, ano, direito) movidos do SERVIDOR para o NAVEGADOR.
 *
 * ═══ POR QUE MUDOU ═══
 *
 * A página lia `categoria`/`tema`/`ano`/`direito` no servidor. Isso a
 * tornava dinâmica (`ƒ`), e dinâmica consulta o banco a cada requisição — no
 * Cloudflare isso é 500, porque a Neon está em 402 e o Postgres é o desta
 * casa (ver `docs/deploy-github-pages.md` §9.3). Sem `searchParams`, a rota
 * volta a ser pré-renderizada (`●`).
 *
 * `getLegislacao` já buscava a cidade INTEIRA e filtrava em JS no servidor
 * (comentário original: "Dataset pequeno (~660) — busca tudo e filtra no
 * componente") — não havia LIMIT nenhum a preservar. A mudança real é só
 * TROCAR ONDE o filtro roda, sem mexer em `lib/betim/legislacao.ts`: a
 * página chama `getLegislacao(id, {})` (sem opts) e este componente aplica
 * exatamente a mesma lógica de filtro que antes vivia no servidor.
 *
 * `TEMA_LABELS` chega por prop, não por import: `lib/betim/temas.ts` importa
 * `lib/db/queries/betim`, e importar isso aqui arrastaria código de servidor
 * para o bundle do cliente (mesmo motivo do precedente em
 * `ProposicoesDoVereador.tsx`). `labelDoDireito` já é seguro de importar
 * direto — `lib/congresso/rubrica.ts` só lê um JSON estático.
 */
export interface ListaLegislacaoProps {
  atos: AtoRow[];
  categoriasDisponiveis: string[];
  anosDisponiveis: number[];
  direitosDisponiveis: DireitoContagem[];
  atosAnalisados: number;
  analiseOk: boolean;
  total: number;
  cidadeNome: string;
  temaLabels: Record<string, string>;
}

interface Filtros {
  categoria?: string;
  tema?: string;
  ano?: string;
  direito?: string;
}

/** Preserva os outros filtros ao limpar um só (mesma regra de antes). */
function urlSem(atual: Filtros, chave: "tema" | "direito"): string {
  const resto = new URLSearchParams();
  for (const [k, v] of Object.entries(atual)) {
    if (k !== chave && v) resto.set(k, String(v));
  }
  const qs = resto.toString();
  return `/camara/legislacao${qs ? `?${qs}` : ""}`;
}

function Conteudo({
  atos: todos,
  categoriasDisponiveis,
  anosDisponiveis,
  direitosDisponiveis,
  atosAnalisados,
  analiseOk,
  total,
  cidadeNome,
  temaLabels,
  filtros,
}: ListaLegislacaoProps & { filtros: Filtros }) {
  const { categoria, tema, ano, direito } = filtros;

  // Mesma ordem/semântica do `getLegislacao` original.
  let atos = todos;
  if (categoria) atos = atos.filter((a) => a.tipo === categoria);
  if (ano) atos = atos.filter((a) => a.ano === Number(ano));
  if (tema) atos = atos.filter((a) => (a.temas ?? []).includes(tema));
  if (direito) atos = atos.filter((a) => a.analise?.direitos.includes(direito));

  const temFiltro = Boolean(categoria || tema || ano || direito);

  return (
    <>
      <form method="GET" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="categoria" className="mb-1 text-xs font-medium text-text-soft">
            Categoria
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue={categoria ?? ""}
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todas</option>
            {categoriasDisponiveis.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
            Ano
          </label>
          <select
            id="ano"
            name="ano"
            defaultValue={ano ?? ""}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos</option>
            {anosDisponiveis.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {direitosDisponiveis.length > 0 && (
          <div className="flex flex-col">
            <label htmlFor="direito" className="mb-1 text-xs font-medium text-text-soft">
              Direito afetado{" "}
              <span className="font-normal">
                (entre as {formatNumberBR(atosAnalisados)} analisadas)
              </span>
            </label>
            <select
              id="direito"
              name="direito"
              defaultValue={direito ?? ""}
              className="w-72 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todos</option>
              {direitosDisponiveis.map((d) => (
                <option key={d.direito} value={d.direito}>
                  {d.label} ({d.qtd} de {formatNumberBR(atosAnalisados)})
                </option>
              ))}
            </select>
          </div>
        )}
        {tema && <input type="hidden" name="tema" value={tema} />}
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
        >
          Filtrar
        </button>
        {temFiltro && (
          <Link href="/camara/legislacao" className="pb-1.5 text-sm text-text-soft hover:underline">
            Limpar
          </Link>
        )}
      </form>

      {tema && (
        <p className="mb-4 text-sm text-text-soft">
          Filtrando por área:{" "}
          <strong className="text-text">{temaLabels[tema] ?? tema}</strong>{" "}
          <Link href={urlSem(filtros, "tema")} className="text-accent hover:underline">
            ✕ limpar área
          </Link>
        </p>
      )}

      {direito && (
        <p className="mb-4 text-sm text-text-soft">
          Filtrando por direito afetado:{" "}
          <strong className="text-text">{labelDoDireito(direito)}</strong> — leitura
          da análise garantista deste portal, não classificação oficial, e{" "}
          <strong className="text-text">
            só entre as {formatNumberBR(atosAnalisados)} normas já analisadas
          </strong>
          , não entre as {formatNumberBR(total)} publicadas.{" "}
          <Link href={urlSem(filtros, "direito")} className="text-accent hover:underline">
            ✕ limpar direito
          </Link>
        </p>
      )}

      {atos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          {direito && !analiseOk ? (
            <>
              <p className="font-medium text-text">Não foi possível consultar a análise</p>
              <p className="mt-2">
                O filtro por direito depende da análise garantista, que não
                respondeu agora. Isto não é o mesmo que “nenhuma norma
                afeta esse direito”.{" "}
                <Link href={urlSem(filtros, "direito")} className="text-accent hover:underline">
                  Ver a lista sem esse filtro
                </Link>
              </p>
            </>
          ) : direito && atosAnalisados === 0 ? (
            <>
              <p className="font-medium text-text">
                Nenhuma norma de {cidadeNome} foi analisada ainda
              </p>
              <p className="mt-2">
                O filtro por direito não tem sobre o que operar aqui: a fila
                de análise desta cidade começou pelos projetos em tramitação.{" "}
                <Link href="/legislacao/alertas" className="text-accent hover:underline">
                  Ver o que já foi analisado
                </Link>
              </p>
            </>
          ) : direito ? (
            <>
              <p className="font-medium text-text">
                Nenhuma das {formatNumberBR(atosAnalisados)} normas analisadas afeta
                esse direito
              </p>
              <p className="mt-2">
                Restam {formatNumberBR(Math.max(0, total - atosAnalisados))} normas de{" "}
                {cidadeNome} que a análise ainda não leu — o silêncio aqui é
                sobre a amostra, não sobre a Prefeitura.
              </p>
            </>
          ) : (
            "Nenhuma norma para esse filtro."
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {atos.map((a) => (
            <li key={a.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {a.tipo}
                </span>
                <span className="font-tabular text-xs text-text-soft">
                  {formatDateBR(a.dataPublicacao)}
                </span>
              </div>
              <p className="mt-2 font-medium text-text">
                {a.tipo} nº {a.numero}
                {a.ano ? `/${a.ano}` : ""}
              </p>
              {a.ementa && <p className="mt-0.5 text-sm text-text-soft">{a.ementa}</p>}
              {a.mapaIdx != null && (
                <a
                  href={`/funcaosocialterra/mapa?camada=normas-geolocalizadas&idx=${a.mapaIdx}`}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  target="_blank"
                  rel="noopener"
                >
                  Ver no mapa
                </a>
              )}
              {a.temas && a.temas.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1">
                  {a.temas.map((t) => (
                    <li
                      key={t}
                      className="rounded-full bg-surface-2 px-2 py-0.5 text-[.85em] font-medium text-text-soft"
                    >
                      {temaLabels[t] ?? t}
                    </li>
                  ))}
                </ul>
              )}
              {a.analise && (
                <details className="group mt-3">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
                    <RotuloBadge rotulo={a.analise.rotulo} score={a.analise.score} tamanho="sm" />
                    <span className="text-xs text-accent underline decoration-dotted group-open:hidden">
                      ver justificativa
                    </span>
                    <span className="hidden text-xs text-accent underline decoration-dotted group-open:inline">
                      ocultar justificativa
                    </span>
                  </summary>
                  <div className="mt-2 space-y-2 rounded-xl bg-surface-2 p-3 text-sm">
                    {a.analise.itens.map((item, idx) => (
                      <div key={idx}>
                        <p>
                          <strong className="text-text">
                            {item.direcao === "restringe"
                              ? "Restringe"
                              : item.direcao === "amplia"
                                ? "Amplia"
                                : "Neutro sobre"}
                            : {labelDoDireito(item.direito)}
                          </strong>{" "}
                          <span className="text-text-soft">
                            ({item.dispositivo}
                            {item.grau ? ` · alcance ${item.grau}` : ""})
                          </span>
                        </p>
                        {item.trecho && (
                          <p className="mt-1 italic text-text-soft">“{item.trecho}”</p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {a.vicio && (
                <details className="group mt-3">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
                    <VicioBadge nivel={a.vicio.nivelGravidade} tamanho="sm" />
                    <span className="text-xs text-accent underline decoration-dotted group-open:hidden">
                      ver justificativa
                    </span>
                    <span className="hidden text-xs text-accent underline decoration-dotted group-open:inline">
                      ocultar justificativa
                    </span>
                  </summary>
                  <div className="mt-2 space-y-2 rounded-xl bg-surface-2 p-3 text-sm">
                    <p className="text-xs text-text-soft">{RESSALVA_INDICIO}</p>
                    {a.vicio.resumo && <p>{a.vicio.resumo}</p>}
                    {a.vicio.itens.map((item, idx) => (
                      <div key={idx}>
                        <p>
                          <strong className="text-text">{item.categoriaLabel}</strong>{" "}
                          <span className="text-text-soft">({item.dispositivo})</span>
                        </p>
                        {item.justificativa && <p className="mt-1 text-text-soft">{item.justificativa}</p>}
                        {item.trecho && (
                          <p className="mt-1 italic text-text-soft">“{item.trecho}”</p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/**
 * Fallback do `<Suspense>`: os filtros vazios, lista COMPLETA da cidade.
 *
 * Não pode chamar `useSearchParams()` — passar o mesmo componente dos dois
 * lados do `<Suspense>` derruba o `next build` com "should be wrapped in a
 * suspense boundary", e só lá (mesma armadilha documentada em `ListaObras`).
 */
export function ListaLegislacaoCompleta(props: ListaLegislacaoProps) {
  return <Conteudo {...props} filtros={{}} />;
}

export default function ListaLegislacao(props: ListaLegislacaoProps) {
  const sp = useSearchParams();
  const filtros: Filtros = {
    categoria: sp.get("categoria") ?? undefined,
    tema: sp.get("tema") ?? undefined,
    ano: sp.get("ano") ?? undefined,
    direito: sp.get("direito") ?? undefined,
  };
  return <Conteudo {...props} filtros={filtros} />;
}
