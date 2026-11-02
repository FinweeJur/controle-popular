import type { Metadata } from "next";
import Link from "next/link";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import {
  ITENS_CONCURSOS,
  METRICAS_CONCURSOS,
  DISTRIBUICAO_ESFERA,
  DISTRIBUICAO_PODER,
  DISTRIBUICAO_MODALIDADE,
  listarEsferas,
  listarPoderes,
  listarModalidades,
  listarEscolaridades,
  listarStatus,
  listarUfs,
} from "@/lib/concursos";
import { metadataEditavel } from "@/lib/edicoes";
import DataColeta from "@/app/components/DataColeta";
import PainelConcursos from "./PainelConcursos";
import FooterGlobal from "@/app/components/FooterGlobal";
import { DatasetJsonLd } from "@/app/components/DatasetJsonLd";
import BotaoPerguntarNono from "@/app/components/BotaoPerguntarNono";

/**
 * ═══ CONCURSOS PÚBLICOS E CONTRATAÇÕES TEMPORÁRIAS DO BRASIL ═══
 *
 * O que é:
 *   Radar nacional e cívico de certames públicos, agregando concursos estatutários
 *   e processos seletivos simplificados (PSS) nas esferas Federal, Estadual (27 UFs)
 *   e polos Municipais, cobrindo todos os Poderes da República e entes da administração.
 *
 * Fonte oficial:
 *   Diários Oficiais da União, Estados e Municípios, bancas organizadoras oficiais
 *   (Cebraspe, FGV, FCC, Vunesp, Cesgranrio, Fundep, Idecan) e órgãos promotores.
 *
 * Por que foi feito assim:
 *   - Garante transparência cívica plena sobre oportunidades de carreira e serviço público.
 *   - Implementa rigorosamente as 8 Qualidades da Informação: dados auditados, links oficiais,
 *     totais matemáticos derivados do dataset, busca tolerante a acentos e exportação CSV.
 *   - Regra 5.10: Descrição sob o h1 nunca menor que text-sm.
 *   - Regra 5.14: Responsivo a 390px no celular sem rolagem lateral falsa.
 *   - Regra 5.16: Fonte mínima de 12px em todos os textos da interface.
 */

export const metadata: Metadata = metadataEditavel("/concursos", {
  title: "Concursos Públicos e Seleções Temporárias do Brasil — Controle Popular",
  description: `Radar cívico nacional de concursos públicos e contratações temporárias (PSS) no Brasil: ${formatNumberBR(
    METRICAS_CONCURSOS.totalCertames
  )} certames monitorados, cobrindo todas as 27 UFs e os 6 poderes, com busca em tempo real e exportação CSV.`,
});

