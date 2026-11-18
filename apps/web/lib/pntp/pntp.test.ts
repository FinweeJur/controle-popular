/**
 * @file apps/web/lib/pntp/pntp.test.ts
 * @description Guarda do acervo do PNTP/Atricon no portal — o índice de
 * transparência dos entes de Minas Gerais, ciclo a ciclo.
 *
 * O que este teste protege, e por quê:
 * - **contrato do JSON**: os campos que a página de município vai ler existem,
 *   o índice é número de 0 a 100 e o nível é um dos que a fonte publica;
 * - **número errado é dano**: ente não avaliado não pode aparecer com ITP zero
 *   (foi decisão do coletor gravar `null`), e a média nacional tem de bater
 *   com a que o próprio PNTP publica para o ciclo 2025 (66,6%);
 * - **privacidade** (regras 5.2 e 5.8): a planilha da Atricon traz nome e
 *   e-mail do servidor responsável pelo preenchimento. Nada disso pode chegar
 *   ao repositório público — nem e-mail solto, nem CPF, nem campo de
 *   responsável;
 * - **payload** (regra 5.1): o acervo tem 5.286 entes e vai inteiro para o
 *   build; acima de 2 MB o custo deixa de se pagar.
 *
 * Fonte: https://pntp.atricon.org.br/dados-abertos/ — coletor em
 * `scripts/coletar-pntp.py`, decisões em `docs/06-fontes/PNTP-ATRICON.md`.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/** Uma linha publicada por ente público de MG em um ciclo do PNTP. */
type EntePntp = {
  ano: number;
  orgao: string;
  poder: string;
  esfera: string;
  estado: string;
  municipio: string;
  itp: number | null;
  pctEssenciais: number | null;
  nivel: string;
  validada: boolean | null;
  certificavel: boolean | null;
  fonte: string;
  coletadoEm: string;
};

/** Recorte agregado de um ciclo no resumo nacional. */
type GrupoResumo = {
  entes: number;
  avaliados: number;
  itpMedio: number | null;
};

type AnoResumo = GrupoResumo & {
  ano: number;
  naoAvaliados: number;
  porEsfera: Array<GrupoResumo & { esfera: string }>;
  porPoder: Array<GrupoResumo & { poder: string }>;
};

const DIR_DADOS = path.join(process.cwd(), "data", "pntp");
const CAMINHO_MG = path.join(DIR_DADOS, "avaliacoes-mg.json");
const CAMINHO_RESUMO = path.join(DIR_DADOS, "resumo-brasil.json");

const TEXTO_MG = fs.readFileSync(CAMINHO_MG, "utf-8");
const TEXTO_RESUMO = fs.readFileSync(CAMINHO_RESUMO, "utf-8");

const ACERVO = JSON.parse(TEXTO_MG) as {
  fonteUrl: string;
  coletadoEm: string;
  total: number;
  entes: EntePntp[];
};
const RESUMO = JSON.parse(TEXTO_RESUMO) as {
  fonteUrl: string;
  coletadoEm: string;
  anos: AnoResumo[];
};

const ANOS = [2022, 2023, 2024, 2025];

// Níveis que a fonte usa em algum dos quatro ciclos. `Intermediário*` é de
// 2022 e cobre a banda 0,75–0,99 (ver decisão 5 do coletor): o asterisco é
// literal, não digitação nossa.
const NIVEIS = new Set([
  "Diamante",
  "Ouro",
  "Prata",
  "Elevado",
  "Intermediário",
  "Intermediário*",
  "Básico",
  "Inicial",
  "Inexistente",
  "Não Avaliado",
]);

const CAMPOS_OBRIGATORIOS: Array<keyof EntePntp> = [
  "ano",
  "orgao",
  "poder",
  "esfera",
  "estado",
  "municipio",
  "itp",
  "pctEssenciais",
  "nivel",
  "validada",
  "certificavel",
  "fonte",
  "coletadoEm",
];

