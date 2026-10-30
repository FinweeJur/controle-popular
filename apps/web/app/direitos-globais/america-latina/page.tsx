
import Link from "next/link";
import { ArrowRight, Users, Map, Scale, Globe } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Card de sub-região para a américa latina.
 */
interface SubRegiaoCardProps {
  title: string;
  description: string;
  countries: number;
  icon: React.ReactNode;
  href: string;
}

function SubRegiaoCard({ title, description, countries, icon, href }: SubRegiaoCardProps) {
  return (
    <Link href={href} className="block rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary hover:shadow-md">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-text">{title}</h3>
      <p className="mb-2 text-sm text-text-700">{description}</p>
      <p className="text-xs text-text-soft">{countries} países</p>
      <div className="mt-4 flex items-center text-sm text-primary hover:text-primary/80">
        <span>Explorar</span>
        <ArrowRight className="ml-1 h-4 w-4" />
      </div>
    </Link>
  );
}

/**
 * Card de país para a américa latina.
 */
interface PaisCardProps {
  country: string;
  idh: string;
  population: string;
  area: string;
  rights: string[];
}

function PaisCard({ country, idh, population, area, rights }: PaisCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <h3 className="mb-3 font-semibold text-text">{country}</h3>
      <div className="mb-3 space-y-1 text-xs text-text-700">
        <div>IDH: {idh}</div>
        <div>População: {population}</div>
        <div>Área: {area}</div>
      </div>
      <div className="flex flex-wrap gap-1">
        {rights.map((right) => (
          <span
            key={right}
            className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
          >
            {right}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Card de métrica comparativa.
 */
interface MetricaCardProps {
  title: string;
  data: Array<{ region: string; value: string }>;
  icon: React.ReactNode;
}

function MetricaCard({ title, data, icon }: MetricaCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="mb-3 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="font-medium text-text">{title}</h3>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.region} className="flex justify-between text-sm">
            <span className="text-text-700">{item.region}</span>
            <span className="font-medium text-text">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Seletor de filtro regional.
 */
interface FiltroRegionalProps {
  label: string;
  options: string[];
}

function FiltroRegional({ label, options }: FiltroRegionalProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text">{label}</label>
      <select className="w-full rounded-lg border border-border px-3 py-2 text-sm">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Filtros regionais.
 */
function FiltrosRegionais() {
  const subRegiaoOptions = ["Todas as sub-regiões", "América do Sul", "América Central", "Caribe"];
  const paisesOptions = ["Selecionar países", "Brasil", "Argentina", "México", "Colômbia", "Chile", "Peru"];
  const direitosOptions = ["Todos os direitos", "Direitos Humanos", "Direito Ambiental", "Direito das Mulheres", "Direito da Natureza", "Direitos Indígenas", "Direitos Quilombolas", "Direitos Campesinos", "Direitos Atingidos por Barragens"];
  const criterioOptions = ["Todos os critérios", "Constitucional", "Legislativo", "Jurisprudencial", "Implementação"];

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Comparar Países da América Latina</h2>
      <div className="grid gap-4 md:grid-cols-5">
        <FiltroRegional label="Sub-região" options={subRegiaoOptions} />
        <FiltroRegional label="Países" options={paisesOptions} />
        <FiltroRegional label="Direitos" options={direitosOptions} />
        <FiltroRegional label="Critério" options={criterioOptions} />
        <div className="flex items-end">
          <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Comparar Selecionados
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Sub-regiões da américa latina.
 */
function SubRegioes() {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-xl font-bold text-text">Explorar por Sub-região</h2>
      <div className="grid gap-6 md:grid-cols-3">
        <SubRegiaoCard
          title="América do Sul"
          description="12 países do sul do continente"
          countries={12}
          icon={<Map className="h-8 w-8" />}
          href="/direitos-globais/america-latina/america-do-sul"
        />
        <SubRegiaoCard
          title="América Central"
          description="7 países da América Central"
          countries={7}
          icon={<Scale className="h-8 w-8" />}
          href="/direitos-globais/america-latina/america-central"
        />
        <SubRegiaoCard
          title="Caribe"
          description="11 países e territórios do Caribe"
          countries={11}
          icon={<Globe className="h-8 w-8" />}
          href="/direitos-globais/america-latina/caribe"
        />
      </div>
    </div>
  );
}

/**
 * Direitos por país.
 */
function DireitosPorPais() {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-xl font-bold text-text">Direitos por País</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { country: "Brasil", idh: "0.766", population: "213M", area: "8.5M km²", rights: ["Direitos Indígenas", "Direitos Quilombolas", "Direito Ambiental"] },
          { country: "Argentina", idh: "0.845", population: "45M", area: "2.8M km²", rights: ["Direitos Humanos", "Direito Ambiental", "Direitos das Mulheres"] },
          { country: "México", idh: "0.774", population: "128M", area: "1.96M km²", rights: ["Direitos Indígenas", "Direitos Humanos", "Direito Ambiental"] },
          { country: "Colômbia", idh: "0.767", population: "51M", area: "1.14M km²", rights: ["Direitos Indígenas", "Direito Ambiental", "Direitos das Mulheres"] },
          { country: "Chile", idh: "0.851", population: "19M", area: "0.75M km²", rights: ["Direito Ambiental", "Direitos Humanos", "Direito da Natureza"] },
          { country: "Peru", idh: "0.777", population: "33M", area: "1.28M km²", rights: ["Direitos Indígenas", "Direito Ambiental", "Direitos Campesinos"] },
        ].map((item) => (
          <PaisCard
            key={item.country}
            country={item.country}
            idh={item.idh}
            population={item.population}
            area={item.area}
            rights={item.rights}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Métricas comparativas.
 */
function MetricasComparativas() {
  return (
    <div className="mb-8">
      <h2 className="mb-6 text-xl font-bold text-text">Métricas Comparativas</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <MetricaCard
          title="IDH Médio por Sub-região"
          data={[
            { region: "América do Sul", value: "0.754" },
            { region: "América Central", value: "0.723" },
            { region: "Caribe", value: "0.699" },
          ]}
          icon={<Users className="h-6 w-6" />}
        />
        <MetricaCard
          title="Proteção Ambiental Constitucional"
          data={[
            { region: "Chile", value: "Forte" },
            { region: "Brasil", value: "Forte" },
            { region: "Ecuador", value: "Muito Forte" },
            { region: "Costa Rica", value: "Forte" },
          ]}
          icon={<Scale className="h-6 w-6" />}
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
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft"
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

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          América Latina
        </h1>
        <p className="mt-3 text-lg text-text-soft">
          Comparação de sistemas de direitos entre os 20 países da América Latina, com foco em direitos humanos, ambiental, sociais e coletivos.
        </p>
      </header>

      <FiltrosRegionais />

      <SubRegioes />

      <DireitosPorPais />

      <MetricasComparativas />

      <FooterGlobal />
    </main>
  );
}