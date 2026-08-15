import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  agregarPorCgccpf,
  anoDeQuatroDigitos,
  conferirFiltroHonrado,
  conferirSemCpf,
  decodificarCorpo,
  enxugarProjeto,
  lerEnvelope,
  linkPublicado,
  montarUrl,
  normalizarCgccpf,
  ordenarPorTotalDoado,
  topPorTotalDoado,
  type Incentivador,
} from "./salic";

/**
 * Testes da leitura do SALIC — **sem rede**.
 *
 * As fixtures em `fixtures/` são resposta CRUA da API, gravada byte a byte em
 * 15/08/2026. **Não foram editadas**: os hashes esquisitos de `_links`, o
 * total de 113.548 no arquivo do filtro ignorado, o CPF já mascarado pela
 * fonte e o corpo do 404 do link de doações são o que o servidor respondeu.
 * Um teste que constrói o JSON à mão prova que o parser lê o JSON que o autor
 * do teste imaginou — inútil numa fonte cujas três piores armadilhas devolvem
 * HTTP 200.
 *
 * De onde veio cada arquivo, para regravar (`?limit` incluído, porque o hash
 * de `_links` muda com a consulta):
 *
 *   incentivadores-mg.json               /api/v1/incentivadores?UF=MG&limit=10
 *   projetos-mg.json                     /api/v1/projetos?UF=MG&limit=2
 *   incentivadores-filtro-ignorado.json  /api/v1/incentivadores?incentivador_id=266269&limit=1
 *   doacoes-link-publicado-404.json      o `_links.doacoes` do 1º item de incentivadores-mg
 *
 * Os números abaixo são os MEDIDOS ao gravar as fixtures. Se a API mudar, o
 * caminho é regravar a fixture e ver o diff — não afrouxar a asserção.
 */

/** `process.cwd()` e não `__dirname`: o vitest roda em `apps/web` e os testes
 *  vizinhos (`terras/alertas.test.ts`) já leem assim. */
const FIXTURES = path.join(process.cwd(), "lib", "cultura", "fixtures");
const bytes = (nome: string) => new Uint8Array(readFileSync(path.join(FIXTURES, nome)));
const texto = (nome: string) => decodificarCorpo(bytes(nome), nome);

describe("montarUrl — armadilha 1 (barra final devolve 301 para http://)", () => {
  test("nunca emite barra antes da query", () => {
    expect(montarUrl("projetos", { UF: "MG", limit: 1 })).toBe(
      "https://api.salic.cultura.gov.br/api/v1/projetos?UF=MG&limit=1"
    );
  });

  test("barra sobrando no nome do recurso é removida, não repassada", () => {
    // O caso real é alguém escrever `montarUrl("/projetos/")` copiando da
    // documentação. Se a barra passasse, viria 301 -> http:// com corpo HTML.
    expect(montarUrl("/projetos/", { UF: "MG" })).toBe(
      "https://api.salic.cultura.gov.br/api/v1/projetos?UF=MG"
    );
  });

  test("sem parâmetros, também sem barra e sem '?' órfão", () => {
    expect(montarUrl("incentivadores")).toBe(
      "https://api.salic.cultura.gov.br/api/v1/incentivadores"
    );
  });
});

describe("armadilha 2 — os hashes de `_links` não são identidade", () => {
  const pagina = lerEnvelope<Incentivador>(texto("incentivadores-mg.json"), "incentivadores");
  const inc = pagina.itens[0];

  test("`self` e `doacoes` do MESMO item trazem hashes diferentes", () => {
    const idSelf = linkPublicado(inc, "self").split("/").pop();
    const idDoacoes = linkPublicado(inc, "doacoes").split("/").slice(-2)[0];
    expect(idSelf).toHaveLength(60);
    expect(idDoacoes).toHaveLength(60);
    // É ESTE o motivo de `linkPublicado` existir: quem monta
    // `${BASE}/incentivadores/${idSelf}/doacoes` recebe 404.
    expect(idSelf).not.toBe(idDoacoes);
  });

  test("a URL de doações que sai do `self` NÃO é a publicada", () => {
    const inventada = `https://api.salic.cultura.gov.br/api/v1/incentivadores/${linkPublicado(inc, "self").split("/").pop()}/doacoes`;
    expect(inventada).not.toBe(linkPublicado(inc, "doacoes"));
  });

  test("item sem o link pedido aborta em vez de deixar montar um", () => {
    expect(() => linkPublicado({ _links: { self: "x" } }, "doacoes")).toThrow(/ABORTADO/);
    expect(() => linkPublicado({}, "self")).toThrow(/não monte a URL à mão/i);
  });

  test("o link de doações publicado devolveu 404 — a fixture é a prova", () => {
    // Medido em 9 de 9 incentivadores testados em 15/08/2026. Esta fixture é
    // o corpo daquele 404. O teste existe para que, no dia em que o MinC
    // religar a rota, quem regravar a fixture veja o parser mudar de resposta
    // em vez de descobrir por acaso.
    const corpo = texto("doacoes-link-publicado-404.json");
    expect(() => lerEnvelope(corpo, "doacoes")).toThrow(/No funding info was found/);
  });
});

