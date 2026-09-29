/**
 * @file apps/web/lib/laboratorio/caderno-notebooklm.test.ts
 * @description Testes unitarios do modulo de caderno aberto NotebookLM do Seu Nono.
 */

import { describe, it, expect } from "vitest";
import {
  converterCamadasParaAcervo,
  gerarDossieNotebookLmAberto,
  sugerirPerguntasCaderno,
  type CamadaLabResumo,
} from "./caderno-notebooklm";

const CAMADAS_EXEMPLO: CamadaLabResumo[] = [
  {
    id: "sigbm-barragens",
    nome: "Barragens de Mineração (SIGBM)",
    categoria: "Ambiental",
    totalLinhas: 948,
    valorTotal: "54.839.200 m³ de rejeito",
    fonteOficial: "Agência Nacional de Mineração (ANM/SIGBM)",
    urlOficial: "https://app.anm.gov.br/SIGBM/Publico/GerenciarDanos",
    descricao: "Barragens de contenção de rejeitos e sedimentos de mineração em todo o país.",
  },
  {
    id: "licencas-unificadas",
    nome: "Licenças Ambientais Integradas",
    categoria: "Ambiental",
    totalLinhas: 12500,
    fonteOficial: "IBAMA e Órgãos Estaduais",
    urlOficial: "https://dados.gov.br/dados/conjuntos-dados/licenciamento-ambiental-federal",
    descricao: "Atos de licenciamento prévio, de instalação e de operação concedidos.",
  },
];

describe("caderno-notebooklm (Open Source NotebookLM do Seu Nonô)", () => {
  it("converte camadas em itens AcervoFonte válidos para o Seu Nonô", () => {
    const acervo = converterCamadasParaAcervo(CAMADAS_EXEMPLO);
    expect(acervo).toHaveLength(2);

    const barragens = acervo[0];
    expect(barragens.id).toBe("lab-sigbm-barragens");
    expect(barragens.frente).toBe("laboratorio");
    expect(barragens.titulo).toContain("Barragens");
    expect(barragens.fonteUrl).toBe("https://app.anm.gov.br/SIGBM/Publico/GerenciarDanos");
    expect(barragens.texto).toContain("ANM/SIGBM");
    expect(barragens.links).toHaveLength(2);
    expect(barragens.links?.[1].href).toBe("https://app.anm.gov.br/SIGBM/Publico/GerenciarDanos");
  });

  it("gera dossiê Markdown aberto no padrão das 6 qualidades", () => {
    const md = gerarDossieNotebookLmAberto(CAMADAS_EXEMPLO, {
      titulo: "Dossiê Socioambiental MG",
    });

    expect(md).toContain("title: \"Dossiê Socioambiental MG\"");
    expect(md).toContain("format: markdown-notebooklm-aberto");
    expect(md).toContain("### [1] Barragens de Mineração (SIGBM)");
    expect(md).toContain("[Agência Nacional de Mineração (ANM/SIGBM)](https://app.anm.gov.br/SIGBM/Publico/GerenciarDanos)");
    expect(md).toContain("Perguntas Cívicas para o Assistente Seu Nonô");
    expect(md).toContain("54.839.200 m³ de rejeito");
  });

  it("sugere perguntas pertinentes ao cruzamento entre barragens e licenças", () => {
    const perguntas = sugerirPerguntasCaderno(CAMADAS_EXEMPLO);
    expect(perguntas.length).toBeGreaterThanOrEqual(2);
    const textoPerguntas = perguntas.map((p) => p.pergunta).join(" ");
    expect(textoPerguntas).toMatch(/barragens/i);
    expect(textoPerguntas).toMatch(/licenças/i);
  });

  it("sanitiza qualquer tentativa de vazamento de dados pessoais", () => {
    // Usamos o CPF canônico de teste 123.456.789-09 que passa no mod-11
    const camadaComCpf: CamadaLabResumo = {
      id: "teste-cpf",
      nome: "Fiscalização 123.456.789-09",
      categoria: "Teste",
      fonteOficial: "Teste Público",
      urlOficial: "https://exemplo.gov.br",
      descricao: "Servidor responsável 12345678909 em fiscalização",
    };

    const acervo = converterCamadasParaAcervo([camadaComCpf]);
    expect(acervo[0].texto).not.toContain("123.456.789-09");
    expect(acervo[0].texto).not.toContain("12345678909");
    expect(acervo[0].texto).toContain("[CPF-PROTEGIDO]");

    const md = gerarDossieNotebookLmAberto([camadaComCpf]);
    expect(md).not.toContain("123.456.789-09");
    expect(md).not.toContain("12345678909");
  });
});
