/**
 * @file apps/web/lib/universidades/dados-ufvjm.ts
 * @description Piloto do índice universitário: a UFVJM por inteiro.
 *
 * Papel no portal: prova o desenho da zona `/universidades` com dado real —
 * instituição, unidades acadêmicas, grupos de pesquisa e projetos de extensão
 * com link oficial em cada linha.
 *
 * De onde vem este dado (medido em 2026-10-30):
 * - **Grupos (80):** relatório "Recursos Humanos, Linhas de Pesquisa e
 *   Instituições Parceiras" gerado pelo DGP/CNPq e publicado pela PRPPG da
 *   UFVJM em 13/07/2022. O PDF é a fonte específica de cada grupo e foi
 *   aberto e lido na coleta. O relatório é de 2022 — é o consolidado oficial
 *   mais recente que a própria UFVJM publica nessa página. Grupo novo só
 *   entra quando houver relatório oficial novo; o DGP bloqueia coleta
 *   automatizada, então não se inventa a lista.
 * - **Extensão:** a UFVJM publica os projetos no SIEXC. Só entram os que têm
 *   página pública específica conferida (os demais exigem login e não têm
 *   URL pública estável). O portal institucional de extensão entra como link
 *   da instituição, não como projeto.
 * - **Unidades:** as 11 unidades acadêmicas e seus campi vêm do portal da
 *   UFVJM; o site de cada unidade foi conferido por requisição HTTP.
 *
 * Limitação declarada: o relatório de 2022 trunca alguns nomes de grupo na
 * própria diagramação. Nesses casos o nome é mantido como está na fonte e
 * recebe `fonteNota`, em vez de ser completado por suposição.
 */

import type {
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
  Unidade,
} from "./tipos";

/** Data em que os links deste módulo foram abertos e conferidos. */
export const UFVJM_DATA_ACESSO = "2026-10-30";

/** Relatório oficial do DGP/CNPq publicado pela PRPPG (PDF, 2022). */
const FONTE_GRUPOS =
  "https://portal.ufvjm.edu.br/prppg/pesquisa/grupos-de-pesquisa/2020/grupos-de-pesquisa-dgp-cnpq-2022-ufvjm.pdf/@@download/file/rel_grupo_recursos_humanos_cadastrados_dir_por_grupo.pdf";

/** Ano de referência do relatório de grupos. */
const ANO_GRUPOS = 2022;

/** Monta um grupo já com a procedência comum, para não repetir erro de digitação. */
function grupo(
  nome: string,
  area: string,
  lider: string,
  extra: { fonteNota?: string } = {},
): GrupoPesquisa {
  return {
    instituicao: "UFVJM",
    nome,
    area,
    lider,
    anoReferencia: ANO_GRUPOS,
    fonteUrl: FONTE_GRUPOS,
    dataAcesso: UFVJM_DATA_ACESSO,
    ...(extra.fonteNota ? { fonteNota: extra.fonteNota } : {}),
  };
}

/** Monta um projeto de extensão com a procedência comum. */
function projeto(
  nome: string,
  url: string,
  area?: string,
): ProjetoExtensao {
  return {
    instituicao: "UFVJM",
    nome,
    ...(area ? { area } : {}),
    url,
    plataforma: "SIEXC",
    fonteUrl: url,
    dataAcesso: UFVJM_DATA_ACESSO,
  };
}

export const INSTITUICAO_UFVJM: Instituicao = {
  sigla: "UFVJM",
  nome: "Universidade Federal dos Vales do Jequitinhonha e Mucuri",
  tipo: "federal",
  uf: "MG",
  municipios: ["Diamantina", "Teófilo Otoni", "Unaí", "Janaúba"],
  site: "https://portal.ufvjm.edu.br",
  links: [
    {
      rotulo: "Portal da UFVJM",
      url: "https://portal.ufvjm.edu.br",
    },
    {
      rotulo: "PRPPG — Pesquisa e Pós-Graduação",
      url: "https://portal.ufvjm.edu.br/prppg",
    },
    {
      rotulo: "Grupos de pesquisa (PRPPG)",
      url: "https://portal.ufvjm.edu.br/prppg/pesquisa/grupos-de-pesquisa",
    },
    {
      rotulo: "PROEXC — Extensão e Cultura",
      url: "https://portal.ufvjm.edu.br/proexc",
    },
    {
      rotulo: "SIEXC — Sistema de Extensão e Cultura",
      url: "https://siexc.ufvjm.edu.br/",
    },
  ],
  fonteUrl:
    "https://portal.ufvjm.edu.br/prppg/pesquisa/grupos-de-pesquisa",
  dataAcesso: UFVJM_DATA_ACESSO,
};

