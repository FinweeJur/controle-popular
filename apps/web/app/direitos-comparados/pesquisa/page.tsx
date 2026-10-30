
import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Card de estatística para grupos de pesquisa.
 */
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4 text-center">
      <div className={`mb-2 flex justify-center ${color}`}>{icon}</div>
      <div className="text-2xl font-bold text-text">{value}</div>
      <div className="text-xs text-text-700">{title}</div>
    </div>
  );
}

/**
 * Card de região para destaque.
 */
interface RegionCardProps {
  region: string;
  groups: string;
  institutions: string;
  topAreas: string[];
}

function RegionCard({ region, groups, institutions, topAreas }: RegionCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <h3 className="mb-2 font-medium text-text">{region}</h3>
      <div className="mb-2 text-sm text-text-700">
        {groups} grupos • {institutions} instituições
      </div>
      <div className="flex flex-wrap gap-1">
        {topAreas.map((area) => (
          <span
            key={area}
            className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
          >
            {area}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Item de rede de cooperação.
 */
interface NetworkItemProps {
  name: string;
  institutions: string;
  projects: string;
  focus: string;
}

function NetworkItem({ name, institutions, projects, focus }: NetworkItemProps) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border bg-surface p-3">
      <div>
        <h4 className="font-medium text-text">{name}</h4>
        <p className="text-xs text-text-700">{focus}</p>
      </div>
      <div className="text-right text-xs text-text-700">
        <div>{institutions} inst.</div>
        <div>{projects} projetos</div>
      </div>
    </div>
  );
}

/**
 * Seletor genérico de dropdown.
 */
interface SeletorDropdownProps {
  title: string;
  options: string[];
}

function SeletorDropdown({ title, options }: SeletorDropdownProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text">{title}</h3>
      <select className="w-full rounded-lg border border-border px-3 py-2 text-sm">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Seletor de filtros para grupos de pesquisa.
 */
function FiltrosPesquisa() {
  const estadoOptions = ["Todos os estados", "Sudeste", "Sul", "Nordeste", "Norte", "Centro-Oeste"];
  const areaOptions = ["Todas as áreas", "Ciências Humanas", "Ciências da Saúde", "Ciências Biológicas", "Ciências Exatas", "Ciências Agrárias", "Engenharias"];
  const instituicaoOptions = ["Todas as instituições", "Universidades Federais", "Universidades Estaduais", "IFETs", "Privadas"];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Filtrar por</h2>
      
      <div className="space-y-4">
        <SeletorDropdown title="Estado" options={estadoOptions} />
        <SeletorDropdown title="Área do Conhecimento" options={areaOptions} />
        <SeletorDropdown title="Instituição" options={instituicaoOptions} />
        <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
}

/**
 * Estatísticas gerais.
 */
function EstatisticasGerais() {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total de Grupos"
        value="8.542"
        icon={<GraduationCap className="h-5 w-5" />}
        color="text-primary"
      />
      <StatCard
        title="Instituições"
        value="1.247"
        icon={<Users className="h-5 w-5" />}
        color="text-green-600"
      />
      <StatCard
        title="Produção Científica"
        value="45.892"
        icon={<GraduationCap className="h-5 w-5" />}
        color="text-blue-600"
      />
    </div>
  );
}

/**
 * Destaques por região.
 */
function DestaquesRegiao() {
  return (
    <div className="mb-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Destaques por Região</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <RegionCard
          region="Sudeste"
          groups="3.245"
          institutions="456"
          topAreas={["Ciências Humanas", "Engenharias", "Ciências da Saúde"]}
        />
        <RegionCard
          region="Sul"
          groups="1.892"
          institutions="234"
          topAreas={["Ciências Biológicas", "Ciências Exatas", "Ciências Agrárias"]}
        />
        <RegionCard
          region="Nordeste"
          groups="1.756"
          institutions="198"
          topAreas={["Ciências Humanas", "Ciências da Saúde", "Engenharias"]}
        />
        <RegionCard
          region="Norte"
          groups="892"
          institutions="145"
          topAreas={["Ciências Biológicas", "Ciências da Saúde", "Ciências Agrárias"]}
        />
        <RegionCard
          region="Centro-Oeste"
          groups="757"
          institutions="214"
          topAreas={["Ciências Agrárias", "Ciências Exatas", "Engenharias"]}
        />
      </div>
    </div>
  );
}

/**
 * Redes de cooperação.
 */
function RedesCooperacao() {
  return (
    <div className="mb-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Redes de Cooperação</h2>
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <h3 className="mb-3 font-medium text-text">Principais Redes Institucionais</h3>
        <div className="space-y-3">
          <NetworkItem
            name="Rede Nordeste de Pesquisa"
            institutions="23"
            projects="156"
            focus="Ciências Humanas e Sociais"
          />
          <NetworkItem
            name="Conselho de Reitores das Universidades Brasileiras"
            institutions="69"
            projects="892"
            focus="Geral"
          />
          <NetworkItem
            name="Rede Universitaria de Inovação"
            institutions="45"
            projects="234"
            focus="Tecnologia e Inovação"
          />
        </div>
      </div>
    </div>
  );
}

export default function PaginaGruposPesquisa() {
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
        <Link href="/direitos-comparados" className="hover:text-primary hover:underline">
          Direitos Comparados
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Grupos de Pesquisa</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Grupos de Pesquisa
        </h1>
        <p className="mt-3 text-lg text-text-soft">
          Redes de cooperação, produção científica e mapeamento de áreas do conhecimento por estado e instituição.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <FiltrosPesquisa />
        
        <div className="lg:col-span-2">
          <EstatisticasGerais />
          <DestaquesRegiao />
          <RedesCooperacao />
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Metodologia</h2>
        <div className="space-y-3 text-sm text-text-700">
          <p>
            <strong>Fonte:</strong> Diretório dos Grupos de Pesquisa do CNPq (DGP) e CAPES.
          </p>
          <p>
            <strong>Cobertura:</strong> Dados atualizados até 2024, com informações de grupos ativos.
          </p>
          <p>
            <strong>Indicadores:</strong> Número de grupos, instituições participantes, produção científica, áreas do conhecimento.
          </p>
          <p>
            <strong>Atualização:</strong> Dados atualizados anualmente pelo CNPq.
          </p>
        </div>
      </section>

      <FooterGlobal />
    </main>
  );
}