/**
 * Glossário cívico — o "o que é isto" dos termos que o portal usa.
 *
 * ═══ O QUE É ═══
 *
 * Definições curtas, em português comum, de siglas, órgãos, empresas e termos
 * técnicos que aparecem nas páginas (licitação, TAC, cota-parte do ICMS, ANM,
 * SIGMINE, barragem a montante...). Cada termo traz a fonte oficial quando
 * existe.
 *
 * ═══ POR QUE EXISTE (Camada 2 do plano) ═══
 *
 * O portal publica dado oficial; sem o vocabulário, o dado não vira ação. A
 * doutrina da casa é do globo 3D: **explicação sempre visível, nunca só em
 * hover** — porque no celular não existe hover. Este módulo é a fonte única
 * das definições: a página `/glossario` mostra e o componente inline
 * (`app/components/TermoGlossario.tsx`) reusa, sem duplicar definição.
 *
 * ═══ ORDEM ═══
 *
 * A lista está agrupada por tema (para leitura e manutenção). A EXIBIÇÃO sai
 * em ordem alfabética, porque `buscarTermos` ordena o resultado — assim
 * acrescentar termo não exige achar a posição alfabética à mão.
 *
 * ═══ EMPRESAS ═══
 *
 * Sobre empresa, a definição é factual e a ligação vai para a página do portal
 * (`/empresas`). A régua editorial vale: nada de insinuação — o termo diz o
 * fato, e o leitor tira a conclusão na página, com a fonte.
 */

import { semAcento } from "@/lib/busca/normalizar";

export interface FonteGlossario {
  nome: string;
  /** URL oficial (http) ou rota interna do portal (começa com "/"). */
  url: string;
}

export interface TermoGlossario {
  id: string;
  termo: string;
  definicao: string;
  fonte?: FonteGlossario;
}

