/**
 * @file apps/web/lib/empresas/dados-executivos.test.ts
 * @description Suíte de testes unitários do módulo de governança corporativa e executivos.
 *
 * Validações implementadas:
 * 1. Integridade do carregamento e expansão da tabela compacta.
 * 2. Cobertura estrita das 36 empresas e fundos estratégicos mandatários.
 * 3. Validação dos tipos de órgãos e canonicidade HTTPS de todas as fontes regulatórias.
 * 4. Validação de filtros por empresa e detecção de interlocking directorates.
 * 5. Consistência dos agregados da constante COBERTURA_EXECUTIVOS.
 * 6. Guarda de conformidade LGPD: ausência total de CPFs ou documentos pessoais.
 */

import { describe, it, expect } from "vitest";
import {
  obterExecutivosConselhos,
  obterExecutivosPorEmpresa,
  obterDiretoriasEntrelacadas,
  obterExecutivoPorId,
  COBERTURA_EXECUTIVOS,
  ROTULOS_ORGAOS,
  type TipoOrgao,
} from "./dados-executivos";

describe("dados-executivos (Governança Corporativa e Conselhos)", () => {
  const EMPRESAS_ESPERADAS = [
    "vale",
    "petrobras",
    "samarco",
    "bhp",
    "rio-tinto",
    "anglo-american",
    "kinross",
    "lundin",
    "sigma-lithium",
    "belo-sun",
    "ero-copper",
    "equinox",
    "glencore",
    "trafigura",
    "enel",
    "neoenergia-iberdrola",
    "edp",
    "galp",
    "tim",
    "santander",
    "arcelormittal",
    "norsk-hydro",
    "aperam",
    "thyssenkrupp",
    "basf",
    "bayer",
    "totalenergies",
    "shell",
    "braskem",
    "jbs",
    "cargill",
    "bunge",
    "adm",
    "blackrock",
    "vanguard",
    "state-street",
  ];

  it("deve carregar a lista completa de executivos e conselhos", () => {
    const lista = obterExecutivosConselhos();
    expect(lista).toBeDefined();
    expect(lista.length).toBe(COBERTURA_EXECUTIVOS.totalRegistros);
    expect(lista.length).toBeGreaterThanOrEqual(140);
  });

  it("deve cobrir todas as 36 empresas mandatárias do portal", () => {
    const lista = obterExecutivosConselhos();
    const empresasPresentes = new Set(lista.map((item) => item.empresaId.toLowerCase()));

    for (const emp of EMPRESAS_ESPERADAS) {
      expect(
        empresasPresentes.has(emp),
        `A empresa esperada '${emp}' deve estar presente no mapeamento de governança`
      ).toBe(true);
    }
  });

  it("deve garantir campos obrigatórios e URLs canônicas oficiais HTTPS em todos os registros", () => {
    const lista = obterExecutivosConselhos();
    const orgaosValidos: TipoOrgao[] = [
      "diretoria_executiva",
      "conselho_administracao",
      "comite_auditoria",
    ];

    for (const item of lista) {
      expect(item.id).toBeTruthy();
      expect(item.nomePessoa).toBeTruthy();
      expect(item.cargoFuncao).toBeTruthy();
      expect(item.empresaId).toBeTruthy();
      expect(item.empresaNome).toBeTruthy();
      expect(orgaosValidos).toContain(item.tipoOrgao);
      expect(item.dataPosse).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.dataTerminoMandato).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(item.fonteOficialNome).toBeTruthy();
      expect(item.urlFonteOficial.startsWith("https://")).toBe(true);
      expect(Array.isArray(item.interlockingIds)).toBe(true);
    }
  });

  it("deve filtrar corretamente por empresa através de obterExecutivosPorEmpresa", () => {
    const vale = obterExecutivosPorEmpresa("vale");
    expect(vale.length).toBeGreaterThanOrEqual(4);
    for (const item of vale) {
      expect(item.empresaId).toBe("vale");
      expect(item.empresaNome).toContain("Vale");
    }

    // Deve ser tolerante a maiúsculas/minúsculas
    const petrobrasMaiuscula = obterExecutivosPorEmpresa("PETROBRAS");
    expect(petrobrasMaiuscula.length).toBeGreaterThanOrEqual(4);

    // Deve retornar array vazio para empresa não catalogada
    const inexistente = obterExecutivosPorEmpresa("empresa-inexistente-xyz");
    expect(inexistente).toEqual([]);
  });

  it("deve mapear e retornar os interlocking directorates identificados", () => {
    const entrelaçados = obterDiretoriasEntrelacadas();
    expect(entrelaçados.length).toBe(COBERTURA_EXECUTIVOS.totalInterlocking);
    expect(entrelaçados.length).toBeGreaterThan(0);

    for (const item of entrelaçados) {
      expect(item.interlockingIds.length).toBeGreaterThan(0);
    }

    // Valida interlocking específicos conhecidos
    const nomesEntrelaçados = entrelaçados.map((i) => i.nomePessoa);
    expect(nomesEntrelaçados).toContain("Gustavo Pimenta"); // Vale <-> Samarco
    expect(nomesEntrelaçados).toContain("Rodrigo Vilela"); // Samarco <-> Vale/BHP
    expect(nomesEntrelaçados).toContain("Lakshmi N. Mittal"); // ArcelorMittal <-> Aperam
    expect(nomesEntrelaçados).toContain("Gesner José de Oliveira Filho"); // TIM <-> Braskem
  });

  it("deve localizar registro específico por id através de obterExecutivoPorId", () => {
    const exec = obterExecutivoPorId("exec-vale-gustavo-pimenta");
    expect(exec).toBeDefined();
    expect(exec?.nomePessoa).toBe("Gustavo Pimenta");
    expect(exec?.cargoFuncao).toContain("CEO");
    expect(exec?.empresaId).toBe("vale");

    const inexistente = obterExecutivoPorId("id-que-nao-existe");
    expect(inexistente).toBeUndefined();
  });

  it("deve garantir exatidão nos agregados da constante COBERTURA_EXECUTIVOS", () => {
    const lista = obterExecutivosConselhos();
    const empresasUnicas = new Set(lista.map((i) => i.empresaId));
    const pessoasUnicas = new Set(lista.map((i) => i.nomePessoa));
    const interlocking = lista.filter((i) => i.interlockingIds.length > 0);

    const diretorias = lista.filter((i) => i.tipoOrgao === "diretoria_executiva").length;
    const conselhos = lista.filter((i) => i.tipoOrgao === "conselho_administracao").length;
    const auditorias = lista.filter((i) => i.tipoOrgao === "comite_auditoria").length;

    expect(COBERTURA_EXECUTIVOS.totalRegistros).toBe(lista.length);
    expect(COBERTURA_EXECUTIVOS.totalEmpresas).toBe(empresasUnicas.size);
    expect(COBERTURA_EXECUTIVOS.totalPessoas).toBe(pessoasUnicas.size);
    expect(COBERTURA_EXECUTIVOS.totalInterlocking).toBe(interlocking.length);
    expect(COBERTURA_EXECUTIVOS.orgaosDistribuicao.diretoriaExecutiva).toBe(diretorias);
    expect(COBERTURA_EXECUTIVOS.orgaosDistribuicao.conselhoAdministracao).toBe(conselhos);
    expect(COBERTURA_EXECUTIVOS.orgaosDistribuicao.comiteAuditoria).toBe(auditorias);
  });

  it("deve fornecer rótulos amigáveis para todos os tipos de órgãos", () => {
    expect(ROTULOS_ORGAOS.diretoria_executiva).toBe("Diretoria Executiva");
    expect(ROTULOS_ORGAOS.conselho_administracao).toBe("Conselho de Administração");
    expect(ROTULOS_ORGAOS.comite_auditoria).toBe("Comitê de Auditoria & Riscos");
  });

  it("guarda de conformidade LGPD: ZERO CPFs ou dados pessoais no dataset", () => {
    const lista = obterExecutivosConselhos();
    // Regex de padrão CPF (com ou sem pontuação)
    const regexCpf = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;

    for (const item of lista) {
      const textoCompleto = `${item.id} ${item.nomePessoa} ${item.cargoFuncao} ${item.empresaNome} ${item.remuneracaoDeclaradaAno}`;
      expect(
        regexCpf.test(textoCompleto),
        `Nenhum padrão de CPF deve existir no registro de ${item.nomePessoa}`
      ).toBe(false);
    }
  });
});
