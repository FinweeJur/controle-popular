/**
 * Componente unificado e acessível de Linha do Tempo de Tramitação Legislativa.
 *
 * Papel no portal:
 * Centraliza a exibição cronológica dos andamentos e despachos de matérias
 * legislativas tanto do Congresso Nacional (Câmara dos Deputados e Senado)
 * quanto das 27 Assembleias Legislativas Estaduais.
 *
 * Fontes oficiais:
 * - APIs de Dados Abertos da Câmara dos Deputados e do Senado Federal.
 * - Portais de Dados Abertos e Sistemas Legislativos (SAPL/ALE) das Assembleias Estaduais.
 *
 * Decisões técnicas e de acessibilidade:
 * - Filosofia Ponytail: componente agnóstico que normaliza eventos federais
 *   (snake_case do banco) e estaduais (camelCase do dataset) sem duplicar código.
 * - Lista semântica (<ol> e <li>) com marcação visual vertical via bordas CSS nativas,
 *   garantindo leitura sequencial em leitores de tela (a11y).
 * - Piso de legibilidade conforme AGENTS.md § 5.10: textos com tamanho text-sm ou superior.
 * - Paginação/expansão progressiva: mostra os primeiros 15 eventos com botão
 *   para expandir o histórico completo, evitando rolagem infinita sem truncar dados.
 */

"use client";

import { useState } from "react";
import { GitCommit, Calendar, ChevronDown, ChevronUp, ExternalLink, MapPin } from "lucide-react";

/** Contrato universal de um evento na linha do tempo de tramitação */
export interface EventoTramitacaoUniversal {
  sequencia: number;
  dataHora: string | null;
  siglaOrgao: string | null;
  descricao: string | null;
  despacho?: string | null;
  urlDocumento?: string | null;
}

/** Tipo de entrada flexível para acomodar formato snake_case (banco) ou camelCase (JSON/frontend) */
export type EventoTramitacaoEntrada =
  | EventoTramitacaoUniversal
  | {
      sequencia: number;
      data_hora?: string | null;
      sigla_orgao?: string | null;
      descricao?: string | null;
      despacho?: string | null;
      url_documento?: string | null;
    };

interface LinhaDoTempoTramitacaoProps {
  /** Lista de eventos de tramitação (ordem mais recente primeiro ou cronológica) */
  eventos: EventoTramitacaoEntrada[];
  /** Título customizado da seção (padrão: "Histórico de Tramitação") */
  titulo?: string;
  /** Limite inicial de eventos visíveis antes da expansão (padrão: 15) */
  limiteInicial?: number;
  /** Link canônico oficial para o processo completo na Casa legislativa */
  urlProcessoOficial?: string;
  /** Nome ou sigla da Casa (ex: "Câmara dos Deputados", "ALMG", "ALESP") */
  casaNome?: string;
}

/**
 * Normaliza um evento de qualquer fonte para o formato unificado.
 */
function normalizarEvento(e: EventoTramitacaoEntrada): EventoTramitacaoUniversal {
  if ("dataHora" in e && "siglaOrgao" in e) {
    return e as EventoTramitacaoUniversal;
  }
  const eSnake = e as {
    sequencia: number;
    data_hora?: string | null;
    sigla_orgao?: string | null;
    descricao?: string | null;
    despacho?: string | null;
    url_documento?: string | null;
  };
  return {
    sequencia: eSnake.sequencia,
    dataHora: eSnake.data_hora ?? null,
    siglaOrgao: eSnake.sigla_orgao ?? null,
    descricao: eSnake.descricao ?? null,
    despacho: eSnake.despacho ?? null,
    urlDocumento: eSnake.url_documento ?? null,
  };
}

/**
 * Formata datas no padrão amigável brasileiro.
 */
