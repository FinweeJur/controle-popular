import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";

import {
  carregarAlertasSigmine,
  carregarAlertaTiMancha,
  carregarAlertaQuilombolaMancha,
  carregarAtosAreaProtegida,
} from "./alertas";

/**
 * Este arquivo NÃO lê `public/terras/globo/**` para escrever nada — só para
 * comparar o que `alertas.ts` devolveu contra o arquivo bruto, a mesma
 * disciplina de `taxa-erro-g0.test.ts` e `zonas.test.ts`: os números abaixo
 * são o que foi MEDIDO ao escrever este teste (13/08), não uma expectativa
 * inventada. Se a outra frente reprocessar as camadas e a contagem mudar,
 * este teste quebra — de propósito, para quem atualiza o número ver o que
 * mudou, em vez de a página envelhecer em silêncio.
 */

const DIR = path.join(process.cwd(), "public/terras/globo/dados/camadas");

interface FeatureCollectionBruta {
  features: Array<{ properties: Record<string, unknown> }>;
}

function lerBruto(nome: string): FeatureCollectionBruta {
  const caminho = path.join(DIR, nome);
  const bruto = nome.endsWith(".gz")
    ? gunzipSync(readFileSync(caminho))
    : readFileSync(caminho);
  return JSON.parse(bruto.toString("utf-8")) as FeatureCollectionBruta;
}

describe("alerta território × SIGMINE — operação (lavra autorizada)", () => {
  const bruto = lerBruto("alerta-territorio-sigmine-operacao.geojson");
  const lista = carregarAlertasSigmine("operacao");

  test("a contagem bate com o arquivo, não é digitada", () => {
    expect(lista.itens).toHaveLength(bruto.features.length);
    // ═══ SENTINELA, e ela JÁ TRABALHOU ═══
    //
    // A primeira asserção acima é a que importa de verdade: a lista tem que
    // ter o mesmo tamanho do arquivo, seja ele qual for. As duas abaixo são
    // sentinela — existem para AVISAR quando o número muda, não para
    // congelá-lo. Se você está lendo esta linha por causa de um teste
    // vermelho, confira se a mudança era esperada e atualize de propósito.
    //
    // ⟲ 13/08, algumas horas depois de escrita: caiu de 1.203,5 para 1.202,9
    // ha. A causa é boa — os territórios quilombolas deixaram de ser a
    // poligonal herdada do projeto irmão e passaram a ser a oficial do
    // Acervo Fundiário do INCRA, que traz nome, município e fase. Geometria
    // oficial diferente dá área de interseção ligeiramente diferente. A
    // CONTAGEM de sobreposições não mudou (12), o que é o sinal de que não
    // se perdeu nem se inventou alerta: só a medida ficou mais exata.
    // ⟲ 13/08, fim do dia: 12 → 21 sobreposições, 1.202,9 → 1.539,4 ha.
    // NÃO é dado novo do SIGMINE: é a unificação das três camadas de
    // território quilombola numa só. Uma delas nunca era cruzada com nada,
    // e por isso 9 sobreposições existiam no dado e não apareciam — entre
    // elas lavra de OURO autorizada sobre São Domingos e Machadinho.
    // Conceito partido em três arquivos estava escondendo alerta.
    expect(lista.itens.length).toBe(21);
    expect(+lista.areaTotalHa.toFixed(1)).toBe(1539.4);
  });

  test("cada item some a mesma área que o feature bruto", () => {
    const somaBruta = bruto.features.reduce(
      (s, f) => s + (f.properties.area_intersecao_ha as number),
      0
    );
    expect(+lista.areaTotalHa.toFixed(2)).toBe(+somaBruta.toFixed(2));
  });

  test("território sem nome vem com motivo explicado, nunca em branco", () => {
    const semNome = lista.itens.filter((i) => i.territorioNome === null);
    for (const item of semNome) {
      expect(item.territorioTipo).toBe("quilombola");
      expect(item.semNomeMotivo).toBeTruthy();
      expect(item.semNomeMotivo).toContain("sem campo de nome");
    }
  });

  test("o deep-link do mapa aponta para a MESMA feição em sigmine-operacao.geojson", () => {
    const sigmineOperacao = lerBruto("sigmine-operacao.geojson");
    for (const item of lista.itens) {
      expect(item.mapa).not.toBeNull();
      expect(item.mapa!.camada).toBe("sigmine-operacao");
      const feicao = sigmineOperacao.features[item.mapa!.idx];
      expect(feicao.properties.processo).toBe(item.sigmineProcesso);
    }
  });
});

describe("alerta território × SIGMINE — interesse (requerimento, risco futuro)", () => {
  const bruto = lerBruto("alerta-territorio-sigmine-interesse.geojson");
  const lista = carregarAlertasSigmine("interesse");

  test("a contagem bate com o arquivo, não é digitada", () => {
    expect(lista.itens).toHaveLength(bruto.features.length);
    // Medido em 13/08: 195 sobreposições.
    // ⟲ Mesma causa da unificação: 195 → 271.
    expect(lista.itens.length).toBe(271);
  });

  test("o deep-link do mapa aponta para a MESMA feição em sigmine-interesse", () => {
    const sigmineInteresse = lerBruto("sigmine-interesse.geojson.gz");
    // Amostra, não todas as 195: descomprimir de novo por item seria caro à
    // toa — a rota que interessa é a mesma função de índice usada por todo
    // mundo, então uma amostra já pega qualquer erro sistemático.
    const amostra = lista.itens.slice(0, 20);
    for (const item of amostra) {
      expect(item.mapa).not.toBeNull();
      expect(item.mapa!.camada).toBe("sigmine-interesse");
      const feicao = sigmineInteresse.features[item.mapa!.idx];
      expect(feicao.properties.processo).toBe(item.sigmineProcesso);
    }
  }, 20_000);
}, 20_000);

