/**
 * @file apps/web/lib/direitos-globais/america-do-norte/dispositivos.ts
 * @description Dispositivos constitucionais federais e auditoria de lacunas da América do Norte (EUA e Canadá).
 *
 * Fontes primárias:
 * - Constitute Project (constituteproject.org)
 * - Justice Laws Website Canada (laws-lois.justice.gc.ca)
 * - Arquivos Nacionais dos EUA (archives.gov)
 *
 * Regra editorial:
 * Textos transcritos na íntegra (verbatim), sem resumo ou paráfrase.
 * Ausências de disposições expressas registradas com citação 'nao_encontrado' e fundamentação legal.
 */

import type { Dispositivo } from "../tipos";

export const DISPOSITIVOS_AMERICA_DO_NORTE: readonly Dispositivo[] = [
  // Estados Unidos
  {
    pais: "Estados Unidos",
    tipo: "politicos",
    citacao: "Amendment I",
    titulo: "Freedom of Religion, Speech, Press, Assembly, and Petition",
    texto: "Congress shall make no law respecting an establishment of religion, or prohibiting the free exercise thereof; or abridging the freedom of speech, or of the press; or the right of the people peaceably to assemble, and to petition the Government for a redress of grievances.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/United_States_of_America_1992",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "O Congresso não fará lei concernente ao estabelecimento de uma religião, ou proibindo o seu livre exercício; ou restringindo a liberdade de expressão, ou de imprensa; ou o direito do povo de se reunir pacificamente e de solicitar ao governo a reparação de queixas.",
  },
  {
    pais: "Estados Unidos",
    tipo: "humanos",
    citacao: "Amendment XIV, Section 1",
    titulo: "Citizenship, Due Process, and Equal Protection",
    texto: "All persons born or naturalized in the United States, and subject to the jurisdiction thereof, are citizens of the United States and of the State wherein they reside. No State shall make or enforce any law which shall abridge the privileges or immunities of citizens of the United States; nor shall any State deprive any person of life, liberty, or property, without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/United_States_of_America_1992",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Todas as pessoas nascidas ou naturalizadas nos Estados Unidos e sujeitas à sua jurisdição são cidadãs dos Estados Unidos e do Estado em que residem. Nenhum Estado fará ou executará qualquer lei que restrinja os privilégios ou imunidades dos cidadãos dos Estados Unidos; nem nenhum Estado privará qualquer pessoa da vida, liberdade ou propriedade, sem o devido processo legal; nem negará a qualquer pessoa sob sua jurisdição a igual proteção das leis.",
  },
  {
    pais: "Estados Unidos",
    tipo: "ambiental",
    citacao: "nao_encontrado",
    titulo: "Ausência de cláusula ambiental na Constituição Federal de 1787",
    texto: "A Constituição Federal dos Estados Unidos de 1787 (incluindo o Bill of Rights e todas as emendas subsequentes) não contém dispositivo textual substantivo sobre direito ao meio ambiente sadio, proteção ecológica ou equilíbrio climático. A tutela ambiental federal norte-americana desenvolve-se no plano infraconstitucional por leis ordinárias (notadamente o National Environmental Policy Act de 1969, o Clean Air Act de 1970 e o Clean Water Act de 1972) fundamentadas na Cláusula de Comércio do Artigo I, Seção 8, Cláusula 3 da Constituição e submetidas ao controle judicial das Cortes Federais.",
    fonte: "Constitute Project",
    url: "https://www.constituteproject.org/constitution/United_States_of_America_1992",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    lacuna: "Ausência de previsão expressa de direito fundamental ou dever estatal de proteção ao meio ambiente na Constituição Federal dos Estados Unidos de 1787.",
  },

  // Canadá
  {
    pais: "Canadá",
    tipo: "humanos",
    citacao: "Section 7",
    titulo: "Life, liberty and security of person",
    texto: "Everyone has the right to life, liberty and security of the person and the right not to be deprived thereof except in accordance with the principles of fundamental justice.",
    fonte: "Justice Laws Website Canada / Canadian Charter of Rights and Freedoms",
    url: "https://laws-lois.justice.gc.ca/eng/const/page-12.html",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "Toda pessoa tem direito à vida, à liberdade e à segurança pessoal e o direito de não ser privada delas, exceto em conformidade com os princípios de justiça fundamental.",
  },
  {
    pais: "Canadá",
    tipo: "humanos",
    citacao: "Section 15",
    titulo: "Equality before and under law and equal protection and benefit of law",
    texto: "(1) Every individual is equal before and under the law and has the right to the equal protection and equal benefit of the law without discrimination and, in particular, without discrimination based on race, national or ethnic origin, colour, religion, sex, age or mental or physical disability.\n(2) Subsection (1) does not preclude any law, program or activity that has as its object the amelioration of conditions of disadvantaged individuals or groups including those that are disadvantaged because of race, national or ethnic origin, colour, religion, sex, age or mental or physical disability.",
    fonte: "Justice Laws Website Canada / Canadian Charter of Rights and Freedoms",
    url: "https://laws-lois.justice.gc.ca/eng/const/page-12.html",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "(1) Todo indivíduo é igual perante e sob a lei e tem direito a igual proteção e igual benefício da lei sem discriminação e, em especial, sem discriminação baseada em raça, origem nacional ou étnica, cor, religião, sexo, idade ou deficiência física ou mental.\n(2) O parágrafo (1) não impede qualquer lei, programa ou atividade que tenha por objetivo a melhoria das condições de indivíduos ou grupos desfavorecidos...",
  },
  {
    pais: "Canadá",
    tipo: "indigenas",
    citacao: "Section 35",
    titulo: "Rights of Aboriginal Peoples of Canada",
    texto: "(1) The existing aboriginal and treaty rights of the aboriginal peoples of Canada are hereby recognized and affirmed.\n(2) In this Act, \"aboriginal peoples of Canada\" includes the Indian, Inuit and Métis peoples of Canada.\n(3) For greater certainty, in subsection (1) \"treaty rights\" includes rights that now exist by way of land claims agreements or may be so acquired.\n(4) Notwithstanding any other provision of this Act, the aboriginal and treaty rights referred to in subsection (1) are guaranteed equally to male and female persons.",
    fonte: "Justice Laws Website Canada / Constitution Act, 1982",
    url: "https://laws-lois.justice.gc.ca/eng/const/page-13.html",
    dataAcesso: "2026-10-30",
    idiomaOriginal: "en",
    traducao: "(1) Os direitos existentes, ancestrais e decorrentes de tratados dos povos aborígenes do Canadá são pelo presente reconhecidos e afirmados.\n(2) Nesta Lei, 'povos aborígenes do Canadá' inclui os povos indígenas (First Nations), Inuítes e Métis do Canadá.\n(3) Para maior certeza, no parágrafo (1), 'direitos de tratados' inclui direitos que existam por via de acordos de reivindicação de terras ou que possam vir a ser assim adquiridos.\n(4) Sem prejuízo de qualquer outra disposição desta Lei, os direitos aborígenes e de tratados referidos no parágrafo (1) são garantidos igualmente a pessoas do sexo masculino e feminino.",
  },
];

/**
 * Retorna os dispositivos catalogados para os países da América do Norte.
 */
export function getDispositivosAmericaDoNorte(): readonly Dispositivo[] {
  return DISPOSITIVOS_AMERICA_DO_NORTE;
}
