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
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  MapPin,
  Cpu,
  Newspaper,
  Users,
  Sparkles,
  Compass,
  TreeDeciduous,
  FileSpreadsheet,
  Mountain,
} from "lucide-react";
import { ZONAS_PUBLICADAS } from "@/lib/zonas";
import Link from "next/link";
import novidades from "@/data/novidades.json";
import paginas100 from "@/data/top-100-paginas.json";
import { listarNoticiasPortal } from "@/lib/noticias/portal";
import { listarCidades } from "@/lib/db/queries/municipios";
import CapaFrente from "@/app/components/CapaFrente";
import CartaoTopico, { type Topico } from "@/app/components/wiki/CartaoTopico";
import { IndiceWiki, type ItemIndice } from "@/app/components/wiki";
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
 *
 * ⟲ 07/10/2026, refatoração do hotspot CodeScene: `IndiceGlobal` tinha
 * 403 LoC num corpo só (Large Method, saúde 7,96 → 10,00). A quebra
 * segue o precedente do commit `cafcb712` (home): CADA SEÇÃO virou
 * componente no MESMO arquivo, com o JSX cortado por faixa de linha do
 * original. Os 4 cartões de eixo, que o CodeScene marcava como Code
 * Duplication entre si, viraram a tabela `EIXOS` + UM componente
 * (`CartaoEixo`) — mesma estrutura, quatro vestidos.
 *
 * NADA do que aparece na tela mudou: o HTML da página é o mesmo byte a
 * byte, provado com `renderToStaticMarkup` antes e depois da quebra
 * (arquivos de 343.146 bytes com o mesmo SHA-256).
 *
 * Por que no mesmo arquivo: a página é a única consumidora destes
 * blocos; separá-los em arquivos só espalharia um hub que já é auto
 * contido, e o arquivo continua bem abaixo do teto de 1000 LoC.
 *
 * Por que os dados estáticos (`TOPICOS_TEMAS`, `TOPICOS_SITUACOES`,
 * `EIXOS`) subiram para o escopo do módulo: são constantes de verdade —
 * não dependem de nenhum parâmetro. Assim o corpo do componente só
 * orquestra, que é o que ele tem que fazer.
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

/** Uma seção do índice: a âncora do sumário, o título e a grade de cartões. */
interface SecaoIndice {
  id: string;
  titulo: string;
  topicos: Topico[];
}

/**
 * Um cartão de eixo temático (os 4 da seção "Os Quatro Grandes Eixos").
 *
 * Os quatro cartões têm a MESMA estrutura e mudam só cor, ícone, textos
 * e lista de subfrentes — por isso viraram UMA tabela de dados +
 * UM componente, em vez de quatro cópias do mesmo JSX (o CodeScene
 * apontava Code Duplication entre os três cartões irmãos).
 *
 * ATENÇÃO às `classes`: são strings LITERAIS de propósito. O Tailwind
 * varre o fonte procurando a classe inteira; se ela fosse montada por
 * concatenação (`border-${cor}/40`), o scanner não a enxergaria e a
 * borda sumiria do CSS buildado sem nenhum erro na tela.
 */
interface EixoCartao {
  /** Selo "EIXO 1"…"EIXO 4". */
  rotulo: string;
  titulo: string;
  descricao: string;
  /** Ícone do cabeçalho, já com a classe de cor (ex.: `h-5 w-5 text-alert`). */
  icone: React.ReactNode;
  /** Link do rodapé ("Explorar Eixo N Completo"). */
  rodape: { href: string; texto: string };
  /** Classes Tailwind literais — ver o aviso no cabeçalho desta interface. */
  classes: {
    cartao: string;
    selo: string;
    titulo: string;
    blocoSubfrentes: string;
    rotuloSubfrentes: string;
    itemSubfrente: string;
    rodape: string;
  };
  /** Subfrentes em destaque, na ordem da tela. */
  subfrentes: { href: string; texto: string }[];
}

/** Cidades ativas devolvidas por `listarCidades()` (mesmo tipo do banco). */
type Cidades = Awaited<ReturnType<typeof listarCidades>>;

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

