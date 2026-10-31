import type { Metadata } from "next";
import Link from "next/link";
import { Users, Map, Scale, Globe, ArrowRight } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import DataColeta from "@/app/components/DataColeta";
import { DISPOSITIVOS } from "@/lib/direitos-globais/dispositivos";
import { PAISES_AMERICA_LATINA } from "@/lib/direitos-globais/dados";
import { SecaoDispositivosComFiltro } from "../componentes/Dispositivos";
import TabelaAmericaLatinaInterativa from "../componentes/TabelaAmericaLatinaInterativa";

export const metadata: Metadata = {
  title: "América Latina e Sistema Interamericano | Direitos Globais | Controle Popular",
  description:
    "Comparação dos 20 países da América Latina, 84 dispositivos conferidos cobrindo o catálogo completo de 24 temas prioritários, CIDH, Corte IDH e 402 sentenças.",
};

interface SubRegiaoCardProps {
  title: string;
  description: string;
  countries: number;
  icon: React.ReactNode;
}

function SubRegiaoCard({ title, description, countries, icon }: SubRegiaoCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 sm:p-4.5">
      <div className="mb-2.5 text-primary">{icon}</div>
      <h3 className="mb-1 text-base font-semibold text-text">{title}</h3>
      <p className="mb-2 text-xs text-text-700 leading-relaxed">{description}</p>
      <p className="text-xs font-medium text-text-soft">{countries} países catalogados</p>
    </div>
  );
}

interface MetricaCardProps {
  title: string;
  data: Array<{ region: string; value: string }>;
  icon: React.ReactNode;
}

function MetricaCard({ title, data, icon }: MetricaCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2.5 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="text-sm font-semibold text-text">{title}</h3>
      </div>
      <div className="space-y-1.5">
        {data.map((item) => (
          <div key={item.region} className="flex justify-between text-xs">
            <span className="text-text-700">{item.region}</span>
            <span className="font-semibold text-text">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubRegioes() {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-text">Sub-regiões da América Latina</h2>
      <div className="grid gap-3.5 sm:grid-cols-3">
        <SubRegiaoCard
          title="América do Sul"
          description="12 países com forte proteção constitucional ambiental, agrária e indígena"
          countries={12}
          icon={<Map className="h-6 w-6" />}
        />
        <SubRegiaoCard
          title="América Central"
          description="7 repúblicas com garantias expressas de due process e recursos hídricos"
          countries={7}
          icon={<Scale className="h-6 w-6" />}
        />
        <SubRegiaoCard
          title="Caribe"
          description="Cuba, República Dominicana e Haiti sob compromissos da Carta da OEA"
          countries={1}
          icon={<Globe className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}

function SistemaInteramericano() {
  return (
    <section className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            Jurisprudência Vinculante
          </span>
          <h2 className="mt-1 text-base font-bold text-text">
            Sistema Interamericano de Direitos Humanos (CIDH e Corte IDH)
          </h2>
          <p className="mt-1 text-xs text-text-soft leading-relaxed max-w-2xl">
            Quem recomenda é a Comissão Interamericana (CIDH); quem condena com sentença vinculante é a Corte IDH.
            Acesse o banco de 402 sentenças contenciosas e meça o cumprimento das reparações em cada país.
          </p>
        </div>
        <Link
          href="/direitos-globais/america-latina/cidh"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          <span>Ver CIDH e Corte IDH</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}

function MetricasComparativas() {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-bold text-text">Métricas Comparativas</h2>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <MetricaCard
          title="IDH Médio por Sub-região"
          data={[
            { region: "América do Sul", value: "0.754" },
            { region: "América Central", value: "0.723" },
            { region: "Caribe Latino", value: "0.699" },
          ]}
          icon={<Users className="h-5 w-5" />}
        />
        <MetricaCard
          title="Proteção Ambiental e Direitos da Natureza"
          data={[
            { region: "Equador", value: "Muito Forte (Pacha Mama, Art. 71)" },
            { region: "Bolívia", value: "Muito Forte (Mãe Terra e Água, Art. 373)" },
            { region: "Brasil", value: "Forte (CF/88 Art. 225 e PNAB Lei 14.755)" },
            { region: "Uruguai", value: "Forte (Água Direito Fundamental, Art. 47)" },
          ]}
          icon={<Scale className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}

export default function PaginaAmericaLatina() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <nav
        aria-label="Navegação estrutural"
        className="mb-5 flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/direitos-globais" className="hover:text-primary hover:underline">
          Direitos Globais
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">América Latina</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
          América Latina
        </h1>
        <p className="mt-2 text-sm text-text-soft leading-relaxed">
          Comparação sistemática de direitos entre os 20 países da América Latina, abrangendo direitos humanos,
          ambiental, mulheres, crianças, povos indígenas, quilombolas, campesinos, atingidos por barragens e água.
        </p>
        <DataColeta
          coletadoEm="2026-10-30"
          fonte="Fontes Primárias Oficiais: Constitute Project, Câmara dos Deputados (Brasil), Senado da Colômbia e Diários Oficiais"
          competencia="20 Estados Soberanos da América Latina, Sistema Interamericano (CIDH/Corte IDH)"
        />
      </header>

      <SubRegioes />

      <SistemaInteramericano />

      {/* Tabela Interativa com Busca e CSV */}
      <section className="mb-8">
        <div className="mb-3">
          <h2 className="text-lg font-bold text-text">Comparador Geral de Países</h2>
          <p className="text-xs text-text-soft">
            Filtre por sub-região, ordene por população ou IDH e exporte os dados consolidados em CSV.
          </p>
        </div>
        <TabelaAmericaLatinaInterativa paises={PAISES_AMERICA_LATINA} />
      </section>

      {/* Dispositivos Conferidos com Filtro por Tema */}
      <SecaoDispositivosComFiltro
        dispositivos={DISPOSITIVOS}
        titulo="Dispositivos Constitucionais Conferidos na América Latina"
        descricao="84 dispositivos com texto integral verbatim. Use o seletor para filtrar por mulheres, crianças, quilombolas, campesinos, atingidos ou meio ambiente."
      />

      <MetricasComparativas />

      <FooterGlobal />
    </main>
  );
}
