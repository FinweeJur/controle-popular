/**
 * Testes do formatador Telegram do Seu Nonô (regra 14/10/2026: resposta
 * livre do bot com fontes e ressalva de IA). O que quebra aqui quebra a
 * mensagem inteira no Telegram — por isso os asserts de limite são duros.
 */
import { describe, expect, it } from "vitest";
import { formatarRespostaNono, LIMITE_TELEGRAM } from "./formatar-nono";

const respostaBase = {
  resposta: "Betim recebeu 1,2 milhão em repasses.",
  fontes: [
    { indice: 1, texto: "t", score: 0.9, titulo: "Página de Betim", rota: "/betim" },
    { indice: 2, texto: "t", score: 0.8, titulo: "IBGE", url: "https://ibge.gov.br" },
  ],
  modelo: "deepseek-v4",
  data: "2026-10-14T12:00:00Z",
};

describe("formatarRespostaNono", () => {
  it("monta corpo, fontes linkadas e ressalva de IA com modelo e data", () => {
    const out = formatarRespostaNono(respostaBase);
    expect(out).toContain("Betim recebeu 1,2 milhão");
    expect(out).toContain('[1] <a href="https://www.controlepopular.com.br/betim">Página de Betim</a>');
    expect(out).toContain('[2] <a href="https://ibge.gov.br">IBGE</a>');
    expect(out).toContain("🤖 Resposta de IA (deepseek-v4, 2026-10-14)");
  });

  it("escapa HTML do corpo (injeção não abre tag no Telegram)", () => {
    const out = formatarRespostaNono({ ...respostaBase, resposta: "<script>alert('x')</script>" });
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });

  it("sem fontes não publica bloco de fontes vazio", () => {
    const out = formatarRespostaNono({ ...respostaBase, fontes: [] });
    expect(out).not.toContain("📚 Fontes:");
  });

  it("respeita o teto de 4096 com corpo gigante (o Telegram rejeita acima disso)", () => {
    const out = formatarRespostaNono({ ...respostaBase, resposta: "a&b ".repeat(3000) });
    expect(out.length).toBeLessThanOrEqual(LIMITE_TELEGRAM);
  });
});
