/**
 * ═══ FILTROS E ORDENAÇÃO DE CONCURSOS — LÓGICA PURA ═══
 *
 * O que é:
 *   Funções puras e sem dependência do React para busca tolerante a acentos,
 *   filtragem multidimensional e ordenação estável de certames públicos.
 *
 * Fonte oficial:
 *   Mapeamento das diretrizes de transparência cívica e acessibilidade da informação.
 *
 * Por que foi feito assim:
 *   - Testável isoladamente em vitest sem renderização de componentes.
 *   - Usa semAcento da biblioteca compartilhada para uniformidade com a busca do portal.
 *   - Suporta ordenação estável em memória preservando paginação previsível.
 */

import { semAcento } from "@/lib/busca/normalizar";
import type { FiltrosConcurso, ItemConcurso } from "./tipos";

export type ChaveOrdenacaoConcurso =
  | "remuneracao"
  | "vagas"
  | "orgao"
  | "uf"
  | "status"
  | "dataAtualizacao";

export type DirecaoOrdenacao = "asc" | "desc";

/**
 * Filtra a lista de certames a partir dos critérios fornecidos.
 */
export function filtrarConcursos(
  itens: readonly ItemConcurso[],
  filtros: Partial<FiltrosConcurso>
): ItemConcurso[] {
  const termo = filtros.busca ? semAcento(filtros.busca.trim()) : "";

  return itens.filter((item) => {
    // Filtro por Esfera
    if (filtros.esfera && item.esfera !== filtros.esfera) {
      return false;
    }

    // Filtro por Poder
    if (filtros.poder && item.poder !== filtros.poder) {
      return false;
    }

    // Filtro por Modalidade
    if (filtros.modalidade && item.modalidade !== filtros.modalidade) {
      return false;
    }

    // Filtro por Escolaridade
    if (filtros.escolaridade && item.escolaridade !== filtros.escolaridade) {
      return false;
    }

    // Filtro por Status
    if (filtros.status && item.status !== filtros.status) {
      return false;
    }

    // Filtro por UF
    if (filtros.uf && item.uf !== filtros.uf) {
      return false;
    }

    // Busca textual livre
    if (termo) {
      const cargosStr = Array.isArray(item.cargos) ? item.cargos.join(" ") : "";
      const corpus = semAcento(
        `${item.orgao} ${item.nomeCompleto} ${cargosStr} ${item.municipio} ${item.uf} ${item.banca} ${item.remuneracaoInicial} ${item.modalidade}`
      );
      if (!corpus.includes(termo)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Ordena a lista de certames por coluna selecionada e direção.
 */
export function ordenarConcursos(
  itens: readonly ItemConcurso[],
  chave: ChaveOrdenacaoConcurso,
  direcao: DirecaoOrdenacao = "asc"
): ItemConcurso[] {
  const copia = [...itens];

  copia.sort((a, b) => {
    let resultado = 0;

    switch (chave) {
      case "remuneracao": {
        const valA = a.remuneracaoNumMax || 0;
        const valB = b.remuneracaoNumMax || 0;
        resultado = valA - valB;
        break;
      }
      case "vagas": {
        const valA = a.vagasImediatas || 0;
        const valB = b.vagasImediatas || 0;
        resultado = valA - valB;
        break;
      }
      case "orgao": {
        const orgaoA = semAcento(a.orgao);
        const orgaoB = semAcento(b.orgao);
        resultado = orgaoA.localeCompare(orgaoB);
        break;
      }
      case "uf": {
        resultado = a.uf.localeCompare(b.uf);
        break;
      }
      case "status": {
        resultado = a.status.localeCompare(b.status);
        break;
      }
      case "dataAtualizacao": {
        resultado = (a.dataAtualizacao || "").localeCompare(b.dataAtualizacao || "");
        break;
      }
      default:
        resultado = 0;
    }

    return direcao === "asc" ? resultado : -resultado;
  });

  return copia;
}
