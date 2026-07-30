import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import CardEvento from "@/app/congresso/components/CardEvento";
import { agenda, pautaDosEventos, orgaosDaAgenda, type ItemPauta } from "@/lib/db/queries/congresso";

export const metadata: Metadata = {
  title: "Agenda legislativa — audiências públicas e reuniões — Controle Popular · Congresso",
  description:
    "O que a Câmara tem marcado: audiências públicas, reuniões deliberativas, pauta de votação, local, convidados e link para o registro.",
};

/**
 * Agenda legislativa.
 *
 * POR QUE ESTA PÁGINA EXISTE: o resto do portal olha para trás — tramitação
 * que já andou, análise de projeto já apresentado. A agenda é o único lugar
 * onde ainda dá para interferir. Audiência pública é o momento formal em que
 * quem não é parlamentar fala dentro da comissão, e ela é anunciada com
 * data, local e lista de convidados.
 *
 * O cruzamento com a análise é o que a diferencia de um calendário: quando
 * um item da pauta é uma proposição já classificada por este portal, o
 * rótulo aparece ao lado — "a CCJC vota terça um projeto que restringe
 * direito X".
 */

type Params = Promise<Record<string, string | undefined>>;

export default async function Agenda({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const soAudiencias = sp.audiencias === "1";
  const orgao = sp.orgao || undefined;

  const [{ proximos, recentes }, orgaos] = await Promise.all([
    agenda({ soAudiencias, orgao }),
    orgaosDaAgenda(),
  ]);

  // A pauta vem numa consulta só, para os eventos QUE TÊM pauta. Pedir a
  // pauta de todos gastaria uma consulta grande para nada: a maioria dos
  // eventos (audiência, seminário, visita) não tem item nenhum.
  const comPauta = [...proximos, ...recentes].filter((e) => e.itens_pauta > 0);
  const itens = comPauta.length ? await pautaDosEventos(comPauta.map((e) => e.id)) : [];
  const pautaPorEvento = new Map<string, ItemPauta[]>();
  for (const i of itens) {
    const lista = pautaPorEvento.get(i.evento_id) ?? [];
    lista.push(i);
    pautaPorEvento.set(i.evento_id, lista);
  }

  const vazio = proximos.length === 0 && recentes.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">
          Agenda legislativa{" "}
          <span className="opacity-60">· o que ainda dá para influenciar</span>
        </h1>
        <p className="max-w-3xl opacity-80">
          O resto deste portal olha para trás. Aqui está o que a Câmara tem{" "}
          <strong>marcado</strong>: audiências públicas, reuniões deliberativas e o que
          cada uma vai apreciar. Audiência pública é o momento formal em que quem não é
          parlamentar fala dentro da comissão — e ela é anunciada com data, local e lista
          de convidados.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="audiencias"
            value="1"
            defaultChecked={soAudiencias}
            className="size-4"
          />
          Só audiências públicas e depoimentos
        </label>
        <label className="text-sm">
          <span className="mr-2 opacity-75">Órgão</span>
          <select
            name="orgao"
            defaultValue={orgao ?? ""}
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
        {soAudiencias || orgao ? (
          <Link href="/agenda" className="text-sm underline">
            limpar
          </Link>
        ) : null}
      </form>

      {vazio ? (
        <div className="rounded-lg border border-[var(--cp-border)] p-6">
          <h2 className="font-display text-xl font-semibold">Nada na agenda</h2>
          <p className="mt-2 opacity-80">
            {soAudiencias || orgao
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
            <CardEvento key={e.id} e={e} pauta={pautaPorEvento.get(e.id) ?? []} />
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
            <CardEvento key={e.id} e={e} pauta={pautaPorEvento.get(e.id) ?? []} />
          ))}
        </section>
      ) : null}

      <section className="rounded-lg border border-[var(--cp-border)] p-5 text-sm opacity-80">
        <p>
          Fonte: <code>dadosabertos.camara.leg.br/api/v2/eventos</code>. Horários são de
          Brasília, como a Câmara publica. Evento marcado pode ser adiado ou cancelado sem
          aviso na API — o campo de situação mostra o último estado conhecido, e a página
          oficial de cada evento é o link para conferir antes de sair de casa.
        </p>
        <p className="mt-2">
          A agenda do <strong>Senado</strong> ainda não entra: o endpoint de agenda da API
          do Senado responde 404 nesta versão (testado em 2026-07-29), diferente do de
          processos, que este portal já usa.
        </p>
      </section>
    </div>
  );
}