describe("TI × mancha de barragem — zero medido, não zero suposto", () => {
  test("universo é 16 terras indígenas × barragens com mancha publicada", () => {
    const r = carregarAlertaTiMancha();
    expect(r.vazio).toBe(true);
    expect(r.qtdFeaturesEncontradas).toBe(0);
    // Medido em 13/08: 16 terras indígenas, 156 barragens com mancha.
    expect(r.qtdTerritorios).toBe(16);
    expect(r.qtdBarragensComManchaPublicada).toBe(156);
    expect(r.universoCombinacoes).toBe(16 * 156);
  });
});

describe("quilombola × mancha de barragem — DEIXOU DE SER ZERO", () => {
  test("universo cobre a fonte única de território quilombola", () => {
    const r = carregarAlertaQuilombolaMancha();
    // ⟲ 13/08, fim do dia — E ESTA É A MUDANÇA QUE MAIS IMPORTA DO DIA.
    // Este alerta era ZERO e deixou de ser. Não porque a FEAM publicou
    // mancha nova: porque as três camadas de território quilombola foram
    // unificadas, e a que continha estes territórios NUNCA era cruzada com
    // nada. São 6 interseções em 3 territórios — AMAROS e MACHADINHO
    // (Paracatu) e SÃO SEBASTIÃO (Patos de Minas / Presidente Olegário) —,
    // todos "RTID publicado, em titulação": reconhecidos pelo INCRA e ainda
    // sem título definitivo.
    //
    // Território quilombola dentro da área que a água alcança se a barragem
    // romper. Estava no dado o tempo todo, invisível por causa de como o
    // dado estava dividido.
    expect(r.vazio).toBe(false);
    expect(r.qtdFeaturesEncontradas).toBe(6);
    // ⟲ 13/08, fim do dia: eram três fontes (2 + 12 + 13) e viraram UMA,
    // com 27 polígonos. O universo cresce e o resultado continua ZERO —
    // que é o que dá valor ao zero: ele foi medido de novo, sobre mais
    // território, e seguiu zero.
    expect(r.qtdTerritorios).toBe(27);
    expect(r.qtdBarragensComManchaPublicada).toBe(156);
    expect(r.universoCombinacoes).toBe(27 * 156);
  });

  test("os 6 itens saem do arquivo, com 3 territórios distintos", () => {
    const r = carregarAlertaQuilombolaMancha();
    expect(r.itens).toHaveLength(6);
    // Medido em 15/08: AMAROS (2 interseções), MACHADINHO (1) e SÃO
    // SEBASTIÃO (3) — contados por nome único, não por feature.
    expect(r.qtdTerritoriosAtingidos).toBe(3);
    expect(r.itens.filter((i) => i.territorioNome === "AMAROS")).toHaveLength(2);
    expect(r.itens.filter((i) => i.territorioNome === "MACHADINHO")).toHaveLength(1);
    expect(r.itens.filter((i) => i.territorioNome === "SÃO SEBASTIÃO")).toHaveLength(3);
    // Medido em 15/08, somando as 6 area_intersecao_ha do arquivo bruto.
    expect(+r.areaTotalHa.toFixed(1)).toBe(3192.1);
  });

  test("o deep-link aponta para a MESMA feição em mancha-inundacao-barragens", () => {
    const r = carregarAlertaQuilombolaMancha();
    const mancha = lerBruto("mancha-inundacao-barragens.geojson.gz");
    for (const item of r.itens) {
      expect(item.mapa).not.toBeNull();
      expect(item.mapa!.camada).toBe("mancha-inundacao-barragens");
      const feicao = mancha.features[item.mapa!.idx];
      expect(feicao.properties.estrutura).toBe(item.barragem);
    }
  });
});

describe("normas que mexem em área protegida", () => {
  const lista = carregarAtosAreaProtegida();

  test("a contagem de normas soma os arrays de cada município, não é digitada", () => {
    // Medido em 13/08: 3 municípios com feição neste GeoJSON (dos 6 com
    // legislação coletada — os outros três não têm norma sobre área
    // protegida), 8 normas ao todo.
    expect(lista.municipios).toHaveLength(3);
    expect(lista.totalNormas).toBe(8);
  });

  test("toda norma tem link_fonte para conferir na origem", () => {
    for (const m of lista.municipios) {
      for (const n of m.normas) {
        expect(n.linkFonte).toMatch(/^https?:\/\//);
      }
    }
  });

  test("o deep-link do mapa aponta para o contorno do MESMO município em municipios-mg", () => {
    const municipiosMg = lerBruto("municipios-mg.geojson");
    for (const m of lista.municipios) {
      expect(m.mapa).not.toBeNull();
      expect(m.mapa!.camada).toBe("municipios-mg");
      const feicao = municipiosMg.features[m.mapa!.idx];
      expect(feicao.properties.geocodigo).toBe(m.geocodigo);
    }
  });
});
