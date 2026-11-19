/**
 * @file apps/web/lib/pntp/pagina.test.ts
 * @description Testes das funções puras da página `/cidades/transparencia` e do
 * cartão de PNTP no hub municipal.
 *
 * O que este teste protege, e por quê:
 * - **nulo não é zero**: `itp: null` (Não Avaliado) fica fora da média e sai
 *   como "—" na tela e vazio no CSV. Transformar nulo em 0 diria
 *   "transparência zero" de quem só não entregou o formulário;
 * - **média sempre com N**: a média de 2023 fala de 14 entes, não de MG;
 * - **nulo no fim da ordenação**, nas duas direções;
 * - **CSV com BOM e `;`**, campo com separador entre aspas;
 * - **poder e esfera não se misturam**: o cartão do hub só pega ente
 *   municipal — os seis entes estaduais têm `municipio` "Belo Horizonte" na
 *   planilha da fonte e não podem aparecer como prefeitura da capital.
 *
 * Os números reais conferidos no fim vêm do JSON versionado (mesma fonte de
 * `pntp.test.ts`): 2025 tem 1.581 avaliados e média 54,4; 2023 tem 14.
 */

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  contagemPorNivel,
  entesDaCidade,
  filtrarLinhas,
  formatarItp,
  formatarPct,
  linhasDoAno,
  linhasParaCsv,
  mediaAvaliados,
  mediaAvaliados as media,
  opcoesDe,
  ordenarPorItp,
  resumoDoAno,
  rotuloValidada,
  seriePorAno,
  type AcervoPntp,
  type EntePntp,
  type LinhaPntp,
} from "./pagina";

/** Ente mínimo; cada teste sobrescreve o que importa. */
function ente(parcial: Partial<EntePntp> = {}): EntePntp {
  return {
    ano: 2025,
    orgao: "Prefeitura Municipal de Teste",
    poder: "Executivo",
    esfera: "Municipal",
    estado: "MG",
    municipio: "Teste",
    itp: 50,
    pctEssenciais: 50,
    nivel: "Intermediário",
    validada: true,
    certificavel: false,
    fonte: "https://cdn.atricon.org.br/2026/08/dados_pntp_2025.zip",
    coletadoEm: "2026-11-18T23:49:44Z",
    ...parcial,
  };
}

const linha = (
  orgao: string,
  itp: number | null,
  extras: Partial<Record<"poder" | "esfera" | "municipio" | "nivel" | "validada", unknown>> = {}
): LinhaPntp => [
  orgao,
  (extras.poder as string) ?? "Executivo",
  (extras.esfera as string) ?? "Municipal",
  (extras.municipio as string) ?? "Teste",
  itp,
  itp === null ? null : 60,
  (extras.nivel as string) ?? "Intermediário",
  (extras.validada as boolean | null) ?? true,
];

describe("média só com avaliados", () => {
  it("ignora nulos e devolve o N junto", () => {
    expect(media([80, null, 60, null])).toEqual({ media: 70, n: 2 });
  });

  it("sem avaliado nenhum devolve média nula, não zero", () => {
    expect(media([null, null])).toEqual({ media: null, n: 0 });
    expect(media([])).toEqual({ media: null, n: 0 });
  });

  it("arredonda a 1 decimal, como a fonte publica", () => {
    expect(media([54.44, 54.45, 54.46]).media).toBe(54.5);
    expect(mediaAvaliados([75.06, 75.14]).media).toBe(75.1);
  });

  it("zero é valor, não ausência", () => {
    expect(media([0, 10])).toEqual({ media: 5, n: 2 });
  });
});

describe("resumo do ciclo", () => {
  const entes: EntePntp[] = [
    ente({ municipio: "Alfa", orgao: "Prefeitura de Alfa", itp: 80 }),
    ente({ municipio: "Alfa", orgao: "Câmara de Alfa", poder: "Legislativo", itp: 40 }),
    ente({ municipio: "Beta", orgao: "Prefeitura de Beta", itp: null, nivel: "Não Avaliado" }),
    ente({
      municipio: "Beta",
      orgao: "Câmara de Beta",
      poder: "Legislativo",
      itp: null,
      nivel: "Não Avaliado",
    }),
    ente({
      municipio: "Belo Horizonte",
      orgao: "Governo do Estado",
      poder: "Executivo",
      esfera: "Estadual",
      itp: 90,
    }),
  ];

  it("conta entes, avaliados e não avaliados", () => {
    const resumo = resumoDoAno(entes, 2025);
    expect(resumo.entes).toBe(5);
    expect(resumo.n).toBe(3);
    expect(resumo.naoAvaliados).toBe(2);
    expect(resumo.media).toBe(70);
  });

  it("município é só esfera municipal — ente estadual não conta como município", () => {
    const resumo = resumoDoAno(entes, 2025);
    expect(resumo.municipios).toBe(2);
    expect(resumo.municipiosAvaliados).toBe(1);
    expect(resumo.pctMunicipiosAvaliados).toBe(50);
  });

  it("ciclo sem linha devolve zero sem média", () => {
    const resumo = resumoDoAno(entes, 2019);
    expect(resumo).toMatchObject({ entes: 0, n: 0, media: null, municipios: 0 });
  });
});

