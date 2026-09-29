/**
 * Memória e cultura das cidades — o bloco "Já aconteceu aqui" do painel
 * municipal (`app/[municipio]/page.tsx`).
 *
 * Este arquivo agora é só uma PONTE. A copy e as guardas moraram aqui até
 * 29/09/2026; o plano `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md` levou o
 * conteúdo para o módulo `lib/memoria/`, com as quatro camadas (país,
 * região, UF e município). Manter uma segunda cópia aqui garantiria
 * deriva — a correção de um fato histórico teria de ser feita em dois
 * lugares, e alguém faria em um só.
 *
 * A assinatura pública é a mesma de antes: `memoriaDaCidade(slug)`.
 * A regra editorial também continua valendo: marco histórico só publica
 * com fonte local fechada; `memoria: null` faz o cartão renderizar só a
 * cultura. As seis cidades e os textos exatos seguem em
 * `lib/memoria/camadas.ts` (`MEMORIA_CIDADES_LEGADO`), incluindo as três
 * pendentes (Betim, Araçuaí e Itinga).
 */

export { memoriaDaCidade } from "./memoria";
export type { MemoriaCidade } from "./memoria/tipos";
