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
 * - Tecnologia e IA Livre (Arquitetura RAG e Modelos Abertos)
 * - Ferramentas de Direitos em Movimento e ComunicaBR
 */

import { semAcento, separarPalavras } from "./normalizar";

export interface PaginaPortalIndexada {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
  frente: "cidades" | "congresso" | "judiciario" | "ambiental" | "paraopeba" | "terras" | "estudos-rurais" | "geral";
  rotulo: string;
  badgeCor: string;
  palavrasChave: string[];
}

export const PAGINAS_PORTAL: PaginaPortalIndexada[] = [
  // ═══ LABORATÓRIO DE DADOS ═══
  {
    id: "laboratorio",
    titulo: "Laboratório de Dados",
    descricao: "Compare dois conjuntos de dados do portal em gráficos dither, com filtros do Seu Nonô. A busca alimenta as janelas do explorador.",
    href: "/laboratorio",
    frente: "geral",
    rotulo: "Explorador · gráficos",
    badgeCor: "var(--cp-geral, #7c7c9c)",
    palavrasChave: [
      "laboratorio", "explorador", "grafico", "dither", "dados", "comparar",
      "comparacao", "janelas", "barragens", "licencas", "educacao", "economia",
      "congresso", "judiciario", "clima", "esg", "vale", "pncp", "assembleias",
      "multinacionais", "acordos",
    ],
  },
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
    id: "trabalho-cadastro-empregadores",
    titulo: "Cadastro de Empregadores (trabalho escravo)",
    descricao:
      "A lista suja do MTE aberta em CNPJ: empresas que submeteram trabalhadores a condições análogas à escravidão, com o ato administrativo e os contratos públicos de cada uma.",
    href: "/direitos-em-movimento/trabalho-e-renda/cadastro-empregadores",
    frente: "geral",
    rotulo: "Trabalho · Lista suja",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: [
      "trabalho escravo", "lista suja", "cadastro de empregadores", "mte",
      "escravidao", "resgate", "fiscalizacao do trabalho", "cnpj", "análogo à escravidão",
    ],
  },
  {
    id: "seguranca-mortes-intervencao",
    titulo: "Mortes por intervenção policial",
    descricao:
      "Mortes por intervenção de agente do Estado no Brasil, por UF e sexo, e a fatia sobre as mortes violentas intencionais. Fonte: Sinesp VDE / MJSP.",
    href: "/direitos-em-movimento/seguranca-publica",
    frente: "geral",
    rotulo: "Segurança · Letalidade policial",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: [
      "violencia policial", "letalidade policial", "mortes por intervencao",
      "agente do estado", "sinesp", "seguranca publica", "mvi",
    ],
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
    id: "terra-vales",
    titulo: "Vales do Jequitinhonha e do Mucuri — 82 municípios",
    descricao:
      "Catálogo territorial do nordeste mineiro: lítio do Médio Jequitinhonha, comunidades tradicionais, o povo Maxakali e links oficiais de conferência.",
    href: "/terra-e-territorios/vales",
    frente: "terras",
    rotulo: "Eixo 2 · Vales · Jequitinhonha e Mucuri",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "jequitinhonha", "mucuri", "litio", "lithium valley", "geraizeiro", "vazanteiro",
      "quilombola", "maxakali", "sempre-vivas", "aracuai", "itinga", "diamantina",
      "teofilo otoni", "nanuque", "semiárido",
    ],
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
    id: "ambiental-condicionantes",
    titulo: "Condicionantes ambientais de barragens",
    descricao:
      "Piloto Irapé e Setúbal: o que a licença e o TAC mandam cumprir, com status de evidência pública e link à fonte.",
    href: "/ambiental/condicionantes",
    frente: "ambiental",
    rotulo: "Barragens · condicionantes",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "condicionante", "condicionantes", "irape", "irape", "setubal",
      "barragem", "licenca previa", "tac", "reassentamento",
    ],
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
  // Dois hrefs destas entradas apontavam para rota que não existe
  // (/paraopeba/repasses e /paraopeba/ptr) — medido em 01/10/2026 contra as
  // 304 rotas do App Router. Repasses: quem consulta município a município
  // é a página da execução do Acordo. PTR: o programa era outro (hoje o
  // pagamento é o NAE), então o destino é o hub, que explica as duas siglas
  // — e é o mesmo destino que top-100-paginas.json já usava.
  {
    id: "paraopeba-repasses",
    titulo: "Repasses Municipais do Acordo de Brumadinho",
    descricao: "Consulta município a município dos recursos transferidos pela Vale e Governo de Minas às prefeituras.",
    href: "/paraopeba/execucao",
    frente: "paraopeba",
    rotulo: "Repasses · R$ 5,48 Bi",
    badgeCor: "var(--cp-secondary)",
    palavrasChave: ["repasses", "prefeituras brumadinho", "5 bi", "municipios atingidos", "obras"],
  },
  {
    id: "paraopeba-ptr",
    titulo: "Programa de Transferência de Renda (PTR)",
    descricao: "Acompanhamento do pagamento mensal às famílias atingidas gerido pela Fundação Getulio Vargas (FGV).",
    href: "/paraopeba",
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
    id: "estado-renuncia-fiscal",
    titulo: "Renúncia Fiscal — o que o governo deixa de arrecadar",
    descricao:
      "Gastos tributários (isenções, reduções, regimes especiais) por função orçamentária e região, ano-base 2023. Fonte: Receita Federal.",
    href: "/estado-e-economia/renuncia-fiscal",
    frente: "geral",
    rotulo: "Estado · Renúncia fiscal",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "renuncia fiscal", "gastos tributarios", "desoneracao", "isencao", "incentivo fiscal",
      "receita federal", "dgt", "tributo", "renuncia", "carga tributaria",
    ],
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
    id: "eleicoes-fornecedores-campanha",
    titulo: "Fornecedores de Campanha 2022 (MG) — quem a campanha pagou",
    descricao:
      "Empresas que receberam das campanhas de 2022 em Minas Gerais, por CNPJ, com total contratado, principais candidatos e link para conferir os contratos públicos.",
    href: "/congresso/financiamento-eleitoral",
    frente: "congresso",
    rotulo: "Eleições · Fornecedores",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "eleicoes", "financiamento", "fornecedores", "campanha", "tse",
      "prestacao de contas", "despesas", "doacao", "contratos", "cnpj",
    ],
  },
  {
    id: "eleicoes-gastos-campanha-2026",
    titulo: "Gastos de campanha 2026 — publicidade, big tech e custo por voto",
    descricao:
      "Receita, despesa contratada e paga, publicidade digital e valor por voto nas Eleições de 2026, em 1.823 candidaturas, com link para a fonte oficial do TSE. Dado parcial medido em 09/10/2026.",
    href: "/eleicoes/2026/gastos-campanha",
    frente: "congresso",
    rotulo: "Eleições · Gastos",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "eleicoes", "gastos", "campanha", "despesa", "publicidade", "big tech",
      "meta", "custo por voto", "tse", "prestacao de contas", "2026", "urna",
    ],
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

  {
    id: "estudos-rurais-hub",
    titulo: "Estudos Rurais — Acervo dos Vales do Jequitinhonha e Mucuri",
    descricao: "Notícias, artigos, pesquisas e eventos do campo nos Vales do Jequitinhonha e Mucuri: PPGER/UFVJM, agricultura familiar e agroecologia.",
    href: "/estudos-rurais",
    frente: "estudos-rurais",
    rotulo: "Estudos · Rural",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "estudos rurais",
      "rural",
      "campo",
      "jequitinhonha",
      "mucuri",
      "agricultura familiar",
      "agroecologia",
      "ppger",
      "ufvjm",
      "ica",
      "vales",
      "pesquisas rurais",
      "assentamento",
      "campones",
      "car",
      "territorio",
    ],
  },
  {
    id: "editais-hub",
    titulo: "Editais, Chamamentos & Licitações de Minas Gerais",
    descricao: "Radar diário de editais de interesse social, chamamentos públicos, credenciamentos em saúde/educação e leilões no Diário Oficial de MG.",
    href: "/editais",
    frente: "geral",
    rotulo: "Editais · Diário Oficial",
    badgeCor: "var(--cp-primary)",
    palavrasChave: [
      "editais",
      "edital",
      "chamamento publico",
      "licitacoes",
      "credenciamento",
      "leilao",
      "diario oficial",
      "dom-mg",
      "pregao",
      "compras mg",
      "concursos",
    ],
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
    titulo: "Tecnologia & IA Livre — Seu Nonô, Arquitetura RAG e Código Aberto",
    descricao: "Arquitetura técnica do assistente cívico, modelos abertos, busca vetorial e lexical, métricas de latência e oficinas de IA.",
    href: "/tecnologia",
    frente: "geral",
    rotulo: "Tecnologia · IA Livre",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["tecnologia", "ia livre", "rag", "ollama", "seu nono", "codigo aberto", "github", "inteligencia artificial"],
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
  {
    id: "documentacao-hub",
    titulo: "Documentação Técnica do Portal",
    descricao: "Como o portal funciona: arquitetura, fontes, API pública e princípios editoriais. Para jornalistas, pesquisadores e desenvolvedores.",
    href: "/documentacao",
    frente: "geral",
    rotulo: "Documentação",
    badgeCor: "var(--cp-primary)",
    palavrasChave: ["documentacao", "api", "fontes", "arquitetura", "codigo aberto", "como funciona", "metodologia"],
  },
  {
    id: "fontes-27-estados",
    titulo: "Fontes de Dados dos 27 Estados",
    descricao: "Catálogo de portais oficiais de transparência, dados abertos e órgãos de controle dos 27 estados brasileiros.",
    href: "/fontes-estados",
    frente: "geral",
    rotulo: "Fontes por Estado",
    badgeCor: "var(--cp-primary)",
    palavrasChave: [
      "fontes", "estados", "transparencia", "dados abertos", "controladoria",
      "tribunal de contas", "assembleia legislativa", "ministerio publico",
      "defensoria publica", "diario oficial", "licitacoes"
    ],
  },

  // ═══ NOVAS BASES E HUBs (rodada 29/09/2026) ═══
  {
    id: "ambiental-autorizacoes",
    titulo: "Destinações de Imóveis da União em Minas Gerais",
    descricao:
      "Cadastro público dos imóveis da União em MG, com destinação, classe, proprietário e área — fonte SPU (Transparência Ativa).",
    href: "/ambiental/autorizacoes",
    frente: "ambiental",
    rotulo: "União · Imóveis SPU",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "imoveis da uniao", "patrimonio da uniao", "spu", "destinacao", "destinacoes",
      "autorizacoes", "imoveis publicos", "terras da uniao", "regime",
    ],
  },
  {
    id: "ambiental-ppp",
    titulo: "Concessões e Parcerias Público-Privadas de Minas Gerais",
    descricao:
      "Os contratos mineiros cujo objeto cita concessão ou PPP, com valor, vigência e concessionária — separando a concessão do apoio e do estudo.",
    href: "/ambiental/ppp",
    frente: "ambiental",
    rotulo: "PPPs · Concessões MG",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "ppp", "ppps", "concessao", "concessoes", "parceria publico-privada",
      "parcerias publico-privadas", "concessionaria", "contrato mg", "governo de minas",
    ],
  },
  {
    id: "cidades-mg",
    titulo: "Municípios de Minas Gerais (IBGE)",
    descricao:
      "Lista completa dos 853 municípios de MG com busca em tempo real, microrregiões e mesorregiões, e os 10 polos com população do Censo 2022.",
    href: "/cidades/mg",
    frente: "cidades",
    rotulo: "MG · 853 Municípios",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "municipios de mg", "municipios de minas", "cidades de mg", "lista de municipios",
      "ibge", "mesorregiao", "microrregiao", "censo 2022", "polos de mg", "853 municipios",
    ],
  },
  {
    id: "mineracao-cavas",
    titulo: "Cavas de Mineração em Minas Gerais — Série e Globo 3D",
    descricao:
      "A série anual da mineração mapeada por satélite em MG e o cruzamento das cavas com os polígonos da ANM, com camadas no globo 3D.",
    href: "/mineracao/cavas",
    frente: "terras",
    rotulo: "Cavas · Mineração",
    badgeCor: "var(--cp-alert)",
    palavrasChave: [
      "cavas", "cava", "mineracao", "serie anual", "mapbiomas", "anm",
      "mineracao por satelite", "onde a mineracao cresceu", "globo 3d", "rejeito",
    ],
  },
  {
    id: "assembleias-hub",
    titulo: "Assembleias Legislativas dos Estados",
    descricao:
      "Auditoria cívica das 27 Casas Legislativas estaduais e distrital: deputados estaduais, comissões, proposições e rankings de atuação.",
    href: "/assembleias",
    frente: "congresso",
    rotulo: "Assembleias · 27 UFs",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "assembleias", "assembleia", "assembleia legislativa", "deputados estaduais",
      "parlamento estadual", "mesa diretora", "comissoes", "projetos estaduais",
    ],
  },
  {
    id: "internacional-multilateral",
    titulo: "Transparência Multilateral & Internacional",
    descricao:
      "Comparação cívica do Brasil com potências do G8 e G20: IDH e Gini da ONU/Banco Mundial, gastos em saúde e educação, comércio de minérios e direitos territoriais.",
    href: "/internacional",
    frente: "geral",
    rotulo: "Internacional · ONU/OMC",
    badgeCor: "var(--cp-primary)",
    palavrasChave: [
      "internacional", "multilateral", "onu", "pnud", "unesco", "oms", "omc",
      "idh", "gini", "g8", "g20", "comercio de minerios", "povos originarios",
    ],
  },

  // ═══ HUBs COMPLEMENTARES (completado 30/09/2026) ═══
  // Fecha o buraco entre a busca e as bases que o RAG já cobre
  // (PLANO-RAG-COMPLETO): cada hub vira resultado de busca.
  {
    id: "memoria-lutas",
    titulo: "Linha do Tempo das Lutas e Resistências",
    descricao:
      "Memória das resistências, revoltas e lutas populares do país, dos estados e dos municípios, com data e fonte oficial.",
    href: "/memoria",
    frente: "geral",
    rotulo: "Memória · Lutas",
    badgeCor: "var(--cp-primary)",
    palavrasChave: [
      "memoria", "lutas", "resistencia", "revolta", "greve", "quilombo",
      "indigena", "anistia", "ditadura", "massacre", "direitos humanos",
    ],
  },
  {
    id: "ambiental-licencas",
    titulo: "Licenças Ambientais Estaduais e Federais",
    descricao:
      "Acervo unificado de licenças de operação, instalação e prévias dos órgãos estaduais (CETESB, FEAM, INEA, IMASUL e outros) e do IBAMA.",
    href: "/ambiental/licencas",
    frente: "ambiental",
    rotulo: "Licenças · 11 UFs",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "licencas", "licenca", "licenciamento", "cetesb", "feam", "ibama",
      "imasul", "inea", "lo", "li", "lp", "empreendimento", "meio ambiente",
    ],
  },
  {
    id: "ambiental-licenciamento",
    titulo: "Licenciamento Ambiental de Minas Gerais (SEMAD/COPAM)",
    descricao:
      "Censo dos empreendimentos com licença deferida pela SEMAD, filtrável por município, setor, classe de risco e modalidade.",
    href: "/ambiental/licenciamento",
    frente: "ambiental",
    rotulo: "SEMAD · MG",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "licenciamento", "semad", "licenca", "classes de risco", "modalidade",
      "empreendimentos", "mineracao", "infraestrutura", "residuos",
    ],
  },
  {
    id: "ambiental-copam",
    titulo: "Pautas e Decisões do COPAM",
    descricao:
      "Reuniões, pautas e decisões do Conselho Estadual de Política Ambiental de Minas Gerais, com link ao ato e à fonte.",
    href: "/ambiental/copam",
    frente: "ambiental",
    rotulo: "COPAM · Decisões",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "copam", "conselho", "ambiental", "reuniao", "pauta", "decisao",
      "deliberacao", "minas gerais",
    ],
  },
  {
    id: "ambiental-tac",
    titulo: "Termos de Ajustamento de Conduta (TACs Ambientais)",
    descricao:
      "Acervo de TACs ambientais firmados por órgãos públicos, com objeto, órgão e link ao documento.",
    href: "/ambiental/tac",
    frente: "ambiental",
    rotulo: "TAC · Ambiental",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "tac", "termo de ajustamento", "ajustamento de conduta", "conduta",
      "compromisso", "mpmg", "ibama", "reparacao",
    ],
  },
  {
    id: "ambiental-rios",
    titulo: "Nossos Rios — Doce, Paraopeba e Jequitinhonha",
    descricao:
      "Outorgas de água da ANA e do IGAM, comitês de bacia e a qualidade da água dos rios monitorados, com fonte oficial.",
    href: "/ambiental/nossos-rios",
    frente: "ambiental",
    rotulo: "Rios · Água",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "rios", "rio", "agua", "outorga", "outorgas", "ana", "igam",
      "comite de bacia", "bacia", "doce", "paraopeba", "jequitinhonha",
    ],
  },
  {
    id: "judiciario-contatos",
    titulo: "Varas, Gabinetes e Balcão Virtual da Justiça",
    descricao:
      "Guia de 990 varas e gabinetes do TJMG, TRT-3 e TRF-6, com contatos, endereços e canal virtual de atendimento.",
    href: "/judiciario/contatos",
    frente: "judiciario",
    rotulo: "Justiça · Contatos",
    badgeCor: "var(--cp-primary)",
    palavrasChave: [
      "varas", "gabinete", "contatos", "balcao virtual", "comarca",
      "tjmg", "trt", "trf", "telefone", "endereco", "atendimento",
    ],
  },
  {
    id: "empresas-hub",
    titulo: "Grandes Empresas, ESG e Fundos",
    descricao:
      "Perfil de grandes empresas e fundos (Vale, Sigma Lithium e multinacionais), documentos corporativos, ESG e vínculos societários.",
    href: "/empresas",
    frente: "geral",
    rotulo: "Empresas · ESG",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "empresas", "empresa", "esg", "vale", "socios", "qsa", "fundos",
      "multinacionais", "cvm", "governanca", "emissoes",
    ],
  },
  {
    id: "empresas-executivos",
    titulo: "Executivos, Conselhos e Porta Giratória",
    descricao:
      "Governança das grandes companhias: diretores, conselhos e comitês, remunerações, diretorias entrelaçadas e quem declarou à CVM ter exercido cargo público (porta giratória).",
    href: "/empresas/executivos",
    frente: "geral",
    rotulo: "Empresas · Governança",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "executivos", "conselho", "conselheiros", "ceo", "diretoria", "comite",
      "governanca", "remuneracao", "porta giratoria", "revolving door",
      "interlocking", "cvm", "formulario de referencia", "fre", "pep",
    ],
  },
  {
    id: "eua-hub",
    titulo: "Transparência dos Estados Unidos (SEC, USAspending, Barragens)",
    descricao:
      "Dados abertos dos EUA que afetam o Brasil: registros da SEC, compras USAspending.gov, barragens NID/USACE e terras da BIA.",
    href: "/eua",
    frente: "geral",
    rotulo: "EUA · SEC",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "eua", "estados unidos", "sec", "edgar", "usaspending", "barragens",
      "nid", "usace", "bia", "terras indigenas", "comercio",
    ],
  },
  {
    id: "canada-hub",
    titulo: "Mineradoras Canadenses na TSX e Emissões",
    descricao:
      "Mineradoras listadas na TSX que operam no Brasil, emissões do ECCC NPRI, caso Mount Polley e a ouvidoria CORE.",
    href: "/canada",
    frente: "geral",
    rotulo: "Canadá · TSX",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "canada", "tsx", "mineradoras", "mount polley", "npri", "eccc",
      "emissoes", "core", "ouvidoria", "rejeitos",
    ],
  },
  {
    id: "conselhos-hub",
    titulo: "Conselhos de Direitos e Colegiados Municipais",
    descricao:
      "Mapa dos conselhos de saúde, meio ambiente, tutelares e de direitos humanos, com datas de reunião e canais de participação.",
    href: "/direitos-em-movimento/conselhos",
    frente: "geral",
    rotulo: "Conselhos · Participação",
    badgeCor: "var(--cp-eixo-direitos)",
    palavrasChave: [
      "conselhos", "conselho", "colegiado", "participacao", "saude",
      "tutelar", "codema", "direitos humanos", "reuniao",
    ],
  },
  {
    id: "governo-hub",
    titulo: "Governos: Prometeu? Cumpriu?",
    descricao:
      "Acompanhamento dos planos de governo eleitos e das promessas, comparando o que foi anunciado com o que foi executado.",
    href: "/governo",
    frente: "geral",
    rotulo: "Governo · Promessas",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "governo", "governos", "promessa", "plano de governo", "eleito",
      "cumprimento", "meta", "gestao",
    ],
  },
  {
    id: "estado-economia-hub",
    titulo: "Estado e Economia",
    descricao:
      "Auditoria do gasto público estadual: orçamento, arrecadação, séries econômicas e séries do Banco Central.",
    href: "/estado-e-economia",
    frente: "geral",
    rotulo: "Estado · Economia",
    badgeCor: "var(--cp-eixo-estado)",
    palavrasChave: [
      "estado", "economia", "orcamento", "arrecadacao", "receita",
      "tributo", "divida", "banco central", "series economicas",
    ],
  },
  {
    id: "transparencia-internacional-hub",
    titulo: "Índices de Transparência Internacional",
    descricao:
      "Comparação do Brasil em índices globais de transparência, corrupção e governança, com a fonte de cada índice.",
    href: "/transparencia-internacional",
    frente: "geral",
    rotulo: "Transparência · Global",
    badgeCor: "var(--cp-primary)",
    palavrasChave: [
      "transparencia internacional", "indice", "corrupcao", "governanca",
      "ranking", "percepcao", "global",
    ],
  },
  {
    id: "biblioteca-hub",
    titulo: "Biblioteca Geral e Pesquisa",
    descricao:
      "Acervo pesquisável de estudos, artigos, relatórios e publicações do portal, com busca tolerante a acento.",
    href: "/biblioteca",
    frente: "geral",
    rotulo: "Biblioteca · Acervo",
    badgeCor: "var(--cp-primary)",
    palavrasChave: [
      "biblioteca", "acervo", "estudos", "artigos", "pesquisa",
      "publicacoes", "relatorios", "scielo",
    ],
  },
  {
    id: "funcao-social-hub",
    titulo: "Função Social da Terra e Territórios",
    descricao:
      "Terras públicas, territórios indígenas e quilombolas, unidades de conservação e o globo 3D com camadas de sobreposição.",
    href: "/funcaosocialterra",
    frente: "terras",
    rotulo: "Terra · Territórios",
    badgeCor: "var(--cp-eixo-terra)",
    palavrasChave: [
      "funcao social", "terra", "territorio", "terras publicas", "indigena",
      "quilombola", "unidade de conservacao", "globo 3d", "grilagem",
    ],
  },
  {
    id: "radio-hub",
    titulo: "Rádios do Brasil e do Mundo",
    descricao:
      "Diretório de estações de rádio — públicas federais, universitárias, comunitárias e do Sul Global — com transmissão ao vivo, fonte oficial e filtro por país.",
    href: "/radio",
    frente: "geral",
    rotulo: "Rádio · Diretório",
    badgeCor: "var(--cp-primary)",
    palavrasChave: [
      "radio", "radios", "estacao", "emissora", "ao vivo", "federal", "ebc",
      "radio nacional", "radio mec", "universitaria", "ufmg", "comunitaria",
      "radio favela", "brasil de fato", "cumbia", "reggae", "afrobeat", "musica",
    ],
  },
];

/**
 * Busca rápida sobre as páginas do portal.
 * Casamento case-insensitive e unaccent sobre título, descrição, rota e palavras-chave.
 */
export function buscarPaginasPortal(consulta: string, limite = 6): PaginaPortalIndexada[] {
  // Uma normalização só para a consulta. `separarPalavras` tira acento e
  // pontuação e separa letra de dígito — é o mesmo passo do índice de busca,
  // então consulta e acervo se alinham sozinhos. Antes a consulta passava por
  // `semAcento` + `split`, e "licitações;" virava o termo `licitacoes;`, que
  // não casa com a palavra-chave `licitacoes` (dívida 22.5).
  const termos = separarPalavras(consulta);
  if (termos.length === 0) return [];
  const qLimpo = termos.join(" ");
  if (qLimpo.length < 2) return [];

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
