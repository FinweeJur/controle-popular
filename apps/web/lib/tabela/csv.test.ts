import { describe, it, expect } from "vitest";
import { formatarCsv, type ColunaCsv } from "./csv";

describe("Exportador de CSV", () => {
  interface ItemExemplo {
    id: number;
    nome: string;
    municipio: string;
    valor: number;
    detalhe?: string;
  }

  const colunas: ColunaCsv<ItemExemplo>[] = [
    { chave: "id", rotulo: "Código" },
    { chave: "nome", rotulo: "Nome do Empreendimento" },
    { chave: "municipio", rotulo: "Município" },
    {
      chave: "valor",
      rotulo: "Valor (R$)",
      formatar: (v) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    },
    { chave: "detalhe", rotulo: "Observações" },
  ];

  const linhas: ItemExemplo[] = [
    {
      id: 1,
      nome: 'Mina "Esperança"',
      municipio: "Belo Horizonte",
      valor: 1500000.5,
      detalhe: "Licença concedida; pendente TAC",
    },
    {
      id: 2,
      nome: "Barragem Central",
      municipio: "Betim",
      valor: 200000,
      detalhe: "Sem pendências\nSegunda linha",
    },
  ];

  it("deve iniciar com o BOM UTF-8 (\\uFEFF) e usar ponto e vírgula como separador", () => {
    const csv = formatarCsv(colunas, linhas);
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const linhasCsv = csv.slice(1).split("\r\n");
    expect(linhasCsv[0]).toBe(
      "Código;Nome do Empreendimento;Município;Valor (R$);Observações"
    );
  });

  it("deve escapar aspas duplas e valores com quebra de linha ou separador", () => {
    const csv = formatarCsv(colunas, linhas);
    const semBom = csv.slice(1);

    // Aspas escapadas como ""
    expect(semBom).toContain('"Mina ""Esperança"""');

    // Ponto e vírgula dentro do campo escapado com aspas externas
    expect(semBom).toContain('"Licença concedida; pendente TAC"');

    // Valor formatado em pt-BR
    expect(semBom).toContain("1.500.000,50");
  });
});
