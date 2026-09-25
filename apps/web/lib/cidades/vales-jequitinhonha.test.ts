import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  obterCatalogoJequitinhonha,
  listarMunicipiosJequitinhonha,
  obterMunicipioJequitinhonhaPorIbge,
  listarMunicipiosLitio,
  listarMunicipiosTradicionais,
  listarPorSubregiao,
  buscarMunicipiosJequitinhonha,
  obterEstatisticasJequitinhonha,
} from "./vales-jequitinhonha";

/**
 * Função de validação de CPF por algoritmo mod-11 oficial (AGENTS.md §5.2).
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

/**
 * Cálculo do dígito verificador do IBGE (Módulo 10, pesos 1 e 2).
 */
function calcularDvIbge(ibge6: string): number {
  const digits = ibge6.split("").map(Number);
  const weights = [1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 6; i++) {
    let prod = digits[i] * weights[i];
    if (prod > 9) prod = Math.floor(prod / 10) + (prod % 10);
    sum += prod;
  }
  const rem = sum % 10;
  return rem === 0 ? 0 : 10 - rem;
}

describe("lib/cidades/vales-jequitinhonha — Catálogo e Inteligência Territorial do Vale do Jequitinhonha", () => {
  it("deve carregar exatamente os 55 municípios do catálogo do Vale do Jequitinhonha", () => {
    const catalogo = obterCatalogoJequitinhonha();
    expect(catalogo.total_cidades).toBe(55);
    expect(catalogo.municipios.length).toBe(55);
    expect(catalogo.sub_regioes).toEqual([
      "Alto Jequitinhonha",
      "Médio Jequitinhonha",
      "Baixo Jequitinhonha",
    ]);
    expect(catalogo.bacia_hidrografica).toContain("Jequitinhonha");
    expect(catalogo.bioma_predominante).toContain("Cerrado");
    expect(catalogo.populacao_total_estimada).toBeGreaterThan(600000);

    const lista = listarMunicipiosJequitinhonha();
    expect(lista.length).toBe(55);
  });

  it("deve conter todos os 55 municípios exigidos com grafia e nomes canônicos", () => {
    const nomesEsperados = [
      // Alto Jequitinhonha (20)
      "Diamantina",
      "Couto de Magalhães de Minas",
      "Felício dos Santos",
      "Gouveia",
      "Presidente Kubitschek",
      "São Gonçalo do Rio Preto",
      "Senador Modestino Gonçalves",
      "Carbonita",
      "Itamarandiba",
      "Veredinha",
      "Capelinha",
      "Angelândia",
      "Aricanduva",
      "Datas",
      "Alvorada de Minas",
      "Coluna",
      "Rio Vermelho",
      "Serra Azul de Minas",
      "Serro",
      "Santo Antônio do Itambé",

      // Médio Jequitinhonha (19)
      "Araçuaí",
      "Coronel Murta",
      "Berilo",
      "Chapada do Norte",
      "Francisco Badaró",
      "Itinga",
      "Jenipapo de Minas",
      "José Gonçalves de Minas",
      "Medina",
      "Ponto dos Volantes",
      "Virgem da Lapa",
      "Minas Novas",
      "Turmalina",
      "Leme do Prado",
      "Pedra Azul",
      "Cachoeira de Pajeú",
      "Comercinho",
      "Itaobim",
      "Padre Paraíso",

      // Baixo Jequitinhonha (16)
      "Almenara",
      "Bandeira",
      "Divisópolis",
      "Felisburgo",
      "Jacinto",
      "Jequitinhonha",
      "Joaíma",
      "Jordânia",
      "Mata Verde",
      "Monte Formoso",
      "Palmópolis",
      "Rio do Prado",
      "Rubim",
      "Salto da Divisa",
      "Santa Maria do Salto",
      "Santo Antônio do Jacinto",
    ];

    expect(nomesEsperados.length).toBe(55);

    const municipios = listarMunicipiosJequitinhonha();
    const nomesNoCatalogo = municipios.map((m) => m.nome);

    for (const nome of nomesEsperados) {
      expect(nomesNoCatalogo).toContain(nome);
    }
  });

  it("deve conferir os códigos IBGE de 7 e 6 dígitos com o cálculo matemático oficial de DV e municipios-mg.json", () => {
    const jsonMgPath = path.resolve(process.cwd(), "apps", "web", "data", "municipios-mg.json");
    const rawMg = fs.readFileSync(jsonMgPath, "utf-8");
    const mgData = JSON.parse(rawMg) as Array<{ id: number; nome: string }>;

    const municipios = listarMunicipiosJequitinhonha();

    for (const m of municipios) {
      expect(m.id_ibge7).toHaveLength(7);
      expect(m.id_ibge6).toHaveLength(6);
      expect(m.id_ibge7.startsWith(m.id_ibge6)).toBe(true);

      // Validação matemática do DV mod-10 do IBGE
      const dvEsperado = calcularDvIbge(m.id_ibge6);
      expect(Number(m.id_ibge7[6])).toBe(dvEsperado);

      // Validação com o repositório fonte oficial municipios-mg.json
      const registroOficial = mgData.find((item) => item.id === Number(m.id_ibge7));
      expect(registroOficial).toBeDefined();
      expect(registroOficial?.nome.toLowerCase()).toBe(m.nome.toLowerCase());
    }
  });

  it("deve identificar com exatidão os municípios do Polo do Lítio (Araçuaí, Itinga, Coronel Murta)", () => {
    const municipiosLitio = listarMunicipiosLitio();
    expect(municipiosLitio.length).toBeGreaterThanOrEqual(3);

    const nomesLitio = municipiosLitio.map((m) => m.nome);
    expect(nomesLitio).toContain("Araçuaí");
    expect(nomesLitio).toContain("Itinga");
    expect(nomesLitio).toContain("Coronel Murta");

    for (const m of municipiosLitio) {
      expect(m.tem_litio).toBe(true);
      expect(m.tags).toContain("Lítio");
    }

    // Araçuaí e Itinga possuem tags específicas do polo mineral
    const aracuai = obterMunicipioJequitinhonhaPorIbge("3103405");
    expect(aracuai?.tem_litio).toBe(true);
    expect(aracuai?.tags).toContain("Vale do Lítio");

    const itinga = obterMunicipioJequitinhonhaPorIbge("3134004");
    expect(itinga?.tem_litio).toBe(true);
    expect(itinga?.tags).toContain("Sigma Lithium");
  });

  it("deve identificar municípios com comunidades tradicionais (quilombolas, geraizeiros, vazanteiros)", () => {
    const tradicionais = listarMunicipiosTradicionais();
    expect(tradicionais.length).toBeGreaterThanOrEqual(30);

    const nomesTradicionais = tradicionais.map((m) => m.nome);
    expect(nomesTradicionais).toContain("Berilo");
    expect(nomesTradicionais).toContain("Chapada do Norte");
    expect(nomesTradicionais).toContain("Minas Novas");
    expect(nomesTradicionais).toContain("Araçuaí");
    expect(nomesTradicionais).toContain("Diamantina");
    expect(nomesTradicionais).toContain("Serro");

    const berilo = obterMunicipioJequitinhonhaPorIbge("3106507");
    expect(berilo?.tem_comunidades_tradicionais).toBe(true);
    expect(berilo?.tipo_comunidade).toContain("Quilombola");

    const chapada = obterMunicipioJequitinhonhaPorIbge("3116100");
    expect(chapada?.tem_comunidades_tradicionais).toBe(true);
    expect(chapada?.tipo_comunidade).toContain("Quilombola");

    const minasNovas = obterMunicipioJequitinhonhaPorIbge("3141801");
    expect(minasNovas?.tem_comunidades_tradicionais).toBe(true);
    expect(minasNovas?.tipo_comunidade).toContain("Quilombola");
  });

  it("deve validar URLs oficiais de consulta ao PNCP e portais de transparência", () => {
    const municipios = listarMunicipiosJequitinhonha();

    for (const m of municipios) {
      // Validação PNCP
      expect(m.link_pncp).toMatch(/^https:\/\/pncp\.gov\.br\/app\/contratos\?q=/);
      expect(m.link_pncp).toContain("uf=MG");

      // Validação Transparência Municipal
      expect(m.link_transparencia).toMatch(/^https:\/\/(www\.)?[a-z0-9-]+\.mg\.gov\.br\/transparencia/);
    }
  });

  it("deve permitir busca por código IBGE 7 dígitos, 6 dígitos e alias legado", () => {
    // Araçuaí: oficial 3103405, 6 dígitos 310340
    const aracuai7 = obterMunicipioJequitinhonhaPorIbge("3103405");
    expect(aracuai7?.nome).toBe("Araçuaí");

    const aracuai6 = obterMunicipioJequitinhonhaPorIbge("310340");
    expect(aracuai6?.nome).toBe("Araçuaí");

    // Itinga: oficial 3134004, 6 dígitos 313400
    const itinga7 = obterMunicipioJequitinhonhaPorIbge("3134004");
    expect(itinga7?.nome).toBe("Itinga");

    const itinga6 = obterMunicipioJequitinhonhaPorIbge("313400");
    expect(itinga6?.nome).toBe("Itinga");

    // Diamantina: oficial 3121605, 6 dígitos 312160
    const diam7 = obterMunicipioJequitinhonhaPorIbge("3121605");
    expect(diam7?.nome).toBe("Diamantina");

    // Aliases legados do rascunho de migração / prompt
    // Presidente Kubitschek: oficial 3153301, legado 3153303
    const pk = obterMunicipioJequitinhonhaPorIbge("3153303");
    expect(pk?.nome).toBe("Presidente Kubitschek");
    expect(pk?.id_ibge7).toBe("3153301");

    // Chapada do Norte: oficial 3116100, legado 3115904
    const chapada = obterMunicipioJequitinhonhaPorIbge("3115904");
    expect(chapada?.nome).toBe("Chapada do Norte");
    expect(chapada?.id_ibge7).toBe("3116100");

    // Cachoeira de Pajeú: oficial 3102704, legado 3109808
    const pajeu = obterMunicipioJequitinhonhaPorIbge("3109808");
    expect(pajeu?.nome).toBe("Cachoeira de Pajeú");
    expect(pajeu?.id_ibge7).toBe("3102704");

    // Minas Novas: oficial 3141801, legado 3141803
    const mn = obterMunicipioJequitinhonhaPorIbge("3141803");
    expect(mn?.nome).toBe("Minas Novas");
    expect(mn?.id_ibge7).toBe("3141801");

    // Turmalina: oficial 3169703, legado 3169705
    const turm = obterMunicipioJequitinhonhaPorIbge("3169705");
    expect(turm?.nome).toBe("Turmalina");
    expect(turm?.id_ibge7).toBe("3169703");
  });

  it("deve filtrar corretamente por sub-região (Alto, Médio e Baixo)", () => {
    const alto = listarPorSubregiao("Alto Jequitinhonha");
    expect(alto.length).toBe(20);

    const medio = listarPorSubregiao("Médio Jequitinhonha");
    expect(medio.length).toBe(19);

    const baixo = listarPorSubregiao("Baixo Jequitinhonha");
    expect(baixo.length).toBe(16);

    // Total de sub-regiões deve somar exatamente 55
    expect(alto.length + medio.length + baixo.length).toBe(55);
  });

  it("deve suportar busca textual semântica abrangente", () => {
    const buscaLitio = buscarMunicipiosJequitinhonha("Lítio");
    expect(buscaLitio.length).toBeGreaterThanOrEqual(3);

    const buscaQuilombola = buscarMunicipiosJequitinhonha("Quilombola");
    expect(buscaQuilombola.length).toBeGreaterThanOrEqual(20);

    const buscaBarro = buscarMunicipiosJequitinhonha("Barro");
    expect(buscaBarro.length).toBeGreaterThanOrEqual(5);

    const buscaEspinhaço = buscarMunicipiosJequitinhonha("Espinhaço");
    expect(buscaEspinhaço.length).toBeGreaterThanOrEqual(3);
  });

  it("deve retornar estatísticas territoriais consolidadas", () => {
    const stats = obterEstatisticasJequitinhonha();
    expect(stats.totalCidades).toBe(55);
    expect(stats.totalLitio).toBeGreaterThanOrEqual(3);
    expect(stats.totalTradicionais).toBeGreaterThanOrEqual(30);
    expect(stats.populacaoTotal).toBe(689696);
    expect(stats.municipiosPorSubregiao["Alto Jequitinhonha"]).toBe(20);
    expect(stats.municipiosPorSubregiao["Médio Jequitinhonha"]).toBe(19);
    expect(stats.municipiosPorSubregiao["Baixo Jequitinhonha"]).toBe(16);
    expect(stats.tiposComunidades).toContain("Quilombola");
    expect(stats.baciasPrincipais).toContain("Rio Jequitinhonha");
    expect(stats.baciasPrincipais).toContain("Rio Araçuaí");
  });

  it("deve garantir zero CPFs nos dados (AGENTS.md §5.2)", () => {
    const jsonPath = path.resolve(process.cwd(), "apps", "web", "data", "vales-jequitinhonha.json");
    const conteudo = fs.readFileSync(jsonPath, "utf-8");

    // Procura por sequências de 11 dígitos no arquivo de dados
    const matches11 = conteudo.match(/\b\d{11}\b/g) || [];
    for (const seq of matches11) {
      const eCpf = cpfValido(seq);
      expect(eCpf).toBe(false);
    }

    // Procura por padrões formatados 000.000.000-00
    const matchesFormatados = conteudo.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g) || [];
    for (const seq of matchesFormatados) {
      const digitos = seq.replace(/\D/g, "");
      const eCpf = cpfValido(digitos);
      expect(eCpf).toBe(false);
    }
  });
});
