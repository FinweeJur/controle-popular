/**
 * Linha do tempo dos litígios transnacionais.
 *
 * Ordem crescente, data visível em `<time>` e link de fonte por marco.
 * Marco que veio de notícia, não de decisão oficial, aparece com o selo de
 * pendência e o motivo — a lacuna é informação, não algo para esconder.
 */
import type { ItemLinhaDoTempo } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import SeloPendente from "./SeloPendente";

export default function LinhaDoTempo({
  itens,
}: {
  itens: readonly ItemLinhaDoTempo[];
}) {
  return (
    <ol className="mt-2 space-y-4 border-l-2 border-border pl-4 sm:pl-5">
      {itens.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden="true"
            className="absolute -left-[1.42rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary sm:-left-[1.67rem]"
          />
          <time dateTime={item.data} className="text-xs font-semibold uppercase tracking-wide text-text-soft">
            {formatarDataBR(item.data)}
          </time>
          <h3 className="mt-0.5 font-display text-base font-semibold text-text">
            {item.titulo} {item.pendente ? <SeloPendente texto="não confirmado" /> : null}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-text-soft">{item.descricao}</p>
          {item.observacaoPendencia ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              {item.observacaoPendencia}
            </p>
          ) : null}
          <a
            href={item.fonteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
          >
            Fonte ↗
          </a>
        </li>
      ))}
    </ol>
  );
}
