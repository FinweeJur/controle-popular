/**
 * @file apps/web/lib/direitos-globais/asia/dispositivos.ts
 * @description Dispositivos constitucionais concretos e auditoria de lacunas na Ásia.
 *
 * Fontes primárias: Constitute Project (constituteproject.org) e Diários Oficiais.
 * Regra editorial: Textos transcritos na íntegra (verbatim), sem resumos.
 * Países em processo de coleta ou sem dispositivo constitucional expresso são
 * registrados com `em_coleta: true` e lacuna explicitada.
 */

import type { Dispositivo } from "../tipos";
import { PAISES_ASIA } from "./paises";

export const DISPOSITIVOS_ASIA: readonly Dispositivo[] = [
  // Filipinas
  {
    pais: "Filipinas",
    tipo: "ambiental",
    citacao: "Article II, Section 16",
    titulo: "Right to a balanced and healthful ecology",
    texto: "The State shall protect and advance the right of the people to a balanced and healthful ecology in accord with the rhythm and harmony of nature.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Philippines_1987?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Tradução de referência: O Estado protegerá e promoverá o direito do povo a uma ecologia equilibrada e saudável, em consonância com o ritmo e a harmonia da natureza.",
  },
  {
    pais: "Filipinas",
    tipo: "indigenas",
    citacao: "Article XII, Section 5",
    titulo: "Ancestral lands of indigenous communities",
    texto: "The State, subject to the provisions of this Constitution and national development policies and programs, shall protect the rights of indigenous cultural communities to their ancestral lands to ensure their economic, social, and cultural well-being.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Philippines_1987?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Filipinas",
    tipo: "mulheres",
    citacao: "Article II, Section 14",
    titulo: "Role of women and gender equality",
    texto: "The State recognizes the role of women in nation-building, and shall ensure the fundamental equality before the law of women and men.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Philippines_1987?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Filipinas",
    tipo: "criancas",
    citacao: "Article XV, Section 3(2)",
    titulo: "Rights of children and protection from exploitation",
    texto: "The State shall defend the right of children to assistance, including proper care and nutrition, and special protection from all forms of neglect, abuse, cruelty, exploitation, and other conditions prejudicial to their development.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Philippines_1987?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Filipinas",
    tipo: "trabalho",
    citacao: "Article XIII, Section 3",
    titulo: "Protection to labor and living wage",
    texto: "The State shall afford full protection to labor, local and overseas, organized and unorganized, and promote full employment and equality of employment opportunities for all. It shall guarantee the rights of all workers to self-organization, collective bargaining and negotiations, and peaceful concerted activities, including the right to strike in accordance with law. They shall be entitled to security of tenure, humane conditions of work, and a living wage.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Philippines_1987?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Índia
  {
    pais: "Índia",
    tipo: "humanos",
    citacao: "Article 21",
    titulo: "Protection of life and personal liberty",
    texto: "No person shall be deprived of his life or personal liberty except according to procedure established by law.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/India_2016?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Tradução de referência: Nenhuma pessoa será privada de sua vida ou liberdade pessoal, exceto de acordo com o procedimento estabelecido por lei (interpretado pela Suprema Corte como vida digna e ambiente sadio).",
  },
  {
    pais: "Índia",
    tipo: "ambiental",
    citacao: "Article 48A",
    titulo: "Protection and improvement of environment",
    texto: "The State shall endeavour to protect and improve the environment and to safeguard the forests and wild life of the country.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/India_2016?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Índia",
    tipo: "mulheres",
    citacao: "Article 15",
    titulo: "Prohibition of discrimination and special provisions for women",
    texto: "(1) The State shall not discriminate against any citizen on grounds only of religion, race, caste, sex, place of birth or any of them.\n(3) Nothing in this article shall prevent the State from making any special provision for women and children.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/India_2016?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Índia",
    tipo: "criancas",
    citacao: "Article 21A e Article 24",
    titulo: "Right to education and prohibition of child labour",
    texto: "Article 21A: The State shall provide free and compulsory education to all children of the age of six to fourteen years in such manner as the State may, by law, determine.\nArticle 24: No child below the age of fourteen years shall be employed to work in any factory or mine or engaged in any other hazardous employment.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/India_2016?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Índia",
    tipo: "povos",
    citacao: "Article 46",
    titulo: "Promotion of educational and economic interests of Scheduled Tribes",
    texto: "The State shall promote with special care the educational and economic interests of the weaker sections of the people, and, in particular, of the Scheduled Castes and the Scheduled Tribes, and shall protect them from social injustice and all forms of exploitation.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/India_2016?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // China
  {
    pais: "China",
    tipo: "ambiental",
    citacao: "Article 26",
    titulo: "Protection of living environment and ecosystems",
    texto: "The state protects and improves the living environment and the ecological environment, and prevents and controls pollution and other public hazards.\nThe state organizes and encourages afforestation and protects forests.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/China_2018?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "China",
    tipo: "trabalho",
    citacao: "Article 42",
    titulo: "Right and duty to work",
    texto: "Citizens of the People's Republic of China have the right as well as the duty to work.\nThrough various channels, the state creates conditions for employment, strengthens labor protection, improves working conditions and, on the basis of expanded production, increases remuneration for work and welfare benefits.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/China_2018?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "China",
    tipo: "mulheres",
    citacao: "Article 48",
    titulo: "Equal rights of women in all spheres",
    texto: "Women in the People's Republic of China enjoy equal rights with men in all spheres of life, in political, economic, cultural, social and family life.\nThe state protects the rights and interests of women, applies the principle of equal pay for equal work for men and women alike and trains and selects cadres from among women.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/China_2018?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "China",
    tipo: "criancas",
    citacao: "Article 49",
    titulo: "Protection of marriage, family, mother and child",
    texto: "Marriage, the family and mother and child are protected by the state.\nBoth husband and wife have the duty to practice family planning.\nParents have the duty to rear and educate their minor children, and children who have come of age have the duty to support and assist their parents.\nMaltreatment of old people, women and children is prohibited.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/China_2018?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Vietnã
  {
    pais: "Vietnã",
    tipo: "ambiental",
    citacao: "Article 43",
    titulo: "Right to live in a fresh environment",
    texto: "Everyone has the right to live in a fresh environment and has the obligation to protect the environment.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Viet_Nam_2013?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Vietnã",
    tipo: "mulheres",
    citacao: "Article 26",
    titulo: "Gender equality in all fields",
    texto: "1. Male and female citizens have equal rights in all fields. The State has policies to guarantee gender equality in rights and opportunities.\n2. The State, society and family create conditions for women to develop comprehensively and advance their role in society.\n3. Gender discrimination is strictly prohibited.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Viet_Nam_2013?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Vietnã",
    tipo: "criancas",
    citacao: "Article 37",
    titulo: "Care and protection of children",
    texto: "1. Children enjoy protection, care and education by the family, the State and society; and are allowed to participate in children's affairs. Persecuting, tormenting, abusing, abandoning, abusing labor and other acts of violating children's rights are strictly prohibited.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Viet_Nam_2013?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Vietnã",
    tipo: "povos",
    citacao: "Article 5",
    titulo: "Equality of ethnic groups and nationalities",
    texto: "1. The Socialist Republic of Vietnam is the unified nation of all nationalities living together in Vietnam.\n2. All the nationalities are equal, unite, respect and help each other to develop; all acts of discrimination against and division of the nationalities are strictly prohibited.\n3. The national language is Vietnamese. Every nationality has the right to use its own spoken and written language to preserve its own identity and to bring into play its fine customs, practices, traditions and culture.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Viet_Nam_2013?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Japão
  {
    pais: "Japão",
    tipo: "saude",
    citacao: "Article 25",
    titulo: "Standards of wholesome and cultured living",
    texto: "All people shall have the right to maintain the minimum standards of wholesome and cultured living.\nIn all spheres of life, the State shall use its endeavors for the promotion and extension of social welfare and security, and of public health.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Japan_1946?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Japão",
    tipo: "mulheres",
    citacao: "Article 14 e Article 24",
    titulo: "Equality under the law and gender equality in family",
    texto: "Article 14: All of the people are equal under the law and there shall be no discrimination in political, economic or social relations because of race, creed, sex, social status or family origin.\nArticle 24: Marriage shall be based only on the mutual consent of both sexes and it shall be maintained through mutual cooperation with the equal rights of husband and wife as a basis.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Japan_1946?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Japão",
    tipo: "criancas",
    citacao: "Article 26",
    titulo: "Right to equal education",
    texto: "All people shall have the right to receive an equal education correspondent to their ability, as provided by law.\nAll people shall be obligated to have all boys and girls under their protection receive ordinary education as provided for by law. Such compulsory education shall be free.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Japan_1946?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Japão",
    tipo: "trabalho",
    citacao: "Article 27",
    titulo: "Right and duty to work and prohibition of child exploitation",
    texto: "All people shall have the right and the obligation to work.\nStandards for wages, hours, rest and other working conditions shall be fixed by law.\nChildren shall not be exploited.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Japan_1946?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Coreia do Sul
  {
    pais: "Coreia do Sul",
    tipo: "mulheres",
    citacao: "Article 32(4) e Article 36(1)",
    titulo: "Special protection for working women and family equality",
    texto: "Article 32(4): Special protection shall be accorded to working women, and they shall not be subjected to unjust discrimination in terms of employment, wages, and working conditions.\nArticle 36(1): Marriage and family life shall be entered into and sustained on the basis of individual dignity and equality of the sexes, and the State shall do everything in its power to achieve that goal.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Republic_of_Korea_1987?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Coreia do Sul",
    tipo: "idosos",
    citacao: "Article 34(4) e (5)",
    titulo: "Welfare of senior citizens, youth and disabled persons",
    texto: "Article 34(4): The State shall have the duty to implement policies for enhancing the welfare of senior citizens and the youth.\nArticle 34(5): Citizens who are incapable of earning a livelihood due to a physical disability, disease, old age, or other reasons shall be protected by the State under the conditions as prescribed by Act.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Republic_of_Korea_1987?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Indonésia
  {
    pais: "Indonésia",
    tipo: "criancas",
    citacao: "Article 28B(2)",
    titulo: "Rights of the child to growth and protection from violence",
    texto: "Every child shall have the right to live, to grow and to develop, and shall have the right to protection from violence and discrimination.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Indonesia_2002?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Indonésia",
    tipo: "povos",
    citacao: "Article 28I(3)",
    titulo: "Cultural identity and rights of traditional communities",
    texto: "The cultural identities and rights of traditional communities shall be respected in accordance with the development of times and civilizations.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Indonesia_2002?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Rússia (com nota transcontinental)
  {
    pais: "Rússia",
    tipo: "ambiental",
    citacao: "Article 42",
    titulo: "Right to a favourable environment",
    texto: "Everyone shall have the right to a favourable environment, reliable information on the state of the environment and restitution for damages caused to his/her health or property by ecological offences.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Russia_2014?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Rússia",
    tipo: "indigenas",
    citacao: "Article 69",
    titulo: "Rights of indigenous small-numbered peoples",
    texto: "The Russian Federation shall guarantee the rights of indigenous small-numbered peoples in accordance with universally recognized principles and norms of international law and international treaties of the Russian Federation.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Russia_2014?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
];

const PAISES_COM_DISPOSITIVO = new Set(DISPOSITIVOS_ASIA.map((d) => d.pais));

/**
 * Gera a relação completa de dispositivos e lacunas de coleta para os países catalogados da Ásia.
 */
export function getDispositivosAsia(): readonly Dispositivo[] {
  const lista: Dispositivo[] = [...DISPOSITIVOS_ASIA];

  for (const pais of PAISES_ASIA) {
    if (!PAISES_COM_DISPOSITIVO.has(pais.nome)) {
      lista.push({
        pais: pais.nome,
        tipo: "humanos",
        citacao: "em_coleta",
        titulo: "Levantamento constitucional em andamento",
        texto: `O mapeamento detalhado dos dispositivos constitucionais de ${pais.nome} está registrado como lacuna para posterior auditoria documental.`,
        fonte: "Constitute Project / Fontes Oficiais",
        url: "https://www.constituteproject.org/",
        dataAcesso: "2026-10-30",
        em_coleta: true,
        lacuna: `Dispositivos constitucionais de ${pais.nome} (Leva ${pais.leva}) em fase de ingestão primária.`,
      });
    }
  }

  return lista;
}
