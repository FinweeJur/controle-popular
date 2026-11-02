"use client";

/**
 * @file apps/web/app/indicadores/componentes/AbaInternacional.tsx
 * @description Comparador Internacional de Direitos Fundamentais e Indicadores Sociais.
 *
 * Fontes oficiais:
 *   - PNUD / Human Development Report
 *   - Banco Mundial (World Development Indicators)
 *   - Eurostat e órgãos estatísticos nacionais
 *
 * Regras:
 *   - Regra 5.14: responsividade mobile (390 px) sem quebra lateral.
 *   - Regra 5.16: fonte mínima de 12 px (text-xs).
 */

import React, { useState } from "react";
import { Globe2, ExternalLink, ShieldCheck, TrendingUp } from "lucide-react";
import {
  PAISES_INTERNACIONAIS,
  PaisIndicadorInternacional,
} from "@/lib/indicadores/dados-nacionais";

export default function AbaInternacional() {
  const [paisSelecionado, setPaisSelecionado] = useState<string>("BRA");

  const brasil = PAISES_INTERNACIONAIS.find((p) => p.codigoIso3 === "BRA")!;
  const selecionado =
    PAISES_INTERNACIONAIS.find((p) => p.codigoIso3 === paisSelecionado) || brasil;

  return (
    <div className="space-y-6">
      {/* Apresentação do Módulo Internacional */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Comparador Internacional de Direitos e Seguridade Social
              </h2>
            </div>
            <p className="text-xs text-text-soft mt-1 max-w-2xl">
              Compare os indicadores fundamentais do Brasil com países da OCDE e da América Latina,
              avaliando investimentos relativos em saúde pública, educação básica e equidade de renda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {PAISES_INTERNACIONAIS.map((p) => (
              <button
                key={p.codigoIso3}
                type="button"
                onClick={() => setPaisSelecionado(p.codigoIso3)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  paisSelecionado === p.codigoIso3
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-surface border-border text-text hover:border-primary/50"
                }`}
              >
                <span>{p.bandeira}</span>
                <span>{p.codigoIso3}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Destaque Comparativo Brasil vs País Selecionado */}
      {selecionado.codigoIso3 !== "BRA" && (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <span>{brasil.bandeira} {brasil.pais}</span>
              <span className="text-text-soft text-xs font-normal">versus</span>
              <span>{selecionado.bandeira} {selecionado.pais}</span>
            </h3>
            <span className="text-xs text-text-soft">
              Ano de referência: {selecionado.anoReferencia}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <CardMetricaDupla
              rotulo="IDH Geral"
              valBrasil={brasil.idh.toFixed(3)}
              valOutro={selecionado.idh.toFixed(3)}
              outroNome={selecionado.pais}
              unidade=""
            />
            <CardMetricaDupla
              rotulo="Gasto em Saúde (% PIB)"
              valBrasil={`${brasil.gastoSaudePib.toFixed(1)}%`}
              valOutro={`${selecionado.gastoSaudePib.toFixed(1)}%`}
              outroNome={selecionado.pais}
              unidade=""
            />
            <CardMetricaDupla
              rotulo="Gasto em Educação (% PIB)"
              valBrasil={`${brasil.gastoEducacaoPib.toFixed(1)}%`}
              valOutro={`${selecionado.gastoEducacaoPib.toFixed(1)}%`}
              outroNome={selecionado.pais}
              unidade=""
            />
            <CardMetricaDupla
              rotulo="Expectativa de Vida"
              valBrasil={`${brasil.expectativaVida.toFixed(1)} anos`}
              valOutro={`${selecionado.expectativaVida.toFixed(1)} anos`}
              outroNome={selecionado.pais}
              unidade=""
            />
          </div>

          <div className="mt-4 p-3 rounded-xl bg-surface-2 text-xs text-text-soft border border-border flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Contexto Institucional ({selecionado.pais}):</span>{" "}
              {selecionado.resumoContexto}{" "}
              <a
                href={selecionado.urlOficial}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                Fonte ({selecionado.fonteOficial})
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tabela Geral de Todos os Países Catalogados */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs">
        <h3 className="text-sm sm:text-base font-bold text-foreground mb-4">
          Quadro Geral de Indicadores Internacionais
        </h3>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs text-left min-w-[640px]">
            <thead className="bg-surface-2 text-text-soft uppercase tracking-wider border-b border-border">
              <tr>
                <th className="p-3 font-bold text-foreground">País</th>
                <th className="p-3 text-right">IDH</th>
                <th className="p-3 text-right">Gini</th>
                <th className="p-3 text-right">Gasto Saúde (% PIB)</th>
                <th className="p-3 text-right">Gasto Ed. (% PIB)</th>
                <th className="p-3 text-right">Expectativa Vida</th>
                <th className="p-3 font-semibold">Fonte Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PAISES_INTERNACIONAIS.map((p) => {
                const isBrasil = p.codigoIso3 === "BRA";
                return (
                  <tr
                    key={p.codigoIso3}
                    className={`hover:bg-surface-2/50 transition-colors ${
                      isBrasil ? "bg-amber-500/5 font-semibold" : ""
                    }`}
                  >
                    <td className="p-3 flex items-center gap-2 text-foreground font-medium">
                      <span className="text-base">{p.bandeira}</span>
                      <span>{p.pais}</span>
                      {isBrasil && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 text-[12px] font-bold">
                          Brasil
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-foreground">
                      {p.idh.toFixed(3)}
                    </td>
                    <td className="p-3 text-right font-mono text-text-soft">
                      {p.gini.toFixed(1)}
                    </td>
                    <td className="p-3 text-right font-mono text-foreground">
                      {p.gastoSaudePib.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-mono text-foreground">
                      {p.gastoEducacaoPib.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-mono text-foreground">
                      {p.expectativaVida.toFixed(1)} anos
                    </td>
                    <td className="p-3 text-text-soft text-[12px]">
                      <a
                        href={p.urlOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {p.fonteOficial}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CardMetricaDupla({
  rotulo,
  valBrasil,
  valOutro,
  outroNome,
}: {
  rotulo: string;
  valBrasil: string;
  valOutro: string;
  outroNome: string;
  unidade: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3 sm:p-4">
      <div className="text-[12px] uppercase tracking-wider text-text-soft font-semibold mb-2">
        {rotulo}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-amber-600 font-bold">🇧🇷 Brasil:</span>
          <span className="font-mono font-bold text-foreground">{valBrasil}</span>
        </div>
        <div className="flex items-center justify-between text-xs border-t border-border/50 pt-1.5">
          <span className="text-foreground font-semibold truncate max-w-[90px]">
            {outroNome}:
          </span>
          <span className="font-mono font-bold text-primary">{valOutro}</span>
        </div>
      </div>
    </div>
  );
}
