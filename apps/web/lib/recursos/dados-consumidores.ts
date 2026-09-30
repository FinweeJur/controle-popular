/**
 * @file apps/web/lib/recursos/dados-consumidores.ts
 * @description Módulo de acesso, decodificação, cálculo de proporções, equivalência
 * populacional, assimetria tarifária e exportação CSV dos 50 maiores consumidores
 * corporativos de Minas Gerais e dos 20 países do G20.
 *
 * Papel no portal:
 * Alimenta tanto a seção "Top 5 Maiores Consumidores e Empregadores" na página
 * principal de cada município (/[municipio]) quanto o painel nacional e internacional
 * unificado (/consumo-corporativo).
 *
 * Fontes oficiais:
 * - Água (MG): IGAM / IDE-Sisema & ANA CNARH (https://www.snirh.gov.br/cnarh/)
 * - Energia (MG): CCEE InfoMercado ACL & ANEEL SAMP (https://dadosabertos.ccee.org.br/)
 * - Combustível (MG): ANP Dados Abertos & Climate TRACE (https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos)
 * - Empregos e Capital (MG): MTE RAIS/CAGED, CVM DFP, ANM CFEM, SEC EDGAR e TSX
 * - Internacional (G20): World Bank API, FAO Aquastat, US EIA, EPA ECHO, ECCC NPRI e Eurostat
 *
 * Decisões técnicas e restrições:
 * - Leitura e decodificação em memória de JSON compactado via lib/estatico/compactar.ts.
 * - Cálculo de equivalência populacional hídrica pelo parâmetro ONU/OMS (110 L/hab/dia = 40,15 m³/hab/ano).
 * - Cálculo de equivalência elétrica residencial pela média EPE/ANEEL (160 kWh/mês = 1,92 MWh/residência/ano).
 * - Exportação CSV estritamente com BOM UTF-8 (\uFEFF) e separador ponto-e-vírgula (;).
 */

import { expandir, type TabelaCompacta } from "../estatico/compactar";
import jsonTop50Mg from "../../data/recursos/top50-mg-consumidores.compact.json";
import jsonG20 from "../../data/recursos/g20-consumo-setorial-corporativo.compact.json";
import jsonPegada from "../../data/recursos/pegada-hidrica-e-cnae.compact.json";

export type EixoRecurso = "agua" | "energia" | "combustivel" | "empregos" | "capital";

export interface ConsumidorCorporativoMG {
  id: string;
  rankGeral: number;
  empresa: string;
  grupoEconomico: string;
  cnpjRaiz: string;
  setorCnae: string;
  categoriaSetor: string;
  codigoIbgeMunicipio: string;
  municipioNome: string;
  baciaHidrografica: string;
  aguaOutorgadaM3Ano: number;
  energiaConsumidaMwhAno: number;
  combustivelLitrosAno: number;
  empregosDiretos: number;
  capitalMovimentadoBrl: number;
  tarifaAguaEmpresaBrlM3: number;
  tarifaAguaCidadaoBrlM3: number;
  tarifaEnergiaEmpresaBrlKwh: number;
  tarifaEnergiaCidadaoBrlKwh: number;
  fonteAgua: string;
  urlFonteAgua: string;
  fonteEnergia: string;
  urlFonteEnergia: string;
  fonteCombustivel: string;
  urlFonteCombustivel: string;
  fonteEmpregoCapital: string;
  urlFonteEmpregoCapital: string;
}

export interface PaisConsumoG20 {
  pais: string;
  codigoIso3: string;
  bandeira: string;
  continente: string;
  retiradaAguaTotalBilhoesM3Ano: number;
  pctAguaAgricola: number;
  pctAguaIndustrial: number;
  pctAguaDomestica: number;
  energiaEletricaTotalTwhAno: number;
  energiaEletricaKwhPerCapita: number;
  combustivelPetroleoMilBarrisDia: number;
  forcaTrabalhoMilhoes: number;
  pibBilhoesUsd: number;
  tarifaEnergiaIndustrialUsdKwh: number;
  tarifaEnergiaResidencialUsdKwh: number;
  tarifaAguaBrutaIndustrialUsdM3: number;
  tarifaAguaResidencialUsdM3: number;
  topCorporacoesConsumidoras: string;
  setorMaisIntensivoAgua: string;
  setorMaisIntensivoEnergia: string;
  fontePrimariaPais: string;
  urlFonteOficial: string;
  urlWorldBank: string;
}

