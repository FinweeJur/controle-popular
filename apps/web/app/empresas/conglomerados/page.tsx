/**
 * @file apps/web/app/empresas/conglomerados/page.tsx
 * @description Página temática do Observatório de Monopólios, Holdings, Cartéis e Trustes.
 *
 * Papel no portal:
 * Mapeia as estruturas de controle acionário e conluio corporativo sobre setores estratégicos
 * da economia brasileira: mineração, energia, agronegócio de grãos, bancos e tecnologia.
 * Expõe a propriedade comum (Common Ownership) dos Big Three globais (BlackRock, Vanguard,
 * State Street), a concentração portuária do cartel ABCD de grãos e as concessões federais.
 *
 * Fontes oficiais:
 * - CVM (Comissão de Valores Mobiliários) — Formulários de Referência de Companhias Abertas.
 * - SEC EDGAR (EUA) — Formulários anuais 10-K, 20-F e participações 13F.
 * - CADE (Conselho Administrativo de Defesa Econômica) — Atos de Concentração e Guia HHI.
 * - ANM (Agência Nacional de Mineração) — SIGMINE e outorgas de lavra.
 * - ANP (Agência Nacional do Petróleo) & ANTAQ (Portos).
 * - Banco Central do Brasil — Relatório de Estabilidade Financeira.
 *
 * Decisões técnicas e restrições:
 * - Server Component estático com renderização prévia de metadados para busca e compartilhamento.
 * - Importa constantes agregadas de `COBERTURA_CONGLOMERADOS` para os cartões de topo.
 * - Descompacta dados com `dados-conglomerados.ts` para abastecer o cliente interativo.
 * - Cumpre a regra de fonte mínima (AGENTS.md § 5.10) utilizando `ResumoExpandivel`.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
  COBERTURA_CONGLOMERADOS,
  obterNosConglomerados,
  obterArestasControle,
  obterConcentracoesSetoriais,
} from "@/lib/empresas/dados-conglomerados";
import PainelConglomeradosClient from "./PainelConglomeradosClient";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import SecaoPaginasRelacionadas from "@/app/components/SecaoPaginasRelacionadas";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = {
  title: "Redes de Monopólios, Holdings e Cartéis no Brasil | Controle Popular",
  description:
    "Auditoria cívica das redes de controle societário, holdings globais (Big Three), oligopólio de grãos ABCD, Big Mining, Big Oil e índices HHI de concentração econômica no Brasil.",
};

export default function PaginaConglomerados() {
  const nos = obterNosConglomerados();
  const arestas = obterArestasControle();
  const setores = obterConcentracoesSetoriais();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* ─── NAVEGAÇÃO BREADCRUMB ESTRUTURAL ─── */}
      <nav
        aria-label="Navegação estrutural"
        className="flex items-center gap-2 text-xs text-muted print:hidden"
      >
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>
        <span>/</span>
        <Link href="/estado-e-economia" className="hover:text-primary transition">
          Estado & Economia
        </Link>
        <span>/</span>
        <Link href="/empresas" className="hover:text-primary transition">
          Grandes Empresas & Fundos
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Monopólios, Holdings & Cartéis</span>
      </nav>

      {/* ─── CABEÇALHO DA PÁGINA ─── */}
      <header className="space-y-4">
        {/* Badges Temáticos */}
        <div className="flex flex-wrap gap-2 print:hidden">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
            🏛️ Teia de Controle Societário
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            🌐 Big Three & Common Ownership
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            🌾 Cartel de Grãos ABCD
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
            ⚖️ Índice Antitruste HHI & CADE
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Redes de Monopólios, Holdings, Cartéis e Trustes no Brasil
        </h1>

        {/* Descrição com Regra § 5.10 (ResumoExpandivel, piso text-sm) */}
        <ResumoExpandivel
          texto="Auditoria cívica das conexões acionárias que concentram o poder econômico no Brasil. Entenda como fundos sediados em Nova York (BlackRock, Vanguard e State Street) detêm o comando de mineradoras rivais, petroleiras do Pré-Sal, bancos e gigantes de tecnologia, enquanto quatro multinacionais históricas (ADM, Bunge, Cargill e Louis Dreyfus) controlam os portos e o escoamento de grãos da Amazônia e do Centro-Oeste."
          className="text-muted max-w-4xl"
        />

        {/* Epígrafe Editorial */}
        <p className="border-l-2 border-primary pl-4 text-xs sm:text-sm italic text-muted">
          &ldquo;A concorrência de mercado é uma ilusão quando os três maiores acionistas de empresas
          teoricamente rivais são exatamente as mesmas gestoras universais de fundos.
          O controle popular precisa auditar as holdings com o mesmo rigor dos órgãos antitruste.&rdquo;
        </p>
      </header>

      {/* ─── CARTÕES DE TOPO COM AGREGADOS MEDIDOS (COBERTURA_CONGLOMERADOS) ─── */}
      <section
        className="grid grid-cols-2 gap-4 sm:grid-cols-4 print:grid-cols-4"
        aria-label="Métricas Consolidadas de Concentração Econômica"
      >
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Entidades & Concessões</div>
          <div className="mt-1 font-mono text-2xl font-bold text-foreground sm:text-3xl">
            {COBERTURA_CONGLOMERADOS.totalEntidades}
          </div>
          <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
            Mapeadas em 4 Níveis
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Big Three sob Gestão</div>
          <div className="mt-1 font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-3xl">
            ${COBERTURA_CONGLOMERADOS.aumBigThreeUsdTrilhoes} Tri
          </div>
          <div className="mt-1 text-xs text-muted">
            BlackRock, Vanguard & State Street
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Média HHI Setorial</div>
          <div className="mt-1 font-mono text-2xl font-bold text-red-600 dark:text-red-400 sm:text-3xl">
            {COBERTURA_CONGLOMERADOS.mediaHhi}
          </div>
          <div className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            Altamente Concentrado
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="text-xs text-muted">Vínculos Societários</div>
          <div className="mt-1 font-mono text-2xl font-bold text-blue-600 dark:text-blue-400 sm:text-3xl">
            {COBERTURA_CONGLOMERADOS.totalArestasControle}
          </div>
          <div className="mt-1 text-xs text-muted">
            Arestas de Controle & Partilha
          </div>
        </div>
      </section>

      {/* ─── MICRORESUMO CÍVICO CONTEXTUAL (AGENTS.md § 8) ─── */}
      <section
        aria-label="Microresumo cívico sobre propriedade comum e concentração"
        className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-3"
      >
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span>💡 Como ler a radiografia do poder econômico corporativo?</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted leading-relaxed">
          <div className="space-y-1">
            <strong className="text-foreground">1. Propriedade Comum (Common Ownership):</strong>
            <p>
              Quando BlackRock e Vanguard detêm simultaneamente 15% da Vale e 15% da BHP,
              não há incentivo real para guerra de preços ou concorrência agressiva.
            </p>
          </div>
          <div className="space-y-1">
            <strong className="text-foreground">2. Cartel de Grãos ABCD:</strong>
            <p>
              As tradings transnacionais dominam portos privativos, barcaças e ferrovias,
              impondo margens e preços sobre milhões de produtores e consumidores.
            </p>
          </div>
          <div className="space-y-1">
            <strong className="text-foreground">3. Índice HHI (Herfindahl-Hirschman):</strong>
            <p>
              Adotado pelo CADE e pelo DOJ dos EUA: qualquer mercado com HHI acima de 2.500
              pontos é considerado altamente concentrado e sujeito a investigação antitruste.
            </p>
          </div>
        </div>
      </section>

      {/* ─── PAINEL INTERATIVO CLIENT (CANVAS 60FPS + MAPA MENTAL SVG + TABELA 6 QUALIDADES) ─── */}
      <main>
        <PainelConglomeradosClient nos={nos} arestas={arestas} setores={setores} />
      </main>

      {/* ─── PÁGINAS RELACIONADAS E CONEXÕES CÍVICAS ─── */}
      <div className="mt-12">
        <SecaoPaginasRelacionadas
          titulo="Investigações & Redes de Poder Relacionadas"
          subtitulo="Cruze as teias societárias com as maiores fortunas mundiais, conselhos corporativos e territórios."
          paginas={[
            {
              href: "/empresas/fortunas",
              titulo: "1.000 Maiores Fortunas Mundiais",
              descricao: "Dinastias familiares e bilionários que controlam as holdings, tradings e fundos globais.",
              badge: "Fortunas",
              icone: "dinheiro",
            },
            {
              href: "/empresas/executivos",
              titulo: "CEOs e Conselhos Corporativos",
              descricao: "Diretoria estatutária e interlocking directorates nas maiores corporações monitoradas.",
              badge: "Governança",
              icone: "empresa",
            },
            {
              href: "/empresas",
              titulo: "Observatório de Grandes Empresas",
              descricao: "As 130 maiores companhias em atividade no Brasil: cotações, contratos públicos e multas.",
              badge: "Empresas",
              icone: "empresa",
            },
            {
              href: "/canada/mineracao",
              titulo: "Mineradoras Canadenses no Brasil",
              descricao: "Rede da Bolsa de Toronto (TSX), Vale Base Metals e concessões de lítio e ouro na ANM.",
              badge: "Mineração",
              icone: "mineracao",
            },
            {
              href: "/ambiental/barragens-globais",
              titulo: "Grandes Barragens Mundiais",
              descricao: "Estruturas de rejeitos e hidrelétricas mantidas por multinacionais de commodities.",
              badge: "Barragens",
              icone: "barragem",
            },
            {
              href: "/funcaosocialterra/mapa",
              titulo: "Globo 3D de Sobreposições Territoriais",
              descricao: "Visualização geoespacial das pressões de grandes holdings sobre terras indígenas e CAR.",
              badge: "Globo 3D",
              icone: "globo",
            },
          ]}
        />
      </div>

      {/* ─── RODAPÉ METODOLÓGICO E FONTES OFICIAIS ─── */}
      <footer className="border-t border-border pt-6 text-xs text-muted space-y-2 print:border-t-0">
        <p>
          <strong>Fontes Oficiais Verificadas:</strong> Comissão de Valores Mobiliários (CVM / Formulários de Referência),
          U.S. Securities and Exchange Commission (SEC EDGAR / Forms 13F, 10-K, 20-F), Conselho Administrativo de
          Defesa Econômica (CADE / Processos Administrativos e Atos de Concentração), Agência Nacional de Mineração (ANM / SIGMINE),
          Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP), Agência Nacional de Transportes Aquaviários (ANTAQ)
          e Banco Central do Brasil (BCB / Relatório de Estabilidade Financeira).
        </p>
        <p>
          O portal Controle Popular é uma plataforma cívica e de pesquisa pública auditável.
          Não emitimos recomendações de investimento ou assessoria financeira. Todos os dados societários
          e operacionais decorrem estritamente de documentos públicos oficiais de pessoas jurídicas reguladas.
        </p>
      </footer>

      <FooterGlobal />
    </div>
  );
}
