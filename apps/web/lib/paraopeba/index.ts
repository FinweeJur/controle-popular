/**
 * Frente Paraopeba — acompanhamento da reparação pelo rompimento da
 * barragem da Vale em Brumadinho (25/01/2019, 270 mortes).
 *
 * Barril único para os quatro pedaços de dado desta frente, no mesmo
 * espírito de `lib/betim/redeProtecao.ts`: cada arquivo cobre um recorte
 * (clipping, linha do tempo, atores, auxílio, documentos do processo), e
 * quem consome importa daqui, não fuça arquivo por arquivo.
 *
 * ═══ DUAS FONTES, DUAS DISCIPLINAS DIFERENTES ═══
 *
 * `clipping.ts`, `linha-do-tempo.ts`, `atores.ts` e `auxilio.ts` vêm de
 * `painel-paraopeba.html` — um snapshot manual entregue pelo dono, sem API
 * por trás. `documentos.ts` vem do índice Solr público e vivo da Plataforma
 * Brumadinho UFMG, cruzado por município via o campo `places` que a própria
 * UFMG preenche (zero inferência de texto). As duas nunca se misturam num
 * mesmo array — `docs/PLANO-INGESTAO-PARAOPEBA.md` mede as duas fontes
 * separadas, e este barril preserva a separação.
 */
export * from "./clipping";
export * from "./linha-do-tempo";
export * from "./atores";
export * from "./auxilio";
export * from "./documentos";

/** Fonte do clipping/linha do tempo/atores/auxílio — citar sempre que exibir. */
export const FONTE_PAINEL = {
  nome: "Painel Paraopeba",
  descricao:
    "Cobertura midiática e institucional da reparação, reunida à mão pelo Instituto Guaicuy (ATI que mantém o Painel da Reparação atualizado).",
  linkAtualizado: "https://guaicuy.org.br/",
} as const;

/** Fonte dos documentos do processo — citar sempre que exibir. */
export const FONTE_PLATAFORMA_UFMG = {
  nome: "Plataforma Brumadinho UFMG",
  // http://, não https:// — o domínio recusa conexão em 443 (medido em
  // docs/FONTES-BRUMADINHO-UFMG.md e reconfirmado ao vivo nesta ingestão).
  url: "http://plataforma.projetobrumadinho.ufmg.br/",
} as const;
