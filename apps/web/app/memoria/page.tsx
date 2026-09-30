import type { Metadata } from "next";
import Link from "next/link";
import { History, BookOpen, ExternalLink, CalendarDays } from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { CALENDARIO_LUTAS } from "@/lib/memoria/calendario";
import { fonteCurta } from "@/lib/memoria/mistica";
import { localDaEntrada } from "@/lib/memoria/locais";
import { DATAS_REFERENCIA, citacaoCurtaData } from "@/lib/memoria/datas-referencia";
import { ROTULO_TIPO } from "@/lib/memoria/rotulos";
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
    // Onde aconteceu, pelo gazetteer curado (`lib/memoria/locais.ts`): sem
    // reconhecimento, o campo fica indefinido e a tela não inventa lugar.
    const local = localDaEntrada(e);
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
      lugar: local?.nome,
      uf: local?.uf,
      lat: local?.lat,
      lon: local?.lon,
      ctx: local?.ctx,
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

      {/* Datas de referência dos movimentos sociais e direitos humanos.
          Fonte em citação curta (Instituição, Ano). */}
      <section aria-labelledby="datas-referencia" className="space-y-4">
        <div>
          <h2 id="datas-referencia" className="font-display text-2xl font-bold text-foreground">
            Datas de referência
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-text-soft">
            O calendário de luta dos movimentos sociais e dos direitos humanos:
            dias fixos que os movimentos marcam todo ano, cada um com a fonte.
          </p>
        </div>

        <div className="space-y-5">
          {[...new Set(DATAS_REFERENCIA.map((d) => Number(d.diaMes.slice(0, 2))))]
            .sort((a, b) => a - b)
            .map((mes) => (
              <div key={mes}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                  {MESES[mes - 1]}
                </h3>
                <ul className="mt-2 space-y-3">
                  {DATAS_REFERENCIA.filter(
                    (d) => Number(d.diaMes.slice(0, 2)) === mes
                  ).map((d) => {
                    const dia = Number(d.diaMes.slice(3, 5));
                    return (
                      <li
                        key={d.diaMes}
                        className="rounded-xl border border-border bg-surface p-4"
                      >
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="font-mono font-bold text-primary">
                            {String(dia).padStart(2, "0")}/{String(mes).padStart(2, "0")}
                          </span>
                          <h4 className="font-semibold text-text">{d.titulo}</h4>
                        </div>
                        <p className="mt-1 text-sm text-text-soft">{d.descricao}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {d.tipo.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft"
                            >
                              {ROTULO_TIPO[t]}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-muted">
                          <span className="font-semibold">Fonte: </span>
                          <a
                            href={d.fonte.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`${d.fonte.titulo} — ${d.fonte.autor}`}
                            className="underline hover:text-primary"
                          >
                            {citacaoCurtaData(d.fonte)}
                          </a>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </div>
      </section>

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
