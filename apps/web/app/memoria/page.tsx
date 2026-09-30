import type { Metadata } from "next";
import Link from "next/link";
import { History, BookOpen, ExternalLink, CalendarDays } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { CALENDARIO_LUTAS } from "@/lib/memoria/calendario";
import { fonteCurta } from "@/lib/memoria/mistica";
import LinhaDoTempo from "./LinhaDoTempo";
import type { VerbeteLinha } from "./LinhaDoTempo";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/memoria", {
  title: "Linha do Tempo das Lutas — Controle Popular",
  description:
    "Linha do tempo da história das lutas, revoltas e resistências, com todas as citações: 533 fatos do Calendário Histórico dos Trabalhadores e Trabalhadoras (MST, 2009) e do Calendário Insurgente (Blog Aos que Virão, 2020).",
});

// Sem `searchParams`: força estática, como as demais páginas de lista (sem
// `force-static` o `output: 'export'` trata a rota como dinâmica e aborta).
export const dynamic = "force-static";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * Data em que o acervo foi gerado por `gera-calendario-insurgente.py`
 * (regra do AGENTS §8.4: número na tela vem de constante medida com data).
 * Os totais abaixo, porém, são contados do próprio dado — nunca digitados.
 */
const MEDIDO_EM = "30/09/2026";

export default function MemoriaPage() {
  const verbetes: VerbeteLinha[] = CALENDARIO_LUTAS.map((e) => {
    const [mes, dia] = e.diaMes.split("-").map(Number);
    return {
      diaMes: e.diaMes,
      ano: e.ano,
      titulo: e.titulo,
      resumo: e.resumo,
      tipo: e.tipo,
      fonteCurta: fonteCurta(e),
      url: e.url,
      semData: e.semData,
      dataLabel: `${dia} de ${MESES[mes - 1]}`,
    };
  });

  // Agregados medidos do próprio dado.
  const total = verbetes.length;
  const comLink = verbetes.filter((v) => v.url).length;
  const dias = new Set(verbetes.map((v) => v.diaMes)).size;
  const comResumo = verbetes.filter((v) => v.resumo).length;
  const anos = verbetes
    .map((v) => Number(v.ano))
    .filter((n) => Number.isFinite(n) && n > 0);
  const primeiroAno = Math.min(...anos);
  const ultimoAno = Math.max(...anos);
  const fontes = new Map<string, number>();
  for (const v of verbetes) {
    fontes.set(v.fonteCurta, (fontes.get(v.fonteCurta) ?? 0) + 1);
  }

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8"
    >
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="transition hover:text-primary">
          Início
        </Link>{" "}
        · <span className="font-semibold text-foreground">Linha do Tempo das Lutas</span>
      </nav>

      <header className="space-y-4 rounded-3xl border border-border bg-surface p-6 shadow-xs sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <History size={14} />
          <span>Memória das resistências</span>
        </span>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Linha do Tempo das Lutas
          </h1>
          <ResumoExpandivel
            className="max-w-4xl text-muted"
            texto={
              "Cada fato da história das lutas populares, revoltas e resistências, com a citação da sua fonte. " +
              "O acervo reúne o Calendário Histórico das Trabalhadoras/es (MST, 2009) e o Calendário Insurgente " +
              "(Blog Aos que Virão, 2020). A linha do tempo é cronológica; use os filtros para recortar por tipo " +
              "de luta, século ou fonte."
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border/70 pt-3 text-xs sm:grid-cols-4">
          <div>
            <span className="block text-muted">Verbetes no acervo:</span>
            <span className="font-mono font-bold text-foreground">{total}</span>
          </div>
          <div>
            <span className="block text-muted">Período coberto:</span>
            <span className="font-semibold text-foreground">
              {primeiroAno}–{ultimoAno}
            </span>
          </div>
          <div>
            <span className="block text-muted">Dias do ano tocados:</span>
            <span className="font-mono font-semibold text-foreground">{dias}</span>
          </div>
          <div>
            <span className="block text-muted">Com fonte linkada:</span>
            <span className="font-mono font-semibold text-foreground">
              {comLink}/{total}
            </span>
          </div>
        </div>

        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={13} aria-hidden="true" /> {comResumo} verbetes com resumo
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} aria-hidden="true" /> 2 fontes:{" "}
            {[...fontes.entries()]
              .map(([nome, n]) => `${nome} (${n})`)
              .join(" · ")}
          </span>
          <span>Números medidos do acervo em {MEDIDO_EM}.</span>
        </p>
      </header>

      <LinhaDoTempo verbetes={verbetes} />

      <p className="text-xs text-muted">
        Fontes primárias citadas em cada verbete. Fonte terciária (Wikipédia,
        Wikidata) não decide verbete — é ponte, nunca fonte.{" "}
        <a
          href="https://aosquevirao.home.blog/category/calendario-insurgente/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline hover:text-primary"
        >
          Ver o Calendário Insurgente <ExternalLink size={11} aria-hidden="true" />
        </a>
      </p>

      <FooterGlobal />
    </main>
  );
}
