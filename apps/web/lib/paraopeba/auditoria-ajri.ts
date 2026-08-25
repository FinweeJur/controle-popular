// GERADO por `scripts/extrair-auditoria-ajri.mts` a partir do catálogo que
// `scripts/coletor_auditoria.py` raspa de
// `https://portal.auditoriasocioambiental.com.br/documents`. Não editar à mão:
// rode o script de novo quando o portal publicar documento novo.
//
// ═══ O QUE É ESTE ACERVO ═══
//
// A auditoria socioambiental INDEPENDENTE prevista no Acordo Judicial de
// Reparação Integral de R$ 37,6 bilhões (04/02/2021), sobre o rompimento das
// barragens B-I, B-IV e B-IV_A da mina Córrego do Feijão, em Brumadinho. Quem
// audita é a AECOM, contratada para fiscalizar a execução do Acordo — não é
// documento da Vale nem das instituições de justiça, é o parecer de quem
// verifica os dois.
//
// São 467 documentos, de 2019-02-28 a 2026-07-31:
// 391 Relatórios e 76 Notas Técnicas, todos de autoria da AECOM.
//
// ═══ CATÁLOGO E LINK, NUNCA O ARQUIVO ═══
//
// Nenhum PDF é baixado, copiado ou reservido — o mesmo veredito que
// `biblioteca.ts` já aplica ao acervo das ATIs, e aqui ele é ainda mais
// direto: os Termos de Uso do portal dizem textualmente que o material é
// propriedade da auditora e que não é permitido modificar nem usar
// comercialmente. Catálogo + link para a fonte oficial é integralmente
// compatível com esses termos; espelho de PDF não é, e por isso está fora
// desta entrega (ver `docs/PLANO-ESPELHO-PDF-AJRI.md`).
//
// A `descricao` de cada ficha é o texto que a AECOM escreveu, transcrito
// sem uma vírgula de edição — mesmo tratamento que `clipping-ij.ts` dá aos
// resumos do painel-fonte. O portal não resume, não reclassifica e não
// recalcula nada daqui.
//
// ═══ O QUE O PORTAL NÃO FAZ ═══
//
// NÃO consulta o portal da auditoria em tempo real, NÃO atualiza sozinho e NÃO
// recalcula contagem nenhuma. É um retrato datado, e `PERIODO_AUDITORIA_AJRI`
// existe para toda tela rotular o acervo pelo período que ele realmente cobre.
// O portal-fonte publica ~1×/mês; quando publicar, é o script que roda.
//
// ═══ TRÊS COISAS QUE NÃO ESTÃO AQUI, E POR QUÊ ═══
//
// `autor` (constante AECOM), a página do repositório e a URL de download
// não são colunas: os 467 registros carregariam juntos 61 KB de
// texto repetido ou derivável do `id` no payload da rota — que é o defeito que travou o
// deploy em 15/08/2026 (`docs/HANDOFF-PAYLOAD-LEGISLACAO.md`: 4,7 MiB de texto
// viraram 35,5 MiB de payload, 7,5×). Viraram `AUTOR_AUDITORIA_AJRI`,
// `FONTE_AUDITORIA_AJRI` e `urlDocumentoAjri()` — e o script ABORTA se algum
// registro fugir do padrão, então a economia nunca vira suposição.
//
// ═══ OS TEMAS FORAM NORMALIZADOS POR SLUG SEM ACENTO ═══
//
// O portal expõe 27 facetas de tema, e 2 delas são a mesma coisa cadastrada
// mais de uma vez. Normalizadas por slug sem acento, viram 25 temas:
//   · "Segurança do Alimento 5" + "Segurança do Alimento 1" → `seguranca-do-alimento`
//   · "Risco Saúde Publica 3" + "Risco Saúde Pública 79" → `risco-saude-publica`
//
// (o número colado em cada rótulo é a contagem da faceta no portal, não parte
// do nome — ver a seção seguinte.)
//
// O rótulo exibido é a grafia MAIS FREQUENTE de cada slug: se valesse a primeira
// que aparece, 3 documentos poderiam batizar o tema que 79 usam.
//
// Nenhum documento carregava duas grafias da mesma faceta ao mesmo tempo
// (medido: 0), então a fusão não mudou a contagem de ficha nenhuma.
//
// ═══ O NÚMERO COLADO NO RÓTULO VIROU PROVA DE COMPLETUDE ═══
//
// O portal renderiza a faceta como `Qualidade da Água 229` — o nome do tema
// mais o número de documentos que ele tem. O script separa os dois e CONFERE:
// as 27 facetas somam 2.433 atribuições sobre os 25 temas, e cada
// faceta tem no arquivo exatamente o número que o portal anuncia. Se a coleta
// tivesse parado numa página, a conta não fecharia e a gravação teria abortado.

