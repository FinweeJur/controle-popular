import { describe, it, expect } from "vitest";
import { semAcento, separarPalavras, distancia, tolerancia } from "./normalizar";
import { interpretarConsulta, buscar, type IndiceBusca } from "./indice";

/**
 * Índice de teste montado à mão, com os radicais que o PostgreSQL 18.4 devolve
 * de verdade (conferidos com `ts_lexize('portuguese_stem', ...)` sobre o texto
 * JÁ SEM ACENTO — que é a ordem que o servidor usa desde a migration `0046`):
 *
 *     iluminacao -> iluminaca      saude -> saud        lei -> lei
 *     leis       -> leis           contratos -> contrat
 */
const LEXEMAS = ["iluminaca", "saud", "lei", "leis", "contrat", "public", "ambiental", "47", "4793", "pl", "mental"];
const id = (l: string) => LEXEMAS.indexOf(l);

const INDICE: IndiceBusca = {
  lexemas: LEXEMAS,
  formas: {
    iluminacao: id("iluminaca"),
    saude: id("saud"),
    lei: id("lei"),
    leis: id("leis"),
    contrato: id("contrat"),
    contratos: id("contrat"),
    publica: id("public"),
    publicas: id("public"),
    ambiental: id("ambiental"),
    47: id("47"),
    4793: id("4793"),
    pl: id("pl"),
    // O doc 2 escreve "mental" na ementa, então o gerador indexa o radical —
    // e a exclusão (Fase 2) só acha o doc pela lista de ocorrências da forma.
    mental: id("mental"),
  },
  ocorrencias: [
    [1], // iluminaca
    [2, 3], // saud
    [1], // lei
    [4], // leis
    [3], // contrat
    [1, 4], // public
    [5], // ambiental
    [6], // 47 — artigo/emenda solto na ementa do doc 6, NAO e a mesma proposicao que "4793"
    [2], // 4793 — numero proprio da PL 3611/2023 (extra do gerador, ver gerador.ts)
    [2], // pl — abreviacao de tipo (extra do gerador)
    [2], // mental — ementa "Politica de saude mental"
  ],
  docs: [
    { i: 1, t: "Lei 1.234/2020", e: "Dispoe sobre a iluminacao publica", h: "/a/1", f: "cidades", m: "betim", a: ["urbanismo"], d: "2020-01-01" },
    { i: 2, t: "PL 3611/2023", e: "Politica de saude mental", h: "/c/2", f: "congresso", d: "2023-05-02" },
    { i: 3, t: "Contrato 55", e: "Contratos de saude suplementar", h: "/a/3", f: "cidades", m: "bh", d: "2021-03-03" },
    { i: 4, t: "Consolidacao das leis", e: "Leis publicas municipais", h: "/a/4", f: "cidades", m: "betim", d: "2019-07-07" },
    { i: 5, t: "Norma ambiental", e: "Licenciamento ambiental", h: "/a/5", f: "cidades", m: "betim", d: "2022-02-02" },
    { i: 6, t: "Decreto 9", e: "Altera o artigo 47 do regimento", h: "/a/6", f: "cidades", m: "betim", d: "2018-01-01" },
  ],
};

const ids = (r: ReturnType<typeof buscar>) => r.map((x) => x.doc.i).sort();

describe("semAcento", () => {
  it("tira acento, til e cedilha", () => {
    expect(semAcento("Iluminação Pública")).toBe("iluminacao publica");
    expect(semAcento("SAÚDE")).toBe("saude");
    expect(semAcento("cidadãos")).toBe("cidadaos");
  });

  // `ª`/`º` não são diacríticos: sobrevivem ao NFD e viravam lixo na consulta.
  it("normaliza ordinais, para '1ª via' casar com '1a via'", () => {
    expect(semAcento("1ª via")).toBe("1a via");
    expect(semAcento("3º andar")).toBe("3o andar");
  });
});

describe("separarPalavras", () => {
  // O jeito OFICIAL de citar uma norma é o que mais aparece em documento — e
  // era justamente o que a busca ingênua não achava.
  it("quebra numero de norma com ponto e barra", () => {
    expect(separarPalavras("Lei 1.234/2020")).toEqual(["lei", "1234", "2020"]);
  });

  it("hifen vira separador, para compra-e-venda casar com 'compra e venda'", () => {
    expect(separarPalavras("compra-e-venda")).toEqual(["compra", "e", "venda"]);
    expect(separarPalavras("meio-ambiente")).toEqual(["meio", "ambiente"]);
  });

  it("separa numero colado em letra", () => {
    expect(separarPalavras("art5")).toEqual(["art", "5"]);
    expect(separarPalavras("PL3611")).toEqual(["pl", "3611"]);
  });

  // Achado 21.4: a regra antiga apagava o ponto E a vírgula com a mesma
  // expressão, e "1,5 leitos" casava com "15 leitos" — outro número, na mesma
  // tela. Só o padrão de milhar pt-BR é apagado.
  it("virgula decimal nao vira outro numero", () => {
    expect(separarPalavras("1,5 leitos")).toEqual(["1", "5", "leitos"]);
    expect(separarPalavras("15 leitos")).toEqual(["15", "leitos"]);
    expect(separarPalavras("1.5 leitos")).toEqual(["1", "5", "leitos"]);
  });

  it("ponto de milhar continua sumindo, inclusive em cadeia", () => {
    expect(separarPalavras("Lei 1.234.567/1998")).toEqual(["lei", "1234567", "1998"]);
  });
});

