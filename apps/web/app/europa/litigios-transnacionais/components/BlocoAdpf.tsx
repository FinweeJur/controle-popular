/**
 * Bloco da ADPF no STF.
 *
 * A ADPF é a 1178, conferida em notícia oficial do STF. A 1318 é outra ação
 * (dívida rural) e não é citada como esta. O bloco separa o controle de
 * constitucionalidade no Brasil das ações civis na Inglaterra e na Holanda —
 * uma coisa não substitui a outra.
 */
import type { Adpf } from "@/lib/europa-litigios";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";

export default function BlocoAdpf({ adpf }: { adpf: Adpf }) {
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 sm:p-5">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Número</dt>
          <dd className="font-semibold text-text">{adpf.numero}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Relator</dt>
          <dd className="font-semibold text-text">{adpf.relator}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Objeto</dt>
          <dd className="text-text">{adpf.objeto}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Status</dt>
          <dd className="text-text">{adpf.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-soft">Data da coleta</dt>
          <dd className="text-text">{formatarDataBR(adpf.dataAcesso)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-sm leading-relaxed text-text-soft">
        {adpf.relacaoComLitigios}
      </p>

      <details className="mt-3 text-sm text-text-soft">
        <summary className="cursor-pointer font-semibold text-text">
          Por que o número não está confirmado
        </summary>
        <p className="mt-2">{adpf.observacao}</p>
      </details>

      <ul className="mt-3 flex flex-wrap gap-3">
        {adpf.links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent hover:underline"
            >
              {link.titulo} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
