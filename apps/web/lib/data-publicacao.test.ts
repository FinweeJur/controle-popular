/**
 * Testes de `lib/data-publicacao.ts` — a data que a faixa global
 * "site em desenvolvimento ... Última atualização" mostra no topo de toda
 * página.
 *
 * O que se garante aqui não é a data do build (isso é papel do
 * `next.config.ts`, e em teste não há build): é que a FUNÇÃO de formatação
 * devolve data brasileira com fuso fixo de Brasília. Fuso é o detalhe que
 * quebra em silêncio — sem `timeZone` fixo, o mesmo ISO vira 30/09 em esteira
 * UTC e 01/10 em esteira em Brasília, e a faixa passaria a anunciar um dia de
 * publicação que não aconteceu.
 */
import { describe, expect, it } from "vitest";

import { DATA_PUBLICACAO_ISO, formatarDataPublicacao } from "./data-publicacao";

describe("formatarDataPublicacao", () => {
  it("devolve dd/mm/aaaa", () => {
    const data = formatarDataPublicacao("2026-10-01T12:00:00.000Z");
    expect(data).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it("usa o fuso de Brasília, não o da máquina que builda", () => {
    // 03:30Z de 01/10 = 00:30 de 01/10 em Brasília (UTC-3).
    // Em UTC o dia ainda seria 30/09; o fuso fixo é o que salva a data.
    const iso = "2026-10-01T03:30:00.000Z";
    expect(formatarDataPublicacao(iso)).toBe("01/10/2026");
    // E o inverso: 00:30Z de 01/10 = 21:30 de 30/09 em Brasília.
    expect(formatarDataPublicacao("2026-10-01T00:30:00.000Z")).toBe(
      "30/09/2026",
    );
  });

  it("é tolerante a ISO malformada sem derrubar a faixa", () => {
    // Dado ruim na tela vira "Invalid Date" — quebraria a faixa inteira em
    // toda página. O formato segue sendo consumível; o portal prefere aviso
    // ruim a página quebrada.
    expect(formatarDataPublicacao("nao-e-data")).toBe("Invalid Date");
  });
});

describe("DATA_PUBLICACAO_ISO", () => {
  it("é um ISO válido, mesmo fora do Next", () => {
    // Fora do build não há `DATA_PUBLICACAO` no ambiente e a constante cai no
    // `new Date()`. O que importa é que em QUALQUER dos dois caminhos o valor
    // se comporte como data.
    expect(Number.isNaN(Date.parse(DATA_PUBLICACAO_ISO))).toBe(false);
  });
});
