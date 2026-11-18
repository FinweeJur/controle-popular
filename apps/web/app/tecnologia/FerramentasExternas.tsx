"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  Code2,
  Database,
  FlaskConical,
  Music,
  Palette,
  Search,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Wrench,
} from "lucide-react";
import bruto from "@/data/tecnologia/ferramentas-externas.json";

/**
 * Radar de Ferramentas Externas — catálogo curado de links para quem constrói
 * e para quem fiscaliza.
 *
 * POR QUE EXISTE (dono, 18/11/2026): a página `/tecnologia` divulga os projetos
 * da casa (Controle Popular, Sementeira, Foz Juris…), mas não apontava para as
 * ferramentas de fora que ajudam dev, entusiasta de IA, pesquisador e cidadão.
 * Este bloco reúne o que passou no crivo — com licença, público e o motivo de
 * estar aqui — em vez de uma lista solta de links.
 *
 * CRITÉRIO DE ENTRADA (ver `docs/05-operacao/FERRAMENTAS-E-MCP.md`):
 * - gratuito ou com camada gratuita útil;
 * - licença declarada (quando não há certeza, o campo diz "conferir");
 * - serve a dado público, educação popular ou trabalho técnico honesto;
 * - não exige cadastro para o uso básico.
 *
 * O QUE ESTE COMPONENTE NÃO FAZ: não mede popularidade, não ranqueia por
 * pagamento e não esconde item patrocinado. A ordem é a do arquivo de dado.
 */

export type CategoriaFerramenta =
  | "ia"
  | "agentes"
  | "design"
  | "frontend"
  | "infra"
  | "privacidade"
  | "dados"
  | "cultura"
  | "dev";

export type PublicoFerramenta = "dev" | "ia" | "pesquisa" | "cidadao";

export interface FerramentaExterna {
  id: string;
  nome: string;
  url: string;
  categoria: CategoriaFerramenta;
  publico: PublicoFerramenta[];
  resumo: string;
  porQue: string;
  gratuito: boolean;
  licenca: string;
  pais?: string;
}

export const FERRAMENTAS_EXTERNAS = bruto as FerramentaExterna[];

const ROTULO_CATEGORIA: Record<CategoriaFerramenta, string> = {
  ia: "Inteligência artificial",
  agentes: "Agentes",
  design: "Design",
  frontend: "Front-end",
  infra: "Infraestrutura",
  privacidade: "Privacidade",
  dados: "Dados",
  cultura: "Cultura",
  dev: "Desenvolvimento",
};

const ROTULO_PUBLICO: Record<PublicoFerramenta, string> = {
  dev: "Dev",
  ia: "Entusiasta de IA",
  pesquisa: "Pesquisador",
  cidadao: "Cidadão",
};

const ICONE: Record<CategoriaFerramenta, typeof Wrench> = {
  ia: Sparkles,
  agentes: Bot,
  design: Palette,
  frontend: Code2,
  infra: Server,
  privacidade: ShieldCheck,
  dados: Database,
  cultura: Music,
  dev: Terminal,
};

const PUBLICOS: PublicoFerramenta[] = ["dev", "ia", "pesquisa", "cidadao"];

export default function FerramentasExternas() {
  const [publico, setPublico] = useState<PublicoFerramenta | "todos">("todos");
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const termo = busca
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    return FERRAMENTAS_EXTERNAS.filter((f) => {
      if (publico !== "todos" && !f.publico.includes(publico)) return false;
      if (!termo) return true;
      const alvo = `${f.nome} ${f.resumo} ${f.porQue} ${ROTULO_CATEGORIA[f.categoria]}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      return alvo.includes(termo);
    });
  }, [publico, busca]);

  return (
    <section aria-labelledby="radar-ferramentas" className="space-y-5">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Wrench size={14} aria-hidden="true" />
          <span>Radar de ferramentas</span>
        </div>
        <h2
          id="radar-ferramentas"
          className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          Ferramentas de fora que valem o clique
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          Catálogo curado para quem desenvolve, pesquisa, gosta de IA ou fiscaliza
          o poder público. Cada item diz para quem serve, a licença e por que está
          aqui — sem link patrocinado e sem ordem por popularidade.
        </p>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por público">
          <button
            type="button"
            onClick={() => setPublico("todos")}
            aria-pressed={publico === "todos"}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
              publico === "todos"
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
            }`}
          >
            <Users size={13} aria-hidden="true" />
            Todos
          </button>
          {PUBLICOS.map((p) => {
            const ativo = publico === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPublico(p)}
                aria-pressed={ativo}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  ativo
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {p === "pesquisa" ? (
                  <FlaskConical size={13} aria-hidden="true" />
                ) : (
                  <Users size={13} aria-hidden="true" />
                )}
                {ROTULO_PUBLICO[p]}
              </button>
            );
          })}
        </div>

        <label className="flex min-h-10 w-full max-w-md items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-muted focus-within:border-primary">
          <Search size={15} aria-hidden="true" />
          <span className="sr-only">Buscar ferramenta</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, tema ou uso…"
            className="w-full bg-transparent py-2 text-text outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <p className="text-xs text-muted" aria-live="polite">
        {visiveis.length} de {FERRAMENTAS_EXTERNAS.length} ferramentas
      </p>

      {visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface-2/60 p-6 text-sm text-muted">
          Nenhuma ferramenta com esse filtro. Tente outro público ou limpe a busca.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((f) => {
            const Icone = ICONE[f.categoria];
            return (
              <li
                key={f.id}
                className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition-colors hover:border-primary/60"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icone size={18} aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[12px] font-semibold text-muted">
                      {ROTULO_CATEGORIA[f.categoria]}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold leading-snug text-foreground">
                    {f.nome}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{f.resumo}</p>

                  <p className="rounded-lg border border-border/60 bg-surface-2/60 p-2.5 text-[12.5px] leading-relaxed text-muted">
                    <strong className="font-semibold text-foreground">Por que importa: </strong>
                    {f.porQue}
                  </p>
                </div>

                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {f.publico.map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-medium text-primary"
                      >
                        {ROTULO_PUBLICO[p]}
                      </span>
                    ))}
                    {f.pais === "BR" && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-300">
                        Brasil
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[12px] text-muted">
                      {f.gratuito ? "Gratuito" : "Pago"} · {f.licenca}
                    </span>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-primary hover:underline"
                    >
                      Abrir
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Achou link quebrado ou licença mudou? Escreva para{" "}
        <a
          className="font-semibold text-primary hover:underline"
          href="mailto:contato@controlepopular.com.br?subject=Radar%20de%20ferramentas"
        >
          contato@controlepopular.com.br
        </a>
        . Curadoria revisada em 18/11/2026.
      </p>
    </section>
  );
}
