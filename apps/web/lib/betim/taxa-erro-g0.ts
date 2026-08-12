/**
 * A taxa de erro do vazio cadastral, e o critério contra o qual ela é medida.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE SOZINHO ═══
 *
 * A constante morava em `lib/betim/terras.ts`, e o cabeçalho dela dizia — com
 * todas as letras — que era constante única "para a tela por cidade e o hub da
 * zona não poderem divergir".
 *
 * Divergiram. Em 12/08 uma checagem de fato encontrou `"30% da amostra checada
 * a olho não se confirmou"` DIGITADO À MÃO em `lib/zonas.ts`, no card da porta
 * de entrada — o texto que mais gente lê. `TAXA_ERRO_G0` era importada por um
 * único componente (`TaxaDeErroTerras.tsx`). Ou seja: o modo de falha que o
 * comentário jurava não existir estava no ar, e teria sobrevivido em silêncio à
 * próxima rodada do gate G0, quando a taxa mudar.
 *
 * A causa não foi descuido, foi ACOPLAMENTO. `terras.ts` abre com
 * `import * as q from "@/lib/db/queries/terras"`, e `lib/zonas.ts` é lido por
 * toda página do portal: importar a constante de lá arrastaria a camada de
 * banco para dentro de tudo. Quem escreveu o card fez a única coisa barata que
 * restava — copiar o número.
 *
 * Por isso a constante ficou num arquivo SEM NENHUM IMPORT. Qualquer módulo
 * pode lê-la sem carregar nada junto, e a razão de copiar o número deixa de
 * existir. `terras.ts` a reexporta, para quem já importava de lá continuar
 * funcionando.
 */

export const TAXA_ERRO_G0 = {
  falsoPositivos: 12,
  julgados: 40,
  /** 12/40 */
  taxaPct: 30.0,
  ic95: [18.1, 45.4] as const,
  criterioPct: 33,
  medidoEm: "2026-08-09",
  /** O erro tem causa única, e isso é informação útil para quem lê. */
  causaDominante:
    "faixa de estrada entrando no polígono — 18 dos 18 falso-positivos, somando os dois recortes",
  /**
   * Recorte DIRIGIDO (compactas ≥ 100 ha), julgado em 2026-08-12.
   *
   * Campo separado e nunca somado ao de cima: descreve o melhor caso do
   * método, não a taxa. Ver o bloco de comentário acima.
   */
  dirigido: {
    falsoPositivos: 6,
    julgados: 23,
    /** 6/23 */
    taxaPct: 26.1,
    medidoEm: "2026-08-12",
  },
  /**
   * A correção da causa única JÁ EXISTE no pipeline — e ainda NÃO está no dado
   * que este portal publica.
   *
   * Em 2026-08-12 a faixa de via virou exclusão de produção no pipeline
   * (camadas de sistema viário do IDE-Sisema, largura vinda do dado). Medido
   * em Jaboticatubas: −6,8% de área e +105 polígonos, porque a estrada PARTE o
   * polígono em dois — a assinatura do erro parcial sendo desfeito.
   *
   * Mas aplicar isso à bacia inteira exige rebaixar o CAR dos 56 municípios,
   * que leva horas. Até essa rodada acontecer, as camadas publicadas aqui são
   * as de ANTES da correção, e ainda contêm os corredores de estrada que o
   * gate diagnosticou.
   *
   * Isto está escrito na tela, e não só aqui. Um portal que cobra procedência
   * dos outros não pode publicar um defeito que ele mesmo já diagnosticou,
   * mediu e sabe corrigir, sem dizer que ele está ali.
   */
  correcaoNoDadoPublicado: false,
};
