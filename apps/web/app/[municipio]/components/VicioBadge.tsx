import { labelDoNivel, RESSALVA_INDICIO, type NivelGravidade } from "@/lib/congresso/rubrica_vicio";

/**
 * Selo de vício legislativo, versão do eixo Cidades. Espelha
 * `app/congresso/components/VicioBadge.tsx` visualmente (mesmas classes
 * utilitárias que `RotuloBadge` municipal usa — `border-ord-4`/`border-alert`
 * — que resolvem para os mesmos tokens de `app/globals.css`).
 *
 * Mesma regra de silêncio: devolve `null` para `sem_indicio`, não um badge
 * discreto. Ver o comentário completo na versão do Congresso.
 */
const ESTILO: Record<Exclude<NivelGravidade, "sem_indicio">, { cor: string }> = {
  indicio_leve: { cor: "border-ord-4 text-ord-4" },
  indicio_grave: { cor: "border-alert text-alert" },
};

export default function VicioBadge({
  nivel,
  tamanho = "md",
}: {
  nivel: NivelGravidade | null | undefined;
  tamanho?: "sm" | "md";
}) {
  if (!nivel || nivel === "sem_indicio") return null;
  const estilo = ESTILO[nivel];

  return (
    <span
      title={RESSALVA_INDICIO}
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${estilo.cor} ${
        tamanho === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      <span aria-hidden="true">⚠</span>
      <span>{labelDoNivel(nivel)} de vício legislativo</span>
    </span>
  );
}
