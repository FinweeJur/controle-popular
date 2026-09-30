/**
 * Modelos prontos — textos que o cidadão copia, preenche e protocola.
 *
 * ═══ O QUE É ═══
 *
 * Um acervo de requerimentos e comunicações oficiais em português claro, com
 * campos entre colchetes `[ASSIM]` para a pessoa completar. É a parte da
 * "oficina" do portal que transforma leitura em AÇÃO: pedir informação (LAI),
 * recorrer de uma negativa, noticiar dano ambiental ao Ministério Público e
 * pedir a tarifa social de energia e água.
 *
 * ═══ DE ONDE VEM ═══
 *
 * Os modelos nascem dos guias do blog do próprio portal:
 * - `lai-acesso-informacao-13-anos-como-pedir`;
 * - `judiciario-varas-gabinetes-como-acessar`;
 * - `tarifa-social-energia-agua-como-acessar`.
 * Cada modelo aponta a base legal (fonte) e o canal oficial para protocolar.
 *
 * ═══ REGRAS EDITORIAIS ═══
 *
 * - O modelo nunca promete resultado; ele orienta o pedido.
 * - A fonte (lei) e o canal são sempre citados e linkados.
 * - Nada de dado pessoal de terceiro: os campos são do PRÓPRIO solicitante,
 *   preenchidos por ele, no aparelho dele. O portal não coleta, não envia.
 */

/** Categoria do modelo, para filtro na tela. */
export type CategoriaModelo = "Transparência" | "Meio ambiente" | "Direitos sociais";

/** Base legal (lei) ou canal oficial. */
export interface ReferenciaModelo {
  nome: string;
  /** URL oficial (http) ou rota interna do portal (começa com "/"). */
  url: string;
}

export interface ModeloPronto {
  id: string;
  titulo: string;
  categoria: CategoriaModelo;
  /** Para que serve, em uma frase. */
  descricao: string;
  /** Base legal do pedido. */
  fonte: ReferenciaModelo;
  /** Onde protocolar ou pedir. */
  canal: ReferenciaModelo;
  /** Dica curta que melhora a resposta. */
  dica: string;
  /** Texto do modelo, com campos entre colchetes. */
  corpo: string;
}

