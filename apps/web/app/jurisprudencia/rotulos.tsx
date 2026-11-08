/**
 * @file Rótulos e selos da jurisprudência.
 *
 * Módulo sem dados: pode ser importado tanto pelo componente de servidor
 * (tabela) quanto pelo de cliente (linha expansível), sem arrastar o JSON de
 * 16 mil casos para o bundle do navegador.
 */
import { ROTULOS, type CasoJurisprudencia } from "@/lib/jurisprudencia";

export const NOMES_FRENTE: Record<string, string> = {
  brumadinho: "Brumadinho (TJMG)",
  riodoce: "Rio Doce",
  dh: "Direitos humanos (TJMG)",
  itatiaiaucu: "Itatiaiuçu (Serra Azul)",
  penal: "Penal e criminal",
  sumula: "Súmulas",
};

export const NOMES_TIPO: Record<string, string> = {
  acordao: "Acórdão",
  sumula: "Súmula",
};

export const ESTILO_STATUS: Record<string, string> = {
  aprovado: "rounded bg-[var(--cp-primary)]/15 px-2 py-0.5 text-xs",
  sem_resumo: "rounded bg-[var(--cp-border)] px-2 py-0.5 text-xs",
  revisao_humana: "rounded bg-[var(--cp-tertiary)]/15 px-2 py-0.5 text-xs",
  sumula: "rounded bg-[var(--cp-secondary)]/15 px-2 py-0.5 text-xs",
};

export const ROTULO_STATUS: Record<string, string> = {
  aprovado: "aprovado",
  sem_resumo: "sem resumo",
  revisao_humana: "revisão",
  sumula: "súmula",
};

export function SeloStatus({ status }: { status: string }) {
  return (
    <span className={ESTILO_STATUS[status] ?? ESTILO_STATUS.revisao_humana}>
      {ROTULO_STATUS[status] ?? "revisão"}
    </span>
  );
}

export function merito(caso: CasoJurisprudencia): string {
  if (caso.tipo === "sumula") return "—";
  const polo = ROTULOS[caso.polo] ?? caso.polo;
  const resultado = ROTULOS[caso.resultado] ?? caso.resultado;
  return [polo, resultado].filter(Boolean).join(" · ") || "—";
}
