import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import { listarConselhos, contagemConselhosPorCategoria } from "@/lib/conselhos/catalogo";
import PainelConselhosClient from "./PainelConselhosClient";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  MiniSumarioLateral,
  LinksRelacionados,
} from "@/app/components/wiki";

export const metadata: Metadata = metadataEditavel("/direitos-em-movimento/conselhos", {
  title: "Conselhos de Direitos e Colegiados Participativos — Controle Popular",
  description:
    "Catálogo nacional de conselhos de saúde (CMS/CES/CNS), direitos humanos (CMDH/CEDH), direitos da mulher, juventude, tutelares e CODEMAs dos 27 estados e cidades estratégicas.",
  keywords: [
    "conselhos-de-direitos",
    "conselho-municipal-saude",
    "codema",
    "direitos-humanos",
    "conselho-tutelar",
    "participacao-social",
    "controle-social",
    "cns",
    "conama",
    "copam"
  ],
});

export default function PaginaConselhosDireitos() {
  const conselhos = listarConselhos();
  const contagem = contagemConselhosPorCategoria();

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 space-y-10"
    >
      {/* ═══ BREADCRUMB VISUAL ═══ */}
      <nav aria-label="Caminho de navegação" className="flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-foreground transition-colors">
          Início
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/direitos-em-movimento" className="hover:text-foreground transition-colors">
          Direitos em Movimento
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-foreground">Conselhos de Direitos & Colegiados</span>
      </nav>

      {/* ═══ CABEÇALHO DA PÁGINA ═══ */}
      <header className="space-y-4 max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <span>Democracia Participativa & Controle Cidadão</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
          Conselhos de Direitos & Colegiados Participativos
        </h1>

        <p className="text-base sm:text-lg text-muted leading-relaxed">
          Onde a população decide e fiscaliza diretamente os recursos públicos: conselhos de saúde (CMS/CES), meio ambiente (CODEMAs/COPAM), direitos humanos, conselhos tutelares, comitês de bacias e conselhos de direitos das mulheres em todo o Brasil.
        </p>

        {/* EPÍGRAFE POÉTICA */}
        <div className="rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-xs sm:text-sm italic text-muted">
          <p>
            &ldquo;O rio não corre sozinho: cada afluente, cada gota e cada voz ribeirinha fazem a força da correnteza.&rdquo;
          </p>
          <span className="block mt-1 not-italic font-medium text-text-soft">
            — Provérbio Popular & Saberes Comunitários
          </span>
        </div>
      </header>

      {/* ═══ SUMÁRIO WIKI E NAVEGAÇÃO ═══ */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="sticky top-20 space-y-6">
            <MiniSumarioLateral
              itens={[
                { id: "painel-conselhos", titulo: "Catálogo de Colegiados" },
                { id: "como-participar", titulo: "Como Participar" },
                { id: "links-relacionados", titulo: "Páginas Relacionadas" },
              ]}
            />
          </div>
        </aside>

        <section id="painel-conselhos" className="lg:col-span-3 space-y-10">
          {/* ═══ PAINEL INTERATIVO CLIENT (5 ITENS AGENTS.MD) ═══ */}
          <PainelConselhosClient
            conselhosIniciais={conselhos}
            contagemPorCategoria={contagem}
          />

          <div id="links-relacionados">
            <LinksRelacionados
              links={[
                {
                  titulo: "Central de Canais LAI",
                  href: "/direitos-em-movimento/informacao",
                  descricao: "Telefones, e-mails e e-SIC de 445 prefeituras, câmaras e concessionárias.",
                },
                {
                  titulo: "Saúde Pública & SUS",
                  href: "/direitos-em-movimento/saude-publica",
                  descricao: "Leitos, equipes de saúde da família e repasses do Ministério da Saúde.",
                },
                {
                  titulo: "Canal de Denúncia Cidadã",
                  href: "/direitos-em-movimento/denuncia",
                  descricao: "Roteiros para protocolar denúncias no Ministério Público, Tribunais de Contas e Ouvidorias.",
                },
              ]}
            />
          </div>
        </section>
      </div>

      <FooterGlobal />
    </main>
  );
}
