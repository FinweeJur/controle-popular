/**
 * Relatórios de inspeção da Corregedoria Nacional de Justiça (CNJ).
 * ARQUIVO GERADO por `scripts/gerar-inspecoes-cnj.mts` — não editar à mão.
 *
 * ═══ O QUE ESTE CATÁLOGO É ═══
 *
 * A cada inspeção num tribunal, a Corregedoria Nacional publica um relatório
 * que descreve, unidade por unidade, o que a equipe encontrou — e cobra, na
 * inspeção seguinte, o que determinou na anterior. São 343 relatórios sobre
 * 33 órgãos, de 2008 a 2026.
 *
 * ⚠️ COBERTURA É PISO, NÃO TOTAL. Não existe rota de listagem de categorias no
 * CNJ (`categories.getCategories` responde HTTP 500), então o universo foi
 * descoberto varrendo ids de 2400 a 2950. E os ids **não são
 * contíguos**: o TJ de Roraima mora sozinho no id 2796, a 118 do bloco
 * alfabético dos demais. Pode haver órgão fora da faixa varrida.
 *
 * ⚠️ FORA DO ACERVO POR COMPETÊNCIA: não há inspeção da Corregedoria Nacional
 * sobre STJ, TST ou STF — o Regulamento Geral descreve inspeção sobre órgãos
 * de primeiro e segundo grau. Quem correiciona TRT é a Corregedoria-Geral da
 * Justiça do Trabalho, órgão do TST. Ver `docs/judiciario/`.
 *
 * ⚠️ O PDF ORIGINAL NÃO É ESPELHADO por este projeto. Cada linha traz trecho
 * de até 600 caracteres e o link permanente para o CNJ.
 */

export interface OrgaoInspecionado {
  categoriaId: number;
  slug: string;
  titulo: string;
  relatorios: number;
  bytes: number;
  anos: string[];
}

export interface RelatorioTjmg {
  titulo: string;
  /** Ano da INSPEÇÃO, lido do título. `null` quando o título não traz ano —
   *  nunca preenchido com a data de upload, que é outra coisa. */
  anoInspecao: number | null;
  /** Data em que o CNJ carregou o arquivo na biblioteca. NÃO é a data da
   *  inspeção: dez dos treze relatórios do TJMG trazem 2019-09-30 aqui. */
  carregadoEm: string;
  megabytes: number;
  url: string;
}

export interface AchadoInspecao {
  ano: number;
  secao: string;
  unidade: string;
  /** vara | juizado | gabinete | turma | serventia | orgao-central | outra */
  tipo: string;
  /** `null` quando o título não declara — nunca preenchido por default. */
  comarca: string | null;
  /** achados | recomendacoes */
  tipoSecao: string;
  itens: number;
  caracteres: number;
  temas: string[];
  trecho: string;
}

export const TEMA_ROTULOS: Record<string, string> = {
  "pessoa_presa": "Pessoa presa e execução penal",
  "violencia_domestica": "Violência doméstica",
  "infancia": "Infância e juventude",
  "sistema": "Sistema processual e migração",
  "prazo_e_acervo": "Prazo, acervo e congestionamento",
  "pessoal": "Pessoal, lotação e estrutura",
  "cartorio": "Gestão de cartório e secretaria",
  "extrajudicial": "Serventias extrajudiciais",
  "estatistica": "Estatística e transparência do próprio tribunal",
  "precatorio": "Precatórios",
  "conciliacao": "Conciliação e mediação",
  "colegiado": "Funcionamento do colegiado",
  "pericia_e_apoio": "Perícia e órgãos de apoio fora do tribunal"
};

