/**
 * scripts/sincronizar-guara-local.mts
 *
 * Sincroniza o Postgres do Guara (producao) para o Postgres LOCAL, de forma
 * ADITIVA: insere o que falta e atualiza o que mudou. NUNCA apaga linha.
 *
 * ═══ PAPEL NO PROJETO ═══
 * O servidor 2 (home-pc, `next start -p 3000`) le o Postgres local. Ele ficou
 * atras do Guara nas tabelas de evento do Congresso (presencas, votacoes,
 * votos, tramitacoes) e em duas do COPAM. Este script preenche esses buracos.
 *
 * O local tem MAIS dado que o Guara em outras tabelas (licitacoes, contratos,
 * municipios). Por isso o modo e aditivo: sobrescrever apagaria esse acervo.
 *
 * ═══ FONTE E DESTINO ═══
 * - Origem: Guara, via proxy local (rode `guara proxy -p controle-popular
 *   -s cp-postgres-597bd0 --local-port 15432 -y` antes). Credenciais lidas do
 *   CLI, sem gravar segredo.
 * - Destino: `DATABASE_URL_LOCAL` (ou `--local <dsn>`).
 *
 * ═══ USO ═══
 *   npx tsx scripts/sincronizar-guara-local.mts --local "postgresql://..."
 *   npx tsx scripts/sincronizar-guara-local.mts --tabelas congresso.votos,congresso.tramitacoes
 *
 * Sem `--tabelas`, sincroniza a lista das tabelas em que o Guara tem mais
 * linha que o local (medida em 02/10/2026).
 */
import { execFileSync } from "node:child_process";
import pg from "pg";

/** Tabelas em que o Guara tem MAIS linhas que o local (medido 02/10/2026).
 *  Ordem: PAI antes de FILHO, senao a chave estrangeira barra a insercao. */
const TABELAS_PADRAO = [
  // pais
  "congresso.fontes_externas",
  "congresso.eventos",
  "congresso.orgaos",
  "congresso.proposicoes",
  "congresso.votacoes",
  "public.copam_reunioes",
  // filhos
  "congresso.evento_pauta",
  "congresso.orgao_membros",
  "congresso.proposicao_autores",
  "congresso.proposicao_autoria",
  "congresso.presencas_plenario",
  "congresso.tramitacoes",
  "congresso.votos",
  "public.copam_pauta_itens",
];

/** Chave de conflito fora da PK (tabelas com unique extra). */
const CONFLITO_POR_TABELA: Record<string, string[]> = {
  "public.copam_reunioes": ["id_fonte"],
};

const LOTE = 2000;

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** DSN do Guara via credenciais do CLI (senha nunca impressa). */
function dsnGuara(): string {
  if (process.env.DATABASE_URL_GUARA) return process.env.DATABASE_URL_GUARA;
  const bruto = execFileSync(
    "node",
    [
      process.env.GUARA_CLI ??
        "C:\\Users\\Home\\AppData\\Local\\hermes\\node\\node_modules\\@guaracloud\\cli\\bin\\run.js",
      "services",
      "credentials",
      "-p",
      "controle-popular",
      "-s",
      "cp-postgres-597bd0",
      "--json",
    ],
    { encoding: "utf8" },
  );
  const f = JSON.parse(bruto).data.fields;
  const u = encodeURIComponent(f.username);
  const p = encodeURIComponent(f.password);
  return `postgresql://${u}:${p}@127.0.0.1:15432/${f.database}`;
}

type Coluna = { nome: string };

async function colunasEGpk(cli: pg.Client, schema: string, tabela: string) {
  const cols = await cli.query<Coluna>(
    `SELECT column_name AS nome FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
    [schema, tabela],
  );
  const pk = await cli.query<{ nome: string }>(
    `SELECT a.attname AS nome
       FROM pg_index i
       JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = ($1 || '.' || $2)::regclass AND i.indisprimary`,
    [schema, tabela],
  );
  return { cols: cols.rows.map((r) => r.nome), pk: pk.rows.map((r) => r.nome) };
}

function ident(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

async function sincronizar(origem: pg.Client, destino: pg.Client, alvo: string) {
  const [schema, tabela] = alvo.split(".");
  const { cols, pk } = await colunasEGpk(origem, schema, tabela);
  const alvoSql = `${ident(schema)}.${ident(tabela)}`;
  const listaCols = cols.map(ident).join(", ");

  const total = await origem.query<{ n: string }>(`SELECT count(*) AS n FROM ${alvoSql}`);
  process.stdout.write(`\n▶ ${alvo} (${total.rows[0]?.n ?? "?"} linhas na origem)`);

  const ordem = pk.length ? pk.map(ident).join(", ") : cols.map(ident).join(", ");
  const chaveConflito = CONFLITO_POR_TABELA[alvo] ?? pk;
  const conflito = chaveConflito.length
    ? `ON CONFLICT (${chaveConflito.map(ident).join(", ")}) DO UPDATE SET ` +
      cols
        .filter((c) => !chaveConflito.includes(c))
        .map((c) => `${ident(c)} = EXCLUDED.${ident(c)}`)
        .join(", ")
    : "ON CONFLICT DO NOTHING";

  let deslocamento = 0;
  let gravadas = 0;
  for (;;) {
    const pagina = await origem.query(
      `SELECT ${listaCols} FROM ${alvoSql} ORDER BY ${ordem} LIMIT ${LOTE} OFFSET ${deslocamento}`,
    );
    if (pagina.rows.length === 0) break;

    const valores: unknown[] = [];
    const tuplas = pagina.rows.map((linha) => {
      const ph = cols.map((c) => {
        valores.push((linha as Record<string, unknown>)[c]);
        return `$${valores.length}`;
      });
      return `(${ph.join(", ")})`;
    });

    await destino.query(
      `INSERT INTO ${alvoSql} (${listaCols}) VALUES ${tuplas.join(", ")} ${conflito}`,
      valores,
    );

    gravadas += pagina.rows.length;
    deslocamento += pagina.rows.length;
    if (deslocamento % (LOTE * 5) === 0) process.stdout.write(".");
  }
  process.stdout.write(` ✓ ${gravadas} linha(s) processada(s)`);
}

async function main() {
  const dsnLocal = arg("--local") ?? process.env.DATABASE_URL_LOCAL;
  if (!dsnLocal) {
    console.error("⛔ falta --local <dsn> ou DATABASE_URL_LOCAL");
    process.exit(1);
  }
  const lista = arg("--tabelas")?.split(",").map((s) => s.trim()) ?? TABELAS_PADRAO;

  const origem = new pg.Client({ connectionString: dsnGuara(), ssl: false });
  const destino = new pg.Client({ connectionString: dsnLocal, ssl: false });
  await origem.connect();
  await destino.connect();
  console.log(`🔄 Guara ➔ local: ${lista.length} tabela(s), modo aditivo (nunca apaga)\n`);

  try {
    for (const alvo of lista) {
      // Uma tabela com esquema divergente não derruba as outras.
      try {
        await sincronizar(origem, destino, alvo);
      } catch (e) {
        process.stdout.write(` ✗ falhou: ${e instanceof Error ? e.message : e}`);
      }
    }
    console.log("\n\n✅ sincronização concluída");
  } finally {
    await origem.end();
    await destino.end();
  }
}

main().catch((e) => {
  console.error("\n❌ falha:", e instanceof Error ? e.message : e);
  process.exit(1);
});
