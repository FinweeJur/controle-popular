import { labelDoRotulo, type Rotulo } from "@/lib/congresso/rubrica";

/**
 * Selo do rótulo garantista/reducionista, versão do eixo Cidades.
 *
 * Espelha `app/congresso/components/RotuloBadge.tsx` visualmente (mesmas
 * seis cores/setas, mesma regra de nunca depender só de cor), mas usa as
 * classes utilitárias do design system de Cidades (`text-accent`,
 * `border-alert`...) em vez do `var(--cp-*)` cru que o Congresso usa — os
 * dois resolvem para os MESMOS tokens em `app/globals.css`, a diferença é
 * só de convenção de zona.
 */
const ESTILO: Record<Rotulo | "pendente", { cor: string; seta: string }> = {
  garantista_forte: { cor: "border-accent text-accent", seta: "↑↑" },
  garantista: { cor: "border-accent text-accent", seta: "↑" },
  neutro: { cor: "border-border text-text-soft", seta: "→" },
  misto: { cor: "border-ord-4 text-ord-4", seta: "↕" },
  reducionista: { cor: "border-alert text-alert", seta: "↓" },
  reducionista_forte: { cor: "border-alert text-alert", seta: "↓↓" },
  pendente: { cor: "border-border text-text-soft", seta: "…" },
};

export default function RotuloBadge({
  rotulo,
  score,
  tamanho = "md",
}: {
  rotulo: Rotulo | null | undefined;
  score?: number | null;
  tamanho?: "sm" | "md";
}) {
  const chave = (rotulo ?? "pendente") as Rotulo | "pendente";
  const estilo = ESTILO[chave] ?? ESTILO.pendente;
  const texto = rotulo ? labelDoRotulo(rotulo) : "Análise pendente";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${estilo.cor} ${
        tamanho === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      <span aria-hidden="true">{estilo.seta}</span>
      <span>{texto}</span>
      {typeof score === "number" && rotulo ? (
        <span className="font-tabular opacity-80">
          {score > 0 ? "+" : ""}
          {score.toFixed(2)}
        </span>
      ) : null}
    </span>
  );
}
