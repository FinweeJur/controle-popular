"use client";

/**
 * @file apps/web/app/educacao/componentes/TopicoIntercambioCalendario.tsx
 * @description Módulo de Mobilidade Acadêmica Internacional, Calendário e Coordenações de Curso.
 *
 * Papel no portal:
 *   Reúne o acervo completo de oportunidades de graduação e pós-graduação sanduíche:
 *   1. Calendário Anual 12 Meses (Janeiro a Dezembro) com prazos de submissão e chamadas abertas.
 *   2. Editais oficiais de mobilidade internacional (Erasmus+, PILA, AUGM/Escala, Brafitec, Santander...).
 *   3. Diretorias de Relações Internacionais (DRI/SRI/IRO) mapeadas em todos os continentes.
 *   4. Catálogo de cursos com canais diretos de professores coordenadores.
 *   5. Guia didático: como participar de intercâmbios com bolsa integral e moradia.
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho.
 *   - Regra 5.14: responsividade mobile (390 px) e sem estouro lateral.
 *   - Regra 5.16: texto nunca menor que 12 px (text-xs = 12px).
 */

import React from "react";
import { Plane } from "lucide-react";
import PainelIntercambioCursos from "../PainelIntercambioCursos";
import type {
  DepartamentoIntercambio,
  EditalProgramaIntercambio,
  CursoCoordenador,
  EventoCalendarioAcademico,
  ResumoIntercambio,
} from "@/lib/intercambio/tipos";

interface TopicoIntercambioCalendarioProps {
  departamentos: DepartamentoIntercambio[];
  programas: EditalProgramaIntercambio[];
  cursos: CursoCoordenador[];
  eventosCalendario: EventoCalendarioAcademico[];
  resumo: ResumoIntercambio;
}

export default function TopicoIntercambioCalendario({
  departamentos,
  programas,
  cursos,
  eventosCalendario,
  resumo,
}: TopicoIntercambioCalendarioProps) {
  return (
    <div className="mt-8 space-y-8">
      {/* Bloco Didático: Guia Rápido de Acesso a Bolsas e Intercâmbio */}
      <section
        aria-labelledby="titulo-guia-intercambio"
        className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Plane className="w-5 h-5" />
            </span>
            <div>
              <h2
                id="titulo-guia-intercambio"
                className="font-display text-xl sm:text-2xl font-bold text-foreground"
              >
                Mobilidade Acadêmica: Calendário Anual e Programas Oficiais
              </h2>
              <p className="text-xs text-muted">
                {programas.length} programas internacionais · {departamentos.length} diretorias de R.I. · {cursos.length} cursos com coordenações mapeadas
              </p>
            </div>
          </div>

          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted border border-border">
            12 Meses de Editais
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-4xl">
          Estudar no exterior durante a graduação ou pós-graduação é um direito viável por meio
          de convênios multilaterais e bolsas de mérito/vulnerabilidade. Abaixo você encontra o
          passo a passo para planejar sua candidatura e o diretório de contatos oficiais.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted leading-relaxed">
          <div className="p-4 rounded-2xl bg-surface-2 border border-border">
            <h3 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 mb-2">
              <span>🏛️</span> 1. A Diretoria de R.I. (DRI/SRI)
            </h3>
            <p>
              Os editais para o <strong>Erasmus+</strong>, <strong>PILA</strong>, <strong>AUGM</strong> e <strong>Brafitec</strong> são lançados
              sempre pela DRI da sua universidade. Consulte a aba &ldquo;Departamentos de R.I.&rdquo; para encontrar o e-mail oficial da sua instituição.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-2 border border-border">
            <h3 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 mb-2">
              <span>📄</span> 2. Validação com o Coordenador
            </h3>
            <p>
              Antes de viajar, procure o coordenador do seu curso (aba &ldquo;Cursos &amp; Coordenações&rdquo;) para elaborar o <strong>plano de equivalência</strong> de
              disciplinas, garantindo o aproveitamento integral de todos os créditos cursados no exterior.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-2 border border-border">
            <h3 className="font-bold text-foreground text-xs sm:text-sm flex items-center gap-1.5 mb-2">
              <span>💰</span> 3. Bolsas e Isenção de Taxas
            </h3>
            <p>
              Programas como PILA e AUGM garantem <strong>moradia e alimentação gratuitas</strong> na universidade anfitriã. O Erasmus+ e Brafitec
              concedem bolsas mensais de manutenção em euros e passagens aéreas.
            </p>
          </div>
        </div>
      </section>

      {/* Painel Interativo de Calendário, Editais, DRIs e Cursos */}
      <PainelIntercambioCursos
        departamentos={departamentos}
        programas={programas}
        cursos={cursos}
        eventosCalendario={eventosCalendario}
        resumo={resumo}
      />
    </div>
  );
}
