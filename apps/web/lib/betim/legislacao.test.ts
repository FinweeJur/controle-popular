import { describe, expect, test } from "vitest";
import { facetasDosAtos, type AtoRow } from "./legislacao";
import { filtrarAtos, temFiltroAtivo } from "./legislacao-filtro";
import { arquivosDoIndice, NOME_MANIFESTO } from "@/lib/estatico/emitir";
import type { ManifestoFatias } from "@/lib/estatico/fatiar";

/**
 * Três contratos, e os três nasceram do mesmo conserto: a coleção de normas
 * saiu do payload de `/[municipio]/camara/legislacao` para um índice estático
 * fatiado, porque `bh/camara/legislacao.cache` publicava 11 MiB e
 * `diamantina/camara/legislacao.cache` 9,5 MiB contra um teto de 25 MiB.
 *
 * 1. As FACETAS (categorias, anos, ranking de áreas) continuam sendo a única
 *    coisa que a página conhece sobre o acervo. Se elas divergirem das linhas,
 *    o `<select>` passa a oferecer um ano que a lista não tem — ou a esconder
 *    um que ela tem, que é pior: o leitor conclui que não existe norma daquele
 *    ano.
 * 2. O FILTRO mudou de casa três vezes (servidor, depois cliente sobre props,
 *    agora cliente sobre o índice). Filtro reescrito errado não quebra, só
 *    responde outra coisa — e a tela e o verificador de paridade agora
 *    dependem desta mesma função.
 * 3. A LINHA gravada no índice tem de continuar cabendo no orçamento de fatia.
 *    `ementa`, `analise.itens[].trecho` e `vicio.itens[].justificativa` são
 *    texto livre; um campo novo entrando sem ninguém medir é o defeito que
 *    este trabalho fechou voltando pela porta dos fundos.
 */

function ato(over: Partial<AtoRow> = {}): AtoRow {
  return {
    id: over.id ?? "a1",
    tipo: "Decreto",
    numero: "1",
    ano: 2026,
    ementa: "Abre crédito suplementar ao orçamento vigente.",
    dataPublicacao: "2026-08-15",
    temas: null,
    mapaIdx: null,
    ...over,
  };
}

describe("facetasDosAtos — o que a página sabe sem carregar o acervo", () => {
  test("categorias saem distintas e em ordem pt-BR", () => {
    const f = facetasDosAtos([
      ato({ id: "1", tipo: "Lei" }),
      ato({ id: "2", tipo: "Ata" }),
      ato({ id: "3", tipo: "Lei" }),
      ato({ id: "4", tipo: "Ação" }),
    ]);
    // "Ação" antes de "Ata" é o que `localeCompare(pt-BR)` dá; ordenação
    // binária poria a acentuada por último e o `<select>` sairia embaralhado.
    expect(f.categoriasDisponiveis).toEqual(["Ação", "Ata", "Lei"]);
  });

  test("tipo nulo não vira opção de filtro vazia", () => {
    const f = facetasDosAtos([ato({ id: "1", tipo: null }), ato({ id: "2", tipo: "Lei" })]);
    expect(f.categoriasDisponiveis).toEqual(["Lei"]);
  });

  test("anos vêm do mais recente para o mais antigo, sem nulo", () => {
    const f = facetasDosAtos([
      ato({ id: "1", ano: 2019 }),
      ato({ id: "2", ano: null }),
      ato({ id: "3", ano: 2026 }),
      ato({ id: "4", ano: 2019 }),
    ]);
    expect(f.anosDisponiveis).toEqual([2026, 2019]);
  });

  test("o ranking de áreas conta ATOS por tema, e um ato pode ter vários", () => {
    const f = facetasDosAtos([
      ato({ id: "1", temas: ["saude", "educacao"] }),
      ato({ id: "2", temas: ["saude"] }),
      ato({ id: "3", temas: null }),
    ]);
    expect(f.temas.map((t) => [t.tema, t.qtd])).toEqual([
      ["saude", 2],
      ["educacao", 1],
    ]);
    // A soma das barras passa do número de atos de propósito — é a mesma
    // ressalva que `contarTemas` já registra. Travar isso impede alguém de
    // "consertar" o ranking dividindo por ato.
    expect(f.temas.reduce((a, t) => a + t.qtd, 0)).toBe(3);
  });

  test("empate de contagem desempata por nome, não pela ordem das linhas", () => {
    // Sem o desempate o gráfico muda de ordem a cada build (SSG), e a página
    // publicada passa a divergir da anterior sem nenhum dado ter mudado.
    const f = facetasDosAtos([ato({ id: "1", temas: ["transporte"] }), ato({ id: "2", temas: ["ambiente"] })]);
    expect(f.temas.map((t) => t.tema)).toEqual(["ambiente", "transporte"]);
  });

  test("cidade sem norma dá faceta vazia, não undefined", () => {
    expect(facetasDosAtos([])).toEqual({
      categoriasDisponiveis: [],
      anosDisponiveis: [],
      temas: [],
    });
  });
});

