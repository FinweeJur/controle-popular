import { labelDoNivel, RESSALVA_INDICIO, type NivelGravidade } from "@/lib/congresso/rubrica_vicio";

/**
 * Selo de VÍCIO LEGISLATIVO / indício de inconstitucionalidade.
 *
 * DIFERENÇA DELIBERADA em relação a `RotuloBadge` (análise garantista): este
 * componente devolve `null` para `sem_indicio` — e não SÓ um badge cinza
 * discreto. "Análise pendente"/"neutro" ainda fazem sentido aparecer porque
 * são estado do PROCESSO; aqui o padrão é SILÊNCIO (regra do handoff: badge
 * só quando houver indício, nunca destaque para "sem indício" — a palavra
 * "inconstitucionalidade" pesa mais que "reducionista" e não deve virar
 * decoração de tela em toda proposição).
 *
 * `title` carrega a ressalva completa como tooltip nativo: quem passa o
 * mouse (ou lê com leitor de tela, que expõe `title`) vê de cara que isto é
 * indício de IA, não parecer jurídico nem decisão de tribunal.
 */
const ESTILO: Record<Exclude<NivelGravidade, "sem_indicio">, { cor: string }> = {
  indicio_leve: { cor: "var(--cp-ord-4)" },
  indicio_grave: { cor: "var(--cp-alert)" },
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
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${
        tamanho === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
      style={{ borderColor: estilo.cor, color: estilo.cor }}
    >
      <span aria-hidden="true">⚠</span>
      <span>{labelDoNivel(nivel)} de vício legislativo</span>
    </span>
  );
}
