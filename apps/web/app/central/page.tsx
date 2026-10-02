/**
 * apps/web/app/central/page.tsx
 *
 * Eixo Central: Inteligência Cívica, Ferramentas & ONSA.
 *
 * ═══ PAPEL NO PORTAL CÍVICO ═══
 * Este módulo constitui o quarto grande pilar da arquitetura do Controle Popular,
 * reunindo de forma unificada e acessível todas as ferramentas transversais de
 * fiscalização cidadã, repositórios de dados abertos, motores de busca e inteligência cívica.
 *
 * Ao lado dos eixos Direitos em Movimento, Terra e Territórios, e Estado e Economia,
 * o Eixo Central atua como a infraestrutura técnica e de inteligência pública (ONSA):
 * 1. Motor de Busca Global no acervo do portal;
 * 2. Laboratório de Dados para cruzamento comparativo de indicadores com o Seu Nonô;
 * 3. Radar Cívico de Editais do Diário Oficial de Minas Gerais;
 * 4. Biblioteca Digital Unificada com mais de 24.000 documentos e pareceres;
 * 5. Tecnologia e IA Livre soberana, com oficinas e ferramentas de código aberto;
 * 6. Documentação Técnica, schemas e governança da API pública do portal.
 *
 * ═══ FONTES E CONFORMIDADE INSTITUCIONAL ═══
 * - Observatório Nacional Socioambiental (ONSA / Controle Popular);
 * - Diário Oficial do Estado de Minas Gerais (DO-MG);
 * - Repositórios cívicos auditados com link canônico oficial em cada ato.
 *
 * ═══ DIRETRIZES DE PRIVACIDADE E ACESSIBILIDADE ═══
 * Em estrita conformidade com AGENTS.md § 5.2 e § 8:
 * - Nenhum CPF ou dado sensível pessoal é armazenado ou exibido;
 * - Respeito às diretrizes WCAG AA de contraste, teclado e leitor de telas.
 */

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  BarChart3,
  FileSpreadsheet,
  BookOpen,
  Newspaper,
  Cpu,
  FileText,
  Bell,
  Map,
  Building2,
  Info,
  ShieldCheck,
  Compass,
  Sparkles,
  ArrowRight,
  Database,
  Globe2,
} from "lucide-react";
import EixoLayout from "@/app/components/eixos/EixoLayout";
import { CATALOGO_EIXOS } from "@/lib/eixos/catalogo";

export const metadata: Metadata = {
  title: "Eixo Central: Inteligência Cívica & Ferramentas — ONSA | Controle Popular",
  description:
    "Hub transversal do Controle Popular: busca global no acervo, comparador de dados, radar de editais, biblioteca com 24 mil documentos, IA livre e método ONSA.",
};

const ICONES_MAP: Record<string, React.ReactNode> = {
  Search: <Search size={20} className="text-primary" />,
  BarChart3: <BarChart3 size={20} className="text-primary" />,
  FileSpreadsheet: <FileSpreadsheet size={20} className="text-primary" />,
  BookOpen: <BookOpen size={20} className="text-primary" />,
  Newspaper: <Newspaper size={20} className="text-primary" />,
  Cpu: <Cpu size={20} className="text-primary" />,
  FileText: <FileText size={20} className="text-primary" />,
  Bell: <Bell size={20} className="text-primary" />,
  Map: <Map size={20} className="text-primary" />,
  Building2: <Building2 size={20} className="text-primary" />,
  Info: <Info size={20} className="text-primary" />,
  ShieldCheck: <ShieldCheck size={20} className="text-primary" />,
};

