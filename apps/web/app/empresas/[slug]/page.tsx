import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Clock,
  Calendar,
  Layers,
  MapPin,
  ExternalLink,
  Users,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Sparkles,
  Download,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { listarTodasEntidades, obterEntidadePorSlug } from "@/lib/empresas/entidades-dados";
import { obterEmpresa, EMPRESAS } from "@/lib/empresas/dados";
import { processosPorEmpresa } from "@/lib/empresas/sigmine";
import { NOTICIAS_SIGMA_LITHIUM, NOTICIAS_VALE } from "@/lib/empresas/noticias";
import { listarDocumentosPorEmpresa } from "@/lib/empresas/empresas-documentos";
import { listarDocumentosAcademicos } from "@/lib/biblioteca/unificada";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const todas = listarTodasEntidades();
  const slugs = new Set<string>();

  for (const e of todas) {
    if (e.slug) slugs.add(e.slug);
  }
  for (const emp of EMPRESAS) {
    if (emp.slug) slugs.add(emp.slug);
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entidade = obterEntidadePorSlug(slug);
  const empresaLegada = obterEmpresa(slug);

  const nome = entidade?.nome || empresaLegada?.nomeCurto || "Empresa Monitorada";
  const descricao = entidade?.investimentoBrasil || empresaLegada?.descricao || "Ficha técnica e auditoria cívica no Controle Popular.";

  return {
    title: `${nome} — Ações, ESG, Contratos e Fiscalização Cívica`,
    description: `${descricao.slice(0, 160)}...`,
  };
}

