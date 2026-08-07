/**
 * Pré-voo do rebuild: falha em segundos, ANTES de gastar o egress do build.
 *
 * npx tsx scripts/preflight-deploy.mts
 *
 * POR QUE ISTO EXISTE (incidente de 2026-08-07): o projeto Neon estourou os
 * 5 GB de egress do plano free — 5,73 GB em 7 dias — e o compute foi
 * suspenso. A causa não foi consulta gorda: foram **9 rebuilds em 7 dias**
 * num orçamento desenhado para 1 por semana, e **6 deles falharam DEPOIS de
 * gerar 500+ das 715 páginas**. Ou seja: pagaram o egress inteiro do build e
 * não publicaram nada. Duas dessas falhas eram só `BETTER_AUTH_SECRET`
 * ausente — coisa que se confere em milissegundos.
 *
 * A regra que fica: **nada que o job precise no fim pode ser descoberto no
 * fim.** Credencial de deploy conferida antes do build, não depois.
 *
 * O caso mais perigoso é o `DATABASE_URL` ausente, e ele NÃO falha sozinho:
 * `getDb()` devolve `null` de propósito (ver `lib/db/client.ts`) para o
 * repo poder ser clonado sem credencial, então o build geraria as 715
 * páginas com estado vazio e **publicaria um site em branco, com exit 0**.
 * É a pior falha possível e a única defesa é esta.
 *
 * Custo de egress: um `select 1`. Dezenas de bytes.
 */
import { sql } from "drizzle-orm";
import { getDb } from "../lib/db/client.js";

type Exigencia = {
  nome: string;
  porque: string;
  /** `false` = a ausência degrada o site em silêncio, não quebra o job. */
  quebraSozinha: boolean;
};

const EXIGIDAS: Exigencia[] = [
  {
    nome: "DATABASE_URL",
    porque:
      "sem ela o build gera as páginas com estado vazio e PUBLICA um site em branco, com exit 0",
    quebraSozinha: false,
  },
  {
    nome: "CLOUDFLARE_API_TOKEN",
    porque: "o deploy morre no último passo, depois de o build inteiro já ter sido pago",
    quebraSozinha: true,
  },
  {
    nome: "CLOUDFLARE_ACCOUNT_ID",
    porque: "idem — o wrangler só reclama na hora de publicar",
    quebraSozinha: true,
  },
  {
    nome: "BETTER_AUTH_SECRET",
    porque:
      "o Better Auth cai no segredo padrão e polui o build com erro; foi a causa de 2 dos 6 builds perdidos em 2026-08",
    quebraSozinha: false,
  },
];

const problemas: string[] = [];

for (const e of EXIGIDAS) {
  const v = process.env[e.nome];
  if (!v || v.trim() === "") {
    problemas.push(`${e.nome} ausente ou vazia — ${e.porque}`);
  }
}

// Um `select 1` prova três coisas de uma vez: a URL é válida, o compute está
// acordado e a cota não estourou. As três derrubam o build lá na frente.
if (!problemas.some((p) => p.startsWith("DATABASE_URL"))) {
  const db = getDb();
  if (!db) {
    problemas.push("getDb() devolveu null mesmo com DATABASE_URL definida");
  } else {
    try {
      await db.execute(sql`select 1`);
      console.log("  OK     banco responde");
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : String(erro);
      const causa = (erro as { cause?: { message?: string } })?.cause?.message ?? "";
      const texto = `${msg} ${causa}`;
      // 402 é cota estourada. Vale mensagem própria: o operador tem de saber
      // que não adianta reexecutar, porque só o vira-mês (ou o upgrade)
      // resolve — e cada tentativa que passasse daqui gastaria mais egress.
      if (texto.includes("402") || texto.toLowerCase().includes("quota")) {
        problemas.push(
          "cota do Neon estourada (HTTP 402) — o compute está suspenso até o " +
            "próximo período de consumo. REEXECUTAR NÃO RESOLVE e gasta mais egress."
        );
      } else {
        problemas.push(`banco não respondeu ao 'select 1': ${msg}`);
      }
    }
  }
}

if (problemas.length > 0) {
  console.error("\nPRÉ-VOO REPROVADO — o build não vai começar.\n");
  for (const p of problemas) console.error(`  ✗ ${p}`);
  console.error(
    "\nMotivo de existir esta trava: em 2026-08 seis builds falharam depois de\n" +
      "gerar 500+ páginas, queimando ~2,4 GB dos 5 GB de egress do mês sem\n" +
      "publicar nada. Falhar aqui custa segundos; falhar lá custa o mês.\n"
  );
  process.exit(1);
}

console.log("  OK     credenciais presentes");
console.log("\nPré-voo aprovado.");