export default function EixoCentralPage() {
  const eixo = CATALOGO_EIXOS.central;

  const indicadoresCentrais = [
    {
      rotulo: "Acervo Digital",
      valor: "24.000+",
      obs: "Documentos, perícias e decisões na Biblioteca",
    },
    {
      rotulo: "Radar de Editais",
      valor: "50+",
      obs: "Chamamentos ativos do Diário Oficial de MG",
    },
    {
      rotulo: "Territórios no Globo",
      valor: "414",
      obs: "Terras indígenas e quilombolas mapeadas",
    },
    {
      rotulo: "Tecnologia Cívica",
      valor: "100%",
      obs: "Código aberto, dados públicos e IA auditável",
    },
  ];

  return (
    <EixoLayout
      eixoId="central"
      heroImageSrc="/capas/home-page.webp"
      heroImageAlt="Eixo Central — Inteligência Cívica e Ferramentas do Controle Popular"
      heroCaption="Eixo Central: O hub técnico, metodológico e de inteligência cidadã que conecta os eixos de fiscalização do Controle Popular."
    >
      {/* ═══ 1. CARTÕES DE INDICADORES AGREGADOS ═══ */}
      <section
        aria-label="Indicadores centrais do portal"
        className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {indicadoresCentrais.map((item) => (
          <div
            key={item.rotulo}
            className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs"
          >
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">
              {item.rotulo}
            </span>
            <span className="font-display text-2xl font-bold text-foreground sm:text-3xl">
              {item.valor}
            </span>
            <span className="mt-1 block text-xs text-muted">
              {item.obs}
            </span>
          </div>
        ))}
      </section>

      {/* ═══ 2. DESTAQUE ESPECIAL: GLOBO 3D DE TERRAS ═══ */}
      <section
        aria-labelledby="globo-destaque-central-titulo"
        className="mb-12 overflow-hidden rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-surface to-surface-2 p-6 shadow-md transition-all hover:border-primary/60"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/20 px-3 py-0.5 text-xs font-bold uppercase text-primary">
                <Globe2 size={13} aria-hidden="true" />
                Destaque Tridimensional
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Imagens de Satélite & Vetores
              </span>
            </div>
            <h2
              id="globo-destaque-central-titulo"
              className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground"
            >
              Globo 3D Interativo: Território, Mineração e Meio Ambiente
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Navegue pelo mapa tridimensional do Brasil com camadas geoespaciais integradas:
              requerimentos minerários da ANM, barragens de mineração, Cadastro Ambiental Rural (CAR),
              unidades de conservação e territórios de povos tradicionais.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/funcaosocialterra/mapa"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-ink shadow-sm transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span>Abrir Mapa 3D Interativo</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 2.1 DESTAQUES PRIORITÁRIOS DO EIXO CENTRAL ═══ */}
      <section aria-label="Subfrentes prioritárias" className="mb-12 rounded-2xl border-2 border-primary/30 bg-primary/5 p-6 sm:p-8">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">✦ Portas Prioritárias</span>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">
            Subfrentes em Destaque Cívico
          </h2>
          <p className="text-sm text-muted">
            Ferramentas centrais de maior demanda para pesquisadores, movimentos sociais e cidadãos.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/editais"
            className="group flex flex-col justify-between rounded-xl border border-primary/40 bg-surface p-4 hover:border-primary hover:bg-primary/10 transition-all shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-primary">✦ Diário Oficial</span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary mt-1">
                Radar de Editais (DO-MG)
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Chamamentos públicos, editais de fomento e licitações de interesse social.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary mt-3 flex items-center justify-between">
              <span>Abrir Radar</span>
              <span>→</span>
            </span>
          </Link>

          <Link
            href="/biblioteca"
            className="group flex flex-col justify-between rounded-xl border border-primary/40 bg-surface p-4 hover:border-primary hover:bg-primary/10 transition-all shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-primary">✦ Acervo Público</span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary mt-1">
                Biblioteca Digital (24k+)
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                24 mil laudos periciais, relatórios de ATIs, TACs e estudos de impacto.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary mt-3 flex items-center justify-between">
              <span>Pesquisar Acervo</span>
              <span>→</span>
            </span>
          </Link>

          <Link
            href="/laboratorio/arvore"
            className="group flex flex-col justify-between rounded-xl border border-primary/40 bg-surface p-4 hover:border-primary hover:bg-primary/10 transition-all shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-primary">✦ Grafo Interativo</span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary mt-1">
                Árvore de Conexões (3D)
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Visualização estilo Obsidian em grafo conectando 4 eixos e 38 nós cívicos.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary mt-3 flex items-center justify-between">
              <span>Explorar Grafo</span>
              <span>→</span>
            </span>
          </Link>

          <Link
            href="/assistente"
            className="group flex flex-col justify-between rounded-xl border border-primary/40 bg-surface p-4 hover:border-primary hover:bg-primary/10 transition-all shadow-xs"
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-primary">✦ IA Cívica</span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary mt-1">
                Assistente Seu Nonô
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Perguntas e respostas com síntese de voz, contexto de fontes e frases curtas.
              </p>
            </div>
            <span className="text-xs font-semibold text-primary mt-3 flex items-center justify-between">
              <span>Falar com Seu Nonô</span>
              <span>→</span>
            </span>
          </Link>
        </div>
      </section>

      {/* ═══ 3. GRADE DE FERRAMENTAS E SUBFRENTES DO EIXO CENTRAL ═══ */}
      <section aria-labelledby="subfrentes-central-titulo" className="mb-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2
              id="subfrentes-central-titulo"
              className="font-display text-xl font-bold text-foreground sm:text-2xl"
            >
              Ferramentas & Inteligência Cívica
            </h2>
            <p className="text-sm text-muted">
              12 portas de entrada para pesquisar, comparar, auditar e fiscalizar atos e dados públicos
            </p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            12 Módulos Integrados
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eixo.subfrentes.map((sub) => {
            const href = sub.rotaLegada ?? `/central/${sub.slug}`;
            const IconeComponent = ICONES_MAP[sub.icone] ?? <Compass size={20} className="text-primary" />;

            return (
              <Link
                key={sub.id}
                href={href}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-primary/40 hover:bg-surface-2/60 hover:shadow-sm"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-surface-2">
                      {IconeComponent}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary transition-transform group-hover:translate-x-1">
                      <span>Acessar</span>
                      <span>→</span>
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-foreground transition-colors group-hover:text-primary">
                    {sub.titulo}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    {sub.descricao}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-1 border-t border-border/40 pt-3">
                  {sub.tagsRelacionadas.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ═══ 4. RESSALVAS METODOLÓGICAS E REGRA DAS SEIS QUALIDADES ═══ */}
      <section
        aria-label="Metodologia do ONSA"
        className="mb-10 rounded-2xl border border-dashed border-border bg-surface-1 p-6 text-xs leading-relaxed text-muted"
      >
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <Sparkles size={16} className="text-primary" aria-hidden="true" />
          <span>O Compromisso Metodológico do Eixo Central (Regra das Seis Qualidades)</span>
        </h3>
        <p className="mb-3">
          O Controle Popular é mantido para garantir ao cidadão informação oficial verificada,
          sem intermediários e imune a distorções partidárias ou corporativas:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-surface p-3">
            <strong className="block text-foreground mb-1">1. Link Oficial Canônico:</strong>
            Todo registro possui hiperlink direto ao órgão expedidor (TCE, TCU, DOU, Sisema ou TJ).
          </div>
          <div className="rounded-xl border border-border/60 bg-surface p-3">
            <strong className="block text-foreground mb-1">2. Buscável e Filtrável:</strong>
            Filtros multifacetados em tempo real tolerantes a acentos gráficos.
          </div>
          <div className="rounded-xl border border-border/60 bg-surface p-3">
            <strong className="block text-foreground mb-1">3. Ordenável por Coluna:</strong>
            Classificação transparente por datas, valores monetários e categorias.
          </div>
          <div className="rounded-xl border border-border/60 bg-surface p-3">
            <strong className="block text-foreground mb-1">4. Microresumo com Fonte:</strong>
            Textos diretos e curtos, sempre atestando a origem e a data da medição.
          </div>
          <div className="rounded-xl border border-border/60 bg-surface p-3">
            <strong className="block text-foreground mb-1">5. Assistente Cívico RAG:</strong>
            Seu Nonô e ferramentas com orações curtas e contexto fundamentado.
          </div>
          <div className="rounded-xl border border-border/60 bg-surface p-3">
            <strong className="block text-foreground mb-1">6. Exportação Multi-formato:</strong>
            Download em CSV com delimitador brasileiro (;) e BOM UTF-8 para Excel.
          </div>
        </div>
      </section>

      {/* ═══ USO DE IA E AGRADECIMENTOS — repetidos do /sobre, com link para lá ═══ */}
      <section className="mb-10 rounded-2xl border border-border bg-surface-1 p-6 text-sm leading-relaxed text-muted">
        <h3 className="mb-2 font-display text-lg font-bold text-foreground">
          Uso de Inteligência Artificial
        </h3>
        <p className="mb-4">
          Site em desenvolvimento, aberto para acesso, colaboração e revisão. Os dados ainda
          estão sendo conferidos e podem conter erros. O site foi feito com auxílio de
          Inteligência Artificial - IA, como modelos de linguagem como Deepseek, Mimo e Claude
          e ferramentas como OpenCode, entre outras. O portal usa IA para{" "}
          <strong className="text-foreground">ler texto</strong> — nunca para escrever número.
          A política completa está em{" "}
          <Link href="/politica-de-ia" className="font-medium text-primary hover:underline">
            Política de uso de IA
          </Link>{" "}
          e a apresentação do portal em{" "}
          <Link href="/sobre" className="font-medium text-primary hover:underline">
            Sobre o Controle Popular
          </Link>
          .
        </p>

        <h3 className="mb-2 font-display text-lg font-bold text-foreground">
          Inspirações e Referências
        </h3>
        <p>
          O nome Controle Popular vem de uma palavra de ordem do MAB — Movimento dos Atingidos
          por Barragens. A postura da frente ambiental, a página de educação (inspirada no
          Levante Popular da Juventude) e a de saúde (inspirada no Movimento Brasil Popular)
          vêm dessas organizações. E a inspiração tecnológica hacker pra criar redes mais
          justas veio da Código Não Binário. Sem essas organizações cobrando por justiça e
          direitos, esse portal não existiria. E ao Instituto Esperança Maria, pelas
          experiências em educação ambiental de direitos humanos, que agora dão luz a esse
          portal.
        </p>
      </section>
    </EixoLayout>
  );
}
