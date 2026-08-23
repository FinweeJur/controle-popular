export interface NoticiaMonitoramento {
  data: string;
  titulo: string;
  veiculo: string;
  href: string;
  resumo: string;
}

export const NOTICIAS_SIGMA_LITHIUM: NoticiaMonitoramento[] = [
  {
    data: "2026-07-23",
    titulo: "Sigma deu informação falsa e operou no Jequitinhonha antes de autorização, revela Feam",
    veiculo: "Brasil de Fato",
    href: "https://www.brasildefato.com.br/2026/07/23/sigma-deu-informacao-falsa-e-operou-no-jequitinhonha-antes-de-autorizacao-revela-feam/",
    resumo:
      "A FEAM suspendeu as licenças de operação de duas cavas da Sigma Lithium e cancelou outras três licenças na região.",
  },
  {
    data: "2026-07-22",
    titulo: "Feam embarga operações da Sigma Lithium",
    veiculo: "O Fator",
    href: "https://ofator.com.br/informacao/feam-embarga-operacoes-da-sigma-lithium/",
    resumo:
      "A FEAM embargou as licenças de operação das duas cavas onde a Sigma Lithium extrai o mineral em Araçuaí e Itinga.",
  },
  {
    data: "2026-06-21",
    titulo: "Fundador da Sigma Lithium denuncia irregularidades e falta de segurança nas operações da mineradora em MG",
    veiculo: "Observatório da Mineração",
    href: "https://observatoriodamineracao.com.br/exclusivo-fundador-da-sigma-lithium-denuncia-irregularidades-e-falta-de-seguranca-nas-operacoes-da-mineradora-em-mg-anm-diz-que-acabou-o-dinheiro-para-fiscalizacao/",
    resumo:
      "Denúncia de irregularidades e falta de segurança nas operações; ANM afirma falta de recursos para fiscalização.",
  },
  {
    data: "2026-06-24",
    titulo: "A Sigma Lithium na geopolítica mundial do lítio",
    veiculo: "Brasil de Fato",
    href: "https://www.brasildefato.com.br/colunista/movimento-pela-soberania-popular-na-mineracao/2026/06/24/a-sigma-lithium-na-geopolitica-mundial-do-litio/",
    resumo:
      "Análise sobre a inserção da Sigma Lithium no mercado global de lítio e suas concessões no Vale do Jequitinhonha.",
  },
  {
    data: "2025-08-02",
    titulo: "Pesquisadores pedem paralisação da extração de lítio da Sigma no Vale do Jequitinhonha",
    veiculo: "Ciência, Política e Sociedade",
    href: "https://blogdopedlowski.com/2025/08/02/pesquisadores-pedem-paralisacao-da-extracao-de-litio-da-sigma-no-vale-do-jequitinhonha/",
    resumo:
      "Pesquisadores apontam fragmentação do licenciamento ambiental em múltiplos processos para contornar avaliações mais rigorosas.",
  },
];

export const NOTICIAS_VALE: NoticiaMonitoramento[] = [];