export default function ConcursosPage() {
  const esferas = listarEsferas();
  const poderes = listarPoderes();
  const modalidades = listarModalidades();
  const escolaridades = listarEscolaridades();
  const statusList = listarStatus();
  const ufs = listarUfs();

  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-12 sm:py-16">
      <DatasetJsonLd
        name="Radar Nacional de Concursos Públicos e Contratações Temporárias"
        description="Dataset público e transparente com certames públicos e seleções simplificadas (PSS) em âmbito Federal, Estadual (todas as 27 UFs) e Municipal."
        url="/concursos"
        keywords={[
          "concursos públicos",
          "processo seletivo simplificado",
          "PSS",
          "vagas públicas",
          "serviço público",
          "transparência cívica",
          "diário oficial",
        ]}
      />

      {/* ─── CABEÇALHO DA PÁGINA ───────────────────────────────────────── */}
      <header className="space-y-4">
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-text-soft uppercase">
          Carreira Pública & Acesso Cívico · Transparência & Controle Social
        </p>
        <h1 className="font-display text-[clamp(1.8em,4vw,2.5em)] font-bold tracking-tight text-text">
          Concursos Públicos e Seleções Temporárias do Brasil
        </h1>
        <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-text-soft">
          Monitoramento auditado de editais de concursos efetivos (art. 37, II da CF/88)
          e processos seletivos simplificados (PSS/REDA/ACT, art. 37, IX da CF/88). Cobertura
          nacional em âmbito federal, em todas as 27 unidades federativas e nos polos municipais,
          com links oficiais diretos, remunerações auditadas e regras de isenção gratuita de taxa.
        </p>
      </header>

      {/* ─── DATA DA COLETA E CARIMBO OFICIAL ───────────────────────────── */}
      <DataColeta
        coletadoEm={METRICAS_CONCURSOS.atualizadoEm}
        fonte="Diários Oficiais da União, Estados e Municípios e Bancas Credenciadas"
      />

      {/* ─── CARTÕES DE TOPO (TOTAIS DERIVADOS MATEMATICAMENTE) ─────────── */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm min-w-0">
          <p className="text-xs font-semibold text-text-soft uppercase">Total de Certames</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-primary">
            {formatNumberBR(METRICAS_CONCURSOS.totalCertames)}
          </p>
          <p className="mt-1 text-xs text-text-soft">editais auditados no país</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm min-w-0">
          <p className="text-xs font-semibold text-text-soft uppercase">Vagas Imediatas</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-text">
            {formatNumberBR(METRICAS_CONCURSOS.totalVagasImediatas)}
          </p>
          <p className="mt-1 text-xs text-text-soft">oportunidades diretas</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm min-w-0">
          <p className="text-xs font-semibold text-text-soft uppercase">Cadastro Reserva</p>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-extrabold text-text">
            {formatNumberBR(METRICAS_CONCURSOS.totalVagasCadastroReserva)}
          </p>
          <p className="mt-1 text-xs text-text-soft">vagas em banco habilitado</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-sm min-w-0">
          <p className="text-xs font-semibold text-text-soft uppercase">Maior Remuneração</p>
          <p className="mt-2 font-display text-xl sm:text-2xl font-extrabold text-primary">
            {formatCurrencyBRL(METRICAS_CONCURSOS.maiorRemuneracao)}
          </p>
          <p className="mt-1 text-xs text-text-soft">teto inicial verificado</p>
        </div>
      </div>

      {/* ─── CHAMADA DO ASSISTENTE CÍVICO (SEU NONÔ) ───────────────────── */}
      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">🦜</span>
            <h2 className="font-display text-sm font-bold text-amber-950 dark:text-amber-200">
              Dúvidas sobre Isenção de Taxa, Cotas e Direitos do Concurseiro?
            </h2>
          </div>
          <p className="text-xs text-amber-900/80 dark:text-amber-300/80 max-w-2xl leading-relaxed">
            A Lei Federal 13.656/2018 garante gratuidade total de inscrição para membros do CadÚnico
            e doadores de medula óssea. Converse com o Seu Nonô para tirar dúvidas sobre seus direitos cívicos!
          </p>
        </div>
        <BotaoPerguntarNono
          pergunta="Seu Nonô, como funciona a isenção gratuita da taxa de inscrição em concursos públicos pelo CadÚnico e por doação de medula óssea?"
          rotulo="Perguntar ao Seu Nonô"
        />
      </div>

      {/* ─── FUNDAMENTAÇÃO LEGAL E METODOLOGIA ──────────────────────────── */}
      <div className="mt-6 rounded-xl border border-border/80 bg-surface-2/50 p-4 text-xs text-text-soft">
        <p className="leading-relaxed">
          <strong className="text-text">Fundamentação Constitucional e Legal:</strong> O provimento de cargos públicos
          efetivos depende de aprovação prévia em concurso público de provas ou de provas e títulos (CF/88, art. 37, II).
          As contratações por tempo determinado ocorrem para atender a necessidade temporária de excepcional interesse público
          (CF/88, art. 37, IX e Lei 8.745/1993), dispensando concurso público mas exigindo processo seletivo simplificado (PSS)
          sujeito à ampla divulgação oficial. Este radar consolida unicamente fontes públicas oficiais com links verificados e
          anonimização estrita de dados pessoais.
        </p>
      </div>

      {/* ─── PAINEL CLIENTE INTERATIVO ──────────────────────────────────── */}
      <PainelConcursos
        itens={ITENS_CONCURSOS}
        esferas={esferas}
        poderes={poderes}
        modalidades={modalidades}
        escolaridades={escolaridades}
        statusList={statusList}
        ufs={ufs}
        distribuicoes={{
          esfera: DISTRIBUICAO_ESFERA,
          poder: DISTRIBUICAO_PODER,
          modalidade: DISTRIBUICAO_MODALIDADE,
        }}
      />

      {/* ─── PÁGINAS RELACIONADAS (NEXT/LINK) ──────────────────────────── */}
      <nav data-ignorar-indice aria-label="Páginas relacionadas" className="mt-12 border-t border-border pt-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-soft">
          Páginas relacionadas
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              href: "/editais",
              titulo: "Editais e Licitações",
              desc: "Chamamentos, pregões e compras públicas de Minas Gerais.",
            },
            {
              href: "/educacao",
              titulo: "Educação & Periódicos",
              desc: "Revistas científicas gratuitas e fluxo contínuo acadêmico.",
            },
            {
              href: "/dados",
              titulo: "Catálogo de Dados Abertos",
              desc: "Datasets cívicos e transparência pública em formato aberto.",
            },
          ].map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group rounded-lg border border-border bg-surface-2/50 p-3 text-sm transition hover:border-primary hover:bg-surface-2"
            >
              <p className="font-medium text-text group-hover:text-primary">{p.titulo}</p>
              <p className="mt-0.5 text-xs text-text-soft">{p.desc}</p>
            </Link>
          ))}
        </div>
      </nav>

      <FooterGlobal />
    </div>
  );
}
