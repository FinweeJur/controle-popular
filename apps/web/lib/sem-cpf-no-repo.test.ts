import { describe, expect, test } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Nenhum CPF de pessoa real pode entrar em arquivo versionado.
 *
 * ═══ POR QUE ESTE TESTE EXISTE ═══
 *
 * Em 12/08 uma varredura de segurança encontrou **cinco** CPFs válidos de
 * pessoas reais em arquivos já publicados no `origin/main` — e este é um
 * repositório PÚBLICO. Dois vinham colados a nome completo:
 * `"<NOME COMPLETO> <11 dígitos>"`, em `ambiental_licenciamento.py`; outros
 * dois eram autuados do IBAMA, em `ibama_fiscalizacao.py`; o quinto estava
 * numa tabela de fontes em `docs/ambiental/F0-discovery.md`.
 *
 * A ironia diz tudo sobre como isso acontece: os CPFs estavam no **comentário
 * que documenta a função que remove CPFs**. Alguém mediu o vazamento na base
 * real, colou o exemplo verdadeiro para justificar a proteção, e o exemplo
 * virou o vazamento. Ninguém revisa comentário procurando dado pessoal.
 *
 * O projeto já tinha defesa em profundidade no caminho do DADO — lista branca
 * de colunas na exportação, `PROIBIDOS` barrando campo com nome de autuado,
 * `_sanitizar_nome` no coletor. Nenhuma delas olha para CÓDIGO-FONTE. Esta
 * olha.
 *
 * ═══ O QUE ELE ACEITA ═══
 *
 * CNPJ é dado público de empresa e continua liberado. CPF sintético
 * (`000.000.000-00`, `00000000000`) passa, porque é o substituto que o
 * conserto usou e precisa continuar podendo ilustrar formato.
 *
 * O teste valida por **mod-11**: só reprova número que seria um CPF de
 * verdade. Sequência de 11 dígitos que é código IBGE, protocolo ou id não
 * dispara.
 */

/** Dígitos verificadores de CPF. Falso para os 11-dígitos-iguais. */
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

/**
 * Só arquivos de CÓDIGO e DOC. Fica de fora o que é dado coletado de fonte
 * pública — `.geojson`, `.csv` e as migrations de carga têm regra própria, no
 * pipeline, e varrer megabyte de dado a cada `npm test` tornaria a suíte
 * inútil de lenta. O alvo aqui é o que uma PESSOA escreveu à mão.
 */
const EXTENSOES = ["*.ts", "*.tsx", "*.js", "*.mjs", "*.py", "*.md", "*.sql", "*.json"];

/**
 * CPF sintético usado de propósito — para ilustrar formato, ou para testar o
 * próprio validador.
 *
 * `12345678909` é o CPF canônico de teste do Brasil: passa no mod-11 sem ser de
 * ninguém. Precisa estar aqui **justamente porque é válido** — sem a isenção,
 * este arquivo se reprovaria, já que o teste da régua (mais abaixo) usa esse
 * número como exemplo de "válido".
 *
 * ⚠️ ESTA LISTA TEM UMA GÊMEA em `scripts/checar-dado-pessoal.py` (`SINTETICOS`),
 * que é a versão usada pelo hook de pre-push e pela CI. Elas JÁ DIVERGIRAM: o
 * `12345678909` foi acrescentado lá e esquecido aqui, e a suíte quebrou no
 * primeiro merge seguinte. Mexeu numa, mexa na outra.
 *
 * Duas implementações existem por um motivo real — o hook precisa rodar em
 * repositório sem Node, e o teste precisa rodar no `npm test`. O preço é este:
 * mantê-las de acordo é trabalho manual.
 */
const SINTETICOS = new Set([
  "00000000000", "000.000.000-00",
  "11111111111",
  "12345678900",
  "12345678909", "123.456.789-09",
  // 47018614139: agregado financeiro do SIAFI (R$ bi) capturado como inteiro
  // pelo grep — mod-11 passa por coincidência, mas é dinheiro, não CPF.
  "47018614139",
  // 00003106705: código IBGE de Betim com zeros à esquerda (artefato do
  // validate-docbr citado em docstring da guarda Python) — mod-11 passa por
  // coincidência, é município, não CPF.
  "00003106705",
]);

describe("nenhum CPF real em arquivo versionado", () => {
  test("varre o que é escrito à mão e valida por mod-11", () => {
    const raiz = path.resolve(__dirname, "..", "..", "..");

    let saida = "";
    try {
      saida = execFileSync(
        "git",
        [
          // `[0-9]` e NAO `\d`: `git grep -E` é POSIX ERE, que não conhece
          // `\d` — a primeira versão deste teste usava `\d`, não casava nada, e
          // passava verde com CPF real no repositório. Guarda cego é pior que
          // guarda nenhum, porque dá a sensação de estar protegido.
          // As duas primeiras alternativas capturam o NÚMERO INTEIRO quando os
          // 11 dígitos são parte de um decimal — sem elas, `\b[0-9]{11}\b`
          // casava dentro de `47018614139.37967` (R$ 47 bi liquidados no
          // SIAFI), porque o `.` conta como fronteira de palavra. O filtro
          // logo abaixo descarta esses. Guarda que grita com valor monetário
          // treina todo mundo a ignorar o alerta — e aí o CPF real passa.
          "grep", "-hoIE", String.raw`[0-9]{11}\.[0-9]+|[0-9]+\.[0-9]{11}\b|\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b|\b[0-9]{11}\b`,
          "--", ...EXTENSOES,
          ":!*package-lock.json", ":!**/node_modules/**", ":!*.next/**",
          ":!*.open-next/**", ":!out/**", ":!**/busca-indice/**",
        ],
        { cwd: raiz, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      );
    } catch (e: unknown) {
      // `git grep` sai com 1 quando não casa nada — é o caso bom.
      const err = e as { status?: number; stdout?: string };
      if (err.status !== 1) throw e;
      saida = err.stdout ?? "";
    }

    const reais = [...new Set(
      saida.split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        // Ponto sem hífen = número decimal, não CPF. CPF formatado tem os
        // dois (`123.456.789-09`); valor monetário tem só o ponto.
        .filter((n) => !(n.includes(".") && !n.includes("-")))
        .filter((n) => !SINTETICOS.has(n))
        .filter((n) => cpfValido(n.replace(/\D/g, ""))),
    )];

    expect(
      reais,
      `CPF válido em arquivo versionado — este repositório é PÚBLICO.\n`
      + `Troque por 000.000.000-00 antes de commitar.\n`
      + `Encontrados: ${reais.join(", ")}`,
    ).toEqual([]);
  }, 30000);

  test("a régua do mod-11 funciona nos dois sentidos", () => {
    // Sem isto, um bug no validador faria o teste acima passar sempre — que é
    // o pior modo de falha possível para um guarda de privacidade.
    // `12345678909` e nao um dos que vazaram: o CPF canonico de teste do
    // Brasil e mod-11 valido sem ser de ninguem. A primeira versao deste
    // arquivo usava aqui um dos CPF REAIS que o commit estava removendo --
    // o teste que guarda contra CPF real carregando um CPF real, pela
    // mesma logica que criou o vazamento original: "e so um exemplo".
    expect(cpfValido("12345678909")).toBe(true);
    expect(cpfValido("00000000000")).toBe(false);  // o substituto sintético
    expect(cpfValido("11111111111")).toBe(false);  // dígitos repetidos
    expect(cpfValido("12345678900")).toBe(false);  // DV errado
    expect(cpfValido("3106200")).toBe(false);      // código IBGE, não é CPF
  });
});
