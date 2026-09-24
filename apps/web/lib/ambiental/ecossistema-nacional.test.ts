import { describe, expect, test } from "vitest";
import {
  ECOSSISTEMA_NACIONAL,
  LISTA_CATEGORIAS,
  LISTA_ESFERAS,
  LISTA_REGIOES,
  exportarEcossistemaParaCsv,
  filtrarInstituicoes,
  obterEstatisticasEcossistema,
  obterInstituicaoPorId,
  obterInstituicoesPorCategoria,
  obterInstituicoesPorEsfera,
  obterInstituicoesPorRegiao,
  obterInstituicoesPorUf,
  obterTodasInstituicoes,
} from "./ecossistema-nacional";

// Função mod-11 para verificação rigorosa de ausência de CPF
function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += Number(digitos[i]) * (10 - i);
  let r = (soma * 10) % 11;
  const dv1 = r === 10 ? 0 : r;
  if (dv1 !== Number(digitos[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += Number(digitos[i]) * (11 - i);
  r = (soma * 10) % 11;
  const dv2 = r === 10 ? 0 : r;
  return dv2 === Number(digitos[10]);
}

describe("Ecossistema Regulatório, Ambiental e de Concessionárias do Brasil", () => {
  test("o acervo possui 60+ instituições registradas (meta mínima)", () => {
    const total = obterTodasInstituicoes().length;
    expect(total).toBeGreaterThanOrEqual(60);
    expect(total).toBe(73);
  });

  test("ONS está registrado com atribuições do Sistema Interligado Nacional", () => {
    const ons = obterInstituicaoPorId("ons");
    expect(ons).toBeDefined();
    expect(ons?.sigla).toBe("ONS");
    expect(ons?.papelPrincipal).toContain("Sistema Interligado Nacional");
  });

  test("não há IDs duplicados no acervo", () => {
    const ids = ECOSSISTEMA_NACIONAL.map((i) => i.id);
    const setIds = new Set(ids);
    expect(setIds.size).toBe(ids.length);
  });

  test("todos os IDs seguem formato kebab-case válido", () => {
    for (const inst of ECOSSISTEMA_NACIONAL) {
      expect(inst.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  test("todas as 6 categorias obrigatórias contêm registros mapeados", () => {
    for (const categoria of LISTA_CATEGORIAS) {
      const itens = obterInstituicoesPorCategoria(categoria);
      expect(itens.length).toBeGreaterThan(0);
    }
  });

  test("cobre os Órgãos Ambientais Estaduais (OEMAs) de todos os 27 estados da federação", () => {
    const oemas = obterInstituicoesPorCategoria("Órgão Ambiental Estadual");
    const estadosPresentes = new Set(oemas.map((o) => o.uf));

    const todosEstados = [
      "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
      "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
      "RS", "RO", "RR", "SC", "SP", "SE", "TO",
    ];

    for (const uf of todosEstados) {
      expect(estadosPresentes.has(uf)).toBe(true);
    }
    expect(estadosPresentes.size).toBe(27);
  });

  test("Minas Gerais possui seus órgãos ambientais essenciais do SISEMA mapeados", () => {
    const orgaosMg = obterInstituicoesPorUf("MG");
    const siglas = orgaosMg.map((o) => o.sigla);
    expect(siglas).toContain("SEMAD-MG");
    expect(siglas).toContain("FEAM");
    expect(siglas).toContain("IEF");
    expect(siglas).toContain("IGAM");
    expect(siglas).toContain("COPASA");
    expect(siglas).toContain("CEMIG");
  });

  test("todos os registros possuem campos textuais, sistemas e contatos oficiais válidos", () => {
    for (const inst of ECOSSISTEMA_NACIONAL) {
      expect(inst.sigla.trim().length).toBeGreaterThan(0);
      expect(inst.nomeCompleto.trim().length).toBeGreaterThan(0);
      expect(LISTA_CATEGORIAS).toContain(inst.categoria);
      expect(LISTA_ESFERAS).toContain(inst.esfera);
      expect(LISTA_REGIOES).toContain(inst.regiao);
      expect(inst.papelPrincipal.trim().length).toBeGreaterThan(15);
      expect(inst.sistemasInformatizados.length).toBeGreaterThanOrEqual(1);

      expect(inst.contatos.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(inst.contatos.telefone.trim().length).toBeGreaterThan(5);
      expect(inst.contatos.endereco.trim().length).toBeGreaterThan(10);
      expect(inst.contatos.portalUrl).toMatch(/^https?:\/\//);
      expect(inst.contatos.ouvidoriaUrl).toMatch(/^https?:\/\//);
    }
  });

  test("nenhum CPF real foi incluído no acervo (regra AGENTS.md §5.2)", () => {
    const textoCompleto = JSON.stringify(ECOSSISTEMA_NACIONAL);
    const sequenciasDe11Digitos = textoCompleto.match(/\b\d{11}\b/g) || [];
    for (const seq of sequenciasDe11Digitos) {
      expect(cpfValido(seq)).toBe(false);
    }
  });

  test("consulta por ID encontra a instituição correta", () => {
    const ibama = obterInstituicaoPorId("ibama");
    expect(ibama).toBeDefined();
    expect(ibama?.sigla).toBe("IBAMA");
    expect(ibama?.categoria).toBe("Autarquia Federal");
    expect(ibama?.sistemasInformatizados).toContain("Sisnama");

    const inexistente = obterInstituicaoPorId("id-que-nao-existe");
    expect(inexistente).toBeUndefined();
  });

  test("filtra por macrorregião com precisão", () => {
    const norte = obterInstituicoesPorRegiao("Norte");
    expect(norte.length).toBeGreaterThan(5);
    for (const item of norte) {
      expect(item.regiao).toBe("Norte");
    }

    const nordeste = obterInstituicoesPorRegiao("Nordeste");
    expect(nordeste.length).toBeGreaterThan(8);
  });

  test("filtra por esfera governamental", () => {
    const estaduais = obterInstituicoesPorEsfera("Estadual");
    expect(estaduais.length).toBeGreaterThanOrEqual(30);

    const federais = obterInstituicoesPorEsfera("Federal");
    expect(federais.length).toBeGreaterThanOrEqual(10);

    const mistas = obterInstituicoesPorEsfera("Concessão / Mista");
    expect(mistas.length).toBeGreaterThanOrEqual(20);
  });

  test("busca textual e filtros combinados em filtrarInstituicoes", () => {
    const resultadoBusca = filtrarInstituicoes({ termo: "barragens" });
    expect(resultadoBusca.length).toBeGreaterThan(0);

    const resultadoCemig = filtrarInstituicoes({ termo: "Cemig" });
    expect(resultadoCemig.length).toBe(1);
    expect(resultadoCemig[0].sigla).toBe("CEMIG");

    const resultadoCombinado = filtrarInstituicoes({
      categoria: "Concessionária de Água e Saneamento",
      regiao: "Sudeste",
    });
    expect(resultadoCombinado.length).toBeGreaterThanOrEqual(3);
    for (const r of resultadoCombinado) {
      expect(r.categoria).toBe("Concessionária de Água e Saneamento");
      expect(r.regiao).toBe("Sudeste");
    }
  });

  test("agrega estatísticas gerais com coerência matemática", () => {
    const stats = obterEstatisticasEcossistema();

    expect(stats.totalGeral).toBe(73);
    expect(stats.totalUfsAtendidas).toBe(27);
    expect(stats.totalSistemasMapeados).toBeGreaterThan(150);

    const somaCategorias = Object.values(stats.porCategoria).reduce(
      (a, b) => a + b,
      0
    );
    expect(somaCategorias).toBe(stats.totalGeral);

    const somaRegioes = Object.values(stats.porRegiao).reduce(
      (a, b) => a + b,
      0
    );
    expect(somaRegioes).toBe(stats.totalGeral);

    const somaEsferas = Object.values(stats.porEsfera).reduce(
      (a, b) => a + b,
      0
    );
    expect(somaEsferas).toBe(stats.totalGeral);
  });

  test("exportação CSV contém cabeçalho correto, delimitador ';' e BOM UTF-8", () => {
    const csv = exportarEcossistemaParaCsv(ECOSSISTEMA_NACIONAL);
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const linhas = csv.split("\r\n").filter((l) => l.trim().length > 0);
    expect(linhas.length).toBe(ECOSSISTEMA_NACIONAL.length + 1); // 1 cabeçalho + 72 linhas

    const cabecalho = linhas[0];
    expect(cabecalho).toContain('"Sigla";"Nome Completo";"Categoria"');
    expect(cabecalho).toContain('"Ouvidoria / Transparência"');

    // Primeira linha de dados
    const primeiraLinha = linhas[1];
    expect(primeiraLinha).toContain("IMAC");
    expect(primeiraLinha).toContain("Acre");
  });
});
