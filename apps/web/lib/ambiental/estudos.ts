import { semAcento } from "@/lib/busca/normalizar";

/**
 * Lógica PURA (sem React, sem banco, sem rede) de `/ambiental/estudos` —
 * a lista de audiências públicas de EIA/RIMA e os links que o Estado
 * publicou para os estudos. Molde de estilo e de teste: `legislacao-unificada.ts`
 * (mesmo padrão de docstring + `lib/terras/alertas.ts`). Vive em `lib/` e sem
 * `"use client"` de propósito: filtro e ordenação são testáveis com `vitest`
 * sem montar componente; o componente cliente só chama estas funções.
 *
 * O dado vem pronto do coletor `ambiental_audiencias` em
 * `etl/betim/dados/ambiental-estudos.json` (medido em 2026-08-20: 305
 * audiências, 453 linhas — uma audiência pode ter mais de um link/estudo, daí
 * `linhas.length` >= `audiencias.length`). Este módulo não refaz nenhuma
 * conta do coletor: só filtra, ordena e rotula o que já veio pronto.
 *
 * ═══ `nome_arquivo: null` É DADO, NÃO BURACO A PREENCHER ═══
 *
 * `nome_arquivo` é null DE PROPÓSITO quando o repositório do estudo não dá
 * para enumerar por scraping (Dropbox, MEGA, OneDrive, site de consultoria —
 * cada um exige sessão, JavaScript ou paginação que o coletor não replica).
 * A linha continua existindo com `link_ficha` e `url` válidos: suprimi-la
 * faria a página parecer mais completa do que a fonte pública é. É por isso
 * que `somenteComArquivo` é um FILTRO — algo que o usuário escolhe aplicar —
 * e nunca o comportamento padrão da lista.
 *
 * ═══ `repositorio` É EIXO DE FILTRO DE PRIMEIRA CLASSE ═══
 *
 * O Estado não hospeda o EIA/RIMA: publica um link para nuvem de terceiro.
 * Isso não é detalhe de exibição — é a métrica de quanto do acervo é de fato
 * auditável sem sair do portal (`resumo.com_arquivo_enumeravel` é 187 das
 * 453 linhas, medido em 2026-08-20). Por isso `repositorio` entra em
 * `FiltroEstudos`, em `opcoesDeFiltro` e tem sua própria contagem
 * (`contarPorRepositorio`), no mesmo nível de `classe` ou `municipio` — não
 * escondido como coluna secundária de tabela.
 */

/** Uma linha de `linhas[]` — um link/estudo dentro de uma audiência. Tipo
 *  derivado direto da forma real do JSON (ver `etl/betim/dados/ambiental-estudos.json`),
 *  sem inventar campo que a fonte não tem. */
export interface EstudoLinha {
  id_fonte: number;
  empreendimento: string;
  municipio: string;
  municipios: string[];
  municipios_ids: string[];
  unidade_regional: string;
  classe: number;
  modalidade: string;
  atividades: string[];
  /** dd/mm/aaaa — use `dataParaOrdenacao` para ordenar, nunca o texto cru. */
  data_publicacao: string;
  ano: number;
  /** dd/mm/aaaa */
  data_limite: string;
  processo: string;
  link_ficha: string;
  /** null quando o repositório não é enumerável por scraping — ver docstring
   *  do módulo. Não é ausência de dado da fonte, é limite do coletor. */
  nome_arquivo: string | null;
  /** null quando o estudo não foi classificado em nenhuma das categorias
   *  conhecidas (eia/rima/pca/art/outro). */
  classe_estudo: string | null;
  classe_estudo_rotulo: string;
  url: string;
  repositorio: string;
  repositorio_rotulo: string;
  /** ISO (aaaa-mm-dd) das duas datas. Existem porque ordenar data brasileira
   *  como texto ordena por DIA — a coluna ordena pelo ISO e exibe o BR. */
  data_publicacao_iso: string | null;
  data_limite_iso: string | null;
  /** Endereço do repositório, como o Estado publicou. */
  link_repositorio: string | null;
  /** Resultado de acessar `link_repositorio` em 20/08/2026 (checar_links.py):
   *  `ok` | `morto_404` | `morto_dns` | `bloqueado` | `sem_resposta` |
   *  `instavel` | `nao_checado`. Publicar o link sem dizer se ele abre seria
   *  repetir o erro da fonte: 276 das 1.004 audiências (27%) não têm nenhum
   *  endereço que abra. */
  link_estado: string;
  link_estado_rotulo: string;
}

/** Um item de `audiencias[]` — a audiência pública em si, antes de ser
 *  desdobrada em uma ou mais `EstudoLinha`. */
