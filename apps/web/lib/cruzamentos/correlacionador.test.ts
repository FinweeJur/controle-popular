import { describe, it, expect } from 'vitest';
import { calcularCruzamentosMunicipais } from './correlacionador';

describe('lib/cruzamentos/correlacionador', () => {
  it('gera os 3 cruzamentos educacionais com base em dados completos', () => {
    const resultado = calcularCruzamentosMunicipais({
      codIbge7: '3106200',
      nome: 'Belo Horizonte',
      uf: 'MG',
      populacao: 2315000,
      idebAnosIniciais: 6.2,
      idebMeta: 5.8,
      totalLeitosSus: 5200,
      totalHomicidiosAno: 280,
      repassesFederaisAnual: 3500000000,
    });

    expect(resultado).toHaveLength(3);
    expect(resultado[0].titulo).toContain('Desempenho Escolar');
    expect(resultado[0].status).toBe('positivo');
    expect(resultado[1].titulo).toContain('Violência Urbana');
    expect(resultado[2].titulo).toContain('Repasses Públicos');
  });

  it('alerta quando houver alta taxa de homicídios e baixa cobertura hospitalar (duplo funil)', () => {
    const resultado = calcularCruzamentosMunicipais({
      codIbge7: '9999999',
      nome: 'Cidade Alerta',
      uf: 'BR',
      populacao: 100000,
      idebAnosIniciais: 4.0,
      idebMeta: 5.5,
      totalLeitosSus: 80, // 0.8 leitos/mil
      totalHomicidiosAno: 45, // 45/100 mil hab (alto)
    });

    expect(resultado[0].status).toBe('atencao');
    expect(resultado[1].status).toBe('atencao');
    expect(resultado[1].explicacao).toContain('duplo funil de vulnerabilidade');
  });

  it('trata lacunas sem falhar quando dados específicos não estiverem disponíveis', () => {
    const resultado = calcularCruzamentosMunicipais({
      codIbge7: '1234567',
      nome: 'Município em Coleta',
      uf: 'MG',
    });

    expect(resultado).toHaveLength(3);
    for (const item of resultado) {
      expect(item.status).toBe('neutro');
      expect(item.explicacao).toBeDefined();
    }
  });
});