/** Lista de modelos disponíveis. */
export const MODELOS: ModeloPronto[] = [
  {
    id: "pedido-lai",
    titulo: "Pedido de acesso à informação (LAI)",
    categoria: "Transparência",
    descricao: "Peça documentos, contratos, salários e atas a qualquer órgão público. É grátis e não precisa justificar.",
    fonte: {
      nome: "Lei nº 12.527/2011 (Lei de Acesso à Informação)",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm",
    },
    canal: {
      nome: "Fala.BR (órgãos federais) e ouvidorias estaduais e municipais",
      url: "https://falabr.cgu.gov.br",
    },
    dica: "Seja específico: diga o período, o órgão e o tipo de documento. Pedido vago atrasa a resposta.",
    corpo: [
      "Ao(À) [NOME DO ÓRGÃO],",
      "",
      "Com base na Lei de Acesso à Informação (Lei nº 12.527/2011, art. 10), solicito:",
      "",
      "[DESCREVA O PEDIDO COM PRECISÃO.",
      "Exemplo: notas de empenho dos contratos de limpeza pública firmados entre janeiro de 2023 e dezembro de 2024, com a razão social do fornecedor e o valor.]",
      "",
      "Formato preferido da resposta: [planilha / PDF / texto].",
      "",
      "O pedido não exige justificativa (art. 10, § 1º, da Lei nº 12.527/2011).",
      "",
      "Solicitante: [SEU NOME]",
      "Contato: [E-MAIL E TELEFONE]",
      "Data: [DD/MM/AAAA]",
    ].join("\n"),
  },
  {
    id: "recurso-lai",
    titulo: "Recurso quando o pedido é negado",
    categoria: "Transparência",
    descricao: "O órgão respondeu mal ou negou? Cabe recurso em até três instâncias, e depois à CGU ou ao Tribunal de Contas.",
    fonte: {
      nome: "Lei nº 12.527/2011, arts. 15 e 16 (recursos)",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm",
    },
    canal: {
      nome: "CGU (federal) e Tribunal de Contas e Ministério Público (estadual e municipal)",
      url: "https://www.gov.br/cgu/pt-br/assuntos/transparencia-publica/lai",
    },
    dica: "Cite o número do protocolo e a data. Explique, em uma frase, por que a resposta foi insuficiente.",
    corpo: [
      "Ao(À) [NOME DO ÓRGÃO],",
      "",
      "Solicito reconsideração da resposta ao pedido de acesso à informação protocolado em [DATA], sob o protocolo [NÚMERO], com base no art. 15 da Lei nº 12.527/2011.",
      "",
      "Motivo do recurso: [explique por que a resposta foi negada ou insuficiente].",
      "",
      "Peço que a informação seja fornecida no formato [planilha / PDF / texto].",
      "",
      "Se a negativa persistir, recorrerei às instâncias seguintes:",
      "- órgão federal: Controladoria-Geral da União (CGU);",
      "- órgão estadual ou municipal: Tribunal de Contas e Ministério Público.",
      "",
      "Solicitante: [SEU NOME]",
      "Contato: [E-MAIL E TELEFONE]",
      "Data: [DD/MM/AAAA]",
    ].join("\n"),
  },
  {
    id: "pedido-compras",
    titulo: "Pedido de contratos e empenhos de compras públicas",
    categoria: "Transparência",
    descricao: "Peça a lista de contratos, empenhos e aditivos de uma prefeitura ou órgão, em planilha.",
    fonte: {
      nome: "Lei nº 14.133/2021 (Licitações) e Lei nº 12.527/2011 (LAI)",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm",
    },
    canal: {
      nome: "e-SIC do órgão — catálogo de 445 canais no portal",
      url: "/direitos-em-movimento/informacao",
    },
    dica: "Peça o CNPJ do fornecedor e o número de cada contrato: é o que permite cruzar com o PNCP.",
    corpo: [
      "Ao(À) [NOME DA PREFEITURA, CÂMARA OU ÓRGÃO], via e-SIC.",
      "",
      "Com base na Lei de Acesso à Informação (Lei nº 12.527/2011) e na Lei de Licitações (Lei nº 14.133/2021), solicito:",
      "",
      "1. Relação dos contratos firmados entre [MÊS/ANO] e [MÊS/ANO], com número, objeto, fornecedor (CNPJ), valor e vigência.",
      "2. Notas de empenho e ordens de pagamento desses contratos.",
      "3. [se houver] Termos aditivos e justificativas de dispensa ou inexigibilidade.",
      "",
      "Formato preferido: planilha (CSV ou XLSX).",
      "",
      "Solicitante: [SEU NOME]",
      "Contato: [E-MAIL E TELEFONE]",
      "Data: [DD/MM/AAAA]",
    ].join("\n"),
  },
  {
    id: "noticia-fato-mp",
    titulo: "Notícia de fato ao Ministério Público (dano ambiental)",
    categoria: "Meio ambiente",
    descricao: "Comunique ao MP um dano ambiental, com local, data, provas e quem é atingido.",
    fonte: {
      nome: "Lei nº 6.938/1981 (Política Nacional do Meio Ambiente) e CF, art. 129",
      url: "https://www.planalto.gov.br/ccivil_03/leis/l6938.htm",
    },
    canal: {
      nome: "Canais de denúncia e ouvidorias no portal",
      url: "/direitos-em-movimento/denuncia",
    },
    dica: "Anexe foto com data e local. Diga quem mora perto: isso mostra o dano à saúde e à vida.",
    corpo: [
      "Ao Ministério Público [ESTADUAL / FEDERAL],",
      "",
      "Venho noticiar fato que pode configurar dano ambiental, para as providências cabíveis (CF, art. 129, e Lei nº 6.938/1981).",
      "",
      "O que aconteceu: [descreva o fato, com data e local].",
      "Quem pode ser responsável: [empresa ou órgão, se souber].",
      "Como sei: [fotos, laudos, reportagens, documentos].",
      "Onde aconteceu: [endereço, município e coordenadas, se tiver].",
      "Quem é atingido: [moradores, trabalhadores, comunidade].",
      "",
      "Peço apuração e, se for o caso, ação civil pública.",
      "",
      "Anexos: [liste os arquivos].",
      "Noticiante: [SEU NOME]",
      "Contato: [E-MAIL E TELEFONE]",
      "Data: [DD/MM/AAAA]",
    ].join("\n"),
  },
  {
    id: "tarifa-social",
    titulo: "Pedido de tarifa social (energia e água)",
    categoria: "Direitos sociais",
    descricao: "Solicite o desconto na conta de luz e de água para famílias no Cadastro Único.",
    fonte: {
      nome: "Lei nº 12.212/2010 (Tarifa Social de Energia Elétrica)",
      url: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12212.htm",
    },
    canal: {
      nome: "ANEEL — Tarifa Social (e CRAS para o CadÚnico)",
      url: "https://www.gov.br/aneel/pt-br/assuntos/tarifas/tarifa-social",
    },
    dica: "Leve o comprovante do CadÚnico a uma agência. O desconto costuma entrar sozinho na fatura seguinte.",
    corpo: [
      "À [NOME DA DISTRIBUIDORA OU CONCESSIONÁRIA],",
      "",
      "Solicito a aplicação da Tarifa Social de [energia elétrica / água e saneamento] na unidade consumidora abaixo, com base na Lei nº 12.212/2010 e no Cadastro Único (CadÚnico).",
      "",
      "Titular: [NOME COMPLETO]",
      "CPF: [000.000.000-00]",
      "NIS (CadÚnico): [NÚMERO DO NIS]",
      "Endereço da unidade: [ENDEREÇO COMPLETO]",
      "Número da instalação ou matrícula: [NÚMERO]",
      "Telefone para contato: [TELEFONE]",
      "",
      "Declaro estar inscrito no CadÚnico e ter renda por pessoa de até meio salário mínimo.",
      "Anexo: [comprovante do CadÚnico / conta recente].",
      "",
      "Nome: [SEU NOME]",
      "Data: [DD/MM/AAAA]",
    ].join("\n"),
  },
];

/** Todas as categorias, na ordem de exibição. */
export const CATEGORIAS_MODELO: CategoriaModelo[] = [
  "Transparência",
  "Meio ambiente",
  "Direitos sociais",
];

/** Lista os modelos de uma categoria (ou todos, quando `categoria` é "todas"). */
export function listarModelos(categoria: CategoriaModelo | "todas" = "todas"): ModeloPronto[] {
  if (categoria === "todas") return MODELOS;
  return MODELOS.filter((m) => m.categoria === categoria);
}
