'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, CheckCircle2, Pause, Play } from 'lucide-react';
import BotaoBrilho from '@/app/components/react-bits/BotaoBrilho';

/**
 * Um chip de "base monitorada" do cartão de eixo — e o destino dele.
 *
 * Cada rótulo é a MENÇÃO de uma página real do portal (licenciamento,
 * barragens, orçamento...). Antes viravam `<span>` morto: o leitor lia
 * "942 Barragens SIGBM" sem conseguir abrir a base. Agora cada chip é um
 * botão que leva direto à página que sustenta o número (pedido do dono,
 * 04/10/2026). Só entra aqui rota que EXISTE — link para rota inexistente
 * é 404 no ar, como aconteceu com `/ambiental/contratos`.
 */
export interface DestaqueEixo {
  /** Texto do chip, exatamente como aparece no cartão. */
  rotulo: string;
  /** Rota interna já verificada (precisa ter `page.tsx`). */
  href: string;
}

export interface EixoAsset {
  src: string;
  alt: string;
  title: string;
  badge: string;
  href: string;
  corVar: string;
  corBg: string;
  legenda: string;
  destaques: DestaqueEixo[];
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
    destaques: [
      { rotulo: 'SUS & CNES', href: '/direitos-em-movimento/saude-publica' },
      { rotulo: 'IDEB & Escolas', href: '/direitos-em-movimento/educacao' },
      { rotulo: 'CAGED & Emprego', href: '/direitos-em-movimento/trabalho-e-renda' },
      { rotulo: 'Canais de Denúncia', href: '/direitos-em-movimento/denuncia' },
      { rotulo: 'Moradia & Direitos', href: '/direitos-em-movimento/ajuda' },
    ],
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
    destaques: [
      { rotulo: '203 Cidades Estratégicas', href: '/terra-e-territorios/cidades' },
      { rotulo: 'Licenças Ambientais (11 Estados)', href: '/ambiental/licenciamento' },
      { rotulo: '942 Barragens SIGBM', href: '/ambiental/barragens' },
      { rotulo: 'CAR & Terras Indígenas', href: '/ambiental/car' },
      { rotulo: 'Rios & Bacias', href: '/ambiental/nossos?colecao=rios' },
    ],
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
    destaques: [
      { rotulo: 'Contratos PNCP', href: '/indicadores' },
      { rotulo: 'Orçamento das Capitais', href: '/estado-e-economia/orcamento' },
      { rotulo: 'Tribunais Superiores', href: '/judiciario/instituicoes' },
      { rotulo: 'Congresso Nacional', href: '/congresso' },
      { rotulo: 'Empresas & Concessões', href: '/empresas' },
    ],
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
  // Eixo 1 abre no centro (dono, 01/11/2026): a ordem canônica é
  // 1 = Direitos em Movimento, 2 = Terra e Territórios. Antes a tela abria
  // no eixo 2 e parecia que o 1 era o Terra.
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  // Pausa pedida pelo leitor, no botão à direita — independente do hover.
  const [pausado, setPausado] = useState(false);
  // Cada clique em seta/marcador reinicia a contagem de 6 s. Sem isto, quem
  // aperta "próximo" com 0,2 s para o relógio zerar via o card trocar de novo
  // em seguida e o gesto parecia não ter funcionado (dono, 01/11/2026).
  const [reinicio, setReinicio] = useState(0);

