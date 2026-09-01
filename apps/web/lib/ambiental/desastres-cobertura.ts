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
  total: 763,
  barradosPelaTriagem: 0,
  ficouDeFora: "ADAI (adaibrasil.org.br): 19 publicações, todas de Amazônia/Fundo Amazônia, zero com o programa 'paraopeba' — não tem documento desta bacia para catalogar. NACAB (Região 3): biblioteca de PDFs coletada (48 itens, 5 séries: Estudos e Relatórios, Reparação, Mobilização, Germinar, Nacab em Campo) — mas a página-fonte não declara data de publicação por item, só a pasta de upload (não confiável como data), então todo item do NACAB aqui tem `data: null`. Notícias das três ATIs: ficam fora desta biblioteca por decisão registrada em docs/FONTES-BIBLIOTECA-ATI.md. Programas da AEDAS fora da bacia do Doce: Itatiaiucu (135) e Veredas Sol e Lares (132) nao entram por vinculo com a bacia nao confirmado. ATIs de Mariana sem REST publica confirmada (Caritas, CTA, programa Doce da ADAI) ficam para a proxima rodada.",
  porDesastre: {"mariana":118,"brumadinho":645},
  porEsfera: {"ati":763},
  porOrgao: [{"orgao":"AEDAS","total":553},{"orgao":"Guaicuy","total":162},{"orgao":"NACAB","total":48}],
  porAno: [{"ano":2020,"total":9},{"ano":2021,"total":7},{"ano":2022,"total":36},{"ano":2023,"total":130},{"ano":2024,"total":248},{"ano":2025,"total":246},{"ano":2026,"total":39}],
  fontes: [{"id":"ati:aedas","nome":"AEDAS — Associação Estadual de Defesa Ambiental e Social","licenca":"não declarada — rodapé traz apenas '2025 Associação Estadual de Defesa Ambiental e Social'; tratado como direitos reservados","itens":435},{"id":"ati:guaicuy","nome":"Instituto Guaicuy","licenca":"não declarada — nenhuma página de termos ou licença responde; tratado como direitos reservados","itens":162},{"id":"ati:nacab","nome":"NACAB — Assessoria Técnica Independente da Região 3","licenca":"não declarada — nenhuma página de termos ou licença localizada nesta coleta; tratado como direitos reservados","itens":48},{"id":"ati-aedas-mariana","nome":"AEDAS - Assessoria Tecnica Independente - Bacia do Rio Doce (Mariana)","licenca":"nao declarada - tratado como direitos reservados (Lei 9.610/98)","itens":118}],
} as const;
