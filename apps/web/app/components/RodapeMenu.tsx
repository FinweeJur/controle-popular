"use client";

import NextLink from "next/link";
import { Sparkles } from "lucide-react";
import ThemeSwitcher from "@/app/[municipio]/components/ThemeSwitcher";
import FontSizeControl from "@/app/[municipio]/components/FontSizeControl";
import CvdToggle from "@/app/components/CvdToggle";

/**
 * @file Rodape do indice expansivel (atalho ONSA e preferencias no celular).
 * Extraido do TopNav para o componente caber no limite do CodeScene.
 */
export default function RodapeMenu({ onFechar }: { onFechar: () => void }) {
  return (
    <>
              {/* Rodapé do menu com link de acesso rápido ao Eixo Central (ONSA) */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3 sm:mt-4 sm:pt-4">
                <div className="flex items-center gap-2 text-xs text-text-soft">
                  <Sparkles size={14} className="text-primary shrink-0" aria-hidden="true" />
                  <span>Observatório Nacional Socioambiental e ferramentas integradas em um só lugar.</span>
                </div>
                <NextLink
                  href="/central"
                  onClick={onFechar}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90"
                >
                  <span>Conhecer o Eixo Central (ONSA)</span>
                  <span aria-hidden="true">→</span>
                </NextLink>
              </div>

              {/* ═══ PREFERÊNCIAS NO CELULAR ═══
                  A barra esconde tema, tamanho de fonte e paleta daltônica
                  abaixo de `md` (não cabem: medido em 06/10/2026, logo +
                  "Índice" + Blog + Alertas + Ouvir já ocupam a linha de 390 px).
                  Sem isto, quem está no celular só mudava isso pelo assistente.
                  De `md` para cima a própria barra já mostra as três. */}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 md:hidden">
                <span className="text-xs font-semibold text-text-soft">Preferências:</span>
                <ThemeSwitcher />
                <FontSizeControl />
                <CvdToggle />
              </div>

    </>
  );
}
