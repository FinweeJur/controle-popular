
import Link from "next/link";
import { BookOpen } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";

/**
 * Card de impacto social.
 */
interface ImpactCardProps {
  title: string;
  value: string;
  description: string;
  color: string;
}

function ImpactCard({ title, value, description, color }: ImpactCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className={`mb-2 flex items-center gap-2 ${color}`}>
        <BookOpen className="h-5 w-5" />
        <h3 className="font-medium text-text">{title}</h3>
      </div>
      <div className="mb-2 text-2xl font-bold text-text">{value}</div>
      <p className="text-xs text-text-700">{description}</p>
    </div>
  );
}

/**
 * Card de caso de destaque.
 */
interface CaseStudyProps {
  institution: string;
  title: string;
  impact: string;
  dimension: string;
}

function CaseStudy({ institution, title, impact, dimension }: CaseStudyProps) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-text">{title}</h3>
          <p className="text-sm text-text-700">{institution}</p>
          <p className="mt-2 text-sm text-text-700">{impact}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          {dimension}
        </span>
      </div>
    </div>
  );
}

/**
 * Item de ranking de impacto.
 */
interface RankingItemProps {
  rank: number;
  institution: string;
  score: string;
  impact: string;
}

function RankingItem({ rank, institution, score, impact }: RankingItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
          {rank}
        </div>
        <div>
          <div className="font-medium text-text">{institution}</div>
          <div className="text-xs text-text-700">{impact}</div>
        </div>
      </div>
      <div className="text-sm font-bold text-text">{score}</div>
    </div>
  );
}

/**
 * Seletor genérico de opções.
 */
interface SeletorProps {
  title: string;
  options: string[];
  type: "radio" | "checkbox";
}

function Seletor({ title, options, type }: SeletorProps) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-text">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center space-x-2">
            <input type={type} className="rounded border-border" />
            <span className="text-sm">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Seletor de dropdown.
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
 * Seletor de filtros para universidades.
 */
function FiltrosUniversidades() {
  const tipoOptions = ["Todas", "Federais", "Estaduais", "IFETs", "Privadas"];
  const dimensaoOptions = ["Educação", "Saúde", "Justiça", "Trabalho", "Inovação", "Extensão"];
  const regiaoOptions = ["Todas as regiões", "Sudeste", "Sul", "Nordeste", "Norte", "Centro-Oeste"];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Navegar por</h2>
      
      <div className="space-y-4">
        <Seletor title="Tipo de Instituição" options={tipoOptions} type="radio" />
        <Seletor title="Dimensão do Impacto" options={dimensaoOptions} type="checkbox" />
        <SeletorDropdown title="Região" options={regiaoOptions} />
        <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          Filtrar Resultados
        </button>
      </div>
    </div>
  );
}

/**
 * Indicadores de impacto.
 */
function IndicadoresImpacto() {
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2">
      <ImpactCard
        title="Educação"
        value="87%"
        description="Taxa de conclusão de cursos e impacto na formação profissional"
        color="text-blue-600"
      />
      <ImpactCard
        title="Saúde"
        value="234"
        description="Atendimentos realizados por programas de extensão saúde"
        color="text-green-600"
      />
      <ImpactCard
        title="Justiça"
        value="156"
        description="Projetos de assistência jurídica e acesso à justiça"
        color="text-purple-600"
      />
      <ImpactCard
        title="Trabalho"
        value="89%"
        description="Taxa de empregabilidade de egressos"
        color="text-orange-600"
      />
    </div>
  );
}

/**
 * Casos de destaque.
 */
function CasosDestaque() {
  return (
    <div className="mb-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Casos de Destaque</h2>
      <div className="space-y-4">
        <CaseStudy
          institution="UFVJM"
          title="Programa de Educação do Campo"
          impact="Atendimento a 45 comunidades rurais"
          dimension="Educação"
        />
        <CaseStudy
          institution="UFRB"
          title="Saúde Indígena"
          impact="Atendimento a 12 etnias diferentes"
          dimension="Saúde"
        />
        <CaseStudy
          institution="USP"
          title="Justiça do Trabalho Voluntária"
          impact="12.000 atendimentos anuais"
          dimension="Justiça"
        />
      </div>
    </div>
  );
}

/**
 * Ranking de impacto.
 */
function RankingImpacto() {
  return (
    <div className="mb-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Instituições com Maior Impacto</h2>
      <div className="rounded-lg border border-border bg-surface-2 p-4">
        <div className="space-y-3">
          <RankingItem
            rank={1}
            institution="UFMG"
            score="9.2"
            impact="Educação, Saúde, Inovação"
          />
          <RankingItem
            rank={2}
            institution="USP"
            score="8.9"
            impact="Educação, Justiça, Inovação"
          />
          <RankingItem
            rank={3}
            institution="UNICAMP"
            score="8.7"
            impact="Inovação, Extensão"
          />
          <RankingItem
            rank={4}
            institution="UFRJ"
            score="8.5"
            impact="Educação, Cultura"
          />
          <RankingItem
            rank={5}
            institution="UFPE"
            score="8.3"
            impact="Saúde, Educação"
          />
        </div>
      </div>
    </div>
  );
}

export default function PaginaUniversidadesImpacto() {
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
        <span className="font-semibold text-text">Universidades e Impacto</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Universidades e Impacto Social
        </h1>
        <p className="mt-3 text-lg text-text-soft">
          Indicadores sociais, casos de destaque e metodologia de avaliação do impacto das instituições de ensino no desenvolvimento dos direitos fundamentais.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <FiltrosUniversidades />
        
        <div className="lg:col-span-2">
          <IndicadoresImpacto />
          <CasosDestaque />
          <RankingImpacto />
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-text">Metodologia de Avaliação</h2>
        <div className="space-y-4 text-sm text-text-700">
          <div>
            <strong>Indicadores Quantitativos:</strong>
            <ul className="ml-4 mt-2 list-disc">
              <li>Número de egressos empregados</li>
              <li>Projetos de extensão por área</li>
              <li>Atendimentos sociais realizados</li>
              <li>Publicações e patentes</li>
            </ul>
          </div>
          <div>
            <strong>Indicadores Qualitativos:</strong>
            <ul className="ml-4 mt-2 list-disc">
              <li>Impacto nas políticas públicas</li>
              <li>Reconhecimento social</li>
              <li>Parcerias com comunidades</li>
              <li>Inovação social</li>
            </ul>
          </div>
          <div>
            <strong>Fontes:</strong> MEC, CAPES, CNPq, instituições de ensino, dados de projetos de extensão.
          </div>
        </div>
      </section>

      <FooterGlobal />
    </main>
  );
}