export const COBERTURA_INSPECOES = {
  extraidoEm: "2026-08-22",
  totalOrgaos: 33,
  totalRelatorios: 343,
  totalBytes: 1812027923,
  faixaDeIdsVarrida: {"de":2400,"ate":2950},
  tjmg: {
    relatorios: 13,
    anoMaisAntigo: 2012,
    anoMaisRecente: 2026,
    secoesSemTextoLegivel: 27,
    paginas2026: 1388,
    processoCnj: "0000675-79.2026.2.00.0000",
    portaria: "Portaria nº 3, de 02/02/2026",
    assinadoEm: "2026-07-08",
    url: "https://www.cnj.jus.br/download/2664/tribunal-de-justica-do-estado-de-minas-gerais/419313/relatorio-de-inspecao-ordinaria-tjmg-2026-2",
    secoesNoSumario: 247,
    secoesLidasNoCorpo: 285,
    secoesComConteudo: 157,
    secoesSemAchado: 101,
    unidadesDistintas: 113,
  },
} as const;



export const ACHADOS_POR_TEMA: Record<string, number> = {
 "pessoa_presa": 26,
 "violencia_domestica": 7,
 "infancia": 5,
 "prazo_e_acervo": 75,
 "colegiado": 18,
 "pessoal": 25,
 "sistema": 37,
 "estatistica": 33,
 "pericia_e_apoio": 26,
 "cartorio": 23,
 "precatorio": 19,
 "extrajudicial": 5
};

export const ACHADOS_POR_TIPO_UNIDADE = {
 "orgao-central": {
  "unidades": 7,
  "secoes": 14,
  "caracteres": 38116
 },
 "gabinete": {
  "unidades": 21,
  "secoes": 24,
  "caracteres": 25539
 },
 "turma": {
  "unidades": 1,
  "secoes": 1,
  "caracteres": 1431
 },
 "juizado": {
  "unidades": 4,
  "secoes": 4,
  "caracteres": 16626
 },
 "vara": {
  "unidades": 66,
  "secoes": 88,
  "caracteres": 160830
 },
 "outra": {
  "unidades": 13,
  "secoes": 25,
  "caracteres": 43253
 },
 "serventia": {
  "unidades": 1,
  "secoes": 1,
  "caracteres": 182
 }
} as const;


export interface PendenciaInspecao {
  ano: number;
  secao: string;
  unidade: string;
  caracteres: number;
  trecho: string;
  url: string;
}

/**
 * "Pendências da última inspeção": o que o CNJ tinha determinado antes e foi
 * cobrar de novo. Só 2022 e 2023 trazem seções assim nomeadas — os demais anos
 * cobram a inspeção anterior de outras formas, ainda não extraídas. A série é
 * de dois pontos, não de seis, e a tela diz isso.
 */

/**
 * A série longitudinal: quantos itens o CNJ escreveu por ano.
 *
 * ⚠️ SÓ ENTRAM OS ANOS EM QUE A EXTRAÇÃO SE SUSTENTA. 2017 rende 2 unidades de
 * 25 entradas de sumário (layout sem marcador de item), e 2026 tem extrator
 * próprio. Publicar 2017 ao lado de 2023 desenharia uma "queda" que é defeito
 * do nosso parser, não do TJMG — e ninguém olhando o gráfico saberia.
 *
 * ⚠️ E os anos não são igualmente comparáveis nem entre os que entraram: a
 * rubrica de temas foi medida contra o vocabulário de 2026, e em 2012 ela
 * deixa 32% dos achados sem tema contra 5% em 2023. O semTema existe
 * para a tela poder dizer isso.
 */
export const SERIE_TJMG = [
 {
  "ano": 2012,
  "layout": "L1",
  "unidades": 60,
  "itens": 194,
  "itemVerificado": true,
  "semTema": 0.317
 },
 {
  "ano": 2019,
  "layout": "L3",
  "unidades": 9,
  "itens": 59,
  "itemVerificado": true,
  "semTema": 0.333
 },
 {
  "ano": 2022,
  "layout": "L4",
  "unidades": 57,
  "itens": 565,
  "itemVerificado": true,
  "semTema": 0.105
 },
 {
  "ano": 2023,
  "layout": "L3",
  "unidades": 60,
  "itens": 521,
  "itemVerificado": true,
  "semTema": 0.05
 }
] as const;

