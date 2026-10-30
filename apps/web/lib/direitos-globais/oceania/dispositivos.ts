/**
 * @file apps/web/lib/direitos-globais/oceania/dispositivos.ts
 * @description Dispositivos constitucionais concretos e auditoria de lacunas da Oceania.
 *
 * Fontes primárias:
 * - Constitute Project (constituteproject.org)
 * - Legislation.gov.uk / Pacific Islands Legal Information Institute (PacLII)
 * - New Zealand Legislation (legislation.govt.nz) e Waitangi Tribunal
 * - Diários Oficiais e Legislações Nacionais (Tuvalu, Vanuatu, Fiji, Papua-Nova Guiné, etc.)
 *
 * Foco temático:
 * Povos originários, terras consuetudinárias tradicionais, salvaguardas climáticas e soberania insular.
 * Regra editorial: Textos transcritos na íntegra (verbatim), sem resumos.
 */

import type { Dispositivo } from "../tipos";
import { PAISES_OCEANIA } from "./paises";

export const DISPOSITIVOS_OCEANIA: readonly Dispositivo[] = [
  // Austrália
  {
    pais: "Austrália",
    tipo: "humanos",
    citacao: "Section 116",
    titulo: "Commonwealth not to legislate in respect of religion",
    texto: "The Commonwealth shall not make any law for establishing any religion, or for imposing any religious observance, or for prohibiting the free exercise of any religion, and no religious test shall be required as a qualification for any office or public trust under the Commonwealth.",
    fonte: "Constitute Project / Commonwealth of Australia Constitution Act",
    url: "https://www.constituteproject.org/constitution/Australia_1985",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "A Commonwealth não fará qualquer lei para estabelecer qualquer religião, ou para impor qualquer observância religiosa, ou para proibir o livre exercício de qualquer religião, e nenhum teste religioso será exigido como qualificação para qualquer cargo ou confiança pública sob a Commonwealth.",
  },
  {
    pais: "Austrália",
    tipo: "terra_territorio",
    citacao: "Section 51(xxxi)",
    titulo: "Acquisition of property on just terms",
    texto: "The Parliament shall, subject to this Constitution, have power to make laws for the peace, order, and good government of the Commonwealth with respect to: ... (xxxi) the acquisition of property on just terms from any State or person for any purpose in respect of which the Parliament has power to make laws;",
    fonte: "Constitute Project / Commonwealth of Australia Constitution Act",
    url: "https://www.constituteproject.org/constitution/Australia_1985",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "O Parlamento terá, sujeito a esta Constituição, poder para fazer leis para a paz, ordem e bom governo da Commonwealth com respeito a: ... (xxxi) a aquisição de propriedade em termos justos de qualquer Estado ou pessoa para qualquer finalidade relativamente à qual o Parlamento tenha poder de fazer leis;",
  },
  {
    pais: "Austrália",
    tipo: "humanos",
    citacao: "nao_encontrado",
    titulo: "Ausência de Declaração Constitucional de Direitos (Bill of Rights)",
    texto: "A Constituição da Commonwealth da Austrália (Commonwealth of Australia Constitution Act 1900) não contempla um catálogo sistemático de direitos fundamentais (Bill of Rights). Com exceção de garantias esparsas específicas (liberdade religiosa na Seção 116, aquisição de propriedade em termos justos na Seção 51(xxxi) e direito a júri na Seção 80), a proteção de direitos fundamentais na Austrália assenta-se no common law, na doutrina jurisprudencial da High Court sobre liberdades implícitas (como a liberdade de comunicação política) e na legislação estatutária federal antidiscriminatória (Racial Discrimination Act 1975, Sex Discrimination Act 1984, Disability Discrimination Act 1992).",
    fonte: "Parliament of Australia / High Court of Australia",
    url: "https://www.aph.gov.au/About_Parliament/Senate/Powers_practice_n_procedures/Constitution",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    lacuna: "Inexistência de catálogo constitucional sistemático de direitos fundamentais na Constituição australiana de 1900.",
  },

  // Nova Zelândia
  {
    pais: "Nova Zelândia",
    tipo: "humanos",
    citacao: "Section 8",
    titulo: "Right not to be deprived of life",
    texto: "No one shall be deprived of life except on such grounds as are established by law and are consistent with the principles of fundamental justice.",
    fonte: "New Zealand Legislation (legislation.govt.nz)",
    url: "https://www.legislation.govt.nz/act/public/1990/0109/latest/DLM224792.html",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Ninguém será privado da vida, exceto por motivos estabelecidos por lei e consistentes com os princípios de justiça fundamental.",
  },
  {
    pais: "Nova Zelândia",
    tipo: "humanos",
    citacao: "Section 19",
    titulo: "Freedom from discrimination",
    texto: "(1) Everyone has the right to freedom from discrimination on the grounds of discrimination in the Human Rights Act 1993.\n(2) Measures taken in good faith for the purpose of assisting or advancing persons or groups of persons disadvantaged because of discrimination that is unlawful by virtue of Part 2 of the Human Rights Act 1993 do not constitute discrimination.",
    fonte: "New Zealand Legislation (legislation.govt.nz)",
    url: "https://www.legislation.govt.nz/act/public/1990/0109/latest/DLM224810.html",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "(1) Toda pessoa tem o direito de não sofrer discriminação com base nos motivos de discriminação do Human Rights Act 1993.\n(2) Medidas tomadas de boa-fé com o propósito de assistir ou promover pessoas ou grupos desfavorecidos em razão de discriminação ilegal não configuram discriminação.",
  },
  {
    pais: "Nova Zelândia",
    tipo: "indigenas",
    citacao: "Article 2",
    titulo: "Treaty of Waitangi / Te Tiriti o Waitangi – Protection of Maori lands, forests and taonga",
    texto: "Her Majesty the Queen of England confirms and guarantees to the Chiefs and Tribes of New Zealand and to the respective families and individuals thereof the full exclusive and undisturbed possession of their Lands and Estates Forests Fisheries and other properties which they may collectively or individually possess so long as it is their wish and desire to retain the same in their possession; but the Chiefs of the United Tribes and the individual Chiefs yield to Her Majesty the exclusive right of Preemption over such lands as the proprietors thereof may be disposed to alienate at such prices as may be agreed upon between the respective Proprietors and persons appointed by Her Majesty to treat with them in that behalf.",
    fonte: "Waitangi Tribunal / New Zealand Ministry of Justice",
    url: "https://www.waitangitribunal.govt.nz/treaty-of-waitangi/translation-of-te-tiriti/",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Sua Majestade a Rainha da Inglaterra confirma e garante aos Chefes e Tribos da Nova Zelândia e às respectivas famílias e indivíduos a posse plena, exclusiva e imperturbada de suas Terras e Propriedades, Florestas, Pescarias e outros bens que possam possuir coletiva ou individualmente...",
  },

  // Fiji
  {
    pais: "Fiji",
    tipo: "ambiental",
    citacao: "Article 40",
    titulo: "Environmental rights",
    texto: "(1) Every person has the right to a clean and healthy environment, which includes the right to have the natural world protected for the benefit of present and future generations through legislative and other measures.\n(2) To the extent that it is necessary, a law or an administrative action taken under a law may limit, or may authorise the limitation of, the rights set out in this section.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Fiji_2013",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Toda pessoa tem direito a um meio ambiente limpo e saudável, o que inclui o direito de ter o mundo natural protegido em benefício das gerações presentes e futuras por meio de medidas legislativas e outras.",
  },

  // Papua-Nova Guiné
  {
    pais: "Papua-Nova Guiné",
    tipo: "ambiental",
    citacao: "National Goals, Goal 4",
    titulo: "Natural resources and environment",
    texto: "We declare our fourth goal to be for Papua New Guinea's natural resources and environment to be conserved and used for the collective benefit of us all, and be replenished for the benefit of future generations.\nWE ACCORDINGLY CALL FOR—\n(1) wise use to be made of our natural resources and the environment in and on the land, and in the sea and the seabed, in the way of conservation and replenishment by all reasonable means, and of the proper and non-wasteful use of those resources; and\n(2) the conservation and replenishment of our natural resources and the environment for the benefit of future generations of Papua New Guineans; and\n(3) the balance and well-being of our environment to be taken into account in the making of all decisions for our development; and\n(4) the conservation of the cultural, cultural and natural heritage of Papua New Guinea to be a positive part of our development.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Papua_New_Guinea_2016",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Declaramos como nosso quarto objetivo que os recursos naturais e o meio ambiente de Papua-Nova Guiné sejam conservados e usados para o benefício coletivo de todos nós e repostos em benefício das futuras gerações...",
  },
  {
    pais: "Papua-Nova Guiné",
    tipo: "indigenas",
    citacao: "Section 53",
    titulo: "Protection from unjust deprivation of property and customary land",
    texto: "(1) Subject to Section 54 (special provision in relation to certain lands) and to subsection (2), no property may be compulsorily taken possession of, and no interest in or right over property may be compulsorily acquired, except in accordance with an Organic Law or an Act of the Parliament...\n(5) In this section, \"property\" includes customary land and any interest in customary land.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Papua_New_Guinea_2016",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Nenhuma propriedade poderá ser apossada compulsoriamente, e nenhum interesse ou direito sobre propriedade poderá ser adquirido de forma compulsória, exceto de acordo com Lei Orgânica ou Lei do Parlamento... Nesta seção, 'propriedade' inclui terras consuetudinárias e qualquer interesse em terras consuetudinárias.",
  },

  // Vanuatu
  {
    pais: "Vanuatu",
    tipo: "indigenas",
    citacao: "Article 73",
    titulo: "Land belongs to indigenous custom owners",
    texto: "All land in the Republic of Vanuatu belongs to the indigenous custom owners and their descendants.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Vanuatu_1983",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Toda a terra na República de Vanuatu pertence aos proprietários consuetudinários indígenas e seus descendentes.",
  },

  // Palau
  {
    pais: "Palau",
    tipo: "ambiental",
    citacao: "Article VI",
    titulo: "National Resources and Environmental Protection",
    texto: "The national government shall take positive action to conserve the beautiful, healthful and resourceful natural environment, including the ground and water resources, and to protect the diversity and integrity of the domestic flora and fauna and other natural resources in Palau for present and future generations.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Palau_1981",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "O governo nacional tomará medidas positivas para conservar o ambiente natural belo, saudável e abundante, incluindo os recursos hídricos e terrestres, e proteger a diversidade e a integridade da flora e fauna domésticas e outros recursos naturais em Palau para as presentes e futuras gerações.",
  },

  // Tuvalu
  {
    pais: "Tuvalu",
    tipo: "ambiental",
    citacao: "Principles, Section 2(4)",
    titulo: "Perpetual Statehood and Maritime Boundaries Amid Climate Change",
    texto: "The State of Tuvalu within its historical, cultural, and legal framework shall remain in perpetuity in the future, notwithstanding the impacts of climate change or other causes that result in any change to the physical territory, land territory, or maritime boundaries of Tuvalu.",
    fonte: "Government of Tuvalu / Constitution of Tuvalu Act 2023",
    url: "https://tuvalu-legislation.tv/",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "O Estado de Tuvalu em sua estrutura histórica, cultural e jurídica permanecerá em perpetuidade no futuro, a despeito dos impactos da mudança climática ou de outras causas que resultem em qualquer alteração no território físico, terrestre ou nas fronteiras marítimas de Tuvalu.",
  },

  // Kiribati
  {
    pais: "Kiribati",
    tipo: "ambiental",
    citacao: "Preamble & Section 3",
    titulo: "Protection of natural environment and fundamental territorial rights",
    texto: "We the people of Kiribati, with respect for our cherished traditions and values, declare that we shall cherish and uphold the human dignity and protect the natural environment and resources of our islands for this and future generations. Whereas every person in Kiribati is entitled to the fundamental rights and freedoms of the individual, that is to say, the right, whatever his race, place of origin, political opinions, colour, creed or sex, but subject to respect for the rights and freedoms of others and for the public interest, to each and all of the following, namely: life, liberty, security of the person and the protection of the law; freedom of conscience, of expression and of assembly and association; and protection for the privacy of his home and other property and from deprivation of property without compensation.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Kiribati_2013",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Nós, o povo de Kiribati, com respeito às nossas estimadas tradições e valores, declaramos que prezaremos e sustentaremos a dignidade humana e protegeremos o meio ambiente e os recursos naturais de nossas ilhas para esta e as futuras gerações...",
  },

  // Demais países com em_coleta: true e lacuna detalhada:
  {
    pais: "Samoa",
    tipo: "terra_territorio",
    citacao: "em_coleta",
    titulo: "Proteção constitucional de terras consuetudinárias e salvaguarda costeira",
    texto: "O mapeamento dos dispositivos da Constituição de 1962 de Samoa sobre o domínio fundiário consuetudinário (Ali'i e Faipule) e as normas de adaptação costeira está registrado como lacuna para posterior auditoria documental.",
    fonte: "Constitute Project / PacLII",
    url: "https://www.constituteproject.org/constitution/Samoa_2017",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    em_coleta: true,
    lacuna: "Dispositivos constitucionais de Samoa sobre posse tradicional de terras consuetudinárias e preservação ambiental insular em fase de conferência primária.",
  },
  {
    pais: "Tonga",
    tipo: "terra_territorio",
    citacao: "em_coleta",
    titulo: "Regime fundiário da Coroa e integridade das ilhas",
    texto: "O levantamento sistemático dos dispositivos da Constituição de 1875 de Tonga referentes à inalienabilidade de terras a estrangeiros e salvaguarda marinha está registrado como lacuna para consolidação jurídica.",
    fonte: "Constitute Project / PacLII",
    url: "https://www.constituteproject.org/constitution/Tonga_2016",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    em_coleta: true,
    lacuna: "Dispositivos constitucionais do Reino de Tonga referentes ao regime fundiário da Coroa e soberania das ilhas em fase de ingestão primária.",
  },
  {
    pais: "Ilhas Salomão",
    tipo: "terra_territorio",
    citacao: "em_coleta",
    titulo: "Posse consuetudinária de terras indígenas e resiliência climática",
    texto: "O mapeamento dos dispositivos da Constituição de 1978 das Ilhas Salomão relativos à titularidade consuetudinária e proteção contra erosão marinha extrema está catalogado como lacuna em coleta.",
    fonte: "Constitute Project / PacLII",
    url: "https://www.constituteproject.org/constitution/Solomon_Islands_2018",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    em_coleta: true,
    lacuna: "Dispositivos constitucionais das Ilhas Salomão sobre posse consuetudinária de terras indígenas e proteção contra eventos climáticos extremos em fase de coleta primária.",
  },
  {
    pais: "Micronésia",
    tipo: "ambiental",
    citacao: "em_coleta",
    titulo: "Direitos marinhos estaduais e adaptação às alterações climáticas",
    texto: "A auditoria detalhada dos dispositivos da Constituição dos Estados Federados da Micronésia de 1979 referentes a recursos marinhos da zona econômica exclusiva e integridade territorial está registrada como lacuna.",
    fonte: "Constitute Project / PacLII",
    url: "https://www.constituteproject.org/constitution/Federated_States_of_Micronesia_1990",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    em_coleta: true,
    lacuna: "Dispositivos constitucionais da Micronésia referentes a águas marítimas e adaptação às alterações climáticas em fase de ingestão documental.",
  },
  {
    pais: "Ilhas Marshall",
    tipo: "ambiental",
    citacao: "em_coleta",
    titulo: "Salvaguardas ambientais, nucleares e resiliência climática dos atóis",
    texto: "O mapeamento dos artigos da Constituição de 1979 das Ilhas Marshall concernentes a reparações ambientais históricas e salvaguarda permanente dos atóis contra a subida do nível do mar está registrado como lacuna para verificação primária.",
    fonte: "Constitute Project / PacLII",
    url: "https://www.constituteproject.org/constitution/Marshall_Islands_1995",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    em_coleta: true,
    lacuna: "Dispositivos constitucionais das Ilhas Marshall sobre salvaguarda ambiental pós-testes nucleares e resiliência de atóis em fase de auditoria.",
  },
  {
    pais: "Nauru",
    tipo: "ambiental",
    citacao: "em_coleta",
    titulo: "Reabilitação ambiental e garantias fundamentais da população insular",
    texto: "O levantamento dos dispositivos da Constituição de 1968 de Nauru referentes a direitos fundamentais e deveres estatais de reabilitação territorial de áreas mineradas está catalogado como lacuna em andamento.",
    fonte: "Constitute Project / PacLII",
    url: "https://www.constituteproject.org/constitution/Nauru_2015",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    em_coleta: true,
    lacuna: "Dispositivos constitucionais de Nauru relativos à reabilitação ambiental de terras mineradas e garantias civis em fase de catalogação.",
  },
];

const PAISES_COM_DISPOSITIVO = new Set(DISPOSITIVOS_OCEANIA.map((d) => d.pais));

/**
 * Retorna todos os dispositivos e lacunas catalogados para os 14 países da Oceania.
 */
export function getDispositivosOceania(): readonly Dispositivo[] {
  const lista: Dispositivo[] = [...DISPOSITIVOS_OCEANIA];

  // Garante que qualquer país soberano da Oceania não listado expressamente receba lacuna de coleta
  for (const pais of PAISES_OCEANIA) {
    if (!PAISES_COM_DISPOSITIVO.has(pais.nome)) {
      lista.push({
        pais: pais.nome,
        tipo: "humanos",
        citacao: "em_coleta",
        titulo: "Levantamento constitucional em andamento",
        texto: `O mapeamento detalhado dos dispositivos constitucionais de ${pais.nome} está registrado como lacuna para posterior auditoria documental.`,
        fonte: "Constitute Project / PacLII",
        url: "https://www.constituteproject.org/",
        dataAcesso: "2026-10-30",
        em_coleta: true,
        lacuna: `Dispositivos constitucionais de ${pais.nome} em fase de ingestão primária.`,
      });
    }
  }

  return lista;
}