/**
 * Cartões da seção "Por tema" (transversais).
 *
 * Lista FIXA escrita à mão aqui embaixo — cada linha é um card com href,
 * título, resumo, cor e selo. Antes vivia dentro de `IndiceGlobal`, o que
 * empurrava o corpo da página a 403 LoC (Large Method do CodeScene);
 * subir para constante de módulo tira 40 linhas do componente sem mudar
 * um caractere do HTML, porque a ordem e o conteúdo são os mesmos.
 *
 * Cores são strings literais (`var(--cp-eixo-terra)`) justamente para o
 * Tailwind e o navegador lerem o valor como estão escritos — nada de
 * montar classe ou cor por concatenação, senão o scanner do Tailwind não
 * enxerga a classe no fonte e o estilo some do build.
 */
const TOPICOS_TEMAS: Topico[] = [
  { href: "/busca", titulo: "Busca", descricao: "Procure por palavra, tema ou território.", cor: "var(--cp-accent)", badge: "Transversal", icon: <Search size={14} /> },
  { href: "/ambiental/autorizacoes", titulo: "Autorizações & Destinações (União)", descricao: "553 imóveis da União em MG e o regime de cada um — fonte SPU.", cor: "var(--cp-eixo-terra)", badge: "✦ Novo", icon: <FileSpreadsheet size={14} /> },
  { href: "/ambiental/ppp", titulo: "Concessões & PPP de MG", descricao: "20 contratos reais de concessão e parceria do Estado de Minas.", cor: "var(--cp-eixo-estado)", badge: "✦ Novo", icon: <Building2 size={14} /> },
  { href: "/cidades/mg", titulo: "Cidades de Minas (853)", descricao: "Os 853 municípios de MG do IBGE, com microrregiões e mesorregiões.", cor: "var(--cp-eixo-terra)", badge: "✦ Novo", icon: <MapPin size={14} /> },
  { href: "/mineracao/cavas", titulo: "Cavas de Mineração (satélite)", descricao: "Série anual de cavas detectadas por satélite no globo 3D.", cor: "var(--cp-eixo-terra)", badge: "✦ Novo", icon: <Mountain size={14} /> },
  { href: "/assembleias", titulo: "27 Assembleias Legislativas", descricao: "Deputados estaduais, gastos, tramitação e comissões das 27 UFs.", cor: "var(--cp-eixo-estado)", badge: "✦ Novo", icon: <Landmark size={14} /> },
  { href: "/memoria", titulo: "Linha do Tempo das Lutas & Memória", descricao: "6 décadas de lutas populares, terra, trabalho e resistência.", cor: "var(--cp-alert)", badge: "✦ Memória", icon: <Users size={14} /> },
  { href: "/europa", titulo: "Europa & Conexões Transnacionais", descricao: "BHP em Londres, Braskem em Roterdã e devida diligência da UE.", cor: "var(--cp-eixo-estado)", badge: "✦ Internacional", icon: <Globe size={14} /> },
  { href: "/eua", titulo: "Estados Unidos & Wall Street", descricao: "SEC, USGS, capitais financeiros e investidores institucionais.", cor: "var(--cp-eixo-estado)", badge: "✦ Internacional", icon: <Landmark size={14} /> },
  { href: "/canada", titulo: "Canadá & Bolsa de Toronto", descricao: "TSX, NRCan e grandes mineradoras canadenses no Brasil.", cor: "var(--cp-eixo-estado)", badge: "✦ Internacional", icon: <Mountain size={14} /> },
  { href: "/internacional", titulo: "Hubs Internacionais", descricao: "ONU, UNESCO, OMS, OMC, EUA, Canadá e G20 num acervo só.", cor: "var(--cp-eixo-estado)", badge: "✦ Novo", icon: <Globe size={14} /> },
  { href: "/internacional/inteligencia", titulo: "Central de Inteligência & 12 Eyes", descricao: "Dossiês desclassificados da CIA, FBI, NSA, Five Eyes e potências do G20.", cor: "var(--cp-eixo-estado)", badge: "✦ Novo", icon: <ShieldCheck size={14} /> },
  { href: "/internacional/inteligencia/mapa", titulo: "Mapa Global de Inteligência", descricao: "Visualização geoespacial interativa de agências, dossiês e operações secretas.", cor: "var(--cp-eixo-estado)", badge: "✦ Mapa", icon: <MapPin size={14} /> },
  { href: "/radio", titulo: "Rádios Cívicas & Comunitárias", descricao: "Vozes do território, boletins de áudio e emissoras locais.", cor: "var(--cp-primary)", badge: "✦ Áudio", icon: <Sparkles size={14} /> },
  { href: "/laboratorio", titulo: "Laboratório de Dados", descricao: "Compare dois conjuntos de dados em gráficos dither com auxílio do Seu Nonô.", cor: "var(--cp-geral, #7c7c9c)", badge: "✦ Novo", icon: <BarChart3 size={14} /> },
  { href: "/laboratorio/arvore", titulo: "Árvore de Conexões (Obsidian)", descricao: "Visualização interativa em grafo com os 4 grandes eixos cívicos e 38 nós temáticos interligados.", cor: "var(--cp-eixo-terra)", badge: "✦ Grafo", icon: <TreeDeciduous size={14} /> },
  { href: "/paraopeba/biblioteca", titulo: "Biblioteca de Documentos", descricao: "Acervo de publicações das ATIs, perícia e órgãos ambientais.", cor: "var(--cp-secondary)", badge: "Paraopeba", icon: <BookOpen size={14} /> },
  { href: "/dados/populares", titulo: "Páginas mais vistas", descricao: "O que as pessoas mais consultam.", cor: "var(--cp-accent)", badge: "Transversal", icon: <BarChart3 size={14} /> },
  { href: "/dados/comunicabr", titulo: "Governo federal nas cidades", descricao: "Repasses e ações da União em Minas Gerais.", cor: "var(--cp-accent)", badge: "Transversal", icon: <Globe size={14} /> },
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
  { href: "/empresas/fortunas", titulo: "Bilionários & Fortunas Minerais", descricao: "Rastreamento patrimonial e grupos controladores da mineração.", cor: "var(--cp-secondary)", badge: "✦ Mercado", icon: <Building2 size={14} /> },
  { href: "/biblioteca", titulo: "Biblioteca Geral & Pesquisa", descricao: "24.000 documentos, estudos de ATIs, relatórios periciais e decisões LAI.", cor: "var(--cp-accent)", badge: "Acervo", icon: <BookOpen size={14} /> },
  { href: "/judiciario/recomendacoes", titulo: "Recomendações CNJ & CNMP", descricao: "O que os conselhos nacionais mandaram corrigir em tribunais e promotorias.", cor: "var(--cp-secondary)", badge: "Justiça", icon: <Scale size={14} /> },
  { href: "/judiciario/contatos", titulo: "Varas e Balcão Virtual", descricao: "Telefone, e-mail, titular e balcão virtual de 990 varas de MG e cidades do Brasil.", cor: "var(--cp-secondary)", badge: "Judiciário", icon: <Scale size={14} /> },
  { href: "/sobre", titulo: "Sobre", descricao: "O que é, de onde vem os dados e quem somos.", cor: "var(--cp-primary)", badge: "Portal", icon: <BookOpen size={14} /> },
  { href: "/termos", titulo: "Termos e origem dos dados", descricao: "Licença, fontes e limitações.", cor: "var(--cp-primary)", badge: "Portal", icon: <FileText size={14} /> },
];

