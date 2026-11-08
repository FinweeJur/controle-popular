/**
 * Mapa de navegação do portal — eixo, frente, subfrente e página.
 *
 * POR QUE EXISTE
 *
 * O portal chegou a 348 páginas e o mesmo assunto mora em até cinco rotas. Sem
 * um mapa único, cada página inventa a sua trilha e o leitor não sabe onde está.
 * Este arquivo é a fonte do caminho (`CaminhoSistema`), do índice expansível e da
 * proposta de unificação — um lugar só para corrigir.
 *
 * DIVISÃO TEMÁTICA
 *
 * Os eixos seguem a lógica de editoria que o leitor já conhece de veículo de
 * movimento popular (inspiração: Brasil de Fato): Direitos, Meio ambiente,
 * Cidades, Política, Economia, Justiça, Internacional. O portal acrescenta
 * "Casos" (os desastres) e "Dados", que são a razão de existir dele.
 *
 * DECISÕES DE ENXUGAMENTO (08/11/2026): o portal tinha 14 eixos, demais para o
 * leitor escolher. Trabalho, Saúde e Educação viraram frentes de Direitos, e
 * Movimentos também — memória das lutas é direito em movimento. Terra entrou em
 * Meio ambiente, mas com destaque: o mapa do território abre o eixo. Restam 9
 * eixos, sem mover nenhuma página.
 *
 * REGRA: nada aqui move página. `rotas` lista o que existe hoje; `rota` da frente
 * é a porta que já está no ar. Página nova entra como `estado: "proposta"`.
 *
 * CROSS-LISTING: uma página pode aparecer em dois eixos (saúde em Direitos e em
 * Saúde). O endereço canônico é um só; o índice só aponta.
 */

export type EstadoEixo = "no-ar" | "parcial" | "proposta";

export interface Frente {
  slug: string;
  rotulo: string;
  /** Uma linha: o que o leitor encontra ali. */
  descricao: string;
  /** Rota de entrada da frente (a que já existe). */
  rota: string;
  /** Rotas da frente que já estão no ar. */
  rotas: string[];
  /** Frente que abre o eixo e ganha destaque no índice (ex.: o mapa). */
  destaque?: boolean;
}

export interface Eixo {
  slug: string;
  rotulo: string;
  descricao: string;
  /** Página geral do eixo: a porta. Pode ser proposta (ainda não existe). */
  rota: string;
  estado: EstadoEixo;
  frentes: Frente[];
}

const MOVIMENTO: Frente = {
  slug: "direitos-em-movimento",
  rotulo: "Direitos em movimento",
  descricao:
    "O que fazer agora: serviços, conselhos, denúncia, ajuda, saúde, educação, trabalho e segurança.",
  rota: "/direitos-em-movimento",
  rotas: [
    "/direitos-em-movimento",
    "/direitos-em-movimento/ajuda",
    "/direitos-em-movimento/conselhos",
    "/direitos-em-movimento/denuncia",
    "/direitos-em-movimento/servicos",
  ],
};

