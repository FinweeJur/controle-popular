import Link from "next/link";
import { notFound } from "next/navigation";
import CaminhoSistema from "@/app/components/CaminhoSistema";
import FooterGlobal from "@/app/components/FooterGlobal";
import ArteEixo from "@/app/components/eixos/ArteEixo";
import { eixoDe } from "@/lib/navegacao/mapa";

/**
 * @file PaginaEixo.tsx
 * @description Porta de um eixo do mapa: título, aquarela, as frentes com
 * link direto para a rota publicada e o rodapé global.
 *
 * POR QUE EXISTE (dono, 08/11/2026): "quero todo eixo com página própria e
 * publicada". `/casos` e `/direitos` ainda eram proposta e o menu caía em
 * outra frente; agora cada eixo tem porta, montada do MESMO mapa
 * (`lib/navegacao/mapa.ts`) — nenhuma lista paralela para divergir.
 *
 * Wiki do portal: um `<h1>`, trilha única (`CaminhoSistema`), texto do mapa
 * (fonte oficial da navegação) e arte decorativa com `alt`.
 */
export default function PaginaEixo({ slug }: { slug: string }) {
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

        <section aria-label={`Frentes de ${eixo.rotulo}`} className="mt-8">
          <h2 className="font-display text-xl font-bold text-text">
            Frentes do eixo ({eixo.frentes.length})
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {eixo.frentes.map((frente) => (
              <li key={frente.slug}>
                <Link
                  href={frente.rota}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-xs transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  <h3 className="font-display text-lg font-bold text-text group-hover:text-primary">
                    {frente.rotulo}
                  </h3>
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-text-soft">
                    {frente.descricao}
                  </p>
                  <span className="mt-3 text-xs font-semibold text-primary">
                    Abrir frente →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-text-soft">
          Página do eixo montada do mapa de navegação do portal. Cada frente
          abre a rota já publicada; nenhuma página nova inventa dado.
        </p>
      </main>
      <FooterGlobal />
    </>
  );
}
