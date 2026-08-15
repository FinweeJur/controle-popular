import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  MOTIVOS_RECUSA,
  RESSALVA_COMUNICABR,
  ehCodigoIbgeComunicaBR,
  lerRespostaComunicaBR,
  normalizarSeries,
} from "./indicadores";

/**
 * Contrato do leitor do ComunicaBR, contra **duas respostas gravadas** da API
 * viva em 15/08/2026 (`fixtures/`). Sem rede: teste que depende de rede não
 * falha quando o código quebra, falha quando a internet oscila.
 *
 * As duas fixtures são o par que interessa:
 *
 * - `betim-310670.json` — o código de 6 dígitos, o que a API entende.
 * - `betim-3106200-esqueleto.json` — o IBGE de 7 dígitos. A API responde
 *   **200 com 102,8 KB**, 17 categorias, 66 subindicadores e 132 itens, e
 *   **zero** com valor. Foi essa resposta que fez uma medição anterior
 *   concluir que "o dado municipal não vem pela API". Ela está gravada aqui
 *   justamente para que a guarda que a barra tenha o que barrar.
 */

const RAIZ = path.join(__dirname, "fixtures");
const ler = (arquivo: string): unknown =>
  JSON.parse(readFileSync(path.join(RAIZ, arquivo), "utf-8")) as unknown;

const BETIM = ler("betim-310670.json");
const ESQUELETO = ler("betim-3106200-esqueleto.json");

describe("armadilha 1 — 200 OK não quer dizer que achou o município", () => {
  test("o IBGE de 7 dígitos é recusado por nome_ibge, não por status", () => {
    const r = lerRespostaComunicaBR(ESQUELETO, 3106200);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe(MOTIVOS_RECUSA.municipio_inexistente);
  });

  /**
   * A prova de que o esqueleto engana: ele NÃO é uma resposta curta nem um
   * erro. Tem a mesma arquitetura da resposta boa — 132 itens — e todos
   * vazios. Quem contar "itens" e não "itens com valor" vê uma fonte cheia.
   */
  test("o esqueleto tem a mesma forma da resposta boa, e nenhum valor", () => {
    const blocos = Object.values((ESQUELETO as { data: Record<string, unknown> }).data) as {
      nome_ibge: string | null;
      indicador?: { subIndicadores?: { items?: { valor: string | null }[] }[] };
    }[];
    expect(blocos.length).toBe(17);
    expect(blocos.every((b) => b.nome_ibge === null)).toBe(true);
    const itens = blocos.flatMap((b) => b.indicador?.subIndicadores ?? []).flatMap((s) => s.items ?? []);
    expect(itens.length).toBe(132);
    expect(itens.filter((i) => i.valor !== null && i.valor !== "")).toEqual([]);
  });

  test("a guarda de código barra 7 dígitos antes mesmo da requisição", () => {
    expect(ehCodigoIbgeComunicaBR(310670)).toBe(true);
    expect(ehCodigoIbgeComunicaBR(3106200)).toBe(false);
    expect(ehCodigoIbgeComunicaBR(31)).toBe(false);
    expect(ehCodigoIbgeComunicaBR(310670.5)).toBe(false);
  });

  test("resposta de outro município é recusada, não aceita calada", () => {
    const r = lerRespostaComunicaBR(BETIM, 310620);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe(MOTIVOS_RECUSA.codigo_divergente);
  });

  test("corpo sem envelope `data` é recusado", () => {
    expect(lerRespostaComunicaBR({}).ok).toBe(false);
    expect(lerRespostaComunicaBR(null).ok).toBe(false);
    expect(lerRespostaComunicaBR({ data: {} }).ok).toBe(false);
  });
});

