"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import RotuloBadge from "@/app/[municipio]/components/RotuloBadge";
import VicioBadge from "@/app/[municipio]/components/VicioBadge";
import type { AtoRow } from "@/lib/betim/legislacao";
import type { ContagemTema } from "@/lib/betim/temas";
import type { DireitoContagem } from "@/lib/betim/legislacao-garantista";
import { atoPassaNoFiltro } from "@/lib/betim/legislacao-filtro";
import { labelDoDireito } from "@/lib/congresso/rubrica";
import { RESSALVA_INDICIO } from "@/lib/congresso/rubrica_vicio";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

/**
 * Lista de `/[municipio]/camara/legislacao`, servida por índice estático
 * fatiado.
 *
 * ═══ O QUE MUDOU, E QUAL ERA O PREÇO ═══
 *
 * Antes esta lista chegava PRONTA como prop: `page.tsx` fazia
 * `getLegislacao(id, {})` e entregava a coleção inteira a um componente de
 * cliente. Num alvo estático isso vira arquivo, e vira três vezes (HTML, `.rsc`
 * e `segmentData["/_full"]` — conferido em `.cache` de build real no commit
 * `7544574`). O resultado estava medido no build de 15/08/2026: **11 MiB** em
 * `bh/camara/legislacao.cache` e **9,5 MiB** em `diamantina`, contra o teto de
 * 25 MiB da Cloudflare. Agora as normas vêm de `legislacao/dados/**`, baixadas
 * pelo navegador sob demanda, e o `.cache` da página deixa de crescer com o
 * acervo.
 *
 * ═══ POR QUE OS QUATRO FILTROS VIRARAM CONTROLE, E NÃO FORMULÁRIO ═══
 *
 * O formulário anterior era `method="GET"`: submeter recarregava a página com
 * `?categoria=…`. Isso funcionava porque a lista já estava no HTML. Com as
 * linhas vindo do índice, recarregar significaria baixar tudo de novo para
 * aplicar um filtro que roda no navegador — os `<select>` agora mexem em estado
 * e o resultado é imediato. A URL continua compartilhável: o estado é lido de
 * `window.location.search` depois da hidratação e escrito de volta com
 * `history.replaceState`, o mesmo contrato de `TabelaEstatica` e das outras
 * nove tabelas do repositório.
 *
 * `useSearchParams()` saiu junto — era ele que exigia o `<Suspense>` e o
 * componente-sósia `ListaLegislacaoCompleta` em `page.tsx` (passar o MESMO
 * componente dos dois lados do boundary derruba o `next build`). Sem o hook,
 * some o boundary e some a duplicata.
 *
 * ═══ A CONSEQUÊNCIA CONHECIDA DISSO, DITA EM VOZ ALTA ═══
 *
 * O cartão "Áreas legisladas" linka para `?tema=…` na PRÓPRIA rota. Como é
 * navegação suave do roteador, o componente não remonta e o efeito que lê a URL
 * não roda de novo — o clique no gráfico não aplica mais o filtro sozinho
 * (link colado ou página recarregada continua aplicando). É a mesma troca que
 * `prefeitura/contratos` já faz com o mesmo cartão desde que virou
 * `TabelaEstatica`, e por isso a área virou também um `<select>` aqui: o filtro
 * continua alcançável pela tela, não só pela URL.
 *
 * `TEMA_LABELS` chega por prop, não por import: `lib/betim/temas.ts` importa
 * `lib/db/queries/betim`, e importar isso aqui arrastaria código de servidor
 * para o bundle do cliente. `labelDoDireito` e `RESSALVA_INDICIO` são seguros —
 * só leem JSON estático.
 */
type LinhaAto = AtoRow & Record<string, unknown>;

export interface ListaLegislacaoProps {
  /** Base do índice: `${base}/manifesto.json` e `${base}/<n>.json`. */
  base: string;
  categoriasDisponiveis: string[];
  anosDisponiveis: number[];
  temas: ContagemTema[];
  direitosDisponiveis: DireitoContagem[];
  atosAnalisados: number;
  analiseOk: boolean;
  total: number;
  cidadeNome: string;
  temaLabels: Record<string, string>;
}

