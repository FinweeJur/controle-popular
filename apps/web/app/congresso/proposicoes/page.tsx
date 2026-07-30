import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import Autoria from "@/app/congresso/components/Autoria";
import { listarProposicoes, listarTemas, POR_PAGINA_PADRAO } from "@/lib/congresso/proposicoes";
import { RUBRICA } from "@/lib/congresso/rubrica";

export const metadata: Metadata = {
  title: "Proposições — Controle Popular · Congresso",
  description:
    "Busque projetos de lei federais por tema, palavra-chave e classificação de ampliação ou restrição de direitos.",
};

type Params = Promise<Record<string, string | undefined>>;

export default async function Proposicoes({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;
  const pagina = Number(sp.pagina ?? 1) || 1;

  const [resultado, temas] = await Promise.all([
    listarProposicoes({
      q: sp.q,
      tema: sp.tema,
      rotulo: sp.rotulo,
      // Vem da barra de busca ao escolher um autor nas sugestões.
      autor: sp.autor,
      ano: sp.ano ? Number(sp.ano) : undefined,
      tramitando: sp.tramitando === "0" ? undefined : true,
      pagina,
    }),
    listarTemas(),
  ]);

  const totalPaginas = resultado ? Math.ceil(resultado.total / POR_PAGINA_PADRAO) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Proposições</h1>
        <p className="opacity-80">
          Projetos de lei, PECs e medidas provisórias em tramitação, com a classificação
          de quais direitos cada um amplia ou restringe.
        </p>
      </header>

      {/* Formulário GET puro: sem JS, funciona com o botão de voltar do
          navegador, e cada busca vira uma URL compartilhável — que é
          exatamente o que alguém fazendo controle social quer mandar para
          o grupo. */}
      <form className="grid gap-3 rounded-lg border border-[var(--cp-border)] p-4 sm:grid-cols-4">
        <label className="sm:col-span-2">
          <span className="text-sm opacity-75">Busca</span>
          <input
            type="search"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="ex.: trabalho intermitente, PL 3631/2026"
            className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          />
        </label>

        <label>
          <span className="text-sm opacity-75">Tema oficial</span>
          <select
            name="tema"
            defaultValue={sp.tema ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          >
            <option value="">Todos</option>
            {temas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-sm opacity-75">Classificação</span>
          <select
            name="rotulo"
            defaultValue={sp.rotulo ?? ""}
            className="mt-1 w-full rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2"
          >
            <option value="">Todas</option>
            {RUBRICA.faixas.map((f) => (
              <option key={f.rotulo} value={f.rotulo}>
                {f.label}
              </option>
            ))}
            <option value="misto">Misto</option>
          </select>
        </label>

        {/* Campo oculto: sem ele, filtrar por tema depois de escolher um
            autor na barra de busca PERDERIA o autor — um formulário GET só
            envia o que está dentro dele. */}
        {sp.autor ? <input type="hidden" name="autor" value={sp.autor} /> : null}

        <div className="sm:col-span-4">
          <button
            type="submit"
            className="rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-[var(--cp-primary-ink)]"
          >
            Filtrar
          </button>
          {sp.q || sp.tema || sp.rotulo || sp.autor ? (
            <Link href="/proposicoes" className="ml-3 underline">
              limpar
            </Link>
          ) : null}
          {sp.autor ? (
            <span className="ml-3 text-sm opacity-80">
              autoria de <strong>{sp.autor}</strong>
            </span>
          ) : null}
        </div>
      </form>

      {!resultado ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-6 opacity-80">
          Fonte de dados não configurada. Veja <code>TODO.md</code> no repositório.
        </p>
      ) : resultado.itens.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-6 opacity-80">
          {resultado.total === 0
            ? "Nenhuma proposição sincronizada ainda — rode o ETL da Câmara."
            : "Nenhum resultado com estes filtros."}
        </p>
      ) : (
        <>
          <p className="text-sm opacity-70">
            {resultado.total.toLocaleString("pt-BR")} proposições
            {sp.rotulo ? " (o filtro por classificação é aplicado nesta página)" : ""}
          </p>

          <ul className="space-y-3">
            {resultado.itens.map((p) => (
              <li key={p.id} className="rounded-lg border border-[var(--cp-border)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/proposicoes/${p.id}`}
                    className="font-display font-semibold underline-offset-2 hover:underline"
                  >
                    {p.identificacao}
                  </Link>
                  <RotuloBadge
                    rotulo={p.analise?.rotulo}
                    score={p.analise?.score}
                    tamanho="sm"
                  />
                </div>
                <Autoria autoria={p.autoria} className="mt-1.5 text-sm" />
                <p className="mt-2 text-sm opacity-85">{p.ementa}</p>
                <p className="mt-2 text-xs opacity-65">
                  {p.orgao_atual ? `${p.orgao_atual} · ` : ""}
                  {p.situacao ?? "situação não registrada"}
                  {p.temas_oficiais?.length ? ` · ${p.temas_oficiais.join(", ")}` : ""}
                </p>
              </li>
            ))}
          </ul>

          {totalPaginas > 1 ? (
            <nav className="flex items-center gap-4">
              {pagina > 1 ? (
                <Link
                  href={{ pathname: "/proposicoes", query: { ...sp, pagina: pagina - 1 } }}
                  className="underline"
                >
                  ← anterior
                </Link>
              ) : null}
              <span className="text-sm opacity-70">
                página {pagina} de {totalPaginas}
              </span>
              {pagina < totalPaginas ? (
                <Link
                  href={{ pathname: "/proposicoes", query: { ...sp, pagina: pagina + 1 } }}
                  className="underline"
                >
                  próxima →
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