describe("armadilha 2 — o valor mora em subIndicadores[].items[]", () => {
  const r = lerRespostaComunicaBR(BETIM, 310670);
  if (!r.ok) throw new Error(`fixture de Betim deveria ser legível: ${r.detalhe}`);
  const { municipio } = r;

  test("Betim, medido em 15/08/2026", () => {
    expect(municipio.nomeIbge).toBe("Betim/MG");
    expect(municipio.codigoIbge).toBe(310670);
    // 18 blocos na resposta; 17 temáticos, porque `dados-gerais` sai para
    // `municipio.dadosGerais` — forma diferente e conteúdo de cadastro.
    expect(municipio.cobertura.categorias).toBe(17);
    expect(municipio.cobertura.categoriasComConteudo).toBe(14);
    expect(municipio.cobertura.subindicadores).toBe(66);
  });

  /**
   * Os números do plano, item a item. `itens` aqui é 204 e não 132 porque o
   * achatamento desce em `sub_items[]` (armadilha 3): 132 no primeiro nível +
   * 72 no segundo. Travo os dois separadamente para que uma regressão que
   * pare de descer apareça como número, e não como "menos dado".
   */
  test("132 itens no primeiro nível, 60 com valor", () => {
    const n1 = municipio.categorias.flatMap((c) => c.itens).filter((i) => i.nivel === 1);
    expect(n1.length).toBe(132);
    expect(n1.filter((i) => i.valor !== null).length).toBe(60);
  });

  test("20 itens monetários com valor — os do plano", () => {
    const n1 = municipio.categorias.flatMap((c) => c.itens).filter((i) => i.nivel === 1);
    expect(n1.filter((i) => i.valor !== null && i.monetario).length).toBe(20);
  });

  test("Mais Médicos: 52 médicos atuando, fonte MS, dados até maio/2026", () => {
    const saude = municipio.categorias.find((c) => c.categoria === "saude");
    const sub = saude?.subindicadores.find((s) => s.titulo === "Mais Médicos");
    expect(sub?.fonte).toBe("MS");
    expect(sub?.referencia).toBe("Dados até maio/2026");
    expect(sub?.itens[0]?.valor).toBe("52");
    // O item não declara `fonte`; ele herda o "MS" do subindicador, e a tela
    // precisa saber que herdou para não atribuir ao item o que é do bloco.
    expect(sub?.itens[0]?.fonte).toBe("MS");
    expect(sub?.itens[0]?.fonteHerdada).toBe(true);
  });

  /**
   * `dados-gerais` é a ÚNICA categoria em que `descricao` guarda o valor.
   * Generalizar essa forma foi o erro 2 registrado no plano.
   */
  test("dados-gerais tem 13 campos, 10 com valor, e não vira item temático", () => {
    expect(municipio.dadosGerais.length).toBe(13);
    expect(municipio.dadosGerais.filter((d) => d.valor !== null).length).toBe(10);
    expect(municipio.dadosGerais.find((d) => d.chave === "populacao")?.valor).toBe(431433);
    const gerais = municipio.categorias.find((c) => c.categoria === "dados-gerais");
    expect(gerais?.itens ?? []).toEqual([]);
  });
});

describe("armadilha 3 — sub_items é um terceiro nível com dado de verdade", () => {
  const r = lerRespostaComunicaBR(BETIM, 310670);
  if (!r.ok) throw new Error("fixture de Betim deveria ser legível");
  const itens = r.municipio.categorias.flatMap((c) => c.itens);

  test("72 sub_items, 45 com valor — perdidos por quem para em items[]", () => {
    const n2 = itens.filter((i) => i.nivel === 2);
    expect(n2.length).toBe(72);
    expect(n2.filter((i) => i.valor !== null).length).toBe(45);
  });

  test("todo item carrega categoria, subindicador e título", () => {
    expect(itens.filter((i) => i.categoria === "" || i.subindicador === "" || i.titulo === "")).toEqual([]);
  });
});

describe("as lacunas são dado, e precisam sobreviver até a tela", () => {
  const r = lerRespostaComunicaBR(BETIM, 310670);
  if (!r.ok) throw new Error("fixture de Betim deveria ser legível");
  const { municipio } = r;

  /**
   * O ponto do item N4: publicar só o que tem valor faria a cobertura de Betim
   * parecer completa. Em Betim, 99 dos 204 itens vêm vazios.
   */
  test("Betim: 204 itens achatados, 105 com valor, 99 vazios", () => {
    expect(municipio.cobertura.itens).toBe(204);
    expect(municipio.cobertura.itensComValor).toBe(105);
    expect(municipio.cobertura.itensVazios).toBe(99);
  });

  /**
   * O plano lista cinco categorias "zeradas" em Betim. Medindo os DOIS níveis,
   * são duas — a lista do plano foi feita sem descer em `sub_items[]`, o mesmo
   * erro que produziu os "170 indicadores nulos". Contar lacuna sem descer
   * inventa lacuna.
   */
  test("duas categorias de Betim vêm sem valor nos dois níveis", () => {
    expect([...municipio.cobertura.categoriasSemNenhumValor].sort()).toEqual([
      "governo-digital",
      "infraestrutura",
    ]);
  });

  /**
   * O caso instrutivo: `mulheres` é a categoria que o plano dá como vazia.
   * No primeiro nível ela é mesmo — e o dado dela está um nível abaixo.
   */
  test("mulheres: zero valor em 20 itens do nível 1, e 18 valores no nível 2", () => {
    const itens = municipio.categorias.find((c) => c.categoria === "mulheres")?.itens ?? [];
    const n1 = itens.filter((i) => i.nivel === 1);
    const n2 = itens.filter((i) => i.nivel === 2);
    expect(n1.length).toBe(20);
    expect(n1.filter((i) => i.valor !== null)).toEqual([]);
    expect(n2.length).toBe(24);
    expect(n2.filter((i) => i.valor !== null).length).toBe(18);
  });

  test("itensVazios é contado por categoria, não deduzido na tela", () => {
    for (const c of municipio.categorias) {
      expect(c.itensVazios).toBe(c.itens.filter((i) => i.valor === null).length);
    }
  });
});

