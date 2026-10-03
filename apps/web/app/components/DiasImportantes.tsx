"use client";

/**
 * Dias importantes dos povos indígenas — bloco exibido na home ANTES da
 * frase da Mística do Dia.
 *
 * O QUE FAZ: mostra, no dia do visitante, a(s) data(s) significativa(s) para
 * os povos originários — nome, objetivo e contexto de criação, em no máximo
 * duas linhas de texto. Sem data no dia, não renderiza nada (a lacuna é
 * declarada pelo silêncio, como a Mística).
 *
 * POR QUE CLIENTE: o dia tem de ser o do VISITANTE, não o do build — a home é
 * pré-renderizada. O dado (`DIAS_IMPORTANTES`) é pequeno e vem por import.
 *
 * FONTE: `lib/memoria/dias-importantes.ts` (ONU, UNESCO, Planalto e
 * referência). Cada item tem URL; o rodapé traz a fonte.
 */

import { useEffect, useState } from "react";
import { CalendarDays, ExternalLink } from "lucide-react";
import type { DiaImportante } from "@/lib/memoria/dias-importantes";

/** Chave "MM-DD" no fuso local do visitante. */
function chaveHoje(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${mes}-${dia}`;
}

export default function DiasImportantes() {
  const [dias, setDias] = useState<DiaImportante[]>([]);

  useEffect(() => {
    let vivo = true;
    // Carrega sob demanda (como a Mística): o dia é o do VISITANTE e o dado
    // não infla o bundle principal da home. O `import()` põe o setState num
    // ciclo assíncrono — sem isso o lint (react-hooks) acusa setState
    // síncrono dentro do efeito.
    import("@/lib/memoria/dias-importantes")
      .then(({ DIAS_IMPORTANTES }) => {
        if (!vivo) return;
        const chave = chaveHoje(new Date());
        setDias(DIAS_IMPORTANTES.filter((d) => d.diaMes === chave));
      })
      .catch(() => {
        // Enfeite cívico: falha aqui não pode derrubar a home.
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (dias.length === 0) return null;

  return (
    <aside
      aria-label="Dias importantes dos povos indígenas"
      className="mb-2 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-2 sm:px-6 sm:py-3"
    >
      {dias.map((d, i) => (
        <div key={d.diaMes} className={i > 0 ? "mt-2 border-t border-primary/20 pt-2" : undefined}>
          <p className="flex items-center gap-1.5 text-[0.92em] font-semibold text-foreground">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            {d.nome}
            <span className="font-normal text-[0.72em] text-muted">
              · {d.abrangencia} · desde {d.desde}
            </span>
          </p>
          {/* Máximo de duas linhas: objetivo + contexto. */}
          <p className="mt-0.5 line-clamp-2 leading-snug text-[.95em] text-text-soft">
            {d.objetivo} {d.contexto}
          </p>
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-[.72em] text-muted underline hover:text-primary"
          >
            {d.fonte}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      ))}
    </aside>
  );
}
