/**
 * Atos processuais de um litígio, em ordem cronológica.
 *
 * Cada ato mostra data, título, descrição curta e link da fonte. O que veio
 * de notícia, e não de decisão oficial, carrega o selo "não confirmado" e o
 * motivo, para não transformar manchete em fase processual.
 */
import type { AtoProcessual } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import SeloPendente from "./SeloPendente";

export default function AtosDoLitigio({ atos }: { atos: readonly AtoProcessual[] }) {
  if (atos.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-text">Atos e decisões</h4>
      <ol className="mt-2 space-y-3 border-l border-border pl-4">
        {atos.map((ato) => (
          <li key={`${ato.data}-${ato.titulo}`} className="text-sm leading-relaxed text-text-soft">
            <time dateTime={ato.data} className="text-xs font-semibold text-text">
              {formatarDataBR(ato.data)}
            </time>
            <p className="font-medium text-text">
              {ato.titulo} {ato.pendente ? <SeloPendente texto="não confirmado" /> : null}
            </p>
            <p className="mt-1">{ato.descricao}</p>
            {ato.observacaoPendencia ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                {ato.observacaoPendencia}
              </p>
            ) : null}
            <a
              href={ato.fonteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
            >
              Fonte ↗ Acesso em {formatarDataBR(ato.dataAcesso)}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
