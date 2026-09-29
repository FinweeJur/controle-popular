/**
 * @file arvore-galhos.ts
 * @description Mapeador de galhos da árvore do mapa do site e grafo de conexões cívicas.
 * 
 * Papel no portal:
 * 1. Fornece links de páginas irmãs e subfrentes relacionadas para o assistente Seu Nonô.
 * 2. Alimenta a visualização de Grafo/Árvore estilo Obsidian com nós e arestas conectadas.
 * 3. Enquadra qualquer rota ou busca dentro dos 4 Grandes Eixos Temáticos do portal.
 * 
 * Fonte dos dados:
 * Catálogo canônico de rotas do App Router, mapa do índice geral (/indice)
 * e árvore temática definida na arquitetura cívica do Controle Popular.
 * 
 * Decisões técnicas:
 * - Estrutura leve em TypeScript puro sem dependências externas pesadas.
 * - Suporta consulta rápida O(1)/O(N) por prefixo de URL ou palavras-chave.
 * - Gera nós e arestas bidirecionais para renderização em SVG e Canvas.
 */

export interface NoArvore {
  id: string;
  titulo: string;
  href: string;
  eixoId: "direitos" | "territorios" | "estado" | "central";
  subgalho: string;
  rotuloCurto: string;
  cor: string;
  tamanho: number; // Raio do ponto no grafo (ex: 6 a 18)
  destaque?: boolean;
}

export interface ArestaArvore {
  fonte: string; // id do nó de origem
  alvo: string;  // id do nó de destino
  tipo: "hierarquia" | "relacionado" | "fluxo_dados";
  descricao?: string;
}

export interface EixoTematicoInfo {
  id: "direitos" | "territorios" | "estado" | "central";
  nome: string;
  numero: string;
  cor: string;
  href: string;
  descricao: string;
}

export const EIXOS_PORTAL: Record<string, EixoTematicoInfo> = {
  direitos: {
    id: "direitos",
    nome: "Direitos em Movimento",
    numero: "Eixo 1",
    cor: "var(--cp-alert, #ea580c)",
    href: "/direitos-em-movimento",
    descricao: "Cidadania ativa, saúde pública, educação, trabalho, ouvidorias e LAI.",
  },
  territorios: {
    id: "territorios",
    nome: "Terra e Territórios",
    numero: "Eixo 2",
    cor: "var(--cp-eixo-terra, #10b981)",
    href: "/terra-e-territorios",
    descricao: "199 Cidades, bacias hidrográficas, barragens, mineração e Globo 3D.",
  },
  estado: {
    id: "estado",
    nome: "Estado e Economia",
    numero: "Eixo 3",
    cor: "var(--cp-eixo-estado, #0284c7)",
    href: "/estado-e-economia",
    descricao: "Orçamento estadual, compras públicas (PNCP), Poder Judiciário e empresas.",
  },
  central: {
    id: "central",
    nome: "Eixo Central & Ferramentas Cívicas",
    numero: "Eixo ONSA",
    cor: "var(--cp-primary, #c2410c)",
    href: "/central",
    descricao: "Laboratório de dados, editais, biblioteca, IA livre e relatórios cívicos.",
  },
};

/**
 * Catálogo canônico dos nós da Árvore Cívica do Portal.
 */
