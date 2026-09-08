/**
 * SERVER-ONLY: Remunerações e contracheques de magistrados e juízes (CNJ / Brasil.IO).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export interface FolhaMagistrado {
  nome: string;
  cargo: string;
  tribunal: string;
  uf: string;
  remuneracaoBase: number;
  outrasVerbas: number;
  totalLiquido: number;
  mesAno: string;
}

export interface AcervoRemuneracoesJudiciario {
  geradoEm: string;
  fonte: string;
  ressalvaEditorial: string;
  totalContrachequesAnalisados: number;
  tribunais: {
    sigla: string;
    nome: string;
    totalGasto: number;
    magistrados: FolhaMagistrado[];
  }[];
}

let cache: AcervoRemuneracoesJudiciario | null | undefined;

export function carregarRemuneracoesJudiciario(): AcervoRemuneracoesJudiciario | null {
  if (cache !== undefined) return cache;
  try {
    const caminho = path.join(process.cwd(), "data", "judiciario-remuneracoes.json");
    const bruto = readFileSync(caminho, "utf-8");
    cache = JSON.parse(bruto) as AcervoRemuneracoesJudiciario;
    return cache;
  } catch {
    try {
      const caminhoAlt = path.join(process.cwd(), "apps", "web", "data", "judiciario-remuneracoes.json");
      const bruto = readFileSync(caminhoAlt, "utf-8");
      cache = JSON.parse(bruto) as AcervoRemuneracoesJudiciario;
      return cache;
    } catch {
      cache = null;
      return null;
    }
  }
}