export interface AudienciaEstudo {
  id_fonte: number;
  numero_processo: string;
  nome_empreendimento: string;
  cnpj_raiz: string | null;
  eh_pessoa_fisica: boolean;
  documento_classificacao: string;
  municipios_ids: string[];
  municipios_nomes: string[];
  municipios_nao_resolvidos: string[];
  unidade_regional: string;
  classe: number;
  modalidade: string;
  atividades_descricoes: string[];
  data_publicacao: string;
  data_limite_solicitacao: string;
  link_iof: string;
  links_eia_rima: string[];
  repositorio_tipos: string[];
  documentos: unknown[];
}

/** Exportado para `estudos-dados.ts` (server-only) tipar o envelope lido. */
export interface ResumoEstudos {
  audiencias: number;
  linhas: number;
  com_arquivo_enumeravel: number;
  por_repositorio: Record<string, number>;
  por_classe_estudo: Record<string, number>;
  municipios_distintos: number;
}

/** Rótulo de exibição de cada `repositorio` — cópia do `repositorio_rotulo`
 *  que já vem em cada linha, mas como mapa fixo, para preencher a legenda de
 *  um filtro/chip antes de qualquer linha estar filtrada (ex.: mostrar todas
 *  as opções de repositório mesmo antes do usuário escolher município). Os
 *  valores foram lidos direto de `resumo.por_repositorio` no JSON real. */
export const REPOSITORIO_LABEL: Record<string, string> = {
  onedrive: "OneDrive",
  drive: "Google Drive",
  site_proprio: "Site próprio",
  orgao: "Órgão",
  dropbox: "Dropbox",
  pdf_direto: "PDF direto",
  google_sites: "Google Sites",
  mega: "MEGA",
};

/** Rótulo de exibição de cada `classe_estudo` — mesma lógica de
 *  `REPOSITORIO_LABEL`, valores lidos de `resumo.por_classe_estudo`. */
/** Os dois estados que significam "o documento não existe mais no endereço
 *  publicado". `bloqueado` fica de fora de propósito: o arquivo pode existir e
 *  estar fechado, que é queixa diferente; e `sem_resposta` também, porque
 *  pode ser a rede de quem mediu. */
export const ESTADOS_QUEBRADOS = new Set(["morto_404", "morto_dns"]);

export const ESTADO_LINK_LABEL: Record<string, string> = {
  ok: "Abre",
  morto_404: "Quebrado (404)",
  morto_dns: "Quebrado (domínio sumiu)",
  bloqueado: "Acesso negado",
  sem_resposta: "Sem resposta",
  instavel: "Instável",
  nao_checado: "Não verificado",
};

export const CLASSE_ESTUDO_LABEL: Record<string, string> = {
  eia: "EIA",
  pca: "PCA",
  rima: "RIMA",
  art: "ART",
  outro: "Outro",
};

/** `lerEstudos()` mudou para `@/lib/ambiental/estudos-dados` (server-only):
 *  o JSON de 4,9 MB estourava o teto de 3 MiB gzip do Worker (10027) e
 *  contaminava o chunk cliente via `BuscaEstudos.tsx`. Tipos e lógica pura
 *  continuam aqui. */

/** Campo de filtro vazio/`undefined` não filtra nada — mesma convenção de
 *  `FiltroLegislacaoUnificada`. `texto` é O.R. contra vários campos; os
 *  demais são E lógico entre si (combináveis). */
export interface FiltroEstudos {
  texto?: string;
  municipio?: string;
  unidadeRegional?: string;
  classe?: number;
  classeEstudo?: string;
  repositorio?: string;
  ano?: number;
  modalidade?: string;
  somenteComArquivo?: boolean;
  /** Filtra pelo resultado do teste de acesso (`link_estado`). */
  linkEstado?: string;
  /** Atalho do anterior: só o que NÃO abre — a lista que vira pedido de LAI. */
  somenteLinkQuebrado?: boolean;
}

/** Filtra `linhas` por `filtro`, combinando os campos com E lógico. `texto`
 *  casa sem acento e sem caixa (`semAcento`, `lib/busca/normalizar.ts`)
 *  contra empreendimento, município, nome do arquivo e processo — os quatro
 *  campos que alguém digitaria buscando um caso específico. `nome_arquivo`
 *  nulo entra na busca como string vazia (não casa, não quebra). */
