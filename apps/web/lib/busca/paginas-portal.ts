/**
 * Catálogo e indexador de páginas, reportagens e eixos do Controle Popular
 * para busca instantânea no portal.
 *
 * Permite que a busca da TopNav (/busca e BuscaGlobal.tsx) encontre não apenas
 * atos oficiais de municípios, mas também as páginas estruturais do portal:
 * - Acordos de Mariana e Brumadinho
 * - Fichas orçamentárias das Instituições de Justiça (TJMG, MPMG, DPMG...)
 * - Painéis de Barragens e Descaracterização
 * - Cidades monitoradas (Betim, BH, Diamantina...)
 * - Tecnologia e IA Livre (Sabiá 7B, Ollama)
 * - Ferramentas de Direitos em Movimento e ComunicaBR
 */

import { semAcento } from "./normalizar";

export interface PaginaPortalIndexada {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
  frente: "cidades" | "congresso" | "judiciario" | "ambiental" | "paraopeba" | "terras" | "geral";
  rotulo: string;
  badgeCor: string;
  palavrasChave: string[];
}

export const PAGINAS_PORTAL: PaginaPortalIndexada[] = [
  // ═══ EIXO 1: DIREITOS EM MOVIMENTO ═══
  {
    id: "direitos-geral",
    titulo: "Direitos em Movimento — Visão Geral",
    descricao: "Painel de cidadania e defesa de direitos: saúde, educação, trabalho, assistência jurídica e denúncias.",
    href: "/direitos-em-movimento",
    frente: "geral",
    rotulo: "Eixo 1 · Cidadania",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: ["direitos", "cidadania", "movimento", "defesa", "assistencia", "social"],
  },
  {
    id: "direitos-saude",
    titulo: "Saúde Pública & SUS",
    descricao: "Unidades básicas de saúde, leitos, repasses da União e fiscalização do atendimento hospitalar.",
    href: "/direitos-em-movimento/saude-publica",
    frente: "geral",
    rotulo: "Saúde · SUS",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: ["saude", "sus", "posto", "ubs", "hospital", "leitos", "remedios", "vacina"],
  },
  {
    id: "direitos-educacao",
    titulo: "Educação & Escolas (IDEB)",
    descricao: "Indicadores escolares, evasão, metas do IDEB e infraestrutura da rede de ensino público.",
    href: "/direitos-em-movimento/educacao",
    frente: "geral",
    rotulo: "Educação · IDEB",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: ["educacao", "escolas", "ideb", "professores", "merenda", "ensino", "creche"],
  },
  {
    id: "direitos-trabalho",
    titulo: "Trabalho & Emprego (CAGED)",
    descricao: "Evolução do emprego formal, admissões e demissões no mercado de trabalho municipal e estadual.",
    href: "/direitos-em-movimento/trabalho-e-renda",
    frente: "geral",
    rotulo: "Trabalho · CAGED",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: ["trabalho", "emprego", "caged", "renda", "salario", "vagas", "demissao"],
  },
  {
    id: "direitos-ajuda",
    titulo: "Onde Buscar Ajuda e Atendimento Jurídico",
    descricao: "Guia de assistência jurídica gratuita: Defensoria Pública, OAB Cidadã, Conselhos Tutelares e CRAS.",
    href: "/direitos-em-movimento/ajuda",
    frente: "geral",
    rotulo: "Ajuda · Assistência",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: ["ajuda", "advogado", "gratuito", "defensoria", "cras", "creas", "tutelar"],
  },
  {
    id: "direitos-denuncia",
    titulo: "Canal de Denúncia Local e Ouvidorias",
    descricao: "Canais oficiais para denunciar irregularidades, desvios de verbas e abusos a órgãos competentes.",
    href: "/direitos-em-movimento/denuncia",
    frente: "geral",
    rotulo: "Denúncia · Controle",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: ["denuncia", "ouvidoria", "corrupcao", "desvio", "fraude", "mpmg", "tce"],
  },
  {
    id: "direitos-lai",
    titulo: "Pedido de Informação pela Lei de Acesso (LAI)",
    descricao: "Modelos de requerimentos e prazos legais da Lei 12.527/2011 para obter documentos de órgãos públicos.",
    href: "/direitos-em-movimento/informacao",
    frente: "geral",
    rotulo: "Transparência · LAI",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: ["lai", "acesso", "informacao", "pedido", "transparencia", "requerimento"],
  },
  {
    id: "ambiental-legislacao",
    titulo: "Legislação Ambiental Unificada",
    descricao: "Acervo catalogado de leis, resoluções e decretos de proteção ambiental e climática de Minas Gerais.",
    href: "/ambiental/legislacao",
    frente: "ambiental",
    rotulo: "Leis · Meio Ambiente",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: ["legislacao", "leis", "ambiental", "codigo florestal", "normas", "copam"],
  },

  // ═══ EIXO 2: TERRA E TERRITÓRIOS ═══
  {
    id: "terra-geral",
    titulo: "Terra e Territórios — Visão Geral",
    descricao: "Monitoramento de bacias hidrográficas, serras, mineração, CAR, terras indígenas e quilombolas.",
    href: "/terra-e-territorios",
    frente: "terras",
    rotulo: "Eixo 2 · Território",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: ["terra", "territorio", "bacia", "floresta", "quilombo", "indigena", "car"],
  },
  {
    id: "cidades-hub",
    titulo: "199 Cidades Estratégicas de Minas Gerais",
    descricao: "Catálogo de municípios com dados de orçamento, contratações públicas, mineração e indicadores sociais.",
    href: "/cidades",
    frente: "cidades",
    rotulo: "Cidades · 199 Municípios",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: ["cidades", "municipios", "199", "prefeituras", "minas gerais", "interior"],
  },
  {
    id: "ambiental-mariana",
    titulo: "Acordo do Rio Doce (Mariana) — Repactuação de R$ 171 Bi",
    descricao: "Execução orçamentária dos R$ 171 bilhões do Acordo de Mariana: repasses estaduais e obras na bacia.",
    href: "/ambiental/mariana",
    frente: "ambiental",
    rotulo: "Mariana · R$ 171 Bi",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: ["mariana", "rio doce", "samarco", "renova", "repactuacao", "171 bi", "acordo mariana"],
  },
  {
    id: "paraopeba-hub",
    titulo: "Bacia do Paraopeba & Acordo de Brumadinho (R$ 37,7 Bi)",
    descricao: "Execução do Acordo Judicial de Brumadinho: R$ 5,48 bi nos 26 municípios atingidos e auditoria de projetos.",
    href: "/paraopeba",
    frente: "paraopeba",
    rotulo: "Brumadinho · R$ 37,7 Bi",
    badgeCor: "var(--cp-secondary)",
    palavrasChave: ["brumadinho", "paraopeba", "vale", "acordo brumadinho", "37 bi", "atingidos", "reparacao"],
  },
  {
    id: "paraopeba-repasses",
    titulo: "Repasses Municipais do Acordo de Brumadinho",
    descricao: "Consulta município a município dos recursos transferidos pela Vale e Governo de Minas às prefeituras.",
    href: "/paraopeba/repasses",
    frente: "paraopeba",
    rotulo: "Repasses · R$ 5,48 Bi",
    badgeCor: "var(--cp-secondary)",
    palavrasChave: ["repasses", "prefeituras brumadinho", "5 bi", "municipios atingidos", "obras"],
  },
  {
    id: "paraopeba-ptr",
    titulo: "Programa de Transferência de Renda (PTR)",
    descricao: "Acompanhamento do pagamento mensal às famílias atingidas gerido pela Fundação Getulio Vargas (FGV).",
    href: "/paraopeba/ptr",
    frente: "paraopeba",
    rotulo: "Auxílio · PTR",
    badgeCor: "var(--cp-secondary)",
    palavrasChave: ["ptr", "transferencia de renda", "auxilio", "fgv", "atingidos", "pagamento"],
  },
  {
    id: "paraopeba-biblioteca",
    titulo: "Biblioteca Unificada de Brumadinho & Paraopeba",
    descricao: "Acervo digital de pareceres das ATIs, perícias judiciais da UFMG e relatórios ambientais.",
    href: "/paraopeba/biblioteca",
    frente: "paraopeba",
    rotulo: "Documentos · ATIs",
    badgeCor: "var(--cp-secondary)",
    palavrasChave: ["biblioteca", "atis", "pericia", "documentos", "relatorios brumadinho", "ufmg"],
  },
  {
    id: "barragens-descaracterizacao",
    titulo: "Descaracterização de Barragens a Montante (Lei Mar de Lama)",
    descricao: "Cronograma e fiscalização das barragens em eliminação e monitoramento de estruturas em Nível 3.",
    href: "/ambiental/barragens/descaracterizacao",
    frente: "ambiental",
    rotulo: "Barragens · Mar de Lama",
    badgeCor: "var(--cp-alert)",
    palavrasChave: ["barragens", "descaracterizacao", "mar de lama", "nivel 3", "forquilha", "sul superior", "anm"],
  },
  {
    id: "barragens-painel",
    titulo: "Painel Geral de Barragens de Mineração em MG",
    descricao: "Mapa e lista completa das centenas de barragens de rejeito cadastradas na ANM e FEAM em Minas.",
    href: "/ambiental/barragens",
    frente: "ambiental",
    rotulo: "Barragens · ANM",
    badgeCor: "var(--cp-alert)",
    palavrasChave: ["barragens", "rejeitos", "mineracao", "dano potencial", "feam", "seguranca"],
  },
  {
    id: "funcao-social-globo",
    titulo: "Globo 3D Interativo — Função Social da Terra",
    descricao: "Visualização tridimensional de geodados com sobreposição de minerárias, terras públicas, CAR e UCs.",
    href: "/funcaosocialterra/mapa",
    frente: "terras",
    rotulo: "Globo 3D · Território",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["globo", "3d", "mapa", "satelite", "car", "quilombos", "uc", "camadas"],
  },

  // ═══ EIXO 3: ESTADO E ECONOMIA ═══
  {
    id: "estado-geral",
    titulo: "Estado e Economia — Visão Geral",
    descricao: "Auditoria do gasto público: orçamento de MG, arrecadação, compras pelo PNCP e Poder Judiciário.",
    href: "/estado-e-economia",
    frente: "geral",
    rotulo: "Eixo 3 · Finanças",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: ["estado", "economia", "orcamento", "financas", "receitas", "despesas", "tributos"],
  },
  {
    id: "estado-orcamento",
    titulo: "Orçamento & Receitas de Minas Gerais (ICMS R$ 81,5 Bi)",
    descricao: "Arrecadação tributária estadual, cota-parte dos municípios, dívida pública e transferências correntes.",
    href: "/estado-e-economia/orcamento",
    frente: "geral",
    rotulo: "Orçamento MG · ICMS",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: ["orcamento", "icms", "ipva", "sef", "receitas mg", "loa", "divida publica"],
  },
  {
    id: "judiciario-fiscalizacao",
    titulo: "Quem Fiscaliza a Justiça — Mapa das Instituições",
    descricao: "Análise comparada dos órgãos de justiça: limites de fiscalização externa no CNJ, TST, STF e CNMP.",
    href: "/judiciario/instituicoes",
    frente: "judiciario",
    rotulo: "Justiça · Fiscalização",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["judiciario", "justica", "cnj", "tst", "stf", "fiscalizacao", "orgaos"],
  },
  {
    id: "inst-tjmg",
    titulo: "TJMG — Tribunal de Justiça de MG (R$ 14,96 Bi)",
    descricao: "Orçamento anual, folha de pagamento, auxílio-alimentação (R$ 380 mi), diárias (R$ 48 mi) e organograma.",
    href: "/judiciario/instituicoes/tjmg",
    frente: "judiciario",
    rotulo: "TJMG · R$ 14,96 Bi",
    badgeCor: "#f2701d",
    palavrasChave: ["tjmg", "tribunal de justica", "desembargadores", "juizes", "salarios tjmg", "alimentacao", "diarias"],
  },
  {
    id: "inst-mpmg",
    titulo: "MPMG — Ministério Público de MG (R$ 4,09 Bi)",
    descricao: "Orçamento anual, promotorias do meio ambiente (CAOMA), verbas indenizatórias (R$ 684 mi) e contatos.",
    href: "/judiciario/instituicoes/mpmg",
    frente: "judiciario",
    rotulo: "MPMG · R$ 4,09 Bi",
    badgeCor: "#c0392b",
    palavrasChave: ["mpmg", "ministerio publico", "promotores", "procurador", "caoma", "penduricalhos", "ouvidoria mpmg"],
  },
  {
    id: "inst-dpmg",
    titulo: "DPMG — Defensoria Pública de MG (R$ 1,10 Bi)",
    descricao: "Orçamento anual, disparidade orçamentária perante TJ e MP, déficit de defensores e atendimento gratuito.",
    href: "/judiciario/instituicoes/dpmg",
    frente: "judiciario",
    rotulo: "DPMG · R$ 1,10 Bi",
    badgeCor: "#10b981",
    palavrasChave: ["dpmg", "defensoria publica", "defensores", "assistencia juridica", "comarcas", "atendimento gratuito"],
  },
  {
    id: "inst-trt3",
    titulo: "TRT-3 — Tribunal Regional do Trabalho da 3ª Região (R$ 3,18 Bi)",
    descricao: "Justiça trabalhista em Minas: varas do trabalho, atas de correição e orçamento institucional.",
    href: "/judiciario/instituicoes/trt3",
    frente: "judiciario",
    rotulo: "TRT-3 · R$ 3,18 Bi",
    badgeCor: "#3b82f6",
    palavrasChave: ["trt3", "trt", "justica do trabalho", "trabalhista", "corregedoria trt", "varas"],
  },
  {
    id: "inst-trf6",
    titulo: "TRF-6 — Tribunal Regional Federal da 6ª Região (R$ 1,42 Bi)",
    descricao: "Justiça federal em Minas Gerais: instalação, quadro de servidores, custeio e julgamentos federais.",
    href: "/judiciario/instituicoes/trf6",
    frente: "judiciario",
    rotulo: "TRF-6 · R$ 1,42 Bi",
    badgeCor: "#6366f1",
    palavrasChave: ["trf6", "trf", "justica federal", "tribunal federal", "juizes federais"],
  },
  {
    id: "inst-tcemg",
    titulo: "TCEMG — Tribunal de Contas do Estado de MG (R$ 1,15 Bi)",
    descricao: "Órgão de controle externo das contas públicas municipais e estaduais e prestação de contas fiscais.",
    href: "/judiciario/instituicoes/tcemg",
    frente: "judiciario",
    rotulo: "TCEMG · R$ 1,15 Bi",
    badgeCor: "#eab308",
    palavrasChave: ["tcemg", "tce", "tribunal de contas", "fiscalizacao", "contas", "rejeicao de contas"],
  },
  {
    id: "inst-dpu",
    titulo: "DPU — Defensoria Pública da União em Minas Gerais",
    descricao: "Assistência jurídica federal gratuita para o cidadão em causas previdenciárias e contra órgãos federais.",
    href: "/judiciario/instituicoes/dpu",
    frente: "judiciario",
    rotulo: "DPU · Federal",
    badgeCor: "#0ea5e9",
    palavrasChave: ["dpu", "defensoria da uniao", "federal", "inss", "previdenciario", "auxilio"],
  },
  {
    id: "congresso-hub",
    titulo: "Congresso Nacional & Gastos da Bancada de MG",
    descricao: "Despesas com a Cota Parlamentar (CEAP), votações, proposições e atuação dos 53 deputados e 3 senadores.",
    href: "/congresso",
    frente: "congresso",
    rotulo: "Congresso · CEAP",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: ["congresso", "deputados", "senadores", "ceap", "cota parlamentar", "camara", "brasilia"],
  },
  {
    id: "comunicabr-hub",
    titulo: "ComunicaBR — R$ 139 Bi do Governo Federal em Minas Gerais",
    descricao: "Painel unificado dos repasses federais nos 853 municípios mineiros: Bolsa Família, SUS, Fundeb e BPC.",
    href: "/dados/comunicabr",
    frente: "geral",
    rotulo: "ComunicaBR · R$ 139 Bi",
    badgeCor: "var(--cp-accent)",
    palavrasChave: ["comunicabr", "governo federal", "bolsa familia", "fundeb", "sus", "bpc", "repasses uniao"],
  },

  // ═══ CIDADES PRINCIPAIS ═══
  {
    id: "cidade-betim",
    titulo: "Betim/MG — Contratos, Licitações e Atos Oficiais",
    descricao: "R$ 1,65 bi em compras catalogadas, atos do Diário Oficial, despesas e vereadores municipais.",
    href: "/betim",
    frente: "cidades",
    rotulo: "Betim · Contratos",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["betim", "prefeitura de betim", "contratos betim", "camara de betim", "diario oficial betim"],
  },
  {
    id: "cidade-bh",
    titulo: "Belo Horizonte/MG — Orçamento de R$ 19+ Bi e Contratações",
    descricao: "Diário Oficial do Município (DOM), grandes contratos públicos e execução orçamentária da capital.",
    href: "/bh",
    frente: "cidades",
    rotulo: "Belo Horizonte · Capital",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["bh", "belo horizonte", "dom", "pbh", "prefeitura bh", "orcamento bh"],
  },
  {
    id: "cidade-diamantina",
    titulo: "Diamantina/MG — 16.601 Atos Oficiais Catalogados",
    descricao: "Série histórica de cinco anos do Diário Oficial de Diamantina, licitações, contratos e patrimônio.",
    href: "/diamantina",
    frente: "cidades",
    rotulo: "Diamantina · 16 Mil Atos",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["diamantina", "diario oficial diamantina", "atos diamantina", "vale do jequitinhonha"],
  },
  {
    id: "cidade-aracuai",
    titulo: "Araçuaí/MG — Vale do Jequitinhonha e Compras Públicas",
    descricao: "Atos normativos, contratações e impacto socioambiental da mineração de lítio no Jequitinhonha.",
    href: "/aracuai",
    frente: "cidades",
    rotulo: "Araçuaí · Jequitinhonha",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["aracuai", "litio", "jequitinhonha", "prefeitura de aracuai"],
  },
  {
    id: "cidade-itinga",
    titulo: "Itinga/MG — Atos Oficiais e Contratos",
    descricao: "Catalogação do diário oficial e compras públicas no município minerador de lítio.",
    href: "/itinga",
    frente: "cidades",
    rotulo: "Itinga · Jequitinhonha",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["itinga", "litio itinga", "prefeitura itinga"],
  },

  // ═══ CENTRAL E TECNOLOGIA ═══
  {
    id: "central-noticias",
    titulo: "Central de Notícias & Relatórios Cívicos (ONSA)",
    descricao: "Investigações técnicas com dados oficiais sobre orçamentos, mineração, barragens e contratos.",
    href: "/noticias",
    frente: "geral",
    rotulo: "Notícias · ONSA",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["noticias", "reportagens", "investigacao", "jornalismo", "relatorios", "estudos"],
  },
  {
    id: "central-tecnologia",
    titulo: "Tecnologia & IA Livre — Seu Nonô, Sabiá 7B e Código Aberto",
    descricao: "Arquitetura técnica do assistente cívico, modelos abertos, Ollama, métricas de latência e oficinas de IA.",
    href: "/tecnologia",
    frente: "geral",
    rotulo: "Tecnologia · IA Livre",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["tecnologia", "ia livre", "sabia 7b", "ollama", "seu nono", "codigo aberto", "github"],
  },
  {
    id: "central-sobre",
    titulo: "Sobre o Portal Controle Popular e o ONSA",
    descricao: "História do Observatório Nacional Socioambiental, fontes públicas utilizadas e princípios editoriais.",
    href: "/sobre",
    frente: "geral",
    rotulo: "Sobre · ONSA",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["sobre", "onsa", "quem somos", "missao", "metodologia", "transparencia"],
  },
  {
    id: "central-imprensa",
    titulo: "Sala de Imprensa — R$ 251 Bi Auditados",
    descricao: "Dados consolidados para redações e pesquisadores: R$ 251 bi em recursos públicos, 199 cidades e 963 docs.",
    href: "/imprensa",
    frente: "geral",
    rotulo: "Imprensa · Números Chave",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["imprensa", "jornalistas", "dados abertos", "251 bi", "numeros chave", "contato imprensa"],
  },
  {
    id: "central-indice",
    titulo: "Índice Geral do Portal Controle Popular",
    descricao: "O mapa completo do site com acesso rápido a todas as frentes, cidades, instituições e tópicos.",
    href: "/indice",
    frente: "geral",
    rotulo: "Índice · Mapa Geral",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["indice", "mapa", "todas as paginas", "sumario", "navegacao"],
  },
];

