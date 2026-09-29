/**
 * @file scripts/agent-tools/vigia-dados-etl.mts
 * @description Módulo de telemetria e diagnóstico contínuo de saúde para bases de dados e pipelines ETL.
 *
 * Papel no portal:
 * Integra o cão de guarda do servidor (vigia-servidor.mts) para inspecionar de forma automatizada:
 * 1. A integridade e o volume de todas as bases JSON existentes em `apps/web/data/` e subdiretórios.
 * 2. A detecção de arquivos vazios (0 bytes), vazios de conteúdo (0 registros ou []) e corrompidos (JSON inválido).
 * 3. O índice de frescor (staleness) das bases de atualização frequente, alertando se ficarem estagnadas.
 * 4. O andamento e checkpoints dos pipelines de ETL em `scripts/` e `etl/`, apontando coletores travados.
 *
 * Fontes e regras de negócio:
 * - Acervos públicos monitorados (ANM, SEMAD, IBAMA, PNCP, Diários Oficiais, ComunicaBR, etc.).
 * - Regra das seis qualidades (AGENTS.md §8): bases de dados nunca podem ser expostas desertas ou corrompidas.
 * - Silent watchdog pattern: emite métricas silenciosas quando 100% saudável e gera alertas resumidos
 *   no Telegram estritamente quando há incidentes reais de vacuidade ou quebra.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIRETORIO_DADOS = path.join(RAIZ, "apps", "web", "data");

export interface RelatorioSaudeBasesETL {
  atualizadoEm: string;
  totalBasesVerificadas: number;
  basesVazias: string[];
  basesCorrompidas: string[];
  basesEstagnadas: { arquivo: string; diasSemAtualizar: number }[];
  etlsComFalha: string[];
  etlsPendentes: string[];
  statusGeral: "SAUDAVEL" | "ALERTA" | "CRITICO";
  resumoLinhas: string[];
}

/**
 * Coleta recursivamente todos os caminhos de arquivos JSON em um diretório.
 */
function listarArquivosJson(dir: string): string[] {
  let resultados: string[] = [];
  if (!fs.existsSync(dir)) return resultados;

  const entradas = fs.readdirSync(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const caminhoCompleto = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      resultados = resultados.concat(listarArquivosJson(caminhoCompleto));
    } else if (entrada.isFile() && entrada.name.endsWith(".json")) {
      resultados.push(caminhoCompleto);
    }
  }
  return resultados;
}

/**
 * Avalia o volume de registros contido no JSON parseado.
 */
function contarRegistrosJson(obj: unknown): number {
  if (Array.isArray(obj)) return obj.length;
  if (obj && typeof obj === "object") {
    // Se for formato de dados compactados com registros ou itens
    const dicionario = obj as Record<string, unknown>;
    if (Array.isArray(dicionario.registros)) return dicionario.registros.length;
    if (Array.isArray(dicionario.itens)) return dicionario.itens.length;
    if (Array.isArray(dicionario.dados)) return dicionario.dados.length;
    if (Array.isArray(dicionario.linhas)) return dicionario.linhas.length;
    return Object.keys(dicionario).length;
  }
  return 0;
}

/**
 * Executa a auditoria completa de bases de dados locais e estado dos ETLs.
 */
export function vigiarSaudeBasesEEtl(): RelatorioSaudeBasesETL {
  const arquivos = listarArquivosJson(DIRETORIO_DADOS);
  const basesVazias: string[] = [];
  const basesCorrompidas: string[] = [];
  const basesEstagnadas: { arquivo: string; diasSemAtualizar: number }[] = [];
  const agora = Date.now();
  const MS_POR_DIA = 24 * 60 * 60 * 1000;

  for (const caminho of arquivos) {
    const nomeRelativo = path.relative(RAIZ, caminho).replace(/\\/g, "/");

    try {
      const stats = fs.statSync(caminho);
      if (stats.size === 0) {
        basesVazias.push(`${nomeRelativo} (0 bytes)`);
        continue;
      }

      const conteudo = fs.readFileSync(caminho, "utf-8");
      const parsed = JSON.parse(conteudo);
      const totalRegistros = contarRegistrosJson(parsed);

      if (totalRegistros === 0) {
        basesVazias.push(`${nomeRelativo} (0 registros)`);
      }

      // Checagem de estagnação: arquivos vitais com mais de 30 dias sem toque
      const diasIdade = Math.floor((agora - stats.mtimeMs) / MS_POR_DIA);
      if (diasIdade > 60 && !nomeRelativo.includes("municipios-mg.json")) {
        basesEstagnadas.push({ arquivo: nomeRelativo, diasSemAtualizar: diasIdade });
      }
    } catch {
      basesCorrompidas.push(nomeRelativo);
    }
  }

  // Checagem dos ETLs e Checkpoints
  const etlsComFalha: string[] = [];
  const etlsPendentes: string[] = [];

  // 1. Inspecionar status de fontes coletadas pelo PicoClaw
  const picoclawStatusPath = path.join(RAIZ, "docs", "relatorios-automacao", "picoclaw-fontes-status.json");
  if (fs.existsSync(picoclawStatusPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(picoclawStatusPath, "utf-8"));
      if (Array.isArray(raw)) {
        for (const item of raw) {
          if (item && item.status && item.status !== 200 && item.status !== 304) {
            etlsComFalha.push(`Fonte ${item.nome || item.url}: status ${item.status}`);
          }
        }
      }
    } catch {}
  }

  // 2. Inspecionar checkpoints de progresso de raspagem
  const checkBetim = path.join(RAIZ, "etl", "betim", ".progresso-vales.json");
  if (fs.existsSync(checkBetim)) {
    try {
      const betimProg = JSON.parse(fs.readFileSync(checkBetim, "utf-8"));
      if (betimProg.pendentes && betimProg.pendentes.length > 0) {
        etlsPendentes.push(`ETL Vales: ${betimProg.pendentes.length} municípios pendentes`);
      }
    } catch {}
  }

  let statusGeral: "SAUDAVEL" | "ALERTA" | "CRITICO" = "SAUDAVEL";
  if (basesCorrompidas.length > 0 || basesVazias.length > 0) {
    statusGeral = "CRITICO";
  } else if (basesEstagnadas.length > 5 || etlsComFalha.length > 2) {
    statusGeral = "ALERTA";
  }

  const resumoLinhas: string[] = [
    `Bases verificadas: ${arquivos.length} arquivos JSON`,
    `Bases vazias ou zeradas: ${basesVazias.length}`,
    `Bases corrompidas: ${basesCorrompidas.length}`,
    `Bases com estagnação (>60d): ${basesEstagnadas.length}`,
    `Fontes/ETLs com status adverso: ${etlsComFalha.length}`,
  ];

  return {
    atualizadoEm: new Date().toISOString(),
    totalBasesVerificadas: arquivos.length,
    basesVazias,
    basesCorrompidas,
    basesEstagnadas,
    etlsComFalha,
    etlsPendentes,
    statusGeral,
    resumoLinhas,
  };
}

// Execução direta via CLI para testes ou diagnósticos
if (process.argv[1] && process.argv[1].endsWith("vigia-dados-etl.mts")) {
  console.log("🛡️  Executando varredura de integridade de bases de dados e ETLs...");
  const relatorio = vigiarSaudeBasesEEtl();
  console.log(JSON.stringify(relatorio, null, 2));
}
