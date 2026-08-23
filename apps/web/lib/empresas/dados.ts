export interface EmpresaMonitorada {
  slug: string;
  nome: string;
  nomeCurto: string;
  cnpj?: string;
  site?: string;
  descricao: string;
  municipiosPrioridade: string[];
  sinonimosSigmine: string[];
  linksUteis: { texto: string; href: string }[];
  notas: string[];
}

export const EMPRESAS: EmpresaMonitorada[] = [
  {
    slug: "sigma-lithium",
    nome: "Sigma Mineração S.A. / Sigma Lithium",
    nomeCurto: "Sigma Lithium",
    site: "https://sigmalithiumcorp.com/",
    descricao:
      "Empresa canadense que explora lítio no Vale do Jequitinhonha, principalmente nos municípios de Araçuaí e Itinga (MG). A operação é alvo de questionamentos ambientais, sociais e judiciais.",
    municipiosPrioridade: ["Araçuaí", "Itinga"],
    sinonimosSigmine: [
      "SIGMA MINERACAO S.A.",
      "BELO LITHIUM MINERACAO LTDA",
      "SIGMA LITHIUM",
    ],
    linksUteis: [
      {
        texto: "Processos na ANM (SIGMINE)",
        href: "https://app.anm.gov.br/SIGMINE/",
      },
      {
        texto: "Licenciamentos na FEAM",
        href: "https://sistemas.feam.mg.gov.br/licenciamentoambiental/",
      },
      {
        texto: "Contratos públicos (PNCP)",
        href: "https://pncp.gov.br/app/editais",
      },
      {
        texto: "Página de Araçuaí no portal",
        href: "/aracuai",
      },
      {
        texto: "Página de Itinga no portal",
        href: "/itinga",
      },
    ],
    notas: [
      "Em 2026 a FEAM suspendeu licenças de operação de cavas da Sigma Lithium em Araçuaí e Itinga.",
      "Os processos minerários históricos da empresa no Vale do Jequitinhonha incluem concessões de lavra de cassiterita, feldspato, petalita e espodumênio.",
    ],
  },
  {
    slug: "vale",
    nome: "Vale S.A.",
    nomeCurto: "Vale",
    cnpj: "33.592.510/0001-54",
    site: "https://www.vale.com/",
    descricao:
      "Uma das maiores mineradoras do mundo. No portal é acompanhada principalmente pelo acordo de reparação do rompimento da barragem da Mina Córrego do Feijão, em Brumadinho (MG).",
    municipiosPrioridade: ["Brumadinho", "Betim", "Sarzedo"],
    sinonimosSigmine: ["VALE S.A.", "VALE", "COMPANHIA VALE DO RIO DOCE"],
    linksUteis: [
      {
        texto: "Acordo de Reparação — Paraopeba",
        href: "/paraopeba",
      },
      {
        texto: "Processos na ANM (SIGMINE)",
        href: "https://app.anm.gov.br/SIGMINE/",
      },
      {
        texto: "Monitoramento da barragem (ANA/FEAM)",
        href: "/ambiental/barragens",
      },
    ],
    notas: [
      "O acompanhamento da Vale no portal está concentrado na frente Paraopeba e nos dados de barragens.",
      "Futuras versões devem incluir contratos públicos, convênios, licenciamentos e ações judiciais envolvendo a empresa.",
    ],
  },
];

export function obterEmpresa(slug: string): EmpresaMonitorada | undefined {
  return EMPRESAS.find((e) => e.slug === slug);
}
