/**
 * @file apps/web/lib/universidades/dados-ba.ts
 * @description Instituições e grupos de pesquisa de Bahia, leva BA.
 *
 * Papel no portal: alimentar o índice `/universidades` por estado.
 *
 * Fonte e medição (2026-10-30):
 * - Portais institucionais conferidos por HTTP.
 * - UFRB: lista oficial em PDF (março/2024) com centro, nome, área e líder.
 *   Os 30 grupos entraram com a área predominante declarada.
 *
 * Lacunas declaradas:
 * - UFBA, UESC, UEFS, UESB, UNEB e IFBA ainda sem lista consolidada acessível.
 * - E-mails publicados no PDF da UFRB ficaram de fora nesta leva para não
 *   arriscar pareamento errado entre grupo e contato.
 *
 * Regra: só entra grupo de lista oficial consolidada. Onde não há lista, a
 * ficha aponta o portal da instituição e o grupo não é inventado.
 */

import type { Instituicao, GrupoPesquisa, ProjetoExtensao } from "./tipos";

export const BA_DATA_ACESSO = "2026-10-30";

export const INSTITUICOES_BA: Instituicao[] = [
{
    sigla: "UFBA",
    nome: "Universidade Federal da Bahia",
    tipo: "federal",
    uf: "BA",
    municipios: ["Salvador"],
    site: "https://www.ufba.br/",
    links: [
      { rotulo: "Portal da UFBA", url: "https://www.ufba.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa, Criação e Inovação (PROPCI)", url: "https://propci.ufba.br/" },
      { rotulo: "Grupos de pesquisa", url: "https://ufba.br/grupos-de-pesquisa" },
    ],
    fonteUrl: "https://ufba.br/grupos-de-pesquisa",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UESC",
    nome: "Universidade Estadual de Santa Cruz",
    tipo: "estadual",
    uf: "BA",
    municipios: ["Ilhéus"],
    site: "https://www.uesc.br/",
    links: [
      { rotulo: "Portal da UESC", url: "https://www.uesc.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa e Pós-Graduação (PROPP)", url: "https://www.uesc.br/propp/" },
    ],
    fonteUrl: "https://www.uesc.br/propp/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UEFS",
    nome: "Universidade Estadual de Feira de Santana",
    tipo: "estadual",
    uf: "BA",
    municipios: ["Feira de Santana"],
    site: "https://www.uefs.br/",
    links: [
      { rotulo: "Portal da UEFS", url: "https://www.uefs.br/" },
    ],
    fonteUrl: "https://www.uefs.br/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UESB",
    nome: "Universidade Estadual do Sudoeste da Bahia",
    tipo: "estadual",
    uf: "BA",
    municipios: ["Vitória da Conquista"],
    site: "https://www.uesb.br/",
    links: [
      { rotulo: "Portal da UESB", url: "https://www.uesb.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa e Pós-Graduação (PPG)", url: "https://www.uesb.br/ppg/" },
    ],
    fonteUrl: "https://www.uesb.br/ppg/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UNEB",
    nome: "Universidade do Estado da Bahia",
    tipo: "estadual",
    uf: "BA",
    municipios: ["Salvador"],
    site: "https://portal.uneb.br/",
    links: [
      { rotulo: "Portal da UNEB", url: "https://portal.uneb.br/" },
      { rotulo: "Pró-Reitoria de Pós-Graduação (PPG)", url: "https://portal.uneb.br/ppg" },
    ],
    fonteUrl: "https://portal.uneb.br/ppg",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "IFBA",
    nome: "Instituto Federal da Bahia",
    tipo: "instituto-federal",
    uf: "BA",
    municipios: ["Salvador"],
    site: "https://portal.ifba.edu.br/",
    links: [
      { rotulo: "Portal do IFBA", url: "https://portal.ifba.edu.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa, Pós-Graduação e Inovação (PRPGI)", url: "https://portal.ifba.edu.br/prpgi" },
    ],
    fonteUrl: "https://portal.ifba.edu.br/prpgi",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UFRB",
    nome: "Universidade Federal do Recôncavo da Bahia",
    tipo: "federal",
    uf: "BA",
    municipios: ["Cruz das Almas"],
    site: "https://www.ufrb.edu.br/",
    links: [
      { rotulo: "Portal da UFRB", url: "https://www.ufrb.edu.br/" },
    ],
    fonteUrl: "https://ufrb.edu.br/ppgci/images/Grupos_de_Pesquisa_UFRB_-_Mar%C3%A7o_2024.pdf",
    dataAcesso: "2026-10-30",
  },
];

function grupo(unidade: string, nome: string, area: string, lider: string): GrupoPesquisa {
  return {
    instituicao: "UFRB",
    unidade,
    nome,
    area,
    lider,
    anoReferencia: 2024,
    fonteUrl: "https://ufrb.edu.br/ppgci/images/Grupos_de_Pesquisa_UFRB_-_Mar%C3%A7o_2024.pdf",
    dataAcesso: BA_DATA_ACESSO,
  };
}