export const EIXOS: Eixo[] = [
  {
    slug: "casos",
    rotulo: "Casos",
    descricao:
      "Os desastres que o portal acompanha: Fundão (Rio Doce), Córrego do Feijão (Brumadinho) e Serra Azul (Itatiaiuçu).",
    rota: "/casos",
    estado: "proposta",
    frentes: [
      {
        slug: "brumadinho",
        rotulo: "Brumadinho",
        descricao:
          "O rompimento da barragem B1, o acordo de 2024, o auxílio emergencial e a execução da reparação.",
        rota: "/paraopeba",
        rotas: [
          "/paraopeba",
          "/paraopeba/analise",
          "/paraopeba/auditoria",
          "/paraopeba/auxilio",
          "/paraopeba/biblioteca",
          "/paraopeba/clipping",
          "/paraopeba/correlacao",
          "/paraopeba/documentos",
          "/paraopeba/entenda",
          "/paraopeba/execucao",
          "/paraopeba/indice",
          "/paraopeba/linha-do-tempo",
          "/paraopeba/noticias",
          "/paraopeba/noticias-vale",
          "/paraopeba/pericia",
          "/paraopeba/quem-atua",
          "/paraopeba/vale",
          "/paraopeba/vale/documentos",
        ],
      },
      {
        slug: "riodoce",
        rotulo: "Rio Doce",
        descricao: "O rompimento de Fundão (2015), a repactuação e os processos na Justiça.",
        rota: "/riodoce",
        rotas: ["/riodoce", "/riodoce/indice", "/riodoce/processos"],
      },
      {
        slug: "itatiaiaucu",
        rotulo: "Itatiaiuçu",
        descricao:
          "A barragem Serra Azul: 7 acórdãos sobre prescrição e o plano de emergência acionado.",
        rota: "/jurisprudencia?frente=itatiaiaucu",
        rotas: [],
      },
    ],
  },
  {
    slug: "direitos",
    rotulo: "Direitos",
    descricao:
      "O direito violado e o que fazer: saúde, educação, moradia, água, trabalho, segurança, informação.",
    rota: "/direitos",
    estado: "proposta",
    frentes: [
      MOVIMENTO,
      {
        slug: "saude",
        rotulo: "Saúde",
        descricao: "Atendimento, medicamento, plano e saúde pública.",
        rota: "/direitos-em-movimento/saude-publica",
        rotas: ["/direitos-em-movimento/saude-publica"],
      },
      {
        slug: "educacao",
        rotulo: "Educação",
        descricao: "Escola, creche, vulnerabilidade e estudante.",
        rota: "/direitos-em-movimento/educacao",
        rotas: ["/direitos-em-movimento/educacao"],
      },
      {
        slug: "trabalho",
        rotulo: "Trabalho e renda",
        descricao: "Emprego, renda, cadastro de empregadores e rescisão.",
        rota: "/direitos-em-movimento/trabalho-e-renda",
        rotas: [
          "/direitos-em-movimento/trabalho-e-renda",
          "/direitos-em-movimento/trabalho-e-renda/cadastro-empregadores",
        ],
      },
      {
        slug: "memoria",
        rotulo: "Memória das lutas",
        descricao: "Verbetes cronológicos das lutas populares, com fonte e filtro.",
        rota: "/memoria",
        rotas: ["/memoria"],
      },
      {
        slug: "direitos-globais",
        rotulo: "Direitos globais",
        descricao: "O mesmo direito em outros países e nos organismos internacionais.",
        rota: "/direitos-globais",
        rotas: [
          "/direitos-globais",
          "/direitos-globais/africa",
          "/direitos-globais/america-do-norte",
          "/direitos-globais/america-latina",
          "/direitos-globais/america-latina/cidh",
          "/direitos-globais/asia",
          "/direitos-globais/europa",
          "/direitos-globais/oceania",
          "/direitos-globais/onu",
        ],
      },
      {
        slug: "direitos-comparados",
        rotulo: "Direitos comparados",
        descricao: "Indicadores para comparar a garantia do direito entre países.",
        rota: "/direitos-comparados",
        rotas: ["/direitos-comparados", "/direitos-comparados/indicadores"],
      },
    ],
  },
  {
    slug: "meio-ambiente",
    rotulo: "Meio ambiente",
    descricao:
      "Barragens, licenciamento, fiscalização, conflitos e clima — o que cerca o empreendimento.",
    rota: "/ambiental",
    estado: "no-ar",
    frentes: [
      {
        slug: "territorios",
        rotulo: "Territórios e mapa",
        descricao: "O mapa do território: nossas serras, nossos rios, os vales e o globo 3D da função social.",
        rota: "/terra-e-territorios",
        rotas: [
          "/terra-e-territorios",
          "/terra-e-territorios/nossas-serras",
          "/terra-e-territorios/nossos-rios",
          "/terra-e-territorios/vales",
          "/funcaosocialterra/mapa",
        ],
        destaque: true,
      },
      {
        slug: "funcao-social",
        rotulo: "Função social",
        descricao: "A terra que não cumpre função social.",
        rota: "/funcaosocialterra",
        rotas: ["/funcaosocialterra"],
      },
      {
        slug: "barragens",
        rotulo: "Barragens",
        descricao: "Cadastro, nível de emergência, descaracterização e panorama mundial.",
        rota: "/ambiental/barragens",
        rotas: [
          "/ambiental/barragens",
          "/ambiental/barragens/sigbm",
          "/ambiental/barragens/municipio/[idIbge]",
          "/ambiental/barragens/descaracterizacao",
          "/ambiental/barragens-globais",
          "/mineracao/cavas",
          "/mineracao/ilegal",
        ],
      },
      {
        slug: "licenciamento",
        rotulo: "Licenciamento",
        descricao: "Licenças, condicionantes, autorizações e o Copam.",
        rota: "/ambiental/licenciamento",
        rotas: [
          "/ambiental/licenciamento",
          "/ambiental/licencas",
          "/ambiental/condicionantes",
          "/ambiental/autorizacoes",
          "/ambiental/copam",
        ],
      },
      {
        slug: "fiscalizacao",
        rotulo: "Fiscalização",
        descricao: "Autuações, IBAMA, TAC e decisões administrativas.",
        rota: "/ambiental/autuacoes",
        rotas: [
          "/ambiental/autuacoes",
          "/ambiental/ibama",
          "/ambiental/tac",
          "/ambiental/decisoes",
        ],
      },
      {
        slug: "conflitos",
        rotulo: "Conflitos",
        descricao: "Conflitos socioambientais no Brasil e no mundo.",
        rota: "/ambiental/conflitos-globais",
        rotas: [
          "/ambiental/conflitos-globais",
          "/ambiental/crimes-socioambientais",
          "/ambiental/ameacas-americas",
        ],
      },
      {
        slug: "clima",
        rotulo: "Clima e risco",
        descricao: "Crise climática, litígios climáticos e risco por município.",
        rota: "/ambiental/clima-risco",
        rotas: [
          "/ambiental/clima-risco",
          "/ambiental/crise-climatica",
          "/ambiental/litigios-climaticos",
        ],
      },
    ],
  },
  {
    slug: "cidades",
    rotulo: "Cidades",
    descricao: "O recorte por município: dados, contratos, obras e indicadores.",
    rota: "/cidades",
    estado: "no-ar",
    frentes: [
      {
        slug: "indice",
        rotulo: "Cidades",
        descricao: "Índice por estado e por município.",
        rota: "/cidades",
        rotas: ["/cidades"],
      },
      {
        slug: "municipio",
        rotulo: "Página do município",
        descricao: "A ficha do município, com tudo o que o portal tem sobre ele.",
        rota: "/[municipio]",
        rotas: ["/[municipio]"],
      },
    ],
  },
  {
    slug: "politica",
    rotulo: "Política",
    descricao: "Congresso, assembleias, governo e eleições.",
    rota: "/congresso",
    estado: "no-ar",
    frentes: [
      {
        slug: "congresso",
        rotulo: "Congresso",
        descricao: "Proposições, votações, comissões, bancadas e cota.",
        rota: "/congresso",
        rotas: [
          "/congresso",
          "/congresso/proposicoes",
          "/congresso/votacoes",
          "/congresso/comissoes",
          "/congresso/agenda",
          "/congresso/parlamentares",
          "/congresso/bancadas",
          "/congresso/financiamento-eleitoral",
          "/congresso/cota-parlamentar",
        ],
      },
      {
        slug: "assembleias",
        rotulo: "Assembleias estaduais",
        descricao: "O mesmo recorte nos legislativos estaduais.",
        rota: "/assembleias",
        rotas: ["/assembleias", "/assembleias/[uf]"],
      },
      {
        slug: "governo",
        rotulo: "Governo",
        descricao: "Executivo por estado, com orçamento e contratos.",
        rota: "/governo",
        rotas: ["/governo", "/governo/[uf]", "/governo/[uf]/legislativo"],
      },
      {
        slug: "eleicoes",
        rotulo: "Eleições",
        descricao: "Gastos e resultados.",
        rota: "/eleicoes",
        rotas: ["/eleicoes"],
      },
    ],
  },
  {
    slug: "economia",
    rotulo: "Economia",
    descricao: "Empresas, orçamento, renúncia fiscal e fornecedores.",
    rota: "/estado-e-economia",
    estado: "no-ar",
    frentes: [
      {
        slug: "empresas",
        rotulo: "Empresas",
        descricao: "Vale, Samarco, BHP, Renova: documentos, executivos e finanças.",
        rota: "/empresas",
        rotas: [
          "/empresas",
          "/empresas/conglomerados",
          "/empresas/documentos",
          "/empresas/executivos",
          "/empresas/fortunas",
          "/empresas/[slug]",
          "/paraopeba/vale",
          "/paraopeba/vale/documentos",
        ],
      },
      {
        slug: "contas-publicas",
        rotulo: "Contas públicas",
        descricao: "Orçamento, renúncia fiscal e acordos internacionais.",
        rota: "/estado-e-economia",
        rotas: [
          "/estado-e-economia",
          "/estado-e-economia/orcamento",
          "/estado-e-economia/renuncia-fiscal",
          "/estado-e-economia/acordos-e-licitacoes-internacionais",
          "/estado-e-economia/fornecedores-multinacionais",
        ],
      },
    ],
  },
  {
    slug: "justica",
    rotulo: "Justiça",
    descricao: "Tribunais, varas, instituições e a jurisprudência dos desastres.",
    rota: "/judiciario",
    estado: "no-ar",
    frentes: [
      {
        slug: "tribunais",
        rotulo: "Tribunais e varas",
        descricao: "Composição, contatos, varas e corregedorias.",
        rota: "/judiciario/tribunais",
        rotas: [
          "/judiciario",
          "/judiciario/tribunais",
          "/judiciario/varas",
          "/judiciario/composicao",
          "/judiciario/contatos",
          "/judiciario/correicoes-trabalhistas",
          "/judiciario/inspecoes",
        ],
      },
      {
        slug: "jurisprudencia",
        rotulo: "Jurisprudência",
        descricao: "Acórdãos dos desastres, catálogo do indeterminado e a página penal.",
        rota: "/jurisprudencia",
        rotas: ["/jurisprudencia", "/jurisprudencia/penal", "/judiciario/jurisprudencia"],
      },
      {
        slug: "instituicoes",
        rotulo: "Instituições",
        descricao: "Quem decide e quem fiscaliza, por sigla e competência.",
        rota: "/instituicoes",
        rotas: ["/instituicoes", "/instituicoes/[sigla]", "/judiciario/instituicoes"],
      },
      {
        slug: "presidios",
        rotulo: "Presídios e números",
        descricao: "Indicadores do Judiciário, presídios e recomendações.",
        rota: "/judiciario/numeros",
        rotas: ["/judiciario/numeros", "/judiciario/presidios", "/judiciario/recomendacoes"],
      },
    ],
  },
  {
    slug: "internacional",
    rotulo: "Internacional",
    descricao: "O caso fora do Brasil: Europa, EUA, Canadá, América Latina e ONU.",
    rota: "/internacional",
    estado: "no-ar",
    frentes: [
      {
        slug: "europa",
        rotulo: "Europa",
        descricao: "Litígios transnacionais: Londres, Munique, Holanda.",
        rota: "/europa",
        rotas: ["/europa", "/europa/litigios-transnacionais", "/europa/legislacao-transnacionais"],
      },
      {
        slug: "america-do-norte",
        rotulo: "América do Norte",
        descricao: "Estados Unidos e Canadá: ações, sanções e precedentes.",
        rota: "/eua",
        rotas: ["/eua", "/canada", "/internacional/desclassificados"],
      },
      {
        slug: "america-latina",
        rotulo: "América Latina",
        descricao: "Casos irmãos e o sistema interamericano.",
        rota: "/america-latina",
        rotas: ["/america-latina", "/direitos-globais/america-latina/cidh"],
      },
    ],
  },
  {
    slug: "dados",
    rotulo: "Dados",
    descricao: "Dados abertos, documentação, API e o que o portal tem sobre você.",
    rota: "/dados",
    estado: "no-ar",
    frentes: [
      {
        slug: "abertos",
        rotulo: "Dados abertos",
        descricao: "Catálogo de bases e documentação da API.",
        rota: "/dados",
        rotas: ["/dados", "/documentacao"],
      },
      {
        slug: "meus-dados",
        rotulo: "Meus dados",
        descricao: "O que o portal tem sobre você e como pedir correção.",
        rota: "/meus-dados",
        rotas: ["/meus-dados"],
      },
    ],
  },
];