/** Instrumento jurídico do Acordo sob o qual a auditoria produziu o documento. */
export type InstrumentoAjri = "acordo-de-reparacao" | "acoes-emergenciais" | "monitoramento" | "aguas-e-seguranca-hidrica" | "estudo-de-risco" | "seguranca-das-estruturas" | "estudo-da-producao-agropecuaria";

export const INSTRUMENTO_AJRI_LABEL: Record<InstrumentoAjri, string> = {
  "acordo-de-reparacao": "Acordo de Reparação",
  "acoes-emergenciais": "Ações Emergenciais",
  "monitoramento": "Monitoramento",
  "aguas-e-seguranca-hidrica": "Águas e Segurança Hídrica",
  "estudo-de-risco": "Estudo de Risco",
  "seguranca-das-estruturas": "Segurança das Estruturas",
  "estudo-da-producao-agropecuaria": "Estudo da Produção Agropecuária",
};

/** Ordem de exibição — por volume medido, do maior acervo para o menor. */
export const INSTRUMENTO_AJRI_ORDEM: InstrumentoAjri[] = [
  "acordo-de-reparacao",
  "acoes-emergenciais",
  "monitoramento",
  "aguas-e-seguranca-hidrica",
  "estudo-de-risco",
  "seguranca-das-estruturas",
  "estudo-da-producao-agropecuaria",
];

/** `RP` e `TN` no código do documento, respectivamente. */
export type TipoDocumentoAjri = "relatorio" | "nota-tecnica";

export const TIPO_DOCUMENTO_AJRI_LABEL: Record<TipoDocumentoAjri, string> = {
  "relatorio": "Relatório",
  "nota-tecnica": "Nota Técnica",
};

export const TIPO_DOCUMENTO_AJRI_ORDEM: TipoDocumentoAjri[] = ["relatorio", "nota-tecnica"];

/** Tema da auditoria, já normalizado por slug sem acento — ver o cabeçalho. */
export type TemaAjri = "qualidade-da-agua" | "plano-de-reparacao" | "licenciamento-ambiental" | "sistemas-de-contencao" | "solos-e-sedimentos" | "manejo-de-rejeitos" | "fauna" | "dragagem" | "comunicacao-e-relacionamento" | "flora" | "frentes-emergenciais" | "patrimonio-cultural" | "qualidade-do-ar" | "seguranca-das-estruturas-remanescentes" | "sistema-de-abastecimento-de-agua" | "seguranca-hidrica" | "risco-saude-publica" | "agua-subterranea" | "risco-ecologico" | "risco-meio-ambiente" | "agua-potavel" | "programas-de-compensacao" | "peabp" | "seguranca-do-alimento" | "cronograma";

export const TEMA_AJRI_LABEL: Record<TemaAjri, string> = {
  "qualidade-da-agua": "Qualidade da Água",
  "plano-de-reparacao": "Plano de Reparação",
  "licenciamento-ambiental": "Licenciamento Ambiental",
  "sistemas-de-contencao": "Sistemas de Contenção",
  "solos-e-sedimentos": "Solos e Sedimentos",
  "manejo-de-rejeitos": "Manejo de Rejeitos",
  "fauna": "Fauna",
  "dragagem": "Dragagem",
  "comunicacao-e-relacionamento": "Comunicação e Relacionamento",
  "flora": "Flora",
  "frentes-emergenciais": "Frentes Emergenciais",
  "patrimonio-cultural": "Patrimônio Cultural",
  "qualidade-do-ar": "Qualidade do Ar",
  "seguranca-das-estruturas-remanescentes": "Segurança das Estruturas Remanescentes",
  "sistema-de-abastecimento-de-agua": "Sistema de Abastecimento de Água",
  "seguranca-hidrica": "Segurança Hídrica",
  "risco-saude-publica": "Risco Saúde Pública",
  "agua-subterranea": "Água Subterrânea",
  "risco-ecologico": "Risco Ecológico",
  "risco-meio-ambiente": "Risco Meio Ambiente",
  "agua-potavel": "Água Potável",
  "programas-de-compensacao": "Programas de Compensação",
  "peabp": "PEABP",
  "seguranca-do-alimento": "Segurança do Alimento",
  "cronograma": "Cronograma",
};

/** Ordem de exibição — por volume medido, como os instrumentos. */
export const TEMA_AJRI_ORDEM: TemaAjri[] = [
  "qualidade-da-agua",
  "plano-de-reparacao",
  "licenciamento-ambiental",
  "sistemas-de-contencao",
  "solos-e-sedimentos",
  "manejo-de-rejeitos",
  "fauna",
  "dragagem",
  "comunicacao-e-relacionamento",
  "flora",
  "frentes-emergenciais",
  "patrimonio-cultural",
  "qualidade-do-ar",
  "seguranca-das-estruturas-remanescentes",
  "sistema-de-abastecimento-de-agua",
  "seguranca-hidrica",
  "risco-saude-publica",
  "agua-subterranea",
  "risco-ecologico",
  "risco-meio-ambiente",
  "agua-potavel",
  "programas-de-compensacao",
  "peabp",
  "seguranca-do-alimento",
  "cronograma",
];

