import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import textosSociais from "@/data/textos-sociais.json";

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
 *
 * **Canonical automático (04/10/2026).** Se a página não trouxer
 * `alternates`, este helper declara `canonical` igual à rota — resolvido
 * contra o `metadataBase` da raiz (`www`). Antes a raiz declarava
 * `canonical: "/"` e o merge raso do Next passava aquele "/" pra página
 * inteira: o Google lia `/ambiental/car` e via "duplicata da home". Página
 * sem canonical o buscador resolve sozinho; página com canonical ERRADO o
 * buscador acredita e derruba a original do índice.
 */
const TEXTOS_SOCIAIS = textosSociais as Record<
  string,
  { titulo: string; descricao: string }
>;

/**
 * Descrição de último recurso.
 *
 * Só aparece quando a página não tem `description` E não tem texto curado —
 * o caso das páginas de serviço (status, offline, ponte de URL antiga). Antes,
 * `description: ""` era emitido como `<meta property="og:description" content="">`
 * e o cartão do WhatsApp saía sem a segunda linha. Frase curta e verdadeira é
 * melhor que campo vazio, e as duas fontes de texto (curado e da página)
 * continuam tendo precedência sobre ela.
 */
const DESCRICAO_RESERVA = "Dado público com fonte oficial e link para conferir.";

/** Título de compartilhamento: sem o sufixo do site e sem cortar a frase. */
function limparTituloSocial(titulo: string): string {
  return titulo
    .replace(/\s*[|—–-]\s*Controle Popular\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Descrição curta, cortada em fim de frase quando possível. */
function cortarDescricao(texto: string, limite = 150): string {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= limite) return limpo;
  const corte = limpo.slice(0, limite);
  const ponto = Math.max(
    corte.lastIndexOf(". "),
    corte.lastIndexOf("! "),
    corte.lastIndexOf("? "),
  );
  if (ponto >= 60) return corte.slice(0, ponto + 1).trim();
  const espaco = corte.lastIndexOf(" ");
  return (espaco >= 60 ? corte.slice(0, espaco) : corte).trim();
}

export function metadataEditavel<T extends { title: string }>(
  rota: string,
  base: T
): T & {
  description?: string;
  alternates?: { canonical: string };
  openGraph?: Metadata["openGraph"];
  twitter?: Metadata["twitter"];
} {
  const editado = aplicarEdicao(rota, base);
  const chave = normalizar(rota);
  const canonical =
    (editado as { alternates?: { canonical?: string } }).alternates?.canonical ??
    chave;

  // Texto de compartilhamento: mapa escrito à mão para os eixos e frentes;
  // fallback no título/descrição da própria página, sem o sufixo do site.
  const social = TEXTOS_SOCIAIS[chave];
  const tituloSocial = social?.titulo ?? limparTituloSocial(editado.title);
  const descricao = (editado as { description?: string }).description ?? "";
  const descricaoSocial =
    social?.descricao ??
    (descricao.trim() ? cortarDescricao(descricao) : DESCRICAO_RESERVA);

  // O texto curado é o que o dono escreveu PARA O WHATSAPP: ele vence o
  // `openGraph` que a página já tinha. Antes, `ogBase.title ?? tituloSocial`
  // deixava o título da página passar na frente e o mapa curado nunca saía
  // nas rotas que já declaravam openGraph próprio (medido em /empresas/fortunas
  // e /recursos/estados, 10/11/2026). O resto do `openGraph` da página — url,
  // siteName, type, images — é preservado. Só título e descrição são nossos.
  const ogBase = (editado as { openGraph?: Metadata["openGraph"] }).openGraph;
  const twBase = (editado as { twitter?: Metadata["twitter"] }).twitter;
  const openGraph = ogBase
    ? {
        ...ogBase,
        title: tituloSocial,
        description: descricaoSocial,
      }
    : {
        title: tituloSocial,
        description: descricaoSocial,
        type: "website" as const,
        locale: "pt_BR",
        images: [
          {
            url: "/capas/home-page.webp",
            width: 1200,
            height: 630,
            alt: tituloSocial,
          },
        ],
      };
  const twitter = twBase
    ? {
        ...twBase,
        title: tituloSocial,
        description: descricaoSocial,
      }
    : {
        card: "summary_large_image" as const,
        title: tituloSocial,
        description: descricaoSocial,
      };

  return {
    ...editado,
    alternates: { canonical },
    openGraph,
    twitter,
  } as T & {
    description?: string;
    alternates?: { canonical: string };
    openGraph?: Metadata["openGraph"];
    twitter?: Metadata["twitter"];
  };
}

/** Todas as edições, para o script de listagem e para uma futura tela. */
export function listarEdicoes(): Edicao[] {
  return [...carregar().values()].sort((a, b) => a.rota.localeCompare(b.rota));
}
