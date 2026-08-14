import { describe, expect, test } from "vitest";
import { CLIPPING_PARAOPEBA, PERIODO_CLIPPING, TIPO_NOTICIA_LABEL } from "./clipping";
import { MARCOS_PARAOPEBA } from "./linha-do-tempo";
import { ATORES_REPARACAO, CATEGORIA_ATOR_LABEL } from "./atores";
import { PAGAMENTOS_PARAOPEBA, RESUMO_AUXILIO_PARAOPEBA } from "./auxilio";
import { DOCUMENTOS_PROCESSO, COBERTURA_DOCUMENTOS_PROCESSO } from "./documentos";

/**
 * `clipping.ts`, `linha-do-tempo.ts`, `atores.ts` e `auxilio.ts` foram
 * GERADOS a partir de `painel-paraopeba.html` — um arquivo entregue à mão,
 * fora do repositório (não faz sentido versioná-lo: é o mesmo tratamento
 * que o projeto já dá a outras fontes externas de uso único). O que este
 * arquivo trava é o CONTRATO entre o parsing e o que `docs/PLANO-INGESTAO-
 * PARAOPEBA.md` mediu contando programaticamente sobre o HTML — se alguém
 * regenerar os arquivos e a contagem mudar sem querer (ex.: um item
 * duplicado, um array cortado pela metade), estes testes travam mesmo sem
 * o HTML original em mãos.
 */
