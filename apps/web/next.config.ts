import type { NextConfig } from "next";

/**
 * App único do monorepo, servindo as três zonas em rotas próprias:
 * `/betim`, `/congresso` e `/judiciario`.
 *
 * O que saiu daqui na unificação:
 * - `basePath`: um app tem UM basePath, e agora são três zonas. O prefixo
 *   passou a ser o próprio diretório da rota, e o que o basePath fazia por
 *   `next/link` é feito pelo `<Link>` de cada zona (`lib/link-zona.tsx`).
 * - os `rewrites()` de proxy para `controle-popular-congresso.vercel.app`
 *   e `...-judiciario.vercel.app`: as zonas irmãs eram deploys separados e
 *   agora são diretórios do mesmo build. Some o salto de rede.
 * - os `redirects()` de `/` das zonas e o `vercel.json` do Betim (que
 *   reescrevia `/` para `/betim/hub`): a home real agora é `app/page.tsx`.
 *
 * As URLs públicas continuam idênticas às de produção — essa foi a razão
 * de mover cada app para `app/<zona>/` em vez de achatá-los na raiz.
 */
const nextConfig: NextConfig = {
  experimental: {
    /**
     * Fase 6: o prerender das 354 páginas de `/congresso/bancadas/[id]` bateu
     * no endpoint HTTP do Neon com a concorrência padrão (8) e DUAS páginas
     * morreram com `fetch failed` / "took more than 60 seconds" — o build
     * seguia e publicava um Worker com páginas faltando, sem falhar.
     *
     * Cada bancada faz um join que devolve ~200 membros (os `.cache` saem com
     * 1,8 MB), então o gargalo é o banco, não a CPU do build. Baixar a
     * concorrência e permitir retry troca alguns minutos de build por um
     * build determinístico — que é o que importa quando a saída vai virar
     * SSG servido de Static Assets.
     */
    staticGenerationMaxConcurrency: 3,
    staticGenerationRetryCount: 3,
  },
  async redirects() {
    return [
      // A home da marca era servida em `/betim/hub` (e chegava em `/` por
      // rewrite do vercel.json). Agora ela É `/`. Este redirect existe só
      // para não quebrar link salvo ou indexado na URL antiga: verificado
      // por diff das tabelas de rota, `/betim/hub` é a ÚNICA URL pública
      // que mudou na unificação — as outras 77 continuam idênticas.
      { source: "/betim/hub", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
