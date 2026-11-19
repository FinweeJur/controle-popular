import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

/**
 * Contrato das duas fontes externas provadas em 18/11/2026: diários
 * municipais (Querido Diário) e enriquecimento de CNPJ (Brasil API).
 *
 * POR QUE ESTE TESTE EXISTE
 *
 * O JSON que sai de `scripts/coletar-querido-diario.py` e de
 * `scripts/enriquecer-cnpj.py` é versionado em repositório PÚBLICO. Duas coisas
 * ali são dano, não bug de tela:
 *
 * 1. **dado pessoal** — diário oficial é texto com nome de gente. O coletor
 *    corta o trecho em 200 caracteres e troca sequência de 10+ dígitos por
 *    `[numero]`; este teste garante que CPF não passou. CPF é validado por
 *    mod-11 quando aparece 11 dígitos, porque sequência que não fecha o dígito
 *    verificador não é CPF (código, protocolo, matrícula).
 * 2. **procedência** — linha sem `fonte` e `coletadoEm` vira número sem dono.
 *    Quem audita precisa saber de onde veio e quando foi medido.
 *
 * O que NÃO é testado aqui: se o número está "certo". Contagem de menção a
 * termo é heurística declarada no cabeçalho do coletor; o teste trava forma,
 * rastro e ausência de pessoa física — não substitui leitura humana.
 *
 * Fonte oficial das duas APIs:
 * - https://docs.queridodiario.ok.org.br/pt-br/latest/utilizando/api-publica.html
 * - https://brasilapi.com.br/docs
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ATOS = path.join(RAIZ, "data", "querido-diario", "atos.json");
const FORNECEDORES = path.join(RAIZ, "data", "fornecedores", "enriquecido.json");

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const INSTANTE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

/** CPF de verdade: 11 dígitos que fecham o mod-11. Repetido não conta. */
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
 * Todo trecho de 11 dígitos isolado — inclusive o que NÃO passa no mod-11.
 * O critério do arquivo é o mais duro: 11 dígitos ali já é sinal de que o
 * coletor deixou passar número que não interessa ao portal.
 */
function onzeDigitos(texto: string): string[] {
  return [...texto.matchAll(/(?<![\d.])\d{11}(?![\d])/g)].map((m) => m[0]);
}

function lerJson<T>(caminho: string): T {
  return JSON.parse(readFileSync(caminho, "utf-8")) as T;
}

