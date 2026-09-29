/**
 * @file apps/web/app/eua/components/SubNavEua.tsx
 * @description Barra de navegação temática entre as sub-rotas dos Estados Unidos (/eua).
 *
 * Papel no portal:
 * Permite ao leitor navegar facilmente entre a visão geral do Hub EUA
 * e as quatro sub-rotas temáticas aprofundadas.
 *
 * Decisões técnicas e restrições:
 * - Utiliza Link do Next.js para navegação rápida sem recarregar a página.
 * - Destaca visualmente a sub-rota atualmente ativa.
 * - Frases curtas de até 13 palavras nos rótulos e descrições.
 */

import Link from "next/link";

export type SubRotaEua = "geral" | "empresas" | "ambiental" | "contratos" | "institucional";

interface SubNavEuaProps {
  /** Identificador da sub-rota atualmente selecionada. */
  rotaAtiva: SubRotaEua;
}

interface ItemNavegacao {
  id: SubRotaEua;
  href: string;
  rotulo: string;
  icone: string;
  descricaoBreve: string;
}

const ITENS_NAV: ItemNavegacao[] = [
  {
    id: "geral",
    href: "/eua",
    rotulo: "Visão Geral",
    icone: "🇺🇸",
    descricaoBreve: "Hub consolidado",
  },
  {
    id: "empresas",
    href: "/eua/empresas",
    rotulo: "Empresas & Fundos SEC",
    icone: "🏢",
    descricaoBreve: "Balanços e CIK na SEC EDGAR",
  },
  {
    id: "ambiental",
    href: "/eua/ambiental",
    rotulo: "Barragens & EPA",
    icone: "🛡️",
    descricaoBreve: "NID 91k barragens e multas",
  },
  {
    id: "contratos",
    href: "/eua/contratos",
    rotulo: "Orçamento & Comércio",
    icone: "📊",
    descricaoBreve: "USAspending e balança comercial",
  },
  {
    id: "institucional",
    href: "/eua/institucional",
    rotulo: "Institucional & FOIA",
    icone: "🏛️",
    descricaoBreve: "Cidades, cortes, terras e FOIA",
  },
];

/**
 * Componente de navegação horizontal com abas para o módulo dos EUA.
 */
export default function SubNavEua({ rotaAtiva }: SubNavEuaProps) {
  return (
    <nav
      aria-label="Sub-rotas temáticas dos Estados Unidos"
      className="mb-8 overflow-x-auto border-b border-border pb-2 print:hidden"
    >
      <div className="flex min-w-max gap-2">
        {ITENS_NAV.map((item) => {
          const ativa = item.id === rotaAtiva;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                ativa
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-surface text-muted hover:bg-surface-elevated hover:text-foreground border border-border/60"
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {item.icone}
              </span>
              <div className="flex flex-col text-left">
                <span className="font-semibold leading-tight">{item.rotulo}</span>
                <span
                  className={`text-[11px] leading-tight ${
                    ativa ? "text-sky-100" : "text-muted group-hover:text-foreground/80"
                  }`}
                >
                  {item.descricaoBreve}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
