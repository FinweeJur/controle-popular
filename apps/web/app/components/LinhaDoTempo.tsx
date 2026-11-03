/**
 * @file LinhaDoTempo.tsx
 * @description Linha do tempo vertical genérica com a estrela que desce no
 * scroll (`ScrollStar`). Recebe os itens por prop e desenha um `<ol>` com
 * trilho contínuo à esquerda; a estrela percorre o trilho conforme a rolagem
 * da página, nunca em animação solta.
 *
 * ═══ ONDE ENTRA ═══
 *
 * Toda linha do tempo ESTÁTICA do portal que caiba no shape abaixo — hoje o
 * histórico do portal (`/historico`). Nas interativas (filtro, busca, grupos
 * por século), a página própria já desenha os itens e apenas envolve o `<ol>`
 * num wrapper `relative` com a ilha `<ScrollStar />` — ver
 * `app/memoria/LinhaDoTempo.tsx`.
 *
 * ═══ POR QUE É COMPONENTE DE SERVIDOR ═══
 *
 * Aqui só o `ScrollStar` é cliente (ilha). O texto dos itens chega pelo RSC
 * payload, legível sem JavaScript e indexável — a estrela é decoração e some
 * com `prefers-reduced-motion`, alto-contraste ou sem JS; a linha continua.
 *
 * Shape fixo por contrato de quem escreve o plano (03/11/2026): itens com
 * `marco` (ano/data), `titulo` e `texto`. Cada item vira `<h2>` — use a
 * componente dentro de uma página com UM `<h1>` (padrão das páginas wiki do
 * portal).
 */

import ScrollStar from "./ScrollStar";
import "./LinhaDoTempo.css";

/** Um item da linha: o marco (ano/data), o título e o texto do fato. */
export interface ItemLinhaDoTempoPortal {
  marco: string;
  titulo: string;
  texto: string;
}

interface Props {
  itens: readonly ItemLinhaDoTempoPortal[];
}

export default function LinhaDoTempo({ itens }: Props) {
  return (
    <div className="linha-do-tempo">
      <ol className="linha-do-tempo__lista">
        {itens.map((item, i) => (
          <li key={`${item.marco}-${item.titulo}-${i}`} className="linha-do-tempo__item">
            <span className="linha-do-tempo__marco">{item.marco}</span>
            <div className="linha-do-tempo__conteudo">
              <h2 className="linha-do-tempo__titulo">{item.titulo}</h2>
              <p className="linha-do-tempo__texto">{item.texto}</p>
            </div>
          </li>
        ))}
      </ol>
      {/* O eixo é o borda do próprio `.linha-do-tempo`: deslocamento 0. */}
      <ScrollStar />
    </div>
  );
}
