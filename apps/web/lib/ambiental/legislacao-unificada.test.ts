import { describe, expect, it } from "vitest";
import {
  contarPorEsfera,
  contarPorTema,
  esferaDaLegislacao,
  esferaDaNatureza,
  filtrarItens,
  TEMA_LABEL_UNIFICADO,
  TEMA_ORDEM_UNIFICADO,
  textoBuscaDoItem,
  unificarItens,
} from "./legislacao-unificada";
import type { LegislacaoAmbientalRow } from "@/lib/db/queries/legislacao-ambiental";
import type {
  NormaDireitoCriticoRow,
  PrecedenteDireitoCriticoRow,
} from "@/lib/db/queries/direito-critico";
import { semAcento } from "@/lib/busca/normalizar";

function estadual(overrides: Partial<LegislacaoAmbientalRow> = {}): LegislacaoAmbientalRow {
  return {
    fonte: "almg",
    esfera: "estadual",
    situacao: null,
    tipo: "LEI",
    numero: "123",
    ano: 2020,
    ementa: "Dispõe sobre a proteção da Serra do Cipó.",
    data: "2020-01-01",
    orgao: "ALMG",
    linkPdf: null,
    chaveDedup: "lei-123-2020",
    temas: ["serras"],
    tags: ["serra_relevo"],
    ...overrides,
  };
}

function critica(overrides: Partial<NormaDireitoCriticoRow> = {}): NormaDireitoCriticoRow {
  return {
    idFonte: 1,
    numero: null,
    nomeCurto: "Constituição Federal",
    nomeCompleto: "Constituição da República Federativa do Brasil de 1988",
    natureza: "nacional",
    destaque: true,
    linkOficial: "https://example.org",
    relevanciaHtml: "<strong>relevante</strong>",
    artigos: [],
    temas: ["indigena", "direitos_humanos"],
    ...overrides,
  };
}

function precedente(overrides: Partial<PrecedenteDireitoCriticoRow> = {}): PrecedenteDireitoCriticoRow {
  return {
    idFonte: 1,
    tribunal: "STF",
    natureza: "nacional",
    destaque: false,
    linkOficial: null,
    titulo: "Caso X",
    referencia: "ADI 000",
    ementa: "Ementa do caso.",
    relevancia: "Por que importa.",
    tags: ["Risco Integral"],
    temas: ["rios"],
    ...overrides,
  };
}

describe("esfera — campo de primeira classe", () => {
  it("a esfera vem da COLUNA da linha, não de um case sobre a fonte", () => {
    expect(esferaDaLegislacao("estadual")).toBe("estadual");
    expect(esferaDaLegislacao("nacional")).toBe("nacional");
    expect(esferaDaLegislacao("municipal")).toBe("municipal");
    expect(esferaDaLegislacao("internacional")).toBe("internacional");
  });

  it("linha sem esfera (banco anterior à migration 0073) cai em estadual", () => {
    expect(esferaDaLegislacao(null)).toBe("estadual");
    expect(esferaDaLegislacao(undefined)).toBe("estadual");
    expect(esferaDaLegislacao("")).toBe("estadual");
  });

  it("valor fora do vocabulário não quebra a tela — vira estadual", () => {
    expect(esferaDaLegislacao("federal")).toBe("estadual");
  });

  it("natureza do direito crítico vira esfera 1:1", () => {
    expect(esferaDaNatureza("nacional")).toBe("nacional");
    expect(esferaDaNatureza("internacional")).toBe("internacional");
  });
});

describe("legislação federal na mesma tabela (migration 0073)", () => {
  it("uma linha do MMA é nacional, não estadual, mesmo sendo classe 'estadual'", () => {
    const [item] = unificarItens([estadual({ fonte: "mma", esfera: "nacional" })], [], []);
    expect(item.classe).toBe("estadual");
    expect(item.esfera).toBe("nacional");
  });

  it("filtro por esfera 'nacional' alcança MMA/CNDH sem derrubar o filtro por fonte", () => {
    const itens = unificarItens(
      [
        estadual({ fonte: "almg", esfera: "estadual" }),
        estadual({ fonte: "mma", esfera: "nacional", chaveDedup: "mma-1" }),
        estadual({ fonte: "cndh", esfera: "nacional", chaveDedup: "cndh-1" }),
      ],
      [],
      []
    );
    expect(filtrarItens(itens, { esfera: "nacional" }, semAcento)).toHaveLength(2);
    expect(filtrarItens(itens, { esfera: "nacional", fonte: "mma" }, semAcento)).toHaveLength(1);
  });

  it("contarPorEsfera separa Minas do federal dentro da mesma classe", () => {
    const itens = unificarItens(
      [estadual({ fonte: "siam" }), estadual({ fonte: "mma", esfera: "nacional", chaveDedup: "m1" })],
      [],
      []
    );
    const cont = contarPorEsfera(itens);
    expect(cont.estadual).toBe(1);
    expect(cont.nacional).toBe(1);
  });
});