describe("clipping.ts — parsing de NEWS_DATA (149 itens medidos)", () => {
  test("tem exatamente 149 notícias, o número medido em docs/PLANO-INGESTAO-PARAOPEBA.md", () => {
    expect(CLIPPING_PARAOPEBA.length).toBe(149);
  });

  test("todo item tem id, título, data, portal, tipo e url — nenhum campo obrigatório vazio", () => {
    for (const n of CLIPPING_PARAOPEBA) {
      expect(n.id, "id ausente").toBeGreaterThan(0);
      expect(n.titulo, `notícia ${n.id} sem título`).toBeTruthy();
      expect(n.data, `notícia ${n.id} sem data`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.portal, `notícia ${n.id} sem portal`).toBeTruthy();
      expect(n.url, `notícia ${n.id} sem url`).toMatch(/^https?:\/\//);
      expect(Object.keys(TIPO_NOTICIA_LABEL)).toContain(n.tipo);
    }
  });

  test("ids são únicos (o painel-fonte tem lacunas na numeração, mas nunca repete)", () => {
    const ids = CLIPPING_PARAOPEBA.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("a distribuição por tipo bate com a contagem medida no HTML (12/81/16/40)", () => {
    const contagem: Record<string, number> = {};
    for (const n of CLIPPING_PARAOPEBA) contagem[n.tipo] = (contagem[n.tipo] ?? 0) + 1;
    expect(contagem["institucional"]).toBe(12);
    expect(contagem["imprensa"]).toBe(81);
    expect(contagem["movimento"]).toBe(16);
    expect(contagem["assessoria"]).toBe(40);
  });

  test("PERIODO_CLIPPING é o mínimo e o máximo reais de CLIPPING_PARAOPEBA.data — nunca digitado solto", () => {
    const datas = CLIPPING_PARAOPEBA.map((n) => n.data).sort();
    expect(PERIODO_CLIPPING.de).toBe(datas[0]);
    expect(PERIODO_CLIPPING.ate).toBe(datas[datas.length - 1]);
  });
});

describe("linha-do-tempo.ts — parsing de MILESTONES (17 marcos medidos)", () => {
  test("tem exatamente 17 marcos", () => {
    expect(MARCOS_PARAOPEBA.length).toBe(17);
  });

  test("todo marco tem data, título, descrição e cor", () => {
    for (const m of MARCOS_PARAOPEBA) {
      expect(m.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(m.titulo).toBeTruthy();
      expect(m.descricao).toBeTruthy();
      expect(m.cor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test("os marcos estão em ordem cronológica — o painel-fonte já entregou assim, e a tela de linha do tempo confia nisso", () => {
    const datas = MARCOS_PARAOPEBA.map((m) => m.data);
    const ordenadas = [...datas].sort();
    expect(datas).toEqual(ordenadas);
  });
});

describe("atores.ts — parsing de INST_DATA (18 itens em 5 categorias medidas)", () => {
  test("tem exatamente 18 atores, o número medido (3 judiciário + 3 mp + 1 gestora + 7 mov + 4 pub)", () => {
    expect(ATORES_REPARACAO.length).toBe(18);
  });

  test("a contagem por categoria bate com a estrutura real de INST_DATA no HTML", () => {
    const contagem: Record<string, number> = {};
    for (const a of ATORES_REPARACAO) contagem[a.categoria] = (contagem[a.categoria] ?? 0) + 1;
    expect(contagem["judiciario"]).toBe(3);
    expect(contagem["mp"]).toBe(3);
    expect(contagem["gestora"]).toBe(1);
    expect(contagem["mov"]).toBe(7);
    expect(contagem["pub"]).toBe(4);
  });

  test("toda categoria usada tem rótulo em CATEGORIA_ATOR_LABEL", () => {
    for (const a of ATORES_REPARACAO) {
      expect(CATEGORIA_ATOR_LABEL[a.categoria]).toBeTruthy();
    }
  });

  test("nomes de ator são únicos — sem duplicata de parsing", () => {
    const nomes = ATORES_REPARACAO.map((a) => a.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });
});

describe("auxilio.ts — parsing de PAYMENTS e DATA_PANEL (9 pagamentos medidos)", () => {
  test("tem exatamente 9 pagamentos mensais", () => {
    expect(PAGAMENTOS_PARAOPEBA.length).toBe(9);
  });

  test("todo pagamento tem mês, valor, status e observação", () => {
    for (const p of PAGAMENTOS_PARAOPEBA) {
      expect(p.mes).toBeTruthy();
      expect(p.valor).toBeTruthy();
      expect(p.status).toBeTruthy();
      expect(p.observacao).toBeTruthy();
    }
  });

  test("RESUMO_AUXILIO_PARAOPEBA carrega a nota de proveniência do painel-fonte, sem edição", () => {
    // A `nota` é o que garante que os números-resumo não viraram fato
    // apurado por este portal (`docs/PLANO-INGESTAO-PARAOPEBA.md`, 1.6) —
    // se ela sumir, alguém removeu a única ressalva de proveniência.
    expect(RESUMO_AUXILIO_PARAOPEBA.nota.length).toBeGreaterThan(20);
  });
});

describe("documentos.ts — cobertura declarada bate com o acervo publicado", () => {
  test("o total publicado bate com COBERTURA_DOCUMENTOS_PROCESSO.publicados", () => {
    expect(DOCUMENTOS_PROCESSO.length).toBe(COBERTURA_DOCUMENTOS_PROCESSO.publicados);
  });

  test("471 de 7.107 é 6,6% — a fração declarada na tela vem da mesma conta, não digitada solta", () => {
    const c = COBERTURA_DOCUMENTOS_PROCESSO;
    expect(c.comMunicipioIdentificado).toBe(471);
    expect(c.totalAcervo).toBe(7107);
    const percentualReal = Math.round((c.comMunicipioIdentificado / c.totalAcervo) * 1000) / 10;
    expect(c.percentualPublicado).toBe(percentualReal);
    expect(c.percentualPublicado).toBe(6.6);
  });

  test("todo documento cita pelo menos um município", () => {
    for (const d of DOCUMENTOS_PROCESSO) {
      expect(d.municipios.length, `documento ${d.id} sem município`).toBeGreaterThan(0);
    }
  });

  test("ids são únicos", () => {
    const ids = DOCUMENTOS_PROCESSO.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
