import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { BreadcrumbJsonLd } from "@/app/components/BreadcrumbJsonLd";
import { IndiceWiki, MiniSumarioLateral, LinksRelacionados } from "@/app/components/wiki";
import { listarMandatos } from "@/lib/gestao/dados";
import PainelGovernoHubClient from "./PainelGovernoHubClient";

export const metadata: Metadata = {
  title: "Governos e Planos de Campanha — Prometeu? Cumpriu? | Controle Popular",
  description:
    "Cruzamento transparente entre planos de governo registrados no TSE e a execução real por secretarias estaduais e ministérios federais.",
};

const SECOES_GOVERNO = [
  { id: "resumo-gestao", titulo: "1. Indicadores de Cumprimento" },
  { id: "grafico-progresso", titulo: "2. Panorama das Metas do TSE" },
  { id: "filtros-governo", titulo: "3. Filtros por Esfera e Região" },
  { id: "catalogo-governos", titulo: "4. Mandatos e Planos de Campanha" },
  { id: "metodologia", titulo: "5. Metodologia e Fontes" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/instituicoes",
    titulo: "Instituições e Secretarias de Todas as Esferas",
    descricao: "Organogramas, secretarias estaduais e ministérios responsáveis pela execução dos planos.",
  },
  {
    href: "/cidades",
    titulo: "199 Cidades Estratégicas do Brasil",
    descricao: "Acompanhamento das capitais e principais polos do interior com dados orçamentários e contratos.",
  },
  {
    href: "/judiciario/contatos",
    titulo: "Varas, Gabinetes e Balcão Virtual",
    descricao: "Canais de contato direto com varas de fazenda pública e juizados da fazenda estadual e municipal.",
  },
  {
    href: "/indice",
    titulo: "Índice Geral de Transparência Cívica",
    descricao: "Todas as seções, rotas, tabelas e investigações públicas do portal Controle Popular.",
  },
];

export default function HubGovernoPage() {
  const mandatos = listarMandatos();

  const breadcrumbItems = [
    { name: "Início", item: "https://controlepopular.com.br/" },
    { name: "Governos e Planos de Campanha", item: "https://controlepopular.com.br/governo" },
  ];

  return (
    <div className="min-h-screen bg-surface-0 text-text">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <MiniSumarioLateral itens={SECOES_GOVERNO} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Breadcrumb Visual */}
        <nav aria-label="Navegação estrutural" className="mb-4 flex items-center gap-2 text-xs text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">Governos e Planos de Campanha</span>
        </nav>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>⚖️</span> Prometeu? Cumpriu? — Plano v8
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Acompanhamento de Governos e Promessas
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft sm:text-base">
            O plano de governo registrado no TSE é o contrato formal do candidato com o eleitor.
            Nós cruzamos cada proposta literal com o que as Secretarias de Estado e Ministérios
            realmente empenharam, contrataram ou entregaram em dados abertos públicos.
          </p>
        </div>

        {/* Sumário Interno (Padrão Wiki) */}
        <IndiceWiki itens={SECOES_GOVERNO} />

        {/* ═══ PAINEL INTERATIVO COM GRÁFICOS, FILTROS, ORDENAÇÃO E CSV ═══ */}
        <PainelGovernoHubClient mandatos={mandatos} />

        {/* ═══ TRANSPARÊNCIA METODOLÓGICA ═══ */}
        <section id="metodologia" aria-labelledby="metodologia-titulo" className="mt-12 rounded-2xl border border-border bg-surface-1 p-6 text-xs text-text-soft">
          <h3 id="metodologia-titulo" className="text-sm font-bold text-text">Como funciona a metodologia?</h3>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Captura oficial:</strong> O texto de cada proposta é extraído literalmente do PDF depositado no DivulgaCandContas do Tribunal Superior Eleitoral.
            </li>
            <li>
              <strong>Cruzamento por secretaria:</strong> Cada meta é associada ao órgão responsável e monitorada via diários oficiais (DIO-MG, Querido Diário), contratos (PNCP) e convênios (TransfereGov).
            </li>
            <li>
              <strong>Sem sinal público:</strong> Propostas sem ato localizado não são adjetivadas como &quot;promessa quebrada&quot;; registramos a ausência de publicação oficial até a data da conferência.
            </li>
          </ul>
        </section>

        {/* Links Relacionados (Padrão Wiki) */}
        <LinksRelacionados links={LINKS_RELACIONADOS} />
      </main>

      <FooterGlobal />
    </div>
  );
}