  const toNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % eixos.length);
  }, [eixos.length]);

  const toPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + eixos.length) % eixos.length);
  }, [eixos.length]);

  const toSlide = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  /** Clique em seta ou marcador: navega, solta a pausa do hover e zera o
   *  relógio de 6 s. Era o pedido do dono (01/11/2026): "pausa até clicar no
   *  botão de seta ou sair do mouse" — sem o reset, a troca automática podia
   *  cair logo depois do clique e o gesto parecia ignorado. */
  const navegar = useCallback((acao: () => void) => {
    acao();
    setIsHovered(false);
    setReinicio((r) => r + 1);
  }, []);

  // Rotação automática a cada 6 s. Para em dois casos: o pointer está em cima
  // do carrossel (cards, setas ou marcadores) ou o leitor apertou o botão de
  // pausa. Caiu o mouse e o botão está no "tocar", a contagem volta do zero.
  useEffect(() => {
    if (isHovered || pausado) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % eixos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isHovered, pausado, reinicio, eixos.length]);

  const activeEixo = eixos[activeIndex] || eixos[0];

  return (
    <section
      aria-label="Apresentação dos três eixos temáticos do portal"
      className={`my-6 sm:my-8 rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-xs overflow-hidden ${className}`}
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
        className="w-full flex flex-col items-center justify-center relative select-none py-2"
      >
        {/* Contêiner de altura fixa para o palco 3D */}
        <div className="relative w-full max-w-2xl h-[340px] sm:h-[370px] flex items-center justify-center overflow-visible">
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
              scaleVal = 1.08;
              zIndexVal = 30;
              opacityVal = 1;
            } else if (isRight) {
              xOffset = 240;
              rotateVal = 5;
              scaleVal = 0.82;
              zIndexVal = 10;
              opacityVal = 0.7;
            } else if (isLeft) {
              xOffset = -240;
              rotateVal = -5;
              scaleVal = 0.82;
              zIndexVal = 10;
              opacityVal = 0.7;
            }

            // Conteúdo do card, o mesmo para o centro (link) e as laterais.
            const conteudoCartao = (
              <>
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
                  className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[12px] font-extrabold text-white shadow-md"
                  style={{ backgroundColor: item.corVar }}
                >
                  {item.title.split('.')[0]}.
                </span>
              </>
            );

            return (
              <motion.div
                key={item.href}
                className="absolute flex flex-col items-center gap-2 will-change-transform cursor-pointer"
                style={{ width: '280px', transformOrigin: 'center center' }}
                initial={false}
                animate={{
                  x: xOffset,
                  y: 0,
                  scale: scaleVal,
                  rotate: rotateVal,
                  zIndex: zIndexVal,
                  opacity: opacityVal,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 24,
                  mass: 0.8,
                }}
                onClick={() => toSlide(i)}
              >
                {/* Card com a arte gráfica e nome sobreposto.
                    O card do CENTRO é um LINK para o eixo: o dono reclamou
                    (06/10/2026) que clicar na imagem não levava a página
                    nenhuma — o card só chamava `toSlide`. Os cards das
                    laterais seguem como botão: clicar neles traz o eixo para
                    o centro, que é o gesto esperado de carrossel. */}
                {isCenter ? (
                  <Link
                    href={item.href}
                    title={`Abrir ${item.title}`}
                    className="relative block rounded-2xl p-1.5 transition-all duration-300 ring-4 ring-primary shadow-2xl ring-offset-2 ring-offset-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {conteudoCartao}
                  </Link>
                ) : (
                  <div className="relative rounded-2xl p-1.5 transition-all duration-300 hover:opacity-90 hover:scale-105">
                    {conteudoCartao}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Controles: ver `ControlesCarrossel` no fim do arquivo (a régua do
            dono de 01/11/2026 está documentada lá). */}
        <ControlesCarrossel
          eixos={eixos}
          ativo={activeIndex}
          pausado={pausado}
          aoAnterior={() => navegar(toPrev)}
          aoProximo={() => navegar(toNext)}
          aoMarcador={(i) => navegar(() => toSlide(i))}
          aoAlternarPausa={() => setPausado((v) => !v)}
        />
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
                <BotaoBrilho key={item.href} raio={8} forca={0.16} afastamento={28}>
                  <Link
                    href={item.href}
                    title={`Abrir ${item.rotulo}`}
                    className="group inline-flex items-center gap-1 rounded-lg bg-surface px-2.5 py-1 text-xs font-semibold text-foreground border border-border shadow-2xs transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0 transition-transform group-hover:scale-110" />
                    <span className="group-hover:underline">{item.rotulo}</span>
                  </Link>
                </BotaoBrilho>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

interface ControlesCarrosselProps {
  eixos: EixoAsset[];
  ativo: number;
  pausado: boolean;
  aoAnterior: () => void;
  aoProximo: () => void;
  aoMarcador: (indice: number) => void;
  aoAlternarPausa: () => void;
}

/**
 * Pílula de controles do carrossel — régua do dono (01/11/2026):
 * - fica no eixo do cartão do centro (o palco é centrado na seção);
 * - os três marcadores ocupam esquerda/centro/direita, com vão largo entre
 *   eles (gap-5 no celular, gap-9 daí para cima) e assento de largura fixa
 *   (`h-6 w-6`): trocar de eixo não move os vizinhos;
 * - a pausa é pequena e fica colada à direita da pílula, fora do fluxo
 *   (`absolute left-full`), então não empurra a pílula do centro nem
 *   estoura a linha quando o texto está no A+ máximo.
 * Cada botão para o próprio `click` para o cartão de trás não receber o
 * toque (o palco escuta clique nos cartões para trazê-los ao centro).
 */
function ControlesCarrossel({
  eixos,
  ativo,
  pausado,
  aoAnterior,
  aoProximo,
  aoMarcador,
  aoAlternarPausa,
}: ControlesCarrosselProps) {
  const botaoSeta =
    'flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground transition-colors hover:bg-surface';
  return (
    <div className="mt-3 flex w-full items-center justify-center">
      <div className="relative flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-1.5 py-1 shadow-xs">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            aoAnterior();
          }}
          aria-label="Eixo anterior"
          title="Ver eixo anterior"
          className={botaoSeta}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center justify-between gap-5 px-1.5 sm:gap-9">
          {eixos.map((item, i) => {
            const atual = ativo === i;
            return (
              <button
                key={item.href}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  aoMarcador(i);
                }}
                aria-label={`Selecionar ${item.title}`}
                aria-current={atual ? 'true' : undefined}
                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0"
              >
                <span
                  className={`block h-2 rounded-full transition-all duration-300 ${
                    atual ? 'w-6' : 'w-2 bg-muted hover:bg-foreground/50'
                  }`}
                  style={atual ? { backgroundColor: item.corVar } : undefined}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            aoProximo();
          }}
          aria-label="Próximo eixo"
          title="Ver próximo eixo"
          className={botaoSeta}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={aoAlternarPausa}
          aria-pressed={pausado}
          aria-label={pausado ? 'Retomar a troca automática de eixo' : 'Pausar a troca automática de eixo'}
          title={pausado ? 'Retomar a troca automática' : 'Pausar a troca automática'}
          className="absolute left-full top-1/2 ml-2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-surface-2 text-text-soft shadow-xs transition-colors hover:border-primary hover:text-primary"
        >
          {pausado ? (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export default CardCarousel;