/**
 * As facetas do portal que a normalização fundiu. Fica no dado, e não só no
 * comentário, porque é o único lugar onde se vê que o cadastro da fonte tem
 * duplicata — e porque `dados.test.ts` trava isso.
 *
 * `facetas` guarda o rótulo cru do portal, com a contagem colada que ele
 * imprime junto ao nome; `grafias` guarda só os nomes distintos. Os dois
 * números diferem em `seguranca-do-alimento`: lá são duas facetas com o MESMO
 * nome, cadastradas em duplicidade — não é erro de acento, é registro dobrado.
 */
export const TEMAS_AJRI_FUNDIDOS: { slug: TemaAjri; facetas: string[]; grafias: string[] }[] = [
  {
    slug: "seguranca-do-alimento",
    facetas: ["Segurança do Alimento 5", "Segurança do Alimento 1"],
    grafias: ["Segurança do Alimento"],
  },
  {
    slug: "risco-saude-publica",
    facetas: ["Risco Saúde Publica 3", "Risco Saúde Pública 79"],
    grafias: ["Risco Saúde Publica", "Risco Saúde Pública"],
  },
];

export interface DocumentoAuditoriaAjri {
  /** Id nativo do portal — é ele que monta a URL de download. */
  id: number;
  /** `60612553-ACM-DM-CO-RP-PM-0084-2026` — projeto, originador, disciplina, tipo, sequencial, ano. */
  codigo: string;
  /** Texto da própria AECOM, transcrito sem edição. */
  descricao: string;
  instrumento: InstrumentoAjri;
  tipo: TipoDocumentoAjri;
  /** Um ou mais temas, já normalizados. Nenhum documento vem sem tema. */
  temas: TemaAjri[];
  /** ISO `yyyy-mm-dd`. É a data de publicação — use esta para filtrar período. */
  data: string;
  /** Fase contratual da auditoria (4 projetos no acervo). */
  projeto: string;
  /** Disciplina técnica do código: `CO`, `ZZ`, `SH`, `FS`, `A2`… */
  disciplina: string;
  /**
   * Ano de REFERÊNCIA do documento, do código — não é o ano de `data`:
   * 3 documentos divergem, e um traz "2024_R01" (revisão). Por isso é string.
   */
  ano: string;
}

/** Autoria de TODO o acervo, conferida registro a registro na geração. */
export const AUTOR_AUDITORIA_AJRI = "AECOM";

/** Fonte oficial — citar sempre que exibir, em toda ficha. */
export const FONTE_AUDITORIA_AJRI = {
  nome: "Portal da Auditoria Socioambiental do Acordo Judicial de Reparação Integral",
  autor: "AECOM",
  /** Repositório de busca do portal. Exige cadastro para abrir o documento. */
  repositorio: "https://portal.auditoriasocioambiental.com.br/documents",
  termos: "https://portal.auditoriasocioambiental.com.br/termos-de-uso",
  acordo: "https://portal.auditoriasocioambiental.com.br/acordos",
} as const;

/**
 * Link canônico do documento na fonte oficial. É o `download_cover` do
 * portal: ele gera o PDF sob demanda e pede sessão — a página avisa disso, em
 * vez de prometer um arquivo que abriria direto.
 */
export function urlDocumentoAjri(id: number): string {
  return `${FONTE_AUDITORIA_AJRI.repositorio}/${id}/download_cover`;
}

/** Cobertura real do acervo — usar para rotular a tela, nunca "atualizado hoje". */
export const PERIODO_AUDITORIA_AJRI = {
  de: "2019-02-28",
  ate: "2026-07-31",
} as const;

/**
 * Contagens do acervo, para páginas SERVIDOR que só mostram números.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * `AUDITORIA_AJRI` abaixo tem 336 KiB — se uma página de servidor importar o
 * array só para exibir `.length` ou contagem por tipo, o webpack embute o
 * arquivo inteiro no bundle do Worker (ver `docs/HANDOFF-PAYLOAD-
 * LEGISLACAO.md`). Esta cobertura é literal e pequena; o array fica
 * reservado aos componentes de CLIENTE (`AuditoriaClient.tsx`), que têm
 * bundle próprio sem teto de 3 MiB gzip. A paridade entre a cobertura e o
 * array é travada por teste em `dados.test.ts` — se alguém regenerar o
 * acervo e a contagem mudar, o teste falha.
 */
export const COBERTURA_AUDITORIA_AJRI = {
  total: 467,
  porTipo: {
    relatorio: 391,
    "nota-tecnica": 76,
  },
  instrumentos: 7,
  temas: 25,
} as const;

// AUDITORIA_AJRI movido para public/data/auditoria-ajri.json — use lerAuditoriaAjri() (server) ou fetch(/data/auditoria-ajri.json) (cliente).
