import dadosJson from "@/data/legislativo-estaduais/parlamentares-estaduais.json";

export interface AtividadeParlamentarEstadual {
  posicao_ranking: number;
  pontuacao_garantista: number;
  presenca_plenario_pct: number;
  coerencia_pct: number;
  projetos_apresentados: number;
  projetos_aprovados: number;
  requerimentos_fiscalizacao: number;
}

export interface RemuneracaoEstadual {
  subsidio_bruto_mensal: number;
  auxilio_moradia_mensal: number;
  gasto_cota_acumulado_ano: number;
}

export interface GabineteEstadual {
  total_assessores_comissionados: number;
  custo_folha_mensal: number;
}

export interface DespesaCotaItem {
  categoria: string;
  valor_brl: number;
}

export interface DeputadoEstadual {
  id: string;
  nome: string;
  partido: string;
  cargo_mesa: string;
  bloco: string;
  municipio_origem: string;
  url_perfil_oficial?: string;
  atividade: AtividadeParlamentarEstadual;
  remuneracao: RemuneracaoEstadual;
  gabinete: GabineteEstadual;
  maiores_despesas_cota: DespesaCotaItem[];
}

export interface AssembleiaEstadual {
  uf: string;
  nome_uf: string;
  nome_assembleia: string;
  sigla: string;
  total_cadeiras: number;
  subsidio_mensal_bruto: number;
  verba_gabinete_limite_mensal: number;
  cota_parlamentar_teto_mensal: number;
  url_portal_transparencia?: string;
  deputados: DeputadoEstadual[];
}

interface BaseAssembleias {
  metadados: {
    versao: string;
    ultima_atualizacao: string;
    fontes_oficiais: string[];
    nota_metodologica: string;
  };
  assembleias: Record<string, AssembleiaEstadual>;
}

export function obterAssembleiaEstadual(uf: string): AssembleiaEstadual | null {
  const base = dadosJson as unknown as BaseAssembleias;
  const ufNormalizada = uf.toLowerCase();
  if (base.assembleias[ufNormalizada]) {
    return base.assembleias[ufNormalizada];
  }
  // Fallback para MG se a UF não tiver acervo completo ainda
  return base.assembleias["mg"] || null;
}

export function listarUfsAssembleias(): string[] {
  const base = dadosJson as unknown as BaseAssembleias;
  return Object.keys(base.assembleias);
}

export interface AgregadosAssembleia {
  totalDeputados: number;
  mediaPresencaPct: number;
  mediaPontuacaoGarantista: number;
  totalGastoCotaBrl: number;
  totalProjetosApresentados: number;
  totalRequerimentosFiscalizacao: number;
}

export function calcularAgregadosAssembleia(
  deputados: DeputadoEstadual[]
): AgregadosAssembleia {
  if (!deputados || deputados.length === 0) {
    return {
      totalDeputados: 0,
      mediaPresencaPct: 0,
      mediaPontuacaoGarantista: 0,
      totalGastoCotaBrl: 0,
      totalProjetosApresentados: 0,
      totalRequerimentosFiscalizacao: 0,
    };
  }

  const totalDeputados = deputados.length;
  const somaPresenca = deputados.reduce(
    (acc, d) => acc + d.atividade.presenca_plenario_pct,
    0
  );
  const somaPontuacao = deputados.reduce(
    (acc, d) => acc + d.atividade.pontuacao_garantista,
    0
  );
  const totalGastoCotaBrl = deputados.reduce(
    (acc, d) => acc + d.remuneracao.gasto_cota_acumulado_ano,
    0
  );
  const totalProjetosApresentados = deputados.reduce(
    (acc, d) => acc + d.atividade.projetos_apresentados,
    0
  );
  const totalRequerimentosFiscalizacao = deputados.reduce(
    (acc, d) => acc + d.atividade.requerimentos_fiscalizacao,
    0
  );

  return {
    totalDeputados,
    mediaPresencaPct: Math.round((somaPresenca / totalDeputados) * 10) / 10,
    mediaPontuacaoGarantista:
      Math.round((somaPontuacao / totalDeputados) * 10) / 10,
    totalGastoCotaBrl,
    totalProjetosApresentados,
    totalRequerimentosFiscalizacao,
  };
}

/**
 * Exporta CSV no padrão de 5 coisas do projeto (BOM UTF-8 e ponto-e-vírgula).
 */
export function gerarCsvDeputadosEstaduais(
  deputados: DeputadoEstadual[],
  siglaAssembleia: string
): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "Assembleia",
    "Posição no Ranking",
    "Deputado(a)",
    "Partido",
    "Bloco",
    "Município de Origem",
    "Pontuação Garantista",
    "Presença em Plenário (%)",
    "Coerência Votações (%)",
    "Projetos Apresentados",
    "Projetos Aprovados",
    "Requerimentos de Fiscalização",
    "Subsídio Bruto Mensal (R$)",
    "Gasto de Cota Acumulado Ano (R$)",
    "Assessores de Gabinete",
    "Custo Mensal da Folha de Gabinete (R$)",
  ].join(";");

  const linhas = deputados.map((d) => {
    return [
      `"${siglaAssembleia}"`,
      d.atividade.posicao_ranking,
      `"${d.nome}"`,
      `"${d.partido}"`,
      `"${d.bloco}"`,
      `"${d.municipio_origem}"`,
      d.atividade.pontuacao_garantista.toFixed(1),
      d.atividade.presenca_plenario_pct.toFixed(1),
      d.atividade.coerencia_pct.toFixed(1),
      d.atividade.projetos_apresentados,
      d.atividade.projetos_aprovados,
      d.atividade.requerimentos_fiscalizacao,
      d.remuneracao.subsidio_bruto_mensal.toFixed(2),
      d.remuneracao.gasto_cota_acumulado_ano.toFixed(2),
      d.gabinete.total_assessores_comissionados,
      d.gabinete.custo_folha_mensal.toFixed(2),
    ].join(";");
  });

  return BOM + cabecalho + "\n" + linhas.join("\n");
}
