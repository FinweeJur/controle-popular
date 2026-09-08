import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import {
  obterTodosCanaisInformacao,
  obterEstatisticasInformacao,
} from "@/lib/direitos/informacao";
import PainelInformacaoClient from "./PainelInformacaoClient";
import FooterGlobal from "@/app/components/FooterGlobal";
import { BreadcrumbJsonLd } from "@/app/components/BreadcrumbJsonLd";
import { IndiceWiki, MiniSumarioLateral, LinksRelacionados } from "@/app/components/wiki";

export const metadata: Metadata = metadataEditavel("/direitos-em-movimento/informacao", {
  title: "Canais de Acesso à Informação Pública — Prefeituras, Câmaras, Órgãos e Concessionárias",
  description:
    "Catálogo nacional de transparência pública (LAI): e-mail, telefone, endereço com CEP, responsável e link direto de e-SIC/Ouvidoria para 199 Prefeituras e Câmaras, órgãos federais e concessionárias de água, luz e internet.",
});

const SECOES_PAGINA = [
  { id: "resumo-geral", titulo: "1. Indicadores Gerais" },
  { id: "grafico-distribuicao", titulo: "2. Distribuição por Setor" },
  { id: "filtros-busca", titulo: "3. Filtros e Pesquisa" },
  { id: "catalogo-canais", titulo: "4. Catálogo de Canais Oficiais" },
  { id: "guia-pratico-lai", titulo: "5. Guia Prático da LAI" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/judiciario/contatos",
    titulo: "Varas, Gabinetes e Balcão Virtual",
    descricao: "Contatos e link de videoconferência de 990 unidades nas 298 comarcas de MG e polos nacionais.",
  },
  {
    href: "/direitos-em-movimento/ajuda",
    titulo: "Onde Buscar Ajuda Jurídica Gratuita",
    descricao: "Orientações e canais para atendimento na Defensoria Pública, OAB Cidadã e Juizados Especiais.",
  },
  {
    href: "/direitos-em-movimento/denuncia",
    titulo: "Como Denunciar Irregularidades",
    descricao: "Canais seguros para representação contra crimes ambientais, desvios e violações de direitos.",
  },
  {
    href: "/cidades",
    titulo: "199 Cidades Estratégicas do Brasil",
    descricao: "Painel com todas as 27 capitais e 172 polos do interior com dados municipais integrados.",
  },
];

export default function InformacaoPage() {
  const canais = obterTodosCanaisInformacao();
  const estatisticas = obterEstatisticasInformacao();

  const breadcrumbItems = [
    { name: "Início", item: "https://controlepopular.com.br/" },
    { name: "Direitos em Movimento", item: "https://controlepopular.com.br/direitos-em-movimento" },
    { name: "Como Pedir Informação", item: "https://controlepopular.com.br/direitos-em-movimento/informacao" },
  ];

  return (
    <div className="min-h-screen bg-surface-0 text-text">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <MiniSumarioLateral itens={SECOES_PAGINA} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Breadcrumb Visual */}
        <nav aria-label="Navegação estrutural" className="mb-4 flex items-center gap-2 text-xs text-text-soft">
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span>/</span>
          <Link href="/direitos-em-movimento" className="hover:text-primary">
            Direitos em Movimento
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">Como Pedir Informação</span>
        </nav>

        {/* Hero / Cabeçalho */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>📋</span> Lei de Acesso à Informação (Lei nº 12.527/2011)
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Canais de Acesso à Informação Pública e Serviços Essenciais
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-text-soft sm:text-base">
            Pela Lei de Acesso à Informação, qualquer cidadão tem o direito de solicitar dados, contratos,
            gastos e documentos públicos — o pedido é 100% gratuito e o órgão tem prazo legal para responder.
            Reunimos os contatos verificados de 445 entidades públicas e concessionárias essenciais: telefone com DDD,
            e-mail oficial da ouvidoria, endereço físico completo com CEP, titular responsável e link direto para o portal de e-SIC / Fala.BR.
          </p>
        </div>

        {/* Sumário Interno (Padrão Wiki) */}
        <IndiceWiki itens={SECOES_PAGINA} />

        {/* Painel Interativo de Canais */}
        <PainelInformacaoClient
          canaisIniciais={canais}
          estatisticas={estatisticas}
        />

        {/* Links Relacionados (Padrão Wiki) */}
        <LinksRelacionados links={LINKS_RELACIONADOS} />
      </main>

      <FooterGlobal />
    </div>
  );
}
