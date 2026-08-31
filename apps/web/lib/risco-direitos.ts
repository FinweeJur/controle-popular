/**
 * Cálculo e estrutura do Índice de Risco a Direitos (0 a 100).
 *
 * Avalia o risco real aos direitos fundamentais da população em 4 dimensões:
 * 1. Risco à Saúde e à Vida (Peso 30%)
 * 2. Risco Socioambiental e Climático (Peso 30%)
 * 3. Risco à Integridade e ao Erário (Peso 25%)
 * 4. Risco de Opacidade Político-Institucional (Peso 15%)
 */

export type NivelRisco = "baixo" | "medio" | "alto" | "critico";

export interface FatorRisco {
  id: string;
  dimensao: "saude_vida" | "socioambiental_clima" | "integridade_erario" | "opacidade_politica";
  titulo: string;
  detalhe: string;
  gravidade: "alerta" | "critico" | "grave";
  fonte: string;
  urlFonte?: string;
}

export interface IndiceRiscoDireitos {
  scoreGeral: number; // 0 a 100
  nivel: NivelRisco;
  rotuloNivel: string;
  corHex: string;
  dimensoes: {
    saudeVida: {
      score: number;
      peso: number;
      fatores: FatorRisco[];
    };
    socioambientalClima: {
      score: number;
      peso: number;
      fatores: FatorRisco[];
    };
    integridadeErario: {
      score: number;
      peso: number;
      fatores: FatorRisco[];
    };
    opacidadePolitica: {
      score: number;
      peso: number;
      fatores: FatorRisco[];
    };
  };
  fatoresCriticos: FatorRisco[];
}

export function classificarNivelRisco(score: number): {
  nivel: NivelRisco;
  rotulo: string;
  corHex: string;
} {
  if (score >= 76) {
    return { nivel: "critico", rotulo: "Risco Crítico", corHex: "#ef4444" };
  }
  if (score >= 51) {
    return { nivel: "alto", rotulo: "Risco Alto", corHex: "#f97316" };
  }
  if (score >= 26) {
    return { nivel: "medio", rotulo: "Risco Moderado", corHex: "#eab308" };
  }
  return { nivel: "baixo", rotulo: "Risco Baixo / Monitorado", corHex: "#22c55e" };
}

/**
 * Calcula o Índice de Risco a Direitos a partir dos agregados do município.
 */
