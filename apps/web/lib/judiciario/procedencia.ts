import type { Nomeacao } from "@/lib/judiciario/tribunais";

// Procedência das indicações — quantas trazem o documento de origem.
//
// Mora aqui, e não dentro da página, pela mesma razão que `agregado.ts`:
// frase de tela é DERIVADA do dado, nunca escrita à mão (regra herdada do
// /congresso, registrada em `etl/judiciario/etl/senado/indicacoes.py`), e
// frase derivada é código testável. Dentro do `page.tsx` ela ficaria fora
// do alcance do vitest, cujo `include` é `lib/**/*.test.ts`.
//
// O problema concreto que ela resolve: o Senado publica `urlDocumento` na
// MINORIA dos processos de indicação — 35 de 130 no corpus de descoberta
// F0 (2003–2026), `docs/judiciario/f0-corpus-indicacoes.json`. Uma frase
// fixa do tipo "toda indicação tem link para o documento" seria falsa hoje,
// e um número escrito à mão ficaria errado assim que o ETL rodasse de novo.

export interface ResumoProcedencia {
  total: number;
  comDocumento: number;
  /** comDocumento / total; 0 quando não há indicação nenhuma. */
  cobertura: number;
  /** Frase pronta para a tela, ou `null` quando não há o que declarar. */
  frase: string | null;
}

export function resumoProcedencia(
  nomeacoes: Pick<Nomeacao, "url_fonte">[] | null | undefined
): ResumoProcedencia {
  const lista = nomeacoes ?? [];
  const total = lista.length;
  // `url_fonte` vazio ou só espaço é ausência de fonte, não fonte — sem o
  // `trim` uma string vazia gravada pelo ETL contaria como documento
  // publicado e inflaria a cobertura declarada na tela.
  const comDocumento = lista.filter((n) => n.url_fonte && n.url_fonte.trim() !== "").length;

  if (total === 0) {
    return { total: 0, comDocumento: 0, cobertura: 0, frase: null };
  }

  const plural = total === 1 ? "indicação listada" : "indicações listadas";
  const frase =
    comDocumento === 0
      ? `Nenhuma das ${total} ${plural} tem o documento publicado pelo Senado: nesses ` +
        `processos o Senado divulga só a identificação (a “MSF”), que é o que fica no ` +
        `lugar do link — o portal não substitui documento ausente por link aproximado.`
      : `${comDocumento} de ${total} ${plural} têm o documento publicado pelo Senado e ` +
        `trazem o link direto acima. Nas demais o Senado divulga só a identificação do ` +
        `processo (a “MSF”), que é o que fica no lugar do link — o portal não substitui ` +
        `documento ausente por link aproximado.`;

  return { total, comDocumento, cobertura: comDocumento / total, frase };
}

/**
 * Fontes de composição de um tribunal, derivadas do `fonte_curadoria` que
 * `etl/composicao.py` grava junto com cada integrante.
 *
 * Deriva em vez de constante escrita nesta base de código porque uma tabela
 * de URLs aqui viraria mentira silenciosa no dia em que o tribunal mudasse
 * a página — e este eixo acabou de pagar o preço de uma afirmação de
 * procedência que o produto não sustentava.
 *
 * O `startsWith("http")` é a guarda que importa: nem todo `fonte_curadoria`
 * é URL. O do STJ é `"stj.jus.br — Composição do STJ (PDF…)"`. Sem a guarda
 * isso viraria `href="stj.jus.br — …"`, que o navegador resolve como
 * caminho RELATIVO ao portal — um link que parece fonte oficial, aponta
 * para dentro do próprio site e leva a lugar nenhum. Num portal que cobra
 * procedência dos outros, isso é pior do que não ter link.
 */
export interface FonteComposicao {
  nome: string;
  url?: string;
}

export function fontesDaComposicao(
  integrantes: { fonte_curadoria?: string | null }[]
): FonteComposicao[] {
  const distintas = [
    ...new Set(
      integrantes
        .map((m) => m.fonte_curadoria?.trim())
        .filter((f): f is string => !!f)
    ),
  ];
  return distintas.map((f) => (f.startsWith("http") ? { nome: f, url: f } : { nome: f }));
}
