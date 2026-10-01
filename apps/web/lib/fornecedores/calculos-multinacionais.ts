/**
 * Acervo de fornecedores multinacionais (EUA e Europa) que vendem ao Estado
 * brasileiro. Expõe a tipagem do JSON versionado, os agregados de painel, a
 * formatação de moeda e a exportação CSV.
 *
 * Fonte oficial (metadados do próprio JSON, atualizado em 2026-09-19):
 *   - Portal Nacional de Contratações Públicas (PNCP) — Lei 14.133/2021;
 *   - Portal da Transparência da CGU / SIAFI;
 *   - SEC (formulários 10-K e 20-F) para as demonstrações das empresas dos EUA;
 *   - demonstrações IFRS auditadas (Europa);
 *   - Ministério da Defesa — acordos de compensação tecnológica (offsets);
 *   - SSE/HKEX (relatórios auditados) e ANEEL (concessões de transmissão).
 * Câmbio de referência USD/BRL registrado no JSON: 5.45.
 *
 * Decisões e ressalvas:
 *   - O acervo mistura número global (lucro da empresa no mundo) com valor de
 *     contrato no Brasil. A tela NÃO pode justapor os dois sem a ressalva
 *     (AGENTS §7): lucro global alto não é causa do contrato brasileiro.
 *   - `calcularAgregadosMultinacionais` devolve a MÉDIA das médias anuais
 *     (`mediaAnualGeralBrl`), não a soma — somar médias inflaria o total.
 *   - CSV no padrão do projeto: BOM UTF-8 e separador ';' (Excel pt-BR).
 */
import dadosJson from "@/data/fornecedores/multinacionais-eua-europa.json";

export interface ValoresContratos {
  total_acumulado_brl: number;
  total_acumulado_usd: number;
  media_anual_brl: number;
  media_anual_usd: number;
}

export interface DadosFinanceirosGlobais {
  ano_fiscal_referencia: number;
  receita_anual_global: number;
  lucro_liquido_anual: number;
  lucro_liquido_acumulado_5_anos: number;
  lucro_liquido_acumulado_10_anos: number;
  participacao_erario_brasil_pct: number;
}

export interface CondicoesContratuais {
  modalidade_predominante: string;
  sla_exigido: string;
  garantia_execucao: string;
  reajuste: string;
}

export interface ContrapartidasEOffsets {
  possui_contrapartida: boolean;
  tipo_contrapartida: string;
  descricao: string;
  dependencia_tecnologica: string;
}

export interface FornecedorMultinacional {
  id: string;
  nome: string;
  pais_origem: string;
  continente: string;
  sede: string;
  ticker: string;
  cik_sec: string;
  setor: string;
  orgaos_atendidos: string[];
  esferas: string[];
  objeto_fornecimento: string;
  volume_fornecido: string;
  desde_ano: number;
  vigencia_ate: number;
  valores_contratos: ValoresContratos;
  dados_financeiros_globais_usd: DadosFinanceirosGlobais;
  condicoes_contratuais: CondicoesContratuais;
  contrapartidas_e_offsets: ContrapartidasEOffsets;
  url_sec_filing?: string;
  url_portal_compras?: string;
}

export interface MetadadosFornecedores {
  versao: string;
  ultima_atualizacao: string;
  fontes_principais: string[];
  cambio_referencia_usd_brl: number;
}

export interface BaseFornecedores {
  metadados: MetadadosFornecedores;
  empresas: FornecedorMultinacional[];
}

export function obterBaseFornecedores(): BaseFornecedores {
  return dadosJson as unknown as BaseFornecedores;
}

export function obterFornecedoresMultinacionais(): FornecedorMultinacional[] {
  return (dadosJson as unknown as BaseFornecedores).empresas;
}

export interface AgregadosMultinacionais {
  totalEmpresas: number;
  totalContratosBrl: number;
  totalContratosUsd: number;
  totalComContrapartida: number;
  pctComContrapartida: number;
  totalSetores: number;
  mediaAnualGeralBrl: number;
}

