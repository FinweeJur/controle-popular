/**
 * licencas-unificada.test.ts — guarda do feed único de licenças/outorgas/autos
 * (`lib/ambiental/licencas-unificada.ts`), lido no build por
 * `/ambiental/licencas`.
 *
 * O que este arquivo protege:
 *  - a tabela declarativa `REGRAS_LINK_OFICIAL` (link por órgão): um órgão
 *    sem regra NÃO pode ganhar link inventado, e a ordem das regras desempata
 *    casos como IBAMA × IBAMA (autos) e SEMAD (MG) × SEMAD (GO);
 *  - a lista única `FONTES` da cobertura: ressalva de fonte não some nem vira
 *    string vazia (§7 AGENTS.md), e total/truncado saem do MESMO índice;
 *  - as fontes estaduais simples (BA, MA, PA, GO): UF, lado da data, valor e
 *    reclassificação de categoria saem da configuração, não de função nova.
 *
 * Os testes leem a AMOSTRA versionada em `data/amostras/` — se a coleta mudar
 * a amostra, os números acompanham e o teste diz o que divergiu.
 */
import { describe, it, expect } from "vitest";
import {
  construirLinkOficial,
  inferirPorte,
  extrairValor,
  extrairTamanho,
  REGISTROS_LICENCAS,
  LICENCAS_COBERTURA,
} from "./licencas-unificada";

describe("construirLinkOficial — links específicos para consulta processual oficial", () => {
  it("devolve URL direta quando fornecida pelo coletor", () => {
    const url = "http://monitoramento.semas.pa.gov.br/simlam/VisualizarProcesso.aspx?id=16995";
    expect(construirLinkOficial("SEMAS (PA)", "2010/0000032316", "licenca", url)).toBe(url);
  });

  it("retorna null para processos vazios ou genéricos", () => {
    expect(construirLinkOficial("IBAMA", "")).toBeNull();
    expect(construirLinkOficial("IBAMA", "s/n")).toBeNull();
    expect(construirLinkOficial("IBAMA", "—")).toBeNull();
  });

  it("gera links específicos para cada um dos 18 órgãos/fontes sem homepages genéricas", () => {
    const casos = [
      { orgao: "IBAMA", proc: "02001.002739/2004-11", cat: "licenca", esperado: "sei.ibama.gov.br" },
      { orgao: "IBAMA (autos)", proc: "UNT9FZQK", cat: "auto_infracao", esperado: "ConsultaInfracoes.php?termo=" },
      { orgao: "ANA", proc: "02501.000251/2017", cat: "outorga", esperado: "cnarh/consulta/processo?numero=" },
      { orgao: "IGAM (MG)", proc: "1800001/2018", cat: "outorga", esperado: "consulta_portarias.jsp?num=" },
      { orgao: "SEMA (MT)", proc: "2021/0676", cat: "licenca", esperado: "simlam.sema.mt.gov.br" },
      { orgao: "INEMA (BA)", proc: "2020-001234", cat: "licenca", esperado: "seia.ba.gov.br/consulta-processo" },
      { orgao: "SEMA (MA)", proc: "12345/2022", cat: "licenca", esperado: "sigla.sema.ma.gov.br" },
      { orgao: "SEMAS (PA)", proc: "2010/0000032316", cat: "licenca", esperado: "simlam/painel_processo.aspx" },
      { orgao: "SEMAD (GO)", proc: "201900017001", cat: "licenca", esperado: "sga.meioambiente.go.gov.br" },
      { orgao: "FEPAM (RS)", proc: "AI 4 (Proc. 001374-0567/17-1)", cat: "auto_infracao", esperado: "sol.fepam.rs.gov.br" },
      { orgao: "SEMAR (PI)", proc: "DDLAE-E.08807-0/2026", cat: "licenca", esperado: "siga.semarh.pi.gov.br" },
      { orgao: "IMASUL (MS)", proc: "0051/2012", cat: "licenca", esperado: "imasul.ms.gov.br/consulta-processo" },
      { orgao: "IEMA (ES)", proc: "44750/2015", cat: "licenca", esperado: "siga.es.gov.br" },
      { orgao: "SEDAM (RO)", proc: "COP 3147800237", cat: "licenca", esperado: "sigam.sedam.ro.gov.br" },
      { orgao: "IBRAM (DF)", proc: "00391-00023650/2017-97", cat: "licenca", esperado: "sei.df.gov.br" },
      { orgao: "CETESB (SP)", proc: "CETESB-AC-1", cat: "licenca", esperado: "e.ambiente.sp.gov.br" },
      { orgao: "IAT (PR)", proc: "Protocolo 176488697 (Doc. 35146)", cat: "licenca", esperado: "eprotocolo.pr.gov.br" },
      { orgao: "IMA (SC)", proc: "Licença 8103/2021 (Proc. DIV/22065/CAV)", cat: "licenca", esperado: "sinfat.ima.sc.gov.br" },
    ];

    for (const c of casos) {
      const url = construirLinkOficial(c.orgao, c.proc, c.cat);
      expect(url, `Falha no órgão ${c.orgao}`).not.toBeNull();
      expect(url).toContain(c.esperado);
      const u = new URL(url!);
      expect(u.pathname.length + u.search.length).toBeGreaterThan(1);
    }
  });
});

