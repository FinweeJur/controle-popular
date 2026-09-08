import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import { BreadcrumbJsonLd } from "@/app/components/BreadcrumbJsonLd";
import { IndiceWiki, MiniSumarioLateral, LinksRelacionados } from "@/app/components/wiki";
import { obterTodasInstituicoes } from "@/lib/instituicoes/catalogo";
import PainelInstituicoesClient from "./PainelInstituicoesClient";

export const metadata: Metadata = {
  title: "Instituições e Secretarias de Todas as Esferas — Organograma, Contatos e Ouvidoria | Controle Popular",
  description:
    "Catálogo unificado dos órgãos públicos do Brasil: Ministérios federais, Secretarias estaduais e municipais, Congresso, Assembleias, Câmaras, Tribunais, Ministério Público e Defensoria.",
};

const SECOES_INSTITUICOES = [
  { id: "resumo-esferas", titulo: "1. Panorama por Poder" },
  { id: "filtros-instituicoes", titulo: "2. Filtros e Busca de Órgãos" },
  { id: "catalogo-instituicoes", titulo: "3. Fichas das Instituições" },
  { id: "origem-dados", titulo: "4. Origem dos Dados" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/governo",
    titulo: "Acompanhamento de Governos e Metas de Campanha",
    descricao: "Cruzamento entre promessas de campanha registradas no TSE e execução orçamentária dos ministérios e secretarias.",
  },
  {
    href: "/judiciario/instituicoes",
    titulo: "Quem fiscaliza a Justiça",
    descricao: "Mapa das inspeções do CNJ e corregedorias externas sobre os tribunais estaduais e superiores.",
  },
  {
    href: "/judiciario/contatos",
    titulo: "Varas, Gabinetes e Balcão Virtual",
    descricao: "Contatos diretos, telefones, e-mails institucionais e canais de videoconferência de 990 unidades judiciárias.",
  },
  {
    href: "/cidades",
    titulo: "199 Cidades Estratégicas do Brasil",
    descricao: "Plano mestre de fiscalização municipal cobrindo as 27 capitais e 172 polos regionais do interior.",
  },
];

export default function InstituicoesHubPage() {
  const instituicoes = obterTodasInstituicoes();

  const breadcrumbItems = [
    { name: "Início", item: "https://controlepopular.com.br/" },
    { name: "Instituições e Secretarias", item: "https://controlepopular.com.br/instituicoes" },
  ];

  return (
    <div className="min-h-screen bg-surface-0 text-text">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <MiniSumarioLateral itens={SECOES_INSTITUICOES} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Breadcrumb */}
        <nav aria-label="Navegação estrutural" className="mb-4 flex items-center gap-2 text-xs text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">Instituições e Secretarias</span>
        </nav>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>🏛️</span> Transparência Institucional em Todas as Esferas
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Quem comanda, quanto gasta e como falar
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft sm:text-base">
            O cidadão não precisa adivinhar para onde vai o seu imposto ou qual telefone atende a sua demanda.
            Reunimos em fichas públicas padronizadas os órgãos do Executivo, Legislativo, Judiciário e Sistema de Justiça:
            organograma com atribuições reais de cada setor, titulares, orçamento na LOA e canais diretos de ouvidoria e e-SIC.
          </p>
        </div>

        {/* Sumário Interno (Padrão Wiki) */}
        <IndiceWiki itens={SECOES_INSTITUICOES} />

        {/* ═══ PAINEL INTERATIVO CLIENT (BUSCA, FILTROS, CARDS, CSV) ═══ */}
        <PainelInstituicoesClient instituicoes={instituicoes} />

        {/* ═══ NOTA DE INTEGRIDADE EDITORIAL ═══ */}
        <section id="origem-dados" aria-labelledby="origem-dados-titulo" className="mt-12 rounded-2xl border border-border bg-surface-1 p-6 text-xs text-text-soft">
          <h3 id="origem-dados-titulo" className="text-sm font-bold text-text">Origem dos dados institucionais</h3>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>
              <strong>Canais de atendimento:</strong> Telefones, e-mails funcionais e endereços físicos são extraídos de diários oficiais e páginas institucionais governamentais (.gov.br, .leg.br, .jus.br, .mp.br e .def.br).
            </li>
            <li>
              <strong>Orçamento e Pessoal:</strong> Os valores de folha e custeio refletem as Leis Orçamentárias Anuais (LOA) e os Relatórios de Gestão Fiscal (RGF) auditados pelos respectivos Tribunais de Contas.
            </li>
            <li>
              <strong>Direito à Informação:</strong> Todo cidadão tem o direito constitucional (art. 5º, XXXIII da CF/88 e Lei 12.527/2011) de obter informações de qualquer órgão público sem justificar o motivo.
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
