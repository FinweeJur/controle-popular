import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import { COBERTURA_DECISOES_CGE, DECISOES_CGE_POR_TIPO_ANO } from "@/lib/ambiental/decisoes-cge";
import { metadataEditavel } from "@/lib/edicoes";
import TabelaDecisoes from "./TabelaDecisoes";

/**
 * `/ambiental/decisoes-lai` — as decisões de recurso de pedidos de LAI (Lei
 * de Acesso à Informação) negados a órgãos do Governo de Minas Gerais,
 * julgados pela CGE-MG.
 *
 * ═══ O QUE ESTE CORPUS É, E O QUE ELE NÃO É ═══
 *
 * Minas Gerais **não publica** os pedidos de LAI nem as respostas (ao
 * contrário do federal, que publica os dois em CSV). O que existe, sem
 * login e sem captcha, é só o julgamento de RECURSO: quando um pedido é
 * negado ou respondido de forma insatisfatória, quem pediu pode recorrer, e
 * a CGE-MG julga. Esta página é o catálogo desses julgamentos — não é, e não
 * pretende ser, um censo de todos os pedidos de LAI feitos ao Estado.
 * `docs/FONTES.md`, seção "Decisões de recurso de LAI da CGE-MG", documenta
 * o protocolo (ASP.NET WebForms, viewstate por página) e as duas lacunas que
 * a página declara explicitamente abaixo.
 *
 * ═══ POR QUE A PÁGINA DE SERVIDOR SÓ IMPORTA A COBERTURA E O AGREGADO ═══
 *
 * `DECISOES_CGE_MG` (753 registros individuais, ~185 KiB) entra só em
 * `TabelaDecisoes.tsx`, componente de CLIENTE — mesma divisão de
 * `/ambiental/convenios` (`ConveniosClient.tsx`). Aqui na página de servidor
 * só entram `COBERTURA_DECISOES_CGE` (agregado) e
 * `DECISOES_CGE_POR_TIPO_ANO` (7 linhas, uma por ano), o bastante para os
 * cartões, o gráfico e a tabela de alternativa em texto. Ver o teto de 3 MiB
 * gzip do Worker em `docs/ARQUITETURA.md`.
 */

const C = COBERTURA_DECISOES_CGE;

export const metadata: Metadata = metadataEditavel("/ambiental/decisoes-lai", {
  title: "Decisões de recurso de LAI (CGE-MG) — Controle Popular · Ambiental",
  description: `Catálogo de ${formatNumberBR(C.totalGeral)} decisões de recurso de pedidos de Lei de Acesso à Informação negados a órgãos do Governo de Minas Gerais, julgadas pela CGE-MG entre ${C.anoInicial} e ${C.anoFinal} — o único corpus de LAI estadual pesquisável, já que MG não publica os pedidos nem as respostas.`,
});

/** Agrupa os 6 tipos oficiais do filtro `ddlTipoDecisao` em 4 canais visuais
 *  para o gráfico: os dois que dominam ficam sozinhos, "perda" e
 *  "provimento" cada um funde a versão total com a parcial. A tabela abaixo
 *  do gráfico mostra os 6 tipos sem fundir nada — o agrupamento é só do
 *  desenho, nunca do dado. */
function agruparAno(a: (typeof DECISOES_CGE_POR_TIPO_ANO)[number]) {
  return {
    ano: a.ano,
    total: a.total,
    naoConhecimento: a.porTipo.naoConhecimento,
    desprovimento: a.porTipo.desprovimento,
    perda: a.porTipo.perdaDeObjeto + a.porTipo.perdaParcialDeObjeto,
    provimento: a.porTipo.provimento + a.porTipo.provimentoParcial,
    semTipo: a.semTipo,
  };
}

const SERIE = DECISOES_CGE_POR_TIPO_ANO.map(agruparAno);
const MAX_ANO = Math.max(...SERIE.map((a) => a.total));

/**
 * Mesma rampa ordinal (`--color-ord-1..4`) e mesmas classes CSS
 * (`.cp-ord-track`/`.cp-ord-seg`/`.cp-ord-seg-4`) de `StackedPointsBar.tsx`
 * (`app/[municipio]/components/charts/`) — reaproveitadas aqui via classe
 * global, sem importar componente de outra zona. `.cp-ord-seg-4` já vem com
 * a textura de hachura embutida (ver `globals.css`), e por isso o tipo mais
 * raro (Provimento) ocupa o slot 4: é o mesmo tratamento de acessibilidade
 * que o resto do site já dá ao degrau mais leve de uma pilha.
 *
 * "Sem tipo" NÃO é um degrau da rampa ordinal — é lacuna, categoria
 * diferente — por isso fica fora do `slot` e ganha textura própria
 * (hachura diagonal sobre `--color-chart-track`) em vez de herdar `cp-ord-*`.
 */
