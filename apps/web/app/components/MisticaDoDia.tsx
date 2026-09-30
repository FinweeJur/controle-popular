"use client";

/**
 * Mística do Dia — bloco de memória da home.
 *
 * O que faz: mostra, abaixo da nav bar e do letreiro "✦ OLHO ABERTO ✦" e
 * acima da capa-hero, uma luta popular ou fato de resistência do DIA do
 * visitante, com a citação CURTA da fonte no formato do dono
 * `(Obra, Autor, Data)` e link quando houver. Pedido do dono em
 * 29/09/2026 ("como a home editável do Google"), dentro do plano
 * `docs/planos/PLANO-MEMORIA-RESISTENCIAS.md`.
 *
 * UNIFICAÇÃO DAS DATAS (dono, 30/09/2026): o selo de ano só aparece
 * quando o título NÃO traz o ano; e a citação é curta, para a data não
 * sair duas vezes na tela.
 *
 * POR QUE COMPONENTE DE CLIENTE E CARGA SOB DEMANDA (decisão técnica):
 * 1. o dia tem que ser o do visitante, não o do build — a home é
 *    pré-renderizada, então o cálculo tem que rodar no navegador;
 * 2. o calendário tem 433 entradas (~153 KB): importar isso no bundle
 *    principal inflaria a página mais visitada do portal. O módulo entra
 *    por `import()` dentro do efeito, virando um chunk separado;
 * 3. sem entrada do dia, o componente não renderiza nada — a lacuna é
 *    declarada pelo silêncio, nunca por fato inventado (AGENTS.md §7).
 *
 * Acessibilidade: é um `aside` rotulado, sem cor como único canal, e a
 * fonte vai colada ao fato (rótulo "Fonte" com o ABNT visível), como o
 * §8 do AGENTS.md exige.
 */

import { useEffect, useState } from "react";
import type { EntradaCalendario } from "@/lib/memoria/tipos";
import { CampfireColonyAnim } from "@/app/components/CampfireColonyAnim";

interface MisticaCarregada {
  entrada: EntradaCalendario;
  fonte: string;
  seloAno: boolean;
}

export default function MisticaDoDia() {
  const [mistica, setMistica] = useState<MisticaCarregada | null>(null);

  useEffect(() => {
    let vivo = true;
    import("@/lib/memoria/mistica")
      .then(({ misticaDoDia, fonteCurta, mostrarAnoSelo }) => {
        if (!vivo) return;
        const entrada = misticaDoDia(new Date());
        if (entrada) {
          setMistica({
            entrada,
            fonte: fonteCurta(entrada),
            seloAno: mostrarAnoSelo(entrada),
          });
        }
      })
      .catch(() => {
        // Bloco de memória é enfeite cívico: falha aqui não pode derrubar
        // a home. Silêncio é a degradação correta (e é o que a lacuna já
        // faz quando não há entrada do dia).
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (!mistica) return null;

  const { entrada, fonte, seloAno } = mistica;

  return (
    <aside
      aria-label="Mística do Dia"
      className="mistica-asile mb-8 rounded-2xl border border-border bg-surface px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4"
    >
      {/* Fogueira decorativa à esquerda, alinhada à linha do título. */}
      <CampfireColonyAnim />

      {/* Conteúdo da mística à direita, começando na mesma altura da peça. */}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
          Mística do Dia
        </p>
        <p className="mt-1 text-[1.02em] text-foreground">
          {seloAno ? (
            <span className="font-semibold">{entrada.ano}: </span>
          ) : null}
          {entrada.titulo}
        </p>
        {entrada.resumo ? (
          <p className="mt-1 text-[.95em] text-text-soft">{entrada.resumo}</p>
        ) : null}
        {entrada.semData ? (
          <p className="mt-1 text-[.8em] text-muted">
            Fato do calendário sem data no original — exibido para não deixar
            o dia vazio.
          </p>
        ) : null}
        <p className="mt-2 text-[.85em] text-muted">
          <span className="font-semibold">Fonte: </span>
          {entrada.url ? (
            <a
              href={entrada.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              {fonte}
            </a>
          ) : (
            fonte
          )}
        </p>
      </div>
    </aside>
  );
}
