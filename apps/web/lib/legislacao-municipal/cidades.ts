/**
 * Registro das câmaras municipais com API aberta — o ponto de partida do
 * coletor de legislação municipal.
 *
 * Plano: `docs/planos/PLANO-BIBLIOTECA-LEGISLACAO.md`, Fase F1 (municipal, MG
 * primeiro). Cada entrada foi CONFIRMADA ao vivo em 30/09/2026: a API do SAPL
 * respondeu `200` em `/api/materia/materialegislativa/`. Cidade que não
 * respondeu NÃO entra — medir, não supor.
 *
 * O código IBGE casa com `apps/web/data/municipios-mg.json` (código por nome).
 * Ao adicionar cidade: (1) conferir a base com uma requisição real; (2) pegar
 * o IBGE naquele arquivo; (3) usar slug sem acento.
 *
 * Fonte (Plano A): APIs das câmaras. O agregador leismunicipais.com.br é o
 * Plano B, só como ponte quando a câmara não publica — nunca link principal.
 */

import type { CidadeFonte } from "./nucleo";

export const CIDADES_CAMARA: CidadeFonte[] = [
  { slug: "contagem", nome: "Contagem", idIbge: "3118601", uf: "MG", sistema: "sapl", base: "https://sapl.contagem.mg.leg.br" },
  { slug: "montes-claros", nome: "Montes Claros", idIbge: "3143302", uf: "MG", sistema: "sapl", base: "https://sapl.montesclaros.mg.leg.br" },
  { slug: "divinopolis", nome: "Divinópolis", idIbge: "3122306", uf: "MG", sistema: "sapl", base: "https://sapl.divinopolis.mg.leg.br" },
  { slug: "sete-lagoas", nome: "Sete Lagoas", idIbge: "3167202", uf: "MG", sistema: "sapl", base: "https://sapl.setelagoas.mg.leg.br" },
  { slug: "teofilo-otoni", nome: "Teófilo Otoni", idIbge: "3168606", uf: "MG", sistema: "sapl", base: "https://sapl.teofilootoni.mg.leg.br" },
  { slug: "sabara", nome: "Sabará", idIbge: "3156700", uf: "MG", sistema: "sapl", base: "https://sapl.sabara.mg.leg.br" },
  { slug: "varginha", nome: "Varginha", idIbge: "3170701", uf: "MG", sistema: "sapl", base: "https://sapl.varginha.mg.leg.br" },
  { slug: "patos-de-minas", nome: "Patos de Minas", idIbge: "3148004", uf: "MG", sistema: "sapl", base: "https://sapl.patosdeminas.mg.leg.br" },
  { slug: "araguari", nome: "Araguari", idIbge: "3103504", uf: "MG", sistema: "sapl", base: "https://sapl.araguari.mg.leg.br" },
  { slug: "muriae", nome: "Muriaé", idIbge: "3143906", uf: "MG", sistema: "sapl", base: "https://sapl.muriae.mg.leg.br" },
  { slug: "uba", nome: "Ubá", idIbge: "3169901", uf: "MG", sistema: "sapl", base: "https://sapl.uba.mg.leg.br" },
  { slug: "conselheiro-lafaiete", nome: "Conselheiro Lafaiete", idIbge: "3118304", uf: "MG", sistema: "sapl", base: "https://sapl.conselheirolafaiete.mg.leg.br" },
];

/** Acha uma câmara pelo slug. */
export function cidadePorSlug(slug: string): CidadeFonte | undefined {
  return CIDADES_CAMARA.find((c) => c.slug === slug);
}
