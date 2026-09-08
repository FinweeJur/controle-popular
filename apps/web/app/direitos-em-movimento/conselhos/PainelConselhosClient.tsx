"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Building2,
  Phone,
  ExternalLink,
  Activity,
  Globe,
  Waves,
  Calendar,
  FileSpreadsheet,
  HeartHandshake,
} from "lucide-react";
import type { RegistroConselho, CategoriaConselho } from "@/lib/conselhos/tipos";

interface Props {
  conselhosIniciais: RegistroConselho[];
  contagemPorCategoria: Record<string, number>;
}

const ROTULOS_CATEGORIA: Record<CategoriaConselho, { label: string; cor: string; bg: string }> = {
  saude: { label: "Saude & SUS", cor: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" },
  meio_ambiente: { label: "Meio Ambiente & CODEMA", cor: "text-green-600", bg: "bg-green-600/10 border-green-600/30" },
  direitos_humanos: { label: "Direitos Humanos", cor: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" },
  mulher: { label: "Direitos da Mulher", cor: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/30" },
  crianca_adolescente: { label: "Crianca & Juventude", cor: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
  bacias_hidrograficas: { label: "Comites de Bacias", cor: "text-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/30" },
  povos_tradicionais: { label: "Povos Tradicionais", cor: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
  igualdade_racial: { label: "Igualdade Racial", cor: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/30" },
  unidades_conservacao: { label: "Unidades Conservacao", cor: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/30" },
  educacao_merenda: { label: "Educacao & Alimentacao", cor: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/30" },
  assistencia_social: { label: "Assistencia Social", cor: "text-yellow-600", bg: "bg-yellow-600/10 border-yellow-600/30" },
  seguranca_alimentar: { label: "Seguranca Alimentar", cor: "text-lime-600", bg: "bg-lime-600/10 border-lime-600/30" },
  desenvolvimento_rural: { label: "Desenvolvimento Rural", cor: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/30" },
  pessoa_idosa: { label: "Pessoa Idosa", cor: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/30" },
  cidade_habitacao: { label: "Habitacao & Cidade", cor: "text-sky-600", bg: "bg-sky-600/10 border-sky-600/30" },
  defesa_social: { label: "Defesa Social", cor: "text-red-500", bg: "bg-red-500/10 border-red-500/30" },
  patrimonio_cultural: { label: "Patrimonio Cultural", cor: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/30" },
};

export default function PainelConselhosClient({
  conselhosIniciais,
  contagemPorCategoria,
}: Props) {
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todas");
  const [esferaFiltro, setEsferaFiltro] = useState("todas");
  const [ufFiltro, setUfFiltro] = useState("todas");
  const [modoVisualizacao, setModoVisualizacao] = useState<"cards" | "tabela">("cards");
  const [ordenacao, setOrdenacao] = useState<"nome" | "sigla" | "uf" | "categoria">("nome");

  const ufsDisponiveis = useMemo(() => {
    const setUfs = new Set<string>();
    for (const c of conselhosIniciais) {
      if (c.uf && c.uf !== "BR") setUfs.add(c.uf);
    }
    return Array.from(setUfs).sort();
  }, [conselhosIniciais]);

  const conselhosFiltrados = useMemo(() => {
    return conselhosIniciais.filter((c) => {
      if (categoriaFiltro !== "todas" && c.categoria !== categoriaFiltro) return false;
      if (esferaFiltro !== "todas" && c.esfera !== esferaFiltro) return false;
      if (ufFiltro !== "todas" && c.uf !== ufFiltro) return false;

      if (busca.trim().length > 0) {
        const termo = busca.toLowerCase();
        const noNome = c.nome.toLowerCase().includes(termo);
        const naSigla = c.sigla.toLowerCase().includes(termo);
        const noMunicipio = c.municipioNome?.toLowerCase().includes(termo) ?? false;
        const noPapel = c.descricaoPapel.toLowerCase().includes(termo);
        const nasTags = c.tags.some((t) => t.toLowerCase().includes(termo));
        if (!noNome && !naSigla && !noMunicipio && !noPapel && !nasTags) return false;
      }
      return true;
    }).sort((a, b) => {
      if (ordenacao === "nome") return a.nome.localeCompare(b.nome);
      if (ordenacao === "sigla") return a.sigla.localeCompare(b.sigla);
      if (ordenacao === "uf") return (a.uf ?? "").localeCompare(b.uf ?? "");
      if (ordenacao === "categoria") return a.categoria.localeCompare(b.categoria);
      return 0;
    });
  }, [conselhosIniciais, categoriaFiltro, esferaFiltro, ufFiltro, busca, ordenacao]);

  function baixarCsvFiltrado() {
    const cabecalho = "Sigla;Nome Oficial;Categoria;Esfera;UF;Municipio;Papel e Atribuicoes;Quem Participa;Telefone;Email;Site Oficial;Canal de Denuncia\n";
    const linhas = conselhosFiltrados.map((c) => {
      const escape = (s?: string) => "";
      return [
        escape(c.sigla),
        escape(c.nome),
        escape(ROTULOS_CATEGORIA[c.categoria]?.label || c.categoria),
        escape(c.esfera),
        escape(c.uf || "BR"),
        escape(c.municipioNome || "-"),
        escape(c.descricaoPapel),
        escape(c.quemParticipa),
        escape(c.contatos.telefone || "-"),
        escape(c.contatos.email || "-"),
        escape(c.contatos.siteOficial || "-"),
        escape(c.contatos.canalDenuncia || "-"),
      ].join(";");
    }).join("\n");

    const blob = new Blob(["\uFEFF" + cabecalho + linhas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "conselhos-direitos-controlepopular.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-8">
      {/* CARTOES DE TOPO */}
      <section aria-label="Indicadores gerais dos conselhos" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Users size={16} className="text-primary shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Colegiados</span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-foreground">
            {conselhosIniciais.length}
          </p>
          <p className="mt-0.5 text-xs text-text-soft">Conselhos cadastrados</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Globe size={16} className="text-emerald-500 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Cobertura</span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-foreground">
            27 UFs
          </p>
          <p className="mt-0.5 text-xs text-text-soft">199 cidades estrategicas</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Activity size={16} className="text-rose-500 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Saude & Social</span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-foreground">
            {(contagemPorCategoria["saude"] || 0) + (contagemPorCategoria["direitos_humanos"] || 0)}
          </p>
          <p className="mt-0.5 text-xs text-text-soft">CMS, CES, CEDH, CMDH</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Waves size={16} className="text-cyan-500 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Meio Ambiente</span>
          </div>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-bold text-foreground">
            {(contagemPorCategoria["meio_ambiente"] || 0) + (contagemPorCategoria["bacias_hidrograficas"] || 0)}
          </p>
          <p className="mt-0.5 text-xs text-text-soft">CODEMAs, COPAM e Bacias</p>
        </div>
      </section>

      {/* GRAFICO INLINE CSS */}
      <section aria-label="Distribuicao tematica dos conselhos" className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">
              Distribuicao por Area de Controle Social
            </h2>
            <p className="text-xs text-text-soft">
              Colegiados participativos com assento obrigatorio da sociedade civil
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Object.entries(contagemPorCategoria)
            .filter(([_, qtd]) => qtd > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([cat, qtd]) => {
              const info = ROTULOS_CATEGORIA[cat as CategoriaConselho] || {
                label: cat,
                cor: "text-primary",
                bg: "bg-primary/10 border-primary/30",
              };
              const pct = ((qtd / conselhosIniciais.length) * 100).toFixed(1);
              return (
                <div key={cat} className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-surface-2/40 p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate">{info.label}</span>
                    <span className="font-mono font-bold text-foreground">{qtd}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: pct + "%" }}
                      role="progressbar"
                      aria-valuenow={qtd}
                      aria-valuemin={0}
                      aria-valuemax={conselhosIniciais.length}
                    />
                  </div>
                  <span className="text-[0.7em] text-text-soft">{pct}% do acervo</span>
                </div>
              );
            })}
        </div>
      </section>

      {/* FILTROS, BUSCA E CSV */}
      <section aria-label="Filtros e exportacao de conselhos" className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por conselho, cidade, sigla ou atribuicao..."
              className="w-full rounded-lg border border-border bg-surface-2/60 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-text-soft focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-surface-2/40 p-0.5">
              <button
                type="button"
                onClick={() => setModoVisualizacao("cards")}
                aria-pressed={modoVisualizacao === "cards"}
                className={
                  "rounded-md px-3 py-1 text-xs font-semibold transition-colors " +
                  (modoVisualizacao === "cards" ? "bg-surface text-primary shadow-xs" : "text-text-soft hover:text-foreground")
                }
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacao("tabela")}
                aria-pressed={modoVisualizacao === "tabela"}
                className={
                  "rounded-md px-3 py-1 text-xs font-semibold transition-colors " +
                  (modoVisualizacao === "tabela" ? "bg-surface text-primary shadow-xs" : "text-text-soft hover:text-foreground")
                }
              >
                Tabela
              </button>
            </div>

            <button
              type="button"
              onClick={baixarCsvFiltrado}
              className="cp-btn-anim flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary hover:text-primary"
              aria-label="Baixar planilha CSV dos conselhos filtrados"
            >
              <Download size={13} aria-hidden="true" />
              <span>Baixar CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs text-text-soft">
            <Filter size={12} aria-hidden="true" />
            <span className="font-semibold">Filtros:</span>
          </div>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            aria-label="Filtrar por area tematica"
            className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todas">Todas as areas tematicas</option>
            <option value="saude">Saude & SUS (CMS/CES/CNS)</option>
            <option value="meio_ambiente">Meio Ambiente (CODEMA/COPAM)</option>
            <option value="direitos_humanos">Direitos Humanos (CMDH/CEDH)</option>
            <option value="mulher">Direitos da Mulher (CMDM/CEDM)</option>
            <option value="crianca_adolescente">Crianca & Juventude (CMDCA/Tutelar)</option>
            <option value="bacias_hidrograficas">Comites de Bacias (CBH)</option>
            <option value="povos_tradicionais">Povos Tradicionais & PCTs</option>
            <option value="igualdade_racial">Igualdade Racial</option>
            <option value="patrimonio_cultural">Patrimonio Cultural</option>
          </select>

          <select
            value={esferaFiltro}
            onChange={(e) => setEsferaFiltro(e.target.value)}
            aria-label="Filtrar por esfera federativa"
            className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todas">Todas as esferas</option>
            <option value="federal">Federal (Nacional)</option>
            <option value="estadual">Estadual (UFs)</option>
            <option value="municipal">Municipal (Cidades)</option>
          </select>

          <select
            value={ufFiltro}
            onChange={(e) => setUfFiltro(e.target.value)}
            aria-label="Filtrar por estado (UF)"
            className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todas">Todos os estados (UF)</option>
            <option value="MG">Minas Gerais (MG)</option>
            <option value="SP">Sao Paulo (SP)</option>
            <option value="RJ">Rio de Janeiro (RJ)</option>
            <option value="BA">Bahia (BA)</option>
            {ufsDisponiveis.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>

          <select
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value as any)}
            aria-label="Ordenar resultados"
            className="ml-auto rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="nome">Ordenar por Nome</option>
            <option value="sigla">Ordenar por Sigla</option>
            <option value="uf">Ordenar por Estado (UF)</option>
            <option value="categoria">Ordenar por Area</option>
          </select>
        </div>
      </section>

      {/* RESULTADOS */}
      <section aria-label="Lista de conselhos filtrados">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-text-soft">
            Exibindo <span className="text-foreground font-bold">{conselhosFiltrados.length}</span> colegiados
          </p>
        </div>

        {modoVisualizacao === "cards" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {conselhosFiltrados.map((c) => {
              const catInfo = ROTULOS_CATEGORIA[c.categoria] || {
                label: c.categoria,
                cor: "text-primary",
                bg: "bg-primary/10 border-primary/30",
              };
              return (
                <article
                  key={c.id}
                  className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-2xs transition-colors hover:border-primary/50"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-mono text-xs font-extrabold text-foreground px-2 py-0.5 rounded bg-surface-2 border border-border">
                        {c.sigla}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={"inline-block rounded px-2 py-0.5 text-[0.68em] font-bold uppercase tracking-wider border " + catInfo.bg + " " + catInfo.cor}>
                          {catInfo.label}
                        </span>
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.68em] font-mono font-semibold text-text-soft border border-border">
                          {c.uf || "BR"}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-foreground leading-snug">
                      {c.nome}
                    </h3>

                    {c.municipioNome && (
                      <p className="text-xs font-medium text-text-soft flex items-center gap-1">
                        <Building2 size={12} aria-hidden="true" />
                        <span>{c.municipioNome} ({c.uf})</span>
                      </p>
                    )}

                    <p className="text-xs text-text leading-relaxed line-clamp-3">
                      {c.descricaoPapel}
                    </p>

                    <div className="rounded-lg bg-surface-2/60 p-2 text-[0.75em] text-text-soft">
                      <span className="font-semibold text-foreground">Composicao: </span>
                      <span className="line-clamp-2">{c.quemParticipa}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                    {c.contatos.telefone && (
                      <span className="text-[0.75em] text-text-soft flex items-center gap-1">
                        <Phone size={11} aria-hidden="true" />
                        <span className="truncate max-w-[140px]">{c.contatos.telefone}</span>
                      </span>
                    )}

                    {c.contatos.siteOficial && (
                      <a
                        href={c.contatos.siteOficial}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-[0.75em] font-semibold text-primary hover:underline"
                      >
                        <span>Acessar portal</span>
                        <ExternalLink size={10} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-2/60 text-text-soft">
                <tr>
                  <th scope="col" className="p-3 font-semibold">Sigla / Nome</th>
                  <th scope="col" className="p-3 font-semibold">Area</th>
                  <th scope="col" className="p-3 font-semibold">Esfera / UF</th>
                  <th scope="col" className="p-3 font-semibold">Atribuicao Principal</th>
                  <th scope="col" className="p-3 font-semibold">Contatos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {conselhosFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2/40">
                    <td className="p-3">
                      <span className="font-mono font-bold text-foreground block">{c.sigla}</span>
                      <span className="text-[0.8em] text-text-soft">{c.nome}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="rounded px-1.5 py-0.5 text-[0.72em] font-medium border border-border">
                        {ROTULOS_CATEGORIA[c.categoria]?.label || c.categoria}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-[0.8em]">
                      {c.esfera.toUpperCase()} ? {c.uf || "BR"}
                    </td>
                    <td className="p-3 max-w-xs text-text-soft line-clamp-2">
                      {c.descricaoPapel}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {c.contatos.siteOficial ? (
                        <a
                          href={c.contatos.siteOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-semibold text-primary hover:underline"
                        >
                          <span>Portal</span>
                          <ExternalLink size={10} aria-hidden="true" />
                        </a>
                      ) : (
                        <span className="text-text-soft">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* GUIA DE PARTICIPACAO */}
      <section aria-label="Como participar dos conselhos de direitos" className="rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HeartHandshake className="text-primary shrink-0" size={20} aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-foreground">
            Como a Populacao Participa e Fiscaliza
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs text-text leading-relaxed">
          <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              1. Reunioes sao Publicas
            </h3>
            <p>
              Qualquer cidadao tem o direito de assistir as plenarias dos Conselhos Municipais e Estaduais. As datas e pautas sao divulgadas com antecedencia no Diario Oficial.
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <Users size={14} className="text-primary" />
              2. Assento da Sociedade Civil
            </h3>
            <p>
              Conselhos de Saude (CMS), Meio Ambiente (CODEMA) e Direitos Humanos tem vaga paritaria para entidades comunitarias, sindicatos e associacoes de moradores eleitas periodicamente.
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-primary" />
              3. Atas e Deliberacoes
            </h3>
            <p>
              As decisoes, resolucoes e atas de votacao sao documentos publicos. Se um conselho nao disponibilizar as atas no portal, pode ser acionado via Lei de Acesso a Informacao (LAI).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
