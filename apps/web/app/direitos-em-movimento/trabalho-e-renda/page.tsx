import type { Metadata } from "next";
import PaginaPonte from "@/app/components/PaginaPonte";

/**
 * @file Ponte de `/direitos-em-movimento/trabalho-e-renda`.
 *
 * Só esta rota virou faceta. A filha `cadastro-empregadores` continua viva:
 * é lista nominal de CNPJ, com tabela e dado próprio, não um recorte.
 *
 * Onde há servidor, o `redirects()` do `next.config.ts` responde 301 e esta
 * página nunca renderiza; no alvo estático ela é o único redirecionamento
 * possível — ver `app/components/PaginaPonte.tsx`.
 */
export const metadata: Metadata = {
  title: "Trabalho e renda — endereço novo | Controle Popular",
  robots: { index: false, follow: true },
};

export default function PonteTrabalhoERenda() {
  return (
    <PaginaPonte
      destino="/direitos-em-movimento/servicos?subfrente=trabalho-e-renda"
      titulo="Trabalho e renda agora é um recorte do painel de serviços"
      descricao="O conteúdo é o mesmo: cartões de referência do CAGED, saldo por setor e as fichas de trabalho. O Cadastro de Empregadores continua em endereço próprio."
    />
  );
}
