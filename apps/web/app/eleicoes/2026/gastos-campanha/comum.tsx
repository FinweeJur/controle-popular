import type { ReactNode } from "react";
import type { BigTechDados } from "@/lib/eleicoes/gastos-2026";

/**
 * Peças comuns das seções da página de gastos: o cartão de topo e dois
 * agregadores de big tech (série mensal e total por grupo).
 *
 * Separação proposital: `page.tsx` só compõe seções; a matemática de
 * agregação mora aqui, testável e legível sem atravessar o JSX (pedido do
 * dono de 09/10/2026: arquivo curto, funções pequenas).
 */

/** Cartão de topo padrão — mesmo formato de `ambiental/licencas`. */
export function Cartao({ titulo, valor, detalhe }: { titulo: string; valor: ReactNode; detalhe: string }) {
  return (
    <div className="rounded-xl border border-[var(--cp-border)] p-4">
      <p className="text-xs uppercase tracking-wider opacity-70">{titulo}</p>
      <p className="font-tabular mt-1 text-2xl font-bold">{valor}</p>
      <p className="mt-1 text-xs opacity-80">{detalhe}</p>
    </div>
  );
}

/**
 * Agrega a série mensal de todas as big techs por mês de lançamento da
 * despesa: Meta, Google e TikTok entram no mesmo balde, mês a mês.
 */
export function serieMensal(empresas: BigTechDados["empresas"]): { mes: string; total: number }[] {
  const mapa = new Map<string, number>();
  for (const e of empresas) {
    for (const m of e.mensal) mapa.set(m.mes, (mapa.get(m.mes) ?? 0) + m.total);
  }
  return [...mapa].map(([mes, total]) => ({ mes, total }));
}

/** Total de big tech por grupo (meta, google, bytedance, kwai, x), do maior para o menor. */
export function totaisPorGrupo(empresas: BigTechDados["empresas"]): { rotulo: string; total: number }[] {
  const rotulo: Record<string, string> = {
    meta: "Meta (Facebook/Instagram)",
    google: "Google",
    bytedance: "TikTok (ByteDance)",
    kwai: "Kwai",
    x: "X (Twitter)",
  };
  const mapa = new Map<string, number>();
  for (const e of empresas) mapa.set(e.grupo, (mapa.get(e.grupo) ?? 0) + e.total);
  return [...mapa]
    .map(([grupo, total]) => ({ rotulo: rotulo[grupo] ?? grupo, total }))
    .sort((a, b) => b.total - a.total);
}