/**
 * Cartões da seção "Por situação" — a porta de quem chega com um
 * PROBLEMA na mão ("quero denunciar", "preciso de ajuda").
 *
 * Mesma razão de `TOPICOS_TEMAS`: constante de módulo, ordem e texto
 * idênticos aos de antes, só que fora do corpo da página.
 */
const TOPICOS_SITUACOES: Topico[] = [
  { href: "/direitos-em-movimento/denuncia", titulo: "Quero denunciar", descricao: "Canais de denúncia e proteção.", cor: "var(--cp-alert)", badge: "Ação", icon: <Shield size={14} /> },
  { href: "/laboratorio", titulo: "Quero comparar dados lado a lado", descricao: "Abra duas janelas com gráficos de pontos e filtros por palavra-chave.", cor: "var(--cp-geral, #7c7c9c)", badge: "Ação", icon: <BarChart3 size={14} /> },
  { href: "/direitos-em-movimento/ajuda", titulo: "Preciso de ajuda", descricao: "Onde encontrar assistência jurídica e social.", cor: "var(--cp-alert)", badge: "Ação", icon: <HelpCircle size={14} /> },
  { href: "/noticias/tarifa-social-energia-agua-como-acessar", titulo: "Quero desconto na conta de luz e água", descricao: "Veja o passo a passo da Tarifa Social por estado e distribuidora.", cor: "var(--cp-primary)", badge: "Ação", icon: <Sparkles size={14} /> },
  { href: "/direitos-em-movimento/conselhos", titulo: "Quero participar do conselho da minha cidade", descricao: "Reuniões e contatos de CMS, CODEMA, Tutelares e Direitos Humanos.", cor: "var(--cp-alert)", badge: "Ação", icon: <Users size={14} /> },
  { href: "/judiciario/contatos", titulo: "Preciso falar com a Vara ou Fórum", descricao: "Contatos com DDD, e-mails, endereços com CEP e balcão virtual das 298 comarcas de MG e polos do país.", cor: "var(--cp-secondary)", badge: "Ação", icon: <Scale size={14} /> },
  { href: "/governo", titulo: "Quero checar se o governo cumpriu", descricao: "Painel comparativo de promessas de campanha versus entregas reais.", cor: "var(--cp-primary)", badge: "Ação", icon: <Landmark size={14} /> },
  { href: "/assembleias", titulo: "Quero vigiar a Assembleia Legislativa", descricao: "Projetos de lei, ranking de deputados e gastos das 27 Assembleias Estaduais.", cor: "var(--cp-secondary)", badge: "Ação", icon: <Landmark size={14} /> },
  { href: "/cidades", titulo: "Quero dados da minha cidade", descricao: "Painel mestre com 203 cidades estratégicas do Brasil com SUS, PIB e contratos.", cor: "var(--cp-tertiary)", badge: "Ação", icon: <MapPin size={14} /> },
  { href: "/instituicoes", titulo: "Quero o contato oficial de um órgão", descricao: "Organograma, presidente, telefone, e-mail e endereço de órgãos públicos.", cor: "var(--cp-secondary)", badge: "Ação", icon: <Building2 size={14} /> },
  { href: "/paraopeba/entenda", titulo: "Quero entender Brumadinho", descricao: "Reparação, auxílio e acompanhamento do Acordo.", cor: "var(--cp-secondary)", badge: "Ação", icon: <AlertTriangle size={14} /> },
  { href: "/paraopeba/vale", titulo: "Quero dados da Vale", descricao: "Cotações na B3, documentos CVM e notícias da empresa.", cor: "var(--cp-secondary)", badge: "Ação", icon: <BarChart3 size={14} /> },
  { href: "/ambiental/mariana", titulo: "Quero o Acordo de Mariana", descricao: "Execução dos R$ 171 bi da repactuação histórica do Rio Doce.", cor: "var(--cp-tertiary)", badge: "Ação", icon: <Leaf size={14} /> },
  { href: "/ambiental/barragens", titulo: "Moro perto de uma barragem", descricao: "Situação e risco de barragens em Minas Gerais.", cor: "var(--cp-tertiary)", badge: "Ação", icon: <MapPin size={14} /> },
  { href: "/funcaosocialterra/mapa", titulo: "Quero ver o território", descricao: "Globo 3D com camadas de mineração, CAR, UCs e mais.", cor: "var(--cp-accent)", badge: "Ação", icon: <Map size={14} /> },
  { href: "/memoria", titulo: "Quero conhecer a história das lutas populares", descricao: "Linha do tempo com 6 décadas de resistência do campo e da cidade.", cor: "var(--cp-alert)", badge: "Ação", icon: <Users size={14} /> },
  { href: "/europa", titulo: "Quero acompanhar processos no exterior", descricao: "Ações na Corte de Londres (BHP/Mariana) e Haia/Roterdã.", cor: "var(--cp-eixo-estado)", badge: "Ação", icon: <Globe size={14} /> },
  { href: "/internacional/inteligencia", titulo: "Quero investigar relatórios de inteligência", descricao: "Dossiês desclassificados da CIA, FBI, NSA e Twelve Eyes com fontes primárias.", cor: "var(--cp-eixo-estado)", badge: "Ação", icon: <ShieldCheck size={14} /> },
  { href: "/radio", titulo: "Quero ouvir as rádios comunitárias", descricao: "Transmissões e boletins de áudio dos territórios de resistência.", cor: "var(--cp-primary)", badge: "Ação", icon: <Sparkles size={14} /> },
];