export const ANOS_FORA_DA_SERIE = [
 {
  "ano": 2017,
  "arquivo": "tribunal-de-justica-do-estado-de-minas-g__Relatorio_Unidades_Adm_TJMG_2017.pdf",
  "motivo": "So' 2 unidade(s) com item, de 6 aceitas e 25 entradas de sumario. O layout L2 nao tem marcador enumerado e o cabecalho nao ancora em nada -- a extracao deste documento nao esta resolvida."
 },
 {
  "ano": 2017,
  "arquivo": "tribunal-de-justica-do-estado-de-minas-g__Relatorio_Unidades_Judiciais_TJMG_2017.pdf",
  "motivo": "So' 1 unidade(s) com item, de 1 aceitas e 124 entradas de sumario. O layout L2 nao tem marcador enumerado e o cabecalho nao ancora em nada -- a extracao deste documento nao esta resolvida."
 },
 {
  "ano": 2026,
  "arquivo": "tribunal-de-justica-do-estado-de-minas-g__Relatório_de_Inspeção_Ordinária_TJMG_2026.pdf",
  "motivo": "O ramo generico de L5 rende 1.122 'unidades' aceitas (o sumario deste relatorio tem 1.155 entradas, quase todas subsecao) e so' 8 com item. Para 2026 vale o extrator dedicado, `cnj_inspecoes.py --achados`, que ancora nas secoes 'Achados e Determinacoes' e rende 123 secoes em 98 unidades. Nao somar os dois."
 }
] as const;

export interface GabineteNomeado {
  titular: string;
  secao: string;
  tipoSecao: string;
  temas: string[];
  trecho: string;
}

