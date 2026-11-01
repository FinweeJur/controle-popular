/**
 * @file apps/web/lib/universidades/dados-sp.ts
 * @description Instituições e grupos de pesquisa de São Paulo, leva SP.
 *
 * Papel no portal: alimentar o índice `/universidades` por estado.
 *
 * Fonte e medição (2026-10-30):
 * - Portais institucionais e pró-reitorias de pesquisa conferidos por HTTP.
 * - A USP publica um guia de criação de grupos, não a lista consolidada; o DGP
 *   bloqueia coleta automatizada. Por isso ainda não há grupos de SP no acervo.
 *
 * Lacunas declaradas:
 * - UNIFESP e ITA responderam 301/403 à verificação e ficaram fora.
 * - Grupos de SP dependem de lista oficial por instituição.
 *
 * Regra: só entra grupo de lista oficial consolidada. Onde não há lista, a
 * ficha aponta o portal da instituição e o grupo não é inventado.
 */

import type { Instituicao, GrupoPesquisa, ProjetoExtensao } from "./tipos";

export const SP_DATA_ACESSO = "2026-10-30";

export const INSTITUICOES_SP: Instituicao[] = [
{
    sigla: "USP",
    nome: "Universidade de São Paulo",
    tipo: "estadual",
    uf: "SP",
    municipios: ["São Paulo"],
    site: "https://www.usp.br/",
    links: [
      { rotulo: "Portal da USP", url: "https://www.usp.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa e Inovação (PRPI)", url: "https://prpi.usp.br/" },
    ],
    fonteUrl: "https://prpi.usp.br/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UNICAMP",
    nome: "Universidade Estadual de Campinas",
    tipo: "estadual",
    uf: "SP",
    municipios: ["Campinas"],
    site: "https://www.unicamp.br/",
    links: [
      { rotulo: "Portal da Unicamp", url: "https://www.unicamp.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa (PRP)", url: "https://www.prp.unicamp.br/" },
    ],
    fonteUrl: "https://www.prp.unicamp.br/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UNESP",
    nome: "Universidade Estadual Paulista",
    tipo: "estadual",
    uf: "SP",
    municipios: ["São Paulo"],
    site: "https://www.unesp.br/",
    links: [
      { rotulo: "Portal da Unesp", url: "https://www.unesp.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa (PROPE)", url: "https://prope.unesp.br/" },
    ],
    fonteUrl: "https://prope.unesp.br/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UFSCar",
    nome: "Universidade Federal de São Carlos",
    tipo: "federal",
    uf: "SP",
    municipios: ["São Carlos"],
    site: "https://www.ufscar.br/",
    links: [
      { rotulo: "Portal da UFSCar", url: "https://www.ufscar.br/" },
    ],
    fonteUrl: "https://www.ufscar.br/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "UFABC",
    nome: "Universidade Federal do ABC",
    tipo: "federal",
    uf: "SP",
    municipios: ["Santo André"],
    site: "https://www.ufabc.edu.br/",
    links: [
      { rotulo: "Portal da UFABC", url: "https://www.ufabc.edu.br/" },
      { rotulo: "Pró-Reitoria de Pós-Graduação (ProPG)", url: "https://propg.ufabc.edu.br/" },
    ],
    fonteUrl: "https://propg.ufabc.edu.br/",
    dataAcesso: "2026-10-30",
  },
{
    sigla: "IFSP",
    nome: "Instituto Federal de São Paulo",
    tipo: "instituto-federal",
    uf: "SP",
    municipios: ["São Paulo"],
    site: "https://www.ifsp.edu.br/",
    links: [
      { rotulo: "Portal do IFSP", url: "https://www.ifsp.edu.br/" },
      { rotulo: "Pró-Reitoria de Pesquisa e Pós-Graduação (PRP)", url: "https://prp.ifsp.edu.br/" },
      { rotulo: "Grupos de pesquisa", url: "https://prp.ifsp.edu.br/index.php/grupos-de-pesquisa" },
    ],
    fonteUrl: "https://prp.ifsp.edu.br/index.php/grupos-de-pesquisa",
    dataAcesso: "2026-10-30",
  },
];

export const GRUPOS_SP: GrupoPesquisa[] = [];

export const PROJETOS_SP: ProjetoExtensao[] = [];
