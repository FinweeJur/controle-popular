/**
 * apps/web/lib/direitos/informacao.ts
 *
 * Módulo para carregamento e consulta dos canais de acesso à informação pública (LAI)
 * e concessionárias de serviços públicos essenciais.
 */

import type {
  CanalInformacao,
  ResumoEstatisticasInformacao,
  CatalogoCanaisLai,
  CategoriaCanal,
} from "./informacao-tipos";
import dadosBrutos from "@/data/canais-informacao-lai.json";

const catalogo = dadosBrutos as unknown as CatalogoCanaisLai;

/**
 * Retorna todos os canais cadastrados (Prefeituras, Câmaras, Federais, Concessionárias).
 */
export function obterTodosCanaisInformacao(): CanalInformacao[] {
  return catalogo.canais || [];
}

/**
 * Retorna o resumo consolidado de estatísticas.
 */
export function obterEstatisticasInformacao(): ResumoEstatisticasInformacao {
  return catalogo.estatisticas;
}

/**
 * Retorna os canais filtrados por categoria específica.
 */
export function obterCanaisPorCategoria(categoria: CategoriaCanal): CanalInformacao[] {
  return (catalogo.canais || []).filter((c) => c.categoria === categoria);
}

/**
 * Retorna canais de serviços públicos essenciais (água, luz ou telecom).
 */
export function obterCanaisPorServico(servico: "agua" | "luz" | "telecom"): CanalInformacao[] {
  return (catalogo.canais || []).filter((c) => c.servicoEssencial === servico);
}

/**
 * Retorna canais filtrados por Estado (UF).
 */
export function obterCanaisPorUf(uf: string): CanalInformacao[] {
  const ufNormalizada = uf.toUpperCase().trim();
  return (catalogo.canais || []).filter((c) => c.uf === ufNormalizada);
}

/**
 * Retorna canais associados a um município específico (por código IBGE ou nome).
 */
export function obterCanaisPorMunicipio(codigoOuNome: string): CanalInformacao[] {
  const norm = codigoOuNome.toLowerCase().trim();
  return (catalogo.canais || []).filter((c) => {
    if (c.codigoIbge === codigoOuNome) return true;
    if (c.cidade && c.cidade.toLowerCase() === norm) return true;
    return false;
  });
}

/**
 * Busca canais por correspondência em nome, cidade, responsável ou descrição.
 */
export function buscarCanais(termo: string): CanalInformacao[] {
  const t = termo.toLowerCase().trim();
  if (!t) return obterTodosCanaisInformacao();

  return (catalogo.canais || []).filter((c) => {
    return (
      c.nome.toLowerCase().includes(t) ||
      c.cidade.toLowerCase().includes(t) ||
      c.sigla.toLowerCase().includes(t) ||
      c.responsavel.nome.toLowerCase().includes(t) ||
      c.responsavel.cargo.toLowerCase().includes(t) ||
      c.telefone.includes(t) ||
      c.email.toLowerCase().includes(t) ||
      c.categoria.toLowerCase().includes(t) ||
      c.endereco.toLowerCase().includes(t)
    );
  });
}
