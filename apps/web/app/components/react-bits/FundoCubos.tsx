"use client";

/**
 * FundoCubos — a grade de Cubes como FUNDO translúcido de TODO o site.
 *
 * Pedido do dono (06/10/2026): "cubes reativos como fundo vazio do site, um
 * pouco translúcido e de acordo com as cores do tema". É a camada que ocupa o
 * vazio atrás do conteúdo, presa ao viewport (não rola com a página) e que
 * reage ao ponteiro sem roubar nenhum clique.
 *
 * Decisões (por quê entre parênteses):
 * 1. `aria-hidden` + `pointer-events: none`: é decoração — não entra na
 *    árvore de acessibilidade nem no caminho do clique (o Cubes ouve o
 *    `document`, então reage sem precisar receber o evento);
 * 2. passa pelo `useEfeitoPermitido(true)`: desliga em movimento reduzido,
 *    no tema de alto contraste e em tela de toque (`exigirPonteiroFino`) —
 *    sem hover não há reação, e um laço contínuo só gastaria bateria;
 * 3. `animarSozinho={false}`: o "fantasma" do original roda um tween por
 *    cubo a cada quadro; num fundo presente em TODAS as páginas o custo não
 *    se justifica. A grade continua reativa (inclina no ponteiro e ondula no
 *    clique), que é o comportamento pedido;
 * 4. cores só de tokens do tema (`--cp-primary`, `--cp-secondary`,
 *    `--cp-border`) — trocar de tema repinta o fundo sem código por tema;
 *    a translucidez mora no CSS (`.cp-fundo-cubos`), não no componente.
 */
import Cubes from "./Cubes";
import { useEfeitoPermitido } from "./useEfeitoPermitido";
// `react-bits.css` traz o estilo da camada (`.cp-fundo-cubos`) e o resto dos
// vendoriados (spotlight e proximidade). Antes ele só era importado pelo
// `ShinyText` — ou seja, em página sem ShinyText as regras não existiam e a
// camada de fundo caía como bloco estático. Como o `FundoCubos` vive no
// layout raiz, este import garante o CSS em TODA página (medido 06/10/2026).
import "./react-bits.css";

export default function FundoCubos() {
  const permitido = useEfeitoPermitido(true);
  if (!permitido) return null;

  return (
    <div className="cp-fundo-cubos" aria-hidden="true">
      {/* `grade` 12 e só 3 faces (dono, 06/10/2026: "os cubos estão gigantes,
          diminuir e otimizar"): em grade 8 o cubo saía com ~176 px; com 12 cai
          para ~100 px e a contagem de elementos fica próxima da anterior — o
          Cubes ainda pula o tween de quem já está no alvo, que era o custo
          real. `raio` 2,5 deixa a resposta ao ponteiro mais local. */}
      <Cubes
        grade={12}
        faces={3}
        raio={2.5}
        ouvirDocumento
        animarSozinho={false}
        sombra={false}
        corFace="var(--cp-primary)"
        borda="1px solid var(--cp-border)"
        corOndulacao="var(--cp-secondary)"
      />
    </div>
  );
}
