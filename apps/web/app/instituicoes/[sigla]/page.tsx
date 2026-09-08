import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Scale,
  ShieldAlert,
  Users,
  Building,
  UserCheck,
  PhoneCall,
  FileText,
  ArrowLeft,
  Coins,
  Compass,
  HeartPulse,
  GraduationCap,
  Trees,
  Truck,
  Building2,
  Mail,
  MapPin,
  ExternalLink,
  Newspaper,
  Calendar,
} from "lucide-react";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  obterTodasInstituicoes,
  obterInstituicao,
  obterNoticiasDaInstituicao,
} from "@/lib/instituicoes/catalogo";

interface Props {
  params: Promise<{ sigla: string }>;
}

export function generateStaticParams() {
  const todas = obterTodasInstituicoes();
  return todas.map((inst) => ({
    sigla: inst.sigla,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sigla } = await params;
  const inst = obterInstituicao(sigla);
  if (!inst) return { title: "Instituição não encontrada | Controle Popular" };

  return {
    title: `${inst.nome} (${inst.sigla.toUpperCase()}) — Organograma, Funções e Contatos | Controle Popular`,
    description: `Ficha pública de ${inst.nome} (${inst.sigla.toUpperCase()}): organograma, atribuições de cada área, orçamento de ${inst.orcamento.total}, telefone, e-mail, endereço e ouvidoria oficial.`,
  };
}

export default async function InstituicaoDetalhePage({ params }: Props) {
  const { sigla } = await params;
  const inst = obterInstituicao(sigla);
  if (!inst) notFound();

  const noticiasConectadas = obterNoticiasDaInstituicao(sigla);
  const todasInstituicoes = obterTodasInstituicoes();

  // Ícone por sigla
  const renderIcone = () => {
    switch (inst.sigla.toLowerCase()) {
      case "fazenda":
      case "sef-mg":
        return <Coins size={24} aria-hidden="true" />;
      case "saude":
      case "ses-mg":
      case "smsa-bh":
        return <HeartPulse size={24} aria-hidden="true" />;
      case "mec":
        return <GraduationCap size={24} aria-hidden="true" />;
      case "mma":
      case "semad-mg":
        return <Trees size={24} aria-hidden="true" />;
      case "transportes":
      case "smobi-bh":
        return <Truck size={24} aria-hidden="true" />;
      case "camara-dos-deputados":
      case "senado-federal":
      case "almg":
      case "cmbh":
        return <Building2 size={24} aria-hidden="true" />;
      case "stf":
      case "tjmg":
        return <Scale size={24} aria-hidden="true" />;
      case "mpmg":
        return <ShieldAlert size={24} aria-hidden="true" />;
      case "dpmg":
        return <Users size={24} aria-hidden="true" />;
      default:
        return <Building size={24} aria-hidden="true" />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-0">
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12"
      >
        {/* Navegação de retorno */}
        <nav aria-label="Navegação estrutural" className="mb-6 flex items-center justify-between">
          <Link
            href="/instituicoes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-soft transition-colors hover:text-primary"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Voltar ao Catálogo de Instituições
          </Link>

          <span className="text-[11px] text-text-soft">
            Esfera {inst.esfera} · {inst.poder}
          </span>
        </nav>

        {/* Cabeçalho da Instituição */}
        <header className="rounded-2xl border border-border bg-surface-1 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${inst.cor} 15%, transparent)`,
                  color: inst.cor,
                  border: `1px solid color-mix(in srgb, ${inst.cor} 35%, transparent)`,
                }}
              >
                {renderIcone()}
              </div>
              <div>
                <span className="inline-block rounded border border-border bg-surface-2 px-2 py-0.5 text-[0.68em] font-bold uppercase tracking-wider text-text-soft">
                  {inst.esfera} · {inst.poder} · {inst.tipo}
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
          <section
            aria-labelledby="secao-lideranca"
            className="rounded-2xl border border-border bg-surface-1 p-6 shadow-xs"
          >
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
          <section
            aria-labelledby="secao-pessoal"
            className="rounded-2xl border border-border bg-surface-1 p-6 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary" aria-hidden="true" />
              <h2 id="secao-pessoal" className="font-display text-lg font-bold text-text">
                Quadro de Pessoal
              </h2>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {inst.estruturaPessoal.magistrados && (
                <div className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-text-soft">Membros / Magistrados</span>
                  <span className="font-semibold text-text">
                    {inst.estruturaPessoal.magistrados}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-text-soft">Servidores Concursados</span>
                <span className="font-semibold text-text">
                  {inst.estruturaPessoal.servidoresEfetivos}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-text-soft">Cargos em Comissão</span>
                <span className="font-semibold text-text">
                  {inst.estruturaPessoal.comissionados}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-1.5">
                <span className="text-text-soft">Estagiários e Apoio</span>
                <span className="font-semibold text-text">
                  {inst.estruturaPessoal.estagiariosETerceirizados}
                </span>
              </div>
              {inst.estruturaPessoal.comarcasInstaladas && (
                <div className="pt-1 text-xs text-text-soft">
                  📍 {inst.estruturaPessoal.comarcasInstaladas}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Orçamento e Finanças */}
        <section
          aria-labelledby="secao-orcamento"
          className="mt-6 rounded-2xl border border-border bg-surface-1 p-6 sm:p-8 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-orcamento" className="font-display text-xl font-bold text-text">
              Orçamento Anual & Impacto Fiscal ({inst.orcamento.ano})
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Valores fixados na Lei Orçamentária Anual (LOA) e acompanhamento pelo Tribunal de Contas.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4">
              <p className="text-xs font-medium text-text-soft">Orçamento Total</p>
              <p className="mt-1 font-mono text-2xl font-black text-text">{inst.orcamento.total}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4">
              <p className="text-xs font-medium text-text-soft">Folha de Pagamento</p>
              <p className="mt-1 font-mono text-xl font-bold text-text">
                {inst.orcamento.folhaPessoal}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4">
              <p className="text-xs font-medium text-text-soft">Custeio & Investimento</p>
              <p className="mt-1 font-mono text-xl font-bold text-text">
                {inst.orcamento.custeioInvestimentos}
              </p>
            </div>
          </div>

          {(inst.orcamento.fundoEspecial || inst.orcamento.impactoLRF) && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-text">
              {inst.orcamento.fundoEspecial && (
                <p>
                  <strong>Fundo Especial:</strong> {inst.orcamento.fundoEspecial}
                </p>
              )}
              {inst.orcamento.impactoLRF && (
                <p className="mt-1 text-text-soft">
                  <strong>Impacto na LRF:</strong> {inst.orcamento.impactoLRF}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Organograma Funcional */}
        <section
          aria-labelledby="secao-organograma"
          className="mt-6 rounded-2xl border border-border bg-surface-1 p-6 sm:p-8 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Compass size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-organograma" className="font-display text-xl font-bold text-text">
              Organograma & Papel de Cada Setor
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Estrutura interna com as responsabilidades práticas de cada secretaria-adjunta, diretoria e departamento.
          </p>

          <div className="mt-4 space-y-3">
            {inst.organograma.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border/60 bg-surface-2/30 p-4 transition-colors hover:border-border"
              >
                <h3 className="font-display text-sm font-bold text-text">{item.area}</h3>
                <p className="mt-1 text-xs leading-relaxed text-text-soft">{item.funcao}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Competências e Funções Legais */}
        <section
          aria-labelledby="secao-funcoes"
          className="mt-6 rounded-2xl border border-border bg-surface-1 p-6 sm:p-8 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-funcoes" className="font-display text-xl font-bold text-text">
              Competências Legais da Pasta
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Atribuições definidas em lei para a atuação institucional do órgão.
          </p>

          <ul className="mt-4 space-y-2 list-disc list-inside text-xs leading-relaxed text-text">
            {inst.funcoes.map((fnc, idx) => (
              <li key={idx} className="pl-1">
                {fnc}
              </li>
            ))}
          </ul>
        </section>

        {/* Contatos, Endereço e Ouvidoria */}
        <section
          aria-labelledby="secao-contatos"
          className="mt-6 rounded-2xl border border-border bg-surface-1 p-6 sm:p-8 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <PhoneCall size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-contatos" className="font-display text-xl font-bold text-text">
              Contatos Oficiais, Endereço e Atendimento ao Cidadão
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Canais públicos para solicitação de serviços, pedidos via Lei de Acesso à Informação (LAI) e denúncias.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4 space-y-2 text-xs">
              <div>
                <span className="font-semibold text-text-soft">Canal Principal:</span>
                <p className="mt-0.5 font-bold text-text">{inst.ouvidoria.canal}</p>
              </div>
              <div className="pt-2">
                <span className="font-semibold text-text-soft">Telefone:</span>
                <p className="mt-0.5 font-mono font-medium text-text">
                  <a href={`tel:${inst.ouvidoria.telefone.replace(/[^\d+]/g, "")}`} className="hover:text-primary">
                    {inst.ouvidoria.telefone}
                  </a>
                </p>
              </div>
              <div className="pt-2">
                <span className="font-semibold text-text-soft">E-mail Institucional:</span>
                <p className="mt-0.5 font-mono text-text">
                  <a href={`mailto:${inst.ouvidoria.email}`} className="hover:text-primary underline">
                    {inst.ouvidoria.email}
                  </a>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-surface-2/40 p-4 space-y-2 text-xs">
              <div>
                <span className="font-semibold text-text-soft">Endereço Completo:</span>
                <p className="mt-0.5 text-text leading-relaxed">{inst.ouvidoria.endereco}</p>
              </div>

              <div className="pt-3 flex flex-wrap gap-2">
                {inst.ouvidoria.portal && (
                  <a
                    href={inst.ouvidoria.portal}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface-1 px-3 py-1.5 font-semibold text-text transition-colors hover:border-primary hover:text-primary"
                  >
                    Portal Oficial ↗
                  </a>
                )}
                {inst.ouvidoria.sic && (
                  <a
                    href={inst.ouvidoria.sic}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    Ouvidoria / e-SIC ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Notícias e Ações da Secretaria Conectadas */}
        <section
          aria-labelledby="secao-noticias"
          className="mt-6 rounded-2xl border border-border bg-surface-1 p-6 sm:p-8 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Newspaper size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-noticias" className="font-display text-xl font-bold text-text">
              Notícias & Ações Recentes da Secretaria
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Releases oficiais da assessoria e matérias analíticas publicadas pelo portal.
          </p>

          <div className="mt-4 space-y-3">
            {noticiasConectadas.length === 0 ? (
              <p className="text-xs text-text-soft italic">
                Nenhuma notícia recente vinculada até o momento.
              </p>
            ) : (
              noticiasConectadas.map((noticia, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border/60 bg-surface-2/30 p-4 transition-colors hover:border-border"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-soft">
                    <span className="font-semibold text-primary">{noticia.fonte}</span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Calendar size={12} aria-hidden="true" />
                      {noticia.data}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-sm font-bold text-text">
                    <a
                      href={noticia.url}
                      target={noticia.url.startsWith("http") ? "_blank" : undefined}
                      rel={noticia.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="hover:text-primary transition-colors"
                    >
                      {noticia.titulo} {noticia.url.startsWith("http") ? "↗" : "→"}
                    </a>
                  </h3>
                  {noticia.resumo && (
                    <p className="mt-1 text-xs leading-relaxed text-text-soft">{noticia.resumo}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Documentos-Chave & Atos Oficiais */}
        <section
          aria-labelledby="secao-documentos"
          className="mt-6 rounded-2xl border border-border bg-surface-1 p-6 sm:p-8 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-primary" aria-hidden="true" />
            <h2 id="secao-documentos" className="font-display text-xl font-bold text-text">
              Documentos-Chave & Regimento Interno
            </h2>
          </div>
          <p className="mt-1 text-xs text-text-soft">
            Atos normativos, manuais e relatórios oficiais auditados pelo portal.
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
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
                >
                  Acessar Documento →
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Navegação entre outras instituições */}
        <nav
          aria-label="Outras instituições monitoradas"
          className="mt-10 border-t border-border pt-6"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-text-soft">
            Outras Instituições de {inst.esfera} ({inst.poder})
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {todasInstituicoes
              .filter((i) => i.sigla !== inst.sigla)
              .map((i) => (
                <Link
                  key={i.sigla}
                  href={`/instituicoes/${i.sigla}`}
                  className="rounded-lg border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
                >
                  {i.sigla.toUpperCase()}
                </Link>
              ))}
          </div>
        </nav>
      </main>

      <FooterGlobal />
    </div>
  );
}
