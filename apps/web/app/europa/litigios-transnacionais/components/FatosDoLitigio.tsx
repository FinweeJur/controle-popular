/**
 * Fatos de um litígio com fonte e data de acesso em cada linha.
 *
 * O leitor sob estresse precisa saber de onde veio cada afirmação. Itens
 * marcados como pendentes ganham o motivo visível, em vez de esconder a
 * lacuna (regra editorial: lacuna é informação).
 */
import type { FatoLitigio } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import SeloPendente from "./SeloPendente";

export default function FatosDoLitigio({ fatos }: { fatos: readonly FatoLitigio[] }) {
  if (fatos.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-text">O que a fonte sustenta</h4>
      <ul className="mt-2 space-y-3">
        {fatos.map((fato, indice) => (
          <li key={`${fato.fonteUrl}-${indice}`} className="text-sm leading-relaxed text-text-soft">
            {fato.pendente ? <SeloPendente texto="não confirmado" /> : null}
            <p className="mt-1">{fato.descricao}</p>
            {fato.observacaoPendencia ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                {fato.observacaoPendencia}
              </p>
            ) : null}
            <a
              href={fato.fonteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-accent hover:underline"
            >
              Fonte ↗ Acesso em {formatarDataBR(fato.dataAcesso)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
