import { beforeAll, describe, expect, test } from "vitest";
import { carregarNormasDeExemplo, montarDocumento, indexarDocumentoDeExemplo, buscarMaisSimilar } from "./demonstracao";
import { fatiarTexto } from "./pedacos";
import { OLLAMA_BASE_URL, ollamaDisponivel } from "./ollama";

/**
 * A PROVA fim-a-fim: documento real -> fatiar -> vetorizar -> perguntar ->
 * o pedaço certo vence por similaridade de cosseno. Sem geração de
 * resposta (sem LLM) — só a metade "vetorizar + buscar" do RAG, que é o
 * escopo desta tarefa.
 *
 * Duas partes, como em `ollama.test.ts`:
 *
 * 1. Sobre o DOCUMENTO em si — carregamento, texto, fatiamento — não usa
 *    rede, roda sempre. Inclui a checagem de dado pessoal (mod-11) sobre o
 *    texto REAL carregado, porque `demonstracao.ts` explica por que este
 *    arquivo (`etl/betim/dados/legislacao-mma.json`) está FORA do alcance
 *    de `scripts/checar-dado-pessoal-em-dado.py` (só varre `apps/web/data`
 *    e `docs/dados`) — a alegação "sem CPF aqui" vira teste, não só
 *    comentário (mesma disciplina de `docs/DESENVOLVIMENTO.md`: "armadilha
 *    vira teste, não comentário").
 * 2. Sobre o PIPELINE contra o Ollama real — pulado (não falha) se esta
 *    máquina não tiver o servidor de pé, mesmo padrão de `ollama.test.ts`.
 */

// Mesmo algoritmo de `lib/sem-cpf-no-repo.test.ts` (mod-11) — duplicado de
// propósito: aquele arquivo varre CÓDIGO/DOC escrito à mão via `git grep`;
// isto varre o TEXTO CARREGADO em runtime de um arquivo fora do alcance da
// guarda automática (ver docstring acima). São alvos diferentes, então não
// há um jeito de só importar a função de lá sem também importar a varredura
// inteira de arquivo — a mesma razão pela qual `SINTETICOS` já existe
// duplicado (TS aqui, Python no hook) no restante do repositório.
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

describe("documento de exemplo — carregamento e fatiamento (sem rede)", () => {
  test("carrega ao menos uma norma real do arquivo fonte", () => {
    const normas = carregarNormasDeExemplo();
    expect(normas.length).toBeGreaterThan(0);
    // Todo item do recorte precisa mesmo citar a barragem de Fundão — se
    // isto falhar, o filtro (ou o arquivo fonte) mudou de forma que
    // silenciosamente puxa norma errada para a demonstração.
    for (const n of normas) expect(n.ementa?.toLowerCase()).toContain("barragem de fund");
  });

  test("nenhuma sequência de 11 dígitos nas ementas carregadas é CPF válido (mod-11)", () => {
    const normas = carregarNormasDeExemplo();
    const digitosEncontrados = normas.flatMap((n) => (n.ementa ?? "").match(/\d{11}/g) ?? []);
    const cpfsReais = digitosEncontrados.filter(cpfValido);
    expect(
      cpfsReais,
      `CPF válido encontrado na ementa de uma norma pública — não deveria existir. Achados: ${cpfsReais.join(", ")}`
    ).toEqual([]);
  });

  test("a régua do mod-11 não está cega (self-test, mesmo formato de sem-cpf-no-repo.test.ts)", () => {
    expect(cpfValido("12345678909")).toBe(true);
    expect(cpfValido("00000000000")).toBe(false);
  });

  test("montarDocumento produz um parágrafo por norma, ementa e identificação juntas", () => {
    const normas = carregarNormasDeExemplo();
    const documento = montarDocumento(normas);
    expect(documento.split(/\n\s*\n/)).toHaveLength(normas.length);
    for (const n of normas) {
      expect(documento).toContain(`${n.tipo} nº ${n.numero}, de ${n.ano}`);
      expect(documento).toContain(n.ementa);
    }
  });

  test("fatiarTexto sobre o documento real produz um pedaço por norma (nenhuma ementa passa de 120 palavras)", () => {
    const normas = carregarNormasDeExemplo();
    const pedacos = fatiarTexto(montarDocumento(normas));
    // Cada norma vira exatamente um pedaço porque cada ementa, com a
    // identificação colada, fica abaixo do `maxPalavras` padrão (120) —
    // medido em 22/08/2026: a mais longa (Portaria MMA 1419/2025) tem 106
    // palavras. Se uma norma futura for mais longa que isso, este teste
    // falha e avisa que a regra 2 (janela deslizante) de `pedacos.ts`
    // entrou em ação — não é bug, mas muda a contagem abaixo.
    expect(pedacos).toHaveLength(normas.length);
  });
});

