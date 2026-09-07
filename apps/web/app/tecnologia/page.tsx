import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";
import TecnologiaClient from "./TecnologiaClient";

export const metadata: Metadata = metadataEditavel("/tecnologia", {
  title: "Tecnologia & IA Livre — Kit Guias AppLivre e Software Aberto | Controle Popular",
  description:
    "Kit Guias do AppLivre (applivre.pages.dev), catálogo de software livre e ferramentas open source da Floresta de Apps para defesa de direitos, fiscalização cívica e uso soberano de IA.",
});

export default function TecnologiaPage() {
  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      {/* NAVEGAÇÃO SUPERIOR */}
      <nav aria-label="Caminho de navegação" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground transition-colors">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Tecnologia & IA Livre</span>
      </nav>

      {/* CABEÇALHO DA PÁGINA */}
      <header className="mb-10 max-w-4xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span>Educação Popular & Soberania Digital</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
          Tecnologia & IA a Serviço do Povo
        </h1>

        <p className="text-base sm:text-lg text-muted leading-relaxed">
          A tecnologia mais avançada só ganha sentido quando está nas mãos de quem protege o território, fiscaliza os recursos públicos e constrói justiça. Aqui você encontra ferramentas gratuitas, projetos de código aberto (open source) e o Kit Guias do AppLivre com passos a passo práticos de como usar Inteligência Artificial com privacidade e sem mensalidades.
        </p>

        {/* EPÍGRAFE POÉTICA */}
        <div className="rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          <p>
            &ldquo;Muita gente pequena, em lugares pequenos, fazendo coisas pequenas, pode mudar o mundo.&rdquo;
          </p>
          <p className="mt-1 text-xs not-italic font-medium text-foreground">
            — Eduardo Galeano, <em>O Livro dos Abraços</em> (1989)
          </p>
        </div>
      </header>

      {/* COMPONENTE INTERATIVO DAS OFICINAS E DO CATÁLOGO */}
      <TecnologiaClient />

      {/* RODAPÉ GLOBAL */}
      <div className="mt-16">
        <FooterGlobal />
      </div>
    </main>
  );
}