function formatarDataHora(iso: string | null): string {
  if (!iso) return "Data não informada";
  try {
    const data = new Date(iso);
    if (isNaN(data.getTime())) {
      // Se não for ISO parseável diretamente, retorna a string se tiver conteúdo
      return iso;
    }
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function LinhaDoTempoTramitacao({
  eventos,
  titulo = "Tramitação Legislativa",
  limiteInicial = 15,
  urlProcessoOficial,
  casaNome,
}: LinhaDoTempoTramitacaoProps) {
  const [expandido, setExpandido] = useState(false);

  if (!eventos || eventos.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
        <p>Nenhum evento detalhado de tramitação registrado para esta matéria até o momento.</p>
        {urlProcessoOficial && (
          <a
            href={urlProcessoOficial}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 font-medium text-primary hover:underline text-sm"
          >
            Consultar andamento oficial diretamente na Casa
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    );
  }

  const eventosNormalizados = eventos.map(normalizarEvento);
  const totalEventos = eventosNormalizados.length;
  const temMais = totalEventos > limiteInicial;
  const itensExibidos = expandido || !temMais ? eventosNormalizados : eventosNormalizados.slice(0, limiteInicial);

  return (
    <section aria-labelledby="titulo-tramitacao" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <GitCommit className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
          <h2 id="titulo-tramitacao" className="font-display text-xl font-bold text-foreground">
            {titulo}
          </h2>
          <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
            {totalEventos} {totalEventos === 1 ? "andamento" : "andamentos"}
          </span>
        </div>

        {urlProcessoOficial && (
          <a
            href={urlProcessoOficial}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            title={`Acessar processo legislativo oficial${casaNome ? ` em ${casaNome}` : ""}`}
          >
            <span>Ver no portal oficial</span>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        )}
      </div>

      <ol className="relative border-l-2 border-primary/30 ml-3 space-y-6 pt-2 pb-2">
        {itensExibidos.map((ev, index) => {
          const ehUltimo = index === 0; // Se a lista estiver do mais recente para o mais antigo

          return (
            <li key={ev.sequencia ?? index} className="ml-6 group">
              {/* Marcador na linha do tempo */}
              <span
                className={`absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 bg-background transition-transform group-hover:scale-125 ${
                  ehUltimo
                    ? "border-primary bg-primary ring-4 ring-primary/20"
                    : "border-muted-foreground/60 bg-surface"
                }`}
                aria-hidden="true"
              />

              <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs transition-colors hover:border-primary/40">
                {/* Cabeçalho do evento: Data + Órgão */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted font-medium">
                    <Calendar size={13} aria-hidden="true" />
                    <time dateTime={ev.dataHora ?? undefined}>{formatarDataHora(ev.dataHora)}</time>
                  </div>

                  {ev.siglaOrgao && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      <MapPin size={11} aria-hidden="true" />
                      {ev.siglaOrgao}
                    </span>
                  )}
                </div>

                {/* Descrição principal da ação */}
                {ev.descricao && (
                  <p className="mt-2 text-sm font-semibold text-foreground leading-relaxed">
                    {ev.descricao}
                  </p>
                )}

                {/* Despacho ou parecer detalhado */}
                {ev.despacho && (
                  <div className="mt-2 rounded-lg bg-surface-2/60 p-3 text-sm text-foreground/90 border-l-2 border-primary/40">
                    <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                      Despacho / Parecer:
                    </p>
                    <p className="leading-relaxed whitespace-pre-line text-sm">{ev.despacho}</p>
                  </div>
                )}

                {/* Documento anexo se houver */}
                {ev.urlDocumento && (
                  <div className="mt-3">
                    <a
                      href={ev.urlDocumento}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <span>Documento anexo ao andamento</span>
                      <ExternalLink size={12} aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Controle de expansão progressiva */}
      {temMais && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={() => setExpandido(!expandido)}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors shadow-xs"
          >
            {expandido ? (
              <>
                <ChevronUp size={16} aria-hidden="true" />
                <span>Mostrar apenas os {limiteInicial} andamentos mais recentes</span>
              </>
            ) : (
              <>
                <ChevronDown size={16} aria-hidden="true" />
                <span>Ver histórico completo ({totalEventos - limiteInicial} andamentos anteriores)</span>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
