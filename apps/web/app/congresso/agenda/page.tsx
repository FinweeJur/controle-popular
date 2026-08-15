import { Suspense } from "react";
import type { Metadata } from "next";
import { agenda, pautaDosEventos, orgaosDaAgenda, COD_AUDIENCIA, type ItemPauta } from "@/lib/db/queries/congresso";
import AgendaLista, { AgendaListaCompleta } from "./AgendaLista";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/agenda", {
  title: "Agenda legislativa — audiências públicas e reuniões — Controle Popular · Congresso",
  description:
    "O que a Câmara tem marcado: audiências públicas, reuniões deliberativas, pauta de votação, local, convidados e link para o registro.",
});

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
 *
 * Filtro de `audiencias`/`orgao` é do cliente — ver `AgendaLista.tsx` para o
 * porquê e para a nota sobre o `limite: 300` (o SQL original já cortava em
 * 40 por lado; o cliente precisa de margem para o filtro não mentir).
 */
// Sem `searchParams`, mas com `force-static` mesmo assim: sem ele
// `output: export` trata a rota como dinâmica e aborta com "missing
// generateStaticParams()" — mensagem que não descreve a causa real.
export const dynamic = "force-static";

export default async function Agenda() {
  const [{ proximos, recentes }, orgaos] = await Promise.all([
    agenda({ limite: 300 }),
    orgaosDaAgenda(),
  ]);

  // A pauta vem numa consulta só, para os eventos QUE TÊM pauta. Pedir a
  // pauta de todos gastaria uma consulta grande para nada: a maioria dos
  // eventos (audiência, seminário, visita) não tem item nenhum.
  const comPauta = [...proximos, ...recentes].filter((e) => e.itens_pauta > 0);
  const itens = comPauta.length ? await pautaDosEventos(comPauta.map((e) => e.id)) : [];
  // Objeto simples, não `Map`: é o que vai como prop para o componente
  // cliente, e `Map` não é um valor serializável de servidor pra cliente.
  const pautaPorEvento: Record<string, ItemPauta[]> = {};
  for (const i of itens) {
    (pautaPorEvento[i.evento_id] ??= []).push(i);
  }

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

      {/* Formulário, listas e o estado "vazio" dependiam de `searchParams` e
          agora moram em `AgendaLista` (cliente). O fallback é o formulário
          sem filtro + as listas completas — o que o servidor tem antes de o
          navegador ler a query, e também o conteúdo certo pra quem chega
          sem filtro. */}
      <Suspense
        fallback={
          <AgendaListaCompleta
            proximos={proximos}
            recentes={recentes}
            pautaPorEvento={pautaPorEvento}
            orgaos={orgaos}
            codAudiencia={COD_AUDIENCIA}
          />
        }
      >
        <AgendaLista
          proximos={proximos}
          recentes={recentes}
          pautaPorEvento={pautaPorEvento}
          orgaos={orgaos}
          codAudiencia={COD_AUDIENCIA}
        />
      </Suspense>

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
