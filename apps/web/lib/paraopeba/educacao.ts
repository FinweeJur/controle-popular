// GERADO por scripts/extrair-educacao-paraopeba.mts — não editar à mão.
//
// Glossário e perguntas frequentes do painel-fonte do Paraopeba.
//
// ⚠️ O TEXTO É DA FONTE, NÃO NOSSO. Quem escreveu as definições e as respostas
// foi quem montou o painel; o Controle Popular só reexibe. A página tem de
// dizer isso — atribuir a nós a explicação de um caso em que somos observador
// seria assumir uma autoridade que não temos.
//
// A linha do tempo do painel (EDU_TIMELINE) NÃO entra aqui: o portal já tem 17
// marcos e o painel tem 12, porque o arquivo em disco é mais velho. Importar
// por cima apagaria cinco.

export interface Verbete {
  /** A sigla ou o termo, como o painel escreve. */
  termo: string;
  /** A definição, palavra por palavra da fonte. */
  definicao: string;
}

export interface Pergunta {
  pergunta: string;
  resposta: string;
}

export const GLOSSARIO_PARAOPEBA: Verbete[] = [
  {
    "termo": "NAE",
    "definicao": "Novo Auxílio Emergencial — benefício mensal pago pela Vale por ordem judicial do TJMG desde dezembro de 2025. Valor: R$ 133,1 mi/mês."
  },
  {
    "termo": "PTR",
    "definicao": "Programa de Transferência de Renda — programa previsto no Acordo de 2021, gerido pela FGV, encerrado em outubro de 2025."
  },
  {
    "termo": "PNAB",
    "definicao": "Política Nacional de Auxílio aos Atingidos por Barragens — Lei Federal 14.755/2023, base legal do NAE."
  },
  {
    "termo": "ADPF 1314",
    "definicao": "Ação no STF ajuizada pelo Ibram contestando as decisões do TJMG sobre o NAE. Rel: min. Gilmar Mendes."
  },
  {
    "termo": "TJMG",
    "definicao": "Tribunal de Justiça de Minas Gerais — instância que determinou e mantém o NAE. Decisão da 19ª Câmara Cível (5/3/2026)."
  },
  {
    "termo": "FGV",
    "definicao": "Fundação Getulio Vargas — entidade responsável pela operacionalização dos pagamentos do PTR e do NAE."
  },
  {
    "termo": "AGU",
    "definicao": "Advocacia-Geral da União — apresentou ao STF duas posições divergentes sobre o NAE em maio de 2026."
  },
  {
    "termo": "IJs",
    "definicao": "Instituições de Justiça — denominação coletiva de MPMG, MPF e DPMG, signatários do Acordo de Reparação de 2021."
  },
  {
    "termo": "ATIs",
    "definicao": "Assessorias Técnicas Independentes — AEDAS, NACAB e Guaicuy, eleitas pelas comunidades atingidas para assessorar nos processos de reparação."
  },
  {
    "termo": "Ibram",
    "definicao": "Instituto Brasileiro de Mineração — entidade do setor mineral que ajuizou a ADPF 1314 no STF contra o NAE."
  },
  {
    "termo": "MAB",
    "definicao": "Movimento dos Atingidos por Barragens — principal organização de mobilização das comunidades. As ações civis foram movidas por associações parceiras do MAB."
  },
  {
    "termo": "IAC 18",
    "definicao": "Incidente de Assunção de Competência no STJ que discute se o Termo de Compromisso da DPMG com a Vale pode ser usado como título executivo pelas vítimas."
  },
  {
    "termo": "ERSHRE",
    "definicao": "Estudo de Avaliação de Risco à Saúde Humana e Risco Ecológico — estudo técnico previsto no Acordo sobre contaminação por rejeitos na Bacia do Paraopeba."
  },
  {
    "termo": "Bacia do Paraopeba",
    "definicao": "Região do Rio Paraopeba atingida pelos rejeitos — 36 municípios com beneficiários do NAE. Inclui a Represa de Três Marias."
  },
  {
    "termo": "B1",
    "definicao": "Barragem número 1 da Mina Córrego do Feijão que rompeu em 25/01/2019. Liberou mais de 10 milhões m³ de lama de rejeitos."
  }
];