describe("procedência — o ministério vem declarado pela própria fonte", () => {
  const r = lerRespostaComunicaBR(BETIM, 310670);
  if (!r.ok) throw new Error("fixture de Betim deveria ser legível");

  /**
   * O plano contou 17 siglas. São 17 no nível do subindicador; contando
   * também o nível do item aparecem 4 que não existem no nível de cima —
   * MDIC, MEMP, MM e MPS. Quem só olhar o subindicador atribui ao ministério
   * errado o item que declarou o seu.
   */
  test("21 siglas de ministério na resposta de Betim", () => {
    const { fontes } = r.municipio.cobertura;
    expect(fontes.length).toBe(21);
    expect(fontes).toContain("MS");
    expect(fontes).toContain("MDIC");
    expect(fontes).toContain("MEMP");
  });

  test("a ressalva de origem existe junto do dado, não só no docs", () => {
    expect(RESSALVA_COMUNICABR).toContain("Portal da Transparência");
    expect(RESSALVA_COMUNICABR).toContain("comunicação do governo federal");
  });
});

describe("o gráfico tem três formas — quem lê uma só perde um terço", () => {
  const r = lerRespostaComunicaBR(BETIM, 310670);
  if (!r.ok) throw new Error("fixture de Betim deveria ser legível");

  /**
   * Medido em Betim: 22 subindicadores com `grafico.dados[]`, 3 com
   * `grafico.series[]` e 7 com um ARRAY de gráficos — 32 no total. O plano
   * registrou 22 porque só a primeira forma foi contada.
   */
  test("32 subindicadores com série histórica, somadas as três formas", () => {
    expect(r.municipio.cobertura.subindicadoresComSerie).toBe(32);
  });

  test("a série de Mais Médicos sai pronta: 2023:40 2024:48 2025:54 2026:52", () => {
    const sub = r.municipio.categorias
      .find((c) => c.categoria === "saude")
      ?.subindicadores.find((s) => s.titulo === "Mais Médicos");
    expect(sub?.series[0]?.pontos).toEqual([
      { ano: "2023", valor: 40 },
      { ano: "2024", valor: 48 },
      { ano: "2025", valor: 54 },
      { ano: "2026", valor: 52 },
    ]);
  });

  test("as três formas de grafico caem na mesma forma normalizada", () => {
    const simples = normalizarSeries({ tipo: "simples", nome: "A", dados: [{ descricao: "2025", valor: 1 }] });
    const multiplo = normalizarSeries({
      tipo: "multiplo",
      series: [{ nome: "B", dados: [{ ano: "2025", anoOrdenacao: 2025, valor: 2 }] }],
    });
    const emArray = normalizarSeries([
      { tipo: "simples", nome: "C", dados: [{ descricao: "2025", valor: 3 }] },
    ]);
    expect(simples).toEqual([{ nome: "A", monetario: false, pontos: [{ ano: "2025", valor: 1 }] }]);
    expect(multiplo).toEqual([{ nome: "B", monetario: false, pontos: [{ ano: "2025", valor: 2 }] }]);
    expect(emArray).toEqual([{ nome: "C", monetario: false, pontos: [{ ano: "2025", valor: 3 }] }]);
  });

  /** Array vazio é o caso mais comum (34 dos 66) e não pode virar série. */
  test("gráfico ausente ou vazio não vira linha em branco", () => {
    expect(normalizarSeries([])).toEqual([]);
    expect(normalizarSeries(null)).toEqual([]);
    expect(normalizarSeries({ tipo: "simples", nome: "X", dados: [] })).toEqual([]);
  });
});