/**
 * Constantes de módulo, não literais no JSX: `TabelaEstatica` usa as duas em
 * dependências de `useMemo`, e um array novo a cada render refiltraria o acervo
 * inteiro a cada tecla digitada na busca.
 */
const CAMPOS_BUSCA: (keyof LinhaAto & string)[] = ["ementa", "tipo", "numero"];

/** O par abrir/fechar do `<summary>`, que aparece nas duas justificativas. */
function AlternaJustificativa({ abrir, fechar }: { abrir: string; fechar: string }) {
  return (
    <>
      <span className="text-xs text-accent underline decoration-dotted group-open:hidden">
        {abrir}
      </span>
      <span className="hidden text-xs text-accent underline decoration-dotted group-open:inline">
        {fechar}
      </span>
    </>
  );
}

function colunas(temaLabels: Record<string, string>): ColunaTabela<LinhaAto>[] {
  return [
    {
      chave: "tipo",
      rotulo: "Norma",
      formatar: (a) => (
        <div className="flex min-w-[9rem] flex-col gap-1.5">
          <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {a.tipo ?? "Ato"}
          </span>
          <span className="font-medium text-text">
            nº {a.numero ?? "s/n"}
            {a.ano ? `/${a.ano}` : ""}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {/* `RotuloBadge` sem rótulo desenha "pendente" e `VicioBadge` sem
                nível não desenha nada — é o acordo do eixo: norma não analisada
                aparece como não analisada, nunca como neutra, e ausência de
                indício de vício é silêncio. */}
            {a.analise ? (
              <RotuloBadge rotulo={a.analise.rotulo} score={a.analise.score} tamanho="sm" />
            ) : null}
            <VicioBadge nivel={a.vicio?.nivelGravidade} tamanho="sm" />
          </div>
          {a.mapaIdx != null && (
            // `<a>` cru: `/funcaosocialterra` é outra zona, não leva o prefixo
            // de cidade do `Link` daqui.
            <a
              href={`/funcaosocialterra/mapa?camada=normas-geolocalizadas&idx=${a.mapaIdx}`}
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
              target="_blank"
              rel="noopener"
            >
              Ver no mapa
            </a>
          )}
        </div>
      ),
    },
    {
      chave: "ementa",
      rotulo: "Ementa e análise",
      formatar: (a) => (
        <div className="flex max-w-[46rem] flex-col gap-2">
          {a.ementa ? (
            <span className="text-text-soft">{a.ementa}</span>
          ) : (
            <span className="text-text-soft">— (ementa não publicada na fonte)</span>
          )}
          {a.temas && a.temas.length > 0 && (
            <ul className="flex flex-wrap gap-1">
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
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
                <AlternaJustificativa abrir="ver justificativa" fechar="ocultar justificativa" />
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
                    {item.trecho && <p className="mt-1 italic text-text-soft">“{item.trecho}”</p>}
                  </div>
                ))}
              </div>
            </details>
          )}
          {a.vicio && (
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
                <AlternaJustificativa abrir="ver indício de vício" fechar="ocultar indício" />
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
                    {item.trecho && <p className="mt-1 italic text-text-soft">“{item.trecho}”</p>}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      ),
    },
    {
      chave: "dataPublicacao",
      rotulo: "Publicação",
      formatar: (a) => (
        <span className="whitespace-nowrap">{a.dataPublicacao ? formatDateBR(a.dataPublicacao) : "—"}</span>
      ),
    },
  ];
}

