/**
 * Lista final de fontes da página, sem duplicar URL.
 *
 * Reúne decisões de tribunal, páginas de órgãos, empresas e itens de
 * clipping. Cada linha mostra a data de acesso; link externo usa `<a>`.
 */
import type { FonteLitigio } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";

const ROTULO_TIPO: Record<FonteLitigio["tipo"], string> = {
  tribunal: "Tribunal",
  "orgao-publico": "Órgão público",
  empresa: "Empresa",
  imprensa: "Imprensa",
  documento: "Documento",
};

export default function ListaFontes({ fontes }: { fontes: readonly FonteLitigio[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {fontes.map((fonte) => (
        <li key={fonte.url} className="text-sm leading-snug text-text-soft">
          <span className="mr-1 rounded bg-surface px-1.5 py-0.5 text-xs font-semibold text-text-soft">
            {ROTULO_TIPO[fonte.tipo]}
          </span>
          <a
            href={fonte.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline break-words"
          >
            {fonte.titulo} ↗
          </a>
          <span className="ml-1 text-xs">
            Acesso em {formatarDataBR(fonte.dataAcesso)}.
          </span>
        </li>
      ))}
    </ul>
  );
}
