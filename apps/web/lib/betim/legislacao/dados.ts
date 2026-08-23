/**
 * ═══ LEGISLAÇÃO MUNICIPAL — DADO VERIFICADO (Sprint 4) ═══
 *
 * Plano: `docs/planos/PLANO-revisao-dados-visibilizacao.md`, Sprint 4.
 *
 * REGRA DE OURO DESTA TABELA: só entra como `encontrado` o que foi
 * localizado em DOMÍNIO OFICIAL (.gov.br) na verificação de 2026-08-22.
 * Agregadores terceiros (leismunicipais.com.br, leis.org…) podem ser citados
 * NA NOTA como pista, nunca como link principal — o portal manda o cidadão
 * para a fonte oficial primeiro. Quem não foi checado fica `nao_verificado`,
 * com a nota dizendo ONDE procurar; quem foi checado e não apareceu fica
 * `nao_encontrado`, também com nota. Lacuna aqui é conteúdo, não defeito.
 */

export type ChaveItem =
  | "lei_organica"
  | "plano_diretor"
  | "zoneamento"
  | "codigo_tributario"
  | "codigo_obras_posturas";

export const ORDEM_ITENS: ChaveItem[] = [
  "lei_organica",
  "plano_diretor",
  "zoneamento",
  "codigo_tributario",
  "codigo_obras_posturas",
];

export const ROTULO_ITEM: Record<ChaveItem, string> = {
  lei_organica: "Lei Orgânica",
  plano_diretor: "Plano Diretor",
  zoneamento: "Lei de Zoneamento / Uso do Solo",
  codigo_tributario: "Código Tributário",
  codigo_obras_posturas: "Código de Obras e Posturas",
};

export type StatusItem = "encontrado" | "nao_encontrado" | "nao_verificado";

export const ROTULO_STATUS: Record<StatusItem, string> = {
  encontrado: "Encontrado",
  nao_encontrado: "Não encontrado",
  nao_verificado: "Não verificado",
};

export interface ItemLegislacao {
  chave: ChaveItem;
  status: StatusItem;
  /** URL OFICIAL do documento. Só faz sentido com `encontrado` — a lógica
   *  (`linkDoItem`) zera para os outros status, mas o dado nem deve carregar. */
  url?: string;
  /** Ano da versão encontrada (da lei original ou da última alteração). */
  ano?: number;
  /** De onde veio o documento encontrado (nome da fonte oficial). */
  fonteLabel?: string;
  /** Sempre presente nos dois status negativos: onde foi procurado / onde procurar. */
  nota?: string;
}

/** Municípios prioritários definidos no plano (Sprint 4). */
export const SLUGS_PRIORITARIOS = ["betim", "bh", "aracuai", "itinga", "diamantina"] as const;

