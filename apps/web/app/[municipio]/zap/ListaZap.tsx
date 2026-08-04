"use client";

import Link from "@/lib/betim/link";
import { ZAP_CATEGORIAS, ZAP_CATEGORIA_LABELS } from "@/lib/betim/zap";
import type { ZapEstabelecimento } from "@/lib/betim/zap";
import { useSearchParams } from "next/navigation";
import ZapCard from "./ZapCard";

/**
 * Os filtros `?categoria=` e `?q=` saíram do servidor e vieram para cá.
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — não é
 * degradação, o build inteiro para (ver `docs/deploy-github-pages.md` §3).
 * O servidor passa a entregar SEMPRE a lista completa, já embutida no HTML,
 * e o recorte acontece no navegador.
 *
 * O recorte continua honesto porque `zapEstabelecimentos` NÃO tem LIMIT: os
 * filtros só entravam no `where`, e a ordem (nome pt-BR, id) vem pronta do
 * banco. Filtrar em JS preserva o conjunto e a ordem. Fosse uma consulta do
 * tipo "os N mais X daquele filtro", trazer sem filtro e cortar aqui daria
 * outra lista — e num portal de transparência isso é regressão.
 *
 * As pílulas de categoria vieram junto porque o destaque delas depende do
 * mesmo `?categoria=`: deixá-las no servidor faria "Todos" ficar aceso em
 * qualquer filtro.
 *
 * `useSearchParams()` obriga um `<Suspense>` acima (quem chama põe). Sem ele
 * o Next tira a ROTA INTEIRA do pré-render e manda para o cliente — no alvo
 * estático isso é build quebrado, e no Cloudflare seria a página perdendo o
 * SSG sem ninguém notar.
 */
export default function ListaZap({
  estabelecimentos,
  configured,
}: {
  estabelecimentos: ZapEstabelecimento[];
  configured: boolean;
}) {
  const searchParams = useSearchParams();
  const categoria = searchParams.get("categoria");
  const q = searchParams.get("q");

  // Minúsculo dos dois lados porque no SQL o `q` era `ilike`, que ignora
  // caixa: um `includes` cru faria `?q=padaria` deixar de achar "Padaria".
  // Já a categoria fica em igualdade estrita — diferente da bandeira da ANP
  // em `ListaPostos`, aqui o valor não vem de fonte externa: o único gravador
  // (`validateZapSubmission`) só aceita os slugs de `ZAP_CATEGORIAS`, e é o
  // mesmo `===` que acende a pílula.
  const termo = q ? q.toLocaleLowerCase("pt-BR") : null;
  // Parâmetro presente e vazio não filtra, como no servidor (`if (opts.q)`).
  const rows = estabelecimentos.filter(
    (item) =>
      (!categoria || item.categoria === categoria) &&
      (!termo || (item.nome ?? "").toLocaleLowerCase("pt-BR").includes(termo))
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/zap"
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
            !categoria ? "border-primary bg-primary text-primary-ink" : "border-border text-text-soft"
          }`}
        >
          Todos
        </Link>
        {ZAP_CATEGORIAS.map((c) => (
          <Link
            key={c}
            href={`/zap?categoria=${c}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              categoria === c ? "border-primary bg-primary text-primary-ink" : "border-border text-text-soft"
            }`}
          >
            {ZAP_CATEGORIA_LABELS[c]}
          </Link>
        ))}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length > 0 ? (
          rows.map((item) => <ZapCard key={item.id} item={item} />)
        ) : (
          <p className="col-span-full text-sm text-text-soft">
            {configured
              ? "Nenhum negócio aprovado ainda nesta categoria."
              : "Nenhum dado disponível no momento."}
          </p>
        )}
      </section>
    </>
  );
}