/**
 * Busca rápida sobre as páginas do portal.
 * Casamento case-insensitive e unaccent sobre título, descrição, rota e palavras-chave.
 */
export function buscarPaginasPortal(consulta: string, limite = 6): PaginaPortalIndexada[] {
  const qLimpo = semAcento(consulta.trim().toLowerCase());
  if (!qLimpo || qLimpo.length < 2) return [];

  const termos = qLimpo.split(/\s+/).filter(Boolean);

  const pontuados = PAGINAS_PORTAL.map((pag) => {
    const tit = semAcento(pag.titulo.toLowerCase());
    const desc = semAcento(pag.descricao.toLowerCase());
    const rota = semAcento(pag.href.toLowerCase());
    const chaves = pag.palavrasChave.map((k) => semAcento(k.toLowerCase()));

    let score = 0;

    // Correspondência exata da consulta inteira no título
    if (tit.includes(qLimpo)) score += 20;
    // Correspondência na rota
    if (rota.includes(qLimpo)) score += 15;
    // Correspondência nas palavras-chave
    if (chaves.some((k) => k.includes(qLimpo) || qLimpo.includes(k))) score += 12;
    // Correspondência na descrição
    if (desc.includes(qLimpo)) score += 6;

    // Correspondência por termos individuais
    for (const t of termos) {
      if (tit.includes(t)) score += 5;
      if (chaves.some((k) => k.includes(t))) score += 4;
      if (desc.includes(t)) score += 2;
      if (rota.includes(t)) score += 3;
    }

    return { pag, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return pontuados.slice(0, limite).map((item) => item.pag);
}
