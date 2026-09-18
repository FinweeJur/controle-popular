import type { Metadata } from "next";
import {
  Building2,
  Landmark,
  Scale,
  Leaf,
  Droplets,
  Map,
  Search,
  BarChart3,
  Globe,
  HeartHandshake,
  BookOpen,
  FileText,
  Shield,
  HelpCircle,
  AlertTriangle,
  MapPin,
  Cpu,
  Newspaper,
  Users,
  Sparkles,
} from "lucide-react";
import { ZONAS_PUBLICADAS } from "@/lib/zonas";
import Link from "next/link";
import novidades from "@/data/novidades.json";
import paginas100 from "@/data/top-100-paginas.json";
import { listarNoticiasPortal } from "@/lib/noticias/portal";
import { listarCidades } from "@/lib/db/queries/municipios";
import CapaFrente from "@/app/components/CapaFrente";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki } from "@/app/components/wiki";
import FooterGlobal from "@/app/components/FooterGlobal";
import Catalogo100PaginasClient, { type PaginaCatalogo } from "./Catalogo100PaginasClient";

/**
 * Hub global de indice do portal: `/indice`.
 *
 * Entrada do formato wiki. Aponta para as frentes, cidades, temas
 * transversais e situacoes praticas. Cada card descreve o destino e leva
 * a uma pagina de indice ou de conteudo.
 *
 * ⟲ 02/09/2026, copy v6 (docs/planos/PLANO-COPY-VOZ.md): título,
 * descrição e cabeçalho na voz nova — o índice é "o mapa", e cada porta
 * leva ao número com a fonte ao lado. Estrutura e cards intactos.
 */

const ICONES_FRENTE: Record<string, React.ReactNode> = {
  cidades: <Building2 size={14} />,
  congresso: <Landmark size={14} />,
  judiciario: <Scale size={14} />,
  ambiental: <Leaf size={14} />,
  paraopeba: <Droplets size={14} />,
  terras: <Map size={14} />,
};

export const metadata: Metadata = {
  title: "Índice — Controle Popular",
  description:
    "Todas as frentes, cidades e temas do Controle Popular num mapa só — dado público com fonte, organizado do seu jeito de procurar.",
};

interface ItemNovidade {
  data: string;
  titulo: string;
  descricao: string;
  frente: string;
  link: string | null;
}

/**
 * Monta a lista de novidades: as 6 publicações mais recentes do blog
 * (noticias-portal.json) + os itens de novidades.json cujo link não é
 * /noticias/*. Ordenado por data desc, cortado nos 8 primeiros.
 */
function montarNovidades(): ItemNovidade[] {
  const dasPublicacoes: ItemNovidade[] = [...listarNoticiasPortal()]
    .sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm))
    .slice(0, 6)
    .map((n) => ({
      data: n.publicadoEm.slice(0, 10),
      titulo: n.titulo,
      descricao: n.resumo,
      frente: n.frente,
      link: `/noticias/${n.slug}`,
    }));
  const outras: ItemNovidade[] = (novidades as ItemNovidade[]).filter(
    (item) =>
      !item.link?.startsWith("/noticias/") &&
      !item.link?.startsWith("/editais") &&
      !item.titulo.toLowerCase().includes("edital") &&
      item.frente?.toLowerCase() !== "editais"
  );
  return [...dasPublicacoes, ...outras]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 8);
}