export const GABINETES_NOMEADOS: GabineteNomeado[] = [
 {
  "titular": "BRUNO TERRA DIAS",
  "secao": "4.4.4",
  "tipoSecao": "achados",
  "temas": [
   "pessoa_presa",
   "prazo_e_acervo",
   "colegiado"
  ],
  "trecho": "Conforme noticiado, o gabinete inspecionado registrou a distribuição de 2.151 feitos no último ano, superando amplamente a capacidade de baixa definitiva, que foi de 1.470 processos, o que implica reconhecer o não atingimento da Meta Nacional 1 do CNJ, fato igualmente declinado pela unidade ao informar que o índice cumprido fora de apenas 86%. Nada obstante a mudança na competência da 9.ª Câmara Criminal possa realmente ter sido relevante, há prevalecer a compreensão de que as metas são compromissos anuais cujo objetivo é buscar o aperfeiçoamento da prestação jurisdicional, funcionando como um…"
 },
 {
  "titular": "EDISON FEITAL LEITE",
  "secao": "4.8.4",
  "tipoSecao": "achados",
  "temas": [
   "pessoa_presa",
   "violencia_domestica",
   "prazo_e_acervo",
   "colegiado"
  ],
  "trecho": "Conforme noticiado, o gabinete inspecionado registrou a distribuição de 2.558 feitos no último ano, superando amplamente a capacidade de baixa definitiva, que foi de 1.199 processos, o que implica reconhecer o não atingimento da Meta Nacional 1 do CNJ, fato igualmente declinado pela unidade ao informar que o índice cumprido fora de apenas 80%. Sem embargo, houve ainda o descumprimento da Meta 8, relativa à violência doméstica, que atingiu apenas 83%. Nada obstante a mudança na competência da 9.ª Câmara Criminal possa realmente ter sido relevante, há que prevalecer a compreensão de que as metas…"
 },
 {
  "titular": "EDUARDO MACHADO COSTA",
  "secao": "4.9.4",
  "tipoSecao": "achados",
  "temas": [
   "pessoa_presa",
   "prazo_e_acervo",
   "colegiado"
  ],
  "trecho": "Conforme noticiado, a única meta nacional do CNJ com índice abaixo do esperado foi a Meta 1, com 92%, o que pode ser atribuído ao aumento súbito da distribuição citada. Em que pese isso, é dizer, a mudança na competência da 9.ª Câmara Criminal possa realmente ter sido relevante, há que prevalecer a compreensão de que as metas são compromissos anuais cujo objetivo é buscar o aperfeiçoamento da prestação jurisdicional, funcionando como um plano de gestão focado em resultados mensuráveis, visando dar mais agilidade, eficiência e transparência à Justiça. Elas são fundamentais para o trabalho de mo…"
 },
 {
  "titular": "ENÉIAS XAVIER GOMES",
  "secao": "4.10.4",
  "tipoSecao": "achados",
  "temas": [
   "prazo_e_acervo",
   "colegiado"
  ],
  "trecho": "Conforme noticiado, o gabinete inspecionado registrou o não atingimento da Meta Nacional 1 do CNJ, atingindo um índice de apenas 87%. Nada obstante a mudança na competência da 9.ª Câmara Criminal possa realmente ter sido relevante, há que prevalecer a compreensão de que as metas são compromissos anuais cujo objetivo é buscar o aperfeiçoamento da prestação jurisdicional, funcionando como um plano de gestão focado em resultados mensuráveis, visando dar mais agilidade, eficiência e transparência à Justiça. Elas são fundamentais para o trabalho de monitoramento e correição, garantindo que as unida…"
 },
 {
  "titular": "GENIL ANACLETO RODRIGUES FILHO",
  "secao": "4.12.4",
  "tipoSecao": "achados",
  "temas": [
   "colegiado"
  ],
  "trecho": "Considerando que a Meta 1 ainda não foi atingida na 10ª Câmara Cível por situações alheias ao poder de impulso imediato da unidade, determina- se ao Gabinete do Desembargador Genil Anacleto Rodrigues Filho que, tão logo superados os obstáculos identificados, promova medidas voltadas ao seu cumprimento, apresentando informações à Corregedoria Nacional de Justiça, no prazo de 90 dias."
 },
 {
  "titular": "JAQUELINE CALÁBRIA ALBUQUERQUE",
  "secao": "4.16.4",
  "tipoSecao": "achados",
  "temas": [
   "colegiado"
  ],
  "trecho": "Considerando que alguns integrantes da 10ª Câmara Cível têm comparecido às sessões por videoconferência a partir dos próprios gabinetes, determina-se à Presidência do TJMG que oficie aos membros daquele colegiado, a fim de que passem, imediatamente, a participar presencialmente das referidas sessões."
 },
 {
  "titular": "JOSÉ ARTHUR DE CARVALHO PEREIRA FILHO",
  "secao": "4.20.4",
  "tipoSecao": "achados",
  "temas": [],
  "trecho": "Determina-se à Presidência do TJMG, a quem caberá a supervisão das tarefas, que oficie:"
 },
 {
  "titular": "JOSÉ EUSTÁQUIO LUCAS PEREIRA",
  "secao": "4.21.4",
  "tipoSecao": "achados",
  "temas": [],
  "trecho": "Não tendo sido apuradas irregularidades, não há determinações a serem feitas."
 },
 {
  "titular": "JÚLIO CÉSAR LORENS",
  "secao": "4.22.4",
  "tipoSecao": "achados",
  "temas": [
   "pessoa_presa",
   "prazo_e_acervo",
   "colegiado"
  ],
  "trecho": "Os indicadores de produtividade dos últimos 12 meses revelam a distribuição de 2.698 feitos, com a realização de 1.727 julgamentos colegiados. Os julgamentos monocráticos somaram 66 decisões, resultando em um total de 1.735 processos baixados definitivamente do acervo no período, a implicar o desatendimento da Meta Nacional 1 do CNJ, que ficou em 68% do almejado. De igual forma o cumprimento da Meta 8 situa-se em 67%. Nada obstante a mudança na competência da 9.ª Câmara Criminal possa realmente ter sido relevante, há que prevalecer a compreensão de que as metas são compromissos anuais cujo obj…"
 },
 {
  "titular": "LÍLIAN MACIEL SANTOS",
  "secao": "4.23.4",
  "tipoSecao": "achados",
  "temas": [],
  "trecho": "Não tendo sido apuradas irregularidades, não há determinações a serem feitas."
 },
 {
  "titular": "MARCELO DE OLIVEIRA MILAGRES",
  "secao": "4.24.4",
  "tipoSecao": "achados",
  "temas": [
   "colegiado"
  ],
  "trecho": "Considerando que alguns integrantes da 21ª Câmara Cível têm comparecido às sessões híbridas a partir dos próprios gabinetes, determina-se à Presidência do TJMG que oficie aos membros daquele colegiado, a fim de que passem, imediatamente, a participar presencialmente das referidas sessões."
 },
 {
  "titular": "MARCO ANTÔNIO DE MELO",
  "secao": "4.25.4",
  "tipoSecao": "achados",
  "temas": [
   "prazo_e_acervo",
   "colegiado"
  ],
  "trecho": "Diante da existência de feitos conclusos há mais de 120 dias no Gabinete do Desembargador Marco Antônio de Melo, determina-se à Presidência do TJMG que oficie ao gabinete do magistrado, a fim de que, no prazo de 30 dias, a unidade elabore um plano de gestão do acervo que priorize o julgamento dos processos que se encontram nessa condição. Considerando que alguns integrantes da 6ª Câmara Criminal têm comparecido às sessões hibridas a partir dos próprios gabinetes, também se determina à Presidência do TJMG que oficie aos membros daquele colegiado, para que passem, imediatamente, a participar pre…"
 },
 {
  "titular": "MARIA LÚCIA CABRAL CARUSO",
  "secao": "4.26.4",
  "tipoSecao": "achados",
  "temas": [
   "prazo_e_acervo",
   "colegiado"
  ],
  "trecho": "Considerando que alguns integrantes da 12ª Câmara Cível têm comparecido às sessões híbridas a partir dos próprios gabinetes, determina-se à Presidência do TJMG que oficie aos membros daquele colegiado, a fim de que passem, imediatamente, a participar presencialmente das referidas sessões. Ademais, diante da existência de processos sobrestados na 16ª Câmara Cível que dependem de redistribuição ao sucessor, também se determina à Presidência daquela Corte que, no prazo de 30 dias, adote as providências necessárias para a regularização desses feitos (processos 1.0283.08.010047-4/008 e 1.0283.08.01…"
 },
 {
  "titular": "OSVALDO OLIVEIRA ARAÚJO FIRMO",
  "secao": "4.27.4",
  "tipoSecao": "achados",
  "temas": [],
  "trecho": "Determina-se à Presidência do TJMG, a quem caberá a supervisão das tarefas, que oficie:"
 },
 {
  "titular": "PAULO DE TARSO TAMBURINI SOUZA",
  "secao": "4.28.4",
  "tipoSecao": "achados",
  "temas": [
   "pessoa_presa",
   "prazo_e_acervo",
   "colegiado"
  ],
  "trecho": "O gabinete inspecionado registrou o não atingimento da Meta Nacional 1 do CNJ, já que o índice foi cumprido em apenas 80%. Nada obstante a mudança na competência da 9.ª Câmara Criminal possa realmente ter sido relevante, há que prevalecer a compreensão de que as metas são compromissos anuais cujo objetivo é buscar o aperfeiçoamento da prestação jurisdicional, funcionando como um plano de gestão focado em resultados mensuráveis, visando dar mais agilidade, eficiência e transparência à Justiça. Elas são fundamentais para o trabalho de monitoramento e correição, garantindo que as unidades judiciá…"
 },
 {
  "titular": "PAULO FERNANDO NAVES DE RESENDE",
  "secao": "4.29.4",
  "tipoSecao": "achados",
  "temas": [
   "prazo_e_acervo",
   "pessoal",
   "colegiado"
  ],
  "trecho": "Considerando que o Desembargador Paulo Fernando Naves de Resende ainda não fixou residência em Belo Horizonte, sede do Tribunal de Justiça de Minas Gerais, determina-se à Presidência do TJMG que, no prazo de 30 dias, apure a situação residencial do referido magistrado e adote as providências cabíveis para assegurar o cumprimento da obrigação, com a devida cientificação da Corregedoria Nacional de Justiça acerca das medidas tomadas. Tendo em vista que o gabinete não dispõe de rotina própria de controle e acompanhamento dos processos em diligência na origem, dos sobrestados por pendência de julg…"
 },
 {
  "titular": "RONALDO CLARET DE MORAES",
  "secao": "4.33.4",
  "tipoSecao": "achados",
  "temas": [
   "colegiado"
  ],
  "trecho": "Considerando que alguns integrantes da 10ª Câmara Cível têm comparecido às sessões por videoconferência a partir dos próprios gabinetes, determina-se à Presidência do TJMG que oficie aos membros daquele colegiado, a fim de que passem, imediatamente, a participar presencialmente das referidas sessões."
 },
 {
  "titular": "SANDRA ALVES DE SANTANA E FONSECA",
  "secao": "4.35.4",
  "tipoSecao": "achados",
  "temas": [],
  "trecho": "Não tendo sido apuradas irregularidades, não há determinações a serem feitas."
 },
 {
  "titular": "SHIRLEY FENZI BERTÃO",
  "secao": "4.37.4",
  "tipoSecao": "achados",
  "temas": [
   "colegiado"
  ],
  "trecho": "Considerando que alguns integrantes da 11ª Câmara Cível têm comparecido às sessões híbridas a partir dos próprios gabinetes, determina-se à Presidência do TJMG que oficie aos membros daquele colegiado, a fim de que passem, imediatamente, a participar presencialmente das referidas sessões."
 },
 {
  "titular": "WANDERLEY SALGADO DE PAIVA",
  "secao": "4.40.4",
  "tipoSecao": "achados",
  "temas": [
   "prazo_e_acervo"
  ],
  "trecho": "Conforme relatado no item anterior, foi constatada a ausência de utilização da ferramenta de gestão \"Painel Tático\" no Gabinete do Desembargador Wanderley Paiva, o que demanda providências imediatas por parte da Presidência do TJMG no sentido de promover junto à Unidade a elaboração e execução de plano de gestão para o adequado conhecimento e utilização das ferramentas disponíveis para o adequado gerenciamento do acervo processual e controle das Metas Nacionais do Poder Judiciário. À vista disso, determina-se à Presidência do TJMG: Que, no prazo de 30 dias, adote providências no sentido de ela…"
 }
];