export const UNIDADES_UFVJM: Unidade[] = [
  {
    instituicao: "UFVJM",
    sigla: "FCA",
    nome: "Faculdade de Ciências Agrárias",
    campus: "Diamantina",
    site: "https://fcaufvjm.com.br/",
  },
  {
    instituicao: "UFVJM",
    sigla: "FCBS",
    nome: "Faculdade de Ciências Biológicas e da Saúde",
    campus: "Diamantina",
    site: "http://portal.ufvjm.edu.br/estudantes/unidades-academicas/fcbs",
  },
  {
    instituicao: "UFVJM",
    sigla: "FACET",
    nome: "Faculdade de Ciências Exatas",
    campus: "Diamantina",
    site: "https://facet.ufvjm.edu.br/",
  },
  {
    instituicao: "UFVJM",
    sigla: "FAMED",
    nome: "Faculdade de Medicina de Diamantina",
    campus: "Diamantina",
    site: "https://site.ufvjm.edu.br/famed/",
  },
  {
    instituicao: "UFVJM",
    sigla: "FIH",
    nome: "Faculdade Interdisciplinar em Humanidades",
    campus: "Diamantina",
    site: "http://portal.ufvjm.edu.br/estudantes/unidades-academicas/fih/",
  },
  {
    instituicao: "UFVJM",
    sigla: "ICT",
    nome: "Instituto de Ciência e Tecnologia",
    campus: "Diamantina",
    site: "https://www.ict.ufvjm.edu.br/",
  },
  {
    instituicao: "UFVJM",
    sigla: "FACSAE",
    nome: "Faculdade de Ciências Sociais Aplicadas e Exatas",
    campus: "Teófilo Otoni",
  },
  {
    instituicao: "UFVJM",
    sigla: "FAMMUC",
    nome: "Faculdade de Medicina do Mucuri",
    campus: "Teófilo Otoni",
    site: "https://site.ufvjm.edu.br/fammuc/",
  },
  {
    instituicao: "UFVJM",
    sigla: "ICET",
    nome: "Instituto de Ciência, Engenharia e Tecnologia",
    campus: "Teófilo Otoni",
    site: "https://ensino.ufvjm.edu.br/icet/",
  },
  {
    instituicao: "UFVJM",
    sigla: "ICA",
    nome: "Instituto de Ciências Agrárias",
    campus: "Unaí",
    site: "https://site.ufvjm.edu.br/ica/",
  },
  {
    instituicao: "UFVJM",
    sigla: "IECT",
    nome: "Instituto de Engenharia, Ciência e Tecnologia",
    campus: "Janaúba",
  },
];

