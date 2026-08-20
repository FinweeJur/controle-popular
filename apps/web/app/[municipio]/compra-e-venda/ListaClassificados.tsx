"use client";

import Link from "@/lib/betim/link";
import {
  CLASSIFICADO_CATEGORIAS,
  CLASSIFICADO_CATEGORIA_LABELS,
  type ClassificadoAnuncio,
} from "@/lib/betim/classificados";
import Moeda from "@/app/components/Moeda";
import { useCaminhoDaCidade } from "@/lib/betim/basePath";
import { useListaAoVivo } from "@/lib/betim/lista-ao-vivo";
import { useSearchParams } from "next/navigation";

/**
 * Os filtros `?categoria=` e `?q=` saíram do servidor e vieram para cá.
 *
 * POR QUE: em `output: 'export'` não existe request no momento da geração,
 * então `searchParams` num Server Component é erro de build — não é
 * degradação, o build inteiro para (ver `docs/deploy-github-pages.md` §3).
 * O servidor passa a entregar SEMPRE os anúncios vigentes da cidade, já
 * embutidos no HTML, e o recorte acontece no navegador.
 *
 * `classificadosVigentes` não tem LIMIT: o recorte aqui enxerga o mesmo
 * conjunto que o SQL enxergava, então filtrar por categoria continua
 * devolvendo TODOS os anúncios daquela categoria, e não "os daquela
 * categoria dentre os N mais recentes".
 *
 * As pílulas de categoria vieram junto com a lista porque a marcação da
 * ativa lê o mesmo `?categoria=`. Deixá-las no servidor acenderia "Todos"
 * enquanto a lista já estivesse filtrada.
 *
 * `useSearchParams()` obriga um `<Suspense>` acima (quem chama põe). Sem ele
 * o Next tira a ROTA INTEIRA do pré-render e manda para o cliente — no alvo
 * estático isso é build quebrado, e no Cloudflare seria a página perdendo o
 * SSG sem ninguém notar.
 */
/**
 * ═══ POR QUE SÃO DOIS COMPONENTES ═══
 *
 * `useSearchParams()` exige um `<Suspense>` acima, e o `fallback` DELE não
 * pode chamar o mesmo hook — o fallback é justamente o que se renderiza sem
 * ele. Passar este componente nos dois lados derruba o `next build` com
 * "should be wrapped in a suspense boundary", e só lá: `next dev` não
 * pré-renderiza, então a página parece perfeita o desenvolvimento inteiro e
 * o `tsc` não tem como ver.
 *
 * O componente "Completa" sendo o fallback é também o que mantém o conteúdo
 * INTEIRO dentro do HTML estático — quem chega sem JavaScript ainda vê tudo.
 */
interface ClassificadosProps {
  anuncios: ClassificadoAnuncio[];
  configured: boolean;
  dominio: string | null;
}

function ClassificadosConteudo({
  anuncios,
  configured,
  dominio,
  categoria,
  q,
}: ClassificadosProps & { categoria: string | null; q: string | null }) {
  // Mesma razão de `ListaZap`: o HTML tem a lista do último build e o
  // anúncio aprovado vive no D1. Ver `lib/betim/lista-ao-vivo.ts`.
  const caminho = useCaminhoDaCidade();
  const aoVivo = useListaAoVivo<ClassificadoAnuncio>(caminho("/api/classificados"), anuncios);

  const termo = q?.toLocaleLowerCase("pt-BR");
  const rows = aoVivo.filter((item) => {
    // Igualdade estrita, ao contrário da bandeira em `ListaPostos`: a
    // categoria não vem de fonte externa. O único caminho de escrita é a POST
    // de `/api/classificados`, que recusa o que não estiver em
    // CLASSIFICADO_CATEGORIAS — o mesmo slug que a pílula escreve no link.
    if (categoria && item.categoria !== categoria) return false;
    // O `q` era `ilike` no SQL, não `=`: a busca por título sempre ignorou
    // caixa, e comparar cru aqui faria "SOFÁ" deixar de achar "Sofá".
    if (termo && !(item.titulo ?? "").toLocaleLowerCase("pt-BR").includes(termo)) return false;
    return true;
  });

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link
          href="/compra-e-venda"
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
            !categoria ? "border-primary bg-primary text-primary-ink" : "border-border text-text-soft"
          }`}
        >
          Todos
        </Link>
        {CLASSIFICADO_CATEGORIAS.map((c) => (
          <Link
            key={c}
            href={`/compra-e-venda?categoria=${c}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              categoria === c ? "border-primary bg-primary text-primary-ink" : "border-border text-text-soft"
            }`}
          >
            {CLASSIFICADO_CATEGORIA_LABELS[c]}
          </Link>
        ))}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length > 0 ? (
          rows.map((item) => {
            const waUrl = `https://wa.me/${item.contato_whatsapp}?text=${encodeURIComponent(
              `Olá! Vi seu anúncio "${item.titulo}" no Compra e Venda (${dominio ?? "controlepopular.br"}).`
            )}`;
            return (
              <a
                key={item.id}
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1.5 cp-card-hover rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
              >
                <span className="font-display text-base font-semibold text-text">
                  {item.titulo}
                </span>
                {item.preco !== null ? (
                  <span className="font-tabular text-lg font-semibold text-primary">
                    <Moeda value={item.preco} />
                  </span>
                ) : null}
                {item.descricao ? (
                  <span className="line-clamp-3 text-sm text-text-soft">{item.descricao}</span>
                ) : null}
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Falar no WhatsApp →
                </span>
              </a>
            );
          })
        ) : (
          <p className="col-span-full text-sm text-text-soft">
            {configured
              ? "Nenhum anúncio aprovado ainda nesta categoria."
              : "Nenhum anúncio disponível no momento."}
          </p>
        )}
      </section>
    </>
  );
}

/** O fallback do `<Suspense>`: a lista inteira, sem ler a query. */
export function ListaClassificadosCompleta(props: ClassificadosProps) {
  return <ClassificadosConteudo {...props} categoria={null} q={null} />;
}

export default function ListaClassificados(props: ClassificadosProps) {
  const searchParams = useSearchParams();
  return (
    <ClassificadosConteudo
      {...props}
      categoria={searchParams.get("categoria")}
      q={searchParams.get("q")}
    />
  );
}
