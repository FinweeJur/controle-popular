'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export interface EixoAsset {
  src: string;
  alt: string;
  title: string;
  badge: string;
  href: string;
  corVar: string;
  corBg: string;
  legenda: string;
  destaques: string[];
}

export const DEFAULT_EIXOS: EixoAsset[] = [
  {
    src: '/capas/cities-poco-dantas.webp',
    alt: 'Desenho artístico do Eixo 1 — Poço Dantas, cidades e cidadania',
    title: '1. Direitos em Movimento',
    badge: 'Eixo 1 · Cidadania & Serviços Essenciais',
    href: '/direitos-em-movimento',
    corVar: 'var(--cp-eixo-direitos, #c0392b)',
    corBg: 'rgba(192, 57, 43, 0.1)',
    legenda:
      'Reúne dados de saúde pública (capacidade SUS e estabelecimentos CNES), educação básica (censo escolar e IDEB), emprego formal (admissões CAGED e estoque RAIS), déficit habitacional, segurança alimentar e canais populares de denúncia e assistência jurídica.',
    destaques: ['SUS & CNES', 'IDEB & Escolas', 'CAGED & Emprego', 'Canais de Denúncia', 'Moradia & Direitos'],
  },
  {
    src: '/capas/terras-arara.webp',
    alt: 'Desenho artístico do Eixo 2 — Arara vermelha e soberania territorial',
    title: '2. Terra e Territórios',
    badge: 'Eixo 2 · Soberania Socioambiental & Território',
    href: '/terra-e-territorios',
    corVar: 'var(--cp-eixo-terra, #1b6348)',
    corBg: 'rgba(27, 99, 72, 0.1)',
    legenda:
      'Reúne dados de 203 cidades estratégicas no radar, licenciamento ambiental do ONSA em 11 estados, 942 barragens de mineração (SIGBM), Cadastro Ambiental Rural (CAR), demarcação de terras indígenas e quilombolas, poligonais minerárias e bacias hidrográficas.',
    destaques: ['203 Cidades Estratégicas', 'Licenças ONSA (11 Estados)', '942 Barragens SIGBM', 'CAR & Terras Indígenas', 'Rios & Bacias'],
  },
  {
    src: '/capas/ambiente-rios.webp',
    alt: 'Desenho artístico do Eixo 3 — Rios, águas e instituições',
    title: '3. Estado e Economia',
    badge: 'Eixo 3 · Transparência Pública & Poder Econômico',
    href: '/estado-e-economia',
    corVar: 'var(--cp-eixo-estado, #1e3a8a)',
    corBg: 'rgba(30, 58, 138, 0.1)',
    legenda:
      'Reúne dados de contratos e compras públicas (PNCP), execução do orçamento das capitais, composição e aposentadoria de magistrados nos tribunais superiores (STF, STJ, TST, TSE, STM), tramitações no Congresso Nacional e fiscalização de concessões e grandes grupos econômicos.',
    destaques: ['Contratos PNCP', 'Orçamento das Capitais', 'Tribunais Superiores', 'Congresso Nacional', 'Empresas & Concessões'],
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
  const [activeIndex, setActiveIndex] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Rotação suave automática a cada 6 segundos quando não houver hover do usuário
  useEffect(() => {
    if (isHovered) return;
    autoPlayTimer.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % eixos.length);
    }, 6000);
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isHovered, eixos.length]);

  const toPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? eixos.length - 1 : prev - 1));
  };

  const toNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % eixos.length);
  };

  const toSlide = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveIndex(index);
  };

  const slideWidth = 200;
  const activeEixo = eixos[activeIndex] || eixos[0];

  return (
    <section
      aria-label="Apresentação dos três eixos temáticos do portal"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`my-8 sm:my-10 rounded-2xl border border-border bg-surface p-4 sm:p-7 shadow-xs overflow-hidden ${className}`}
    >
      {/* Cabeçalho da seção com seletor de abas */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Navegação Temática</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-0.5">
            Conheça os 3 Eixos do Portal
          </h2>
        </div>

        {/* Botões rápidos de seleção direta de cada Eixo */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-border">
          {eixos.map((item, idx) => (
            <button
              key={item.href}
              type="button"
              onClick={() => toSlide(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border-0 cursor-pointer ${
                activeIndex === idx
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'bg-transparent text-muted hover:text-foreground'
              }`}
              style={
                activeIndex === idx
                  ? { borderLeft: `3px solid ${item.corVar}` }
                  : undefined
              }
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>

      {/* Carrossel com física 3D Spring viva */}
      <div className="w-full flex flex-col items-center justify-center relative select-none py-3">
        <div
          className="relative h-[230px] flex items-center justify-start overflow-visible"
          style={{ width: `${slideWidth}px` }}
        >
          <motion.div
            className="flex w-fit items-center"
            animate={{ x: -activeIndex * slideWidth }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.7 }}
          >
            {eixos.map((item, i) => {
              const isActive = activeIndex === i;
              const diff = i - activeIndex;

              const targetRotate = isHovered ? diff * 18 : diff * 8;
              const targetScale = isActive ? 1.08 : isHovered ? 0.72 : 0.84;
              const targetY = isHovered ? diff * 20 : 0;

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
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.7 }}
                >
                  {/* Título do card com contraste adaptativo */}
                  <div
                    className={`text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? 'opacity-100 scale-100'
                        : 'opacity-60 scale-90 text-muted'
                    }`}
                    style={
                      isActive
                        ? {
                            color: 'var(--cp-primary)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          }
                        : undefined
                    }
                  >
                    {item.title}
                  </div>

                  {/* Card com a arte gráfica */}
                  <div
                    onClick={() => toSlide(i)}
                    className={`relative cursor-pointer rounded-2xl p-1.5 transition-all duration-300 ${
                      isActive
                        ? 'ring-3 ring-primary shadow-2xl ring-offset-2 ring-offset-surface'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img
                      src={item.src}
                      alt={item.alt}
                      referrerPolicy="no-referrer"
                      className="w-[140px] h-[140px] sm:w-[155px] sm:h-[155px] object-cover rounded-xl shadow-lg border border-border"
                    />
                    <span
                      className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white shadow-md"
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

        {/* Controles de navegação com setas e dots */}
        <div className="mt-4 px-3 py-1 flex items-center gap-2.5 justify-center rounded-full bg-surface-2 border border-border shadow-xs z-20">
          <button
            type="button"
            onClick={toPrev}
            aria-label="Eixo anterior"
            className="p-1 cursor-pointer hover:bg-surface rounded-full transition-colors border-0 bg-transparent text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex justify-center items-center gap-1.5 px-1">
            {eixos.map((item, i) => (
              <button
                key={item.href}
                type="button"
                onClick={() => toSlide(i)}
                aria-label={`Selecionar ${item.title}`}
                className={`rounded-full cursor-pointer h-2 transition-all duration-300 border-0 p-0 ${
                  activeIndex === i
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted hover:bg-foreground/50'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={toNext}
            aria-label="Próximo eixo"
            className="p-1 cursor-pointer hover:bg-surface rounded-full transition-colors border-0 bg-transparent text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Painel de Resumo do Eixo Ativo — Destaque completo com dados reunidos */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeEixo.href}
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-5 rounded-2xl border border-border bg-surface-2/80 p-5 sm:p-6 shadow-sm"
          style={{ borderLeft: `5px solid ${activeEixo.corVar}` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
                style={{ backgroundColor: activeEixo.corVar }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {activeEixo.badge}
              </span>
            </div>
            <a
              href={activeEixo.href}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-transform hover:scale-105"
            >
              <span>Acessar {activeEixo.title.split('.')[1]}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
            <a
              href={activeEixo.href}
              className="hover:underline"
              style={{ color: 'var(--cp-primary)' }}
            >
              {activeEixo.title}
            </a>
          </h3>

          <p className="text-sm text-foreground/90 sm:text-base leading-relaxed mb-4">
            {activeEixo.legenda}
          </p>

          <div className="pt-3 border-t border-border/60">
            <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
              Principais bases & dados monitorados:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {activeEixo.destaques.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-foreground border border-border shadow-2xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export default CardCarousel;
