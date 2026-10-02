/**
 * scripts/sincronizar-guara-local.mts
 *
 * Sincroniza o Postgres do Guara (producao) para OUTRO Postgres, de forma
 * ADITIVA: insere o que falta e atualiza o que mudou. NUNCA apaga linha.
 *
 * ═══ PAPEL NO PROJETO ═══
 * Dois usos medidos em 02/10/2026:
 *  1. **Servidor 2 (home-pc)** — `next start` le o Postgres local, que estava
 *     atras do Guara nas tabelas de evento do Congresso (presencas, votos,
 *     votacoes, tramitacoes).
 *  2. **Neon (reserva)** — espelhar `public` para a reserva ter o acervo. O
 *     Neon nao cabe o `public` inteiro (431 MB) no plano gratis de 500 MB:
 *     `licitacoes` (178 MB) e `servidores` (58 MB) ficam de fora.
 *
 * O destino pode ter MAIS dado que o Guara (o local tem licitacoes 118k x 78k).
 * Por isso o modo e aditivo: sobrescrever apagaria esse acervo.
 *
 * ═══ FONTE E DESTINO ═══
 * - Origem: Guara via proxy local (rode antes: `guara proxy -p
 *   controle-popular -s cp-postgres-597bd0 --local-port 15432 -y`).
 *   Credenciais lidas do CLI, sem gravar segredo.
 * - Destino: `--destino <dsn>`, `--local <dsn>` (apelido) ou `--destino neon`
 *   (busca a connection string no `neonctl`, sem passar a senha na linha de
 *   comando). Neon exige SSL; o script detecta `.neon.tech` sozinho.
 *
 * ═══ USO ═══
 *   npx tsx scripts/sincronizar-guara-local.mts --local "postgresql://..."
 *   npx tsx scripts/sincronizar-guara-local.mts --destino neon --publico
 *   npx tsx scripts/sincronizar-guara-local.mts --destino neon --tabelas congresso.votos
 *
 * `--publico` sincroniza TODAS as tabelas do schema `public` (menos `--pular`,
 * padrao `licitacoes,servidores`), na ordem pai-antes-de-filho. Sem `--publico`
 * nem `--tabelas`, usa a lista das tabelas em que o Guara tem mais linha que o
 * local (medida em 02/10/2026).
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

/** Tabelas grandes demais para a reserva gratis do Neon (500 MB). */
const PULAR_PADRAO = ["licitacoes", "servidores"];

/** Chave de conflito fora da PK (tabelas com unique extra). */
const CONFLITO_POR_TABELA: Record<string, string[]> = {
  "public.copam_reunioes": ["id_fonte"],
};

const LOTE = 2000;

