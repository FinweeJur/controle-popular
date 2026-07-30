import Link from "@/lib/congresso/link";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import { COD_AUDIENCIA, type EventoAgenda, type ItemPauta } from "@/lib/db/queries/congresso";
import type { Rotulo } from "@/lib/congresso/rubrica";

/**
 * Card de um evento da agenda legislativa.
 *
 * A `descricao` da Câmara é um campo de texto livre que mistura o assunto
 * com a LISTA DE CONVIDADOS, separados por quebras de linha — medido numa
 * audiência real da CDE: uma linha de assunto, o número do requerimento que
 * a pediu, e seis convidados com cargo e status ("a Confirmar" /
 * "confirmado"). Isso é informação valiosa e comprida ao mesmo tempo: a
 * primeira linha vira o título e o resto fica num `<details>` nativo, que
 * funciona sem JavaScript e não some se o script falhar.
 */

const CANCELADA = /cancelad/i;

function Situacao({ situacao }: { situacao: string | null }) {
  if (!situacao) return null;
  const cancelada = CANCELADA.test(situacao);
  return (
    <span
      className={`rounded-md border px-2 py-0.5 text-xs ${
        cancelada
          ? "border-[var(--cp-alert)] text-[var(--cp-alert)]"
          : "border-[var(--cp-border)] opacity-75"
      }`}
    >
      {situacao}
    </span>
  );
}

function Pauta({ itens }: { itens: ItemPauta[] }) {
  if (itens.length === 0) return null;
  return (
    <div className="mt-3 rounded-md bg-[var(--cp-surface-2)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        Pauta ({itens.length})
      </p>
      <ul className="mt-2 space-y-2 text-sm">
        {itens.map((i) => (
          <li key={`${i.ordem}-${i.titulo}`} className="flex flex-wrap items-baseline gap-2">
            {/* Só linka o que existe neste banco. A pauta cita projetos de
                qualquer ano (medido: um PL de 2014) e só 2026 foi
                sincronizado — um link para uma página inexistente seria
                pior que texto puro. */}
            {i.proposicao_id ? (
              <Link href={`/proposicoes/${i.proposicao_id}`} className="font-medium underline">
                {i.titulo}
              </Link>
            ) : (
              <span className="font-medium">{i.titulo}</span>
            )}
            {i.rotulo ? (
              <RotuloBadge rotulo={i.rotulo as Rotulo} score={i.score} tamanho="sm" />
            ) : null}
            {i.relator_nome ? (
              <span className="text-xs opacity-70">
                relator: {i.relator_nome}
                {i.relator_partido ? ` (${i.relator_partido}-${i.relator_uf ?? ""})` : ""}
              </span>
            ) : null}
            {i.topico ? <span className="text-xs opacity-60">· {i.topico}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CardEvento({
  e,
  pauta = [],
}: {
  e: EventoAgenda;
  pauta?: ItemPauta[];
}) {
  const audiencia = e.cod_tipo !== null && COD_AUDIENCIA.includes(e.cod_tipo);
  const linhas = (e.descricao ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const titulo = linhas[0] ?? e.tipo ?? "Evento sem descrição";
  const resto = linhas.slice(1);

  return (
    <article className="flex gap-4 rounded-lg border border-[var(--cp-border)] p-5">
      {/* Bloco de data à esquerda: a pergunta da agenda é "quando", então o
          quando ganha a posição de leitura primeiro. */}
      <div className="w-20 shrink-0 text-center">
        <div className="font-display text-lg font-bold leading-tight">
          {e.data_br?.slice(0, 5)}
        </div>
        <div className="text-xs opacity-60">{e.data_br?.slice(6)}</div>
        <div className="mt-1 text-sm font-medium">{e.hora_br}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
              audiencia
                ? "border-[var(--cp-primary)] text-[var(--cp-primary)]"
                : "border-[var(--cp-border)] opacity-80"
            }`}
          >
            {e.tipo}
          </span>
          <Situacao situacao={e.situacao} />
          {e.orgaos?.map((sigla) => (
            <Link
              key={sigla}
              href={`/comissoes/${sigla}`}
              className="text-xs underline opacity-80"
            >
              {sigla}
            </Link>
          ))}
        </div>

        <h3 className="mt-2 font-medium">{titulo}</h3>

        {resto.length ? (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer opacity-75">
              Convidados e detalhes ({resto.length}{" "}
              {resto.length === 1 ? "linha" : "linhas"})
            </summary>
            <p className="mt-2 whitespace-pre-line opacity-80">{resto.join("\n")}</p>
          </details>
        ) : null}

        <Pauta itens={pauta} />

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-70">
          {e.local_nome || e.local_externo ? (
            <span>{e.local_nome ?? e.local_externo}</span>
          ) : null}
          {/* `<a>` cru para fora do domínio: o <Link> da zona prefixaria. */}
          {e.url_fonte ? (
            <a href={e.url_fonte} target="_blank" rel="noopener noreferrer" className="underline">
              página oficial ↗
            </a>
          ) : null}
          {e.url_registro ? (
            <a
              href={e.url_registro}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              vídeo do registro ↗
            </a>
          ) : null}
          {e.itens_pauta > 0 && pauta.length === 0 ? (
            <span>{e.itens_pauta} itens de pauta</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
