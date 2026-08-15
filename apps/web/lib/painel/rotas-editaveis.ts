import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Quais páginas estão LIGADAS para edição — descoberto lendo o código.
 *
 * ═══ POR QUE VARRER O DISCO, E NÃO MANTER UMA LISTA ═══
 *
 * Uma página só aceita edição se alguém chamou `metadataEditavel("/rota", …)`
 * nela. Uma constante com a lista de rotas seria uma segunda fonte da verdade,
 * e a segunda fonte da verdade envelhece calada: quem ligasse uma página nova e
 * esquecesse de acrescentar aqui teria um painel que não mostra o que já é
 * editável — sem erro nenhum. É o mesmo raciocínio de
 * `scripts/rotas-reservadas.mts`, que também tira a lista das pastas de `app/`
 * em vez de uma constante.
 *
 * O custo é reler alguns arquivos por requisição. O painel é uma tela local
 * usada por duas pessoas; isso não é gargalo de nada.
 *
 * ═══ LIMITE CONHECIDO, E DECLARADO NA TELA ═══
 *
 * A varredura acha `metadataEditavel("/rota"`, com a rota escrita literalmente.
 * NÃO acha as páginas de cidade, que recebem a rota pelo terceiro argumento de
 * `metadataDaCidade` e só existem no plural (`/bh/saude`, `/betim/saude`…). O
 * painel diz isso em palavras em vez de fingir cobertura total.
 */

const EXTENSOES = new Set([".tsx", ".ts"]);
const IGNORAR = new Set(["node_modules", ".next", "api"]);

export interface RotaEditavel {
  rota: string;
  /** Caminho do arquivo, relativo a `apps/web`, para a tela mostrar a origem. */
  arquivo: string;
}

function varrer(dir: string, raiz: string, achados: RotaEditavel[]): void {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(entrada.name)) continue;
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      varrer(completo, raiz, achados);
      continue;
    }
    if (!EXTENSOES.has(path.extname(entrada.name))) continue;

    let conteudo: string;
    try {
      conteudo = readFileSync(completo, "utf-8");
    } catch {
      continue;
    }
    if (!conteudo.includes("metadataEditavel")) continue;

    for (const m of conteudo.matchAll(/metadataEditavel\(\s*["'`]([^"'`]+)["'`]/g)) {
      achados.push({
        rota: m[1],
        arquivo: path.relative(raiz, completo).replace(/\\/g, "/"),
      });
    }
  }
}

export function listarRotasEditaveis(): RotaEditavel[] {
  const raiz = process.cwd();
  const achados: RotaEditavel[] = [];
  try {
    varrer(path.join(raiz, "app"), raiz, achados);
  } catch {
    return [];
  }
  return achados.sort((a, b) => a.rota.localeCompare(b.rota));
}
