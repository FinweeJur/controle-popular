import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_CANADA,
  obterMineradorasCanada,
  obterAmbientalCanada,
  obterContratosCanada,
  obterInstitucionalCanada,
} from "@/lib/internacional/dados-canada";
import PainelCanada from "./PainelCanada";
import NavegacaoAbasCanada from "./NavegacaoAbasCanada";
import FooterGlobal from "@/app/components/FooterGlobal";
import SecaoPaginasRelacionadas, {
  type ItemPaginaRelacionada,
} from "@/app/components/SecaoPaginasRelacionadas";

export const metadata: Metadata = {
  title: "Canadá: Transparência Pública, Mineradoras TSX & Conexões com o Brasil | Controle Popular",
  description:
    "Acervo oficial de transparência do Canadá e conexão transnacional com o Brasil: 12 mineradoras na Bolsa de Toronto (TSX), inventário de emissões NPRI, compras públicas e territórios das Primeiras Nações.",
};

const PAGINAS_RELACIONADAS_CANADA: ItemPaginaRelacionada[] = [
  {
    href: "/internacional/inteligencia",
    titulo: "Central de Inteligência (Five Eyes & CSIS)",
    descricao: "Dossiês de inteligência, segurança cibernética e acordos da aliança Five Eyes.",
    badge: "Inteligência",
    icone: "justica",
  },
  {
    href: "/internacional/inteligencia/mapa",
    titulo: "Mapa Global de Inteligência",
    descricao: "Visualização geoespacial das agências e alianças de espionagem ao redor do globo.",
    badge: "Mapa 3D",
    icone: "globo",
  },
  {
    href: "/internacional/orcamentos",
    titulo: "Orçamentos Estratégicos do Canadá",
    descricao: "Auditoria comparada de orçamentos de defesa, inteligência e combate à crise climática.",
    badge: "Orçamentos",
    icone: "dinheiro",
  },
  {
    href: "/internacional",
    titulo: "Hub Multilateral Internacional",
    descricao: "Comparativo de indicadores de IDH, desigualdade e rotas comerciais de minérios.",
    badge: "Multilateral",
    icone: "globo",
  },
  {
    href: "/eua",
    titulo: "Observatório dos Estados Unidos",
    descricao: "Grandes fundos de investimento, SEC EDGAR, dados da EPA e comércio bilateral.",
    badge: "EUA",
    icone: "empresa",
  },
];

export default function PaginaHubCanada() {
  const mineradoras = obterMineradorasCanada();
  const ambiental = obterAmbientalCanada();
  const contratos = obterContratosCanada();
  const institucional = obterInstitucionalCanada();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex items-center gap-2 text-xs text-muted"
      >
        <Link href="/" className="hover:underline">
          Início
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Canadá (/canada)</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            🇨🇦 Hub Canadá
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            TSX / TSX-V Toronto
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            ECCC NPRI & Rejeitos
          </span>
          <span className="rounded-full bg-purple-100 px-3 py-0.5 text-xs font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            Primeiras Nações & Ouvidoria CORE
          </span>
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Canadá: Transparência Pública e Conexão Mineral Transnacional
        </h1>
        <p className="mt-3 max-w-4xl text-base text-muted sm:text-lg">
          Mapeamento das mineradoras canadenses listadas na Bolsa de Toronto com operações ativas e
          processos na ANM no Brasil (Vale do Lítio, Xingu, Pará e Minas Gerais), além de dados
          ambientais do inventário NPRI, caso histórico de Mount Polley (2014) e canais de fiscalização
          da Ouvidoria Federal Canadense (CORE).
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <p className="mt-4 border-l-2 border-emerald-600 pl-4 text-sm italic text-muted">
          &ldquo;O que acontece no Rio Jequitinhonha ou no Xingu é decidido em salas de reunião em
          Vancouver e Toronto. A transparência cívica não pode parar nas fronteiras nacionais.&rdquo;
          — Princípio de investigação transnacional do Controle Popular
        </p>
      </header>

      {/* CARTÕES DE TOPO COM AGREGADOS (COBERTURA_CANADA) */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Métricas do acervo">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Mineradoras TSX no Brasil</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_CANADA.mineradorasTsxBrasil}
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
            Grota do Cirilo, Xingu e Salobo
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Barragens no Brasil (TSX)</div>
          <div className="mt-1 font-mono text-2xl font-bold text-alert sm:text-3xl">
            {COBERTURA_CANADA.barragensMonitoradas}
          </div>
          <div className="mt-1 text-xs text-muted">SIGBM / ANM cruzados</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Registros Ambientais & Ciência</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_CANADA.registrosAmbientais}
          </div>
          <div className="mt-1 text-xs text-muted">ECCC NPRI / Mount Polley</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Cidades-Polo & SGC</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_CANADA.cidadesPolo}
          </div>
          <div className="mt-1 text-xs text-muted">Sudbury, Toronto, Vancouver</div>
        </div>
      </section>

      {/* NAVEGAÇÃO DE SUB-ROTAS TEMÁTICAS */}
      <NavegacaoAbasCanada abaAtiva="hub" />

      {/* PAINEL INTERATIVO COM 6 QUALIDADES */}
      <main>
        <PainelCanada
          mineradoras={mineradoras}
          ambiental={ambiental}
          contratos={contratos}
          institucional={institucional}
        />
      </main>

      {/* SEÇÃO DE PÁGINAS RELACIONADAS */}
      <SecaoPaginasRelacionadas
        titulo="Explorar Conexões Transnacionais e Cívicas"
        subtitulo="Navegue entre dossiês da aliança Five Eyes, orçamentos estratégicos e observatórios globais."
        paginas={PAGINAS_RELACIONADAS_CANADA}
        className="mt-12 mb-8"
      />

      <FooterGlobal />
    </div>
  );
}
