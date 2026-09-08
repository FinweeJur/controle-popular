/**
 * apps/web/lib/eixos/relacionador.ts
 *
 * Motor determinístico de sugestões cruzadas ("Quem também olha isso").
 * Correlaciona fichas de eixos diferentes por:
 * 1. Código IBGE compartilhado (mesmo município)
 * 2. Tags compartilhadas
 * 3. Bônus para conexão interdisciplinar (eixos distintos)
 */

import type { Ficha, SugestaoRelacao } from './types';
import { CATALOGO_EIXOS } from './catalogo';

export interface OpcoesRelacionador {
  limite?: number;
  priorizarOutrosEixos?: boolean;
}

export function obterFichasRelacionadas(
  fichaAtual: Ficha,
  todasFichas: Ficha[],
  opcoes: OpcoesRelacionador = {}
): SugestaoRelacao[] {
  const limite = opcoes.limite ?? 3;
  const priorizarOutrosEixos = opcoes.priorizarOutrosEixos ?? true;

  const candidatas = todasFichas.filter((f) => f.id !== fichaAtual.id);
  const pontuadas: SugestaoRelacao[] = [];

  const tagsAtual = new Set(fichaAtual.tags.map((t) => t.toLowerCase().trim()));
  const cidadesAtual = new Set(fichaAtual.cidadesRelacionadas ?? []);

  for (const candidata of candidatas) {
    let score = 0;
    const tagsEmComum: string[] = [];
    let mesmoMunicipio = false;

    // 1. Verificação por município (peso alto: conexão geográfica direta)
    if (candidata.cidadesRelacionadas && cidadesAtual.size > 0) {
      for (const codIbge of candidata.cidadesRelacionadas) {
        if (cidadesAtual.has(codIbge)) {
          mesmoMunicipio = true;
          score += 50;
          break;
        }
      }
    }

    // 2. Verificação por tags temáticas
    for (const tag of candidata.tags) {
      const tagNorm = tag.toLowerCase().trim();
      if (tagsAtual.has(tagNorm)) {
        tagsEmComum.push(tagNorm);
        score += 15;
      }
    }

    // 3. Bônus para interdisciplinaridade (eixos distintos)
    const eixosDiferentes = candidata.eixo !== fichaAtual.eixo;
    if (eixosDiferentes && priorizarOutrosEixos && score > 0) {
      score += 25;
    }

    // Se houver qualquer afinidade relevante
    if (score > 0) {
      let tipoConexao: SugestaoRelacao['tipoConexao'] = 'tema-correlato';
      let motivo = `Compartilha temas em comum: ${tagsEmComum.slice(0, 3).join(', ')}`;

      const nomeEixoCandidata = CATALOGO_EIXOS[candidata.eixo]?.titulo ?? candidata.eixo;

      if (mesmoMunicipio && eixosDiferentes) {
        tipoConexao = 'interdisciplinar';
        motivo = `Dados do mesmo território no eixo ${nomeEixoCandidata}`;
      } else if (mesmoMunicipio) {
        tipoConexao = 'mesmo-municipio';
        motivo = `Ficha relacionada ao mesmo município`;
      } else if (eixosDiferentes) {
        tipoConexao = 'interdisciplinar';
        motivo = `Conexão temática com ${nomeEixoCandidata} (${tagsEmComum.slice(0, 2).join(', ')})`;
      }

      pontuadas.push({
        ficha: candidata,
        tipoConexao,
        motivo,
        score,
      });
    }
  }

  // Ordenar decrescente por pontuação
  pontuadas.sort((a, b) => b.score - a.score);

  return pontuadas.slice(0, limite);
}
