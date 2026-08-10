/**
 * O objeto de um contrato ou licitação, inteiro quando o leitor quiser.
 *
 * ═══ POR QUE ESTE COMPONENTE EXISTE ═══
 *
 * Até 2026-08-10 as duas telas usavam um `line-clamp-3` seco. O objeto saía
 * cortado com reticências e **não havia como ler o resto** — nem ali, nem em
 * lugar nenhum no caso de contratos, porque o link para o PNCP também não
 * existia (`link_fonte` era nulo em 1.268 de 1.268 linhas).
 *
 * Medido no banco: o objeto tem 205 caracteres em média e chega a 1.207. Numa
 * coluna de três linhas, isso é a maior parte do texto escondida — inclusive
 * em contrato marcado com alerta, que é exatamente onde o leitor precisa ler
 * a frase inteira antes de concluir qualquer coisa.
 *
 * ═══ POR QUE `<details>`, E NÃO ESTADO DE REACT ═══
 *
 * Estas tabelas são pré-renderizadas e as páginas são estáticas
 * (`output: 'export'` / SSG no Worker). O expansor precisa funcionar antes da
 * hidratação e mesmo sem JavaScript — `<details>` funciona nos dois casos, e
 * um `useState` não.
 */

/** Acima disto o texto passa de três linhas e ganha o expansor.
 *
 *  Aproximado de propósito: a largura da coluna varia com a tela. Errar para
 *  menos custa um expansor que abre pouca coisa; errar para mais esconderia
 *  texto de novo, que é o defeito que isto conserta.
 */
export const OBJETO_LONGO = 170;

export default function ObjetoExpansivel({ texto }: { texto: string | null | undefined }) {
  if (!texto) return <span className="text-text-soft">—</span>;
  if (texto.length <= OBJETO_LONGO) return <span className="text-text-soft">{texto}</span>;
  return (
    <details className="group">
      <summary className="cursor-pointer list-none">
        <span className="line-clamp-3 text-text-soft group-open:line-clamp-none">{texto}</span>
        <span className="mt-0.5 block text-[.8em] font-medium text-primary">
          <span className="group-open:hidden">mostrar o texto inteiro</span>
          <span className="hidden group-open:inline">mostrar menos</span>
        </span>
      </summary>
    </details>
  );
}
