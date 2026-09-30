import { describe, it, expect } from "vitest";
import { CABECALHOS_ALERTA, cabecalhoDeAlerta, montarMensagemAlerta } from "./alerta-contextual";

/**
 * Testa o gerador REAL de mensagem do planejador `/alertas` — antes este
 * arquivo montava a string inline e asseria sobre ela, sem exercitar código
 * nenhum de produção.
 */
describe("alerta-contextual — mensagem do planejador", () => {
  it("monta a mensagem com cabeçalho, órgão, identificação, resumo e link", () => {
    const texto = montarMensagemAlerta({
      tipo: "licenciamento",
      orgao: "Conceição do Mato Dentro, MG",
      titulo: "Pauta de Licença de Operação — Complexo Minas-Rio",
      identificador: "Processo COPAM nº 0842/2026",
      link: "https://controlepopular.com.br/ambiental/licenciamento",
      detalhes: "Reunião de julgamento da pauta na próxima terça-feira.",
    });

    expect(texto).toContain("🌿 *ALERTA DE LICENCIAMENTO AMBIENTAL*");
    expect(texto).toContain("Conceição do Mato Dentro, MG");
    expect(texto).toContain("Processo COPAM nº 0842/2026");
    expect(texto).toContain("Reunião de julgamento da pauta");
    expect(texto).toContain("https://controlepopular.com.br/ambiental/licenciamento");
  });

  it("inclui o bloco de telefones quando fornecidos", () => {
    const texto = montarMensagemAlerta({
      tipo: "contato",
      orgao: "MG",
      titulo: "Canais de denúncia",
      identificador: "—",
      link: "https://controlepopular.com.br",
      detalhes: "Denuncie.",
      telefones: "• Disque Denúncia: 181\n• Ouvidoria MPMG: 127",
    });

    expect(texto).toContain("📞 *Telefones e Contatos para Acionar:*");
    expect(texto).toContain("Disque Denúncia: 181");
    expect(texto).toContain("Ouvidoria MPMG: 127");
  });

  it("NÃO inclui o bloco de telefones quando ausente", () => {
    const texto = montarMensagemAlerta({
      tipo: "licenciamento",
      orgao: "MG",
      titulo: "t",
      identificador: "i",
      link: "l",
      detalhes: "d",
    });
    expect(texto).not.toContain("Telefones e Contatos para Acionar");
  });

  it("o cabeçalho cai no fallback quando o tipo não está no mapa", () => {
    expect(cabecalhoDeAlerta("contrato", "FALLBACK")).toBe(CABECALHOS_ALERTA.contrato);
    expect(cabecalhoDeAlerta("inexistente" as never, "FALLBACK")).toBe("FALLBACK");
  });
});
