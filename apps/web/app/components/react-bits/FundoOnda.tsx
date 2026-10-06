"use client";

/**
 * FundoOnda — a grade do `OndaCursor` como FUNDO translúcido de TODO o site.
 *
 * Substitui o antigo `FundoCubos` (dono, 06/10/2026: "trocar os cubes por
 * cursor wave"). Mesmo contrato: camada presa ao viewport, atrás de tudo,
 * `pointer-events: none` e `aria-hidden`, cores do tema, e desligada em
 * movimento reduzido, alto contraste e tela de toque.
 *
 * `grade` 40 dá ~30 px de passo e ~16 px de quadrado visível numa tela de
 * 1280 (o dono pediu, em 06/10/2026, "10× mais quadrados e 5× menores": eram
 * 144 células de ~87 px, viraram 1.600 de ~16 px). `--cp-onda-vao` no CSS
 * abre o respiro entre as formas.
 */
import OndaCursor from "./OndaCursor";
import { useEfeitoPermitido } from "./useEfeitoPermitido";
import "./OndaCursor.css";

export default function FundoOnda() {
  const permitido = useEfeitoPermitido(true);
  if (!permitido) return null;

  return (
    <div className="cp-fundo-onda" aria-hidden="true">
      {/* Grade 40 (dono, 06/10/2026: "10× mais quadrados e 5× menores"): eram
          144 células de ~87 px; aqui são 1.600 de ~18 px, com os mesmos
          ~93 px de raio de acendimento no ponteiro (por isso `raio` subiu de
          3,2 para 10 células — em px, o valor é o mesmo). O motor mede a grade
          por coluna/linha, então a densidade não vira 1.600 leituras de layout. */}
      <OndaCursor
        grade={40}
        raio={9}
        anel={3}
        raioCelula={2}
        cor="var(--cp-primary)"
      />
    </div>
  );
}