export function filtrarEstudos(linhas: EstudoLinha[], filtro: FiltroEstudos): EstudoLinha[] {
  const termo = filtro.texto?.trim() ? semAcento(filtro.texto.trim()) : "";

  return linhas.filter((linha) => {
    if (termo) {
      const alvo = semAcento(
        [linha.empreendimento, linha.municipio, linha.nome_arquivo ?? "", linha.processo].join(" ")
      );
      if (!alvo.includes(termo)) return false;
    }
    if (filtro.municipio && linha.municipio !== filtro.municipio) return false;
    if (filtro.unidadeRegional && linha.unidade_regional !== filtro.unidadeRegional) return false;
    if (filtro.classe !== undefined && linha.classe !== filtro.classe) return false;
    if (filtro.classeEstudo && linha.classe_estudo !== filtro.classeEstudo) return false;
    if (filtro.repositorio && linha.repositorio !== filtro.repositorio) return false;
    if (filtro.ano !== undefined && linha.ano !== filtro.ano) return false;
    if (filtro.modalidade && linha.modalidade !== filtro.modalidade) return false;
    if (filtro.somenteComArquivo && !linha.nome_arquivo) return false;
    if (filtro.linkEstado && linha.link_estado !== filtro.linkEstado) return false;
    if (filtro.somenteLinkQuebrado && !ESTADOS_QUEBRADOS.has(linha.link_estado)) return false;
    return true;
  });
}

function valoresUnicosOrdenados(valores: (string | null | undefined)[]): string[] {
  return Array.from(new Set(valores.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    semAcento(a).localeCompare(semAcento(b))
  );
}

/** Opções para popular cada filtro — sempre derivadas das `linhas`
 *  recebidas, nunca hardcoded (município e repositório mudam a cada coleta).
 *  Cada lista sai ordenada e sem `null`/`undefined`/vazio. */
export function opcoesDeFiltro(linhas: EstudoLinha[]): {
  municipios: string[];
  unidadesRegionais: string[];
  classes: number[];
  classesEstudo: string[];
  repositorios: string[];
  anos: number[];
  modalidades: string[];
  estadosDeLink: string[];
} {
  return {
    municipios: valoresUnicosOrdenados(linhas.map((l) => l.municipio)),
    unidadesRegionais: valoresUnicosOrdenados(linhas.map((l) => l.unidade_regional)),
    classes: Array.from(new Set(linhas.map((l) => l.classe))).sort((a, b) => a - b),
    classesEstudo: valoresUnicosOrdenados(linhas.map((l) => l.classe_estudo)),
    repositorios: valoresUnicosOrdenados(linhas.map((l) => l.repositorio)),
    anos: Array.from(new Set(linhas.map((l) => l.ano))).sort((a, b) => a - b),
    modalidades: valoresUnicosOrdenados(linhas.map((l) => l.modalidade)),
    estadosDeLink: valoresUnicosOrdenados(linhas.map((l) => l.link_estado)),
  };
}

/** Contagem por `repositorio` — a métrica de quanto do acervo está em cada
 *  nuvem de terceiro (ver docstring do módulo). Soma sempre bate com
 *  `linhas.length`, porque toda linha tem exatamente um `repositorio`. */
export function contarPorRepositorio(linhas: EstudoLinha[]): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const linha of linhas) {
    contagem[linha.repositorio] = (contagem[linha.repositorio] ?? 0) + 1;
  }
  return contagem;
}

/** Contagem por `classe_estudo`. Linha com `classe_estudo` null (estudo não
 *  classificado) entra sob a chave `"sem_classificacao"` em vez de ser
 *  descartada — lacuna é informação (ver `AGENTS.md`). */
export function contarPorClasseEstudo(linhas: EstudoLinha[]): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const linha of linhas) {
    const chave = linha.classe_estudo ?? "sem_classificacao";
    contagem[chave] = (contagem[chave] ?? 0) + 1;
  }
  return contagem;
}

/** Converte "dd/mm/aaaa" em "aaaa-mm-dd" para ordenar como TEXTO (ou passar
 *  para `Date.parse`/`lib/tabela/ordenar.ts`, que espera ISO). Devolve null
 *  no que não casar o formato — mesma convenção de "ausente não quebra" do
 *  resto do portal.
 *
 *  Ordenar "dd/mm/aaaa" como texto cru ordena por DIA primeiro (porque o dia
 *  é o primeiro grupo de dígitos): "31/12/2024" viria ANTES de "01/01/2025"
 *  num sort de string, quando na verdade é quase um ano depois. É o erro
 *  concreto que esta função existe para impedir — troque a ordem dos grupos
 *  antes de comparar, nunca compare o texto brasileiro direto. */
export function dataParaOrdenacao(dataBr: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dataBr.trim());
  if (!m) return null;
  const [, dia, mes, ano] = m;
  return `${ano}-${mes}-${dia}`;
}
