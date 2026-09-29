/**
 * @file apps/web/app/canada/NavegacaoAbasCanada.tsx
 * @description Barra de navegação temática para o Hub e sub-rotas do Canadá (/canada).
 *
 * Papel no portal:
 * Facilita a alternância entre a visão geral do Canadá e as 4 sub-rotas aprofundadas:
 * - /canada/mineracao (Mineradoras TSX/TSX-V operando no Brasil e barragens);
 * - /canada/ambiental (Emissões ECCC NPRI, estudo Mount Polley e Climate TRACE);
 * - /canada/contratos (Compras públicas federais CKAN e créditos EDC);
 * - /canada/institucional (Cidades SGC, Parlamento, CanLII e Ouvidoria CORE).
 *
 * Decisões técnicas e restrições:
 * - Links semânticos do Next.js (<Link>) para navegação rápida e SEO.
 * - Indicação visual clara da rota ativa com cores e contraste acessível.
 * - Respeita a regra de textos diretos e curtos (até 13 palavras por frase).
 */

import Link from "next/link";

interface NavegacaoAbasCanadaProps {
  abaAtiva: "hub" | "mineracao" | "ambiental" | "contratos" | "institucional";
}

interface ItemNavegacao {
  id: "hub" | "mineracao" | "ambiental" | "contratos" | "institucional";
  rotulo: string;
  href: string;
  emoji: string;
  badge?: string;
}

const ITENS_NAV: ItemNavegacao[] = [
  {
    id: "hub",
    rotulo: "Visão Geral",
    href: "/canada",
    emoji: "🇨🇦",
  },
  {
    id: "mineracao",
    rotulo: "Mineradoras TSX & Barragens",
    href: "/canada/mineracao",
    emoji: "⛏️",
    badge: "12 empresas",
  },
  {
    id: "ambiental",
    rotulo: "Meio Ambiente & Mount Polley",
    href: "/canada/ambiental",
    emoji: "🌊",
    badge: "ECCC / NPRI",
  },
  {
    id: "contratos",
    rotulo: "Contratos Federais & EDC",
    href: "/canada/contratos",
    emoji: "📄",
    badge: "Open Canada",
  },
  {
    id: "institucional",
    rotulo: "Institucional & Ouvidoria CORE",
    href: "/canada/institucional",
    emoji: "🏛️",
    badge: "CanLII & ATIP",
  },
];

export default function NavegacaoAbasCanada({ abaAtiva }: NavegacaoAbasCanadaProps) {
  return (
    <nav
      aria-label="Navegação temática das seções do Canadá"
      className="mb-8 border-b border-border pb-3 print:hidden"
    >
      <div className="flex flex-wrap items-center gap-2">
        {ITENS_NAV.map((item) => {
          const ativa = abaAtiva === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                ativa
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground border border-border"
              }`}
            >
              <span>{item.emoji}</span>
              <span>{item.rotulo}</span>
              {item.badge && (
                <span
                  className={`hidden sm:inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    ativa
                      ? "bg-emerald-700 text-emerald-100"
                      : "bg-surface-elevated text-muted"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
