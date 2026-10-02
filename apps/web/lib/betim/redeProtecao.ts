import { nomePortal, type Cidade } from "@/lib/db/queries/municipios";

/**
 * Dados de `/[municipio]/rede-de-protecao` — a seção que responde duas
 * perguntas de quem chega precisando: "onde eu peço essa informação?" (Lei
 * de Acesso à Informação) e "onde eu busco ajuda?" (rede de proteção de
 * direitos em MG).
 *
 * Fonte: dois levantamentos verificados ao vivo em 2026-08-13 e commitados
 * em worktrees separados —
 *   `docs/LAI-PORTAIS.md`      (worktree `worktree/lai-portais`)
 *   `docs/REDE-PROTECAO-MG.md` (worktree `worktree/rede-protecao`)
 * Todo item abaixo tem correspondência direta numa linha "✅" desses
 * documentos. O que só apareceu como "⚠️ não verificado" ou "❌ não
 * encontrado" NÃO vira `ItemPainel` — fica em `NAO_VERIFICADO`, isolado, na
 * mesma doutrina dos dois documentos-fonte: não misturar confirmado com
 * pista de pesquisa.
 *
 * ═══ POR QUE ESTADUAL/FEDERAL SÃO CONST, NÃO TABELA ═══
 *
 * Mesma decisão de `links-uteis-mg/page.tsx`: é uma lista curada (~90 itens
 * desde 02/10/2026, quando `JUSTICA_ESTADUAL` somou as Defensorias e MPs das
 * outras 26 UFs), atualizada por commit quando um link mudar — não dado
 * operacional que cresce por ETL. Uma tabela pra isso seria infraestrutura
 * sem uso: o filtro por UF é em memória (dezenas de linhas por estado), não
 * precisa de paginação nem de ingestão.
 *
 * ═══ O QUE É DINÂMICO ═══
 *
 * Só o canal municipal de LAI (Prefeitura/Câmara) — que já existe por
 * cidade em `municipios.fontes.sic_prefeitura`/`sic_camara`
 * (ver `PedidoLAI.tsx` e a migration `0068`). Cidade sem a chave não ganha
 * o card, não um link para o órgão errado.
 */

export type Necessidade =
  | "pedir_informacao"
  | "denunciar"
  | "defesa_gratuita"
  | "protecao_crianca"
  | "violencia_mulher"
  | "direitos_humanos"
  | "assistencia_social"
  | "discriminacao"
  | "pessoa_deficiencia_idoso"
  | "meio_ambiente_terras"
  | "consumidor";

export const NECESSIDADE_LABEL: Record<Necessidade, string> = {
  pedir_informacao: "Pedir informação pública (LAI)",
  denunciar: "Denunciar irregularidade ou crime",
  defesa_gratuita: "Defesa jurídica gratuita",
  protecao_crianca: "Proteger criança ou adolescente",
  violencia_mulher: "Violência contra a mulher",
  direitos_humanos: "Direitos humanos",
  assistencia_social: "Assistência social e benefícios",
  discriminacao: "Racismo, LGBTfobia e intolerância",
  pessoa_deficiencia_idoso: "Pessoa com deficiência ou idoso",
  meio_ambiente_terras: "Meio ambiente e terras",
  consumidor: "Direitos do consumidor",
};

export const NECESSIDADE_ORDEM: Necessidade[] = [
  "pedir_informacao",
  "denunciar",
  "defesa_gratuita",
  "violencia_mulher",
  "protecao_crianca",
  "direitos_humanos",
  "assistencia_social",
  "discriminacao",
  "pessoa_deficiencia_idoso",
  "meio_ambiente_terras",
  "consumidor",
];

export type Abrangencia = "municipal" | "estadual" | "federal";
export type Natureza = "oficial" | "popular" | "academico";

export const ABRANGENCIA_LABEL: Record<Abrangencia, string> = {
  municipal: "Municipal",
  estadual: "Estadual (MG)",
  federal: "Federal",
};

export const NATUREZA_LABEL: Record<Natureza, string> = {
  oficial: "Órgão oficial",
  popular: "Rede popular/associativa",
  academico: "Clínica jurídica acadêmica",
};

export interface ItemPainel {
  id: string;
  tipo: "informacao" | "ajuda";
  nome: string;
  /** Em linguagem simples — o que a pessoa recebe ali, não o nome do decreto. */
  oQueAtende: string;
  necessidades: Necessidade[];
  abrangencia: Abrangencia;
  /**
   * UF do órgão — só usada nos itens estaduais de OUTROS estados (item 6).
   * Item com `abrangencia: "estadual"` e SEM `uf` é de MG, como sempre foi;
   * item estadual COM `uf` só aparece para quem está naquela UF. Sem esse
   * campo o seletor nacional mostraria a Defensoria de São Paulo para quem
   * mora na Bahia — o erro de estado errado que o teste de `redeProtecao`
   * já protege desde 13/08.
   */
  uf?: string;
  natureza: Natureza;
  site: string | null;
  telefone?: string;
  endereco?: string;
  gratuito: boolean;
  prazo?: string;
  verificadoEm: string;
  nota?: string;
}

const V = "2026-08-13";

// ═══════════════════════════ LAI — estadual (MG) ═══════════════════════════
// Só aparece para cidade com `links_uteis_mg` — mesmo gate de
// `links-uteis-mg/page.tsx`: estes órgãos são de Minas, não servem a São Paulo.

