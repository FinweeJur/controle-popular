import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import SpotlightCard from '@/app/components/react-bits/SpotlightCard';
import BorderGlow from '@/app/components/react-bits/BorderGlow';
import BotaoBrilho from '@/app/components/react-bits/BotaoBrilho';
import Magnet from '@/app/components/react-bits/Magnet';
import { CATALOGO_EIXOS } from '@/lib/eixos/catalogo';
import { listarFichasPorEixo } from '@/lib/eixos/fichas';
import MeioAmbienteRelacionado from '@/app/components/MeioAmbienteRelacionado';
import { obterEstatisticasExpansao } from '@/lib/cidades/estrategicas';
import { DADOS_RIOS } from '@/lib/ambiental/nossos-rios-dados';
import AvisoReferenciaTerritorio from './AvisoReferencia';
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/terra-e-territorios", {
  title: 'Terra e Territórios - Eixo 2 | Controle Popular',
  description:
    'Soberania socioambiental, 203 cidades estratégicas, bacias hidrográficas, licenciamento ambiental, terras indígenas e defesa dos biomas.',
});

/**
 * Hub do Eixo 2 — Terra e Territórios.
 *
 * O QUE MUDOU (02/11/2026): a família tinha seis `page.tsx`, e a medição
 * mostrou que quatro têm dado próprio: o catálogo dos Vales, o observatório
 * das calhas, a defesa das serras e o perfil de cada cidade. Eles continuam
 * rota. O único recorte sem dado próprio era `/terra-e-territorios/cidades`,
 * que repetia a tabela e os totais de `/cidades` — virou ponte para a seção
 * `#catalogo-cidades` da página canônica.
 *
 * NAVEGAÇÃO: as seções têm âncora e a faixa do topo "desce" para cada uma;
 * cada seção termina com "subir". São `<a href="#id">`, então funcionam sem
 * JavaScript e não desmontam a casca (AGENTS §5.13).
 *
 * NÚMEROS: os cartões de indicadores são referência das fontes (CNUC,
 * SIGMINE/ANM, ANA/IGAM, IBGE), fixados no código — não são medição deste
 * portal. O `AvisoReferenciaTerritorio` diz isso antes do primeiro cartão. As
 * duas contagens que o portal consegue medir aqui (cidades estratégicas e
 * calhas com catálogo) saem do dado, não do texto.
 */

/**
 * Cartão de destaque dos eixos, com brilho de borda e ímã.
 *
 * Existe como componente local porque os quatro cartões das "Portas
 * Prioritárias" têm a MESMA anatomia (etiqueta, título, descrição e rodapé com
 * a ação). Repetir o invólucro quatro vezes garantiria deriva entre eles — e o
 * invólucro agora carrega dois efeitos (BorderGlow + Magnet), que precisam ser
 * idênticos para o comportamento parecer um só.
 */
function CartaoDestaque({
  href,
  etiqueta,
  titulo,
  descricao,
  acao,
}: {
  href: string;
  etiqueta: string;
  titulo: string;
  descricao: string;
  acao: string;
}) {
  return (
    <Magnet forca={0.06} afastamento={44} className="h-full">
      <BorderGlow
        className="h-full rounded-xl border border-emerald-500/40 bg-surface p-4 shadow-xs transition-all hover:border-emerald-500 hover:bg-emerald-500/10"
        corFundo="var(--cp-surface)"
        raio={12}
        intensidade={1}
      >
        <Link href={href} className="group flex h-full flex-col justify-between">
          <div>
            <span className="text-[12px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
              {etiqueta}
            </span>
            <h3 className="font-display text-base font-bold text-foreground group-hover:text-emerald-500 mt-1">
              {titulo}
            </h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">{descricao}</p>
          </div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-3 flex items-center justify-between">
            <span>{acao}</span>
            <span>→</span>
          </span>
        </Link>
      </BorderGlow>
    </Magnet>
  );
}