export default function ListaLegislacao({
  base,
  categoriasDisponiveis,
  anosDisponiveis,
  temas,
  direitosDisponiveis,
  atosAnalisados,
  analiseOk,
  total,
  cidadeNome,
  temaLabels,
}: ListaLegislacaoProps) {
  const [categoria, setCategoria] = useState("");
  const [ano, setAno] = useState("");
  const [tema, setTema] = useState("");
  const [direito, setDireito] = useState("");
  const primeiraRenderizacao = useRef(true);

  // Estado inicial da URL depois da hidratação, e de volta com
  // `replaceState` — mesmo padrão de `ListaContratos.tsx`, e pelo mesmo motivo
  // (`useSearchParams()` reprova no `output: 'export'`).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location/sessionStorage: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    setCategoria(sp.get("categoria") ?? "");
    setAno(sp.get("ano") ?? "");
    setTema(sp.get("tema") ?? "");
    setDireito(sp.get("direito") ?? "");
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (categoria) {
      sp.set("categoria", categoria);
    } else {
      sp.delete("categoria");
    }
    if (ano) {
      sp.set("ano", ano);
    } else {
      sp.delete("ano");
    }
    if (tema) {
      sp.set("tema", tema);
    } else {
      sp.delete("tema");
    }
    if (direito) {
      sp.set("direito", direito);
    } else {
      sp.delete("direito");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [categoria, ano, tema, direito]);

  // `atoPassaNoFiltro` é a MESMA função que o verificador de paridade usa —
  // ver `lib/betim/legislacao-filtro.ts`. O `useCallback` não é cosmético:
  // `TabelaEstatica` põe o predicado numa dependência de `useMemo`.
  const filtrar = useCallback(
    (a: LinhaAto) => atoPassaNoFiltro(a, { categoria, ano, tema, direito }),
    [categoria, ano, tema, direito]
  );

  const colunasDaTela = useMemo(() => colunas(temaLabels), [temaLabels]);
  const temFiltro = Boolean(categoria || ano || tema || direito);

  return (
    <TabelaEstatica<LinhaAto>
      base={base}
      colunas={colunasDaTela}
      camposBusca={CAMPOS_BUSCA}
      vazio="Nenhuma norma publicada para este município."
      filtrar={filtrar}
      controles={() => (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label htmlFor="categoria" className="mb-1 text-xs font-medium text-text-soft">
                Categoria
              </label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
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
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
              >
                <option value="">Todos</option>
                {anosDisponiveis.map((a) => (
                  <option key={a} value={String(a)}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            {temas.length > 0 && (
              <div className="flex flex-col">
                <label htmlFor="tema" className="mb-1 text-xs font-medium text-text-soft">
                  Área temática
                </label>
                <select
                  id="tema"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
                >
                  <option value="">Todas</option>
                  {temas.map((t) => (
                    <option key={t.tema} value={t.tema}>
                      {t.label} ({formatNumberBR(t.qtd)})
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                  value={direito}
                  onChange={(e) => setDireito(e.target.value)}
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
            {temFiltro && (
              <button
                type="button"
                onClick={() => {
                  setCategoria("");
                  setAno("");
                  setTema("");
                  setDireito("");
                }}
                className="cursor-pointer pb-1.5 text-sm text-text-soft hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* O DENOMINADOR DO FILTRO POR DIREITO, ANTES DE O LEITOR CONTAR.
              Esta faixa existia como bloco de estado vazio na versão anterior e
              não podia ficar lá: `TabelaEstatica` é quem desenha o vazio agora,
              e a ressalva não é sobre a lista estar vazia — é sobre o que o
              número significa quando ela NÃO está. Quem filtra por "direito à
              saúde" e vê 4 normas precisa ler "4 das 60 lidas", não "4 das
              3.577". */}
          {direito && (
            <p className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-text-soft">
              {!analiseOk ? (
                <>
                  <strong className="text-text">Não foi possível consultar a análise.</strong> O
                  filtro por direito depende da análise garantista, que não respondeu agora — o que
                  aparecer aqui está incompleto, e isto não é o mesmo que “nenhuma norma afeta esse
                  direito”.
                </>
              ) : atosAnalisados === 0 ? (
                <>
                  <strong className="text-text">
                    Nenhuma norma de {cidadeNome} foi analisada ainda.
                  </strong>{" "}
                  O filtro por direito não tem sobre o que operar: a fila de análise desta cidade
                  começou pelos projetos que ainda tramitam na Câmara.
                </>
              ) : (
                <>
                  Filtrando por <strong className="text-text">{labelDoDireito(direito)}</strong> —
                  leitura da análise garantista deste portal, não classificação oficial, e{" "}
                  <strong className="text-text">
                    só entre as {formatNumberBR(atosAnalisados)} normas já analisadas
                  </strong>
                  , não entre as {formatNumberBR(total)} publicadas. Restam{" "}
                  {formatNumberBR(Math.max(0, total - atosAnalisados))} normas que a análise ainda
                  não leu — o silêncio aqui é sobre a amostra, não sobre a {cidadeNome} inteira.
                </>
              )}
            </p>
          )}
        </div>
      )}
    />
  );
}
