'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export interface EixoAsset {
  src: string;
  alt: string;
  title: string;
  badge: string;
  href: string;
  corVar: string;
  legenda: string;
  destaques: string[];
}

export const DEFAULT_EIXOS: EixoAsset[] = [
  {
    src: '/capas/cities-poco-dantas.webp',
    alt: 'Desenho artístico do Eixo 1 — Poço Dantas, cidades e cidadania',
    title: '1. Direitos em Movimento',
    badge: 'Cidadania & Serviços Essenciais',
    href: '/direitos-em-movimento',
    corVar: 'var(--cp-eixo-direitos, #c0392b)',
    legenda:
      'Reúne dados de saúde pública (capacidade SUS e estabelecimentos CNES), educação básica (censo escolar e IDEB), emprego formal (admissões CAGED e estoque RAIS), déficit habitacional, segurança alimentar e canais populares de denúncia e assistência jurídica.',
    destaques: ['SUS & CNES', 'IDEB & Escolas', 'CAGED & Emprego', 'Canais de Denúncia'],
  },
  {
    src: '/capas/terras-arara.webp',
    alt: 'Desenho artístico do Eixo 2 — Arara vermelha e soberania territorial',
    title: '2. Terra e Territórios',
    badge: 'Soberania Socioambiental & Território',
    href: '/terra-e-territorios',
    corVar: 'var(--cp-eixo-terra, #1b6348)',
    legenda:
      'Reúne dados de 203 cidades estratégicas no radar, licenciamento ambiental do ONSA em 11 estados, 942 barragens de mineração (SIGBM), Cadastro Ambiental Rural (CAR), demarcação de terras indígenas e quilombolas, poligonais minerárias e bacias hidrográficas.',
    destaques: ['203 Cidades', 'Licenças ONSA (11 Estados)', '942 Barragens SIGBM', 'Terras Indígenas'],
  },
  {
    src: '/capas/ambiente-rios.webp',
    alt: 'Desenho artístico do Eixo 3 — Rios, águas e instituições',
    title: '3. Estado e Economia',
    badge: 'Transparência Pública & Poder Econômico',
    href: '/estado-e-economia',
    corVar: 'var(--cp-eixo-estado, #1e3a8a)',
    legenda:
      'Reúne dados de contratos e compras públicas (PNCP), execução do orçamento das capitais, composição e aposentadoria de magistrados nos tribunais superiores (STF, STJ, TST, TSE, STM), tramitações no Congresso Nacional e fiscalização de concessões e grandes grupos econômicos.',
    destaques: ['Contratos PNCP', 'Orçamento das Capitais', 'Tribunais Superiores', 'Congresso Nacional'],
  },
];

interface CardCarouselProps {
  className?: string;
  eixos?: EixoAsset[];
}

export function CardCarousel({
  className = '',
  eixos = DEFAULT_EIXOS,
}: CardCarouselProps) {
  // Inicia no item do centro (índice 1: Terra e Territórios)
  const [activeIndex, setActiveIndex] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  const toPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const toNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => Math.min(eixos.length - 1, prev + 1));
  };

  const toSlide = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setActiveIndex(index);
  };

  const slideWidth = 190;
  const activeEixo = eixos[activeIndex] || eixos[0];

  return (
    <section
      aria-label="Navegação pelos três eixos temáticos"
      className={`my-8 sm:my-10 rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs overflow-hidden ${className}`}
    >
      {/* Cabeçalho da seção */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">
            Panorama do Portal
          </span>
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
            Conheça os 3 Eixos Temáticos
          </h2>
        </div>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-muted border border-border">
          3 Eixos • 18 Subfrentes
        </span>
      </div>

      {/* Carrossel com física 3D Spring */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full flex flex-col items-center justify-center relative overflow-hidden select-none py-2"
      >
        <div
          className="relative h-[220px] flex items-center justify-start overflow-visible"
          style={{ width: `${slideWidth}px` }}
        >
          <motion.div
            className="flex w-fit items-center"
            animate={{ x: -activeIndex * slideWidth }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.8 }}
          >
            {eixos.map((item, i) => {
              const isActive = activeIndex === i;
              const diff = i - activeIndex;

              const targetRotate = isHovered ? diff * 20 : diff * 6;
              const targetScale = isActive ? 1.06 : isHovered ? 0.7 : 0.82;
              const targetY = isHovered ? diff * 22 : 0;

              return (
                <motion.div
                  key={item.href}
                  className="shrink-0 flex flex-col items-center gap-2 will-change-[transform,scale]"
                  style={{ width: `${slideWidth}px` }}
                  animate={{
                    rotate: targetRotate,
                    scale: targetScale,
                    y: targetY,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
                >
                  {/* Título com contraste alto adaptativo */}
                  <div
                    className={`text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? 'opacity-100 scale-100'
                        : 'opacity-50 scale-90 text-muted'
                    }`}
                    style={
                      isActive
                        ? {
                            color: 'var(--cp-primary)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                          }
                        : undefined
                    }
                  >
                    {item.title}
                  </div>

                  {/* Card com desenho artístico grande */}
                  <div
                    onClick={(e) => toSlide(e, i)}
                    className={`relative cursor-pointer rounded-2xl p-1 transition-all duration-300 ${
                      isActive
                        ? 'ring-2 ring-primary shadow-xl ring-offset-2 ring-offset-surface'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      referrerPolicy="no-referrer"
                      className="w-[130px] h-[130px] sm:w-[140px] sm:h-[140px] object-cover rounded-xl shadow-md border border-border"
                    />
                    <span
                      className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: item.corVar }}
                    >
                      {item.title.split('.')[0]}.
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Controles de navegação */}
        <div className="mt-3 px-2 py-1 flex items-center gap-2 justify-center rounded-full bg-surface-2 border border-border shadow-xs z-20">
          <button
            type="button"
            onClick={toPrev}
            aria-label="Eixo anterior"
            disabled={activeIndex === 0}
            className="p-1 cursor-pointer hover:bg-surface rounded-full transition-colors border-0 bg-transparent text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex justify-center items-center gap-1.5 px-1">
            {eixos.map((item, i) => (
              <button
                key={item.href}
                type="button"
                onClick={(e) => toSlide(e, i)}
                aria-label={`Ir para ${item.title}`}
                className={`rounded-full cursor-pointer h-1.5 transition-all duration-300 border-0 p-0 ${
                  activeIndex === i
                    ? 'w-5 bg-primary'
                    : 'w-2 bg-muted hover:bg-foreground/50'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={toNext}
            aria-label="Próximo eixo"
            disabled={activeIndex === eixos.length - 1}
            className="p-1 cursor-pointer hover:bg-surface rounded-full transition-colors border-0 bg-transparent text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Painel do Eixo Selecionado — Título e breve legenda com resumo dos dados */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEixo.href}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-4 rounded-xl border border-border bg-surface-2/60 p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: activeEixo.corVar }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {activeEixo.badge}
              </span>
            </div>
            <a
              href={activeEixo.href}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline group"
            >
              Explorar Eixo
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-1.5">
            <a
              href={activeEixo.href}
              className="hover:text-primary transition-colors"
              style={{ color: 'var(--cp-primary)' }}
            >
              {activeEixo.title}
            </a>
          </h3>

          <p className="text-sm text-text-soft leading-relaxed mb-3">
            {activeEixo.legenda}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-muted mr-1">Dados reunidos:</span>
            {activeEixo.destaques.map((item) => (
              <span
                key={item}
                className="rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-foreground border border-border shadow-2xs"
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export default CardCarousel;
