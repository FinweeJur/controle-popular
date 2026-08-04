"use client";

import DataCard from "@/app/[municipio]/components/DataCard";
import type { PostoAnp } from "@/lib/betim/postos";
import { useSearchParams } from "next/navigation";

/**
 * O filtro `?bandeira=` saiu do servidor e veio para cá.
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — não é
 * degradação, o build inteiro para (ver `docs/deploy-github-pages.md` §3).
 * O servidor passa a entregar SEMPRE a lista completa, já embutida no HTML,
 * e o recorte acontece no navegador.
 *
 * O efeito colateral é bom para os dois alvos: no Cloudflare some uma ida ao
 * banco por troca de filtro, e no GitHub Pages a página passa a existir.
 *
 * ═══ POR QUE SÃO DOIS COMPONENTES, E NÃO UM ═══
 *
 * `useSearchParams()` exige um `<Suspense>` acima — e o `fallback` DELE não
 * pode chamar o mesmo hook. A primeira versão passava este componente nos
 * dois lados (`fallback={<ListaPostos/>}` e como filho), o que parece
 * economia e é o erro: o build de produção morre com "useSearchParams()
 * should be wrapped in a suspense boundary", porque o fallback existe
 * justamente para ser o que se renderiza SEM o hook.
 *
 * O modo de falha é cruel: `next dev` não pré-renderiza, então a página
 * funciona perfeitamente no navegador durante todo o desenvolvimento, e
 * `tsc` não tem como ver. Só `next build` acusa.
 *
 * A separação também é o que mantém o conteúdo no HTML: `ListaPostosCompleta`
 * é o fallback, então o prerender emite a LISTA INTEIRA no HTML estático — e
 * quem chega sem JavaScript, ou um buscador, vê os postos. Se o fallback
 * fosse um esqueleto vazio, o portal ficaria em branco sem JS.
 */
function CartoesPostos({ postos }: { postos: PostoAnp[] }) {
  return (
    <>
      {postos.map((posto) => (
        <DataCard
          key={posto.cnpj}
          title={posto.razao_social ?? "Posto"}
          source={{
            label: "ANP — Revendedores",
            url: "https://revendedoresapi.anp.gov.br/swagger/index.html",
          }}
        >
          <p>{posto.endereco ?? "—"}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">
              {posto.bandeira ?? "sem bandeira"}
            </span>
            <span className="font-tabular text-sm font-semibold text-primary">
              Nota ANP: {posto.nota_anp ?? "—"}/5
            </span>
            {posto.interditado ? (
              <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                Interditado
              </span>
            ) : null}
          </div>
          {posto.produtos && posto.produtos.length > 0 ? (
            <p className="mt-3 text-xs text-text-soft">{posto.produtos.join(" · ")}</p>
          ) : null}
        </DataCard>
      ))}
    </>
  );
}

/** O fallback do `<Suspense>`: a lista inteira, sem ler a query. */
export function ListaPostosCompleta({
  postos,
  configured,
}: {
  postos: PostoAnp[];
  configured: boolean;
}) {
  if (postos.length === 0) {
    return (
      <p className="col-span-full text-sm text-text-soft">
        {configured
          ? "Nenhum posto cadastrado ainda — em breve."
          : "Nenhum dado disponível no momento."}
      </p>
    );
  }
  return <CartoesPostos postos={postos} />;
}

export default function ListaPostos({
  postos,
  configured,
}: {
  postos: PostoAnp[];
  configured: boolean;
}) {
  const bandeira = useSearchParams().get("bandeira");

  // Comparação frouxa de propósito: `listarPostos` filtrava por igualdade no
  // SQL, mas a bandeira da ANP vem com capitalização inconsistente na mesma
  // cidade ("Ipiranga", "IPIRANGA"). Manter a igualdade estrita aqui faria o
  // mesmo link devolver lista vazia dependendo de como a fonte grafou.
  const rows = bandeira
    ? postos.filter(
        (p) => (p.bandeira ?? "").toLocaleLowerCase("pt-BR") === bandeira.toLocaleLowerCase("pt-BR")
      )
    : postos;

  if (rows.length === 0) {
    return (
      <p className="col-span-full text-sm text-text-soft">
        {!configured
          ? "Nenhum dado disponível no momento."
          : bandeira
            ? `Nenhum posto da bandeira “${bandeira}” — a lista completa tem ${postos.length}.`
            : "Nenhum posto cadastrado ainda — em breve."}
      </p>
    );
  }

  return <CartoesPostos postos={rows} />;
}
