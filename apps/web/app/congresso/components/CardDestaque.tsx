import Link from "@/lib/congresso/link";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import Autoria from "@/app/congresso/components/Autoria";
import { labelDoDireito } from "@/lib/congresso/rubrica";
import type { Destaque } from "@/lib/congresso/destaques";

/**
 * Card de destaque (alerta ou bom exemplo).
 *
 * Mostra SEMPRE o motivo — direito afetado, dispositivo citado e o trecho
 * literal do projeto. É a regra central deste portal: um rótulo sem a
 * fundamentação à vista é acusação, não análise. Quem discordar precisa
 * conseguir conferir sem sair da página.
 */
export default function CardDestaque({ d }: { d: Destaque }) {
  const restritivo = (d.rotulo ?? "").startsWith("reducionista");

  return (
    <article className="rounded-lg border border-[var(--cp-border)] p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/proposicoes/${d.id}`} className="font-semibold underline">
          {d.identificacao}
        </Link>
        <RotuloBadge rotulo={d.rotulo} score={d.score} tamanho="sm" />
        {d.clausula_petrea ? (
          <span className="rounded-md border border-[var(--cp-alert)] px-2 py-0.5 text-xs text-[var(--cp-alert)]">
            toca cláusula pétrea
          </span>
        ) : null}
        {d.vedacao_retrocesso ? (
          <span className="rounded-md border border-[var(--cp-alert)] px-2 py-0.5 text-xs text-[var(--cp-alert)]">
            retrocesso social
          </span>
        ) : null}
      </div>

      {/* Autoria ANTES da ementa: a pergunta "de quem é isso?" vem antes de
          "o que diz?" para quem vai cobrar alguém. */}
      <Autoria autoria={d.autoria} className="mt-2 text-sm" />

      <p className="mt-2 text-sm opacity-85">{d.ementa}</p>

      {d.principal ? (
        <div className="mt-3 rounded-md bg-[var(--cp-surface-2)] p-3 text-sm">
          <p>
            <strong>
              {restritivo ? "Restringe" : "Amplia"}: {labelDoDireito(d.principal.direito)}
            </strong>{" "}
            <span className="opacity-75">
              ({d.principal.dispositivo} · alcance {d.principal.grau})
            </span>
          </p>
          {d.principal.trecho ? (
            <p className="mt-1.5 italic opacity-75">“{d.principal.trecho}”</p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs opacity-65">
        {d.orgao_atual ? <span>em {d.orgao_atual}</span> : null}
        {d.direitos.length > 1 ? (
          <span>{d.direitos.length} direitos afetados</span>
        ) : null}
        {/* O modelo aparece porque score não é comparável entre modelos —
            ver `lib/destaques.ts`. */}
        {d.modelo ? <span>análise por {d.modelo}</span> : null}
        <Link href={`/proposicoes/${d.id}/oficio`} className="underline">
          gerar ofício
        </Link>
      </div>
    </article>
  );
}
