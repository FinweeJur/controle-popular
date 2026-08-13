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
    expect(lista.itens.length).toBe(12);
    expect(+lista.areaTotalHa.toFixed(1)).toBe(1202.9);
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
    expect(lista.itens.length).toBe(195);
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

describe("quilombola × mancha de barragem — zero medido, não zero suposto", () => {
  test("universo soma as duas fontes de território quilombola", () => {
    const r = carregarAlertaQuilombolaMancha();
    expect(r.vazio).toBe(true);
    expect(r.qtdFeaturesEncontradas).toBe(0);
    // Medido em 13/08: territorios-quilombolas (2) + …-vales (12) = 14.
    expect(r.qtdTerritorios).toBe(14);
    expect(r.qtdBarragensComManchaPublicada).toBe(156);
    expect(r.universoCombinacoes).toBe(14 * 156);
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
