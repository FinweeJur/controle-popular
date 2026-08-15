/**
 * Carrega no Postgres LOCAL as normas federais exportadas pelos coletores.
 *
 *   npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-mma.json
 *   npx tsx scripts/carregar-legislacao-federal.mts ../../etl/betim/dados/legislacao-cndh.json
 *
 * ## Por que existe um passo intermediário em vez de rodar o coletor aqui
 *
 * A coleta e o banco de destino estão em MÁQUINAS DIFERENTES: quem coleta é o
 * desktop, e quem o site lê é o Postgres da máquina de build (`home-pc`, ver
 * `docs/build-em-outro-pc.md`). Rodar o coletor de novo lá não é equivalente —
 * ele baixaria o CSV do MMA e rasparia o site do CNDH outra vez, e as duas
 * fontes mudam sem aviso. Duas coletas em momentos diferentes produzem dois
 * conjuntos diferentes com o mesmo nome, e a diferença só apareceria como um
 * número que não bate com o documento.
 *
 * O arquivo JSON congela o que já foi conferido. Isto aqui só o grava.
 *
 * ## Recusa conectar em nuvem, de propósito
 *
 * Mesma trava de `aplicar-migration-local.mts`: só 127.0.0.1/localhost. A Neon
 * está em HTTP 402 até 01/09, e um upsert de 8.940 linhas contra ela seria
 * exatamente o tipo de tráfego que a cota já não comporta.
 *
 * ## Upsert, nunca apagar
 *
 * A chave é `(fonte, id_fonte)`, a mesma que os coletores usam. Um arquivo
 * incompleto atualiza o que traz e deixa o resto onde está — nunca zera a
 * tabela. `ambiental_legislacao` guarda também as normas municipais e
 * estaduais, e um DELETE aqui levaria junto trabalho de outra coleta.
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("uso: tsx scripts/carregar-legislacao-federal.mts <arquivo.json>");
  process.exit(1);
}

const envLocal = new URL("../.env.local", import.meta.url);
const envTexto = fs.existsSync(envLocal) ? fs.readFileSync(envLocal, "utf8") : "";
const url =
  process.env.DATABASE_URL ||
  envTexto.match(/^DATABASE_URL=(.*)$/m)?.[1].trim().replace(/^["']|["']$/g, "");
if (!url) {
  console.error("DATABASE_URL ausente (nem no ambiente nem em apps/web/.env.local)");
  process.exit(1);
}
if (!/^(127\.0\.0\.1|localhost)$/.test(new URL(url).hostname)) {
  console.error(
    `recusa: DATABASE_URL não é local (host=${new URL(url).hostname}).\n` +
      "Este script só grava no Postgres da própria máquina — a Neon está em cota."
  );
  process.exit(1);
}

const bruto = JSON.parse(fs.readFileSync(path.resolve(arquivo), "utf8"));
const linhas: Record<string, unknown>[] = bruto.linhas ?? [];
if (!linhas.length) {
  console.error(`recusa: ${path.basename(arquivo)} não tem linha nenhuma. Nada foi gravado.`);
  process.exit(1);
}

// As colunas saem do próprio arquivo, não de uma lista escrita aqui: quando o
// coletor ganhar um campo, o carregador acompanha sozinho. Se o campo não
// existir na tabela, o Postgres reclama pelo nome — erro claro, no lugar certo.
const colunas = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
const atualizaveis = colunas.filter((c) => c !== "fonte" && c !== "id_fonte");

const pool = new Pool({ connectionString: url });
let gravadas = 0;
try {
  for (let i = 0; i < linhas.length; i += 200) {
    const lote = linhas.slice(i, i + 200);
    const valores: unknown[] = [];
    const tuplas = lote.map((linha) => {
      const marcadores = colunas.map((c) => {
        valores.push(linha[c] ?? null);
        return `$${valores.length}`;
      });
      return `(${marcadores.join(",")})`;
    });
    await pool.query(
      `INSERT INTO ambiental_legislacao (${colunas.map((c) => `"${c}"`).join(",")})
       VALUES ${tuplas.join(",")}
       ON CONFLICT (fonte, id_fonte) DO UPDATE SET
         ${atualizaveis.map((c) => `"${c}" = EXCLUDED."${c}"`).join(", ")}`,
      valores
    );
    gravadas += lote.length;
    process.stdout.write(`\r  ${gravadas}/${linhas.length}`);
  }
  const { rows } = await pool.query(
    "SELECT count(*)::int AS n FROM ambiental_legislacao WHERE fonte = $1",
    [bruto.fonte]
  );
  console.log(
    `\nOK  ${gravadas} linha(s) enviada(s); a tabela tem ${rows[0].n} de fonte=${bruto.fonte}.`
  );
  console.log(
    "Falta reclassificar os temas: python -m etl.apis.classificar_temas_ambientais\n" +
      "E o site só muda no próximo build."
  );
} catch (e) {
  console.error(`\nERRO: ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
