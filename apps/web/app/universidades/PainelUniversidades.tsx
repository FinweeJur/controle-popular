"use client";

/**
 * @file apps/web/app/universidades/PainelUniversidades.tsx
 * @description Painel de busca do índice de pesquisa e extensão universitária.
 *
 * Papel no portal: filtrar, no navegador, grupos de pesquisa e projetos de
 * extensão por nome, líder, área temática, grande área, estado, instituição e
 * faculdade. O filtro roda no cliente porque o portal é export estático —
 * ler `searchParams` no servidor quebraria o alvo Cloudflare.
 *
 * Régua (QUALIDADES-DA-INFORMACAO.md):
 * 2. busca tolerante a acento e filtros reais;
 * 3. ordenação por nome;
 * 4. contagem visível do que está filtrado;
 * 6. CSV do que está na tela, com `;` e BOM UTF-8, e impressão nativa;
 * 7. layout de 390 px sem rolagem lateral;
 * 8. data da fonte visível em cada cartão.
 *
 * Contatos: o cartão mostra o contato do grupo quando a fonte publica; senão,
 * o contato institucional, sempre rotulado. Nada é deduzido do líder.
 */

import { useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  Filter,
  Globe,
  AtSign,
  Mail,
  Phone,
  RotateCcw,
  Search,
} from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type {
  Contato,
  GrupoPesquisa,
  Instituicao,
  ProjetoExtensao,
  Unidade,
} from "@/lib/universidades/tipos";
import { nomeDoTema } from "@/lib/universidades/temas";

export interface PainelUniversidadesProps {
  instituicoes: Instituicao[];
  unidades: Unidade[];
  grupos: GrupoPesquisa[];
  projetos: ProjetoExtensao[];
  verificadoEm: string;
  /** Quando definido, a página é de uma instituição só. */
  instituicaoFixa?: string;
}

type TipoFiltro = "todos" | "pesquisa" | "extensao";

const POR_PAGINA = 24;

function dataBr(iso: string): string {
  const [a, m, d] = iso.split("-");
  return d && m && a ? `${d}/${m}/${a}` : iso;
}

function contatoDoRegistro(
  registro: { contatos?: Contato; instituicao: string },
  instituicoes: Instituicao[],
): { contato: Contato | undefined; institucional: boolean } {
  if (registro.contatos) return { contato: registro.contatos, institucional: false };
  const inst = instituicoes.find(
    (i) => i.sigla.toUpperCase() === registro.instituicao.toUpperCase(),
  );
  return { contato: inst?.contatos, institucional: true };
}