function arg(nome: string): string | undefined {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const GUARA_CLI =
  process.env.GUARA_CLI ??
  "C:\\Users\\Home\\AppData\\Local\\hermes\\node\\node_modules\\@guaracloud\\cli\\bin\\run.js";

/** DSN do Guara via credenciais do CLI (senha nunca impressa). */
function dsnGuara(): string {
  if (process.env.DATABASE_URL_GUARA) return process.env.DATABASE_URL_GUARA;
  const bruto = execFileSync(
    "node",
    [GUARA_CLI, "services", "credentials", "-p", "controle-popular", "-s", "cp-postgres-597bd0", "--json"],
    { encoding: "utf8" },
  );
  const f = JSON.parse(bruto).data.fields;
  return `postgresql://${encodeURIComponent(f.username)}:${encodeURIComponent(f.password)}@127.0.0.1:15432/${f.database}`;
}

/** DSN do Neon via neonctl (a senha nao passa pela linha de comando).
 *  No Windows o shim `neonctl` e um .cmd — chamamos o cli.js pelo node. */
function dsnNeon(): string {
  const cli =
    process.env.NEONCTL_CLI ??
    "C:\\Users\\Home\\AppData\\Local\\hermes\\node\\node_modules\\neonctl\\bin\\cli.js";
  return execFileSync(
    "node",
    [cli, "connection-string", "--project-id", "summer-field-68861057", "--role-name", "neondb_owner"],
    { encoding: "utf8" },
  ).trim();
}

/** Neon exige TLS; proxy local (127.0.0.1) fala TCP puro. */
function sslPara(dsn: string) {
  return /neon\.tech/.test(dsn) ? { rejectUnauthorized: false } : false;
}

async function colunasEGpk(cli: pg.Client, schema: string, tabela: string) {
  const cols = await cli.query<{ nome: string; tipo: string }>(
    `SELECT column_name AS nome, udt_name AS tipo FROM information_schema.columns
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
  return { cols: cols.rows, pk: pk.rows.map((r) => r.nome) };
}

function ident(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

async function sincronizar(origem: pg.Client, destino: pg.Client, alvo: string) {
  const [schema, tabela] = alvo.split(".");
  const { cols, pk } = await colunasEGpk(origem, schema, tabela);
  const nomes = cols.map((c) => c.nome);
  const alvoSql = `${ident(schema)}.${ident(tabela)}`;
  const listaCols = nomes.map(ident).join(", ");

  const total = await origem.query<{ n: string }>(`SELECT count(*) AS n FROM ${alvoSql}`);
  process.stdout.write(`\n▶ ${alvo} (${total.rows[0]?.n ?? "?"} na origem)`);

  // Lote por linhas: ~20.000 parametros por INSERT (o Postgres recusa acima de 65.535).
  const lote = Math.max(1, Math.min(LOTE, Math.floor(20000 / Math.max(1, nomes.length))));

  const ordem = pk.length ? pk.map(ident).join(", ") : listaCols;
  const chaveConflito = CONFLITO_POR_TABELA[alvo] ?? pk;
  const conflito = chaveConflito.length
    ? `ON CONFLICT (${chaveConflito.map(ident).join(", ")}) DO UPDATE SET ` +
      nomes
        .filter((c) => !chaveConflito.includes(c))
        .map((c) => `${ident(c)} = EXCLUDED.${ident(c)}`)
        .join(", ")
    : "ON CONFLICT DO NOTHING";

  let deslocamento = 0;
  let gravadas = 0;
  for (;;) {
    const pagina = await origem.query(
      `SELECT ${listaCols} FROM ${alvoSql} ORDER BY ${ordem} LIMIT ${lote} OFFSET ${deslocamento}`,
    );
    if (pagina.rows.length === 0) break;

    const valores: unknown[] = [];
    const tuplas = pagina.rows.map((linha) => {
      const ph = cols.map((c) => {
        const bruto = (linha as Record<string, unknown>)[c.nome];
        // json/jsonb: array/objeto passado cru vira literal errado; vai stringificado.
        const json = c.tipo === "json" || c.tipo === "jsonb";
        valores.push(json && bruto !== null ? JSON.stringify(bruto) : bruto);
        return `$${valores.length}`;
      });
      return `(${ph.join(", ")})`;
    });

    await destino.query(`INSERT INTO ${alvoSql} (${listaCols}) VALUES ${tuplas.join(", ")} ${conflito}`, valores);

    gravadas += pagina.rows.length;
    deslocamento += pagina.rows.length;
    if (deslocamento % (lote * 5) === 0) process.stdout.write(".");
  }
  process.stdout.write(` ✓ ${gravadas}`);
}

/** Todas as tabelas-base de um schema. */
async function tabelasDoSchema(cli: pg.Client, schema: string): Promise<string[]> {
  const r = await cli.query<{ n: string }>(
    `SELECT table_name AS n FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE' ORDER BY table_name`,
    [schema],
  );
  return r.rows.map((x) => `${schema}.${x.n}`);
}

/** Ordena pai-antes-de-filho pelas FKs do schema (Kahn). */
async function ordenarPorFk(cli: pg.Client, tabelas: string[], schema: string): Promise<string[]> {
  const nomes = new Set(tabelas.map((t) => t.split(".")[1]));
  const r = await cli.query<{ filho: string; pai: string }>(
    `SELECT conrelid::regclass::text AS filho, confrelid::regclass::text AS pai
       FROM pg_constraint WHERE contype = 'f' AND connamespace = $1::regnamespace`,
    [schema],
  );
  const pais = new Map<string, Set<string>>();
  for (const t of nomes) pais.set(t, new Set());
  for (const { filho, pai } of r.rows) {
    const f = filho.replace(/^.*\./, "");
    const p = pai.replace(/^.*\./, "");
    if (nomes.has(f) && nomes.has(p)) pais.get(f)!.add(p);
  }
  const saida: string[] = [];
  const feito = new Set<string>();
  while (saida.length < tabelas.length) {
    const prontas = [...nomes].filter((t) => !feito.has(t) && [...pais.get(t)!].every((p) => feito.has(p)));
    if (prontas.length === 0) break; // ciclo: emite o resto como esta
    for (const t of prontas) {
      feito.add(t);
      saida.push(`${schema}.${t}`);
    }
  }
  for (const t of tabelas) if (!feito.has(t.split(".")[1])) saida.push(t);
  return saida;
}

async function main() {
  const destinoDsn = arg("--destino") === "neon" ? dsnNeon() : (arg("--destino") ?? arg("--local") ?? process.env.DATABASE_URL_LOCAL);
  if (!destinoDsn) {
    console.error("⛔ falta --destino <dsn> | --destino neon | --local <dsn>");
    process.exit(1);
  }

  const origem = new pg.Client({ connectionString: dsnGuara(), ssl: sslPara(dsnGuara()) });
  const destino = new pg.Client({ connectionString: destinoDsn, ssl: sslPara(destinoDsn) });
  await origem.connect();
  await destino.connect();

  let lista: string[];
  if (process.argv.includes("--publico")) {
    const pular = (arg("--pular") ?? PULAR_PADRAO.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
    lista = (await tabelasDoSchema(origem, "public")).filter((t) => !pular.includes(t.split(".")[1]));
    lista = await ordenarPorFk(origem, lista, "public");
    console.log(`🔄 Guara ➔ destino: public inteiro menos [${pular.join(", ")}] (${lista.length} tabelas)`);
  } else {
    lista = arg("--tabelas")?.split(",").map((s) => s.trim()) ?? TABELAS_PADRAO;
    console.log(`🔄 Guara ➔ destino: ${lista.length} tabela(s)`);
  }
  // Tabela que so existe na origem nao pode ser sincronizada (o destino nao tem).
  const temNoDestino = new Set((await tabelasDoSchema(destino, "public")).map((t) => t.split(".")[1]));
  const semDestino = lista.filter((t) => t.startsWith("public.") && !temNoDestino.has(t.split(".")[1]));
  if (semDestino.length) {
    lista = lista.filter((t) => !semDestino.includes(t));
    console.log(`   (fora do destino: ${semDestino.map((t) => t.split(".")[1]).join(", ")})`);
  }

  console.log("modo aditivo (nunca apaga)\n");

  try {
    for (const alvo of lista) {
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
