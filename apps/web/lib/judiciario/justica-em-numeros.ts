/**
 * Série do TJMG no Justiça em Números (CNJ), 2009–2025.
 * ARQUIVO GERADO por `scripts/gerar-transparencia-justica.mts`.
 *
 * ⚠️ **A URL DO ZIP MUDA A CADA PUBLICAÇÃO** (o nome traz a data). O coletor
 * raspa a página de índice para achar o link vigente; link fixo quebra na
 * próxima atualização, e quebra em silêncio.
 *
 * ⚠️ **CORREÇÃO REGISTRADA:** este projeto afirmou que tempo médio de
 * tramitação por tribunal estadual **não existia** em dado aberto. **Está
 * errado.** A variável é `tpbaixm`, populada de 2015 a 2025 para o TJMG. A
 * busca anterior falhou porque o dicionário a rotula apenas como
 * "TpBaix - Média", sem a palavra "tempo" nem "tramitação" — buscar por
 * palavra não a acha; só o padrão `Tp*` + sufixo.
 *
 * ⚠️ **E a unidade NÃO está declarada no dicionário.** O valor de 2025 (675,5)
 * é compatível com dias, mas isso é inferência. A tela diz "não confirmada".
 */

export interface AnoJusticaEmNumeros {
  ano: number;
  /** 0 a 1. Fração do acervo que ficou sem baixa no ano. */
  congestionamento: number | null;
  pendentes: number | null;
  casosNovosPorMagistrado: number | null;
  baixados: number | null;
  /** `tpbaixm`. Unidade NÃO declarada no dicionário do CNJ. */
  tempoAteBaixa: number | null;
}

export const JN_META = {
  fonte: "Justiça em Números — Conselho Nacional de Justiça",
  urlIndice: "https://www.cnj.jus.br/pesquisas-judiciarias/justica-em-numeros/base-de-dados/",
  extraidoEm: "2026-08-22",
  avisoUnidade:
    "O dicionário do CNJ rotula a variável apenas como “TpBaix - Média” e não " +
    "declara a unidade. O valor é compatível com dias corridos entre " +
    "distribuição e baixa, mas isso é inferência deste projeto, não do CNJ.",
  avisoCobertura:
    "O tempo médio só existe de 2015 em diante; de 2009 a 2014 a coluna vem vazia.",
} as const;

export const SERIE_JN_TJMG: AnoJusticaEmNumeros[] = [
 {
  "ano": 2009,
  "congestionamento": 0.677871137680309,
  "pendentes": 3170808,
  "casosNovosPorMagistrado": 1461.54526748971,
  "baixados": 1506789,
  "tempoAteBaixa": null
 },
 {
  "ano": 2010,
  "congestionamento": 0.652543541766494,
  "pendentes": 3373224,
  "casosNovosPorMagistrado": 1355.14691943128,
  "baixados": 1796123,
  "tempoAteBaixa": null
 },
 {
  "ano": 2011,
  "congestionamento": 0.69506619822399,
  "pendentes": 3577692,
  "casosNovosPorMagistrado": 1604.21696252465,
  "baixados": 1569576,
  "tempoAteBaixa": null
 },
 {
  "ano": 2012,
  "congestionamento": 0.700369935056255,
  "pendentes": 3798754,
  "casosNovosPorMagistrado": 1700.79878665319,
  "baixados": 1625171,
  "tempoAteBaixa": null
 },
 {
  "ano": 2013,
  "congestionamento": 0.711541101403935,
  "pendentes": 4079337,
  "casosNovosPorMagistrado": 1646.07677902622,
  "baixados": 1653764,
  "tempoAteBaixa": null
 },
 {
  "ano": 2014,
  "congestionamento": 0.711555934336533,
  "pendentes": 4269717,
  "casosNovosPorMagistrado": 1687.25263157895,
  "baixados": 1730819,
  "tempoAteBaixa": null
 },
 {
  "ano": 2015,
  "congestionamento": 0.689427711879762,
  "pendentes": 4067467,
  "casosNovosPorMagistrado": 1682.67011375388,
  "baixados": 1832306,
  "tempoAteBaixa": 718.723037902134
 },
 {
  "ano": 2016,
  "congestionamento": 0.694565360072504,
  "pendentes": 4201255,
  "casosNovosPorMagistrado": 1642.15274949084,
  "baixados": 1847499,
  "tempoAteBaixa": 698.22940171474
 },
 {
  "ano": 2017,
  "congestionamento": 0.690223442542165,
  "pendentes": 4130451,
  "casosNovosPorMagistrado": 1551.53097345133,
  "baixados": 1853772,
  "tempoAteBaixa": 875.003025321146
 },
 {
  "ano": 2018,
  "congestionamento": 0.674779231701162,
  "pendentes": 3942814,
  "casosNovosPorMagistrado": 1578.49791231733,
  "baixados": 1900303,
  "tempoAteBaixa": 900.090299785971
 },
 {
  "ano": 2019,
  "congestionamento": 0.662489026274247,
  "pendentes": 3772400,
  "casosNovosPorMagistrado": 1562.45483193277,
  "baixados": 1921883,
  "tempoAteBaixa": 884.361535193455
 },
 {
  "ano": 2020,
  "congestionamento": 0.730086407434552,
  "pendentes": 4464804,
  "casosNovosPorMagistrado": 1409.21272365805,
  "baixados": 1650642,
  "tempoAteBaixa": 834.558622655922
 },
 {
  "ano": 2021,
  "congestionamento": 0.700869411782067,
  "pendentes": 4464576,
  "casosNovosPorMagistrado": 1586.80478087649,
  "baixados": 1905478,
  "tempoAteBaixa": 888.304105383068
 },
 {
  "ano": 2022,
  "congestionamento": 0.676946381094832,
  "pendentes": 4338921,
  "casosNovosPorMagistrado": 1683.75153374233,
  "baixados": 2070628,
  "tempoAteBaixa": 829.465351673792
 },
 {
  "ano": 2023,
  "congestionamento": 0.660541877277454,
  "pendentes": 4264605,
  "casosNovosPorMagistrado": 1864.05857740586,
  "baixados": 2191617,
  "tempoAteBaixa": 771.319068950648
 },
 {
  "ano": 2024,
  "congestionamento": 0.652934652301988,
  "pendentes": 4192148,
  "casosNovosPorMagistrado": 1841.5953346856,
  "baixados": 2228323,
  "tempoAteBaixa": 721.065620742109
 },
 {
  "ano": 2025,
  "congestionamento": 0.708669317992166,
  "pendentes": 4556203,
  "casosNovosPorMagistrado": 1922.1585728444,
  "baixados": 1873034,
  "tempoAteBaixa": 675.543557426586
 }
];
