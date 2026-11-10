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

/**
 * Nome do polo com o papel processual explícito.
 *
 * "Empresa" sozinho não diz nada ao leitor: ele não sabe se é o polo ativo
 * (quem processou) ou o passivo (quem foi processado). Medido em 10/11/2026:
 * o campo `polo` do acervo é o **polo vencedor**, não o ativo. Por isso o
 * rótulo passa a dizer o papel de cada lado e o cabeçalho da coluna diz
 * "Polo vencedor".
 */
export const NOMES_POLO: Record<string, string> = {
  empresa: "Empresa (ré)",
  atingido: "Atingido (autor)",
  reu: "Réu (defesa)",
  mp: "MP (acusação)",
  parcial: "Parcial",
  indeterminado: "Não classificado",
};

/** Agrupa o campo `recorrente` (texto livre) em um lado do processo. */
function ladoDoRecorrente(valor: string): "empresa" | "atingido" | "mp" | "reu" | null {
  const v = (valor || "").toLowerCase();
  if (v.startsWith("empresa")) return "empresa";
  if (v.startsWith("atingido") || v.startsWith("pessoa")) return "atingido";
  if (v.startsWith("mp") || v.includes("ministério público") || v.includes("ministerio publico")) return "mp";
  if (v.startsWith("réu") || v.startsWith("reu") || v.startsWith("defesa")) return "reu";
  return null;
}

const SUJEITO: Record<string, string> = {
  empresa: "A empresa",
  atingido: "O atingido",
  mp: "O Ministério Público",
  reu: "A defesa",
};

const VENCEDOR: Record<string, string> = {
  empresa: "a empresa (ré)",
  atingido: "o atingido (autor)",
  mp: "o MP (acusação)",
  reu: "o réu (defesa)",
};

/** Frase que explica, em uma linha, o que o par polo/resultado significa. */
export function explicarPolo(caso: CasoJurisprudencia): string {
  if (caso.tipo === "sumula") return "";
  if (!caso.polo) return "Este caso não tem polo classificado.";
  if (caso.polo === "indeterminado") return "O resumo não permite dizer quem venceu.";
  if (caso.polo === "parcial" || caso.resultado === "parcial") {
    return "Decisão parcial: nenhum dos lados venceu por inteiro.";
  }
  const recorrente = ladoDoRecorrente(caso.recorrente);
  const vencedor = VENCEDOR[caso.polo] ?? `o polo ${caso.polo}`;
  // Só atribui o recurso quando o dado é coerente: quem recorreu e venceu, ou
  // quem recorreu e perdeu. Fora disso, o campo `recorrente` do acervo mistura
  // o autor da ação com o autor do recurso e a frase sairia contraditória.
  if (recorrente && caso.polo === recorrente && caso.resultado === "provido") {
    return `${SUJEITO[recorrente]} recorreu e venceu.`;
  }
  if (recorrente && caso.polo !== recorrente && caso.resultado === "negado") {
    return `${SUJEITO[recorrente]} recorreu e perdeu; venceu ${vencedor}.`;
  }
  return `Venceu ${vencedor}.`;
}

export function merito(caso: CasoJurisprudencia): string {
  if (caso.tipo === "sumula") return "—";
  const polo = NOMES_POLO[caso.polo] ?? ROTULOS[caso.polo] ?? caso.polo;
  const resultado = ROTULOS[caso.resultado] ?? caso.resultado;
  return [polo, resultado].filter(Boolean).join(" · ") || "—";
}