/** Índice por slug do eixo, para resolver o caminho. */
const POR_SLUG = new Map(EIXOS.map((eixo) => [eixo.slug, eixo]));

/** Segmentos que não são eixo de conteúdo: são ferramentas de travessia. */
export const FERRAMENTAS = new Set([
  "busca",
  "temas",
  "indice",
  "grafo",
  "painel",
  "noticias",
  "novidades",
]);

/**
 * Prefixos de rota que já existem e apontam para um par eixo/frente.
 *
 * É o que permite manter `/paraopeba/auxilio` no ar e ainda mostrar a trilha
 * "Início › Casos › Brumadinho › Auxílio". O prefixo mais longo ganha.
 */
const ALIAS: { prefixo: string; eixo: string; frente?: string }[] = [
  { prefixo: "/paraopeba", eixo: "casos", frente: "brumadinho" },
  { prefixo: "/riodoce", eixo: "casos", frente: "riodoce" },
  { prefixo: "/direitos-em-movimento", eixo: "direitos", frente: "direitos-em-movimento" },
  { prefixo: "/direitos-globais", eixo: "direitos", frente: "direitos-globais" },
  { prefixo: "/direitos-comparados", eixo: "direitos", frente: "direitos-comparados" },
  { prefixo: "/memoria", eixo: "direitos", frente: "memoria" },
  { prefixo: "/instituicoes", eixo: "justica", frente: "instituicoes" },
  { prefixo: "/empresas", eixo: "economia", frente: "empresas" },
  { prefixo: "/governo", eixo: "politica", frente: "governo" },
  { prefixo: "/estado-e-economia", eixo: "economia", frente: "contas-publicas" },
  { prefixo: "/ambiental/barragens", eixo: "meio-ambiente", frente: "barragens" },
  { prefixo: "/ambiental/barragens-globais", eixo: "meio-ambiente", frente: "barragens" },
  { prefixo: "/mineracao", eixo: "meio-ambiente", frente: "barragens" },
  { prefixo: "/jurisprudencia", eixo: "justica", frente: "jurisprudencia" },
  { prefixo: "/judiciario", eixo: "justica", frente: "tribunais" },
  { prefixo: "/europa", eixo: "internacional", frente: "europa" },
  { prefixo: "/eua", eixo: "internacional", frente: "america-do-norte" },
  { prefixo: "/canada", eixo: "internacional", frente: "america-do-norte" },
  { prefixo: "/america-latina", eixo: "internacional", frente: "america-latina" },
  { prefixo: "/cidades", eixo: "cidades", frente: "indice" },
  { prefixo: "/assembleias", eixo: "politica", frente: "assembleias" },
  { prefixo: "/congresso", eixo: "politica", frente: "congresso" },
  { prefixo: "/eleicoes", eixo: "politica", frente: "eleicoes" },
  { prefixo: "/terra-e-territorios", eixo: "meio-ambiente", frente: "territorios" },
  { prefixo: "/funcaosocialterra", eixo: "meio-ambiente", frente: "funcao-social" },
  { prefixo: "/dados", eixo: "dados", frente: "abertos" },
  { prefixo: "/documentacao", eixo: "dados", frente: "abertos" },
  { prefixo: "/meus-dados", eixo: "dados", frente: "meus-dados" },
];

