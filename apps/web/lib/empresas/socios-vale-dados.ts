/**
 * SERVER-ONLY: rede de sócios e diretores da Vale S.A., lida de
 * `apps/web/data/socios-vale.json` — gerado pelo coletor
 * `scripts/coletar-socios-brasilio.mts` a partir do dataset `socios-brasil` do brasil.io.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export interface SocioVale {
  nome: string;
  tipoPessoa: string;
  qualificacao: string;
  dataEntrada: string | null;
  cpfCnpjMascarado: string | null;
}

export interface AcervoSociosVale {
  geradoEm: string;
  fonte: string;
  raizCNPJ: string;
  ressalvaEditorial: string;
  socios: SocioVale[];
}

let cache: AcervoSociosVale | null | undefined;

export function carregarSociosVale(): AcervoSociosVale | null {
  if (cache !== undefined) return cache;
  try {
    const caminho = path.join(process.cwd(), "data", "socios-vale.json");
    const bruto = readFileSync(caminho, "utf-8");
    cache = JSON.parse(bruto) as AcervoSociosVale;
    return cache;
  } catch {
    try {
      const caminhoAlt = path.join(process.cwd(), "apps", "web", "data", "socios-vale.json");
      const bruto = readFileSync(caminhoAlt, "utf-8");
      cache = JSON.parse(bruto) as AcervoSociosVale;
      return cache;
    } catch {
      cache = null;
      return null;
    }
  }
}
