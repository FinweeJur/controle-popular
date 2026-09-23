#!/usr/bin/env node
/**
 * Seed de `documentos_ambientais` — piloto Irapé + Setúbal.
 * Só fonte OFICIAL/legislatura (decisão 6: acadêmico não vira documento de
 * condicionante; vai em lib/ambiental/publicacoes-barragens).
 * Uso: node scripts/seed-documentos-condicionantes.mjs
 * Idempotente: upsert por (url_fonte, hash_sha256).
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = "C:\\nodejs\\node_modules\\@guaracloud\\cli\\bin\\run.js";

const DOCS = [
  {
    url_fonte:
      "https://www.almg.gov.br/acompanhe/noticias/arquivos/2006/06/Not_590862.html",
    orgao: "ALMG",
    empreendimento: "Setúbal",
    tipo_documento: "lp_menciona",
    data_documento: "2006-06-14",
    numero_processo: "11492/2005/002/2006",
    metodo_texto: "nativo",
  },
  {
    url_fonte:
      "https://www.almg.gov.br/comunicacao/noticias/arquivos/Impactos-socioambientais-da-Barragem-de-Setubal-pautam-audiencia-publica/",
    orgao: "ALMG",
    empreendimento: "Setúbal",
    tipo_documento: "audiencia",
    data_documento: "2026-05-22",
    metodo_texto: "nativo",
  },
  {
    url_fonte:
      "https://www.almg.gov.br/acompanhe/noticias/arquivos/2006/05/Not_583123.html",
    orgao: "ALMG",
    empreendimento: "Irapé",
    tipo_documento: "tac_menciona",
    data_documento: "2006-05-01",
    metodo_texto: "nativo",
  },
  {
    url_fonte:
      "https://ief.mg.gov.br/documents/51853/7557960/cap_ata_09032007/97dea963-2ac2-1118-cae5-0352fb528f07?t=1723741348826&version=1.0",
    orgao: "IEF",
    empreendimento: "Setúbal",
    tipo_documento: "ata",
    data_documento: "2007-03-09",
    numero_processo: "11492/2005/002/2006",
    metodo_texto: "nativo",
    local: "setubal-cap-ata-ief-2007-03-09.pdf",
  },
  {
    url_fonte:
      "https://www.cemig.com.br/wp-content/uploads/2025/09/documentacao-de-anuencia-de-area-confrontante-uhe-irape.pdf",
    orgao: "CEMIG",
    empreendimento: "Irapé",
    tipo_documento: "anuencia",
    metodo_texto: "nativo",
    local: "irape-cemig-anuencia.pdf",
  },
  {
    url_fonte:
      "https://www.cgti.org.br/publicacoes/wp-content/uploads/2016/04/FERRAMENTAS-DE-GESTA%CC%83O-DE-PROJETOS-APLICADAS-AO-GERENCIAMENTO-DE-RISCOS-SO%CC%81CIO-AMBIENTAIS-NA-IMPLANTAC%CC%A7A%CC%83O-DE-PROJETOS-DE-GERAC%CC%A7A%CC%83O-HIDRA%CC%81ULICA-A-EXPERIE%CC%82NCIA-DA-CEMIG.pdf",
    orgao: "CEMIG/CGTI",
    empreendimento: "Irapé",
    tipo_documento: "tac_resumo",
    metodo_texto: "nativo",
    local: "irape-cemig-cgti-termo-acordo-anexos.pdf",
  },
  {
    url_fonte: "https://www.cemig.com.br/usinas/uhe-irape/",
    orgao: "CEMIG",
    empreendimento: "Irapé",
    tipo_documento: "pagina_oficial",
    metodo_texto: "nativo",
  },
];

const LOTE = "X:\\DevCoder\\_lote-ambiental\\condicionantes-piloto";

function sha256Arquivo(p) {
  return createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

const linhas = [];
for (const d of DOCS) {
  let hash = null;
  if (d.local) {
    const p = path.join(LOTE, d.local);
    if (!fs.existsSync(p)) {
      console.error(`ERRO falta local: ${d.local}`);
      process.exitCode = 1;
      continue;
    }
    hash = sha256Arquivo(p);
  }
  linhas.push({ ...d, hash });
}

// Resolve DATABASE_URL via guara env (nunca imprime) → proxy 15432
const raw = execFileSync(
  process.execPath,
  [CLI, "env", "list", "--project", "controle-popular"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
const m = raw.match(/postgresql:\/\/([^@\s]+)@[^:\s]+:\d+\/(\S+)/);
if (!m) {
  console.error("DATABASE_URL nao encontrada");
  process.exit(1);
}
const url = `postgresql://${m[1]}@127.0.0.1:15432/${m[2].replace(/["',]+$/, "")}`;

const { default: pg } = await import("pg");
const pool = new pg.Pool({ connectionString: url, connectionTimeoutMillis: 15000 });
try {
  let n = 0;
  for (const d of linhas) {
    await pool.query(
      `insert into documentos_ambientais
         (url_fonte, hash_sha256, orgao, empreendimento, tipo_documento,
          data_documento, numero_processo, metodo_texto, aprovado_para_publicacao)
       values ($1,$2,$3,$4,$5,$6,$7,$8,true)
       on conflict (url_fonte, hash_sha256) do update set
         updated_at = now(),
         tipo_documento = excluded.tipo_documento,
         aprovado_para_publicacao = true`,
      [
        d.url_fonte,
        d.hash,
        d.orgao,
        d.empreendimento,
        d.tipo_documento,
        d.data_documento ?? null,
        d.numero_processo ?? null,
        d.metodo_texto,
      ],
    );
    n++;
  }
  const r = await pool.query(
    `select empreendimento, count(*)::int n from documentos_ambientais
     group by 1 order by 1`,
  );
  console.log(`seed ok: ${n} upserts`);
  for (const row of r.rows) console.log(`  ${row.empreendimento}: ${row.n}`);
} catch (e) {
  console.error("ERRO:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