describe("Classificadores de Porte, Valor e Tamanho", () => {
  it("infere portes corretamente", () => {
    expect(inferirPorte(null, "1", null, null)).toBe("Excepcional / PAC");
    expect(inferirPorte("Classe 6", null, "Mineração de Ferro", null)).toBe("Grande Porte");
    expect(inferirPorte(null, null, "Loteamento Urbano", null)).toBe("Médio Porte");
    expect(inferirPorte(null, null, "LAS - Licenciamento Ambiental Simplificado", null)).toBe("Pequeno Porte");
    expect(inferirPorte(null, null, "Declaração de Dispensa de Licenciamento", null)).toBe("Micro / Dispensado");
  });

  it("extrai valores monetários", () => {
    expect(extrairValor(50000, null)).toBe(50000);
    expect(extrairValor("150.000,50", null)).toBe(150000.5);
    expect(extrairValor(null, "Investimento previsto de R$ 1.250.000,00 no local")).toBe(1250000);
  });

  it("extrai dados de tamanho e capacidade", () => {
    expect(extrairTamanho("Classe 5", null, null, null)).toBe("Classe 5");
    expect(extrairTamanho(null, "Área: 45,5 ha", null, null)).toBe("Área: 45,5 ha");
    expect(extrairTamanho(null, null, "Supressão em 12,3 ha", null)).toBe("12,3 ha");
  });
});

describe("REGISTROS_LICENCAS e integridade da Cobertura", () => {
  it("contém registros com link_oficial para processos válidos", () => {
    expect(REGISTROS_LICENCAS.length).toBeGreaterThan(0);
    const comProcesso = REGISTROS_LICENCAS.filter((r) => r.processo && r.processo !== "s/n");
    expect(comProcesso.length).toBeGreaterThan(0);
    const comLink = comProcesso.filter((r) => r.link_oficial);
    expect(comLink.length / comProcesso.length).toBeGreaterThan(0.9);
  });

  it("cobertura contém os órgãos da expansão sem violar regra editorial", () => {
    expect(LICENCAS_COBERTURA.total).toBeGreaterThan(0);
    expect(Object.keys(LICENCAS_COBERTURA.por_orgao).length).toBeGreaterThanOrEqual(15);
  });
});

describe("REGRAS_LINK_OFICIAL — tabela declarativa por órgão", () => {
  it("desempata o IBAMA: nome exato vai para o SEI, autos vão para o CTF", () => {
    // A ordem da tabela é a regra: "IBAMA" puro NÃO vira link de auto mesmo
    // quando a categoria diz auto_infracao (comportamento do `if` original).
    expect(construirLinkOficial("IBAMA", "02001.002739/2004-11", "auto_infracao")).toContain("sei.ibama.gov.br");
    expect(construirLinkOficial("IBAMA", "02001.002739/2004-11", "licenca")).toContain("sei.ibama.gov.br");
    expect(construirLinkOficial("IBAMA (autos)", "UNT9FZQK", "licenca")).toContain("ConsultaInfracoes.php");
    expect(construirLinkOficial("IBAMA", "UNT9FZQK", "auto_infracao")).toContain("sei.ibama.gov.br");
  });

  it("separa SEMAD de MG (SIAM) de SEMAD de GO (SGA)", () => {
    const siam = "siam.mg.gov.br/siam/processo/consulta_processo.jsp?num=";
    expect(construirLinkOficial("SEMAD (MG)", "12345")).toContain(siam);
    expect(construirLinkOficial("FEAM", "12345")).toContain(siam);
    expect(construirLinkOficial("IEF", "12345")).toContain(siam);
    expect(construirLinkOficial("SEMAD (GO)", "12345")).toContain("sga.meioambiente.go.gov.br");
    expect(construirLinkOficial("SEMAD-GO", "12345")).toContain("sga.meioambiente.go.gov.br");
    // O IGAM usa o MESMO SIAM, mas a página de portarias, não a de processos.
    expect(construirLinkOficial("IGAM (MG)", "1800001/2018")).toContain("consulta_portarias.jsp?num=");
  });

  it("cada tabela limpa o processo do jeito que a fonte consulta", () => {
    expect(construirLinkOficial("IGAM (MG)", "Portaria 1800001/2018")).toContain("num=1800001%2F2018");
    expect(construirLinkOficial("FEPAM (RS)", "AI 4 (Proc. 001374-0567/17-1)")).toContain(
      "termo=001374-0567%2F17-1"
    );
    expect(construirLinkOficial("IAT (PR)", "Protocolo 176488697 (Doc. 35146)")).toContain("numero=176488697");
    expect(construirLinkOficial("IMA (SC)", "Licença 8103/2021 (Proc. DIV/22065/CAV)")).toContain(
      "codigo=DIV%2F22065%2FCAV"
    );
  });

  it("órgão sem regra na tabela não ganha link inventado", () => {
    expect(construirLinkOficial("SECRETARIA INEXISTENTE", "12345")).toBeNull();
    expect(construirLinkOficial("ANA", "s/n")).toBeNull();
    expect(construirLinkOficial("IBAMA", "—")).toBeNull();
  });
});

