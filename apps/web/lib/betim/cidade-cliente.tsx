"use client";

import { createContext, useContext } from "react";
import type { Cidade } from "@/lib/db/queries/municipios";

/**
 * A cidade da rota, disponível para COMPONENTES CLIENT.
 *
 * As páginas resolvem a cidade no servidor com `cidadeDaRota(params)`, mas
 * `DataCard`, `PedidoLAI`, `AssistenteChat` e `ZapCard` são `"use client"`
 * — não podem chamar o banco nem receber `params`. Sem isto, cada um tinha
 * o nome da cidade escrito à mão: o modelo de pedido de LAI dizia "À
 * Prefeitura Municipal de Betim" e o botão de compartilhar do `DataCard`
 * anunciava "Controle Popular Betim", em qualquer cidade.
 *
 * O `Provider` é montado uma vez no layout de `/[municipio]`, que já
 * resolveu a cidade — nenhum componente refaz a consulta, e passar a linha
 * inteira pelo boundary é barato (é JSON e são poucos campos).
 *
 * `useCaminhoDaCidade()` (em `link.tsx`) resolve outra coisa e continua
 * separado: ele deriva o PREFIXO da URL do pathname, o que funciona sem
 * saber o nome. Aqui o que falta é o nome, que só o banco tem.
 */
const CidadeContext = createContext<Cidade | null>(null);

export function CidadeProvider({
  cidade,
  children,
}: {
  cidade: Cidade;
  children: React.ReactNode;
}) {
  return <CidadeContext.Provider value={cidade}>{children}</CidadeContext.Provider>;
}

/**
 * A cidade da rota. Lança se usado fora do provider — é erro de montagem,
 * e falhar alto é melhor que renderizar o nome de outra cidade.
 */
export function useCidade(): Cidade {
  const cidade = useContext(CidadeContext);
  if (!cidade) {
    throw new Error(
      "useCidade() fora do <CidadeProvider>. O provider é montado no layout de /[municipio]."
    );
  }
  return cidade;
}

/** Nome do portal — mesma regra do servidor, para uso em client component. */
export function useNomePortal(): string {
  const cidade = useCidade();
  const branding = cidade.branding as { nome_portal?: unknown } | null;
  const doBanco = branding?.nome_portal;
  return typeof doBanco === "string" && doBanco.trim()
    ? doBanco
    : `Controle Popular ${cidade.nome}`;
}
