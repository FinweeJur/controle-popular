/**
 * Regras puras das duas páginas de fonte externa: `/querido-diario` (diários
 * oficiais municipais) e `/fornecedores` (CNPJ enriquecido).
 *
 * ─── O QUE É ───────────────────────────────────────────────────────────────
 *
 * Contagem, filtro, busca, ordenação, rótulo e CSV dos dois JSON versionados:
 *
 * - `apps/web/data/querido-diario/atos.json` — coletado do Querido Diário
 *   (Open Knowledge Brasil, https://api.queridodiario.org.br), 3 cidades de MG,
 *   22 linhas de evidência e 750 ocorrências de radical entre 10 e 16/11/2026.
 * - `apps/web/data/fornecedores/enriquecido.json` — 17 fornecedores
 *   consultados na Brasil API (dados públicos da Receita Federal,
 *   https://brasilapi.com.br/api/cnpj/v1/{cnpj}).
 *
 * ─── POR QUE A LÓGICA MORA AQUI ────────────────────────────────────────────
 *
 * O componente de cliente recebe só as linhas que a tela usa; a regra de
 * contagem, filtro e CSV fica fora do React para ser testada sem navegador
 * (`paginas.test.ts`). Número de cartão e linha de CSV precisam da MESMA
 * função — duas contas diferentes para o mesmo dado é como nasce divergência.
 *
 * ─── HONESTIDADE DO DADO ───────────────────────────────────────────────────
 *
 * O Querido Diário NÃO classifica ato: `tipo` é o termo procurado no texto do
 * diário. A contagem é de MENÇÃO ao radical, não de ato praticado. O rótulo e
 * o CSV repetem isso; nenhuma função daqui transforma menção em classificação.
 *
 * O cadastro de CNPJ é amostra fechada de 17 fornecedores que já aparecem no
 * acervo do portal, não o cadastro completo da Receita. Sócio, CPF, telefone
 * e e-mail não existem no arquivo e não podem ser acrescentados aqui.
 */

import { semAcento } from "@/lib/busca/normalizar";
import { formatCNPJ } from "@/lib/betim/format";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";

export { formatCNPJ, formatarDataBR };

/** CSVs do portal: BOM UTF-8 + ponto e vírgula, o que o Excel brasileiro lê. */
const BOM = "\uFEFF";
const SEPARADOR = ";";

// ─── Diários municipais ────────────────────────────────────────────────────

export interface AtoDiario {
  tipo: string;
  termo: string;
  /** ISO `AAAA-MM-DD`, a data de publicação do diário. */
  data: string;
  edicao: string;
  extra: boolean;
  /** Quantas vezes o radical aparece no texto do diário. */
  ocorrencias: number;
  /** Até 200 caracteres em volta da primeira ocorrência. */
  trecho: string;
  link: string;
  fonte: string;
  coletadoEm: string;
}

export interface CidadeComDiario {
  ibge: string;
  nome: string;
  uf: string;
  diariosNoPeriodo: number;
  diariosContados: number;
  porTipo: Record<string, { diarios: number; ocorrencias: number }>;
  atos: AtoDiario[];
  erros: string[];
}

export interface CidadeSemCobertura {
  ibge: string;
  nome: string;
  uf?: string;
  nivel?: string;
  motivo: string;
}

export interface DadosDiarios {
  fonte: {
    nome: string;
    api: string;
    documentacao: string;
    licencaDados: string;
    aviso?: string;
    [chave: string]: string | undefined;
  };
  coletadoEm: string;
  janela: { de: string; ate: string };
  termos: string[];
  radicais: Record<string, string>;
  metodo: Record<string, string>;
  cidades: CidadeComDiario[];
  semCobertura: CidadeSemCobertura[];
}

/** Linha achatada para a lista: cidade e UF viajam junto do ato. */
export interface AtoNaLista extends AtoDiario {
  cidade: string;
  uf: string;
  ibge: string;
}

