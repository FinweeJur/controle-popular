import Link from "@/lib/betim/link";
import DataCard from "@/app/betim/components/DataCard";
import PaginaEmBreve from "@/app/betim/components/PaginaEmBreve";
import { getParaopebaData } from "@/lib/betim/paraopeba";
import { formatCurrencyBRL, formatDateBR } from "@/lib/betim/format";

export const metadata = {
  title: "Reparação do Rio Paraopeba — Betim | Controle Popular Betim",
  description:
    "Projetos de reparação socioeconômica em Betim ligados ao Acordo Geral pelo rompimento da barragem da Vale em Brumadinho, auditados pela FGV.",
};

function referenciaLabel(referencia: string): string {
  const [ano, mes] = referencia.split("-");
  return formatDateBR(`${ano}-${mes}-01`).slice(3);
}

interface ParaopebaPageProps {
  searchParams: Promise<{ status?: string; ordem?: string }>;
}

export default async function ParaopebaPage({ searchParams }: ParaopebaPageProps) {
  const { status: statusFiltro, ordem } = await searchParams;
  const { configured, ok, saldo, iniciativas } = await getParaopebaData();
  const temDados = configured && ok && iniciativas.length > 0;

  if (!temDados) {
    return (
      <PaginaEmBreve
        titulo="Reparação do Rio Paraopeba em Betim"
        descricao="Projetos de reparação socioeconômica em Betim, ligados ao Acordo Geral pelo rompimento da barragem da Vale em Brumadinho (2019), auditados pela FGV."
        motivo="Fonte confirmada 2026-07-24 (www18.fgv.br/projetorioparaopeba disponibiliza planilhas mensais em Dados Abertos) — migration 0022_paraopeba.sql ainda não rodada neste ambiente."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/meio-ambiente" className="hover:text-primary">
          Meio Ambiente
        </Link>{" "}
        · <span className="text-text">Reparação do Rio Paraopeba</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Reparação do Rio Paraopeba em Betim
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Betim é um dos 26 municípios da Bacia do Paraopeba que assinaram o
        Acordo Geral de Reparação pelo rompimento da barragem da Vale em
        Brumadinho (2019). A execução dos projetos é auditada de forma
        independente pela FGV (Fundação Getulio Vargas) —{" "}
        {saldo && `dado de ${referenciaLabel(saldo.referencia)}`}.
      </p>

      {saldo && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <DataCard
            title="Valor do acordo (atualizado)"
            source={{ label: "FGV — Projeto Paraopeba", url: "https://www18.fgv.br/projetorioparaopeba/" }}
          >
            <p className="font-tabular text-xl font-bold text-text">
              {saldo.valorAcordoAtual != null ? formatCurrencyBRL(saldo.valorAcordoAtual) : "—"}
            </p>
            <p className="text-xs text-text-soft">
              inicial:{" "}
              {saldo.valorAcordoInicial != null ? formatCurrencyBRL(saldo.valorAcordoInicial) : "—"}
            </p>
          </DataCard>
          <DataCard title="Empenhado autorizado">
            <p className="font-tabular text-xl font-bold text-text">
              {saldo.empenhosAutorizados != null ? formatCurrencyBRL(saldo.empenhosAutorizados) : "—"}
            </p>
          </DataCard>
          <DataCard title="Saldo disponível">
            <p className="font-tabular text-xl font-bold text-text">
              {saldo.saldoTeto != null ? formatCurrencyBRL(saldo.saldoTeto) : "—"}
            </p>
            <p className="text-xs text-text-soft">já reservados 25% de contingência</p>
          </DataCard>
          <DataCard title="Projetos ligados a Betim">
            <p className="font-tabular text-xl font-bold text-text">{iniciativas.length}</p>
          </DataCard>
        </div>
      )}

      {/* #7 do review: filtrar por status + ordenar por "falta mais pra
          concluir". Dado já carregado — filtro/sort no componente. Padrão
          é menos concluído primeiro (o que o usuário pediu). */}
      {(() => {
        const statusesDisponiveis = [
          ...new Set(iniciativas.map((i) => i.status).filter((s): s is string => Boolean(s))),
        ].sort((a, b) => a.localeCompare(b, "pt-BR"));
        let lista = statusFiltro
          ? iniciativas.filter((i) => i.status === statusFiltro)
          : iniciativas;
        lista =
          ordem === "valor"
            ? [...lista].sort((a, b) => (b.valorTotal ?? 0) - (a.valorTotal ?? 0))
            : // menos concluído primeiro: percentual asc, sem % vai pro fim
              [...lista].sort(
                (a, b) => (a.percentualRealizado ?? 101) - (b.percentualRealizado ?? 101)
              );
        const q = (over: Record<string, string | undefined>) => {
          const merged = { status: statusFiltro, ordem, ...over };
          const s = new URLSearchParams();
          Object.entries(merged).forEach(([k, v]) => {
            if (v) s.set(k, v);
          });
          const str = s.toString();
          return str ? `?${str}` : "";
        };
        return (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-text">
                Projetos ({lista.length}) — com link direto pra fonte
              </h2>
              <form method="GET" className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col">
                  <label htmlFor="status" className="mb-1 text-xs font-medium text-text-soft">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={statusFiltro ?? ""}
                    className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
                  >
                    <option value="">Todos</option>
                    {statusesDisponiveis.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label htmlFor="ordem" className="mb-1 text-xs font-medium text-text-soft">
                    Ordenar por
                  </label>
                  <select
                    id="ordem"
                    name="ordem"
                    defaultValue={ordem ?? "falta"}
                    className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
                  >
                    <option value="falta">Falta mais pra concluir</option>
                    <option value="valor">Maior valor</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="cursor-pointer rounded-lg border border-primary bg-primary px-4 py-1.5 text-sm font-semibold text-primary-ink"
                >
                  Aplicar
                </button>
                {(statusFiltro || ordem) && (
                  <Link
                    href="/meio-ambiente/paraopeba"
                    className="pb-1.5 text-sm text-text-soft hover:underline"
                  >
                    Limpar
                  </Link>
                )}
              </form>
            </div>
            <ul className="flex flex-col gap-3">
              {lista.map((p) => (
            <li key={p.idFdi} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-display font-semibold text-text">{p.titulo}</p>
                {p.status && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                    {p.status}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-soft">
                {p.areaTematica}
                {p.subAreaTematica && p.subAreaTematica !== "-" ? ` · ${p.subAreaTematica}` : ""}
                {p.municipiosEnvolvidos && p.municipiosEnvolvidos.includes(";")
                  ? " · projeto compartilhado com outros municípios da bacia"
                  : ""}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                {p.valorTotal != null && (
                  <span className="font-tabular font-semibold text-text">
                    {formatCurrencyBRL(p.valorTotal)}
                  </span>
                )}
                {p.percentualRealizado != null && (
                  <span className="text-text-soft">{p.percentualRealizado.toFixed(0)}% realizado</span>
                )}
                {p.produtosPrevistos != null && p.produtosPrevistos > 0 && (
                  <span className="text-text-soft">
                    {p.produtosEntregues ?? 0}/{p.produtosPrevistos} produtos entregues
                  </span>
                )}
              </div>
              {p.percentualRealizado != null && (
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
                  title={`${p.percentualRealizado.toFixed(0)}% realizado`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${Math.min(Math.max(p.percentualRealizado, 0), 100)}%` }}
                  />
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {p.linkPublico && (
                  <a
                    href={p.linkPublico}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-semibold text-primary-ink"
                  >
                    Página do projeto ↗
                  </a>
                )}
                {p.linkTermoCompromisso && (
                  <a
                    href={p.linkTermoCompromisso}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text"
                  >
                    Termo de compromisso ↗
                  </a>
                )}
              </div>
            </li>
              ))}
            </ul>
          </section>
        );
      })()}

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">O que é essa auditoria</h2>
        <p className="mt-2">
          A FGV é a auditora independente definida no Acordo Judicial de
          Repactuação de Indenizações (AJRI) — não tem vínculo com a Vale
          nem com as prefeituras. Os dados aqui vêm direto da planilha
          mensal de &quot;Dados Abertos&quot; publicada pela própria FGV, não de
          scraping do site.
        </p>
        <p className="mt-2">
          <a
            href="https://www18.fgv.br/projetorioparaopeba/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Ver o portal completo da FGV ↗
          </a>
        </p>
      </section>
    </div>
  );
}