export default async function IndiceGlobal() {
  const cidades = await listarCidades();
  const novidadesMescladas = montarNovidades();

  const secoes = [
    {
      id: "frentes",
      titulo: "Por frente",
      topicos: ZONAS_PUBLICADAS.map(
        (z): Topico => ({
          href: `${z.href}/indice`,
          titulo: z.nomeCurto,
          descricao: z.resumo,
          cor: z.cor,
          badge: z.etiqueta,
          icon: ICONES_FRENTE[z.id] ?? null,
        })
      ),
    },
    {
      id: "cidades",
      titulo: "Por cidade",
      topicos: cidades.map(
        (c): Topico => ({
          href: `/${c.slug}/indice`,
          titulo: c.nome,
          descricao: `Dados publicos de ${c.nome}-${c.uf}.`,
          cor: "var(--cp-primary)",
          badge: `${c.uf}`,
          icon: <Building2 size={14} />,
        })
      ),
    },
    {
      id: "transversal",
      titulo: "Por tema",
      topicos: [
        { href: "/busca", titulo: "Busca", descricao: "Procure por palavra, tema ou territorio.", cor: "var(--cp-accent)", badge: "Transversal", icon: <Search size={14} /> },
        { href: "/paraopeba/biblioteca", titulo: "Biblioteca de Documentos", descricao: "Acervo de publicações das ATIs, perícia e órgãos ambientais.", cor: "var(--cp-secondary)", badge: "Paraopeba", icon: <BookOpen size={14} /> },
        { href: "/dados/populares", titulo: "Paginas mais vistas", descricao: "O que as pessoas mais consultam.", cor: "var(--cp-accent)", badge: "Transversal", icon: <BarChart3 size={14} /> },
        { href: "/dados/comunicabr", titulo: "Governo federal nas cidades", descricao: "Repasses e acoes da Uniao em Minas Gerais.", cor: "var(--cp-accent)", badge: "Transversal", icon: <Globe size={14} /> },
        { href: "/direitos-em-movimento", titulo: "Direitos em Movimento", descricao: "Onde buscar ajuda e como se defender.", cor: "var(--cp-alert)", badge: "Transversal", icon: <HeartHandshake size={14} /> },
        { href: "/direitos-em-movimento/informacao", titulo: "Canais de Informação (LAI)", descricao: "445 canais oficiais de prefeituras, câmaras, órgãos federais e concessionárias de luz e água.", cor: "var(--cp-alert)", badge: "Cidadania", icon: <FileText size={14} /> },
        { href: "/direitos-em-movimento/conselhos", titulo: "Conselhos de Direitos & Colegiados", descricao: "710 conselhos de saúde (CMS/CES), meio ambiente (CODEMA), direitos humanos, tutelares e mulheres.", cor: "var(--cp-alert)", badge: "Controle Social", icon: <Users size={14} /> },
        { href: "/editais", titulo: "Radar de Editais — DO-MG", descricao: "50+ editais e chamamentos de interesse social do Diário Oficial de MG, com radar diário.", cor: "var(--cp-primary)", badge: "✦ Novo", icon: <FileText size={14} /> },
        { href: "/estudos-rurais", titulo: "Estudos Rurais e Territoriais", descricao: "Pesquisas do campo, reforma agrária, assentamentos e territórios quilombolas em MG.", cor: "var(--cp-accent)", badge: "✦ Novo", icon: <Map size={14} /> },
        { href: "/documentacao", titulo: "Documentação Técnica", descricao: "Arquitetura, fontes, API pública e princípios editoriais — para pesquisadores e desenvolvedores.", cor: "var(--cp-primary)", badge: "✦ Novo", icon: <BookOpen size={14} /> },
        { href: "/tecnologia", titulo: "Tecnologia & IA Livre", descricao: "Oficinas práticas de IA, catálogo open source e ferramentas livres.", cor: "var(--cp-primary)", badge: "Educação", icon: <Cpu size={14} /> },
        { href: "/noticias", titulo: "Blog & Relatórios", descricao: "Estudos técnicos, dados públicos e investigações cívicas do ONSA, em publicações com fonte ao lado.", cor: "var(--cp-primary)", badge: "Jornalismo", icon: <Newspaper size={14} /> },
        { href: "/governo", titulo: "Governo: Prometeu? Cumpriu?", descricao: "Acompanhamento das promessas e metas dos 27 governos estaduais, capitais e polos.", cor: "var(--cp-secondary)", badge: "Gestão", icon: <Landmark size={14} /> },
        { href: "/instituicoes", titulo: "Organogramas & Lideranças", descricao: "Quem comanda, estrutura funcional e canais oficiais de órgãos públicos.", cor: "var(--cp-secondary)", badge: "Institucional", icon: <Building2 size={14} /> },
        { href: "/cidades", titulo: "203 Cidades Estratégicas", descricao: "Expansão para as 27 capitais e 176 polos do interior com dados do IBGE e DATASUS.", cor: "var(--cp-tertiary)", badge: "Nacional", icon: <MapPin size={14} /> },
        { href: "/empresas", titulo: "Grandes Empresas & Fundos", descricao: "Observatório de mineradoras, relatórios ESG, sócios e fornecedores públicos.", cor: "var(--cp-secondary)", badge: "Mercado", icon: <Building2 size={14} /> },
        { href: "/biblioteca", titulo: "Biblioteca Geral & Pesquisa", descricao: "24.000 documentos, estudos de ATIs, relatórios periciais e decisões LAI.", cor: "var(--cp-accent)", badge: "Acervo", icon: <BookOpen size={14} /> },
        { href: "/judiciario/recomendacoes", titulo: "Recomendações CNJ & CNMP", descricao: "O que os conselhos nacionais mandaram corrigir em tribunais e promotorias.", cor: "var(--cp-secondary)", badge: "Justiça", icon: <Scale size={14} /> },
        { href: "/judiciario/contatos", titulo: "Varas e Balcão Virtual", descricao: "Telefone, e-mail, titular e balcão virtual de 990 varas de MG e cidades do Brasil.", cor: "var(--cp-secondary)", badge: "Judiciário", icon: <Scale size={14} /> },
        { href: "/sobre", titulo: "Sobre", descricao: "O que e, de onde vem os dados e quem somos.", cor: "var(--cp-primary)", badge: "Portal", icon: <BookOpen size={14} /> },
        { href: "/termos", titulo: "Termos e origem dos dados", descricao: "Licenca, fontes e limitacoes.", cor: "var(--cp-primary)", badge: "Portal", icon: <FileText size={14} /> },
      ],
    },
    {
      id: "situacoes",
      titulo: "Por situacao",
      topicos: [
        { href: "/direitos-em-movimento/denuncia", titulo: "Quero denunciar", descricao: "Canais de denuncia e protecao.", cor: "var(--cp-alert)", badge: "Acao", icon: <Shield size={14} /> },
        { href: "/direitos-em-movimento/ajuda", titulo: "Preciso de ajuda", descricao: "Onde encontrar assistencia juridica e social.", cor: "var(--cp-alert)", badge: "Acao", icon: <HelpCircle size={14} /> },
        { href: "/noticias/tarifa-social-energia-agua-como-acessar", titulo: "Quero desconto na conta de luz e água", descricao: "Veja o passo a passo da Tarifa Social por estado e distribuidora.", cor: "var(--cp-primary)", badge: "Acao", icon: <Sparkles size={14} /> },
        { href: "/direitos-em-movimento/conselhos", titulo: "Quero participar do conselho da minha cidade", descricao: "Reuniões e contatos de CMS, CODEMA, Tutelares e Direitos Humanos.", cor: "var(--cp-alert)", badge: "Acao", icon: <Users size={14} /> },
        { href: "/judiciario/contatos", titulo: "Preciso falar com a Vara ou Fórum", descricao: "Contatos com DDD, e-mails, endereços com CEP e balcão virtual das 298 comarcas de MG e polos do país.", cor: "var(--cp-secondary)", badge: "Acao", icon: <Scale size={14} /> },
        { href: "/governo", titulo: "Quero checar se o governo cumpriu", descricao: "Painel comparativo de promessas de campanha versus entregas reais.", cor: "var(--cp-primary)", badge: "Acao", icon: <Landmark size={14} /> },
        { href: "/cidades", titulo: "Quero dados da minha cidade", descricao: "Painel mestre com 203 cidades estratégicas do Brasil com SUS, PIB e contratos.", cor: "var(--cp-tertiary)", badge: "Acao", icon: <MapPin size={14} /> },
        { href: "/instituicoes", titulo: "Quero o contato oficial de um órgão", descricao: "Organograma, presidente, telefone, e-mail e endereço de órgãos públicos.", cor: "var(--cp-secondary)", badge: "Acao", icon: <Building2 size={14} /> },
        { href: "/paraopeba/entenda", titulo: "Quero entender Brumadinho", descricao: "Reparacao, auxilio e acompanhamento do Acordo.", cor: "var(--cp-secondary)", badge: "Acao", icon: <AlertTriangle size={14} /> },
        { href: "/paraopeba/vale", titulo: "Quero dados da Vale", descricao: "Cotações na B3, documentos CVM e notícias da empresa.", cor: "var(--cp-secondary)", badge: "Acao", icon: <BarChart3 size={14} /> },
        { href: "/ambiental/mariana", titulo: "Quero o Acordo de Mariana", descricao: "Execução dos R$ 171 bi da repactuação histórica do Rio Doce.", cor: "var(--cp-tertiary)", badge: "Acao", icon: <Leaf size={14} /> },
        { href: "/ambiental/barragens", titulo: "Moro perto de uma barragem", descricao: "Situacao e risco de barragens em Minas Gerais.", cor: "var(--cp-tertiary)", badge: "Acao", icon: <MapPin size={14} /> },
        { href: "/funcaosocialterra/mapa", titulo: "Quero ver o territorio", descricao: "Globo 3D com camadas de mineracao, CAR, UCs e mais.", cor: "var(--cp-accent)", badge: "Acao", icon: <Map size={14} /> },
      ],
    },
  ];

  const itensIndice = [
    { id: "eixos-tematicos", titulo: "Os 3 Eixos Temáticos" },
    { id: "catalogo-100-paginas", titulo: "As 100 Principais Páginas" },
    { id: "novidades", titulo: "Novidades Recentes" },
    ...secoes.map((s) => ({ id: s.id, titulo: s.titulo })),
  ];

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <CapaFrente
        imagem="capas/home-page.webp"
        alt="Capa do Controle Popular — índice geral do portal"
        titulo="CONTROLE POPULAR"
        epigrafe=""
        atribuicao=""
        resumo="Seis frentes, um portal, o número na sua tela. Escolha uma porta — todas levam ao dado com a fonte ao lado."
        className="mb-10 -mx-4 sm:-mx-8"
      />
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Índice do Controle Popular</h1>
        <p className="max-w-2xl text-text-soft">
          Tudo o que o portal vigia, organizado do seu jeito: por eixos temáticos, pelas 100 principais páginas, por frente, por cidade, por
          tema ou pela sua situação prática.
        </p>
      </header>

      <IndiceWiki itens={itensIndice} />

      {/* ═══ OS 3 GRANDES EIXOS TEMÁTICOS DO PORTAL ═══ */}
      <section id="eixos-tematicos" className="mt-12 scroll-mt-20">
        <div className="mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Arquitetura Cívica</span>
          <h2 className="font-display text-2xl font-bold text-text">Os Três Grandes Eixos Temáticos</h2>
          <p className="mt-1 text-sm text-text-soft">
            Toda a fiscalização do portal é organizada em três eixos de interesse social e uma central técnica de transparência.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Eixo 1 */}
          <Link
            href="/direitos-em-movimento"
            className="group flex flex-col justify-between rounded-2xl border border-alert/30 bg-alert/5 p-5 transition hover:border-alert hover:bg-alert/10 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded border border-alert/30 bg-alert/20 px-2 py-0.5 text-xs font-bold uppercase text-alert">
                  EIXO 1
                </span>
                <HeartHandshake className="h-5 w-5 text-alert" />
              </div>
              <h3 className="font-display text-lg font-bold text-text group-hover:text-alert transition-colors">
                Direitos em Movimento
              </h3>
              <p className="mt-2 text-xs text-text-soft leading-relaxed">
                Saúde (SUS), Educação (IDEB), Trabalho (CAGED), Conselhos de Direitos, LAI, canal de denúncia e assistência jurídica.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-alert/20 flex items-center justify-between text-xs font-semibold text-alert">
              <span>Explorar Eixo</span>
              <span>→</span>
            </div>
          </Link>

          {/* Eixo 2 */}
          <Link
            href="/terra-e-territorios"
            className="group flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 transition hover:border-emerald-500 hover:bg-emerald-500/10 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-xs font-bold uppercase text-emerald-500">
                  EIXO 2
                </span>
                <Globe className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-text group-hover:text-emerald-500 transition-colors">
                Terra e Territórios
              </h3>
              <p className="mt-2 text-xs text-text-soft leading-relaxed">
                203 Cidades Estratégicas, Bacias Paraopeba e Rio Doce (Brumadinho e Mariana), barragens, clima, licenciamento e Globo 3D.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-semibold text-emerald-500">
              <span>Explorar Eixo</span>
              <span>→</span>
            </div>
          </Link>

          {/* Eixo 3 */}
          <Link
            href="/estado-e-economia"
            className="group flex flex-col justify-between rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 transition hover:border-sky-500 hover:bg-sky-500/10 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded border border-sky-500/30 bg-sky-500/20 px-2 py-0.5 text-xs font-bold uppercase text-sky-500">
                  EIXO 3
                </span>
                <Landmark className="h-5 w-5 text-sky-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-text group-hover:text-sky-500 transition-colors">
                Estado e Economia
              </h3>
              <p className="mt-2 text-xs text-text-soft leading-relaxed">
                Orçamento de MG, Compras Públicas (PNCP), Congresso Nacional (CEAP e emendas), Quem fiscaliza a Justiça, Varas e Empresas ESG.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-sky-500/20 flex items-center justify-between text-xs font-semibold text-sky-500">
              <span>Explorar Eixo</span>
              <span>→</span>
            </div>
          </Link>

          {/* Central ONSA */}
          <Link
            href="/sobre"
            className="group flex flex-col justify-between rounded-2xl border border-primary/30 bg-primary/5 p-5 transition hover:border-primary hover:bg-primary/10 shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded border border-primary/30 bg-primary/20 px-2 py-0.5 text-xs font-bold uppercase text-primary">
                  ONSA
                </span>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-text group-hover:text-primary transition-colors">
                Central & Ferramentas
              </h3>
              <p className="mt-2 text-xs text-text-soft leading-relaxed">
                Radar de Editais (DO-MG), Estudos Rurais, Documentação Técnica, API Pública, Biblioteca Digital, Blog e IA Livre.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between text-xs font-semibold text-primary">
              <span>Conhecer Método</span>
              <span>→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══ O CATÁLOGO DAS 100 PRINCIPAIS PÁGINAS ═══ */}
      <div className="mt-14">
        <Catalogo100PaginasClient paginas={paginas100 as PaginaCatalogo[]} />
      </div>

      {/* Novidades */}
      <section className="mt-14 scroll-mt-20" id="novidades">
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <Sparkles size={20} className="text-primary" aria-hidden="true" />
          Novidades
          <a href="/novidades" className="ml-auto text-[11px] font-medium text-text-soft hover:text-primary">
            ver tudo
          </a>
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {novidadesMescladas.map((item, i) => (
            <CartaoTopico
              key={`${item.data}-${i}`}
              topico={{
                href: item.link || "#",
                titulo: item.titulo,
                descricao: item.descricao,
                cor: "var(--cp-primary)",
                badge: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
                  new Date(item.data + "T12:00:00Z")
                ),
                novo: item.data >= "2026-09-09",
              }}
            />
          ))}
        </div>
      </section>

      {secoes.map((secao) => (
        <section key={secao.id} id={secao.id} className="mt-10 scroll-mt-20">
          <h2 className="font-display text-xl font-semibold">{secao.titulo}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {secao.topicos.map((topico) => (
              <CartaoTopico key={topico.href} topico={topico} />
            ))}
          </div>
        </section>
      ))}

      <div className="mt-12 border-t border-border pt-6">
        <FooterGlobal />
      </div>
    </main>
  );
}
