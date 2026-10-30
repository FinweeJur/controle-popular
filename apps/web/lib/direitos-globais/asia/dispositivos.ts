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
