/**
 * Descoberta de rotas do sitemap a partir da árvore do App Router.
 *
 * ═══ POR QUE ISTO EXISTE — MEDIDO EM PRODUÇÃO, 04/10/2026 ═══
 *
 * O `sitemap.ts` era uma lista escrita à mão. O portal passou a ter 220
 * páginas estáticas e a lista tinha 122 rotas: **147 páginas não eram
 * anunciadas ao buscador** — `/ambiental/car` (criada em 24/09), toda a
 * zona `/cidades/<uf>` (27 páginas), `/internacional`, `/assembleias`,
 * `/paraopeba/*`, e mais. Página fora do sitemap não é descoberta na
 * varredura; só o link interno eventualmente leva o Google até lá.
 *
 * A lista escrita à mão envelhece a cada página nova — ninguém lembra de
 * editar o sitemap ao criar rota. Este módulo varre o próprio `app/` e
 * devolve o inventário real. Quem cria página nova entra no sitemap sem
 * fazer nada; o teste guardião (`rotas-descobertas.test.ts`) barra o caso
 * contrário: arquivo gerado velho em relação ao código.
 *
 * ═══ POR QUE É DADO GERADO E NÃO `fs` DENTRO DO SITEMAP ═══
 *
 * O `sitemap.ts` roda no runtime do standalone (`Dockerfile` copia só
 * `.next/standalone`, não a árvore `app/`), então `fs` ali não acha
 * nada — medido olhando o Dockerfile em 04/10/2026. O mesmo já valeu para
 * a lista de cidades: `scripts/gerar-cidades.mts` congela `municipios` num
 * `.ts` versionado por esta mesma razão. Seguimos o padrão: o script
 * `scripts/gerar-rotas-sitemap.mts` varre o disco no build (onde o `app/`
 * existe) e grava `lib/sitemap/rotas-descobertas.ts`.
 *
 * Fonte de verdade: a árvore `apps/web/app/` deste checkout.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Rotas fixas que existem como `page.tsx` mas NÃO podem ir ao sitemap,
 * com o motivo de cada uma. Chave = rota relativa (ex.: `/offline`).
 *
 * Toda exclusão precisa de motivo escrito: uma página de conteúdo fora da
 * lista por engano (o caso das 147) é o mesmo estrago de uma página sem
 * conteúdo dentro dela — o buscador perde confiança no host.
 */
export const EXCLUIR: Record<string, string> = {
  // Casco de erro exibido sem rede: não tem conteúdo próprio a indexar.
  "/offline": "casco offline, sem conteudo proprio",
  // `redirect("/alertas")` — indexar a origem do redirect duplica o destino.
  "/notificacoes": "redirect para /alertas",
  // Laboratorio do pipeline RAG. O proprio cabecalho do arquivo diz que
  // "nao e uma rota publicada do portal".
  "/assistente-ia-lab": "laboratorio interno, nao publicado",
  // Painel de status do portal (oferta GitHub Pages). E pagina de SERVICO,
  // marcada `noindex` no proprio metadata — nao e conteudo para o buscador.
  "/status": "pagina de servico, noindex",
};

/**
 * Exclusões sob `[municipio]` — mesma ideia, sufixo relativo à cidade.
 * As pontes já entram aqui e não na lista global porque o sitemap as
 * anuncia por sufixo (elas se repetem em toda cidade ativa).
 */
export const EXCLUIR_SUFIXO: Record<string, string> = {
  // Painel de moderação protegido por token (`PainelAdmin.tsx`).
  "/admin": "painel interno, protegido por token",
  // Páginas-ponte de URL antiga: `noindex` + `meta refresh` para o destino.
  // Indexar a ponte duplicaria o conteúdo que o canonical já resolve.
  "/zap-betim": "ponte de URL antiga, noindex",
  "/nota-betim": "ponte de URL antiga, noindex",
  "/prefeitura/legislacao": "ponte de URL antiga, noindex",
  "/convenios": "ponte de URL antiga, noindex",
};

/** O que o varredor devolve — duas listas porque o sitemap usa as duas. */
export type RotasDescobertas = {
  /** Rotas fixas da raiz do portal, já em formato de caminho (`/cidades/mg`). */
  globais: string[];
  /** Sufixos sob `[municipio]` (`/saude`), expandidos por cidade no sitemap. */
  sufixos: string[];
};

/**
 * Varre a árvore `app/` e devolve as rotas públicas fixas.
 *
 * Regras do App Router aplicadas aqui:
 *  - segmento literal vira a rota igual (`cidades/mg` → `/cidades/mg`);
 *  - segmento dinâmico (`[slug]`, `[...resto]`) é PULADO: aquela URL
 *    precisa de dado do banco e entra no sitemap pela consulta correspondente
 *    (`rotasDeNoticias`, `getVereadores`, ...), não pelo inventário fixo;
 *  - grupo `(x)` e slot `@x` não aparecem na URL e são ignorados;
 *  - `api/` e `admin/` na raiz ficam de fora (rota de serviço, painel).
 *
 * @param dirApp caminho absoluto de `apps/web/app`
 * @returns as duas listas, ordenadas e sem duplicatas
 */
export function descobrir(dirApp: string): RotasDescobertas {
  const globais = new Set<string>();
  const sufixos = new Set<string>();

  const varrer = (dir: string, prefixo: string): void => {
    for (const entrada of readdirSync(dir, { withFileTypes: true })) {
      if (entrada.isDirectory()) {
        const nome = entrada.name;
        if (nome === "api") continue;
        if (nome === "admin") continue;
        // `(...)` e `@x` não viram segmento de URL.
        const segmento = /^[(@]/.test(nome) ? "" : `/${nome}`;
        varrer(join(dir, nome), `${prefixo}${segmento}`);
        continue;
      }
      if (entrada.name !== "page.tsx") continue;

      const caminho = prefixo === "" ? "" : prefixo;
      if (caminho === "") continue; // `/` é lista própria no sitemap

      if (caminho.startsWith("/[municipio]")) {
        // Raiz de `[municipio]` (o `page.tsx` direto) é a home da cidade:
        // o sitemap já a anuncia pelo sufixo `""` da lista manual.
        const sufixo = caminho.slice("/[municipio]".length);
        if (sufixo === "") continue;
        // Segmento dinâmico dentro da cidade (`/noticias/[slug]`).
        if (sufixo.includes("[")) continue;
        if (EXCLUIR_SUFIXO[sufixo]) continue;
        sufixos.add(sufixo);
        continue;
      }

      // Qualquer segmento dinâmico fora da cidade fica de fora por aqui.
      if (caminho.includes("[")) continue;
      if (EXCLUIR[caminho]) continue;
      globais.add(caminho);
    }
  };

  varrer(dirApp, "");

  return {
    globais: [...globais].sort(),
    sufixos: [...sufixos].sort(),
  };
}

/**
 * Confere se uma rota descoberta tem `page.tsx` de verdade — usado pelo
 * teste guardião para não aceitar arquivo gerado com caminho fantasma.
 *
 * Lê o arquivo porque o próprio `page.tsx` pode ser um redirect ou uma
 * página que responde `notFound()` sem conteúdo; o inventário só interessa
 * quando a página existe no disco.
 */
export function existePagina(dirApp: string, rota: string): boolean {
  const dir = rota === "" ? dirApp : join(dirApp, ...rota.split("/").filter(Boolean));
  try {
    readFileSync(join(dir, "page.tsx"), "utf-8");
    return true;
  } catch {
    return false;
  }
}
