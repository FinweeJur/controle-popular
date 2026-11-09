import { notFound } from "next/navigation";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import FooterGlobal from "@/app/components/FooterGlobal";
import ArteEixo from "@/app/components/eixos/ArteEixo";
import CartaoPerguntasRota from "@/app/components/seu-nono/CartaoPerguntasRota";
import { eixoDe } from "@/lib/navegacao/mapa";
import type { ReactNode } from "react";

/**
 * @file PaginaEixo.tsx
 * @description Casca das portas de eixo (`/casos` e `/direitos`): trilha,
 * título, aquarela e o conteúdo em formato wiki que a página compõe.
 *
 * O conteúdo (`IndiceWiki`, `SecaoWiki`, `LinksRelacionados`) fica nos
 * arquivos das páginas — é o padrão wiki do portal e o porteiro de página lê
 * o `page.tsx`, não o componente escondido.
 */
export default function PaginaEixo({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const eixo = eixoDe(slug);
  if (!eixo) notFound();

  return (
    <>
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-5xl px-4 py-10 sm:py-14"
      >
        <CaminhoSistema rota={eixo.rota} />

        <header className="mt-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Eixo</p>
          <h1 className="font-display text-3xl font-bold text-text sm:text-4xl">
            {eixo.rotulo}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-text-soft sm:text-base">
            {eixo.descricao}
          </p>
        </header>

        <ArteEixo slug={eixo.slug} className="mt-6 aspect-[21/8]" prioridade />

        <CartaoPerguntasRota />

        {children}

        <p className="mt-10 text-xs leading-relaxed text-text-soft">
          Página do eixo montada do mapa de navegação do portal. Cada frente
          abre a rota já publicada; nenhuma página nova inventa dado.
        </p>
      </main>
      <FooterGlobal />
    </>
  );
}
