import { labelDoRotulo, type Rotulo } from "@/lib/congresso/rubrica";

/**
 * Selo do rótulo garantista/reducionista.
 *
 * NUNCA usa cor sozinha para carregar o significado: o texto do rótulo
 * está sempre escrito por extenso e a seta (↑ amplia / ↓ restringe /
 * ↕ os dois) repete a informação numa segunda dimensão. Verde-e-vermelho
 * é a leitura mais intuitiva aqui e combina com a régua declarada do app,
 * mas é justamente o par que some para quem tem daltonismo — e o tema de
 * alto contraste do design system não teria como resolver isso sozinho.
 */
const ESTILO: Record<Rotulo | "pendente", { cor: string; seta: string }> = {
  garantista_forte: { cor: "var(--cp-accent)", seta: "↑↑" },
  garantista: { cor: "var(--cp-accent)", seta: "↑" },
  neutro: { cor: "var(--cp-text-soft)", seta: "→" },
  misto: { cor: "var(--cp-ord-4)", seta: "↕" },
  reducionista: { cor: "var(--cp-alert)", seta: "↓" },
  reducionista_forte: { cor: "var(--cp-alert)", seta: "↓↓" },
  pendente: { cor: "var(--cp-text-soft)", seta: "…" },
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
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${
        tamanho === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
      style={{ borderColor: estilo.cor, color: estilo.cor }}
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
