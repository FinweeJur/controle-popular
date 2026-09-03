import { describe, expect, it } from "vitest";
import {
  contarPorEsfera,
  contarPorTema,
  esferaDaLegislacao,
  esferaDaNatureza,
  filtrarItens,
  ordenarPorHierarquia,
  PESO_ESFERA,
  pesoHierarquia,
  rotuloHierarquia,
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

describe("hierarquia — peso e rótulo do tipo", () => {
  it("peso 1 a 7 nas bandas da pirâmide, sem acento e sem caixa", () => {
    expect(pesoHierarquia("CONSTITUICAO FEDERAL")).toBe(1);
    expect(pesoHierarquia("Emenda Constitucional nº 95")).toBe(1);
    expect(pesoHierarquia("LEI COMPLEMENTAR 140/2011")).toBe(2);
    expect(pesoHierarquia("LCP 97")).toBe(2);
    expect(pesoHierarquia("LEI 9.605/1998")).toBe(3);
    expect(pesoHierarquia("Lei Delegada 10")).toBe(3);
    expect(pesoHierarquia("DECRETO 6.040/2007")).toBe(4);
    expect(pesoHierarquia("DECRETO LEI 2.848")).toBe(4);
    expect(pesoHierarquia("MEDIDA PROVISÓRIA 890/2019")).toBe(4);
    expect(pesoHierarquia("MPV 900")).toBe(4);
    expect(pesoHierarquia("EMC 95")).toBe(4);
    expect(pesoHierarquia("DECRETO NÃO NUMERADO 1")).toBe(5);
    expect(pesoHierarquia("RESOLUÇÃO CONAMA 430/2011")).toBe(5);
    expect(pesoHierarquia("PORTARIA IBAMA 123")).toBe(6);
    expect(pesoHierarquia("Portaria Semad 52/2021")).toBe(6);
    expect(pesoHierarquia("INSTRUÇÃO NORMATIVA MMA 1/2020")).toBe(6);
    expect(pesoHierarquia("IN 5")).toBe(6);
    expect(pesoHierarquia("RECOMENDAÇÃO CNDH 1")).toBe(7);
    expect(pesoHierarquia("NOTA TÉCNICA 3")).toBe(7);
  });

  it("prefixo mais longo vence: LEI COMPLEMENTAR não cai na banda de LEI", () => {
    expect(pesoHierarquia("LEI COMPLEMENTAR 140/2011")).toBe(2);
    expect(pesoHierarquia("DECRETO NAO NUMERADO 2")).toBe(5);
    expect(pesoHierarquia("DECRETO 2")).toBe(4);
  });

  it("tipo sem prefixo conhecido (e vazio) cai na banda de outros (7)", () => {
    expect(pesoHierarquia("CIRCULAR 1")).toBe(7);
    expect(pesoHierarquia("")).toBe(7);
  });

  it("rótulo devolve a classe para a pílula, null quando não casa", () => {
    expect(rotuloHierarquia("PORTARIA IBAMA 123")).toBe("Portaria");
    expect(rotuloHierarquia("MEDIDA PROVISORIA 890")).toBe("Medida provisória");
    expect(rotuloHierarquia("RESOLUÇÃO CONAMA 430")).toBe("Resolução");
    expect(rotuloHierarquia("EMC 95")).toBe("Emenda constitucional");
    expect(rotuloHierarquia("CIRCULAR 1")).toBeNull();
  });
});

describe("esferaPeso / hierarquia no item unificado", () => {
  it("estadual carrega o peso da esfera e a banda do tipo", () => {
    const [item] = unificarItens([estadual({ tipo: "PORTARIA SEMAD", esfera: "estadual" })], [], []);
    expect(item.esferaPeso).toBe(PESO_ESFERA.estadual);
    expect(item.hierarquia).toBe(6);
  });

  it("MMA nacional pesa 2; crítica internacional pesa 1; crítica/precedente ficam na banda 7", () => {
    const [mma, criticaInt, precedenteNac] = unificarItens(
      [estadual({ fonte: "mma", esfera: "nacional", tipo: "RESOLUÇÃO CONAMA 430" })],
      [critica({ natureza: "internacional" })],
      [precedente({ natureza: "nacional" })]
    );
    expect(mma.esferaPeso).toBe(PESO_ESFERA.nacional);
    expect(mma.hierarquia).toBe(5);
    expect(criticaInt.esferaPeso).toBe(PESO_ESFERA.internacional);
    expect(criticaInt.hierarquia).toBe(7);
    expect(precedenteNac.esferaPeso).toBe(PESO_ESFERA.nacional);
    expect(precedenteNac.hierarquia).toBe(7);
  });
});

describe("ordenarPorHierarquia", () => {
  it("esfera primeiro, depois banda do tipo, depois data desc na banda", () => {
    const itens = unificarItens(
      [
        estadual({ tipo: "PORTARIA SEMAD", data: "2022-01-01", chaveDedup: "p" }),
        estadual({ tipo: "LEI", data: "2001-01-01", chaveDedup: "l1" }),
        estadual({ tipo: "LEI", data: "2020-01-01", chaveDedup: "l2" }),
      ],
      [critica()], // nacional, banda 7
      [precedente({ natureza: "internacional" })] // internacional, banda 7
    );
    const ordem = ordenarPorHierarquia(itens).map((i) =>
      i.classe === "estadual" ? i.row.chaveDedup : i.classe
    );
    expect(ordem).toEqual(["precedente", "critica", "l2", "l1", "p"]);
  });

  it("sem data completa, o ano é o fallback; sem nenhum, vai pro fim da banda", () => {
    const itens = unificarItens(
      [
        estadual({ tipo: "LEI", data: null, ano: 1999, chaveDedup: "a" }),
        estadual({ tipo: "LEI", data: "2005-06-01", chaveDedup: "b" }),
        estadual({ tipo: "LEI", data: null, ano: null, chaveDedup: "c" }),
      ],
      [],
      []
    );
    const ordem = ordenarPorHierarquia(itens).map((i) =>
      i.classe === "estadual" ? i.row.chaveDedup : ""
    );
    expect(ordem).toEqual(["b", "a", "c"]);
  });

  it("crítica e precedente, sem tipo nem data, preservam a ordem curada da fonte", () => {
    const itens = unificarItens(
      [],
      [critica({ idFonte: 1 }), critica({ idFonte: 2 })],
      [precedente({ idFonte: 3 })]
    );
    expect(ordenarPorHierarquia(itens).map((i) => i.chave)).toEqual([
      "critica-1",
      "critica-2",
      "precedente-3",
    ]);
  });
});
