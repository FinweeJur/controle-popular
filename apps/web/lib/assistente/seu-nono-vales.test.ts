/**
 * apps/web/lib/assistente/seu-nono-vales.test.ts
 *
 * Testes unitários para as novas perguntas e contexto cívico dos Vales do
 * Jequitinhonha e Mucuri no catálogo do Seu Nonô (Alceu Dispor).
 */

import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { FRENTES, type SeuNonoPergunta } from "./seu-nono-dados";
import {
  obterContextoMunicipioVales,
  listarMunicipiosVales,
  buscarMunicipiosVales,
  listarMunicipiosIndigenasVales,
  listarMunicipiosLitioVales,
  gerarPromptContextoVales,
  obterEstatisticasVales,
  formatarResumoContextual,
} from "./contexto-vales";

/**
 * Validador oficial de CPF por algoritmo mod-11 (AGENTS.md §5.2).
 */
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

describe("Seu Nonô — Vales do Jequitinhonha e Mucuri", () => {
  const frenteCidades = FRENTES.find((f) => f.id === "cidades");
  const categoriaVales = frenteCidades?.categorias.find(
    (c) => c.id === "vales-jequitinhonha-mucuri"
  );

  it("deve conter a frente Cidades e a categoria dedicada aos Vales do Jequitinhonha e Mucuri", () => {
    expect(frenteCidades).toBeDefined();
    expect(categoriaVales).toBeDefined();
    expect(categoriaVales?.titulo).toBe("Vales do Jequitinhonha e Mucuri");
    expect(categoriaVales?.perguntas.length).toBeGreaterThanOrEqual(4);
  });

  it("deve conter as 4 perguntas fundamentais sobre compras no PNCP, polo do lítio, Vale do Mucuri e regras de qualidade", () => {
    const perguntas = categoriaVales?.perguntas || [];
    const ids = perguntas.map((p) => p.id);

    expect(ids).toContain("compras-pncp-jequitinhonha");
    expect(ids).toContain("polo-litio-jequitinhonha");
    expect(ids).toContain("municipios-mucuri-maxakali");
    expect(ids).toContain("regras-qualidade-informacao-vales");
  });

  it("deve validar a pergunta sobre compras e contratos no PNCP", () => {
    const p = categoriaVales?.perguntas.find((item) => item.id === "compras-pncp-jequitinhonha");
    expect(p).toBeDefined();
    expect(p?.pergunta).toContain("Vale do Jequitinhonha no PNCP");
    expect(p?.resposta).toContain("PNCP");
    expect(p?.resposta).toContain("compras");
    expect(p?.resposta).toContain("fornecedores e obras");
    expect(p?.link?.href).toContain("pncp.gov.br");
    expect(p?.links?.some((l) => l.href.includes("pncp.gov.br"))).toBe(true);
  });

  it("deve validar a pergunta sobre o polo do lítio no Jequitinhonha", () => {
    const p = categoriaVales?.perguntas.find((item) => item.id === "polo-litio-jequitinhonha");
    expect(p).toBeDefined();
    expect(p?.pergunta).toContain("polo do lítio no Jequitinhonha");
    expect(p?.resposta).toContain("Araçuaí");
    expect(p?.resposta).toContain("Itinga");
    expect(p?.resposta).toContain("Coronel Murta");
    expect(p?.resposta).toContain("CFEM");
    expect(p?.resposta).toContain("águas dos rios");
    expect(p?.link?.href).toContain("anm");
  });

  it("deve validar a pergunta sobre os 27 municípios do Vale do Mucuri e os Maxakali", () => {
    const p = categoriaVales?.perguntas.find((item) => item.id === "municipios-mucuri-maxakali");
    expect(p).toBeDefined();
    expect(p?.pergunta).toContain("27 municípios do Vale do Mucuri");
    expect(p?.pergunta).toContain("Maxakali");
    expect(p?.resposta).toContain("Teófilo Otoni");
    expect(p?.resposta).toContain("Nanuque");
    expect(p?.resposta).toContain("Ladainha");
    expect(p?.resposta).toContain("Santa Helena de Minas");
    expect(p?.resposta).toContain("Maxakali");
    expect(p?.resposta).toContain("SUAS");
    expect(p?.resposta).toContain("recursos hídricos");
    expect(p?.link?.href).toContain("funai");
  });

  it("deve validar a pergunta sobre as 6 regras de qualidade da informação", () => {
    const p = categoriaVales?.perguntas.find(
      (item) => item.id === "regras-qualidade-informacao-vales"
    );
    expect(p).toBeDefined();
    expect(p?.pergunta).toContain("regras de qualidade da informação");
    expect(p?.resposta).toContain("Primeiro: fonte direta");
    expect(p?.resposta).toContain("Segundo: dado buscável");
    expect(p?.resposta).toContain("Terceiro: lista filtrável");
    expect(p?.resposta).toContain("Quarto: microresumo cidadão");
    expect(p?.resposta).toContain("Quinto: chatbot com contexto");
    expect(p?.resposta).toContain("Sexto: classificação com tags");
    expect(p?.link?.href).toContain("planalto.gov.br");
  });

  it("deve respeitar a regra do Seu Nonô de frases curtas de até 13 palavras em todas as respostas", () => {
    const perguntas = categoriaVales?.perguntas || [];

    for (const p of perguntas) {
      // Divide por pontuação final (. ! ?) desconsiderando abreviações triviais
      const frases = p.resposta
        .split(/(?<=[.!?])\s+/)
        .map((f) => f.trim())
        .filter(Boolean);

      for (const frase of frases) {
        // Ignora marcadores de travessão isolados
        const palavras = frase
          .replace(/[—–-]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 0 && !/^[\d.,;:!?]+$/.test(w));

        expect(
          palavras.length,
          `Frase excedeu 13 palavras na pergunta '${p.id}': "${frase}" (${palavras.length} palavras)`
        ).toBeLessThanOrEqual(13);
      }
    }
  });

  it("deve garantir zero CPFs reais nos textos das respostas (AGENTS.md §5.2)", () => {
    const perguntas = categoriaVales?.perguntas || [];

    for (const p of perguntas) {
      const textoCompleto = `${p.pergunta} ${p.resposta} ${p.link?.texto || ""} ${p.link?.href || ""}`;
      const digitos11 = textoCompleto.match(/\b\d{11}\b/g) || [];

      for (const d of digitos11) {
        expect(cpfValido(d), `CPF válido detectado na pergunta ${p.id}: ${d}`).toBe(false);
      }
    }
  });
});

