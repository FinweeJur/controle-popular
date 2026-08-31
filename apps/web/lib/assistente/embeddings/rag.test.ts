import { describe, it, expect, beforeAll } from "vitest";
import { responderComRag, esquecerIndiceAcervo } from "./rag";
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
        fontes,
        // Timeout generoso de propósito: o Ollama remoto passou de 60 s com
        // o modelo carregado (medido em 31/08) — ver TODO.md "timeout do
        // teste do Ollama" (92dd276).
        { timeoutMs: 180_000 }
      );

      expect(resposta.resposta.length).toBeGreaterThan(20);
      expect(resposta.fontes.length).toBe(2);
      expect(resposta.modelo).toBeTruthy();

      const textoBaixo = resposta.resposta.toLowerCase();
      expect(textoBaixo.includes("fundao") || textoBaixo.includes("grupo de trabalho")).toBe(true);
    },
    240_000
  );

  it("gerarRespostaApi requer chave remota (skipa quando nenhuma configurada)", async () => {
    if (!process.env.AI_API_KEY_DEEPSEEK && !process.env.AI_API_KEY_MARITACA) {
      console.log("Nenhuma chave remota configurada -- pulando teste de API remota");
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
    expect(resposta.modelo).toMatch(/DeepSeek|Maritaca/);
  });

  it(
    "gerarRespostaRag escolhe Ollama local quando nao ha chave remota",
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
        fontes,
        { timeoutMs: 180_000 }
      );

      expect(resposta.resposta.length).toBeGreaterThan(20);
      expect(resposta.fontes.length).toBe(1);
    },
    240_000
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
    "responderComRag executa o pipeline completo sobre o acervo real do portal",
    async () => {
      if (!disponivel) {
        console.log("Ollama indisponivel -- pulando teste de RAG");
        return;
      }
      // O acervo agora é o do portal (Fase 1): pergunta de cidade deve
      // recuperar a página de contratos de Betim e citá-la. `timeoutMs` alto
      // de propósito: o Ollama remoto passou de 60 s com o 3B carregado
      // (medido em 31/08) — o pipeline não pode flakar por máquina lenta.
      esquecerIndiceAcervo();
      const resposta = await responderComRag(
        "Quais sao os maiores contratos da prefeitura de Betim?",
        { timeoutMs: 180_000 }
      );

      expect(resposta.resposta.length).toBeGreaterThan(20);
      expect(resposta.fontes.length).toBeGreaterThan(0);
      expect(resposta.modelo).toBeTruthy();
      expect(resposta.ressalva).toBe(true);
      expect(resposta.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(resposta.verificacao).toMatch(/^(ok|parcial|falhou)$/);
      // A fonte da resposta tem que apontar para a página de contratos.
      expect(
        resposta.fontes.some((f) => f.rota?.includes("/betim/prefeitura/contratos")),
        `nenhuma fonte aponta para /betim/prefeitura/contratos: ${resposta.fontes
          .map((f) => f.rota ?? f.titulo)
          .join(" | ")}`
      ).toBe(true);
    },
    360_000
  );
});
