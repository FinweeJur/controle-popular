import { temFonte, nomePortal, type Cidade } from "@/lib/db/queries/municipios";

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
 * Mesma decisão de `links-uteis-mg/page.tsx`: é uma lista curta e curada
 * (< 40 itens), atualizada por commit quando um link mudar — não dado
 * operacional que cresce por ETL. Uma tabela pra isso seria infraestrutura
 * sem uso: nada aqui precisa de paginação, filtro no servidor ou ingestão.
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
    site: "https://www.juizdefora-oabmg.org.br/comissoes/humanos-cidadania",
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
    site: "https://oabcontagem.org.br/direitos-humanos/",
    endereco: "Rua Edmir Leão, 454, Centro, Contagem/MG",
    telefone: "(31) 3398-4711",
    gratuito: true,
    verificadoEm: V,
  },
];

/** Referências sem confirmação de link oficial — nunca misturadas ao restante. */
export interface NaoVerificado {
  titulo: string;
  nota: string;
}

export const NAO_VERIFICADO: NaoVerificado[] = [
  { titulo: "Câmara de Betim — e-SIC/LAI", nota: "Erro de app JS ao abrir a rota /LAI/LeiAcesso hoje (404 dentro da SPA). Já foi verificada ao vivo em 2026-08-04 — pode ser instabilidade pontual. Religue antes de confiar." },
  { titulo: "Câmara de Diamantina — qualquer canal", nota: "Domínio oficial devolve HTTP 403 a acesso automatizado; domínio alternativo tem certificado TLS que não bate com o host." },
  { titulo: "Câmara de Araçuaí — LAI", nota: "Nenhuma página de e-SIC/LAI encontrada no site institucional (SAPL). Único contato achado foi e-mail não confirmado como canal formal." },
  { titulo: "ALMG — e-SIC/LAI dedicado", nota: "Não existe formulário específico visível — pedidos de LAI parecem ir pelo canal genérico \"Fale com a Assembleia\" (CAC). Ligue (31) 2108-7000 antes de confiar só no formulário." },
  { titulo: "Defensoria Pública de MG — e-SIC/LAI", nota: "A URL de \"acesso à informação\" indicada por busca devolveu 404; a página de transparência geral não mostra formulário operacional visível." },
  { titulo: "SPU (federal) — Serviço de Informação ao Cidadão", nota: "A SPU migrou para dentro do Ministério da Gestão; três tentativas de abrir a página falharam por erro de conexão. Use o Fala.BR e escolha o órgão na lista." },
  { titulo: "Portal de Transparência de São Paulo", nota: "Domínio responde e é da Prefeitura, mas está atrás de verificação anti-bot (captcha da Prodam-SP) — conteúdo não confirmado." },
  { titulo: "NAJUP / AJUP-UFMG", nota: "Existência confirmada por fonte acadêmica (movimento estudantil, Centro Acadêmico Afonso Pena), mas sem telefone/e-mail/site oficial estável encontrado para o público procurar atendimento." },
  { titulo: "Núcleo de MG da RENAP", nota: "O site nacional não confirma nem nega um núcleo específico em Minas Gerais." },
  { titulo: "Comissão de Direitos Humanos da OAB-MG (seccional)", nota: "A página de comissões da seccional bloqueou acesso automatizado (HTTP 403) — nome, composição e contato não confirmados. A sede em si está confirmada: Rua Tenente Brito Melo, 210, Barro Preto, BH, (31) 2102-5800." },
  { titulo: "Comissões de Direitos Humanos das câmaras municipais", nota: "Não verificadas município a município — podem não existir formalmente em cidades pequenas." },
  { titulo: "Delegacias especializadas fora de Belo Horizonte", nota: "Existem em dezenas de municípios (por notícia de inauguração), mas sem endereço/telefone atual confirmado de cada uma. Use a busca oficial da PCMG e confirme por telefone antes de ir." },
  { titulo: "Ouvidoria da Prefeitura de Betim", nota: "WebFetch recebeu conteúdo vazio na verificação de hoje; a URL foi confirmada ao vivo em 2026-08-04 (commit 1583fa4) e não é invenção, só não foi reconfirmada agora." },
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
  const deMG = temFonte(cidade, "links_uteis_mg");
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
 */
export function itensSemCidade(): ItemPainel[] {
  return [
    ...LAI_FEDERAL,
    ...LAI_ESTADUAL,
    ...REDE_ITENS.filter((i) => i.abrangencia !== "municipal"),
  ];
}

export { nomePortal };
