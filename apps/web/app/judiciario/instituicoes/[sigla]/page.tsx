import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Scale,
  ShieldCheck,
  HeartHandshake,
  Gavel,
  Building,
  Users,
  Landmark,
  UserCheck,
  PhoneCall,
  FileText,
  AlertTriangle,
  ArrowLeft,
  Coins,
  Compass,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Globe,
} from "lucide-react";
import instituicoesData from "@/data/judiciario-instituicoes-detalhe.json";
import TabelaInstituicaoClient from "./TabelaInstituicaoClient";

interface Props {
  params: Promise<{ sigla: string }>;
}

export function generateStaticParams() {
  return instituicoesData.map((inst) => ({
    sigla: inst.sigla,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sigla } = await params;
  const inst = instituicoesData.find((i) => i.sigla === sigla.toLowerCase());
  if (!inst) return { title: "Instituição não encontrada | Controle Popular" };

  return {
    title: `${inst.sigla.toUpperCase()} — Organograma, Orçamento e Ouvidoria | Controle Popular`,
    description: `Ficha pública e análise institucional do ${inst.nome} (${inst.sigla.toUpperCase()}): coordenação, estrutura funcional, orçamento de ${inst.orcamento.total}, canais de ouvidoria e documentos-chave.`,
  };
}

export default async function InstituicaoPage({ params }: Props) {
  const { sigla } = await params;
  const inst = instituicoesData.find((i) => i.sigla === sigla.toLowerCase());
  if (!inst) notFound();

  // Mapeamento de ícones Lucide
  const IconePrincipal =
    inst.sigla === "tjmg"
      ? Scale
      : inst.sigla === "mpmg"
        ? ShieldCheck
        : inst.sigla === "dpmg"
          ? HeartHandshake
          : inst.sigla === "trt3"
            ? Gavel
            : inst.sigla === "trf6"
              ? Building
              : inst.sigla === "dpu"
                ? Users
                : Landmark;

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12"
    >
      {/* Navegação de retorno */}
      <nav aria-label="Navegação estrutural" className="mb-6">
        <Link
          href="/judiciario/instituicoes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-soft transition-colors hover:text-primary"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Voltar para Quem Fiscaliza a Justiça
        </Link>
      </nav>

      {/* Cabeçalho da Instituição */}
      <header className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `color-mix(in srgb, ${inst.cor} 15%, transparent)`,
                color: inst.cor,
                border: `1px solid color-mix(in srgb, ${inst.cor} 35%, transparent)`,
              }}
            >
              <IconePrincipal size={24} aria-hidden="true" />
            </div>
            <div>
              <span className="inline-block rounded border border-border px-2 py-0.5 text-[0.9em] font-bold uppercase tracking-wider text-text-soft">
                {inst.esfera} · {inst.tipo}
              </span>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-text">
                {inst.nome} ({inst.sigla.toUpperCase()})
              </h1>
            </div>
          </div>
          <span
            className="rounded-full px-3 py-1 font-mono text-xs font-bold"
            style={{
              backgroundColor: `color-mix(in srgb, ${inst.cor} 12%, transparent)`,
              color: inst.cor,
            }}
          >
            Orçamento: {inst.orcamento.total}
          </span>
        </div>
      </header>

      {/* Grade de 2 colunas: Liderança e Pessoal */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Liderança e Gestão */}
        <section aria-labelledby="secao-lideranca" className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <UserCheck size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-lideranca" className="font-display text-lg font-bold text-text">
              Coordenação & Liderança
            </h2>
          </div>
          <div className="mt-4 space-y-2.5 text-sm">
            <div>
              <p className="text-xs font-medium text-text-soft">{inst.lideranca.cargo}</p>
              <p className="font-bold text-text">{inst.lideranca.nome}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-soft">Mandato</p>
              <p className="text-text">{inst.lideranca.mandato}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-soft">Forma de Investidura</p>
              <p className="text-xs text-text-soft">{inst.lideranca.investidura}</p>
            </div>
          </div>
        </section>

        {/* Estrutura de Pessoal */}
        <section aria-labelledby="secao-pessoal" className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-pessoal" className="font-display text-lg font-bold text-text">
              Estrutura de Pessoal
            </h2>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-text-soft">Membros / Magistrados</span>
              <span className="font-semibold text-text">{inst.estruturaPessoal.magistrados}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-text-soft">Servidores Concursados</span>
              <span className="font-semibold text-text">{inst.estruturaPessoal.servidoresEfetivos}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-text-soft">Cargos em Comissão</span>
              <span className="font-semibold text-text">{inst.estruturaPessoal.comissionados}</span>
            </div>
            <div className="flex justify-between border-b border-border/50 pb-1.5">
              <span className="text-text-soft">Estagiários e Apoio</span>
              <span className="font-semibold text-text">{inst.estruturaPessoal.estagiariosETerceirizados}</span>
            </div>
            <div className="pt-1 text-xs text-text-soft">
              📍 {inst.estruturaPessoal.comarcasInstaladas}
            </div>
          </div>
        </section>
      </div>

      {/* Orçamento e Finanças */}
      <section aria-labelledby="secao-orcamento" className="mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-primary" aria-hidden="true" />
          <h2 id="secao-orcamento" className="font-display text-xl font-bold text-text">
            Orçamento Geral & Impacto Fiscal ({inst.orcamento.ano})
          </h2>
        </div>
        <p className="mt-1 text-xs text-text-soft">
          Valores fixados na Lei Orçamentária Anual e acompanhamento pelo Tribunal de Contas.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4">
            <p className="text-xs font-medium text-text-soft">Orçamento Total</p>
            <p className="mt-1 font-mono text-2xl font-black text-text">{inst.orcamento.total}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4">
            <p className="text-xs font-medium text-text-soft">Folha de Pagamento</p>
            <p className="mt-1 font-mono text-xl font-bold text-text">{inst.orcamento.folhaPessoal}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4">
            <p className="text-xs font-medium text-text-soft">Custeio & Investimento</p>
            <p className="mt-1 font-mono text-xl font-bold text-text">{inst.orcamento.custeioInvestimentos}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-text">
          <p>
            <strong>Fundo Especial:</strong> {inst.orcamento.fundoEspecial}
          </p>
          <p className="mt-1 text-text-soft">
            <strong>Impacto na LRF:</strong> {inst.orcamento.impactoLRF}
          </p>
        </div>
      </section>

      {/* Organograma Funcional */}
      <section aria-labelledby="secao-organograma" className="mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2">
          <Compass size={18} className="text-primary" aria-hidden="true" />
          <h2 id="secao-organograma" className="font-display text-xl font-bold text-text">
            Organograma & Função das Áreas
          </h2>
        </div>
        <p className="mt-1 text-xs text-text-soft">
          Resumo do papel de cada diretoria, câmara e setor no funcionamento da instituição.
        </p>

        <div className="mt-4 space-y-3">
          {inst.organograma.map((item: any, idx: number) => (
            <div
              key={idx}
              className="rounded-xl border border-border/60 bg-surface-2/30 p-4 transition-colors hover:border-border"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <h3 className="font-display text-sm font-bold text-text">{item.area}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-soft">{item.funcao}</p>
                </div>
                {item.site && (
                  <a
                    href={item.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-[0.9em] font-semibold text-primary transition-colors hover:bg-surface-2"
                    title={`Acessar portal de ${item.area}`}
                  >
                    <span>Portal da Área</span>
                    <ExternalLink size={10} aria-hidden="true" />
                  </a>
                )}
              </div>

              {(item.telefone || item.email || item.endereco) && (
                <div className="mt-3 grid grid-cols-1 gap-2 border-t border-border/40 pt-3 text-[0.9em] text-text-soft sm:grid-cols-3">
                  {item.telefone && (
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Phone size={12} className="text-primary shrink-0" aria-hidden="true" />
                      <a href={`tel:${item.telefone.replace(/[^\d+]/g, "")}`} className="font-mono text-text hover:text-primary truncate">
                        {item.telefone}
                      </a>
                    </div>
                  )}
                  {item.email && (
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Mail size={12} className="text-primary shrink-0" aria-hidden="true" />
                      <a href={`mailto:${item.email}`} className="text-text hover:text-primary underline truncate" title={item.email}>
                        {item.email}
                      </a>
                    </div>
                  )}
                  {item.endereco && (
                    <div className="flex items-center gap-1.5 sm:col-span-1 overflow-hidden">
                      <MapPin size={12} className="text-primary shrink-0" aria-hidden="true" />
                      <span className="truncate text-text" title={item.endereco}>
                        {item.endereco}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Corregedoria e Ouvidoria */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Corregedoria */}
        <section aria-labelledby="secao-corregedoria" className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-alert" aria-hidden="true" />
            <h2 id="secao-corregedoria" className="font-display text-lg font-bold text-text">
              Corregedoria & Disciplina
            </h2>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <p>
              <strong className="text-text">Órgão:</strong> {inst.corregedoria.orgao}
            </p>
            <p>
              <strong className="text-text">Titular:</strong> {inst.corregedoria.titular}
            </p>
            <p className="leading-relaxed text-text-soft">{inst.corregedoria.funcao}</p>
            <p className="pt-2">
              <span className="font-semibold text-text">Canal de denúncias:</span>{" "}
              <span className="text-text-soft">{inst.corregedoria.canalDenuncias}</span>
            </p>
          </div>
        </section>

        {/* Ouvidoria e Atendimento Popular */}
        <section aria-labelledby="secao-ouvidoria" className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <PhoneCall size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-ouvidoria" className="font-display text-lg font-bold text-text">
              Ouvidoria & Contato
            </h2>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <p>
              <strong className="text-text">Canal:</strong> {inst.ouvidoria.canal}
            </p>
            <p>
              <strong className="text-text">Telefone:</strong> {inst.ouvidoria.telefone}
            </p>
            <p>
              <strong className="text-text">Endereço:</strong> {inst.ouvidoria.endereco}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {inst.ouvidoria.balcaoVirtual && (
                <a
                  href={inst.ouvidoria.balcaoVirtual}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border px-3 py-1 font-semibold text-primary transition-colors hover:bg-surface-2"
                >
                  Balcão Virtual ↗
                </a>
              )}
              {inst.ouvidoria.portalOuvidoria && (
                <a
                  href={inst.ouvidoria.portalOuvidoria}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  Registrar Reclamação ↗
                </a>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Documentos-Chave */}
      {inst.documentosChave && inst.documentosChave.length > 0 && (
        <section aria-labelledby="secao-documentos" className="mt-6 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-documentos" className="font-display text-xl font-bold text-text">
              Documentos-Chave & Acesso Oficial
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Atos, relatórios correcionais e demonstrativos públicos auditados pelo portal.
          </p>

          <div className="mt-4 space-y-3">
            {inst.documentosChave.map((doc, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border/60 bg-surface-2/30 p-4"
              >
                <div>
                  <h3 className="font-bold text-sm text-text">{doc.titulo}</h3>
                  <p className="mt-0.5 text-xs text-text-soft">{doc.descricao}</p>
                </div>
                <a
                  href={doc.url}
                  target={doc.url.startsWith("http") ? "_blank" : undefined}
                  rel={doc.url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
                >
                  Acessar Documento →
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Atalho para o Guia de Varas e Balcão Virtual */}
      <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs transition-colors hover:border-primary/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
              <PhoneCall size={14} aria-hidden="true" />
              Atendimento e Varas Judiciais
            </span>
            <h3 className="font-display text-base font-bold text-text">
              Precisa falar com uma Vara, Gabinete ou Balcão Virtual?
            </h3>
            <p className="text-xs text-text-soft">
              Consulte nosso catálogo nacional com telefones com DDD, e-mails, endereços com CEP e titulares da Justiça Estadual, Federal e do Trabalho.
            </p>
          </div>
          <Link
            href="/judiciario/contatos"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90"
          >
            <span>Consultar Guia de Varas</span>
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Painel Interativo de Atos e Notícias Monitorados (5 elementos do AGENTS.md) */}
      <TabelaInstituicaoClient instituicao={inst as any} />

      {/* Navegação entre as instituições irmãs */}
      <nav aria-label="Outras instituições do Sistema de Justiça" className="mt-12 border-t border-border pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            {inst.uf ? `Outras Instituições em ${inst.uf} e na Região ${inst.regiao || ""}` : "Instituições do Sistema de Justiça"}
          </p>
          <Link
            href="/judiciario/instituicoes"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver Mapa Completo dos 27 Estados →
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {instituicoesData
            .filter((i) => i.sigla !== inst.sigla && (i.uf === inst.uf || (i.regiao && i.regiao === inst.regiao)))
            .slice(0, 16)
            .map((i) => (
              <Link
                key={i.sigla}
                href={`/judiciario/instituicoes/${i.sigla}`}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
              >
                {i.sigla.toUpperCase()} {i.uf ? `(${i.uf})` : ""}
              </Link>
            ))}
        </div>
      </nav>
    </main>
  );
}
