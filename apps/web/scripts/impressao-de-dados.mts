/**
 * Impressão digital do que o site publica. Se ela não mudou, o build não
 * precisa rodar.
 *
 * npx tsx scripts/impressao-de-dados.mts
 *
 * POR QUE ISTO EXISTE (incidente de 2026-08-07): o egress do Neon estourou
 * — 5,73 GB de 5 GB em 7 dias — porque houve 9 rebuilds numa semana. Cada
 * `next build` lê o banco inteiro para pré-renderizar as ~715 páginas, e o
 * orçamento do plano free comporta ~1 por semana. Mas boa parte desses
 * builds republicava EXATAMENTE o mesmo HTML: o ETL tinha rodado sem trazer
 * novidade, ou o commit não mexia em nada que a página mostra.
 *
 * A impressão digital combina DUAS coisas, e as duas são necessárias:
 *
 *   - o **commit** (`GITHUB_SHA`), porque mudança de código muda o HTML sem
 *     encostar no banco;
 *   - o **estado do dado** (`count(*)` e `max(updated_at)` por tabela),
 *     porque o ETL muda o HTML sem encostar no código.
 *
 * Vigiar só uma das duas produz o pior dos erros: pular um build que era
 * necessário, e o site fica mostrando dado velho sem ninguém perceber.
 *
 * CUSTO: duas requisições, poucos KB. `count(*)` custa CPU, não egress, e o
 * compute está em 5% do teto — a métrica apertada é a outra.
 *
 * DIREÇÃO DO ERRO, de propósito: qualquer dúvida (banco fora, coluna nova,
 * estatística zerada) devolve uma impressão ÚNICA, que nunca casa com a
 * anterior e força o build. Errar para o lado de rebuildar à toa custa um
 * build; errar para o outro publica dado velho por uma semana.
 */
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";

