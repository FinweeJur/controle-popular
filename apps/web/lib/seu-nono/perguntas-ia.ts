/**
 * @file perguntas-ia.ts
 * @description Perguntas sugeridas para o Seu Nonô, por rota.
 *
 * Pedido do dono (08/11/2026): cada página/eixo/subfrente ganha um cartão com
 * perguntas didáticas daquele tema; o clique abre o Seu Nonô e a pergunta vai
 * para a IA (RAG), que responde com fonte e ressalva.
 *
 * REGRA EDITORIAL: cada pergunta tem de ser respondível pelo acervo do portal
 * ou pela própria página — pergunta de propaganda ("qual a melhor cidade?")
 * não entra. O texto é curto e em linguagem de quem pergunta.
 */

export interface PerguntaSugerida {
  /** Rótulo curto do botão. */
  rotulo: string;
  /** Pergunta completa enviada ao assistente. */
  pergunta: string;
}

export const PERGUNTAS_POR_ROTA: Record<string, PerguntaSugerida[]> = {
  "/casos": [
    { rotulo: "O que houve em Brumadinho", pergunta: "O que aconteceu no rompimento de Brumadinho e o que já foi pago até hoje?" },
    { rotulo: "Rio Doce x Brumadinho", pergunta: "Como o acordo do Rio Doce se compara ao acordo de Brumadinho?" },
    { rotulo: "Processos criminais", pergunta: "Quais processos criminais correm por causa dos rompimentos em Minas?" },
    { rotulo: "Fiscalizar a reparação", pergunta: "Como posso fiscalizar a reparação do desastre na minha cidade?" },
    { rotulo: "Auxílio emergencial", pergunta: "Quem tem direito ao auxílio emergencial dos atingidos e como pedir?" },
  ],
  "/direitos": [
    { rotulo: "Qual direito me protege", pergunta: "Qual direito protege o meu caso e onde eu denuncio a violação?" },
    { rotulo: "Pedir informação (LAI)", pergunta: "Como pedir uma informação pública pela Lei de Acesso à Informação?" },
    { rotulo: "IDEB da minha cidade", pergunta: "Como consultar o IDEB e as escolas da minha cidade no portal?" },
    { rotulo: "Conselhos de direitos", pergunta: "Quais conselhos de direitos existem no meu município e como participar?" },
    { rotulo: "Ajuda jurídica gratuita", pergunta: "Onde encontro ajuda jurídica gratuita perto de mim?" },
  ],
  "/memoria": [
    { rotulo: "Lutas dos trabalhadores", pergunta: "Quais lutas marcaram a história dos trabalhadores no Brasil?" },
    { rotulo: "Greves e conquistas", pergunta: "Como a linha do tempo registra as greves e as conquistas de direitos?" },
    { rotulo: "Fontes de cada fato", pergunta: "Quais fontes sustentam cada fato da linha do tempo das lutas?" },
    { rotulo: "Lutas no meu estado", pergunta: "Quais lutas aconteceram no meu estado segundo o acervo?" },
  ],
  "/ambiental/direitos-humanos": [
    { rotulo: "O que o CNDH recomenda", pergunta: "O que o CNDH recomenda sobre populações atingidas por barragens?" },
    { rotulo: "Achar documento do CNDH", pergunta: "Como encontro um documento do CNDH por tema ou por ano?" },
    { rotulo: "CIDH e ONU sobre o Brasil", pergunta: "O que a CIDH e a ONU já disseram sobre direitos humanos no Brasil?" },
    { rotulo: "Onde denunciar violação", pergunta: "Onde denunciar uma violação de direitos humanos no Brasil?" },
  ],
  "/ambiental": [
    { rotulo: "Barragens em emergência", pergunta: "Quais barragens estão em emergência em Minas Gerais hoje?" },
    { rotulo: "Licenciamento no COPAM", pergunta: "Como funciona o licenciamento ambiental no COPAM e como acompanhar?" },
    { rotulo: "O que é um TAC", pergunta: "O que é um TAC ambiental e quem já assinou em Minas?" },
    { rotulo: "Nossos rios", pergunta: "Quais rios e bacias estão na coleção Nossos Rios do portal?" },
  ],
  "/cidades": [
    { rotulo: "Dados da minha cidade", pergunta: "Quais dados de contratos e orçamento existem para a minha cidade?" },
    { rotulo: "Cidades estratégicas", pergunta: "O que são as 203 cidades estratégicas monitoradas pelo portal?" },
    { rotulo: "Comparar municípios", pergunta: "Como comparar dois municípios nos indicadores do portal?" },
    { rotulo: "Contratos suspeitos", pergunta: "Como identificar um contrato público suspeito na minha cidade?" },
  ],
  "/congresso": [
    { rotulo: "Votações e direitos", pergunta: "Quais votações do Congresso afetam direitos sociais?" },
    { rotulo: "Proposições em risco", pergunta: "Quais proposições em tramitação ameaçam direitos?" },
    { rotulo: "Bancada de MG", pergunta: "Como consultar a atuação da bancada federal de Minas Gerais?" },
    { rotulo: "Como cobrar o deputado", pergunta: "Como cobrar o meu deputado sobre uma votação específica?" },
  ],
  "/estado-e-economia": [
    { rotulo: "Orçamento de MG", pergunta: "De onde vêm e para onde vão os recursos do orçamento de Minas?" },
    { rotulo: "Contratos e PPP", pergunta: "Como consultar contratos, concessões e PPP do governo?" },
    { rotulo: "Grandes empresas", pergunta: "Quais grandes empresas monitoradas têm contratos com o poder público?" },
    { rotulo: "Porta giratória", pergunta: "O que é a porta giratória entre governo e empresas no portal?" },
  ],
  "/judiciario": [
    { rotulo: "Tribunais e vagas", pergunta: "Como funcionam as vagas e aposentadorias nos tribunais?" },
    { rotulo: "Inspeções do CNJ", pergunta: "O que as inspeções do CNJ apontaram nas comarcas de Minas?" },
    { rotulo: "Contatos de varas", pergunta: "Como achar o contato e o endereço da vara da minha comarca?" },
    { rotulo: "Jurisprudência", pergunta: "O que a jurisprudência dos desastres já decidiu sobre indenização?" },
  ],
  "/internacional": [
    { rotulo: "Resoluções da ONU", pergunta: "Quais resoluções da ONU tratam de direitos humanos e meio ambiente?" },
    { rotulo: "Mineração no exterior", pergunta: "Como acompanhar processos de mineradoras brasileiras no exterior?" },
    { rotulo: "Litígios transnacionais", pergunta: "O que são os litígios transnacionais dos desastres brasileiros?" },
  ],
  "/paraopeba": [
    { rotulo: "Execução do acordo", pergunta: "Quanto do acordo de Brumadinho já foi pago e onde foi aplicado?" },
    { rotulo: "Linha do tempo", pergunta: "Quais foram os marcos do acordo de Brumadinho desde 2019?" },
    { rotulo: "Auxílio e indenização", pergunta: "Qual a diferença entre auxílio emergencial e indenização individual?" },
    { rotulo: "Obras de reparação", pergunta: "Como acompanhar as obras de reparação no Paraopeba?" },
  ],
  "/riodoce": [
    { rotulo: "O que houve em Fundão", pergunta: "O que aconteceu no rompimento de Fundão em 2015?" },
    { rotulo: "Repactuação de R$ 171 bi", pergunta: "Como funciona a repactuação do Rio Doce e o repasse para os municípios?" },
    { rotulo: "Processos no exterior", pergunta: "Quais processos sobre o Rio Doce correm no exterior?" },
  ],
};

/**
 * Perguntas da rota, com queda por prefixo: `/casos/brumadinho` herda
 * `/casos`; rota sem entrada devolve `[]` (o cartão não renderiza).
 */
export function perguntasDaRota(rota: string | null | undefined): PerguntaSugerida[] {
  if (!rota) return [];
  const limpa = rota.replace(/\/+$/, "") || "/";
  if (PERGUNTAS_POR_ROTA[limpa]) return PERGUNTAS_POR_ROTA[limpa];
  const partes = limpa.split("/").filter(Boolean);
  while (partes.length > 1) {
    partes.pop();
    const chave = `/${partes.join("/")}`;
    if (PERGUNTAS_POR_ROTA[chave]) return PERGUNTAS_POR_ROTA[chave];
  }
  return PERGUNTAS_POR_ROTA["/"] ?? [];
}
