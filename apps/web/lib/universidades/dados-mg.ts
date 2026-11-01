/**
 * @file apps/web/lib/universidades/dados-mg.ts
 * @description Instituições da primeira leva de Minas Gerais.
 *
 * Papel no portal: alimenta o índice `/universidades` com as instituições
 * mineiras que o piloto da UFVJM não cobre. Aqui a ficha é institucional —
 * site, pró-reitoria de pesquisa, extensão e a página de grupos do DGP/CNPq.
 *
 * De onde vem este dado (medido em 2026-10-30): todos os links foram abertos
 * por requisição HTTP com User-Agent honesto e devolveram 200. Os municípios
 * listados são apenas as sedes/reitorias que a própria instituição declara;
 * campus não confirmado NÃO entra.
 *
 * Por que não há grupos das demais ainda: só a UFVJM e a UFOP publicam lista
 * consolidada de grupos (relatório e planilha oficiais). As outras dependem do
 * DGP/CNPq, que bloqueia coleta automatizada. Até existir lista oficial, a
 * ficha aponta o portal certo — nunca se inventa grupo.
 */

import type { Instituicao } from "./tipos";

export const MG_DATA_ACESSO = "2026-10-30";

export const INSTITUICOES_MG: Instituicao[] = [
  {
    sigla: "UFMG",
    nome: "Universidade Federal de Minas Gerais",
    tipo: "federal",
    uf: "MG",
    municipios: ["Belo Horizonte", "Montes Claros"],
    site: "https://www.ufmg.br",
    links: [
      {
        rotulo: "Pró-Reitoria de Pesquisa (PRPq)",
        url: "https://www.ufmg.br/prpq",
      },
      {
        rotulo: "Pró-Reitoria de Extensão (PROEX)",
        url: "https://www.ufmg.br/proex/",
      },
      {
        rotulo: "Grupos de pesquisa — DGP/CNPq",
        url: "https://www.ufmg.br/prpq/grupos-de-pesquisa/",
      },
    ],
    fonteUrl: "https://www.ufmg.br/prpq/grupos-de-pesquisa/",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "UFOP",
    nome: "Universidade Federal de Ouro Preto",
    tipo: "federal",
    uf: "MG",
    municipios: ["Ouro Preto", "Mariana", "João Monlevade"],
    site: "https://www.ufop.br",
    links: [
      {
        rotulo: "Pró-Reitoria de Pesquisa e Pós-Graduação (PROPP)",
        url: "https://propp.ufop.br/",
      },
      {
        rotulo: "Grupos de pesquisa — lista DGP/CNPq",
        url: "https://propp.ufop.br/pt-br/cadastro-de-grupos-de-pesquisa-cnpq",
      },
      {
        rotulo: "Pró-Reitoria de Extensão e Cultura (PROEX)",
        url: "http://www.proex.ufop.br/",
      },
    ],
    fonteUrl:
      "https://propp.ufop.br/pt-br/cadastro-de-grupos-de-pesquisa-cnpq",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "UFV",
    nome: "Universidade Federal de Viçosa",
    tipo: "federal",
    uf: "MG",
    municipios: ["Viçosa", "Florestal", "Rio Paranaíba"],
    site: "https://www.ufv.br",
    links: [
      {
        rotulo: "Pró-Reitoria de Pesquisa e Pós-Graduação (PPG)",
        url: "https://ppg.ufv.br/",
      },
      {
        rotulo: "Projetos de pesquisa",
        url: "https://ppg.ufv.br/pesquisa/projetos-de-pesquisa/",
      },
      {
        rotulo: "Pró-Reitoria de Extensão e Cultura (PEC)",
        url: "http://www.pec.ufv.br/",
      },
    ],
    fonteUrl: "https://ppg.ufv.br/",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "UFU",
    nome: "Universidade Federal de Uberlândia",
    tipo: "federal",
    uf: "MG",
    municipios: [
      "Uberlândia",
      "Ituiutaba",
      "Monte Carmelo",
      "Patos de Minas",
    ],
    site: "https://www.ufu.br",
    links: [
      {
        rotulo: "Pró-Reitoria de Pesquisa e Pós-Graduação (PROPP)",
        url: "https://propp.ufu.br/",
      },
      {
        rotulo: "Grupos de pesquisa — procedimento",
        url: "https://propp.ufu.br/procedimento/grupos-de-pesquisa",
      },
      {
        rotulo: "Pró-Reitoria de Extensão (PROEX)",
        url: "https://www.ufu.br/proex",
      },
    ],
    fonteUrl: "https://propp.ufu.br/",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "UEMG",
    nome: "Universidade do Estado de Minas Gerais",
    tipo: "estadual",
    uf: "MG",
    municipios: ["Belo Horizonte"],
    site: "https://www.uemg.br",
    links: [
      {
        rotulo: "Portal da UEMG",
        url: "https://www.uemg.br/",
      },
    ],
    fonteUrl: "https://www.uemg.br/",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "UNIMONTES",
    nome: "Universidade Estadual de Montes Claros",
    tipo: "estadual",
    uf: "MG",
    municipios: ["Montes Claros"],
    site: "https://unimontes.br",
    links: [
      {
        rotulo: "Portal da Unimontes",
        url: "https://unimontes.br/",
      },
    ],
    fonteUrl: "https://unimontes.br/",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "IFMG",
    nome: "Instituto Federal de Minas Gerais",
    tipo: "instituto-federal",
    uf: "MG",
    municipios: ["Belo Horizonte"],
    site: "https://www.ifmg.edu.br/portal",
    links: [
      {
        rotulo: "Portal do IFMG",
        url: "https://www.ifmg.edu.br/portal",
      },
    ],
    fonteUrl: "https://www.ifmg.edu.br/portal",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "IFNMG",
    nome: "Instituto Federal do Norte de Minas Gerais",
    tipo: "instituto-federal",
    uf: "MG",
    municipios: ["Montes Claros"],
    site: "https://www.ifnmg.edu.br",
    links: [
      {
        rotulo: "Portal do IFNMG",
        url: "https://www.ifnmg.edu.br/",
      },
    ],
    fonteUrl: "https://www.ifnmg.edu.br/",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "IFSUDESTEMG",
    nome: "Instituto Federal do Sudeste de Minas Gerais",
    tipo: "instituto-federal",
    uf: "MG",
    municipios: [],
    site: "https://www.ifsudestemg.edu.br",
    links: [
      {
        rotulo: "Portal do IF Sudeste MG",
        url: "https://www.ifsudestemg.edu.br/",
      },
    ],
    fonteUrl: "https://www.ifsudestemg.edu.br/",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "IFTM",
    nome: "Instituto Federal do Triângulo Mineiro",
    tipo: "instituto-federal",
    uf: "MG",
    municipios: ["Uberaba"],
    site: "https://iftm.edu.br",
    links: [
      {
        rotulo: "Portal do IFTM",
        url: "https://iftm.edu.br/",
      },
    ],
    fonteUrl: "https://iftm.edu.br/",
    dataAcesso: MG_DATA_ACESSO,
  },
  {
    sigla: "CEFET-MG",
    nome: "Centro Federal de Educação Tecnológica de Minas Gerais",
    tipo: "cefet",
    uf: "MG",
    municipios: ["Belo Horizonte"],
    site: "https://www.cefetmg.br",
    links: [
      {
        rotulo: "Portal do CEFET-MG",
        url: "https://www.cefetmg.br/",
      },
    ],
    fonteUrl: "https://www.cefetmg.br/",
    dataAcesso: MG_DATA_ACESSO,
  },
];