export const NOS_ARVORE: NoArvore[] = [
  // ── Tronco Central ────────────────────────────────────────────────────────
  {
    id: "raiz-portal",
    titulo: "Portal Controle Popular",
    href: "/",
    eixoId: "central",
    subgalho: "Tronco",
    rotuloCurto: "Início",
    cor: "#c2410c",
    tamanho: 24,
    destaque: true,
  },

  // ── EIXO 1: DIREITOS EM MOVIMENTO ─────────────────────────────────────────
  {
    id: "eixo-direitos",
    titulo: "Direitos em Movimento",
    href: "/direitos-em-movimento",
    eixoId: "direitos",
    subgalho: "Eixo 1",
    rotuloCurto: "Direitos",
    cor: "#ea580c",
    tamanho: 18,
    destaque: true,
  },
  {
    id: "dir-saude",
    titulo: "Saúde Pública & SUS",
    href: "/direitos-em-movimento/saude-publica",
    eixoId: "direitos",
    subgalho: "Serviços Essenciais",
    rotuloCurto: "Saúde",
    cor: "#f97316",
    tamanho: 11,
  },
  {
    id: "dir-educacao",
    titulo: "Educação & Escolas (IDEB)",
    href: "/direitos-em-movimento/educacao",
    eixoId: "direitos",
    subgalho: "Serviços Essenciais",
    rotuloCurto: "Educação",
    cor: "#f97316",
    tamanho: 11,
  },
  {
    id: "dir-trabalho",
    titulo: "Trabalho & Emprego (CAGED)",
    href: "/direitos-em-movimento/trabalho-e-renda",
    eixoId: "direitos",
    subgalho: "Economia Popular",
    rotuloCurto: "Trabalho",
    cor: "#f97316",
    tamanho: 10,
  },
  {
    id: "dir-ajuda",
    titulo: "Onde Buscar Ajuda Jurídica",
    href: "/direitos-em-movimento/ajuda",
    eixoId: "direitos",
    subgalho: "Defesa e Proteção",
    rotuloCurto: "Ajuda Jurídica",
    cor: "#fb923c",
    tamanho: 12,
  },
  {
    id: "dir-denuncia",
    titulo: "Canal de Denúncia & Ouvidorias",
    href: "/direitos-em-movimento/denuncia",
    eixoId: "direitos",
    subgalho: "Defesa e Proteção",
    rotuloCurto: "Denúncias",
    cor: "#fb923c",
    tamanho: 12,
  },
  {
    id: "dir-lai",
    titulo: "Pedido de Informação (LAI)",
    href: "/direitos-em-movimento/informacao",
    eixoId: "direitos",
    subgalho: "Transparência Cidadã",
    rotuloCurto: "Canais LAI",
    cor: "#fb923c",
    tamanho: 11,
  },
  {
    id: "dir-conselhos",
    titulo: "Conselhos de Direitos & Colegiados",
    href: "/direitos-em-movimento/conselhos",
    eixoId: "direitos",
    subgalho: "Controle Social",
    rotuloCurto: "Conselhos",
    cor: "#f97316",
    tamanho: 11,
  },
  {
    id: "dir-comunicabr",
    titulo: "ComunicaBR — Repasses Federais",
    href: "/dados/comunicabr",
    eixoId: "direitos",
    subgalho: "Políticas Federais",
    rotuloCurto: "ComunicaBR",
    cor: "#f97316",
    tamanho: 13,
  },

  // ── EIXO 2: TERRA E TERRITÓRIOS ───────────────────────────────────────────
  {
    id: "eixo-territorios",
    titulo: "Terra e Territórios",
    href: "/terra-e-territorios",
    eixoId: "territorios",
    subgalho: "Eixo 2",
    rotuloCurto: "Territórios",
    cor: "#10b981",
    tamanho: 18,
    destaque: true,
  },
  {
    id: "ter-cidades",
    titulo: "199 Cidades Estratégicas",
    href: "/cidades",
    eixoId: "territorios",
    subgalho: "Municípios Monitorados",
    rotuloCurto: "199 Cidades",
    cor: "#10b981",
    tamanho: 15,
  },
  {
    id: "ter-betim",
    titulo: "Betim / MG",
    href: "/betim",
    eixoId: "territorios",
    subgalho: "Municípios Monitorados",
    rotuloCurto: "Betim",
    cor: "#34d399",
    tamanho: 12,
  },
  {
    id: "ter-bh",
    titulo: "Belo Horizonte / MG",
    href: "/bh",
    eixoId: "territorios",
    subgalho: "Municípios Monitorados",
    rotuloCurto: "Belo Horizonte",
    cor: "#34d399",
    tamanho: 12,
  },
  {
    id: "ter-diamantina",
    titulo: "Diamantina / MG",
    href: "/diamantina",
    eixoId: "territorios",
    subgalho: "Municípios Monitorados",
    rotuloCurto: "Diamantina",
    cor: "#34d399",
    tamanho: 10,
  },
  {
    id: "ter-jequitinhonha",
    titulo: "Vale do Jequitinhonha (Araçuaí/Itinga)",
    href: "/aracuai",
    eixoId: "territorios",
    subgalho: "Municípios Monitorados",
    rotuloCurto: "Jequitinhonha",
    cor: "#34d399",
    tamanho: 11,
  },
  {
    id: "ter-barragens",
    titulo: "Painel de Barragens de Mineração",
    href: "/ambiental/barragens",
    eixoId: "territorios",
    subgalho: "Segurança de Barragens",
    rotuloCurto: "Barragens",
    cor: "#059669",
    tamanho: 14,
  },
  {
    id: "ter-descaracterizacao",
    titulo: "Descaracterização de Barragens",
    href: "/ambiental/barragens/descaracterizacao",
    eixoId: "territorios",
    subgalho: "Segurança de Barragens",
    rotuloCurto: "Descaracterização",
    cor: "#059669",
    tamanho: 11,
  },
  {
    id: "ter-condicionantes",
    titulo: "Condicionantes Ambientais",
    href: "/ambiental/condicionantes",
    eixoId: "territorios",
    subgalho: "Licenciamento",
    rotuloCurto: "Condicionantes",
    cor: "#059669",
    tamanho: 11,
  },
  {
    id: "ter-licenciamento",
    titulo: "Licenciamento & COPAM",
    href: "/ambiental/licenciamento",
    eixoId: "territorios",
    subgalho: "Licenciamento",
    rotuloCurto: "Licenciamento",
    cor: "#059669",
    tamanho: 12,
  },
  {
    id: "ter-brumadinho",
    titulo: "Brumadinho & Acordo Paraopeba",
    href: "/paraopeba",
    eixoId: "territorios",
    subgalho: "Grandes Repactuações",
    rotuloCurto: "Paraopeba",
    cor: "#047857",
    tamanho: 14,
  },
  {
    id: "ter-mariana",
    titulo: "Acordo de Mariana (Rio Doce)",
    href: "/ambiental/mariana",
    eixoId: "territorios",
    subgalho: "Grandes Repactuações",
    rotuloCurto: "Rio Doce",
    cor: "#047857",
    tamanho: 14,
  },
  {
    id: "ter-globo",
    titulo: "Globo 3D do Território",
    href: "/funcaosocialterra/mapa",
    eixoId: "territorios",
    subgalho: "Geotecnologia Cívica",
    rotuloCurto: "Globo 3D",
    cor: "#10b981",
    tamanho: 13,
  },

  // ── EIXO 3: ESTADO E ECONOMIA ─────────────────────────────────────────────
  {
    id: "eixo-estado",
    titulo: "Estado e Economia",
    href: "/estado-e-economia",
    eixoId: "estado",
    subgalho: "Eixo 3",
    rotuloCurto: "Estado & Economia",
    cor: "#0284c7",
    tamanho: 18,
    destaque: true,
  },
  {
    id: "est-orcamento",
    titulo: "Orçamento & Receitas de MG",
    href: "/estado-e-economia/orcamento",
    eixoId: "estado",
    subgalho: "Finanças Públicas",
    rotuloCurto: "Orçamento MG",
    cor: "#0ea5e9",
    tamanho: 13,
  },
  {
    id: "est-compras",
    titulo: "Compras Públicas (PNCP)",
    href: "/estado-e-economia/compras",
    eixoId: "estado",
    subgalho: "Contratações Públicas",
    rotuloCurto: "PNCP Compras",
    cor: "#0ea5e9",
    tamanho: 12,
  },
  {
    id: "est-congresso",
    titulo: "Congresso & Gastos da Bancada de MG",
    href: "/congresso",
    eixoId: "estado",
    subgalho: "Poder Legislativo",
    rotuloCurto: "Congresso",
    cor: "#38bdf8",
    tamanho: 12,
  },
  {
    id: "est-assembleias",
    titulo: "Assembleias Legislativas (27 UFs)",
    href: "/assembleias",
    eixoId: "estado",
    subgalho: "Poder Legislativo",
    rotuloCurto: "Assembleias",
    cor: "#38bdf8",
    tamanho: 12,
  },
  {
    id: "est-judiciario",
    titulo: "Quem Fiscaliza a Justiça",
    href: "/judiciario/instituicoes",
    eixoId: "estado",
    subgalho: "Poder Judiciário",
    rotuloCurto: "Judiciário",
    cor: "#0369a1",
    tamanho: 14,
  },
  {
    id: "est-tjmg",
    titulo: "TJMG — Tribunal de Justiça de MG",
    href: "/judiciario/instituicoes/tjmg",
    eixoId: "estado",
    subgalho: "Poder Judiciário",
    rotuloCurto: "TJMG",
    cor: "#0284c7",
    tamanho: 11,
  },
  {
    id: "est-mpmg",
    titulo: "MPMG — Ministério Público de MG",
    href: "/judiciario/instituicoes/mpmg",
    eixoId: "estado",
    subgalho: "Poder Judiciário",
    rotuloCurto: "MPMG",
    cor: "#0284c7",
    tamanho: 11,
  },
  {
    id: "est-dpmg",
    titulo: "DPMG — Defensoria Pública de MG",
    href: "/judiciario/instituicoes/dpmg",
    eixoId: "estado",
    subgalho: "Poder Judiciário",
    rotuloCurto: "DPMG",
    cor: "#0284c7",
    tamanho: 11,
  },
  {
    id: "est-varas",
    titulo: "Varas, Fóruns & Balcão Virtual",
    href: "/judiciario/contatos",
    eixoId: "estado",
    subgalho: "Poder Judiciário",
    rotuloCurto: "Balcão Virtual",
    cor: "#38bdf8",
    tamanho: 11,
  },
  {
    id: "est-empresas",
    titulo: "Grandes Empresas, Mineradoras & ESG",
    href: "/empresas",
    eixoId: "estado",
    subgalho: "Mercado e Poder",
    rotuloCurto: "Empresas ESG",
    cor: "#0284c7",
    tamanho: 13,
  },

  // ── EIXO CENTRAL & FERRAMENTAS CÍVICAS ────────────────────────────────────
  {
    id: "eixo-central",
    titulo: "Eixo Central & Ferramentas ONSA",
    href: "/central",
    eixoId: "central",
    subgalho: "Eixo Central",
    rotuloCurto: "Eixo Central",
    cor: "#c2410c",
    tamanho: 18,
    destaque: true,
  },
  {
    id: "cen-laboratorio",
    titulo: "Laboratório de Dados & PowerBI",
    href: "/laboratorio",
    eixoId: "central",
    subgalho: "Inteligência Analítica",
    rotuloCurto: "Laboratório",
    cor: "#e11d48",
    tamanho: 15,
  },
  {
    id: "cen-editais",
    titulo: "Radar de Editais & Chamamentos",
    href: "/editais",
    eixoId: "central",
    subgalho: "Vigilância Diária",
    rotuloCurto: "Editais",
    cor: "#e11d48",
    tamanho: 12,
  },
  {
    id: "cen-estudos-rurais",
    titulo: "Estudos Rurais & Vales do Jequitinhonha",
    href: "/estudos-rurais",
    eixoId: "central",
    subgalho: "Pesquisa Cívica",
    rotuloCurto: "Estudos Rurais",
    cor: "#ea580c",
    tamanho: 11,
  },
  {
    id: "cen-biblioteca",
    titulo: "Biblioteca Geral & Acervo de ATIs",
    href: "/biblioteca",
    eixoId: "central",
    subgalho: "Acervo Público",
    rotuloCurto: "Biblioteca",
    cor: "#e11d48",
    tamanho: 12,
  },
  {
    id: "cen-noticias",
    titulo: "Blog & Investigações do ONSA",
    href: "/noticias",
    eixoId: "central",
    subgalho: "Comunicação Cívica",
    rotuloCurto: "Blog & Notícias",
    cor: "#c2410c",
    tamanho: 13,
  },
  {
    id: "cen-documentacao",
    titulo: "Documentação Técnica & API",
    href: "/documentacao",
    eixoId: "central",
    subgalho: "Transparência do Portal",
    rotuloCurto: "Documentação",
    cor: "#ea580c",
    tamanho: 11,
  },
  {
    id: "cen-fontes",
    titulo: "Fontes de Dados dos 27 Estados",
    href: "/fontes-estados",
    eixoId: "central",
    subgalho: "Transparência do Portal",
    rotuloCurto: "27 Estados",
    cor: "#ea580c",
    tamanho: 11,
  },
  {
    id: "cen-tecnologia",
    titulo: "Tecnologia, IA Livre & Seu Nonô",
    href: "/tecnologia",
    eixoId: "central",
    subgalho: "Tecnologia & IA",
    rotuloCurto: "IA Livre",
    cor: "#e11d48",
    tamanho: 12,
  },
  {
    id: "cen-indice",
    titulo: "Índice Geral do Portal",
    href: "/indice",
    eixoId: "central",
    subgalho: "Navegação Estrutural",
    rotuloCurto: "Índice Geral",
    cor: "#c2410c",
    tamanho: 14,
  },
  {
    id: "cen-busca",
    titulo: "Busca Global",
    href: "/busca",
    eixoId: "central",
    subgalho: "Navegação Estrutural",
    rotuloCurto: "Busca",
    cor: "#c2410c",
    tamanho: 12,
  },
];

