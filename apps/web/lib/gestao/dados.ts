import type { MandatoGestao, ResumoStatusGestao, StatusProposta, Proposta } from "./tipos";
import type { ColunaCsv } from "@/lib/tabela/csv";

// Carregamento direto em tempo de build (SSG-safe e seguro para Cloudflare Workers)
import dadosMg from "@/data/gestao/governo-mg.json";
import dadosSp from "@/data/gestao/governo-sp.json";
import dadosRj from "@/data/gestao/governo-rj.json";
import dadosEs from "@/data/gestao/governo-es.json";
import dadosPa from "@/data/gestao/governo-pa.json";
import dadosDf from "@/data/gestao/governo-df.json";
import dadosUniao from "@/data/gestao/governo-uniao.json";
import dadosBetim from "@/data/gestao/gestao-betim.json";
import dadosBh from "@/data/gestao/gestao-bh.json";
import dadosAracuai from "@/data/gestao/gestao-aracuai.json";
import dadosBrumadinho from "@/data/gestao/gestao-brumadinho.json";

const MANDATOS_CATALOGO: Record<string, MandatoGestao> = {
  mg: dadosMg as unknown as MandatoGestao,
  sp: dadosSp as unknown as MandatoGestao,
  rj: dadosRj as unknown as MandatoGestao,
  es: dadosEs as unknown as MandatoGestao,
  pa: dadosPa as unknown as MandatoGestao,
  df: dadosDf as unknown as MandatoGestao,
  uniao: dadosUniao as unknown as MandatoGestao,
  federal: dadosUniao as unknown as MandatoGestao,
  betim: dadosBetim as unknown as MandatoGestao,
  bh: dadosBh as unknown as MandatoGestao,
  "belo-horizonte": dadosBh as unknown as MandatoGestao,
  aracuai: dadosAracuai as unknown as MandatoGestao,
  brumadinho: dadosBrumadinho as unknown as MandatoGestao,
};

export const ROTULOS_STATUS: Record<StatusProposta, { label: string; classe: string; desc: string }> = {
  sem_sinal: {
    label: "Sem sinal público",
    classe: "bg-surface-3 text-text-soft border-border",
    desc: "Nenhuma evidência pública localizada em diários, portais ou contratos até a última medição.",
  },
  anunciada: {
    label: "Anunciada em ato oficial",
    classe: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    desc: "Consta em decreto, projeto de lei ou anúncio oficial, mas ainda sem contratação executiva.",
  },
  em_andamento: {
    label: "Em execução / obra",
    classe: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    desc: "Contrato assinado, convênio ativo, edital publicado ou obra física em andamento.",
  },
  concluida: {
    label: "Entregue / Concluída",
    classe: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    desc: "Termo de recebimento definitivo, inauguração ou entrega documentada em órgão oficial.",
  },
  contrariada: {
    label: "Ato em sentido oposto",
    classe: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    desc: "Ato oficial (veto, cancelamento ou corte) em sentido contrário à proposta do plano.",
  },
  revogada: {
    label: "Proposta retirada",
    classe: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
    desc: "O próprio gestor revogou ou substituiu formalmente o compromisso.",
  },
};

/** Retorna os dados de gestão de um ente pelo seu slug */
export function obterMandato(slug: string): MandatoGestao | null {
  const chave = slug.toLowerCase().trim();
  return MANDATOS_CATALOGO[chave] ?? null;
}

/** Retorna todos os mandatos catalogados */
export function listarMandatos(): MandatoGestao[] {
  // Retorna sem duplicatas (mg, uniao, betim, bh)
  const vistos = new Set<string>();
  const lista: MandatoGestao[] = [];
  for (const [slug, m] of Object.entries(MANDATOS_CATALOGO)) {
    if (!vistos.has(m.ente)) {
      vistos.add(m.ente);
      lista.push(m);
    }
  }
  return lista;
}

/** Calcula os indicadores consolidados para os cartões de topo e gráficos */
export function calcularResumoGestao(mandato: MandatoGestao): ResumoStatusGestao {
  const porStatus: Record<StatusProposta, number> = {
    sem_sinal: 0,
    anunciada: 0,
    em_andamento: 0,
    concluida: 0,
    contrariada: 0,
    revogada: 0,
  };

  const porTema: Record<string, number> = {};
  const porOrgao: Record<string, number> = {};
  let totalEvidencias = 0;

  for (const p of mandato.propostas) {
    porStatus[p.status] = (porStatus[p.status] || 0) + 1;
    porTema[p.tema] = (porTema[p.tema] || 0) + 1;
    porOrgao[p.orgao_alvo] = (porOrgao[p.orgao_alvo] || 0) + 1;
    totalEvidencias += (p.evidencias || []).length;
  }

  const totalPropostas = mandato.propostas.length;
  const comSinal = totalPropostas - porStatus.sem_sinal;
  const percentualComSinal = totalPropostas > 0 ? Math.round((comSinal / totalPropostas) * 100) : 0;

  return {
    totalPropostas,
    porStatus,
    porTema,
    porOrgao,
    totalEvidencias,
    totalForaDoPlano: mandato.iniciativas_fora_do_plano.length,
    percentualComSinal,
  };
}

/** Colunas formatadas para o exportador universal de CSV do Controle Popular */
export function obterColunasCsvGestao(): ColunaCsv<Proposta>[] {
  return [
    { chave: "id", rotulo: "Código" },
    { chave: "tema", rotulo: "Tema / Área" },
    { chave: "orgao_alvo", rotulo: "Secretaria / Ministério" },
    { chave: "trecho_verbatim", rotulo: "Proposta Literal (Plano TSE)" },
    { chave: "plano_pagina", rotulo: "Página no PDF TSE" },
    {
      chave: "status",
      rotulo: "Situação Medida",
      formatar: (val: StatusProposta) => ROTULOS_STATUS[val]?.label ?? val,
    },
    { chave: "status_medido_em", rotulo: "Data da Última Verificação" },
    {
      chave: "evidencias",
      rotulo: "Qtd. Evidências Documentadas",
      formatar: (evs: any) => (Array.isArray(evs) ? evs.length : 0),
    },
    {
      chave: "observacao",
      rotulo: "Observações e Fontes",
      formatar: (val: any) => val || "Conferido em dados abertos",
    },
  ];
}