export default function PainelUniversidades({
  instituicoes,
  unidades,
  grupos,
  projetos,
  verificadoEm,
  instituicaoFixa,
}: PainelUniversidadesProps) {
  const [busca, setBusca] = useState("");
  const [uf, setUf] = useState("");
  const [instituicao, setInstituicao] = useState(instituicaoFixa ?? "");
  const [unidade, setUnidade] = useState("");
  const [area, setArea] = useState("");
  const [areaConhecimento, setAreaConhecimento] = useState("");
  const [tema, setTema] = useState("");
  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [pagina, setPagina] = useState(1);

  const instituicoesDisponiveis = useMemo(() => {
    const lista = instituicaoFixa
      ? instituicoes.filter(
          (i) => i.sigla.toUpperCase() === instituicaoFixa.toUpperCase(),
        )
      : instituicoes;
    return [...lista].sort((a, b) => a.sigla.localeCompare(b.sigla, "pt-BR"));
  }, [instituicoes, instituicaoFixa]);

  const ufsDisponiveis = useMemo(
    () => [...new Set(instituicoesDisponiveis.map((i) => i.uf))].sort(),
    [instituicoesDisponiveis],
  );

  const unidadesDisponiveis = useMemo(() => {
    const siglas = new Set(
      grupos
        .filter((g) => !instituicao || g.instituicao.toUpperCase() === instituicao.toUpperCase())
        .map((g) => g.unidade)
        .filter(Boolean) as string[],
    );
    return unidades
      .filter(
        (u) =>
          (!instituicao || u.instituicao.toUpperCase() === instituicao.toUpperCase()) &&
          (!siglas.size || siglas.has(u.sigla)),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [unidades, grupos, instituicao]);

  const areasDisponiveis = useMemo(
    () => [...new Set(grupos.map((g) => g.area))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [grupos],
  );

  const areasConhecimentoDisponiveis = useMemo(
    () =>
      [...new Set(grupos.map((g) => g.areaConhecimento).filter(Boolean) as string[])].sort(
        (a, b) => a.localeCompare(b, "pt-BR"),
      ),
    [grupos],
  );

  const temasDisponiveis = useMemo(() => {
    const presentes = new Set<string>();
    for (const g of grupos) for (const t of g.areaTematica ?? []) presentes.add(t);
    for (const p of projetos) for (const t of p.areaTematica ?? []) presentes.add(t);
    return [...presentes].sort((a, b) =>
      nomeDoTema(a).localeCompare(nomeDoTema(b), "pt-BR"),
    );
  }, [grupos, projetos]);

  const termos = useMemo(
    () =>
      semAcento(busca)
        .split(/\s+/)
        .filter(Boolean),
    [busca],
  );

  const instituicoesPorSigla = useMemo(
    () => new Map(instituicoes.map((i) => [i.sigla.toUpperCase(), i])),
    [instituicoes],
  );

  const gruposFiltrados = useMemo(() => {
    if (tipo === "extensao") return [];
    return grupos
      .filter((g) => {
        if (instituicao && g.instituicao.toUpperCase() !== instituicao.toUpperCase())
          return false;
        if (uf) {
          const inst = instituicoesPorSigla.get(g.instituicao.toUpperCase());
          if (!inst || inst.uf !== uf) return false;
        }
        if (unidade && (g.unidade ?? "").toUpperCase() !== unidade.toUpperCase())
          return false;
        if (area && g.area !== area) return false;
        if (areaConhecimento && g.areaConhecimento !== areaConhecimento) return false;
        if (tema && !(g.areaTematica ?? []).includes(tema)) return false;
        if (termos.length) {
          const inst = instituicoesPorSigla.get(g.instituicao.toUpperCase());
          const alvo = semAcento(
            `${g.nome} ${g.lider} ${g.area} ${g.areaConhecimento ?? ""} ${g.unidade ?? ""} ${g.instituicao} ${inst?.nome ?? ""}`,
          );
          return termos.every((t) => alvo.includes(t));
        }
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [
    grupos,
    tipo,
    instituicao,
    uf,
    unidade,
    area,
    areaConhecimento,
    tema,
    termos,
    instituicoesPorSigla,
  ]);

  const projetosFiltrados = useMemo(() => {
    if (tipo === "pesquisa") return [];
    return projetos
      .filter((p) => {
        if (instituicao && p.instituicao.toUpperCase() !== instituicao.toUpperCase())
          return false;
        if (uf) {
          const inst = instituicoesPorSigla.get(p.instituicao.toUpperCase());
          if (!inst || inst.uf !== uf) return false;
        }
        if (area && p.area !== area) return false;
        if (areaConhecimento && p.areaConhecimento !== areaConhecimento) return false;
        if (tema && !(p.areaTematica ?? []).includes(tema)) return false;
        if (termos.length) {
          const inst = instituicoesPorSigla.get(p.instituicao.toUpperCase());
          const alvo = semAcento(
            `${p.nome} ${p.area ?? ""} ${p.instituicao} ${inst?.nome ?? ""}`,
          );
          return termos.every((t) => alvo.includes(t));
        }
        return true;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [projetos, tipo, instituicao, uf, area, areaConhecimento, tema, termos, instituicoesPorSigla]);

  const totalFiltrado = gruposFiltrados.length + projetosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(gruposFiltrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const gruposDaPagina = gruposFiltrados.slice(inicio, inicio + POR_PAGINA);

  const filtroAtivo =
    Boolean(busca || uf || unidade || area || areaConhecimento || tema) ||
    tipo !== "todos" ||
    (!instituicaoFixa && Boolean(instituicao));

  function limpar() {
    setBusca("");
    setUf("");
    setInstituicao(instituicaoFixa ?? "");
    setUnidade("");
    setArea("");
    setAreaConhecimento("");
    setTema("");
    setTipo("todos");
    setPagina(1);
  }

  function exportarCsv() {
    const cab = [
      "tipo",
      "nome",
      "lider",
      "area",
      "area_conhecimento",
      "temas",
      "instituicao",
      "uf",
      "unidade",
      "fonte",
      "data_acesso",
    ];
    const linhas: string[][] = [];
    for (const g of gruposFiltrados) {
      const inst = instituicoesPorSigla.get(g.instituicao.toUpperCase());
      linhas.push([
        "pesquisa",
        g.nome,
        g.lider,
        g.area,
        g.areaConhecimento ?? "",
        (g.areaTematica ?? []).map(nomeDoTema).join(" | "),
        g.instituicao,
        inst?.uf ?? "",
        g.unidade ?? "",
        g.fonteUrl,
        g.dataAcesso,
      ]);
    }
    for (const p of projetosFiltrados) {
      const inst = instituicoesPorSigla.get(p.instituicao.toUpperCase());
      linhas.push([
        "extensao",
        p.nome,
        "",
        p.area ?? "",
        p.areaConhecimento ?? "",
        (p.areaTematica ?? []).map(nomeDoTema).join(" | "),
        p.instituicao,
        inst?.uf ?? "",
        p.unidade ?? "",
        p.url,
        p.dataAcesso,
      ]);
    }
    const csv =
      "\uFEFF" +
      [cab, ...linhas]
        .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
        .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "universidades-pesquisa-extensao.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectCls =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <section aria-label="Busca no índice universitário" className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
          <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
          Filtros
          {filtroAtivo && (
            <button
              type="button"
              onClick={limpar}
              className="ml-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-soft hover:text-text"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Limpar
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="relative block sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Buscar por nome, líder, área ou instituição
            </span>
            <Search
              className="pointer-events-none absolute left-3 top-[2.15rem] h-4 w-4 text-text-soft"
              aria-hidden="true"
            />
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Ex.: agroecologia, saúde coletiva, UFVJM, Diamantina"
              className={`${selectCls} pl-9`}
            />
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">Estado</span>
            <select
              value={uf}
              onChange={(e) => {
                setUf(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
              disabled={Boolean(instituicaoFixa)}
            >
              <option value="">Todos</option>
              {ufsDisponiveis.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          {!instituicaoFixa && (
            <label>
              <span className="mb-1 block text-xs font-medium text-text-soft">
                Instituição
              </span>
              <select
                value={instituicao}
                onChange={(e) => {
                  setInstituicao(e.target.value);
                  setUnidade("");
                  setPagina(1);
                }}
                className={selectCls}
              >
                <option value="">Todas</option>
                {instituicoesDisponiveis.map((i) => (
                  <option key={i.sigla} value={i.sigla}>
                    {i.sigla} — {i.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Faculdade / unidade
            </span>
            <select
              value={unidade}
              onChange={(e) => {
                setUnidade(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
              disabled={!unidadesDisponiveis.length}
            >
              <option value="">
                {unidadesDisponiveis.length ? "Todas" : "Não informada na fonte"}
              </option>
              {unidadesDisponiveis.map((u) => (
                <option key={`${u.instituicao}-${u.sigla}`} value={u.sigla}>
                  {u.sigla} — {u.nome}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Área do conhecimento
            </span>
            <select
              value={areaConhecimento}
              onChange={(e) => {
                setAreaConhecimento(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
            >
              <option value="">Todas</option>
              {areasConhecimentoDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Área temática
            </span>
            <select
              value={tema}
              onChange={(e) => {
                setTema(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
            >
              <option value="">Todas</option>
              {temasDisponiveis.map((t) => (
                <option key={t} value={t}>
                  {nomeDoTema(t)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">
              Área predominante
            </span>
            <select
              value={area}
              onChange={(e) => {
                setArea(e.target.value);
                setPagina(1);
              }}
              className={selectCls}
            >
              <option value="">Todas</option>
              {areasDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-text-soft">Tipo</span>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value as TipoFiltro);
                setPagina(1);
              }}
              className={selectCls}
            >
              <option value="todos">Pesquisa e extensão</option>
              <option value="pesquisa">Só pesquisa</option>
              <option value="extensao">Só extensão</option>
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-text-soft">
          Área temática é classificação editorial derivada do nome e da área
          declarada — não substitui a área oficial da fonte.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-text-soft" aria-live="polite">
          <strong className="text-text">{totalFiltrado}</strong> registro
          {totalFiltrado === 1 ? "" : "s"} · {gruposFiltrados.length} grupo
          {gruposFiltrados.length === 1 ? "" : "s"} de pesquisa ·{" "}
          {projetosFiltrados.length} projeto
          {projetosFiltrados.length === 1 ? "" : "s"} de extensão · acervo de{" "}
          {dataBr(verificadoEm)}
        </p>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={totalFiltrado === 0}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text hover:bg-surface disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      {gruposFiltrados.length > 0 && (
        <section aria-label="Grupos de pesquisa" className="space-y-3">
          <h2 className="text-lg font-bold text-text">Grupos de pesquisa</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {gruposDaPagina.map((g) => {
              const inst = instituicoesPorSigla.get(g.instituicao.toUpperCase());
              const { contato, institucional } = contatoDoRegistro(g, instituicoes);
              return (
                <article
                  key={`${g.instituicao}-${g.nome}`}
                  className="flex flex-col rounded-xl border border-border bg-surface p-4"
                >
                  <h3 className="text-sm font-semibold leading-snug text-text">
                    {g.nome}
                  </h3>
                  <p className="mt-1 text-xs text-text-soft">
                    {inst?.sigla ?? g.instituicao} · {inst?.uf ?? ""}
                    {g.unidade ? ` · ${g.unidade}` : ""}
                    {g.fonteNota ? ` · ${g.fonteNota}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-text-soft">
                    <span className="font-medium text-text">Líder:</span> {g.lider}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {g.area}
                    </span>
                    {g.areaConhecimento && (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-soft">
                        {g.areaConhecimento}
                      </span>
                    )}
                    {(g.areaTematica ?? []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border px-2 py-0.5 text-xs text-text-soft"
                      >
                        {nomeDoTema(t)}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-3">
                    <ContatosBloco contato={contato} institucional={institucional} />
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <a
                        href={g.fonteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        Fonte oficial ({g.anoReferencia})
                      </a>
                      <span className="text-text-soft">
                        conferido em {dataBr(g.dataAcesso)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {totalPaginas > 1 && (
        <nav
          aria-label="Paginação dos grupos de pesquisa"
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs text-text-soft">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-40"
          >
            Próxima
          </button>
        </nav>
      )}

      {projetosFiltrados.length > 0 && (
        <section aria-label="Projetos de extensão" className="space-y-3">
          <h2 className="text-lg font-bold text-text">Projetos de extensão</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {projetosFiltrados.map((p) => {
              const inst = instituicoesPorSigla.get(p.instituicao.toUpperCase());
              const { contato, institucional } = contatoDoRegistro(p, instituicoes);
              return (
                <article
                  key={`${p.instituicao}-${p.nome}`}
                  className="flex flex-col rounded-xl border border-border bg-surface p-4"
                >
                  <h3 className="text-sm font-semibold leading-snug text-text">
                    {p.nome}
                  </h3>
                  <p className="mt-1 text-xs text-text-soft">
                    {inst?.sigla ?? p.instituicao} · {inst?.uf ?? ""} ·{" "}
                    {p.plataforma}
                  </p>
                  {p.area && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {p.area}
                      </span>
                    </div>
                  )}
                  <div className="mt-auto pt-3">
                    <ContatosBloco contato={contato} institucional={institucional} />
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        Página do projeto
                      </a>
                      <span className="text-text-soft">
                        conferido em {dataBr(p.dataAcesso)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {totalFiltrado === 0 && (
        <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-soft">
          Nenhum registro encontrado com esses filtros.{" "}
          <button
            type="button"
            onClick={limpar}
            className="font-semibold text-primary hover:underline"
          >
            Limpar filtros
          </button>
        </p>
      )}
    </section>
  );
}

function ContatosBloco({
  contato,
  institucional,
}: {
  contato: Contato | undefined;
  institucional: boolean;
}) {
  if (!contato) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-soft">
      {institucional && (
        <span className="w-full text-xs uppercase tracking-wide text-text-soft">
          Contato da instituição
        </span>
      )}
      {contato.site && (
        <a
          href={contato.site}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Globe className="h-3.5 w-3.5" aria-hidden="true" /> Site
        </a>
      )}
      {contato.instagram && (
        <a
          href={contato.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <AtSign className="h-3.5 w-3.5" aria-hidden="true" /> Instagram
        </a>
      )}
      {contato.telefone && (
        <a
          href={`tel:${contato.telefone.replace(/[^\d+]/g, "")}`}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {contato.telefone}
        </a>
      )}
      {contato.email && (
        <a
          href={`mailto:${contato.email}`}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {contato.email}
        </a>
      )}
    </div>
  );
}