/**
 * Quantas vezes, em cada inspeção, o CNJ voltou a cobrar o que já tinha
 * determinado antes.
 *
 * ⚠️ **2012 é ZERO por um motivo, não por falha.** Foi a primeira inspeção da
 * Corregedoria Nacional no TJMG: não havia inspeção anterior a cobrar. Um
 * gráfico que mostre 2012 = 0 ao lado de 2023 = 52 sem dizer isso sugere que o
 * tribunal piorou muito — quando o que mudou foi a existência de histórico.
 *
 * ⚠️ Os anos usam vocabulário diferente: 2022 e 2023 têm seções nomeadas
 * "Pendências da última inspeção"; 2019 e 2026 cobram sem esse nome (em 2026,
 * sob o título "Não cumprimento de determinações nas inspeções ano 2019, 2022
 * e 2023"). Os números não são medidos do mesmo jeito e a tela diz isso.
 */

export const PENDENCIAS_POR_ANO = {
 "2022": 24,
 "2023": 52
} as const;

/**
 * Os acervos grandes desta frente saíram daqui em 2026-08-25 pelo teto de
 * 3 MiB gzip do Worker Free (erro 10027):
 * - ORGAOS_INSPECIONADOS, RELATORIOS_TJMG, PENDENCIAS_TJMG e
 *   COBRANCAS_POR_INSPECAO -> etl/betim/dados/inspecoes-cnj-bundle.json,
 *   lidos em build via inspecoes-cnj-dados.ts (server-only);
 * - ACHADOS_TJMG -> public/data/achados-tjmg.json, buscado pelo cliente via
 *   fetch em TabelaAchados.tsx (useAchadosTjmg).
 */
