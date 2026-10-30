
import Link from "next/link";
import { Users, Map, Scale, Globe } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import { DISPOSITIVOS } from "@/lib/direitos-globais/dispositivos";
import { ListaDispositivos } from "./Dispositivos";

/**
 * Card de sub-região para a américa latina.
 *
 * Não é link de propósito: a lista completa por sub-região ainda não existe.
 * Link que leva a 404 é pior que card informativo.
 */
interface SubRegiaoCardProps {
  title: string;
  description: string;
  countries: number;
  icon: React.ReactNode;
}

function SubRegiaoCard({ title, description, countries, icon }: SubRegiaoCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-4 text-primary">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-text">{title}</h3>
      <p className="mb-2 text-sm text-text-700">{description}</p>
      <p className="text-xs text-text-soft">{countries} países</p>
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
        />
        <SubRegiaoCard
          title="América Central"
          description="7 países da América Central"
          countries={7}
          icon={<Scale className="h-8 w-8" />}
        />
        <SubRegiaoCard
          title="Caribe"
          description="11 países e territórios do Caribe"
          countries={11}
          icon={<Globe className="h-8 w-8" />}
        />
      </div>
    </div>
  );
}

/**
 * Dispositivos conferidos, um bloco por país.
 *
 * Ordem alfabética para o leitor achar o país sem buscar. Cada bloco mostra
 * a citação e o texto; o texto longo fica atrás de "Ver mais".
 */
function DispositivosConferidos() {
  const paises = [...new Set(DISPOSITIVOS.map((d) => d.pais))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-xl font-bold text-text">Dispositivos conferidos</h2>
      <p className="mb-6 text-sm text-text-soft">
        {paises.length} países com o texto do artigo transcrito e o link da
        fonte. O Brasil vem da Câmara dos Deputados; os demais, do Constitute
        Project.
      </p>
      <div className="grid gap-5 lg:grid-cols-2">
        {paises.map((pais) => (
          <ListaDispositivos
            key={pais}
            pais={pais}
            dispositivos={DISPOSITIVOS.filter((d) => d.pais === pais)}
          />
        ))}
      </div>
    </section>
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

      <DispositivosConferidos />

      <MetricasComparativas />

      <FooterGlobal />
    </main>
  );
}