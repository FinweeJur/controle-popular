import { describe, expect, test } from "vitest";

import { TEMA_AJRI_ORDEM } from "./auditoria-ajri";
import { bibliotecaAti } from "./biblioteca";
import { CASAMENTOS_ESTUDO_NOTICIA } from "./estudo-e-noticia";
import { lerSinteseAjri } from "./sintese-ajri-dados";

/** Sinônimo — dado agora no loader server-only. */
const SINTESE_AJRI = lerSinteseAjri();
import {
  EIXO_PARA_TEMA_AJRI,
  ESTUDO_AUSENTE_DO_ACERVO,
  resumoIntegrado,
  sinteseIntegrada,
  temasDoDocumentoCasado,
  temasSemEixo,
} from "./sintese-integrada";

/**
 * Contrato da análise integrada (Tarefa `/paraopeba/analise`, `cp-acordos-mg`).
 *
 * O que estes testes travam não é "concordo com o mapa de eixo→TemaAjri" —
 * é (1) que a ponte cobre exatamente os 16 eixos reais e nunca aponta para
 * um `TemaAjri` inventado, (2) que a régua de cobertura ("quaisFaltam") é
 * consistente com a contagem real de documentos, e (3) que os números que a
 * página promete — eixo só-auditoria, temas órfãos, o caso `er04` — são
 * medidos contra o dado de verdade, não digitados. Ver o cabeçalho de
 * `sintese-integrada.ts` para a régua completa.
 */

describe("ponte eixo (texto livre) -> TemaAjri", () => {
  test("as 16 chaves são exatamente os 16 títulos reais de SINTESE_AJRI.eixos", () => {
    const titulos = SINTESE_AJRI.eixos.map((e) => e.titulo);
    expect(Object.keys(EIXO_PARA_TEMA_AJRI).sort()).toEqual([...titulos].sort());
    expect(titulos.length).toBe(16);
  });

  test("nenhuma entrada aponta para um TemaAjri fora do vocabulário controlado", () => {
    const validos = new Set(TEMA_AJRI_ORDEM);
    const invalidos = Object.values(EIXO_PARA_TEMA_AJRI)
      .flat()
      .filter((t) => !validos.has(t));
    expect(invalidos).toEqual([]);
  });

  test("nenhum TemaAjri aparece duas vezes dentro do mesmo eixo", () => {
    for (const [titulo, temas] of Object.entries(EIXO_PARA_TEMA_AJRI)) {
      expect(new Set(temas).size, `${titulo}: TemaAjri repetido na mesma entrada`).toBe(temas.length);
    }
  });

  test("7 eixos sem TemaAjri (processo/meta ou sem equivalente), 9 com pelo menos um", () => {
    const semTema = Object.values(EIXO_PARA_TEMA_AJRI).filter((t) => t.length === 0);
    const comTema = Object.values(EIXO_PARA_TEMA_AJRI).filter((t) => t.length > 0);
    expect(semTema.length).toBe(7);
    expect(comTema.length).toBe(9);
  });
});

describe("temasDoDocumentoCasado", () => {
  test("documento da biblioteca com tema livre mapeado resolve TemaAjri real", async () => {
    const itens = await bibliotecaAti();
    const temas = temasDoDocumentoCasado(
      { fonte: "biblioteca-ati", id: "aedas-24193", titulo: "x", url: "x", data: null },
      itens
    );
    expect(temas).toContain("risco-saude-publica");
  });

  test("documento da biblioteca sem item real (id não encontrado) devolve []", async () => {
    const itens = await bibliotecaAti();
    const temas = temasDoDocumentoCasado(
      { fonte: "biblioteca-ati", id: "id-que-nao-existe", titulo: "x", url: "x", data: null },
      itens
    );
    expect(temas).toEqual([]);
  });

  test("documento do Guaicuy (sem taxonomia temática) devolve [] mesmo quando o item existe", async () => {
    const itens = await bibliotecaAti();
    const temas = temasDoDocumentoCasado(
      {
        fonte: "biblioteca-ati",
        id: "guaicuy-cinco-anos-do-desastre-crime-da-vale",
        titulo: "x",
        url: "x",
        data: null,
      },
      itens
    );
    expect(temas).toEqual([]);
  });

  test("documento da perícia (o único casamento dessa fonte) resolve plano-de-reparacao", async () => {
    const itens = await bibliotecaAti();
    const temas = temasDoDocumentoCasado(
      {
        fonte: "pericia-ufmg",
        id: "RESUMO_DAS_APRESENTAÇÕES_DE_RESULTADOS_DO_PROJETO_BRUMADINHO_UFMG.pdf",
        titulo: "x",
        url: "x",
        data: null,
      },
      itens
    );
    expect(temas).toEqual(["plano-de-reparacao"]);
  });
});

