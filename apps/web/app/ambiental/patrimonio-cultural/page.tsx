import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { listarPatrimonioTombado, type CategoriaPatrimonioTombado } from "@/lib/db/queries/patrimonio-tombado";
import { CATEGORIA_LABEL, contarPorCategoria } from "@/lib/ambiental/patrimonio-tombado";
import BuscaPatrimonioTombado from "./BuscaPatrimonioTombado";
import Link from "@/lib/ambiental/link";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/ambiental/patrimonio-cultural", {
  title: "Patrimônio cultural tombado — Controle Popular · Ambiental",
  description:
    "Os bens culturais materiais tombados pelo Estado de Minas Gerais — imóveis, conjuntos paisagísticos e centros históricos protegidos pelo IEPHA-MG, filtráveis por município e categoria.",
});

/**
 * `/ambiental/patrimonio-cultural` — Tarefa 2b da unificação de legislação
 * (pedido do dono, 2026-08-13): "isso hoje NÃO está no portal — o acervo é
 * ambiental [...] tombamento restringe o que pode ser feito com um
 * território, exatamente como área protegida ambiental".
 *
 * ═══ POR QUE PÁGINA PRÓPRIA, NÃO DENTRO DE `/ambiental/legislacao` ═══
 *
 * Cada linha aqui é um BEM tombado, não uma norma — mais parecido com
 * `ambiental_licenciamento` (um registro administrativo com efeito sobre um
 * lugar) do que com `ambiental_legislacao`/`direito_critico_*` (texto de
 * lei ou decisão). Forçar os 153 bens dentro do filtro de tema da
 * legislação inflaria aquele painel com um tipo de dado que ele não foi
 * desenhado pra mostrar (um bem não tem "artigo" nem "ementa"). A ligação
 * entre os dois continua feita por TEXTO — ver a seção "de onde vem cada
 * item" de `/ambiental/legislacao`, que linka pra cá.
 *
 * ═══ FONTE E LACUNA DECLARADA (medido em 2026-08-13) ═══
 *
 * Dataset "Patrimônio Cultural Tombado" do IEPHA-MG, CKAN de dados abertos
 * de MG, licença CC-BY-4.0 — 153 bens tombados (migration `0072`, ingestor
 * `etl/betim/etl/apis/patrimonio_tombado_iepha.py`). O QUE NÃO ENTROU:
 * geometria (existe, camada `ide_2017_mg_tombamento_iepha_pto` no
 * IDE-Sisema, mas integrar ao mapa 3D é outra frente) e busca por número de
 * processo (o IEPHA não publica nenhuma — orientação oficial é ida
 * presencial à biblioteca do instituto).
 *
 * ═══ CARTÕES, GRÁFICO, CSV, FILTRO, ORDENAÇÃO (regra do dono, 2026-08-21) ═══
 *
 * O gráfico pedido é "por município e por tipo de tombamento" — em vez de
 * dois desenhos separados, é UM só, empilhado (mesmo mecanismo de
 * `/ambiental/decisoes-lai`: barra por município, segmentada por categoria),
 * porque as duas perguntas são a mesma pergunta em dois eixos. Os 10
 * municípios com mais bens aparecem nomeados; o resto soma numa barra
 * "Outros N municípios" — sem isso, com dezenas de municípios de 1 bem cada,
 * o gráfico venceria a régua de legibilidade, não a de honestidade (nenhum
 * bem some da CONTAGEM, só do desenho).
 *
 * `CATEGORIA_ORDEM`/`COR_POR_SLOT` são cópia local da mesma régua ordinal
 * (`--color-ord-1..4`, classes `.cp-ord-*` de `globals.css`) que
 * `/ambiental/decisoes-lai` já usa — mesmo motivo de sempre: cada página
 * mantém sua própria cópia pequena em vez de importar de outra zona.
 */
const CATEGORIA_ORDEM: CategoriaPatrimonioTombado[] = ["BI", "CP", "CH", "BM"];
const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};
const SLOT_POR_CATEGORIA: Record<CategoriaPatrimonioTombado, number> = {
  BI: 1,
  CP: 2,
  CH: 3,
  BM: 4,
};
const TOP_MUNICIPIOS = 10;

interface ContagemMunicipioCategoria {
  municipio: string;
  total: number;
  BI: number;
  BM: number;
  CH: number;
  CP: number;
}

