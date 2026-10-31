import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowRight, Globe, Shield, Map, Scale } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import DataColeta from "@/app/components/DataColeta";
import { PAISES_ASIA, paisesPorSubRegiao } from "@/lib/direitos-globais/asia/paises";
import { INSTRUMENTOS_REGIONAIS_ASIA } from "@/lib/direitos-globais/asia/tratados-regionais";
import TabelaAsiaInterativa from "../componentes/TabelaAsiaInterativa";
import { DISPOSITIVOS_ASIA } from "@/lib/direitos-globais/asia/dispositivos";
import { SecaoDispositivosComFiltro } from "../componentes/Dispositivos";

export const metadata: Metadata = {
  title: "Ásia e Direitos Fundamentais | Direitos Globais | Controle Popular",
  description:
    "Comparação dos 48 países asiáticos organizados por sub-regiões geográficas, dispositivos constitucionais conferidos, ausência de corte regional vinculante e controle no sistema ONU.",
};

function ResumoAsia() {
  const totalPaises = PAISES_ASIA.length;
  const totalDispositivos = DISPOSITIVOS_ASIA.length;

  return (
    <section aria-labelledby="indicadores-asia" className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <h2 id="indicadores-asia" className="sr-only">Indicadores da Ásia</h2>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Total de Países</p>
        <p className="mt-1 text-2xl font-black text-text">{totalPaises} Estados</p>
        <p className="text-xs text-text-soft">5 sub-regiões geográficas</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Dispositivos Conferidos</p>
        <p className="mt-1 text-2xl font-black text-primary">{totalDispositivos}</p>
        <p className="text-xs text-text-soft">Artigos transcritos verbatim</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Corte Regional</p>
        <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">Ausente</p>
        <p className="text-xs text-text-soft">Sem tribunal supranacional</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-text-soft">Instância de Controle</p>
        <p className="mt-1 text-2xl font-black text-text">ONU / UPR</p>
        <p className="text-xs text-text-soft">8 Órgãos de Tratados</p>
      </div>
    </section>
  );
}

function SubRegioesAsia() {
  const contagens = {
    leste: paisesPorSubRegiao("Leste Asiático").length,
    sudeste: paisesPorSubRegiao("Sudeste Asiático").length,
    sul: paisesPorSubRegiao("Sul da Ásia").length,
    central: paisesPorSubRegiao("Ásia Central").length,
    ocidental: paisesPorSubRegiao("Ásia Ocidental").length,
  };

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-text">Sub-regiões da Ásia</h2>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-primary"><Globe className="h-5 w-5" /></div>
          <h3 className="text-base font-semibold text-text">Leste Asiático</h3>
          <p className="mb-2 text-xs text-text-700 leading-relaxed">
            China, Japão, Coreia do Sul, Mongólia e Taiwan: constituições com garantias de trabalho, saúde e igualdade de gênero.
          </p>
          <span className="text-xs text-text-soft font-medium">{contagens.leste} países</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-primary"><Map className="h-5 w-5" /></div>
          <h3 className="text-base font-semibold text-text">Sudeste Asiático</h3>
          <p className="mb-2 text-xs text-text-700 leading-relaxed">
            Filipinas, Vietnã, Indonésia, Tailândia e membros da ASEAN: mecanismo intergovernamental consultivo (AICHR).
          </p>
          <span className="text-xs text-text-soft font-medium">{contagens.sudeste} países</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-primary"><Scale className="h-5 w-5" /></div>
          <h3 className="text-base font-semibold text-text">Sul da Ásia</h3>
          <p className="mb-2 text-xs text-text-700 leading-relaxed">
            Índia, Paquistão, Bangladesh, Nepal e Sri Lanka: proteção judicial histórica a castas e comunidades vulneráveis.
          </p>
          <span className="text-xs text-text-soft font-medium">{contagens.sul} países</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-primary"><Shield className="h-5 w-5" /></div>
          <h3 className="text-base font-semibold text-text">Ásia Central</h3>
          <p className="mb-2 text-xs text-text-700 leading-relaxed">
            Cazaquistão, Uzbequistão, Quirguistão, Tajiquistão e Turcomenistão: reformas pós-soviéticas e acompanhamento pela ONU.
          </p>
          <span className="text-xs text-text-soft font-medium">{contagens.central} países</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-primary"><Globe className="h-5 w-5" /></div>
          <h3 className="text-base font-semibold text-text">Ásia Ocidental (Oriente Médio)</h3>
          <p className="mb-2 text-xs text-text-700 leading-relaxed">
            18 Estados incluindo Turquia, Arábia Saudita, Irã e Levante: compromissos perante os órgãos de tratados e a Carta Árabe.
          </p>
          <span className="text-xs text-text-soft font-medium">{contagens.ocidental} países</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 text-primary"><Map className="h-5 w-5" /></div>
          <h3 className="text-base font-semibold text-text">Norte da Ásia (Transcontinental)</h3>
          <p className="mb-2 text-xs text-text-700 leading-relaxed">
            Rússia: analisada como Estado transcontinental euro-asiático, sem vinculação ao Conselho da Europa desde 2022.
          </p>
          <span className="text-xs text-text-soft font-medium">1 país transcontinental</span>
        </div>
      </div>
    </div>
  );
}