/** Rótulos que a humanização erraria (acento, sigla, palavra composta). */
const ROTULOS: Record<string, string> = {
  auxilio: "Auxílio emergencial",
  execucao: "Execução da reparação",
  entenda: "Entenda o caso",
  "linha-do-tempo": "Linha do tempo",
  "quem-atua": "Quem atua",
  pericia: "Perícia",
  correlacao: "Correlação",
  auditoria: "Auditoria",
  analise: "Análise",
  clipping: "Clipping de imprensa",
  documentos: "Documentos",
  biblioteca: "Biblioteca",
  noticias: "Notícias",
  "noticias-vale": "Notícias da Vale",
  vale: "A Vale no caso",
  indice: "Índice",
  processos: "Processos",
  sigbm: "SIGBM",
  descaracterizacao: "Descaracterização",
  sigla: "Perfil",
  uf: "Estado",
  slug: "Perfil",
  idIbge: "Município",
  municipio: "Município",
  "saude-publica": "Saúde pública",
  educacao: "Educação",
  denuncia: "Denúncia",
  conselhos: "Conselhos",
  ajuda: "Ajuda",
  servicos: "Serviços",
  "seguranca-publica": "Segurança pública",
  informacao: "Informação",
  "trabalho-e-renda": "Trabalho e renda",
  "cadastro-empregadores": "Cadastro de empregadores",
  proposicoes: "Proposições",
  votacoes: "Votações",
  comissoes: "Comissões",
  parlamentares: "Parlamentares",
  bancadas: "Bancadas",
  "cota-parlamentar": "Cota parlamentar",
  "financiamento-eleitoral": "Financiamento eleitoral",
  "litigios-transnacionais": "Litígios transnacionais",
  "legislacao-transnacionais": "Legislação transnacional",
  barragens: "Barragens",
  "barragens-globais": "Barragens no mundo",
  orcamento: "Orçamento",
  "renuncia-fiscal": "Renúncia fiscal",
  "contas-publicas": "Contas públicas",
  autuacoes: "Autuações",
  licenciamento: "Licenciamento",
  licencas: "Licenças",
  condicionantes: "Condicionantes",
  autorizacoes: "Autorizações",
  "conflitos-globais": "Conflitos globais",
  "crise-climatica": "Crise climática",
  "clima-risco": "Clima e risco",
  "litigios-climaticos": "Litígios climáticos",
  "nossas-serras": "Nossas serras",
  "nossos-rios": "Nossos rios",
  vales: "Vales",
  "funcao-social": "Função social",
  "meus-dados": "Meus dados",
  abertos: "Dados abertos",
  "america-do-norte": "América do Norte",
  "america-latina": "América Latina",
  "direitos-globais": "Direitos globais",
  "direitos-comparados": "Direitos comparados",
  "direitos-em-movimento": "Direitos em movimento",
  "cadastro-empregadores-e-renda": "Trabalho e renda",
};

