import { describe, it, expect } from 'vitest';
import { calcularCruzamentosMunicipais } from './correlacionador';

describe('lib/cruzamentos/correlacionador', () => {
  it('gera os 3 cruzamentos com dados completos', () => {
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
    // Achado 5: receber transferência não é juízo de valor.
    expect(resultado[2].status).toBe('neutro');
  });

  it('alerta quando há alta taxa de homicídios e baixa cobertura hospitalar', () => {
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
    expect(resultado[1].explicacao).toContain('por 100 mil hab');
    // Achado 4: o critério vai junto, declarado e datado.
    expect(resultado[1].criterio).toContain('critério do portal');
    expect(resultado[1].criterio).toContain('01/10/2026');
  });

  it('ACHADO 1: lacuna vira sem-dado, nunca "Regular"', () => {
    const resultado = calcularCruzamentosMunicipais({
      codIbge7: '1234567',
      nome: 'Município em Coleta',
      uf: 'MG',
    });

    expect(resultado).toHaveLength(3);
    for (const item of resultado) {
      expect(item.status).toBe('sem-dado');
      expect(item.explicacao).toContain('não estima');
    }
    expect(resultado.every((i) => i.status !== 'neutro')).toBe(true);
  });

  it('ACHADO 2: sem população não calcula taxa (nada de ?? 50000)', () => {
    const semPop = calcularCruzamentosMunicipais({
      codIbge7: '1234567',
      nome: 'X',
      uf: 'MG',
      totalLeitosSus: 100,
      totalHomicidiosAno: 50,
    });

    expect(semPop[1].status).toBe('sem-dado');
    expect(semPop[1].explicacao).toContain('Sem população medida');
    expect(semPop[2].status).toBe('sem-dado');

    // Com população, a mesma conta sai normalmente.
    const comPop = calcularCruzamentosMunicipais({
      codIbge7: '1234567',
      nome: 'X',
      uf: 'MG',
      populacao: 50000,
      totalLeitosSus: 100,
      totalHomicidiosAno: 50,
      repassesFederaisAnual: 1000000,
    });
    expect(comPop[1].status).toBe('neutro'); // 100/100 mil > 25, mas 2,0 leitos/mil não fica abaixo de 1,5
    expect(comPop[1].explicacao).toContain('100,0');
    expect(comPop[1].explicacao).not.toContain('100.0');
  });

  it('ACHADO 7: número sai em português, com vírgula decimal', () => {
    const r = calcularCruzamentosMunicipais({
      codIbge7: '1234567',
      nome: 'X',
      uf: 'MG',
      populacao: 100000,
      totalLeitosSus: 150,
      totalHomicidiosAno: 45,
      repassesFederaisAnual: 3500000,
    });
    expect(r[1].explicacao).toContain('45,0');
    expect(r[1].explicacao).not.toContain('45.0');
    expect(r[2].explicacao).toContain('R$ 35,00');
    expect(r[2].explicacao).not.toContain('R$ 35.00');
  });

  it('ACHADO 3: sem meta oficial de IDEB não há comparação', () => {
    const r = calcularCruzamentosMunicipais({
      codIbge7: '1234567',
      nome: 'X',
      uf: 'MG',
      idebAnosIniciais: 6.1,
      // sem idebMeta: antes caía no ?? 5.5 e publicava comparação inventada
    });
    expect(r[0].status).toBe('sem-dado');
    expect(r[0].explicacao).toContain('meta oficial do ciclo não');
  });
});
