import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/direitos-em-movimento/saude-publica`.
 *
 * O conteúdo virou recorte do painel `/direitos-em-movimento/servicos`
 * (`?subfrente=saude-publica`) em 02/11/2026: quatro cartões, uma série e a
 * lista de fichas eram o mesmo esqueleto de educação e de trabalho e renda.
 *
 * O destino NÃO é escrito aqui: vem de `lib/redirects/rotas-antigas.ts`, a
 * mesma lista que monta o `redirects()` do `next.config.ts`. Onde há servidor,
 * o 301 responde e esta página nunca renderiza; no alvo estático ela é o único
 * redirecionamento possível. Uma lista só evita os dois lados divergirem.
 */
const ROTA = "/direitos-em-movimento/saude-publica";

export const metadata: Metadata = {
  title: "Saúde pública — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteSaudePublica() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="Saúde pública agora é um recorte do painel de serviços"
      descricao="O conteúdo é o mesmo: cartões de referência do SUS, divisão de leitos e as fichas de saúde. Agora ele divide a página com educação e trabalho e renda."
    />
  );
}
