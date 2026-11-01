/**
 * Posicionamentos oficiais e canais institucionais, todos com link.
 *
 * Quando não há comunicado específico datado, o item diz isso em vez de
 * inventar posição: o link leva ao canal oficial da empresa ou do órgão.
 */
import type { Posicionamento } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import SeloPendente from "./SeloPendente";

export default function Posicionamentos({
  itens,
}: {
  itens: readonly Posicionamento[];
}) {
  return (
    <ul className="mt-2 space-y-3">
      {itens.map((item) => (
        <li key={item.id} className="rounded-lg border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-text">{item.autor}</h3>
            <span className="text-xs text-text-soft">
              {item.data ? formatarDataBR(item.data) : "sem data localizada"}
            </span>
            {item.pendente ? <SeloPendente texto="canal oficial" /> : null}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-text-soft">{item.resumo}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-medium text-accent hover:underline break-words"
          >
            Abrir o canal oficial ↗
          </a>
        </li>
      ))}
    </ul>
  );
}
