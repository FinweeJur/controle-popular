"use client";

import { useMemo, useState } from "react";
import type { RegistroConselho } from "@/lib/conselhos/tipos";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import BotaoAlertaContextual from "@/app/components/BotaoAlertaContextual";

/**
 * Catálogo de conselhos com busca, filtros e ordenação client-side.
 *
 * São 21 registros (poucos KiB), então o server component lê o catálogo e
 * passa tudo por prop: filtrar no navegador evita round-trip e mantém a
 * página 100% estática.
 */

const ROTULO_CATEGORIA: Record<string, string> = {
  bacias_hidrograficas: "Bacias hidrográficas",
  meio_ambiente: "Meio ambiente",
  unidades_conservacao: "Unidades de conservação",
  povos_tradicionais: "Povos e comunidades tradicionais",
  direitos_humanos: "Direitos humanos",
  saude: "Saúde",
  crianca_adolescente: "Criança e adolescente",
  patrimonio_cultural: "Patrimônio cultural",
};

function rotuloCategoria(categoria: string): string {
  return ROTULO_CATEGORIA[categoria] ?? categoria.replace(/_/g, " ");
}

const ROTULO_ESFERA: Record<string, string> = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  intermunicipal: "Intermunicipal",
};

type Ordem = "nome-az" | "nome-za" | "categoria";

