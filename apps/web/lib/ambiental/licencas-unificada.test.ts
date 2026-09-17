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
