import type {
  InstituicaoDetalhe,
  PoderPublico,
  EsferaGoverno,
  NoticiaInstituicao,
} from "./tipos";
import instituicoesRaw from "@/data/instituicoes-todas-esferas.json";
import noticiasPortalRaw from "@/data/noticias-portal.json";

const INSTITUICOES: InstituicaoDetalhe[] = instituicoesRaw as unknown as InstituicaoDetalhe[];

interface NoticiaPortalItem {
  slug: string;
  titulo: string;
  resumo: string;
  publicadoEm: string;
  palavrasChave?: string[];
}

const NOTICIAS_PORTAL: NoticiaPortalItem[] = noticiasPortalRaw as unknown as NoticiaPortalItem[];

/**
 * Retorna todas as instituições e secretarias catalogadas de todas as esferas.
 */
export function obterTodasInstituicoes(): InstituicaoDetalhe[] {
  return INSTITUICOES;
}

/**
 * Busca uma instituição ou secretaria por sua sigla (ex: "fazenda", "saude", "semad-mg", "tjmg").
 */
export function obterInstituicao(sigla: string): InstituicaoDetalhe | undefined {
  if (!sigla) return undefined;
  const normalizada = sigla.toLowerCase().trim();
  return INSTITUICOES.find((i) => i.sigla.toLowerCase() === normalizada);
}

/**
 * Filtra instituições por poder público.
 */
export function listarInstituicoesPorPoder(poder: PoderPublico): InstituicaoDetalhe[] {
  return INSTITUICOES.filter((i) => i.poder === poder);
}

/**
 * Filtra instituições por esfera da federação.
 */
export function listarInstituicoesPorEsfera(esfera: EsferaGoverno): InstituicaoDetalhe[] {
  return INSTITUICOES.filter((i) => i.esfera === esfera);
}

/**
 * Busca textual por nome, sigla ou funções.
 */
export function buscarInstituicoes(termo: string): InstituicaoDetalhe[] {
  const t = termo.toLowerCase().trim();
  if (!t) return INSTITUICOES;
  return INSTITUICOES.filter(
    (i) =>
      i.sigla.toLowerCase().includes(t) ||
      i.nome.toLowerCase().includes(t) ||
      i.lideranca.nome.toLowerCase().includes(t) ||
      i.funcoes.some((f) => f.toLowerCase().includes(t)) ||
      i.organograma.some((o) => o.area.toLowerCase().includes(t))
  );
}

/**
 * Obtém as notícias oficiais conectadas a esta secretaria/instituição,
 * combinando os releases institucionais oficiais com as reportagens analíticas do portal.
 */
export function obterNoticiasDaInstituicao(sigla: string): NoticiaInstituicao[] {
  const inst = obterInstituicao(sigla);
  if (!inst) return [];

  const noticias: NoticiaInstituicao[] = [...(inst.noticias || [])];

  // Conecta também reportagens do portal cujo título ou palavras-chave citem o órgão
  const termo = inst.sigla.toLowerCase();
  const nomeTermo = inst.nome.toLowerCase();

  for (const n of NOTICIAS_PORTAL) {
    const texto = `${n.titulo} ${n.resumo} ${(n.palavrasChave || []).join(" ")}`.toLowerCase();
    if (texto.includes(termo) || (termo.length >= 3 && texto.includes(nomeTermo))) {
      // Evita duplicar se a URL já existir
      const urlPortal = `/noticias/${n.slug}`;
      if (!noticias.some((existente) => existente.url === urlPortal)) {
        noticias.push({
          titulo: n.titulo,
          data: n.publicadoEm.split("T")[0],
          fonte: "Controle Popular / Investigação",
          url: urlPortal,
          resumo: n.resumo,
        });
      }
    }
  }

  // Ordena da mais recente para a mais antiga
  return noticias.sort((a, b) => b.data.localeCompare(a.data));
}

/**
 * Tenta mapear o nome de um órgão ou secretaria citado em uma proposta
 * para a respectiva sigla cadastrada no catálogo de instituições.
 */
export function encontrarSiglaInstituicao(nomeOrgao: string): string | undefined {
  if (!nomeOrgao) return undefined;
  const t = nomeOrgao.toLowerCase();

  // Mapeamentos específicos por contexto estadual / municipal / federal
  if (t.includes("fazenda")) {
    if (t.includes("estado") || t.includes("mg") || t.includes("sef")) return "sef-mg";
    return "fazenda";
  }
  if (t.includes("saúde") || t.includes("saude")) {
    if (t.includes("municipal") || t.includes("bh") || t.includes("smsa")) return "smsa-bh";
    if (t.includes("estado") || t.includes("mg") || t.includes("ses")) return "ses-mg";
    return "saude";
  }
  if (t.includes("meio ambiente") || t.includes("ambiental")) {
    if (t.includes("estado") || t.includes("mg") || t.includes("semad")) return "semad-mg";
    return "mma";
  }
  if (t.includes("educação") || t.includes("educacao") || t.includes("mec")) {
    return "mec";
  }
  if (t.includes("obras") || t.includes("infraestrutura") || t.includes("transporte")) {
    if (t.includes("bh") || t.includes("municipal") || t.includes("smobi")) return "smobi-bh";
    return "transportes";
  }
  if (t.includes("cidades") || t.includes("habitação") || t.includes("habitacao")) {
    return "cidades";
  }

  // Busca por sigla exata (delimitada por parênteses ou delimitador)
  for (const inst of INSTITUICOES) {
    const s = inst.sigla.toLowerCase();
    if (t === s || t.includes(`(${s})`) || t.includes(` ${s} `) || t.includes(`-${s}`)) {
      return inst.sigla;
    }
  }

  // Busca por nome completo
  for (const inst of INSTITUICOES) {
    if (t.includes(inst.nome.toLowerCase())) {
      return inst.sigla;
    }
  }

  return undefined;
}

