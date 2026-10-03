/**
 * scripts/memoria/gerar-correcoes-mistica.mts
 *
 * O QUE É: transforma o relatório da revisão assistida (títulos curtos e
 * resumos propostos) no overlay versionado que a tela lê —
 * `apps/web/lib/memoria/correcoes-mistica.ts`.
 *
 * POR QUE EXISTE: o `calendario.ts` é gerado por
 * `gera-calendario-insurgente.py` e não se edita à mão. As correções de
 * texto vivem fora dele, num mapa por CHAVE ESTÁVEL
 * (`chaveCorrecao()` em `lib/memoria/correcoes.ts`), então sobrevivem a uma
 * nova geração e continuam casando mesmo se as entradas reordenarem.
 *
 * REGRAS: só entra `tituloCurto` quando difere do título original; só entra
 * `resumo` quando o verbete foi sinalizado como solto E o relatório propôs
 * texto. O que não tem correção não vira linha — não se inventa texto.
 *
 * USO: `npx tsx scripts/memoria/gerar-correcoes-mistica.mts`
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CALENDARIO_LUTAS } from "../../apps/web/lib/memoria/calendario";
import { chaveCorrecao } from "../../apps/web/lib/memoria/correcoes";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RELATORIO = resolve(RAIZ, "docs", "relatorios-automacao", "revisao-textos-memoria.json");
const DESTINO = resolve(RAIZ, "apps", "web", "lib", "memoria", "correcoes-mistica.ts");

/** O que o relatório traz por verbete (o que este gerador consome). */
interface AnaliseRelatorio {
  indice: number;
  solta: boolean;
  sugestao: string;
  tituloCurto: string;
}

const relatorio = JSON.parse(readFileSync(RELATORIO, "utf8")) as {
  resultados: AnaliseRelatorio[];
};

/**
 * Resumos RETIDOS para revisão humana: a sugestão junta DOIS fatos
 * diferentes (ou não nomeia o sujeito), então aplicá-la pioraria o texto em
 * vez de corrigir. Fica no relatório para decisão do dono — fora do overlay.
 * Medido em 03/10/2026: a revisão pegou o defeito, mas a proposta misturou
 * verbetes vizinhos (o problema continua no dado-fonte, não se resolve por
 * reescrita automática).
 */
const RESUMOS_RETIDOS = new Set<string>([
  "12-19|s/ano|escravo fugido em 1828 que chefiou por 10 anos u",
  "12-22|1988|foi assassinado na porta de sua casa em 22 de de",
  "12-27|s/ano|depois de tres meses de greve, ocupando e sendo ",
]);

/**
 * Correções MANUAIS (decisão humana) — têm PRECEDÊNCIA sobre a proposta do
 * modelo e não são sobrescritas numa nova rodada. Chave = `chaveCorrecao`.
 */
const MANUAIS: Record<string, { tituloCurto?: string; resumo?: string }> = {
  // 12-22: o resumo do gerado colou uma expedição de 1873 em Sergipe (outro
  // fato) depois do assassinato. O dono apontou que o sujeito é COLETIVO (os
  // seringueiros / a Amazônia). Aqui ficam só as frases DO PRÓPRIO verbete e
  // um título curto tirado delas — sem inventar o nome de ninguém.
  "12-22|1988|foi assassinado na porta de sua casa em 22 de de": {
    tituloCurto: "Amazônia em Chamas",
    resumo:
      "Foi assassinado na porta de sua casa em 22 de dezembro de 1988. " +
      "Amazônia em chamas, de John Frankenheimer.",
  },
  // 01-03/1959: o modelo cortou para "Chegada a Havana", que perde o sentido
  // (a marcha da Revolução). Decisão do dono: "Chegada a Havana da Revolução".
  "01-03|1959|chega a frente de sua coluna em 3 de janeiro de ": {
    tituloCurto: "Chegada a Havana da Revolução",
  },
  // 02-05/1944: o modelo cortou o contexto ("Nasce Henfil"). Decisão do dono:
  // manter a descrição curta que o próprio verbete traz.
  "02-05|1944|nasce henfil, cartunista da esperanca": {
    tituloCurto: "Nasce Henfil, cartunista da esperança",
  },
  // 08-09/1997: o modelo escreveu "Morre o cartunista Henfil", mas o verbete
  // diz que morreu o IRMÃO de Henfil e Mário (o Henfil morreu em 04/01/1988).
  // Nome errado é dano: aqui o sujeito fica pelo que o verbete NOMEIA — sem
  // inventar o nome do falecido.
  "08-09|1997|falece em 9 de agosto de 1997, debilitado pela a": {
    tituloCurto: "Morre vítima da Aids, irmão de Henfil e Mário",
  },
};

const correcoes: Record<string, { tituloCurto?: string; resumo?: string }> = {};
let comTitulo = 0;
let comResumo = 0;
let fora = 0;

for (const r of relatorio.resultados) {
  const entrada = CALENDARIO_LUTAS[r.indice];
  if (!entrada) {
    fora++;
    continue;
  }
  const chave = chaveCorrecao(entrada);
  const registro: { tituloCurto?: string; resumo?: string } = {};

  const tituloCurto = (r.tituloCurto ?? "").trim();
  if (tituloCurto && tituloCurto !== entrada.titulo.trim()) {
    registro.tituloCurto = tituloCurto;
    comTitulo++;
  }

  const sugestao = r.solta ? (r.sugestao ?? "").trim() : "";
  if (sugestao && sugestao !== (entrada.resumo ?? "").trim() && !RESUMOS_RETIDOS.has(chave)) {
    registro.resumo = sugestao;
    comResumo++;
  }

  if (Object.keys(registro).length > 0) correcoes[chave] = registro;
}

// Correções manuais entram por último e vencem o modelo.
for (const [chave, valor] of Object.entries(MANUAIS)) {
  correcoes[chave] = { ...correcoes[chave], ...valor };
}

const chaves = Object.keys(correcoes).sort();
const linhas = chaves.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(correcoes[k])},`);

const conteudo = `/**
 * Correções de curadoria da memória (títulos curtos e resumos revisados).
 *
 * GERADO por \`scripts/memoria/gerar-correcoes-mistica.mts\` a partir do
 * relatório da revisão assistida. NÃO editar à mão: o dado vive no
 * relatório (\`docs/relatorios-automacao/revisao-textos-memoria.json\`) e é
 * reaplicado pelo gerador. A chave é \`chaveCorrecao()\` em \`correcoes.ts\`.
 *
 *   tituloCurto — nome de acontecimento (estilo "Revolta da Balaiada");
 *   resumo      — texto revisado, só quando o relatório propôs.
 */
export interface Correcao {
  tituloCurto?: string;
  resumo?: string;
}

export const CORRECOES: Record<string, Correcao> = {
${linhas.join("\n")}
};
`;

writeFileSync(DESTINO, conteudo, "utf8");

console.log(
  `[correcoes] ${chaves.length} entradas no overlay — tituloCurto ${comTitulo}, resumo ${comResumo}` +
    (fora ? `; ${fora} índice(s) fora da grade` : ""),
);
console.log(`[correcoes] escrito em ${DESTINO}`);
