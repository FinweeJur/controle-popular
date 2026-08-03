/**
 * Prova de que todo tipo de proposição no banco tem rótulo e peso.
 *
 *   npx tsx --env-file=.env.local scripts/tipos-de-proposicao.mts
 *
 * O DEFEITO QUE ISTO IMPEDE. Cada câmara nomeia suas espécies legislativas
 * do seu jeito, e o ETL grava o que a fonte diz. Quando uma cidade nova
 * entra, aparecem tipos que `TIPO_PROPOSICAO_LABELS` e `PESO_PROPOSICAO`
 * não conhecem — e as duas ausências falham de formas diferentes, ambas
 * silenciosas:
 *
 * - **Sem rótulo**, a tela mostra o slug cru do banco
 *   ("projeto_decreto_legislativo"). Feio, mas visível.
 * - **Sem peso**, `PESO_PROPOSICAO[tipo]` é `undefined` e a proposição
 *   simplesmente NÃO PONTUA no ranking de atuação. Nada quebra, nada
 *   aparece: o vereador só fica com uma posição menor do que merece.
 *
 * Aconteceu de verdade em 2026-08-03, ao ligar BH e São Paulo: as 446
 * moções de Belo Horizonte e os 232 projetos de decreto legislativo de São
 * Paulo entraram valendo zero. O ranking de BH estava errado, e o único
 * jeito de perceber era comparar a mão com o site da Câmara.
 *
 * Sai com código 1 se achar tipo órfão, para poder entrar na CI.
 */
import { getDb } from "../lib/db/client.js";
import { proposicoes } from "../lib/db/schema.js";
import { sql } from "drizzle-orm";
import {
  TIPO_PROPOSICAO_LABELS,
  PESO_PROPOSICAO,
  PROPOSICAO_TIERS,
} from "../lib/betim/vereadores.js";

const db = getDb();
if (!db) {
  console.error("DATABASE_URL ausente — rode com --env-file=.env.local");
  process.exit(1);
}

const linhas = await db
  .select({
    id_municipio: proposicoes.id_municipio,
    tipo: proposicoes.tipo,
    qtd: sql<number>`count(*)::int`,
  })
  .from(proposicoes)
  .groupBy(proposicoes.id_municipio, proposicoes.tipo);

const emTier = new Set(PROPOSICAO_TIERS.flatMap((t) => t.tipos));

let orfaos = 0;
for (const l of linhas.sort((a, b) => b.qtd - a.qtd)) {
  const tipo = l.tipo ?? "(null)";
  const faltas: string[] = [];
  if (!(tipo in TIPO_PROPOSICAO_LABELS)) faltas.push("rótulo");
  if (!(tipo in PESO_PROPOSICAO)) faltas.push("PESO (não pontua no ranking)");
  if (!emTier.has(tipo)) faltas.push("tier (some do gráfico de composição)");

  if (faltas.length) {
    orfaos++;
    console.log(
      `ÓRFÃO   ${l.id_municipio}  ${tipo}  (${l.qtd} linhas) — falta ${faltas.join(", ")}`
    );
  } else {
    console.log(`ok      ${l.id_municipio}  ${tipo}  (${l.qtd})`);
  }
}

console.log(
  orfaos > 0
    ? `\n${orfaos} tipo(s) órfão(s). Complete em lib/betim/vereadores.ts.`
    : "\nOK — todo tipo de proposição tem rótulo, peso e tier."
);
process.exit(orfaos > 0 ? 1 : 0);