/**
 * Arestas (conexões) da Árvore Cívica do Portal.
 * Representam a estrutura de galhos hierárquicos e as relações temáticas cruzadas.
 */
export const ARESTAS_ARVORE: ArestaArvore[] = [
  // ── Tronco conectando aos 4 Eixos ─────────────────────────────────────────
  { fonte: "raiz-portal", alvo: "eixo-direitos", tipo: "hierarquia" },
  { fonte: "raiz-portal", alvo: "eixo-territorios", tipo: "hierarquia" },
  { fonte: "raiz-portal", alvo: "eixo-estado", tipo: "hierarquia" },
  { fonte: "raiz-portal", alvo: "eixo-central", tipo: "hierarquia" },

  // ── Conexões do Eixo 1 (Direitos) ─────────────────────────────────────────
  { fonte: "eixo-direitos", alvo: "dir-saude", tipo: "hierarquia" },
  { fonte: "eixo-direitos", alvo: "dir-educacao", tipo: "hierarquia" },
  { fonte: "eixo-direitos", alvo: "dir-trabalho", tipo: "hierarquia" },
  { fonte: "eixo-direitos", alvo: "dir-ajuda", tipo: "hierarquia" },
  { fonte: "eixo-direitos", alvo: "dir-denuncia", tipo: "hierarquia" },
  { fonte: "eixo-direitos", alvo: "dir-lai", tipo: "hierarquia" },
  { fonte: "eixo-direitos", alvo: "dir-conselhos", tipo: "hierarquia" },
  { fonte: "eixo-direitos", alvo: "dir-comunicabr", tipo: "hierarquia" },
  // Cruzamentos temáticos do Eixo 1
  { fonte: "dir-ajuda", alvo: "est-dpmg", tipo: "relacionado", descricao: "Defensoria Pública Gratuita" },
  { fonte: "dir-denuncia", alvo: "est-mpmg", tipo: "relacionado", descricao: "Ouvidoria e Promotorias" },
  { fonte: "dir-lai", alvo: "est-compras", tipo: "relacionado", descricao: "Transparência em Contratos" },
  { fonte: "dir-comunicabr", alvo: "ter-cidades", tipo: "relacionado", descricao: "Repasses por Município" },

  // ── Conexões do Eixo 2 (Terra e Territórios) ──────────────────────────────
  { fonte: "eixo-territorios", alvo: "ter-cidades", tipo: "hierarquia" },
  { fonte: "eixo-territorios", alvo: "ter-barragens", tipo: "hierarquia" },
  { fonte: "eixo-territorios", alvo: "ter-brumadinho", tipo: "hierarquia" },
  { fonte: "eixo-territorios", alvo: "ter-mariana", tipo: "hierarquia" },
  { fonte: "eixo-territorios", alvo: "ter-globo", tipo: "hierarquia" },
  { fonte: "ter-cidades", alvo: "ter-betim", tipo: "hierarquia" },
  { fonte: "ter-cidades", alvo: "ter-bh", tipo: "hierarquia" },
  { fonte: "ter-cidades", alvo: "ter-diamantina", tipo: "hierarquia" },
  { fonte: "ter-cidades", alvo: "ter-jequitinhonha", tipo: "hierarquia" },
  { fonte: "ter-barragens", alvo: "ter-descaracterizacao", tipo: "hierarquia" },
  { fonte: "ter-barragens", alvo: "ter-condicionantes", tipo: "hierarquia" },
  { fonte: "ter-barragens", alvo: "ter-licenciamento", tipo: "hierarquia" },
  // Cruzamentos temáticos do Eixo 2
  { fonte: "ter-barragens", alvo: "ter-brumadinho", tipo: "relacionado", descricao: "Desastres e Barragens" },
  { fonte: "ter-barragens", alvo: "ter-mariana", tipo: "relacionado", descricao: "Rompimento do Fundão" },
  { fonte: "ter-barragens", alvo: "est-empresas", tipo: "relacionado", descricao: "Mineradoras e Proprietárias" },
  { fonte: "ter-brumadinho", alvo: "ter-betim", tipo: "relacionado", descricao: "Município da Bacia do Paraopeba" },
  { fonte: "ter-jequitinhonha", alvo: "cen-estudos-rurais", tipo: "relacionado", descricao: "Pesquisas no Jequitinhonha" },

  // ── Conexões do Eixo 3 (Estado e Economia) ────────────────────────────────
  { fonte: "eixo-estado", alvo: "est-orcamento", tipo: "hierarquia" },
  { fonte: "eixo-estado", alvo: "est-compras", tipo: "hierarquia" },
  { fonte: "eixo-estado", alvo: "est-congresso", tipo: "hierarquia" },
  { fonte: "eixo-estado", alvo: "est-assembleias", tipo: "hierarquia" },
  { fonte: "eixo-estado", alvo: "est-judiciario", tipo: "hierarquia" },
  { fonte: "eixo-estado", alvo: "est-empresas", tipo: "hierarquia" },
  { fonte: "est-judiciario", alvo: "est-tjmg", tipo: "hierarquia" },
  { fonte: "est-judiciario", alvo: "est-mpmg", tipo: "hierarquia" },
  { fonte: "est-judiciario", alvo: "est-dpmg", tipo: "hierarquia" },
  { fonte: "est-judiciario", alvo: "est-varas", tipo: "hierarquia" },
  // Cruzamentos temáticos do Eixo 3
  { fonte: "est-orcamento", alvo: "ter-cidades", tipo: "relacionado", descricao: "Cota-parte de ICMS e IPVA" },
  { fonte: "est-compras", alvo: "ter-betim", tipo: "relacionado", descricao: "Contratos de Betim no PNCP" },
  { fonte: "est-empresas", alvo: "ter-brumadinho", tipo: "relacionado", descricao: "Acordos com a Vale" },

  // ── Conexões do Eixo Central & Ferramentas ────────────────────────────────
  { fonte: "eixo-central", alvo: "cen-laboratorio", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-editais", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-estudos-rurais", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-biblioteca", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-noticias", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-documentacao", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-fontes", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-tecnologia", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-indice", tipo: "hierarquia" },
  { fonte: "eixo-central", alvo: "cen-busca", tipo: "hierarquia" },
  // Cruzamentos temáticos do Eixo Central
  { fonte: "cen-laboratorio", alvo: "est-orcamento", tipo: "fluxo_dados", descricao: "Cruzamento Orçamentário" },
  { fonte: "cen-laboratorio", alvo: "ter-barragens", tipo: "fluxo_dados", descricao: "Cruzamento de Barragens" },
  { fonte: "cen-laboratorio", alvo: "dir-comunicabr", tipo: "fluxo_dados", descricao: "Cruzamento de Políticas Federais" },
  { fonte: "cen-noticias", alvo: "ter-brumadinho", tipo: "relacionado", descricao: "Reportagens sobre Reparação" },
  { fonte: "cen-biblioteca", alvo: "ter-brumadinho", tipo: "relacionado", descricao: "Pareceres Técnicos das ATIs" },
];

