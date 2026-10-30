/**
 * Clipping da subfrente: só metadado e link, nunca a matéria inteira.
 *
 * Cada item declara veículo, data, título, idioma e se há paywall. O bloco
 * "Como este clipping foi montado" usa `details/summary` para explicar os
 * critérios sem empurrar a lista, e registra que o arquivo em
 * web.archive.org não foi confirmado nesta coleta.
 */
import type { ItemClipping } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";

const ROTULO_IDIOMA: Record<ItemClipping["idioma"], string> = {
  pt: "português",
  en: "inglês",
  es: "espanhol",
  nl: "holandês",
};

export default function Clipping({ itens }: { itens: readonly ItemClipping[] }) {
  return (
    <div>
      <details className="rounded-lg border border-border bg-surface p-3 text-sm text-text-soft">
        <summary className="cursor-pointer font-semibold text-text">
          Como este clipping foi montado
        </summary>
        <p className="mt-2">
          Só metadado e link: nenhuma matéria é copiada. As datas são as da
          publicação no veículo. O arquivo em web.archive.org não foi
          confirmado para todos os itens nesta coleta; por isso o campo de
          arquivo aparece apenas quando existe.
        </p>
      </details>

      <ul className="mt-4 space-y-3">
        {itens.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-soft">
              <span className="font-semibold text-text">{item.veiculo}</span>
              <time dateTime={item.data}>{formatarDataBR(item.data)}</time>
              <span>· {ROTULO_IDIOMA[item.idioma]}</span>
              {item.paywall ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-700 dark:text-amber-400">
                  paywall
                </span>
              ) : null}
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block text-sm font-medium leading-snug text-accent hover:underline sm:text-base"
            >
              {item.titulo} ↗
            </a>
            {item.arquivoUrl ? (
              <a
                href={item.arquivoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs font-medium text-text-soft hover:underline"
              >
                Cópia no Internet Archive ↗
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