/**
 * Os 4 Grandes Eixos Temáticos, NA ORDEM DA TELA (1 a 4).
 *
 * Antes eram ~192 linhas de JSX repetido dentro de `IndiceGlobal` — o
 * grosso do Large Method. Como a estrutura é igual e só o "vestido"
 * muda, o código virou dado: um array com as quatro variações e um
 * componente (`CartaoEixo`) que desenha qualquer uma delas.
 *
 * O comentário editorial do Eixo 2 (Tarifa Social apontar para a
 * notícia, e não para a rede de proteção) fica embaixo, na própria
 * entrada — decisão de conteúdo não se perde em refatoração.
 */
const EIXOS: EixoCartao[] = [
  {
    rotulo: "EIXO 1",
    titulo: "Terra e Territórios",
    descricao:
      "203 Cidades Estratégicas, Bacias Paraopeba e Rio Doce (Brumadinho e Mariana), barragens, clima, licenciamento e Globo 3D.",
    icone: <Globe className="h-5 w-5 text-emerald-500" />,
    rodape: { href: "/terra-e-territorios", texto: "Explorar Eixo 1 Completo" },
    classes: {
      cartao:
        "group flex flex-col justify-between rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 transition hover:border-emerald-500 hover:bg-emerald-500/10 shadow-xs",
      selo: "rounded border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-xs font-bold uppercase text-emerald-500",
      titulo: "font-display text-lg font-bold text-text group-hover:text-emerald-500 transition-colors",
      blocoSubfrentes: "mt-4 pt-3 border-t border-emerald-500/20 space-y-1.5",
      rotuloSubfrentes: "text-[10px] font-bold uppercase tracking-wider text-emerald-400",
      itemSubfrente: "font-medium text-emerald-300",
      rodape: "mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-semibold text-emerald-500 hover:underline",
    },
    subfrentes: [
      { href: "/funcaosocialterra/mapa", texto: "✦ Função Social & Globo 3D" },
      { href: "/ambiental/mariana", texto: "✦ Repactuação Mariana (R$ 171 bi)" },
      { href: "/paraopeba", texto: "✦ Reparação Paraopeba (Brumadinho)" },
      { href: "/ambiental/licenciamento", texto: "✦ Licenciamentos Ambientais (11 UFs)" },
    ],
  },
  {
    rotulo: "EIXO 2",
    titulo: "Direitos em Movimento",
    descricao:
      "Saúde (SUS), Educação (IDEB), Trabalho (CAGED), Conselhos de Direitos, LAI, canal de denúncia e assistência jurídica.",
    icone: <HeartHandshake className="h-5 w-5 text-alert" />,
    rodape: { href: "/direitos-em-movimento", texto: "Explorar Eixo 2 Completo" },
    classes: {
      cartao:
        "group flex flex-col justify-between rounded-2xl border-2 border-alert/40 bg-alert/5 p-5 transition hover:border-alert hover:bg-alert/10 shadow-xs",
      selo: "rounded border border-alert/30 bg-alert/20 px-2 py-0.5 text-xs font-bold uppercase text-alert",
      titulo: "font-display text-lg font-bold text-text group-hover:text-alert transition-colors",
      blocoSubfrentes: "mt-4 pt-3 border-t border-alert/20 space-y-1.5",
      rotuloSubfrentes: "text-[10px] font-bold uppercase tracking-wider text-alert",
      itemSubfrente: "font-medium text-amber-300",
      rodape: "mt-4 pt-3 border-t border-alert/20 flex items-center justify-between text-xs font-semibold text-alert hover:underline",
    },
    subfrentes: [
      { href: "/memoria", texto: "✦ Linha do Tempo das Lutas & Memória" },
      { href: "/ambiental/legislacao", texto: "✦ Que Lei Protege Isso (Biblioteca)" },
      { href: "/direitos-em-movimento/saude-publica", texto: "✦ Saúde Pública & SUS" },
      // Tarifa Social aponta para a notícia (passo a passo do desconto);
      // Ajuda continua na rede de proteção. Decisão de conteúdo, 08/2026.
      { href: "/noticias/tarifa-social-energia-agua-como-acessar", texto: "✦ Tarifa Social de Água & Luz" },
      { href: "/direitos-em-movimento/ajuda", texto: "✦ Onde Buscar Ajuda" },
    ],
  },
  {
    rotulo: "EIXO 3",
    titulo: "Estado e Economia",
    descricao:
      "Orçamento de MG, Compras Públicas (PNCP), Congresso Nacional, Assembleias Legislativas (27 UFs), Quem fiscaliza a Justiça, Varas e Empresas ESG.",
    icone: <Landmark className="h-5 w-5 text-sky-500" />,
    rodape: { href: "/estado-e-economia", texto: "Explorar Eixo 3 Completo" },
    classes: {
      cartao:
        "group flex flex-col justify-between rounded-2xl border-2 border-sky-500/40 bg-sky-500/5 p-5 transition hover:border-sky-500 hover:bg-sky-500/10 shadow-xs",
      selo: "rounded border border-sky-500/30 bg-sky-500/20 px-2 py-0.5 text-xs font-bold uppercase text-sky-500",
      titulo: "font-display text-lg font-bold text-text group-hover:text-sky-500 transition-colors",
      blocoSubfrentes: "mt-4 pt-3 border-t border-sky-500/20 space-y-1.5",
      rotuloSubfrentes: "text-[10px] font-bold uppercase tracking-wider text-sky-400",
      itemSubfrente: "font-medium text-sky-300",
      rodape: "mt-4 pt-3 border-t border-sky-500/20 flex items-center justify-between text-xs font-semibold text-sky-500 hover:underline",
    },
    subfrentes: [
      { href: "/estado-e-economia/orcamento", texto: "✦ Orçamento & Receitas de MG" },
      { href: "/judiciario/instituicoes", texto: "✦ Quem Fiscaliza a Justiça" },
      { href: "/assembleias", texto: "✦ 27 Assembleias Legislativas" },
      { href: "/ambiental/contratos", texto: "✦ Radar de Compras & Contratos" },
    ],
  },
  {
    rotulo: "EIXO 4",
    titulo: "Central ONSA & Ferramentas",
    descricao:
      "Radar Diário de Editais (DO-MG), Biblioteca Digital, Árvore de Conexões em Grafo 3D, Assistente Seu Nonô, Rádios Cívicas e Laboratório.",
    icone: <Compass className="h-5 w-5 text-primary" />,
    rodape: { href: "/central", texto: "Explorar Central ONSA" },
    classes: {
      cartao:
        "group flex flex-col justify-between rounded-2xl border-2 border-primary/40 bg-primary/5 p-5 transition hover:border-primary hover:bg-primary/10 shadow-xs",
      selo: "rounded border border-primary/30 bg-primary/20 px-2 py-0.5 text-xs font-bold uppercase text-primary",
      titulo: "font-display text-lg font-bold text-text group-hover:text-primary transition-colors",
      blocoSubfrentes: "mt-4 pt-3 border-t border-primary/20 space-y-1.5",
      rotuloSubfrentes: "text-[10px] font-bold uppercase tracking-wider text-primary",
      itemSubfrente: "font-medium text-amber-200",
      rodape: "mt-4 pt-3 border-t border-primary/20 flex items-center justify-between text-xs font-semibold text-primary hover:underline",
    },
    subfrentes: [
      { href: "/editais", texto: "✦ Radar de Editais Diários (DO-MG)" },
      { href: "/biblioteca", texto: "✦ Biblioteca Digital (24k+ Docs)" },
      { href: "/laboratorio/arvore", texto: "✦ Árvore de Conexões em Grafo 3D" },
      { href: "/assistente", texto: "✦ Assistente Cívico Seu Nonô" },
    ],
  },
];

