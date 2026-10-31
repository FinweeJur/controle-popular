/**
 * @file scripts/vigia-fonte-minima.mts
 * @description Vigia de tipografia antes do commit (regra §5.16 do portal).
 *
 * Papel no portal:
 * - NENHUM texto de interface, rótulo, badge, parágrafo ou nota pode ser menor que 12px.
 * - Classes como `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[0.68rem]` (< 0.75rem)
 *   ou estilos inline `font-size: 9px|10px|11px` são barrados imediatamente.
 * - Este script roda no hook pre-commit (.githooks/pre-commit) e no Vitest.
 */

import fs from "node:fs";
import path from "node:path";

const EXTENSOES_ALVO = new Set([".tsx", ".ts", ".jsx", ".js", ".mjs", ".mts", ".css", ".html"]);
const PASTAS_ALVO = ["apps/web/app", "apps/web/lib", "apps/web/public"];

// Padrões que violam o tamanho mínimo de 12px (0.75rem)
const PADROES_PROIBIDOS = [
  /text-\[(?:[0-9]|10|11)px\]/g,
  /text-\[0\.(?:[0-6][0-9]*|7[0-4][0-9]*)rem\]/g,
  /font-size:\s*(?:[0-9]|10|11)px/g,
  /font-size:\s*0\.(?:[0-6][0-9]*|7[0-4][0-9]*)rem/g,
];

export interface ViolacaoFonte {
  arquivo: string;
  linha: number;
  conteudoLinha: string;
  trechoInfrator: string;
}

export function verificarArquivo(caminhoAbsoluto: string): ViolacaoFonte[] {
  const violacoes: ViolacaoFonte[] = [];
  const conteudo = fs.readFileSync(caminhoAbsoluto, "utf-8");
  const linhas = conteudo.split(/\r?\n/);

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    // Ignorar comentários que apenas citam a regex ou a regra
    if (linha.includes("PADROES_PROIBIDOS") || linha.includes("vigia-fonte-minima") || linha.includes("text-[(9|10|11)px]")) {
      continue;
    }

    for (const padrao of PADROES_PROIBIDOS) {
      padrao.lastIndex = 0;
      const match = padrao.exec(linha);
      if (match) {
        violacoes.push({
          arquivo: caminhoAbsoluto,
          linha: i + 1,
          conteudoLinha: linha.trim(),
          trechoInfrator: match[0],
        });
      }
    }
  }

  return violacoes;
}

function varrerDiretorio(dir: string): string[] {
  const arquivos: string[] = [];
  if (!fs.existsSync(dir)) return arquivos;

  const entradas = fs.readdirSync(dir, { withFileTypes: true });
  for (const entrada of entradas) {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "node_modules" || entrada.name === ".next" || entrada.name === ".git") {
        continue;
      }
      arquivos.push(...varrerDiretorio(caminho));
    } else if (EXTENSOES_ALVO.has(path.extname(entrada.name))) {
      arquivos.push(caminho);
    }
  }

  return arquivos;
}

export function verificarFontesMinimas(): ViolacaoFonte[] {
  const todasViolacoes: ViolacaoFonte[] = [];

  for (const pasta of PASTAS_ALVO) {
    const caminhoPasta = path.resolve(process.cwd(), pasta);
    const arquivos = varrerDiretorio(caminhoPasta);
    for (const arq of arquivos) {
      const v = verificarArquivo(arq);
      if (v.length > 0) {
        todasViolacoes.push(...v);
      }
    }
  }

  return todasViolacoes;
}

// Execução standalone via CLI
const ehExecucaoDireta = process.argv[1]?.endsWith("vigia-fonte-minima.mts") || process.argv[1]?.endsWith("vigia-fonte-minima.mjs");
if (ehExecucaoDireta) {
  const violacoes = verificarFontesMinimas();
  if (violacoes.length > 0) {
    console.error(`\n❌ [Vigia de Tipografia] Encontrada(s) ${violacoes.length} ocorrência(s) com fonte menor que 12px (regra §5.16)!`);
    for (const v of violacoes) {
      console.error(`  - ${v.arquivo}:${v.linha}`);
      console.error(`    Infrator: "${v.trechoInfrator}"`);
      console.error(`    Linha: ${v.conteudoLinha}\n`);
    }
    console.error("O portal exige fonte mínima de 12px (text-xs / 0.75rem). Corrija as fontes antes de comitar.");
    process.exit(1);
  } else {
    console.log("✓ [Vigia de Tipografia] Nenhuma fonte menor que 12px encontrada no portal.");
    process.exit(0);
  }
}
