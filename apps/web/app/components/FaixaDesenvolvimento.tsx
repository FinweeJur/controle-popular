/**
 * Faixa global de aviso, colada ACIMA da navbar (`TopNav.tsx`) em toda
 * página — `app/layout.tsx` é o único lugar que a renderiza, então não há
 * como esquecer uma rota.
 *
 * ## Por que existe
 *
 * O portal está em construção pública: acervo sendo conferido, coleta em
 * curso, revisão de código acontecendo. Número publicado com cara de definitivo
 * é lido como definitivo, e quem chega sob estresse — denúncia, remoção,
 * barragem — não lê asterisco. Dizer isso em uma frase no topo de toda página
 * é mais honesto (e mais barato) do que descobrir depois que um dado provisório
 * foi citado como fato.
 *
 * É a mesma família de `AvisoColetaEmCurso.tsx`, mas com papel diferente:
 * aquele avisa do ESCOPO do dado ("é o que coletamos até agora"), esta avisa do
 * ESTADO DO SITE ("ainda estamos construindo"). O aviso de escopo continua
 * sendo da página, não daqui — a faixa não o substitui.
 *
 * ## Decisões de desenho
 *
 * - **Não é `sticky`.** A navbar é `sticky top-0`; se a faixa também fosse,
 *   as duas brigariam pelo mesmo pixel e a altura teria que ser medida em
 *   CSS. Ela rola junto com o conteúdo e reaparece em toda página nova.
 * - **Servidor puro, sem `'use client'`.** Não há interação: é texto fixo
 *   com uma data. Sem JS extra no caminho crítico e sem risco de divergência
 *   de hidratação, porque não hidrata.
 * - **`text-sm` (14px), não `text-xs`.** A regra do portal contra letra miúda
 *   vale para quem lê sob estresse, e esta faixa é o primeiro texto do site.
 *   "Pequena" se refere à altura da faixa, não ao corpo da letra.
 * - **Cor de alerta a 10%** (`bg-alert/10` + `text-alert`), o mesmo par que os
 *   selos da própria navbar usam — em todos os temas (claro, escuro, daltônico,
 *   alto contraste) o `--cp-alert` já vem com a razão de contraste anotada em
 *   `app/globals.css`.
 *
 * A data vem de `lib/data-publicacao.ts`, congelada no build.
 */
import {
  DATA_PUBLICACAO_ISO,
  formatarDataPublicacao,
} from "@/lib/data-publicacao";

export default function FaixaDesenvolvimento() {
  const data = formatarDataPublicacao(DATA_PUBLICACAO_ISO);

  return (
    <aside
      aria-label="Aviso: site em desenvolvimento"
      className="border-b border-alert/30 bg-alert/10 px-4 py-1.5 text-center text-sm text-alert"
    >
      Site em desenvolvimento, aberto para acesso, colaboração e revisão. Os
      dados ainda estão sendo conferidos e podem conter erros.{" "}
      <time dateTime={DATA_PUBLICACAO_ISO.slice(0, 10)}>
        Última atualização: {data}
      </time>
    </aside>
  );
}
