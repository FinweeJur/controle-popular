import type { MandatoGestao, ResumoStatusGestao, StatusProposta, Proposta } from "./tipos";
import type { ColunaCsv } from "@/lib/tabela/csv";

// Carregamento direto em tempo de build (SSG-safe e seguro para Cloudflare Workers)
import dadosMg from "@/data/gestao/governo-mg.json";
import dadosSp from "@/data/gestao/governo-sp.json";
import dadosRj from "@/data/gestao/governo-rj.json";
import dadosEs from "@/data/gestao/governo-es.json";
import dadosPa from "@/data/gestao/governo-pa.json";
import dadosDf from "@/data/gestao/governo-df.json";
import dadosRs from "@/data/gestao/governo-rs.json";
import dadosPr from "@/data/gestao/governo-pr.json";
import dadosSc from "@/data/gestao/governo-sc.json";
import dadosBa from "@/data/gestao/governo-ba.json";
import dadosPe from "@/data/gestao/governo-pe.json";
import dadosCe from "@/data/gestao/governo-ce.json";
import dadosGo from "@/data/gestao/governo-go.json";
import dadosMt from "@/data/gestao/governo-mt.json";
import dadosMs from "@/data/gestao/governo-ms.json";
import dadosAm from "@/data/gestao/governo-am.json";
import dadosRo from "@/data/gestao/governo-ro.json";
import dadosTo from "@/data/gestao/governo-to.json";
import dadosAc from "@/data/gestao/governo-ac.json";
import dadosAp from "@/data/gestao/governo-ap.json";
import dadosRr from "@/data/gestao/governo-rr.json";
import dadosMa from "@/data/gestao/governo-ma.json";
import dadosPb from "@/data/gestao/governo-pb.json";
import dadosRn from "@/data/gestao/governo-rn.json";
import dadosAl from "@/data/gestao/governo-al.json";
import dadosPi from "@/data/gestao/governo-pi.json";
import dadosSe from "@/data/gestao/governo-se.json";
import dadosUniao from "@/data/gestao/governo-uniao.json";
import dadosBetim from "@/data/gestao/gestao-betim.json";
import dadosBh from "@/data/gestao/gestao-bh.json";
import dadosAracuai from "@/data/gestao/gestao-aracuai.json";
import dadosBrumadinho from "@/data/gestao/gestao-brumadinho.json";
import dadosCapitais from "@/data/gestao/gestao-capitais.json";
import dadosPolos from "@/data/gestao/gestao-polos.json";

const MANDATOS_CATALOGO: Record<string, MandatoGestao> = {
  // Sudeste
  mg: dadosMg as unknown as MandatoGestao,
  sp: dadosSp as unknown as MandatoGestao,
  rj: dadosRj as unknown as MandatoGestao,
  es: dadosEs as unknown as MandatoGestao,
  // Sul
  rs: dadosRs as unknown as MandatoGestao,
  pr: dadosPr as unknown as MandatoGestao,
  sc: dadosSc as unknown as MandatoGestao,
  // Nordeste
  ba: dadosBa as unknown as MandatoGestao,
  pe: dadosPe as unknown as MandatoGestao,
  ce: dadosCe as unknown as MandatoGestao,
  ma: dadosMa as unknown as MandatoGestao,
  pb: dadosPb as unknown as MandatoGestao,
  rn: dadosRn as unknown as MandatoGestao,
  al: dadosAl as unknown as MandatoGestao,
  pi: dadosPi as unknown as MandatoGestao,
  se: dadosSe as unknown as MandatoGestao,
  // Centro-Oeste
  df: dadosDf as unknown as MandatoGestao,
  go: dadosGo as unknown as MandatoGestao,
  mt: dadosMt as unknown as MandatoGestao,
  ms: dadosMs as unknown as MandatoGestao,
  // Norte
  pa: dadosPa as unknown as MandatoGestao,
  am: dadosAm as unknown as MandatoGestao,
  ro: dadosRo as unknown as MandatoGestao,
  to: dadosTo as unknown as MandatoGestao,
  ac: dadosAc as unknown as MandatoGestao,
  ap: dadosAp as unknown as MandatoGestao,
  rr: dadosRr as unknown as MandatoGestao,
  // Federal
  uniao: dadosUniao as unknown as MandatoGestao,
  federal: dadosUniao as unknown as MandatoGestao,
  // Prefeituras Piloto
  betim: dadosBetim as unknown as MandatoGestao,
  bh: dadosBh as unknown as MandatoGestao,
  "belo-horizonte": dadosBh as unknown as MandatoGestao,
  aracuai: dadosAracuai as unknown as MandatoGestao,
  brumadinho: dadosBrumadinho as unknown as MandatoGestao,
};

const MANDATOS_CAPITAIS: Record<string, MandatoGestao> = dadosCapitais as unknown as Record<string, MandatoGestao>;
const MANDATOS_POLOS: Record<string, MandatoGestao> = dadosPolos as unknown as Record<string, MandatoGestao>;

const MANDATOS_PREFEITURAS: Record<string, MandatoGestao> = {
  ...MANDATOS_POLOS,
  ...MANDATOS_CAPITAIS,
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

/** Retorna os dados de gestão de um ente pelo seu slug, com desambiguação por esfera quando necessário */
export function obterMandato(slug: string, esfera?: "municipal" | "estadual" | "federal"): MandatoGestao | null {
  const chave = slug.toLowerCase().trim();
  if (esfera === "municipal") {
    return MANDATOS_PREFEITURAS[chave] ?? MANDATOS_CATALOGO[chave] ?? null;
  }
  if (esfera === "estadual") {
    return MANDATOS_CATALOGO[chave] ?? null;
  }
  return MANDATOS_CATALOGO[chave] ?? MANDATOS_PREFEITURAS[chave] ?? null;
}

/** Retorna todos os mandatos catalogados (27 estados, união e 199 cidades estratégicas) */
export function listarMandatos(): MandatoGestao[] {
  const vistos = new Set<string>();
  const lista: MandatoGestao[] = [];

  // 1. Governos Estaduais e Federal
  for (const m of Object.values(MANDATOS_CATALOGO)) {
    if (m.esfera === "estadual" || m.esfera === "federal") {
      if (!vistos.has(m.ente)) {
        vistos.add(m.ente);
        lista.push(m);
      }
    }
  }

  // 2. Prefeituras (Capitais e Polos do Interior)
  for (const m of Object.values(MANDATOS_PREFEITURAS)) {
    const chave = `municipal:${m.slug}`;
    if (!vistos.has(chave)) {
      vistos.add(chave);
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