/**
 * Monta as 4 seções do índice, NA ORDEM DE ANTES: frentes, cidades,
 * temas transversais e situações.
 *
 * As duas primeiras são dinâmicas (vêm de `ZONAS_PUBLICADAS` e do
 * banco); as outras duas são as constantes fixas do módulo. A ordem
 * importa porque as âncoras do sumário (`IndiceWiki`) saem daqui.
 *
 * @param cidades municípios ativos, para a seção "Por cidade".
 * @returns as 4 seções com id, título e cartões.
 */
function montarSecoes(cidades: Cidades): SecaoIndice[] {
  return [
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
          descricao: `Dados públicos de ${c.nome}-${c.uf}.`,
          cor: "var(--cp-primary)",
          badge: `${c.uf}`,
          icon: <Building2 size={14} />,
        })
      ),
    },
    { id: "transversal", titulo: "Por tema", topicos: TOPICOS_TEMAS },
    { id: "situacoes", titulo: "Por situação", topicos: TOPICOS_SITUACOES },
  ];
}

/**
 * Monta os itens do sumário interno (`IndiceWiki`) — na mesma ordem de
 * antes: as 4 seções fixas do topo e depois as 4 seções do índice.
 *
 * O sumário é o primeiro navegar de quem chega com pressa: ele aponta
 * para as âncoras `#id` que as seções realmente usam, então os ids
 * têm de casar — é o que o teste de equivalência confere.
 *
 * @param secoes as seções montadas por `montarSecoes()`.
 * @returns a lista de âncoras do sumário.
 */
