import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import EixoLayout from '@/app/components/eixos/EixoLayout';
import FichaCard from '@/app/components/eixos/FichaCard';
import RelacaoSuggestions from '@/app/components/eixos/RelacaoSuggestions';
import CruzamentosEducativos from '@/app/components/eixos/CruzamentosEducativos';
import {
  listarCidadesEstrategicas,
  obterCidadePorSlugOuId,
  obterPibMunicipal,
  obterDadosCompletosCidade,
} from '@/lib/cidades/estrategicas';
import {
  TrendingUp,
  BarChart3,
  Building2,
  MapPin,
  Users,
  HeartPulse,
  GraduationCap,
  DollarSign,
  ShieldCheck,
  Scale,
  ExternalLink,
  Landmark,
  FileSpreadsheet,
} from 'lucide-react';
import { listarFichasPorMunicipio } from '@/lib/eixos/fichas';
import { calcularCruzamentosMunicipais } from '@/lib/cruzamentos/correlacionador';
import DocumentosRelacionados from '@/app/components/DocumentosRelacionados';
import { obterDocumentosCidade } from '@/lib/hiperlinks/referencias-cruzadas';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const cidades = listarCidadesEstrategicas();
  return cidades.map((c) => ({
    slug: c.slug ?? c.id_municipio,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cidade = obterCidadePorSlugOuId(slug);

  if (!cidade) {
    return { title: 'Cidade não encontrada | Controle Popular' };
  }

  return {
    title: `${cidade.nome} (${cidade.uf}) — Perfil Municipal e Cruzamentos | Controle Popular`,
    description: `Perfil oficial, indicadores de saúde, educação, repasses públicos e cruzamentos analíticos de ${cidade.nome} - ${cidade.uf}.`,
  };
}

export default async function PaginaIndividualCidade({ params }: Props) {
  const { slug } = await params;
  const cidade = obterCidadePorSlugOuId(slug);

  if (!cidade) {
    notFound();
  }

  const fichas = listarFichasPorMunicipio(cidade.id_municipio);
  const fichaDestaque = fichas[0];

  // As 6 cidades piloto com cobertura aprofundada histórica
  const cidadesProfundas = ['betim', 'bh', 'sp', 'aracuai', 'diamantina', 'itinga'];
  const temPainelProfundo = cidade.slug && cidadesProfundas.includes(cidade.slug.toLowerCase());

  // Dados consolidados completos da cidade (PIB, Saúde, Educação, Repasses, Geografia)
  const dadosCompletos = obterDadosCompletosCidade(slug) || obterDadosCompletosCidade(cidade.id_municipio);

  // Dados de PIB Municipal (IBGE SIDRA)
  const pibData = dadosCompletos?.serie_pib && dadosCompletos.serie_pib.length > 0
    ? {
        fonte: "ibge-sidra-t5938",
        municipio: cidade.id_municipio,
        total_anos: dadosCompletos.serie_pib.length,
        pib: dadosCompletos.serie_pib,
      }
    : obterPibMunicipal(cidade.id_municipio);

  const populacaoReal = dadosCompletos?.populacao ?? (cidade.tipo === 'capital' ? 1200000 : 150000);

  // Calcula cruzamentos leigos do Data Ocean para a cidade
  const cruzamentos = calcularCruzamentosMunicipais({
    codIbge7: cidade.id_municipio,
    nome: cidade.nome,
    uf: cidade.uf,
    populacao: populacaoReal,
  });

  return (
    <EixoLayout
      eixoId="terra"
      subfrenteId="cidades"
      heroImageSrc="/images/eixos/terra-e-territorios-ipe-lobo.jpg"
      heroImageAlt={`Paisagem de ${cidade.nome} e território`}
      heroCaption={`Monitoramento municipal de ${cidade.nome} (${cidade.uf}) — Eixo Terra e Territórios.`}
    >
      {/* CABEÇALHO DO MUNICÍPIO */}
      <section className="mb-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {cidade.tipo === 'capital' ? 'Capital de Estado' : 'Polo Regional do Interior'}
            </span>
            <span className="rounded-full bg-surface-2 border border-border px-3 py-0.5 text-xs text-muted">
              Região {cidade.regiao}
            </span>
            <span className="rounded-full bg-surface-2 border border-border px-3 py-0.5 text-xs font-mono text-muted">
              UF: {cidade.uf}
            </span>
          </div>

          <span className="font-mono text-xs text-muted">
            IBGE: <strong>{cidade.id_municipio}</strong> · DATASUS: <strong>{cidade.datasus_6dig}</strong>
          </span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground">
          {cidade.nome}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Polo municipal integrante da rede de 199 cidades estratégicas com fiscalização de saúde, educação e gastos públicos.
        </p>

        {/* ═══ 5 CARTÕES DE INDICADORES PRINCIPAIS ═══ */}
        {dadosCompletos && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4 mt-6">
            <div className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
                <DollarSign size={14} className="text-primary" />
                <span>PIB Municipal</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
                R$ {dadosCompletos.pib_mais_recente_bi.toFixed(1)} bi
              </div>
              <p className="text-xs text-muted">
                R$ {dadosCompletos.pib_per_capita_reais.toLocaleString('pt-BR')} / hab
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
                <Users size={14} className="text-blue-600 dark:text-blue-400" />
                <span>População</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
                {dadosCompletos.populacao.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted">Censo 2022 oficial</p>
            </div>

            <div className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
                <HeartPulse size={14} className="text-rose-600 dark:text-rose-400" />
                <span>Rede de Saúde</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
                {dadosCompletos.saude_estabelecimentos}
              </div>
              <p className="text-xs text-muted">Unidades CNES/SUS</p>
            </div>

            <div className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
                <GraduationCap size={14} className="text-amber-600 dark:text-amber-400" />
                <span>Educação</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-foreground">
                {dadosCompletos.escolas_total}
              </div>
              <p className="text-xs text-muted">Escolas registradas</p>
            </div>

            <div className="rounded-xl border border-border bg-surface-2 p-3.5 space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5 text-xs text-muted font-semibold">
                <Landmark size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Repasses da União</span>
              </div>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                R$ {dadosCompletos.repasses_federais_anuais_mi.toFixed(1)} mi
              </div>
              <p className="text-xs text-muted">ComunicaBR / anual</p>
            </div>
          </div>
        )}

        {/* ALERTA DE PAINEL PROFUNDO (SE FOR UMA DAS 6 CIDADES PILOTO) */}
        {temPainelProfundo && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-200 block mb-1">
                ⭐ Monitoramento Granular Completo Disponível
              </span>
              <p className="text-sm text-emerald-950 dark:text-emerald-100 font-medium">
                {cidade.nome} possui cobertura aprofundada com contratos, licitações, atos do diário oficial e proposições da câmara.
              </p>
            </div>
            <Link
              href={`/${cidade.slug}`}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 transition-colors"
            >
              Acessar Painel Completo de {cidade.nome} →
            </Link>
          </div>
        )}

        {/* GRID DE DADOS CADASTRAIS OFICIAIS */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 pt-6 border-t border-border/60 text-xs">
          <div className="rounded-xl bg-surface-2 p-3.5">
            <span className="text-muted block mb-1 font-semibold">Prefeitura Municipal:</span>
            <span className="text-foreground block font-mono">
              CNPJ: {dadosCompletos?.cnpj_prefeitura || cidade.cnpj_prefeitura || 'Sob apuração cadastral'}
            </span>
            {(dadosCompletos?.prefeitura_host || cidade.prefeitura_host) && (
              <a
                href={dadosCompletos?.prefeitura_host || cidade.prefeitura_host!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-primary hover:underline block truncate"
              >
                Portal Oficial ↗
              </a>
            )}
          </div>

          <div className="rounded-xl bg-surface-2 p-3.5">
            <span className="text-muted block mb-1 font-semibold">Câmara de Vereadores:</span>
            <span className="text-foreground block font-mono">
              CNPJ: {dadosCompletos?.cnpj_camara || cidade.cnpj_camara || 'Sob apuração cadastral'}
            </span>
            {(dadosCompletos?.camara_host || cidade.camara_host) && (
              <a
                href={dadosCompletos?.camara_host || cidade.camara_host!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-primary hover:underline block truncate"
              >
                Portal da Câmara ↗
              </a>
            )}
          </div>

          <div className="rounded-xl bg-surface-2 p-3.5">
            <span className="text-muted block mb-1 font-semibold">Diário Oficial do Município:</span>
            {(dadosCompletos?.diario_oficial || cidade.diario_oficial) ? (
              <a
                href={dadosCompletos?.diario_oficial || cidade.diario_oficial!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline block truncate font-medium"
              >
                Acessar Atos e Publicações Oficiais ↗
              </a>
            ) : (
              <span className="text-muted block">Coleta em expansão</span>
            )}
            <span className="text-muted block mt-1">
              Sistema Legislativo: {dadosCompletos?.camara_sistema || cidade.camara_sistema || 'Padrão'}
            </span>
          </div>
        </div>
      </section>

      {/* EVOLUÇÃO ECONÔMICA & PIB MUNICIPAL (IBGE SIDRA) */}
      {pibData && pibData.pib.length > 0 && (
        <section aria-labelledby="secao-pib" className="mb-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              <h2 id="secao-pib" className="font-display text-lg font-bold text-foreground">
                Evolução do PIB a Preços Correntes — {cidade.nome} ({pibData.pib[0]?.ano}–{pibData.pib[pibData.pib.length - 1]?.ano})
              </h2>
            </div>
            <span className="text-xs font-mono text-muted">Fonte: IBGE SIDRA (Tabela 5938)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-xl bg-surface-2 p-3.5 space-y-1">
              <span className="text-muted block">PIB Mais Recente ({pibData.pib[pibData.pib.length - 1]?.ano})</span>
              <div className="text-xl font-bold font-mono text-foreground">
                R$ {(pibData.pib[pibData.pib.length - 1].pib_total / 1000000).toFixed(2)} bi
              </div>
              <span className="text-xs text-muted">A preços correntes</span>
            </div>
            <div className="rounded-xl bg-surface-2 p-3.5 space-y-1">
              <span className="text-muted block">Crescimento na Década</span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{(
                  ((pibData.pib[pibData.pib.length - 1].pib_total - pibData.pib[0].pib_total) /
                    pibData.pib[0].pib_total) *
                  100
                ).toFixed(1)}%
              </div>
              <span className="text-xs text-muted">Variação nominal ({pibData.pib[0].ano} a {pibData.pib[pibData.pib.length - 1].ano})</span>
            </div>
            <div className="rounded-xl bg-surface-2 p-3.5 space-y-1">
              <span className="text-muted block">Série Histórica Coletada</span>
              <div className="text-xl font-bold font-mono text-foreground">
                {pibData.pib.length} anos
              </div>
              <span className="text-xs text-muted">Auditoria SIDRA completa</span>
            </div>
          </div>

          {/* Gráfico de Barras SVG Inline */}
          <div className="pt-2">
            <div className="h-44 w-full flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 bg-surface-2/60 rounded-xl border border-border/60">
              {(() => {
                const maxPib = Math.max(...pibData.pib.map((p) => p.pib_total));
                return pibData.pib.map((p) => {
                  const alturaPct = (p.pib_total / maxPib) * 100;
                  return (
                    <div key={p.ano} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <span className="text-xs font-mono text-muted group-hover:text-foreground transition opacity-0 group-hover:opacity-100">
                        R${(p.pib_total / 1000000).toFixed(1)}b
                      </span>
                      <div
                        style={{ height: `${alturaPct}%` }}
                        className="w-full max-w-[36px] bg-primary/80 hover:bg-primary rounded-t transition-all"
                        title={`${p.ano}: R$ ${(p.pib_total / 1000).toFixed(0)} milhões`}
                      />
                      <span className="text-xs font-mono text-muted mt-1">{p.ano}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </section>
      )}

      {/* ═══ CONTRATOS ADMINISTRATIVOS, LICITAÇÕES & CONVÊNIOS PÚBLICOS ═══ */}
      <section aria-labelledby="secao-contratos-convenios" className="mb-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Scale size={20} className="text-primary" />
            <h2 id="secao-contratos-convenios" className="font-display text-lg font-bold text-foreground">
              Contratos Públicos, Licitações & Convênios — {cidade.nome}
            </h2>
          </div>
          <span className="text-xs text-muted">Bases: PNCP, Transferegov e ComunicaBR</span>
        </div>

        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Fiscalização cívica sobre as compras públicas municipais regidas pela Lei 14.133/2021 (Nova Lei de Licitações) e sobre os convênios federais e estaduais repassados para {cidade.nome}:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Card 1: Contratos e Licitações no PNCP */}
          <div className="rounded-xl border border-border/70 bg-surface-2 p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <FileSpreadsheet size={16} className="text-primary" />
                  <span>Contratações da Prefeitura (PNCP)</span>
                </div>
                <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold font-mono">
                  Lei 14.133/2021
                </span>
              </div>
              <p className="text-muted leading-relaxed">
                Acompanhe editais, atas de registro de preços, dispensas, inexigibilidades e contratos administrativos celebrados pela Prefeitura Municipal.
              </p>
              <div className="text-xs font-mono text-muted">
                CNPJ Prefeitura: <strong className="text-foreground">{dadosCompletos?.cnpj_prefeitura || cidade.cnpj_prefeitura || 'Em consulta'}</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex flex-wrap gap-2">
              {temPainelProfundo ? (
                <Link
                  href={`/${cidade.slug}/prefeitura/contratos`}
                  className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:underline"
                >
                  <span>Ver Painel com Alertas de Contratos de {cidade.nome} →</span>
                </Link>
              ) : (
                <a
                  href={`https://pncp.gov.br/app/contratos?cnpj=${(dadosCompletos?.cnpj_prefeitura || cidade.cnpj_prefeitura || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:underline"
                >
                  <span>Consultar Contratos no PNCP Oficial</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Card 2: Convênios e Repasses Federais (Transferegov / SICONV) */}
          <div className="rounded-xl border border-border/70 bg-surface-2 p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <Landmark size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Convênios & Repasses da União</span>
                </div>
                <span className="rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-xs font-bold font-mono">
                  Transferegov
                </span>
              </div>
              <p className="text-muted leading-relaxed">
                Instrumentos de repasse voluntário, emendas parlamentares e transferências constitucionais destinadas a obras, saúde, saneamento e infraestrutura.
              </p>
              <div className="text-xs font-mono text-muted">
                Repasses Estimados: <strong className="text-emerald-600 dark:text-emerald-400">R$ {dadosCompletos?.repasses_federais_anuais_mi.toFixed(1)} mi / ano</strong>
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex flex-wrap gap-2">
              <a
                href={`https://portaldatransparencia.gov.br/convenios/consulta?codigoIbge=${cidade.id_municipio}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-xs text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                <span>Consultar Convênios no Portal da Transparência</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* COMPONENTE EDUCATIVO DATA OCEAN: OS 3 CRUZAMENTOS LEIGOS */}
      <CruzamentosEducativos
        cruzamentos={cruzamentos}
        nomeMunicipio={`${cidade.nome} (${cidade.uf})`}
      />

      {/* FICHAS TEMÁTICAS VINCULADAS AO MUNICÍPIO */}
      <section aria-labelledby="titulo-fichas-cidade" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 id="titulo-fichas-cidade" className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Fichas e Diagnósticos sobre {cidade.nome}
            </h2>
            <p className="text-sm text-muted">
              Documentos catalogados e auditorias socioambientais e financeiras
            </p>
          </div>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-semibold text-muted">
            {fichas.length} fichas vinculadas
          </span>
        </div>

        {fichas.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {fichas.map((f) => (
              <FichaCard key={f.id} ficha={f} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-muted">
            <p className="text-sm">
              Nenhuma ficha temática exclusiva cadastrada ainda para este município. Os dados cadastrais e cruzamentos estatísticos acima já estão ativos.
            </p>
          </div>
        )}

        {/* SUGESTÕES CRUZADAS INTERDISCIPLINARES */}
        {fichaDestaque && (
          <RelacaoSuggestions fichaAtual={fichaDestaque} />
        )}
      </section>

      {/* DOCUMENTOS RELACIONADOS E FONTES PRIMÁRIAS OFICIAIS */}
      <div className="mt-10">
        <DocumentosRelacionados
          documentos={obterDocumentosCidade(
            cidade.nome,
            cidade.uf,
            cidade.id_municipio,
            cidade.slug ?? cidade.id_municipio
          )}
          titulo={`Fontes Oficiais & Documentos Relacionados — ${cidade.nome}/${cidade.uf}`}
          subtitulo={`Hiperlinks e fontes primárias verificadas para fiscalização popular direta em ${cidade.nome}.`}
        />
      </div>
    </EixoLayout>
  );
}