export default async function EmpresaPage({ params }: Props) {
  const { slug } = await params;
  const entidade = obterEntidadePorSlug(slug);
  const empresaLegada = obterEmpresa(slug);

  if (!entidade && !empresaLegada) notFound();

  const nome = entidade?.nome || empresaLegada?.nome || slug;
  const ticker = entidade?.ticker;
  const setor = entidade?.setorRotulo || "Setor Estratégico";
  const cnpj = entidade?.cnpj || empresaLegada?.cnpj;
  const cik = entidade?.cik;
  const bolsa = entidade?.bolsa || "B3 / Mercado de Capitais";

  // Processos SIGMINE se for mineradora
  const sinonimos = empresaLegada?.sinonimosSigmine || [nome.toUpperCase(), slug.toUpperCase()];
  const processos = await processosPorEmpresa(sinonimos);

  // Notícias
  const noticias = slug === "sigma-lithium" ? NOTICIAS_SIGMA_LITHIUM : slug === "vale" || slug === "vale-s-a" ? NOTICIAS_VALE : [];

  // Documentos no acervo R2
  let documentos = listarDocumentosPorEmpresa(slug);
  if (documentos.length === 0 && entidade?.slug) {
    documentos = listarDocumentosPorEmpresa(entidade.slug);
  }

  // Pesquisa acadêmica relacionada a esta empresa ou bacia
  const termoBuscaAcad = slug.includes("vale") ? "Vale" : slug.includes("sigma") ? "Sigma" : nome;
  const docsAcademicos = listarDocumentosAcademicos().filter(
    (d) =>
      d.entidade.toLowerCase().includes(termoBuscaAcad.toLowerCase()) ||
      d.tema.toLowerCase().includes(termoBuscaAcad.toLowerCase()) ||
      d.titulo.toLowerCase().includes(termoBuscaAcad.toLowerCase()) ||
      d.palavrasChave.some((p) => p.toLowerCase().includes(termoBuscaAcad.toLowerCase()))
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14 sm:px-6 lg:px-8 space-y-10">
      {/* ═══ NAVEGAÇÃO E BREADCRUMB ═══ */}
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/empresas" className="hover:text-primary transition">
          Observatório de Empresas & Fundos
        </Link>{" "}
        · <span className="text-foreground font-semibold">{nome}</span>
      </nav>

      {/* ═══ CABEÇALHO DO PERFIL ═══ */}
      <header className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {setor}
            </span>
            {ticker && (
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                Ticker: {ticker} ({bolsa})
              </span>
            )}
            {entidade?.tipo && (
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted uppercase">
                {entidade.tipo.replace("_", " ")}
              </span>
            )}
          </div>

          <Link
            href={`/assistente?pergunta=O que o Controle Popular tem de informação sobre a empresa ${encodeURIComponent(nome)}?`}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:border-primary hover:bg-primary/5 transition shadow-2xs"
          >
            <Sparkles size={14} />
            <span>Perguntar ao Seu Nonô</span>
          </Link>
        </div>

        <div>
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            {nome}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted leading-relaxed">
            {entidade?.investimentoBrasil || empresaLegada?.descricao}
          </p>
        </div>

        {/* Metadados Chave */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/70 sm:grid-cols-4 sm:gap-4 text-xs">
          <div>
            <span className="text-muted block">Identificador Fiscal:</span>
            <span className="font-mono font-bold text-foreground">{cnpj ? `CNPJ ${cnpj}` : cik ? `CIK SEC ${cik}` : "Sob verificação"}</span>
          </div>
          <div>
            <span className="text-muted block">Bolsa / Mercado:</span>
            <span className="font-semibold text-foreground">{bolsa}</span>
          </div>
          <div>
            <span className="text-muted block">Risco Ambiental ESG:</span>
            <span className={`font-bold ${entidade?.esg.riscoAmbiental === "Crítico" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {entidade?.esg.riscoAmbiental || "Monitorado"}
            </span>
          </div>
          <div>
            <span className="text-muted block">Governança Corporativa:</span>
            <span className="font-semibold text-foreground">{entidade?.esg.governancaNivel || "Padrão CVM"}</span>
          </div>
        </div>
      </header>

      {/* ═══ 1. AÇÕES, MERCADO & RELAÇÕES COM INVESTIDORES ═══ */}
      <section aria-labelledby="secao-mercado" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <TrendingUp size={18} className="text-primary" />
          <h2 id="secao-mercado" className="font-display text-lg font-bold text-foreground">
            Mercado de Capitais, Ações & Cotações
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-border/70 bg-surface-2 p-3.5 space-y-1">
            <span className="text-muted">Ticker Principal</span>
            <div className="font-mono text-base font-bold text-foreground">{ticker || "Sem cotação aberta"}</div>
            <p className="text-[11px] text-muted">Negociado na {bolsa}</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface-2 p-3.5 space-y-1">
            <span className="text-muted">Valor de Mercado / Ativos</span>
            <div className="font-semibold text-foreground">{entidade?.valorMercadoEstimado || "Relatórios anuais DFP / CVM"}</div>
            <p className="text-[11px] text-muted">Demonstrações Financeiras Padronizadas</p>
          </div>

          <div className="rounded-xl border border-border/70 bg-surface-2 p-3.5 space-y-1">
            <span className="text-muted">Canal Oficial de RI</span>
            <div>
              <a
                href={entidade?.contatos?.ri || "https://dados.cvm.gov.br/"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <span>Acessar Portal CVM / RI</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p className="text-[11px] text-muted">Fatos relevantes e comunicados</p>
          </div>
        </div>
      </section>

      {/* ═══ 2. TRANSPARÊNCIA, SÓCIOS & GOVERNANÇA CORPORATIVA ═══ */}
      <section aria-labelledby="secao-governanca" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Users size={18} className="text-primary" />
          <h2 id="secao-governanca" className="font-display text-lg font-bold text-foreground">
            Transparência, Sócios & Governança
          </h2>
        </div>

        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-muted">
            Estrutura de liderança, conselho de administração e representação institucional registrada perante órgãos reguladores:
          </p>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
            {entidade?.diretoresESocios && entidade.diretoresESocios.length > 0 ? (
              entidade.diretoresESocios.map((dir, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-2 px-3 py-2.5">
                  <span className="font-medium text-foreground">{dir.nome}</span>
                  <span className="rounded bg-surface px-2 py-0.5 font-mono text-[11px] text-muted">{dir.cargo}</span>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-xs text-muted">
                Governança disponível nos relatórios anuais da CVM / SEC.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ═══ 3. ESG: AMBIENTAL, SOCIAL E DIREITOS HUMANOS ═══ */}
      <section aria-labelledby="secao-esg" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <ShieldAlert size={18} className="text-alert" />
          <h2 id="secao-esg" className="font-display text-lg font-bold text-foreground">
            ESG, Direitos Humanos & Impactos Socioambientais
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          {/* Pilar Ambiental */}
          <div className="rounded-xl border border-border/70 bg-surface-2 p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Pilar Ambiental</span>
            </div>
            <p className="text-muted leading-relaxed">
              {entidade?.esg.impactoSocioambiental || "Vigilância de áreas de concessão, supressão de vegetação e consumo de recursos hídricos."}
            </p>
          </div>

          {/* Pilar Social e Direitos Humanos */}
          <div className="rounded-xl border border-border/70 bg-surface-2 p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Social & Direitos Humanos</span>
            </div>
            <p className="text-muted leading-relaxed">
              {entidade?.esg.direitosHumanos || "Cumprimento de acordos coletivos, impactos em vizinhanças e respeito a povos e comunidades tradicionais."}
            </p>
          </div>

          {/* Pilar Governança */}
          <div className="rounded-xl border border-border/70 bg-surface-2 p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Pilar Governança</span>
            </div>
            <p className="text-muted leading-relaxed">
              {entidade?.esg.conformidadeLegal || "Monitoramento de conformidade jurídica, auditorias externas e canais de denúncia."}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ DOCUMENTOS PÚBLICOS, RELATÓRIOS ESG E PRESTAÇÃO DE CONTAS ═══ */}
      {documentos.length > 0 && (
        <section aria-labelledby="secao-documentos" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              <h2 id="secao-documentos" className="font-display text-lg font-bold text-foreground">
                Documentos Oficiais, Relatórios ESG & Prestação de Contas ({documentos.length})
              </h2>
            </div>
            <Link
              href="/empresas/documentos"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Ver todos os 520 documentos do acervo →
            </Link>
          </div>

          <p className="text-xs text-muted">
            Relatórios auditados arquivados com espelho redundante no Cloudflare R2 e link direto para os registros da CVM, SEC ou canal oficial de Relações com Investidores:
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            {documentos.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border/70 bg-surface-2 p-3.5 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                      {doc.tipoDocumentoRotulo}
                    </span>
                    <span className="font-mono text-[11px] text-muted font-bold">{doc.ano}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-xs">{doc.titulo}</h3>
                  <p className="text-muted text-sm leading-relaxed line-clamp-3">{doc.microResumo}</p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-muted">{doc.tamanhoFormatado}</span>
                  <div className="flex items-center gap-3">
                    <a
                      href={doc.urlOficial || doc.urlR2}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      <span>Acessar Documento</span>
                      <ExternalLink size={11} />
                    </a>
                    {doc.urlR2 && !doc.urlR2.includes("arquivos.controlepopular.com.br") && (
                      <a
                        href={doc.urlR2}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted hover:text-foreground hover:underline"
                      >
                        <span>Espelho</span>
                        <Download size={10} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ PESQUISA ACADÊMICA & NOTAS TÉCNICAS (SCIELO / UNIVERSIDADES) ═══ */}
      {docsAcademicos.length > 0 && (
        <section aria-labelledby="secao-academico" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 id="secao-academico" className="font-display text-lg font-bold text-foreground">
                Pesquisa Científica, Teses & Notas Técnicas ({docsAcademicos.length})
              </h2>
            </div>
            <Link
              href="/biblioteca"
              className="text-xs font-semibold text-primary hover:underline"
            >
              Consultar Biblioteca Geral →
            </Link>
          </div>

          <p className="text-xs text-muted">
            Artigos científicos indexados no SciELO, dissertações e teses de pós-graduação (UFMG, UFV, UnB, Fiocruz, USP e IPEA) sobre os impactos socioambientais e econômicos desta atividade:
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            {docsAcademicos.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-border/70 bg-surface-2 p-3.5 space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                      {doc.tipoRotulo}
                    </span>
                    <span className="font-mono text-[11px] text-muted font-bold">{doc.ano}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-xs leading-snug">{doc.titulo}</h3>
                  <p className="text-muted text-[11px]">
                    <span className="font-semibold text-foreground">{doc.entidade}</span> — {doc.autor}
                  </p>
                  <p className="text-muted text-sm leading-relaxed line-clamp-3">{doc.microResumo}</p>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted font-medium">{doc.tema}</span>
                  <div className="flex items-center gap-3">
                    {doc.urlPdf && (
                      <a
                        href={doc.urlPdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      >
                        <span>PDF</span>
                        <Download size={11} />
                      </a>
                    )}
                    <a
                      href={doc.urlOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-muted hover:text-foreground hover:underline"
                    >
                      <span>Oficial</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 4. LICENCIAMENTOS, PROCESSOS MINERÁRIOS & CONTRATOS ═══ */}
      <section aria-labelledby="secao-licencas" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <FileText size={18} className="text-primary" />
          <h2 id="secao-licencas" className="font-display text-lg font-bold text-foreground">
            Licenciamentos, Processos & Contratos Públicos
          </h2>
        </div>

        <div className="space-y-4 text-xs">
          {/* Tabela de Licenciamentos */}
          <div>
            <h3 className="font-bold text-foreground mb-2">Processos de Licenciamento & Outorgas</h3>
            <div className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-left">
                <thead className="bg-surface-2 text-[11px] text-muted uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Órgão</th>
                    <th className="py-2.5 px-3">Processo</th>
                    <th className="py-2.5 px-3">Empreendimento</th>
                    <th className="py-2.5 px-3">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {entidade?.licenciamentos && entidade.licenciamentos.length > 0 ? (
                    entidade.licenciamentos.map((lic, idx) => (
                      <tr key={idx} className="hover:bg-surface-2/40">
                        <td className="py-2.5 px-3 font-semibold text-foreground">{lic.orgao}</td>
                        <td className="py-2.5 px-3 font-mono">{lic.processo}</td>
                        <td className="py-2.5 px-3">{lic.empreendimento}</td>
                        <td className="py-2.5 px-3 font-medium text-emerald-600 dark:text-emerald-400">{lic.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-3 px-3 text-center text-muted">
                        Nenhum licenciamento cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Processos SIGMINE (se mineradora com dados) */}
          {processos.length > 0 && (
            <div className="pt-2">
              <h3 className="font-bold text-foreground mb-2">
                Processos Minerários Mapeados no SIGMINE/ANM ({processos.length})
              </h3>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border/60 divide-y divide-border/60">
                {processos.slice(0, 10).map((proc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-2.5 hover:bg-surface-2/40">
                    <div>
                      <span className="font-mono font-bold text-foreground">{proc.numero || proc.processo}</span>
                      <span className="text-muted ml-2">({proc.fase || "Fase minerária"})</span>
                    </div>
                    <span className="text-muted font-mono">{proc.substancia || "Minério"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══ 5. TACS & TERMOS DE AJUSTAMENTO DE CONDUTA ═══ */}
      {entidade?.tacs && entidade.tacs.length > 0 && (
        <section aria-labelledby="secao-tacs" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Scale size={18} className="text-primary" />
            <h2 id="secao-tacs" className="font-display text-lg font-bold text-foreground">
              Termos de Ajustamento de Conduta (TACs) & Ações Civis
            </h2>
          </div>

          <div className="space-y-2.5 text-xs">
            {entidade.tacs.map((tac, idx) => (
              <div key={idx} className="rounded-xl border border-border/70 bg-surface-2 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{tac.orgao} ({tac.ano})</span>
                  <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                    {tac.status}
                  </span>
                </div>
                <p className="text-muted leading-relaxed">{tac.objeto}</p>
                {tac.valor && <p className="text-muted">Valor / Obrigações: <span className="text-foreground font-semibold">{tac.valor}</span></p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ 6. LINHA DO TEMPO HISTÓRICA ═══ */}
      {entidade?.linhaDoTempo && entidade.linhaDoTempo.length > 0 && (
        <section aria-labelledby="secao-timeline" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Clock size={18} className="text-primary" />
            <h2 id="secao-timeline" className="font-display text-lg font-bold text-foreground">
              Linha do Tempo & Fatos Relevantes
            </h2>
          </div>

          <div className="space-y-4 relative pl-6 border-l-2 border-border/80">
            {entidade.linhaDoTempo.map((evento, idx) => (
              <div key={idx} className="relative space-y-1">
                <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-surface bg-primary" />
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{evento.ano}</span>
                  <h3 className="font-bold text-xs sm:text-sm text-foreground">{evento.titulo}</h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">{evento.descricao}</p>
                {evento.fonte && <span className="text-[10px] text-muted">Fonte: {evento.fonte}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ NOTÍCIAS CURADAS ═══ */}
      {noticias.length > 0 && (
        <section aria-labelledby="secao-noticias" className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Calendar size={18} className="text-primary" />
            <h2 id="secao-noticias" className="font-display text-lg font-bold text-foreground">
              Notícias & Radar de Investigação
            </h2>
          </div>

          <div className="space-y-3">
            {noticias.map((n, i) => (
              <article key={i} className="rounded-xl border border-border/60 bg-surface-2 p-3.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>{n.data}</span>
                  <span className="font-semibold">{n.veiculo}</span>
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-foreground">
                  <a href={n.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition inline-flex items-center gap-1">
                    <span>{n.titulo}</span>
                    <ExternalLink size={12} />
                  </a>
                </h3>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