describe("unificarItens", () => {
  it("junta as três listas sem perder nem fundir entre classes", () => {
    const itens = unificarItens([estadual()], [critica()], [precedente()]);
    expect(itens).toHaveLength(3);
    expect(itens.map((i) => i.classe).sort()).toEqual(["critica", "estadual", "precedente"]);
  });

  it("cada item carrega a esfera resolvida, não a fonte crua", () => {
    const [estadualItem, criticaItem, precedenteItem] = unificarItens(
      [estadual({ fonte: "siam" })],
      [critica({ natureza: "internacional" })],
      [precedente({ natureza: "internacional" })]
    );
    expect(estadualItem.esfera).toBe("estadual");
    expect(criticaItem.esfera).toBe("internacional");
    expect(precedenteItem.esfera).toBe("internacional");
  });

  it("chaves são estáveis e distintas entre classes mesmo com idFonte repetido", () => {
    const itens = unificarItens([], [critica({ idFonte: 1 })], [precedente({ idFonte: 1 })]);
    const chaves = itens.map((i) => i.chave);
    expect(new Set(chaves).size).toBe(2);
  });
});

describe("tema unificado", () => {
  it("'serras' aparece uma única vez na ordem, mesmo estando nos dois vocabulários de origem", () => {
    const ocorrencias = TEMA_ORDEM_UNIFICADO.filter((t) => t === "serras");
    expect(ocorrencias).toHaveLength(1);
    expect(TEMA_LABEL_UNIFICADO.serras).toBeTruthy();
  });

  it("tem os 9 temas estaduais e os 6 exclusivos do direito crítico (15 ao todo)", () => {
    expect(TEMA_ORDEM_UNIFICADO).toHaveLength(15);
    expect(TEMA_ORDEM_UNIFICADO).toContain("mineracao");
    expect(TEMA_ORDEM_UNIFICADO).toContain("indigena");
    expect(TEMA_ORDEM_UNIFICADO).toContain("quilombola");
  });
});

describe("filtrarItens", () => {
  const itens = unificarItens(
    [estadual({ fonte: "almg", temas: ["serras"] }), estadual({ fonte: "semad", temas: ["mineracao"], chaveDedup: "d2" })],
    [critica({ temas: ["indigena"] })],
    [precedente({ temas: ["rios"] })]
  );

  it("filtra por esfera", () => {
    const so_nacionais = filtrarItens(itens, { esfera: "nacional" }, semAcento);
    expect(so_nacionais).toHaveLength(2); // a norma crítica + o precedente, ambos nacional
    expect(so_nacionais.every((i) => i.esfera === "nacional")).toBe(true);
  });

  it("filtra por tema unificado através das classes", () => {
    const so_serras = filtrarItens(itens, { tema: "serras" }, semAcento);
    expect(so_serras).toHaveLength(1);
    expect(so_serras[0].classe).toBe("estadual");
  });

  it("filtra por classe", () => {
    const so_precedentes = filtrarItens(itens, { classe: "precedente" }, semAcento);
    expect(so_precedentes).toHaveLength(1);
    expect(so_precedentes[0].classe).toBe("precedente");
  });

  it("filtra por fonte só dentro da classe estadual — não derruba críticas/precedentes por engano", () => {
    const so_almg = filtrarItens(itens, { fonte: "almg" }, semAcento);
    expect(so_almg).toHaveLength(1);
    expect(so_almg[0].classe).toBe("estadual");
  });

  it("busca por palavra-chave usa o texto certo por classe", () => {
    const achou = filtrarItens(itens, { termoNormalizado: semAcento("Cipó") }, semAcento);
    expect(achou.some((i) => i.classe === "estadual")).toBe(true);
  });

  it("combina filtros (E lógico, não OU)", () => {
    const nada = filtrarItens(itens, { esfera: "estadual", tema: "indigena" }, semAcento);
    expect(nada).toHaveLength(0);
  });
});

describe("contarPorTema / contarPorEsfera", () => {
  const itens = unificarItens(
    [estadual({ temas: ["serras"] })],
    [critica({ temas: ["indigena"] })],
    [precedente({ temas: ["rios"] })]
  );

  it("conta temas sem nenhuma ocorrência como 0, não os omite do mapa", () => {
    const cont = contarPorTema(itens);
    expect(cont.get("quilombola")).toBe(0);
    expect(cont.get("serras")).toBe(1);
    expect(cont.has("mineracao")).toBe(true);
  });

  it("soma esfera pelas três classes", () => {
    const cont = contarPorEsfera(itens);
    expect(cont.estadual).toBe(1);
    expect(cont.nacional).toBe(2);
    expect(cont.internacional).toBe(0);
    expect(cont.municipal).toBe(0);
  });
});

describe("textoBuscaDoItem", () => {
  it("estadual usa ementa/tipo/numero/orgao", () => {
    const texto = textoBuscaDoItem(unificarItens([estadual()], [], [])[0]);
    expect(texto).toContain("Serra do Cipó");
  });

  it("crítica usa nome curto/completo e títulos de artigo", () => {
    const texto = textoBuscaDoItem(unificarItens([], [critica()], [])[0]);
    expect(texto).toContain("Constituição Federal");
  });

  it("precedente usa tribunal/titulo/ementa/tags", () => {
    const texto = textoBuscaDoItem(unificarItens([], [], [precedente()])[0]);
    expect(texto).toContain("STF");
  });
});
