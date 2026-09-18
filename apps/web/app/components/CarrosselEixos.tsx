'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    destaques: ['203 Cidades Estratégicas', 'Licenças Ambientais (11 Estados)', '942 Barragens SIGBM', 'CAR & Terras Indígenas', 'Rios & Bacias'],
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
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % eixos.length);
  }, [eixos.length]);

  const toPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + eixos.length) % eixos.length);
  }, [eixos.length]);

  const toSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Rotação suave automática a cada 6 segundos.
  // Só pausa se o usuário estiver com o mouse diretamente sobre os cartões do palco.
  useEffect(() => {
    if (isHovered) return;

    autoPlayTimerRef.current = setInterval(() => {
      toNext();
    }, 6000);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [isHovered, toNext]);

  const activeEixo = eixos[activeIndex] || eixos[0];

  return (
    <section
      aria-label="Apresentação dos três eixos temáticos do portal"
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
                  ? 'bg-surface text-foreground shadow-xs font-bold'
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

      {/* Palco do Carrossel 3D com posicionamento circular dinâmico */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full flex flex-col items-center justify-center relative select-none py-4"
      >
        {/* Contêiner de altura fixa para o palco 3D */}
        <div className="relative w-full max-w-2xl h-[380px] flex items-center justify-center overflow-visible">
          {eixos.map((item, i) => {
            // Posição relativa em anel: 0 = centro, 1 = direita, 2 = esquerda
            const diff = (i - activeIndex + eixos.length) % eixos.length;
            const isCenter = diff === 0;
            const isRight = diff === 1;
            const isLeft = diff === 2;

            // Coordenadas calculadas para transição suave contínua
            let xOffset = 0;
            let rotateVal = 0;
            let scaleVal = 0.82;
            let zIndexVal = 10;
            let opacityVal = 0.65;

            if (isCenter) {
              xOffset = 0;
              rotateVal = 0;
              scaleVal = 1.1;
              zIndexVal = 30;
              opacityVal = 1;
            } else if (isRight) {
              xOffset = 300;
              rotateVal = 6;
              scaleVal = 0.82;
              zIndexVal = 10;
              opacityVal = 0.65;
            } else if (isLeft) {
              xOffset = -300;
              rotateVal = -6;
              scaleVal = 0.82;
              zIndexVal = 10;
              opacityVal = 0.65;
            }

            return (
              <motion.div
                key={item.href}
                className="absolute top-1/2 left-1/2 flex flex-col items-center gap-2 will-change-transform cursor-pointer"
                style={{ width: '320px', transformOrigin: 'center center' }}
                initial={false}
                animate={{
                  x: `calc(-50% + ${xOffset}px)`,
                  y: '-50%',
                  scale: scaleVal,
                  rotate: rotateVal,
                  zIndex: zIndexVal,
                  opacity: opacityVal,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 240,
                  damping: 24,
                }}
                onClick={() => toSlide(i)}
              >
                {/* Card com a arte gráfica e nome sobreposto */}
                <div
                  className={`relative rounded-2xl p-1.5 transition-all duration-300 ${
                    isCenter
                      ? 'ring-4 ring-primary shadow-2xl ring-offset-2 ring-offset-surface'
                      : 'hover:opacity-90 hover:scale-105'
                  }`}
                >
                  <img
                    src={item.src}
                    alt={item.alt}
                    referrerPolicy="no-referrer"
                    className="w-[280px] h-[280px] sm:w-[310px] sm:h-[310px] max-w-[calc(100vw-3rem)] max-h-[calc(100vw-3rem)] object-cover rounded-xl shadow-lg border border-border"
                  />
                  {/* Overlay escuro na base do card */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                  {/* Nome do eixo sobreposto na base do card */}
                  <span
                    className="absolute bottom-3 left-3 right-3 text-sm sm:text-base font-extrabold uppercase tracking-wide text-white text-center drop-shadow-md"
                    style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
                  >
                    {item.title.replace(/^\d+\.\s*/, '')}
                  </span>
                  {/* Badge do número no canto superior esquerdo */}
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
        </div>

        {/* Controles de navegação com botões grandes e dots clicáveis */}
        <div className="mt-4 px-4 py-1.5 flex items-center gap-3 justify-center rounded-full bg-surface-2 border border-border shadow-xs z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toPrev();
            }}
            aria-label="Eixo anterior"
            title="Ver eixo anterior"
            className="p-1.5 cursor-pointer hover:bg-surface rounded-full transition-colors border-0 bg-transparent text-foreground flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex justify-center items-center gap-2 px-1">
            {eixos.map((item, i) => (
              <button
                key={item.href}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toSlide(i);
                }}
                aria-label={`Selecionar ${item.title}`}
                className={`rounded-full cursor-pointer h-2.5 transition-all duration-300 border-0 p-0 ${
                  activeIndex === i
                    ? 'w-7 bg-primary'
                    : 'w-2.5 bg-muted hover:bg-foreground/50'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toNext();
            }}
            aria-label="Próximo eixo"
            title="Ver próximo eixo"
            className="p-1.5 cursor-pointer hover:bg-surface rounded-full transition-colors border-0 bg-transparent text-foreground flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
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
          className="mt-4 rounded-2xl border border-border bg-surface-2/80 p-5 sm:p-6 shadow-sm"
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
