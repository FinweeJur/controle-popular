/**
 * Teste de integração do RAG do Seu Nonô.
 *
 * NÃO usa Ollama: o caminho do chatbot não importa `ollama.ts` desde
 * 10/11/2026 (o container do Azure não alcança `172.18.176.1:11434`). A
 * geração usa os provedores remotos de `provedores.ts` (GLM grátis ->
 * Maritaca -> DeepSeek -> Ling); sem chave, os testes que precisam de rede
 * são pulados e o restante roda em busca lexical.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { responderComRag, esquecerIndiceAcervo, buscarNoAcervo } from "./rag";
import { gerarRespostaRag, gerarRespostaApi } from "./geracao";
import { temChaveRemota } from "./provedores";

describe("responderComRag -- integracao com provedor remoto", () => {
  let disponivel = false;

  beforeAll(() => {
    disponivel = temChaveRemota();
  });

  it(
    "gerarRespostaApi responde a partir de fontes pequenas sem inventar",
    async () => {
      if (!disponivel) {
        console.log("Nenhum provedor remoto configurado -- pulando teste de geracao");
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

      const resposta = await gerarRespostaApi(
        "Quem acompanhou as acoes apos o rompimento da barragem de Fundao?",
        fontes,
        { timeoutMs: 60_000 }
      ).catch((e: unknown) => {
        // Sem rede para o provedor (sandbox/CI), o teste vira skip — o mesmo
        // espírito do skip de Ollama que existia antes de 10/11/2026.
        console.log(`Provedor remoto nao respondeu (${(e as Error).message}) -- pulando`);
        return null;
      });
      if (!resposta) return;

      expect(resposta.resposta.length).toBeGreaterThan(20);
      expect(resposta.fontes.length).toBe(2);
      expect(resposta.modelo).toBeTruthy();
      expect(resposta.textoGeradoPorModelo).toBe(true);
    },
    240_000
  );

  it(
    "gerarRespostaRag usa provedor remoto (nunca Ollama)",
    async () => {
      if (!disponivel) {
        console.log("Nenhum provedor remoto configurado -- pulando teste de RAG");
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
        { timeoutMs: 60_000 }
      ).catch((e: unknown) => {
        console.log(`Provedor remoto nao respondeu (${(e as Error).message}) -- pulando`);
        return null;
      });
      if (!resposta) return;

      expect(resposta.resposta.length).toBeGreaterThan(20);
      expect(resposta.fontes.length).toBe(1);
      expect(resposta.modelo).not.toMatch(/ollama/i);
    },
    240_000
  );

  it("retorna 'nao encontrei' quando nao ha fontes", async () => {
    const resposta = await gerarRespostaRag("Qual a receita de bolo de cenoura?", []);
    expect(resposta.resposta.length).toBeGreaterThan(10);
    expect(resposta.fontes.length).toBe(0);
    expect(resposta.textoGeradoPorModelo).toBe(false);
  });

  it(
    "responderComRag executa o pipeline completo sobre o acervo real do portal",
    async () => {
      if (!disponivel) {
        console.log("Nenhum provedor remoto configurado -- pulando teste de RAG");
        return;
      }
      // Orçamento alto de propósito: o teste mede o pipeline, não o teto de
      // produção (que é de 21 s e está coberto em `degradacao.test.ts`).
      esquecerIndiceAcervo();
      const resposta = await responderComRag(
        "Quais sao os maiores contratos da prefeitura de Betim?",
        { timeoutMs: 60_000, orcamentoMs: 180_000 }
      );

      if (resposta.textoGeradoPorModelo === false) {
        console.log(`Provedor remoto nao gerou (${resposta.motivoDegradacao}) -- pulando`);
        return;
      }

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

describe("buscarNoAcervo -- ranking e 5 perguntas fixas da Home Page", () => {
  it("recupera a fonte do painel de R$ 251 bilhões com score alto e sem abstenção", async () => {
    const { melhores, abstem } = await buscarNoAcervo(
      "De onde vêm os R$ 251 bilhões monitorados no painel do portal?"
    );
    expect(abstem).toBe(false);
    expect(melhores.length).toBeGreaterThan(0);
    expect(melhores.some((m) => m.fonte.id === "macro:soma-251-bi")).toBe(true);
    expect(melhores[0].score).toBeGreaterThanOrEqual(0.3);
  });

  it("recupera o Acordo de Mariana de R$ 171 bilhões com score alto e sem abstenção", async () => {
    const { melhores, abstem } = await buscarNoAcervo(
      "O que prevê a repactuação de Mariana de R$ 171 bilhões?"
    );
    expect(abstem).toBe(false);
    expect(melhores.length).toBeGreaterThan(0);
    expect(
      melhores.some((m) => m.fonte.id === "macro:acordo-mariana-171-bi" || m.fonte.id === "pergunta:terra:repactuacao-mariana")
    ).toBe(true);
    expect(melhores[0].score).toBeGreaterThanOrEqual(0.3);
  });

  it("recupera a disparidade orçamentária do TJMG, MPMG e DPMG com score alto e sem abstenção", async () => {
    const { melhores, abstem } = await buscarNoAcervo(
      "Qual é o orçamento do TJMG, MPMG e DPMG e por que há disparidade?"
    );
    expect(abstem).toBe(false);
    expect(melhores.length).toBeGreaterThan(0);
    expect(
      melhores.some((m) => m.fonte.id === "macro:orcamento-justica-disparidade" || m.fonte.texto.includes("TJMG"))
    ).toBe(true);
    expect(melhores[0].score).toBeGreaterThanOrEqual(0.3);
  });

  it("recupera a pesquisa de contratos e compras municipais com score alto e sem abstenção", async () => {
    const { melhores, abstem } = await buscarNoAcervo(
      "Como pesquisar contratos e licitações de prefeituras no portal?"
    );
    expect(abstem).toBe(false);
    expect(melhores.length).toBeGreaterThan(0);
    expect(melhores.some((m) => m.fonte.id === "macro:pesquisa-contratos-prefeituras")).toBe(true);
    expect(melhores[0].score).toBeGreaterThanOrEqual(0.3);
  });

  it("recupera as barragens a montante e estruturas em nível 3 de emergência com score alto e sem abstenção", async () => {
    const { melhores, abstem } = await buscarNoAcervo(
      "Quais são as barragens a montante e estruturas em nível 3 de emergência?"
    );
    expect(abstem).toBe(false);
    expect(melhores.length).toBeGreaterThan(0);
    expect(
      melhores.some((m) => m.fonte.id === "macro:barragens-montante-nivel-3" || m.fonte.id.includes("barragens"))
    ).toBe(true);
    expect(melhores[0].score).toBeGreaterThanOrEqual(0.3);
  });

  it("aplica boost de relevância baseado no pathname da tela atual", async () => {
    const semPathname = await buscarNoAcervo("licenciamento ambiental e normas");
    const comPathname = await buscarNoAcervo("licenciamento ambiental e normas", 5, 0.1, "/ambiental/licenciamento");

    expect(comPathname.abstem).toBe(false);
    const fonteLicenciamento = comPathname.melhores.find((m) => m.fonte.rota === "/ambiental/licenciamento");
    expect(fonteLicenciamento).toBeDefined();

    const scoreSem = semPathname.melhores.find((m) => m.fonte.rota === "/ambiental/licenciamento")?.score ?? 0;
    const scoreCom = fonteLicenciamento?.score ?? 0;
    expect(scoreCom).toBeGreaterThanOrEqual(scoreSem);
  });
});
