"use client";

/**
 * Componente cliente para visualização da Mesa Diretora e Lideranças da Assembleia.
 *
 * Papel no portal:
 * Apresenta a estrutura de comando e representação política da Casa Legislativa,
 * com nomes, partidos, biografia breve da presidência e contatos oficiais diretos.
 *
 * Fontes oficiais:
 * - Regimento Interno e ata de posse da Mesa Diretora de cada Assembleia Legislativa.
 */

import { Crown, UserCheck, ShieldCheck, Mail, Phone, MapPin, Globe } from "lucide-react";
import type { MesaDiretora, ContatosAssembleia, SedeAssembleia } from "@/lib/assembleias/types";

interface MesaDiretoraCardProps {
  mesa: MesaDiretora;
  contatos: ContatosAssembleia;
  sede: SedeAssembleia;
  siglaAssembleia: string;
}

export default function MesaDiretoraCard({
  mesa,
  contatos,
  sede,
  siglaAssembleia,
}: MesaDiretoraCardProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ═══ CARTÃO DA PRESIDÊNCIA ═══ */}
      <div className="flex flex-col justify-between rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-surface to-surface-2 p-6 shadow-sm lg:col-span-1">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/20 px-3 py-0.5 text-xs font-bold uppercase text-primary">
              <Crown size={13} aria-hidden="true" />
              Presidência da Casa
            </span>
            <span className="rounded-full bg-surface-2 border border-border px-2.5 py-0.5 text-xs font-semibold text-muted">
              {mesa.presidente.partido}
            </span>
          </div>

          <h3 className="font-display text-xl font-bold text-foreground">
            {mesa.presidente.nome}
          </h3>

          <p className="mt-2 text-xs text-muted leading-relaxed">
            {mesa.presidente.biografiaBreve}
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-border/60 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted">
            <Phone size={13} className="text-primary shrink-0" aria-hidden="true" />
            <span>{contatos.telefone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <Mail size={13} className="text-primary shrink-0" aria-hidden="true" />
            <span className="truncate">{contatos.email}</span>
          </div>
          <div className="flex items-start gap-2 text-muted">
            <MapPin size={13} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <span className="leading-tight">
              {sede.edificio} — {sede.endereco}, {sede.cidade} (CEP {sede.cep})
            </span>
          </div>
        </div>
      </div>

      {/* ═══ MESA DIRETORA E SECRETARIAS ═══ */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs lg:col-span-2">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="font-display text-lg font-bold text-foreground">
              Mesa Diretora & Órgãos de Controle
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* 1º Vice-Presidente */}
            <div className="rounded-xl border border-border bg-surface-2 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                1º Vice-Presidente
              </span>
              <p className="font-display text-sm font-bold text-foreground mt-0.5">
                {mesa.primeiroVicePresidente.nome}
              </p>
              <span className="text-[11px] text-muted">({mesa.primeiroVicePresidente.partido})</span>
            </div>

            {/* 2º Vice-Presidente */}
            <div className="rounded-xl border border-border bg-surface-2 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                2º Vice-Presidente
              </span>
              <p className="font-display text-sm font-bold text-foreground mt-0.5">
                {mesa.segundoVicePresidente.nome}
              </p>
              <span className="text-[11px] text-muted">({mesa.segundoVicePresidente.partido})</span>
            </div>

            {/* 1º Secretário */}
            <div className="rounded-xl border border-border bg-surface-2 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                1º Secretário (Administração)
              </span>
              <p className="font-display text-sm font-bold text-foreground mt-0.5">
                {mesa.primeiroSecretario.nome}
              </p>
              <span className="text-[11px] text-muted">({mesa.primeiroSecretario.partido})</span>
            </div>

            {/* 2º Secretário */}
            <div className="rounded-xl border border-border bg-surface-2 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                2º Secretário
              </span>
              <p className="font-display text-sm font-bold text-foreground mt-0.5">
                {mesa.segundoSecretario.nome}
              </p>
              <span className="text-[11px] text-muted">({mesa.segundoSecretario.partido})</span>
            </div>

            {/* Ouvidoria */}
            <div className="rounded-xl border border-border bg-surface-2 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Ouvidor Parlamentar
              </span>
              <p className="font-display text-sm font-bold text-foreground mt-0.5">
                {mesa.ouvidor.nome}
              </p>
              <span className="text-[11px] text-muted">({mesa.ouvidor.partido})</span>
            </div>

            {/* Procuradoria da Mulher */}
            <div className="rounded-xl border border-border bg-surface-2 p-3.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Procuradora da Mulher
              </span>
              <p className="font-display text-sm font-bold text-foreground mt-0.5">
                {mesa.procuradoraMulher.nome}
              </p>
              <span className="text-[11px] text-muted">({mesa.procuradoraMulher.partido})</span>
            </div>
          </div>
        </div>

        {/* Links rápidos para portais institucionais */}
        <div className="mt-5 pt-4 border-t border-border flex flex-wrap gap-2 text-xs">
          <a
            href={contatos.portalTransparencia}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <span>Portal da Transparência</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href={contatos.dadosAbertos}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <span>Dados Abertos / API</span>
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href={contatos.processoLegislativo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-semibold text-foreground transition hover:border-primary hover:text-primary"
          >
            <span>Processo Legislativo (SAPL / ALE)</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
