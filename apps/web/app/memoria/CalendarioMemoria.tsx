"use client";

/**
 * CalendarioMemoria — a visão CALENDÁRIO da página `/memoria`.
 *
 * Papel no portal: mostrar os mesmos fatos da linha do tempo, mas
 * agrupados por MÊS e DIA, IGNORANDO O ANO — o ano não some, ele fica em
 * cada fato (anos diferentes do mesmo dia não são colapsados). É a leitura
 * "o que aconteceu neste dia do ano, em todas as épocas".
 *
 * A ordem DENTRO de cada dia é a mesma da "Mística do Dia"
 * (`lib/memoria/ordenacao.ts`): fonte com link primeiro, depois o ano mais
 * antigo, depois o título. Não há duas regras de ordem.
 *
 * Fonte dos dados: os mesmos verbetes que o servidor já entrega à linha do
 * tempo (`VerbeteLinha`), sem consulta nova e sem inflar o payload (AGENTS
 * §5.1). A visão calendário NÃO aplica os filtros da linha do tempo — ela é
 * um retrato do ano inteiro; a busca e os filtros vivem na linha do tempo.
 *
 * Acessibilidade: cada mês é uma `section` com título; cada dia é um item
 * de lista com a data em TEXTO ("07/04") além do mês por extenso; a fonte
 * é link com rótulo próprio. Cor nunca é o único canal.
 */

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { compararNaMistica } from "@/lib/memoria/ordenacao";
import type { VerbeteLinha } from "./LinhaDoTempo";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

interface Props {
  verbetes: VerbeteLinha[];
}

/** Zero à esquerda para a data ficar sempre com dois dígitos (07/04). */
const pad = (n: number) => String(n).padStart(2, "0");

export default function CalendarioMemoria({ verbetes }: Props) {
  // Mês (0-11) → dia (1-31) → verbetes daquele dia, já na ordem da mística.
  const porMes = useMemo(() => {
    const meses: Map<number, VerbeteLinha[]>[] = Array.from(
      { length: 12 },
      () => new Map<number, VerbeteLinha[]>(),
    );
    for (const v of verbetes) {
      const [mes, dia] = v.diaMes.split("-").map(Number);
      if (!mes || !dia) continue;
      const dias = meses[mes - 1];
      const lista = dias.get(dia) ?? [];
      lista.push(v);
      dias.set(dia, lista);
    }
    for (const dias of meses) {
      for (const lista of dias.values()) lista.sort(compararNaMistica);
    }
    return meses;
  }, [verbetes]);

  const totalDias = porMes.reduce((acc, dias) => acc + dias.size, 0);

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-text-soft">
        O mesmo acervo da linha do tempo, agora pelo dia do ano — sem o ano.
        São <strong className="font-semibold text-foreground">{totalDias}</strong>{" "}
        dias do calendário com ao menos um fato. Cada dia reúne anos
        diferentes, sem colapsá-los: uma revolta de 1835 e uma greve de 1980
        aparecem lado a lado. A ordem é a da mística do dia.
      </p>

      {porMes.map((dias, indiceMes) => {
        if (dias.size === 0) return null;
        const mes = indiceMes + 1;
        const diasOrdenados = [...dias.entries()].sort((a, b) => a[0] - b[0]);
        return (
          <section
            key={mes}
            aria-labelledby={`calendario-mes-${mes}`}
            className="space-y-3"
          >
            <h2
              id={`calendario-mes-${mes}`}
              className="sticky top-0 z-10 -mx-1 border-b border-border bg-bg/95 px-1 py-2 font-display text-lg font-bold capitalize text-foreground backdrop-blur"
            >
              {MESES[indiceMes]}
              <span className="ml-2 font-mono text-xs font-normal text-muted">
                {dias.size} {dias.size === 1 ? "dia" : "dias"}
              </span>
            </h2>

            <ol className="space-y-3">
              {diasOrdenados.map(([dia, lista]) => (
                <li
                  key={dia}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <span className="font-mono text-base font-bold text-primary">
                      {pad(dia)}/{pad(mes)}
                    </span>
                    <span className="text-xs text-muted">
                      {lista.length} {lista.length === 1 ? "verbete" : "verbetes"}
                    </span>
                  </div>

                  <ul className="mt-2 space-y-3 border-l-2 border-border/60 pl-4">
                    {lista.map((v, i) => (
                      <li key={`${v.diaMes}-${v.ano}-${v.titulo}-${i}`}>
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-mono text-sm font-semibold text-primary">
                            {v.ano || "sem data"}
                          </span>
                          <h3 className="font-semibold text-foreground">
                            {v.tituloCurto ?? v.titulo}
                          </h3>
                        </div>
                        {v.lugar ? (
                          <p className="mt-0.5 text-xs text-muted">
                            <span className="font-semibold">Onde: </span>
                            {v.lugar}
                            {v.uf ? `/${v.uf}` : ""}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted">
                          {v.url ? (
                            <a
                              href={v.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-primary"
                            >
                              {v.fonteCurta}
                              <ExternalLink
                                className="ml-1 inline h-3 w-3 align-[-1px]"
                                aria-hidden="true"
                              />
                            </a>
                          ) : (
                            v.fonteCurta
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
