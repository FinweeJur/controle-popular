import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import TabelaScroll from "@/app/[municipio]/components/TabelaScroll";
import { getServidores, SERVIDORES_PAGE_SIZE } from "@/lib/betim/servidores";
import { ehPerfilServidor } from "@/lib/db/queries/betim";
import { formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { hostDaPrefeitura } from "@/lib/db/queries/municipios";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Servidores — Prefeitura de ${c.nome} — ${nomePortal(c)}`,
  (c) => `Servidores da Prefeitura de ${c.nome}: nome, cargo, lotação e vínculo. Dado público, com busca.`
);

interface ServidoresPageProps {
  params: Promise<{ municipio: string }>;
  searchParams: Promise<{ q?: string; page?: string; perfil?: string }>;
}

export default async function ServidoresPage({
  params: rota,
  searchParams,
}: ServidoresPageProps) {
  const cidade = await cidadeDaRota(rota);
  // O rótulo já era dinâmico e a URL não: o card dizia "Prefeitura de Belo
  // Horizonte" e levava a betim.mg.gov.br. Rótulo certo sobre link errado é
  // pior que os dois errados — dá credibilidade ao destino.
  const hostPrefeitura = hostDaPrefeitura(cidade);
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  // `ehPerfilServidor` valida contra a lista fechada: `?perfil=qualquer_coisa`
  // vira `undefined` (sem filtro) em vez de virar SQL que não casa nada e
  // devolver "nenhum servidor" — que leria como "a Prefeitura não tem".
  const perfil = ehPerfilServidor(params.perfil) ? params.perfil : undefined;
  const { rows, total, ok, configured } = await getServidores(cidade.id_municipio, {
    q: params.q,
    perfil,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / SERVIDORES_PAGE_SIZE));
  const hasResults = configured && ok && rows.length > 0;

  const buildQuery = (overrides: Record<string, string | number | undefined>) => {
    const merged: Record<string, string | number | undefined> = {
      q: params.q,
      perfil,
      page: params.page,
      ...overrides,
    };
    const qs = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== "") qs.set(k, String(v));
    });
    const s = qs.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura" className="hover:text-primary">
          Prefeitura
        </Link>{" "}
        · <span className="text-text">Servidores</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Servidores da Prefeitura
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        {/* `{" "}` no fim da linha: o JSX descarta a quebra de linha quando
            a linha seguinte começa com uma expressão, e "de" colaria em
            "Betim". Foi o único caso, e quem apontou foi o diff do texto
            renderizado — a leitura do código não pega. */}
        Nome, cargo, lotação e tipo de vínculo dos servidores da Prefeitura de{" "}
        {cidade.nome}. Informação pública — a remuneração individual não é exibida.
      </p>

      <form method="GET" className="mt-6 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Buscar por nome, cargo ou lotação
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Ex.: professor, secretaria de saúde…"
            className="w-72 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="perfil" className="mb-1 text-xs font-medium text-text-soft">
            Tipo de cargo
          </label>
          <select
            id="perfil"
            name="perfil"
            defaultValue={perfil ?? ""}
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos os servidores</option>
            <option value="comissionados">Só cargos comissionados</option>
            <option value="alto_escalao">Só alto escalão</option>
          </select>
        </div>
        <button
          type="submit"
          className="cursor-pointer rounded-lg border border-primary bg-primary px-5 py-2 text-sm font-semibold text-primary-ink"
        >
          Buscar
        </button>
        {(params.q || perfil) && (
          <Link href="/prefeitura/servidores" className="text-sm text-text-soft hover:underline">
            Limpar
          </Link>
        )}
      </form>

      {/* O QUE CADA RECORTE SIGNIFICA, na tela e não só no código: sem isto
          "alto escalão" seria um número sem régua, e o leitor não teria como
          saber que diretor de escola ficou de fora — nem por quê. */}
      {perfil && (
        <p className="mb-6 max-w-2xl rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text-soft">
          {perfil === "comissionados" ? (
            <>
              <strong className="font-medium text-text">Cargos comissionados</strong> são
              os de livre nomeação e exoneração — a parte do quadro que muda com o
              governo. O recorte sai do vínculo declarado pela própria Prefeitura
              (&ldquo;em comissão&rdquo;), não de uma leitura nossa do nome do cargo.
            </>
          ) : (
            <>
              <strong className="font-medium text-text">Alto escalão</strong> é a cúpula
              da administração: secretários e adjuntos, subprefeitos, chefes de
              gabinete, diretores, presidentes, superintendentes, procurador e
              controlador-geral. <strong className="font-medium text-text">Diretor de
              escola e coordenador pedagógico ficam de fora</strong> — são chefia
              pedagógica, não cúpula de governo, e somam 3.455 pessoas em São Paulo,
              o bastante para desfigurar o recorte se entrassem.
            </>
          )}
        </p>
      )}

      <div className="mb-6 max-w-xs">
        <DataCard
          title="Servidores encontrados"
          source={{ label: `Prefeitura de ${cidade.nome}`, url: hostPrefeitura }}
        >
          <p className="font-tabular text-2xl font-bold text-text">{formatNumberBR(total)}</p>
        </DataCard>
      </div>

      {!hasResults ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          {configured && ok && (params.q || perfil)
            ? "Nenhum servidor encontrado para esse filtro."
            : "Nenhum servidor encontrado no momento."}
        </div>
      ) : (
        <>
          <TabelaScroll>
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-2">
                <tr className="text-left text-[.82em] tracking-wide text-text-soft uppercase">
                  <th className="px-4.5 py-3.5">Nome</th>
                  <th className="px-4.5 py-3.5">Cargo</th>
                  <th className="px-4.5 py-3.5">Lotação</th>
                  <th className="px-4.5 py-3.5">Vínculo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
                {rows.map((s, i) => (
                  <tr key={i}>
                    <td className="px-4.5 py-3.5 font-medium text-text">{s.nome}</td>
                    <td className="px-4.5 py-3.5 text-text-soft">{s.cargo ?? "—"}</td>
                    <td className="px-4.5 py-3.5 text-text-soft">{s.lotacao ?? "—"}</td>
                    <td className="px-4.5 py-3.5 whitespace-nowrap text-text-soft">
                      {s.vinculo ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelaScroll>

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="font-tabular text-text-soft">
              Página {page} de {formatNumberBR(totalPages)}
            </span>
            <div className="flex gap-2">
              <Link
                aria-disabled={page <= 1}
                className={`font-tabular rounded-lg border border-border px-3 py-1.5 ${
                  page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-surface-2"
                }`}
                href={buildQuery({ page: page - 1 })}
              >
                ‹ Anterior
              </Link>
              <Link
                aria-disabled={page >= totalPages}
                className={`font-tabular rounded-lg border border-border px-3 py-1.5 ${
                  page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-surface-2"
                }`}
                href={buildQuery({ page: page + 1 })}
              >
                Próxima ›
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
