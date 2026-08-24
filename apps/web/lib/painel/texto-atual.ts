import { readFileSync } from "node:fs";
import path from "node:path";
import { listarRotasEditaveis } from "./rotas-editaveis";

/**
 * O texto atual de uma página ligada, extraído do código — o que uma edição
 * vai substituir.
 *
 * O painel precisa mostrar "o que está no ar hoje" antes de alguém salvar uma
 * edição; sem isso, quem edita não sabe o que está retirando. O texto no ar é
 * o que o código gera (o build estático não re-renderiza por conta própria):
 *
 *   metadataEditavel("/rota", { title: "...", description: "..." })
 *
 * ═══ LIMITES, DITOS EM VOZ ALTA ═══
 *
 * - Só lê LITERAIS (aspas simples, duplas ou template sem `${...}`). Se o
 *   título ou a descrição forem calculados no código (`${formatNumberBR(…)}`,
 *   `f() + " x"`…), a extração devolve `null` e a tela diz "calculado no
 *   código — confira a página" em vez de inventar um texto.
 * - A extração é do objeto base; uma edição gravada e PUBLICADA já vira texto
 *   do código no próximo build, então o que aparece aqui é o que está no ar.
 * - Rotas quebradas (scanner achou, arquivo sumiu) devolvem `null` sem erro:
 *   o painel mostra o texto como desconhecido e segue.
 */

export interface TextoAtualDaRota {
  rota: string;
  titulo: string | null;
  descricao: string | null;
  /** true quando o texto foi calculado no código e não é literal. */
  calculado: boolean;
}

function acharValor(bloco: string, campo: "title" | "description"): string | null {
  const re = new RegExp(`${campo}\\s*:\\s*(["'\`])`);
  const m = re.exec(bloco);
  if (!m) return null;
  const aspas = m[1];
  const restante = bloco.slice(m.index + m[0].length);
  if (aspas === "`") {
    if (restante.includes("${")) return null;
    const fim = restante.indexOf("`");
    return fim < 0 ? null : restante.slice(0, fim);
  }
  let fim = -1;
  for (let i = 0; i < restante.length; i++) {
    if (restante[i] === "\\") { i++; continue; }
    if (restante[i] === aspas) { fim = i; break; }
  }
  if (fim < 0) return null;
  return restante.slice(0, fim).replace(/\\(["'\\])/g, "$1");
}

/**
 * Extrai o objeto base de `metadataEditavel("rota", { … })` de um arquivo.
 * Devolve null se o arquivo não contém a chamada ou o objeto não fecha.
 */
function extrairBloco(conteudo: string, _rota: string): string | null {
  const re = /metadataEditavel\(\s*["'`]([^"'`]+)["'`]\s*,\s*\{/;
  const m = re.exec(conteudo);
  if (!m) return null;
  const inicio = m.index + m[0].length - 1; // aponta para o "{" do objeto
  let profundidade = 0;
  for (let i = inicio; i < conteudo.length; i++) {
    const c = conteudo[i];
    if (c === '"' || c === "'") {
      const aspas = c;
      i++;
      while (i < conteudo.length) {
        if (conteudo[i] === "\\") { i += 2; continue; }
        if (conteudo[i] === aspas) break;
        i++;
      }
      continue;
    }
    if (c === "`") {
      i++;
      let expr = 0;
      while (i < conteudo.length) {
        if (conteudo[i] === "\\") { i += 2; continue; }
        if (conteudo[i] === "$" && conteudo[i + 1] === "{") { expr++; i += 2; continue; }
        if (conteudo[i] === "}" && expr > 0) { expr--; i++; continue; }
        if (conteudo[i] === "`" && expr === 0) { i++; break; }
        i++;
      }
      continue;
    }
    if (c === "{") profundidade++;
    if (c === "}") {
      profundidade--;
      if (profundidade === 0) return conteudo.slice(inicio, i + 1);
    }
  }
  return null;
}

/** Texto atual de uma rota ligada, lido do código. Nunca lança. */
export function textoAtualDaRota(rota: string): TextoAtualDaRota {
  const base: TextoAtualDaRota = { rota, titulo: null, descricao: null, calculado: false };
  let arquivo: string | null = null;
  try {
    arquivo =
      listarRotasEditaveis().find((r) => r.rota === rota)?.arquivo ?? null;
    if (!arquivo) return base;
    const conteudo = readFileSync(path.join(process.cwd(), arquivo), "utf-8");
    const bloco = extrairBloco(conteudo, rota);
    if (!bloco) return base;
    const titulo = acharValor(bloco, "title");
    const descricao = acharValor(bloco, "description");
    const calculado =
      (titulo === null && /title\s*:/.test(bloco)) ||
      (descricao === null && /description\s*:/.test(bloco));
    return { rota, titulo, descricao, calculado };
  } catch {
    return base;
  }
}