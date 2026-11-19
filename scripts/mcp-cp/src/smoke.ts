#!/usr/bin/env node
/**
 * Verificação de ponta a ponta do MCP: sobe o servidor compilado por stdio,
 * lista as ferramentas e faz uma chamada real de cada uma, com o SDK cliente.
 *
 * Não é teste unitário (esses rodam no vitest, com fixtures). Este script prova
 * que o binário responde ao protocolo e lê o acervo de verdade.
 *
 * Rodar: npm run build && npm run smoke
 * Sai com código 1 se alguma chamada válida voltar como erro.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

import { VERSAO_SERVIDOR } from "./servidor.js";

interface Chamada {
  ferramenta: string;
  argumentos: Record<string, unknown>;
  /** true quando o resultado vazio é o esperado (prova a mensagem de "nada encontrado"). */
  vazioEsperado?: boolean;
}

const CHAMADAS: Chamada[] = [
  { ferramenta: "buscar_editais", argumentos: { termo: "credenciamento", limite: 2 } },
  { ferramenta: "buscar_editais", argumentos: { termo: "termo-que-nao-existe-xyzzy" }, vazioEsperado: true },
  { ferramenta: "listar_barragens", argumentos: { uf: "MG", limite: 2 } },
  { ferramenta: "abrir_fonte", argumentos: { id: "base:municipios-mg" } },
  {
    ferramenta: "abrir_fonte",
    argumentos: { url: "https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv" },
  },
];

function textoDe(resultado: CallToolResult): string {
  return resultado.content
    .filter((item): item is { type: "text"; text: string } => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

async function principal(): Promise<void> {
  const aqui = path.dirname(fileURLToPath(import.meta.url));
  const transporte = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(aqui, "index.js")],
    stderr: "inherit",
  });

  const cliente = new Client({ name: "mcp-cp-smoke", version: VERSAO_SERVIDOR });
  await cliente.connect(transporte);

  try {
    const { tools } = await cliente.listTools();
    console.log(`Ferramentas expostas (${tools.length}): ${tools.map((tool) => tool.name).join(", ")}`);
    if (tools.length !== 3) throw new Error(`esperava 3 ferramentas, vieram ${tools.length}`);

    let falhas = 0;
    for (const chamada of CHAMADAS) {
      const resultado = (await cliente.callTool(
        { name: chamada.ferramenta, arguments: chamada.argumentos },
        undefined,
        { timeout: 20_000 },
      )) as CallToolResult;

      console.log(`\n=== ${chamada.ferramenta} ${JSON.stringify(chamada.argumentos)}`);
      console.log(textoDe(resultado));

      if (resultado.isError) {
        falhas += 1;
        console.error(`[smoke] FALHA: ${chamada.ferramenta} devolveu isError.`);
      }
      if (chamada.vazioEsperado && !/Nenhum edital encontrado/.test(textoDe(resultado))) {
        falhas += 1;
        console.error("[smoke] FALHA: esperava a mensagem de 'nada encontrado'.");
      }
    }

    if (falhas > 0) {
      console.error(`\n[smoke] ${falhas} chamada(s) falharam.`);
      process.exitCode = 1;
    } else {
      console.log("\n[smoke] OK: 3 ferramentas responderam por stdio.");
    }
  } finally {
    await cliente.close();
  }
}

principal().catch((erro: unknown) => {
  console.error(`[smoke] falhou: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exit(1);
});
