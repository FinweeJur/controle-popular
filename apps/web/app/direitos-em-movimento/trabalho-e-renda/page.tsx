import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaginaPonte from "@/app/components/PaginaPonte";
import { destinoAntigo } from "@/lib/redirects/rotas-antigas";

/**
 * @file Ponte de `/direitos-em-movimento/trabalho-e-renda`.
 *
 * Só esta rota virou faceta. A filha `cadastro-empregadores` continua viva:
 * é lista nominal de CNPJ, com tabela e dado próprio, não um recorte.
 *
 * O destino vem de `lib/redirects/rotas-antigas.ts`, a mesma lista que alimenta
 * o `redirects()` do `next.config.ts`.
 */
const ROTA = "/direitos-em-movimento/trabalho-e-renda";

export const metadata: Metadata = {
  title: "Trabalho e renda — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteTrabalhoERenda() {
  const destino = destinoAntigo(ROTA);
  if (!destino) notFound();
  return (
    <PaginaPonte
      destino={destino}
      titulo="Trabalho e renda agora é um recorte do painel de serviços"
      descricao="O conteúdo é o mesmo: cartões de referência do CAGED, saldo por setor e as fichas de trabalho. O Cadastro de Empregadores continua em endereço próprio."
    />
  );
}
