import { FRENTES } from "@/lib/assistente/seu-nono-dados";
import { semAcento, separarPalavras } from "@/lib/busca/normalizar";

export interface LinkResposta {
  href: string;
  texto: string;
}

export interface RespostaCurada {
  resposta: string;
  linkPrincipal?: LinkResposta;
  linksAdicionais?: LinkResposta[];
}

/**
 * Respostas fixas com alta precisão para as perguntas de exemplo exibidas
 * na barra de busca de cada zona e termos de alta frequência.
 */
interface PerguntaEspecial {
  padroes: string[];
  zona?: string;
  resposta: string;
  linkPrincipal: LinkResposta;
  linksAdicionais?: LinkResposta[];
}

const PERGUNTAS_ESPECIAIS: PerguntaEspecial[] = [
  // ─── CONGRESSO ──────────────────────────────────────────────
  {
    padroes: ["restringem direitos", "restricao de direitos", "projetos que restringem", "alertas de direitos", "alerta de vicio"],
    zona: "congresso",
    resposta:
      "O portal classifica as proposições federais (Câmara e Senado) sob a ótica de direitos fundamentais. A página de Alertas lista projetos de lei com risco de restrição e permite gerar ofícios em PDF para manifestação cidadã.",
    linkPrincipal: { href: "/congresso/alertas", texto: "Ver alertas de direitos" },
    linksAdicionais: [
      { href: "/congresso/proposicoes", texto: "Ver todas as proposições" },
      { href: "/congresso/bons-exemplos", texto: "Ver bons exemplos" },
    ],
  },
  {
    padroes: ["ccjc", "pauta da ccjc", "comissoes", "comissao de constituicao"],
    zona: "congresso",
    resposta:
      "A CCJC (Comissão de Constituição e Justiça e de Cidadania) e as demais comissões permanentes e temporárias da Câmara e do Senado têm suas composições e atuações reunidas no portal.",
    linkPrincipal: { href: "/congresso/comissoes", texto: "Ver comissões do Congresso" },
    linksAdicionais: [{ href: "/congresso/agenda", texto: "Ver agenda legislativa" }],
  },
  {
    padroes: ["audiencias publicas", "audiencia publica", "agenda do congresso", "pauta de votacao"],
    zona: "congresso",
    resposta:
      "A Agenda reúne sessões do plenário e reuniões de comissões com audiências públicas agendadas na Câmara e no Senado, com links para transmissão oficial.",
    linkPrincipal: { href: "/congresso/agenda", texto: "Ver agenda do Congresso" },
    linksAdicionais: [{ href: "/congresso/votacoes", texto: "Ver votações" }],
  },
  {
    padroes: ["parlamentares", "deputados", "senadores", "bancada", "meus parlamentares"],
    zona: "congresso",
    resposta:
      "A seção de Parlamentares acompanha deputados federais e senadores, incluindo histórico de votações, presença em plenário e gastos de cota parlamentar (CEAP).",
    linkPrincipal: { href: "/congresso/parlamentares", texto: "Ver parlamentares federais" },
    linksAdicionais: [{ href: "/congresso/bancadas", texto: "Ver bancadas estaduais" }],
  },

  // ─── JUDICIÁRIO ─────────────────────────────────────────────
  {
    padroes: ["aposentam ate 2030", "aposentadoria stf", "vagas abrem no stf", "quando vaga stf", "aposentadoria compulsoria"],
    zona: "judiciario",
    resposta:
      "A vacância de ministros do STF e dos Tribunais Superiores é calculada de forma determinística pela aposentadoria compulsória aos 75 anos (LC 152/2015). O portal projeta as datas exatas de vacância de cada cadeira.",
    linkPrincipal: { href: "/judiciario/vagas", texto: "Ver projeção de vagas" },
    linksAdicionais: [
      { href: "/judiciario/tribunais", texto: "Ver composição dos tribunais" },
      { href: "/judiciario/indicacoes", texto: "Ver histórico de indicações" },
    ],
  },
  {
    padroes: ["stj cada presidente", "indicacoes presidente", "quem indicou", "nomeou stj", "indicacoes stf"],
    zona: "judiciario",
    resposta:
      "O portal mapeia qual autoridade/Presidente indicou cada ministro em exercício no STF, STJ, TST, TSE, STM e TRFs, acompanhando o histórico de sabatinas no Senado.",
    linkPrincipal: { href: "/judiciario/indicacoes", texto: "Ver indicações ao Judiciário" },
    linksAdicionais: [{ href: "/judiciario/tribunais", texto: "Ver tribunais" }],
  },
  {
    padroes: ["quinto constitucional", "vagas oab", "vagas mp", "cota de origem"],
    zona: "judiciario",
    resposta:
      "O quinto constitucional reserva 20% das vagas nos tribunais a membros da OAB e do Ministério Público. O portal identifica a cota de origem de cada cadeira nos tribunais.",
    linkPrincipal: { href: "/judiciario/tribunais", texto: "Ver composição e cotas de origem" },
  },
  {
    padroes: ["quem fiscaliza", "fiscalizacao judiciario", "quem fiscaliza a justica", "inspecoes externas"],
    zona: "judiciario",
    resposta:
      "A fiscalização externa do Judiciário brasileiro termina no 2º grau (Varas, TJMG e TRT-3) pela Corregedoria Nacional (CNJ) e TST. Tribunais Superiores (STJ, TST, STF) contam apenas com correições internas.",
    linkPrincipal: { href: "/judiciario/instituicoes", texto: "Ver quem fiscaliza a Justiça" },
    linksAdicionais: [
      { href: "/judiciario/inspecoes", texto: "Ver relatórios de inspeção do CNJ" },
      { href: "/judiciario/defensoria", texto: "Ver cobertura da Defensoria" },
    ],
  },
  {
    padroes: ["sirenejud", "processos ambientais", "litigios ambientais", "cnj ambiental"],
    resposta:
      "O acervo do SIRENEJud reúne dados processuais de litígios socioambientais de todos os tribunais do país fornecidos pelo CNJ, com filtros por UF, tribunal e município.",
    linkPrincipal: { href: "/judiciario/sirenejud", texto: "Ver SIRENEJud Brasil" },
    linksAdicionais: [{ href: "/ambiental/judiciario", texto: "Ver processos ambientais em MG" }],
  },

  // ─── AMBIENTAL / ONSA ───────────────────────────────────────
  {
    padroes: ["acordo de mariana", "rio doce", "repactuacao mariana", "mariana"],
    zona: "ambiental",
    resposta:
      "A página do Acordo do Rio Doce detalha a execução orçamentária dos R$ 677,4 milhões da repactuação em Minas Gerais, com divisão por anexos, gráfico de empenho e exportação CSV.",
    linkPrincipal: { href: "/ambiental/mariana", texto: "Ver Acordo de Mariana" },
    linksAdicionais: [{ href: "/paraopeba/vale", texto: "Ver Observatório Vale" }],
  },
  {
    padroes: ["barragens", "barragem", "descaracterizacao", "sigbm", "mancha de inundacao"],
    zona: "ambiental",
    resposta:
      "O portal monitora 909 barragens do cadastro nacional (SIGBM/ANM) e de Minas Gerais (FEAM), exibindo manchas de inundação, nível de emergência e status de descaracterização.",
    linkPrincipal: { href: "/ambiental/barragens", texto: "Ver barragens no país e em MG" },
    linksAdicionais: [
      { href: "/ambiental/barragens/descaracterizacao", texto: "Ver descaracterização" },
      { href: "/funcaosocialterra/mapa", texto: "Ver no Globo 3D" },
    ],
  },
  {
    padroes: ["copam", "reunioes copam", "pauta ambiental mg"],
    zona: "ambiental",
    resposta:
      "O COPAM (Conselho Estadual de Política Ambiental de MG) tem suas atas e pautas catalogadas reunião a reunião, permitindo filtrar decisões e votos por município e empreendimento.",
    linkPrincipal: { href: "/ambiental/copam", texto: "Ver pauta do COPAM" },
    linksAdicionais: [{ href: "/ambiental/licenciamento", texto: "Ver licenciamento ambiental" }],
  },
  {
    padroes: ["legislacao ambiental", "normas ambientais", "mma", "cndh", "urn lexml"],
    zona: "ambiental",
    resposta:
      "Acervo com 8.940 normas federais (MMA/CNDH) e 6.378 normas estaduais de Minas Gerais, categorizadas por tema e identificadas por URN canônica do LexML.",
    linkPrincipal: { href: "/ambiental/legislacao", texto: "Ver legislação ambiental" },
    linksAdicionais: [{ href: "/ambiental/direito-critico", texto: "Ver Direito Crítico" }],
  },

  // ─── PARAOPEBA ──────────────────────────────────────────────
  {
    padroes: ["brumadinho", "acordo paraopeba", "reparacao brumadinho", "execucao do acordo"],
    zona: "paraopeba",
    resposta:
      "Acompanhamento da execução de R$ 5,48 bilhões do Acordo de Reparação de Brumadinho nos 26 municípios da bacia, com auditoria da FGV/AJRI, biblioteca das ATIs e auxílio emergencial.",
    linkPrincipal: { href: "/paraopeba/execucao", texto: "Ver execução do Acordo Paraopeba" },
    linksAdicionais: [
      { href: "/paraopeba/auditoria", texto: "Ver fichas de auditoria AJRI" },
      { href: "/paraopeba/linha-do-tempo", texto: "Ver linha do tempo" },
    ],
  },
  {
    padroes: ["vale", "acoes vale", "vale3", "cvm vale", "monitoramento vale"],
    resposta:
      "O Observatório Vale reúne a série histórica de cotações B3 (VALE3), documentos oficiais enviados à CVM (ITRs/DFPs) e notícias de monitoramento corporativo e socioambiental.",
    linkPrincipal: { href: "/paraopeba/vale", texto: "Ver Observatório Vale" },
  },

  // ─── CIDADES (Genéricos com suporte a prefixo de município) ──
  {
    padroes: ["gasta em saude", "gasto com saude", "orcamento de saude", "saude da cidade"],
    resposta:
      "Os gastos públicos municipais em saúde estão detalhados na execução orçamentária por função e subfunção em Despesas, além dos indicadores no painel de Saúde do município.",
    linkPrincipal: { href: "/prefeitura/despesas", texto: "Ver despesas municipais" },
    linksAdicionais: [{ href: "/saude", texto: "Ver painel de saúde" }],
  },
  {
    padroes: ["maiores contratos", "contratos da prefeitura", "contratos publicos", "licitacoes"],
    resposta:
      "A tela de Contratos lista todos os contratos da Prefeitura, com valores globais, fornecedores, vigência e alertas de concentração e dispensa com indícios de atenção.",
    linkPrincipal: { href: "/prefeitura/contratos", texto: "Ver contratos do município" },
    linksAdicionais: [
      { href: "/prefeitura/fornecedores", texto: "Ver fornecedores" },
      { href: "/prefeitura/licitacoes", texto: "Ver licitações" },
    ],
  },
  {
    padroes: ["proposicoes da camara", "o que a camara propos", "projetos dos vereadores", "camara propos"],
    resposta:
      "Acompanhe projetos de lei, requerimentos, indicações e comissões da Câmara Municipal, organizados por tema e vereador.",
    linkPrincipal: { href: "/camara/proposicoes", texto: "Ver proposições da Câmara" },
    linksAdicionais: [{ href: "/camara", texto: "Ver vereadores" }],
  },
  {
    padroes: ["diario oficial", "diario da prefeitura", "atos oficiais", "decretos"],
    resposta:
      "O Diário Oficial municipal reúne extratos de contratos, editais de licitação, decretos e portarias, categorizados com filtros por tipo, ano e exportação de planilha.",
    linkPrincipal: { href: "/prefeitura/diario", texto: "Ver Diário Oficial" },
  },
  {
    padroes: ["denunciar", "como denunciar", "canais de denuncia", "fazer denuncia"],
    resposta:
      "A seção de Denúncia reúne orientações e canais diretos (Ouvidorias, Ministério Público, Tribunais de Contas e Defensoria), com gerador de documento no navegador.",
    linkPrincipal: { href: "/direitos-em-movimento/denuncia", texto: "Como denunciar irregularidades" },
    linksAdicionais: [{ href: "/direitos-em-movimento/ajuda", texto: "Onde buscar ajuda" }],
  },
];

