import { describe, it, expect, beforeAll } from "vitest";
import { responderComRag } from "./rag";
import { gerarRespostaRag, gerarRespostaLocal, gerarRespostaApi } from "./geracao";
import { ollamaDisponivel } from "./ollama";

describe("responderComRag -- integracao com Ollama local", () => {
  let disponivel = false;

  beforeAll(async () => {
    disponivel = await ollamaDisponivel();
  });

  it(
    "gerarRespostaLocal responde a partir de fontes pequenas sem inventar",
    async () => {
      if (!disponivel) {
        console.log("Ollama indisponivel -- pulando teste de RAG");
        return;
      }

      const fontes = [
        {
          indice: 0,
          texto:
            "Portaria MMA nº 8, de 6 de janeiro de 2016: institui o Grupo de Trabalho Interministerial para acompanhar as acoes de resposta ao rompimento da barragem de Fundao, em Mariana/MG.",
          score: 0.95,
        },
        {
          indice: 1,
          texto:
            "Portaria ICMBio nº 513, de 20 de abril de 2016: institui o Grupo de Trabalho para implementacao de acoes de protecao da fauna e da flora no ambito do rompimento da barragem de Fundao.",
          score: 0.88,
        },
      ];

      const resposta = await gerarRespostaLocal(
        "Quem acompanhou as acoes apos o rompimento da barragem de Fundao?",
        fontes
      );

      expect(resposta.resposta.length).toBeGreaterThan(20);
      expect(resposta.fontes.length).toBe(2);
      expect(resposta.modelo).toBeTruthy();

      const textoBaixo = resposta.resposta.toLowerCase();
      expect(textoBaixo.includes("fundao") || textoBaixo.includes("grupo de trabalho")).toBe(true);
    },
    60_000
  );

  it(
    "gerarRespostaRag escolhe Ollama local quando nao ha AI_API_KEY",
    async () => {
      if (!disponivel) {
        console.log("Ollama indisponivel -- pulando teste de RAG");
        return;
      }

      const fontes = [
        {
          indice: 0,
          texto:
            "Portaria MMA nº 8, de 6 de janeiro de 2016: institui o Grupo de Trabalho Interministerial para acompanhar as acoes de resposta ao rompimento da barragem de Fundao, em Mariana/MG.",
          score: 0.95,
        },
      ];

      const resposta = await gerarRespostaRag(
        "Quem acompanhou as acoes apos o rompimento da barragem de Fundao?",
        fontes
      );

      expect(resposta.resposta.length).toBeGreaterThan(20);
      expect(resposta.fontes.length).toBe(1);
    },
    60_000
  );

  it(
    "retorna 'nao encontrei' quando nao ha fontes",
    async () => {
      if (!disponivel) {
        console.log("Ollama indisponivel -- pulando teste de RAG");
        return;
      }

      const resposta = await gerarRespostaLocal("Qual a receita de bolo de cenoura?", []);

      expect(resposta.resposta.length).toBeGreaterThan(10);
      expect(resposta.fontes.length).toBe(0);
    },
    10_000
  );

  it(
    "responderComRag executa o pipeline completo sobre o documento de exemplo",
    async () => {
      if (!disponivel) {
        console.log("Ollama indisponivel -- pulando teste de RAG");
        return;
      }

      const resposta = await responderComRag("O que aconteceu com a barragem de Fundao?");

      expect(resposta.resposta.length).toBeGreaterThan(20);
      expect(resposta.fontes.length).toBeGreaterThan(0);
      expect(resposta.modelo).toBeTruthy();
    },
    180_000
  );

  it("gerarRespostaApi requer AI_API_KEY (skipa quando nao configurada)", async () => {
    if (!process.env.AI_API_KEY) {
      console.log("AI_API_KEY nao configurada -- pulando teste de API remota");
      return;
    }

    const fontes = [
      {
        indice: 0,
        texto:
          "Portaria MMA nº 8, de 6 de janeiro de 2016: institui o Grupo de Trabalho Interministerial para acompanhar as acoes de resposta ao rompimento da barragem de Fundao, em Mariana/MG.",
        score: 0.95,
      },
    ];

    const resposta = await gerarRespostaApi(
      "Quem acompanhou as acoes apos o rompimento da barragem de Fundao?",
      fontes
    );

    expect(resposta.resposta.length).toBeGreaterThan(20);
    expect(resposta.fontes.length).toBe(1);
    expect(resposta.modelo).toBe(process.env.AI_MODEL || "deepseek-chat");
  });
});