function montarItensIndice(secoes: SecaoIndice[]): ItemIndice[] {
  return [
    { id: "eixos-tematicos", titulo: "Os 4 Grandes Eixos" },
    { id: "mapa-3d-destaque", titulo: "✦ Mapa 3D do Território" },
    { id: "catalogo-100-paginas", titulo: "Catálogo Completo de Páginas" },
    { id: "novidades", titulo: "Novidades Recentes" },
    ...secoes.map((s) => ({ id: s.id, titulo: s.titulo })),
  ];
}

/**
 * Página `/indice` — monta os dados e devolve a página na ordem antiga.
 *
 * @returns o JSX da página (componente assíncrono do App Router).
 */
export default async function IndiceGlobal() {
  const cidades = await listarCidades();
  const novidadesMescladas = montarNovidades();
  const secoes = montarSecoes(cidades);

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl px-4 py-8"
    >
      <CabecalhoIndice itens={montarItensIndice(secoes)} />

      <SecaoEixosTematicos />

      <DestaqueMapa3D />

      {/* ═══ O CATÁLOGO DAS 100 PRINCIPAIS PÁGINAS ═══ */}
      <div className="mt-14">
        <Catalogo100PaginasClient paginas={paginas100 as PaginaCatalogo[]} />
      </div>

      <SecaoNovidades itens={novidadesMescladas} />

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

/**
 * Abertura da página: capa com foto, título, resumo e o sumário interno.
 *
 * @param itens âncoras do sumário, montadas por `montarItensIndice()`.
 * @returns capa + cabeçalho + `IndiceWiki`.
 */
function CabecalhoIndice({ itens }: { itens: ItemIndice[] }) {
  return (
    <>
      <CapaFrente
        imagem="capas/home-page.webp"
        alt="Capa do Controle Popular — índice geral do portal"
        titulo="CONTROLE POPULAR"
        epigrafe=""
        atribuicao=""
        resumo={`${ZONAS_PUBLICADAS.length} frentes, um portal, o número na sua tela. Escolha uma porta — todas levam ao dado com a fonte ao lado.`}
        className="mb-10 -mx-4 sm:-mx-8"
      />
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Índice do Controle Popular</h1>
        <p className="max-w-2xl text-text-soft">
          Tudo o que o portal vigia, organizado do seu jeito: por eixos temáticos, pelo mapa 3D do território, pelo catálogo completo de páginas, por frente, por cidade ou por tema.
        </p>
      </header>

      <IndiceWiki itens={itens} />
    </>
  );
}

/**
 * Seção dos 4 Grandes Eixos Temáticos — a arquitetura cívica do portal.
 *
 * O cabeçalho da seção e a grade ficam aqui; os quatro cartões saem da
 * tabela `EIXOS` e são desenhados por um componente só (`CartaoEixo`).
 * Foram 192 linhas de JSX repetido dentro de `IndiceGlobal` — o grosso
 * do Large Method que derrubava a saúde deste arquivo.
 *
 * @returns a `<section>` completa dos eixos.
 */
function SecaoEixosTematicos() {
  return (
    <>
      {/* ═══ OS 4 GRANDES EIXOS TEMÁTICOS DO PORTAL ═══ */}
      <section id="eixos-tematicos" className="mt-12 scroll-mt-20">
        <div className="mb-5">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Arquitetura Cívica</span>
          <h2 className="font-display text-2xl font-bold text-text">Os Quatro Grandes Eixos Temáticos</h2>
          <p className="mt-1 text-sm text-text-soft">
            Toda a fiscalização do portal é organizada em quatro eixos de interesse social e transparência cívica.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EIXOS.map((eixo) => (
            <CartaoEixo key={eixo.rotulo} eixo={eixo} />
          ))}
        </div>
      </section>
    </>
  );
}

