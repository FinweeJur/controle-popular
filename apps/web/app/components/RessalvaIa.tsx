"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Ressalva obrigatória de IA (decisão 4 de 22/08/2026, `docs/ESTADO.md`):
 * toda resposta gerada por modelo exibe este bloco, com data e modelo, e o
 * convite a conferir a fonte antes de decidir.
 *
 * Regra editorial do portal (PRODUTO.md): resumo gerado por modelo é o
 * portal afirmando algo — rotulado com data e modelo, e nunca apresentado
 * como conclusão do autor do documento. Por isso o rótulo da verificação
 * também aparece aqui: quando o verificador determinístico de citação
 * (`lib/assistente/verificador-citacao.ts`) acha número fora da fonte, o
 * bloco diz isso — avisar é melhor que acusar (F4-benchmark.md §5).
 */
export function RessalvaIa({
  modelo,
  data,
  verificacao,
}: {
  modelo?: string;
  data?: string;
  verificacao?: "ok" | "parcial" | "falhou";
}) {
  const rotuloVerificacao =
    verificacao === "ok"
      ? "Citação conferida contra as fontes."
      : verificacao === "parcial"
        ? "Alguns números da resposta não conferem com as fontes citadas — confira antes de decidir."
        : verificacao === "falhou"
          ? "Não consegui verificar a citação desta resposta — confira a fonte original."
          : null;

  return (
    <div className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
      <p className="flex items-start gap-1.5">
        <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          <strong>Resposta gerada por IA</strong>
          {data ? ` em ${data}` : ""}
          {modelo ? ` (${modelo})` : ""}.
          {" Confira a fonte antes de decidir."}
        </span>
      </p>
      {rotuloVerificacao && (
        <p className="mt-1 pl-[1.25rem]">{rotuloVerificacao}</p>
      )}
    </div>
  );
}
