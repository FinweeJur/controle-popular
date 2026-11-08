#!/usr/bin/env node
/**
 * Coleta trechos do RAG para cada rota do inventário.
 *
 * POR QUE EXISTE
 *
 * A v1 do resumo de realidade só usa o dado da página. Para a v2, cada
 * afirmação que vier de documento externo precisa de link com página. Este
 * script faz a ponte: transforma o nome da rota em pergunta e guarda os
 * trechos com página > 0.
 *
 * REGRA: metadado (`pagina: 0`) não entra. Quando a rota não tem fonte no
 * acervo, o registro sai com `semTexto: true` e o resumo não pode afirmar
 * nada externo.
 *
 * Uso (em apps/web):
 *     npx tsx scripts/coletar-trechos-rotas.mts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buscarDocumentos } from "../lib/assistente/documentos-rag/carregar";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(AQUI, "..");
const INVENTARIO = path.join(APP, "data", "inventario-subfrentes.json");
const DESTINO = path.join(APP, "data", "trechos-rotas.json");

interface Rota {
  rota: string;
  classe: string;
  registros: number;
}

function pergunta(rota: string): string {
  const palavras = rota
    .split("/")
    .filter(Boolean)
    .join(" ")
    .replace(/-/g, " ");
  return `${palavras} Minas Gerais`;
}

async function main(): Promise<void> {
  const inventario = JSON.parse(fs.readFileSync(INVENTARIO, "utf-8")) as { rotas: Rota[] };
  const alvos = inventario.rotas.filter(
    (rota) => rota.classe === "tem-dado" && !rota.rota.includes("[")
  );
  const saida: Record<string, unknown> = {};
  let comFonte = 0;
  for (const alvo of alvos) {
    const consulta = pergunta(alvo.rota);
    const resultados = await buscarDocumentos(consulta, { limite: 4 }).catch(() => []);
    const trechos = resultados
      .filter((item) => item.trecho.pagina > 0)
      .map((item) => ({
        score: Number(item.score.toFixed(3)),
        titulo: item.trecho.titulo,
        pagina: item.trecho.pagina,
        url: item.trecho.urlPdf || item.trecho.urlOriginal,
        texto: item.trecho.texto.slice(0, 600),
      }));
    if (trechos.length) comFonte += 1;
    saida[alvo.rota] = { pergunta: consulta, semTexto: trechos.length === 0, trechos };
    console.log(`${alvo.rota}: ${trechos.length} trechos`);
  }
  fs.writeFileSync(
    DESTINO,
    JSON.stringify({ geradoEm: new Date().toISOString(), rotas: saida }, null, 1),
    "utf-8"
  );
  console.log(`rotas com fonte: ${comFonte}/${alvos.length} | ${DESTINO}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
