"use client";

/**
 * @file apps/web/app/indicadores/componentes/PontesCivicasIndicadores.tsx
 * @description Conexões e atalhos cívicos para os centros de aprofundamento temático do portal.
 *
 * Regras:
 *   - Regra 5.13: navegação interna com Link do Next.js sem desmontar casca.
 *   - Regra 5.14: responsividade mobile (390 px) em grade adaptativa.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs).
 */

import React from "react";
import Link from "next/link";
import { GraduationCap, HeartPulse, Briefcase, Scale, ArrowRight } from "lucide-react";

export default function PontesCivicasIndicadores() {
  const conexoes = [
    {
      titulo: "Hub Unificado de Educação",
      descricao: "Universidades (2.600+), catálogo de cursos, periódicos científicos e grupos de pesquisa CNPq.",
      href: "/educacao",
      icone: GraduationCap,
      cor: "text-blue-500",
    },
    {
      titulo: "Serviços Essenciais & Fichas SUS",
      descricao: "Auditorias hospitalares, capacidade de atendimento municipal e fichas de fiscalização cívica.",
      href: "/direitos-em-movimento/servicos?subfrente=saude-publica",
      icone: HeartPulse,
      cor: "text-rose-500",
    },
    {
      titulo: "Radar Nacional de Concursos",
      descricao: "Mapeamento nacional de concursos públicos e contratações temporárias nos 27 estados.",
      href: "/concursos",
      icone: Briefcase,
      cor: "text-emerald-500",
    },
    {
      titulo: "Direitos Comparados & Marcos Legais",
      descricao: "Sistematização de normas constitucionais (CF/88, LDB, Fundeb) e impacto das políticas públicas.",
      href: "/direitos-comparados",
      icone: Scale,
      cor: "text-amber-500",
    },
  ];

  return (
    <section aria-labelledby="titulo-conexoes-civicas" className="mt-8 space-y-4">
      <div className="border-b border-border pb-2">
        <h2 id="titulo-conexoes-civicas" className="text-base sm:text-lg font-bold text-foreground">
          Conexões e Aprofundamento no Portal
        </h2>
        <p className="text-xs text-text-soft mt-0.5">
          Acesse os painéis temáticos detalhados para cruzar com os indicadores estaduais e municipais.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {conexoes.map((item) => {
          const Icone = item.icone;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-border bg-surface p-4 hover:border-primary/50 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-xl bg-surface-2 ${item.cor}`}>
                    <Icone className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.titulo}
                  </h3>
                </div>
                <p className="text-xs text-text-soft leading-relaxed">
                  {item.descricao}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                <span>Acessar painel</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
