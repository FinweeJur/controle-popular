/**
 * GERADO por `scripts/gerar-sintese-pericia.mts` a partir de
 * X:/DevCoder/_lote-ambiental/analise/sintese-final.md — não editar à mão; edite a fonte e rode o script de novo.
 *
 * A síntese cruza os 7 documentos de resultado da perícia da UFMG com os
 * eixos da auditoria AECOM e as notícias das ATIs. Passou por checagem em
 * duas camadas: cada resumo-fonte foi auditado individualmente (4 dos 7
 * ficaram com ressalva registrada, citada inline onde o número aparece), e a
 * síntese final foi auditada de novo contra o material de origem.
 */

export interface SintesePericia {
  titulo: string;
  /** "O que a perícia concluiu" — um item por parágrafo. */
  concluiu: string[];
  /** "Onde a perícia e a auditoria dizem a mesma coisa" — um item por achado. */
  mesmaCoisa: string[];
  /** "Onde divergem" — um item por ponto de tensão. */
  divergem: string[];
  /** "O que nenhuma das duas responde" — as lacunas que sobram dos dois acervos. */
  naoRespondem: string[];
  /** Nota final: quais documentos-fonte ficaram com ressalva de checagem. */
  observacaoDeMetodo: string;
}

export const SINTESE_PERICIA: SintesePericia = {
  titulo: "Perícia Judicial da UFMG e Auditoria AECOM: o que dizem juntas",
  concluiu: [
  "A perícia da UFMG mediu o tamanho do dano na população. Foram 30.674 entrevistas em domicílio, entre março e outubro de 2022, em 19 municípios. A partir delas, a perícia projeta impactos em cerca de 127 mil domicílios e 370 mil pessoas. O peso do dano não é igual em todo lugar: em Brumadinho e na calha do Rio Paraopeba, cerca de metade dos domicílios relatou impacto em pelo menos três categorias ao mesmo tempo; em Sarzedo e fora da calha, esse número cai para 10% e 17%. A checagem confirma que a contagem de Brumadinho ficou a 1.237 pessoas (3,2%) da população do Censo 2022 do IBGE, o que dá confiança ao tamanho da amostra.",
  "Os impactos mais relatados não são os que se imagina primeiro. Em Brumadinho, o campeão é turismo na região, com 87,5% dos domicílios, seguido de mobilidade e acesso urbano (78,2%) e saúde mental (75,7%). Em Sarzedo, saúde mental lidera com 94,6%. Na calha do rio, o que mais aparece é qualidade e uso dos corpos d'água, com 84,9% dos domicílios. Mesmo fora da calha, esse item atinge 66,5%.",
  "No ambiental, a perícia trata o rejeito como fonte de metais e metaloides: ferro, arsênio, bário, cádmio, cobalto, manganês, níquel, antimônio, chumbo e mercúrio. Em água superficial, o manganês aparece acima do recomendado em 57,8% das amostras, o ferro dissolvido em 41,8% e o alumínio dissolvido em 30,2%. Em sedimento, cromo (34,0%), níquel (31,4%) e arsênio (28,9%). Em água subterrânea, coliformes em 32,0% das amostras. Esses números vêm do documento ambiental, que passou por duas rodadas de checagem e ficou com uma ressalva: um item da lista de compostos orgânicos em água subterrânea recebeu nome que não confere com o texto original. O restante dos percentuais conferiu literalmente.",
  "Sobre alimento e animais, a perícia diz que os peixes do Paraopeba não estão adequados para consumo, principalmente para crianças, e que parte das amostras de órgãos de bovinos e aves estava imprópria pela legislação. Manganês em pelo apareceu em 98,5% dos bovinos e 73% dos equinos, sinal de exposição crônica. Este documento também carrega ressalva de checagem: ele atribui os achados ao rompimento da barragem B-I sem que o texto original faça essa ligação de forma explícita.",
  "Sobre saúde humana, a perícia é deliberadamente cautelosa. Ela afirma que existe risco potencial de doenças e agravos no médio e longo prazo, com atenção especial a crianças, gestantes e nutrizes, e alerta para possível comprometimento do neurodesenvolvimento infantil. Mas ela escreve com todas as letras que não é possível afirmar nem afastar contaminação individual, e recomenda um Inquérito de Saúde para responder a essa pergunta."
],
  mesmaCoisa: [
  "Água do rio contaminada por metais. A perícia registra manganês acima do recomendado em 57,8% das amostras de água superficial e ferro dissolvido em 41,8% (com a ressalva de checagem do documento ambiental). O eixo \"Qualidade da água do rio Paraopeba e sedimentos\" da auditoria acompanha o mesmo problema em cerca de 80 dos 337 relatórios, de 2020 a 2026, sobre uma pluma de 341,6 km. As duas descrevem um rio que continua sendo monitorado porque continua fora do padrão.",
  "Água subterrânea comprometida. A perícia mostra coliformes em 32,0% das amostras de poços e cisternas e turbidez em 15,0% (documento ambiental, com ressalva de checagem — ver observação de método ao final). O Guaicuy, em agosto de 2023, divulgou que 63,5% de 52 amostras de água subterrânea violavam limites legais. São recortes diferentes, mas apontam para o mesmo lugar.",
  "Abastecimento de água como problema central. Na perícia, fornecimento e qualidade da água aparece em 75% dos domicílios da calha do rio. Na auditoria, este é o eixo mais grave: a captação da COPASA, de 5 m³/s, nunca foi plenamente restabelecida, e metade das recomendações ainda abertas no relatório final se concentra nessa única obra.",
  "Risco à saúde reconhecido, resposta ainda não. A perícia diz \"risco potencial\" e pede Inquérito de Saúde. A auditoria descreve o eixo de saúde humana como farto em processo e pobre em resultado: 51 relatórios dedicados entre 2019 e 2024, sem conclusão. O painel de indicadores de 12/08/2026 mostra o estudo ERSHRE em 23% de avanço, com Fases II a IV em 0%.",
  "Peixes e fauna sob suspeita. A perícia detectou metais elevados em peixes e mercúrio de 500 µg/kg em 6,7% dos peixes de lagoas marginais (documento população animal e alimentos, com ressalva de checagem — ver observação de método ao final). A auditoria acompanha 23 pontos de amostragem de peixes na bacia e um \"Plano de Fauna\" que estava entre 40% e 61% de conclusão no fim de 2021."
],
  divergem: [
  "A divergência principal não é de número, é de recorte e de finalidade. A perícia mede o dano já ocorrido na população e no ambiente. A auditoria mede o andamento das obras e dos estudos de reparação. As duas quase nunca falam do mesmo objeto, e por isso os números raramente se contradizem: eles simplesmente não se encontram.",
  "Onde há tensão real:",
  "Tempo. A perícia fotografa 2019 a 2022 e conclui que o dano é amplo e mensurável. A auditoria mostra que, anos depois, a resposta segue em curso: sucessivos adiamentos empurraram o início da remoção do rejeito no \"anfiteatro\" da barragem B-I para 2026 e depois 2027, e o Plano de Manejo de Rejeito (versão de junho de 2025) fixa a conclusão da remoção para 2029 e a reparação completa da área para 2031. O dano foi medido muito antes de a reparação ser entregue.",
  "Saúde. A perícia recomenda um Inquérito de Saúde para responder se houve contaminação individual. O estudo que existia para isso, o ERSHRE, está em 23% de avanço, com as fases seguintes em zero. A recomendação da perícia não tem, hoje, instrumento à altura em execução.",
  "Escala do dano econômico. A perícia estima perda de R$ 8,9 bilhões a R$ 6,7 bilhões em Brumadinho sem o Acordo, e de R$ 5,4 bilhões a R$ 4,2 bilhões com ele (número do documento socioeconômico, que ficou com ressalva de checagem sobre citação truncada e atribuições sem lastro explícito). A auditoria não estima dano: ela conta recomendações e percentuais de obra. Não há como confrontar um valor com o outro.",
  "Aparente contradição interna da perícia, não entre acervos. O gasto per capita com Assistência Social subiu 31% nos 19 municípios (documento socioeconômico, com ressalva de checagem — ver observação de método ao final), mas o efeito vira nulo quando Brumadinho sai da conta. Vizinhos atingidos aparecem nos dados de impacto e desaparecem nos dados de resposta pública.",
  "Fora isso, não encontramos divergência numérica direta entre perícia e auditoria sobre o mesmo fato medido do mesmo jeito."
],
  naoRespondem: [
  "Se alguém foi contaminado. A perícia diz que não pode afirmar nem afastar. A auditoria acompanha um estudo que não chegou lá. Ninguém tem essa resposta.",
  "O que aconteceu depois de 2022 com a população. A grande pesquisa domiciliar tem data. Não há medição equivalente depois dela para dizer se os 370 mil indivíduos melhoraram, pioraram ou seguem iguais.",
  "Quando a água volta. A auditoria mostra a captação operando em 2 m³/s contra 5 m³/s de projeto, com atraso físico e pendência fundiária. Nenhum dos dois acervos apresenta uma data confiável de conclusão.",
  "Se a indenização corresponde ao dano medido. A perícia mede o dano; a auditoria mede a obra. Ninguém compara o que foi medido com o que foi pago. A pesquisa do NACAB, de 2023, aponta que 80% das ações individuais no TJMG terminaram desfavoráveis ou com indenização muito baixa, mas isso está fora dos dois acervos.",
  "Impacto nos municípios menores. Sarzedo e fora da calha aparecem com percentuais baixos de impacto multidimensional, mas com 94,6% de saúde mental em Sarzedo e 66,5% de problema com corpos d'água fora da calha. Nenhum dos dois acervos explica essa distância entre o indicador agregado e o indicador específico.",
  "Contaminação do ar ao longo do tempo. A perícia encontrou manganês, ferro e cobre mais concentrados perto da área de espalhamento, mas em campanhas pontuais. Não existe série longa de qualidade do ar em nenhum dos dois acervos."
],
  observacaoDeMetodo: "os documentos 2 (solo), 3 (ambiental), 4 (população animal e alimentos) e 6 (socioeconômico) passaram por duas rodadas de checagem e permanecem com ressalva registrada. Todo número deles usado acima traz a ressalva ao lado. Esta página descreve o que a perícia apurou e o que a auditoria acompanhou. Não antecipa nem substitui decisão judicial.",
};
