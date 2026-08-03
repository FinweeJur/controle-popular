import Link from "@/lib/betim/link";
import { notFound } from "next/navigation";
import { temFonte, type Cidade } from "@/lib/db/queries/municipios";

/**
 * Página-ponte para uma URL antiga que continua indexada.
 *
 * Existe por causa de duas rotas que carregavam o nome da primeira cidade
 * da rede: `/zap-betim` e `/nota-betim`. Elas viraram `/zap` e
 * `/nota-transparencia` quando BH e São Paulo entraram — `/sp/zap-betim`
 * não é URL defensável num portal de São Paulo.
 *
 * O site é publicado como HTML estático (SSG, e no GitHub Pages não há
 * servidor nenhum), então `redirects()` do `next.config` e `redirect()` do
 * servidor NÃO existem em runtime: o único redirecionamento possível é o
 * que o próprio HTML carrega. Daí o `<meta http-equiv="refresh">` — com
 * `content="0"`, os navegadores tratam como equivalente a um 301 e os
 * buscadores consolidam o sinal na URL do `canonical`.
 *
 * O `<a>` visível não é decoração: se o refresh for bloqueado (extensão,
 * leitor de tela em modo texto), a página ainda leva a lugar nenhum sem
 * ele. É a mesma razão pela qual o texto explica o que aconteceu em vez de
 * só piscar.
 *
 * `fonte` é a chave de `municipios.fontes` que liga a ponte. Só Betim tem
 * URL antiga para preservar; nas outras cidades a rota simplesmente não
 * existe (404), em vez de virar uma segunda URL viva para o mesmo conteúdo
 * — que é exatamente o conteúdo duplicado que o canonical evita.
 */
export default function PaginaPonte({
  cidade,
  destino,
  titulo,
  fonte = "rotas_legadas",
}: {
  cidade: Cidade;
  /** Caminho novo, relativo à cidade — ex. `/zap`. */
  destino: string;
  titulo: string;
  fonte?: string;
}) {
  if (!temFonte(cidade, fonte)) notFound();

  const absoluto = `/${cidade.slug}${destino}`;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <meta httpEquiv="refresh" content={`0; url=${absoluto}`} />
      <link rel="canonical" href={absoluto} />
      <meta name="robots" content="noindex, follow" />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-text">{titulo}</h1>
        <p className="mt-3 text-sm text-text-soft">
          Esta página mudou de endereço quando o portal passou a atender mais
          de uma cidade. O conteúdo é o mesmo.
        </p>
        <Link
          href={destino}
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white"
        >
          Ir para a página nova
        </Link>
      </div>
    </>
  );
}