describe("FONTES — índice único da cobertura (antes: 3 listas iguais)", () => {
  it("ressalvas seguem a ordem da coleta e nenhuma sai vazia", () => {
    const { ressalvas } = LICENCAS_COBERTURA;
    expect(ressalvas.length).toBeGreaterThanOrEqual(17);
    expect(ressalvas.every((r) => r.trim().length > 0)).toBe(true);
    // Ordem da lista FONTES: ANA (outorgas federais) e depois IBAMA (autos).
    expect(ressalvas[0]).toContain("outorga");
    expect(ressalvas[1]).toContain("IBAMA");
  });

  it("total e truncado saem do mesmo índice de 18 fontes", () => {
    // `total` é o acervo real coletado; a janela do cliente é menor.
    expect(LICENCAS_COBERTURA.total).toBeGreaterThan(REGISTROS_LICENCAS.length);
    // Alguma fonte da amostra está truncada (ANA, FEPAM, IAT, IMASUL, IMA...).
    expect(LICENCAS_COBERTURA.truncado).toBe(true);
  });
});

describe("Fontes estaduais simples (BA, MA, PA, GO) — configuração declarativa", () => {
  const fontes = [
    { orgao: "INEMA (BA)", uf: "BA", lado: "inicio" },
    { orgao: "SEMA (MA)", uf: "MA", lado: "inicio" },
    { orgao: "SEMAS (PA)", uf: "PA", lado: "fim" },
    { orgao: "SEMAD (GO)", uf: "GO", lado: "inicio" },
  ] as const;

  it("cada fonte usa a UF e o lado da data da sua configuração", () => {
    for (const f of fontes) {
      const linhas = REGISTROS_LICENCAS.filter((l) => l.orgao === f.orgao);
      expect(linhas.length, f.orgao).toBeGreaterThan(0);
      expect(
        linhas.every((l) => l.uf === f.uf),
        `${f.orgao}: uf divergente`
      ).toBe(true);
      // O outro lado da data fica null: a publicação vira início OU fim, nunca os dois.
      if (f.lado === "inicio") {
        expect(linhas.every((l) => l.data_fim === null), `${f.orgao}: data_fim devia ser null`).toBe(true);
      } else {
        expect(linhas.every((l) => l.data_inicio === null), `${f.orgao}: data_inicio devia ser null`).toBe(true);
      }
    }
  });

  it("só BA e MA extraem valor do resumo; PA e GO não têm o campo", () => {
    const temValor = (orgao: string) =>
      REGISTROS_LICENCAS.filter((l) => l.orgao === orgao).some((l) => "valor_investimento" in l);
    expect(temValor("INEMA (BA)")).toBe(true);
    expect(temValor("SEMA (MA)")).toBe(true);
    // Sem a chave (não com `undefined`): é o formato que a fonte publica.
    expect(temValor("SEMAS (PA)")).toBe(false);
    expect(temValor("SEMAD (GO)")).toBe(false);
  });

  it("PA reclassifica outorga e auto de infração pelo tipo do ato", () => {
    const pa = REGISTROS_LICENCAS.filter((l) => l.orgao === "SEMAS (PA)");
    const comOutorga = pa.filter((l) => /outorga/i.test(l.tipo));
    const comAuto = pa.filter((l) => /infrac|auto/i.test(l.tipo));
    // A amostra versionada traz 5 outorgas e 1 auto ("Processo Administrativo Infracional").
    expect(comOutorga.length).toBeGreaterThan(0);
    expect(comAuto.length).toBeGreaterThan(0);
    expect(comOutorga.every((l) => l.categoria === "outorga")).toBe(true);
    expect(comAuto.every((l) => l.categoria === "auto_infracao")).toBe(true);
    expect(pa.some((l) => l.categoria === "licenca")).toBe(true);
  });

  it("BA não promove sigla a categoria: EDITAL (NOT) segue como licença", () => {
    const ba = REGISTROS_LICENCAS.filter((l) => l.orgao === "INEMA (BA)");
    expect(ba.length).toBeGreaterThan(0);
    expect(ba.some((l) => l.tipo.includes("NOT")), "amostra sem EDITAL (NOT)").toBe(true);
    expect(ba.every((l) => l.categoria === "licenca")).toBe(true);
  });
});