export const GRUPOS_BA: GrupoPesquisa[] = [
  grupo("CFP", "Linguagem, Letramentos, Diversidade e Formação Docente", "Linguística", "Adriana Dalla Vecchia; Jakeline Aparecida Semechechem"),
  grupo("CFP", "Grupo de Estudos do Português Popular da Bahia - GEPPOP", "Linguística", "Amanda dos Reis Silva"),
  grupo("CFP", "GPSNAT- Grupo de Pesquisa em Síntese Orgânica e Química de Produtos Naturais", "Química", "Amenson Trindade Gomes; Eliezer Pereira da Silva"),
  grupo("CFP", "PortS - Grupo de Pesquisa em estudos sobre Língua Portuguesa para Surdos", "Linguística", "Ayane Nazarela Santos de Almeida"),
  grupo("CFP", "Currículo, Docência e Formação", "Educação", "Carlos Adriano da Silva Oliveira; Lúcia Gracia Ferreira Trindade"),
  grupo("CFP", "Grupo de Pesquisa Física e Sociedade", "Física", "Cleidson Santos de Castro Carvalho"),
  grupo("CFP", "Grupo de Pesquisa em Estudos de Língua Inglesa do Centro de Formação de Professores da UFRB (GPELI-UFRB)", "Linguística", "Diogo Oliveira do Espírito Santo"),
  grupo("CFP", "Administração, Gestão e Organização Escolar", "Educação", "Djeissom Silva Ribeiro"),
  grupo("CFP", "História(s) e narrativa(s) das artes do sul em perspectivas transculturais - circularidades e fluxos", "Artes", "Emi Koide"),
  grupo("CFP", "PEQUI - Pesquisa Ensino Extensão em Educação Química", "Educação", "Franklin Kaic Dutra Pereira; Creuza Souza Silva"),
  grupo("CFP", "Núcleo de Estudos em Agroecologia e Nova Cartografia Social", "Agronomia", "Franklin Plessmann de Carvalho; Raul Lomanto Neto"),
  grupo("CFP", "Grupo de Investigação em Química e Meio Ambiente", "Química", "Gil Luciano Guedes dos Santos; José Gilberto da Silva"),
  grupo("CFP", "HIPERJOR", "Linguística", "Jaqueline Barreto Lé"),
  grupo("CFP", "[GUETO] Grupo Unido para Educacão e Trabalhos de Orientação", "Educação", "Jean Adriano Barros da Silva"),
  grupo("CFP", "Grupo de Materiais Fotônicos", "Química", "Jorge Fernando Silva de Menezes"),
  grupo("CFP", "Grupo de Pesquisa em Desenvolvimento e Aprendizagem Motora - DAMA", "Educação Física", "Marcia Valeria Cozzani"),
  grupo("", "Grupo de Pesquisa e Extensão LEIA", "Artes", "Mônica Gomes da Silva; Erica Bastos da Silva"),
  grupo("CFP", "Grupo de Estudos e Pesquisas em Estética - GEPE", "Filosofia", "Pablo Enrique Abraham Zunino"),
  grupo("CFP", "Núcleo Capitu - Estudos e Pesquisas em Gênero, Sexualidade e Diversidade", "Educação", "Priscila Gomes Dornelles"),
  grupo("CFP", "Grupo de Estudos e Pesquisas em Educação, Formação de Professores e Educação Física", "Educação", "Priscila Gomes Dornelles; Cristina Souza Paraiso"),
  grupo("CFP", "Núcleo de Pesquisa e Extensão Filosófica (NUPEF)", "Filosofia", "Rafael dos Reis Ferreira; José João Neves Barbosa Vicente"),
  grupo("CFP", "Grupo de Pesquisa em Físico-Química Orgânica", "Química", "Rodrigo De Paula"),
  grupo("CFP", "PANACUM - Grupo de Estudo e Pesquisa em Física e Ensino de Ciências", "Educação", "Sergio Luiz Bragatto Boss"),
  grupo("CFP", "Grupo de pesquisa sobre Infâncias e Formação de Professores - GRIFO", "Educação", "Sirlandia Reis de Oliveira Teixeira"),
  grupo("CFP", "LITERÁFRIKA - Literaturas Africanas, História e Pós-Colonialismo", "Letras", "Silvio Ruiz Paradiso"),
  grupo("CFP", "EEtnografAR - Etnografias da Educação, do Trabalho e da Geografia dos Povos do Campo", "Sociologia", "Tiago Rodrigues Santos; Napoliana Pereira Santana"),
  grupo("CAHL", "Memória, processos identitários e territorialidades no Recôncavo da Bahia (MITO)", "Antropologia", "Ana Paula Comin de Carvalho; Suzana Moura Maia"),
  grupo("CAHL", "Quadro a Quadro: projetando ideias, refletindo imagens", "Linguística, Letras e Artes", "Ana Paula Nunes de Abreu; Alexandre Silva Guerreiro"),
  grupo("CAHL", "[Re]image - Grupo de Pesquisa em Artes Visuais", "Artes", "Ana Valécia Araújo Ribeiro; Carolina Fialho Silva"),
  grupo("CAHL", "Coletivo Angela Davis: Grupo de Pesquisa em Gênero, Raça e Subalternidade", "Antropologia", "Angela Lucia Silva Figueiredo; Dailza Araújo Lopes"),
];

export const PROJETOS_BA: ProjetoExtensao[] = [];
