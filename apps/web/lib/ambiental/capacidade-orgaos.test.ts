import { describe, expect, it } from "vitest";
import {
  METADADOS_CAPACIDADE,
  ORGAOS_CAPACIDADE,
  calcularPerdaConsolidadaServidores,
  calcularVariacaoOrcamentariaMedia,
  listarOrgaosPorEsfera,
  obterMetricasGeraisCapacidade,
  obterOrgaoPorSigla,
  obterTodosOrgaosCapacidade,
} from "./capacidade-orgaos";

/**
 * Função de validação mod-11 de CPF para garantir conformidade
 * estrita com as diretrizes de dados pessoais do repositório.
 */
function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

describe("Acervo de Capacidade dos Órgãos Ambientais e de Patrimônio", () => {
  const SIGLAS_ESPERADAS = [
    "IEF-MG",
    "IGAM-MG",
    "FEAM-MG",
    "IEPHA-MG",
    "IPHAN",
    "ANA",
    "ANEEL",
    "IBAMA",
    "ICMBio",
    "ANM",
    "CETESB-SP",
    "SEMA-MT",
    "SEMAS-PA",
    "INEMA-BA",
  ];

  it("deve carregar todos os 14 órgãos requeridos", () => {
    const orgaos = obterTodosOrgaosCapacidade();
    expect(orgaos).toHaveLength(14);
    const siglasPresentes = orgaos.map((o) => o.sigla);
    for (const sigla of SIGLAS_ESPERADAS) {
      expect(siglasPresentes).toContain(sigla);
    }
  });

  it("deve possuir metadados válidos com data de atualização e versão", () => {
    expect(METADADOS_CAPACIDADE.titulo).toContain("Capacidade Institucional");
    expect(METADADOS_CAPACIDADE.versao).toBe("1.0");
    expect(METADADOS_CAPACIDADE.dataAtualizacao).toBe("2026-09-24");
    expect(METADADOS_CAPACIDADE.totalOrgaos).toBe(14);
    expect(METADADOS_CAPACIDADE.ipcaAcumulado["2016_para_2026"]).toBe(1.724);
    expect(METADADOS_CAPACIDADE.ipcaAcumulado["2021_para_2026"]).toBe(1.302);
  });

  it("deve conter campos cadastrais e regulatórios completos em cada órgão", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      expect(orgao.sigla).toBeTruthy();
      expect(orgao.nomeCompleto).toBeTruthy();
      expect(["Estadual", "Federal"]).toContain(orgao.esfera);
      expect(orgao.uf).toBeTruthy();
      expect(orgao.papelRegulatorio.length).toBeGreaterThan(20);
      expect(orgao.responsabilidades.length).toBeGreaterThanOrEqual(3);
      expect(orgao.marcoLegal.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("deve conter dados detalhados da liderança máxima e contatos institucionais", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      // Liderança
      expect(orgao.lideranca.nome).toBeTruthy();
      expect(orgao.lideranca.cargo).toBeTruthy();
      expect(orgao.lideranca.gabinete).toBeTruthy();
      expect(orgao.lideranca.email).toContain("@");
      expect(orgao.lideranca.telefone).toMatch(/\(\d{2}\)\s\d{4,5}-\d{4}/);

      // Contatos
      expect(orgao.contatos.emailGeral).toContain("@");
      expect(orgao.contatos.telefones.length).toBeGreaterThanOrEqual(1);
      expect(orgao.contatos.enderecoSede.logradouro).toBeTruthy();
      expect(orgao.contatos.enderecoSede.cidade).toBeTruthy();
      expect(orgao.contatos.enderecoSede.uf).toBeTruthy();
      expect(orgao.contatos.enderecoSede.cep).toMatch(/\d{5}-\d{3}/);

      // Ouvidoria e Denúncia
      expect(orgao.contatos.ouvidoria.canal).toBeTruthy();
      expect(orgao.contatos.ouvidoria.url).toMatch(/^https:\/\//);
      expect(orgao.contatos.canalDenuncia.canal).toBeTruthy();
      expect(orgao.contatos.canalDenuncia.url).toMatch(/^https:\/\//);

      // Sedes Regionais
      expect(orgao.contatos.sedesRegionais.length).toBeGreaterThanOrEqual(2);
      for (const reg of orgao.contatos.sedesRegionais) {
        expect(reg.nome).toBeTruthy();
        expect(reg.cidade).toBeTruthy();
        expect(reg.endereco).toBeTruthy();
        expect(reg.telefone).toBeTruthy();
        expect(reg.email).toContain("@");
      }
    }
  });

  it("deve conter organograma estruturado com diretorias e links específicos", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      expect(orgao.organograma.length).toBeGreaterThanOrEqual(3);
      for (const unidade of orgao.organograma) {
        expect(unidade.nome).toBeTruthy();
        expect(unidade.sigla).toBeTruthy();
        expect(unidade.cargo).toBeTruthy();
        expect(unidade.responsavel).toBeTruthy();
        expect(unidade.funcao.length).toBeGreaterThan(15);
        expect(unidade.telefone).toMatch(/\(\d{2}\)\s\d{4,5}-\d{4}/);
        expect(unidade.email).toContain("@");
        expect(unidade.endereco).toBeTruthy();
        expect(unidade.urlPagina).toMatch(/^https:\/\//);
      }
    }
  });

  it("deve conter informações precisas sobre o último concurso público", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      const concurso = orgao.ultimoConcurso;
      expect(concurso).toBeDefined();
      expect(concurso.ano).toBeGreaterThanOrEqual(2013);
      expect(concurso.ano).toBeLessThanOrEqual(2026);
      expect(concurso.vagas).toBeGreaterThan(0);
      expect(concurso.banca).toBeTruthy();
      expect(concurso.edital).toBeTruthy();
      expect(concurso.hiatoAnosAnterior).toBeGreaterThanOrEqual(8);
      expect(concurso.situacao).toBeTruthy();
      expect(concurso.deficitEstimado).toBeGreaterThan(0);
    }
  });

  it("deve conter séries temporais completas de servidores para 2016, 2021 e 2026", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      expect(orgao.serieServidores).toHaveLength(3);
      const anos = orgao.serieServidores.map((s) => s.ano);
      expect(anos).toEqual([2016, 2021, 2026]);

      for (const s of orgao.serieServidores) {
        expect(s.efetivos).toBeGreaterThan(0);
        expect(s.comissionados).toBeGreaterThan(0);
        expect(s.total).toBe(s.efetivos + s.comissionados);
      }

      // Verificação da fórmula matemática de variação percentual de efetivos
      const s16 = orgao.serieServidores.find((s) => s.ano === 2016)!;
      const s26 = orgao.serieServidores.find((s) => s.ano === 2026)!;
      const variacaoEsperada = Number(
        (((s26.efetivos - s16.efetivos) / s16.efetivos) * 100).toFixed(2)
      );
      expect(orgao.variacaoPercentualEfetivo2016_2026).toBeCloseTo(variacaoEsperada, 1);
      // Todos os órgãos ambientais tiveram queda no quadro efetivo
      expect(orgao.variacaoPercentualEfetivo2016_2026).toBeLessThan(0);
    }
  });

  it("deve conter série orçamentária válida com deflação real pelo IPCA", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      expect(orgao.serieOrcamento).toHaveLength(3);
      const anos = orgao.serieOrcamento.map((o) => o.ano);
      expect(anos).toEqual([2016, 2021, 2026]);

      for (const o of orgao.serieOrcamento) {
        expect(o.orcamentoNominal).toBeGreaterThan(0);
        expect(o.orcamentoReal).toBeGreaterThan(0);
      }

      // Em 2026, nominal é igual ao real
      const o26 = orgao.serieOrcamento.find((o) => o.ano === 2026)!;
      expect(o26.orcamentoReal).toBe(o26.orcamentoNominal);

      // Verificação do cálculo de variação real
      const o16 = orgao.serieOrcamento.find((o) => o.ano === 2016)!;
      const varEsperada = Number(
        (((o26.orcamentoReal - o16.orcamentoReal) / o16.orcamentoReal) * 100).toFixed(2)
      );
      expect(orgao.variacaoRealOrcamento2016_2026).toBeCloseTo(varEsperada, 1);
    }
  });

  it("deve calcular rigorosamente o índice de sobrecarga de processos por analista", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      expect(orgao.processosAtivosEstimados).toBeGreaterThan(1000);
      expect(orgao.analistasProcessamento).toBeGreaterThan(10);

      const sobrecargaEsperada = Number(
        (orgao.processosAtivosEstimados / orgao.analistasProcessamento).toFixed(2)
      );
      expect(orgao.indiceSobrecarga).toBe(sobrecargaEsperada);
      // O índice deve ser superior a 100 processos por analista em todos os órgãos
      expect(orgao.indiceSobrecarga).toBeGreaterThan(100);
    }
  });

  it("deve possuir fontes auditáveis com links canônicos e URLs https", () => {
    for (const orgao of ORGAOS_CAPACIDADE) {
      expect(orgao.fontes.length).toBeGreaterThanOrEqual(2);
      for (const fonte of orgao.fontes) {
        expect(fonte.titulo).toBeTruthy();
        expect(fonte.orgao).toBeTruthy();
        expect(fonte.url).toMatch(/^https:\/\//);
        expect(fonte.descricao).toBeTruthy();
      }

      const links = orgao.linksOficiais;
      expect(links.portalPrincipal).toMatch(/^https:\/\//);
      expect(links.transparencia).toMatch(/^https:\/\//);
      expect(links.organograma).toMatch(/^https:\/\//);
      expect(links.relatoriosGestao).toMatch(/^https:\/\//);
      expect(links.concursos).toMatch(/^https:\/\//);
      expect(links.sistemasConsulta).toMatch(/^https:\/\//);
    }
  });

  it("deve buscar órgão por sigla com tolerância a caixa alta/baixa e espaços", () => {
    const ibama = obterOrgaoPorSigla("ibama");
    expect(ibama).toBeDefined();
    expect(ibama?.sigla).toBe("IBAMA");
    expect(ibama?.esfera).toBe("Federal");

    const ief = obterOrgaoPorSigla("  ief-mg  ");
    expect(ief).toBeDefined();
    expect(ief?.sigla).toBe("IEF-MG");
    expect(ief?.uf).toBe("MG");

    const inexistente = obterOrgaoPorSigla("ORGAO-FICTICIO");
    expect(inexistente).toBeUndefined();

    const vazio = obterOrgaoPorSigla("");
    expect(vazio).toBeUndefined();
  });

  it("deve filtrar órgãos por esfera corretamente", () => {
    const estaduais = listarOrgaosPorEsfera("Estadual");
    const federais = listarOrgaosPorEsfera("Federal");

    expect(estaduais).toHaveLength(8);
    expect(federais).toHaveLength(6);
    expect(estaduais.length + federais.length).toBe(14);

    for (const est of estaduais) {
      expect(est.esfera).toBe("Estadual");
    }
    for (const fed of federais) {
      expect(fed.esfera).toBe("Federal");
    }
  });

  it("deve calcular perda consolidada de servidores para todo o conjunto", () => {
    const metricas = calcularPerdaConsolidadaServidores();
    expect(metricas.total2016).toBe(15822);
    expect(metricas.total2026).toBe(10691);
    expect(metricas.perdaAbsoluta).toBe(-5131);
    expect(metricas.perdaPercentual).toBe(-32.43);
  });

  it("deve calcular variação orçamentária média e consolidada", () => {
    const metricas = calcularVariacaoOrcamentariaMedia();
    expect(metricas.totalReal2016).toBe(9616.3);
    expect(metricas.totalReal2026).toBe(7619.6);
    expect(metricas.variacaoRealTotal).toBe(-20.76);
    expect(metricas.variacaoRealMediaPorOrgao).toBe(-18.81);

    // Teste com array vazio
    const vazio = calcularVariacaoOrcamentariaMedia([]);
    expect(vazio.totalReal2016).toBe(0);
    expect(vazio.variacaoRealTotal).toBe(0);
  });

  it("deve retornar métricas gerais completas para o painel de capacidade", () => {
    const metricas = obterMetricasGeraisCapacidade();
    expect(metricas.totalOrgaos).toBe(14);
    expect(metricas.totalEfetivos2016).toBe(15822);
    expect(metricas.totalEfetivos2021).toBe(11712);
    expect(metricas.totalEfetivos2026).toBe(10691);
    expect(metricas.perdaEfetivosAbsoluta).toBe(-5131);
    expect(metricas.variacaoConsolidadaEfetivos).toBe(-32.43);

    expect(metricas.orgaosPorEsfera.estadual).toBe(8);
    expect(metricas.orgaosPorEsfera.federal).toBe(6);

    expect(metricas.orgaoMaiorSobrecarga.sigla).toBe("ANM");
    expect(metricas.orgaoMaiorSobrecarga.indiceSobrecarga).toBe(984.85);

    expect(metricas.orgaoMaiorQuedaEfetivo.sigla).toBe("ANM");
    expect(metricas.orgaoMaiorQuedaEfetivo.variacaoEfetivo).toBe(-47.58);

    expect(metricas.mediaIndiceSobrecarga).toBe(335.73);
  });

  it("deve conter dados consistentes e específicos para a ANM (Agência Nacional de Mineração)", () => {
    const anm = obterOrgaoPorSigla("ANM");
    expect(anm).toBeDefined();
    expect(anm?.nomeCompleto).toBe("Agência Nacional de Mineração");
    expect(anm?.esfera).toBe("Federal");
    expect(anm?.uf).toBe("DF/BR");
    expect(anm?.papelRegulatorio).toContain("segurança de barragens de mineração (SIGBM)");
    expect(anm?.papelRegulatorio).toContain("CFEM");

    // Liderança e contatos
    expect(anm?.lideranca.nome).toBe("Mauro Henrique Moreira Sousa");
    expect(anm?.lideranca.cargo).toBe("Diretor-Geral");
    expect(anm?.contatos.enderecoSede.cidade).toBe("Brasília");
    expect(anm?.contatos.enderecoSede.cep).toBe("70040-020");

    // Presença da Gerência Regional de MG
    const regionalMG = anm?.contatos.sedesRegionais.find((r) => r.cidade === "Belo Horizonte");
    expect(regionalMG).toBeDefined();
    expect(regionalMG?.endereco).toContain("Afonso Pena");

    // Organograma
    const siglasDiretorias = anm?.organograma.map((u) => u.sigla);
    expect(siglasDiretorias).toContain("SBM");
    expect(siglasDiretorias).toContain("SAR");
    expect(siglasDiretorias).toContain("SOT");
    expect(siglasDiretorias).toContain("GR-MG");

    // Sobrecarga crítica
    expect(anm?.processosAtivosEstimados).toBe(195000);
    expect(anm?.analistasProcessamento).toBeLessThan(200);
    expect(anm?.indiceSobrecarga).toBeGreaterThan(950);

    // Concurso público e hiato
    expect(anm?.ultimoConcurso.ano).toBe(2022);
    expect(anm?.ultimoConcurso.vagas).toBe(40);
    expect(anm?.ultimoConcurso.banca).toBe("Cebraspe");
    expect(anm?.ultimoConcurso.hiatoAnosAnterior).toBe(11);
    expect(anm?.ultimoConcurso.deficitEstimado).toBeGreaterThan(1100);

    // Fontes oficiais e SIGBM
    const fontesUrls = anm?.fontes.map((f) => f.url);
    expect(fontesUrls?.some((url) => url.includes("sigbm"))).toBe(true);
    expect(fontesUrls?.some((url) => url.includes("portaldatransparencia"))).toBe(true);
    expect(fontesUrls?.some((url) => url.includes("tcu"))).toBe(true);
  });

  it("não deve conter nenhum CPF válido de pessoa física nos dados cadastrados", () => {
    const jsonString = JSON.stringify(ORGAOS_CAPACIDADE);
    // Procura por sequências de 11 dígitos numéricos
    const sequencias11Digitos = jsonString.match(/\b\d{11}\b/g) || [];
    for (const seq of sequencias11Digitos) {
      const ehValido = cpfValido(seq);
      expect(
        ehValido,
        `Encontrado número que passa no mod-11 como CPF válido: ${seq}`
      ).toBe(false);
    }
  });
});
