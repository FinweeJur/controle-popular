/**
 * @file apps/web/lib/assistente/sugestoes-busca.ts
 * @description Sugestões em tempo real da barra do Seu Nonô — o pedido do dono
 * (03/10/2026): enquanto a pessoa digita na janelinha do assistente, o portal
 * mostra na hora o que já sabe responder.
 *
 * Papel no portal: a janelinha deixou de abrir com o botão "Perguntar à IA" e
 * passou a abrir com uma barra de busca fixa. Esta função é a única fonte das
 * sugestões que aparecem acima dela. Ela NÃO inventa um motor novo: junta o que
 * a busca geral do portal já usa.
 *
 * Fontes oficiais reaproveitadas (nada recriado):
 * - `buscarPaginasPortal` (`lib/busca/paginas-portal.ts`): o MESMO catálogo de
 *   páginas/hubs que a `/busca` e a `BuscaGlobal` usam para os "Páginas e Hubs
 *   do Portal" — tolerante a acento porque passa por `separarPalavras`.
 * - `interpretar` (`lib/assistente/navegacao.ts`): o miolo determinístico
 *   texto → destino, com a guarda de lugar (não manda "saúde em Uberlândia"
 *   para uma cidade que o portal não atende).
 * - `avaliarEscadaDeterminista` (`lib/assistente/escada-determinista.ts`): a
 *   Regra de Escada. Aqui só aproveitamos o degrau `curada` — a resposta
 *   pré-curada, que é o que a barra destaca em cima da lista.
 *
 * Decisões não triviais:
 * - A curadoria só entra quando o degrau devolve `tipo === "curada"`. Página o
 *   degrau também devolve, mas já é coberta (melhor, e em lista) por
 *   `buscarPaginasPortal`; duplicar deixaria a lista com o mesmo destino duas
 *   vezes.
 * - O contexto passado às regras é o PRIMEIRO segmento do caminho (ex.:
 *   "ambiental", "betim"), não o caminho inteiro: é o valor que
 *   `buscarRespostaCurada` espera para desambiguar zona e prefixar link de
 *   cidade.
 * - Teto de 6 sugestões: a barra é uma janelinha pequena, e lista longa deixa
 *   de ser escolha para virar outra busca (mesma razão do `LIMITE_CANDIDATOS`).
 * - Vazio é resposta: termo com menos de 2 letras não sugere nada, e termo sem
 *   casamento devolve lista vazia — quem decide acionar a IA é a barra, no
 *   Enter.
 */

import { buscarPaginasPortal } from "@/lib/busca/paginas-portal";
import { interpretar } from "./navegacao";
import { avaliarEscadaDeterminista, type ResultadoEscada } from "./escada-determinista";

/** Uma sugestão de navegação — página/hub do portal ou destino do catálogo. */
export interface SugestaoPagina {
  /** De onde a sugestão veio, para o ícone e para o teste. */
  tipo: "pagina" | "navegacao";
  /** Chave estável dentro da lista (o id do catálogo ou `nav:<href>`). */
  id: string;
  titulo: string;
  descricao: string;
  /** Caminho ABSOLUTO. Navegação interna sempre client-side (AGENTS §5.13). */
  href: string;
  /** Chip curto da fonte, quando a página traz um (ex.: "SEMAD · MG"). */
  rotulo?: string;
  /** Cidade do destino, quando é rota de cidade. */
  contexto?: string;
}

/** O que a barra do Seu Nonô desenha a cada tecla. */
export interface SugestoesBuscaNono {
  /** Resposta pré-curada pronta (Regra de Escada), se houver. */
  curada: ResultadoEscada | null;
  /** Páginas/hubs e destinos do portal, já sem repetição de href. */
  paginas: SugestaoPagina[];
}

/** Termo curto demais não busca: 1 letra casa com meio portal. */
export const MINIMO_TERMO_BUSCA = 2;

/** Teto de sugestões de navegação exibidas de uma vez. */
export const LIMITE_SUGESTOES = 6;

const VAZIO: SugestoesBuscaNono = { curada: null, paginas: [] };

/**
 * Monta as sugestões da barra do Seu Nonô para o termo digitado.
 *
 * @param termo     O que a pessoa digitou (com ou sem acento).
 * @param pathname  Caminho atual da página, para o contexto de zona/cidade.
 * @returns A curadoria (ou `null`) e a lista de páginas/destinos sem repetir.
 */
export function montarSugestoesBuscaNono(
  termo: string,
  pathname?: string | null
): SugestoesBuscaNono {
  const limpo = termo.trim();
  if (limpo.length < MINIMO_TERMO_BUSCA) return VAZIO;

  // O primeiro segmento do caminho é a zona ("ambiental") ou a cidade
  // ("betim") — é o vocabulário que a curadoria entende.
  const contexto = (pathname ?? "").split("/").filter(Boolean)[0];
  const degrau = avaliarEscadaDeterminista(limpo, contexto || pathname || undefined);
  const curada = degrau && degrau.tipo === "curada" ? degrau : null;

  const vistos = new Set<string>();
  const paginas: SugestaoPagina[] = [];
  const adicionar = (s: SugestaoPagina) => {
    if (vistos.has(s.href)) return;
    vistos.add(s.href);
    paginas.push(s);
  };

  // 1. Páginas e hubs do portal (o mesmo catálogo da busca geral).
  for (const p of buscarPaginasPortal(limpo, LIMITE_SUGESTOES)) {
    adicionar({
      tipo: "pagina",
      id: p.id,
      titulo: p.titulo,
      descricao: p.descricao,
      href: p.href,
      rotulo: p.rotulo,
    });
  }

  // 2. Destinos do catálogo (cidade + sufixo, rotas gerais). A guarda de lugar
  //    de `interpretar` já devolve vazio quando a pessoa nomeou lugar que o
  //    portal não atende — vazio é resposta, não palpite.
  for (const c of interpretar(limpo)) {
    adicionar({
      tipo: "navegacao",
      id: `nav:${c.destino.href}`,
      titulo: c.destino.titulo,
      descricao: c.destino.contexto ?? c.destino.titulo,
      href: c.destino.href,
      contexto: c.destino.contexto,
    });
  }

  return {
    curada,
    paginas: paginas.slice(0, LIMITE_SUGESTOES),
  };
}
