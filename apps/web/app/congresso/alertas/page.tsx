import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/congresso/alertas`.
 *
 * O QUE ERA: lista das proposições que restringem direitos.
 * O QUE VIROU (02/11/2026): `?recorte=restringem` no painel
 * `/congresso/analises`, junto com os bons exemplos — as duas listas eram a
 * mesma entidade separada pelo sentido do rótulo.
 *
 * POR QUE PONTE E NÃO SÓ `redirects()`: no alvo estático (`output: 'export'`,
 * GitHub Pages) `redirects()` não é aplicado e a rota viraria 404 sem aviso.
 * O destino vem do registro único em `lib/redirects/rotas-antigas.ts`.
 */
export default function AlertaAntigo() {
  return (
    <PaginaPonte
      destino={destinoAntigo("/congresso/alertas")}
      titulo="Alertas do Congresso mudaram de endereço"
      descricao="As proposições que restringem direitos agora são um recorte do painel de análises de direitos."
      semMain
    />
  );
}