export const GRUPOS_UFVJM: GrupoPesquisa[] = [
  grupo(
    "Grupo de Estudos Estéticas Diaspóricas - GEED",
    "Letras",
    "Roberta Maria Ferreira Alves",
  ),
  grupo("Jequi", "Saúde Coletiva", "Rosana Passos Cambraia"),
  grupo(
    "Núcleo de Pesquisa em Ergonomia e Termografia Infravermelha e Dor - NERTI",
    "Fisioterapia e Terapia Ocupacional",
    "Márcio Alves Marçal",
  ),
  grupo(
    "Estudos do Desempenho Motor e Funcional Humano",
    "Fisioterapia e Terapia Ocupacional",
    "Renato Guilherme Trede Filho",
  ),
  grupo(
    "Fisiologia do Exercício e da Inflamação",
    "Fisioterapia e Terapia Ocupacional",
    "Ana Cristina Rodrigues Lacerda",
  ),
  grupo(
    "Geoquímica Ambiental: UFVJM",
    "Geociências",
    "Hernando Baggio Filho",
  ),
  grupo(
    "Biologia do Exercício e Imunometabolismo",
    "Imunologia",
    "Etel Rocha Vieira",
  ),
  grupo(
    "Núcleo de Pesquisa, Estudos e Extensão em Saúde Coletiva",
    "Saúde Coletiva",
    "Ana Paula Azevedo Hemmi",
  ),
  grupo(
    "Health Sciences Research Group (HSRG)",
    "Fisioterapia e Terapia Ocupacional",
    "Vinicius Cunha de Oliveira",
  ),
  grupo(
    "Núcleo de Estudos em Fertilidade do Solo (NEFERT - UFVJM)",
    "Agronomia",
    "Enilson de Barros Silva",
  ),
  grupo(
    "GEPAF VALES - Grupo de Pesquisa em Agricultura Familiar nos Vales do Jequitinhonha e Mucuri",
    "Agronomia",
    "Valéria Cristina da Costa",
  ),
  grupo(
    "Grupo de Biomecânica e Bioengenharia",
    "Engenharia Mecânica",
    "Libardo Andrés González Torres",
  ),
  grupo(
    "Grupo de Quimiometria Analítica",
    "Química",
    "Paulo Henrique Fidencio",
  ),
  grupo(
    "Grupo de Estudos em Fruticultura (GEFRUT - UFVJM)",
    "Agronomia",
    "Maria do Ceu Monteiro da Cruz",
  ),
  grupo(
    "Grupo de Pesquisa em Alimentação, cultura, saúde e sociedade",
    "Saúde Coletiva",
    "Vanessa Alves Ferreira",
  ),
  grupo(
    "Grupo de Estudo e Pesquisa Interdisciplinar nos ciclos de vida - GEPIC",
    "Saúde Coletiva",
    "Helisamara Mota Guedes",
  ),
  grupo(
    "Grupo de ensino, pesquisa e extensão em determinantes de saúde",
    "Medicina",
    "Maria Letícia Costa Reis",
  ),
  grupo(
    "Ecologia Aquática e Aquicultura",
    "Recursos Pesqueiros e Engenharia de Pesca",
    "Marcelo Mattos Pedreira",
  ),
  grupo("Tecnologia de Sementes", "Agronomia", "Marcela Carlota Nery"),
  grupo(
    "Hop Musical - Grupo de Estudos em Métodos e Técnicas de Ensino de Dança, Teatro e Música",
    "Educação",
    "José Rafael Madureira",
  ),
  grupo(
    "GEAPS - Grupo de Estudos em Atenção Primária à Saúde",
    "Saúde Coletiva",
    "Liliane da Consolação Campos Ribeiro",
  ),
  grupo(
    "Grupo de Eletroquímica e Nanotecnologia Aplicada - GENAp",
    "Química",
    "Lucas Franco Ferreira",
  ),
  grupo(
    "NAC - Núcleo de Agroecologia e Campesinato",
    "Agronomia",
    "Claudenir Fávero",
  ),
  grupo(
    "Gurpo Pesquisa em Corpus Infantil Longitudinal",
    "Linguística",
    "Pedro Perini Frizzera da Mota Santos",
    { fonteNota: "Nome grafado assim na fonte." },
  ),
  grupo(
    "Micologia, Enzimologia e Desenvolvimento de Produtos",
    "Biotecnologia",
    "Vivian Machado Benassi",
  ),
  grupo(
    "Núcleo de aproveitamento e desenvolvimento de novos materiais a partir da biomassa do semiárido para",
    "Engenharia de Materiais e Metalúrgica",
    "Fernanda Guerra Lima Medeiros Borsagli",
    { fonteNota: "Nome truncado no relatório da fonte." },
  ),
  grupo(
    "LALE - Grupo de pesquisa em Linguística Aplicada - Línguas Estrangeiras",
    "Linguística",
    "Hejaine de Oliveira Fonseca",
  ),
  grupo(
    "Grupo de Estudos em Neurociências e Exercício - GENE",
    "Educação Física",
    "Ricardo Cardoso Cassilhas",
  ),
  grupo(
    "Núcleo de Estudo e Pesquisa do Zoneamento Ambiental e Produtivo",
    "Recursos Florestais e Engenharia Florestal",
    "Danielle Piuzana Mucida",
  ),
  grupo(
    "Grupo de Pesquisa em Plantas Daninhas e Tecnologia de Aplicação (PDTec)",
    "Agronomia",
    "Mariana Rodrigues Bueno",
  ),
  grupo(
    "Agricultura e Modelagem Ecológica - AGRIME",
    "Agronomia",
    "Ricardo Siqueira da Silva",
  ),
  grupo(
    "FORPROLL: Formação de Professores de Línguas e Literatura",
    "Letras",
    "Heliandro Rosa de Jesus",
  ),
  grupo(
    "Estudo de matérias-primas e processos na indústria alimentícia",
    "Ciência e Tecnologia de Alimentos",
    "Marcio Schmiele",
  ),
  grupo(
    "Grupo de Pesquisa Interinstitucional de Estudos Multidisciplinares em Administração: UFVJM, Campus JK,",
    "Administração",
    "Altamir Fernandes de Oliveira",
    { fonteNota: "Nome truncado no relatório da fonte." },
  ),
  grupo(
    "NewGen - Intelligent Engineering Solutions: Núcleo de Estudos e Pesquisas Científicas, Desenvolvimento e",
    "Engenharia Química",
    "José Izaquiel Santos da Silva",
    { fonteNota: "Nome truncado no relatório da fonte." },
  ),
  grupo(
    "Manejo Integrado de Pragas",
    "Agronomia",
    "Marcus Alvarenga Soares",
  ),
  grupo(
    "Núcleo de Pesquisas sobre Educação, Políticas e Cidadania",
    "Ciência Política",
    "Márcio Achtschin Santos",
  ),
  grupo(
    "CAPOEIRAGEM - Grupo de Pesquisas em Capoeira Angola Ancestral.",
    "Educação Física",
    "Leandro Ribeiro Palhares",
  ),
  grupo(
    "Desenvolvimento e Controle de Qualidade de Produtos Farmacêuticos",
    "Farmácia",
    "Alvaro Dutra de Carvalho Junior",
  ),
  grupo(
    "NUPENS Núcleo de Pesquisas e Estudos em Nutrição e Saúde",
    "Nutrição",
    "Romero Alves Teixeira",
  ),
  grupo(
    "Grupo de Pesquisa em Interações Biológicas",
    "Ecologia",
    "Andre Rodrigo Rech",
  ),
  grupo(
    "Grupo de Avaliação e Pesquisas Educacionais - GAPE",
    "Educação",
    "Stella Maris Lemos Nunes",
  ),
  grupo(
    "Laboratório de eletromagnetismo aplicado aos sistemas biológicos, metamateriais e as antenas (LESMA)",
    "Física",
    "Welyson Tiano dos Santos Ramos",
  ),
  grupo(
    "Centro de Políticas Públicas da Universidade Federal dos Vales do Jequitinhonha e Mucuri (CPP-UFVJM)",
    "Ciência Política",
    "Beni Trojbicz",
  ),
  grupo(
    "Grupo de Estudos e Pesquisas Sócio Históricas em Educação dos Vales",
    "Educação",
    "Ana Cristina Pereira Lage",
  ),
  grupo(
    "Diagnóstico, intervenção e efeitos metabólicos de alimentos e dietas na saúde e na doença nos diferentes",
    "Nutrição",
    "Luciana Neri Nobre",
    { fonteNota: "Nome truncado no relatório da fonte." },
  ),
  grupo(
    "Grupo de Estudo dos Povos Indígenas de Minas Gerais",
    "Antropologia",
    "Marivaldo Aparecido de Carvalho",
  ),
  grupo(
    "Centro de Estudos em Saúde do Trabalhador - Pesquisa e Intervenção/CEST-PQI",
    "Saúde Coletiva",
    "Luciana de Freitas Campos",
  ),
  grupo(
    "Grupo de Pesquisa em Eletroanalítica de Diamantina",
    "Química",
    "Wallans Torres Pio dos Santos",
  ),
  grupo(
    "Núcleo de Estudos em Tecnologias para Secagem e Armazenamento",
    "Agronomia",
    "Danúbia Aparecida Costa Nobre",
  ),
  grupo(
    "Núcleo de Estudos em Análise de Dados Multivariados, Eficiência e Análise de Redes Organizacionais Públicas,",
    "Administração",
    "Edimilson Eduardo da Silva",
    { fonteNota: "Nome truncado no relatório da fonte." },
  ),
  grupo(
    "Núcleo de Pesquisa em Química e Ciências de Materiais da Serra Geral",
    "Química",
    "Patrícia Xavier Baliza",
  ),
  grupo(
    "GEPLA - Grupo de Estudos do Pensamento Latino-Americano",
    "Economia",
    "Diogo Prado Evangelista",
  ),
  grupo(
    "GPMAEM - Grupo de Pesquisa sobre Metodologias Ativas na Educação Matemática",
    "Educação",
    "Wagner Lannes",
  ),
  grupo(
    "GETSAT - Grupo de Estudos em Territórios, Sociobiodiversidade e Agriculturas Tradicionais",
    "Agronomia",
    "Claudenir Fávero",
  ),
  grupo(
    "Núcleo de Estudos das Sociedades Agrárias",
    "História",
    "Marcos Lobato Martins",
  ),
  grupo(
    "Núcleo Estratégico e Interdisciplinar de Engenharia do Mucuri (NEIEMUC)",
    "Engenharia Civil",
    "Francisco César Dalmo",
  ),
  grupo("AGRICULTURA NO CERRADO", "Agronomia", "Anderson Barbosa Evaristo"),
  grupo(
    "Ciência, tecnologia de alimentos, e nutrição",
    "Ciência e Tecnologia de Alimentos",
    "Poliana Mendes de Souza",
  ),
  grupo(
    "Núcleo de Pesquisa em Turismo: Patrimônios, Territórios Descoloniais e Trabalho",
    "Turismo",
    "Virginia Martins Fonseca",
  ),
  grupo(
    "Grupo de Estudos em Teoria Ator-Rede e Educação - GETARE",
    "Educação",
    "Luciana Resende Allain",
  ),
  grupo("Meio Ambiente", "Agronomia", "Alexandre Christofaro Silva"),
  grupo(
    "Núcleo de Pesquisa, Ensino e Extensão sobre Diáspora Africana - NUPED",
    "Filosofia",
    "Adna Candido de Paula",
  ),
  grupo(
    "Núcleo de Estudos Afro-brasileiros e Indígenas",
    "Educação",
    "Ana Paula Nogueira Nunes",
  ),
  grupo(
    "Grupo de Pesquisa em Abordagens e Metodologias de Ensino de Ciências (GPAMEC)",
    "Educação",
    "Geraldo Wellington Rocha Fernandes",
  ),
  grupo(
    "Grupo de Estudos em Desenvolvimento Econômico Brasileiro (GEDEB)",
    "Economia",
    "Carlos Henrique Lopes Rodrigues",
  ),
  grupo(
    "Estatística e Experimentação",
    "Probabilidade e Estatística",
    "Paulo César de Resende Andrade",
  ),
  grupo(
    "BioCER - Biologia Celular, Endocrinologia e Reprodução/UFVJM",
    "Medicina",
    "Kinulpe Honorato Sampaio",
  ),
  grupo(
    "Observatório dos Vales e do Semiárido Mineiro",
    "Geografia",
    "Aline Weber Sulzbacher",
  ),
  grupo(
    "Grupo de Estudos e Pesquisas em Técnicas Corporais Artísticas, Marciais e Terapêuticas.",
    "Educação",
    "Gilbert de Oliveira Santos",
  ),
  grupo(
    "Núcleo de Pesquisas Econômicas e Sociais - NUPE",
    "Economia",
    "Georgia Fernandes Barros",
  ),
  grupo("Vigilância em Saúde", "Saúde Coletiva", "Mirtes Ribeiro"),
  grupo(
    "Atividades Lúdicas para a promoção de desenvolvimento e aprendizagem",
    "Educação",
    "Flávia Gonçalves da Silva",
  ),
  grupo(
    "GEOVALES - Grupo de Estudos e Pesquisas em Geociências e Engenharia dos Vales do Jequitinhonha e",
    "Geociências",
    "Antonio Jorge de Lima Gomes",
    { fonteNota: "Nome truncado no relatório da fonte." },
  ),
  grupo(
    "Grupo de Estudo do Diabetes - GED",
    "Saúde Coletiva",
    "Edson da Silva",
  ),
  grupo(
    "Grupo de Estudo e Pesquisa em Educação Matemática (GEPEMA)",
    "Educação",
    "Niusarte Virginia Pinheiro",
  ),
  grupo("Física Aplicada (FisAp)", "Física", "Paulo Alliprandini Filho"),
  grupo("Crítica Social", "Ciência Política", "Atanásio Mykonios"),
  grupo(
    "Melhoramento Genético Animal",
    "Zootecnia",
    "Cristina Moreira Bonafé",
  ),
  grupo(
    "Grupo de Estudos de Crítica da Economia Política",
    "Economia",
    "Márcio Paschoino Lupatini",
  ),
];

export const PROJETOS_UFVJM: ProjetoExtensao[] = [
  projeto(
    "Fisioterapia Aquática para Fibromialgia",
    "https://siexc.ufvjm.edu.br/projetosfluxocontinuo/1265",
    "Saúde",
  ),
  projeto(
    "Bebê a Bordo",
    "https://siexc.ufvjm.edu.br/projetos/219",
    "Saúde",
  ),
];