export interface NivelCaminho {
  rotulo: string;
  href: string;
}

const humanizar = (slug: string) => {
  const chave = slug.replace(/[[\]]/g, "");
  if (ROTULOS[chave]) return ROTULOS[chave];
  return chave
    .replace(/-/g, " ")
    .replace(/^\w/, (letra) => letra.toUpperCase());
};

/** Alias de prefixo mais longo que casa com a rota. */
function acharAlias(rota: string) {
  return ALIAS.filter((item) => rota === item.prefixo || rota.startsWith(`${item.prefixo}/`)).sort(
    (a, b) => b.prefixo.length - a.prefixo.length,
  )[0];
}

/** Rótulo do último segmento da rota. */
function rotuloDaPagina(rota: string): string {
  const segmentos = rota.split("/").filter(Boolean);
  return humanizar(segmentos[segmentos.length - 1] ?? rota);
}

/** Eixo e frente de uma rota, usando alias quando o prefixo é antigo. */
function resolver(rota: string): { eixo?: Eixo; frente?: Frente } {
  const alias = acharAlias(rota);
  const primeiro = rota.split("/").filter(Boolean)[0] ?? "";
  const eixo = POR_SLUG.get(alias ? alias.eixo : primeiro);
  if (!eixo) return {};
  if (!alias?.frente) return { eixo };
  return { eixo, frente: eixo.frentes.find((item) => item.slug === alias.frente) };
}