function contarPorMunicipioECategoria(
  linhas: Awaited<ReturnType<typeof listarPatrimonioTombado>>
): ContagemMunicipioCategoria[] {
  const mapa = new Map<string, ContagemMunicipioCategoria>();
  for (const r of linhas) {
    const atual = mapa.get(r.municipio) ?? { municipio: r.municipio, total: 0, BI: 0, BM: 0, CH: 0, CP: 0 };
    atual.total += 1;
    atual[r.categoria] += 1;
    mapa.set(r.municipio, atual);
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}

export default async function PatrimonioCulturalIndex() {
  const linhas = await listarPatrimonioTombado();

  const contagemCategoria = contarPorCategoria(linhas);
  const categoriaMaisComum =
    linhas.length > 0
      ? (Object.entries(contagemCategoria) as [CategoriaPatrimonioTombado, number][]).sort((a, b) => b[1] - a[1])[0]
      : null;
  const semAtoLegal = linhas.filter((l) => !l.atoLegal).length;

  const porMunicipio = contarPorMunicipioECategoria(linhas);
  const totalMunicipiosDistintos = porMunicipio.length;
  const topMunicipios = porMunicipio.slice(0, TOP_MUNICIPIOS);
  const restoMunicipios = porMunicipio.slice(TOP_MUNICIPIOS);
  const outrosAgregado: ContagemMunicipioCategoria | null =
    restoMunicipios.length > 0
      ? restoMunicipios.reduce(
          (acc, m) => ({
            municipio: `Outros ${restoMunicipios.length} municípios`,
            total: acc.total + m.total,
            BI: acc.BI + m.BI,
            BM: acc.BM + m.BM,
            CH: acc.CH + m.CH,
            CP: acc.CP + m.CP,
          }),
          { municipio: "", total: 0, BI: 0, BM: 0, CH: 0, CP: 0 }
        )
      : null;
  const barrasMunicipio = outrosAgregado ? [...topMunicipios, outrosAgregado] : topMunicipios;
  const maxMunicipio = Math.max(1, ...barrasMunicipio.map((m) => m.total));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual · Patrimônio cultural
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O patrimônio cultural tombado por Minas Gerais
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Tombamento restringe o que pode ser feito com um imóvel ou território — o mesmo tipo de
          proteção que uma unidade de conservação ambiental impõe, só que pelo valor histórico,
          artístico ou paisagístico do bem, não pelo valor ecológico. Uma serra tombada e uma serra
          com lavra autorizada em cima é o mesmo conflito que{" "}
          <Link href="/legislacao" className="text-accent hover:underline">
            legislação e precedentes de proteção
          </Link>{" "}
          já mapeiam — este acervo cobre a outra metade.
        </p>

        {linhas.length === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.95em] text-text-soft">
            Nada coletado ainda. O ingestor (
            <code className="font-mono text-[.85em]">etl.apis.patrimonio_tombado_iepha</code>) ainda
            não rodou contra este banco.
          </p>
        ) : (
          <p
            className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <strong className="font-tabular">{formatNumberBR(linhas.length)}</strong> bens culturais
            tombados pelo Estado — imóveis, conjuntos paisagísticos, centros históricos e bens
            móveis, em {formatNumberBR(new Set(linhas.map((l) => l.municipio)).size)} municípios.
          </p>
        )}
      </header>

      {linhas.length > 0 && categoriaMaisComum && (
        <>
          {/* ═══ CARTÕES DE TOPO ═══ */}
          <section aria-labelledby="numeros-patrimonio" className="mt-10">
            <h2 id="numeros-patrimonio" className="font-display text-xl font-semibold">
              O acervo em números
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Bens tombados
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(linhas.length)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Municípios com bem tombado
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(totalMunicipiosDistintos)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Categoria mais comum
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {CATEGORIA_LABEL[categoriaMaisComum[0]]}
                </p>
                <p className="mt-1 text-[.86em] text-text-soft">
                  {formatNumberBR(categoriaMaisComum[1])} bens (
                  {((100 * categoriaMaisComum[1]) / linhas.length).toFixed(1).replace(".", ",")}%)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-4">
                <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
                  Sem ato legal registrado na base
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-text">
                  {formatNumberBR(semAtoLegal)}
                </p>
                <p className="mt-1 text-[.86em] text-text-soft">
                  de {formatNumberBR(linhas.length)} — não prova ausência de tombamento formal, só que a
                  base não traz o ato
                </p>
              </div>
            </div>
          </section>

          {/* ═══ GRÁFICO — por município, empilhado por categoria (tipo) ═══ */}
          <section aria-labelledby="grafico-patrimonio" className="mt-10">
            <h2 id="grafico-patrimonio" className="font-display text-xl font-semibold">
              Por município e por tipo de tombamento
            </h2>
            <p className="mt-2 max-w-2xl text-[.92em] text-text-soft">
              Os {formatNumberBR(Math.min(TOP_MUNICIPIOS, totalMunicipiosDistintos))} municípios com mais
              bens tombados, cada barra segmentada pelas 4 categorias oficiais do IEPHA-MG. Os demais
              municípios somam numa única barra ao final — nenhum bem sai da contagem, só do desenho.
            </p>

            <figure className="mt-5">
              <div className="sr-only">
                Gráfico de barras horizontais, uma por município, comprimento proporcional ao total de
                bens tombados no município e segmentado por categoria.{" "}
                {barrasMunicipio
                  .map(
                    (m) =>
                      `${m.municipio}: ${m.total} bens — ${m.BI} bem imóvel, ${m.CP} conjunto paisagístico, ${m.CH} centro histórico, ${m.BM} bem móvel.`
                  )
                  .join(" ")}
              </div>

              <div aria-hidden className="space-y-2.5">
                {barrasMunicipio.map((m) => (
                  <div key={m.municipio} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 truncate text-right font-tabular text-[.85em] font-semibold text-text" title={m.municipio}>
                      {m.municipio}
                    </span>
                    <div className="cp-ord-track h-4 flex-1 overflow-hidden">
                      <div className="flex h-full" style={{ width: `${(m.total / maxMunicipio) * 100}%` }}>
                        {CATEGORIA_ORDEM.map((c) => {
                          const valor = m[c];
                          if (valor <= 0) return null;
                          const slot = SLOT_POR_CATEGORIA[c];
                          return (
                            <div
                              key={c}
                              className={`cp-ord-seg cp-ord-seg-${slot} h-full first:rounded-l-[3px] last:rounded-r-[3px]`}
                              style={{ width: `${(valor / m.total) * 100}%`, background: COR_POR_SLOT[slot] }}
                              title={`${m.municipio} · ${CATEGORIA_LABEL[c]}: ${formatNumberBR(valor)}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <span className="w-10 shrink-0 font-tabular text-[.85em] text-text-soft">
                      {formatNumberBR(m.total)}
                    </span>
                  </div>
                ))}
              </div>

              <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[.85em] text-text-soft">
                {CATEGORIA_ORDEM.map((c) => (
                  <span key={c} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={`cp-ord-seg cp-ord-seg-${SLOT_POR_CATEGORIA[c]} inline-block h-3 w-3 rounded-sm`}
                      style={{ background: COR_POR_SLOT[SLOT_POR_CATEGORIA[c]] }}
                    />
                    {CATEGORIA_LABEL[c]} ({formatNumberBR(contagemCategoria[c])})
                  </span>
                ))}
              </figcaption>
            </figure>

            {/* Alternativa em tabela — os mesmos números do gráfico, por extenso. */}
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-[.88em]">
                <caption className="mb-2 text-left text-[.85em] text-text-soft">
                  Tabela completa — alternativa em texto ao gráfico acima.
                </caption>
                <thead>
                  <tr className="border-b border-border text-left text-text">
                    <th className="py-2 pr-3 font-medium">Município</th>
                    <th className="py-2 pr-3 text-right font-medium">Total</th>
                    <th className="py-2 pr-3 text-right font-medium">Bem imóvel</th>
                    <th className="py-2 pr-3 text-right font-medium">Conj. paisagístico</th>
                    <th className="py-2 pr-3 text-right font-medium">Centro histórico</th>
                    <th className="py-2 text-right font-medium">Bem móvel</th>
                  </tr>
                </thead>
                <tbody className="text-text-soft">
                  {barrasMunicipio.map((m) => (
                    <tr key={m.municipio} className="border-b border-border/60">
                      <td className="py-2 pr-3 font-medium text-text">{m.municipio}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(m.total)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(m.BI)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(m.CP)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(m.CH)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumberBR(m.BM)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section className="mt-10">
        <BuscaPatrimonioTombado linhas={linhas} />
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-3 text-[.92em] text-text-soft">
          Dataset &quot;Patrimônio Cultural Tombado&quot;, publicado pelo próprio IEPHA-MG
          (Instituto Estadual do Patrimônio Histórico e Artístico de Minas Gerais) no CKAN de dados
          abertos do estado, com curadoria da Controladoria-Geral do Estado. Licença CC-BY-4.0,
          declarada no schema oficial do dataset — a mesma abertura que já vale para as outras
          fontes do portal. O tombamento em si é regido pela Lei Delegada nº 170/2007 (cria o
          Conselho Estadual do Patrimônio Cultural — CONEP-MG) e pelo Decreto nº 44.785/2008, com
          base no Decreto-Lei federal nº 25/1937.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Duas lacunas declaradas, não escondidas: (1) o IEPHA publica geometria dos bens tombados
          (camada de ponto no IDE-Sisema, acesso livre) que este acervo NÃO integra — colocar essa
          camada no mapa 3D é trabalho de outra frente do projeto; (2) o IEPHA não tem busca pública
          por número de processo nem API própria — a orientação oficial pra consultar um processo é
          ida presencial à biblioteca do instituto, medido nesta investigação, não uma limitação
          deste ingestor.
        </p>
      </section>
    </div>
  );
}
