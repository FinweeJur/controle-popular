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

export const NOTICIAS_VALE: NoticiaMonitoramento[] = [
  {
    data: "2026-09-07",
    titulo: "Risco socioambiental significativo: barragens Forquilha III e Sul Superior em nível 3 de emergência (Análise IA — Seu Nono Sabia 7B)",
    veiculo: "Seu Nono Sabia (Análise IA)",
    href: "https://www.vale.com/dams",
    resumo:
      "A Vale S.A. enfrenta desafios significativos em ESG. Barragens Forquilha III e Sul Superior em nível 3 de emergência. Acordo Brumadinho de R$ 37,68 bilhões com 73,8% pagos em 26 municípios da Bacia do Paraopeba. Fonte: análise automática do Seu Nono Sabia 7B via Ollama sobre dados do portal ESG da Vale (vale.com/dams).",
  },
  {
    data: "2026-09-07",
    titulo: "Compromissos ambientais declarados: 100% energia renovável no Brasil, meta de redução de 70% de emissões até 2030 (Análise IA — Seu Nono Sabia 7B)",
    veiculo: "Seu Nono Sabia (Análise IA)",
    href: "https://www.vale.com/environment",
    resumo:
      "Vale mantém 100% de energia renovável no Brasil desde 2023. Meta de neutralidade carbono até 2050. Compromissos com biodiversidade e parques protegidos (Amazon Bio Park, Reserva Natural, Botanical Parks). Fonte: análise automática do Seu Nono Sabia 7B via Ollama sobre dados do portal ambiental da Vale.",
  },
  {
    data: "2026-09-07",
    titulo: "45 barragens a montante em MG: 21 concluídas, 24 pendentes de descaracterização até 2035 (Análise IA — Seu Nono Sabia 7B)",
    veiculo: "Seu Nono Sabia (Análise IA)",
    href: "https://www.vale.com/dams",
    resumo:
      "Programa de Descaracterização de Barragens A Montante da Vale: 21 estruturas concluídas e 24 pendentes. SIGBM/ANM monitora 45 barragens em Minas Gerais. Fonte: análise automática do Seu Nono Sabia 7B via Ollama sobre dados do portal ESG da Vale.",
  },
];

export const NOTICIAS_EMPRESAS = [...NOTICIAS_SIGMA_LITHIUM, ...NOTICIAS_VALE];
