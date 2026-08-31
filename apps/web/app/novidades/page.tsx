import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import novidades from "@/data/novidades.json";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Novidades — Controle Popular",
  description:
    "Ultimas atualizacoes do portal: novos dados, coletas e funcionalidades.",
};

const COR_FRENTE: Record<string, string> = {
  cidades: "var(--cp-accent)",
  congresso: "var(--cp-secondary)",
  judiciario: "var(--cp-tertiary)",
  ambiental: "var(--cp-accent)",
  paraopeba: "var(--cp-primary)",
  terras: "var(--cp-secondary)",
  operacao: "var(--cp-tertiary)",
};

const LABEL_FRENTE: Record<string, string> = {
  cidades: "Cidades",
  congresso: "Congresso",
  judiciario: "Judiciario",
  ambiental: "Ambiental",
  paraopeba: "Paraopeba",
  terras: "Terras",
  operacao: "Operacao",
};

export default function NovidadesPage() {
  const itens = [...novidades].sort((a, b) => b.data.localeCompare(a.data));
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/" className="hover:text-primary">
          Inicio
        </a>{" "}
        · <span className="text-text">Novidades</span>
      </nav>

      <h1 className="flex items-center gap-3 font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        <Sparkles size={28} className="text-primary" aria-hidden="true" />
        Novidades do portal
      </h1>

      <p className="mt-3 max-w-2xl text-[1.02em] leading-relaxed text-text-soft">
        Ultimas atualizacoes de dados, coletas, funcionalidades e melhorias
        do Controle Popular.
      </p>

      <ul className="mt-8 space-y-4">
        {itens.map((item, i) => {
          const diasAtras = Math.round(
            (new Date(hoje).getTime() - new Date(item.data).getTime()) / 86400000
          );
          const novo = diasAtras <= 7;

          return (
            <li
              key={`${item.data}-${i}`}
              className="relative rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary"
            >
              {novo && (
                <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[.65em] font-bold uppercase tracking-wider text-primary-ink">
                  Novo
                </span>
              )}

              <div className="flex items-center gap-3 text-[.82em] text-text-soft">
                <time dateTime={item.data}>
                  {new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(item.data + "T12:00:00Z"))}
                </time>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[.8em] font-medium"
                  style={{
                    color: COR_FRENTE[item.frente] || "var(--cp-primary)",
                    backgroundColor: `color-mix(in srgb, ${COR_FRENTE[item.frente] || "var(--cp-primary)"} 10%, transparent)`,
                  }}
                >
                  {LABEL_FRENTE[item.frente] || item.frente}
                </span>
              </div>

              <h2 className="mt-2 font-display text-lg font-semibold">
                {item.link ? (
                  <a href={item.link} className="hover:text-primary focus-visible:outline-none focus-visible:underline">
                    {item.titulo}
                  </a>
                ) : (
                  item.titulo
                )}
              </h2>

              <p className="mt-1.5 text-[.92em] leading-relaxed text-text-soft">
                {item.descricao}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
