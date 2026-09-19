import dadosJson from "@/data/negociacoes-parcerias/acordos-licitacoes-internacionais.json";

export interface ItemNegociacaoInternacional {
  id: string;
  titulo: string;
  setor: string;
  setor_rotulo: string;
  tipo_instrumento: string;
  paises: string[];
  pais_lider: string;
  entidades_principais: string[];
  status: string;
  valor_estimado_brl: number;
  valor_estimado_usd: number;
  data_registro: string;
  fonte_nome: string;
  fonte_url: string;
  resumo_fato: string;
  pronunciamentos_oficiais: string;
  contrapartidas_e_impacto_social: string;
}

export interface MetadadosNegociacoes {
  versao: string;
  ultima_atualizacao: string;
  descricao: string;
  setores_cobertos: string[];
  paises_cobertos: string[];
  fontes_oficiais: string[];
}

export interface BaseNegociacoes {
  metadados: MetadadosNegociacoes;
  itens: ItemNegociacaoInternacional[];
}

export function obterBaseNegociacoes(): BaseNegociacoes {
  return dadosJson as unknown as BaseNegociacoes;
}

export function obterAcordosELicitacoesInternacionais(): ItemNegociacaoInternacional[] {
  return (dadosJson as unknown as BaseNegociacoes).itens;
}

export interface AgregadosNegociacoes {
  totalItens: number;
  valorTotalBrl: number;
  valorTotalUsd: number;
  totalEditaisAbertos: number;
  totalSetores: number;
  totalPaisesEnvolvidos: number;
}

export function calcularAgregadosNegociacoes(
  itens: ItemNegociacaoInternacional[]
): AgregadosNegociacoes {
  if (!itens || itens.length === 0) {
    return {
      totalItens: 0,
      valorTotalBrl: 0,
      valorTotalUsd: 0,
      totalEditaisAbertos: 0,
      totalSetores: 0,
      totalPaisesEnvolvidos: 0,
    };
  }

  const totalItens = itens.length;
  const valorTotalBrl = itens.reduce((acc, i) => acc + i.valor_estimado_brl, 0);
  const valorTotalUsd = itens.reduce((acc, i) => acc + i.valor_estimado_usd, 0);
  const totalEditaisAbertos = itens.filter(
    (i) =>
      i.status.includes("Edital Aberto") ||
      i.tipo_instrumento.includes("Leilão") ||
      i.tipo_instrumento.includes("Edital")
  ).length;

  const setoresUnicos = new Set(itens.map((i) => i.setor));
  const paisesUnicos = new Set(itens.flatMap((i) => i.paises));

  return {
    totalItens,
    valorTotalBrl,
    valorTotalUsd,
    totalEditaisAbertos,
    totalSetores: setoresUnicos.size,
    totalPaisesEnvolvidos: paisesUnicos.size,
  };
}

/**
 * Gera planilha CSV compatível com Excel (BOM UTF-8 e ponto-e-vírgula).
 */
export function gerarCsvAcordosInternacionais(
  itens: ItemNegociacaoInternacional[]
): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "Título do Acordo/Edital",
    "Setor",
    "Tipo de Instrumento",
    "Países Envolvidos",
    "País Líder",
    "Status",
    "Valor Estimado (R$)",
    "Valor Estimado (US$)",
    "Data de Registro",
    "Fonte Oficial",
    "Entidades Principais",
    "Resumo do Fato",
    "Pronunciamento Oficial",
    "Contrapartidas e Impacto Social",
  ].join(";");

  const linhas = itens.map((item) => {
    return [
      `"${item.titulo.replace(/"/g, '""')}"`,
      `"${item.setor_rotulo.replace(/"/g, '""')}"`,
      `"${item.tipo_instrumento.replace(/"/g, '""')}"`,
      `"${item.paises.join(", ").replace(/"/g, '""')}"`,
      `"${item.pais_lider.replace(/"/g, '""')}"`,
      `"${item.status.replace(/"/g, '""')}"`,
      item.valor_estimado_brl.toFixed(2),
      item.valor_estimado_usd.toFixed(2),
      item.data_registro,
      `"${item.fonte_nome.replace(/"/g, '""')}"`,
      `"${item.entidades_principais.join(", ").replace(/"/g, '""')}"`,
      `"${item.resumo_fato.replace(/"/g, '""')}"`,
      `"${item.pronunciamentos_oficiais.replace(/"/g, '""')}"`,
      `"${item.contrapartidas_e_impacto_social.replace(/"/g, '""')}"`,
    ].join(";");
  });

  return BOM + cabecalho + "\n" + linhas.join("\n");
}
