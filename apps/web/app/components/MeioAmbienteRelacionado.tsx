import Link from "next/link"
import { Leaf, Droplets, AlertOctagon, Package, FileText, Mountain, Users, Shield, Gavel, Globe, Heart, BookOpen, Wind, Sun, Sprout, PiggyBank, Briefcase } from "lucide-react"

const LINKS: { href: string; label: string; icon: React.ElementType; color: string }[] = [
  {
    href: "/ambiental",
    label: "Acervo completo do Observatório Meio Ambiente",
    icon: Leaf,
    color: "var(--color-primary)",
  },
  {
    href: "/ambiental/licenciamento",
    label: "Licenciamento ambiental — copias, deferimentos e pendências",
    icon: Package,
    color: "var(--color-info)",
  },
  {
    href: "/ambiental/copam",
    label: "COPAM — reuniões, pautas e decisões do Conselho do Meio Ambiente",
    icon: Shield,
    color: "var(--color-warning)",
  },
  {
    href: "/ambiental/barragens",
    label: "Barragens em MG — cadastro SIGBM, níveis de emergência e descaracterização",
    icon: AlertOctagon,
    color: "var(--color-danger)",
  },
  {
    href: "/ambiental/barragens-globais",
    label: "Grandes Barragens Mundiais — 62 estruturas de rejeitos, hidrelétricas e água no mundo",
    icon: AlertOctagon,
    color: "var(--color-danger)",
  },
  {
    href: "/ambiental/ameacas-americas",
    label: "Ameaças nas Américas — espécies, rios, serras e comunidades tradicionais sob pressão",
    icon: Sprout,
    color: "var(--color-primary)",
  },
  {
    href: "/ambiental/conflitos-globais",
    label: "Conflitos Socioambientais Globais — 55 litígios mundiais documentados no EJAtlas",
    icon: Gavel,
    color: "var(--color-warning)",
  },
  {
    href: "/ambiental/crise-climatica",
    label: "Crise Climática Global — inventário de emissões do G20 e os 20 maiores poluidores industriais",
    icon: Wind,
    color: "var(--color-info)",
  },
  {
    href: "/funcaosocialterra/mapa",
    label: "Globo 3D de Terras — sobreposição de terras indígenas, quilombos, cavas e barragens",
    icon: Globe,
    color: "var(--color-primary)",
  },
  {
    href: "/ambiental/legislacao",
    label: "Legislação ambiental — normas federais, estaduais e municipais",
    icon: FileText,
    color: "var(--color-surface)",
  },
  {
    href: "/ambiental/mariana",
    label: "Mariana — Acordo do Rio Doce, reparação e acompanhamento cívico",
    icon: Mountain,
    color: "var(--color-primary)",
  },
  {
    href: "/ambiental/crimes-socioambientais",
    label: "Crimes socioambientais — laudos, TACs e documentos da bacia do Rio Doce e Paraopeba",
    icon: AlertOctagon,
    color: "var(--color-danger)",
  },
  {
    href: "/ambiental/ecossistema",
    label: "Ecossistema Regulatório, OEMAs dos 27 Estados e Concessionárias de Água e Luz",
    icon: Globe,
    color: "var(--color-primary)",
  },
]

export default function MeioAmbienteRelacionado() {
  return (
    <section aria-label="Páginas relacionadas do Observatório Meio Ambiente" className="group mt-12 border-t border-[var(--cp-border)] pt-8">
      <div className="flex items-center gap-2 text-[.82em] font-semibold uppercase tracking-wide text-[var(--cp-tertiary)]">
        <Leaf size={14} />
        <span>Página relacionada</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map(({ href, label, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-3 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)]/60 px-4 py-3 text-sm transition-colors hover:bg-[var(--cp-surface)] hover:border-[var(--cp-primary)]"
          >
            <Icon size={18} style={{ color }} className="shrink-0 mt-0.5" />
            <span className="text-[.92em] leading-relaxed text-[var(--cp-text)]">
              {label}
              <span className="block text-[.78em] text-[var(--cp-muted)] font-mono mt-0.5">
                {href}
              </span>
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-4 text-[.82em] text-[var(--cp-muted)]">
        O Observatório Meio Ambiente (antigo ONSA) reúne fiscalização ambiental, licenciamento,
        COPAM, barragens, legislação, Mariana, crimes socioambientais, estudos de impacto e a
        coleção Nossos — territórios, rios, serras e fauna de Minas Gerais e do Brasil.
      </p>
    </section>
  )
}