const LEGENDA = [
  { chave: "naoConhecimento", rotulo: "Não conhecimento", slot: 1 },
  { chave: "desprovimento", rotulo: "Desprovimento", slot: 2 },
  { chave: "perda", rotulo: "Perda de objeto (total ou parcial)", slot: 3 },
  { chave: "provimento", rotulo: "Provimento (total ou parcial) — raro", slot: 4 },
] as const;

const COR_POR_SLOT: Record<number, string> = {
  1: "var(--color-ord-1)",
  2: "var(--color-ord-2)",
  3: "var(--color-ord-3)",
  4: "var(--color-ord-4)",
};

const HACHURA_SEM_TIPO =
  "repeating-linear-gradient(45deg, var(--color-chart-track) 0 4px, var(--color-border) 4px 5px)";

export default function DecisoesLaiPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/ambiental" className="hover:text-primary">
          Ambiental
        </a>{" "}
        · <span className="text-text">Decisões de recurso de LAI (CGE-MG)</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Ambiental · Transparência
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          As decisões de recurso de LAI da CGE-MG, uma a uma
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Minas Gerais <strong className="text-text">não publica</strong> os pedidos de acesso à
          informação nem as respostas dos órgãos — só isso já tira do alcance de qualquer
          fiscalização o que a maioria dos pedidos pergunta e recebe. O que existe, sem login e sem
          captcha, é o julgamento de <strong className="text-text">recurso</strong>: quando um
          pedido é negado ou respondido mal, quem pediu pode recorrer à Controladoria-Geral do
          Estado, e é isso que este catálogo reúne —{" "}
          <strong className="text-text">{formatNumberBR(C.totalGeral)} decisões</strong>, de{" "}
          {C.anoInicial} a {C.anoFinal}.
        </p>
      </header>

      {/* ═══ DECLARAÇÃO — de quem é o dado e o que ele não cobre ═══ */}
      <section
        aria-labelledby="declaracao-decisoes"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-decisoes" className="font-display text-base font-semibold text-text">
          De quem é este dado, e o que ele não cobre
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <li>
            <strong className="text-text">Fonte:</strong>{" "}
            <a
              href="https://www.acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              acessoainformacao.mg.gov.br ↗
            </a>{" "}
            — sistema público da Controladoria-Geral do Estado de Minas Gerais (CGE-MG), sem login
            e sem captcha. Sondado em {C.medidoEm.split("-").reverse().join("/")}.
          </li>
          <li>
            <strong className="text-text">Só recurso, nunca o pedido original.</strong> Este é o
            único corpus de LAI estadual pesquisável que existe — MG não publica busca de pedidos
            respondidos nem download em massa. Quem quiser saber o que foi pedido e o que foi
            respondido em primeira instância não encontra isso aqui: só o que chegou a recurso.
          </li>
          <li>
            <strong className="text-text">Zero é informação, não falha.</strong>{" "}
            Quando a busca não acha nada para um filtro, a própria fonte troca a frase inteira por
            &ldquo;Nenhum
            resultado encontrado para a pesquisa&rdquo; — sem tabela, sem total. Se um filtro aqui
            devolver lista vazia, é a mesma coisa: resposta, não erro.
          </li>
          <li>
            <strong className="text-text">Este portal não afirma irregularidade.</strong> É a
            reprodução do que a CGE-MG publicou, com link para cada decisão.
          </li>
        </ul>
      </section>

      {/* ═══ OS DOIS AVISOS QUE MUDAM O QUE DÁ PARA PROMETER COM ESTE DADO ═══ */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 text-[.92em] leading-relaxed text-text-soft">
          <p className="font-display text-base font-semibold text-text">
            Provimento é raro: {formatNumberBR(16)} em sete anos
          </p>
          <p className="mt-2">
            Em 2020 e 2022 nenhum recurso foi provido. A ideia de filtrar por Provimento para
            mapear &ldquo;negativas indevidas&rdquo; <strong className="text-text">não se
            sustenta no volume</strong> — são casos exemplares, nunca base estatística. O que
            domina é <strong className="text-text">Não conhecimento</strong> e{" "}
            <strong className="text-text">Desprovimento</strong>: o recurso não é apreciado, ou o
            cidadão perde.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 text-[.92em] leading-relaxed text-text-soft">
          <p className="font-display text-base font-semibold text-text">
            Em {formatNumberBR(C.anosComLacuna.length)} dos 7 anos, a soma por tipo não fecha
          </p>
          <p className="mt-2">
            Em {C.anosComLacuna.join(", ")} a soma dos 6 tipos do filtro oficial fica abaixo do
            total do ano — até metade dos registros sem tipo atribuído.{" "}
            <strong className="text-text">Não investigado</strong>: pode ser campo não preenchido
            na origem, ou tipo fora do dropdown. Esta página nunca publica &ldquo;total por
            tipo&rdquo; para esses anos como se a soma fechasse.
          </p>
        </div>
      </section>

      {/* ═══ OS NÚMEROS DE TOPO ═══ */}
      <section aria-labelledby="numeros-decisoes" className="mt-10">
        <h2 id="numeros-decisoes" className="font-display text-xl font-bold tracking-tight text-text">
          O corpus em números
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Decisões, {C.anoInicial}–{C.anoFinal}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.totalGeral)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Com tipo do filtro oficial
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.totalComTipoOficial)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Sem tipo atribuído
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.totalSemTipoOficial)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              {C.percentualSemTipoOficial.toString().replace(".", ",")}% do total
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[.82em] font-medium uppercase tracking-wide text-text-soft">
              Link provavelmente quebrado
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-text">
              {formatNumberBR(C.registrosComLinkProvavelmenteQuebrado)}
            </p>
            <p className="mt-1 text-[.86em] text-text-soft">
              inferido do padrão da URL, não verificado registro a registro
            </p>
          </div>
        </div>
      </section>

      {/* ═══ O GRÁFICO — por ano, empilhado por tipo ═══ */}
      <section aria-labelledby="grafico-decisoes" className="mt-10">
        <h2 id="grafico-decisoes" className="font-display text-xl font-bold tracking-tight text-text">
          Por ano, empilhado por tipo
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          Perda de objeto (total e parcial) e Provimento (total e parcial) aparecem fundidos aqui
          só para caber em um canal visual — a tabela logo abaixo mostra os 6 tipos oficiais sem
          fundir nada, e é ela, não o desenho, a fonte de qualquer número exato.
        </p>

        <figure className="mt-5">
          <div className="sr-only">
            Gráfico de barras horizontais, uma por ano, {C.anoInicial} a {C.anoFinal}, comprimento
            proporcional ao total de decisões do ano e segmentada por tipo.{" "}
            {SERIE.map(
              (a) =>
                `${a.ano}: ${a.total} decisões — ${a.naoConhecimento} não conhecimento, ${a.desprovimento} desprovimento, ${a.perda} perda de objeto (total ou parcial), ${a.provimento} provimento (total ou parcial)${a.semTipo > 0 ? `, ${a.semTipo} sem tipo atribuído` : ""}.`,
            ).join(" ")}
          </div>

          <div aria-hidden className="space-y-2.5">
            {SERIE.map((a) => (
              <div key={a.ano} className="flex items-center gap-3">
                <span className="w-11 shrink-0 text-right font-tabular text-[.85em] font-semibold text-text">
                  {a.ano}
                </span>
                <div className="cp-ord-track h-4 flex-1 overflow-hidden">
                  <div className="flex h-full" style={{ width: `${(a.total / MAX_ANO) * 100}%` }}>
                    {LEGENDA.map((l) => {
                      const valor = a[l.chave as "naoConhecimento" | "desprovimento" | "perda" | "provimento"];
                      if (valor <= 0) return null;
                      return (
                        <div
                          key={l.chave}
                          className={`cp-ord-seg cp-ord-seg-${l.slot} h-full first:rounded-l-[3px] last:rounded-r-[3px]`}
                          style={{ width: `${(valor / a.total) * 100}%`, background: COR_POR_SLOT[l.slot] }}
                          title={`${a.ano} · ${l.rotulo}: ${formatNumberBR(valor)}`}
                        />
                      );
                    })}
                    {a.semTipo > 0 && (
                      <div
                        className="cp-ord-seg h-full last:rounded-r-[3px]"
                        style={{ width: `${(a.semTipo / a.total) * 100}%`, background: HACHURA_SEM_TIPO }}
                        title={`${a.ano} · Sem tipo atribuído: ${formatNumberBR(a.semTipo)}`}
                      />
                    )}
                  </div>
                </div>
                <span className="w-14 shrink-0 font-tabular text-[.85em] text-text-soft">
                  {formatNumberBR(a.total)}
                </span>
              </div>
            ))}
          </div>

          <figcaption className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[.85em] text-text-soft">
            {LEGENDA.map((l) => (
              <span key={l.chave} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className={`cp-ord-seg cp-ord-seg-${l.slot} inline-block h-3 w-3 rounded-sm`}
                  style={{ background: COR_POR_SLOT[l.slot] }}
                />
                {l.rotulo}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-3 w-3 rounded-sm border border-border"
                style={{ background: HACHURA_SEM_TIPO }}
              />
              Sem tipo atribuído (lacuna, só 2022–2025)
            </span>
          </figcaption>
        </figure>

        {/* Alternativa em texto/tabela — os 6 tipos oficiais, sem fundir nada. */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[.88em]">
            <caption className="mb-2 text-left text-[.85em] text-text-soft">
              Tabela completa, os 6 tipos do filtro oficial <code>ddlTipoDecisao</code> — alternativa
              em texto ao gráfico acima. Anos marcados com * não fecham a soma (ver aviso).
            </caption>
            <thead>
              <tr className="border-b border-border text-left text-text">
                <th className="py-2 pr-3 font-medium">Ano</th>
                <th className="py-2 pr-3 text-right font-medium">Total</th>
                <th className="py-2 pr-3 text-right font-medium">Desprov.</th>
                <th className="py-2 pr-3 text-right font-medium">Não conh.</th>
                <th className="py-2 pr-3 text-right font-medium">Perda obj.</th>
                <th className="py-2 pr-3 text-right font-medium">Perda parc.</th>
                <th className="py-2 pr-3 text-right font-medium">Provim.</th>
                <th className="py-2 pr-3 text-right font-medium">Provim. parc.</th>
                <th className="py-2 text-right font-medium">Sem tipo</th>
              </tr>
            </thead>
            <tbody className="text-text-soft">
              {DECISOES_CGE_POR_TIPO_ANO.map((a) => {
                const fecha = a.semTipo === 0;
                return (
                  <tr key={a.ano} className="border-b border-border/60">
                    <td className="py-2 pr-3 font-medium text-text">
                      {a.ano}
                      {!fecha ? " *" : ""}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.total)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.porTipo.desprovimento)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.porTipo.naoConhecimento)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.porTipo.perdaDeObjeto)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.porTipo.perdaParcialDeObjeto)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.porTipo.provimento)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{formatNumberBR(a.porTipo.provimentoParcial)}</td>
                    <td className="py-2 text-right tabular-nums">
                      {a.semTipo > 0 ? `${formatNumberBR(a.semTipo)} (${a.percentualSemTipo.toString().replace(".", ",")}%)` : "0"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ AS 753 DECISÕES, BUSCÁVEIS ═══ */}
      <section aria-labelledby="lista-decisoes" className="mt-10">
        <h2 id="lista-decisoes" className="font-display text-xl font-bold tracking-tight text-text">
          Decisão a decisão
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          O <strong className="text-text">tipo</strong>{" "}
          mostrado em cada card abaixo vem da pasta do link do PDF (estrutura antiga da fonte) — é
          um rótulo bruto, diferente da contagem oficial
          da tabela acima, e por isso os dois às vezes discordam entre si no mesmo ano. Registros
          sem essa pasta aparecem como &ldquo;tipo não registrado neste link&rdquo;.
        </p>
        <div className="mt-5">
          <TabelaDecisoes />
        </div>
      </section>

      <section
        aria-labelledby="fonte-decisoes"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="fonte-decisoes" className="font-display text-base font-semibold text-text">
          De onde vem este dado
        </h2>
        <ul className="mt-3 space-y-2.5 text-[.92em] text-text-soft">
          <li>
            Sistema de busca de decisões da Controladoria-Geral do Estado de Minas Gerais,{" "}
            <a
              href="https://www.acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              acessoainformacao.mg.gov.br ↗
            </a>
            . Coletado percorrendo os filtros de ano ({C.anoInicial}–{C.anoFinal}), sem login e sem
            captcha — o formulário é ASP.NET WebForms e exige o viewstate de uma requisição anterior
            a cada página.
          </li>
          <li>
            <strong className="text-text">O que este dado não diz:</strong> ele cobre só decisões de
            RECURSO. Não permite medir quantos pedidos de LAI o Estado recebe, quantos são
            respondidos em primeira instância, nem o teor da resposta original.
          </li>
        </ul>
        <p className="mt-4 text-[.88em] text-text-soft">
          Ver também:{" "}
          <Link href="/barragens/descaracterizacao">barragens em descaracterização (MPMG)</Link>
        </p>
      </section>
    </div>
  );
}
