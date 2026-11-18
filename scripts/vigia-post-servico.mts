#!/usr/bin/env node
/**
 * scripts/vigia-post-servico.mts
 *
 * Vigia determinístico da regra 5.19: post de serviço no blog precisa manter
 * contador animado, gráfico com legenda dentro, tabela filtrável/ordenável e
 * a camada de jornal (essencial, olho, lead). Para posts publicados a partir
 * de 17/11/2026, também exige slug legível, essencial de 3 a 5 linhas e fonte
 * em tabela/gráfico.
 *
 * POR QUE EXISTE: o defeito aqui é silencioso. Trocar `<MetricaValor>` por
 * `{m.valor}` não quebra build, não muda o texto e tira a animação que o dono
 * pediu. O mesmo vale para a tabela voltar a ser estática. O hook de pre-commit
 * roda este vigia junto com o de tipografia; a suíte roda o mesmo código em
 * `lib/noticias/padrao-post.test.ts`.
 *
 * Sem rede, sem navegador, sem modelo. Sai 0 quando está tudo certo e 1 com a
 * lista de falhas, no mesmo formato do vigia de fonte mínima.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DESDE, verificarPostServico } from "../apps/web/lib/noticias/padrao-post.ts";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const resultado = verificarPostServico(RAIZ);

console.log("\n🔎 Vigia de Post de Serviço (regra 5.19)");
console.log(`   Posts de serviço conferidos desde ${DESDE}: ${resultado.postsConferidos}`);
console.log(`   Componentes: ${resultado.componentesOk ? "ok" : "FALHA"}`);

if (resultado.falhas.length === 0) {
  console.log("✅ Countup, barras, tabela interativa e camada de jornal no lugar.\n");
  process.exit(0);
}

for (const falha of resultado.falhas) {
  console.log(`⚠️  [${falha.regra}] ${falha.detalhe}`);
}
console.log("\nCorrija ou leia docs/03-desenvolvimento/PADRAO-POST-BLOG.md.");
console.log("Para ignorar de propósito (raro): git commit --no-verify\n");
process.exit(1);