describe("série anual", () => {
  it("traz total, avaliados e média por ano, em ordem", () => {
    const serie = seriePorAno([
      ente({ ano: 2024, itp: 60 }),
      ente({ ano: 2023, itp: null, nivel: "Não Avaliado" }),
      ente({ ano: 2024, itp: 80 }),
      ente({ ano: 2023, itp: 70 }),
      ente({ ano: 2022, itp: null, nivel: "Não Avaliado" }),
    ]);
    expect(serie.map((s) => s.ano)).toEqual([2022, 2023, 2024]);
    expect(serie[0]).toMatchObject({ entes: 1, n: 0, media: null });
    expect(serie[1]).toMatchObject({ entes: 2, n: 1, media: 70 });
    expect(serie[2]).toMatchObject({ entes: 2, n: 2, media: 70 });
  });
});

describe("formatação", () => {
  it("nulo vira travessão, nunca zero", () => {
    expect(formatarItp(null)).toBe("—");
    expect(formatarItp(0)).toBe("0,0");
    expect(formatarItp(54.44)).toBe("54,4");
  });

  it("percentual com sinal e vírgula", () => {
    expect(formatarPct(null)).toBe("—");
    expect(formatarPct(62.5)).toBe("62,5%");
  });

  it("marca de validação em palavra", () => {
    expect(rotuloValidada(true)).toBe("Sim");
    expect(rotuloValidada(false)).toBe("Não");
    expect(rotuloValidada(null)).toBe("—");
  });
});

describe("contagem por nível", () => {
  it("conta o selo publicado, sem derivar do índice", () => {
    const contagem = contagemPorNivel([
      ente({ nivel: "Ouro" }),
      ente({ nivel: "Ouro" }),
      ente({ nivel: "Intermediário" }),
      ente({ nivel: "Não Avaliado", itp: null }),
    ]);
    expect(contagem).toEqual([
      { rotulo: "Ouro", total: 2 },
      { rotulo: "Intermediário", total: 1 },
      { rotulo: "Não Avaliado", total: 1 },
    ]);
  });
});

describe("filtro e ordenação", () => {
  const linhas: LinhaPntp[] = [
    linha("Prefeitura Municipal de Araçuaí", 52.3),
    linha("Câmara Municipal de Araçuaí", 56.4, { poder: "Legislativo" }),
    linha("Prefeitura Municipal de Betim", 88.2, { nivel: "Ouro" }),
    linha("Prefeitura Municipal de Serro", null, { nivel: "Não Avaliado" }),
    linha("Governo do Estado de Minas Gerais", 91, { esfera: "Estadual" }),
  ];

  it("busca sem acento acha órgão com acento", () => {
    expect(filtrarLinhas(linhas, { busca: "aracuai" })).toHaveLength(2);
    expect(filtrarLinhas(linhas, { busca: "ARAÇUAÍ" })).toHaveLength(2);
  });

  it("busca cobre município, poder e nível", () => {
    expect(filtrarLinhas(linhas, { busca: "legislativo" })).toHaveLength(1);
    expect(filtrarLinhas(linhas, { busca: "ouro" })).toHaveLength(1);
    expect(filtrarLinhas(linhas, { busca: "serro" })).toHaveLength(1);
  });

  it("faceta de poder, esfera e nível é exata", () => {
    expect(filtrarLinhas(linhas, { poder: "Legislativo" })).toHaveLength(1);
    expect(filtrarLinhas(linhas, { esfera: "Estadual" })).toHaveLength(1);
    expect(filtrarLinhas(linhas, { nivel: "Ouro" })).toHaveLength(1);
    expect(filtrarLinhas(linhas, { poder: "Legislativo", busca: "betim" })).toHaveLength(0);
  });

  it("nulo fica no fim nas duas direções", () => {
    const desc = ordenarPorItp(linhas, "desc");
    const asc = ordenarPorItp(linhas, "asc");
    expect(desc[desc.length - 1][4]).toBeNull();
    expect(asc[asc.length - 1][4]).toBeNull();
    expect(desc[0][4]).toBe(91);
    expect(asc[0][4]).toBe(52.3);
  });

  it("ordem original não é mutada", () => {
    const antes = linhas.map((l) => l[0]);
    ordenarPorItp(linhas, "desc");
    expect(linhas.map((l) => l[0])).toEqual(antes);
  });

  it("opções de filtro saem do próprio recorte, ordenadas", () => {
    expect(opcoesDe(linhas, 2)).toEqual(["Estadual", "Municipal"]);
    expect(opcoesDe(linhas, 1)).toEqual(["Executivo", "Legislativo"]);
    expect(opcoesDe(linhas, 6)).toEqual(["Intermediário", "Não Avaliado", "Ouro"]);
  });
});