export interface GalhoRelacionado {
  eixoId: "direitos" | "territorios" | "estado" | "central";
  eixoNome: string;
  eixoHref: string;
  cor: string;
  subgalho: string;
  links: Array<{
    rotulo: string;
    href: string;
    icone?: string;
  }>;
}

/**
 * Encontra o nó da árvore mais próximo para uma dada rota ou identificador.
 */
export function identificarNoPorRota(rotaOuTermo: string): NoArvore | null {
  const rotaLimpa = rotaOuTermo.trim().toLowerCase().replace(/\/$/, "");
  if (!rotaLimpa) return null;

  // Casamento exato na rota
  const exato = NOS_ARVORE.find(
    (n) => n.href.toLowerCase().replace(/\/$/, "") === rotaLimpa
  );
  if (exato) return exato;

  // Casamento por prefixo mais longo
  const compativeis = NOS_ARVORE.filter((n) => {
    const h = n.href.toLowerCase().replace(/\/$/, "");
    return h !== "" && (rotaLimpa.startsWith(h) || h.startsWith(rotaLimpa));
  }).sort((a, b) => b.href.length - a.href.length);

  return compativeis[0] ?? null;
}

/**
 * Obtém os links relacionados de páginas irmãs no mesmo galho da árvore do site.
 * 
 * Regra de negócio:
 * 1. Identifica o galho/eixo do recurso consultado.
 * 2. Seleciona 3 a 4 páginas vizinhas que compartilham o mesmo subgalho ou eixo.
 * 3. Exclui a própria página atual para evitar redundância.
 */