describe("tolerancia a erro de digitacao", () => {
  it("palavra curta nao ganha tolerancia", () => {
    // Com 3 letras, distancia 1 transformaria "lei" em "leo"/"rei"/"les".
    expect(tolerancia("lei")).toBe(0);
    expect(tolerancia("saude")).toBe(1);
    expect(tolerancia("licitacoes")).toBe(2);
  });

  it("distancia corta cedo quando passa do limite", () => {
    expect(distancia("saude", "saude")).toBe(0);
    expect(distancia("sáude", "saude", 2)).toBeLessThanOrEqual(2);
    expect(distancia("abacaxi", "lei", 2)).toBeGreaterThan(2);
  });
});

describe("interpretarConsulta", () => {
  it("separa frase entre aspas dos termos soltos", () => {
    const { termos, frases } = interpretarConsulta('"iluminacao publica" saude');
    expect(frases).toEqual(["iluminacao publica"]);
    expect(termos.map((t) => t.palavra)).toEqual(["saude"]);
  });

  it("reconhece exclusao com hifen na frente", () => {
    const { termos } = interpretarConsulta("saude -mental");
    expect(termos).toEqual([
      { palavra: "saude", negado: false },
      { palavra: "mental", negado: true },
    ]);
  });
});

describe("buscar", () => {
  it("acha pelo radical exato", () => {
    expect(ids(buscar("contratos", INDICE))).toEqual([3]);
  });

  // O ponto do exercicio inteiro: quem digita sem acento tem de achar.
  it("acha digitando SEM acento o que esta escrito COM acento", () => {
    expect(ids(buscar("iluminação", INDICE))).toEqual([1]);
    expect(ids(buscar("iluminacao", INDICE))).toEqual([1]);
  });

  // Buraco medido do radicalizador: `lei -> lei` e `leis -> leis`.
  // Sem casamento por prefixo, "leis" nao acharia "lei" e vice-versa.
  it("cobre o buraco do plural que o radicalizador deixa", () => {
    expect(ids(buscar("leis", INDICE))).toContain(1);
    expect(ids(buscar("lei", INDICE))).toContain(4);
  });

  it("perdoa erro de digitacao quando nada casa exatamente", () => {
    const r = buscar("saúdi", INDICE);
    expect(ids(r)).toEqual([2, 3]);
    // A tela precisa poder avisar que corrigiu.
    expect(r[0].aproximados.length).toBeGreaterThan(0);
  });

  it("nao usa aproximacao quando o exato existe", () => {
    const r = buscar("saude", INDICE);
    expect(r.every((x) => x.aproximados.length === 0)).toBe(true);
  });

  it("soma termos em E, nao em OU", () => {
    // 3 tem "contrat" e "saud"; 2 so tem "saud".
    expect(ids(buscar("contratos saude", INDICE))).toEqual([3]);
  });

  it("frase entre aspas exige as palavras juntas", () => {
    expect(ids(buscar('"iluminacao publica"', INDICE))).toEqual([1]);
    expect(ids(buscar('"publica iluminacao"', INDICE))).toEqual([]);
  });

  it("exclusao remove o documento", () => {
    expect(ids(buscar("saude", INDICE))).toEqual([2, 3]);
    expect(ids(buscar("saude -mental", INDICE))).toEqual([3]);
  });

  it("titulo pesa mais que ementa", () => {
    const r = buscar("contrato", INDICE);
    expect(r[0].doc.i).toBe(3); // "Contrato 55" no titulo
  });

  it("filtra por municipio e por tema sem palavra-chave", () => {
    expect(ids(buscar("", INDICE, { municipio: "betim" }))).toEqual([1, 4, 5, 6]);
    expect(ids(buscar("", INDICE, { tema: "urbanismo" }))).toEqual([1]);
  });

  it("filtro e busca textual se somam", () => {
    expect(ids(buscar("saude", INDICE, { municipio: "bh" }))).toEqual([3]);
  });

  it("consulta sem resultado devolve lista vazia, nao o acervo", () => {
    expect(buscar("zzzzqqqq", INDICE)).toEqual([]);
  });

  // Bug 2: "47" (radical solto no doc 6) tem folga de 2 digitos com "4793"
  // (o numero da PL 3611/2023, doc 2) — o laco de vizinho morfologico
  // tratava isso como "mesma palavra, sufixo de plural" antes do guard de
  // numero puro. Medido no acervo real: 19 resultados errados em Cidades.
  it("numero puro nao casa por vizinho morfologico (Bug 2)", () => {
    expect(ids(buscar("4793", INDICE))).toEqual([2]);
    expect(ids(buscar("4793", INDICE))).not.toContain(6);
  });

  it("PL 3611 acha a proposicao pelo tipo + numero, nao pela ementa (Bug 1+2)", () => {
    // "pl" e "4793" so existem no indice como extras do gerador (numero e
    // abreviacao de tipo do proprio documento) — nenhum dos dois aparece na
    // ementa "Politica de saude mental". Sem os dois bugs corrigidos, essa
    // busca devolvia zero (Bug 1: "pl" sem fallback zera a consulta inteira
    // em E) ou os documentos errados (Bug 2).
    expect(ids(buscar("pl 4793", INDICE))).toEqual([2]);
  });
});

