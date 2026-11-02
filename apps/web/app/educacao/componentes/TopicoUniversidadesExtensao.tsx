"use client";

/**
 * @file apps/web/app/educacao/componentes/TopicoUniversidadesExtensao.tsx
 * @description Módulo de Ensino Superior, Grupos de Pesquisa CNPq e Projetos de Extensão.
 *
 * Papel no portal:
 *   Reúne o acervo completo de 1.414 grupos de pesquisa CNPq e 170 projetos de extensão
 *   de 39 instituições universitárias e 11 unidades acadêmicas, garantindo:
 *   - Zero perda de dados do portal `/universidades`.
 *   - Busca em tempo real, tolerante a acentos e filtros por grande área, tema e estado.
 *   - Contatos institucionais e links diretos para o DGP/CNPq e plataformas universitárias.
 *   - Tabelas de cruzamento multidimensional por tema e por unidade federativa.
 *
 * Regras respeitadas:
 *   - Regra 5.9: comentário explicativo no cabeçalho.
 *   - Regra 5.14: responsividade (390 px) e sem estouro lateral.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs = 12px).
 */

import React from "react";
import Link from "next/link";
import { GraduationCap, Briefcase, ArrowRight } from "lucide-react";
import PainelUniversidades from "@/app/universidades/PainelUniversidades";
import ContatosInstituicoes from "@/app/universidades/ContatosInstituicoes";
import type {
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
  Unidade,
} from "@/lib/universidades/tipos";

interface TopicoUniversidadesExtensaoProps {
  instituicoes: Instituicao[];
  unidades: Unidade[];
  grupos: GrupoPesquisa[];
  projetos: ProjetoExtensao[];
  verificadoEm: string;
}

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function TopicoUniversidadesExtensao({
  instituicoes,
  unidades,
  grupos,
  projetos,
  verificadoEm,
}: TopicoUniversidadesExtensaoProps) {
  const dataFormatada = verificadoEm.split("-").reverse().join("/");

  return (
    <div className="mt-8 space-y-8">
      {/* Cabeçalho Executivo do Módulo */}
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Universidades: Grupos CNPq & Extensão Comunitária
              </h2>
              <p className="text-xs text-muted">
                {fmt(grupos.length)} grupos de pesquisa e {fmt(projetos.length)} projetos de extensão em {instituicoes.length} instituições
              </p>
            </div>
          </div>

          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted border border-border">
            Auditado em {dataFormatada}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-4xl">
          Diretório público para localizar grupos de estudo cadastrados no Diretório dos Grupos
          de Pesquisa do CNPq (DGP) e projetos de extensão com impacto social direto. Os contatos
          institucionais de coordenadores e líderes permitem interlocução direta da sociedade com a academia.
        </p>

        {/* Atalhos para Fichas Individuais de Universidades */}
        <div className="mt-6 pt-4 border-t border-border">
          <span className="text-xs font-bold text-foreground block mb-2">
            Instituições com fichas e páginas dedicadas:
          </span>
          <div className="flex flex-wrap gap-2">
            {instituicoes.map((inst) => (
              <Link
                key={inst.sigla}
                href={`/universidades/${inst.sigla.toLowerCase()}`}
                className="px-2.5 py-1 rounded-lg border border-border bg-surface-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>{inst.sigla}</span>
                <span className="text-xs text-muted">({inst.uf})</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Chamada Cívica: Concursos Docentes e Pesquisa */}
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-surface-2 border border-border">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Briefcase className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-foreground block">
                Carreira Acadêmica: Concursos Docentes e Pesquisadores
              </span>
              <p className="text-xs text-muted">
                Consulte certames abertos para professores de universidades federais, estaduais e institutos de pesquisa.
              </p>
            </div>
          </div>
          <Link
            href="/concursos"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
          >
            <span>Ver Concursos Abertos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Contatos Institucionais */}
      <ContatosInstituicoes instituicoes={instituicoes} />

      {/* Painel Interativo Completo das Universidades */}
      <PainelUniversidades
        instituicoes={instituicoes}
        unidades={unidades}
        grupos={grupos}
        projetos={projetos}
        verificadoEm={verificadoEm}
      />
    </div>
  );
}
