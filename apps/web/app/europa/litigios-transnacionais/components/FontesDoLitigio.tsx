/**
 * Lista de fontes de um litígio, com data de acesso e link externo.
 *
 * Cada item aponta para a URL canônica (tribunal, órgão ou imprensa) e
 * mostra a data em que foi acessada. Link externo usa `<a>` de propósito;
 * link interno continuaria proibido aqui (AGENTS.md §5.13).
 */
import type { FonteLitigio } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";

export default function FontesDoLitigio({ fontes }: { fontes: readonly FonteLitigio[] }) {
  if (fontes.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-text">Fontes deste litígio</h4>
      <ul className="mt-2 space-y-2">
        {fontes.map((fonte) => (
          <li key={fonte.url} className="text-sm leading-snug text-text-soft">
            <a
              href={fonte.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline break-words"
            >
              {fonte.titulo} ↗
            </a>
            <span className="ml-1 text-xs text-text-soft">
              Acesso em {formatarDataBR(fonte.dataAcesso)}.
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
