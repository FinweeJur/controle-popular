/**
 * @file apps/web/app/components/SecaoPaginasRelacionadas.tsx
 * @description Componente padrão e reutilizável de Páginas e Investigações Relacionadas.
 *
 * Papel no portal:
 * Conecta e entrelaça os acervos temáticos do Controle Popular (Meio Ambiente,
 * Terra e Territórios, Grandes Empresas, Governança, Crise Climática e Globo 3D),
 * facilitando a navegação cidadã e garantindo que o leitor descubra investigações
 * e bases de dados complementares em qualquer ponto do portal.
 *
 * Padrões adotados:
 * - Acessibilidade WCAG AA: contraste em conformidade, navegação por teclado e foco visual.
 * - Textos concisos com limite de até 13 palavras nas orações explicativas.
 * - Suporte a temas claro/escuro via design tokens CSS do repositório.
 */

import Link from "next/link";
import {
  Globe2,
  AlertOctagon,
  Sprout,
  Gavel,
  Building2,
  DollarSign,
  Wind,
  Pickaxe,
  Network,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export type TipoIconeRelacionado =
  | "globo"
  | "barragem"
  | "floresta"
  | "justica"
  | "empresa"
  | "dinheiro"
  | "clima"
  | "mineracao"
  | "rede";

export interface ItemPaginaRelacionada {
  href: string;
  titulo: string;
  descricao: string;
  badge?: string;
  icone?: TipoIconeRelacionado;
}

interface Props {
  titulo?: string;
  subtitulo?: string;
  paginas: ItemPaginaRelacionada[];
  className?: string;
}

function renderizarIcone(icone?: TipoIconeRelacionado) {
  switch (icone) {
    case "globo":
      return <Globe2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />;
    case "barragem":
      return <AlertOctagon className="h-4 w-4 text-rose-500" aria-hidden="true" />;
    case "floresta":
      return <Sprout className="h-4 w-4 text-emerald-600" aria-hidden="true" />;
    case "justica":
      return <Gavel className="h-4 w-4 text-amber-500" aria-hidden="true" />;
    case "empresa":
      return <Building2 className="h-4 w-4 text-blue-500" aria-hidden="true" />;
    case "dinheiro":
      return <DollarSign className="h-4 w-4 text-emerald-500" aria-hidden="true" />;
    case "clima":
      return <Wind className="h-4 w-4 text-sky-500" aria-hidden="true" />;
    case "mineracao":
      return <Pickaxe className="h-4 w-4 text-amber-600" aria-hidden="true" />;
    case "rede":
      return <Network className="h-4 w-4 text-primary" aria-hidden="true" />;
    default:
      return <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />;
  }
}

export default function SecaoPaginasRelacionadas({
  titulo = "Investigações & Páginas Relacionadas",
  subtitulo = "Aprofunde a fiscalização cívica cruzando dados públicos, territórios e corporações.",
  paginas,
  className = "",
}: Props) {
  if (!paginas || paginas.length === 0) return null;

  return (
    <section
      aria-label={titulo}
      className={`rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4 print:hidden ${className}`}
    >
      <div className="border-b border-border/40 pb-3">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <span>{titulo}</span>
        </h2>
        {subtitulo && <p className="text-xs text-muted mt-1">{subtitulo}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {paginas.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-border bg-surface-2 p-4 hover:border-primary/50 hover:bg-surface transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground group-hover:text-primary transition flex items-center gap-1.5 truncate">
                  {renderizarIcone(item.icone)}
                  <span className="truncate">{item.titulo}</span>
                </span>
                {item.badge && (
                  <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-muted border border-border/50">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted leading-relaxed line-clamp-2">
                {item.descricao}
              </p>
            </div>

            <div className="pt-1 flex items-center justify-between text-xs text-primary font-medium">
              <span className="text-[11px] font-mono text-muted/70 group-hover:text-muted truncate max-w-[180px]">
                {item.href}
              </span>
              <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition shrink-0">
                <span>Acessar</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