describe("sinteseIntegrada()", () => {
  test("devolve as 16 linhas, uma por eixo, na mesma ordem de SINTESE_AJRI", async () => {
    const eixos = await sinteseIntegrada();
    expect(eixos.map((e) => e.titulo)).toEqual(SINTESE_AJRI.eixos.map((e) => e.titulo));
  });

  test("cobertura.fontesQueFalam nunca é menor que 1 (a auditoria sempre fala) nem maior que 3", async () => {
    const eixos = await sinteseIntegrada();
    for (const e of eixos) {
      expect(e.cobertura.fontesQueFalam, e.titulo).toBeGreaterThanOrEqual(1);
      expect(e.cobertura.fontesQueFalam, e.titulo).toBeLessThanOrEqual(3);
    }
  });

  test("eixo sem TemaAjri nunca tem documento de perícia ou de ATI (a ponte não existe)", async () => {
    const eixos = await sinteseIntegrada();
    for (const e of eixos) {
      if (!e.cobertura.temTemaAjri) {
        expect(e.pericia.documentos, e.titulo).toEqual([]);
        expect(e.atis.documentos, e.titulo).toEqual([]);
        expect(e.vozAti, e.titulo).toEqual([]);
      }
    }
  });

  test("quaisFaltam é consistente com a contagem real de documentos", async () => {
    const eixos = await sinteseIntegrada();
    for (const e of eixos) {
      if (!e.cobertura.temTemaAjri) continue;
      const faltaPericia = e.cobertura.quaisFaltam.some((f) => f.includes("perícia"));
      const faltaAti = e.cobertura.quaisFaltam.some((f) => f.includes("ATIs"));
      expect(faltaPericia, e.titulo).toBe(e.pericia.documentos.length === 0);
      expect(faltaAti, e.titulo).toBe(e.atis.documentos.length === 0);
    }
  });

  /**
   * Medido em 21/08/2026 contra o dado real (`biblioteca-ati.json` +
   * `pericia-ufmg.json`): "Saúde humana e risco ecológico" é o único eixo
   * onde as três fontes falam ao mesmo tempo (perícia: docs 1/3/4/5 do
   * `node/582`; ATIs: 56 itens com tema "Saúde e ERSHRE"/"Saúde"). Se este
   * número mudar, é porque um dos três acervos-fonte mudou de verdade — não
   * é para "consertar" o teste sem checar o motivo primeiro.
   */
  test("'Saúde humana e risco ecológico' é coberto pelas três fontes", async () => {
    const eixos = await sinteseIntegrada();
    const eixo = eixos.find((e) => e.titulo === "Saúde humana e risco ecológico")!;
    expect(eixo.cobertura.fontesQueFalam).toBe(3);
    expect(eixo.pericia.documentos.length).toBeGreaterThan(0);
    expect(eixo.atis.documentos.length).toBeGreaterThan(0);
  });

  /**
   * Mesma medição: "Fornecimento e captação de água" — o problema mais
   * grave do acervo segundo a própria auditoria — não tem documento de
   * perícia cruzando por tema. A biblioteca das ATIs tem um item inferido
   * ("decisão sobre fornecimento de água") que cai aqui; por isso a contagem
   * de fontes passou de 1 para 2. Continua sendo pauta para a perícia, não
   * bug.
   */
  test("'Fornecimento e captação de água' tem auditoria + ATI inferida, sem perícia", async () => {
    const eixos = await sinteseIntegrada();
    const eixo = eixos.find((e) => e.titulo === "Fornecimento e captação de água")!;
    expect(eixo.cobertura.fontesQueFalam).toBe(2);
    expect(eixo.cobertura.temTemaAjri).toBe(true);
    expect(eixo.pericia.documentos).toEqual([]);
    expect(eixo.atis.documentos.length).toBeGreaterThan(0);
    expect(eixo.atis.documentos.every((d) => d.temas_ajri_inferred && d.temas_ajri_inferred.length > 0)).toBe(true);
  });

  test("'Buscas por vítimas' está só com a auditoria por falta de ponte, não por falta de dado nas outras fontes", async () => {
    const eixos = await sinteseIntegrada();
    const eixo = eixos.find((e) => e.titulo === "Buscas por vítimas")!;
    expect(eixo.cobertura.temTemaAjri).toBe(false);
    expect(eixo.cobertura.quaisFaltam[0]).toMatch(/não é possível cruzar/);
  });
});

