import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/congresso/bons-exemplos`.
 *
 * O QUE ERA: lista das proposições que ampliam direitos.
 * O QUE VIROU (02/11/2026): `?recorte=ampliam` no painel
 * `/congresso/analises`. A rota antiga tinha índice estático fatiado só porque
 * embutir ~360 cartões no HTML era caro; o painel pagina no servidor.
 *
 * POR QUE PONTE: o alvo estático não aplica `redirects()`; a ponte funciona
 * nos dois alvos. Destino no registro `lib/redirects/rotas-antigas.ts`.
 */
export default function BonsExemplosAntigo() {
  return (
    <PaginaPonte
      destino={destinoAntigo("/congresso/bons-exemplos")}
      titulo="Bons exemplos mudaram de endereço"
      descricao="As proposições que ampliam direitos agora são um recorte do painel de análises de direitos."
      semMain
    />
  );
}
