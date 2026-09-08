import { describe, it, expect } from 'vitest';
import { obterFichasRelacionadas } from './relacionador';
import type { Ficha } from './types';

const FICHAS_TESTE: Ficha[] = [
  {
    id: 'f-bh-orcamento',
    slug: 'orcamento-bh-2025',
    eixo: 'estado',
    subfrente: 'orcamento',
    titulo: 'Orçamento Municipal de Belo Horizonte 2025',
    resumo: 'Detalhamento das receitas e dotações orçamentárias de BH.',
    dataPublicacao: '2025-01-10',
    fontes: [{ nome: 'DOM BH' }],
    cidadesRelacionadas: ['3106200'], // BH
    tags: ['orcamento', 'financas', 'saude', 'educacao'],
  },
  {
    id: 'f-bh-saude',
    slug: 'capacidade-hospitalar-bh',
    eixo: 'direitos',
    subfrente: 'saude-publica',
    titulo: 'Capacidade Instalada do SUS em Belo Horizonte',
    resumo: 'Número de leitos e profissionais CNES.',
    dataPublicacao: '2025-02-15',
    fontes: [{ nome: 'CNES/DataSUS' }],
    cidadesRelacionadas: ['3106200'], // BH
    tags: ['saude', 'leitos', 'sus'],
  },
  {
    id: 'f-bh-meio-ambiente',
    slug: 'qualidade-das-aguas-bh',
    eixo: 'terra',
    subfrente: 'nossos-rios',
    titulo: 'Bacia do Rio das Velhas em BH',
    resumo: 'Qualidade da água e saneamento em Belo Horizonte.',
    dataPublicacao: '2025-03-01',
    fontes: [{ nome: 'IGAM' }],
    cidadesRelacionadas: ['3106200'], // BH
    tags: ['meio-ambiente', 'saneamento', 'rios'],
  },
  {
    id: 'f-betim-saude',
    slug: 'saude-publica-betim',
    eixo: 'direitos',
    subfrente: 'saude-publica',
    titulo: 'Atendimento de Saúde em Betim',
    resumo: 'Rede municipal de saúde de Betim.',
    dataPublicacao: '2025-02-10',
    fontes: [{ nome: 'Prefeitura de Betim' }],
    cidadesRelacionadas: ['3106705'], // Betim
    tags: ['saude', 'sus'],
  },
  {
    id: 'f-federal-orcamento',
    slug: 'orcamento-federal-saude',
    eixo: 'estado',
    subfrente: 'orcamento',
    titulo: 'Gastos Federais com Saúde Pública',
    resumo: 'Repasses do Ministério da Saúde.',
    dataPublicacao: '2025-01-05',
    fontes: [{ nome: 'SIOP' }],
    tags: ['orcamento', 'saude', 'repasses'],
  },
];

describe('obterFichasRelacionadas', () => {
  it('relaciona com alta prioridade fichas do mesmo município em eixos distintos', () => {
    const fichaAtual = FICHAS_TESTE[0]; // BH Orçamento (Estado)
    const relacoes = obterFichasRelacionadas(fichaAtual, FICHAS_TESTE, { limite: 2 });

    expect(relacoes.length).toBe(2);
    // Deve conter BH Saúde (Direitos) e BH Meio Ambiente (Terra)
    const ids = relacoes.map((r) => r.ficha.id);
    expect(ids).toContain('f-bh-saude');
    expect(ids).toContain('f-bh-meio-ambiente');

    // Primeira relação deve ter conexao interdisciplinar
    expect(relacoes[0].tipoConexao).toBe('interdisciplinar');
  });

  it('identifica conexões por tags temáticas quando o município for diferente', () => {
    const fichaAtual = FICHAS_TESTE[3]; // Betim Saúde (Direitos)
    const relacoes = obterFichasRelacionadas(fichaAtual, FICHAS_TESTE, { limite: 3 });

    expect(relacoes.length).toBeGreaterThan(0);
    // Deve sugerir BH Saúde (Direitos) ou Orçamento Federal Saúde (Estado)
    const tagsEncontradas = relacoes.some((r) => r.ficha.tags.includes('saude'));
    expect(tagsEncontradas).toBe(true);
  });

  it('nunca sugere a própria ficha atual', () => {
    const fichaAtual = FICHAS_TESTE[1]; // BH Saúde
    const relacoes = obterFichasRelacionadas(fichaAtual, FICHAS_TESTE, { limite: 10 });

    const contemPropria = relacoes.some((r) => r.ficha.id === fichaAtual.id);
    expect(contemPropria).toBe(false);
  });

  it('respeita o limite estrito informado', () => {
    const fichaAtual = FICHAS_TESTE[0];
    const relacoes = obterFichasRelacionadas(fichaAtual, FICHAS_TESTE, { limite: 1 });
    expect(relacoes.length).toBe(1);
  });

  it('retorna lista vazia se nenhuma candidata possuir pontos em comum', () => {
    const fichaIsolada: Ficha = {
      id: 'f-isolada',
      slug: 'tema-isolado',
      eixo: 'estado',
      subfrente: 'transparencia',
      titulo: 'Tema Único sem Correspondência',
      resumo: 'Sem tags conhecidas.',
      dataPublicacao: '2025-01-01',
      fontes: [],
      tags: ['topico-raro-xyz-123'],
    };

    const relacoes = obterFichasRelacionadas(fichaIsolada, FICHAS_TESTE);
    expect(relacoes).toEqual([]);
  });
});
