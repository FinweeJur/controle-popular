/**
 * @file apps/web/lib/europa-litigios/legislacao.ts
 * @description Instrumentos que permitem responsabilizar empresas
 * transnacionais por danos causados no exterior.
 *
 * Fonte: páginas oficiais indicadas em cada item (legislação nacional,
 * EUR-Lex, Comissão Europeia, tribunais). Data de acesso: 2026-10-30.
 *
 * Regra: `status` só recebe "em_vigor" quando a fonte oficial foi lida.
 * Onde a fonte bloqueou acesso automatizado, o item fica "desconhecido" e a
 * observação diz o motivo. Não transformamos dúvida em afirmação.
 */

export type TipoInstrumento =
  | "jurisdicao"
  | "responsabilidade_civil"
  | "diligencia_devida"
  | "relatorio"
  | "penal";

export type StatusLegal =
  | "em_vigor"
  | "vigencia_futura"
  | "em_revisao"
  | "revogado"
  | "desconhecido";

export type RegiaoLegal = "europa" | "norte_global";

export interface CasoLegal {
  nome: string;
  citacao: string;
  ano: number;
  fonte: string;
}

export interface ItemLegislacao {
  id: string;
  pais: string;
  regiao: RegiaoLegal;
  instrumento: string;
  tipo: TipoInstrumento;
  oQuePermite: string;
  status: StatusLegal;
  entradaEmVigor: string | null;
  fonteOficial: string;
  observacao: string;
  casos: CasoLegal[];
}