export default function FiltroConselhos({
  conselhos,
}: {
  conselhos: RegistroConselho[];
}) {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [esfera, setEsfera] = useState("");
  const [uf, setUf] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("nome-az");

  const categorias = useMemo(() => {
    const set = new Set<string>();
    for (const c of conselhos) set.add(c.categoria);
    return [...set].sort((a, b) =>
      rotuloCategoria(a).localeCompare(rotuloCategoria(b), "pt"),
    );
  }, [conselhos]);

  const esferas = useMemo(() => {
    const set = new Set<string>();
    for (const c of conselhos) set.add(c.esfera);
    return [...set].sort((a, b) =>
      (ROTULO_ESFERA[a] ?? a).localeCompare(ROTULO_ESFERA[b] ?? b, "pt"),
    );
  }, [conselhos]);

  const ufs = useMemo(() => {
    const set = new Set<string>();
    for (const c of conselhos) {
      if (c.uf) set.add(c.uf);
    }
    return [...set].sort();
  }, [conselhos]);

  const filtrados = useMemo(() => {
    const termo = semAcento(busca.trim().toLowerCase());
    const lista = conselhos.filter((c) => {
      if (categoria && c.categoria !== categoria) return false;
      if (esfera && c.esfera !== esfera) return false;
      if (uf && c.uf !== uf) return false;
      if (!termo) return true;
      return (
        semAcento(c.nome.toLowerCase()).includes(termo) ||
        semAcento(c.sigla.toLowerCase()).includes(termo) ||
        (c.municipioNome
          ? semAcento(c.municipioNome.toLowerCase()).includes(termo)
          : false)
      );
    });
    return [...lista].sort((a, b) => {
      if (ordem === "nome-az") return a.nome.localeCompare(b.nome, "pt");
      if (ordem === "nome-za") return b.nome.localeCompare(a.nome, "pt");
      return (
        rotuloCategoria(a.categoria).localeCompare(
          rotuloCategoria(b.categoria),
          "pt",
        ) || a.nome.localeCompare(b.nome, "pt")
      );
    });
  }, [busca, categoria, esfera, uf, ordem, conselhos]);

  const filtroAtivo = Boolean(busca || categoria || esfera || uf);

  function limparFiltros() {
    setBusca("");
    setCategoria("");
    setEsfera("");
    setUf("");
    setOrdem("nome-az");
  }

  return (
    <div>
      {/* ═══ FILTROS ═══ */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[220px]">
            <span className="block text-[.82em] font-medium text-text-soft">
              Buscar por nome, sigla ou município
            </span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
              placeholder="ex.: CBH, Diamantina, tutelar"
            />
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Categoria
            </span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {rotuloCategoria(cat)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Esfera
            </span>
            <select
              value={esfera}
              onChange={(e) => setEsfera(e.target.value)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="">Todas</option>
              {esferas.map((esf) => (
                <option key={esf} value={esf}>
                  {ROTULO_ESFERA[esf] ?? esf}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              UF
            </span>
            <select
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="">Todas</option>
              {ufs.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="block text-[.82em] font-medium text-text-soft">
              Ordenar por
            </span>
            <select
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as Ordem)}
              className="mt-1 rounded-md border border-border bg-surface px-3 py-2 text-[.92em]"
            >
              <option value="nome-az">Nome (A–Z)</option>
              <option value="nome-za">Nome (Z–A)</option>
              <option value="categoria">Categoria</option>
            </select>
          </label>
          {filtroAtivo && (
            <button
              type="button"
              onClick={limparFiltros}
              className="pb-2 text-[.85em] font-medium text-text-soft underline hover:text-text"
            >
              limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ═══ CONTADOR ═══ */}
      <p className="mt-4 text-[.88em] text-text-soft" role="status">
        {filtroAtivo
          ? `${formatNumberBR(filtrados.length)} de ${formatNumberBR(conselhos.length)} conselhos`
          : `${formatNumberBR(filtrados.length)} ${filtrados.length === 1 ? "conselho" : "conselhos"}`}
      </p>

      {/* ═══ LISTA ═══ */}
      {filtrados.length === 0 ? (
        <p className="mt-6 rounded-xl border border-border bg-surface px-4 py-6 text-center text-[.92em] text-text-soft">
          Nenhum conselho com esses filtros. Vazio aqui é resposta — não quer
          dizer que a busca falhou.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {filtrados.map((c) => (
            <article
              key={c.id}
              className="rounded-2xl border border-border bg-surface-2 p-6 shadow-sm hover:border-teal-500/50 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                    {c.sigla}
                  </span>
                  <span className="text-xs text-muted font-medium">
                    {c.esfera.toUpperCase()} {c.uf ? `• ${c.uf}` : ""}{" "}
                    {c.municipioNome ? `• ${c.municipioNome}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {c.baciaHidrografica ? (
                    <span className="rounded bg-surface-3 px-2 py-0.5 text-xs text-muted">
                      🌊 {c.baciaHidrografica}
                    </span>
                  ) : null}
                  <BotaoAlertaContextual
                    tipo="contato"
                    titulo={`Contato Oficial: ${c.nome} (${c.sigla})`}
                    orgaoTerritorio={`${c.esfera.toUpperCase()} ${c.municipioNome ? `— ${c.municipioNome}` : (c.uf ? `— ${c.uf}` : "")}`}
                    identificador={`Sigla: ${c.sigla} | Bacia: ${c.baciaHidrografica ?? "Estadual/Nacional"}`}
                    link="https://controlepopular.com.br/ambiental/conselhos"
                    resumo={c.descricaoPapel}
                    telefones={
                      c.contatos.telefone
                        ? [c.contatos.telefone]
                        : c.contatos.canalDenuncia
                          ? [c.contatos.canalDenuncia]
                          : undefined
                    }
                    emails={c.contatos.email ? [c.contatos.email] : undefined}
                    variante="icone"
                  />
                </div>
              </div>

              <h3 className="mt-3 font-display text-lg font-bold text-foreground">
                {c.nome}
              </h3>
              <p className="mt-2 text-sm text-muted">{c.descricaoPapel}</p>

              <div className="mt-4 rounded-xl bg-surface-1 p-3 text-xs">
                <span className="font-semibold text-foreground">
                  Quem participa:{" "}
                </span>
                <span className="text-muted">{c.quemParticipa}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 pt-2 text-xs sm:grid-cols-2">
                {c.contatos.telefone ? (
                  <div className="text-muted">
                    📞{" "}
                    <span className="font-medium text-foreground">
                      {c.contatos.telefone}
                    </span>
                  </div>
                ) : null}
                {c.contatos.email ? (
                  <div className="text-muted">
                    ✉️{" "}
                    <a
                      href={`mailto:${c.contatos.email}`}
                      className="text-primary hover:underline"
                    >
                      {c.contatos.email}
                    </a>
                  </div>
                ) : null}
                {c.contatos.siteOficial ? (
                  <div className="text-muted">
                    🌐{" "}
                    <a
                      href={c.contatos.siteOficial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Portal oficial ↗
                    </a>
                  </div>
                ) : null}
                {c.contatos.canalDenuncia ? (
                  <div className="text-muted">
                    🚨{" "}
                    <span className="font-medium text-foreground">
                      {c.contatos.canalDenuncia}
                    </span>
                  </div>
                ) : null}
              </div>

              {c.contatos.reunioesPublicas ? (
                <p className="mt-3 text-[11px] text-muted italic border-t border-border pt-2">
                  🗓️ Reuniões: {c.contatos.reunioesPublicas}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
