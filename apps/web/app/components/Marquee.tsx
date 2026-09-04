/**
 * Fita marquee da marca (prévia v7.1, etapa 3 do PLANO-TEMA-PEQUI).
 *
 * ═══ POR QUE CSS PURO ═══
 *
 * A prévia animava `margin-left` com um frame de JavaScript por scroll.
 * O mesmo movimento sai de graça em CSS: o texto vai repetido 2x dentro do
 * trilho, e `translateX(-50%)` fecha um ciclo exato (`.cp-marquee-trilho` em
 * `globals.css`). Zero frame de JS, zero dependência nova — o teto de 3 MiB
 * por rota agradece.
 *
 * ═══ ACESSIBILIDADE ═══
 *
 * `aria-hidden="true"` no componente inteiro: a fita é slogan de marca, não
 * dado — leitor de tela não deve perdê-la frase por frase, e um usuário de
 * tecnologia assistiva não perde informação nenhuma ao ignorá-la.
 * `prefers-reduced-motion` desarma a animação no CSS (a fita fica estática,
 * ainda legível).
 *
 * O texto entra PRONTO (frase repetida pelo chamador ou aqui) porque
 * whitespace-anterior do trilho precisa ser preservado; manter no servidor
 * evita hidratação e não precisa de `"use client"`.
 */

interface MarqueeProps {
  /** Frase-slogan; ela mesma pode conter o separador ✦. */
  frase: string;
  /** Variante sóbria (texto-soft, borda em cima) — prévia `.marquee.alt`. */
  alternativa?: boolean;
  /** Repetições do bloco dentro do trilho (par: 4 é o mínimo honesto). */
  repeticoes?: number;
}

export default function Marquee({ frase, alternativa = false, repeticoes = 4 }: MarqueeProps) {
  const repetido = Array.from({ length: repeticoes }, () => frase).join(" ");
  return (
    <div
      aria-hidden="true"
      className={`cp-marquee${alternativa ? " cp-marquee--alt" : ""}`}
    >
      <span className="cp-marquee-trilho">
        {repetido} {repetido}
      </span>
    </div>
  );
}
