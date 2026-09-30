/**
 * Cálculo e estrutura do Índice de Risco a Direitos (0 a 100).
 *
 * Avalia o risco real aos direitos fundamentais da população em 4 dimensões:
 * 1. Risco à Saúde e à Vida (Peso 30%)
 * 2. Risco Socioambiental e Climático (Peso 30%)
 * 3. Risco à Integridade e ao Erário (Peso 25%)
 * 4. Risco de Opacidade Político-Institucional (Peso 15%)
 *
 * ═══ O ÍNDICE TEM DE PODER SE EXPLICAR ═══
 *
 * Medição sintética sem régua à vista é veredito, não transparência. Por isso
 * o motor não devolve só `scoreGeral`: cada dimensão carrega `itens`, uma
 * linha por limiar, com o VALOR REAL medido no caso (`valorMedido`), o limiar,
 * quantos pontos ele somou e de que fonte veio. É o que permite a tela dizer
 * "Saúde 55 = base 15 + 40 porque há 312 internações por CID ambiental (mais
 * de 100)" em vez de mostrar um número sem origem.
 *
 * Insumo `null` = NÃO COLETADO (não é zero). Zero real soma ou não soma; zero
 * por falta de dado não pode virar pontos nem esconder a lacuna — a distinção
 * é a mesma que `CoberturaIndice` faz no agregador.
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

/** Uma linha do cálculo, com o valor REAL medido para o caso. */
export interface ItemCalculo {
  rotulo: string;
  /** Valor medido, formatado; `"não coletado"` quando a fonte não tem o dado. */
  valorMedido: string;
  /** Limiar da regra, em português ("mais de 100"). */
  limiar: string;
  /** Pontos que este limiar soma quando cruzado. */
  pontos: number;
  /** O limiar foi cruzado? */
  somou: boolean;
  /** O insumo foi medido (≠ não coletado)? */
  coletado: boolean;
  fonte: string;
  urlFonte?: string;
}

export interface DimensaoRisco {
  score: number;
  peso: number;
  /** Piso da dimensão antes de somar os itens. */
  piso: number;
  fatores: FatorRisco[];
  itens: ItemCalculo[];
}

export interface IndiceRiscoDireitos {
  scoreGeral: number; // 0 a 100
  nivel: NivelRisco;
  rotuloNivel: string;
  corHex: string;
  dimensoes: {
    saudeVida: DimensaoRisco;
    socioambientalClima: DimensaoRisco;
    integridadeErario: DimensaoRisco;
    opacidadePolitica: DimensaoRisco;
  };
  fatoresCriticos: FatorRisco[];
}