export const LEGISLACAO: readonly ItemLegislacao[] = [
  {
    id: "uk-vedanta",
    pais: "Reino Unido",
    regiao: "europa",
    instrumento: "Vedanta Resources plc v Lungowe [2019] UKSC 20",
    tipo: "jurisdicao",
    oQuePermite:
      "Confirma que a matriz no Reino Unido pode ser demandada e que a subsidiária estrangeira pode ser trazida ao processo quando há questão séria a julgar contra a matriz. Não cria dever geral de diligência.",
    status: "em_vigor",
    entradaEmVigor: "2019-04-10",
    fonteOficial: "https://caselaw.nationalarchives.gov.uk/uksc/2019/20",
    observacao:
      "O dever de cuidado depende de controle efetivo ou de assunção de responsabilidade; não é automático.",
    casos: [
      {
        nome: "Vedanta Resources plc v Lungowe",
        citacao: "[2019] UKSC 20",
        ano: 2019,
        fonte: "https://caselaw.nationalarchives.gov.uk/uksc/2019/20",
      },
    ],
  },
  {
    id: "uk-okpabi",
    pais: "Reino Unido",
    regiao: "europa",
    instrumento: "Okpabi v Royal Dutch Shell plc [2021] UKSC 3",
    tipo: "jurisdicao",
    oQuePermite:
      "Reafirma que a existência do dever de cuidado da matriz é questão de mérito, não de jurisdição. Basta pretensão com real prospect de êxito para servir a subsidiária estrangeira.",
    status: "em_vigor",
    entradaEmVigor: "2021-02-12",
    fonteOficial: "https://caselaw.nationalarchives.gov.uk/uksc/2021/3",
    observacao:
      "Não consagra responsabilidade automática da matriz; devolve a análise ao primeiro grau.",
    casos: [
      {
        nome: "Okpabi and others v Royal Dutch Shell plc",
        citacao: "[2021] UKSC 3",
        ano: 2021,
        fonte: "https://caselaw.nationalarchives.gov.uk/uksc/2021/3",
      },
    ],
  },
  {
    id: "uk-mariana",
    pais: "Reino Unido",
    regiao: "europa",
    instrumento: "Município de Mariana v BHP Group [2025] EWHC 3001 (TCC)",
    tipo: "responsabilidade_civil",
    oQuePermite:
      "Aplicou o direito brasileiro e responsabilizou a BHP como poluidora e por culpa no rompimento de Fundão. Mostra que a justiça inglesa julga dano ambiental ocorrido no Brasil.",
    status: "em_vigor",
    entradaEmVigor: "2025-11-14",
    fonteOficial:
      "https://www.judiciary.uk/judgments/municipio-de-mariana-v-bhp-group-2/",
    observacao:
      "A responsabilidade foi decidida; a quantificação está marcada para abril de 2027.",
    casos: [
      {
        nome: "Município de Mariana v BHP Group",
        citacao: "[2025] EWHC 3001 (TCC)",
        ano: 2025,
        fonte:
          "https://www.judiciary.uk/judgments/municipio-de-mariana-v-bhp-group-2/",
      },
    ],
  },
  {
    id: "uk-cpr-6b",
    pais: "Reino Unido",
    regiao: "europa",
    instrumento: "CPR Practice Direction 6B — service out of the jurisdiction",
    tipo: "jurisdicao",
    oQuePermite:
      "Regula o serviço do processo fora da Inglaterra, inclusive o gateway de parte necessária ou própria, usado para trazer a subsidiária estrangeira ao processo.",
    status: "em_vigor",
    entradaEmVigor: null,
    fonteOficial:
      "https://www.justice.gov.uk/courts/procedure-rules/civil/rules/part06/pd_part06b",
    observacao:
      "É norma processual; não cria dever substantivo de diligência.",
    casos: [],
  },
  {
    id: "nl-6162",
    pais: "Países Baixos",
    regiao: "europa",
    instrumento: "Burgerlijk Wetboek, art. 6:162",
    tipo: "responsabilidade_civil",
    oQuePermite:
      "Funda a responsabilidade civil por ato ilícito, inclusive violação de dever legal ou do padrão de cuidado. Não há regra específica de responsabilidade da matriz; decide-se caso a caso.",
    status: "em_vigor",
    entradaEmVigor: "1992-01-01",
    fonteOficial: "https://wetten.overheid.nl/BWBR0005289/",
    observacao:
      "Aplica-se com o Regulamento Roma II, art. 7, para dano ambiental.",
    casos: [],
  },
  {
    id: "nl-braskem",
    pais: "Países Baixos",
    regiao: "europa",
    instrumento: "Braskem/Maceió — ECLI:NL:RBROT:2024:6662",
    tipo: "responsabilidade_civil",
    oQuePermite:
      "O Tribunal de Roterdã exerceu jurisdição e condenou a Braskem S.A. pelos danos do afundamento de Maceió, aplicando direito brasileiro. As filiais neerlandesas foram absolvidas.",
    status: "em_vigor",
    entradaEmVigor: "2024-07-24",
    fonteOficial:
      "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBROT:2024:6662",
    observacao:
      "O quantum foi remetido à schadestaatprocedure; há apelação.",
    casos: [
      {
        nome: "Braskem S.A. e filiais neerlandesas",
        citacao: "ECLI:NL:RBROT:2024:6662",
        ano: 2024,
        fonte:
          "https://uitspraken.rechtspraak.nl/details?id=ECLI:NL:RBROT:2024:6662",
      },
    ],
  },
  {
    id: "nl-kinderarbeid",
    pais: "Países Baixos",
    regiao: "europa",
    instrumento: "Wet zorgplicht kinderarbeid (dossiê 34506)",
    tipo: "diligencia_devida",
    oQuePermite:
      "Criaria dever de diligência para empresas que fornecem bens ou serviços ao mercado neerlandês, com investigação e plano contra trabalho infantil na cadeia.",
    status: "desconhecido",
    entradaEmVigor: null,
    fonteOficial: "https://zoek.officielebekendmakingen.nl/dossier/34506",
    observacao:
      "Aprovada no Senado em 2019, mas promulgação e vigência em 2026 não foram confirmadas em fonte acessível.",
    casos: [],
  },
  {
    id: "de-bgb",
    pais: "Alemanha",
    regiao: "europa",
    instrumento: "Bürgerliches Gesetzbuch (BGB), §§823, 826 e 831",
    tipo: "responsabilidade_civil",
    oQuePermite:
      "O §823 responsabiliza quem lesa vida, corpo, saúde, liberdade ou propriedade; o §826 alcança dano intencional contrário aos bons costumes; o §831 trata do empregador por ato do auxiliar.",
    status: "em_vigor",
    entradaEmVigor: "1900-01-01",
    fonteOficial: "https://www.gesetze-im-internet.de/bgb/__823.html",
    observacao:
      "Não há regra específica de responsabilidade da matriz; aplica-se a dogmática geral.",
    casos: [],
  },
  {
    id: "de-lksg",
    pais: "Alemanha",
    regiao: "europa",
    instrumento: "Lieferkettensorgfaltspflichtengesetz (LkSG), 2021",
    tipo: "diligencia_devida",
    oQuePermite:
      "Impõe análise de risco, prevenção, reparação e canal de denúncia para direitos humanos e ambiente no próprio negócio e nos fornecedores diretos. Prevê coimas e representação processual especial, mas não cria direito civil direto.",
    status: "em_vigor",
    entradaEmVigor: "2023-01-01",
    fonteOficial: "https://www.gesetze-im-internet.de/lksg/",
    observacao:
      "Limiar de 1.000 empregados desde 2024. O texto consolidado oficial segue disponível.",
    casos: [],
  },
  {
    id: "de-tuv",
    pais: "Alemanha",
    regiao: "europa",
    instrumento: "Brumadinho v TÜV SÜD — Landgericht München I",
    tipo: "responsabilidade_civil",
    oQuePermite:
      "Ação de mais de 1.400 atingidos e dos municípios de Brumadinho e Mário Campos contra a certificadora, com pedidos de R$ 3,2 bilhões. A lei material aplicada é a brasileira.",
    status: "em_vigor",
    entradaEmVigor: "2019-01-01",
    fonteOficial:
      "https://pogustgoodhead.com/caso-brumadinho-avanca-na-alemanha-com-inicio-de-audiencias-em-munique/",
    observacao:
      "Processo desde 2019; audiências em maio de 2026. Número do processo não localizado.",
    casos: [],
  },
  {
    id: "fr-vigilance",
    pais: "França",
    regiao: "europa",
    instrumento: "Loi n° 2017-399 — devoir de vigilance",
    tipo: "diligencia_devida",
    oQuePermite:
      "Cria dever de vigilância de grandes grupos sobre subsidiárias, subcontratantes e fornecedores, com plano e mecanismo de alerta. Permite responsabilização civil por descumprimento.",
    status: "desconhecido",
    entradaEmVigor: null,
    fonteOficial:
      "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000034294652/",
    observacao:
      "Legifrance bloqueou acesso automatizado; texto e estado em 2026 não reconferidos.",
    casos: [],
  },
  {
    id: "eu-csddd",
    pais: "União Europeia",
    regiao: "europa",
    instrumento: "Diretiva (UE) 2024/1760 — CSDDD",
    tipo: "diligencia_devida",
    oQuePermite:
      "Dever de diligência em direitos humanos e ambiente para grandes empresas da UE e de fora, com supervisão, coimas até 3% do faturamento mundial e direito a indenização integral.",
    status: "vigencia_futura",
    entradaEmVigor: "2024-07-25",
    fonteOficial:
      "https://commission.europa.eu/business-economy-euro/doing-business-eu/corporate-sustainability-due-diligence_en",
    observacao:
      "Omnibus I: Diretiva 2025/794 adiou datas e 2026/470 alterou o texto. Transposição até 26/07/2028; aplicação em 26/07/2029.",
    casos: [],
  },
  {
    id: "eu-csrd",
    pais: "União Europeia",
    regiao: "europa",
    instrumento: "Diretiva (UE) 2022/2464 — CSRD",
    tipo: "relatorio",
    oQuePermite:
      "Obriga grandes empresas e companhias listadas a publicar relatório de sustentabilidade com normas europeias e asseguração limitada. Não cria responsabilidade civil por dano no exterior.",
    status: "em_vigor",
    entradaEmVigor: "2023-01-05",
    fonteOficial:
      "https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en",
    observacao:
      "Primeira leva desde o exercício de 2024; ondas seguintes adiadas e reduzidas pelo Omnibus.",
    casos: [],
  },
  {
    id: "eu-eudr",
    pais: "União Europeia",
    regiao: "europa",
    instrumento: "Regulamento (UE) 2023/1115 — EUDR",
    tipo: "diligencia_devida",
    oQuePermite:
      "Exige diligência para demonstrar que commodities (soja, carne, madeira, cacau, café, óleo de palma, borracha) não vêm de desflorestação recente nem de degradação florestal.",
    status: "vigencia_futura",
    entradaEmVigor: "2023-06-29",
    fonteOficial:
      "https://environment.ec.europa.eu/topics/forests/deforestation/regulation-deforestation-free-products_en",
    observacao:
      "Aplicação em 30/12/2026 para médios e grandes; 30/06/2027 para micro e pequenos.",
    casos: [],
  },
  {
    id: "eu-roma2",
    pais: "União Europeia",
    regiao: "europa",
    instrumento: "Regulamento (CE) 864/2007 — Roma II, art. 7",
    tipo: "responsabilidade_civil",
    oQuePermite:
      "Determina a lei do país do dano ambiental, salvo opção do autor pela lei do local do fato gerador. Permite aplicar a lei brasileira em tribunal europeu.",
    status: "em_vigor",
    entradaEmVigor: "2009-01-11",
    fonteOficial: "https://eur-lex.europa.eu/eli/reg/2007/864/oj",
    observacao:
      "Aplica-se a fatos posteriores a 11/01/2009.",
    casos: [],
  },
  {
    id: "eu-crime",
    pais: "União Europeia",
    regiao: "europa",
    instrumento: "Diretiva (UE) 2024/1203 — Crimes ambientais",
    tipo: "penal",
    oQuePermite:
      "Define catálogo mínimo de crimes ambientais e sanções penais mais severas, com deveres de prevenção e cooperação. Não regula diretamente a responsabilidade civil transfronteiriça.",
    status: "em_vigor",
    entradaEmVigor: "2024-05-20",
    fonteOficial:
      "https://oeil.secure.europarl.europa.eu/oeil/popups/ficheprocedure.do?reference=2021/0422(COD)&l=en",
    observacao: "Transposição pelos Estados-Membros em 2026.",
    casos: [],
  },
  {
    id: "ch-964",
    pais: "Suíça",
    regiao: "europa",
    instrumento: "Código das Obrigações, art. 964j–964l",
    tipo: "diligencia_devida",
    oQuePermite:
      "Dever de diligência e declaração para empresas que colocam no mercado minerais de conflito ou produtos com risco de trabalho infantil.",
    status: "desconhecido",
    entradaEmVigor: null,
    fonteOficial: "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/en",
    observacao:
      "Fedlex exige JavaScript; texto e vigência não reconferidos.",
    casos: [],
  },
  {
    id: "no-transparency",
    pais: "Noruega",
    regiao: "europa",
    instrumento: "Transparency Act (Åpenhetsloven), LOV-2021-06-18-99",
    tipo: "diligencia_devida",
    oQuePermite:
      "Impõe due diligence em direitos humanos e trabalho decente e declaração de transparência acessível para empresas maiores e entidades públicas.",
    status: "desconhecido",
    entradaEmVigor: null,
    fonteOficial:
      "https://www.regjeringen.no/en/dokumenter/the-transparency-act/id2856807/",
    observacao:
      "Regjeringen bloqueou acesso; Lovdata proíbe coleta no robots. Vigência em 2026 não reconfirmada.",
    casos: [],
  },
  {
    id: "us-ats",
    pais: "Estados Unidos",
    regiao: "norte_global",
    instrumento: "Alien Tort Statute, 28 U.S.C. §1350",
    tipo: "jurisdicao",
    oQuePermite:
      "Dá competência às cortes federais para ações de estrangeiros por tortura ou violação do direito das gentes. É norma de competência, não estatuto substantivo autônomo.",
    status: "em_vigor",
    entradaEmVigor: "1948-06-25",
    fonteOficial:
      "https://www.govinfo.gov/content/pkg/USCODE-2023-title28/html/USCODE-2023-title28-partIV-chap85-sec1350.htm",
    observacao:
      "A mesma seção traz a nota do Torture Victim Protection Act.",
    casos: [],
  },
  {
    id: "us-kiobel",
    pais: "Estados Unidos",
    regiao: "norte_global",
    instrumento: "Kiobel v. Royal Dutch Petroleum, 569 U.S. 108 (2013)",
    tipo: "jurisdicao",
    oQuePermite:
      "Aplica a presunção contra extraterritorialidade: conduta fora dos EUA só entra com conexão suficientemente forte. Na prática, fecha o ATS para danos ocorridos no exterior.",
    status: "em_vigor",
    entradaEmVigor: "2013-04-17",
    fonteOficial:
      "https://www.supremecourt.gov/search.aspx?filename=/docketfiles/10-1491.htm",
    observacao: "Acórdão não reaberto nesta coleta; citação oficial.",
    casos: [
      {
        nome: "Kiobel v. Royal Dutch Petroleum Co.",
        citacao: "569 U.S. 108 (2013)",
        ano: 2013,
        fonte:
          "https://www.supremecourt.gov/search.aspx?filename=/docketfiles/10-1491.htm",
      },
    ],
  },
  {
    id: "us-jesner",
    pais: "Estados Unidos",
    regiao: "norte_global",
    instrumento: "Jesner v. Arab Bank, 138 S. Ct. 1843 (2018)",
    tipo: "jurisdicao",
    oQuePermite:
      "Confirmou que o ATS não permite demandar empresas estrangeiras como rés; extensão a corporações cabe ao Congresso.",
    status: "em_vigor",
    entradaEmVigor: "2018-04-24",
    fonteOficial:
      "https://www.supremecourt.gov/opinions/17pdf/16-499_1a7d.pdf",
    observacao: "Limita o ATS a pessoas e corporações norte-americanas.",
    casos: [
      {
        nome: "Jesner v. Arab Bank, PLC",
        citacao: "138 S. Ct. 1843 (2018)",
        ano: 2018,
        fonte:
          "https://www.supremecourt.gov/opinions/17pdf/16-499_1a7d.pdf",
      },
    ],
  },
  {
    id: "us-tvpa",
    pais: "Estados Unidos",
    regiao: "norte_global",
    instrumento: "Torture Victim Protection Act, 28 U.S.C. §1350 (nota)",
    tipo: "responsabilidade_civil",
    oQuePermite:
      "Ação civil contra indivíduos que pratiquem tortura ou execução extrajudicial sob autoridade de Estado estrangeiro, com esgotamento de recursos e prazo de 10 anos.",
    status: "em_vigor",
    entradaEmVigor: "1992-03-12",
    fonteOficial:
      "https://www.govinfo.gov/content/pkg/USCODE-2023-title28/html/USCODE-2023-title28-partIV-chap85-sec1350.htm",
    observacao: "Dirige-se a indivíduos, não a empresas.",
    casos: [],
  },
  {
    id: "ca-nevsun",
    pais: "Canadá",
    regiao: "norte_global",
    instrumento: "Nevsun Resources v. Araya, 2020 SCC 5",
    tipo: "responsabilidade_civil",
    oQuePermite:
      "A Supreme Court recusou extinguir pretensões baseadas em direito internacional consuetudinário, que integra o direito comum e pode fundamentar ação civil. Não houve decisão de mérito.",
    status: "em_vigor",
    entradaEmVigor: "2020-02-28",
    fonteOficial:
      "https://www.scc-csc.ca/case-dossier/info/sum-som-eng.aspx?cas=37919",
    observacao:
      "Não existe estatuto geral de responsabilidade de matrizes no Canadá.",
    casos: [
      {
        nome: "Nevsun Resources Ltd. v. Araya",
        citacao: "2020 SCC 5",
        ano: 2020,
        fonte:
          "https://www.scc-csc.ca/case-dossier/info/sum-som-eng.aspx?cas=37919",
      },
    ],
  },
  {
    id: "au-modern-slavery",
    pais: "Austrália",
    regiao: "norte_global",
    instrumento: "Modern Slavery Act 2018 (Cth)",
    tipo: "relatorio",
    oQuePermite:
      "Exige declaração anual de escravatura moderna, com riscos e medidas de mitigação nas operações e cadeias. Não cria direito de ação nem responsabilidade civil direta.",
    status: "em_vigor",
    entradaEmVigor: "2019-01-01",
    fonteOficial: "https://www.legislation.gov.au/C2018A00153/latest/text",
    observacao: "Regime de transparência e relatório.",
    casos: [],
  },
];

/** Rótulo curto do tipo, para a interface. */
export const ROTULO_TIPO: Record<TipoInstrumento, string> = {
  jurisdicao: "Jurisdição",
  responsabilidade_civil: "Responsabilidade civil",
  diligencia_devida: "Diligência devida",
  relatorio: "Relatório",
  penal: "Penal",
};

/** Rótulo curto do status. */
export const ROTULO_STATUS: Record<StatusLegal, string> = {
  em_vigor: "em vigor",
  vigencia_futura: "vigência futura",
  em_revisao: "em revisão",
  revogado: "revogado",
  desconhecido: "a confirmar",
};
