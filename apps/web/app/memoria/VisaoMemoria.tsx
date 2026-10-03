"use client";

/**
 * VisaoMemoria — o alternador "Linha do tempo | Calendário" da `/memoria`.
 *
 * Papel no portal: oferecer duas leituras do MESMO acervo (pedido do dono,
 * 03/10/2026). A linha do tempo é cronológica e tem busca/filtros; o
 * calendário agrupa por dia do ano, ignorando o ano. Os dados chegam do
 * servidor uma vez só (`VerbeteLinha[]`) e são repassados à vista ativa —
 * nenhum dado novo é buscado no cliente.
 *
 * Acessibilidade:
 * - o alternador é um grupo nomeado (`role="group"` + `aria-label`) de dois
 *   botões com `aria-pressed`, operáveis por Tab + Enter/Espaço;
 * - o estado ativo não depende só de cor: ganha borda e negrito, e o
 *   `aria-pressed` anuncia a seleção a leitores de tela;
 * - cada vista é renderizada em uma `section` rotulada.
 *
 * Estado preservado? Não: como só a vista ativa é montada, trocar de aba
 * zera os filtros da linha do tempo. É intencional — manter as duas montadas
 * dobraria o DOM do acervo inteiro sem ganho de leitura.
 */

import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import LinhaDoTempo from "./LinhaDoTempo";
import type { VerbeteLinha } from "./LinhaDoTempo";
import CalendarioMemoria from "./CalendarioMemoria";

type Visao = "linha" | "calendario";

interface Props {
  verbetes: VerbeteLinha[];
}

export default function VisaoMemoria({ verbetes }: Props) {
  const [visao, setVisao] = useState<Visao>("linha");

  const classeBotao = (ativo: boolean) =>
    `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
      ativo
        ? "border-primary bg-primary/10 font-semibold text-primary"
        : "border-border bg-surface text-text-soft hover:border-primary"
    }`;

  return (
    <section aria-label="Visualizações do acervo" className="space-y-6">
      <div
        role="group"
        aria-label="Formato de visualização do acervo"
        className="flex flex-wrap gap-2 print:hidden"
      >
        <button
          type="button"
          onClick={() => setVisao("linha")}
          aria-pressed={visao === "linha"}
          className={classeBotao(visao === "linha")}
        >
          <List size={15} aria-hidden="true" />
          Linha do tempo
        </button>
        <button
          type="button"
          onClick={() => setVisao("calendario")}
          aria-pressed={visao === "calendario"}
          className={classeBotao(visao === "calendario")}
        >
          <CalendarDays size={15} aria-hidden="true" />
          Calendário
        </button>
      </div>

      {visao === "linha" ? (
        <div role="region" aria-label="Linha do tempo">
          <LinhaDoTempo verbetes={verbetes} />
        </div>
      ) : (
        <div role="region" aria-label="Calendário por dia do ano">
          <CalendarioMemoria verbetes={verbetes} />
        </div>
      )}
    </section>
  );
}
