/**
 * Cobertura medida da biblioteca unificada dos desastres de Mariana e
 * Brumadinho. ARQUIVO GERADO por `scripts/agregar-biblioteca-desastres.mts`
 * — não editar à mão. Números vêm do dado, nunca digitados.
 *
 * A página de SERVIDOR importa SÓ estas constantes (regra de payload do
 * AGENTS.md). O array mora em `public/data/biblioteca-desastres.json`, que
 * o cliente busca com fetch.
 */

export const COBERTURA_BIBLIOTECA_DESASTRES = {
  medidoEm: "2026-09-01",
  total: 920,
  barradosPelaTriagem: 0,
  ficouDeFora: "ADAI (adaibrasil.org.br): 19 publicações, todas de Amazônia/Fundo Amazônia, zero com o programa 'paraopeba' — não tem documento desta bacia para catalogar. NACAB (Região 3): biblioteca de PDFs coletada (48 itens, 5 séries: Estudos e Relatórios, Reparação, Mobilização, Germinar, Nacab em Campo) — mas a página-fonte não declara data de publicação por item, só a pasta de upload (não confiável como data), então todo item do NACAB aqui tem `data: null`. Notícias das três ATIs: ficam fora desta biblioteca por decisão registrada em docs/FONTES-BIBLIOTECA-ATI.md. Programas da AEDAS fora da bacia do Doce: Itatiaiucu (135) e Veredas Sol e Lares (132) nao entram por vinculo com a bacia nao confirmado. ATIs de Mariana sem REST publica confirmada (Caritas, CTA, programa Doce da ADAI) ficam para a proxima rodada. 9 itens sem data extraivel do titulo ficaram com data: null (lacuna declarada). O wp-json responde 401; coleta por pagina.",
  porDesastre: {"mariana":275,"brumadinho":645},
  porEsfera: {"ati":763,"estadual":157},
  porOrgao: [{"orgao":"AEDAS","total":553},{"orgao":"Guaicuy","total":162},{"orgao":"CBH-Doce","total":157},{"orgao":"NACAB","total":48}],
  porAno: [{"ano":2003,"total":2},{"ano":2004,"total":11},{"ano":2005,"total":7},{"ano":2006,"total":1},{"ano":2007,"total":5},{"ano":2008,"total":2},{"ano":2009,"total":3},{"ano":2010,"total":1},{"ano":2011,"total":8},{"ano":2012,"total":4},{"ano":2013,"total":3},{"ano":2014,"total":7},{"ano":2015,"total":5},{"ano":2016,"total":10},{"ano":2017,"total":11},{"ano":2018,"total":8},{"ano":2019,"total":8},{"ano":2020,"total":19},{"ano":2021,"total":17},{"ano":2022,"total":42},{"ano":2023,"total":136},{"ano":2024,"total":258},{"ano":2025,"total":253},{"ano":2026,"total":42}],
  fontes: [{"id":"ati:aedas","nome":"AEDAS — Associação Estadual de Defesa Ambiental e Social","licenca":"não declarada — rodapé traz apenas '2025 Associação Estadual de Defesa Ambiental e Social'; tratado como direitos reservados","itens":435},{"id":"ati:guaicuy","nome":"Instituto Guaicuy","licenca":"não declarada — nenhuma página de termos ou licença responde; tratado como direitos reservados","itens":162},{"id":"ati:nacab","nome":"NACAB — Assessoria Técnica Independente da Região 3","licenca":"não declarada — nenhuma página de termos ou licença localizada nesta coleta; tratado como direitos reservados","itens":48},{"id":"ati-aedas-mariana","nome":"AEDAS - Assessoria Tecnica Independente - Bacia do Rio Doce (Mariana)","licenca":"nao declarada - tratado como direitos reservados (Lei 9.610/98)","itens":118},{"id":"cbh-doce","nome":"CBH-Doce - Comite da Bacia Hidrografica do Rio Doce","licenca":"documentos publicos de orgao colegiado de recursos hidricos; tratado como publicos","itens":157}],
} as const;