/**
 * Cartão de um eixo temático — desenha qualquer um dos 4 (`EIXOS`).
 *
 * Um componente só, no lugar de quatro cópias do mesmo JSX: o que muda
 * entre os eixos está todo na tabela, e a estrutura fica escrita uma vez.
 *
 * @param eixo entrada da tabela: textos, ícone, classes e subfrentes.
 * @returns o `<div>` completo do cartão, na ordem da tela.
 */
function CartaoEixo({ eixo }: { eixo: EixoCartao }) {
  return (
    <div className={eixo.classes.cartao}>
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className={eixo.classes.selo}>{eixo.rotulo}</span>
          {eixo.icone}
        </div>
        <h3 className={eixo.classes.titulo}>{eixo.titulo}</h3>
        <p className="mt-2 text-xs text-text-soft leading-relaxed">{eixo.descricao}</p>

        {/* Subfrentes em Destaque */}
        <div className={eixo.classes.blocoSubfrentes}>
          <span className={eixo.classes.rotuloSubfrentes}>✦ Subfrentes em Destaque:</span>
          <ul className="text-xs space-y-1 text-text">
            {eixo.subfrentes.map((s) => (
              <li key={s.href} className={eixo.classes.itemSubfrente}>
                <Link href={s.href} className="hover:underline">{s.texto}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Link href={eixo.rodape.href} className={eixo.classes.rodape}>
        <span>{eixo.rodape.texto}</span>
        <span>→</span>
      </Link>
    </div>
  );
}

/**
 * Destaque do Globo 3D — o mapa interativo do território.
 *
 * Seção sem dados: todo o texto e os totais são fixos e estão escritos
 * aqui, como estavam no corpo da página.
 *
 * @returns a `<section>` do destaque do mapa 3D.
 */
function DestaqueMapa3D() {
  return (
    <section id="mapa-3d-destaque" className="mt-12 scroll-mt-20">
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-surface to-surface-2 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Globe size={14} className="text-emerald-400" aria-hidden="true" />
              <span>Visualizador Cartográfico Oficial em 3D</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              Globo 3D & Mapa Interativo do Território
            </h2>
            <p className="text-sm sm:text-base text-text-soft leading-relaxed">
              Navegue pelas camadas territoriais de todo o Brasil: mais de 1.480 processos minerários ativos da ANM, Cadastro Ambiental Rural (CAR), Terras Indígenas, Territórios Quilombolas, Unidades de Conservação e bacias hidrográficas do Rio Doce e Paraopeba com renderização vetorial tridimensional.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-emerald-300 font-medium">
              <span className="rounded-md bg-emerald-950/60 px-2.5 py-1 border border-emerald-800/40">✦ 1.488 Minerações ANM</span>
              <span className="rounded-md bg-emerald-950/60 px-2.5 py-1 border border-emerald-800/40">✦ 203 Cidades Polo</span>
              <span className="rounded-md bg-emerald-950/60 px-2.5 py-1 border border-emerald-800/40">✦ Camadas CAR / IEF-MG</span>
              <span className="rounded-md bg-emerald-950/60 px-2.5 py-1 border border-emerald-800/40">✦ 100% Livre e Acessível</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <Link
              href="/funcaosocialterra/mapa"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Globe size={18} aria-hidden="true" />
              <span>Abrir Globo 3D Agora</span>
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/funcaosocialterra"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 hover:bg-surface px-4 py-2.5 text-xs font-semibold text-text-soft hover:text-foreground transition-colors"
            >
              <span>Painel Função Social da Terra</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Seção "Novidades Recentes": os 8 itens mais novos em cartões.
 *
 * @param itens lista pronta, montada por `montarNovidades()`.
 * @returns a `<section id="novidades">`.
 */
function SecaoNovidades({ itens }: { itens: ItemNovidade[] }) {
  return (
    <section className="mt-14 scroll-mt-20" id="novidades">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
        <Sparkles size={20} className="text-primary" aria-hidden="true" />
        Novidades
        <Link href="/novidades" className="ml-auto text-[11px] font-medium text-text-soft hover:text-primary">
          ver tudo
        </Link>
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((item, i) => (
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
  );
}
