"use client";

/**
 * FundoOnda — a grade do `OndaCursor` como FUNDO translúcido de TODO o site.
 *
 * Substitui o antigo `FundoCubos` (dono, 06/10/2026: "trocar os cubes por
 * cursor wave"). Mesmo contrato: camada presa ao viewport, atrás de tudo,
 * `pointer-events: none` e `aria-hidden`, cores do tema, e desligada em
 * movimento reduzido, alto contraste e tela de toque.
 *
 * `grade` 12 dá ~100 px por célula em tela de 1280 (o Cubes chegava a 176 px
 * nos 8×8 anteriores e o dono achou gigante); `--cp-onda-vao` no CSS abre o
 * respiro entre as formas para a grade não virar um bloco sólido.
 */
import OndaCursor from "./OndaCursor";
import { useEfeitoPermitido } from "./useEfeitoPermitido";
import "./OndaCursor.css";

export default function FundoOnda() {
  const permitido = useEfeitoPermitido(true);
  if (!permitido) return null;

  return (
    <div className="cp-fundo-onda" aria-hidden="true">
      <OndaCursor grade={12} raio={3.2} cor="var(--cp-primary)" />
    </div>
  );
}
