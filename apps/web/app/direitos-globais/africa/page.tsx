import type { Metadata } from "next";
import Link from "next/link";
import { Shield, CheckCircle, AlertTriangle, XCircle, HelpCircle, FileText } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import DataColeta from "@/app/components/DataColeta";
import { PAISES_AFRICA, type PaisAfricano } from "@/lib/direitos-globais/africa/paises";
import { totalRatificacoesTratado } from "@/lib/direitos-globais/africa/tratados-ua";
import { CASOS_AFRICANOS } from "@/lib/direitos-globais/africa/casos-corte-africana";
import { RECOMENDACOES_ACHPR, type RecomendacaoAfricana } from "@/lib/direitos-globais/africa/recomendacoes-achpr";
import TabelaAfricaInterativa from "../componentes/TabelaAfricaInterativa";
import TabelaCasosAfricaInterativa from "../componentes/TabelaCasosAfricaInterativa";

export const metadata: Metadata = {
  title: "África e Corte Africana | Direitos Globais | Controle Popular",
  description:
    "Comparação dos 54 países africanos, tratados da União Africana, sentenças da Corte Africana e da Comissão (ACHPR), com foco central nos Direitos dos Povos.",
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
  if (status === "descumprido" || status === "nao") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        <XCircle className="h-3 w-3" />
        {status === "descumprido" ? "Descumprido" : "Não ratificado"}
      </span>
    );
  }
  if (status === "assinado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
        <FileText className="h-3 w-3" />
        Apenas assinado
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

function EstatisticasAfrica() {
  const total = PAISES_AFRICA.length;
  const achpr = totalRatificacoesTratado("achpr");
  const corte = totalRatificacoesTratado("corte-protocolo");
  const maputo = totalRatificacoesTratado("maputo");
  const kampala = totalRatificacoesTratado("kampala");

  return (
    <section aria-labelledby="indicadores-titulo" className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <h2 id="indicadores-titulo" className="sr-only">Indicadores principais</h2>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Carta Africana (ACHPR)</p>
        <p className="mt-1 text-2xl font-black text-text">{achpr} / {total}</p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Ratificação quase universal</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Protocolo de Maputo</p>
        <p className="mt-1 text-2xl font-black text-text">{maputo} / {total}</p>
        <p className="text-xs text-text-soft">Direitos das Mulheres</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Protocolo da Corte</p>
        <p className="mt-1 text-2xl font-black text-text">{corte} / {total}</p>
        <p className="text-xs text-text-soft">Corte Africana</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Convenção de Kampala</p>
        <p className="mt-1 text-2xl font-black text-text">{kampala} / {total}</p>
        <p className="text-xs text-text-soft">Deslocados internos</p>
      </div>
    </section>
  );
}

function SecaoDireitosDosPovos() {
  return (
    <section className="mb-12 rounded-xl border border-primary/20 bg-primary/5 p-6">
      <div className="flex items-start gap-3">
        <Shield className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-text">
            Direitos dos Povos: Arts. 19 a 24 da Carta Africana
          </h2>
          <p className="mt-2 text-sm text-text-700">
            A Carta de Banjul inovou no cenário jurídico global ao conceder eficácia cogente aos direitos coletivos dos povos.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs font-bold text-primary">Arts. 19 & 20</span>
              <p className="font-medium text-text text-sm">Autodeterminação</p>
              <p className="mt-1 text-xs text-text-soft">Igualdade entre povos e libertação da dominação externa.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs font-bold text-primary">Art. 21</span>
              <p className="font-medium text-text text-sm">Recursos Naturais</p>
              <p className="mt-1 text-xs text-text-soft">Livre disposição das riquezas e proteção contra exploração predatória.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs font-bold text-primary">Art. 22</span>
              <p className="font-medium text-text text-sm">Desenvolvimento</p>
              <p className="mt-1 text-xs text-text-soft">Direito inalienável ao progresso econômico, social e cultural.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs font-bold text-primary">Art. 23</span>
              <p className="font-medium text-text text-sm">Paz e Segurança</p>
              <p className="mt-1 text-xs text-text-soft">Segurança nacional e coletiva contra agressões armadas e saques.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs font-bold text-primary">Art. 24</span>
              <p className="font-medium text-text text-sm">Meio Ambiente</p>
              <p className="mt-1 text-xs text-text-soft">Ambiente geral satisfatório para o bem-estar e saúde das comunidades.</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <span className="text-xs font-bold text-primary">Arts. 17 & 18</span>
              <p className="font-medium text-text text-sm">Cultura e Tradição</p>
              <p className="mt-1 text-xs text-text-soft">Respeito e promoção das identidades, memórias e saberes ancestrais.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SecaoArtigo34({ paises }: { paises: readonly PaisAfricano[] }) {
  const ativos = paises.filter((p) => p.declarouArt34 && !p.revogouArt34);
  const revogados = paises.filter((p) => p.revogouArt34);

  return (
    <section className="mb-12 rounded-xl border border-border bg-surface p-6">
      <h2 className="text-xl font-bold text-text">Declaração do Artigo 34(6) da Corte Africana</h2>
      <p className="mt-2 text-sm text-text-700">
        Cláusula pela qual o Estado permite que indivíduos e ONGs demandem diretamente contra ele perante a Corte.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">
            Acesso Direto Ativo ({ativos.length})
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ativos.map((p) => (
              <span key={p.codigo} className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-text border border-border">
                {p.nome}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
          <h3 className="font-semibold text-rose-700 dark:text-rose-300 text-sm">
            Declaração Revogada ({revogados.length})
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {revogados.map((p) => (
              <span key={p.codigo} className="rounded bg-surface px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400 border border-rose-500/30">
                {p.nome}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SecaoCasosCorteAfricana() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold text-text mb-2">Casos Paradigmáticos da Corte e da Comissão Africana</h2>
      <p className="text-xs text-text-soft mb-4">
        Busca textual, filtros por tema e status de cumprimento com exportação de planilha CSV e link para o PDF oficial do acórdão.
      </p>
      <TabelaCasosAfricaInterativa casos={CASOS_AFRICANOS} />
    </section>
  );
}

function TabelaAdesaoAfrica() {
  return (
    <section className="mb-12">
      <h2 className="mb-2 text-xl font-bold text-text">Quadro de Adesão aos Tratados da UA (54 Países)</h2>
      <p className="mb-4 text-xs text-text-soft">
        Busca em tempo real, filtros por sub-região e declaração do Artigo 34(6), ordenação por coluna e download em CSV (Excel BR).
      </p>
      <TabelaAfricaInterativa paises={PAISES_AFRICA} />
    </section>
  );
}

function SecaoRecomendacoesACHPR({ recomendacoes }: { recomendacoes: readonly RecomendacaoAfricana[] }) {
  return (
    <section className="mb-12">
      <h2 className="mb-2 text-xl font-bold text-text">Recomendações da Comissão (ACHPR)</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {recomendacoes.map((rec, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{rec.pais}</span>
              <span className="text-xs text-text-soft">{rec.sessao}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-text">{rec.documento}</h3>
            <p className="mt-2 text-xs text-text-700 leading-relaxed">{rec.texto}</p>
            {rec.evidencia && (
              <div className="mt-3 rounded border border-border bg-surface-2 p-2 text-xs text-text-soft">
                <strong className="text-text">Evidência:</strong> {rec.evidencia}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
              <StatusBadge status={rec.status} />
              <a href={rec.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                ACHPR Oficial
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PaginaAfrica() {
  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Navegação estrutural" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft">
        <Link href="/" className="hover:text-primary hover:underline">Início</Link>
        <span>/</span>
        <Link href="/direitos-globais" className="hover:text-primary hover:underline">Direitos Globais</Link>
        <span>/</span>
        <span className="font-semibold text-text">África e Corte Africana</span>
      </nav>

      <header className="mb-8">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Frente B — Sul Global
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          África e Sistema Africano de Direitos
        </h1>
        <p className="mt-3 text-base text-text-soft sm:text-lg">
          Comparação dos 54 países da União Africana com foco central nos Direitos dos Povos, tratados da UA e jurisprudência da Corte Africana.
        </p>
        <DataColeta
          coletadoEm="2026-10-30"
          fonte="União Africana (au.int), Corte Africana (african-court.org) e ACHPR (achpr.org)"
          competencia="54 países soberanos · Tratados em vigor até 2026"
        />
      </header>

      <EstatisticasAfrica />
      <SecaoDireitosDosPovos />
      <SecaoArtigo34 paises={PAISES_AFRICA} />
      <SecaoCasosCorteAfricana />
      <TabelaAdesaoAfrica />
      <SecaoRecomendacoesACHPR recomendacoes={RECOMENDACOES_ACHPR} />

      <div className="mt-8">
        <Link href="/direitos-globais" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          ← Voltar para Direitos Globais
        </Link>
      </div>

      <FooterGlobal />
    </main>
  );
}