import { sql, type SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { getDb } from "../lib/db/client.js";

const SCHEMAS = ["public", "congresso", "judiciario", "ambiental"];

type LinhaTabela = Record<string, unknown> & {
  schema_nome: string;
  tabela: string;
  tem_updated_at: boolean;
};

type LinhaImpressao = Record<string, unknown> & {
  alvo: string;
  n: number;
  ultima: string | null;
};

function publicar(hash: string, motivo: string) {
  console.log(`impressao=${hash}`);
  console.log(`motivo=${motivo}`);
  const saida = process.env.GITHUB_OUTPUT;
  if (saida) {
    appendFileSync(saida, `impressao=${hash}\n`);
    appendFileSync(saida, `motivo=${motivo}\n`);
  }
}

/** Impressão que nunca repete — força o build quando não dá para saber. */
function impressaoUnica(motivo: string): never {
  const hash = createHash("sha256")
    .update(`indeterminado:${process.env.GITHUB_RUN_ID ?? ""}:${process.env.GITHUB_SHA ?? ""}`)
    .digest("hex")
    .slice(0, 16);
  publicar(hash, motivo);
  process.exit(0);
}

/**
 * Monta o `union all` do censo. Extraída para poder ser conferida SEM banco
 * (`--testar`).
 *
 * Isto não é zelo excessivo: o script devolve impressão única sempre que
 * algo dá errado, e "SQL malformada" cai nesse mesmo caminho. Sem o teste, a
 * otimização inteira poderia nunca funcionar — todo build sairia, todo
 * build seria pago, e o log diria apenas "censo falhou". A trava contra o
 * erro silencioso tem de ser o teste, porque o comportamento em produção
 * foi desenhado justamente para não fazer barulho.
 */
function montarCenso(tabelas: Pick<LinhaTabela, "schema_nome" | "tabela" | "tem_updated_at">[]): SQL {
  const partes = tabelas.map((t) => {
    const alvo = `${t.schema_nome}.${t.tabela}`;
    const ident = sql.raw(`"${t.schema_nome}"."${t.tabela}"`);
    // `count(*)` é bigint e o driver HTTP devolveria string; o `::int`
    // mantém número. `max(updated_at)` vira texto em formato fixo porque a
    // sessão do Neon é GMT e o objetivo é comparar, não exibir.
    return t.tem_updated_at
      ? sql`select ${alvo} as alvo, count(*)::int as n,
                   to_char(max(updated_at) at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS') as ultima
              from ${ident}`
      : sql`select ${alvo} as alvo, count(*)::int as n, null::text as ultima from ${ident}`;
  });
  return sql.join(partes, sql` union all `);
}

if (process.argv.includes("--testar")) {
  const fixtures = [
    { schema_nome: "public", tabela: "contratos", tem_updated_at: true },
    { schema_nome: "congresso", tabela: "proposicoes", tem_updated_at: true },
    { schema_nome: "judiciario", tabela: "tribunais", tem_updated_at: false },
  ];
  const { sql: texto, params } = new PgDialect().sqlToQuery(montarCenso(fixtures));
  const falhas: string[] = [];

  const uniões = (texto.match(/union all/g) ?? []).length;
  if (uniões !== fixtures.length - 1) falhas.push(`esperava 2 'union all', achei ${uniões}`);
  // Identificador precisa vir QUALIFICADO e entre aspas: sem o schema, a
  // consulta cairia no `search_path` e contaria a tabela homônima do eixo
  // errado — as 4 colisões (`proposicoes`, `alertas`, ...) são o motivo de
  // cada zona ter schema próprio.
  if (!texto.includes('"congresso"."proposicoes"')) falhas.push("identificador não veio qualificado");
  if (!texto.includes("count(*)::int")) falhas.push("faltou o cast ::int no count");
  if (!texto.includes("at time zone 'UTC'")) falhas.push("faltou normalizar o fuso");
  // O nome da tabela entra como PARÂMETRO (é dado, não identificador), então
  // não pode aparecer interpolado no texto da consulta.
  if (!params.includes("congresso.proposicoes")) falhas.push("o rótulo não virou parâmetro");
  if (texto.includes("undefined") || texto.includes("[object")) falhas.push("interpolação quebrada");

  console.log(texto.replace(/\s+/g, " ").slice(0, 400) + "\n");
  console.log(`params: ${JSON.stringify(params)}`);
  if (falhas.length) {
    console.error("\nFALHOU:");
    for (const f of falhas) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  console.log("\n--testar: SQL do censo está bem formada.");
  process.exit(0);
}

const commit = process.env.GITHUB_SHA ?? "local";

const db = getDb();
if (!db) impressaoUnica("sem DATABASE_URL: nao da para saber se o dado mudou");

let tabelas: LinhaTabela[];
try {
  // Descoberta dinâmica: tabela nova entra sozinha. Enumerar à mão daria o
  // modo de falha exato que este script existe para evitar — uma tabela
  // esquecida vira dado que muda sem mudar a impressão.
  const r = await db!.execute<LinhaTabela>(sql`
    select t.table_schema as schema_nome,
           t.table_name   as tabela,
           bool_or(c.column_name = 'updated_at') as tem_updated_at
      from information_schema.tables t
      join information_schema.columns c
        on c.table_schema = t.table_schema and c.table_name = t.table_name
     where t.table_type = 'BASE TABLE'
       and t.table_schema = any(${SCHEMAS})
     group by 1, 2
     order by 1, 2
  `);
  tabelas = (Array.isArray(r) ? r : r.rows) as LinhaTabela[];
} catch (erro) {
  const msg = erro instanceof Error ? erro.message : String(erro);
  impressaoUnica(`banco nao respondeu (${msg.slice(0, 80)})`);
}

if (tabelas!.length === 0) impressaoUnica("nenhuma tabela encontrada");

// Um `union all` só: N tabelas em UMA ida à rede, em vez de N idas.
let linhas: LinhaImpressao[];
try {
  const r = await db!.execute<LinhaImpressao>(montarCenso(tabelas!));
  linhas = (Array.isArray(r) ? r : r.rows) as LinhaImpressao[];
} catch (erro) {
  const msg = erro instanceof Error ? erro.message : String(erro);
  impressaoUnica(`censo falhou (${msg.slice(0, 80)})`);
}

// Ordenar antes de somar: `union all` não promete ordem, e uma ordem
// diferente daria uma impressão diferente para o mesmo estado.
const censo = linhas!
  .map((l) => `${l.alvo}:${l.n}:${l.ultima ?? "-"}`)
  .sort()
  .join("\n");

const totalLinhas = linhas!.reduce((a, l) => a + Number(l.n ?? 0), 0);
console.error(`  ${linhas!.length} tabelas, ${totalLinhas.toLocaleString("pt-BR")} linhas`);

const hash = createHash("sha256").update(`${commit}\n${censo}`).digest("hex").slice(0, 16);
publicar(hash, `commit ${commit.slice(0, 7)} + ${linhas!.length} tabelas`);
