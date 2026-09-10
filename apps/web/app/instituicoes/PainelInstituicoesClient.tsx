"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { InstituicaoDetalhe, PoderPublico, EsferaGoverno } from "@/lib/instituicoes/tipos";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import {
  Building2,
  Scale,
  Users,
  HeartPulse,
  Coins,
  GraduationCap,
  Trees,
  Truck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Search,
  Download,
  Building,
  Gavel,
  ShieldAlert,
} from "lucide-react";

interface PainelInstituicoesClientProps {
  instituicoes: InstituicaoDetalhe[];
}

type FiltroPoder = "todos" | PoderPublico;
type FiltroEsfera = "todas" | EsferaGoverno;

export default function PainelInstituicoesClient({ instituicoes }: PainelInstituicoesClientProps) {
  const [filtroPoder, setFiltroPoder] = useState<FiltroPoder>("todos");
  const [filtroEsfera, setFiltroEsfera] = useState<FiltroEsfera>("todas");
  const [busca, setBusca] = useState<string>("");

  // Totais agregados
  const contagemGeral = useMemo(() => {
    let executivo = 0;
    let legislativo = 0;
    let judiciario = 0;
    let justica = 0;

    for (const inst of instituicoes) {
      if (inst.poder === "Executivo") executivo++;
      else if (inst.poder === "Legislativo") legislativo++;
      else if (inst.poder === "Judiciário") judiciario++;
      else if (inst.poder === "Sistema de Justiça") justica++;
    }

    return {
      total: instituicoes.length,
      executivo,
      legislativo,
      judiciario,
      justica,
    };
  }, [instituicoes]);

  // Filtragem
  const filtradas = useMemo(() => {
    return instituicoes.filter((inst) => {
      if (filtroPoder !== "todos" && inst.poder !== filtroPoder) return false;
      if (filtroEsfera !== "todas" && inst.esfera !== filtroEsfera) return false;

      if (busca.trim() !== "") {
        const termo = busca.toLowerCase();
        const texto = `${inst.sigla} ${inst.nome} ${inst.lideranca.nome} ${inst.tipo} ${inst.esfera} ${inst.poder} ${inst.funcoes.join(" ")}`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }
      return true;
    });
  }, [instituicoes, filtroPoder, filtroEsfera, busca]);

  // Download da planilha CSV
  const handleBaixarCsv = () => {
    interface LinhaInstituicaoCsv {
      sigla: string;
      nome: string;
      poder: string;
      esfera: string;
      tipo: string;
      cargoTitular: string;
      titular: string;
      orcamentoTotal: string;
      telefone: string;
      email: string;
      endereco: string;
      portal: string;
      ouvidoria: string;
    }

    const linhasCsv: LinhaInstituicaoCsv[] = filtradas.map((i) => ({
      sigla: i.sigla,
      nome: i.nome,
      poder: i.poder,
      esfera: i.esfera,
      tipo: i.tipo,
      cargoTitular: i.lideranca.cargo,
      titular: i.lideranca.nome,
      orcamentoTotal: i.orcamento.total,
      telefone: i.ouvidoria.telefone,
      email: i.ouvidoria.email,
      endereco: i.ouvidoria.endereco,
      portal: i.ouvidoria.portal || "",
      ouvidoria: i.ouvidoria.sic || "",
    }));

    const colunas: ColunaCsv<LinhaInstituicaoCsv>[] = [
      { chave: "sigla", rotulo: "Sigla" },
      { chave: "nome", rotulo: "Nome da Instituição" },
      { chave: "poder", rotulo: "Poder" },
      { chave: "esfera", rotulo: "Esfera" },
      { chave: "tipo", rotulo: "Tipo" },
      { chave: "cargoTitular", rotulo: "Cargo Titular" },
      { chave: "titular", rotulo: "Titular / Liderança" },
      { chave: "orcamentoTotal", rotulo: "Orçamento Anual" },
      { chave: "telefone", rotulo: "Telefone Oficial" },
      { chave: "email", rotulo: "E-mail de Contato" },
      { chave: "endereco", rotulo: "Endereço Completo" },
      { chave: "portal", rotulo: "Portal Oficial" },
      { chave: "ouvidoria", rotulo: "e-SIC / Ouvidoria" },
    ];

    baixarCsv(colunas, linhasCsv, "instituicoes-todas-esferas-controle-popular.csv");
  };

  // Mapeamento de ícones por nome ou sigla
  const renderIcone = (sigla: string) => {
    switch (sigla.toLowerCase()) {
      case "fazenda":
      case "sef-mg":
        return <Coins size={20} className="text-sky-600" aria-hidden="true" />;
      case "saude":
      case "ses-mg":
      case "smsa-bh":
        return <HeartPulse size={20} className="text-emerald-600" aria-hidden="true" />;
      case "mec":
        return <GraduationCap size={20} className="text-indigo-600" aria-hidden="true" />;
      case "mma":
      case "semad-mg":
        return <Trees size={20} className="text-teal-600" aria-hidden="true" />;
      case "transportes":
      case "smobi-bh":
        return <Truck size={20} className="text-amber-600" aria-hidden="true" />;
      case "camara-dos-deputados":
      case "senado-federal":
      case "almg":
      case "cmbh":
        return <Building2 size={20} className="text-purple-600" aria-hidden="true" />;
      case "stf":
      case "tjmg":
        return <Scale size={20} className="text-amber-700" aria-hidden="true" />;
      case "mpmg":
        return <ShieldAlert size={20} className="text-rose-600" aria-hidden="true" />;
      case "dpmg":
        return <Users size={20} className="text-blue-600" aria-hidden="true" />;
      default:
        return <Building size={20} className="text-text-soft" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* ═══ 1. CARTÕES DE TOPO (STATUS GERAL) ═══ */}
      <section id="resumo-esferas" aria-labelledby="metricas-orgaos" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-1 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-text-soft">
            Poder Executivo
          </span>
          <div className="mt-1 text-3xl font-bold text-text">{contagemGeral.executivo}</div>
          <p className="mt-1 text-xs text-text-soft">Ministérios e Secretarias</p>
        </div>

        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-purple-700 dark:text-purple-300">
            Poder Legislativo
          </span>
          <div className="mt-1 text-3xl font-bold text-purple-700 dark:text-purple-300">
            {contagemGeral.legislativo}
          </div>
          <p className="mt-1 text-xs text-text-soft">Congresso, Assembleia e Câmaras</p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Poder Judiciário
          </span>
          <div className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-300">
            {contagemGeral.judiciario}
          </div>
          <p className="mt-1 text-xs text-text-soft">Supremo e Tribunais de Justiça</p>
        </div>

        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-300">
            Sistema de Justiça
          </span>
          <div className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
            {contagemGeral.justica}
          </div>
          <p className="mt-1 text-xs text-text-soft">Ministério Público e Defensoria</p>
        </div>
      </section>

      {/* ═══ 2. FILTROS E BUSCA ═══ */}
      <section id="filtros-instituicoes" aria-labelledby="filtros-instituicoes-titulo" className="rounded-xl border border-border bg-surface-1 p-5 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por secretaria, ministério, sigla, titular ou área..."
              className="w-full rounded-lg border border-border bg-surface-0 py-2 pl-9 pr-4 text-sm text-text placeholder:text-text-soft focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="button"
            onClick={handleBaixarCsv}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          >
            <Download size={14} aria-hidden="true" />
            Baixar CSV ({filtradas.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-border/60 text-xs">
          {/* Filtro por Poder */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-text-soft">Poder:</span>
            {(["todos", "Executivo", "Legislativo", "Judiciário", "Sistema de Justiça"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setFiltroPoder(p)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  filtroPoder === p
                    ? "bg-primary font-bold text-white"
                    : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
                }`}
              >
                {p === "todos" ? "Todos os Poderes" : p}
              </button>
            ))}
          </div>

          {/* Filtro por Esfera */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-text-soft">Esfera:</span>
            {(["todas", "Federal", "Estadual", "Municipal"] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setFiltroEsfera(e)}
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  filtroEsfera === e
                    ? "bg-primary font-bold text-white"
                    : "bg-surface-2 text-text-soft hover:bg-surface-3 hover:text-text"
                }`}
              >
                {e === "todas" ? "Todas as Esferas" : e}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3. LISTA DE ENTIDADES (CARDS RICOS) ═══ */}
      <section id="catalogo-instituicoes" aria-label="Catálogo de instituições" className="space-y-4">
        {filtradas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-text-soft">
            Nenhuma instituição ou secretaria localizada com os filtros selecionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filtradas.map((inst) => (
              <article
                key={inst.sigla}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface-1 p-5 shadow-sm transition-all hover:border-border-strong hover:shadow-md"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${inst.cor} 12%, transparent)`,
                          color: inst.cor,
                        }}
                      >
                        {renderIcone(inst.sigla)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-text-soft">
                            {inst.esfera} · {inst.poder}
                          </span>
                        </div>
                        <h2 className="mt-0.5 font-display text-base font-bold text-text">
                          <Link
                            href={`/instituicoes/${inst.sigla}`}
                            className="hover:text-primary transition-colors"
                          >
                            {inst.nome} ({inst.sigla.toUpperCase()})
                          </Link>
                        </h2>
                      </div>
                    </div>

                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 font-mono text-xs font-bold"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${inst.cor} 10%, transparent)`,
                        color: inst.cor,
                      }}
                    >
                      {inst.orcamento.total.split(" ")[0]} {inst.orcamento.total.split(" ")[1]}
                    </span>
                  </div>

                  {/* Liderança e Funções Principais */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-text-soft">{inst.lideranca.cargo}:</span>{" "}
                      <strong className="text-text">{inst.lideranca.nome}</strong>
                    </div>

                    <p className="line-clamp-2 text-text-soft leading-relaxed">
                      {inst.funcoes[0]}
                    </p>

                    {/* Resumo do Organograma */}
                    <div className="pt-2 border-t border-border/50">
                      <p className="font-semibold uppercase tracking-wider text-xs text-text-soft">
                        Áreas do Organograma ({inst.organograma.length})
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {inst.organograma.slice(0, 3).map((org, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-surface-2 px-2 py-0.5 text-xs text-text-soft"
                          >
                            {org.area.split(" (")[0]}
                          </span>
                        ))}
                        {inst.organograma.length > 3 && (
                          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-text-soft">
                            +{inst.organograma.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contatos Rápidos e Links de Ação */}
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="space-y-1.5 text-xs text-text-soft">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="shrink-0 text-text-soft" aria-hidden="true" />
                      <span className="truncate">{inst.ouvidoria.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="shrink-0 text-text-soft" aria-hidden="true" />
                      <span className="truncate">{inst.ouvidoria.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="shrink-0 text-text-soft" aria-hidden="true" />
                      <span className="truncate">{inst.ouvidoria.endereco}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-border/40 text-xs">
                    <Link
                      href={`/instituicoes/${inst.sigla}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      Ficha Completa & Contatos →
                    </Link>

                    <div className="flex items-center gap-2">
                      {inst.ouvidoria.portal && (
                        <a
                          href={inst.ouvidoria.portal}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-text-soft hover:text-primary"
                          title="Portal Oficial"
                        >
                          Portal ↗
                        </a>
                      )}
                      {inst.ouvidoria.sic && (
                        <a
                          href={inst.ouvidoria.sic}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          title="e-SIC / Ouvidoria"
                        >
                          Ouvidoria ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