export const LAI_ESTADUAL: ItemPainel[] = [
  {
    id: "lai-mg-executivo",
    tipo: "informacao",
    nome: "Poder Executivo estadual (CGE-MG)",
    oQueAtende:
      "Pedido de informação a qualquer secretaria ou órgão do Executivo mineiro — inclusive Semad, Feam e Igam, que não têm e-SIC próprio e tramitam por aqui.",
    necessidades: ["pedir_informacao"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://acessoainformacao.mg.gov.br/sistema/site/Oque.aspx",
    prazo: "20 dias, prorrogáveis por 10 (regra padrão da Lei 12.527/2011)",
    gratuito: true,
    verificadoEm: V,
    nota: "Pede login gov.br (tem fluxo de \"Primeiro Acesso\"). Selecione o órgão certo dentro do sistema — não existe URL separada por secretaria.",
  },
  {
    id: "lai-mg-tce",
    tipo: "informacao",
    nome: "TCE-MG (Tribunal de Contas)",
    oQueAtende: "Pedido de informação sobre fiscalização de contas de Estado e municípios mineiros.",
    necessidades: ["pedir_informacao"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.tce.mg.gov.br/fale_tce/",
    prazo: "20 dias para resposta, 5 dias para recurso (Resolução 12/2014)",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "lai-mg-mpmg",
    tipo: "informacao",
    nome: "MPMG — requerimento de informação",
    oQueAtende: "Pedido de informação sobre a atuação do Ministério Público estadual.",
    necessidades: ["pedir_informacao"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.mpmg.mp.br/portal/menu/servicos/atendimento-ao-cidadao/requerimento-de-informacoes-lai.shtml",
    gratuito: true,
    verificadoEm: V,
    nota: "Prazo de resposta não aparece na página; o formulário pode ficar suspenso em recesso/feriado prolongado. Alternativa: tel. (31) 3330-9504 / 127.",
  },
  {
    id: "lai-mg-defensoria",
    tipo: "informacao",
    nome: "Defensoria Pública de MG — SIC",
    oQueAtende: "Pedido de informação sobre a atuação da Defensoria Pública estadual.",
    necessidades: ["pedir_informacao"],
    abrangencia: "estadual",
    natureza: "oficial",
    // Estava em NAO_VERIFICADO até 2026-08-14: a URL testada antes
    // (`defensoria.mg.def.br/acesso-a-informacao/`) dá 404 porque o SIC
    // mora num SUBDOMÍNIO diferente do site institucional
    // (`transparencia.defensoria.mg.def.br`), não porque o canal não
    // existe. Formulário SEI confirmado ao vivo, com campo "Tipo: LAI -
    // Lei de Acesso à Informação".
    site: "https://transparencia.defensoria.mg.def.br/acesso-a-informacao/",
    telefone: "(31) 3526-0500",
    endereco: "Rua dos Guajajaras, 1707, Barro Preto, Belo Horizonte/MG",
    prazo: "20 dias, prorrogáveis por 10 (Resolução nº 3573/2025)",
    gratuito: true,
    verificadoEm: "2026-08-14",
    nota: "O formulário em si é um SEI (sei.defensoria.mg.def.br) alcançado por um link \"Pedido de Acesso à Informação\" dentro da página acima — não uma URL de formulário direta e estável.",
  },
];

// ═══════════════════════════ LAI — federal ═══════════════════════════
// Aparece para qualquer cidade — a administração pública federal é a mesma
// em todo o país.

export const LAI_FEDERAL: ItemPainel[] = [
  {
    id: "lai-falabr",
    tipo: "informacao",
    nome: "Fala.BR — canal único de LAI federal",
    oQueAtende:
      "Pedido de informação a qualquer órgão da administração pública federal (CGU, INCRA, IBAMA, ANA, ANM, ministérios...) — escolha o órgão dentro da plataforma.",
    necessidades: ["pedir_informacao"],
    abrangencia: "federal",
    natureza: "oficial",
    site: "https://falabr.cgu.gov.br/",
    gratuito: true,
    verificadoEm: V,
    nota: "O Fala.BR gera um número de protocolo na confirmação e por e-mail — é o que permite consultar prazo e recorrer. Anote-o: nada neste painel grava esse número automaticamente hoje.",
  },
  {
    id: "lai-incra",
    tipo: "informacao",
    nome: "INCRA — Serviço de Informação ao Cidadão",
    oQueAtende: "Pedido de informação sobre reforma agrária e questão fundiária — encaminha ao Fala.BR.",
    necessidades: ["pedir_informacao", "meio_ambiente_terras"],
    abrangencia: "federal",
    natureza: "oficial",
    site: "https://www.gov.br/incra/pt-br/acesso-a-informacao/servico-de-informacao-ao-cidadao",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "lai-ibama",
    tipo: "informacao",
    nome: "IBAMA — Serviço de Informação ao Cidadão",
    oQueAtende: "Pedido de informação sobre licenciamento e fiscalização ambiental federal — encaminha ao Fala.BR.",
    necessidades: ["pedir_informacao", "meio_ambiente_terras"],
    abrangencia: "federal",
    natureza: "oficial",
    site: "https://www.gov.br/ibama/pt-br/acesso-a-informacao/servico-de-informacao-ao-cidadao-sic",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "lai-ana",
    tipo: "informacao",
    nome: "ANA — Serviço de Informação ao Cidadão",
    oQueAtende: "Pedido de informação sobre recursos hídricos e outorga federal de água — encaminha ao Fala.BR.",
    necessidades: ["pedir_informacao", "meio_ambiente_terras"],
    abrangencia: "federal",
    natureza: "oficial",
    site: "https://www.gov.br/ana/pt-br/acesso-a-informacao/servicos-de-informacao-ao-cidadao-sic",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "lai-anm",
    tipo: "informacao",
    nome: "ANM — Serviço de Informação ao Cidadão",
    oQueAtende: "Pedido de informação sobre mineração e CFEM — encaminha ao Fala.BR.",
    necessidades: ["pedir_informacao", "meio_ambiente_terras"],
    abrangencia: "federal",
    natureza: "oficial",
    site: "https://www.gov.br/anm/pt-br/acesso-a-informacao/servico-de-informacao-ao-cidadao-sic-1",
    gratuito: true,
    verificadoEm: V,
  },
];

// ═══════════════════════════ Rede de proteção ═══════════════════════════

export const REDE_ITENS: ItemPainel[] = [
  // Defensoria — geral
  {
    id: "rede-defensoria-mg",
    tipo: "ajuda",
    nome: "Defensoria Pública de Minas Gerais",
    oQueAtende:
      "Representa de graça na Justiça quem não tem dinheiro para advogado — moradia, saúde, criminal, violência doméstica e quase qualquer problema jurídico. Presente em 109–110 comarcas de MG.",
    necessidades: ["defesa_gratuita", "violencia_mulher", "protecao_crianca"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://defensoria.mg.def.br/",
    endereco: "Rua dos Guajajaras, 1707 — Belo Horizonte/MG",
    gratuito: true,
    verificadoEm: V,
    nota: "Busque a unidade mais próxima em defensoria.mg.def.br/unidades/. Documentos do primeiro atendimento: CPF, RG, comprovante de endereço e de renda.",
  },
  {
    id: "rede-defensoria-aracuai",
    tipo: "ajuda",
    nome: "Defensoria Pública — unidade de Araçuaí",
    oQueAtende:
      "Mesma Defensoria acima, com atendimento presencial no Vale do Jequitinhonha: Araçuaí, Coronel Murta, Itinga, Padre Paraíso, Ponto dos Volantes e Virgem da Lapa.",
    necessidades: ["defesa_gratuita", "violencia_mulher", "protecao_crianca"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: "https://defensoria.mg.def.br/unidade/aracuai/",
    endereco: "Rua Montes Claros, 1095 — Santa Tereza, Araçuaí/MG",
    telefone: "(33) 3588-1997",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-defensoria-diamantina",
    tipo: "ajuda",
    nome: "Defensoria Pública — unidade de Diamantina",
    oQueAtende:
      "Unidade inaugurada em novembro de 2024, com Centro de Conciliação e Mediação. Atua em Família e Sucessões, Direito Criminal, Execução Penal e Infância/Juventude para 9 municípios da região.",
    necessidades: ["defesa_gratuita", "protecao_crianca"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: "https://defensoria.mg.def.br/unidade/diamantina/",
    gratuito: true,
    verificadoEm: V,
    nota: "Endereço/telefone da unidade não estão estáveis na página institucional — use o e-mail atendimento.diamantina@defensoria.mg.def.br ou ligue para a Defensoria central para confirmar antes de se deslocar.",
  },

  // MPMG
  {
    id: "rede-mpmg",
    tipo: "ajuda",
    nome: "Ministério Público de Minas Gerais — canais de denúncia",
    oQueAtende:
      "Fiscaliza a lei e pode investigar crime contra patrimônio público, meio ambiente, crianças, idosos, pessoas com deficiência, consumidores. Não é \"seu advogado\": defende interesses coletivos, mas qualquer pessoa pode denunciar.",
    necessidades: ["denunciar", "consumidor"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.mpmg.mp.br/portal/menu/servicos/atendimento-ao-cidadao/orientacoes-sobre-manifestacoes-e-denuncias.htm",
    telefone: "127 (gratuito, MG) ou (31) 3330-9504",
    endereco: "Rua Gonçalves Dias, 2.039, 14º andar, Lourdes, Belo Horizonte/MG",
    gratuito: true,
    verificadoEm: V,
    nota: "A denúncia concreta é feita na Promotoria da comarca da pessoa — a Ouvidoria (127) direciona.",
  },
  {
    id: "rede-mpmg-caodh",
    tipo: "ajuda",
    nome: "MPMG — CAODH (Centro de Apoio Operacional de Direitos Humanos)",
    oQueAtende: "Orienta e articula a atuação das promotorias de direitos humanos e controle da atividade policial.",
    necessidades: ["direitos_humanos", "denunciar"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.mpmg.mp.br/portal/menu/conheca-o-mpmg/centros-de-apoio-operacional.shtml",
    gratuito: true,
    verificadoEm: V,
    nota: "O CAO organiza política institucional; a denúncia concreta vai para a Promotoria da comarca.",
  },
  {
    id: "rede-mpmg-caodca",
    tipo: "ajuda",
    nome: "MPMG — CAODCA (Infância e Juventude)",
    oQueAtende: "Orienta a atuação das promotorias voltadas a crianças e adolescentes.",
    necessidades: ["protecao_crianca", "denunciar"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.mpmg.mp.br/portal/menu/conheca-o-mpmg/centros-de-apoio-operacional.shtml",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-mpmg-caovd",
    tipo: "ajuda",
    nome: "MPMG — CAOVD (Violência Doméstica e Familiar contra a Mulher)",
    oQueAtende: "Orienta a atuação das promotorias voltadas a violência doméstica e familiar.",
    necessidades: ["violencia_mulher", "denunciar"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.mpmg.mp.br/portal/menu/conheca-o-mpmg/centros-de-apoio-operacional.shtml",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-mpmg-caoipcd",
    tipo: "ajuda",
    nome: "MPMG — CAOIPCD (Idosos e Pessoas com Deficiência)",
    oQueAtende: "Orienta a atuação das promotorias voltadas a idosos e pessoas com deficiência.",
    necessidades: ["pessoa_deficiencia_idoso", "denunciar"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.mpmg.mp.br/portal/menu/conheca-o-mpmg/centros-de-apoio-operacional.shtml",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-mpmg-procon",
    tipo: "ajuda",
    nome: "PROCON-MG (via MPMG)",
    oQueAtende: "Orienta a defesa do consumidor no Estado.",
    necessidades: ["consumidor", "denunciar"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.mpmg.mp.br/portal/menu/conheca-o-mpmg/centros-de-apoio-operacional.shtml",
    gratuito: true,
    verificadoEm: V,
  },

  // Delegacias especializadas — BH
  {
    id: "rede-deam-bh",
    tipo: "ajuda",
    nome: "DEAM — Delegacia da Mulher (Belo Horizonte)",
    oQueAtende:
      "Registro de ocorrência e pedido de medida protetiva em violência contra a mulher. Única DEAM de MG que funciona 24h — as outras 69 do estado têm horário limitado.",
    necessidades: ["violencia_mulher", "denunciar"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: "https://www.mg.gov.br/instituicao_unidade/delegacia-especializada-de-atendimento-mulher",
    endereco: "Rua Rio Grande do Sul, 661, Barro Preto, Belo Horizonte/MG",
    telefone: "(31) 3330-5752",
    gratuito: true,
    verificadoEm: V,
    nota: "Fora de BH, use a busca oficial da PCMG (policiacivil.mg.gov.br/delegacia/exibir) ou o 190/Delegacia Virtual (delegaciavirtual.sids.mg.gov.br).",
  },
  {
    id: "rede-decrin-bh",
    tipo: "ajuda",
    nome: "DECRIN — Racismo, Xenofobia e LGBTfobia (Belo Horizonte)",
    oQueAtende: "Investigação de crimes de racismo, xenofobia, LGBTfobia e intolerâncias correlatas.",
    necessidades: ["discriminacao", "denunciar"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: "https://www.mg.gov.br/instituicao_unidade/delegacia-especializada-de-investigacao-de-crimes-de-racismo-xenofobia",
    endereco: "Rua Rio Grande do Sul, 661, Barro Preto, Belo Horizonte/MG",
    telefone: "(31) 3330-5780",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-deadi-bh",
    tipo: "ajuda",
    nome: "DEADI — Pessoa com Deficiência e Idoso (Belo Horizonte)",
    oQueAtende: "Atendimento a pessoas com deficiência e idosos vítimas de crime.",
    necessidades: ["pessoa_deficiencia_idoso", "denunciar"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: "https://www.mg.gov.br/instituicao_unidade/delegacia-especializada-de-atendimento-pessoa-com-deficiencia-e-ao-idoso",
    endereco: "Rua Rio Grande do Sul, 661, Barro Preto, Belo Horizonte/MG",
    telefone: "(31) 3330-5754",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-dopcad-bh",
    tipo: "ajuda",
    nome: "DOPCAD/DEPCA — Proteção à Criança e ao Adolescente (Belo Horizonte)",
    oQueAtende: "Atendimento a crianças e adolescentes vítimas de crime.",
    necessidades: ["protecao_crianca", "denunciar"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: "https://www.mg.gov.br/instituicao_unidade/divisao-especializada-em-orientacao-e-protecao-crianca-e-ao-adolescente-dopcad",
    endereco: "Rua Rio Grande do Sul, 661, Barro Preto, Belo Horizonte/MG",
    telefone: "(31) 3330-5701",
    gratuito: true,
    verificadoEm: V,
  },

  // Assistência social — genérico, qualquer município
  {
    id: "rede-cras",
    tipo: "ajuda",
    nome: "CRAS — Centro de Referência de Assistência Social",
    oQueAtende:
      "Porta de entrada da assistência social no bairro: Cadastro Único (Bolsa Família e outros benefícios), orientação de direitos, apoio em conflitos familiares e primeira orientação em violência doméstica. Foco em prevenção.",
    necessidades: ["assistencia_social"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: "https://www.gov.br/pt-br/servicos/acessar-o-cras-centro-de-referencia-da-assistencia-social",
    gratuito: true,
    verificadoEm: V,
    nota: "Cada município de MG tem sua própria rede de CRAS, tocada pela prefeitura — o link acima ajuda a achar o do seu.",
  },
  {
    id: "rede-creas",
    tipo: "ajuda",
    nome: "CREAS — Centro de Referência Especializado de Assistência Social",
    oQueAtende:
      "Para quando o direito já foi violado — violência, abuso, negligência grave, situação de rua, trabalho infantil. Acompanhamento especializado com psicólogos e assistentes sociais. Foco em reparação.",
    necessidades: ["assistencia_social", "protecao_crianca", "violencia_mulher"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: "https://www.gov.br/pt-br/servicos/acessar-o-cras-centro-de-referencia-da-assistencia-social",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-conselho-tutelar",
    tipo: "ajuda",
    nome: "Conselho Tutelar",
    oQueAtende:
      "Recebe denúncia e age quando o direito de uma criança/adolescente está sendo violado — maus-tratos, negligência, abuso, exploração. Tem plantão para casos urgentes, inclusive fora do horário comercial.",
    necessidades: ["protecao_crianca", "denunciar"],
    abrangencia: "municipal",
    natureza: "oficial",
    site: null,
    telefone: "100 (Disque Direitos Humanos, nacional, 24h)",
    gratuito: true,
    verificadoEm: V,
    nota: "Cada município tem o seu — procure \"conselho tutelar de [seu município]\" na prefeitura local, ou disque 100 para ser orientado.",
  },

  // ALMG
  {
    id: "rede-almg-cdh",
    tipo: "ajuda",
    nome: "Comissão de Direitos Humanos da ALMG",
    oQueAtende:
      "Analisa propostas de lei e debate direitos humanos em MG — direitos individuais, coletivos, políticos e de grupos discriminados. Não é atendimento individual de caso: é comissão legislativa que também recebe denúncia pública.",
    necessidades: ["direitos_humanos"],
    abrangencia: "estadual",
    natureza: "oficial",
    site: "https://www.almg.gov.br/comissoes/comissao-de-direitos-humanos/8",
    endereco: "Rua Rodrigues Caldas, 30, Santo Agostinho, Belo Horizonte/MG",
    telefone: "(31) 2108-7000",
    gratuito: true,
    verificadoEm: V,
    nota: "Reuniões às quartas-feiras, 15h30. Contato pelo formulário \"Fale com a Comissão\".",
  },

  // Rede popular
  {
    id: "rede-renap",
    tipo: "ajuda",
    nome: "RENAP — Rede Nacional de Advogadas e Advogados Populares",
    oQueAtende:
      "Articulação nacional, descentralizada, que presta assessoria jurídica a movimentos sociais e promove debate político-jurídico. Fundada em 1996 a partir de demanda de movimentos do campo.",
    necessidades: ["direitos_humanos", "meio_ambiente_terras"],
    abrangencia: "federal",
    natureza: "popular",
    site: "https://www.renap.org.br/",
    gratuito: true,
    verificadoEm: V,
    nota: "Assessoria a movimentos sociais, não atendimento individual avulso. Contato estável não encontrado — só Instagram (@renap.oficial); a página não confirma núcleo específico em MG.",
  },

  // Acadêmico
  {
    id: "rede-daj-ufmg",
    tipo: "ajuda",
    nome: "DAJ-UFMG — Divisão de Assistência Judiciária",
    oQueAtende:
      "Assistência jurídica gratuita a pessoas de baixa renda em Belo Horizonte — a mais antiga assessoria jurídica popular ligada à universidade em MG.",
    necessidades: ["defesa_gratuita"],
    abrangencia: "municipal",
    natureza: "academico",
    site: "https://daj.direito.ufmg.br/",
    endereco: "Av. João Pinheiro, 100, 7º andar, Centro, Belo Horizonte/MG",
    telefone: "(31) 3409-8667",
    gratuito: true,
    verificadoEm: V,
    nota: "Plantão presencial \"Porta Aberta\": segundas, 12h–14h, Rua Guajajaras, 300, Centro, BH. WhatsApp (31) 99923-4677.",
  },
  {
    id: "rede-ajup-ufmg",
    tipo: "ajuda",
    nome: "AJUP-UFMG — Assessoria Jurídica Universitária Popular",
    oQueAtende:
      "Assessoria jurídica a movimentos sociais (foco atual: desencarceramento), ligada à Faculdade de Direito da UFMG. Não é atendimento individual de balcão — é assessoria a coletivos.",
    necessidades: ["defesa_gratuita", "direitos_humanos"],
    abrangencia: "municipal",
    natureza: "academico",
    // Estava em NAO_VERIFICADO até 2026-08-14: a página institucional
    // existe e está ativa (edital de seleção 2026 aberto), só não tinha
    // sido encontrada antes. Sem e-mail/telefone dedicado — o canal real
    // de contato é o Instagram, confirmado na própria página oficial.
    site: "https://www.ufmg.br/proex/ajup/",
    endereco: "Av. Antônio Carlos, 6627, Pampulha, Belo Horizonte/MG (Faculdade de Direito da UFMG)",
    gratuito: true,
    verificadoEm: "2026-08-14",
    nota: "Contato real é o Instagram @ajupufmg, citado na própria página oficial como \"Siga o projeto nas redes sociais\" — sem telefone/e-mail dedicado (o (31) 3409-5000 é da PROEX em geral, não linha direta do AJUP, por isso fica de fora do campo telefone). Um e-mail antigo (ajupufmg@gmail.com) circula num blog de 2016, não confirmado como ativo.",
  },
  {
    id: "rede-saj-pucminas",
    tipo: "ajuda",
    nome: "SAJ — Serviço de Assistência Judiciária, PUC Minas",
    oQueAtende:
      "Assistência jurídica gratuita à comunidade carente, com unidades também fora da Região Metropolitana de BH: Poços de Caldas, Arcos e Serro, além de Betim e Contagem.",
    necessidades: ["defesa_gratuita"],
    abrangencia: "estadual",
    natureza: "academico",
    site: "https://www.pucminas.br/ServicosComunidade/Paginas/Assistencia-judiciaria-coreu.aspx",
    endereco: "Rua Sergipe, 790, Savassi, Belo Horizonte/MG (unidade Lourdes)",
    gratuito: true,
    verificadoEm: V,
    nota: "Ainda não chega ao Jequitinhonha (Araçuaí, Itinga, Diamantina). Unidade Coração Eucarístico agenda por (31) 3319-9935/9936.",
  },

  // Federal
  {
    id: "rede-cndh",
    tipo: "ajuda",
    nome: "CNDH — Disque 100",
    oQueAtende:
      "Recebe denúncia de violação de direitos humanos e encaminha ao órgão competente — não julga nem condena, isso é do Judiciário.",
    necessidades: ["direitos_humanos", "protecao_crianca", "violencia_mulher", "discriminacao"],
    abrangencia: "federal",
    natureza: "oficial",
    site: "https://www.gov.br/mdh/pt-br/ondh",
    telefone: "100 (gratuito, 24h, todos os dias)",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-oab-nacional-cdh",
    tipo: "ajuda",
    nome: "Comissão Nacional de Direitos Humanos — OAB",
    oQueAtende: "Comissão de direitos humanos do Conselho Federal da OAB.",
    necessidades: ["direitos_humanos"],
    abrangencia: "federal",
    natureza: "popular",
    site: "https://www.oab.org.br/institucionalconselhofederal/comissoes",
    telefone: "(61) 99944-5541",
    gratuito: true,
    verificadoEm: V,
    nota: "E-mail/telefone específicos da comissão não encontrados — só o canal institucional geral.",
  },
  {
    id: "rede-oab-jf-cdh",
    tipo: "ajuda",
    nome: "OAB Juiz de Fora — Comissão de Direitos Humanos e Cidadania",
    oQueAtende: "Comissão de direitos humanos da subseção de Juiz de Fora.",
    necessidades: ["direitos_humanos"],
    abrangencia: "estadual",
    natureza: "popular",
    // Subpágina antiga (`/comissoes/humanos-cidadania`) 404 confirmado na
    // auditoria de 2026-08-13 — o site não tem mais URL individual por
    // comissão, só a listagem em `/comissoes` (a Comissão de Direitos
    // Humanos e Cidadania continua nela, conferido ao vivo).
    site: "https://www.juizdefora-oabmg.org.br/comissoes",
    endereco: "Av. dos Andradas, 696, Morro da Glória, Juiz de Fora/MG",
    gratuito: true,
    verificadoEm: V,
  },
  {
    id: "rede-oab-contagem-cdh",
    tipo: "ajuda",
    nome: "OAB Contagem — Comissão de Direitos Humanos",
    oQueAtende: "Comissão de direitos humanos da subseção de Contagem.",
    necessidades: ["direitos_humanos"],
    abrangencia: "estadual",
    natureza: "popular",
    // `/direitos-humanos/` 404 confirmado na auditoria de 2026-08-13, e a
    // listagem atual de comissões (`oabcontagem.org.br/comissoes/`) não tem
    // mais nenhuma comissão de Direitos Humanos — só correlatas (igualdade
    // racial, pessoa com deficiência, pessoa idosa, criança e adolescente).
    // Sem destino confiável: `site: null` (mesma doutrina do Conselho
    // Tutelar acima), telefone/endereço institucionais permanecem.
    site: null,
    endereco: "Rua Edmir Leão, 454, Centro, Contagem/MG",
    telefone: "(31) 3398-4711",
    gratuito: true,
    verificadoEm: V,
  },

  // ═══ Justiça federal — vale para qualquer estado (item 6) ═══
  // MPF e DPU, as duas portas federais que faltavam no acervo. Fonte:
  // verificação ao vivo em 2026-10-02 dos sites oficiais (`mpf.mp.br` e
  // `dpu.def.br`). A DPU estava catalogada em dado antigo como
  // `dpu.jus.br` — host que NÃO resolve hoje; o correto, confirmado ao vivo,
  // é `dpu.def.br`.
  {
    id: "rede-mpf",
    tipo: "ajuda",
    nome: "Ministério Público Federal (MPF)",
    oQueAtende:
      "Fiscaliza a lei federal e investiga crime contra a União, o patrimônio público, o meio ambiente e povos indígenas — atua em todo o país. Não é advogado da pessoa: defende interesses coletivos e federais, mas qualquer cidadão pode denunciar.",
    necessidades: ["denunciar", "consumidor", "direitos_humanos", "meio_ambiente_terras"],
    abrangencia: "federal",
    natureza: "oficial",
    site: "https://www.mpf.mp.br",
    gratuito: true,
    verificadoEm: "2026-10-02",
    nota: "A denúncia de irregularidade entra pela Ouvidoria do MPF (https://www.mpf.mp.br/o-mpf/orgaos-superiores/ouvidoria). As Câmaras de Coordenação e Revisão organizam a atuação por tema — não recebem denúncia direta.",
  },
  {
    id: "rede-dpu",
    tipo: "ajuda",
    nome: "Defensoria Pública da União (DPU)",
    oQueAtende:
      "Assistência jurídica gratuita em causas federais — benefícios do INSS, saúde, moradia, migração, refúgio e processos contra a União. Presente nas 27 capitais e em núcleos de interiorização.",
    necessidades: ["defesa_gratuita", "assistencia_social", "direitos_humanos"],
    abrangencia: "federal",
    natureza: "oficial",
    site: "https://www.dpu.def.br",
    telefone: "(61) 3318-4330",
    endereco: "SBN Quadra 1, Bloco F, Edifício Palácio da Agricultura, Asa Norte, Brasília/DF, CEP 70040-908",
    gratuito: true,
    verificadoEm: "2026-10-02",
    nota: "Ouvidoria: https://www.dpu.def.br/institucional/ouvidoria-dpu. Telefones de plantão: https://www.dpu.def.br/telefones-de-plantao. Encontre a unidade da sua cidade em https://www.dpu.def.br/contatos-dpu.",
  },
];

// ═══════════ Defensorias e MPs ESTADUAIS — 26 UFs (item 6) ═══════════
//
// O dono pediu as principais instituições de justiça de todo o país. Até
// 02/10/2026 o painel só conhecia a Defensoria e o MP de MG. Aqui entram as
// Defensorias Públicas e os Ministérios Públicos das outras 26 unidades
// federativas (os 25 estados restantes + o Distrito Federal). MG fica de
// fora de propósito: já tem itens próprios e mais ricos em `REDE_ITENS`
// (`rede-defensoria-mg`, `rede-mpmg` e os CAOs) — duplicar criaria dois
// cartões para o mesmo órgão.
//
// Fonte: cada URL é o site oficial da instituição, aberto ao vivo em
// 2026-10-02. O host que respondeu 200 foi usado (alguns estados só servem
// sem `www`, outros só com). NÃO foram coletados telefone nem endereço —
// inventar contato é o dano que o portal mais evita (AGENTS §5.2/§7); a
// pendência fica registrada em `NAO_VERIFICADO`.
//
// O `uf` de cada item permite ao seletor (`SeletorRedeGeral`) mostrar a
// instituição do estado certo e só ela.

interface EstadoJustica {
  uf: string;
  nome: string;
  /** Site oficial da Defensoria Pública estadual/distrital. */
  dpSite: string;
  /** Site oficial do Ministério Público estadual/distrital. */
  mpSite: string;
}

const ESTADOS_JUSTICA: EstadoJustica[] = [
  { uf: "AC", nome: "Acre", dpSite: "https://defensoria.ac.def.br", mpSite: "https://www.mpac.mp.br" },
  { uf: "AL", nome: "Alagoas", dpSite: "https://defensoria.al.def.br", mpSite: "https://www.mpal.mp.br" },
  { uf: "AP", nome: "Amapá", dpSite: "https://defensoria.ap.def.br", mpSite: "https://www.mpap.mp.br" },
  { uf: "AM", nome: "Amazonas", dpSite: "https://defensoria.am.def.br", mpSite: "https://www.mpam.mp.br" },
  { uf: "BA", nome: "Bahia", dpSite: "https://www.defensoria.ba.def.br", mpSite: "https://www.mpba.mp.br" },
  { uf: "CE", nome: "Ceará", dpSite: "https://www.defensoria.ce.def.br", mpSite: "https://www.mpce.mp.br" },
  { uf: "DF", nome: "Distrito Federal", dpSite: "https://www.defensoria.df.gov.br", mpSite: "https://www.mpdft.mp.br" },
  { uf: "ES", nome: "Espírito Santo", dpSite: "https://www.defensoria.es.def.br", mpSite: "https://www.mpes.mp.br" },
  { uf: "GO", nome: "Goiás", dpSite: "https://www.defensoria.go.def.br", mpSite: "https://www.mpgo.mp.br" },
  { uf: "MA", nome: "Maranhão", dpSite: "https://defensoria.ma.def.br", mpSite: "https://www.mpma.mp.br" },
  { uf: "MT", nome: "Mato Grosso", dpSite: "https://www.defensoria.mt.def.br", mpSite: "https://www.mpmt.mp.br" },
  { uf: "MS", nome: "Mato Grosso do Sul", dpSite: "https://www.defensoria.ms.def.br", mpSite: "https://www.mpms.mp.br" },
  { uf: "PA", nome: "Pará", dpSite: "https://www.defensoria.pa.def.br", mpSite: "https://www.mppa.mp.br" },
  { uf: "PB", nome: "Paraíba", dpSite: "https://defensoria.pb.def.br", mpSite: "https://www.mppb.mp.br" },
  { uf: "PR", nome: "Paraná", dpSite: "https://www.defensoriapublica.pr.def.br", mpSite: "https://www.mppr.mp.br" },
  { uf: "PE", nome: "Pernambuco", dpSite: "https://www.defensoria.pe.def.br", mpSite: "https://www.mppe.mp.br" },
  { uf: "PI", nome: "Piauí", dpSite: "https://www.defensoria.pi.def.br", mpSite: "https://www.mppi.mp.br" },
  { uf: "RJ", nome: "Rio de Janeiro", dpSite: "https://www.defensoria.rj.def.br", mpSite: "https://www.mprj.mp.br" },
  { uf: "RN", nome: "Rio Grande do Norte", dpSite: "https://www.defensoria.rn.def.br", mpSite: "https://www.mprn.mp.br" },
  { uf: "RS", nome: "Rio Grande do Sul", dpSite: "https://www.defensoria.rs.def.br", mpSite: "https://www.mprs.mp.br" },
  { uf: "RO", nome: "Rondônia", dpSite: "https://www.defensoria.ro.def.br", mpSite: "https://www.mpro.mp.br" },
  { uf: "RR", nome: "Roraima", dpSite: "https://defensoria.rr.def.br", mpSite: "https://www.mprr.mp.br" },
  { uf: "SC", nome: "Santa Catarina", dpSite: "https://defensoria.sc.def.br", mpSite: "https://www.mpsc.mp.br" },
  { uf: "SP", nome: "São Paulo", dpSite: "https://www.defensoria.sp.def.br", mpSite: "https://www.mpsp.mp.br" },
  { uf: "SE", nome: "Sergipe", dpSite: "https://www.defensoria.se.def.br", mpSite: "https://www.mpse.mp.br" },
  { uf: "TO", nome: "Tocantins", dpSite: "https://www.defensoria.to.def.br", mpSite: "https://www.mpto.mp.br" },
];

/**
 * Lista completa das 27 UFs para o seletor de estado (sigla + nome), ordenada
 * por nome do estado. MG entra aqui separado: não tem item em
 * `JUSTICA_ESTADUAL` (já é coberto pelo acervo próprio de `REDE_ITENS`), mas
 * precisa aparecer na lista para o usuário mineiro poder voltar ao seu estado.
 */
export const UFS_JUSTICA: { sigla: string; nome: string }[] = [
  ...ESTADOS_JUSTICA.map((e) => ({ sigla: e.uf, nome: e.nome })),
  { sigla: "MG", nome: "Minas Gerais" },
].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

/**
 * Itens de justiça estadual gerados para as 26 UFs. Cada UF rende dois
 * cartões: a Defensoria (defesa gratuita) e o Ministério Público (denúncia
 * e fiscalização). Gerado por `flatMap` em vez de 52 literais para o dado
 * não divergir do par UF/site — uma linha por estado, uma só para editar.
 */
export const JUSTICA_ESTADUAL: ItemPainel[] = ESTADOS_JUSTICA.flatMap((e) => {
  const uf = e.uf;
  const distrital = uf === "DF";
  return [
    {
      id: `defensoria-${uf.toLowerCase()}`,
      tipo: "ajuda",
      nome: distrital
        ? `Defensoria Pública do Distrito Federal`
        : `Defensoria Pública do Estado de ${e.nome}`,
      oQueAtende: `Representa de graça na Justiça quem não tem dinheiro para advogado em ${
        distrital ? "todo o Distrito Federal" : `todo o ${e.nome}`
      } — moradia, saúde, família, criminal, violência doméstica e outros direitos. Procure a unidade mais próxima no site oficial.`,
      necessidades: ["defesa_gratuita", "violencia_mulher", "protecao_crianca"],
      abrangencia: "estadual",
      uf,
      natureza: "oficial",
      site: e.dpSite,
      gratuito: true,
      verificadoEm: "2026-10-02",
      nota: "Telefone e endereço da unidade não foram confirmados nesta rodada — confirme no próprio site antes de se deslocar.",
    },
    {
      id: `mp-${uf.toLowerCase()}`,
      tipo: "ajuda",
      nome: distrital
        ? "Ministério Público do Distrito Federal e Territórios (MPDFT)"
        : `Ministério Público do Estado de ${e.nome}`,
      oQueAtende: `Fiscaliza a lei e pode investigar irregularidade ${
        distrital ? "no Distrito Federal" : `em ${e.nome}`
      } — patrimônio público, meio ambiente, consumidor, criança e adolescente, direitos humanos. Qualquer pessoa pode denunciar.`,
      necessidades: ["denunciar", "consumidor", "direitos_humanos"],
      abrangencia: "estadual",
      uf,
      natureza: "oficial",
      site: e.mpSite,
      gratuito: true,
      verificadoEm: "2026-10-02",
      nota: "A denúncia concreta vai para a Promotoria da comarca. A Ouvidoria do órgão recebe e encaminha — o endereço dela está no site oficial.",
    },
  ];
});

/**
 * Itens estaduais de justiça de uma UF. Retorna vazio quando não há UF (o
 * seletor ainda não perguntou) ou quando é MG (coberta pelo acervo próprio).
 */
export function justicaDaUf(uf: string | null | undefined): ItemPainel[] {
  if (!uf) return [];
  const alvo = uf.toUpperCase();
  return JUSTICA_ESTADUAL.filter((i) => i.uf === alvo);
}

/** Referências sem confirmação de link oficial — nunca misturadas ao restante. */
export interface NaoVerificado {
  titulo: string;
  nota: string;
}

// Reconferido AO VIVO em 2026-08-14 (revisão de completude, item 6 do TODO):
// dos 13 itens que estavam aqui, 2 foram RESOLVIDOS e saíram da lista —
// Defensoria Pública de MG (achava-se o subdomínio errado; item agora em
// `LAI_ESTADUAL`) e Ouvidoria de Betim (URL morta dois dias seguidos;
// trocada por alternativa viva no mesmo domínio via migration `0073`, o
// link real que `PedidoLAI`/`Footer` usam). Os 10 que sobraram: SEM
// MUDANÇA na maioria, 2 ganharam detalhe novo sem virar confirmação plena
// (ver nota de cada um).
//
// Reconferido de novo AO VIVO em 2026-08-17 (item 6, rodada 2): os 8 que
// permanecem SEM MUDANÇA seguem como estavam; 2 registraram MUDANÇA real —
// Portal de Transparência de SP (o captcha anti-bot da Prodam caiu, o
// conteúdo agora carrega por automação; o canal de LAI do estado é o
// fala.sp.gov.br) e OAB-MG (o bloqueio 403 sumiu; a listagem de comissões
// carrega). Nenhum dos 2 ganhou confirmação plena — o primeiro porque o
// conteúdo específico consultado ainda não foi conferido, o segundo porque
// a comissão de Direitos Humanos não aparece na primeira página da
// listagem (paginação via JS) e a página individual carrega o conteúdo por
// JavaScript.
export const NAO_VERIFICADO: NaoVerificado[] = [
  { titulo: "Câmara de Betim — e-SIC/LAI", nota: "SEM MUDANÇA em 2026-08-14 E 2026-08-17: `www.camarabetim.mg.gov.br/LAI/LeiAcesso` devolve HTTP 200 mas o corpo é só a tela de erro do SPA (\"Algo deu errado. A aplicação não irá responder até ser recarregada\", 124 bytes) — o servidor responde 200 para o HTML de erro; o domínio sem `www` nem conecta (ECONNRESET). Três dias seguidos quebrado." },
  { titulo: "Câmara de Diamantina — qualquer canal", nota: "SEM MUDANÇA em 2026-08-14 E 2026-08-17: domínio oficial não resolve (na rodada de 17/08 nem erro de conexão — `www.camaradiamantina.mg.gov.br` nem resolve DNS); domínio alternativo continua com certificado TLS de terceiro (`*.locaweb.com.br`), não do próprio host. Telefone (38) 3531-1228 segue só em agregador (`camaramunicipal.com.br`), nunca confirmado pela própria Câmara." },
  { titulo: "Câmara de Araçuaí — LAI", nota: "SEM MUDANÇA em 2026-08-14 E 2026-08-17: o site institucional completo (SAPL, sapl.aracuai.mg.leg.br) carregou com todo o menu — Institucional, Documentos Administrativos, Atividade Legislativa, Normas Jurídicas — e nenhuma seção de e-SIC/LAI. O e-mail administracao.cm@aracuai.mg.leg.br é o \"Fale Conosco\" oficial do rodapé do SAPL (junto de telefone (33) 3731-1995 e endereço Rua São Geraldo, 722), mas segue sem confirmação como canal formal de LAI. Detalhe novo em 2026-08-17: o link \"Site\" do rodapé aponta para `www.aracuai.mg.leg.br`, que não resolve (a presença oficial hoje é só o SAPL)." },
  { titulo: "ALMG — e-SIC/LAI dedicado", nota: "PARCIAL em 2026-08-14: continua sem formulário dedicado (almg.gov.br/acesso-a-informacao e /sic dão 404), mas o canal genérico \"Fale com a Assembleia\" (almg.gov.br/apps/fale-com) lista expressamente como assunto \"Lei de Acesso à Informação (LAI) e Lei Geral de Proteção de Dados (LGPD)\" — é o canal certo, só não é dedicado." },
  { titulo: "SPU (federal) — Serviço de Informação ao Cidadão", nota: "SEM MUDANÇA (na prática) em 2026-08-14: a página de contato da SPU dentro do Ministério da Gestão (gov.br/pt-br/servicos/mgi-fale-conosco-spu) agora exige login gov.br em vez de falhar por erro de conexão — mas continua sem SIC público dedicado. Use o Fala.BR e escolha o órgão na lista." },
  { titulo: "Portal de Transparência de São Paulo", nota: "MUDANÇA em 2026-08-17: o captcha anti-bot da Prodam-SP caiu — `transparencia.sp.gov.br` agora carrega o conteúdo por automação (menu Sobre o Portal/Legislação/Canais de Comunicação/Acesso à Informação, consultas de Pessoal, Receitas, Despesas etc.). O canal de LAI do estado apontado pelo próprio portal é `fala.sp.gov.br` (200). Ainda não é confirmação plena: o conteúdo específico consultado pela aplicação (ex.: diárias) não foi conferido nesta rodada." },
  { titulo: "Núcleo de MG da RENAP", nota: "PARCIAL em 2026-08-14: o site nacional (renap.org.br) segue sem citar Minas Gerais. Busca encontrou um Instagram @renap_mg (664 seguidores) que PODE ser o núcleo — achado só por busca, não confirmado no site oficial nem acessado diretamente. Não usar até confirmar." },
  { titulo: "Comissão de Direitos Humanos da OAB-MG (seccional)", nota: "MUDANÇA em 2026-08-17: o bloqueio 403 sumiu — `www.oabmg.org.br/institucional/comissoes` carrega a listagem (comissões de Assuntos Penitenciários, Direito Marítimo, Educação Digital, Enfrentamento ao Trabalho Escravo, Defesa da Cidadania e dos Interesses Coletivos etc.). A Comissão de Direitos Humanos NÃO aparece na primeira página da listagem e a página individual (`comissao?id=300`) carrega o conteúdo via JavaScript — o GET direto devolve só o esqueleto. Paginação da listagem via AJAX (`listagemComissoes?_page=N`) não reproduzível por automação simples (retorna vazio). Sede confirmada segue: Rua Tenente Brito Melo, 210, Barro Preto, BH, (31) 2102-5800." },
  { titulo: "Comissões de Direitos Humanos das câmaras municipais", nota: "Betim tem uma comissão real e nomeada — \"Comissão de Direitos Humanos, Promoção da Igualdade Racial e das Minorias\" (Kenin do G10 na presidência, mandato 2025/2026), citada por reportagem de abril/2026 — mas sem telefone/e-mail direto encontrado, só o mandato via Câmara. Diamantina: sem evidência de comissão própria, só conselhos do Executivo (CMDCA, COMDIM). Não verificadas as demais câmaras do portal." },
  { titulo: "Delegacias especializadas fora de Belo Horizonte", nota: "Betim como amostra: a DEAM tem endereço/telefone confirmados numa fonte federal (gov.br/mdh/.../deam_mg_betim — Rua Pedro Neves, 44, Centro, Betim/MG, CEP 32500-000, tel. (31) 3539-2579 / 3539-3531), mas um agregador não-oficial diverge nos dois dados (outro endereço, outro telefone, outro e-mail). Como as duas fontes discordam e nenhuma foi cross-confirmada com o buscador oficial da PCMG, o item continua não promovido a item confirmado — mas fica registrado aqui como pista forte. As demais dezenas de municípios seguem sem checagem individual: use a busca oficial da PCMG (policiacivil.mg.gov.br/delegacia/exibir) e confirme por telefone antes de ir." },
  { titulo: "Telefone e endereço das Defensorias e MPs estaduais (26 UFs)", nota: "PENDÊNCIA CONSCIENTE (2026-10-02, item 6): os itens `defensoria-<uf>` e `mp-<uf>` de `JUSTICA_ESTADUAL` têm só o site oficial — o link foi aberto ao vivo em 2026-10-02 e respondeu, mas telefone e endereço de cada unidade NÃO foram coletados. O portal prefere não mostrar contato a mostrar contato errado (AGENTS §5.2/§7). Quem quiser completar: abrir a página de unidades do site de cada órgão e registrar telefone/endereço com a data da conferência." },
];

/**
 * Canal municipal de LAI (Prefeitura/Câmara), montado a partir de
 * `cidade.fontes` — a mesma fonte que `PedidoLAI.tsx` usa. Cidade sem a
 * chave correspondente não ganha o item: link para o órgão errado é pior
 * que ausência de link (mesma doutrina do resto do arquivo).
 */
function itensLaiMunicipal(cidade: Cidade): ItemPainel[] {
  const f = cidade.fontes ?? {};
  const itens: ItemPainel[] = [];
  const sicPrefeitura = f["sic_prefeitura"];
  if (typeof sicPrefeitura === "string" && sicPrefeitura) {
    itens.push({
      id: "lai-municipal-prefeitura",
      tipo: "informacao",
      nome: `Prefeitura de ${cidade.nome} — e-SIC/LAI`,
      oQueAtende: `Pedido de informação à administração municipal de ${cidade.nome}-${cidade.uf}.`,
      necessidades: ["pedir_informacao"],
      abrangencia: "municipal",
      natureza: "oficial",
      site: sicPrefeitura,
      gratuito: true,
      verificadoEm: V,
    });
  }
  const sicCamara = f["sic_camara"];
  if (typeof sicCamara === "string" && sicCamara) {
    itens.push({
      id: "lai-municipal-camara",
      tipo: "informacao",
      nome: `Câmara Municipal de ${cidade.nome} — e-SIC/LAI`,
      oQueAtende: `Pedido de informação sobre a atividade legislativa de ${cidade.nome}-${cidade.uf}. É um órgão distinto da Prefeitura — pedido endereçado à Prefeitura não chega aqui.`,
      necessidades: ["pedir_informacao"],
      abrangencia: "municipal",
      natureza: "oficial",
      site: sicCamara,
      gratuito: true,
      verificadoEm: V,
    });
  }
  return itens;
}

/** Defensoria/rede específica de cidade — hoje só Araçuaí/Itinga (mesma unidade) e Diamantina. */
const CIDADES_POR_ITEM: Record<string, string[]> = {
  "rede-defensoria-aracuai": ["aracuai", "itinga"],
  "rede-defensoria-diamantina": ["diamantina"],
};

/**
 * Monta a lista completa de itens do painel para uma cidade: LAI municipal
 * (dinâmico) + LAI estadual/federal + rede de proteção, todos filtrados
 * pelo que faz sentido mostrar para aquela cidade.
 */
export function montarItensPainel(cidade: Cidade): ItemPainel[] {
  // A cidade é mineira? O teste é a UF, NÃO `temFonte(cidade, "links_uteis_mg")`:
  // `temFonte` devolve `true` para cidade sem config nenhuma (ver
  // `queries/municipios.ts`), então uma cidade de SP sem fontes ganhava os
  // órgãos de MG — o erro de "estado errado" (item 6).
  const deMG = cidade.uf === "MG";
  const itens: ItemPainel[] = [...itensLaiMunicipal(cidade), ...LAI_FEDERAL];
  if (deMG) itens.push(...LAI_ESTADUAL);

  for (const item of REDE_ITENS) {
    const restricao = CIDADES_POR_ITEM[item.id];
    if (restricao) {
      if (restricao.includes(cidade.slug)) itens.push(item);
      continue;
    }
    // Itens estaduais/federais de MG (Defensoria geral, MPMG, delegacias de
    // BH, ALMG, SAJ) só fazem sentido para cidade mineira — mostrar em São
    // Paulo apontaria para o órgão errado do estado errado.
    if (item.abrangencia === "federal" || deMG) itens.push(item);
  }

  // Defensoria e MP do estado da cidade (item 6). Para MG não devolve nada:
  // o estado já tem os itens próprios acima. Para a cidade não mineira das 6,
  // é aqui que ela passa a ganhar a instituição do estado certo.
  itens.push(...justicaDaUf(cidade.uf));

  return itens;
}

/**
 * Itens que não dependem de NENHUMA cidade: LAI federal, LAI estadual (MG —
 * a UF de 5 das 6 cidades cadastradas) e a fatia estadual/federal da rede de
 * proteção. Existe para `/direitos-em-movimento`, a porta "onde buscar
 * ajuda" (`docs/PLANO-DIREITOS-EM-MOVIMENTO.md`): a necessidade vem antes
 * da cidade, e Disque 100 não espera a pessoa dizer onde está.
 *
 * Item `abrangencia: "municipal"` fica de fora de propósito — inclusive os
 * que hoje não têm restrição de `CIDADES_POR_ITEM` (CRAS, CREAS, Conselho
 * Tutelar): são genéricos por desenho ("procure o da sua cidade"), mas
 * "genérico" não é "sem cidade" — mostrar antes da pergunta prometeria uma
 * unidade que a pessoa ainda não localizou. Depois que ela escolhe a
 * cidade, é `montarItensPainel(cidade)` — a mesma função de sempre — quem
 * decide a lista inteira, municipal incluído.
 *
 * ═══ O PARÂMETRO `uf` (item 6) ═══
 *
 * Sem argumento, o comportamento é o de sempre (federal + MG + rede
 * estadual/federal). Com uma UF, o seletor informa o estado da pessoa e a
 * função troca o bloco estadual de MG pelo da UF: some a LAI estadual
 * mineira e os órgãos estaduais de MG, entram a Defensoria e o MP daquela
 * UF. Isso evita mandar quem mora em São Paulo para o MPMG.
 */
export function itensSemCidade(uf?: string): ItemPainel[] {
  const alvo = uf?.toUpperCase();
  const incluiMg = alvo === undefined || alvo === "MG";
  const itens: ItemPainel[] = [...LAI_FEDERAL];
  if (incluiMg) itens.push(...LAI_ESTADUAL);
  for (const item of REDE_ITENS) {
    if (item.abrangencia === "municipal") continue;
    if (item.abrangencia === "estadual" && !incluiMg) continue;
    itens.push(item);
  }
  itens.push(...justicaDaUf(alvo));
  return itens;
}

export { nomePortal };
