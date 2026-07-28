import Link from "@/lib/betim/link";
import { type ContagemTema } from "@/lib/betim/temas";
import { formatNumberBR } from "@/lib/betim/format";

export interface AreasAtuacaoProps {
  temas: ContagemTema[];
  /** Unidade no plural ("proposições" | "contratos"). */
  unidade: string;
  /** Unidade no singular ("proposição" | "contrato") -- "proposições" não
   *  vira singular tirando o "s" (viraria "proposiçõe"), então pede
   *  explícito em vez de tentar adivinhar morfologia em português. */
  unidadeSingular: string;
  /** Quantos temas mostrar antes de dobrar o resto num resumo de texto. */
  limite?: number;
  /** Quando definido, cada linha vira link pra essa rota + `?tema=slug`. */
  hrefFiltro?: string;
}

/**
 * Ranking de temas por frequência — a resposta visual pra "quais são as
 * áreas de foco de atuação". Uma barra por tema, cor única (não cor por
 * tema): isso não é uma composição onde a identidade de cada fatia
 * precisa ser distinguida lado a lado (caso em que a rampa categórica de
 * até 8 tons seria obrigatória) — é uma lista ordenada de UMA série, e o
 * comprimento da barra já é o dado. Uma proposição/contrato pode ter mais
 * de um tema, então a soma das barras passa do total de itens — isso é
 * esperado (`contarTemas` em `lib/temas.ts`), não duplicação de dado.
 */
export default function AreasAtuacao({
  temas,
  unidade,
  unidadeSingular,
  limite = 8,
  hrefFiltro,
}: AreasAtuacaoProps) {
  if (temas.length === 0) return null;

  const visiveis = temas.slice(0, limite);
  const resto = temas.slice(limite);
  const max = visiveis[0]?.qtd ?? 0;

  return (
    <div>
      <ul className="space-y-2">
        {visiveis.map((t) => {
          const linha = (
            <>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-text">{t.label}</span>
                <span className="font-tabular shrink-0 text-text-soft">
                  {formatNumberBR(t.qtd)} {t.qtd === 1 ? unidadeSingular : unidade}
                </span>
              </div>
              <div
                className="cp-ord-track h-2.5 w-full overflow-hidden"
                title={`${t.label}: ${formatNumberBR(t.qtd)} ${t.qtd === 1 ? unidadeSingular : unidade}`}
              >
                <div
                  className="h-full rounded-[4px]"
                  style={{
                    width: `${max > 0 ? (t.qtd / max) * 100 : 0}%`,
                    background: "var(--color-primary)",
                  }}
                />
              </div>
            </>
          );
          return (
            <li key={t.tema}>
              {hrefFiltro ? (
                <Link
                  href={`${hrefFiltro}?tema=${t.tema}`}
                  className="block rounded-lg transition-opacity hover:opacity-80"
                >
                  {linha}
                </Link>
              ) : (
                linha
              )}
            </li>
          );
        })}
      </ul>
      {resto.length > 0 && (
        <p className="mt-3 text-xs text-text-soft">
          + {resto.length} {resto.length === 1 ? "tema" : "temas"} com menos ocorrências:{" "}
          {resto.map((t) => t.label).join(", ")}.
        </p>
      )}
    </div>
  );
}