describe("CSV", () => {
  const linhas: LinhaPntp[] = [
    linha("Prefeitura Municipal de Betim", 88.2, { nivel: "Ouro" }),
    linha("Prefeitura; Municipal de Teste", null, { nivel: "Não Avaliado", validada: null }),
  ];

  it("começa com BOM e usa ponto e vírgula", () => {
    const csv = linhasParaCsv(linhas, 2025);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split("\n")[0]).toBe(
      "\uFEFFano;orgao;poder;esfera;municipio;itp;pct_essenciais;nivel;validada"
    );
  });

  it("não avaliado sai com célula vazia, nunca 0", () => {
    const [, segunda] = linhasParaCsv(linhas, 2025).split("\n").slice(1);
    const campos = segunda.split(";");
    // O órgão tem ";" e vem entre aspas: 9 colunas viram 10 pedaços crus.
    expect(segunda).toContain('"Prefeitura; Municipal de Teste"');
    expect(campos).toContain("");
    expect(segunda).not.toMatch(/;0;0;/);
  });

  it("escapa aspas duplas", () => {
    const csv = linhasParaCsv([linha('Câmara "Municipal"', 10)], 2025);
    expect(csv).toContain('"Câmara ""Municipal"""');
  });
});

describe("cartão do hub municipal", () => {
  const entes: EntePntp[] = [
    ente({ orgao: "Prefeitura Municipal de Betim", municipio: "Betim", itp: 88.2, nivel: "Ouro" }),
    ente({
      orgao: "Câmara Municipal de Betim",
      municipio: "Betim",
      poder: "Legislativo",
      itp: 73.1,
    }),
    ente({ orgao: "Governo do Estado", municipio: "Belo Horizonte", esfera: "Estadual", itp: 90 }),
    ente({ orgao: "Prefeitura de Belo Horizonte", municipio: "Belo Horizonte", itp: 95 }),
  ];

  it("pega só ente municipal da cidade, prefeitura antes de câmara", () => {
    const deBetim = entesDaCidade(entes, "Betim", 2025);
    expect(deBetim.map((e) => e.poder)).toEqual(["Executivo", "Legislativo"]);
  });

  it("ente estadual não entra no cartão da capital", () => {
    const deBH = entesDaCidade(entes, "Belo Horizonte", 2025);
    expect(deBH).toHaveLength(1);
    expect(deBH[0].orgao).toBe("Prefeitura de Belo Horizonte");
  });

  it("acento e caixa não atrapalham o casamento", () => {
    expect(entesDaCidade(entes, "BELO HORIZONTE", 2025)).toHaveLength(1);
  });

  it("cidade sem avaliação devolve lista vazia", () => {
    expect(entesDaCidade(entes, "São Paulo", 2025)).toEqual([]);
  });
});

// ─── Números reais do arquivo versionado ───────────────────────────────────

const ACERVO = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data", "pntp", "avaliacoes-mg.json"), "utf-8")
) as AcervoPntp;

describe("recorte real de MG", () => {
  it("2025: 1.712 entes, 1.581 avaliados, média 54,4", () => {
    const resumo = resumoDoAno(ACERVO.entes, 2025);
    expect(resumo.entes).toBe(1_712);
    expect(resumo.n).toBe(1_581);
    expect(resumo.media).toBe(54.4);
    expect(resumo.naoAvaliados).toBe(131);
  });

  it("2023 é atípico: 14 avaliados com média 75,1", () => {
    const resumo = resumoDoAno(ACERVO.entes, 2023);
    expect(resumo.n).toBe(14);
    expect(resumo.media).toBe(75.1);
    expect(resumo.entes).toBe(1_712);
  });

  it("2022 tem escopo menor: 150 entes, todos avaliados", () => {
    const resumo = resumoDoAno(ACERVO.entes, 2022);
    expect(resumo.entes).toBe(150);
    expect(resumo.n).toBe(150);
    expect(resumo.naoAvaliados).toBe(0);
  });

  it("853 municípios em 2025, 850 com ao menos um ente avaliado", () => {
    const resumo = resumoDoAno(ACERVO.entes, 2025);
    expect(resumo.municipios).toBe(853);
    expect(resumo.municipiosAvaliados).toBe(850);
    expect(resumo.pctMunicipiosAvaliados).toBe(99.6);
  });

  it("o recorte enviado ao cliente é só 2025 e cabe em menos de 200 KB", () => {
    const linhas = linhasDoAno(ACERVO.entes, 2025);
    expect(linhas).toHaveLength(1_712);
    expect(Buffer.byteLength(JSON.stringify(linhas), "utf-8")).toBeLessThan(200 * 1024);
  });

  it("nenhuma linha de 2025 chega à tela com ITP 0 fingindo avaliação", () => {
    const linhas = linhasDoAno(ACERVO.entes, 2025);
    const naoAvaliados = linhas.filter((l) => l[4] === null);
    expect(naoAvaliados).toHaveLength(131);
    expect(naoAvaliados.every((l) => l[6] === "Não Avaliado")).toBe(true);
  });
});
