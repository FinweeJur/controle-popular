import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Sobreposição de título e descrição, editável sem tocar em código.
 *
 * Fase 1 de `docs/PLANO-PAINEL-EDICAO.md`: resolver o caso de uso mais comum
 * — "corrigir um erro de digitação no título de uma página" — sem exigir um
 * commit de código nem tocar em nada arquitetural.
 *
 * ## Por que arquivo versionado, e não tabela
 *
 * O plano previa "tabela + espelho em git". Aqui é só o arquivo, e a razão é
 * a mesma que já valeu para o radar e para o risco climático: o banco é o
 * gargalo (Neon em HTTP 402 até 01/09) e este dado é minúsculo e sem junção.
 * O arquivo dá de graça as duas coisas que o plano pedia para a trilha —
 * histórico legível (`git log -p apps/web/data/edicoes.json` mostra quem
 * mudou o quê e quando) e desfazer (`git revert`).
 *
 * ## Por que a edição NÃO aparece sozinha no site
 *
 * O site é estático: `next build` imprime o HTML. Editar aqui muda o arquivo
 * na hora e muda o site **no próximo build**. É a assimetria que o plano faz
 * questão de deixar visível — "salvar" e "publicar" são ações diferentes, e um
 * painel que finge o contrário é pior que nenhum.
 *
 * ## Segurança
 *
 * Não há superfície web: quem edita é `scripts/editar-pagina.mts`, na linha de
 * comando da máquina de build. O plano dedica uma seção inteira a por que o
 * painel não pode estar na internet; um CLI resolve o mesmo caso de uso com
 * superfície de ataque zero. O painel web fica para quando alguém que não usa
 * terminal precisar editar.
 */

export interface Edicao {
  /** Rota exata, como aparece na URL: "/betim/saude", "/paraopeba/clipping". */
  rota: string;
  titulo?: string;
  descricao?: string;
  /** Quem editou — nome, não login: isto é trilha para humano. */
  por: string;
  /** ISO. Quando a edição foi gravada, não quando foi publicada. */
  em: string;
  /** Por que mudou. Obrigatório: edição sem motivo é edição que ninguém audita. */
  motivo: string;
}

let cache: Map<string, Edicao> | null = null;

function carregar(): Map<string, Edicao> {
  if (cache) return cache;
  cache = new Map();
  try {
    const caminho = path.join(process.cwd(), "data", "edicoes.json");
    const dados = JSON.parse(readFileSync(caminho, "utf-8")) as { edicoes?: Edicao[] };
    for (const e of dados.edicoes ?? []) cache.set(normalizar(e.rota), e);
  } catch {
    // Arquivo ausente é o estado normal de quem nunca editou nada. Não é erro,
    // e não pode derrubar o build.
  }
  return cache;
}

/** Sem barra final, sempre com barra inicial — "/bh/" e "bh" viram "/bh". */
function normalizar(rota: string): string {
  const limpa = rota.trim().replace(/\/+$/, "");
  return limpa.startsWith("/") ? limpa : `/${limpa}`;
}

/**
 * Aplica a sobreposição sobre o título e a descrição gerados pelo código.
 *
 * O código continua sendo a fonte padrão: a sobreposição só troca o campo que
 * ela declara. Uma edição que muda só o título deixa a descrição como o código
 * a calcula — inclusive os números, que continuam vindo da contagem real.
 */
export function aplicarEdicao<T extends { title: string }>(
  rota: string,
  base: T
): T & { description?: string } {
  const e = carregar().get(normalizar(rota));
  if (!e) return base;
  return {
    ...base,
    title: e.titulo ?? base.title,
    description: e.descricao ?? (base as { description?: string }).description,
  };
}

/**
 * Versão pronta para `export const metadata` de uma página estática.
 *
 *   export const metadata = metadataEditavel("/paraopeba/entenda", {
 *     title: "Entenda o caso — Paraopeba | Controle Popular",
 *     description: "...",
 *   });
 *
 * A rota é escrita à mão porque o Next não expõe a própria rota a um objeto
 * `metadata` estático. Uma rota errada aqui não quebra nada: a edição
 * simplesmente não encontra a página, e o texto do código continua valendo.
 */
export function metadataEditavel<T extends { title: string }>(
  rota: string,
  base: T
): T & { description?: string } {
  return aplicarEdicao(rota, base);
}

/** Todas as edições, para o script de listagem e para uma futura tela. */
export function listarEdicoes(): Edicao[] {
  return [...carregar().values()].sort((a, b) => a.rota.localeCompare(b.rota));
}
