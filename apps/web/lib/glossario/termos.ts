/**
 * Glossário cívico — o "o que é isto" dos termos que o portal usa.
 *
 * ═══ O QUE É ═══
 *
 * Definições curtas, em português comum, dos termos técnicos que aparecem nas
 * páginas (licitação, TAC, cota-parte do ICMS, barragem a montante...). Cada
 * termo traz a fonte oficial quando existe.
 *
 * ═══ POR QUE EXISTE (Camada 2 do plano) ═══
 *
 * O portal publica dado oficial; sem o vocabulário, o dado não vira ação. A
 * doutrina da casa é do globo 3D: **explicação sempre visível, nunca só em
 * hover** — porque no celular não existe hover. Este módulo é a fonte única
 * das definições; a página `/glossario` mostra, e o dia em que um termo for
 * explicado no meio de um texto, ele sai daqui — sem duplicar a definição.
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

/** Termos do glossário, em ordem alfabética. */
export const TERMOS: TermoGlossario[] = [
  {
    id: "barragem-montante",
    termo: "Barragem a montante",
    definicao:
      "Barragem de rejeito construída com o próprio rejeito, degrau sobre degrau. É o método mais barato e o de menor margem de segurança.",
    fonte: { nome: "Painel de barragens do portal", url: "/ambiental/barragens" },
  },
  {
    id: "car",
    termo: "CAR (Cadastro Ambiental Rural)",
    definicao:
      "Registro da propriedade rural que diz os limites do imóvel e o que há dentro dele. É autodeclaratório: quem informa é o proprietário.",
    fonte: { nome: "Lei nº 12.651/2012", url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm" },
  },
  {
    id: "cfem",
    termo: "CFEM (royalty da mineração)",
    definicao:
      "Compensação financeira paga por quem extrai minério. Parte fica com o município onde a lavra acontece.",
    fonte: { nome: "Lei nº 8.001/1990", url: "https://www.planalto.gov.br/ccivil_03/leis/l8001.htm" },
  },
  {
    id: "condicionante",
    termo: "Condicionante ambiental",
    definicao:
      "Obrigação que a licença impõe ao empreendedor para reduzir ou reparar o impacto. Descumprir condicionante é irregularidade.",
  },
  {
    id: "cota-icms",
    termo: "Cota-parte do ICMS",
    definicao:
      "Fatia do imposto estadual sobre mercadorias que é repassada ao município. Como o estado divide essa fatia depende de critérios próprios.",
    fonte: { nome: "Lei Complementar nº 87/1996", url: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp87.htm" },
  },
  {
    id: "dispensa",
    termo: "Dispensa de licitação",
    definicao:
      "Casos em que a lei permite contratar sem disputa — por exemplo, compra de pequeno valor. Não é cheque em branco: tem teto e hipóteses fechadas.",
    fonte: { nome: "Lei nº 14.133/2021", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm" },
  },
  {
    id: "emenda-parlamentar",
    termo: "Emenda parlamentar",
    definicao:
      "Dinheiro que o deputado ou senador indica para um projeto ou município no orçamento. A execução depende do órgão que recebe o recurso.",
  },
  {
    id: "empenho",
    termo: "Empenho",
    definicao:
      "Primeiro passo do gasto público: o governo reserva dinheiro para pagar algo contratado. É a promessa de pagamento, não o pagamento.",
  },
  {
    id: "inexigibilidade",
    termo: "Inexigibilidade",
    definicao:
      "Contratação sem disputa porque só uma pessoa ou empresa pode fornecer aquilo — como um artista específico. Exige justificativa e tem limites.",
    fonte: { nome: "Lei nº 14.133/2021", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm" },
  },
  {
    id: "lai",
    termo: "LAI (Lei de Acesso à Informação)",
    definicao:
      "Lei nº 12.527/2011. Garante a qualquer pessoa pedir documentos públicos, de graça e sem justificar. O órgão responde em 20 dias.",
    fonte: { nome: "Lei nº 12.527/2011", url: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm" },
  },
  {
    id: "licitacao",
    termo: "Licitação",
    definicao:
      "Disputa pública que o poder público faz antes de comprar ou contratar, para escolher a proposta mais vantajosa. Regida pela Lei nº 14.133/2021.",
    fonte: { nome: "Lei nº 14.133/2021", url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm" },
  },
  {
    id: "pncp",
    termo: "PNCP (Portal Nacional de Contratações Públicas)",
    definicao:
      "Portal onde as contratações públicas do país ficam publicadas: editais, contratos e atas. É a fonte para cruzar compras por cidade.",
    fonte: { nome: "PNCP", url: "https://www.gov.br/pncp/pt-br" },
  },
  {
    id: "ppp",
    termo: "PPP (Parceria Público-Privada)",
    definicao:
      "Contrato em que a empresa privada constrói e opera um serviço público por anos, recebendo do governo. Vale por décadas — por isso o acompanhamento importa.",
    fonte: { nome: "Lei nº 11.079/2004", url: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l11079.htm" },
  },
  {
    id: "sigbm",
    termo: "SIGBM",
    definicao:
      "Sistema da ANM que reúne o cadastro e a situação das barragens de mineração do país. É a fonte dos dados de risco.",
    fonte: { nome: "Painel de barragens do portal", url: "/ambiental/barragens" },
  },
  {
    id: "tac",
    termo: "TAC (Termo de Ajustamento de Conduta)",
    definicao:
      "Acordo em que alguém assume obrigações para corrigir um dano, em geral firmado com o Ministério Público. Descumprir o TAC volta ao MP.",
  },
  {
    id: "zas",
    termo: "ZAS (Zona de Autossalvamento)",
    definicao:
      "Faixa perto da barragem onde as pessoas atingidas teriam pouco tempo para se salvar sozinhas. É a área mais crítica do plano de emergência.",
    fonte: { nome: "Painel de barragens do portal", url: "/ambiental/barragens" },
  },
];

/** Busca termos por texto, tolerante a acento e caixa. */
export function buscarTermos(consulta: string): TermoGlossario[] {
  const termo = semAcento(consulta.trim().toLowerCase());
  if (!termo) return TERMOS;
  return TERMOS.filter((t) =>
    semAcento(`${t.termo} ${t.definicao}`.toLowerCase()).includes(termo),
  );
}
