import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  obterCatalogoMucuri,
  listarMunicipiosMucuri,
  obterMunicipioMucuriPorIbge,
  listarMunicipiosIndigenas,
  listarMunicipiosPorPolo,
  buscarMunicipiosMucuri,
  obterEstatisticasMucuri,
} from "./vales-mucuri";

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

/**
 * Resolução resiliente do caminho de dados independente de onde vitest é executado.
 */
function resolverCaminhoDado(nomeArquivo: string): string {
  const tentativas = [
    path.resolve(process.cwd(), "apps", "web", "data", nomeArquivo),
    path.resolve(process.cwd(), "data", nomeArquivo),
    path.resolve(__dirname, "../../data", nomeArquivo),
  ];
  for (const t of tentativas) {
    if (fs.existsSync(t)) return t;
  }
  return tentativas[0];
}

describe("lib/cidades/vales-mucuri — Catálogo e Inteligência Territorial do Vale do Mucuri", () => {
  it("deve carregar exatamente os 27 municípios do catálogo do Vale do Mucuri", () => {
    const catalogo = obterCatalogoMucuri();
    expect(catalogo.total_cidades).toBe(27);
    expect(catalogo.municipios.length).toBe(27);
    expect(catalogo.polo_regional).toBe("Teófilo Otoni");
    expect(catalogo.bacia_hidrografica).toContain("Mucuri");
    expect(catalogo.bioma).toContain("Mata Atlântica");

    const lista = listarMunicipiosMucuri();
    expect(lista.length).toBe(27);
  });

  it("deve conter todos os 27 municípios exigidos com grafia e nomes canônicos", () => {
    const nomesEsperados = [
      "Teófilo Otoni",
      "Águas Formosas",
      "Ataléia",
      "Campanário",
      "Caraí",
      "Carlos Chagas",
      "Catuji",
      "Franciscópolis",
      "Frei Gaspar",
      "Fronteira dos Vales",
      "Itaipé",
      "Itambacuri",
      "Ladainha",
      "Machacalis",
      "Malacacheta",
      "Nanuque",
      "Nova Módica",
      "Novo Cruzeiro",
      "Novo Oriente de Minas",
      "Ouro Verde de Minas",
      "Pavão",
      "Pescador",
      "Poté",
      "Santa Helena de Minas",
      "São José do Divino",
      "Serra dos Aimorés",
      "Umburatiba",
    ];

    const municipios = listarMunicipiosMucuri();
    const nomesNoCatalogo = municipios.map((m) => m.nome);

    for (const nome of nomesEsperados) {
      expect(nomesNoCatalogo).toContain(nome);
    }
  });

  it("deve conferir os códigos IBGE de 7 e 6 dígitos com o cálculo matemático oficial de DV e municipios-mg.json", () => {
    const jsonMgPath = resolverCaminhoDado("municipios-mg.json");
    const rawMg = fs.readFileSync(jsonMgPath, "utf-8");
    const mgData = JSON.parse(rawMg) as Array<{ id: number; nome: string }>;

    const municipios = listarMunicipiosMucuri();

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

  it("deve identificar com exatidão as terras indígenas e a presença do Povo Maxakali", () => {
    const indigenas = listarMunicipiosIndigenas();
    expect(indigenas.length).toBe(2);

    const nomesIndigenas = indigenas.map((m) => m.nome);
    expect(nomesIndigenas).toContain("Ladainha");
    expect(nomesIndigenas).toContain("Santa Helena de Minas");

    for (const m of indigenas) {
      expect(m.tem_terras_indigenas).toBe(true);
      expect(m.povo_indigena).toBe("Maxakali");
      expect(m.tags).toContain("Indígena Maxakali");
    }

    // Demais municípios devem ter tem_terras_indigenas como false
    const naoIndigenas = listarMunicipiosMucuri().filter((m) => !m.tem_terras_indigenas);
    expect(naoIndigenas.length).toBe(25);
    for (const m of naoIndigenas) {
      expect(m.tem_terras_indigenas).toBe(false);
      expect(m.povo_indigena).toBeNull();
    }
  });

  it("deve validar URLs oficiais de consulta ao PNCP e portais de transparência", () => {
    const municipios = listarMunicipiosMucuri();

    for (const m of municipios) {
      // Validação PNCP
      expect(m.link_pncp).toMatch(/^https:\/\/pncp\.gov\.br\/app\/contratos\?q=/);
      expect(m.link_pncp).toContain("uf=MG");

      // Validação Transparência Municipal
      expect(m.link_transparencia).toMatch(/^https:\/\/(www\.)?[a-z0-9-]+\.mg\.gov\.br\/transparencia/);
    }
  });

  it("deve permitir busca por código IBGE 7 dígitos, 6 dígitos e alias legado", () => {
    // Teófilo Otoni: oficial 3168606, 6 dígitos 316860, alias legado 3168608
    const teoOficial7 = obterMunicipioMucuriPorIbge("3168606");
    expect(teoOficial7?.nome).toBe("Teófilo Otoni");

    const teoOficial6 = obterMunicipioMucuriPorIbge("316860");
    expect(teoOficial6?.nome).toBe("Teófilo Otoni");

    const teoLegado = obterMunicipioMucuriPorIbge("3168608");
    expect(teoLegado?.nome).toBe("Teófilo Otoni");

    // Nanuque: oficial 3144300, 6 dígitos 314430, alias legado 3144302
    const nanOficial7 = obterMunicipioMucuriPorIbge("3144300");
    expect(nanOficial7?.nome).toBe("Nanuque");

    const nanLegado = obterMunicipioMucuriPorIbge("3144302");
    expect(nanLegado?.nome).toBe("Nanuque");

    // Santa Helena de Minas: oficial 3157658, alias 3157700
    const santaHelena = obterMunicipioMucuriPorIbge("3157700");
    expect(santaHelena?.nome).toBe("Santa Helena de Minas");
    expect(santaHelena?.tem_terras_indigenas).toBe(true);
  });

  it("deve filtrar corretamente por polo regional e busca semântica", () => {
    const poloTeofilo = listarMunicipiosPorPolo("Teófilo Otoni");
    expect(poloTeofilo.length).toBe(19);

    const poloNanuque = listarMunicipiosPorPolo("Nanuque");
    expect(poloNanuque.length).toBe(8);

    // Soma dos polos deve totalizar 27
    expect(poloTeofilo.length + poloNanuque.length).toBe(27);

    // Busca textual
    const buscaMaxakali = buscarMunicipiosMucuri("Maxakali");
    expect(buscaMaxakali.length).toBeGreaterThanOrEqual(2);

    const buscaPedras = buscarMunicipiosMucuri("Pedras Preciosas");
    expect(buscaPedras.length).toBeGreaterThanOrEqual(3);
  });

  it("deve retornar estatísticas territoriais consolidadas", () => {
    const stats = obterEstatisticasMucuri();
    expect(stats.totalCidades).toBe(27);
    expect(stats.totalIndigenas).toBe(2);
    expect(stats.municipiosPorPolo["Teófilo Otoni"]).toBe(19);
    expect(stats.municipiosPorPolo["Nanuque"]).toBe(8);
    expect(stats.povosIndigenas).toEqual(["Maxakali"]);
    expect(stats.baciasPrincipais.length).toBeGreaterThan(0);
    expect(stats.baciasPrincipais).toContain("Rio Todos os Santos");
    expect(stats.baciasPrincipais).toContain("Rio Mucuri");
  });

  it("deve garantir zero CPFs nos dados (AGENTS.md §5.2)", () => {
    const jsonPath = resolverCaminhoDado("vales-mucuri.json");
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