const OLLAMA_DISPONIVEL = await ollamaDisponivel();
if (!OLLAMA_DISPONIVEL) {
  console.warn(`[demonstracao.test.ts] Ollama local não respondeu em ${OLLAMA_BASE_URL} — pulando a prova fim-a-fim do pipeline.`);
}

describe.skipIf(!OLLAMA_DISPONIVEL)("pipeline real: fatiar + vetorizar + buscar (Ollama local)", () => {
  let indice: Awaited<ReturnType<typeof indexarDocumentoDeExemplo>>;

  beforeAll(async () => {
    indice = await indexarDocumentoDeExemplo();
  }, 30_000);

  test("o documento real foi indexado: um vetor por pedaço, mesma dimensão em todos", () => {
    expect(indice.pedacos.length).toBeGreaterThan(1); // >1: senão "qual pedaço vence" não diz nada
    expect(indice.vetores).toHaveLength(indice.pedacos.length);
    const dimensao = indice.vetores[0].length;
    expect(dimensao).toBeGreaterThan(0);
    for (const v of indice.vetores) expect(v.length).toBe(dimensao);
  });

  /**
   * As três perguntas abaixo foram ESCOLHIDAS depois de rodar o pipeline de
   * verdade (script de exploração, descartado — não faz parte do módulo) e
   * ver o ranking real: cada uma mira um fato que aparece em SÓ uma das
   * quatro normas do recorte (Subcomitê Ambiental só na Portaria MMA
   * 1419/2025; "GT Rio Doce" só na Portaria MMA 513/2023; "impactos
   * ambientais" só na Recomendação 8/2017 — a frase aparece literalmente
   * na ementa). Uma quarta hipótese ("qual norma foi revogada?") NÃO deu
   * o pedaço esperado nessa mesma exploração — o embedding não faz
   * casamento de palavra-chave, pesou o assunto geral (barragem de Fundão)
   * mais que o fato específico "revogado". Por honestidade ficou de fora
   * das afirmações abaixo em vez de forçar um caso que não se sustentou.
   */
  test.each([
    ["qual portaria cria o Subcomitê Ambiental?", "1419"],
    ["qual ato institui um grupo de trabalho sobre o Rio Doce?", "513"],
    ["quais são os impactos ambientais do rompimento da barragem?", "8"],
  ])('pergunta "%s" -> vence o pedaço da norma nº %s', async (pergunta, numeroEsperado) => {
    const ranking = await buscarMaisSimilar(pergunta, indice);
    expect(ranking.length).toBe(indice.pedacos.length);
    // ranking está ordenado do maior score pro menor — checagem própria,
    // não confiança cega no que `buscarMaisSimilar` diz que fez.
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].score).toBeGreaterThanOrEqual(ranking[i].score);
    }
    const vencedor = ranking[0];
    expect(vencedor.texto).toContain(`nº ${numeroEsperado}, de`);
    // Score real de similaridade de cosseno tem de estar no intervalo
    // válido — proteção contra um bug em `similaridadeCosseno` que
    // devolvesse, por exemplo, o produto interno cru sem normalizar.
    expect(vencedor.score).toBeGreaterThan(-1);
    expect(vencedor.score).toBeLessThanOrEqual(1);
  }, 30_000);
});
