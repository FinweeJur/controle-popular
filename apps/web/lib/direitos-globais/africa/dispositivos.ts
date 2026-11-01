/**
 * @file apps/web/lib/direitos-globais/africa/dispositivos.ts
 * @description Dispositivos constitucionais concretos e auditoria de lacunas na África.
 *
 * Fontes primárias: Constitute Project (constituteproject.org) e Diários Oficiais.
 * Regra editorial: Textos transcritos na íntegra (verbatim), sem resumos.
 * Países em processo de coleta ou sem dispositivo constitucional expresso são
 * registrados com `em_coleta: true` e lacuna explicitada.
 */

import type { Dispositivo } from "../tipos";
import { PAISES_AFRICA } from "./paises";

export const DISPOSITIVOS_AFRICA: readonly Dispositivo[] = [
  // África do Sul
  {
    pais: "África do Sul",
    tipo: "ambiental",
    citacao: "Section 24",
    titulo: "Environment",
    texto: "Everyone has the right—\n(a) to an environment that is not harmful to their health or well-being; and\n(b) to have the environment protected, for the benefit of present and future generations, through reasonable legislative and other measures that—\n(i) prevent pollution and ecological degradation;\n(ii) promote conservation; and\n(iii) secure ecologically sustainable development and use of natural resources while promoting justifiable economic and social development.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/South_Africa_2012?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Tradução de referência: Toda pessoa tem direito a um meio ambiente não prejudicial à saúde ou ao bem-estar e à proteção ecológica para as gerações presentes e futuras.",
  },
  {
    pais: "África do Sul",
    tipo: "moradia",
    citacao: "Section 26",
    titulo: "Housing",
    texto: "(1) Everyone has the right to have access to adequate housing.\n(2) The state must take reasonable legislative and other measures, within its available resources, to achieve the progressive realisation of this right.\n(3) No one may be evicted from their home, or have their home demolished, without an order of court made after considering all the relevant circumstances. No legislation may permit arbitrary evictions.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/South_Africa_2012?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "África do Sul",
    tipo: "agua",
    citacao: "Section 27(1)(b)",
    titulo: "Health care, food, water and social security",
    texto: "(1) Everyone has the right to have access to—\n(a) health care services, including reproductive health care;\n(b) sufficient food and water; and\n(c) social security, including, if they are unable to support themselves and their dependants, appropriate social assistance.\n(2) The state must take reasonable legislative and other measures, within its available resources, to achieve the progressive realisation of each of these rights.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/South_Africa_2012?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Quênia
  {
    pais: "Quênia",
    tipo: "ambiental",
    citacao: "Article 42",
    titulo: "Clean and healthy environment",
    texto: "Every person has the right to a clean and healthy environment, which includes the right—\n(a) to have the environment protected for the benefit of present and future generations through legislative and other measures, particularly those contemplated in Article 69; and\n(b) to have obligations relating to the environment fulfilled under Article 70.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Kenya_2010?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
  {
    pais: "Quênia",
    tipo: "povos",
    citacao: "Article 63",
    titulo: "Community land",
    texto: "(1) Community land shall vest in and be held by communities identified on the basis of ethnicity, culture or similar community of interest.\n(2) Community land includes—\n(a) land lawfully held as trust land;\n(b) land that is lawfully transferred to a specific community;\n(c) any other land declared to be community land by an Act of Parliament; and\n(d) ancestral lands and lands traditionally occupied by hunter-gatherer communities.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Kenya_2010?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Nigéria
  {
    pais: "Nigéria",
    tipo: "ambiental",
    citacao: "Section 20",
    titulo: "Environmental objectives",
    texto: "The State shall protect and improve the environment and safeguard the water, air and land, forest and wild life of Nigeria.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Nigeria_2011?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },

  // Senegal
  {
    pais: "Senegal",
    tipo: "ambiental",
    citacao: "Article 25-2",
    titulo: "Droit à un environnement sain",
    texto: "Chacun a droit à un environnement sain. La défense, la préservation et l'amélioration de l'environnement incombent aux pouvoirs publics et à tous les citoyens. L'Etat reconnaît à chaque citoyen le droit de s'informer sur l'état de l'environnement et de participer aux décisions qui le concernent.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Senegal_2016?lang=fr",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "fr",
    traducao: "Tradução de referência: Toda pessoa tem direito a um ambiente saudável. A defesa, preservação e melhoria do ambiente incumbem aos poderes públicos e a todos os cidadãos.",
  },

  // Angola
  {
    pais: "Angola",
    tipo: "ambiental",
    citacao: "Artigo 39.º",
    titulo: "Direito ao ambiente",
    texto: "1. Todos têm o direito de viver num ambiente são e não poluído, bem como o dever de o defender e preservar.\n2. O Estado adopta as medidas necessárias para proteger o ambiente e as espécies da flora e da fauna nacionais em todo o território nacional, manter o equilíbrio ecológico, a correcta localização das actividades económicas e a exploração racional de todos os recursos naturais.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Angola_2010?lang=pt",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "pt",
  },
  {
    pais: "Angola",
    tipo: "terra_territorio",
    citacao: "Artigo 98.º",
    titulo: "Direitos sobre a terra",
    texto: "1. A terra constitui propriedade originária do Estado, podendo ser transmitida a pessoas singulares ou colectivas, tendo em vista o seu racional e efectivo aproveitamento, nos termos da Constituição e da lei.\n2. São reconhecidos às comunidades locais o acesso e o uso das terras, nos termos da lei.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Angola_2010?lang=pt",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "pt",
  },

  // Moçambique
  {
    pais: "Moçambique",
    tipo: "ambiental",
    citacao: "Artigo 90.º",
    titulo: "Direito ao ambiente",
    texto: "1. Todo o cidadão tem o direito de viver num ambiente equilibrado e o dever de o defender.\n2. O Estado e as autarquias locais, com a colaboração das associações de defesa do ambiente, adoptam políticas de defesa do ambiente e velam pela utilização racional de todos os recursos naturais.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Mozambique_2007?lang=pt",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "pt",
  },

  // Gana
  {
    pais: "Gana",
    tipo: "ambiental",
    citacao: "Article 36(9)",
    titulo: "Economic objectives and environment",
    texto: "The State shall take appropriate measures to protect and safeguard the national environment for posterity; and shall, in co-operation with other states, take all necessary measures to protect the wider international environment for mankind.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/Ghana_1996?lang=en",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
  },
];

const PAISES_COM_DISPOSITIVO = new Set(DISPOSITIVOS_AFRICA.map((d) => d.pais));

/**
 * Gera a relação completa de dispositivos e lacunas de coleta para todos os 54 países da África.
 */
export function getDispositivosAfrica(): readonly Dispositivo[] {
  const lista: Dispositivo[] = [...DISPOSITIVOS_AFRICA];

  for (const pais of PAISES_AFRICA) {
    if (!PAISES_COM_DISPOSITIVO.has(pais.nome)) {
      lista.push({
        pais: pais.nome,
        tipo: "humanos",
        citacao: "em_coleta",
        titulo: "Levantamento constitucional em andamento",
        texto: `O mapeamento detalhado dos dispositivos constitucionais de ${pais.nome} está registrado como lacuna para posterior auditoria documental.`,
        fonte: "Constitute Project / União Africana",
        url: "https://www.constituteproject.org/",
        dataAcesso: "2026-10-30",
        em_coleta: true,
        lacuna: `Dispositivos constitucionais de ${pais.nome} em fase de ingestão primária.`,
      });
    }
  }

  return lista;
}