export interface PegadaIntensidadeSetorial {
  id: string;
  produtoOuSetor: string;
  cnaeAssociado: string;
  aguaLitrosPorTonelada: number;
  energiaKwhPorTonelada: number;
  empregosPorBilhaoLitrosAgua: number;
  empregosPorGwhEnergia: number;
  destinoExportacaoPrincipal: string;
  observacaoCivica: string;
  urlFonte: string;
}

export interface FatiaDonutConsumo {
  id: string;
  rotulo: string;
  subtitulo?: string;
  valor: number;
  percentual: number;
  corHex: string;
  urlFonte?: string;
  ehRestante?: boolean;
}

export interface ResumoTop5Cidade {
  municipioNome: string;
  codigoIbge: string;
  temPlantaMegaconsumidoraLocal: boolean;
  itensTop5: (ConsumidorCorporativoMG & {
    escopoLocal: "Planta Local no Município" | "Concessão / Rede Estadual na Região";
  })[];
  tarifaMediaAguaEmpresaBrlM3: number;
  tarifaMediaAguaCidadaoBrlM3: number;
  fatorDesigualdadeAgua: number;
  tarifaMediaEnergiaEmpresaBrlKwh: number;
  tarifaMediaEnergiaCidadaoBrlKwh: number;
  fatorDesigualdadeEnergia: number;
  equivalenciaHabitantesAguaTop5: number;
  equivalenciaResidenciasEnergiaTop5: number;
}

/** Totais estaduais consolidados de Minas Gerais para cálculo proporcional */
export const TOTAIS_REFERENCIA_MG = {
  aguaTotalM3Ano: 4_250_000_000, // 4,25 bilhões m³/ano (IGAM + ANA uso consultivo MG)
  energiaTotalMwhAno: 64_000_000, // 64 milhões MWh/ano (64 TWh - ANEEL/CCEE/BEN-MG)
  combustivelTotalLitrosAno: 8_500_000_000, // 8,5 bilhões L/ano (ANP MG diesel/óleo/gás eq.)
  empregosFormaisTotal: 4_650_000, // 4,65 milhões de vínculos formais (RAIS/CAGED MG)
  capitalPibReferenciaBrl: 1_050_000_000_000, // R$ 1,05 trilhão (FJP/IBGE PIB MG)
  dataMedicao: "2026-09-30",
} as const;

/** Paleta de alto contraste acessível para gráficos Donut (5 fatias + restante) */
export const PALETA_DONUT_RECURSOS = [
  "#0284c7", // Azul Cívico Forte (Top 1)
  "#0d9488", // Verde-Água / Teal (Top 2)
  "#d97706", // Âmbar / Ouro (Top 3)
  "#7c3aed", // Violeta (Top 4)
  "#e11d48", // Carmim / Rosa Forte (Top 5)
  "#64748b", // Cinza Azulado (Demais consumidores / Restante)
] as const;

let cacheTop50Mg: ConsumidorCorporativoMG[] | null = null;
let cacheG20: PaisConsumoG20[] | null = null;
let cachePegada: PegadaIntensidadeSetorial[] | null = null;

/**
 * Retorna os 50 maiores consumidores corporativos de Minas Gerais.
 */
export function obterTop50ConsumidoresMg(): ConsumidorCorporativoMG[] {
  if (!cacheTop50Mg) {
    cacheTop50Mg = expandir(
      jsonTop50Mg as unknown as TabelaCompacta
    ) as unknown as ConsumidorCorporativoMG[];
  }
  return cacheTop50Mg;
}

/**
 * Retorna os 20 países do G20 com indicadores macro, setoriais e corporativos.
 */
export function obterConsumoPaisesG20(): PaisConsumoG20[] {
  if (!cacheG20) {
    cacheG20 = expandir(
      jsonG20 as unknown as TabelaCompacta
    ) as unknown as PaisConsumoG20[];
  }
  return cacheG20;
}

/**
 * Retorna a tabela de pegada hídrica/energética por commodity e intensidade de emprego por CNAE.
 */
export function obterPegadaEIntensidadeSetorial(): PegadaIntensidadeSetorial[] {
  if (!cachePegada) {
    cachePegada = expandir(
      jsonPegada as unknown as TabelaCompacta
    ) as unknown as PegadaIntensidadeSetorial[];
  }
  return cachePegada;
}

