/**
 * SecaoComissoes — seção "Participação em comissões" da página de vereador.
 *
 * Extraída do `VereadorPage` em 08/10/2026 (hotspots CodeScene, saúde 7,31).
 */
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import type { Cidade } from "@/lib/db/queries/municipios";

interface Comissoes {
  ok: boolean;
  andamento: { nomeComissao: string; papel: string }[];
  finalizadas: { nomeComissao: string; papel: string; dataInicio: string | null; dataFim: string | null }[];
}

interface Props {
  comissoes: Comissoes;
  cidade: Cidade;
  fonteCamara: { label: string; url?: string };
}

export function SecaoComissoes({ comissoes, cidade, fonteCamara }: Props) {
  if (!comissoes.ok) return null;

  if (comissoes.andamento.length === 0 && comissoes.finalizadas.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
        Não participa de nenhuma comissão no momento.
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="mb-3 font-display text-lg font-bold text-text">
        Participação em comissões
      </h2>
      {comissoes.andamento.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold tracking-wide text-text-soft uppercase">
            Atualmente
          </p>
          <ul className="flex flex-wrap gap-2">
            {comissoes.andamento.map((p, i) => (
              <li
                key={i}
                className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {p.nomeComissao}{" "}
                <span className="font-semibold">— {p.papel}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {comissoes.finalizadas.length > 0 && (
        <details className="rounded-2xl border border-border bg-surface p-4 text-sm">
          <summary className="cursor-pointer font-medium text-text-soft">
            Histórico ({formatNumberBR(comissoes.finalizadas.length)} participações
            encerradas desde 2018)
          </summary>
          <ul className="mt-3 divide-y divide-border/60">
            {comissoes.finalizadas.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-text-soft">
                  {p.nomeComissao} — <span className="text-text">{p.papel}</span>
                </span>
                        <span className="font-tabular shrink-0 text-xs text-text-soft">
                          {p.dataInicio ? formatDateBR(p.dataInicio) : "—"} – {p.dataFim ? formatDateBR(p.dataFim) : "—"}
                        </span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p className="mt-2 text-xs text-text-soft">
        Fonte:{" "}
        <a
          href={fonteCamara.url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Câmara de {cidade.nome} ↗
        </a>
        . Nomes de comissão são exatamente os registrados pela Câmara em
        cada período — algumas foram renomeadas ao longo das
        legislaturas, e o histórico mantém o nome de cada época.
      </p>
    </div>
  );
}