/**
 * Fase 2 da revisão de código (parte 21). Os dois índices abaixo existem
 * separados de propósito: mexer no `INDICE` de cima quebraria 15 asserções
 * que já conferem aquilo ali, e aqui só interessa UM defeito por vez.
 */

/** Índice para frase exata: só os docs interessam — frase não usa `formas`. */
const INDICE_FRASE: IndiceBusca = {
  lexemas: [],
  formas: {},
  ocorrencias: [],
  docs: [
    { i: 1, t: "Norma urbana", e: "Meio-ambiente e desenvolvimento", h: "/a/1", f: "cidades" },
    { i: 2, t: "Lei 1.234/2020", e: "Dispoe sobre a procuradoria", h: "/a/2", f: "cidades" },
    { i: 3, t: "Outra norma", e: "Meio ambiente urbano sem hifen", h: "/a/3", f: "cidades" },
  ],
};

/** Índice para exclusão: `leitura` CONTÉM `lei` como subcadeia, e não é `lei`. */
const INDICE_NEGATIVOS: IndiceBusca = {
  lexemas: ["saude", "lei", "leitura"],
  formas: { saude: 0, lei: 1, leitura: 2 },
  ocorrencias: [[1, 2, 3], [3], [2]],
  docs: [
    { i: 1, t: "Hospital", e: "Atendimento de saude no municipio", h: "/a/1", f: "cidades" },
    { i: 2, t: "Rede de leitura", e: "Saude e leitura na comunidade", h: "/a/2", f: "cidades" },
    { i: 3, t: "Lei municipal", e: "Lei de saude publica", h: "/a/3", f: "cidades" },
  ],
};

describe("buscar — texto normalizado igual ao da consulta (Fase 2)", () => {
  // Achado 21.1: a consulta já saía como "meio ambiente"/"1234" e o texto era
  // conferido COM ACENTO e COM PONTUAÇÃO. O leitor digitava a própria frase do
  // documento e recebia zero.
  it("frase exata casa texto com hifen e com numero de norma", () => {
    expect(ids(buscar('"meio ambiente"', INDICE_FRASE))).toEqual([1, 3]);
    expect(ids(buscar('"1.234"', INDICE_FRASE))).toEqual([2]);
  });

  // Achado 21.2: exclusão era `texto.includes(palavra)` — SUBCADEIA. O doc 2
  // tem "leitura" e nunca teve "lei", mas saía mesmo assim.
  it("exclusao e por palavra inteira, nao por substring", () => {
    expect(ids(buscar("saude -lei", INDICE_NEGATIVOS))).toEqual([1, 2]);
    // e a exclusão continua funcionando para quem tem a palavra de verdade
    expect(ids(buscar("saude -leitura", INDICE_NEGATIVOS))).toEqual([1, 3]);
  });

  // O MESMO defeito do lado de dentro do achado 21.2: o bônus de título era
  // `titulo.includes(palavra)`, e "Rede de leitura" ganhava +6 numa busca por
  // "lei". Os três docs casam os mesmos dois radicais; só o que está NO
  // TÍTULO pode receber o bônus.
  it("titulo da bonus pelo radical, nao por subcadeia", () => {
    const INDICE_TITULO: IndiceBusca = {
      lexemas: ["saude", "leitura", "lei"],
      formas: { saude: 0, leitura: 1, lei: 2 },
      ocorrencias: [[1, 2, 3], [2], [1, 2, 3]],
      docs: [
        { i: 1, t: "Lei municipal de saude", e: "A lei dispoe sobre atendimento", h: "/a/1", f: "cidades" },
        { i: 2, t: "Rede de leitura", e: "Saude, leitura e a lei do municipio", h: "/a/2", f: "cidades" },
        { i: 3, t: "Ato normativo", e: "Saude, leitura e lei na comunidade", h: "/a/3", f: "cidades" },
      ],
    };
    const r = buscar("saude lei", INDICE_TITULO);
    expect(r.map((x) => x.doc.i)).toEqual([1, 2, 3]);
    // doc 1 tem os dois radicais no título: +6 cada.
    // doc 2 e doc 3 empatam: nenhum dos dois tem radical NO título. Com a
    // regra antiga, "leitura" pagava o bônus de "lei" e o 2 saía à frente.
    expect(r[1].pontos).toBe(r[2].pontos);
    expect(r[0].pontos).toBe(r[1].pontos + 12);
  });
});
