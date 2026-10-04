import type { Metadata } from "next";
import NextLink from "next/link";
import { Activity } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import StatusAoVivo from "./StatusAoVivo";

/**
 * /status — página pública de status do portal.
 *
 * O QUE É: mostra, ao vivo, se o portal está no ar. A medição acontece no
 * navegador de quem abre (ver `StatusAoVivo.tsx`), para que a página continue
 * útil mesmo quando o portal está fora.
 *
 * POR QUE EXISTE: hoje, quando o portal cai, quem descobre primeiro é o
 * cidadão — numa tela de erro, no meio de uma consulta. Esta página é o
 * oposto: um lugar público e calmo que responde "sim, está no ar" ou "não,
 * estamos cientes".
 *
 * POR QUE NO GITHUB PAGES (oferta do GitHub Student Pack): o valor de um
 * painel de status é ser INDEPENDENTE do que ele vigia. A cópia publicada no
 * GitHub Pages roda em outro provedor; se a Guara cair, ela segue de pé e
 * mede o portal de fora. A cópia servida pelo próprio portal ajuda, mas é a
 * do Pages que cumpre o papel de alarme.
 *
 * DECISÕES:
 * - `force-static`: a página é HTML puro; nada de servidor. Assim ela é
 *   exportada no modo estático (GitHub Pages) sem trabalho nenhum.
 * - `robots: noindex`: página de serviço não deve competir com o conteúdo no
 *   buscador. Por isso também NÃO entra no `sitemap.ts`.
 */

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Status do portal",
  description:
    "Pagina publica que mostra, na hora, se o portal Controle Popular esta no ar — com a latencia medida do seu navegador.",
  robots: { index: false, follow: false },
};

export default function StatusPage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-3xl px-4 py-10 sm:px-8"
    >
      <nav className="mb-4 text-[.82em] text-text-soft">
        <NextLink href="/" className="hover:text-primary">
          Início
        </NextLink>{" "}
        · <span className="text-text">Status</span>
      </nav>

      <h1 className="flex items-center gap-3 font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        <Activity size={28} className="text-primary" aria-hidden="true" />
        Status do portal
      </h1>

      <p className="mt-3 max-w-2xl text-[1.02em] leading-relaxed text-text-soft">
        Esta página mostra, na hora, se o portal está no ar. A medição é feita
        pelo seu próprio navegador — nada passa por um servidor nosso.
      </p>

      <StatusAoVivo />

      <section className="mt-10 space-y-4 text-[1.02em] leading-relaxed text-text-soft">
        <h2 className="font-display text-lg font-semibold text-text">
          Como ler o resultado
        </h2>
        <p>
          <strong className="text-text">No ar</strong> quer dizer que o endereço
          respondeu dentro de 8 segundos. A marca &ldquo;(CORS)&rdquo; aparece
          quando o navegador não deixou ler o corpo da resposta — o que prova
          que o site atendeu, mas impede confirmar o conteúdo. Não é erro.
        </p>
        <p>
          <strong className="text-text">Fora do ar</strong> quer dizer que o
          endereço não respondeu. Pode ser o portal, pode ser a sua internet.
          Se as duas checagens acima estiverem fora, desconfie da sua conexão
          antes de concluir que o portal caiu.
        </p>

        <h2 className="font-display text-lg font-semibold text-text">
          O que ainda não é medido aqui
        </h2>
        <p>
          Lacuna declarada, não escondida: esta página <strong>não</strong>{" "}
          verifica o banco de dados por trás do portal nem o servidor 2 (túnel
          do PC de casa). O <code>/api/saude</code> é leve de propósito — medir
          o banco a cada batida viraria carga sem necessidade.
        </p>

        <h2 className="font-display text-lg font-semibold text-text">
          Cópia independente (GitHub Pages)
        </h2>
        <p>
          A versão do portal que você está lendo mora no mesmo servidor do
          site. Existe uma cópia publicada no GitHub Pages, em outro provedor,
          que continua no ar quando o portal cai. Ela nasce do workflow
          &ldquo;Publicar no GitHub Pages&rdquo; e fica em{" "}
          <span className="break-all text-text">
            finweejur.github.io/controle-popular/status/
          </span>
          .
        </p>
        <p>
          Enquanto o portal estiver de pé, você pode usar as duas: a do Pages é
          o alarme; esta, a de dentro. As duas medem o mesmo endereço de fora
          para dentro.
        </p>
      </section>

      <FooterGlobal />
    </main>
  );
}
