/**
 * Golden set do Seu Nonô — a "prova com gabarito" do RAG (fase R4 do
 * PLANO-RAG-COMPLETO).
 *
 * Papel no portal: travar, em dado versionado, o que o assistente DEVE
 * recuperar do acervo e quando DEVE abster. Cada caso aponta a pergunta, o
 * resultado esperado (uma fonte certa no topo ou abstenção) e uma nota do
 * porquê. O teste `golden-set.test.ts` roda a recuperação real sobre o
 * acervo e falha se um caso escapar — foi assim que o defeito de abstenção
 * do modo lexical apareceu (30/09/2026).
 *
 * Fonte oficial das regras: `docs/planos/PLANO-RAG-COMPLETO.md` e AGENTS.md
 * §7 ("não sei, e aqui está o que existe perto"; número errado é dano).
 *
 * Decisões técnicas:
 * - Os casos de FONTE apontam o `id` estável do pedaço (ex.:
 *   `memoria:municipio:3131307:massacre-de-ipinga`) ou a `rota` do portal;
 *   aceitar os dois evita acoplar o teste ao id interno.
 * - Os casos de ABSTENÇÃO são perguntas fora do escopo do portal; elas só
 *   valem no modo lexical deste teste (em produção, com embeddings, a
 *   semântica decide — a revisão manual é parte da R4).
 * - Não usar data pessoal: as perguntas são genéricas.
 */

export interface CasoGolden {
  /** Pergunta do cidadão, como ele digitaria. */
  pergunta: string;
  /** O que a recuperação tem que devolver. */
  esperado:
    | {
        tipo: "fonte";
        /** ids estáveis de `AcervoFonte` que satisfazem o caso. */
        ids?: string[];
        /** rotas do portal que satisfazem o caso. */
        rotas?: string[];
      }
    | { tipo: "abster" };
  /** Uma linha explicando o critério do caso. */
  nota: string;
}

