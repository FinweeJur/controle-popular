/**
 * Referências de movimento popular por eixo — MAB e Brasil de Fato.
 *
 * POR QUE EXISTE
 *
 * O mapa de navegação diz onde cada assunto mora no portal; faltava dizer quem
 * cobre esse assunto fora dele. Aqui entram só duas fontes, escolhidas pelo
 * vínculo com a luta: o MAB (Movimento dos Atingidos por Barragens), que é parte
 * interessada, e o Brasil de Fato, que cobre os mesmos territórios.
 *
 * REGRA DE OURO: nenhum link inventado. Cada URL foi verificada com resposta 200
 * em 08/11/2026. As do MAB vêm do RSS que o portal já coleta; as do Brasil de
 * Fato vêm do sitemap público (o robots.txt do site proíbe /search/ e ?s=, e a
 * coleta respeita isso).
 *
 * `eixos` usa o slug do mapa (`lib/navegacao/mapa.ts`). Eixo sem referência não
 * aparece — lacuna declarada, não link de enfeite.
 */

export type Veiculo = "MAB" | "Brasil de Fato";

export interface Referencia {
  veiculo: Veiculo;
  titulo: string;
  url: string;
  /** Por que esta matéria serve a este eixo. */
  nota?: string;
}

export const REFERENCIAS: Record<string, Referencia[]> = {
  casos: [
    {
      veiculo: "Brasil de Fato",
      titulo:
        "11 anos após o crime da Vale em Mariana-MG, atingidos cobram direitos e temem apagamento",
      url: "https://www.brasildefato.com.br/2026/11/05/11-anos-apos-o-crime-da-vale-em-mariana-mg-atingidos-cobram-direitos-e-temem-apagamento/",
      nota: "Rio Doce: o que os atingidos cobram hoje",
    },
    {
      veiculo: "Brasil de Fato",
      titulo:
        "Filha do Rio leva às telas perdas culturais do crime da Samarco em Mariana-MG",
      url: "https://www.brasildefato.com.br/2026/11/04/filha-do-rio-leva-as-telas-perdas-culturais-do-crime-da-samarco-em-mariana-mg-pelo-olhar-de-uma-menina/",
      nota: "dano cultural, o que a indenização não mede",
    },
    {
      veiculo: "Brasil de Fato",
      titulo: "Estudo detecta presença de metais na urina de crianças em Brumadinho",
      url: "https://www.brasildefato.com.br/2025/01/25/estudo-detecta-presenca-de-metais-na-urina-de-criancas-em-brumadinho/",
      nota: "Brumadinho: saúde depois da lama",
    },
  ],
  direitos: [
    {
      veiculo: "MAB",
      titulo:
        "Atingidos da Bacia do Paraopeba em luta pela continuidade do Auxílio Emergencial",
      url: "https://mab.org.br/2026/10/29/nota-atingidos-da-bacia-do-paraopeba-em-luta-pela-continuidade-do-auxilio-emergencial/",
      nota: "o auxílio na voz de quem recebe",
    },
    {
      veiculo: "Brasil de Fato",
      titulo: "Estudo detecta presença de metais na urina de crianças em Brumadinho",
      url: "https://www.brasildefato.com.br/2025/01/25/estudo-detecta-presenca-de-metais-na-urina-de-criancas-em-brumadinho/",
      nota: "saúde como direito violado",
    },
  ],
  "meio-ambiente": [
    {
      veiculo: "Brasil de Fato",
      titulo:
        "Espetáculo Zona de Sacrifício chega a Nova Lima-MG e debate os impactos da mineração",
      url: "https://www.brasildefato.com.br/2026/11/06/espetaculo-zona-de-sacrificio-chega-a-nova-lima-mg-e-debate-os-impactos-da-mineracao/",
      nota: "território sacrificado pela mineração",
    },
    {
      veiculo: "MAB",
      titulo:
        "Atingidos no Rio Madeira já sentem os efeitos do El Niño agravado pela crise climática",
      url: "https://mab.org.br/2026/10/16/atingidos-no-rio-madeira-ja-sentem-os-efeitos-do-el-nino-agravado-pela-crise-climatica/",
      nota: "barragem e clima no mesmo território",
    },
    {
      veiculo: "Brasil de Fato",
      titulo:
        "Governo define 27 minerais estratégicos para impulsionar a industrialização do Brasil",
      url: "https://www.brasildefato.com.br/2026/11/05/governo-define-27-minerais-estrategicos-para-impulsionar-a-industrializacao-do-brasil/",
      nota: "por que a mineração cresce onde a barragem está",
    },
  ],
  internacional: [
    {
      veiculo: "MAB",
      titulo:
        "MAB participa de jornada internacional em Genebra pelo avanço do Tratado dos Povos na ONU",
      url: "https://mab.org.br/2026/10/30/mab-participa-de-jornada-internacional-em-genebra-pelo-avanco-do-tratado-dos-povos-na-onu/",
      nota: "a luta dos atingidos na ONU",
    },
    {
      veiculo: "Brasil de Fato",
      titulo: "Mineração na África do Sul: o que sobra para o povo sul-africano",
      url: "https://www.brasildefato.com.br/especiais/especiais-mineracao-na-africa-do-sul-o-que-sobra-para-o-povo-sul-africano/",
      nota: "o mesmo padrão de mineração fora do Brasil",
    },
  ],
  justica: [
    {
      veiculo: "MAB",
      titulo:
        "MPMG declara Aedas para Assessoria Técnica a comunidades atingidas do Vale do Jequitinhonha",
      url: "https://mab.org.br/2026/10/28/mpmg-declara-aedas-para-assessoria-tecnica-a-comunidades-atingidas-do-vale-do-jequitinhonha/",
      nota: "quem assessora tecnicamente o atingido",
    },
  ],
};

export function referenciasDoEixo(slug: string): Referencia[] {
  return REFERENCIAS[slug] ?? [];
}