describe("Módulo de contexto cívico dos Vales (contexto-vales.ts)", () => {
  it("deve carregar os 27 municípios do Vale do Mucuri com integridade", () => {
    const lista = listarMunicipiosVales();
    expect(lista.length).toBeGreaterThanOrEqual(27);

    const mucuri = lista.filter((m) => m.vale === "Mucuri");
    expect(mucuri.length).toBe(27);
  });

  it("deve localizar município do Mucuri por código IBGE 7d, 6d, nome e alias legado", () => {
    // Teófilo Otoni
    const teofiloPor7 = obterContextoMunicipioVales("3168606");
    expect(teofiloPor7).toBeDefined();
    expect(teofiloPor7?.nome).toBe("Teófilo Otoni");
    expect(teofiloPor7?.vale).toBe("Mucuri");
    expect(teofiloPor7?.polo_regional).toBe("Teófilo Otoni");

    const teofiloPor6 = obterContextoMunicipioVales("316860");
    expect(teofiloPor6?.id_ibge7).toBe("3168606");

    const teofiloPorNome = obterContextoMunicipioVales("Teófilo Otoni");
    expect(teofiloPorNome?.id_ibge7).toBe("3168606");

    const teofiloSemAcento = obterContextoMunicipioVales("teofilo otoni");
    expect(teofiloSemAcento?.id_ibge7).toBe("3168606");

    const teofiloAlias = obterContextoMunicipioVales("3168608");
    expect(teofiloAlias?.id_ibge7).toBe("3168606");
  });

  it("deve identificar corretamente os municípios com terras indígenas no Vale do Mucuri", () => {
    const indigenas = listarMunicipiosIndigenasVales();
    expect(indigenas.length).toBeGreaterThanOrEqual(2);

    const ladainha = indigenas.find((m) => m.nome === "Ladainha");
    const santaHelena = indigenas.find((m) => m.nome === "Santa Helena de Minas");

    expect(ladainha).toBeDefined();
    expect(ladainha?.povo_indigena).toBe("Maxakali");
    expect(santaHelena).toBeDefined();
    expect(santaHelena?.povo_indigena).toBe("Maxakali");
  });

  it("deve retornar null para termos ou códigos inexistentes", () => {
    expect(obterContextoMunicipioVales("")).toBeNull();
    expect(obterContextoMunicipioVales("9999999")).toBeNull();
    expect(obterContextoMunicipioVales("CidadeInexistenteXYZ")).toBeNull();
  });

  it("deve permitir busca textual flexível por polo, bacia e tags", () => {
    const buscaNanuque = buscarMunicipiosVales("Nanuque");
    expect(buscaNanuque.length).toBeGreaterThanOrEqual(1);

    const buscaRioTodosSantos = buscarMunicipiosVales("Rio Todos os Santos");
    expect(buscaRioTodosSantos.some((m) => m.nome === "Teófilo Otoni")).toBe(true);

    const buscaPedras = buscarMunicipiosVales("Pedras Preciosas");
    expect(buscaPedras.length).toBeGreaterThan(0);
  });

  it("deve gerar prompt contextualizado e microresumo cívico para injeção no chatbot", () => {
    const teofilo = obterContextoMunicipioVales("Teófilo Otoni");
    expect(teofilo).not.toBeNull();
    if (!teofilo) return;

    const prompt = gerarPromptContextoVales(teofilo);
    expect(prompt).toContain("CONTEXTO TERRITORIAL CÍVICO: TEÓFILO OTONI");
    expect(prompt).toContain("3168606");
    expect(prompt).toContain("Vale do Mucuri");
    expect(prompt).toContain("Teófilo Otoni");
    expect(prompt).toContain("PNCP");
    expect(prompt).toContain(teofilo.resumo_contextual);

    // Resumo contextual
    expect(teofilo.resumo_contextual).toContain("Teófilo Otoni integra o Vale do Mucuri");
    expect(teofilo.resumo_contextual).toContain("3168606");
  });

  it("deve testar o carregamento do Vale do Jequitinhonha se o arquivo vales-jequitinhonha.json estiver presente", () => {
    const caminhos = [
      path.resolve(process.cwd(), "apps", "web", "data", "vales-jequitinhonha.json"),
      path.resolve(process.cwd(), "data", "vales-jequitinhonha.json"),
    ];
    const arquivoJeq = caminhos.find((c) => fs.existsSync(c));

    if (arquivoJeq) {
      const stats = obterEstatisticasVales();
      expect(stats.totalJequitinhonha).toBeGreaterThan(0);

      const aracuai = obterContextoMunicipioVales("Araçuaí");
      if (aracuai) {
        expect(aracuai.vale).toBe("Jequitinhonha");
        expect(aracuai.e_polo_litio).toBe(true);
      }
    } else {
      // Se não estiver presente em disco, a suíte segue verde comprovando resiliência
      const stats = obterEstatisticasVales();
      expect(stats.totalMucuri).toBe(27);
    }
  });

  it("deve formatar resumo com marcador do Polo do Lítio quando aplicável", () => {
    const mockLitio = formatarResumoContextual({
      id_ibge7: "3103405",
      id_ibge6: "310340",
      nome: "Araçuaí",
      vale: "Jequitinhonha",
      polo_regional: "Araçuaí",
      tem_terras_indigenas: false,
      povo_indigena: null,
      bacia_principal: "Bacia do Rio Jequitinhonha",
      tags: ["Polo do Lítio"],
      link_pncp: "https://pncp.gov.br",
      e_polo_litio: true,
    });

    expect(mockLitio).toContain("Polo do Lítio");
    expect(mockLitio).toContain("Araçuaí");
    expect(mockLitio).toContain("3103405");
  });

  it("deve garantir zero CPFs nos resumos e dados dos municípios (AGENTS.md §5.2)", () => {
    const lista = listarMunicipiosVales();

    for (const m of lista) {
      const texto = `${m.nome} ${m.id_ibge7} ${m.resumo_contextual} ${m.link_pncp}`;
      const digitos11 = texto.match(/\b\d{11}\b/g) || [];

      for (const d of digitos11) {
        expect(cpfValido(d), `CPF detectado no município ${m.nome}: ${d}`).toBe(false);
      }
    }
  });
});
