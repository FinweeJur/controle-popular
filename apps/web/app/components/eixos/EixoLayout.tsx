import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { EixoId, SubfrenteId } from '@/lib/eixos/types';
import { CATALOGO_EIXOS } from '@/lib/eixos/catalogo';
import EixoHeaderNav from './EixoHeaderNav';
import FooterGlobal from '@/app/components/FooterGlobal';

interface Props {
  eixoId: EixoId;
  subfrenteId?: SubfrenteId;
  heroImageSrc?: string;
  heroImageAlt?: string;
  heroCaption?: string;
  children: React.ReactNode;
}

export default function EixoLayout({
  eixoId,
  subfrenteId,
  heroImageSrc,
  heroImageAlt,
  heroCaption,
  children,
}: Props) {
  const eixo = CATALOGO_EIXOS[eixoId];
  const subfrente = subfrenteId ? eixo.subfrentes.find((s) => s.id === subfrenteId) : undefined;

  const corVar = eixo.corVar;
  const corInkVar = eixo.corInkVar;

  return (
    <div
      className="min-h-screen flex flex-col bg-background text-foreground"
      style={
        {
          '--eixo-ativo-cor': `var(${corVar})`,
          '--eixo-ativo-ink': `var(${corInkVar})`,
        } as React.CSSProperties
      }
    >
      {/* NAVEGAÇÃO DOS 3 EIXOS */}
      <EixoHeaderNav eixoAtivo={eixoId} subfrenteAtiva={subfrenteId} />

      {/* CONTAINER PRINCIPAL */}
      <main className="flex-1">
        {/* HERO SECTION DO EIXO */}
        <header className="border-b border-border bg-surface-2/30 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
            {/* BREADCRUMB */}
            <nav aria-label="Caminho de navegação" className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted">
              <Link href="/" className="hover:text-foreground transition-colors">
                Início
              </Link>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-foreground" style={{ color: `var(${corVar})` }}>
                {eixo.titulo}
              </span>
              {subfrente && (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="font-medium text-foreground">{subfrente.titulo}</span>
                </>
              )}
            </nav>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              {/* TEXTO DO HERO */}
              <div className={heroImageSrc ? 'lg:col-span-7' : 'lg:col-span-12'}>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(${corVar})` }} />
                  <span>{eixo.titulo}</span>
                  {subfrente && (
                    <>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{subfrente.titulo}</span>
                    </>
                  )}
                </div>

                <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground">
                  {subfrente ? subfrente.titulo : eixo.titulo}
                </h1>

                <p className="mt-3 text-base sm:text-lg text-muted max-w-3xl leading-relaxed">
                  {subfrente ? subfrente.descricao : eixo.descricao}
                </p>

                {/* TAGS DO EIXO */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {(subfrente ? subfrente.tagsRelacionadas : ['fiscalização', 'transparência', 'dados-abertos', 'controle-social']).map((t) => (
                    <span key={t} className="rounded-md bg-surface px-2.5 py-1 text-xs text-muted border border-border/60">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* IMAGEM TEMÁTICA DO HERO (SE FORNECIDA) */}
              {heroImageSrc && (
                <div className="lg:col-span-5">
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-md group">
                    <div className="relative aspect-16/10 w-full overflow-hidden">
                      <Image
                        src={heroImageSrc}
                        alt={heroImageAlt ?? eixo.titulo}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                      />
                    </div>
                    {heroCaption && (
                      <div className="p-2.5 bg-surface/90 border-t border-border/50 text-xs text-muted italic text-center">
                        {heroCaption}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTEÚDO DA PÁGINA */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* RODAPÉ GLOBAL */}
      <FooterGlobal />
    </div>
  );
}
