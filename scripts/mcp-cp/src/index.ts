#!/usr/bin/env node
/**
 * Entrada do servidor MCP do Controle Popular (transporte stdio).
 *
 * O protocolo usa stdout — por isso TODO log daqui vai para stderr.
 * Rodar: node dist/index.js (ou `npm start`). Ver docs/05-operacao/MCP-CP.md.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { carregarAcervo } from "./acervo.js";
import { criarServidor, NOME_SERVIDOR, VERSAO_SERVIDOR } from "./servidor.js";

async function principal(): Promise<void> {
  const acervo = carregarAcervo();
  console.error(
    `[mcp-cp] ${NOME_SERVIDOR} ${VERSAO_SERVIDOR} — acervo em ${acervo.diretorio}: ` +
      `${acervo.editais.length} editais, ${acervo.barragens.length} barragens, ${acervo.fontes.length} fontes.`,
  );
  for (const aviso of acervo.avisos) console.error(`[mcp-cp] aviso: ${aviso}`);

  const servidor = criarServidor(acervo);
  await servidor.connect(new StdioServerTransport());
  console.error("[mcp-cp] pronto: escutando stdio (somente leitura).");

  const encerrar = async (sinal: string): Promise<void> => {
    console.error(`[mcp-cp] ${sinal}: encerrando.`);
    await servidor.close();
    process.exit(0);
  };
  process.once("SIGINT", () => void encerrar("SIGINT"));
  process.once("SIGTERM", () => void encerrar("SIGTERM"));
}

principal().catch((erro: unknown) => {
  console.error(`[mcp-cp] falhou ao subir: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exit(1);
});
