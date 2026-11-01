/**
 * @file apps/web/lib/universidades/dados-rj.ts
 * @description Instituições e grupos de pesquisa de Rio de Janeiro, leva RJ.
 *
 * Papel no portal: alimentar o índice `/universidades` por estado.
 *
 * Fonte e medição (2026-10-30):
 * - Portais institucionais e pró-reitorias de pesquisa conferidos por HTTP.
 * - Ainda não há lista consolidada de grupos no acervo: as fontes encontradas
 *   dependem do DGP/CNPq, que bloqueia coleta automatizada.
 *
 * Lacunas declaradas:
 * - Grupos do RJ dependem de lista oficial por instituição.
 *
 * Regra: só entra grupo de lista oficial consolidada. Onde não há lista, a
 * ficha aponta o portal da instituição e o grupo não é inventado.
 */

import type { Instituicao, GrupoPesquisa, ProjetoExtensao } from "./tipos";

export const RJ_DATA_ACESSO = "2026-10-30";

export const INSTITUICOES_RJ: Instituicao[] = [
{
    sigla: "UFRJ",
    nome: "Universidade Federal do Rio de Janeiro",
    tipo: "federal",
    uf: "RJ",
    municipios: ["Rio de Janeiro"],
    site: "https://ufrj.br/",
    links: [
      { rotulo: "Portal da UFRJ", url: "https://ufrj.br/" },
      { rotulo: "Pró-Reitoria de Pós-Graduação e Pesquisa (PR2)", url: "https://pr2.ufrj.br/" },
      { rotulo: "Grupos de pesquisa", url: "https://app.pr2.ufrj.br/grupoDePesquisa" },
    ],
    fonteUrl: "https://app.pr2.ufrj.br/grupoDePesquisa",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UERJ",
    nome: "Universidade do Estado do Rio de Janeiro",
    tipo: "estadual",
    uf: "RJ",
    municipios: ["Rio de Janeiro"],
    site: "https://www.uerj.br/",
    links: [
      { rotulo: "Portal da UERJ", url: "https://www.uerj.br/" },
      { rotulo: "Pró-Reitoria de Pós-Graduação e Pesquisa (PR2)", url: "https://www.pr2.uerj.br/" },
    ],
    fonteUrl: "https://www.pr2.uerj.br/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UFF",
    nome: "Universidade Federal Fluminense",
    tipo: "federal",
    uf: "RJ",
    municipios: ["Niterói"],
    site: "https://www.uff.br/",
    links: [
      { rotulo: "Portal da UFF", url: "https://www.uff.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa, Pós-Graduação e Inovação (PROPPI)", url: "https://www.uff.br/proppi/" },
    ],
    fonteUrl: "https://www.uff.br/proppi/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UNIRIO",
    nome: "Universidade Federal do Estado do Rio de Janeiro",
    tipo: "federal",
    uf: "RJ",
    municipios: ["Rio de Janeiro"],
    site: "https://www.unirio.br/",
    links: [
      { rotulo: "Portal da UNIRIO", url: "https://www.unirio.br/" },
      { rotulo: "Pró-Reitoria de Pós-Graduação, Pesquisa e Inovação (PROPGPI)", url: "https://www.unirio.br/propgpi" },
    ],
    fonteUrl: "https://www.unirio.br/propgpi",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UENF",
    nome: "Universidade Estadual do Norte Fluminense Darcy Ribeiro",
    tipo: "estadual",
    uf: "RJ",
    municipios: ["Campos dos Goytacazes"],
    site: "https://www.uenf.br/",
    links: [
      { rotulo: "Portal da UENF", url: "https://www.uenf.br/" },
    ],
    fonteUrl: "https://www.uenf.br/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "IFRJ",
    nome: "Instituto Federal do Rio de Janeiro",
    tipo: "instituto-federal",
    uf: "RJ",
    municipios: ["Rio de Janeiro"],
    site: "https://portal.ifrj.edu.br/",
    links: [
      { rotulo: "Portal do IFRJ", url: "https://portal.ifrj.edu.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa, Pós-Graduação e Inovação (PROPPI)", url: "https://portal.ifrj.edu.br/proppi" },
    ],
    fonteUrl: "https://portal.ifrj.edu.br/proppi",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "CEFET-RJ",
    nome: "Centro Federal de Educação Tecnológica Celso Suckow da Fonseca",
    tipo: "cefet",
    uf: "RJ",
    municipios: ["Rio de Janeiro"],
    site: "https://www.cefet-rj.br/",
    links: [
      { rotulo: "Portal do CEFET-RJ", url: "https://www.cefet-rj.br/" },
      { rotulo: "Grupos de pesquisa (DIPPG)", url: "https://www.dippg.cefet-rj.br/index.php/pt/grupos-de-pesquisa" },
    ],
    fonteUrl: "https://www.dippg.cefet-rj.br/index.php/pt/grupos-de-pesquisa",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "PUC-Rio",
    nome: "Pontifícia Universidade Católica do Rio de Janeiro",
    tipo: "privada",
    uf: "RJ",
    municipios: ["Rio de Janeiro"],
    site: "https://www.puc-rio.br/",
    links: [
      { rotulo: "Portal da PUC-Rio", url: "https://www.puc-rio.br/" },
      { rotulo: "Pesquisa", url: "https://www.puc-rio.br/pesquisa/" },
    ],
    fonteUrl: "https://www.puc-rio.br/pesquisa/",
    dataAcesso: "2026-10-30",
  },
];

export const GRUPOS_RJ: GrupoPesquisa[] = [];

export const PROJETOS_RJ: ProjetoExtensao[] = [];