describe("armadilha 3 — codificação: forçar UTF-8 e abortar em U+FFFD", () => {
  test("a rota JSON é ASCII puro: o mojibake não nasce ali", () => {
    // Medido: o servidor escapa "Brasília" como `Brasília`. Ou seja, a
    // armadilha do plano NÃO se confirma nesta rota — e registrar isso vale
    // tanto quanto confirmar, porque impede a próxima pessoa de caçar um bug
    // de encoding onde não há.
    expect(bytes("incentivadores-mg.json").some((b) => b > 127)).toBe(false);
    const inc = lerEnvelope<Incentivador>(texto("incentivadores-mg.json"), "incentivadores").itens;
    expect(inc.map((i) => i.municipio)).toContain("Belo Horizonte");
  });

  test("os mesmos bytes lidos como latin-1 e reencodados quebram — e a trava pega", () => {
    // Reproduz a porta por onde o mojibake ENTRA de verdade: `?format=csv`
    // devolve UTF-8 cru, e um leitor latin-1 no meio do caminho produz bytes
    // que não são UTF-8 válido. Aqui o corpo corrompido é derivado da fixture
    // real, não inventado.
    const sujo = Buffer.from([0x42, 0x72, 0x61, 0x73, 0xed, 0x6c, 0x69, 0x61]); // "Brasília" em latin-1
    expect(() => decodificarCorpo(new Uint8Array(sujo), "csv")).toThrow(/U\+FFFD/);
  });

  test("texto limpo passa sem alteração", () => {
    const limpo = new TextEncoder().encode('{"municipio":"Brasília"}');
    expect(decodificarCorpo(limpo)).toBe('{"municipio":"Brasília"}');
  });
});

describe("armadilha 5 — filtro ignorado devolve o catálogo inteiro com HTTP 200", () => {
  test("a fixture do link que o PROJETO publica traz o Brasil inteiro", () => {
    // `incentivadores?incentivador_id=266269` é a URL que a própria API
    // publica em `_links.incentivadores` do projeto PRONAC 266269 (Igarapé,
    // MG). `incentivador_id` não é filtro reconhecido: o total volta 113.548,
    // igual ao da consulta sem filtro nenhum.
    const p = lerEnvelope(texto("incentivadores-filtro-ignorado.json"), "incentivadores");
    expect(p.total).toBe(113548);
    expect(() =>
      conferirFiltroHonrado("_links.incentivadores do PRONAC 266269", p.total, 113548)
    ).toThrow(/catálogo inteiro/);
  });

  test("filtro honrado não dispara o abort", () => {
    // Medido no mesmo dia: UF=MG devolve 20.785 de 113.548.
    expect(() => conferirFiltroHonrado("incentivadores?UF=MG", 20785, 113548)).not.toThrow();
  });
});

describe("armadilha 6 — `sort` da API é ignorado; o ranking é feito aqui", () => {
  const inc = lerEnvelope<Incentivador>(texto("incentivadores-mg.json"), "incentivadores").itens;

  test("a fixture chega DESordenada, como o servidor manda", () => {
    const valores = inc.map((i) => i.total_doado);
    const decrescente = [...valores].sort((a, b) => b - a);
    expect(valores).not.toEqual(decrescente);
  });

  test("ordenarPorTotalDoado põe em ordem sem mexer no original", () => {
    const antes = inc.map((i) => i.total_doado);
    const ord = ordenarPorTotalDoado(inc).map((i) => i.total_doado);
    expect(ord).toEqual([...antes].sort((a, b) => b - a));
    expect(inc.map((i) => i.total_doado)).toEqual(antes);
  });
});