export const PERGUNTAS_PARAOPEBA: Pergunta[] = [
  {
    "pergunta": "O que é o Novo Auxílio Emergencial (NAE)?",
    "resposta": "É o benefício mensal pago pela Vale, por ordem judicial, às pessoas atingidas pelo rompimento da barragem B1 em Brumadinho. Tem valor de R$ 133,1 milhões mensais no total (equivalente a 1 salário mínimo por adulto da chamada 'zona quente' e valores menores para outras categorias). É operacionalizado pela FGV e foi criado por decisão do TJMG em novembro de 2025, com base na Lei 14.755/2023 (PNAB)."
  },
  {
    "pergunta": "Quem tem direito ao NAE?",
    "resposta": "Pessoas cadastradas como atingidas pelo rompimento na Bacia do Paraopeba e entorno da Represa de Três Marias. O cadastro é gerido pela FGV. São aproximadamente 160 mil a 164 mil beneficiários ativos, distribuídos em 36 municípios."
  },
  {
    "pergunta": "O NAE é o mesmo que o PTR?",
    "resposta": "Não. O PTR (Programa de Transferência de Renda) era um benefício previsto no Acordo Judicial de Reparação de 2021 e foi encerrado em outubro de 2025. O NAE é um direito autônomo, criado com base na PNAB — lei posterior ao Acordo —, que reconhece os danos como ainda em curso. O TJMG entendeu que o Acordo não encerrou as obrigações da Vale sobre danos futuros e supervenientes."
  },
  {
    "pergunta": "O que é a PNAB?",
    "resposta": "É a Lei Federal 14.755/2023 (Política Nacional de Auxílio aos Atingidos por Barragens). Aprovada pelo Congresso depois dos desastres de Mariana (2015) e Brumadinho (2019), garante auxílio emergencial às pessoas atingidas por rompimentos até que atinjam condições equivalentes às anteriores ao desastre. Em 2023, o presidente Lula vetou o trecho que autorizava aplicação da lei a casos anteriores a ela — veto que é central no debate da ADPF 1314 no STF."
  },
  {
    "pergunta": "O que é a ADPF 1314?",
    "resposta": "É a Arguição de Descumprimento de Preceito Fundamental ajuizada pelo Ibram (Instituto Brasileiro de Mineração) no STF em 8 de abril de 2026. Pede a suspensão das decisões do TJMG que obrigam a Vale a pagar o NAE, argumentando que a PNAB não pode retroagir para alcançar situações anteriores à lei. O ministro relator é Gilmar Mendes."
  },
  {
    "pergunta": "O STF pode suspender os pagamentos?",
    "resposta": "Sim, se conceder a liminar pedida pelo Ibram. Por enquanto, o ministro Gilmar Mendes solicitou manifestações da AGU, do TJMG e da PGR antes de decidir. Enquanto não há decisão do STF, os pagamentos mensais continuam por força das decisões do TJMG."
  },
  {
    "pergunta": "Por que a AGU tem duas posições diferentes?",
    "resposta": "Em 7 de maio de 2026, o setor de Contencioso da AGU defendeu a manutenção do NAE, reconhecendo a aplicabilidade da PNAB a danos em curso. Em 14 de maio, a Consultoria-Geral da União, a pedido da Presidência da República, enviou posição contrária, defendendo a irretroatividade absoluta da PNAB — em linha com o veto de Lula à lei em 2023. A contradição gerou insegurança jurídica e repercussão nacional."
  },
  {
    "pergunta": "Quanto foi pago no total pela Vale desde o rompimento?",
    "resposta": "Até maio de 2026, a Vale pagou cerca de R$ 6,8 bilhões em auxílios emergenciais: R$ 2,4 bilhões no período 2019–2021 (antes do Acordo), R$ 4,4 bilhões via PTR entre 2021 e 2025, e cerca de R$ 789 milhões nos primeiros seis meses do NAE (dezembro de 2025 a maio de 2026). Isso representa menos de 20% do valor total do Acordo de Reparação (R$ 37,6 bilhões)."
  },
  {
    "pergunta": "Qual a situação da ação penal?",
    "resposta": "A ação penal por 270 homicídios qualificados e crimes ambientais tramita na Justiça Estadual de MG, por decisão do STF (min. Fachin, 2022). Os réus são 11 funcionários da Vale e 5 da empresa alemã Tüv Süd. Em 2024, o TRF-6 concedeu habeas corpus ao ex-presidente da Vale Fábio Schvartsman, excluindo-o da ação. O MPF recorreu ao STJ. Em 2026, a instrução criminal avança com dezenas de audiências previstas."
  }
];