// Campos da planilha da Atricon que identificam pessoa — nunca publicados.
const CAMPOS_PROIBIDOS = [
  "nomeResponsavel",
  "emailResponsavel",
  "preenchidoPor",
  "Nome Responsável",
  "E-mail Responsável",
  "Preenchido por",
];

const RE_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const RE_ONZE_DIGITOS = /\b[0-9]{11}\b/g;

/**
 * Dígito verificador do CPF por mod-11 — a mesma régua do
 * `lib/sem-cpf-no-repo.test.ts`. Procurar só 11 dígitos daria falso positivo
 * em código e protocolo; a conta é o que separa CPF de número qualquer.
 */
function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11 || new Set(digitos).size === 1) return false;
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i += 1) soma += Number(digitos[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

/** Sequências de 11 dígitos no texto que passam no mod-11. */
function cpfsNoTexto(texto: string): string[] {
  return (texto.match(RE_ONZE_DIGITOS) ?? []).filter(cpfValido);
}

const POR_ANO = new Map(ANOS.map((ano) => [ano, ACERVO.entes.filter((e) => e.ano === ano)]));

describe("PNTP/Atricon — acervo de Minas Gerais", () => {
  it("o arquivo fica abaixo do teto de 2 MB do payload", () => {
    expect(Buffer.byteLength(TEXTO_MG, "utf-8")).toBeLessThan(2 * 1024 * 1024);
  });

  it("declara a procedência e o carimbo da coleta", () => {
    expect(ACERVO.fonteUrl).toBe("https://pntp.atricon.org.br/dados-abertos/");
    expect(ACERVO.coletadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it("o total declarado é o número de linhas do arquivo", () => {
    expect(ACERVO.total).toBe(ACERVO.entes.length);
    expect(ACERVO.entes.length).toBeGreaterThan(5_000);
  });

  it("cada ente traz todos os campos obrigatórios", () => {
    for (const ente of ACERVO.entes) {
      for (const campo of CAMPOS_OBRIGATORIOS) {
        expect(ente, `${ente.ano} ${ente.orgao} sem ${campo}`).toHaveProperty(campo);
      }
      expect(ente.orgao.trim().length, `órgão vazio em ${ente.ano}`).toBeGreaterThan(0);
      expect(ente.municipio.trim().length, `${ente.orgao} sem município`).toBeGreaterThan(0);
      expect(ente.estado).toBe("MG");
      expect(["Municipal", "Estadual"]).toContain(ente.esfera);
      expect(NIVEIS.has(ente.nivel), `nível inesperado: ${ente.nivel}`).toBe(true);
      expect(ente.fonte).toBe(
        `https://cdn.atricon.org.br/2026/08/dados_pntp_${ente.ano}.zip`
      );
      // Carimbo por linha: uma coleta parcial (`--ano 2025`) atualiza só o
      // ciclo remedido, e as linhas herdadas guardam a data em que foram lidas.
      expect(ente.coletadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    }
  });

  it("o índice fica entre 0 e 100 — e é nulo só quando o ente não foi avaliado", () => {
    for (const ente of ACERVO.entes) {
      if (ente.nivel === "Não Avaliado") {
        // A planilha da fonte grava 0 para quem não entregou o formulário;
        // publicar esse 0 seria dizer "transparência zero" de quem só não
        // participou. O coletor grava null (decisão 4).
        expect(ente.itp, `${ente.orgao} (${ente.ano})`).toBeNull();
        expect(ente.pctEssenciais, `${ente.orgao} (${ente.ano})`).toBeNull();
        continue;
      }
      expect(ente.itp, `${ente.orgao} (${ente.ano})`).not.toBeNull();
      expect(ente.itp!).toBeGreaterThanOrEqual(0);
      expect(ente.itp!).toBeLessThanOrEqual(100);
      if (ente.pctEssenciais !== null) {
        expect(ente.pctEssenciais).toBeGreaterThanOrEqual(0);
        expect(ente.pctEssenciais).toBeLessThanOrEqual(100);
      }
    }
  });

  it("as marcas de avaliação são booleano ou nulo, nunca texto", () => {
    for (const ente of ACERVO.entes) {
      for (const marca of [ente.validada, ente.certificavel]) {
        expect(marca === null || typeof marca === "boolean").toBe(true);
      }
    }
  });

  it("MG aparece em todos os quatro ciclos", () => {
    for (const ano of ANOS) {
      const doAno = POR_ANO.get(ano)!;
      expect(doAno.length, `sem entes de MG em ${ano}`).toBeGreaterThanOrEqual(100);
    }
    // 2022 teve escopo menor (150 entes); de 2023 a 2025 a base repete 1.712.
    expect(POR_ANO.get(2022)!.length).toBe(150);
    for (const ano of [2023, 2024, 2025]) {
      expect(POR_ANO.get(ano)!.length).toBe(1_712);
    }
  });

  it("os entes estaduais de MG estão em todos os ciclos", () => {
    for (const ano of ANOS) {
      const estaduais = POR_ANO.get(ano)!.filter((e) => e.esfera === "Estadual");
      // Governo, Assembleia, TJ, TCE, MP e Defensoria.
      expect(estaduais.length, `estaduais em ${ano}`).toBe(6);
    }
  });

  it("a chave publicada — ano + orgao — não se repete", () => {
    const vistas = new Set<string>();
    for (const ente of ACERVO.entes) {
      const chave = `${ente.ano}|${ente.orgao}`;
      expect(vistas.has(chave), `duplicata: ${chave}`).toBe(false);
      vistas.add(chave);
    }
  });

  it("não publica nome, e-mail nem CPF de responsável", () => {
    for (const campo of CAMPOS_PROIBIDOS) {
      expect(TEXTO_MG, `campo proibido presente: ${campo}`).not.toContain(campo);
    }
    expect(TEXTO_MG).not.toMatch(RE_EMAIL);
    expect(cpfsNoTexto(TEXTO_MG)).toEqual([]);
  });
});

describe("PNTP/Atricon — resumo nacional", () => {
  it("traz os quatro ciclos, sem nenhuma linha de ente", () => {
    expect(RESUMO.anos.map((a) => a.ano)).toEqual(ANOS);
    // Agregado é agregado: nome de órgão e município não moram aqui.
    expect(TEXTO_RESUMO).not.toContain("orgao");
    expect(TEXTO_RESUMO).not.toContain("municipio");
    expect(TEXTO_RESUMO).not.toMatch(RE_EMAIL);
    expect(cpfsNoTexto(TEXTO_RESUMO)).toEqual([]);
  });

  it("avaliados + não avaliados fecham com o total do ciclo", () => {
    for (const ano of RESUMO.anos) {
      expect(ano.avaliados + ano.naoAvaliados, `contagem de ${ano.ano}`).toBe(ano.entes);
      expect(ano.entes).toBeGreaterThan(5_000);
    }
  });

  it("a média por esfera e por poder fecha com o total de entes", () => {
    for (const ano of RESUMO.anos) {
      const somaEsferas = ano.porEsfera.reduce((s, g) => s + g.entes, 0);
      const somaPoderes = ano.porPoder.reduce((s, g) => s + g.entes, 0);
      expect(somaEsferas, `esferas de ${ano.ano}`).toBe(ano.entes);
      expect(somaPoderes, `poderes de ${ano.ano}`).toBe(ano.entes);
      for (const grupo of [...ano.porEsfera, ...ano.porPoder]) {
        expect(grupo.avaliados).toBeLessThanOrEqual(grupo.entes);
        if (grupo.itpMedio !== null) {
          expect(grupo.itpMedio).toBeGreaterThanOrEqual(0);
          expect(grupo.itpMedio).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("reproduz a média que o PNTP publica para 2025 (66,6%)", () => {
    const de2025 = RESUMO.anos.find((a) => a.ano === 2025)!;
    expect(de2025.itpMedio).not.toBeNull();
    expect(de2025.itpMedio!).toBeCloseTo(66.6, 1);
    expect(de2025.naoAvaliados).toBe(1_625);
  });
});
