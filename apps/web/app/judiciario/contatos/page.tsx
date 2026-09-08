import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import {
  obterTodasUnidadesJudiciarias,
  obterEstatisticasContatos,
} from "@/lib/judiciario/contatos";
import PainelVarasContatosClient from "./PainelVarasContatosClient";
import FooterGlobal from "@/app/components/FooterGlobal";
import { BreadcrumbJsonLd } from "@/app/components/BreadcrumbJsonLd";
import { IndiceWiki, MiniSumarioLateral, LinksRelacionados } from "@/app/components/wiki";

export const metadata: Metadata = metadataEditavel("/judiciario/contatos", {
  title: "Varas, Gabinetes e Balcão Virtual — Guia Nacional · Judiciário",
  description:
    "Catálogo nacional de contatos do Judiciário: e-mail, telefone, endereço, titular e link do Balcão Virtual de varas, gabinetes e secretarias da Justiça Estadual, Federal e do Trabalho em MG e no Brasil.",
});

const SECOES_PAGINA = [
  { id: "resumo-geral", titulo: "1. Indicadores Gerais" },
  { id: "grafico-distribuicao", titulo: "2. Distribuição por Ramo" },
  { id: "filtros-busca", titulo: "3. Filtros e Busca" },
  { id: "catalogo-unidades", titulo: "4. Catálogo de Varas e Balcão" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/judiciario/instituicoes",
    titulo: "Quem fiscaliza a Justiça",
    descricao: "Mapa das inspeções externas do CNJ, corregedorias dos tribunais e ouvidorias públicas.",
  },
  {
    href: "/judiciario/recomendacoes",
    titulo: "Recomendações e Metas do CNJ",
    descricao: "Painel das diretrizes, prazos e determinações do Conselho Nacional de Justiça.",
  },
  {
    href: "/direitos-em-movimento/ajuda",
    titulo: "Onde Buscar Ajuda Jurídica Gratuita",
    descricao: "Contatos e orientações para atendimento na Defensoria Pública, Juizados e OAB Cidadã.",
  },
  {
    href: "/cidades",
    titulo: "199 Cidades Estratégicas do Brasil",
    descricao: "Painel com todas as 27 capitais e 172 polos do interior com dados municipais integrados.",
  },
];

export default function PaginaContatosJudiciario() {
  const unidades = obterTodasUnidadesJudiciarias();
  const estatisticas = obterEstatisticasContatos();

  const breadcrumbItems = [
    { name: "Início", item: "https://controlepopular.com.br/" },
    { name: "Judiciário", item: "https://controlepopular.com.br/judiciario" },
    { name: "Varas, Gabinetes e Balcão Virtual", item: "https://controlepopular.com.br/judiciario/contatos" },
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
          <Link href="/judiciario" className="hover:text-primary">
            Judiciário
          </Link>
          <span>/</span>
          <span className="font-semibold text-text">Varas, Gabinetes e Balcão Virtual</span>
        </nav>

        {/* Cabeçalho / Hero */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span>⚖️</span> Catálogo de Atendimento e Balcão Virtual
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Varas, Gabinetes e Balcão Virtual da Justiça
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-text-soft sm:text-base">
            O cidadão e o advogado têm o direito de saber quem julga sua causa e onde falar diretamente com a vara.
            Reunimos os contatos verificados de 990 unidades judiciárias: e-mail institucional oficial, telefone com DDD,
            endereço com CEP, nome e cargo do magistrado titular, e link direto para atendimento por videoconferência no Balcão Virtual — cobrindo todas as 298 comarcas de Minas Gerais e os polos estratégicos do país.
          </p>
        </div>

        {/* Sumário Interno (Padrão Wiki) */}
        <IndiceWiki itens={SECOES_PAGINA} />

        {/* Painel Interativo */}
        <PainelVarasContatosClient
          unidadesIniciais={unidades}
          estatisticas={estatisticas}
        />

        {/* Links Relacionados (Padrão Wiki) */}
        <LinksRelacionados links={LINKS_RELACIONADOS} />
      </main>

      <FooterGlobal />
    </div>
  );
}