export function obterLinksRelacionadosGalho(
  rotaOuTermo: string,
  limite = 4
): GalhoRelacionado | null {
  const no = identificarNoPorRota(rotaOuTermo);
  if (!no) return null;

  const eixoInfo = EIXOS_PORTAL[no.eixoId];
  if (!eixoInfo) return null;

  // 1. Prioriza nós com o mesmo subgalho (irmãos diretos)
  const irmaosSubgalho = NOS_ARVORE.filter(
    (n) => n.id !== no.id && n.eixoId === no.eixoId && n.subgalho === no.subgalho && n.tamanho < 20
  );

  // 2. Completa com nós do mesmo eixo (primos temáticos)
  const primosEixo = NOS_ARVORE.filter(
    (n) => n.id !== no.id && n.eixoId === no.eixoId && n.subgalho !== no.subgalho && n.tamanho < 20
  );

  // 3. Adiciona nós com arestas cruzadas específicas
  const idsCruzados = ARESTAS_ARVORE.filter(
    (a) => (a.fonte === no.id || a.alvo === no.id) && a.tipo !== "hierarquia"
  ).map((a) => (a.fonte === no.id ? a.alvo : a.fonte));

  const nosCruzados = NOS_ARVORE.filter(
    (n) => idsCruzados.includes(n.id) && n.id !== no.id
  );

  // Combina e deduplica os links relacionados
  const todosCandidatos = [...irmaosSubgalho, ...nosCruzados, ...primosEixo];
  const vistos = new Set<string>([no.href]);
  const linksSelecionados: Array<{ rotulo: string; href: string }> = [];

  for (const cand of todosCandidatos) {
    if (!vistos.has(cand.href) && linksSelecionados.length < limite) {
      vistos.add(cand.href);
      linksSelecionados.push({
        rotulo: cand.rotuloCurto || cand.titulo,
        href: cand.href,
      });
    }
  }

  if (linksSelecionados.length === 0) return null;

  return {
    eixoId: no.eixoId,
    eixoNome: eixoInfo.nome,
    eixoHref: eixoInfo.href,
    cor: eixoInfo.cor,
    subgalho: no.subgalho,
    links: linksSelecionados,
  };
}