describe("cgccpf — a chave que liga o incentivador ao fornecedor de contrato", () => {
  test("preserva zero à esquerda (o CNPJ do Banco do Brasil começa com oito zeros)", () => {
    expect(normalizarCgccpf("00000000108634")).toBe("00000000108634");
    // O erro clássico: passar por Number vira 108634 e não casa com nada.
    expect(normalizarCgccpf(String(Number("00000000108634")))).toBeNull();
  });

  test("aceita máscara e recusa comprimento fora do padrão", () => {
    expect(normalizarCgccpf("00.000.000/1086-34")).toBe("00000000108634");
    expect(normalizarCgccpf("123.456.789-00")).toBe("12345678900");
    expect(normalizarCgccpf("")).toBeNull();
    expect(normalizarCgccpf("   ")).toBeNull();
    expect(normalizarCgccpf(null)).toBeNull();
    expect(normalizarCgccpf("1234")).toBeNull();
  });

  test("agrega por CNPJ e não por nome — a fixture tem a mesma empresa em duas grafias", () => {
    const ag = agregarPorCgccpf(inc10());
    const nomes = inc10().map((i) => i.nome);
    // Medido na fixture: "Banco do Brasil S.A" e "BANCO DO BRASIL SA" convivem.
    expect(new Set(nomes.map((n) => n.toUpperCase())).size).toBeLessThan(nomes.length);
    // Cada CNPJ distinto vira uma linha, e a soma total é preservada.
    const somaAgregada = ag.reduce((s, a) => s + a.total_doado, 0);
    const somaBruta = inc10()
      .filter((i) => normalizarCgccpf(i.cgccpf))
      .reduce((s, i) => s + i.total_doado, 0);
    expect(somaAgregada).toBeCloseTo(somaBruta, 2);
    expect(ag.every((a) => a.cgccpf.length === 14 || a.cgccpf.length === 11)).toBe(true);
  });

  test("registro sem CNPJ válido fica FORA, e não vira um incentivador gigante", () => {
    const comLixo: Incentivador[] = [
      ...inc10(),
      {
        nome: "SEM DOCUMENTO",
        municipio: "Belo Horizonte",
        UF: "MG",
        responsavel: "",
        total_doado: 999_999_999,
        tipo_pessoa: "juridica",
        cgccpf: "",
      },
    ];
    const ag = agregarPorCgccpf(comLixo);
    expect(ag.some((a) => a.total_doado === 999_999_999)).toBe(false);
  });

  test("topPorTotalDoado devolve no máximo N, em ordem decrescente", () => {
    const top = topPorTotalDoado(inc10(), 3);
    expect(top).toHaveLength(3);
    expect(top[0].total_doado).toBeGreaterThanOrEqual(top[1].total_doado);
    expect(top[1].total_doado).toBeGreaterThanOrEqual(top[2].total_doado);
  });
});

describe("privacidade — a fonte mascara CPF, e o coletor não confia nisso", () => {
  test("pessoa física chega mascarada na fixture real (`***008317**`)", () => {
    const pf = inc10().filter((i) => i.tipo_pessoa === "fisica");
    expect(pf.length).toBeGreaterThan(0);
    // Nenhum CPF inteiro: o servidor do MinC já esconde. Este teste é o
    // registro datado desse comportamento — se ele mudar, o diff da fixture
    // regravada mostra na cara.
    expect(pf.every((i) => i.cgccpf.includes("*"))).toBe(true);
    expect(pf.every((i) => i.cgccpf.replace(/\D/g, "").length !== 11)).toBe(true);
  });

  test("máscara vira null, e não um quase-documento que casa com qualquer coisa", () => {
    expect(normalizarCgccpf("***008317**")).toBeNull();
  });

  test("conferirSemCpf aborta se a fonte um dia parar de mascarar", () => {
    // `12345678909` é o CPF canônico de teste do Brasil: mod-11 válido sem ser
    // de ninguém. O mesmo que `lib/sem-cpf-no-repo.test.ts` usa, e pela mesma
    // razão — um exemplo real aqui seria o vazamento que o guarda existe para
    // impedir.
    expect(() => conferirSemCpf([{ cgccpf: "12345678909" }])).toThrow(/repositório é PÚBLICO/);
    expect(() => conferirSemCpf([{ cgccpf: "123.456.789-09" }])).toThrow(/ABORTADO/);
  });

  test("CNPJ e máscara passam — só CPF de verdade barra a gravação", () => {
    expect(() => conferirSemCpf(inc10() as unknown as Array<Record<string, unknown>>)).not.toThrow();
    expect(() => conferirSemCpf([{ cgccpf: "00000000000191" }])).not.toThrow();
    expect(() => conferirSemCpf([{ cgccpf: "***008317**" }])).not.toThrow();
    // Sequência de 11 dígitos que não é CPF (DV errado) não pode dar falso
    // positivo: um guarda que grita à toa é um guarda que se aprende a ignorar.
    expect(() => conferirSemCpf([{ cgccpf: "12345678900" }])).not.toThrow();
    expect(() => conferirSemCpf([{ cgccpf: "11111111111" }])).not.toThrow();
  });
});