/**
 * Converte volume de água em m³/ano para equivalente populacional humano
 * segundo o parâmetro da ONU/OMS (110 litros/habitante/dia = 40,15 m³/habitante/ano).
 */
export function calcularEquivalenciaPopulacionalAgua(aguaM3Ano: number): number {
  if (!aguaM3Ano || aguaM3Ano <= 0) return 0;
  return Math.round(aguaM3Ano / 40.15);
}

/**
 * Converte consumo elétrico em MWh/ano para equivalente em residências brasileiras
 * segundo a média EPE/ANEEL (160 kWh/mês = 1,92 MWh/residência/ano).
 */
export function calcularEquivalenciaResidencialEnergia(energiaMwhAno: number): number {
  if (!energiaMwhAno || energiaMwhAno <= 0) return 0;
  return Math.round(energiaMwhAno / 1.92);
}

/**
 * Extrai o valor numérico correspondente ao eixo selecionado de um consumidor de MG.
 */
export function valorPorEixoMg(item: ConsumidorCorporativoMG, eixo: EixoRecurso): number {
  switch (eixo) {
    case "agua":
      return item.aguaOutorgadaM3Ano;
    case "energia":
      return item.energiaConsumidaMwhAno;
    case "combustivel":
      return item.combustivelLitrosAno;
    case "empregos":
      return item.empregosDiretos;
    case "capital":
      return item.capitalMovimentadoBrl;
  }
}

/**
 * Retorna a URL oficial direta correspondente ao eixo selecionado.
 */
export function urlFontePorEixoMg(item: ConsumidorCorporativoMG, eixo: EixoRecurso): string {
  switch (eixo) {
    case "agua":
      return item.urlFonteAgua;
    case "energia":
      return item.urlFonteEnergia;
    case "combustivel":
      return item.urlFonteCombustivel;
    case "empregos":
    case "capital":
      return item.urlFonteEmpregoCapital;
  }
}

/**
 * Gera as fatias para o Gráfico de Rosca (Donut Chart) de MG ou de um Município
 * para o eixo selecionado, incluindo a fatia complementar para fechar 100%.
 */
export function gerarFatiasDonutMg(
  itens: ConsumidorCorporativoMG[],
  eixo: EixoRecurso,
  limiteTop = 5,
  totalReferenciaCustom?: number
): {
  fatias: FatiaDonutConsumo[];
  somaTop: number;
  totalReferencia: number;
  percentualConcentradoTop: number;
} {
  const ordenados = [...itens].sort(
    (a, b) => valorPorEixoMg(b, eixo) - valorPorEixoMg(a, eixo)
  );
  const topN = ordenados.slice(0, limiteTop);
  const somaTop = topN.reduce((acc, it) => acc + valorPorEixoMg(it, eixo), 0);

  const totalPadraoEstado =
    eixo === "agua"
      ? TOTAIS_REFERENCIA_MG.aguaTotalM3Ano
      : eixo === "energia"
      ? TOTAIS_REFERENCIA_MG.energiaTotalMwhAno
      : eixo === "combustivel"
      ? TOTAIS_REFERENCIA_MG.combustivelTotalLitrosAno
      : eixo === "empregos"
      ? TOTAIS_REFERENCIA_MG.empregosFormaisTotal
      : TOTAIS_REFERENCIA_MG.capitalPibReferenciaBrl;

  const totalReferencia = Math.max(
    totalReferenciaCustom ?? totalPadraoEstado,
    Math.round(somaTop * 1.25)
  );

  const fatias: FatiaDonutConsumo[] = topN.map((item, idx) => {
    const val = valorPorEixoMg(item, eixo);
    const pct = totalReferencia > 0 ? Number(((val / totalReferencia) * 100).toFixed(2)) : 0;
    return {
      id: item.id,
      rotulo: item.empresa.split("—")[0].split("(")[0].trim(),
      subtitulo: `${item.municipioNome} · ${item.categoriaSetor}`,
      valor: val,
      percentual: pct,
      corHex: PALETA_DONUT_RECURSOS[idx % (PALETA_DONUT_RECURSOS.length - 1)],
      urlFonte: urlFontePorEixoMg(item, eixo),
    };
  });

  const restanteValor = Math.max(0, totalReferencia - somaTop);
  const pctTop = totalReferencia > 0 ? Number(((somaTop / totalReferencia) * 100).toFixed(1)) : 0;
  const pctRestante = Math.max(0, Number((100 - pctTop).toFixed(1)));

  if (restanteValor > 0) {
    fatias.push({
      id: "restante-demais",
      rotulo: "Demais empresas, comércio e famílias",
      subtitulo: "Restante do consumo no território",
      valor: restanteValor,
      percentual: pctRestante,
      corHex: PALETA_DONUT_RECURSOS[PALETA_DONUT_RECURSOS.length - 1],
      ehRestante: true,
    });
  }

  return {
    fatias,
    somaTop,
    totalReferencia,
    percentualConcentradoTop: pctTop,
  };
}

