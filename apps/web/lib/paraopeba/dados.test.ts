import { describe, expect, test } from "vitest";
import { CLIPPING_PARAOPEBA, PERIODO_CLIPPING, TIPO_NOTICIA_LABEL } from "./clipping";
import { MARCOS_PARAOPEBA, formatarDataMarco } from "./linha-do-tempo";
import { ATORES_REPARACAO, CATEGORIA_ATOR_LABEL } from "./atores";
import { PAGAMENTOS_PARAOPEBA, RESUMO_AUXILIO_PARAOPEBA } from "./auxilio";
import {
  CLIPPING_IJ,
  PERIODO_CLIPPING_IJ,
  INSTITUICAO_JUSTICA_LABEL,
  TEMA_CLIPPING_IJ_LABEL,
  TEMA_CLIPPING_IJ_ORDEM,
} from "./clipping-ij";
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

describe("linha-do-tempo.ts — 17 marcos de MILESTONES + 6 pré-2025 de EDU_TIMELINE", () => {
  test("tem exatamente 23 marcos — os 17 medidos em MILESTONES mais os 6 que faltavam", () => {
    expect(MARCOS_PARAOPEBA.length).toBe(23);
  });

  test("todo marco tem data, título, descrição e cor", () => {
    for (const m of MARCOS_PARAOPEBA) {
      // `YYYY-MM` é válido de propósito: a fonte de três marcos não tem o dia.
      expect(m.data, `data em formato inesperado: ${m.data}`).toMatch(/^\d{4}-\d{2}(-\d{2})?$/);
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

  /**
   * O buraco que a fusão de 15/08/2026 fechou. Sem o rompimento, a linha do
   * tempo de um acervo sobre a reparação de Brumadinho começava na ação
   * judicial contra o corte do auxílio, seis anos depois do fato.
   */
  test("a lista começa no rompimento, não na ACP de 2025", () => {
    expect(MARCOS_PARAOPEBA[0].data).toBe("2019-01-25");
    expect(MARCOS_PARAOPEBA[0].titulo).toContain("Rompimento");
  });

  test("são 6 os marcos anteriores a 2025 — se virar 5, algum sumiu numa regeneração", () => {
    expect(MARCOS_PARAOPEBA.filter((m) => m.data < "2025").length).toBe(6);
  });

  /**
   * Trava contra "completar o formato": três marcos vêm do painel com mês e
   * sem dia, e a tentação de gravar `2020-01-01` para uniformizar daria a um
   * dia inventado a mesma aparência de fato que 25/01/2019 tem.
   */
  test("os 3 marcos sem dia continuam sem dia", () => {
    const semDia = MARCOS_PARAOPEBA.filter((m) => /^\d{4}-\d{2}$/.test(m.data)).map((m) => m.data);
    expect(semDia).toEqual(["2020-01", "2021-11", "2024-11"]);
  });

  test("o Acordo de R$ 37,6 bi entrou com a mesma data que clipping-ij.ts registra", () => {
    const acordo = MARCOS_PARAOPEBA.find((m) => m.titulo.includes("37,6"));
    expect(acordo?.data).toBe("2021-02-04");
    const noClipping = CLIPPING_IJ.filter((n) => n.grupo === "CG_acordo_2021");
    expect(noClipping.length).toBeGreaterThan(0);
    for (const n of noClipping) expect(n.data).toBe(acordo?.data);
  });
});

describe("formatarDataMarco — a forma da data avisa a precisão dela", () => {
  test("data completa sai em dd/mm/aaaa", () => {
    expect(formatarDataMarco("2019-01-25")).toBe("25/01/2019");
  });

  test("data de mês sai por extenso, e nunca com um dia inventado", () => {
    expect(formatarDataMarco("2020-01")).toBe("janeiro de 2020");
    expect(formatarDataMarco("2024-11")).toBe("novembro de 2024");
  });

  test("entrada que não é data nenhuma vira travessão, não 'Invalid Date'", () => {
    expect(formatarDataMarco("")).toBe("—");
    expect(formatarDataMarco("Nov/2024")).toBe("—");
  });

  test("todo marco real rende um rótulo legível — nenhum cai no travessão", () => {
    for (const m of MARCOS_PARAOPEBA) {
      expect(formatarDataMarco(m.data), `marco "${m.titulo}" sem rótulo`).not.toBe("—");
    }
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

describe("clipping-ij.ts — parsing de CLIPPING_DATA (59 itens medidos)", () => {
  test("tem exatamente 59 matérias, o número medido em docs/HANDOFF-PAINEL-PARAOPEBA-PAGINAS-PERDIDAS.md §3", () => {
    expect(CLIPPING_IJ.length).toBe(59);
  });

  test("todo item tem id, título, resumo, data, fonte e url — nenhum campo obrigatório vazio", () => {
    for (const n of CLIPPING_IJ) {
      expect(n.id, "id ausente").toBeTruthy();
      expect(n.titulo, `matéria ${n.id} sem título`).toBeTruthy();
      expect(n.resumo, `matéria ${n.id} sem resumo`).toBeTruthy();
      expect(n.data, `matéria ${n.id} sem data`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.fonte, `matéria ${n.id} sem fonte`).toBeTruthy();
      expect(n.url, `matéria ${n.id} sem url`).toMatch(/^https?:\/\//);
      expect(Object.keys(INSTITUICAO_JUSTICA_LABEL)).toContain(n.instituicao);
      expect(Object.keys(TEMA_CLIPPING_IJ_LABEL)).toContain(n.tema);
    }
  });

  test("ids são únicos", () => {
    const ids = CLIPPING_IJ.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("a distribuição por instituição bate com a contagem medida no HTML (MPMG 25 · DPMG 20 · MPF 14)", () => {
    const contagem: Record<string, number> = {};
    for (const n of CLIPPING_IJ) contagem[n.instituicao] = (contagem[n.instituicao] ?? 0) + 1;
    expect(contagem["mpmg"]).toBe(25);
    expect(contagem["dpmg"]).toBe(20);
    expect(contagem["mpf"]).toBe(14);
  });

  test("a distribuição por tema bate com a medida (ptr_auxilio 24 · indenizacao 11 · acordo 9 · acao_penal 9 · consulta_popular 6)", () => {
    const contagem: Record<string, number> = {};
    for (const n of CLIPPING_IJ) contagem[n.tema] = (contagem[n.tema] ?? 0) + 1;
    expect(contagem["ptr_auxilio"]).toBe(24);
    expect(contagem["indenizacao"]).toBe(11);
    expect(contagem["acordo"]).toBe(9);
    expect(contagem["acao_penal"]).toBe(9);
    expect(contagem["consulta_popular"]).toBe(6);
  });

  test("PERIODO_CLIPPING_IJ é o mínimo e o máximo reais de CLIPPING_IJ.data — nunca digitado solto", () => {
    const datas = CLIPPING_IJ.map((n) => n.data).sort();
    expect(PERIODO_CLIPPING_IJ.de).toBe(datas[0]);
    expect(PERIODO_CLIPPING_IJ.ate).toBe(datas[datas.length - 1]);
  });

  test("TEMA_CLIPPING_IJ_ORDEM cobre todos os temas usados — senão um filtro some da tela sem aviso", () => {
    const usados = new Set(CLIPPING_IJ.map((n) => n.tema));
    for (const t of usados) expect(TEMA_CLIPPING_IJ_ORDEM).toContain(t);
    // E o contrário: ordem que promete tema sem item vira filtro vazio.
    for (const t of TEMA_CLIPPING_IJ_ORDEM) expect(usados).toContain(t);
  });

  test("o campo `grupo` amarra 36 matérias a 13 fatos, e todo grupo tem mais de um item", () => {
    // É a chave que nenhum outro acervo do portal tem: a mesma decisão
    // noticiada por MPMG, MPF e DPMG em paralelo. Grupo de um item só seria
    // erro de parsing — o painel-fonte só marca quando há repetição de fato.
    const comGrupo = CLIPPING_IJ.filter((n) => n.grupo);
    expect(comGrupo.length).toBe(36);

    const porGrupo: Record<string, number> = {};
    for (const n of comGrupo) porGrupo[n.grupo!] = (porGrupo[n.grupo!] ?? 0) + 1;
    expect(Object.keys(porGrupo).length).toBe(13);
    for (const [g, n] of Object.entries(porGrupo)) {
      expect(n, `grupo ${g} tem um item só`).toBeGreaterThan(1);
    }
  });

  test("é acervo novo, não duplicata de clipping.ts — no máximo 1 url em comum, nenhum título", () => {
    // O que justifica os dois arrays conviverem sem deduplicação
    // (HANDOFF §3). Se esta trava cair, alguém está reingerindo o mesmo
    // material sob outra classificação.
    const chave = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const urls = new Set(CLIPPING_PARAOPEBA.map((n) => chave(n.url)));
    const titulos = new Set(CLIPPING_PARAOPEBA.map((n) => chave(n.titulo)));
    expect(CLIPPING_IJ.filter((n) => urls.has(chave(n.url))).length).toBe(1);
    expect(CLIPPING_IJ.filter((n) => titulos.has(chave(n.titulo))).length).toBe(0);
  });

  test("cobre 5 anos a mais que o clipping geral — é o único acervo que alcança o Acordo de 2021", () => {
    expect(PERIODO_CLIPPING_IJ.de < PERIODO_CLIPPING.de).toBe(true);
    expect(CLIPPING_IJ.some((n) => n.data < "2021-03-01")).toBe(true);
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