/** Rótulo humano do termo contado. `tipo` desconhecido não inventa categoria. */
export function rotuloTipo(tipo: string): string {
  const mapa: Record<string, string> = {
    decreto: "Decreto",
    portaria: "Portaria",
    licitacao: "Licitação",
    nomeacao: "Nomeação",
  };
  return mapa[tipo] ?? tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

/**
 * Achata `cidades[].atos[]` numa lista só, mais recente primeiro e, no empate
 * de data, por cidade. Ordem fixa: a lista não muda entre servidor e cliente.
 */
export function linhasDeAtos(dados: DadosDiarios): AtoNaLista[] {
  return dados.cidades
    .flatMap((cidade) =>
      cidade.atos.map((ato) => ({
        ...ato,
        cidade: cidade.nome,
        uf: cidade.uf,
        ibge: cidade.ibge,
      }))
    )
    .sort((a, b) => {
      if (a.data !== b.data) return a.data < b.data ? 1 : -1;
      const porCidade = a.cidade.localeCompare(b.cidade, "pt-BR");
      if (porCidade !== 0) return porCidade;
      return a.tipo.localeCompare(b.tipo, "pt-BR");
    });
}

export interface ResumoDiarios {
  cidades: number;
  semCobertura: number;
  diarios: number;
  atos: number;
  ocorrencias: number;
  janela: { de: string; ate: string };
  tipos: string[];
}

/**
 * Agregados dos cartões de topo. Tudo derivado do arquivo — nada digitado à
 * mão. `ocorrencias` soma a contagem oficial de cada linha, que o teste de
 * contrato já confere contra `porTipo`.
 */
export function resumoDiarios(dados: DadosDiarios): ResumoDiarios {
  return {
    cidades: dados.cidades.length,
    semCobertura: dados.semCobertura.length,
    diarios: dados.cidades.reduce((total, cidade) => total + cidade.diariosContados, 0),
    atos: dados.cidades.reduce((total, cidade) => total + cidade.atos.length, 0),
    ocorrencias: dados.cidades.reduce(
      (total, cidade) =>
        total + cidade.atos.reduce((soma, ato) => soma + ato.ocorrencias, 0),
      0
    ),
    janela: dados.janela,
    tipos: dados.termos,
  };
}

/**
 * Diário de UMA cidade, pelo código IBGE — a chave que o hub municipal já tem
 * (`cidade.id_municipio`). Nome não serve de chave: acento e grafia variam, e
 * cidade homônima existe. Sem correspondência, devolve `undefined` e a seção
 * do hub não renderiza nada.
 */
export function diarioDaCidade(
  dados: DadosDiarios,
  ibge: string
): CidadeComDiario | undefined {
  return dados.cidades.find((cidade) => cidade.ibge === ibge);
}

/** Atos de uma cidade, mais recentes primeiro; `limite` corta para o hub. */
export function atosDaCidade(cidade: CidadeComDiario, limite?: number): AtoDiario[] {
  const ordenados = [...cidade.atos].sort((a, b) => (a.data < b.data ? 1 : -1));
  return typeof limite === "number" ? ordenados.slice(0, limite) : ordenados;
}

export interface FiltroAtos {
  /** Nome da cidade; vazio/ausente = todas. */
  cidade?: string;
  /** Termo contado (decreto, portaria…); vazio/ausente = todos. */
  tipo?: string;
  /** Busca livre no trecho, cidade, tipo, data e edição. */
  busca?: string;
}

/** Filtro da lista: cidade e tipo são exatos; a busca é tolerante a acento. */
export function filtrarAtos(linhas: AtoNaLista[], filtro: FiltroAtos = {}): AtoNaLista[] {
  const alvo = semAcento((filtro.busca ?? "").trim());
  return linhas.filter((linha) => {
    if (filtro.cidade && linha.cidade !== filtro.cidade) return false;
    if (filtro.tipo && linha.tipo !== filtro.tipo) return false;
    if (!alvo) return true;
    const campos = [
      linha.trecho,
      linha.cidade,
      linha.uf,
      linha.tipo,
      rotuloTipo(linha.tipo),
      linha.data,
      linha.edicao,
    ];
    return campos.some((campo) => semAcento(String(campo)).includes(alvo));
  });
}

/** CSV dos atos que estão na tela (filtro aplicado), com BOM e `;`. */
export function atosParaCsv(linhas: readonly AtoNaLista[]): string {
  const cabecalho = [
    "cidade",
    "uf",
    "data",
    "tipo",
    "ocorrencias",
    "edicao",
    "trecho",
    "link_diario",
  ];
  const corpo = linhas.map((linha) =>
    [
      linha.cidade,
      linha.uf,
      linha.data,
      rotuloTipo(linha.tipo),
      linha.ocorrencias,
      linha.edicao,
      linha.trecho,
      linha.link,
    ].map(campoCsv)
  );
  return [BOM + cabecalho.join(SEPARADOR), ...corpo.map((c) => c.join(SEPARADOR))].join("\n");
}

// ─── Fornecedores (CNPJ enriquecido) ───────────────────────────────────────

export interface FornecedorEnriquecido {
  /** 14 dígitos, sem máscara, como a Receita publica. */
  cnpj: string;
  razaoSocial: string;
  situacaoCadastral: string;
  dataSituacao: string;
  dataInicioAtividade: string;
  cnae: { codigo: string; descricao: string };
  naturezaJuridica: string;
  municipio: string;
  uf: string;
  origem: string;
  consultaEm: string;
  fonte: string;
  coletadoEm: string;
}

export interface DadosFornecedores {
  fonte: {
    nome: string;
    endpoint: string;
    documentacao: string;
    licenca?: string;
    limite?: string;
    aviso?: string;
    [chave: string]: string | undefined;
  };
  coletadoEm: string;
  amostra: number;
  consultados: number;
  falhas: number;
  fornecedores: FornecedorEnriquecido[];
  naoVersionados: Array<{ cnpj: string; motivo: string; origem?: string }>;
}

export interface ResumoFornecedores {
  total: number;
  consultados: number;
  descartados: number;
  situacoes: Array<{ situacao: string; total: number }>;
  ufs: Array<{ uf: string; total: number }>;
  cnaesDistintos: number;
  coletadoEm: string;
}

/** Agregados dos cartões. Situação e UF saem do próprio dado, não de lista fixa. */
export function resumoFornecedores(dados: DadosFornecedores): ResumoFornecedores {
  const contarPor = (chave: (f: FornecedorEnriquecido) => string) => {
    const mapa = new Map<string, number>();
    for (const fornecedor of dados.fornecedores) {
      const valor = chave(fornecedor);
      mapa.set(valor, (mapa.get(valor) ?? 0) + 1);
    }
    return [...mapa.entries()]
      .map(([valor, total]) => ({ valor, total }))
      .sort((a, b) => b.total - a.total || a.valor.localeCompare(b.valor, "pt-BR"));
  };

  return {
    total: dados.fornecedores.length,
    consultados: dados.consultados,
    descartados: dados.naoVersionados.length,
    situacoes: contarPor((f) => f.situacaoCadastral).map(({ valor, total }) => ({
      situacao: valor,
      total,
    })),
    ufs: contarPor((f) => f.uf).map(({ valor, total }) => ({ uf: valor, total })),
    cnaesDistintos: new Set(dados.fornecedores.map((f) => f.cnae.codigo)).size,
    coletadoEm: dados.coletadoEm,
  };
}

/** Situações para o seletor, em ordem alfabética. */
export function listarSituacoes(linhas: readonly FornecedorEnriquecido[]): string[] {
  return [...new Set(linhas.map((linha) => linha.situacaoCadastral))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
}

export interface FiltroFornecedores {
  /** Situação cadastral exata; vazio/ausente = todas. */
  situacao?: string;
  /** Busca em razão social, CNPJ (com ou sem máscara), CNAE, município, UF. */
  busca?: string;
}

export function filtrarFornecedores(
  linhas: readonly FornecedorEnriquecido[],
  filtro: FiltroFornecedores = {}
): FornecedorEnriquecido[] {
  const alvo = semAcento((filtro.busca ?? "").trim());
  const digitos = (filtro.busca ?? "").replace(/\D/g, "");
  return linhas.filter((linha) => {
    if (filtro.situacao && linha.situacaoCadastral !== filtro.situacao) return false;
    if (!alvo) return true;
    const campos = [
      linha.razaoSocial,
      formatCNPJ(linha.cnpj),
      linha.cnae.codigo,
      linha.cnae.descricao,
      linha.naturezaJuridica,
      linha.municipio,
      linha.uf,
      linha.situacaoCadastral,
    ];
    if (campos.some((campo) => semAcento(String(campo)).includes(alvo))) return true;
    // Quem digita CNPJ costuma digitar só um pedaço dos dígitos, às vezes com
    // máscara. Comparar o número puro evita "não achei" com dado na tela.
    return digitos.length >= 3 && linha.cnpj.includes(digitos);
  });
}

/** CSV dos fornecedores filtrados na tela. Sem sócio, telefone ou e-mail. */
export function fornecedoresParaCsv(linhas: readonly FornecedorEnriquecido[]): string {
  const cabecalho = [
    "cnpj",
    "razao_social",
    "situacao_cadastral",
    "data_situacao",
    "inicio_atividade",
    "cnae_codigo",
    "cnae_descricao",
    "natureza_juridica",
    "municipio",
    "uf",
    "consulta_em",
  ];
  const corpo = linhas.map((linha) =>
    [
      formatCNPJ(linha.cnpj),
      linha.razaoSocial,
      linha.situacaoCadastral,
      linha.dataSituacao,
      linha.dataInicioAtividade,
      linha.cnae.codigo,
      linha.cnae.descricao,
      linha.naturezaJuridica,
      linha.municipio,
      linha.uf,
      linha.consultaEm,
    ].map(campoCsv)
  );
  return [BOM + cabecalho.join(SEPARADOR), ...corpo.map((c) => c.join(SEPARADOR))].join("\n");
}

// ─── CSV ───────────────────────────────────────────────────────────────────

/**
 * Escapa um campo: aspas duplas e quebra de linha obrigam cerca, e o `;`
 * também (é o separador). Sem isso, trecho de diário com ponto e vírgula
 * desloca a coluna e o CSV passa a mentir.
 */
function campoCsv(valor: unknown): string {
  const texto = String(valor ?? "");
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}