export const GOLDEN_SET: CasoGolden[] = [
  // ── Dentro do escopo: a recuperação tem que achar a fonte certa ──
  {
    pergunta: "De onde vêm os R$ 251 bilhões monitorados no painel do portal?",
    esperado: { tipo: "fonte", ids: ["macro:soma-251-bi"] },
    nota: "número-símbolo da home; pedaço macro dedicado.",
  },
  {
    pergunta: "O que prevê a repactuação de Mariana de R$ 171 bilhões?",
    esperado: {
      tipo: "fonte",
      ids: ["macro:acordo-mariana-171-bi", "pergunta:terra:repactuacao-mariana"],
      rotas: ["/ambiental/mariana"],
    },
    nota: "acordo do Rio Doce; duas fontes aceitáveis.",
  },
  {
    pergunta: "Qual é o orçamento do TJMG, MPMG e DPMG e por que há disparidade?",
    esperado: { tipo: "fonte", ids: ["macro:orcamento-justica-disparidade"] },
    nota: "dado macro do Judiciário; siglas T J M G no boost.",
  },
  {
    pergunta: "Como pesquisar contratos e licitações de prefeituras no portal?",
    esperado: { tipo: "fonte", ids: ["macro:pesquisa-contratos-prefeituras"] },
    nota: "pergunta de orientação; aponta a página de contratos.",
  },
  {
    pergunta: "Quais são as barragens a montante e estruturas em nível 3 de emergência?",
    esperado: { tipo: "fonte", ids: ["macro:barragens-montante-nivel-3"] },
    nota: "risco de ruptura; pedaço macro com número medido.",
  },
  {
    pergunta: "Quanto de chão mudou em Minas Gerais com mineração?",
    esperado: { tipo: "fonte", ids: ["cavas:cobertura"] },
    nota: "série de cavas; número vem do JSON coletado.",
  },
  {
    pergunta: "O que foi o Massacre de Ipatinga?",
    esperado: { tipo: "fonte", ids: ["memoria:municipio:3131307:massacre-de-ipatinga"] },
    nota: "memória municipal F3; caso de luto, registro reverente.",
  },
  {
    pergunta: "O que aconteceu no Quilombo Baú em Araçuaí?",
    esperado: { tipo: "fonte", ids: ["memoria:municipio:3103405:quilombo-bau"] },
    nota: "memória municipal F3 no Vale do Jequitinhonha.",
  },
  {
    pergunta: "O que é o Memorial Brumadinho?",
    esperado: { tipo: "fonte", ids: ["memoria:municipio:3109006:memorial-brumadinho"] },
    nota: "memória municipal F3 ligada à reparação.",
  },
  {
    pergunta: "O que foi o Massacre de Felisburgo?",
    esperado: { tipo: "fonte", ids: ["memoria:municipio:3125705:massacre-de-felisburgo"] },
    nota: "conflito no campo; caso de luto.",
  },
  {
    pergunta: "O que aconteceu no rompimento da barragem de Fundão em Mariana?",
    esperado: {
      tipo: "fonte",
      ids: ["macro:acordo-mariana-171-bi"],
      rotas: ["/ambiental/mariana"],
    },
    nota: "tema de reparação; a rota do painel serve.",
  },
  {
    pergunta: "Quais bases de dados o portal publica?",
    esperado: { tipo: "fonte", ids: ["bases:total"] },
    nota: "inventário medido (R2); aponta o catálogo /api/v1/bases.",
  },
  {
    pergunta: "O portal tem base de licenças ambientais estaduais?",
    esperado: { tipo: "fonte", ids: ["bases:tema:ambiental-licencas"] },
    nota: "tema do inventário; 15 arquivos, ~90 MB.",
  },
  {
    pergunta: "O que são as outorgas de água da ANA e do IGAM?",
    esperado: {
      tipo: "fonte",
      ids: ["bases:tema:ambiental-outorgas", "pergunta:terra:nossos-rios-qualidade"],
      rotas: ["/ambiental/nossos-rios"],
    },
    nota: "tema do inventário + pergunta curada dos rios.",
  },
  {
    pergunta: "Como funciona o licenciamento ambiental em Minas Gerais (SEMAD)?",
    esperado: { tipo: "fonte", ids: ["macro:licenciamento-semad-onsa"] },
    nota: "censo SEMAD; sigla no boost.",
  },
  {
    pergunta: "Quem foram as vítimas de Brumadinho?",
    esperado: { tipo: "fonte", ids: ["memoria:municipio:3109006:memorial-brumadinho"] },
    nota: "luto com registro reverente; fonte é o Memorial.",
  },
  {
    pergunta: "Quais contratos a Prefeitura de Betim assinou?",
    esperado: { tipo: "fonte", rotas: ["/betim/prefeitura/contratos"] },
    nota: "pergunta de cidade; a rota de contratos serve.",
  },
  {
    pergunta: "O que o Congresso decidiu sobre direitos indígenas?",
    esperado: {
      tipo: "fonte",
      ids: ["blog:congresso-nacional-direitos-votacoes"],
      rotas: ["/congresso"],
    },
    nota: "post do blog + rota da frente Congresso.",
  },

  // ── Fora do escopo: tem que abster, nunca responder com fonte errada ──
  {
    pergunta: "Qual a receita de bolo de cenoura?",
    esperado: { tipo: "abster" },
    nota: "'receita' existe no acervo como receita orçamentária — armadilha.",
  },
  {
    pergunta: "Quem ganhou o campeonato brasileiro de futebol de 1995?",
    esperado: { tipo: "abster" },
    nota: "o ano 1995 casa o Massacre de Corumbiara — armadilha de número.",
  },
  {
    pergunta: "Qual a previsão do tempo para amanhã em São Paulo?",
    esperado: { tipo: "abster" },
    nota: "'tempo' e 'Paulo' aparecem em contextos históricos.",
  },
  {
    pergunta: "Me conte uma piada engraçada.",
    esperado: { tipo: "abster" },
    nota: "fora do escopo cívico; nada no acervo.",
  },
];
