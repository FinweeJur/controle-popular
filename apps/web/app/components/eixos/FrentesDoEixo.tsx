import Link from "next/link";
import { eixoDe } from "@/lib/navegacao/mapa";

/**
 * Lista das frentes de um eixo, com link para a rota publicada de cada uma.
 * Usada dentro de `SecaoWiki` nas portas `/casos` e `/direitos`.
 */
export default function FrentesDoEixo({ slug }: { slug: string }) {
  const eixo = eixoDe(slug);
  if (!eixo) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {eixo.frentes.map((frente) => (
        <li key={frente.slug}>
          <Link
            href={frente.rota}
            className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-xs transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            <span className="font-display text-lg font-bold text-text group-hover:text-primary">
              {frente.rotulo}
            </span>
            <span className="mt-1 flex-1 text-sm leading-relaxed text-text-soft">
              {frente.descricao}
            </span>
            <span className="mt-3 text-xs font-semibold text-primary">Abrir frente →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