// Fonte de lei, repetida com frequência — evita URL solta no meio do texto.
const LEI_LAI: FonteGlossario = { nome: "Lei nº 12.527/2011 (LAI)", url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm" };
const LEI_LICITACAO: FonteGlossario = { nome: "Lei nº 14.133/2021", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm" };
const LEI_FINANCAS: FonteGlossario = { nome: "Lei nº 4.320/1964", url: "https://www.planalto.gov.br/ccivil_03/leis/l4320.htm" };
const LEI_FORESTAL: FonteGlossario = { nome: "Lei nº 12.651/2012", url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm" };
const LEI_BARRAGENS: FonteGlossario = { nome: "Lei nº 12.334/2010", url: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12334.htm" };
const PAGINA_BARRAGENS: FonteGlossario = { nome: "Painel de barragens", url: "/ambiental/barragens" };
const PAGINA_EMPRESAS: FonteGlossario = { nome: "Empresas e ESG", url: "/empresas" };

/** Termos do glossário, agrupados por tema. */
export const TERMOS: TermoGlossario[] = [
  // ═══ TRANSPARÊNCIA E PARTICIPAÇÃO ═══
  {
    id: "lai",
    termo: "LAI (Lei de Acesso à Informação)",
    definicao: "Lei nº 12.527/2011. Garante a qualquer pessoa pedir documentos públicos, de graça e sem justificar. O órgão responde em 20 dias.",
    fonte: LEI_LAI,
  },
  {
    id: "esic",
    termo: "e-SIC",
    definicao: "Serviço Eletrônico de Informação ao Cidadão: o sistema de cada órgão onde se faz o pedido de acesso à informação.",
    fonte: LEI_LAI,
  },
  {
    id: "falabr",
    termo: "Fala.BR",
    definicao: "Plataforma federal de ouvidorias e pedidos de informação, que atende órgãos do governo federal num só lugar.",
    fonte: { nome: "Fala.BR", url: "https://falabr.cgu.gov.br" },
  },
  {
    id: "ouvidoria",
    termo: "Ouvidoria",
    definicao: "Canal do órgão para receber reclamação, denúncia, sugestão e pedido de informação. Deve responder ao cidadão.",
  },
  {
    id: "cgu",
    termo: "CGU (Controladoria-Geral da União)",
    definicao: "Órgão federal de controle interno, ouvidoria e combate à corrupção. É a instância de recurso do pedido federal de informação.",
    fonte: { nome: "CGU", url: "https://www.gov.br/cgu/pt-br" },
  },
  {
    id: "tce",
    termo: "TCE (Tribunal de Contas)",
    definicao: "Julga as contas dos gestores públicos e fiscaliza o uso do dinheiro. Em Minas, é o TCEMG.",
  },
  {
    id: "cnj",
    termo: "CNJ (Conselho Nacional de Justiça)",
    definicao: "Órgão que controla e fiscaliza os tribunais do país, com corregedoria e inspeções.",
    fonte: { nome: "CNJ", url: "https://www.cnj.jus.br" },
  },
  {
    id: "cnmp",
    termo: "CNMP (Conselho Nacional do Ministério Público)",
    definicao: "Órgão que fiscaliza a atuação dos Ministérios Públicos de todo o país.",
    fonte: { nome: "CNMP", url: "https://www.cnmp.mp.br" },
  },

  // ═══ JUSTIÇA E PROCESSO ═══
  {
    id: "tjmg",
    termo: "TJMG (Tribunal de Justiça de Minas Gerais)",
    definicao: "Maior tribunal estadual do Brasil em número de processos. Atende os 853 municípios mineiros.",
    fonte: { nome: "TJMG", url: "https://www.tjmg.jus.br" },
  },
  {
    id: "mpmg",
    termo: "MPMG (Ministério Público de Minas Gerais)",
    definicao: "Fiscaliza o cumprimento da lei e a aplicação do dinheiro público; pode propor ação civil pública.",
    fonte: { nome: "MPMG", url: "https://www.mpmg.mp.br" },
  },
  {
    id: "dpmg",
    termo: "DPMG (Defensoria Pública de Minas Gerais)",
    definicao: "Defende gratuitamente quem não pode pagar advogado. Atende por comarca, inclusive com defensores itinerantes.",
    fonte: { nome: "DPMG", url: "https://defensoria.mg.def.br" },
  },
  {
    id: "trt3",
    termo: "TRT-3 (Tribunal Regional do Trabalho da 3ª Região)",
    definicao: "Tribunal da Justiça do Trabalho que cobre Minas Gerais, com sede em Belo Horizonte.",
    fonte: { nome: "TRT-3", url: "https://portal.trt3.jus.br" },
  },
  {
    id: "trf6",
    termo: "TRF-6 (Tribunal Regional Federal da 6ª Região)",
    definicao: "Tribunal da Justiça Federal que cobre Minas Gerais, para causas contra a União, o INSS e o IBAMA.",
    fonte: { nome: "TRF-6", url: "https://www.trf6.jus.br" },
  },
  {
    id: "comarca",
    termo: "Comarca",
    definicao: "Divisão territorial da Justiça estadual; cada comarca tem uma ou mais varas e um fórum.",
  },
  {
    id: "vara",
    termo: "Vara",
    definicao: "Unidade da Justiça onde o juiz julga os processos. A vara única atende toda a comarca.",
  },
  {
    id: "balcao-virtual",
    termo: "Balcão Virtual",
    definicao: "Canal online do tribunal para peticionar e ser atendido sem ir presencialmente ao fórum.",
    fonte: { nome: "Varas e balcão do portal", url: "/judiciario/contatos" },
  },
  {
    id: "acp",
    termo: "ACP (Ação Civil Pública)",
    definicao: "Ação judicial que busca reparar dano a direitos coletivos, como o meio ambiente e o consumidor.",
    fonte: { nome: "Lei nº 7.347/1985", url: "https://www.planalto.gov.br/ccivil_03/leis/l7347orig.htm" },
  },
  {
    id: "adpf",
    termo: "ADPF (Arguição de Descumprimento de Preceito Fundamental)",
    definicao: "Ação no Supremo Tribunal Federal sobre violação grave de princípio da Constituição.",
  },
  {
    id: "liminar",
    termo: "Liminar",
    definicao: "Decisão rápida do juiz, antes do fim do processo, para evitar um dano imediato.",
  },
  {
    id: "datajud",
    termo: "DataJud",
    definicao: "Base pública do CNJ com o movimento processual dos tribunais. A licença veda redistribuir derivado — por isso fica em consulta ao vivo.",
    fonte: { nome: "CNJ — DataJud", url: "https://www.cnj.jus.br/sistemas/datajud/" },
  },

  // ═══ ORÇAMENTO E FINANÇAS ═══
  {
    id: "loa",
    termo: "LOA (Lei Orçamentária Anual)",
    definicao: "Lei que autoriza o governo a arrecadar e a gastar no ano, área por área.",
    fonte: LEI_FINANCAS,
  },
  {
    id: "ldo",
    termo: "LDO (Lei de Diretrizes Orçamentárias)",
    definicao: "Lei que define as metas e prioridades do orçamento do ano seguinte.",
    fonte: LEI_FINANCAS,
  },
  {
    id: "ppa",
    termo: "PPA (Plano Plurianual)",
    definicao: "Plano que organiza as metas de gasto do governo por quatro anos.",
    fonte: LEI_FINANCAS,
  },
  {
    id: "dotacao",
    termo: "Dotação orçamentária",
    definicao: "O valor que a lei reserva no orçamento para cada órgão, programa ou ação.",
  },
  {
    id: "pib",
    termo: "PIB (Produto Interno Bruto)",
    definicao: "Soma de tudo o que é produzido numa cidade, estado ou país num ano. Não mede como a renda é distribuída.",
    fonte: { nome: "IBGE", url: "https://www.ibge.gov.br" },
  },
  {
    id: "per-capita",
    termo: "Per capita",
    definicao: "Valor dividido pelo número de habitantes. Serve para comparar lugares de tamanhos diferentes.",
  },
  {
    id: "empenho",
    termo: "Empenho",
    definicao: "Primeiro passo do gasto: o governo reserva dinheiro para pagar algo contratado. É a promessa de pagamento, não o pagamento.",
    fonte: LEI_FINANCAS,
  },
  {
    id: "liquidacao",
    termo: "Liquidação",
    definicao: "Segundo passo do gasto: confere se o bem ou o serviço foi entregue antes de liberar o pagamento.",
    fonte: LEI_FINANCAS,
  },
  {
    id: "fpm",
    termo: "FPM (Fundo de Participação dos Municípios)",
    definicao: "Repasse obrigatório da União aos municípios, formado por parte do Imposto de Renda e do IPI.",
  },
  {
    id: "cota-icms",
    termo: "Cota-parte do ICMS",
    definicao: "Fatia do imposto estadual sobre mercadorias que é repassada ao município. Como o estado divide depende de critérios próprios.",
    fonte: { nome: "Lei Complementar nº 87/1996", url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm" },
  },
  {
    id: "fundeb",
    termo: "Fundeb",
    definicao: "Fundo que financia a educação básica e reparte recursos entre estados e municípios.",
  },
  {
    id: "precatorio",
    termo: "Precatório",
    definicao: "Dívida do poder público reconhecida pela Justiça, paga com atraso e em fila.",
  },
  {
    id: "emenda-parlamentar",
    termo: "Emenda parlamentar",
    definicao: "Dinheiro que o parlamentar indica para um projeto ou município no orçamento. A execução depende do órgão que recebe o recurso.",
  },
  {
    id: "verba-indenizatoria",
    termo: "Verba indenizatória",
    definicao: "Dinheiro pago a parlamentar ou agente público para cobrir gastos do cargo. Não é salário e exige prestação de contas.",
  },
  {
    id: "diarias",
    termo: "Diárias",
    definicao: "Valor pago por dia de viagem a serviço, para cobrir hospedagem e alimentação. Exige comprovação do deslocamento.",
  },
  {
    id: "auxilio-alimentacao",
    termo: "Auxílio-alimentação",
    definicao: "Benefício mensal pago a servidores e magistrados para alimentação, além do salário.",
  },

  // ═══ CONTRATAÇÕES PÚBLICAS ═══
  {
    id: "licitacao",
    termo: "Licitação",
    definicao: "Disputa pública que o poder público faz antes de comprar ou contratar, para escolher a proposta mais vantajosa.",
    fonte: LEI_LICITACAO,
  },
  {
    id: "pregao",
    termo: "Pregão",
    definicao: "Modalidade de licitação para bens e serviços comuns, em que os concorrentes disputam por lances.",
    fonte: LEI_LICITACAO,
  },
  {
    id: "dispensa",
    termo: "Dispensa de licitação",
    definicao: "Casos em que a lei permite contratar sem disputa, como compra de pequeno valor. Tem teto e hipóteses fechadas.",
    fonte: LEI_LICITACAO,
  },
  {
    id: "inexigibilidade",
    termo: "Inexigibilidade",
    definicao: "Contratação sem disputa porque só uma pessoa ou empresa pode fornecer aquilo, como um artista específico. Exige justificativa.",
    fonte: LEI_LICITACAO,
  },
  {
    id: "pncp",
    termo: "PNCP (Portal Nacional de Contratações Públicas)",
    definicao: "Portal onde as contratações públicas do país ficam publicadas: editais, contratos e atas.",
    fonte: { nome: "PNCP", url: "https://www.gov.br/pncp/pt-br" },
  },
  {
    id: "aditivo",
    termo: "Termo aditivo",
    definicao: "Documento que altera um contrato já assinado, como prazo ou valor. Mudança grande exige justificativa.",
  },
  {
    id: "superfaturamento",
    termo: "Superfaturamento",
    definicao: "Preço pago acima do valor de mercado do bem ou serviço. A prova exige comparar com o preço de referência.",
  },
  {
    id: "sobrepreco",
    termo: "Sobrepreço",
    definicao: "Valor estimado acima do mercado na planilha de uma obra. Pode indicar irregularidade, mas precisa de comparação.",
  },
  {
    id: "ata-registro-precos",
    termo: "Ata de registro de preços",
    definicao: "Lista de preços negociada que permite ao órgão comprar aos poucos, ao longo do prazo, sem nova licitação.",
  },
  {
    id: "concessao",
    termo: "Concessão",
    definicao: "Contrato em que a empresa privada explora um serviço público por muitos anos, sob regras e fiscalização do poder concedente.",
  },
  {
    id: "ppp",
    termo: "PPP (Parceria Público-Privada)",
    definicao: "Contrato em que a empresa privada constrói e opera um serviço público por anos, recebendo do governo. Vale por décadas.",
    fonte: { nome: "Lei nº 11.079/2004", url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11079.htm" },
  },

  // ═══ MEIO AMBIENTE E TERRITÓRIO ═══
  {
    id: "anm",
    termo: "ANM (Agência Nacional de Mineração)",
    definicao: "Agência que regula e fiscaliza a mineração no Brasil, incluindo os títulos minerários e as barragens.",
    fonte: { nome: "ANM", url: "https://www.gov.br/anm/pt-br" },
  },
  {
    id: "sigmine",
    termo: "SIGMINE",
    definicao: "Sistema da ANM que mostra onde há títulos minerários. Título é alvará de pesquisa ou lavra — não é mina em operação.",
    fonte: { nome: "ANM — SIGMINE", url: "https://www.gov.br/anm/pt-br/assuntos/dados-abertos" },
  },
  {
    id: "sigbm",
    termo: "SIGBM",
    definicao: "Sistema da ANM com o cadastro e a situação das barragens de mineração do país.",
    fonte: PAGINA_BARRAGENS,
  },
  {
    id: "cfem",
    termo: "CFEM (royalty da mineração)",
    definicao: "Compensação financeira paga por quem extrai minério. Parte fica com o município onde a lavra acontece.",
    fonte: { nome: "Lei nº 8.001/1990", url: "https://www.planalto.gov.br/ccivil_03/leis/l8001.htm" },
  },
  {
    id: "ibama",
    termo: "IBAMA",
    definicao: "Órgão federal do meio ambiente: licencia, fiscaliza e aplica multas ambientais em âmbito federal.",
    fonte: { nome: "IBAMA", url: "https://www.gov.br/ibama/pt-br" },
  },
  {
    id: "semad",
    termo: "SEMAD",
    definicao: "Secretaria de Meio Ambiente e Desenvolvimento Sustentável de Minas Gerais: concede as licenças ambientais estaduais.",
    fonte: { nome: "SEMAD-MG", url: "http://www.meioambiente.mg.gov.br" },
  },
  {
    id: "feam",
    termo: "FEAM",
    definicao: "Fundação Estadual do Meio Ambiente de Minas Gerais: dá apoio técnico ao licenciamento e à fiscalização.",
    fonte: { nome: "FEAM", url: "http://www.feam.br" },
  },
  {
    id: "copam",
    termo: "COPAM (Conselho Estadual de Política Ambiental)",
    definicao: "Conselho de Minas Gerais que decide os licenciamentos de maior impacto, em reuniões com pauta pública.",
    fonte: { nome: "COPAM no portal", url: "/ambiental/copam" },
  },
  {
    id: "ief",
    termo: "IEF (Instituto Estadual de Florestas)",
    definicao: "Órgão de Minas que cuida de florestas, parques e do Cadastro Ambiental Rural (CAR).",
    fonte: { nome: "IEF-MG", url: "http://www.ief.mg.gov.br" },
  },
  {
    id: "igam",
    termo: "IGAM (Instituto Mineiro de Gestão das Águas)",
    definicao: "Órgão de Minas que cuida das outorgas de água e do monitoramento da qualidade dos rios.",
    fonte: { nome: "IGAM", url: "http://www.igam.mg.gov.br" },
  },
  {
    id: "ana",
    termo: "ANA (Agência Nacional de Águas)",
    definicao: "Agência federal que coordena o uso da água em rios e bacias de interesse da União.",
    fonte: { nome: "ANA", url: "https://www.gov.br/ana/pt-br" },
  },
  {
    id: "eia-rima",
    termo: "EIA/RIMA",
    definicao: "Estudo de Impacto Ambiental e seu Relatório: análise obrigatória antes de licenciar grandes empreendimentos.",
  },
  {
    id: "licenca-previa",
    termo: "Licença prévia",
    definicao: "Primeira licença do empreendimento: atesta a viabilidade ambiental e aprova o local escolhido.",
  },
  {
    id: "licenca-operacao",
    termo: "Licença de operação",
    definicao: "Autoriza o funcionamento do empreendimento, com as condicionantes que devem ser cumpridas.",
  },
  {
    id: "condicionante",
    termo: "Condicionante ambiental",
    definicao: "Obrigação que a licença impõe ao empreendedor para reduzir ou reparar o impacto. Descumprir é irregularidade.",
    fonte: { nome: "Condicionantes no portal", url: "/ambiental/condicionantes" },
  },
  {
    id: "tac",
    termo: "TAC (Termo de Ajustamento de Conduta)",
    definicao: "Acordo em que alguém assume obrigações para corrigir um dano, em geral firmado com o Ministério Público.",
    fonte: { nome: "TACs ambientais no portal", url: "/ambiental/tac" },
  },
  {
    id: "barragem-montante",
    termo: "Barragem a montante",
    definicao: "Barragem de rejeito construída com o próprio rejeito, degrau sobre degrau. É o método mais barato e o de menor margem de segurança.",
    fonte: PAGINA_BARRAGENS,
  },
  {
    id: "barragem-jusante",
    termo: "Barragem a jusante",
    definicao: "Método em que o alteamento da barragem é feito para o lado de baixo. É mais estável que o método a montante.",
    fonte: LEI_BARRAGENS,
  },
  {
    id: "rejeito",
    termo: "Rejeito de mineração",
    definicao: "Resíduo que sobra depois de separar o minério. Fica guardado em barragens ou pilhas.",
    fonte: LEI_BARRAGENS,
  },
  {
    id: "pae",
    termo: "PAE (Plano de Ação Emergencial)",
    definicao: "Plano que diz o que fazer se uma barragem falhar, incluindo alarme, rotas de fuga e pontos de encontro.",
    fonte: LEI_BARRAGENS,
  },
  {
    id: "zas",
    termo: "ZAS (Zona de Autossalvamento)",
    definicao: "Faixa perto da barragem onde as pessoas teriam pouco tempo para se salvar sozinhas. É a área mais crítica do plano.",
    fonte: PAGINA_BARRAGENS,
  },
  {
    id: "car",
    termo: "CAR (Cadastro Ambiental Rural)",
    definicao: "Registro da propriedade rural que diz os limites do imóvel e o que há dentro dele. É autodeclaratório.",
    fonte: LEI_FORESTAL,
  },
  {
    id: "rtid",
    termo: "RTID (Relatório Técnico de Identificação e Delimitação)",
    definicao: "Relatório que identifica e delimita o território de uma comunidade quilombola, etapa do reconhecimento.",
  },
  {
    id: "terra-indigena",
    termo: "Terra Indígena",
    definicao: "Área reconhecida como de ocupação indígena. A demarcação passa por fases com nomes próprios.",
  },
  {
    id: "grilagem",
    termo: "Grilagem",
    definicao: "Apossar-se de terra pública com documento falso ou irregular. É um dos nós da disputa por território.",
  },
  {
    id: "terras-devolutas",
    termo: "Terras devolutas",
    definicao: "Terras públicas sem destinação definida. São alvo frequente de disputa e de grilagem.",
  },

  // ═══ DADOS, MERCADO E EMPRESAS ═══
  {
    id: "lgpd",
    termo: "LGPD (Lei Geral de Proteção de Dados)",
    definicao: "Lei nº 13.709/2018: regula o uso de dados pessoais no Brasil e dá ao titular o direito de saber e de apagar.",
    fonte: { nome: "Lei nº 13.709/2018", url: "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/L13709.htm" },
  },
  {
    id: "cvm",
    termo: "CVM (Comissão de Valores Mobiliários)",
    definicao: "Órgão que regula e fiscaliza o mercado de capitais brasileiro, como a bolsa e as empresas listadas.",
    fonte: { nome: "CVM", url: "https://www.gov.br/cvm/pt-br" },
  },
  {
    id: "b3",
    termo: "B3",
    definicao: "A bolsa de valores oficial do Brasil, onde ações e títulos são negociados.",
    fonte: { nome: "B3", url: "https://www.b3.com.br" },
  },
  {
    id: "sec-edgar",
    termo: "SEC EDGAR",
    definicao: "Base pública da SEC, a comissão de valores dos Estados Unidos, com os documentos das empresas listadas.",
    fonte: { nome: "SEC EDGAR", url: "https://www.sec.gov/edgar" },
  },
  {
    id: "tsx",
    termo: "TSX",
    definicao: "Bolsa de valores de Toronto, no Canadá, onde estão listadas mineradoras que operam no Brasil.",
    fonte: { nome: "Eixos EUA e Canadá no portal", url: "/canada" },
  },
  {
    id: "vale",
    termo: "Vale",
    definicao: "Mineradora brasileira, uma das maiores do mundo. Está ligada aos acordos de reparação de Brumadinho e Mariana.",
    fonte: PAGINA_EMPRESAS,
  },
  {
    id: "samarco",
    termo: "Samarco",
    definicao: "Mineradora que operava a barragem de Fundão, rompida em Mariana (MG) em 2015.",
    fonte: PAGINA_EMPRESAS,
  },
  {
    id: "renova",
    termo: "Renova",
    definicao: "Fundação criada pelas mineradoras para conduzir a reparação do Rio Doce após o rompimento de Mariana.",
    fonte: { nome: "Acordo de Mariana no portal", url: "/ambiental/mariana" },
  },
  {
    id: "sigma-lithium",
    termo: "Sigma Lithium",
    definicao: "Mineradora de lítio que opera no Vale do Jequitinhonha, em Minas Gerais.",
    fonte: PAGINA_EMPRESAS,
  },
  {
    id: "braskem",
    termo: "Braskem",
    definicao: "Petroquímica brasileira ligada ao afundamento de solo em bairros de Maceió (AL), objeto de acordo.",
    fonte: PAGINA_EMPRESAS,
  },
];

/** Busca termos por texto, tolerante a acento e caixa. Devolve em ordem alfabética. */
export function buscarTermos(consulta: string): TermoGlossario[] {
  const alvo = semAcento(consulta.trim().toLowerCase());
  const filtrados = alvo
    ? TERMOS.filter((t) => semAcento(`${t.termo} ${t.definicao}`.toLowerCase()).includes(alvo))
    : TERMOS;
  return [...filtrados].sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"));
}