describe("atos.json — diários municipais do Querido Diário", () => {
  const bruto = readFileSync(ATOS, "utf-8");
  const arquivo = lerJson<{
    fonte: { nome: string; api: string; documentacao: string; licencaDados: string; aviso: string };
    coletadoEm: string;
    janela: { de: string; ate: string };
    termos: string[];
    radicais: Record<string, string>;
    metodo: Record<string, string>;
    cidades: Array<{
      ibge: string;
      nome: string;
      uf: string;
      diariosNoPeriodo: number;
      diariosContados: number;
      porTipo: Record<string, { diarios: number; ocorrencias: number }>;
      atos: Array<Record<string, unknown>>;
      erros: string[];
    }>;
    semCobertura: Array<{ ibge: string; nome: string; motivo: string }>;
  }>(ATOS);

  test("topo declara a fonte, o método e a janela", () => {
    expect(arquivo.fonte.nome).toContain("Querido Diário");
    expect(arquivo.fonte.api).toMatch(/^https:\/\/api\.queridodiario\./);
    expect(arquivo.fonte.documentacao).toMatch(/^https:\/\//);
    expect(arquivo.fonte.licencaDados).toMatch(/CC-BY/);
    expect(arquivo.coletadoEm).toMatch(INSTANTE_ISO);
    expect(arquivo.janela.de).toMatch(DATA_ISO);
    expect(arquivo.janela.ate).toMatch(DATA_ISO);
    expect(Object.keys(arquivo.radicais).sort()).toEqual([...arquivo.termos].sort());
    // A contagem tem de estar declarada como radical no texto, não como busca.
    expect(arquivo.metodo.contagem).toMatch(/radical/i);
  });

  test("cada cidade tem IBGE de 7 dígitos e contagem coerente com as linhas", () => {
    expect(arquivo.cidades.length).toBeGreaterThanOrEqual(3);
    for (const c of arquivo.cidades) {
      expect(c.ibge).toMatch(/^\d{7}$/);
      expect(c.nome.length).toBeGreaterThan(0);
      expect(c.uf).toMatch(/^[A-Z]{2}$/);
      expect(c.diariosContados).toBeLessThanOrEqual(c.diariosNoPeriodo);
      expect(c.diariosContados).toBeGreaterThan(0);
      expect(Array.isArray(c.erros)).toBe(true);
      if (c.erros.length) {
        // Diário que falhou é resultado medido, não pode virar linha inventada.
        expect(c.diariosContados).toBeLessThanOrEqual(c.diariosNoPeriodo);
      }

      const linhas = c.atos as Array<{ tipo: string; ocorrencias: number }>;
      for (const chave of arquivo.termos) {
        const soma = linhas.filter((a) => a.tipo === chave).reduce((t, a) => t + a.ocorrencias, 0);
        expect(c.porTipo[chave].ocorrencias).toBe(soma);
        expect(c.porTipo[chave].diarios).toBe(linhas.filter((a) => a.tipo === chave).length);
      }
    }
  });

  test("toda linha de ato tem campos obrigatórios, fonte e coletadoEm", () => {
    let total = 0;
    for (const c of arquivo.cidades) {
      for (const a of c.atos) {
        total++;
        expect(arquivo.termos).toContain(a.tipo);
        expect(String(a.termo).length).toBeGreaterThan(0);
        expect(String(a.data)).toMatch(DATA_ISO);
        expect(String(a.edicao).length).toBeGreaterThan(0);
        expect(Number.isInteger(a.ocorrencias)).toBe(true);
        expect(Number(a.ocorrencias)).toBeGreaterThan(0);
        expect(String(a.link)).toMatch(/^https:\/\//);
        expect(String(a.fonte)).toContain("Querido Diário");
        expect(String(a.coletadoEm)).toMatch(INSTANTE_ISO);
        // Trecho é evidência, não o diário: curto e com o termo dentro.
        expect(String(a.trecho).length).toBeLessThanOrEqual(200);
        const radical = new RegExp(String(arquivo.radicais[String(a.tipo)]), "i");
        expect(String(a.trecho)).toMatch(radical);
      }
    }
    expect(total).toBeGreaterThan(0);
  });

  test("cidade sem cobertura é registrada como resultado, não some", () => {
    for (const s of arquivo.semCobertura) {
      expect(s.ibge).toMatch(/^\d{7}$/);
      expect(s.nome.length).toBeGreaterThan(0);
      expect(s.motivo.length).toBeGreaterThan(0);
      // Não pode estar nas duas listas ao mesmo tempo.
      expect(arquivo.cidades.some((c) => c.ibge === s.ibge)).toBe(false);
    }
  });

  test("nenhum CPF no arquivo", () => {
    const achados = onzeDigitos(bruto);
    expect(achados, `sequência de 11 dígitos: ${achados.join(", ")}`).toEqual([]);
    // CPF formatado também não pode aparecer.
    expect(bruto).not.toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
  });
});

describe("enriquecido.json — CNPJ pela Brasil API", () => {
  const bruto = readFileSync(FORNECEDORES, "utf-8");
  const arquivo = lerJson<{
    fonte: { nome: string; endpoint: string; documentacao: string; aviso: string };
    coletadoEm: string;
    amostra: number;
    consultados: number;
    falhas: number;
    fornecedores: Array<Record<string, unknown>>;
    naoVersionados: Array<{ cnpj: string; motivo: string }>;
  }>(FORNECEDORES);

  test("topo declara fonte, teto e a regra de não guardar sócio", () => {
    expect(arquivo.fonte.nome).toContain("Brasil API");
    expect(arquivo.fonte.endpoint).toMatch(/^https:\/\/brasilapi\.com\.br\/api\/cnpj\/v1/);
    expect(arquivo.fonte.documentacao).toMatch(/^https:\/\//);
    expect(arquivo.fonte.aviso).toMatch(/QSA|s[óo]cio/i);
    expect(arquivo.coletadoEm).toMatch(INSTANTE_ISO);
    expect(arquivo.amostra).toBe(arquivo.fornecedores.length);
    expect(arquivo.amostra).toBeLessThanOrEqual(20);
    expect(arquivo.amostra).toBeGreaterThan(0);
    expect(arquivo.consultados).toBeGreaterThanOrEqual(arquivo.amostra);
    expect(arquivo.falhas).toBe(arquivo.naoVersionados.length);
  });

  test("CNPJ tem 14 dígitos e fecha o módulo 11", () => {
    for (const f of arquivo.fornecedores) {
      const cnpj = String(f.cnpj);
      expect(cnpj).toMatch(/^\d{14}$/);
      const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const pesos2 = [6, ...pesos1];
      for (const [pesos, pos] of [
        [pesos1, 12],
        [pesos2, 13],
      ] as const) {
        const soma = pesos.reduce((t, p, i) => t + Number(cnpj[i]) * p, 0);
        const resto = soma % 11;
        expect(Number(cnpj[pos])).toBe(resto < 2 ? 0 : 11 - resto);
      }
    }
  });

  test("toda linha traz razão social, situação, CNAE, data, fonte e coletadoEm", () => {
    for (const f of arquivo.fornecedores) {
      expect(String(f.razaoSocial).length).toBeGreaterThan(0);
      expect(String(f.situacaoCadastral).length).toBeGreaterThan(0);
      const cnae = f.cnae as { codigo: string; descricao: string };
      expect(cnae.codigo).toMatch(/^\d{7}$/);
      expect(String(cnae.descricao).length).toBeGreaterThan(0);
      expect(String(f.dataInicioAtividade)).toMatch(DATA_ISO);
      expect(String(f.fonte)).toContain("Brasil API");
      expect(String(f.coletadoEm)).toMatch(INSTANTE_ISO);
      expect(String(f.origem)).toMatch(/^apps\/web\/data\//);
    }
  });

  test("nenhum campo de sócio, telefone, e-mail ou CPF", () => {
    const permitidos = new Set([
      "cnpj",
      "razaoSocial",
      "situacaoCadastral",
      "dataSituacao",
      "dataInicioAtividade",
      "cnae",
      "naturezaJuridica",
      "municipio",
      "uf",
      "origem",
      "consultaEm",
      "fonte",
      "coletadoEm",
    ]);
    for (const f of arquivo.fornecedores) {
      for (const chave of Object.keys(f)) {
        // Lista fechada: campo novo tem de passar por revisão, não entrar calado.
        expect(permitidos.has(chave), `campo inesperado: ${chave}`).toBe(true);
      }
      expect(Object.keys(f)).not.toContain("qsa");
    }
    expect(bruto).not.toMatch(/"(qsa|socios|ddd_telefone|email)"/i);
    expect(onzeDigitos(bruto), "sequência de 11 dígitos no enriquecido").toEqual([]);
  });

  test("pessoa física fica fora, com motivo declarado", () => {
    for (const n of arquivo.naoVersionados) {
      expect(String(n.cnpj)).toMatch(/^\d{14}$/);
      expect(n.motivo.length).toBeGreaterThan(0);
      // Quem não entrou não pode ter linha versionada.
      expect(arquivo.fornecedores.some((f) => f.cnpj === n.cnpj)).toBe(false);
    }
    // Nenhum CPF disfarçado de CNPJ: razão social não é CPF de sócio.
    for (const cpf of onzeDigitos(bruto)) {
      expect(cpfValido(cpf)).toBe(false);
    }
  });
});