/**
 * Ajusta links relativos para a cidade ativa, caso aplicável.
 */
function ajustarLinkParaCidade(link: LinkResposta, slugCidade?: string): LinkResposta {
  if (!slugCidade) return link;
  if (
    link.href.startsWith("/prefeitura") ||
    link.href.startsWith("/camara") ||
    link.href.startsWith("/saude") ||
    link.href.startsWith("/educacao") ||
    link.href.startsWith("/terras") ||
    link.href.startsWith("/servicos")
  ) {
    return {
      href: `/${slugCidade}${link.href}`,
      texto: link.texto,
    };
  }
  return link;
}

/**
 * Busca uma resposta curada para qualquer pergunta feita na BuscaUniversal.
 */
export function buscarRespostaCurada(
  pergunta: string,
  slugCidadeOuZona?: string
): RespostaCurada | null {
  const normalizada = semAcento(pergunta.trim().toLowerCase());
  if (normalizada.length < 3) return null;

  // 1. Tenta casar primeiro com perguntas especiais de alta precisão
  for (const esp of PERGUNTAS_ESPECIAIS) {
    for (const padrao of esp.padroes) {
      const pNorm = semAcento(padrao.toLowerCase());
      if (normalizada.includes(pNorm) || pNorm.includes(normalizada)) {
        const linkPrincipal = ajustarLinkParaCidade(esp.linkPrincipal, slugCidadeOuZona);
        const linksAdicionais = esp.linksAdicionais?.map((l) =>
          ajustarLinkParaCidade(l, slugCidadeOuZona)
        );
        return {
          resposta: esp.resposta,
          linkPrincipal,
          linksAdicionais,
        };
      }
    }
  }

  // 2. Tenta casar com a base do Seu Nonô (todas as frentes e categorias)
  const palavrasPergunta = new Set(separarPalavras(normalizada));
  let melhorCorrespondencia: {
    pergunta: string;
    resposta: string;
    link?: { href: string; texto: string };
    pontuacao: number;
  } | null = null;

  for (const f of FRENTES) {
    for (const cat of f.categorias) {
      for (const p of cat.perguntas) {
        const pNorm = semAcento(p.pergunta.toLowerCase());
        const palavrasP = separarPalavras(pNorm);
        let intersecao = 0;
        for (const w of palavrasP) {
          if (palavrasPergunta.has(w)) intersecao++;
        }
        const pontuacao = intersecao / Math.max(palavrasP.length, 1);
        if (
          pontuacao >= 0.45 &&
          (!melhorCorrespondencia || pontuacao > melhorCorrespondencia.pontuacao)
        ) {
          melhorCorrespondencia = {
            pergunta: p.pergunta,
            resposta: p.resposta,
            link: p.link,
            pontuacao,
          };
        }
      }
    }
  }

  if (melhorCorrespondencia) {
    const linkPrincipal = melhorCorrespondencia.link
      ? ajustarLinkParaCidade(melhorCorrespondencia.link, slugCidadeOuZona)
      : undefined;
    return {
      resposta: melhorCorrespondencia.resposta,
      linkPrincipal,
    };
  }

  return null;
}
