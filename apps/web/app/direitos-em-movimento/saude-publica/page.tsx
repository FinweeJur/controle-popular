import type { Metadata } from "next";
import PaginaPonte from "@/app/components/PaginaPonte";

/**
 * @file Ponte de `/direitos-em-movimento/saude-publica`.
 *
 * O conteúdo virou recorte do painel `/direitos-em-movimento/servicos`
 * (`?subfrente=saude-publica`) em 02/11/2026: quatro cartões, uma série e a
 * lista de fichas eram o mesmo esqueleto de educação e de trabalho e renda.
 *
 * Onde há servidor, o `redirects()` do `next.config.ts` responde 301 e esta
 * página nunca renderiza. No alvo estático ela é o único redirecionamento
 * possível — ver `app/components/PaginaPonte.tsx`.
 */
export const metadata: Metadata = {
  title: "Saúde pública — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteSaudePublica() {
  return (
    <PaginaPonte
      destino="/direitos-em-movimento/servicos?subfrente=saude-publica"
      titulo="Saúde pública agora é um recorte do painel de serviços"
      descricao="O conteúdo é o mesmo: cartões de referência do SUS, divisão de leitos e as fichas de saúde. Agora ele divide a página com educação e trabalho e renda."
    />
  );
}