/**
 * Obtém o Top 5 de consumidores/empregadores para um município específico (página /[municipio]).
 * Combina as plantas industriais/mineradoras localizadas diretamente no município com
 * as grandes concessionárias/operadores regionais que atuam na cidade/bacia, garantindo
 * que todos os 853 municípios tenham seu painel contextualizado.
 */
export function obterTop5ConsumidoresPorMunicipio(
  codigoIbge: string,
  nomeMunicipio: string,
  eixo: EixoRecurso = "agua"
): ResumoTop5Cidade {
  const todos = obterTop50ConsumidoresMg();
  const ibgeLimpo = String(codigoIbge || "").trim();
  const nomeLimpo = String(nomeMunicipio || "").trim().toLowerCase();

  // 1. Filtrar plantas instaladas diretamente no município
  const locais = todos.filter(
    (c) =>
      c.codigoIbgeMunicipio === ibgeLimpo ||
      (ibgeLimpo.length === 6 && c.codigoIbgeMunicipio.startsWith(ibgeLimpo)) ||
      c.municipioNome.toLowerCase() === nomeLimpo
  );

  const locaisMarcados = locais.map((item) => ({
    ...item,
    escopoLocal: "Planta Local no Município" as const,
  }));

  // 2. Se houver menos de 5 plantas locais no Top 50 estadual, completar com
  // os grandes operadores estaduais/regionais que operam na rede do município
  const idsLocais = new Set(locais.map((l) => l.id));
  const operadoresEstaduais = todos
    .filter((c) => !idsLocais.has(c.id))
    .sort((a, b) => valorPorEixoMg(b, eixo) - valorPorEixoMg(a, eixo))
    .map((item) => ({
      ...item,
      escopoLocal: "Concessão / Rede Estadual na Região" as const,
    }));

  const combinados = [...locaisMarcados, ...operadoresEstaduais]
    .sort((a, b) => {
      // Prioriza plantas locais primeiro, depois ordena pelo volume do eixo
      if (a.escopoLocal !== b.escopoLocal) {
        return a.escopoLocal === "Planta Local no Município" ? -1 : 1;
      }
      return valorPorEixoMg(b, eixo) - valorPorEixoMg(a, eixo);
    })
    .slice(0, 5);

  const somaAgua = combinados.reduce((acc, c) => acc + c.aguaOutorgadaM3Ano, 0);
  const somaEnergia = combinados.reduce((acc, c) => acc + c.energiaConsumidaMwhAno, 0);

  const mediaAguaEmp =
    combinados.reduce((acc, c) => acc + c.tarifaAguaEmpresaBrlM3, 0) /
    (combinados.length || 1);
  const mediaAguaCid =
    combinados.reduce((acc, c) => acc + c.tarifaAguaCidadaoBrlM3, 0) /
    (combinados.length || 1);

  const mediaEnergiaEmp =
    combinados.reduce((acc, c) => acc + c.tarifaEnergiaEmpresaBrlKwh, 0) /
    (combinados.length || 1);
  const mediaEnergiaCid =
    combinados.reduce((acc, c) => acc + c.tarifaEnergiaCidadaoBrlKwh, 0) /
    (combinados.length || 1);

  return {
    municipioNome: nomeMunicipio,
    codigoIbge: ibgeLimpo,
    temPlantaMegaconsumidoraLocal: locais.length > 0,
    itensTop5: combinados,
    tarifaMediaAguaEmpresaBrlM3: Number(mediaAguaEmp.toFixed(3)),
    tarifaMediaAguaCidadaoBrlM3: Number(mediaAguaCid.toFixed(2)),
    fatorDesigualdadeAgua: Math.round(mediaAguaCid / (mediaAguaEmp || 0.025)),
    tarifaMediaEnergiaEmpresaBrlKwh: Number(mediaEnergiaEmp.toFixed(2)),
    tarifaMediaEnergiaCidadaoBrlKwh: Number(mediaEnergiaCid.toFixed(2)),
    fatorDesigualdadeEnergia: Number((mediaEnergiaCid / (mediaEnergiaEmp || 0.21)).toFixed(1)),
    equivalenciaHabitantesAguaTop5: calcularEquivalenciaPopulacionalAgua(somaAgua),
    equivalenciaResidenciasEnergiaTop5: calcularEquivalenciaResidencialEnergia(somaEnergia),
  };
}

