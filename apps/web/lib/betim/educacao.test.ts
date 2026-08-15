import { describe, expect, test } from "vitest";
import { resumirGrupos, REDE_LABELS, type EscolaRow, type GrupoRede } from "./educacao";
import { arquivosDoIndice, NOME_MANIFESTO } from "@/lib/estatico/emitir";
import type { ManifestoFatias } from "@/lib/estatico/fatiar";

/**
 * Dois contratos, e os dois nasceram do mesmo conserto: a lista de escolas
 * saiu do HTML da página para um índice fatiado, porque `sp/educacao.cache`
 * publicava 21 MiB contra um teto de 25 MiB.
 *
 * 1. O RESUMO tem de continuar dando os mesmos quatro números. Ele deixou de
 *    ser reduzido sobre as ~10 mil escolas e passou a vir de `group by rede`,
 *    e essa troca é exatamente do tipo que erra em silêncio: um total somado
 *    do conjunto errado continua sendo um número plausível na tela.
 * 2. A LINHA gravada no índice tem de continuar cabendo no orçamento de fatia.
 *    Se um campo novo entrar em `EscolaRow` sem ninguém medir, o arquivo volta
 *    a crescer sem limite — que é o defeito que este trabalho fechou.
 */

const GRUPOS: GrupoRede[] = [
  { rede: "1", qtd: 3, matriculas: 900 },
  { rede: "2", qtd: 120, matriculas: 48_000 },
  { rede: "3", qtd: 540, matriculas: 210_000 },
  { rede: "4", qtd: 260, matriculas: 61_000 },
];

describe("resumirGrupos — os agregados vêm do banco, não das linhas", () => {
  test("soma escolas e matrículas sobre as redes", () => {
    const r = resumirGrupos(GRUPOS);
    expect(r.totalEscolas).toBe(923);
    expect(r.totalMatriculas).toBe(319_900);
  });

  test("uma entrada por rede, com a contagem daquela rede", () => {
    const r = resumirGrupos(GRUPOS);
    expect(r.porRede).toHaveLength(4);
    expect(r.porRede.find((p) => p.rede === "3")?.qtd).toBe(540);
    // A soma das quebras tem de fechar com o total: divergir aqui é a tela
    // dizer "923 escolas" acima de barras que somam outra coisa.
    expect(r.porRede.reduce((a, p) => a + p.qtd, 0)).toBe(r.totalEscolas);
  });

  test("rede nula vira a chave que a tela sabe rotular", () => {
    const r = resumirGrupos([{ rede: null, qtd: 7, matriculas: 0 }]);
    expect(r.porRede[0].rede).toBe("?");
    // `REDE_LABELS` não tem "?" — a tela cai no "Outra" do `??`. O teste trava
    // esse acordo: se alguém passar a gravar "" ou "null", o rótulo muda.
    expect(REDE_LABELS[r.porRede[0].rede]).toBeUndefined();
  });

  test("município sem escola nenhuma dá zero, não NaN", () => {
    const r = resumirGrupos([]);
    expect(r).toEqual({ totalEscolas: 0, totalMatriculas: 0, porRede: [] });
  });

  test("matrícula não informada não contamina o total", () => {
    // `coalesce(sum(...), 0)` no SQL garante 0, nunca null — se essa guarda
    // cair, o total vira NaN e aparece como "NaN" no cartão.
    const r = resumirGrupos([{ rede: "3", qtd: 4, matriculas: 0 }]);
    expect(r.totalMatriculas).toBe(0);
  });
});

describe("índice fatiado das escolas", () => {
  const escola = (i: number): EscolaRow => ({
    id_inep: String(35_000_000 + i),
    nome: `ESCOLA MUNICIPAL DE ENSINO FUNDAMENTAL NUMERO ${i}`,
    rede: String((i % 4) + 1),
    matriculas: 100 + (i % 900),
  });

  test("nenhuma fatia passa do orçamento — é o teto que o Cloudflare cobra", () => {
    const linhas = Array.from({ length: 12_000 }, (_, i) => escola(i));
    const arquivos = arquivosDoIndice(linhas);
    const m: ManifestoFatias = JSON.parse(
      arquivos.find((a) => a.nome === NOME_MANIFESTO)!.conteudo
    );
    for (const bytes of m.bytesPorFatia) expect(bytes).toBeLessThanOrEqual(m.orcamentoBytes);
    // Nenhuma linha de escola é grande a ponto de virar fatia sozinha: se este
    // aviso aparecer, entrou campo de texto livre em `EscolaRow`.
    expect(m.avisos).toEqual([]);
  });

  test("as 12 mil escolas voltam inteiras e na ordem", () => {
    const linhas = Array.from({ length: 12_000 }, (_, i) => escola(i));
    const arquivos = arquivosDoIndice(linhas);
    const remontado = arquivos
      .filter((a) => a.nome !== NOME_MANIFESTO)
      .flatMap((a) => JSON.parse(a.conteudo) as EscolaRow[]);
    expect(remontado).toHaveLength(linhas.length);
    // Ordem é requisito: `TabelaEstatica` mostra a fatia 0 como primeira
    // página, e ela só é a primeira página de verdade se a ordenação
    // alfabética vier pronta do `order by` do build.
    expect(remontado.map((l) => l.id_inep)).toEqual(linhas.map((l) => l.id_inep));
  });

  test("a linha custa dezenas de bytes, não milhares", () => {
    // O número que justifica o conserto: medido em build real desta árvore, a
    // MESMA escola custava 2.200,6 bytes de `.cache` quando era renderizada
    // inline na página (HTML + rsc + segmentData["/_full"], três cópias).
    // Serializada como linha do índice ela custa ~100 bytes. Esta guarda é
    // frouxa de propósito — não trava o valor exato, só impede que a linha
    // volte à ordem de grandeza que estourava o teto.
    const linhas = Array.from({ length: 1000 }, (_, i) => escola(i));
    const bytesPorLinha = Buffer.byteLength(JSON.stringify(linhas), "utf8") / linhas.length;
    expect(bytesPorLinha).toBeLessThan(200);
  });
});
