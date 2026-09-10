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
import ObjetoExpansivel from "@/app/[municipio]/components/ObjetoExpansivel";
import { Clipboard, Check } from "lucide-react";

function BotaoCopiar({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        const ta = document.createElement("textarea");
        ta.value = texto;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponivel: nao interrompe a leitura
    }
  }
  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`Copiar ${rotulo}`}
      className={
        "inline-flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium transition-colors " +
        (copiado
          ? "text-emerald-600"
          : "text-text-soft hover:text-primary hover:bg-surface-2")
      }
    >
      {copiado ? <Check size={10} aria-hidden="true" /> : <Clipboard size={10} aria-hidden="true" />}
      <span aria-hidden="true">{copiado ? "Copiado!" : "Copiar"}</span>
    </button>
  );
}

interface Props {
  conselhosIniciais: RegistroConselho[];
  contagemPorCategoria: Record<string, number>;
}

const ROTULOS_CATEGORIA: Record<CategoriaConselho, { label: string; cor: string; bg: string }> = {
  saude: { label: "Saúde & SUS", cor: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" },
  meio_ambiente: { label: "Meio Ambiente & CODEMA", cor: "text-green-600", bg: "bg-green-600/10 border-green-600/30" },
  direitos_humanos: { label: "Direitos Humanos", cor: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/30" },
  mulher: { label: "Direitos da Mulher", cor: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/30" },
  crianca_adolescente: { label: "Criança & Juventude", cor: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
  bacias_hidrograficas: { label: "Comitês de Bacias", cor: "text-cyan-500", bg: "bg-cyan-500/10 border-cyan-500/30" },
  povos_tradicionais: { label: "Povos Tradicionais", cor: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30" },
  igualdade_racial: { label: "Igualdade Racial", cor: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/30" },
  unidades_conservacao: { label: "Unidades de Conservação", cor: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/30" },
  educacao_merenda: { label: "Educação & Alimentação", cor: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/30" },
  assistencia_social: { label: "Assistência Social", cor: "text-yellow-600", bg: "bg-yellow-600/10 border-yellow-600/30" },
  seguranca_alimentar: { label: "Segurança Alimentar", cor: "text-lime-600", bg: "bg-lime-600/10 border-lime-600/30" },
  desenvolvimento_rural: { label: "Desenvolvimento Rural", cor: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/30" },
  pessoa_idosa: { label: "Pessoa Idosa", cor: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/30" },
  cidade_habitacao: { label: "Habitação & Cidade", cor: "text-sky-600", bg: "bg-sky-600/10 border-sky-600/30" },
  defesa_social: { label: "Defesa Social", cor: "text-red-500", bg: "bg-red-500/10 border-red-500/30" },
  patrimonio_cultural: { label: "Patrimônio Cultural", cor: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/30" },
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
    const cabecalho = "Sigla;Nome Oficial;Categoria;Esfera;UF;Municipio;Papel e Atribuicoes;Quem Participa;Telefone;Email;Site Oficial;Endereco Fisico;Canal de Denuncia\n";
    const linhas = conselhosFiltrados.map((c) => {
      // CSV com separador ";" (Excel br). Escapa aspas dobrando-as e
      // protege o campo inteiro quando ha ";" ou quebra de linha. O BOM
      // UTF-8 (\uFEFF) vai no Blob, logo abaixo.
      const escape = (s?: string) => {
        const v = s?.trim() ?? "";
        if (!v) return "";
        const aspas = v.replace(/"/g, '""');
        return /[;"\r\n]/.test(aspas) ? `"${aspas}"` : aspas;
      };
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
        escape(c.contatos.enderecoFisico || "-"),
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
          <p className="mt-0.5 text-xs text-text-soft">199 cidades estratégicas</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <div className="flex items-center gap-2 text-text-soft">
            <Activity size={16} className="text-rose-500 shrink-0" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wider">Saúde & Social</span>
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
              Distribuição por Área de Controle Social
            </h2>
            <p className="text-xs text-text-soft">
              Colegiados participativos com assento obrigatório da sociedade civil
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
                  <span className="text-[11px] text-text-soft">{pct}% do acervo</span>
                </div>
              );
            })}
        </div>
      </section>

      {/* FILTROS, BUSCA E CSV */}
      <section aria-label="Filtros e exportação de conselhos" className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-soft" aria-hidden="true" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por conselho, cidade, sigla ou atribuição..."
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
            aria-label="Filtrar por área temática"
            className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="todas">Todas as áreas temáticas</option>
            <option value="saude">Saúde & SUS (CMS/CES/CNS)</option>
            <option value="meio_ambiente">Meio Ambiente (CODEMA/COPAM)</option>
            <option value="direitos_humanos">Direitos Humanos (CMDH/CEDH)</option>
            <option value="mulher">Direitos da Mulher (CMDM/CEDM)</option>
            <option value="crianca_adolescente">Criança & Juventude (CMDCA/Tutelar)</option>
            <option value="bacias_hidrograficas">Comitês de Bacias (CBH)</option>
            <option value="povos_tradicionais">Povos Tradicionais & PCTs</option>
            <option value="igualdade_racial">Igualdade Racial</option>
            <option value="patrimonio_cultural">Patrimônio Cultural</option>
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
            <option value="SP">São Paulo (SP)</option>
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
            <option value="categoria">Ordenar por Área</option>
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
                        <span className={"inline-block rounded px-2 py-0.5 text-[0.9em] font-bold uppercase tracking-wider border " + catInfo.bg + " " + catInfo.cor}>
                          {catInfo.label}
                        </span>
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[0.9em] font-mono font-semibold text-text-soft border border-border">
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

                    <div className="text-xs text-text leading-relaxed">
                      <ObjetoExpansivel texto={c.descricaoPapel} />
                    </div>

                    <div className="rounded-lg bg-surface-2/60 p-2 text-[0.9em] text-text-soft">
                      <span className="font-semibold text-foreground">Composição: </span>
                      <ObjetoExpansivel texto={c.quemParticipa} />
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {c.contatos.telefone && (
                        <span className="text-[0.9em] text-text-soft flex items-center gap-1">
                          <Phone size={11} aria-hidden="true" />
                          <span className="truncate max-w-[140px]">{c.contatos.telefone}</span>
                          <BotaoCopiar texto={c.contatos.telefone} rotulo="o telefone" />
                        </span>
                      )}

                      {c.contatos.email && (
                        <span className="text-[0.9em] text-text-soft flex items-center gap-1">
                          <span className="truncate max-w-[140px]">{c.contatos.email}</span>
                          <BotaoCopiar texto={c.contatos.email} rotulo="o e-mail" />
                        </span>
                      )}

                      {c.contatos.siteOficial && (
                        <a
                          href={c.contatos.siteOficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1 text-[0.9em] font-semibold text-primary hover:underline"
                        >
                          <span>Acessar portal</span>
                          <ExternalLink size={10} aria-hidden="true" />
                        </a>
                      )}
                    </div>

                    {c.contatos.enderecoFisico && (
                      <div className="flex flex-wrap items-center gap-1 text-[0.9em] text-text-soft">
                        <span className="truncate max-w-[220px]">{c.contatos.enderecoFisico}</span>
                        <BotaoCopiar texto={c.contatos.enderecoFisico} rotulo="o endereço" />
                      </div>
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
                  <th scope="col" className="p-3 font-semibold">Área</th>
                  <th scope="col" className="p-3 font-semibold">Esfera / UF</th>
                  <th scope="col" className="p-3 font-semibold">Atribuição Principal</th>
                  <th scope="col" className="p-3 font-semibold">Contatos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {conselhosFiltrados.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2/40">
                    <td className="p-3">
                      <span className="font-mono font-bold text-foreground block">{c.sigla}</span>
                      <span className="text-[11px] text-text-soft">{c.nome}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="rounded px-1.5 py-0.5 text-[0.9em] font-medium border border-border">
                        {ROTULOS_CATEGORIA[c.categoria]?.label || c.categoria}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                      {c.esfera.toUpperCase()} • {c.uf || "BR"}
                    </td>
                    <td className="p-3 max-w-xs text-text-soft">
                      <ObjetoExpansivel texto={c.descricaoPapel} />
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
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
                        {c.contatos.telefone && (
                          <div className="flex items-center gap-1 text-text-soft">
                            <span className="max-w-[140px] truncate">{c.contatos.telefone}</span>
                            <BotaoCopiar texto={c.contatos.telefone} rotulo="o telefone" />
                          </div>
                        )}
                        {c.contatos.email && (
                          <div className="flex items-center gap-1 text-text-soft">
                            <span className="max-w-[160px] truncate">{c.contatos.email}</span>
                            <BotaoCopiar texto={c.contatos.email} rotulo="o e-mail" />
                          </div>
                        )}
                        {c.contatos.enderecoFisico && (
                          <div className="flex items-center gap-1 text-text-soft">
                            <span className="max-w-[220px] truncate">{c.contatos.enderecoFisico}</span>
                            <BotaoCopiar texto={c.contatos.enderecoFisico} rotulo="o endereço" />
                          </div>
                        )}
                      </div>
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
            Como a População Participa e Fiscaliza
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs text-text leading-relaxed">
          <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              1. Reuniões são Públicas
            </h3>
            <p>
              Qualquer cidadão tem o direito de assistir às plenárias dos Conselhos Municipais e Estaduais. As datas e pautas são divulgadas com antecedência no Diário Oficial.
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <Users size={14} className="text-primary" />
              2. Assento da Sociedade Civil
            </h3>
            <p>
              Conselhos de Saúde (CMS), Meio Ambiente (CODEMA) e Direitos Humanos têm vaga paritária para a sociedade civil: entidades comunitárias, sindicatos e associações de moradores elegem seus representantes periodicamente.
            </p>
          </div>

          <div className="space-y-1.5 rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <FileSpreadsheet size={14} className="text-primary" />
              3. Atas e Deliberações
            </h3>
            <p>
              As decisões, resoluções e atas de votação são documentos públicos. Se um conselho não disponibilizar as atas no portal, pode ser acionado via Lei de Acesso à Informação (LAI).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
