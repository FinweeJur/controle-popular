import Link from "@/lib/congresso/link";
import VicioBadge from "@/app/congresso/components/VicioBadge";
import {
  labelDaCategoria,
  RESSALVA_INDICIO,
  type Categoria,
  type NivelGravidade,
} from "@/lib/congresso/rubrica_vicio";

export interface VicioView {
  nivel_gravidade: NivelGravidade | null;
  resumo: string | null;
  status: "ok" | "requer_revisao" | "falhou" | null;
  modelo: string | null;
  versao_rubrica: string | null;
}

export interface VicioItemView {
  categoria: Categoria;
  dispositivo: string;
  justificativa?: string | null;
  trecho?: string | null;
  confianca: number | null;
}

/**
 * Seção de VÍCIO LEGISLATIVO na página de uma proposição.
 *
 * SILÊNCIO É O PADRÃO: ao contrário de `AnaliseAuditavel` (que sempre
 * renderiza algo — "análise pendente", "não concluída" — porque o rótulo
 * garantista é informação neutra o tempo todo), esta seção só aparece
 * quando há de fato um indício. Proposição sem vício, ou ainda não
 * analisada, não ganha seção nenhuma aqui — nada de "sem indício" escrito
 * embaixo de cada uma das milhares de proposições comuns.
 *
 * A RESSALVA (`RESSALVA_INDICIO`) aparece em DOIS lugares sempre que a
 * seção existe: no título (âncora visual) e por extenso no rodapé — a
 * mesma redundância de `AnaliseAuditavel` para a régua garantista, porque é
 * a palavra que mais pode ser mal-entendida por um leitor leigo.
 */
export default function VicioAuditavel({
  vicio,
  itens,
}: {
  vicio: VicioView | null;
  itens: VicioItemView[];
}) {
  if (!vicio || !vicio.nivel_gravidade || vicio.nivel_gravidade === "sem_indicio" || itens.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-lg border-2 border-[var(--cp-alert)] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-semibold">Indício de vício legislativo</h2>
        <VicioBadge nivel={vicio.nivel_gravidade} />
        {vicio.status === "requer_revisao" ? (
          <span className="rounded-md border border-[var(--cp-border)] px-2 py-0.5 text-xs opacity-80">
            requer revisão humana
          </span>
        ) : null}
      </div>

      <p className="rounded-md bg-[var(--cp-surface-2)] p-3 text-sm">{RESSALVA_INDICIO}</p>

      {vicio.resumo ? <p className="opacity-90">{vicio.resumo}</p> : null}

      <ul className="space-y-3">
        {itens.map((item, i) => (
          <li key={i} className="rounded-lg border border-[var(--cp-border)] p-4">
            <p className="font-semibold">{labelDaCategoria(item.categoria)}</p>
            <p className="mt-1 text-sm">
              <span className="opacity-70">Dispositivo citado: </span>
              <span className="font-medium">{item.dispositivo}</span>
              {typeof item.confianca === "number" ? (
                <span className="opacity-70"> · confiança {item.confianca.toFixed(2)}</span>
              ) : null}
            </p>
            {item.justificativa ? <p className="mt-2 text-sm opacity-90">{item.justificativa}</p> : null}
            {item.trecho ? (
              <blockquote className="mt-2 border-l-2 border-[var(--cp-border)] pl-3 text-sm italic opacity-85">
                “{item.trecho}”
              </blockquote>
            ) : null}
          </li>
        ))}
      </ul>

      <footer className="border-t border-[var(--cp-border)] pt-3 text-sm opacity-70">
        <p>
          Extração feita por <strong>{vicio.modelo ?? "modelo não registrado"}</strong>, régua de
          vício v{vicio.versao_rubrica ?? "?"}.{" "}
          <Link href="/metodologia" className="underline">
            Ver metodologia
          </Link>
          .
        </p>
      </footer>
    </section>
  );
}