describe("resumoIntegrado()", () => {
  test("soAuditoria = soAuditoriaSemPonte + soAuditoriaComPonteVazia", async () => {
    const eixos = await sinteseIntegrada();
    const r = resumoIntegrado(eixos);
    expect(r.totalEixos).toBe(16);
    expect(r.soAuditoria).toBe(r.soAuditoriaSemPonte + r.soAuditoriaComPonteVazia);
    expect(r.soAuditoriaSemPonte).toBe(7); // os 7 eixos sem TemaAjri nunca têm outra fonte
  });
});

describe("temasSemEixo()", () => {
  /**
   * Medido em 21/08/2026: `plano-de-reparacao` (o rótulo mais genérico da
   * biblioteca) e `programas-de-compensacao` concentram a maior fatia do que
   * perícia e ATIs marcam SEM que nenhum dos 16 eixos os cubra — ver a seção
   * "O QUE `EIXO_PARA_TEMA_AJRI` NÃO CAPTURA" no cabeçalho do módulo.
   */
  test("plano-de-reparacao e programas-de-compensacao aparecem como órfãos, com documento em pelo menos duas fontes", async () => {
    const orfaos = await temasSemEixo();
    const porTema = Object.fromEntries(orfaos.map((o) => [o.tema, o]));
    expect(porTema["plano-de-reparacao"]).toBeDefined();
    expect(porTema["plano-de-reparacao"].documentosAti).toBeGreaterThan(50);
    expect(porTema["plano-de-reparacao"].documentosPericia).toBeGreaterThan(0);
    expect(porTema["programas-de-compensacao"]).toBeDefined();
    expect(porTema["programas-de-compensacao"].documentosAti).toBeGreaterThan(0);
  });

  test("todo tema órfão tem pelo menos um documento em alguma fonte (nunca entra por engano)", async () => {
    const orfaos = await temasSemEixo();
    for (const o of orfaos) {
      expect(o.documentosAti + o.documentosPericia, o.tema).toBeGreaterThan(0);
    }
  });

  test("nenhum tema órfão é, na verdade, um TemaAjri já coberto por algum eixo", async () => {
    const orfaos = await temasSemEixo();
    const mapeados = new Set(Object.values(EIXO_PARA_TEMA_AJRI).flat());
    for (const o of orfaos) {
      expect(mapeados.has(o.tema), o.tema).toBe(false);
    }
  });
});

describe("ESTUDO_AUSENTE_DO_ACERVO (er04)", () => {
  test("é o caso citado pela tarefa: documento null, força nula, motivo explica a lacuna", () => {
    expect(ESTUDO_AUSENTE_DO_ACERVO.noticia.id).toBe("er04");
    expect(ESTUDO_AUSENTE_DO_ACERVO.documento).toBeNull();
    expect(ESTUDO_AUSENTE_DO_ACERVO.forca).toBe("nula");
    expect(ESTUDO_AUSENTE_DO_ACERVO.motivo).toMatch(/ausente do acervo raspado/);
  });

  test("continua presente em CASAMENTOS_ESTUDO_NOTICIA — não é cópia divergente", () => {
    const original = CASAMENTOS_ESTUDO_NOTICIA.find((c) => c.noticia.id === "er04");
    expect(ESTUDO_AUSENTE_DO_ACERVO.noticia.id).toBe(original?.noticia.id);
    expect(ESTUDO_AUSENTE_DO_ACERVO.evidencia).toBe(original?.evidencia);
  });
});
