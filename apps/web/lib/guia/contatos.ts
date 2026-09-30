/**
 * Guia de contatos públicos — o "guia telefônico" do cidadão.
 *
 * ═══ O QUE É ═══
 *
 * Junta num formato só os contatos oficiais que o portal já publica em três
 * lugares, para o leitor achar um órgão num lugar e não em três:
 * - canais de acesso à informação (LAI) — `canais-informacao-lai.json` (445);
 * - unidades judiciárias — `judiciario-unidades-contatos.json` (990).
 * (Os contatos municipais continuam na rota `/[municipio]/contatos`.)
 *
 * ═══ POR QUE UNIFICAR, NÃO RECRIAR ═══
 *
 * O dado já existe e já foi verificado. Aqui só se NORMALIZA: cada fonte vira
 * a mesma forma `ContatoGuia`, para a tela ter busca, filtro, ordenação e CSV
 * (a regra das seis qualidades). Nenhum contato novo é inventado.
 *
 * ═══ EDITORIAL ═══
 *
 * Unidade judiciária NÃO é o mesmo que canal de LAI: por isso o campo `grupo`
 * separa as duas origens, e a tela nunca as funde num total único que
 * sugeriria equivalência. A fonte de cada linha fica a um clique.
 */

import { semAcento } from "@/lib/busca/normalizar";

/** Origem do contato — sempre visível, nunca fundida. */
export type GrupoContato = "Transparência (LAI)" | "Judiciário";

export const GRUPOS_CONTATO: GrupoContato[] = ["Transparência (LAI)", "Judiciário"];

/** Forma única de um contato no guia. */
export interface ContatoGuia {
  id: string;
  nome: string;
  grupo: GrupoContato;
  /** Categoria (LAI) ou tipo de unidade (Judiciário). */
  tipo: string;
  /** Esfera (Municipal/Estadual/Federal) ou ramo da Justiça. */
  nivel: string;
  cidade: string;
  uf: string;
  telefone: string;
  email: string;
  site: string;
  atendimento: string;
}

/** Campos mínimos lidos de um canal de LAI. */
export interface CanalEntrada {
  id: string;
  nome: string;
  categoria?: string;
  esfera?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  linkPortal?: string;
  tipoAtendimento?: string;
  sigla?: string;
}

/** Campos mínimos lidos de uma unidade judiciária. */
export interface UnidadeEntrada {
  id: string;
  nome: string;
  tipo?: string;
  ramo?: string;
  comarcaOuSubsecao?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  linkBalcaoVirtual?: string;
  horarioAtendimento?: string;
}

/** Normaliza um canal de LAI para a forma do guia. */
export function normalizarCanais(canais: CanalEntrada[]): ContatoGuia[] {
  return canais
    .filter((c) => c.nome && c.nome.trim() !== "")
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      grupo: "Transparência (LAI)" as const,
      tipo: c.categoria ?? "Canal de informação",
      nivel: c.esfera ?? "",
      cidade: c.cidade ?? "",
      uf: (c.uf ?? "").toUpperCase(),
      telefone: c.telefone ?? "",
      email: c.email ?? "",
      site: c.linkPortal ?? "",
      atendimento: c.tipoAtendimento ?? "",
    }));
}

/** Normaliza uma unidade judiciária para a forma do guia. */
export function normalizarUnidades(unidades: UnidadeEntrada[]): ContatoGuia[] {
  return unidades
    .filter((u) => u.nome && u.nome.trim() !== "")
    .map((u) => ({
      id: u.id,
      nome: u.nome,
      grupo: "Judiciário" as const,
      tipo: u.tipo ?? "Unidade judiciária",
      nivel: u.ramo ?? "",
      cidade: u.comarcaOuSubsecao ?? "",
      uf: (u.uf ?? "").toUpperCase(),
      telefone: u.telefone ?? "",
      email: u.email ?? "",
      site: u.linkBalcaoVirtual ?? "",
      atendimento: u.horarioAtendimento ?? "",
    }));
}

/** Junta as duas fontes numa lista só, ordenada por nome. */
export function montarGuia(canais: CanalEntrada[], unidades: UnidadeEntrada[]): ContatoGuia[] {
  return [...normalizarCanais(canais), ...normalizarUnidades(unidades)].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export interface FiltroGuia {
  termo?: string;
  grupo?: GrupoContato | "todos";
  uf?: string | "todas";
}

/**
 * Filtra o guia por termo (tolerante a acento), grupo e UF.
 * O termo casa em nome, tipo, cidade, e-mail e telefone.
 */
export function filtrarGuia(lista: ContatoGuia[], filtro: FiltroGuia = {}): ContatoGuia[] {
  const termo = semAcento((filtro.termo ?? "").trim().toLowerCase());
  const grupo = filtro.grupo ?? "todos";
  const uf = (filtro.uf ?? "todas").toUpperCase();

  return lista.filter((c) => {
    if (grupo !== "todos" && c.grupo !== grupo) return false;
    if (uf !== "TODAS" && c.uf !== uf) return false;
    if (!termo) return true;
    const alvo = semAcento(
      [c.nome, c.tipo, c.cidade, c.email, c.telefone, c.nivel].join(" ").toLowerCase(),
    );
    return alvo.includes(termo);
  });
}

/** UFs presentes no guia, em ordem alfabética. */
export function ufsDisponiveis(lista: ContatoGuia[]): string[] {
  return [...new Set(lista.map((c) => c.uf).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
