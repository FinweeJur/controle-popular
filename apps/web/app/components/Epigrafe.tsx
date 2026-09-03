import type { Citacao } from "@/lib/citacoes";

/**
 * app/components/Epigrafe.tsx
 *
 * Citação literária autorizada — componente único para as três posições do
 * PLANO-COPY-VOZ.md: início da página (border-left), fecho (largura total,
 * centralizado) e balão (aside flutuado ao lado do conteúdo, com cauda).
 *
 * Atribuição sempre completa: autor, obra e ano — a mesma régua da
 * procedência dos dados: quem disse, onde, quando.
 */

export type VarianteEpigrafe = "inicio" | "fecho" | "balao";

export function Epigrafe({
  citacao,
  variante = "inicio",
  className = "",
}: {
  citacao: Citacao;
  variante?: VarianteEpigrafe;
  className?: string;
}) {
  const atribuicao = `${citacao.autor} · ${citacao.obra} · ${citacao.ano}`;

  if (variante === "balao") {
    return (
      <aside
        className={`relative rounded-2xl border border-border bg-surface-2 p-5 shadow-sm ${className}`}
      >
        <span
          aria-hidden="true"
          className="absolute -bottom-2 left-8 h-4 w-4 rotate-45 border-b border-r border-border bg-surface-2"
        />
        <blockquote className="space-y-2">
          {citacao.versos ? (
            <p className="whitespace-pre-line text-[.95em] italic leading-relaxed text-text">
              {citacao.versos.join("\n")}
            </p>
          ) : (
            <p className="text-[.95em] italic leading-relaxed text-text">
              &ldquo;{citacao.texto}&rdquo;
            </p>
          )}
          <footer className="text-xs not-italic text-text-soft">{atribuicao}</footer>
        </blockquote>
      </aside>
    );
  }

  if (variante === "fecho") {
    return (
      <blockquote
        className={`mx-auto max-w-2xl space-y-2 border-t border-border pt-6 text-center ${className}`}
      >
        <p className="text-[1.05em] italic leading-relaxed text-text">
          &ldquo;{citacao.texto}&rdquo;
        </p>
        <footer className="text-xs not-italic text-text-soft">{atribuicao}</footer>
      </blockquote>
    );
  }

  return (
    <blockquote className={`border-l-2 border-primary/40 pl-4 text-sm italic text-text-soft ${className}`}>
      <p>&ldquo;{citacao.texto}&rdquo;</p>
      <footer className="mt-1 text-xs not-italic">
        {citacao.autor} · {citacao.obra} · {citacao.ano}
      </footer>
    </blockquote>
  );
}

export default Epigrafe;
