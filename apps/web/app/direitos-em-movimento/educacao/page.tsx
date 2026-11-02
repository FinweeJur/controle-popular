import type { Metadata } from "next";
import PaginaPonte from "@/app/components/PaginaPonte";

/**
 * @file Ponte de `/direitos-em-movimento/educacao`.
 *
 * O conteúdo virou recorte do painel `/direitos-em-movimento/servicos`
 * (`?subfrente=educacao`) em 02/11/2026. Onde há servidor, o `redirects()` do
 * `next.config.ts` responde 301 e esta página nunca renderiza; no alvo estático
 * ela é o único redirecionamento possível — ver `app/components/PaginaPonte.tsx`.
 */
export const metadata: Metadata = {
  title: "Educação — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteEducacao() {
  return (
    <PaginaPonte
      destino="/direitos-em-movimento/servicos?subfrente=educacao"
      titulo="Educação agora é um recorte do painel de serviços"
      descricao="O conteúdo é o mesmo: cartões de referência do Censo Escolar, a série do IDEB e as fichas de educação. Agora ele divide a página com saúde e trabalho e renda."
    />
  );
}
