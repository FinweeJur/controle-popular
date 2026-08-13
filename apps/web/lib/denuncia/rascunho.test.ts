import { describe, expect, test } from "vitest";
import { apagarRascunho, carregarRascunho, CHAVE_RASCUNHO, EXPIRA_MS, salvarRascunho } from "./rascunho";
import { respostasVazias } from "./tipos";
import type { StorageLike } from "./rascunho";

/**
 * O rascunho é opt-in e tem prazo — as duas garantias que
 * `docs/PLANO-ACAO-CIDADA.md` promete na tela ("expira sozinho em 24h",
 * "apagar tudo agora"). Um bug aqui não quebra a build, quebra a promessa:
 * um rascunho que não expira é exatamente o risco físico que o plano
 * decidiu não correr por padrão. `StorageLike` deixa isto testável sem
 * `jsdom`/`localStorage` de verdade — `environment: "node"` no
 * `vitest.config.ts` é proposital (só lib pura, sem navegador).
 */

function storageFalso(): StorageLike & { dados: Map<string, string> } {
  const dados = new Map<string, string>();
  return {
    dados,
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => void dados.set(chave, valor),
    removeItem: (chave) => void dados.delete(chave),
  };
}

describe("salvarRascunho / carregarRascunho", () => {
  test("o que foi salvo volta idêntico, dentro do prazo", () => {
    const storage = storageFalso();
    const respostas = { ...respostasVazias(), quando: "faz uns 2 anos", relato: "teste" };
    salvarRascunho(storage, respostas, 1000);
    const carregado = carregarRascunho(storage, 1000 + 60_000);
    expect(carregado?.respostas).toEqual(respostas);
  });

  test("nada salvo devolve null, sem lançar", () => {
    const storage = storageFalso();
    expect(carregarRascunho(storage)).toBeNull();
  });

  test("rascunho expira exatamente depois de 24h — a promessa da tela", () => {
    const storage = storageFalso();
    salvarRascunho(storage, respostasVazias(), 0);
    expect(carregarRascunho(storage, EXPIRA_MS - 1)).not.toBeNull();
    expect(carregarRascunho(storage, EXPIRA_MS + 1)).toBeNull();
  });

  test("rascunho expirado é removido do storage ao ser lido, não só ignorado", () => {
    const storage = storageFalso();
    salvarRascunho(storage, respostasVazias(), 0);
    carregarRascunho(storage, EXPIRA_MS + 1);
    expect(storage.dados.has(CHAVE_RASCUNHO)).toBe(false);
  });

  test("JSON corrompido no storage não lança — trata como sem rascunho e limpa", () => {
    const storage = storageFalso();
    storage.setItem(CHAVE_RASCUNHO, "{ isto não é json válido");
    expect(carregarRascunho(storage)).toBeNull();
    expect(storage.dados.has(CHAVE_RASCUNHO)).toBe(false);
  });
});

describe("apagarRascunho", () => {
  test("apaga tudo, sem confirmação de duas etapas — botão de emergência", () => {
    const storage = storageFalso();
    salvarRascunho(storage, respostasVazias());
    apagarRascunho(storage);
    expect(carregarRascunho(storage)).toBeNull();
    expect(storage.dados.size).toBe(0);
  });

  test("apagar quando não havia nada salvo não lança", () => {
    const storage = storageFalso();
    expect(() => apagarRascunho(storage)).not.toThrow();
  });
});
