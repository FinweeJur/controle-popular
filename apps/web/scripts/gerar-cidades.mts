/**
 * Congela a lista de cidades ativas do Postgres num módulo TypeScript que
 * entra no bundle do Worker.
 *
 * ═══ POR QUE ISTO EXISTE — MEDIDO EM PRODUÇÃO, 2026-08-13 ═══
 *
 * As rotas de API do portal morriam com 500 antes de fazer qualquer coisa
 * útil. O `wrangler tail` de `controlepopular` mostrou o erro exato:
 *
 *     Error: Failed query: select "id_municipio", "nome", "uf", ... from
 *     "municipios" where "municipios"."ativo" = $1
 *
 * Ou seja: NÃO era a tabela do zap nem a dos classificados. Era
 * `listarCidades()`, chamada por `obterCidadePorSlug()` na PRIMEIRA linha de
 * toda rota de cidade, para traduzir o slug da URL em `id_municipio`. Do
 * Worker não se alcança o Postgres da máquina de build, então essa consulta
 * lança e a rota devolve 500 sem nunca chegar no banco de escrita.
 *
 * Migrar as escritas para o D1 (ver `lib/db/schema.d1.ts`) consertou o
 * destino da gravação e não consertou isto: o pedido morria antes.
 *
 * ═══ POR QUE CONGELAR NO BUILD, E NÃO PÔR `municipios` NO D1 ═══
 *
 * `municipios` não é dado que o visitante escreve — é cadastro que muda
 * quando uma cidade nova entra no portal, o que já exige build novo de
 * qualquer forma (as rotas `/[municipio]/**` são geradas por
 * `generateStaticParams`). Um banco a mais para uma tabela que só muda junto
 * com o build seria peça sem função. Congelar é a mesma escolha já feita
 * para o índice da busca e para o manifesto de proveniência do globo: o
 * build é o momento em que o Postgres está ao alcance, então é nele que o
 * dado atravessa a fronteira.
 *
 * O ARQUIVO GERADO É VERSIONADO, ao contrário de `public/busca-indice/`.
 * Razão: ele é importado por código que o `tsc --noEmit` e o CI compilam, e
 * um repo em que `tsc` não roda sem antes ter um Postgres de pé é um repo
 * que quebra para quem clona. São poucas dezenas de linhas de texto — o
 * custo de versionar é nenhum, e o diff mostra exatamente quando uma cidade
 * entrou.
 *
 * ═══ COMO RODAR ═══
 *
 *     cd apps/web
 *     npx tsx --env-file-if-exists=.env.local scripts/gerar-cidades.mts
 *
 * Roda sozinho no `prebuild`. `--env-file-if-exists` e não `--env-file`
 * porque no CI não existe `.env.local` e as variáveis vêm do ambiente — a
 * flag estrita abortaria o build.
 */

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
// `listarCidadesDoPostgres` e NÃO `listarCidades`. A segunda tem plano B: se
// o Postgres não responder, ela devolve `CIDADES_DO_BUILD` — que é o arquivo
// que ESTE script escreve. Usá-la aqui fazia o gerador ler a própria saída e
// reescrevê-la idêntica, com o banco derrubado, anunciando sucesso. A guarda
// de lista vazia lá embaixo era decorativa. Descoberto quebrando de
// propósito: `DATABASE_URL` apontada para host inexistente, e o script saiu 0
// com "✓ 6 cidade(s)".
import { listarCidadesDoPostgres } from "../lib/db/queries/municipios.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.join(AQUI, "..", "lib", "db", "cidades-do-build.ts");
const LOG = "[gerar-cidades]";

let cidades;
try {
  cidades = await listarCidadesDoPostgres();
} catch (e) {
  console.error(`${LOG} ERRO: o Postgres não respondeu.`, e);
  process.exit(1);
}

// Lista vazia significa `getDb()` nulo (sem DATABASE_URL) ou nenhuma cidade
// ativa. Sobrescrever o arquivo bom com `[]` publicaria um site em que TODA
// rota de cidade responde 404 — sem erro nenhum, que é o modo de falha pior.
// Falhar aqui é o que faz o problema aparecer na hora certa.
if (cidades.length === 0) {
  console.error(
    `${LOG} ERRO: nenhuma cidade ativa lida do Postgres. Confira DATABASE_URL ` +
      `(ver .env.local) — não vou sobrescrever ${path.basename(DESTINO)} com lista vazia.`
  );
  process.exit(1);
}

// O import é DE TIPO, não de valor, e isso não é detalhe de estilo:
// `municipios.ts` importa este arquivo, então um import de valor fecharia um
// ciclo em tempo de execução — e o ciclo estouraria justo na avaliação do
// módulo, que é quando a constante abaixo é montada. `import type` some na
// compilação e não cria aresta nenhuma.
//
// A marca de `IdMunicipio` (tipo nominal, ver `municipios.ts`) não sobrevive
// ao JSON. Ela é reposta com asserção porque os valores saíram da própria
// coluna `municipios.id_municipio` — é exatamente a mesma garantia que
// `comoIdMunicipio()` dá, e chamá-la aqui exigiria o import de valor que o
// parágrafo acima proíbe.
const conteudo = `// GERADO POR \`scripts/gerar-cidades.mts\` — NÃO EDITE À MÃO.
// Regenerado a cada \`npm run prebuild\`. Ver o cabeçalho do script para por
// que a lista é congelada no build em vez de consultada no runtime.
import type { Cidade, IdMunicipio } from "@/lib/db/queries/municipios";

const LINHAS: (Omit<Cidade, "id_municipio"> & { id_municipio: string })[] =
  ${JSON.stringify(cidades, null, 2).replace(/\n/g, "\n  ")};

export const CIDADES_DO_BUILD: Cidade[] = LINHAS.map((l) => ({
  ...l,
  id_municipio: l.id_municipio as IdMunicipio,
}));
`;

await writeFile(DESTINO, conteudo, "utf8");
console.log(
  `${LOG} ✓ lib/db/cidades-do-build.ts — ${cidades.length} cidade(s): ` +
    cidades.map((c) => c.slug).join(", ")
);
