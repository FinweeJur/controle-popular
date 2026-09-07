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
} from '@/lib/cidades/estrategicas';
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

  // Calcula cruzamentos leigos do Data Ocean para a cidade
  const cruzamentos = calcularCruzamentosMunicipais({
    codIbge7: cidade.id_municipio,
    nome: cidade.nome,
    uf: cidade.uf,
    populacao: cidade.tipo === 'capital' ? 1200000 : 150000,
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
              CNPJ: {cidade.cnpj_prefeitura ?? 'Sob apuração cadastral'}
            </span>
            {cidade.prefeitura_host && (
              <a
                href={cidade.prefeitura_host}
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
              CNPJ: {cidade.cnpj_camara ?? 'Sob apuração cadastral'}
            </span>
            {cidade.camara_host && (
              <a
                href={cidade.camara_host}
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
            {cidade.diario_oficial ? (
              <a
                href={cidade.diario_oficial}
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
              Sistema Legislativo: {cidade.camara_sistema ?? 'Padrão'}
            </span>
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