const DATASET: Record<string, ItemLegislacao[]> = {
  betim: [
    {
      chave: "lei_organica",
      status: "encontrado",
      url: "https://www.betim.mg.gov.br/publicos/leiorganicadebetim_21084838.pdf",
      ano: 1990,
      fonteLabel: "Prefeitura de Betim — Procuradoria-Geral (página Leis Municipais)",
      // Versão consolidada na Câmara (com emendas até 2024): legislativo.camarabetim.mg.gov.br/NormaJuridica/ShowNormaJuridica/54691
    },
    {
      chave: "plano_diretor",
      status: "encontrado",
      url: "http://www.dpurb.betim.mg.gov.br/site/index.php/legislacao-2/plano-diretor",
      ano: 2024,
      fonteLabel:
        "DPURB/Prefeitura de Betim — texto compilado da LC nº 07/2018 com alterações (LC 15/2021, 16/2022 e 23/2024)",
    },
    {
      chave: "zoneamento",
      status: "encontrado",
      url: "http://www.dpurb.betim.mg.gov.br/site/index.php/legislacao-2/plano-diretor",
      ano: 2024,
      fonteLabel: "DPURB/Prefeitura de Betim",
      nota:
        "Em Betim o zoneamento vigente está NOS ANEXOS do Plano Diretor (Anexos I–IV da LC nº 23/2024, inclusive mapas KMZ) — não há lei de zoneamento separada.",
    },
    {
      chave: "codigo_tributario",
      status: "nao_verificado",
      nota:
        "A página 'Leis Municipais' da Procuradoria-Geral (betim.mg.gov.br/portal/secretarias-paginas/236/leis-municipais) mantém seção própria de 'Legislação Tributária Municipal' — identificar aí a lei do código vigente.",
    },
    {
      chave: "codigo_obras_posturas",
      status: "nao_verificado",
      nota:
        "O PD de 2007 (art. 125) mandou elaborar Código de Edificações/Obras e de Posturas; não localizado nesta sprint. Procurar em betim.mg.gov.br e no sistema normativo da Câmara (legislativo.camarabetim.mg.gov.br).",
    },
  ],
  bh: [
    {
      chave: "lei_organica",
      status: "encontrado",
      url: "https://prefeitura.pbh.gov.br/sites/default/files/estrutura-de-governo/controladoria/2018/documentos/Legisla%C3%A7%C3%A3o/Lei_Organica_do_Municipio.pdf",
      ano: 1990,
      fonteLabel: "Prefeitura de Belo Horizonte — Portal da Transparência (página institucional)",
    },
    {
      chave: "plano_diretor",
      status: "encontrado",
      url: "https://prefeitura.pbh.gov.br/sites/default/files/estrutura-de-governo/meio-ambiente/lei11181-atual.pdf",
      ano: 2019,
      fonteLabel: "Prefeitura de BH — Lei nº 11.181/2019 (PDF oficial); versão consolidada na CMBH",
      // Consolidada: https://www.cmbh.mg.gov.br/atividade-legislativa/pesquisar-legislacao/lei/11181/2019
    },
    {
      chave: "zoneamento",
      status: "encontrado",
      url: "https://www.cmbh.mg.gov.br/atividade-legislativa/pesquisar-legislacao/lei/11181/2019",
      ano: 2019,
      fonteLabel: "CMBH — versão consolidada da Lei nº 11.181/2019",
      nota:
        "O Plano Diretor de 2019 INCORPOROU as normas de parcelamento, ocupação e uso do solo (a antiga NZU, Lei nº 7.166/1996, ficou revogada) — o zoneamento vigente é o do próprio PDU.",
    },
    {
      chave: "codigo_tributario",
      status: "nao_verificado",
      nota:
        "Procurar na página 'Legislação PBH' (prefeitura.pbh.gov.br) e no site da Secretaria de Fazenda (fazenda.pbh.gov.br), que mantém acervo legislativo próprio.",
    },
    {
      chave: "codigo_obras_posturas",
      status: "nao_verificado",
      nota:
        "BH regulamenta obras/posturas via código de edificações e normas da Suhab/URBEL; não identificado o instrumento consolidado nesta sprint. Procurar em prefeitura.pbh.gov.br > Legislação PBH.",
    },
  ],
  aracuai: [
    {
      chave: "lei_organica",
      status: "nao_verificado",
      nota:
        "O portal oficial mantém PASTA 'Lei Orgânica' dentro de Transparência > Legislação (aracuai.mg.gov.br/transparencia/legislacao) — abrir a pasta e pegar o PDF direto; o link do arquivo não aparece estaticamente nesta sprint.",
    },
    {
      chave: "plano_diretor",
      status: "encontrado",
      url: "https://www.aracuai.mg.gov.br/transparencia/legislacao?category=60",
      ano: 2007,
      fonteLabel:
        "Prefeitura de Araçuaí — LC nº 007/2007 (alterada pela LC 14/2011 e Lei 170/2011); LC 006/2007 instituiu o processo de elaboração",
    },
    {
      chave: "zoneamento",
      status: "encontrado",
      url: "https://www.aracuai.mg.gov.br/transparencia/legislacao?category=60",
      ano: 2007,
      fonteLabel: "Prefeitura de Araçuaí — LC nº 008/2007 (parcelamento, ocupação e uso do solo urbano)",
    },
    {
      chave: "codigo_tributario",
      status: "encontrado",
      url: "https://www.aracuai.mg.gov.br/transparencia/legislacao?category=65",
      ano: 2000,
      fonteLabel: "Prefeitura de Araçuaí — LC nº 006/2000, que institui o Código Tributário Municipal",
    },
    {
      chave: "codigo_obras_posturas",
      status: "nao_verificado",
      nota:
        "O portal tem PASTA 'Código de Obras' em Transparência > Legislação — abrir e identificar a lei vigente.",
    },
  ],
  diamantina: [
    {
      chave: "lei_organica",
      status: "encontrado",
      url: "https://www.diamantina.mg.gov.br/arquivos/lei-org--nica-do-munic--pio-de-diamantina_20020813.pdf",
      ano: 1990,
      fonteLabel:
        "Prefeitura de Diamantina (página Gestão de Pessoas) — LO de 1990; emendas até a nº 37/2024 registradas na Câmara (cmdiamantina.mg.gov.br)",
    },
    {
      chave: "plano_diretor",
      status: "encontrado",
      url: "https://www.diamantina.mg.gov.br/imgeditor/file/lei-complementar-n-103-plano-diretor-vigente_22015600.pdf",
      fonteLabel:
        "Prefeitura de Diamantina — LC nº 103, revisão do Plano Diretor vigente nos termos do Estatuto da Cidade (Lei federal 10.257/2001)",
      // Ano da LC 103 não confirmado na verificação — melhor omitir que
      // chutar (regra do número medido).
    },
    {
      chave: "zoneamento",
      status: "nao_verificado",
      nota:
        "Procurar por 'uso do solo'/'zoneamento' no portal de legislação da Prefeitura (diamantina.mg.gov.br/portal/leis_decretos) e no sistema da Câmara (cmdiamantina.mg.gov.br/leis). O PD (LC 103) prevê lei complementar própria para uso e ocupação do solo urbano.",
    },
    {
      chave: "codigo_tributario",
      status: "nao_verificado",
      nota:
        "Procurar por 'código tributário' no portal da Prefeitura (diamantina.mg.gov.br/portal/leis_decretos) e no sistema da Câmara (cmdiamantina.mg.gov.br/leis).",
    },
    {
      chave: "codigo_obras_posturas",
      status: "nao_verificado",
      nota:
        "Procurar por 'código de obras'/'posturas' no portal da Prefeitura e no sistema da Câmara (cmdiamantina.mg.gov.br/leis).",
    },
  ],
  itinga: [
    {
      chave: "lei_organica",
      status: "nao_verificado",
      nota:
        "Site oficial confirmado (www.itinga.mg.gov.br) com repositório de Documentos Públicos em /publicacao (busca por palavra-chave/categoria) e Portal da Transparência próprio (pmitinga.cidadesmg.com.br). Nenhum PDF da LO apareceu na busca desta sprint — usar os dois canais ou pedido LAI.",
    },
    {
      chave: "plano_diretor",
      status: "nao_verificado",
      nota:
        "Procurar em www.itinga.mg.gov.br/publicacao (Documentos Públicos) e no Portal da Transparência pmitinga.cidadesmg.com.br — buscar 'plano diretor'.",
    },
    {
      chave: "zoneamento",
      status: "nao_verificado",
      nota:
        "Mesmos canais: Documentos Públicos da Prefeitura e Portal da Transparência — buscar 'zoneamento'/'uso do solo'.",
    },
    {
      chave: "codigo_tributario",
      status: "nao_verificado",
      nota:
        "Mesmos canais: Documentos Públicos da Prefeitura e Portal da Transparência — buscar 'código tributário'.",
    },
    {
      chave: "codigo_obras_posturas",
      status: "nao_verificado",
      nota:
        "Mesmos canais: Documentos Públicos da Prefeitura e Portal da Transparência — buscar 'código de obras'/'posturas'.",
    },
  ],
};

/** Data da verificação dos links — visível na tela, colada ao número. */
export const VERIFICADO_EM = "2026-08-22";

export default DATASET;
