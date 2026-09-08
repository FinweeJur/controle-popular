import { describe, it, expect } from 'vitest';
import {
  listarTodasFichas,
  obterFichaPorSlug,
  listarFichasPorEixo,
  listarFichasPorMunicipio,
} from './fichas';

describe('lib/eixos/fichas', () => {
  it('carrega o catálogo de fichas sem erros', () => {
    const fichas = listarTodasFichas();
    expect(fichas.length).toBeGreaterThan(0);
    expect(fichas[0]).toHaveProperty('id');
    expect(fichas[0]).toHaveProperty('titulo');
    expect(fichas[0]).toHaveProperty('eixo');
  });

  it('localiza uma ficha existente pelo slug', () => {
    const ficha = obterFichaPorSlug('capacidade-hospitalar-bh');
    expect(ficha).toBeDefined();
    expect(ficha?.eixo).toBe('direitos');
    expect(ficha?.subfrente).toBe('saude-publica');
  });

  it('filtra fichas pelo Eixo informado', () => {
    const fichasDireitos = listarFichasPorEixo('direitos');
    expect(fichasDireitos.length).toBeGreaterThan(0);
    for (const f of fichasDireitos) {
      expect(f.eixo).toBe('direitos');
    }
  });

  it('filtra fichas relacionadas a um município pelo código IBGE de 7 dígitos', () => {
    const fichasBH = listarFichasPorMunicipio('3106200'); // Belo Horizonte
    expect(fichasBH.length).toBeGreaterThan(0);
    for (const f of fichasBH) {
      expect(f.cidadesRelacionadas).toContain('3106200');
    }
  });
});