describe("filtrarAtos — a mesma função na tela e no verificador de paridade", () => {
  const acervo: AtoRow[] = [
    ato({ id: "1", tipo: "Lei", ano: 2026, temas: ["saude"] }),
    ato({ id: "2", tipo: "Decreto", ano: 2026, temas: ["saude", "educacao"] }),
    ato({ id: "3", tipo: "Lei", ano: 2019, temas: null }),
    ato({
      id: "4",
      tipo: "Lei",
      ano: 2026,
      temas: ["educacao"],
      analise: { rotulo: "reducionista", score: -3, direitos: ["saude"], itens: [] },
    }),
  ];

  test("sem filtro nenhum devolve o acervo inteiro", () => {
    expect(filtrarAtos(acervo, {}).map((a) => a.id)).toEqual(["1", "2", "3", "4"]);
    expect(temFiltroAtivo({})).toBe(false);
  });

  test("categoria é igualdade exata em `tipo`", () => {
    expect(filtrarAtos(acervo, { categoria: "Lei" }).map((a) => a.id)).toEqual(["1", "3", "4"]);
  });

  test("ano chega como string do `<select>` e é comparado como número", () => {
    // `"2026" !== 2026` — sem a conversão o filtro devolveria lista vazia para
    // todo ano escolhido, e "nenhuma norma em 2026" é afirmação falsa.
    expect(filtrarAtos(acervo, { ano: "2026" }).map((a) => a.id)).toEqual(["1", "2", "4"]);
  });

  test("tema é `contém`, não igualdade — ato com dois temas entra nos dois", () => {
    expect(filtrarAtos(acervo, { tema: "saude" }).map((a) => a.id)).toEqual(["1", "2"]);
    expect(filtrarAtos(acervo, { tema: "educacao" }).map((a) => a.id)).toEqual(["2", "4"]);
  });

  test("direito só alcança quem TEM análise — ausência não é 'não afeta'", () => {
    // O ato 2 também tem tema `saude`, mas não tem análise: ele não pode
    // aparecer num recorte por DIREITO à saúde, que é leitura da análise
    // garantista e não classificação temática.
    expect(filtrarAtos(acervo, { direito: "saude" }).map((a) => a.id)).toEqual(["4"]);
  });

  test("os filtros se acumulam, não se substituem", () => {
    expect(filtrarAtos(acervo, { categoria: "Lei", ano: "2026", tema: "educacao" }).map((a) => a.id)).toEqual(["4"]);
    expect(temFiltroAtivo({ categoria: "Lei" })).toBe(true);
  });

  test("string vazia é 'sem filtro', não 'campo vazio'", () => {
    // Os `<select>` mandam "" quando o leitor escolhe "Todas". Se isso virasse
    // filtro, a tela ficaria vazia assim que alguém limpasse um campo.
    expect(filtrarAtos(acervo, { categoria: "", ano: "", tema: "", direito: "" })).toHaveLength(4);
    expect(temFiltroAtivo({ categoria: "", ano: "" })).toBe(false);
  });
});

