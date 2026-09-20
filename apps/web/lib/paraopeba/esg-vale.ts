/**
 * Análises ESG da Vale — dados gerados por IA (Seu Nono Sabia).
 *
 * Lê `apps/web/data/esg-update.json` para integrar na seção Paraopeba.
 */

import bruto from "@/data/esg-update.json";

export interface AnaliseEsg {
  fonte: string;
  titulo: string;
  resumo: string;
  analise_completa: string;
  modelo: string;
}

export interface DadosEsgVale {
  atualizacao: string;
  fonte: string;
  analises: AnaliseEsg[];
}

let cache: DadosEsgVale | null = null;

export function carregarAnalisesEsg(): DadosEsgVale {
  if (cache) return cache;

  cache = {
    atualizacao: bruto.atualizacao,
    fonte: bruto.fonte,
    analises: bruto.analises as AnaliseEsg[],
  };

  return cache;
}

export function obterAnalisePorFonte(fonte: string): AnaliseEsg | undefined {
  const dados = carregarAnalisesEsg();
  return dados.analises.find((a) => a.fonte === fonte);
}
