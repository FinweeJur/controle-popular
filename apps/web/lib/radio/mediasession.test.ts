import { describe, expect, it } from "vitest";
import { estacaoPorId } from "./estacoes";
import { ARTE_RADIO, midiaDaEstacao, ORIGEM_RADIO } from "./mediasession";

/**
 * O que este teste trava: o texto que aparece na barra de notificação do
 * celular e no painel de mídia do navegador (dono, 18/11/2026). Se o título
 * deixar de ser o nome da estação, o leitor não sabe o que está ouvindo; se a
 * arte voltar a ser caminho relativo, o sistema descarta a imagem.
 */
describe("midiaDaEstacao", () => {
  const estacao = estacaoPorId("radio-nacional-rio")!;

  it("usa o nome da estação no título e a origem no artista", () => {
    const midia = midiaDaEstacao(estacao, "https://www.controlepopular.com.br");
    expect(midia.titulo).toBe("Rádio Nacional do Rio de Janeiro");
    expect(midia.artista).toBe(ORIGEM_RADIO);
  });

  it("diz cidade, UF e categoria no álbum", () => {
    const midia = midiaDaEstacao(estacao, "https://www.controlepopular.com.br");
    expect(midia.album).toBe("Rio de Janeiro, RJ · Pública federal");
  });

  it("entrega a arte em URL absoluta (relativa some na notificação)", () => {
    const midia = midiaDaEstacao(estacao, "https://www.controlepopular.com.br");
    expect(midia.artwork[0].src).toBe(
      `https://www.controlepopular.com.br${ARTE_RADIO}`
    );
    expect(midia.artwork[0].sizes).toBe("256x256");
  });

  it("estação sem cidade cai no país", () => {
    const semCidade = { ...estacao, cidade: undefined, uf: undefined };
    const midia = midiaDaEstacao(semCidade, "https://www.controlepopular.com.br");
    expect(midia.album).toBe("Brasil · Pública federal");
  });
});
