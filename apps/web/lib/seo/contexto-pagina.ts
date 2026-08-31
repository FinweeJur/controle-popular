export interface SugestaoContextual {
  pergunta: string;
  resposta: string;
  link: string;
  linkTexto: string;
}

export interface ContextoPagina {
  padrao: string;
  sugestoes: SugestaoContextual[];
}

/**
 * Mapeamento de rotas do portal para sugestões contextuais do Seu Nonô.
 * Cada rota pode ter um padrão (regex parcial) e sugestões específicas.
 */
export const CONTEXTOS: ContextoPagina[] = [
  // ─── BETIM ───
  {
    padrao: "^/betim/prefeitura/contratos",
    sugestoes: [
      {
        pergunta: "Quais contratos estão em alerta?",
        resposta:
          "Contratos com indícios de atenção ganham badges na lista: concentração no ano, dispensa próxima do limite legal ou fornecedor criado no mesmo ano. Sempre são sinais, não conclusões.",
        link: "/betim/prefeitura/contratos",
        linkTexto: "Ver contratos com alerta",
      },
      {
        pergunta: "Quem são os maiores fornecedores?",
        resposta:
          "A página de fornecedores mostra quais empresas mais contrataram a prefeitura, com valor total, número de contratos e indícios de concentração.",
        link: "/betim/prefeitura/fornecedores",
        linkTexto: "Ver fornecedores",
      },
      {
        pergunta: "Como filtrar contratos por valor?",
        resposta:
          "Use os filtros no topo da tabela para ordenar por valor, fornecedor ou objeto. Clique no cabeçalho da coluna para ordenar.",
        link: "/betim/prefeitura/contratos",
        linkTexto: "Ver contratos",
      },
    ],
  },
  {
    padrao: "^/betim/prefeitura/despesas",
    sugestoes: [
      {
        pergunta: "O que são despesas por subfunção?",
        resposta:
          "Subfunções são divisões da função orçamentária. Ex: 'Educação' tem subfunções como 'Ensino Médio', 'Ensino Superior'. Mostra para onde o dinheiro vai detalhadamente.",
        link: "/betim/prefeitura/despesas",
        linkTexto: "Ver despesas",
      },
      {
        pergunta: "Como ver despesas de um órgão específico?",
        resposta:
          "Use o filtro de órgão na parte superior da página para selecionar o órgão desejado (ex: Secretaria de Educação, Secretaria de Saúde).",
        link: "/betim/prefeitura/despesas",
        linkTexto: "Ver despesas",
      },
    ],
  },
  {
    padrao: "^/betim/prefeitura/fornecedores",
    sugestoes: [
      {
        pergunta: "O que é concentração de fornecedores?",
        resposta:
          "Quando uma única empresa concentra muitos contratos ou valores altos com a prefeitura. Pode ser legítimo (empresa grande) ou sinal de atenção. Verifique os alertas.",
        link: "/betim/prefeitura/fornecedores",
        linkTexto: "Ver fornecedores",
      },
    ],
  },
  {
    padrao: "^/betim/prefeitura/servidores",
    sugestoes: [
      {
        pergunta: "Por que não vejo nomes de servidores?",
        resposta:
          "O portal respeita a LGPD e não publica dados pessoais de servidores sem base legal. São mostrados vínculos, órgãos e cargos, mas não nomes completos.",
        link: "/betim/prefeitura/servidores",
        linkTexto: "Ver servidores",
      },
    ],
  },
  {
    padrao: "^/betim/prefeitura/obras",
    sugestoes: [
      {
        pergunta: "Onde ver o andamento das obras?",
        resposta:
          "A página de obras lista contratos e dados sobre obras públicas do município, quando disponíveis nos dados abertos da prefeitura.",
        link: "/betim/prefeitura/obras",
        linkTexto: "Ver obras",
      },
    ],
  },
  {
    padrao: "^/betim/vereadores",
    sugestoes: [
      {
        pergunta: "Como ver a votação dos vereadores?",
        resposta:
          "A seção Votações da Câmara mostra matérias em votação ou já votadas, quando a Casa publica os dados de forma aberta.",
        link: "/betim/camara/votacoes",
        linkTexto: "Ver votações",
      },
    ],
  },
  {
    padrao: "^/betim/coleta-lixo",
    sugestoes: [
      {
        pergunta: "Quando o lixo é coletado na minha região?",
        resposta:
          "A página de coleta de lixo mostra os dias e horários por região do município, quando divulgados pela prefeitura.",
        link: "/betim/coleta-lixo",
        linkTexto: "Ver coleta de lixo",
      },
    ],
  },

  // ─── CONGRESSO ───
  {
    padrao: "^/congresso/proposicoes",
    sugestoes: [
      {
        pergunta: "Como buscar uma proposição específica?",
        resposta:
          "Use os filtros por tipo (PL, PLP, PEC), autor, tema ou número. A busca aceita termos em português.",
        link: "/congresso/proposicoes",
        linkTexto: "Ver proposições",
      },
      {
        pergunta: "O que significam os status de tramitação?",
        resposta:
          "Cada proposição tem um status: 'Em tramitação' (no Congresso), 'Arquivada' (sem movimentação), 'Transformada em Lei' (aprovada). Veja o glossário na página.",
        link: "/congresso/proposicoes",
        linkTexto: "Ver proposições",
      },
    ],
  },
  {
    padrao: "^/congresso/votacoes",
    sugestoes: [
      {
        pergunta: "Como ver o voto de um deputado?",
        resposta:
          "Na página de votações, clique em uma votação nominal para ver a lista completa de votos dos deputados, com posição (Sim, Não, Abstenção).",
        link: "/congresso/votacoes",
        linkTexto: "Ver votações",
      },
    ],
  },
  {
    padrao: "^/congresso/parlamentares",
    sugestoes: [
      {
        pergunta: "Como filtrar parlamentares por partido?",
        resposta:
          "Use o filtro de partido na parte superior. Você também pode filtrar por estado ou busca por nome.",
        link: "/congresso/parlamentares",
        linkTexto: "Ver parlamentares",
      },
    ],
  },
  {
    padrao: "^/congresso/bancadas",
    sugestoes: [
      {
        pergunta: "O que são bancadas estaduais?",
        resposta:
          "São agrupamentos de parlamentares do mesmo estado. A página mostra composição e indicadores de atuação por bancada.",
        link: "/congresso/bancadas",
        linkTexto: "Ver bancadas",
      },
    ],
  },
  {
    padrao: "^/congresso/alertas",
    sugestoes: [
      {
        pergunta: "O que é alerta de vício auditável?",
        resposta:
          "São indícios de irregularidade em emendas, convênios ou indicações, rotulados como 'ponto de atenção', nunca como conclusão.",
        link: "/congresso/alertas",
        linkTexto: "Ver alertas",
      },
    ],
  },

  // ─── JUDICIÁRIO ───
  {
    padrao: "^/judiciario/sirenejud",
    sugestoes: [
      {
        pergunta: "O que é o SIRENEJud?",
        resposta:
          "É o painel do CNJ que recorta da base nacional do Judiciário os processos de tema ambiental, com município do órgão julgador.",
        link: "/judiciario/sirenejud",
        linkTexto: "Ver SIRENEJud",
      },
      {
        pergunta: "Quantos processos ambientais existem no Brasil?",
        resposta:
          "O SIRENEJud registra mais de 1,4 milhão de processos ambientais em todo o país, abrangendo todos os estados.",
        link: "/judiciario/sirenejud",
        linkTexto: "Ver números",
      },
      {
        pergunta: "Quais as classes processuais mais comuns?",
        resposta:
          "As classes mais comuns incluem Mandado de Segurança, Ação Civil Pública e Habeas Corpus. Veja o top 10 na página.",
        link: "/judiciario/sirenejud",
        linkTexto: "Ver classes",
      },
    ],
  },
  {
    padrao: "^/judiciario/tribunais",
    sugestoes: [
      {
        pergunta: "Quais tribunais estão no portal?",
        resposta:
          "A página de tribunais reúne informações institucionais e dados publicados pelos Tribunais Superiores e estaduais.",
        link: "/judiciario/tribunais",
        linkTexto: "Ver tribunais",
      },
    ],
  },
  {
    padrao: "^/judiciario/indicacoes",
    sugestoes: [
      {
        pergunta: "Como acompanhar indicações para tribunais?",
        resposta:
          "A tela de indicações mostra nomes indicados para cargos de dirigentes e magistrados, com status de tramitação.",
        link: "/judiciario/indicacoes",
        linkTexto: "Ver indicações",
      },
    ],
  },

  // ─── AMBIENTAL ───
  {
    padrao: "^/ambiental/licenciamento",
    sugestoes: [
      {
        pergunta: "Por que só tem licenças deferidas?",
        resposta:
          "A fonte pública (IDE-Sisema/SEMAD) registra apenas o histórico de licenças deferidas. As indeferidas ou em análise estão em outro sistema não coletado.",
        link: "/ambiental/licenciamento",
        linkTexto: "Ver licenciamentos",
      },
      {
        pergunta: "Onde ver o EIA/RIMA?",
        resposta:
          "Cada licença tem um link para a página original no portal da SEMAD, onde é possível acessar o Estudo de Impacto Ambiental quando disponível.",
        link: "/ambiental/licenciamento",
        linkTexto: "Ver licenciamentos",
      },
      {
        pergunta: "Qual o setor com mais licenças?",
        resposta:
          "Os setores de mineração e agropecuária concentram a maior parte das licenças em Minas Gerais.",
        link: "/ambiental/licenciamento",
        linkTexto: "Ver licenciamentos",
      },
    ],
  },
  {
    padrao: "^/ambiental/barragens",
    sugestoes: [
      {
        pergunta: "O que é descaracterização de barragem?",
        resposta:
          "É o processo de eliminar a condição de barragem de alto risco. A página mostra quais barragens estão nesse processo.",
        link: "/ambiental/barragens",
        linkTexto: "Ver barragens",
      },
      {
        pergunta: "Como ver barragens perto da minha cidade?",
        resposta:
          "Use a busca por município na página de barragens para ver quais estruturas estão no território ou próximo.",
        link: "/ambiental/barragens",
        linkTexto: "Ver barragens",
      },
    ],
  },
  {
    padrao: "^/ambiental/copam",
    sugestoes: [
      {
        pergunta: "O que é o COPAM?",
        resposta:
          "COPAM é o Conselho de Política Ambiental de Minas Gerais. A página reúne atas e reuniões do conselho.",
        link: "/ambiental/copam",
        linkTexto: "Ver COPAM",
      },
    ],
  },

  // ─── PARAOPEBA ───
  {
    padrao: "^/paraopeba/execucao",
    sugestoes: [
      {
        pergunta: "Como está a execução do acordo?",
        resposta:
          "A tela Execução mostra indicadores e dados sobre o andamento das medidas previstas no acordo de reparação.",
        link: "/paraopeba/execucao",
        linkTexto: "Ver execução",
      },
      {
        pergunta: "Quanto foi repassado até agora?",
        resposta:
          "Os repasses são atualizados conforme os dados públicos do acordo. Veja os valores na tela de execução.",
        link: "/paraopeba/execucao",
        linkTexto: "Ver repasses",
      },
    ],
  },
  {
    padrao: "^/paraopeba/analise",
    sugestoes: [
      {
        pergunta: "Quais análises já foram publicadas?",
        resposta:
          "A seção Análise reúne levantamentos do portal sobre execução, repasses e prioridades do acordo.",
        link: "/paraopeba/analise",
        linkTexto: "Ver análises",
      },
    ],
  },
  {
    padrao: "^/paraopeba/biblioteca",
    sugestoes: [
      {
        pergunta: "O que são as ATIs?",
        resposta:
          "ATIs são Assessorias Técnicas Independentes, documentos técnicos que auxiliam na fiscalização do acordo.",
        link: "/paraopeba/biblioteca",
        linkTexto: "Ver biblioteca ATI",
      },
    ],
  },
  {
    padrao: "^/paraopeba/auditoria",
    sugestoes: [
      {
        pergunta: "O que é a auditoria AECOM?",
        resposta:
          "É a auditoria independente realizada pela AECOM com 467 documentos e 16 eixos de análise sobre a execução do acordo.",
        link: "/paraopeba/auditoria",
        linkTexto: "Ver auditoria",
      },
    ],
  },

  // ─── DIREITOS ───
  {
    padrao: "^/direitos-em-movimento/denuncia",
    sugestoes: [
      {
        pergunta: "Onde denunciar irregularidades?",
        resposta:
          "A página de denúncia reúne canais como ouvidorias, Ministério Público, Controladorias, Tribunal de Contas e polícia.",
        link: "/direitos-em-movimento/denuncia",
        linkTexto: "Canais de denúncia",
      },
    ],
  },
  {
    padrao: "^/direitos-em-movimento/informacao",
    sugestoes: [
      {
        pergunta: "Como pedir informação à administração pública?",
        resposta:
          "Todo cidadão tem direito a informações públicas (LAI). A página explica como fazer um pedido, qual o prazo e o que fazer se receber resposta incompleta.",
        link: "/direitos-em-movimento/informacao",
        linkTexto: "Guia de acesso à informação",
      },
    ],
  },
  {
    padrao: "^/direitos-em-movimento/ajuda",
    sugestoes: [
      {
        pergunta: "Onde buscar ajuda para defender direitos?",
        resposta:
          "A seção Ajuda lista organizações, defensorias, procuradorias e movimentos sociais que podem apoiar cidadãos e comunidades.",
        link: "/direitos-em-movimento/ajuda",
        linkTexto: "Quem pode ajudar",
      },
    ],
  },
];

/**
 * Retorna sugestões contextuais para uma rota específica.
 */
export function obterSugestoesContextuais(rota: string): SugestaoContextual[] {
  for (const ctx of CONTEXTOS) {
    if (new RegExp(ctx.padrao).test(rota)) {
      return ctx.sugestoes;
    }
  }
  return [];
}
