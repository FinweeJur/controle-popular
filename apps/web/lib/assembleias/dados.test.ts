/**
 * Suíte de testes unitários para a base e módulo de dados das Assembleias Legislativas.
 *
 * Papel no portal:
 * Assegura integridade cadastral das 27 Casas Legislativas estaduais brasileiras,
 * soma de 1.059 cadeiras de deputados estaduais e distritais, validação dos filtros
 * de proposições, comissões, audiências públicas e ordenação de rankings cívicos.
 *
 * Conformidade com AGENTS.md:
 * - § 5.2: Validação de ausência de dados pessoais (zero CPFs no acervo).
 * - § 5.9: Documentação e clareza das expectativas testadas.
 */

import { describe, expect, it } from "vitest";
import {
  listarProposicoesPorUf,
  listarTodasAssembleias,
  obterAssembleiaPorUf,
  obterAudienciasPorUf,
  obterComissoesPorUf,
  obterMetricasNacionaisAssembleias,
  obterRankingDeputados,
} from "./dados";

describe("Assembleias Legislativas Estaduais - Integridade Nacional", () => {
  it("deve conter exatamente as 27 Unidades Federativas brasileiras", () => {
    const assembleias = listarTodasAssembleias();
    expect(assembleias).toHaveLength(27);

    const ufs = assembleias.map((a) => a.uf);
    const ufsUnicas = new Set(ufs);
    expect(ufsUnicas.size).toBe(27);

    // Valida presença das 27 siglas de UF oficiais
    const ufsEsperadas = [
      "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
      "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
      "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    ];
    for (const uf of ufsEsperadas) {
      expect(ufs).toContain(uf);
    }
  });

  it("deve somar exatamente 1.059 deputados estaduais e distritais no Brasil", () => {
    const metricas = obterMetricasNacionaisAssembleias();
    expect(metricas.totalAssembleias).toBe(27);
    expect(metricas.totalDeputados).toBe(1059);
    expect(metricas.totalComissoes).toBeGreaterThan(140);
    expect(metricas.totalProposicoes).toBeGreaterThan(100);
    expect(metricas.totalAudiencias).toBeGreaterThan(70);
    expect(metricas.orcamentoTotalMilhoes).toBeGreaterThan(10000);
  });

  it("deve conferir o número exato de deputados dos principais estados e capitais", () => {
    const casos = [
      { uf: "SP", total: 94, sigla: "ALESP" },
      { uf: "MG", total: 77, sigla: "ALMG" },
      { uf: "RJ", total: 70, sigla: "ALERJ" },
      { uf: "BA", total: 63, sigla: "ALBA" },
      { uf: "RS", total: 55, sigla: "ALRS" },
      { uf: "PR", total: 54, sigla: "ALEP" },
      { uf: "PE", total: 49, sigla: "ALEPE" },
      { uf: "CE", total: 46, sigla: "ALECE" },
      { uf: "MA", total: 42, sigla: "ALEMA" },
      { uf: "PA", total: 41, sigla: "ALEPA" },
      { uf: "GO", total: 41, sigla: "ALEGO" },
      { uf: "SC", total: 40, sigla: "ALESC" },
      { uf: "PB", total: 36, sigla: "ALPB" },
      { uf: "ES", total: 30, sigla: "ALES" },
      { uf: "PI", total: 30, sigla: "ALEPI" },
      { uf: "AL", total: 27, sigla: "ALEAL" },
      { uf: "DF", total: 24, sigla: "CLDF" },
      { uf: "MT", total: 24, sigla: "ALMT" },
      { uf: "MS", total: 24, sigla: "ALEMS" },
      { uf: "AM", total: 24, sigla: "ALEAM" },
      { uf: "RN", total: 24, sigla: "ALRN" },
      { uf: "AC", total: 24, sigla: "ALEAC" },
      { uf: "AP", total: 24, sigla: "ALAP" },
      { uf: "RO", total: 24, sigla: "ALE-RO" },
      { uf: "RR", total: 24, sigla: "ALE-RR" },
      { uf: "SE", total: 24, sigla: "ALESE" },
      { uf: "TO", total: 24, sigla: "ALETO" },
    ];

    for (const caso of casos) {
      const casa = obterAssembleiaPorUf(caso.uf);
      expect(casa, `Assembleia de ${caso.uf} não foi encontrada`).not.toBeNull();
      expect(casa?.totalDeputados).toBe(caso.total);
      expect(casa?.sigla).toBe(caso.sigla);
    }
  });

  it("deve garantir preenchimento de todos os campos estruturais obrigatórios em cada Casa", () => {
    const assembleias = listarTodasAssembleias();

    for (const casa of assembleias) {
      // Identificação
      expect(casa.uf).toBeTruthy();
      expect(casa.sigla).toBeTruthy();
      expect(casa.nomeCompleto).toBeTruthy();
      expect(casa.capital).toBeTruthy();
      expect(casa.regiao).toMatch(/^(Norte|Nordeste|Centro-Oeste|Sudeste|Sul)$/);

      // Sede
      expect(casa.sede.edificio).toBeTruthy();
      expect(casa.sede.endereco).toBeTruthy();
      expect(casa.sede.cep).toMatch(/^\d{5}-\d{3}$/);
      expect(casa.sede.cidade).toBeTruthy();

      // Contatos e portais oficiais
      expect(casa.contatos.telefone).toMatch(/^\(\d{2}\)\s\d{4,5}-\d{4}$/);
      expect(casa.contatos.email).toContain("@");
      expect(casa.contatos.ouvidoria).toMatch(/^https?:\/\//);
      expect(casa.contatos.portalTransparencia).toMatch(/^https?:\/\//);
      expect(casa.contatos.dadosAbertos).toMatch(/^https?:\/\//);
      expect(casa.contatos.processoLegislativo).toMatch(/^https?:\/\//);

      // Transmissão
      expect(casa.transmissao.youtube).toMatch(/^https?:\/\//);
      expect(casa.transmissao.tvAssembleia).toMatch(/^https?:\/\//);
      expect(casa.transmissao.sessoesOrdinarias).toBeTruthy();

      // Mesa Diretora
      expect(casa.mesaDiretora.presidente.nome).toBeTruthy();
      expect(casa.mesaDiretora.presidente.partido).toBeTruthy();
      expect(casa.mesaDiretora.presidente.biografiaBreve.length).toBeGreaterThan(20);
      expect(casa.mesaDiretora.primeiroVicePresidente.nome).toBeTruthy();
      expect(casa.mesaDiretora.segundoVicePresidente.nome).toBeTruthy();
      expect(casa.mesaDiretora.primeiroSecretario.nome).toBeTruthy();
      expect(casa.mesaDiretora.segundoSecretario.nome).toBeTruthy();
      expect(casa.mesaDiretora.ouvidor.nome).toBeTruthy();
      expect(casa.mesaDiretora.procuradoraMulher.nome).toBeTruthy();

      // Orçamento
      expect(casa.orcamentoAnual.valorMilhoes).toBeGreaterThan(100);
      expect(casa.orcamentoAnual.anoExercicio).toBeGreaterThanOrEqual(2024);
      expect(casa.orcamentoAnual.cotaMediaGabineteMensal).toBeGreaterThan(10000);

      // Comissões (mínimo de 5 por Casa)
      expect(casa.comissoes.length).toBeGreaterThanOrEqual(5);

      // Proposições (mínimo de 5 por Casa)
      expect(casa.proposicoes.length).toBeGreaterThanOrEqual(5);

      // Audiências públicas (mínimo de 3 por Casa)
      expect(casa.audienciasPublicas.length).toBeGreaterThanOrEqual(3);

      // Deputados no ranking (mínimo de 5 por Casa)
      expect(casa.deputadosRanking.length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("Assembleias Legislativas Estaduais - Consultas por UF", () => {
  it("deve localizar assembleia com caixa alta, caixa baixa e espaços", () => {
    const spMaiusculo = obterAssembleiaPorUf("SP");
    const spMinusculo = obterAssembleiaPorUf("sp");
    const spEspacos = obterAssembleiaPorUf("  Sp  ");

    expect(spMaiusculo).not.toBeNull();
    expect(spMinusculo?.sigla).toBe("ALESP");
    expect(spEspacos?.sigla).toBe("ALESP");
  });

  it("deve retornar null para UF inexistente ou inválida", () => {
    expect(obterAssembleiaPorUf("XX")).toBeNull();
    expect(obterAssembleiaPorUf("")).toBeNull();
    // @ts-expect-error teste com valor inválido
    expect(obterAssembleiaPorUf(null)).toBeNull();
    // @ts-expect-error teste com valor inválido
    expect(obterAssembleiaPorUf(undefined)).toBeNull();
  });
});

describe("Assembleias Legislativas Estaduais - Filtros de Proposições", () => {
  it("deve listar todas as proposições da UF quando nenhum filtro for passado", () => {
    const todasSP = listarProposicoesPorUf("SP");
    expect(todasSP.length).toBeGreaterThanOrEqual(10);
  });

  it("deve filtrar proposições por termo de busca 'q' no código ou ementa", () => {
    const buscaSaude = listarProposicoesPorUf("SP", { q: "saúde" });
    expect(buscaSaude.length).toBeGreaterThan(0);
    for (const p of buscaSaude) {
      const match =
        p.ementa.toLowerCase().includes("saude") ||
        p.ementa.toLowerCase().includes("saúde") ||
        p.codigo.toLowerCase().includes("saude");
      expect(match).toBe(true);
    }
  });

  it("deve filtrar proposições por tipo (PL, PEC, PLC)", () => {
    const pecsSP = listarProposicoesPorUf("SP", { tipo: "PEC" });
    expect(pecsSP.length).toBeGreaterThanOrEqual(1);
    for (const p of pecsSP) {
      expect(p.tipo).toBe("PEC");
    }
  });

  it("deve filtrar proposições por ano de apresentação", () => {
    const proposicoes2026 = listarProposicoesPorUf("MG", { ano: 2026 });
    expect(proposicoes2026.length).toBeGreaterThan(0);
    for (const p of proposicoes2026) {
      expect(p.ano).toBe(2026);
    }
  });

  it("deve filtrar proposições por situação de tramitação", () => {
    const sancionados = listarProposicoesPorUf("SP", { situacao: "Sancionado" });
    expect(sancionados.length).toBeGreaterThan(0);
    for (const p of sancionados) {
      expect(p.situacao).toContain("Sancionado");
    }
  });

  it("deve filtrar proposições por nome do parlamentar autor", () => {
    const proposicoesEduardo = listarProposicoesPorUf("SP", { autor: "Suplicy" });
    expect(proposicoesEduardo.length).toBeGreaterThan(0);
    for (const p of proposicoesEduardo) {
      expect(p.autores.some((a) => a.nome.includes("Suplicy"))).toBe(true);
    }
  });

  it("deve retornar lista vazia para UF inexistente", () => {
    expect(listarProposicoesPorUf("ZZ")).toEqual([]);
  });

  it("deve carregar proposições com histórico de tramitação detalhado quando disponível", () => {
    const proposicoesMG = listarProposicoesPorUf("MG");
    const comTramitacao = proposicoesMG.filter((p) => p.tramitacoes && p.tramitacoes.length > 0);
    expect(comTramitacao.length).toBeGreaterThanOrEqual(1);

    const pl2450 = comTramitacao.find((p) => p.codigo.includes("2.450"));
    expect(pl2450).toBeDefined();
    expect(pl2450?.tramitacoes).toHaveLength(4);

    const ultimoAndamento = pl2450?.tramitacoes?.[0];
    expect(ultimoAndamento?.siglaOrgao).toBe("CMA");
    expect(ultimoAndamento?.descricao).toBeTruthy();
    expect(ultimoAndamento?.dataHora).toBe("2026-03-24");
  });

  it("deve conter tramitações válidas na ALESP", () => {
    const proposicoesSP = listarProposicoesPorUf("SP");
    const comTramitacao = proposicoesSP.filter((p) => p.tramitacoes && p.tramitacoes.length > 0);
    expect(comTramitacao.length).toBeGreaterThanOrEqual(1);

    const pl504 = comTramitacao.find((p) => p.codigo.includes("504"));
    expect(pl504).toBeDefined();
    expect(pl504?.tramitacoes).toHaveLength(3);
    expect(pl504?.orgaoAtual).toBe("PLEN");
  });
});

describe("Assembleias Legislativas Estaduais - Comissões e Audiências", () => {
  it("deve retornar as comissões da Casa", () => {
    const comissoesMG = obterComissoesPorUf("MG");
    expect(comissoesMG.length).toBeGreaterThanOrEqual(7);

    const siglas = comissoesMG.map((c) => c.sigla);
    expect(siglas).toContain("CCJ");
    expect(siglas).toContain("CMADS");
  });

  it("deve retornar as audiências públicas da Casa com link de transmissão", () => {
    const audienciasRJ = obterAudienciasPorUf("RJ");
    expect(audienciasRJ.length).toBeGreaterThanOrEqual(3);
    for (const aud of audienciasRJ) {
      expect(aud.tema).toBeTruthy();
      expect(aud.urlTransmissao).toMatch(/^https?:\/\//);
      expect(aud.comissao).toBeTruthy();
    }
  });

  it("deve retornar lista vazia para comissões e audiências de UF inexistente", () => {
    expect(obterComissoesPorUf("YY")).toEqual([]);
    expect(obterAudienciasPorUf("YY")).toEqual([]);
  });
});

describe("Assembleias Legislativas Estaduais - Ranking de Deputados", () => {
  it("deve retornar os deputados ordenados por pontuação cívica decrescente", () => {
    const rankingSP = obterRankingDeputados("SP");
    expect(rankingSP.length).toBeGreaterThanOrEqual(5);

    for (let i = 0; i < rankingSP.length - 1; i++) {
      expect(rankingSP[i].pontuacaoCivica).toBeGreaterThanOrEqual(rankingSP[i + 1].pontuacaoCivica);
    }
  });

  it("deve retornar lista vazia para ranking de UF inexistente", () => {
    expect(obterRankingDeputados("WW")).toEqual([]);
  });
});

describe("Assembleias Legislativas Estaduais - Proteção de Dados Pessoais (AGENTS.md § 5.2)", () => {
  it("não deve conter CPFs em nenhum campo textual das 27 assembleias", () => {
    const assembleias = listarTodasAssembleias();
    const regexCpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;

    const textoCompleto = JSON.stringify(assembleias);
    const matches = textoCompleto.match(regexCpf) || [];

    // Se houver alguma sequência numérica similar a 11 dígitos, verifica se valida por mod-11
    for (const match of matches) {
      const digitos = match.replace(/\D/g, "");
      if (digitos.length === 11) {
        // Validação mod-11 de CPF
        let soma = 0;
        for (let i = 0; i < 9; i++) {
          soma += parseInt(digitos.charAt(i), 10) * (10 - i);
        }
        let resto = 11 - (soma % 11);
        const dig1 = resto === 10 || resto === 11 ? 0 : resto;

        soma = 0;
        for (let i = 0; i < 10; i++) {
          soma += parseInt(digitos.charAt(i), 10) * (11 - i);
        }
        resto = 11 - (soma % 11);
        const dig2 = resto === 10 || resto === 11 ? 0 : resto;

        const ehCpfValido =
          dig1 === parseInt(digitos.charAt(9), 10) &&
          dig2 === parseInt(digitos.charAt(10), 10);

        expect(ehCpfValido, `Falso positivo ou CPF real detectado: ${match}`).toBe(false);
      }
    }
  });
});
