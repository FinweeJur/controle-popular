"use client";

import { useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import type { FonteLegislacaoAmbiental, LegislacaoAmbientalRow } from "@/lib/db/queries/legislacao-ambiental";

/**
 * Busca unificada de `/ambiental/legislacao`.
 *
 * ═══ POR QUE É COMPONENTE CLIENTE COM ESTADO PRÓPRIO, SEM `useSearchParams` ═══
 *
 * `ListaLegislacao.tsx` (câmara municipal) usa `useSearchParams()` +
 * `<Suspense>` porque REFLETE o filtro na URL (link compartilhável). Aqui os
 * dados já chegam inteiros via prop — não há segunda fonte para sincronizar
 * com a URL, e adicionar `useSearchParams()` só para isso reintroduziria a
 * armadilha que aquele componente existe para evitar (F0-discovery.md §7),
 * sem ganho. Filtro fica em `useState` puro.
 *
 * ═══ A DICA DE SOBREPOSIÇÃO ENTRE FONTES ═══
 *
 * As três fontes têm sobreposição real e medida (a mesma Lei/Decreto pode
 * estar na ALMG E no Banco da Semad E no Siam — ver a migration `0063`).
 * Este componente NÃO esconde nenhuma linha por causa disso — cada uma tem
 * sua proveniência visível — mas quando `chaveDedup` bate com outra fonte
 * PRESENTE no conjunto carregado, o card ganha uma nota "também consta em:
 * X" para quem quiser conferir. É sinalização, não fusão.
 */

// Os 8 temas do pedido — mesmos slugs/rótulos de `etl/temas_ambientais.py`
// (`TEMA_LABELS`), copiados aqui porque o componente cliente não importa
// Python. Mudar um rótulo lá sem mudar aqui é o risco assumido — os dois
// lados são pequenos o bastante (8 entradas) pra conferir de olho.
const TEMA_LABEL: Record<string, string> = {
  mineracao: "Mineração",
  energia: "Energia",
  agropecuaria: "Agropecuária",
  barragens: "Barragens",
  recursos_hidricos: "Recursos Hídricos",
  residuos: "Resíduos",
  unidades_conservacao: "Unidades de Conservação",
  fauna_flora: "Fauna e Flora",
};

const TEMA_ORDEM = Object.keys(TEMA_LABEL);

// Tags finas — mesmos slugs/rótulos de `TAG_LABELS` em
// `etl/temas_ambientais.py`, só pra exibir no card sem precisar duplicar
// a lógica de classificação no cliente.
const TAG_LABEL: Record<string, string> = {
  mineracao_geral: "Mineração",
  energia_geral: "Energia",
  agropecuaria_geral: "Agropecuária",
  barragem: "Barragem",
  recursos_hidricos_geral: "Recursos Hídricos",
  bacia_hidrografica: "Bacia Hidrográfica",
  residuos_solidos: "Resíduos Sólidos",
  reciclagem: "Reciclagem",
  unidade_conservacao: "Unidade de Conservação",
  area_protecao_ambiental: "Área de Proteção Ambiental",
  rppn: "Reserva Particular (RPPN)",
  fauna: "Fauna",
  flora_florestal: "Flora e Política Florestal",
  licenciamento_ambiental: "Licenciamento Ambiental",
  fiscalizacao_ambiental: "Fiscalização Ambiental",
  mudanca_climatica: "Mudança Climática",
  desastre_ambiental: "Desastre Ambiental",
};

const FONTE_LABEL: Record<FonteLegislacaoAmbiental, string> = {
  almg: "ALMG",
  semad: "Semad",
  siam: "Siam",
};

const FONTE_LABEL_LONGO: Record<FonteLegislacaoAmbiental, string> = {
  almg: "Assembleia Legislativa de MG",
  semad: "Banco de Legislação Ambiental (Semad)",
  siam: "Siam — arquivo histórico",
};

const FONTE_COR: Record<FonteLegislacaoAmbiental, string> = {
  almg: "var(--cp-primary)",
  semad: "var(--cp-tertiary)",
  siam: "var(--cp-secondary)",
};

const FONTE_COR_INK: Record<FonteLegislacaoAmbiental, string> = {
  almg: "var(--cp-primary-ink)",
  semad: "var(--cp-tertiary-ink)",
  siam: "var(--cp-secondary-ink)",
};

const PAGINA = 40;

interface Props {
  linhas: LegislacaoAmbientalRow[];
}

function textoBusca(l: LegislacaoAmbientalRow): string {
  return semAcento(
    [l.tipo, l.numero, l.ano, l.ementa, l.orgao].filter((v) => v !== null && v !== undefined).join(" ")
  );
}

export default function BuscaLegislacaoAmbiental({ linhas }: Props) {
  const [q, setQ] = useState("");
  const [fonte, setFonte] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [ano, setAno] = useState<string>("");
  const [tema, setTema] = useState<string>("");
  const [visiveis, setVisiveis] = useState(PAGINA);

  const { tipos, anos, temasContagem } = useMemo(() => {
    const tiposCont = new Map<string, number>();
    const anosSet = new Set<number>();
    const temasCont = new Map<string, number>();
    for (const l of linhas) {
      tiposCont.set(l.tipo, (tiposCont.get(l.tipo) ?? 0) + 1);
      if (l.ano) anosSet.add(l.ano);
      for (const t of l.temas) temasCont.set(t, (temasCont.get(t) ?? 0) + 1);
    }
    return {
      tipos: [...tiposCont.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
      anos: [...anosSet].sort((a, b) => b - a),
      temasContagem: temasCont,
    };
  }, [linhas]);

  // chaveDedup -> fontes distintas que a compartilham, ENTRE as linhas
  // carregadas — usado só para a dica "também consta em", nunca para
  // remover linha.
  const fontesPorDedup = useMemo(() => {
    const mapa = new Map<string, Set<FonteLegislacaoAmbiental>>();
    for (const l of linhas) {
      if (!l.chaveDedup) continue;
      const s = mapa.get(l.chaveDedup) ?? new Set<FonteLegislacaoAmbiental>();
      s.add(l.fonte);
      mapa.set(l.chaveDedup, s);
    }
    return mapa;
  }, [linhas]);

  const termoNormalizado = semAcento(q.trim());

  const filtradas = useMemo(() => {
    return linhas.filter((l) => {
      if (fonte && l.fonte !== fonte) return false;
      if (tipo && l.tipo !== tipo) return false;
      if (ano && String(l.ano ?? "") !== ano) return false;
      if (tema && !l.temas.includes(tema)) return false;
      if (termoNormalizado && !textoBusca(l).includes(termoNormalizado)) return false;
      return true;
    });
  }, [linhas, fonte, tipo, ano, tema, termoNormalizado]);

  const temFiltro = Boolean(q || fonte || tipo || ano || tema);
  const visiveisAtuais = filtradas.slice(0, visiveis);

  function limpar() {
    setQ("");
    setFonte("");
    setTipo("");
    setAno("");
    setTema("");
    setVisiveis(PAGINA);
  }

  function alternarTema(t: string) {
    setTema((atual) => (atual === t ? "" : t));
    setVisiveis(PAGINA);
  }

  return (
    <div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4"
      >
        <div className="flex min-w-[220px] flex-1 flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Palavra-chave na ementa
          </label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setVisiveis(PAGINA);
            }}
            placeholder="ex.: recursos hídricos, licenciamento, resíduos..."
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="fonte" className="mb-1 text-xs font-medium text-text-soft">
            Fonte
          </label>
          <select
            id="fonte"
            value={fonte}
            onChange={(e) => {
              setFonte(e.target.value);
              setVisiveis(PAGINA);
            }}
            className="w-44 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todas</option>
            <option value="almg">ALMG</option>
            <option value="semad">Semad</option>
            <option value="siam">Siam</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="tipo" className="mb-1 text-xs font-medium text-text-soft">
            Tipo
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setVisiveis(PAGINA);
            }}
            className="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos</option>
            {tipos.map(([t, n]) => (
              <option key={t} value={t}>
                {t} ({formatNumberBR(n)})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
            Ano
          </label>
          <select
            id="ano"
            value={ano}
            onChange={(e) => {
              setAno(e.target.value);
              setVisiveis(PAGINA);
            }}
            className="w-28 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todos</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {temFiltro && (
          <button
            type="button"
            onClick={limpar}
            className="cursor-pointer pb-1.5 text-sm text-text-soft hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-soft">Tema:</span>
        {TEMA_ORDEM.filter((t) => temasContagem.has(t)).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => alternarTema(t)}
            aria-pressed={tema === t}
            className="cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={
              tema === t
                ? { background: "var(--cp-tertiary)", color: "var(--cp-tertiary-ink)", borderColor: "var(--cp-tertiary)" }
                : { borderColor: "var(--border)", color: "var(--color-text-soft, inherit)" }
            }
          >
            {TEMA_LABEL[t]} ({formatNumberBR(temasContagem.get(t) ?? 0)})
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-text-soft">
        <strong className="font-tabular text-text">{formatNumberBR(filtradas.length)}</strong>{" "}
        {filtradas.length === 1 ? "norma encontrada" : "normas encontradas"}
        {temFiltro ? " com este filtro" : ""} — de {formatNumberBR(linhas.length)} coletadas ao todo.
      </p>

      {filtradas.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          Nenhuma norma para esse filtro. A busca olha só a ementa — tente um termo mais curto.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {visiveisAtuais.map((l, idx) => {
            const outras = l.chaveDedup
              ? [...(fontesPorDedup.get(l.chaveDedup) ?? [])].filter((f) => f !== l.fonte)
              : [];
            return (
              <li
                key={`${l.fonte}-${l.tipo}-${l.numero}-${l.ano}-${idx}`}
                className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      title={FONTE_LABEL_LONGO[l.fonte]}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ background: FONTE_COR[l.fonte], color: FONTE_COR_INK[l.fonte] }}
                    >
                      {FONTE_LABEL[l.fonte]}
                    </span>
                    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                      {l.tipo}
                    </span>
                  </div>
                  {l.data && <span className="font-tabular text-xs text-text-soft">{formatDateBR(l.data)}</span>}
                </div>

                <p className="mt-2 font-medium text-text">
                  {l.tipo} {l.numero ? `nº ${l.numero}` : ""}
                  {l.ano ? `/${l.ano}` : ""}
                  {l.orgao ? <span className="font-normal text-text-soft"> — {l.orgao}</span> : null}
                </p>
                {l.ementa && <p className="mt-1 text-sm text-text-soft">{l.ementa}</p>}

                {l.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {l.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border px-2 py-0.5 text-[.72em] text-text-soft"
                      >
                        {TAG_LABEL[t] ?? t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {l.linkPdf && (
                    <a
                      href={l.linkPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Ver documento na fonte oficial →
                    </a>
                  )}
                  {outras.length > 0 && (
                    <span className="text-xs text-text-soft">
                      também consta em: {outras.map((f) => FONTE_LABEL[f]).join(", ")}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {filtradas.length > visiveisAtuais.length && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisiveis((v) => v + PAGINA)}
            className="cursor-pointer rounded-lg border border-border bg-surface px-5 py-2 text-sm font-semibold text-text hover:border-current"
          >
            Ver mais {formatNumberBR(Math.min(PAGINA, filtradas.length - visiveisAtuais.length))}
          </button>
        </div>
      )}
    </div>
  );
}