/** "Descer" e "subir": âncora crua, sem estado e sem JavaScript. */
function NavegacaoTerra() {
  const secoes = [
    { id: 'indicadores', rotulo: 'Indicadores' },
    { id: 'portas', rotulo: 'Portas prioritárias' },
    { id: 'subfrentes', rotulo: 'Subfrentes' },
    { id: 'paraopeba', rotulo: 'Bacia do Paraopeba' },
    { id: 'cidades', rotulo: 'Cidades estratégicas' },
    { id: 'fichas', rotulo: 'Fichas' },
    { id: 'paginas-irmas', rotulo: 'Páginas irmãs' },
  ];
  return (
    <nav
      id="navegacao"
      aria-label="Nesta página"
      className="mb-8 scroll-mt-24 rounded-2xl border border-border bg-surface-2 p-4"
    >
      <p className="text-sm font-semibold text-foreground">Nesta página</p>
      <ul className="mt-2 flex flex-wrap gap-2 text-sm">
        {secoes.map((secao) => (
          <li key={secao.id}>
            <a
              href={`#${secao.id}`}
              className="inline-block rounded-full border border-border px-3 py-1 hover:border-emerald-500"
            >
              {secao.rotulo} ↓
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Subir() {
  return (
    <p className="mt-4 text-sm">
      <a href="#navegacao" className="underline">
        ↑ Subir ao índice desta página
      </a>
    </p>
  );
}

function Indicadores({ itens }: { itens: { rotulo: string; valor: string; obs: string }[] }) {
  return (
    <section
      id="indicadores"
      aria-label="Estatísticas territoriais"
      className="mb-12 grid scroll-mt-24 grid-cols-2 gap-4 sm:grid-cols-4"
    >
      {itens.map((item) => (
        <SpotlightCard
          key={item.rotulo}
          className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs"
        >
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
            {item.rotulo}
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            {item.valor}
          </span>
          <span className="text-xs text-muted block mt-1">{item.obs}</span>
        </SpotlightCard>
      ))}
    </section>
  );
}

function PortasPrioritarias() {
  return (
    <section
      id="portas"
      aria-label="Subfrentes prioritárias"
      className="mb-12 scroll-mt-24 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8"
    >
      <div className="mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
          ✦ Portas Prioritárias
        </span>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1">
          Subfrentes em Destaque Cívico
        </h2>
        <p className="text-sm text-muted">
          Acesso rápido aos núcleos territoriais com maior volume de dados e impacto social direto.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CartaoDestaque
          href="/funcaosocialterra/mapa"
          etiqueta="✦ Cartografia 3D"
          titulo="Função Social & Globo 3D"
          descricao="Camadas de mineração, CAR, UCs e territórios tradicionais renderizados em 3D."
          acao="Abrir Globo 3D"
        />
        <CartaoDestaque
          href="/ambiental/mariana"
          etiqueta="✦ Repactuação"
          titulo="Rio Doce (Mariana)"
          descricao="Acompanhamento dos R$ 171 bi repactuados, perícias e cronogramas de obras."
          acao="Ver Repactuação"
        />
        <CartaoDestaque
          href="/paraopeba"
          etiqueta="✦ Bacia Atingida"
          titulo="Paraopeba (Brumadinho)"
          descricao="Acordo judicial de R$ 37,7 bi, perícias da UFMG e projetos nos 26 municípios."
          acao="Painel Paraopeba"
        />
        <CartaoDestaque
          href="/ambiental/licenciamento"
          etiqueta="✦ Licenciamento"
          titulo="Licenciamento (11 UFs)"
          descricao="8.600+ processos e pautas do COPAM/SEMAD, supressão vegetal e TACs."
          acao="Ver Licenciamentos"
        />
      </div>
      <Subir />
    </section>
  );
}

function ListaSubfrentes({
  subfrentes,
}: {
  subfrentes: (typeof CATALOGO_EIXOS)['terra']['subfrentes'];
}) {
  return (
    <section id="subfrentes" aria-labelledby="subfrentes-terra-titulo" className="mb-12 scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="subfrentes-terra-titulo"
            className="font-display text-xl sm:text-2xl font-bold text-foreground"
          >
            Subfrentes de Terra, Clima e Cidades
          </h2>
          <p className="text-sm text-muted">
            Explore o território por recortes municipais, hídricos, florestais e de licenciamento
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          7 Subfrentes Ativas
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subfrentes.map((sub) => {
          const href =
            sub.id === 'cidades'
              ? '/cidades#catalogo-cidades'
              : sub.id === 'nossos-rios'
                ? '/terra-e-territorios/nossos-rios'
                : sub.id === 'nossas-serras'
                  ? '/terra-e-territorios/nossas-serras'
                  : sub.rotaLegada ?? `/terra-e-territorios/${sub.slug}`;

          return (
            <Magnet key={sub.id} forca={0.05} afastamento={40} className="h-full">
              <BorderGlow
                className="h-full rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:border-emerald-500/40 hover:shadow-md"
                corFundo="var(--cp-surface)"
                raio={16}
              >
                <Link href={href} className="group flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Subfrente
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                        Acessar →
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {sub.titulo}
                    </h3>
                    <p className="mt-2 text-xs text-muted leading-relaxed">{sub.descricao}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1 pt-3 border-t border-border/50">
                    {sub.tagsRelacionadas.slice(0, 3).map((t) => (
                      <span key={t} className="rounded bg-surface-2 px-2 py-0.5 text-xs text-muted">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Link>
              </BorderGlow>
            </Magnet>
          );
        })}
      </div>
      <Subir />
    </section>
  );
}

function BaciaParaopeba() {
  return (
    <section
      id="paraopeba"
      className="mb-12 scroll-mt-24 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
            Grandes Bacias Atingidas & Reparação
          </span>
          <h2 className="font-display text-2xl font-bold text-foreground mt-2">
            Bacia do Rio Paraopeba & Brumadinho
          </h2>
          <p className="mt-1 text-sm text-muted max-w-2xl">
            Fiscalização cidadã do Acordo Judicial de R$ 37,7 bilhões, perícias judiciais da UFMG, auditoria independente AECOM e atuação das Assessorias Técnicas Independentes (ATIs).
          </p>
        </div>
        <BotaoBrilho raio={12}>
          <Link
            href="/paraopeba"
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-amber-700 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Acessar Painel do Paraopeba</span>
            <span aria-hidden="true">→</span>
          </Link>
        </BotaoBrilho>
        <BotaoBrilho raio={12}>
          <Link
            href="/ambiental"
            className="rounded-xl border border-current bg-surface px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Ver o Observatório Meio Ambiente</span>
            <span aria-hidden="true">→</span>
          </Link>
        </BotaoBrilho>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Magnet forca={0.05} afastamento={40} className="h-full">
          <BorderGlow
            className="h-full rounded-xl border border-border bg-surface-2 p-4 transition-all hover:border-amber-500/40"
            corFundo="var(--cp-surface-2)"
            raio={12}
          >
            <Link href="/paraopeba/analise" className="group flex h-full flex-col">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">
                Síntese Tripartite
              </span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-600 transition-colors">
                Análise Integrada →
              </h3>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                Os 16 eixos da AECOM cruzados com o que a UFMG mediu e o que as ATIs publicaram sobre o mesmo assunto.
              </p>
            </Link>
          </BorderGlow>
        </Magnet>

        <Magnet forca={0.05} afastamento={40} className="h-full">
          <BorderGlow
            className="h-full rounded-xl border border-border bg-surface-2 p-4 transition-all hover:border-amber-500/40"
            corFundo="var(--cp-surface-2)"
            raio={12}
          >
            <Link href="/paraopeba/execucao" className="group flex h-full flex-col">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-1">
                R$ 5,48 bi municipais
              </span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-amber-600 transition-colors">
                Execução por Município →
              </h3>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                Acompanhamento de repasses e projetos de saneamento e infraestrutura nos 26 municípios atingidos.
              </p>
            </Link>
          </BorderGlow>
        </Magnet>

        <Magnet forca={0.05} afastamento={40} className="h-full">
          <BorderGlow
            className="h-full rounded-xl border border-border bg-surface-2 p-4 transition-all hover:border-indigo-500/40"
            corFundo="var(--cp-surface-2)"
            raio={12}
          >
            <Link href="/ambiental/crimes-socioambientais" className="group flex h-full flex-col">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mb-1">
                936 Documentos
              </span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-indigo-600 transition-colors">
                Biblioteca de Desastres →
              </h3>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                Acervo com micro-resumos de todos os laudos periciais, termos de ajustamento e estudos de saúde.
              </p>
            </Link>
          </BorderGlow>
        </Magnet>

        <Magnet forca={0.05} afastamento={40} className="h-full">
          <BorderGlow
            className="h-full rounded-xl border border-border bg-surface-2 p-4 transition-all hover:border-cyan-500/40"
            corFundo="var(--cp-surface-2)"
            raio={12}
          >
            <Link href="/ambiental/mariana" className="group flex h-full flex-col">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 block mb-1">
                Rio Doce · R$ 171 bi
              </span>
              <h3 className="font-display text-base font-bold text-foreground group-hover:text-cyan-600 transition-colors">
                Repactuação de Mariana →
              </h3>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">
                Repasses aos municípios da calha do Rio Doce, recuperação ambiental e indenizações individuais.
              </p>
            </Link>
          </BorderGlow>
        </Magnet>
      </div>
      <Subir />
    </section>
  );
}

function RedeCidades({ stats }: { stats: ReturnType<typeof obterEstatisticasExpansao> }) {
  return (
    <section
      id="cidades"
      className="mb-12 scroll-mt-24 rounded-2xl border border-border bg-surface-2/40 p-6 sm:p-8"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Expansão Nacional
          </span>
          <h3 className="font-display text-2xl font-bold text-foreground mt-2">
            {stats.totalCidades} Cidades Estratégicas do Brasil
          </h3>
          <p className="mt-3 text-sm text-muted leading-relaxed">
            O portal fiscaliza as {stats.totalCapitais} Capitais e {stats.totalPolosInterior} Polos do
            Interior em todas as Unidades Federativas. Cada município conta com perfil de saúde
            (CNES/SUS), educação (INEP/IDEB), finanças públicas e cruzamentos do Data Ocean.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <BotaoBrilho raio={12}>
              <Link
                href="/cidades#catalogo-cidades"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                Explorar as {stats.totalCidades} Cidades →
              </Link>
            </BotaoBrilho>
            <BotaoBrilho raio={12}>
              <Link
                href="/funcaosocialterra/mapa"
                className="rounded-xl border border-border bg-surface px-4 py-2 text-xs sm:text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors"
              >
                Abrir Globo 3D de Camadas 🌐
              </Link>
            </BotaoBrilho>
            <BotaoBrilho raio={12}>
              <Link
                href="/judiciario/contatos"
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              >
                Varas Agrárias & Ambientais ⚖️
              </Link>
            </BotaoBrilho>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
            Distribuição Regional dos Polos Estratégicos
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(stats.distribuicaoRegiao).map(([regiao, total]) => (
              <div key={regiao} className="flex items-center justify-between">
                <span className="text-foreground">{regiao}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{total} cidades</span>
                  <span className="text-muted font-mono">
                    ({Math.round((total / stats.totalCidades) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Subir />
    </section>
  );
}

/**
 * As três frentes que têm ficha própria, com a rota onde a lista completa vive.
 * O hub mostra duas fichas de cada uma: ler as 43 aqui viraria parede.
 */
const FRENTES_COM_FICHAS = [
  {
    subfrente: 'nossas-serras',
    rotulo: 'Serras e geologia',
    href: '/terra-e-territorios/nossas-serras',
  },
  {
    subfrente: 'nossos-rios',
    rotulo: 'Rios e bacias',
    href: '/terra-e-territorios/nossos-rios',
  },
  {
    subfrente: 'biomas',
    rotulo: 'Fauna ameaçada',
    href: '/ambiental/nossos-animais',
  },
] as const;

function SecaoFichas({
  fichas,
}: {
  fichas: ReturnType<typeof listarFichasPorEixo>;
}) {
  if (fichas.length === 0) return null;

  const porFrente = FRENTES_COM_FICHAS.map((frente) => ({
    ...frente,
    total: fichas.filter((f) => f.subfrente === frente.subfrente).length,
  }));
  const destaque = FRENTES_COM_FICHAS.flatMap((frente) =>
    fichas.filter((f) => f.subfrente === frente.subfrente).slice(0, 2),
  );

  return (
    <section id="fichas" aria-labelledby="fichas-terra-titulo" className="mb-12 scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="fichas-terra-titulo"
            className="font-display text-xl sm:text-2xl font-bold text-foreground"
          >
            Fichas Socioambientais e Territoriais
          </h2>
          <p className="text-sm text-muted">
            Geologia das serras, bacias hidrográficas e fauna ameaçada, com fonte oficial e ano
          </p>
        </div>
        <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-semibold text-muted">
          {fichas.length} fichas
        </span>
      </div>

      <ul className="mb-6 flex flex-wrap gap-2 text-sm">
        {porFrente.map((frente) =>
          frente.total === 0 ? null : (
            <li key={frente.subfrente}>
              <Link
                href={frente.href}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 hover:border-emerald-500 transition-colors"
              >
                <span className="font-medium text-foreground">{frente.rotulo}</span>
                <span className="text-xs text-muted">{frente.total}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </li>
          ),
        )}
      </ul>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {destaque.map((f) => (
          <FichaCard key={f.id} ficha={f} />
        ))}
      </div>
      <Subir />
    </section>
  );
}

function PaginasIrmasTerra() {
  const irmas = [
    { href: '/terra-e-territorios/vales', rotulo: 'Vales do Jequitinhonha e do Mucuri' },
    { href: '/terra-e-territorios/nossos-rios', rotulo: 'Nossos Rios e Bacias' },
    { href: '/terra-e-territorios/nossas-serras', rotulo: 'Nossas Serras e Topos de Morro' },
    { href: '/cidades#catalogo-cidades', rotulo: '203 Cidades Estratégicas' },
    { href: '/funcaosocialterra/mapa', rotulo: 'Globo 3D e Função Social' },
    { href: '/paraopeba', rotulo: 'Bacia do Paraopeba' },
    { href: '/ambiental', rotulo: 'Observatório Meio Ambiente' },
  ];
  return (
    <section
      id="paginas-irmas"
      aria-labelledby="paginas-irmas-titulo"
      className="mb-12 scroll-mt-24 border-t border-border pt-8"
    >
      <h2 id="paginas-irmas-titulo" className="font-display text-xl font-bold text-foreground">
        Páginas irmãs
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-muted">
        As telas que continuam em endereço próprio, cada uma com o dado que só ela tem. O antigo
        índice de cidades desta frente agora é a seção de catálogo de <code>/cidades</code>.
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {irmas.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="underline">
              {item.rotulo}
            </Link>
          </li>
        ))}
      </ul>
      <Subir />
    </section>
  );
}

export default function TerraETerritoriosHub() {
  const subfrentes = CATALOGO_EIXOS.terra.subfrentes;
  const fichas = listarFichasPorEixo('terra');
  const statsCidades = obterEstatisticasExpansao();
  const calhas = Object.keys(DADOS_RIOS).length;

  // As duas contagens que o portal mede saem do dado; as outras são
  // referência das fontes e estão sob o aviso.
  const indicadoresTerritorio = [
    {
      rotulo: 'Cidades Estratégicas',
      valor: String(statsCidades.totalCidades),
      obs: `${statsCidades.totalCapitais} capitais + ${statsCidades.totalPolosInterior} polos regionais`,
    },
    {
      rotulo: 'Bacias e Rios Monitorados',
      valor: String(calhas),
      obs: 'Rio Doce, Paraopeba, Velhas, São Francisco e outras calhas com catálogo',
    },
    { rotulo: 'Terras Indígenas e Quilombolas', valor: '414', obs: 'Áreas demarcadas no Globo 3D' },
    { rotulo: 'Barragens de Mineração', valor: '942', obs: 'SIGBM/ANM (com declaração de risco)' },
  ];

  return (
    <EixoLayout
      eixoId="terra"
      abertura
      heroImageSrc="/images/eixos/terra-e-territorios-ipe-lobo.jpg"
      heroImageAlt="Lobo-guará caminhando ao lado de um ipê amarelo florido em escarpa rochosa do Cerrado"
      heroCaption="O lobo-guará e o ipê-amarelo no alto da serra — o Eixo Terra e Territórios vigia a soberania do solo, as águas e a integridade socioambiental do Brasil."
    >
      <NavegacaoTerra />
      <AvisoReferenciaTerritorio />
      <Indicadores itens={indicadoresTerritorio} />
      <PortasPrioritarias />
      <ListaSubfrentes subfrentes={subfrentes} />
      <BaciaParaopeba />
      <RedeCidades stats={statsCidades} />
      <SecaoFichas fichas={fichas} />
      <PaginasIrmasTerra />
      <MeioAmbienteRelacionado />
    </EixoLayout>
  );
}
