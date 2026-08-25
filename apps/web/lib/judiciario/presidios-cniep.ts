/**
 * Inspeções judiciais em estabelecimentos penais de Minas Gerais.
 * ARQUIVO GERADO por `scripts/gerar-transparencia-justica.mts`.
 *
 * Fonte: CNIEP / Geopresídios do CNJ — `cniep.cnj.jus.br/api`. JSON público,
 * sem login. ⚠️ **API não documentada**, descoberta por engenharia reversa do
 * `config.js` do front-end: bater nela alguns dias antes de depender dela.
 *
 * ═══ O QUE A SEPARAÇÃO POR RAMO EVITA ═══
 *
 * No bolo, 56 de 285 estabelecimentos não receberam inspeção em 12 meses
 * — 20%, um número que sugere descaso generalizado. **Separando por quem
 * responde, a conta muda de dono:** a Justiça comum cobre 213 de 217, e o buraco
 * inteiro está na Justiça Militar. Publicar os 20% sem separar seria acusar
 * exatamente quem está inspecionando.
 *
 * ⚠️ **Unidade militar não é presídio.** São celas em batalhão, muitas vezes
 * vazias. Comparar uma delas com uma penitenciária de 1.500 pessoas em número
 * de inspeções é comparar coisas diferentes — a tela diz isso.
 */

export interface EstabelecimentoPenal {
  id: number;
  nome: string;
  tribunal: string;
  /** comum | militar-estadual | militar-federal */
  ramo: string;
  natureza: string;
  /** Inspeções com data de início até 2026-08-22. Agendada não conta. */
  inspecoes: number;
}

export const COBERTURA_CNIEP = {
  extraidoEm: "2026-08-22",
  fonte: "CNIEP / Geopresídios — Conselho Nacional de Justiça",
  url: "https://geopresidios.cnj.jus.br",
  estabelecimentos: 285,
  inspecoes: 2252,
  periodoDe: "2025-01-07",
  periodoAte: "2026-08-20",
  semInspecao: 56,
  avisoConteudo:
    "O portal mostra QUE houve inspeção e SOBRE QUAL TEMA. O relato do que o " +
    "juiz encontrou não é público por esta via: as rotas de conteúdo respondem " +
    "404. Ausência de achado aqui não significa que não houve achado.",
  avisoApi:
    "API não documentada pelo CNJ, descoberta no front-end. Pode mudar sem aviso.",
} as const;

export const PRESIDIOS_POR_RAMO = [
 {
  "ramo": "comum",
  "tribunal": "Tribunal de Justiça do Estado de Minas Gerais",
  "total": 217,
  "semInspecao": 4,
  "percentualSemInspecao": 2
 },
 {
  "ramo": "militar-estadual",
  "tribunal": "Tribunal de Justiça Militar do Estado de Minas Gerais",
  "total": 50,
  "semInspecao": 34,
  "percentualSemInspecao": 68
 },
 {
  "ramo": "militar-federal",
  "tribunal": "Superior Tribunal Militar",
  "total": 18,
  "semInspecao": 18,
  "percentualSemInspecao": 100
 }
] as const;

export const TEMAS_INSPECAO: [string, number][] = [
 [
  "Habitabilidade e necessidades básicas (água, alimentação, salubridade e vestuário)",
  629
 ],
 [
  "Aspectos Gerais: estrutura, ocupação, população prisional e servidores penais",
  430
 ],
 [
  "Segurança e prevenção da violência",
  404
 ],
 [
  "Acesso à saúde integral",
  397
 ],
 [
  "Serviços, assistências e contato com o mundo exterior",
  392
 ]
];