/** Início › Eixo › Frente (sem a página final). */
function trilhaAte(eixo: Eixo, frente?: Frente): NivelCaminho[] {
  const base: NivelCaminho[] = [
    { rotulo: "Início", href: "/" },
    { rotulo: eixo.rotulo, href: eixo.rota },
  ];
  if (!frente) return base;
  return [...base, { rotulo: frente.rotulo, href: frente.rota }];
}

/**
 * Trilha de uma rota: Início › Eixo › Frente › Página.
 *
 * Alias resolve o prefixo antigo (`/paraopeba/*` vira "Casos › Brumadinho").
 * Rota fora do mapa devolve só "Início › Página" — melhor curta que errada.
 */
export function caminhoDe(rota: string): NivelCaminho[] {
  const limpa = rota.split("?")[0].replace(/\/+$/, "");
  if (!limpa || limpa === "/") return [{ rotulo: "Início", href: "/" }];

  const { eixo, frente } = resolver(limpa);
  if (!eixo) return [{ rotulo: "Início", href: "/" }, { rotulo: rotuloDaPagina(limpa), href: limpa }];

  const trilha = trilhaAte(eixo, frente);
  const naPorta = limpa === eixo.rota || Boolean(frente && limpa === frente.rota);
  if (naPorta) return trilha;
  return [...trilha, { rotulo: rotuloDaPagina(limpa), href: limpa }];
}

/** Quantas rotas de conteúdo o eixo reúne hoje. */
export function paginasDoEixo(slug: string): number {
  const eixo = POR_SLUG.get(slug);
  if (!eixo) return 0;
  return eixo.frentes.reduce((soma, frente) => soma + new Set(frente.rotas).size, 0);
}