// Agregados pré-calculados para Server Components (Regra §8 AGENTS.md)
const listaMgCalc = obterTop50ConsumidoresMg();
const listaG20Calc = obterConsumoPaisesG20();

const somaAguaTop50Mg = listaMgCalc.reduce((acc, c) => acc + c.aguaOutorgadaM3Ano, 0);
const somaEnergiaTop50Mg = listaMgCalc.reduce((acc, c) => acc + c.energiaConsumidaMwhAno, 0);
const somaCombustivelTop50Mg = listaMgCalc.reduce((acc, c) => acc + c.combustivelLitrosAno, 0);
const somaEmpregosTop50Mg = listaMgCalc.reduce((acc, c) => acc + c.empregosDiretos, 0);
const somaCapitalTop50Mg = listaMgCalc.reduce((acc, c) => acc + c.capitalMovimentadoBrl, 0);

const municipiosMgUnicos = new Set(listaMgCalc.map((c) => c.municipioNome));

export const COBERTURA_CONSUMIDORES_RECURSOS = {
  totalEmpresasMg: listaMgCalc.length,
  totalMunicipiosPoloMg: municipiosMgUnicos.size,
  totalPaisesG20: listaG20Calc.length,
  somaAguaTop50MgM3Ano: somaAguaTop50Mg,
  percentualAguaEstadoTop50: Number(
    ((somaAguaTop50Mg / TOTAIS_REFERENCIA_MG.aguaTotalM3Ano) * 100).toFixed(1)
  ),
  equivalenciaHumanaAguaTop50Mg: calcularEquivalenciaPopulacionalAgua(somaAguaTop50Mg),
  somaEnergiaTop50MgMwhAno: somaEnergiaTop50Mg,
  percentualEnergiaEstadoTop50: Number(
    ((somaEnergiaTop50Mg / TOTAIS_REFERENCIA_MG.energiaTotalMwhAno) * 100).toFixed(1)
  ),
  equivalenciaResidenciasEnergiaTop50Mg: calcularEquivalenciaResidencialEnergia(somaEnergiaTop50Mg),
  somaCombustivelTop50MgLitrosAno: somaCombustivelTop50Mg,
  percentualCombustivelEstadoTop50: Number(
    ((somaCombustivelTop50Mg / TOTAIS_REFERENCIA_MG.combustivelTotalLitrosAno) * 100).toFixed(1)
  ),
  somaEmpregosTop50Mg: somaEmpregosTop50Mg,
  percentualEmpregosEstadoTop50: Number(
    ((somaEmpregosTop50Mg / TOTAIS_REFERENCIA_MG.empregosFormaisTotal) * 100).toFixed(1)
  ),
  somaCapitalTop50MgBrl: somaCapitalTop50Mg,
  percentualCapitalEstadoTop50: Number(
    ((somaCapitalTop50Mg / TOTAIS_REFERENCIA_MG.capitalPibReferenciaBrl) * 100).toFixed(1)
  ),
  fatorAssimetriaAguaMedioMg: 318, // Cidadão paga ~R$ 8,90/m³ vs ~R$ 0,028/m³ outorga bruta
  fatorAssimetriaEnergiaMedioMg: 4.5, // Cidadão paga ~R$ 0,96/kWh vs ~R$ 0,21/kWh ACL
  dataMedicao: "2026-09-30",
} as const;

/**
 * Exporta planilha CSV compatível com Excel brasileiro (BOM UTF-8 \uFEFF e separador ;)
 * para os consumidores corporativos de Minas Gerais.
 */