export function calcularIndiceRiscoDireitos(dados: {
  barragensCriticasQtd: number;
  sobreposicoesTiCarHa: number;
  infracoesIbamaAtivasQtd: number;
  contratosDoadoresReais: number;
  empresasSancionadasContratosQtd: number;
  camaraSemApiAberta: boolean;
  internacoesCidsAmbientaisQtd: number;
  taxaMortalidadeEvitavel: number;
  indiceTransparenciaPntp: number; // 0 a 100
}): IndiceRiscoDireitos {
  const fatores: FatorRisco[] = [];

  // 1. Saúde e Vida (Peso 30%)
  let scoreSaude = 15;
  if (dados.internacoesCidsAmbientaisQtd > 100) {
    scoreSaude += 40;
    fatores.push({
      id: "saude-cid-anomalo",
      dimensao: "saude_vida",
      titulo: "Concentração elevada de internações por CIDs sensíveis",
      detalhe: `${dados.internacoesCidsAmbientaisQtd} internações registradas por causas com correlação ambiental/poluição.`,
      gravidade: "critico",
      fonte: "SIH/DATASUS",
      urlFonte: "https://datasus.saude.gov.br/",
    });
  }
  if (dados.taxaMortalidadeEvitavel > 20) {
    scoreSaude += 30;
    fatores.push({
      id: "saude-mortalidade-evitavel",
      dimensao: "saude_vida",
      titulo: "Taxa de mortalidade prematura por causas evitáveis acima da média",
      detalhe: "Indicador acima do limiar de alerta do Ministério da Saúde.",
      gravidade: "grave",
      fonte: "SIM/DATASUS",
    });
  }
  scoreSaude = Math.min(100, scoreSaude);

  // 2. Socioambiental e Clima (Peso 30%)
  let scoreAmbiental = 10;
  if (dados.barragensCriticasQtd > 0) {
    scoreAmbiental += 50;
    fatores.push({
      id: "amb-barragens",
      dimensao: "socioambiental_clima",
      titulo: "Barragens de mineração em nível de emergência no município",
      detalhe: `${dados.barragensCriticasQtd} estrutura(s) classificada(s) em Nível 1, 2 ou 3 de emergência.`,
      gravidade: "critico",
      fonte: "SIGBM/ANM",
      urlFonte: "https://dadosabertos.anm.gov.br/",
    });
  }
  if (dados.sobreposicoesTiCarHa > 0) {
    scoreAmbiental += 35;
    fatores.push({
      id: "amb-sobreposicao-ti",
      dimensao: "socioambiental_clima",
      titulo: "Sobreposição de imóveis rurais (CAR) sobre Terras Indígenas/Quilombolas",
      detalhe: `${dados.sobreposicoesTiCarHa.toLocaleString("pt-BR")} hectares de área cadastrada sobre território tradicional protegido.`,
      gravidade: "critico",
      fonte: "SICAR / FUNAI / INCRA",
    });
  }
  if (dados.infracoesIbamaAtivasQtd > 0) {
    scoreAmbiental += 20;
  }
  scoreAmbiental = Math.min(100, scoreAmbiental);

  // 3. Integridade e Erário (Peso 25%)
  let scoreIntegridade = 15;
  if (dados.empresasSancionadasContratosQtd > 0) {
    scoreIntegridade += 50;
    fatores.push({
      id: "int-ceis",
      dimensao: "integridade_erario",
      titulo: "Contratação de empresas inscritas no CEIS/CNEP ou inidôneas",
      detalhe: `${dados.empresasSancionadasContratosQtd} contrato(s) com empresas impedidas de licitar.`,
      gravidade: "critico",
      fonte: "PNCP / Portal da Transparência CGU",
      urlFonte: "https://portaldatransparencia.gov.br/ceis",
    });
  }
  if (dados.contratosDoadoresReais > 100000) {
    scoreIntegridade += 30;
    fatores.push({
      id: "int-doadores",
      dimensao: "integridade_erario",
      titulo: "Contratos públicos com doadores de campanha eleitoral",
      detalhe: `R$ ${dados.contratosDoadoresReais.toLocaleString("pt-BR")} empenhados a fornecedores ligados a financiadores eleitorais.`,
      gravidade: "alerta",
      fonte: "PNCP / TSE DivulgaCandContas",
    });
  }
  scoreIntegridade = Math.min(100, scoreIntegridade);

  // 4. Opacidade Política (Peso 15%)
  let scoreOpacidade = 10;
  if (dados.camaraSemApiAberta) {
    scoreOpacidade += 45;
    fatores.push({
      id: "opac-camara",
      dimensao: "opacidade_politica",
      titulo: "Câmara Municipal sem módulo estruturado de matérias legislativas",
      detalhe: "Impossibilidade de monitorar votações nominais e projetos de lei em formato aberto.",
      gravidade: "grave",
      fonte: "Diagnóstico Legislativo / SAPL",
    });
  }
  if (dados.indiceTransparenciaPntp < 50) {
    scoreOpacidade += 35;
  }
  scoreOpacidade = Math.min(100, scoreOpacidade);

  // Ponderação Global
  const scoreGeral = Math.round(
    scoreSaude * 0.3 +
    scoreAmbiental * 0.3 +
    scoreIntegridade * 0.25 +
    scoreOpacidade * 0.15
  );

  const { nivel, rotulo, corHex } = classificarNivelRisco(scoreGeral);

  return {
    scoreGeral,
    nivel,
    rotuloNivel: rotulo,
    corHex,
    dimensoes: {
      saudeVida: {
        score: scoreSaude,
        peso: 0.3,
        fatores: fatores.filter((f) => f.dimensao === "saude_vida"),
      },
      socioambientalClima: {
        score: scoreAmbiental,
        peso: 0.3,
        fatores: fatores.filter((f) => f.dimensao === "socioambiental_clima"),
      },
      integridadeErario: {
        score: scoreIntegridade,
        peso: 0.25,
        fatores: fatores.filter((f) => f.dimensao === "integridade_erario"),
      },
      opacidadePolitica: {
        score: scoreOpacidade,
        peso: 0.15,
        fatores: fatores.filter((f) => f.dimensao === "opacidade_politica"),
      },
    },
    fatoresCriticos: fatores,
  };
}
