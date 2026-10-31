
import Link from "next/link";
import { Globe, Users, Map, Scale, Shield } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import DataColeta from "@/app/components/DataColeta";

/**
 * Card de continente para o comparador global.
 */
interface ContinenteCardProps {
  title: string;
  href: string;
  countries: number;
  icon: React.ReactNode;
  description: string;
}

function ContinenteCard({ title, href, countries, icon, description }: ContinenteCardProps) {
  return (
    <Link href={href} className="group block rounded-xl border border-border bg-surface p-4 transition-all hover:border-primary hover:shadow-sm">
      <div className="mb-2.5 text-primary transition-transform group-hover:scale-105">{icon}</div>
      <h3 className="mb-1 text-base font-semibold text-text group-hover:text-primary">{title}</h3>
      <p className="mb-2 text-xs text-text-700 leading-relaxed">{description}</p>
      <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
        <span className="text-text-soft font-medium">{countries} países</span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-primary">
          Explorar
          <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

/**
 * Card de direito principal.
 */
interface DireitoCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  rights: string[];
}

function DireitoCard({ title, description, icon, rights }: DireitoCardProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5 sm:p-4">
      <div className="mb-2 flex items-center gap-2 text-primary">
        {icon}
        <h3 className="text-sm font-semibold text-text">{title}</h3>
      </div>
      <p className="mb-2.5 text-xs text-text-700 leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-1">
        {rights.map((right) => (
          <span
            key={right}
            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {right}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Seletor de filtro genérico.
 */
interface FiltroSelectProps {
  label: string;
  options: string[];
  value?: string;
  onChange?: (value: string) => void;
}

function FiltroSelect({ label, options, value, onChange }: FiltroSelectProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text">{label}</label>
      <select 
        className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

/**
 * Filtros globais.
 */
function FiltrosGlobais() {
  const continenteOptions = ["Todos os continentes", "América Latina", "África", "Ásia", "Oceania", "Europa", "América do Norte"];
  const criterioOptions = ["Todos os critérios", "Tamanho territorial", "População", "Desenvolvimento (IDH)", "Regime político"];
  const direitosOptions = ["Todos os direitos", "Direitos Humanos", "Direito Ambiental", "Direito das Mulheres", "Direito da Natureza", "Direitos Políticos", "Direitos Indígenas", "Direitos Quilombolas", "Direitos Campesinos", "Direitos Coletivos", "Direitos Atingidos por Barragens"];

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Comparar por</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <FiltroSelect label="Continente" options={continenteOptions} />
        <FiltroSelect label="Critério" options={criterioOptions} />
        <FiltroSelect label="Direitos" options={direitosOptions} />
        <div className="flex items-end">
          <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
            Comparar Países
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Direitos em foco — Catálogo unificado de 24 temas.
 */
function DireitosEmFoco() {
  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-text">Catálogo de 24 Temas Prioritários</h2>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          12 Temas Originais + 12 Temas Expandidos
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <DireitoCard
          title="Direitos Humanos e Políticos"
          description="Garantias universais, liberdades civis, integridade e devido processo"
          icon={<Users className="h-6 w-6" />}
          rights={["Humanos", "Políticos", "Memória e Verdade", "LGBTQIA+"]}
        />
        <DireitoCard
          title="Direitos dos Povos e Coletivos"
          description="Autodeterminação, demarcação ancestral, recursos naturais e soberania"
          icon={<Scale className="h-6 w-6" />}
          rights={["Direitos dos Povos", "Indígenas", "Quilombolas", "Campesinos", "Coletivos"]}
        />
        <DireitoCard
          title="Socioambientais e Atingidos"
          description="Proteção de bacias, ecossistemas e populações atingidas por megaprojetos"
          icon={<Globe className="h-6 w-6" />}
          rights={["Ambiental", "Natureza", "Atingidos por Barragens", "Empreendimentos", "Terra e Território"]}
        />
        <DireitoCard
          title="Gênero, Gerações e Inclusão"
          description="Proteção contra violência patriarcal, etarismo, barreiras e vulnerabilidades"
          icon={<Users className="h-6 w-6" />}
          rights={["Mulheres", "Crianças", "Pessoas Idosas", "Pessoas com Deficiência"]}
        />
        <DireitoCard
          title="Direitos Econômicos e Laborais"
          description="Condições dignas de trabalho, liberdade sindical e renda justa"
          icon={<Scale className="h-6 w-6" />}
          rights={["Trabalho Digno", "Migrantes e Refugiados", "Seguridade"]}
        />
        <DireitoCard
          title="Direitos Sociais Fundamentais"
          description="Acesso universal a bens vitais essenciais à vida digna"
          icon={<Shield className="h-6 w-6" />}
          rights={["Saúde", "Educação", "Moradia Adequada", "Água e Saneamento"]}
        />
      </div>
    </div>
  );
}

/**
 * Metodologia.
 */
function Metodologia() {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-semibold text-text">Metodologia</h2>
      <div className="space-y-4 text-sm text-text-700">
        <div>
          <strong>Fontes Primárias:</strong> Constituições nacionais, leis federais, súmulas de tribunais superiores
        </div>
        <div>
          <strong>Fontes Secundárias:</strong> Tratados internacionais, relatórios de organizações internacionais
        </div>
        <div>
          <strong>Indicadores:</strong> Existência jurídica, níveis de proteção, implementação prática, jurisprudência
        </div>
        <div>
          <strong>Atualização:</strong> Dados atualizados conforme disponibilização das fontes oficiais
        </div>
      </div>
    </section>
  );
}

export default function PaginaDireitosGlobais() {
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
        <span className="font-semibold text-text">Direitos Globais</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Direitos Globais
        </h1>
        <p className="mt-3 text-lg text-text-soft">
          Comparação de sistemas de direitos entre países do sul global, com foco em direitos humanos, ambiental, sociais e coletivos.
        </p>
        <DataColeta
          coletadoEm="2026-10-30"
          fonte="Bases Oficiais: OEA (oas.org/cidh), Corte IDH, União Africana (au.int), ONU (ohchr.org), Conselho da Europa, Constitute Project e Diários Oficiais"
          competencia="América Latina (20), África (54), Ásia (48), Europa (44), América do Norte (2), Oceania (14) e Órgãos de Tratados da ONU"
        />
      </header>

      <FiltrosGlobais />

      {/* Continentes */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-text">Explorar por Continente e Sistema Internacional</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ContinenteCard
            title="América Latina"
            href="/direitos-globais/america-latina"
            countries={20}
            icon={<Globe className="h-6 w-6" />}
            description="20 países, 84 dispositivos conferidos nos 24 temas, CIDH, Corte IDH e 402 sentenças"
          />
          <ContinenteCard
            title="África"
            href="/direitos-globais/africa"
            countries={54}
            icon={<Map className="h-6 w-6" />}
            description="54 países da UA, 30 dispositivos constitucionais, Corte Africana e Direitos dos Povos"
          />
          <ContinenteCard
            title="Ásia"
            href="/direitos-globais/asia"
            countries={48}
            icon={<Users className="h-6 w-6" />}
            description="48 países nas 5 sub-regiões, 28 dispositivos conferidos e remissão ao sistema ONU"
          />
          <ContinenteCard
            title="Europa"
            href="/direitos-globais/europa"
            countries={44}
            icon={<Shield className="h-6 w-6" />}
            description="44 países, 33 dispositivos constitucionais, CSDDD e litígios extraterritoriais"
          />
          <ContinenteCard
            title="América do Norte"
            href="/direitos-globais/america-do-norte"
            countries={2}
            icon={<Scale className="h-6 w-6" />}
            description="EUA e Canadá: Bill of Rights, Section 35 e auditoria de lacunas federais"
          />
          <ContinenteCard
            title="Oceania"
            href="/direitos-globais/oceania"
            countries={14}
            icon={<Globe className="h-6 w-6" />}
            description="14 países, terras consuetudinárias tradicionais e soberania climática"
          />
          <ContinenteCard
            title="Sistema ONU"
            href="/direitos-globais/onu"
            countries={193}
            icon={<Scale className="h-6 w-6" />}
            description="8 Órgãos de Tratados, UPR e recomendações de seguimento internacional"
          />
        </div>
      </div>

      <DireitosEmFoco />

      <Metodologia />

      <FooterGlobal />
    </main>
  );
}