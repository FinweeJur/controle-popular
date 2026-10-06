"use client";

/**
 * FundoOnda — a grade do `OndaCursor` como FUNDO translúcido de TODO o site.
 *
 * Substitui o antigo `FundoCubos` (dono, 06/10/2026: "trocar os cubes por
 * cursor wave"). Mesmo contrato: camada presa ao viewport, atrás de tudo,
 * `pointer-events: none` e `aria-hidden`, cores do tema, e desligada em
 * movimento reduzido, alto contraste e tela de toque.
 *
 * A malha é desenhada em CSS (dois gradientes num elemento) e o brilho é
 * recortado por ela — então a densidade não custa DOM nem `will-change` em
 * milhares de nós. Ajuste pelo `passo` (px entre linhas) e pelo `raio` (px do
 * brilho do cursor).
 */
import OndaCursor from "./OndaCursor";
import { useEfeitoPermitido } from "./useEfeitoPermitido";
import "./OndaCursor.css";

export default function FundoOnda() {
  const permitido = useEfeitoPermitido(true);
  if (!permitido) return null;

  return (
    <div className="cp-fundo-onda" aria-hidden="true">
      {/* Malha fina e OCA (dono, 06/10/2026: "bem mais quadrados, 2× menores e
          só o contorno"): passo de 10 px com linha de 1 px — ~9 px de quadrado
          vazio, contra os ~16 px preenchidos de antes. O brilho do cursor foi
          a 24 px (4× menor) e o dono achou pequeno demais: ficou em 55 px, o
          meio do caminho entre os ~93 px originais e os 24 px. */}
      <OndaCursor
        passo={10}
        espessura={1}
        raio={55}
        anel={16}
        cor="var(--cp-primary)"
        corBorda="var(--cp-border)"
      />
    </div>
  );
}
