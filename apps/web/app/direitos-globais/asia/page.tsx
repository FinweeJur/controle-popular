import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ExternalLink, ArrowRight } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import DataColeta from "@/app/components/DataColeta";
import { PAISES_ASIA, paisesPorLeva, type PaisAsiatico } from "@/lib/direitos-globais/asia/paises";
import { INSTRUMENTOS_REGIONAIS_ASIA } from "@/lib/direitos-globais/asia/tratados-regionais";
import TabelaAsiaInterativa from "../componentes/TabelaAsiaInterativa";
import { DISPOSITIVOS_ASIA } from "@/lib/direitos-globais/asia/dispositivos";
import { ListaDispositivos } from "../componentes/Dispositivos";

export const metadata: Metadata = {
  title: "Ásia e Direitos Fundamentais | Direitos Globais | Controle Popular",
  description:
    "Comparação jurídica dos países asiáticos organizados em levas prioritárias, cruzamento com a ausência de corte regional e remissão ao sistema ONU.",
};

function ResumoAsia() {
  const totalPaises = PAISES_ASIA.length;
  const totalLeva1 = paisesPorLeva(1).length;
  const totalLeva2 = paisesPorLeva(2).length;
  const totalLeva3 = paisesPorLeva(3).length;

  return (
    <section aria-labelledby="indicadores-asia" className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <h2 id="indicadores-asia" className="sr-only">Indicadores da Ásia</h2>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Total de Países</p>
        <p className="mt-1 text-2xl font-black text-text">{totalPaises}</p>
        <p className="text-xs text-text-soft">Levas 1 a 3 catalogadas</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Leva 1 — Prioritários</p>
        <p className="mt-1 text-2xl font-black text-primary">{totalLeva1}</p>
        <p className="text-xs text-text-soft">Grandes potências e populações</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Leva 2 — Emergentes</p>
        <p className="mt-1 text-2xl font-black text-text">{totalLeva2}</p>
        <p className="text-xs text-text-soft">Sudeste e Sul da Ásia</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Leva 3 — Expansão</p>
        <p className="mt-1 text-2xl font-black text-text">{totalLeva3}</p>
        <p className="text-xs text-text-soft">Himalaia, Indochina e Ásia Central</p>
      </div>
    </section>
  );
}