/** Insumos do motor. `null` = NÃO COLETADO (nunca confundir com zero real). */
export interface InsumosRiscoDireitos {
  barragensCriticasQtd: number | null;
  sobreposicoesTiCarHa: number | null;
  infracoesIbamaAtivasQtd: number | null;
  contratosDoadoresReais: number | null;
  empresasSancionadasContratosQtd: number | null;
  camaraSemApiAberta: boolean | null;
  internacoesCidsAmbientaisQtd: number | null;
  taxaMortalidadeEvitavel: number | null;
  indiceTransparenciaPntp: number | null; // 0 a 100
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

const nBR = (n: number) => n.toLocaleString("pt-BR");
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Soma o piso com os itens que cruzaram o limiar, saturando em 100. */
function pontuar(piso: number, itens: ItemCalculo[]): number {
  return Math.min(100, piso + itens.filter((i) => i.somou).reduce((s, i) => s + i.pontos, 0));
}

/**
 * Calcula o Índice de Risco a Direitos a partir dos agregados do município.
 */
export function calcularIndiceRiscoDireitos(dados: InsumosRiscoDireitos): IndiceRiscoDireitos {
  const fatores: FatorRisco[] = [];

  // ── 1. Saúde e Vida (Peso 30%) ──────────────────────────────────────────
  const PISO_SAUDE = 15;
  const itensSaude: ItemCalculo[] = [];
  {
    const v = dados.internacoesCidsAmbientaisQtd;
    const somou = v !== null && v > 100;
    itensSaude.push({
      rotulo: "Internações por CID sensível ao ambiente",
      valorMedido: v === null ? "não coletado" : `${nBR(v)} internação(ões)`,
      limiar: "mais de 100",
      pontos: 40,
      somou,
      coletado: v !== null,
      fonte: "SIH/DATASUS",
      urlFonte: "https://datasus.saude.gov.br/",
    });
    if (somou) {
      fatores.push({
        id: "saude-cid-anomalo",
        dimensao: "saude_vida",
        titulo: "Concentração elevada de internações por CIDs sensíveis",
        detalhe: `${nBR(v!)} internações registradas por causas com correlação ambiental/poluição.`,
        gravidade: "critico",
        fonte: "SIH/DATASUS",
        urlFonte: "https://datasus.saude.gov.br/",
      });
    }
  }
  {
    const v = dados.taxaMortalidadeEvitavel;
    const somou = v !== null && v > 20;
    itensSaude.push({
      rotulo: "Mortalidade prematura por causas evitáveis",
      valorMedido: v === null ? "não coletado" : `${nBR(v)} (por 100 mil)`,
      limiar: "mais de 20",
      pontos: 30,
      somou,
      coletado: v !== null,
      fonte: "SIM/DATASUS",
    });
    if (somou) {
      fatores.push({
        id: "saude-mortalidade-evitavel",
        dimensao: "saude_vida",
        titulo: "Taxa de mortalidade prematura por causas evitáveis acima da média",
        detalhe: "Indicador acima do limiar de alerta do Ministério da Saúde.",
        gravidade: "grave",
        fonte: "SIM/DATASUS",
      });
    }
  }
  const scoreSaude = pontuar(PISO_SAUDE, itensSaude);

  // ── 2. Socioambiental e Clima (Peso 30%) ────────────────────────────────
  const PISO_SOCIOAMBIENTAL = 10;
  const itensSocioambiental: ItemCalculo[] = [];
  {
    const v = dados.barragensCriticasQtd;
    const somou = v !== null && v > 0;
    itensSocioambiental.push({
      rotulo: "Barragens de mineração em nível de emergência",
      valorMedido: v === null ? "não coletado" : `${nBR(v)} estrutura(s)`,
      limiar: "uma ou mais",
      pontos: 50,
      somou,
      coletado: v !== null,
      fonte: "SIGBM/ANM",
      urlFonte: "https://dadosabertos.anm.gov.br/",
    });
    if (somou) {
      fatores.push({
        id: "amb-barragens",
        dimensao: "socioambiental_clima",
        titulo: "Barragens de mineração em nível de emergência no município",
        detalhe: `${nBR(v!)} estrutura(s) classificada(s) em Nível 1, 2 ou 3 de emergência.`,
        gravidade: "critico",
        fonte: "SIGBM/ANM",
        urlFonte: "https://dadosabertos.anm.gov.br/",
      });
    }
  }
  {
    const v = dados.sobreposicoesTiCarHa;
    const somou = v !== null && v > 0;
    itensSocioambiental.push({
      rotulo: "Sobreposição de imóveis rurais (CAR) sobre Terras Indígenas/Quilombolas",
      valorMedido: v === null ? "não coletado" : `${nBR(v)} hectares`,
      limiar: "algum hectare",
      pontos: 35,
      somou,
      coletado: v !== null,
      fonte: "SICAR / FUNAI / INCRA",
    });
    if (somou) {
      fatores.push({
        id: "amb-sobreposicao-ti",
        dimensao: "socioambiental_clima",
        titulo: "Sobreposição de imóveis rurais (CAR) sobre Terras Indígenas/Quilombolas",
        detalhe: `${nBR(v!)} hectares de área cadastrada sobre território tradicional protegido.`,
        gravidade: "critico",
        fonte: "SICAR / FUNAI / INCRA",
      });
    }
  }
  {
    const v = dados.infracoesIbamaAtivasQtd;
    const somou = v !== null && v > 0;
    itensSocioambiental.push({
      rotulo: "Autuações do IBAMA (infrações ambientais federais)",
      valorMedido: v === null ? "não coletado" : `${nBR(v)} auto(s)`,
      limiar: "um ou mais",
      pontos: 20,
      somou,
      coletado: v !== null,
      fonte: "IBAMA (dados abertos)",
    });
  }
  const scoreSocioambiental = pontuar(PISO_SOCIOAMBIENTAL, itensSocioambiental);

  // ── 3. Integridade e Erário (Peso 25%) ──────────────────────────────────
  const PISO_INTEGRIDADE = 15;
  const itensIntegridade: ItemCalculo[] = [];
  {
    const v = dados.empresasSancionadasContratosQtd;
    const somou = v !== null && v > 0;
    itensIntegridade.push({
      rotulo: "Contratos com empresas sancionadas (CEIS/CNEP)",
      valorMedido: v === null ? "não coletado" : `${nBR(v)} contrato(s)`,
      limiar: "um ou mais",
      pontos: 50,
      somou,
      coletado: v !== null,
      fonte: "PNCP / Portal da Transparência CGU",
      urlFonte: "https://portaldatransparencia.gov.br/ceis",
    });
    if (somou) {
      fatores.push({
        id: "int-ceis",
        dimensao: "integridade_erario",
        titulo: "Contratação de empresas inscritas no CEIS/CNEP ou inidôneas",
        detalhe: `${nBR(v!)} contrato(s) com empresas impedidas de licitar.`,
        gravidade: "critico",
        fonte: "PNCP / Portal da Transparência CGU",
        urlFonte: "https://portaldatransparencia.gov.br/ceis",
      });
    }
  }
  {
    const v = dados.contratosDoadoresReais;
    const somou = v !== null && v > 100_000;
    itensIntegridade.push({
      rotulo: "Contratos com fornecedores ligados a doadores de campanha",
      valorMedido: v === null ? "não coletado" : brl(v),
      limiar: "mais de R$ 100 mil",
      pontos: 30,
      somou,
      coletado: v !== null,
      fonte: "PNCP / TSE DivulgaCandContas",
    });
    if (somou) {
      fatores.push({
        id: "int-doadores",
        dimensao: "integridade_erario",
        titulo: "Contratos públicos com doadores de campanha eleitoral",
        detalhe: `${brl(v!)} empenhados a fornecedores ligados a financiadores eleitorais.`,
        gravidade: "alerta",
        fonte: "PNCP / TSE DivulgaCandContas",
      });
    }
  }
  const scoreIntegridade = pontuar(PISO_INTEGRIDADE, itensIntegridade);

  // ── 4. Opacidade Política (Peso 15%) ────────────────────────────────────
  const PISO_OPACIDADE = 10;
  const itensOpacidade: ItemCalculo[] = [];
  {
    const v = dados.camaraSemApiAberta;
    const somou = v === true;
    itensOpacidade.push({
      rotulo: "Câmara Municipal sem módulo aberto de matérias legislativas",
      valorMedido:
        v === null ? "não verificado" : v ? "sem módulo aberto" : "com módulo aberto",
      limiar: "ausência de módulo aberto",
      pontos: 45,
      somou,
      coletado: v !== null,
      fonte: "Diagnóstico Legislativo / SAPL",
    });
    if (somou) {
      fatores.push({
        id: "opac-camara",
        dimensao: "opacidade_politica",
        titulo: "Câmara Municipal sem módulo estruturado de matérias legislativas",
        detalhe: "Impossibilidade de monitorar votações nominais e projetos de lei em formato aberto.",
        gravidade: "grave",
        fonte: "Diagnóstico Legislativo / SAPL",
      });
    }
  }
  {
    const v = dados.indiceTransparenciaPntp;
    const somou = v !== null && v < 50;
    itensOpacidade.push({
      rotulo: "Nota de Transparência (PNTP/ATRICON)",
      valorMedido: v === null ? "não coletado" : `${nBR(v)}/100`,
      limiar: "abaixo de 50",
      pontos: 35,
      somou,
      coletado: v !== null,
      fonte: "PNTP / ATRICON",
    });
  }
  const scoreOpacidade = pontuar(PISO_OPACIDADE, itensOpacidade);

  // ── Ponderação Global ───────────────────────────────────────────────────
  const scoreGeral = Math.round(
    scoreSaude * 0.3 +
      scoreSocioambiental * 0.3 +
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
        piso: PISO_SAUDE,
        fatores: fatores.filter((f) => f.dimensao === "saude_vida"),
        itens: itensSaude,
      },
      socioambientalClima: {
        score: scoreSocioambiental,
        peso: 0.3,
        piso: PISO_SOCIOAMBIENTAL,
        fatores: fatores.filter((f) => f.dimensao === "socioambiental_clima"),
        itens: itensSocioambiental,
      },
      integridadeErario: {
        score: scoreIntegridade,
        peso: 0.25,
        piso: PISO_INTEGRIDADE,
        fatores: fatores.filter((f) => f.dimensao === "integridade_erario"),
        itens: itensIntegridade,
      },
      opacidadePolitica: {
        score: scoreOpacidade,
        peso: 0.15,
        piso: PISO_OPACIDADE,
        fatores: fatores.filter((f) => f.dimensao === "opacidade_politica"),
        itens: itensOpacidade,
      },
    },
    fatoresCriticos: fatores,
  };
}
