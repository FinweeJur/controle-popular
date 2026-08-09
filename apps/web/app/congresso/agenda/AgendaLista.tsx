"use client";

import { useSearchParams } from "next/navigation";
import Link from "@/lib/congresso/link";
import CardEvento from "@/app/congresso/components/CardEvento";
import type { EventoAgenda, ItemPauta } from "@/lib/db/queries/congresso";

/**
 * Formulário de filtro + listas "Próximos"/"Já aconteceram" de
 * `/congresso/agenda`, com `audiencias`/`orgao` movidos do SERVIDOR para o
 * NAVEGADOR.
 *
 * ═══ POR QUE MUDOU ═══
 *
 * A página lia os dois filtros no servidor e os aplicava em SQL (`WHERE`
 * antes do `LIMIT`). Isso marcava a rota como dinâmica (`ƒ`) — banco a cada
 * requisição, 500 em produção quando o Worker não alcança o Postgres local
 * (ver `docs/deploy-github-pages.md` §9.3).
 *
 * ═══ O LIMITE DE LINHAS, E POR QUE NÃO É MEDIDO ═══
 *
 * O SQL original já tinha `LIMIT 40` por lado (futuro/passado) — não é uma
 * tabela sem teto como `destaques`. Mas o `WHERE` de `orgao`/`soAudiencias`
 * corria ANTES desse limite; filtrar depois, no cliente, sobre só os 40 mais
 * próximos SEM filtro correria a mesma armadilha do "limit N mente": um
 * evento de um órgão específico que caísse na posição 45 sumiria do filtro
 * mesmo existindo. Por isso o servidor agora pede `limite: 300` por lado —
 * bem acima do teto anterior — para o filtro no cliente ter margem real.
 *
 * `congresso.eventos` está com ZERO linhas neste banco local (mesma
 * situação de `votacoes_camara`/`congresso.votacoes`), então não há como
 * medir o volume real hoje; 300 é uma escolha por julgamento (generosa para
 * uma agenda — não é um arquivo histórico que só cresce), documentada aqui
 * para ser revista quando houver dado de verdade.
 *
 * `COD_AUDIENCIA` chega por prop: `lib/db/queries/congresso.ts` é o módulo
 * de consultas ao banco, e importar um valor de lá (mesmo que só três
 * números) arrastaria o módulo inteiro para o bundle do cliente.
 */
export interface AgendaListaProps {
  proximos: EventoAgenda[];
  recentes: EventoAgenda[];
  pautaPorEvento: Record<string, ItemPauta[]>;
  orgaos: string[];
  codAudiencia: number[];
}

interface Filtros {
  soAudiencias: boolean;
  orgao?: string;
}

function casaComFiltro(e: EventoAgenda, filtros: Filtros, codAudiencia: number[]): boolean {
  if (filtros.soAudiencias && !(e.cod_tipo !== null && codAudiencia.includes(e.cod_tipo))) {
    return false;
  }
  if (filtros.orgao && !(e.orgaos ?? []).includes(filtros.orgao)) return false;
  return true;
}

function Conteudo({
  proximos: todosProximos,
  recentes: todosRecentes,
  pautaPorEvento,
  orgaos,
  codAudiencia,
  filtros,
}: AgendaListaProps & { filtros: Filtros }) {
  const proximos = todosProximos.filter((e) => casaComFiltro(e, filtros, codAudiencia));
  const recentes = todosRecentes.filter((e) => casaComFiltro(e, filtros, codAudiencia));
  const vazio = proximos.length === 0 && recentes.length === 0;
  const temFiltro = filtros.soAudiencias || Boolean(filtros.orgao);

  return (
    <>
      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="audiencias"
            value="1"
            defaultChecked={filtros.soAudiencias}
            className="size-4"
          />
          Só audiências públicas e depoimentos
        </label>
        <label className="text-sm">
          <span className="mr-2 opacity-75">Órgão</span>
          <select
            name="orgao"
            defaultValue={filtros.orgao ?? ""}
            className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
          >
            <option value="">Todos</option>
            {orgaos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-[var(--cp-primary)] px-4 py-1.5 font-medium text-[var(--cp-primary-ink)]"
        >
          Filtrar
        </button>
        {temFiltro ? (
          <Link href="/agenda" className="text-sm underline">
            limpar
          </Link>
        ) : null}
      </form>

      {vazio ? (
        <div className="rounded-lg border border-[var(--cp-border)] p-6">
          <h2 className="font-display text-xl font-semibold">Nada na agenda</h2>
          <p className="mt-2 opacity-80">
            {temFiltro
              ? "Nenhum evento com estes filtros. Tente limpar o recorte."
              : "Nenhum evento sincronizado ainda — rode `python -m etl.camara.eventos`. O Congresso também entra em recesso, e em recesso a agenda fica de fato vazia: ausência aqui pode ser o calendário, não falta de dado."}
          </p>
        </div>
      ) : null}

      {proximos.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">
            Próximos <span className="font-normal opacity-60">({proximos.length})</span>
          </h2>
          {proximos.map((e) => (
            <CardEvento key={e.id} e={e} pauta={pautaPorEvento[e.id] ?? []} />
          ))}
        </section>
      ) : null}

      {recentes.length ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-semibold">
            Já aconteceram <span className="font-normal opacity-60">({recentes.length})</span>
          </h2>
          <p className="text-sm opacity-70">
            Mantidos à vista porque o registro em vídeo e a pauta apreciada continuam
            servindo para cobrar depois — e porque uma comissão que marca e desmarca é ela
            mesma um dado.
          </p>
          {recentes.map((e) => (
            <CardEvento key={e.id} e={e} pauta={pautaPorEvento[e.id] ?? []} />
          ))}
        </section>
      ) : null}
    </>
  );
}

/**
 * Fallback do `<Suspense>`: sem filtro, os `limite` eventos de cada lado.
 *
 * Não pode chamar `useSearchParams()` — o mesmo componente nos dois lados do
 * `<Suspense>` derruba o `next build` com "should be wrapped in a suspense
 * boundary", e só lá (não em `next dev`).
 */
export function AgendaListaCompleta(props: AgendaListaProps) {
  return <Conteudo {...props} filtros={{ soAudiencias: false, orgao: undefined }} />;
}

export default function AgendaLista(props: AgendaListaProps) {
  const sp = useSearchParams();
  const filtros: Filtros = {
    soAudiencias: sp.get("audiencias") === "1",
    orgao: sp.get("orgao") ?? undefined,
  };
  return <Conteudo {...props} filtros={filtros} />;
}
