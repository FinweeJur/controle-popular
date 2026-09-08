/**
 * apps/web/lib/eixos/fichas.ts
 *
 * Módulo de leitura e consulta das Fichas Temáticas armazenadas
 * de forma estática e versionada em `apps/web/data/fichas/catalogo.json`.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { EixoId, Ficha, SubfrenteId } from './types';

let cacheFichas: Ficha[] | null = null;

function resolverCaminhoCatalogo(): string {
  const caminhos = [
    path.resolve(process.cwd(), 'data', 'fichas', 'catalogo.json'),
    path.resolve(process.cwd(), 'apps', 'web', 'data', 'fichas', 'catalogo.json'),
    path.resolve(__dirname, '..', '..', 'data', 'fichas', 'catalogo.json'),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[1];
}

export function listarTodasFichas(): Ficha[] {
  if (cacheFichas) return cacheFichas;

  try {
    const caminho = resolverCaminhoCatalogo();
    if (!fs.existsSync(caminho)) {
      return [];
    }
    const conteudo = fs.readFileSync(caminho, 'utf-8');
    cacheFichas = JSON.parse(conteudo) as Ficha[];
    return cacheFichas;
  } catch (err) {
    console.error('[eixos/fichas] Erro ao carregar catalogo de fichas:', err);
    return [];
  }
}

export function obterFichaPorSlug(slug: string): Ficha | undefined {
  const fichas = listarTodasFichas();
  return fichas.find((f) => f.slug === slug || f.id === slug);
}

export function listarFichasPorEixo(eixoId: EixoId): Ficha[] {
  const fichas = listarTodasFichas();
  return fichas.filter((f) => f.eixo === eixoId);
}

export function listarFichasPorSubfrente(subfrenteId: SubfrenteId): Ficha[] {
  const fichas = listarTodasFichas();
  return fichas.filter((f) => f.subfrente === subfrenteId);
}

export function listarFichasPorMunicipio(codIbge7: string): Ficha[] {
  const fichas = listarTodasFichas();
  return fichas.filter((f) => f.cidadesRelacionadas && f.cidadesRelacionadas.includes(codIbge7));
}