function AlertaInexistenciaTribunal() {
  return (
    <section className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <h2 className="text-base font-bold text-text">
            Particularidade Regional: Inexistência de Tribunal Regional Asiático
          </h2>
          <p className="mt-1 text-xs text-text-700 leading-relaxed">
            Ao contrário da América Latina (Corte IDH), da África (Corte Africana) e da Europa (TEDH), o continente asiático não dispõe de um tribunal supranacional com competência contenciosa vinculante.
            Dessa forma, o escrutínio sobre o cumprimento de direitos humanos recai essencialmente sobre os comitês de tratados da ONU (CCPR, CESCR, CEDAW, CRC, etc.) e o mecanismo de Revisão Periódica Universal (UPR).
          </p>
          <div className="mt-2.5">
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

export default function PaginaAsia() {
  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Navegação estrutural" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-text-soft">
        <Link href="/" className="hover:text-primary hover:underline">Início</Link>
        <span>/</span>
        <Link href="/direitos-globais" className="hover:text-primary hover:underline">Direitos Globais</Link>
        <span>/</span>
        <span className="font-semibold text-text">Ásia e Direitos Fundamentais</span>
      </nav>

      <header className="mb-6">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          Frente C — Ásia e Sistema Universal
        </span>
        <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
          Ásia e Direitos Fundamentais
        </h1>
        <p className="mt-2 text-sm text-text-soft leading-relaxed max-w-3xl">
          Comparação sistemática dos 48 países da Ásia organizados por sub-regiões geográficas, dispositivos constitucionais transcritos na íntegra e cruzamento com as obrigações do sistema de proteção da ONU.
        </p>
        <DataColeta
          coletadoEm="2026-10-30"
          fonte="Fontes Primárias: Constitute Project (constituteproject.org), Diários Oficiais e OHCHR / Nações Unidas (ohchr.org)"
          competencia="48 Estados soberanos da Ásia nas 5 sub-regiões · Órgãos de Tratados da ONU"
        />
      </header>

      <ResumoAsia />

      <SubRegioesAsia />

      <AlertaInexistenciaTribunal />

      {/* Tabela Interativa Unificada com Busca e Filtro por Sub-região */}
      <section className="mb-8">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-text">Comparador Geral dos Países Asiáticos</h2>
          <p className="text-xs text-text-soft">
            Explore os 48 países por sub-região geográfica, ordene por população estimada e exporte os dados consolidados em CSV.
          </p>
        </div>
        <TabelaAsiaInterativa paises={PAISES_ASIA} />
      </section>

      {/* Dispositivos Constitucionais Conferidos com Filtro por Tema */}
      <SecaoDispositivosComFiltro
        dispositivos={DISPOSITIVOS_ASIA}
        titulo="Dispositivos Constitucionais Conferidos na Ásia"
        descricao="28 artigos transcritos verbatim abrangendo meio ambiente, mulheres, crianças, povos/minorias, saúde, idosos e trabalho digno."
      />

      {/* Mecanismos e Instrumentos Regionais */}
      <section className="mb-8 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-bold text-text mb-2">Instrumentos Regionais e Institucionais da Ásia</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {INSTRUMENTOS_REGIONAIS_ASIA.map((inst) => (
            <div key={inst.id} className="rounded-lg border border-border/60 bg-surface-2 p-3 text-xs">
              <h3 className="font-semibold text-text">{inst.nome}</h3>
              <p className="mt-1 text-text-soft leading-relaxed">{inst.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <Link href="/direitos-globais" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
          ← Voltar para o Hub de Direitos Globais
        </Link>
      </div>

      <FooterGlobal />
    </main>
  );
}
