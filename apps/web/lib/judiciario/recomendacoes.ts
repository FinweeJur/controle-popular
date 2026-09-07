import type { ColunaCsv } from "@/lib/tabela/csv";
import dadosJson from "@/data/judiciario/recomendacoes-cnj-cnmp.json";

export type OrgaoFiscalizador = "CNJ" | "CNMP";
export type TipoAtoJudiciario = "determinação" | "recomendação";
export type StatusCumprimento = "em_monitoramento" | "cumprida" | "reiterada" | "parcialmente_cumprida";

export interface ItemRecomendacao {
  id: string;
  orgao_fiscalizador: OrgaoFiscalizador;
  tribunal_ou_mp: string;
  tipo_ato: TipoAtoJudiciario;
  numero_item: string;
  tema: string;
  tags: string[];
  microresumo: string;
  texto_oficial: string;
  unidade_alvo: string;
  ano: number;
  status_cumprimento: StatusCumprimento;
  link_relatorio: string;
}

export const ROTULOS_STATUS_CUMPRIMENTO: Record<StatusCumprimento, { label: string; classe: string; desc: string }> = {
  cumprida: {
    label: "Cumprida",
    classe: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    desc: "O tribunal ou Ministério Público comprovou formalmente que atendeu a determinação.",
  },
  em_monitoramento: {
    label: "Em monitoramento",
    classe: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    desc: "Prazo em curso ou cumprimento sendo acompanhado pela Corregedoria Nacional.",
  },
  parcialmente_cumprida: {
    label: "Parcialmente cumprida",
    classe: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
    desc: "A unidade iniciou as medidas, mas ainda não atendeu todos os critérios exigidos.",
  },
  reiterada: {
    label: "Reiterada (Cobrada de novo)",
    classe: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
    desc: "Não foi cumprida na inspeção anterior e teve que ser cobrada uma segunda ou terceira vez.",
  },
};

/** Retorna a lista completa de recomendações e determinações do CNJ e CNMP */
export function obterRecomendacoes(): ItemRecomendacao[] {
  return (dadosJson.itens as ItemRecomendacao[]) || [];
}

/** Calcula estatísticas agregadas para os cartões de topo */
export function calcularEstatisticasRecomendacoes(itens: ItemRecomendacao[]) {
  let cnj = 0;
  let cnmp = 0;
  let cumpridas = 0;
  let emMonitoramento = 0;
  let reiteradas = 0;

  const porTema: Record<string, number> = {};
  const porTribunal: Record<string, number> = {};

  for (const item of itens) {
    if (item.orgao_fiscalizador === "CNJ") cnj++;
    else if (item.orgao_fiscalizador === "CNMP") cnmp++;

    if (item.status_cumprimento === "cumprida") cumpridas++;
    else if (item.status_cumprimento === "em_monitoramento") emMonitoramento++;
    else if (item.status_cumprimento === "reiterada") reiteradas++;

    porTema[item.tema] = (porTema[item.tema] || 0) + 1;
    porTribunal[item.tribunal_ou_mp] = (porTribunal[item.tribunal_ou_mp] || 0) + 1;
  }

  return {
    total: itens.length,
    cnj,
    cnmp,
    cumpridas,
    emMonitoramento,
    reiteradas,
    porTema,
    porTribunal,
  };
}

/** Colunas formatadas para o exportador CSV com BOM UTF-8 e delimitador ; */
export function obterColunasCsvRecomendacoes(): ColunaCsv<ItemRecomendacao>[] {
  return [
    { chave: "id", rotulo: "Código" },
    { chave: "orgao_fiscalizador", rotulo: "Órgão Fiscalizador" },
    { chave: "tribunal_ou_mp", rotulo: "Tribunal ou MP" },
    { chave: "tipo_ato", rotulo: "Tipo de Ato" },
    { chave: "numero_item", rotulo: "Item no Relatório" },
    { chave: "tema", rotulo: "Tema Principal" },
    { chave: "microresumo", rotulo: "O que Significa (Microresumo)" },
    { chave: "unidade_alvo", rotulo: "Vara / Promotoria Alvo" },
    { chave: "ano", rotulo: "Ano da Correição" },
    {
      chave: "status_cumprimento",
      rotulo: "Status de Cumprimento",
      formatar: (st: StatusCumprimento) => ROTULOS_STATUS_CUMPRIMENTO[st]?.label ?? st,
    },
    { chave: "texto_oficial", rotulo: "Texto Oficial do Ato" },
    { chave: "link_relatorio", rotulo: "Link do Relatório" },
  ];
}
