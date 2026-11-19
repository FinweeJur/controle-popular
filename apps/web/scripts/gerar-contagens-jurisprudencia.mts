/**
 * gerar-contagens-jurisprudencia.mts — gera a TABELA COMPACTA de contagens
 * usada pelo assistente para responder "quantos casos de X no Rio Doce?".
 *
 * POR QUE EXISTE
 * O acervo `data/jurisprudencia-casos.json` tem 58 MB. O degrau de contagem
 * roda também no navegador (`SeuNono`, `ChatbotIa`, `/assistente`): importar o
 * acervo cru ali jogaria dezenas de MB no chunk do cliente. Este script reduz
 * o acervo ao que a resposta precisa — total, polo e resultado por frente e
 * por tema — e grava `lib/assistente/jurisprudencia-contagens.json` (~dezenas
 * de KB), com a data da medição e a fonte.
 *
 * A CONTA NÃO MORA AQUI. Quem mede é `medirContagens()` em
 * `lib/assistente/jurisprudencia-escada.ts`; o teste
 * `jurisprudencia-escada.test.ts` recomputa do acervo e compara com o JSON.
 * Se a coleta mudar o acervo, o teste fica vermelho: rode este script de novo.
 *
 * Uso: npx tsx scripts/gerar-contagens-jurisprudencia.mts  (a partir de apps/web)
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ACERVO_JURISPRUDENCIA } from "../lib/jurisprudencia-acervo";
import {
  medirContagens,
  type ArquivoContagens,
} from "../lib/assistente/jurisprudencia-escada";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ALVO = path.join(AQUI, "..", "lib", "assistente", "jurisprudencia-contagens.json");

const arquivo: ArquivoContagens = {
  geradoEm: ACERVO_JURISPRUDENCIA.geradoEm,
  fonte: "Acervo de jurisprudência do Controle Popular (TJMG, TJES, STF, STJ e TST)",
  frentes: medirContagens(ACERVO_JURISPRUDENCIA.casos),
};

writeFileSync(ALVO, `${JSON.stringify(arquivo, null, 1)}\n`, "utf8");
console.log(
  `contagens de jurisprudência: ${ACERVO_JURISPRUDENCIA.casos.length.toLocaleString("pt-BR")} casos, ` +
    `medidos em ${arquivo.geradoEm} → ${path.relative(process.cwd(), ALVO)}`
);
