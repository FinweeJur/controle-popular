"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CardDestaque from "@/app/congresso/components/CardDestaque";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import type { Destaque } from "@/lib/congresso/destaques";
import { casaComTema, temaPorSlug, TEMAS } from "@/lib/congresso/temas";

/**
 * Tabela de `/congresso/bons-exemplos` — mesmo mecanismo de
 * `congresso/proposicoes` (ver o porquê em `dados/[arquivo]/route.ts`).
 *
 * ═══ POR QUE UMA COLUNA SÓ, COM `CardDestaque` INTEIRO ═══
 *
 * `alertas`/`bons-exemplos` sempre foram cards ricos (rótulo, autoria,
 * cláusula pétrea, trecho do dispositivo, link pra ofício), não linhas de
 * tabela — decompor isso em colunas separadas (como
 * `congresso/proposicoes/ListaProposicoes.tsx` fez) perderia a legibilidade
 * do card sem ganhar nada, já que não há dado tabular de verdade aqui (é
 * uma lista ordenada por gravidade, uma coisa por linha). `CardDestaque` já
 * era puro (sem hook) e usado em `alertas`; reaproveitado inteiro dentro de
 * uma única coluna "sem cabeçalho visível" preserva a UI original quase byte
 * a byte.
 *
 * ═══ O CORTE EM 60 NÃO FOI REPRODUZIDO — E ISSO É DELIBERADO ═══
 *
 * O SQL original filtrava por tema no conjunto inteiro e SÓ DEPOIS cortava
 * em 60 (a mesma armadilha documentada em `congresso/alertas/AlertasLista.tsx`,
 * que embute tudo no HTML e por isso consegue cortar em 60 no cliente sem
 * custo). Aqui o índice fatiado entrega o conjunto INTEIRO (360 garantistas,
 * medido em 2026-08-09) e `TabelaEstatica.filtrar` é um predicado por linha
 * — não tem como implementar "os 60 primeiros do que passou no filtro" sem
 * reescrever o componente pra aceitar um cursor de posição, e isso fica fora
 * do território desta página. A troca: em vez de cortar SEM avisar depois
 * dos 60 mais expressivos, a tabela agora pagina o conjunto inteiro — quem
 * quiser o 61º mais expressivo consegue chegar lá clicando "Próxima", em vez
 * de a página fingir que ele não existe. A ordem (mais expressivo primeiro)
 * continua a mesma, preservada pelo próprio `bonsExemplos()`.
 *
 * `casaComTema`/`temaPorSlug`/`TEMAS` só leem `rubrica.json`/`temas.json` —
 * seguro de importar direto no cliente.
 */

type LinhaDestaque = Destaque & Record<string, unknown>;

const COLUNAS: ColunaTabela<LinhaDestaque>[] = [
  { chave: "id", rotulo: "", formatar: (d) => <CardDestaque d={d} /> },
];

export default function ListaBonsExemplos({ base }: { base: string }) {
  const [temaSlug, setTemaSlug] = useState<string | undefined>(undefined);
  const primeiraRenderizacao = useRef(true);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTemaSlug(sp.get("tema") ?? undefined);
  }, []);

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (temaSlug) {
      sp.set("tema", temaSlug);
    } else {
      sp.delete("tema");
    }
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [temaSlug]);

  const tema = temaSlug ? temaPorSlug(temaSlug) : undefined;

  const filtrar = useCallback(
    (d: LinhaDestaque) => (tema ? casaComTema(tema, d, d.direitos) : true),
    [tema]
  );

  return (
    <TabelaEstatica<LinhaDestaque>
      base={base}
      colunas={COLUNAS}
      camposBusca={["ementa", "keywords", "identificacao"]}
      vazio="Nenhuma proposição analisada como bom exemplo ainda."
      filtrar={filtrar}
      porPagina={20}
      controles={() => (
        <nav className="flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            onClick={() => setTemaSlug(undefined)}
            className={`rounded-md border px-3 py-1 ${
              temaSlug ? "border-[var(--cp-border)]" : "border-[var(--cp-primary)]"
            }`}
          >
            Todos os temas
          </button>
          {TEMAS.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setTemaSlug(t.slug)}
              className={`rounded-md border px-3 py-1 ${
                temaSlug === t.slug ? "border-[var(--cp-primary)]" : "border-[var(--cp-border)]"
              }`}
            >
              {t.nome}
            </button>
          ))}
        </nav>
      )}
    />
  );
}
