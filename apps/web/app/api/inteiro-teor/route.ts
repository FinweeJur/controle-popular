import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

/**
 * Inteiro teor do TJES (Rio Doce), servido sob demanda.
 *
 * Por que rota e não `public/`: são 2.492 arquivos (16,7 MB comprimidos,
 * 46,4 MB crus). Em `public/` eles entrariam no build e na listagem de assets;
 * aqui o build não vê nada e só quem clica paga o download.
 *
 * O arquivo fica em `data/inteiro-teor/<processo>.txt.gz`; o `processo` é
 * validado antes de virar caminho, para não abrir leitura fora da pasta.
 */
export const runtime = "nodejs";

const PERMITIDO = /^[\d.\-/]+$/;

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const processo = url.searchParams.get("processo") ?? "";
  // `download=1` é o mesmo texto, com nome de arquivo: o leitor que vai usar a
  // decisão fora do portal não deveria ter de selecionar 40 mil caracteres e
  // salvar na mão.
  const baixar = url.searchParams.get("download") === "1";
  if (!PERMITIDO.test(processo)) {
    return new Response("processo inválido", { status: 400 });
  }
  const caminho = path.join(process.cwd(), "data", "inteiro-teor", `${processo}.txt.gz`);
  try {
    const comprimido = await readFile(caminho);
    const texto = gunzipSync(comprimido).toString("utf8");
    return new Response(texto, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
        ...(baixar
          ? { "content-disposition": `attachment; filename="${processo}.txt"` }
          : {}),
      },
    });
  } catch {
    return new Response("inteiro teor não disponível para este processo", { status: 404 });
  }
}
