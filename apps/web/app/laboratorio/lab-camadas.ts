/**
 * Laboratório — plugar o catálogo (22 fontes + salários = 23 camadas) na
 * janela PowerBI. Cada camada vira um `JanelaDados` com NO MÁXIMO o
 * agregado (`SerieDither[]` → `DitherItem[]`), nunca o array bruto
 * (regra §5.1: payload serializa 3×).
 */

import { CATALOGO_DADOS, type DadoCatalogo, type SerieDither } from "@/lib/laboratorio/dados-catalogo";
import type { DitherItem } from "./lab-dither";
import type { JanelaDados } from "./LabJanela";

const PALETA = [
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

function cor(i: number): string {
  return PALETA[i % PALETA.length];
}

/** Séries do catálogo → itens da janela (pega a 1ª série como eixo principal;
 *  demais entram no mesmo eixo, concatenadas — PowerBI-style multi-camada). */
export function serieParaItens(series: SerieDither[]): DitherItem[] {
  const itens: DitherItem[] = [];
  for (const s of series) {
    for (const [i, p] of s.pontos.entries()) {
      itens.push({
        rotulo: series.length > 1 ? `${s.nome}: ${p.x}` : p.x,
        valor: p.y,
        cor: cor(i),
      });
    }
  }
  // corta para caber no gráfico — agregado, não acervo bruto
  return itens.slice(0, 40);
}

export function dadoParaJanela(dado: DadoCatalogo): JanelaDados {
  const series = dado.dadosParaDither();
  const itens = serieParaItens(series);
  const primeiro = series[0];
  const fonteLabel = `Fonte: ${dado.fonte} · ${itens.length > 0 ? `${itens.length} pontos (agregado)` : "sem pontos nesta camada"}`;
  return {
    titulo: dado.nome,
    itens,
    fonteLabel,
    fonteUrl: dado.rotaPortal,
    filtros:
      primeiro && primeiro.pontos.length > 1
        ? {
            label: "categoria",
            valores: [...new Set(primeiro.pontos.map((p) => p.x))],
          }
        : undefined,
  };
}

/** Mapa id → janela para TODAS as camadas do catálogo. */
export function montarCamadasCatalogo(): Record<string, JanelaDados> {
  const saida: Record<string, JanelaDados> = {};
  for (const dado of CATALOGO_DADOS) {
    saida[dado.id] = dadoParaJanela(dado);
  }
  return saida;
}

/** Lista ordenada (nome) para o dock e o painel de camadas do Seu Nonô. */
export function listarCamadasLab(): { id: string; nome: string; categoria: string }[] {
  return CATALOGO_DADOS.map((d) => ({
    id: d.id,
    nome: d.nome,
    categoria: d.categoria,
  })).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