function AlertaInexistenciaTribunal() {
  return (
    <section className="mb-10 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h2 className="text-lg font-bold text-text">
            Particularidade Regional: Inexistência de Tribunal Regional Asiático
          </h2>
          <p className="mt-1.5 text-sm text-text-700 leading-relaxed">
            Diferente da América Latina e África, a Ásia não possui tratado geral vinculante nem corte de direitos humanos.
            O controle de cumprimento recai diretamente sobre os órgãos de tratados e a UPR da ONU.
          </p>
          <div className="mt-3">
            <Link
              href="/direitos-globais/onu"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Acessar o Painel de Tratados e Recomendações da ONU
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SecaoLeva1({ paises }: { paises: readonly PaisAsiatico[] }) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-text">Leva 1 — Países Prioritários</h2>
          <p className="text-xs text-text-soft">China, Rússia, Índia, Vietnã, Japão e Filipinas</p>
        </div>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">6 Países</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paises.map((p) => (
          <div
            key={p.codigo}
            className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-text-soft font-semibold">{p.codigo}</span>
                <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-text-soft">{p.subRegiao}</span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-text">{p.nome}</h3>
              <p className="text-xs text-text-soft">Capital: {p.capital}</p>
              {p.populacao && (
                <p className="mt-2 text-xs text-text-700">
                  <strong className="text-text">População:</strong> {(p.populacao / 1000000).toFixed(0)}M
                </p>
              )}
              {p.notaTranscontinental && (
                <div className="mt-3 rounded border border-primary/20 bg-primary/5 p-2.5 text-xs text-text-700">
                  <span className="font-bold text-primary">Nota Transcontinental:</span> {p.notaTranscontinental}
                </div>
              )}
              {p.mecanismoRegional && (
                <p className="mt-2 text-xs text-text-soft">
                  <strong className="text-text">Instância:</strong> {p.mecanismoRegional}
                </p>
              )}
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <Link
                href="/direitos-globais/onu"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Ver recomendações da ONU para {p.nome}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecaoLeva2({ paises }: { paises: readonly PaisAsiatico[] }) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-text">Leva 2 — Economias Emergentes e Sudeste/Sul da Ásia</h2>
          <p className="text-xs text-text-soft">Indonésia, Bangladesh, Paquistão, Tailândia, Malásia e Coreia do Sul</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {paises.map((p) => (
          <div key={p.codigo} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text text-sm">{p.nome}</h3>
              <span className="font-mono text-xs text-text-soft">{p.codigo}</span>
            </div>
            <p className="text-xs text-text-soft mt-1">{p.subRegiao} · {p.capital}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SecaoLeva3({ paises }: { paises: readonly PaisAsiatico[] }) {
  return (
    <section className="mb-12">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-text">Leva 3 — Himalaia, Indochina e Ásia Central</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {paises.map((p) => (
          <span key={p.codigo} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text">
            {p.nome} ({p.codigo}) · {p.subRegiao}
          </span>
        ))}
      </div>
    </section>
  );
}

function SecaoInstrumentosRegionais() {
  return (
    <section className="mb-12 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-3 text-xl font-bold text-text">Instrumentos Regionais Declaratórios na Ásia</h2>
      <div className="space-y-4">
        {INSTRUMENTOS_REGIONAIS_ASIA.map((inst) => (
          <div key={inst.id} className="border-l-2 border-primary/40 pl-4">
            <h3 className="font-semibold text-text text-sm">{inst.nome} ({inst.ano})</h3>
            <p className="mt-1 text-xs text-text-700 leading-relaxed">{inst.descricao}</p>
            {inst.url && (
              <a href={inst.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                Documento Oficial <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function DispositivosConferidosAsia() {
  const paises = [...new Set(DISPOSITIVOS_ASIA.map((d) => d.pais))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  return (
    <section className="mb-12">
      <h2 className="mb-2 text-xl font-bold text-text">Dispositivos Constitucionais Conferidos</h2>
      <p className="mb-6 text-sm text-text-soft">
        Artigos transcritos na íntegra (verbatim) de constituições asiáticas com foco em equilíbrio ecológico, terras ancestrais e trabalho.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        {paises.map((pais) => (
          <ListaDispositivos
            key={pais}
            pais={pais}
            dispositivos={DISPOSITIVOS_ASIA.filter((d) => d.pais === pais)}
          />
        ))}
      </div>
    </section>
  );
}

export default function PaginaAsia() {
  const leva1 = paisesPorLeva(1);
  const leva2 = paisesPorLeva(2);
  const leva3 = paisesPorLeva(3);

  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Navegação estrutural" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft">
        <Link href="/" className="hover:text-primary hover:underline">Início</Link>
        <span>/</span>
        <Link href="/direitos-globais" className="hover:text-primary hover:underline">Direitos Globais</Link>
        <span>/</span>
        <span className="font-semibold text-text">Ásia</span>
      </nav>

      <header className="mb-8">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Frente C — Ásia & Sistema ONU
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Sistemas de Direitos na Ásia
        </h1>
        <p className="mt-3 text-base text-text-soft sm:text-lg">
          Comparação dos países asiáticos organizados em levas prioritárias e cruzamento com os tratados da ONU.
        </p>
        <DataColeta
          coletadoEm="2026-10-30"
          fonte="Constitute Project, ASEAN (asean.org) e AICHR"
          competencia="Levas 1 a 3 (23 países) · Atualizado em 2026"
        />
      </header>

      <ResumoAsia />

      <AlertaInexistenciaTribunal />

      <section className="mb-12">
        <h2 className="text-xl font-bold text-text mb-2">Quadro Comparativo de Países Asiáticos</h2>
        <p className="text-xs text-text-soft mb-4">
          Busca textual em tempo real, filtros por leva e sub-região, ordenação por coluna e download de planilha CSV.
        </p>
        <TabelaAsiaInterativa paises={PAISES_ASIA} />
      </section>

      <SecaoLeva1 paises={leva1} />
      <SecaoLeva2 paises={leva2} />
      <SecaoLeva3 paises={leva3} />
      <DispositivosConferidosAsia />
      <SecaoInstrumentosRegionais />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/direitos-globais" className="text-sm font-medium text-primary hover:underline">
          ← Voltar para Direitos Globais
        </Link>
        <Link href="/direitos-globais/onu" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          Explorar Painel de Recomendações da ONU →
        </Link>
      </div>

      <FooterGlobal />
    </main>
  );
}
