import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";

import type { Edicao } from "@/lib/edicoes";

/**
 * Leitura e escrita de `data/edicoes.json` para o painel de edição.
 *
 * ═══ POR QUE EXISTE, SE `scripts/editar-pagina.mts` JÁ GRAVA ═══
 *
 * O script é um processo de linha de comando: lê, grava, morre. O painel é um
 * servidor que atende várias requisições, e as regras que o script podia
 * deixar implícitas (o arquivo pode não existir; duas gravações não podem se
 * atropelar; um campo em branco não é edição) precisam virar função com nome
 * aqui. Os dois escrevem o MESMO formato, de propósito — quem editar pelo
 * terminal e quem editar pela tela produzem o mesmo commit.
 *
 * ═══ SÓ É IMPORTADO POR ROTA `*.local.ts` ═══
 *
 * Este arquivo usa `node:fs` e escreve no disco do repositório. Ele nunca
 * chega ao Worker publicado porque só é importado pelas rotas do painel, e
 * `next.config.ts` mantém a extensão `.local.ts` fora de qualquer build (ver
 * o bloco `painelLocalLigado` lá).
 */

/**
 * Resolvido a CADA chamada, não uma vez no topo do módulo.
 *
 * `const ARQUIVO = path.join(process.cwd(), …)` no topo prende o caminho ao
 * diretório vigente no primeiro `import`. No app isso não se nota, porque o
 * `cwd` nunca muda — mas foi assim que a primeira versão daqui quebrou os
 * testes, que trocam de diretório a cada caso, e o defeito é real: qualquer
 * processo que mude de diretório passaria a gravar no lugar errado sem avisar.
 */
function arquivo(): string {
  return path.join(process.cwd(), "data", "edicoes.json");
}

export interface ArquivoDeEdicoes {
  edicoes: Edicao[];
}

/** Chave de comparação: rota normalizada sem barra final, minúscula. */
export function normalizarRota(rota: string): string {
  const limpa = rota.trim().toLowerCase();
  const semBarra = limpa.length > 1 ? limpa.replace(/\/+$/, "") : limpa;
  return semBarra.startsWith("/") ? semBarra : `/${semBarra}`;
}

/**
 * Arquivo ausente devolve lista vazia em vez de estourar — é o estado normal
 * de um `git clone` antes da primeira edição, e o painel precisa abrir para
 * a pessoa fazer a primeira.
 */
export function lerEdicoes(): Edicao[] {
  try {
    const dados = JSON.parse(readFileSync(arquivo(), "utf-8")) as ArquivoDeEdicoes;
    return dados.edicoes ?? [];
  } catch {
    return [];
  }
}

/**
 * Grava com indentação de 2 e `\n` no fim — o mesmo formato que
 * `editar-pagina.mts` produz. Isso não é estética: formato divergente faria
 * o `git diff` de uma edição pela tela mostrar o arquivo inteiro reescrito,
 * e a trilha por `git log -p` (que é a única que existe) viraria ilegível.
 */
export function gravarEdicoes(edicoes: Edicao[]): void {
  mkdirSync(path.dirname(arquivo()), { recursive: true });
  const ordenadas = [...edicoes].sort((a, b) => a.rota.localeCompare(b.rota));
  writeFileSync(arquivo(), `${JSON.stringify({ edicoes: ordenadas }, null, 2)}\n`, "utf-8");
}

export interface ResultadoDeGravacao {
  ok: boolean;
  erro?: string;
  edicoes: Edicao[];
}

/**
 * Insere ou substitui a edição de uma rota.
 *
 * `por` e `motivo` são obrigatórios pela mesma razão que no script: edição
 * sem motivo é edição que ninguém audita depois. E título e descrição vazios
 * nos dois campos ao mesmo tempo não é edição — é remoção disfarçada, que
 * tem função própria (`removerEdicao`) e mensagem própria na tela.
 */
export function salvarEdicao(entrada: {
  rota: string;
  titulo?: string;
  descricao?: string;
  por: string;
  motivo: string;
  em: string;
}): ResultadoDeGravacao {
  const rota = normalizarRota(entrada.rota);
  const titulo = entrada.titulo?.trim() || undefined;
  const descricao = entrada.descricao?.trim() || undefined;
  const por = entrada.por.trim();
  const motivo = entrada.motivo.trim();

  if (!por) return { ok: false, erro: "Quem editou é obrigatório.", edicoes: lerEdicoes() };
  if (!motivo) return { ok: false, erro: "O motivo é obrigatório.", edicoes: lerEdicoes() };
  if (!titulo && !descricao) {
    return {
      ok: false,
      erro: "Título e descrição vazios não é edição — use remover para voltar ao padrão.",
      edicoes: lerEdicoes(),
    };
  }

  const atuais = lerEdicoes().filter((e) => normalizarRota(e.rota) !== rota);
  atuais.push({ rota, titulo, descricao, por, motivo, em: entrada.em });
  gravarEdicoes(atuais);
  return { ok: true, edicoes: lerEdicoes() };
}

export function removerEdicao(rota: string): ResultadoDeGravacao {
  const alvo = normalizarRota(rota);
  const antes = lerEdicoes();
  const depois = antes.filter((e) => normalizarRota(e.rota) !== alvo);
  if (depois.length === antes.length) {
    return { ok: false, erro: "Não havia edição gravada para esta rota.", edicoes: antes };
  }
  gravarEdicoes(depois);
  return { ok: true, edicoes: lerEdicoes() };
}

/**
 * Autenticação do painel — token PRÓPRIO, nunca o `ADMIN_TOKEN`.
 *
 * O plano é explícito: o `ADMIN_TOKEN` já circula no `.env` de duas máquinas
 * para um uso de risco menor (aprovar classificado), e reusá-lo aqui
 * ampliaria o raio de um vazamento que já existe para "apaga página do ar".
 *
 * Fail-closed: sem `PAINEL_TOKEN` no ambiente, nega tudo. Um painel que
 * "libera quando não há token configurado" é um painel aberto na primeira vez
 * que alguém esquecer o `.env.local`.
 *
 * Comparação em tempo constante. O painel só escuta em localhost/tailnet, mas
 * comparar segredo com `===` é o tipo de detalhe que se copia para um lugar
 * exposto depois.
 */
export function painelAutorizado(request: Request): boolean {
  const esperado = process.env.PAINEL_TOKEN;
  if (!esperado) return false;

  const header = request.headers.get("authorization") ?? "";
  const [esquema, valor] = header.split(" ");
  if (esquema !== "Bearer" || !valor) return false;

  const a = Buffer.from(valor);
  const b = Buffer.from(esperado);
  // `timingSafeEqual` estoura se os tamanhos diferem; o tamanho não é segredo.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