export function calcularAgregadosMultinacionais(
  empresas: FornecedorMultinacional[]
): AgregadosMultinacionais {
  if (!empresas || empresas.length === 0) {
    return {
      totalEmpresas: 0,
      totalContratosBrl: 0,
      totalContratosUsd: 0,
      totalComContrapartida: 0,
      pctComContrapartida: 0,
      totalSetores: 0,
      mediaAnualGeralBrl: 0,
    };
  }

  const totalEmpresas = empresas.length;
  const totalContratosBrl = empresas.reduce(
    (acc, e) => acc + e.valores_contratos.total_acumulado_brl,
    0
  );
  const totalContratosUsd = empresas.reduce(
    (acc, e) => acc + e.valores_contratos.total_acumulado_usd,
    0
  );
  // Média das médias anuais (não a soma): o campo é "média anual geral".
  const mediaAnualGeralBrl =
    empresas.reduce((acc, e) => acc + e.valores_contratos.media_anual_brl, 0) /
    totalEmpresas;
  const totalComContrapartida = empresas.filter(
    (e) => e.contrapartidas_e_offsets.possui_contrapartida
  ).length;
  const pctComContrapartida = Math.round(
    (totalComContrapartida / totalEmpresas) * 100
  );
  const setoresUnicos = new Set(empresas.map((e) => e.setor));

  return {
    totalEmpresas,
    totalContratosBrl,
    totalContratosUsd,
    totalComContrapartida,
    pctComContrapartida,
    totalSetores: setoresUnicos.size,
    mediaAnualGeralBrl,
  };
}

export function formatarMoedaBrl(valor: number): string {
  if (valor >= 1_000_000_000) {
    return `R$ ${(valor / 1_000_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} bi`;
  }
  if (valor >= 1_000_000) {
    return `R$ ${(valor / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} mi`;
  }
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarMoedaUsd(valor: number): string {
  if (valor >= 1_000_000_000) {
    return `US$ ${(valor / 1_000_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    })} bi`;
  }
  if (valor >= 1_000_000) {
    return `US$ ${(valor / 1_000_000).toLocaleString("pt-BR", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} mi`;
  }
  return valor.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/**
 * Gera CSV estruturado com BOM UTF-8 e delimitador ';' (padrão de 5 coisas do projeto).
 */
export function gerarCsvFornecedoresMultinacionais(
  empresas: FornecedorMultinacional[]
): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "Empresa",
    "País",
    "Continente",
    "Ticker/Bolsa",
    "Setor",
    "Valor Total (R$)",
    "Valor Total (US$)",
    "Média Anual (R$)",
    "Lucro Global Anual (US$)",
    "Lucro 5 Anos (US$)",
    "Lucro 10 Anos (US$)",
    "Impacto no Lucro Global (%)",
    "Desde Ano",
    "Vigência Até",
    "Tem Contrapartida (Offset)",
    "Dependência Tecnológica",
    "Órgãos Atendidos",
    "Objeto",
  ].join(";");

  const linhas = empresas.map((e) => {
    return [
      `"${e.nome}"`,
      `"${e.pais_origem}"`,
      `"${e.continente}"`,
      `"${e.ticker}"`,
      `"${e.setor}"`,
      e.valores_contratos.total_acumulado_brl.toFixed(2),
      e.valores_contratos.total_acumulado_usd.toFixed(2),
      e.valores_contratos.media_anual_brl.toFixed(2),
      e.dados_financeiros_globais_usd.lucro_liquido_anual.toFixed(2),
      e.dados_financeiros_globais_usd.lucro_liquido_acumulado_5_anos.toFixed(2),
      e.dados_financeiros_globais_usd.lucro_liquido_acumulado_10_anos.toFixed(2),
      e.dados_financeiros_globais_usd.participacao_erario_brasil_pct.toFixed(2),
      e.desde_ano,
      e.vigencia_ate,
      e.contrapartidas_e_offsets.possui_contrapartida ? "Sim" : "Não",
      `"${e.contrapartidas_e_offsets.dependencia_tecnologica.replace(/"/g, '""')}"`,
      `"${e.orgaos_atendidos.join(", ").replace(/"/g, '""')}"`,
      `"${e.objeto_fornecimento.replace(/"/g, '""')}"`,
    ].join(";");
  });

  return BOM + cabecalho + "\n" + linhas.join("\n");
}