describe("índice fatiado das normas", () => {
  /**
   * Norma sintética do tamanho do que existe: 197 a 206 bytes de ementa por
   * norma foi o que `docs/HANDOFF-PAYLOAD-LEGISLACAO.md` mediu no corpus
   * ambiental (6.378 estaduais + 8.940 federais). Uma em cada seis carrega
   * análise garantista COM trecho citado, que é a parte de texto livre mais
   * cara da linha.
   */
  const norma = (i: number): AtoRow => ({
    id: `ato-${i}`,
    tipo: i % 3 === 0 ? "Lei" : "Decreto",
    numero: String(1000 + i),
    ano: 2015 + (i % 11),
    ementa:
      `Dispõe sobre a alteração do dispositivo ${i} da legislação municipal e dá outras ` +
      `providências correlatas ao ordenamento urbano do município, revogando disposições em contrário.`,
    dataPublicacao: `2026-0${(i % 9) + 1}-15`,
    temas: i % 4 === 0 ? ["saude", "educacao"] : null,
    mapaIdx: i % 20 === 0 ? i : null,
    analise:
      i % 6 === 0
        ? {
            rotulo: "reducionista",
            score: -4,
            direitos: ["saude"],
            itens: [
              {
                direito: "saude",
                dispositivo: `Art. ${i}`,
                direcao: "restringe",
                grau: "moderado",
                trecho: "O atendimento previsto no caput fica condicionado à disponibilidade orçamentária.",
              },
            ],
          }
        : undefined,
  });

  test("nenhuma fatia passa do orçamento — é o teto que o Cloudflare cobra", () => {
    const linhas = Array.from({ length: 20_000 }, (_, i) => norma(i));
    const arquivos = arquivosDoIndice(linhas);
    const m: ManifestoFatias = JSON.parse(arquivos.find((a) => a.nome === NOME_MANIFESTO)!.conteudo);
    for (const bytes of m.bytesPorFatia) expect(bytes).toBeLessThanOrEqual(m.orcamentoBytes);
    // Nenhuma norma é grande a ponto de virar fatia sozinha. Se este aviso
    // aparecer, entrou na linha um texto integral de norma — e aí a decisão é
    // de produto (link em vez de conteúdo), não de orçamento.
    expect(m.avisos).toEqual([]);
  });

  test("as 20 mil normas voltam inteiras e na ordem do `order by`", () => {
    const linhas = Array.from({ length: 20_000 }, (_, i) => norma(i));
    const arquivos = arquivosDoIndice(linhas);
    const remontado = arquivos
      .filter((a) => a.nome !== NOME_MANIFESTO)
      .flatMap((a) => JSON.parse(a.conteudo) as AtoRow[]);
    expect(remontado).toHaveLength(linhas.length);
    // Ordem é requisito: `TabelaEstatica` mostra a fatia 0 como primeira
    // página, e ela só é a primeira de verdade porque o `data_publicacao desc
    // nulls last` já veio pronto do build.
    expect(remontado.map((l) => l.id)).toEqual(linhas.map((l) => l.id));
  });

  test("a análise sobrevive à ida e volta pelo JSON, com os itens", () => {
    // A justificativa é o que separa "rótulo" de "opinião" — se ela não
    // atravessar a serialização, o selo aparece na tela sem nada que o
    // sustente, e o leitor não tem como conferir.
    const arquivos = arquivosDoIndice([norma(0)]);
    const [volta] = JSON.parse(arquivos.find((a) => a.nome === "0.json")!.conteudo) as AtoRow[];
    expect(volta.analise?.rotulo).toBe("reducionista");
    expect(volta.analise?.itens[0].trecho).toContain("disponibilidade orçamentária");
    expect(volta).toEqual(norma(0));
  });

  test("a linha custa centenas de bytes, não milhares", () => {
    // O número que justifica o conserto. Guarda frouxa de propósito: não trava
    // o valor exato, só impede que a linha volte à ordem de grandeza em que a
    // rota publicava 11 MiB de `.cache` em Belo Horizonte.
    const linhas = Array.from({ length: 5_000 }, (_, i) => norma(i));
    const bytesPorLinha = Buffer.byteLength(JSON.stringify(linhas), "utf8") / linhas.length;
    expect(bytesPorLinha).toBeLessThan(500);
  });
});
