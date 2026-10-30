import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, AlertTriangle, XCircle, FileText, ExternalLink, HelpCircle } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import { ORGAOS_TRATADOS_ONU, adesaoPaisONU, type OrgaoTratadoONU } from "@/lib/direitos-globais/onu/orgaos-tratados";
import { RECOMENDACOES_ONU_ASIA, type RecomendacaoONU } from "@/lib/direitos-globais/onu/recomendacoes-upr";
import { paisesPorLeva, type PaisAsiatico } from "@/lib/direitos-globais/asia/paises";

export const metadata: Metadata = {
  title: "Sistema ONU e Órgãos de Tratados | Direitos Globais | Controle Popular",
  description:
    "Acompanhamento das recomendações dos Comitês de Tratados da ONU e da Revisão Periódica Universal (UPR) para os países asiáticos.",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "cumprido" || status === "ratificado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        {status === "cumprido" ? "Cumprido" : "Ratificado"}
      </span>
    );
  }
  if (status === "parcial") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-3 w-3" />
        Parcial
      </span>
    );
  }
  if (status === "nao") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        <XCircle className="h-3 w-3" />
        Não signatário
      </span>
    );
  }
  if (status === "assinado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
        <FileText className="h-3 w-3" />
        Assinado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-soft">
      <HelpCircle className="h-3 w-3" />
      Desconhecido
    </span>
  );
}

function SecaoOrgaosTratados({ comites }: { comites: readonly OrgaoTratadoONU[] }) {
  return (
    <section className="mb-12">
      <h2 className="mb-2 text-xl font-bold text-text">Os 8 Órgãos de Tratados Fundamentais (Treaty Bodies)</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {comites.map((comite) => (
          <div key={comite.id} className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4">
            <div>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
                {comite.siglaTratado}
              </span>
              <h3 className="mt-2 text-sm font-bold text-text">{comite.nomeComite}</h3>
              <p className="mt-1 text-xs text-text-soft">{comite.tratado} ({comite.anoAdocao})</p>
              <p className="mt-2 text-xs text-text-700 leading-relaxed">{comite.resumo}</p>
            </div>
            <div className="mt-3 border-t border-border pt-2 text-xs">
              <a href={comite.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                Página Oficial (OHCHR) <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TabelaAdesaoONU({ paises }: { paises: readonly PaisAsiatico[] }) {
  return (
    <section className="mb-12">
      <h2 className="mb-2 text-xl font-bold text-text">Matriz de Ratificação dos Tratados da ONU (Leva 1 — Ásia)</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-surface-2 text-text font-semibold">
            <tr>
              <th className="px-3 py-2.5">País</th>
              <th className="px-2 py-2.5">ICCPR</th>
              <th className="px-2 py-2.5">ICESCR</th>
              <th className="px-2 py-2.5">CEDAW</th>
              <th className="px-2 py-2.5">CRC</th>
              <th className="px-2 py-2.5">CAT</th>
              <th className="px-2 py-2.5">CRPD</th>
              <th className="px-2 py-2.5">CMW</th>
              <th className="px-2 py-2.5">CED</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paises.map((p) => (
              <tr key={p.codigo} className="hover:bg-surface-2/50">
                <td className="px-3 py-2.5 font-medium text-text">
                  {p.nome} <span className="font-mono text-text-soft">({p.codigo})</span>
                </td>
                <td className="px-2 py-2"><StatusBadge status={adesaoPaisONU(p.nome, "ccpr").status} /></td>
                <td className="px-2 py-2"><StatusBadge status={adesaoPaisONU(p.nome, "cescr").status} /></td>
                <td className="px-2 py-2"><StatusBadge status={adesaoPaisONU(p.nome, "cedaw").status} /></td>
                <td className="px-2 py-2"><StatusBadge status={adesaoPaisONU(p.nome, "crc").status} /></td>
                <td className="px-2 py-2"><StatusBadge status={adesaoPaisONU(p.nome, "cat").status} /></td>
                <td className="px-2 py-2"><StatusBadge status={adesaoPaisONU(p.nome, "crpd").status} /></td>
                <td className="px-2 py-2"><StatusBadge status={adesaoPaisONU(p.nome, "cmw").status} /></td>
                <td className="px-2 py-2"><StatusBadge status={adesaoPaisONU(p.nome, "ced").status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SecaoRecomendacoesONU({ recomendacoes }: { recomendacoes: readonly RecomendacaoONU[] }) {
  return (
    <section className="mb-12">
      <h2 className="mb-2 text-xl font-bold text-text">Recomendações UPR e Observações Conclusivas de Seguimento</h2>
      <div className="space-y-4">
        {recomendacoes.map((rec, i) => (
          <article key={i} className="rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{rec.pais}</span>
                <span className="ml-2 rounded bg-surface-2 px-2 py-0.5 text-xs font-mono font-medium text-text-soft">
                  {rec.orgao} {rec.cicloUpr ? `· ${rec.cicloUpr}` : ""}
                </span>
                <h3 className="mt-1 text-sm font-bold text-text">{rec.documento}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-soft">{rec.data}</span>
                <StatusBadge status={rec.status} />
              </div>
            </div>
            <p className="mt-3 text-xs sm:text-sm text-text-700 leading-relaxed font-sans">{rec.texto}</p>
            {rec.evidencia && (
              <div className="mt-3 rounded border border-border bg-surface-2 p-3 text-xs text-text-700">
                <strong className="text-text">Evidência oficial:</strong> {rec.evidencia}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs">
              <span className="text-text-soft">Sessão: {rec.sessao ?? "Periódica"}</span>
              <a href={rec.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                Documento Oficial da ONU <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function PaginaONU() {
  const paisesLeva1 = paisesPorLeva(1);

  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Navegação estrutural" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft">
        <Link href="/" className="hover:text-primary hover:underline">Início</Link>
        <span>/</span>
        <Link href="/direitos-globais" className="hover:text-primary hover:underline">Direitos Globais</Link>
        <span>/</span>
        <Link href="/direitos-globais/asia" className="hover:text-primary hover:underline">Ásia</Link>
        <span>/</span>
        <span className="font-semibold text-text">Sistema ONU & Órgãos de Tratados</span>
      </nav>

      <header className="mb-8">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Sistema Universal · Nações Unidas
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Sistema ONU: Tratados e Recomendações
        </h1>
        <p className="mt-3 text-base text-text-soft sm:text-lg">
          Cruzamento documental entre as cobranças dos órgãos de tratados da ONU, recomendações UPR e estado real de execução.
        </p>
      </header>

      <SecaoOrgaosTratados comites={ORGAOS_TRATADOS_ONU} />
      <TabelaAdesaoONU paises={paisesLeva1} />
      <SecaoRecomendacoesONU recomendacoes={RECOMENDACOES_ONU_ASIA} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/direitos-globais/asia" className="text-sm font-medium text-primary hover:underline">
          ← Voltar para Ásia
        </Link>
        <Link href="/direitos-globais/africa" className="text-sm font-medium text-primary hover:underline">
          Explorar África e Corte Africana →
        </Link>
      </div>

      <FooterGlobal />
    </main>
  );
}