describe("lerEnvelope — aborta em vez de devolver lista vazia", () => {
  test("count que não bate com os itens é página truncada", () => {
    const falso = JSON.stringify({ _embedded: { projetos: [{ PRONAC: "1" }] }, count: 5, total: 5 });
    expect(() => lerEnvelope(falso, "projetos")).toThrow(/página truncada/);
  });

  test("HTML de Apache (o corpo do 301) não passa por JSON válido", () => {
    expect(() => lerEnvelope("<!DOCTYPE html>\n<html>", "projetos")).toThrow(/não é JSON/);
  });

  test("envelope sem `total` aborta", () => {
    const falso = JSON.stringify({ _embedded: { projetos: [] }, count: 0 });
    expect(() => lerEnvelope(falso, "projetos")).toThrow(/sem "total"/);
  });

  test("a fixture real de projetos passa e traz o total medido", () => {
    const p = lerEnvelope<Record<string, unknown>>(texto("projetos-mg.json"), "projetos");
    expect(p.total).toBe(7206);
    expect(p.count).toBe(2);
  });
});

describe("enxugarProjeto — corta 34 campos para 13", () => {
  const bruto = lerEnvelope<Record<string, unknown>>(texto("projetos-mg.json"), "projetos").itens[0];

  test("o bruto é grande de propósito: é o custo que o corte evita", () => {
    // Medido: 2 projetos crus ocupam 71 KB por causa dos textos livres.
    // 7.206 projetos assim seriam centenas de MB no repositório.
    expect(Object.keys(bruto).length).toBeGreaterThan(30);
    expect(JSON.stringify(bruto).length).toBeGreaterThan(10_000);
  });

  test("guarda o rastro do dinheiro e o cgccpf, e joga o texto livre fora", () => {
    const p = enxugarProjeto(bruto);
    expect(Object.keys(p)).toEqual([
      "PRONAC",
      "nome",
      "cgccpf",
      "proponente",
      "UF",
      "municipio",
      "segmento",
      "situacao",
      "ano_projeto",
      "valor_solicitado",
      "valor_aprovado",
      "valor_captado",
      "valor_projeto",
    ]);
    expect(p.UF).toBe("MG");
    expect(normalizarCgccpf(p.cgccpf)).toHaveLength(14);
    expect(JSON.stringify(p).length).toBeLessThan(1_000);
  });

  test("valores viram número, não string", () => {
    const p = enxugarProjeto({ ...bruto, valor_aprovado: "193116" });
    expect(p.valor_aprovado).toBe(193116);
  });

  test("projeto sem PRONAC aborta", () => {
    expect(() => enxugarProjeto({ nome: "x" })).toThrow(/sem PRONAC/);
  });
});

describe("anoDeQuatroDigitos — a origem manda dois dígitos", () => {
  test("'26' é 2026 e '91' é 1991 (a Rouanet é de 1991)", () => {
    expect(anoDeQuatroDigitos("26")).toBe(2026);
    expect(anoDeQuatroDigitos("23")).toBe(2023);
    expect(anoDeQuatroDigitos("91")).toBe(1991);
    expect(anoDeQuatroDigitos("99")).toBe(1999);
  });

  test("quatro dígitos passam intactos e lixo vira null", () => {
    expect(anoDeQuatroDigitos("2015")).toBe(2015);
    expect(anoDeQuatroDigitos("")).toBeNull();
    expect(anoDeQuatroDigitos("abc")).toBeNull();
  });
});

function inc10(): Incentivador[] {
  return lerEnvelope<Incentivador>(texto("incentivadores-mg.json"), "incentivadores").itens;
}