export function exportarCsvConsumidoresMg(registros: ConsumidorCorporativoMG[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "Ranking",
    "Empresa / Planta",
    "Grupo Econômico",
    "CNPJ Raiz",
    "Município",
    "Código IBGE",
    "Bacia Hidrográfica",
    "Setor CNAE",
    "Água Outorgada (m³/ano)",
    "Equivalência Populacional Água (hab)",
    "Energia Consumida (MWh/ano)",
    "Combustível (Litros/ano)",
    "Empregos Formais Diretos",
    "Capital / Receita Movimentada (R$)",
    "Tarifa Água Empresa (R$/m³)",
    "Tarifa Água Cidadão (R$/m³)",
    "Tarifa Energia Empresa (R$/kWh)",
    "Tarifa Energia Cidadão (R$/kWh)",
    "URL Fonte Água",
    "URL Fonte Energia",
    "URL Fonte Combustível",
    "URL Fonte Emprego e Capital",
  ].join(";");

  const limpo = (v: unknown) =>
    String(v ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/"/g, '""');

  const linhas = registros.map((r) =>
    [
      r.rankGeral,
      `"${limpo(r.empresa)}"`,
      `"${limpo(r.grupoEconomico)}"`,
      `"${limpo(r.cnpjRaiz)}"`,
      `"${limpo(r.municipioNome)}"`,
      `"${limpo(r.codigoIbgeMunicipio)}"`,
      `"${limpo(r.baciaHidrografica)}"`,
      `"${limpo(r.setorCnae)}"`,
      r.aguaOutorgadaM3Ano,
      calcularEquivalenciaPopulacionalAgua(r.aguaOutorgadaM3Ano),
      r.energiaConsumidaMwhAno,
      r.combustivelLitrosAno,
      r.empregosDiretos,
      r.capitalMovimentadoBrl,
      r.tarifaAguaEmpresaBrlM3,
      r.tarifaAguaCidadaoBrlM3,
      r.tarifaEnergiaEmpresaBrlKwh,
      r.tarifaEnergiaCidadaoBrlKwh,
      `"${limpo(r.urlFonteAgua)}"`,
      `"${limpo(r.urlFonteEnergia)}"`,
      `"${limpo(r.urlFonteCombustivel)}"`,
      `"${limpo(r.urlFonteEmpregoCapital)}"`,
    ].join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n");
}

/**
 * Exporta planilha CSV compatível com Excel brasileiro (BOM UTF-8 \uFEFF e separador ;)
 * para o comparativo internacional dos 20 países do G20.
 */
export function exportarCsvConsumoG20(registros: PaisConsumoG20[]): string {
  const BOM = "\uFEFF";
  const cabecalho = [
    "País",
    "ISO-3",
    "Continente",
    "Retirada Água Total (Bilhões m³/ano)",
    "% Água Agrícola",
    "% Água Industrial",
    "% Água Doméstica",
    "Energia Elétrica Total (TWh/ano)",
    "Eletricidade Per Capita (kWh/hab)",
    "Consumo Petróleo (Mil Barris/dia)",
    "Força de Trabalho (Milhões)",
    "PIB (Bilhões USD)",
    "Tarifa Energia Industrial (USD/kWh)",
    "Tarifa Energia Residencial (USD/kWh)",
    "Tarifa Água Industrial (USD/m³)",
    "Tarifa Água Residencial (USD/m³)",
    "Maiores Corporações Consumidoras",
    "Fonte Oficial",
    "URL Fonte Oficial",
  ].join(";");

  const limpo = (v: unknown) =>
    String(v ?? "")
      .replace(/[\r\n]+/g, " ")
      .replace(/"/g, '""');

  const linhas = registros.map((r) =>
    [
      `"${limpo(r.pais)}"`,
      `"${limpo(r.codigoIso3)}"`,
      `"${limpo(r.continente)}"`,
      r.retiradaAguaTotalBilhoesM3Ano,
      r.pctAguaAgricola,
      r.pctAguaIndustrial,
      r.pctAguaDomestica,
      r.energiaEletricaTotalTwhAno,
      r.energiaEletricaKwhPerCapita,
      r.combustivelPetroleoMilBarrisDia,
      r.forcaTrabalhoMilhoes,
      r.pibBilhoesUsd,
      r.tarifaEnergiaIndustrialUsdKwh,
      r.tarifaEnergiaResidencialUsdKwh,
      r.tarifaAguaBrutaIndustrialUsdM3,
      r.tarifaAguaResidencialUsdM3,
      `"${limpo(r.topCorporacoesConsumidoras)}"`,
      `"${limpo(r.fontePrimariaPais)}"`,
      `"${limpo(r.urlFonteOficial)}"`,
    ].join(";")
  );

  return BOM + [cabecalho, ...linhas].join("\r\n");
}
