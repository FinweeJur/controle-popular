"use client";

import { useMemo, useState } from "react";
import Link from "@/lib/ambiental/link";
import type { BarragemFeamMg } from "@/lib/db/queries/barragens";

/**
 * Filtro em memória sobre as 249 barragens da FEAM — é a única das duas
 * fontes que preenche condição de estabilidade, nível de emergência e
 * categoria de risco (ver a docstring de `lib/db/queries/barragens.ts`), e
 * é esse vocabulário — literal do §5 do F0-discovery — que os três filtros
 * abaixo usam, não uma paráfrase.
 *
 * Os dois botões de destaque (nível ≥ 1, sem estabilidade atestada) só
 * ajustam o MESMO estado dos selects — não é um caminho separado — para não
 * ter dois lugares que podem discordar sobre o que está filtrado.
 */

const TODOS = "todos";

type FiltroEmergencia = "todos" | "0" | "1" | "2" | "3";
type FiltroEstabilidade = "todos" | "Atestada" | "Não Atestada" | "Não apresentou";
type FiltroRisco = "todos" | "BAIXO" | "MEDIO" | "ALTO";

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function Etiqueta({ children, alerta }: { children: React.ReactNode; alerta?: boolean }) {
  return (
    <span
      className="rounded-md border px-2 py-0.5 text-xs"
      style={{
        borderColor: alerta ? "var(--cp-alert)" : "var(--cp-border)",
        color: alerta ? "var(--cp-alert)" : undefined,
      }}
    >
      {children}
    </span>
  );
}

function BotaoFiltro({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
      style={{
        borderColor: ativo ? "var(--cp-tertiary)" : "var(--cp-border)",
        color: ativo ? "var(--cp-tertiary)" : undefined,
        opacity: ativo ? 1 : 0.75,
      }}
    >
      {children}
    </button>
  );
}

export default function TabelaFeam({ barragens }: { barragens: BarragemFeamMg[] }) {
  const [busca, setBusca] = useState("");
  const [emergencia, setEmergencia] = useState<FiltroEmergencia>(TODOS);
  const [estabilidade, setEstabilidade] = useState<FiltroEstabilidade>(TODOS);
  const [risco, setRisco] = useState<FiltroRisco>(TODOS);
  const [tag, setTag] = useState<string>(TODOS);

  const opcoesTag = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const b of barragens) {
      for (const t of b.tags) {
        contagem.set(t, (contagem.get(t) ?? 0) + 1);
      }
    }
    return [...contagem.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt"))
      .map(([t]) => t);
  }, [barragens]);

  const emEmergencia = useMemo(() => barragens.filter((b) => (b.nivelEmergencia ?? 0) >= 1), [barragens]);
  const semEstabilidade = useMemo(
    () => barragens.filter((b) => b.condicaoEstabilidade != null && b.condicaoEstabilidade !== "Atestada"),
    [barragens]
  );

  const filtradas = useMemo(() => {
    const alvo = busca ? normalizar(busca) : "";
    return barragens.filter((b) => {
      if (emergencia !== TODOS && String(b.nivelEmergencia ?? 0) !== emergencia) return false;
      if (estabilidade !== TODOS && b.condicaoEstabilidade !== estabilidade) return false;
      if (risco !== TODOS && b.categoriaRisco !== risco) return false;
      if (tag !== TODOS && !b.tags.includes(tag)) return false;
      if (alvo && !normalizar(b.nome).includes(alvo) && !normalizar(b.municipio).includes(alvo)) return false;
      return true;
    });
  }, [barragens, emergencia, estabilidade, risco, tag, busca]);

  const destaqueEmergenciaAtivo = emergencia === "1" || emergencia === "2" || emergencia === "3";
  function alternarDestaqueEmergencia() {
    // Os três selects de detalhe (0/1/2/3) continuam disponíveis; este
    // botão só é um atalho para "nível 1 ou mais" — não existe um quarto
    // valor "1+" no vocabulário da fonte (§5), então o atalho pousa em "1",
    // que já é o corte que a tela usa para "requer atenção".
    setEmergencia((atual) => (atual === TODOS ? "1" : TODOS));
  }
  function alternarDestaqueEstabilidade() {
    setEstabilidade((atual) => (atual === TODOS ? "Não Atestada" : TODOS));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={alternarDestaqueEmergencia}
          className="flex-1 rounded-lg border p-3 text-left transition-colors"
          style={{ borderColor: destaqueEmergenciaAtivo ? "var(--cp-alert)" : "var(--cp-border)" }}
        >
          <p className="font-tabular text-2xl font-bold" style={{ color: "var(--cp-alert)" }}>
            {emEmergencia.length}
          </p>
          <p className="text-xs opacity-75">
            em nível de emergência ≥ 1 — {emEmergencia.filter((b) => b.nivelEmergencia === 3).length} no nível 3
          </p>
        </button>
        <button
          type="button"
          onClick={alternarDestaqueEstabilidade}
          className="flex-1 rounded-lg border p-3 text-left transition-colors"
          style={{ borderColor: estabilidade !== TODOS ? "var(--cp-alert)" : "var(--cp-border)" }}
        >
          <p className="font-tabular text-2xl font-bold" style={{ color: "var(--cp-alert)" }}>
            {semEstabilidade.length}
          </p>
          <p className="text-xs opacity-75">sem condição de estabilidade atestada</p>
        </button>
      </div>

      <div className="mt-5">
        <label htmlFor="busca-barragem-feam" className="sr-only">
          Buscar barragem ou município
        </label>
        <input
          id="busca-barragem-feam"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome da barragem ou do município…"
          className="w-full rounded-lg border border-[var(--cp-border)] bg-transparent px-4 py-2.5 text-[.95em] outline-none focus:border-[var(--cp-primary)]"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="self-center text-xs font-semibold uppercase tracking-wide opacity-60">
          Nível de emergência
        </span>
        {(["todos", "0", "1", "2", "3"] as const).map((v) => (
          <BotaoFiltro key={v} ativo={emergencia === v} onClick={() => setEmergencia(v)}>
            {v === "todos" ? "Todos" : v}
          </BotaoFiltro>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="self-center text-xs font-semibold uppercase tracking-wide opacity-60">
          Condição de estabilidade
        </span>
        {(["todos", "Atestada", "Não Atestada", "Não apresentou"] as const).map((v) => (
          <BotaoFiltro key={v} ativo={estabilidade === v} onClick={() => setEstabilidade(v)}>
            {v === "todos" ? "Todas" : v}
          </BotaoFiltro>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="self-center text-xs font-semibold uppercase tracking-wide opacity-60">
          Categoria de risco
        </span>
        {(["todos", "BAIXO", "MEDIO", "ALTO"] as const).map((v) => (
          <BotaoFiltro key={v} ativo={risco === v} onClick={() => setRisco(v)}>
            {v === "todos" ? "Todas" : v}
          </BotaoFiltro>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide opacity-60">Tag</span>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded-md border border-[var(--cp-border)] bg-transparent px-2 py-1 text-xs"
        >
          <option value="todos">Todas</option>
          {opcoesTag.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-xs opacity-60">
        {filtradas.length} de {barragens.length} barragens da FEAM.
      </p>

      <ul className="mt-3 flex flex-col gap-2">
        {filtradas.map((b) => {
          const emerg = b.nivelEmergencia ?? 0;
          return (
            <li
              key={`${b.idIbge}-${b.nome}`}
              className="rounded-lg border border-[var(--cp-border)] p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">{b.nome}</p>
                <Link
                  href={`/barragens/municipio/${b.idIbge}`}
                  className="shrink-0 text-xs underline opacity-70 hover:opacity-100"
                >
                  {b.municipio}
                </Link>
              </div>
              {b.empreendedor ? <p className="mt-1 text-sm opacity-80">{b.empreendedor}</p> : null}
              <p className="mt-2 flex flex-wrap gap-1.5">
                {emerg >= 1 ? <Etiqueta alerta>nível de emergência {emerg}</Etiqueta> : null}
                {b.metodoConstrutivo === "Montante" ? <Etiqueta alerta>alteamento a montante</Etiqueta> : null}
                {b.condicaoEstabilidade && b.condicaoEstabilidade !== "Atestada" ? (
                  <Etiqueta alerta>estabilidade: {b.condicaoEstabilidade.toLowerCase()}</Etiqueta>
                ) : null}
                {b.condicaoEstabilidade === "Atestada" ? <Etiqueta>estabilidade atestada</Etiqueta> : null}
                {b.suspensao === "Sim" ? <Etiqueta alerta>operação suspensa</Etiqueta> : null}
              </p>
              {b.tags.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1.5">
                  {b.tags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className="rounded-full border border-[var(--cp-border)] px-2 py-0.5 text-xs opacity-80 transition-colors hover:border-[var(--cp-tertiary)] hover:opacity-100"
                    >
                      {t}
                    </button>
                  ))}
                </p>
              )}
              <p className="mt-2 text-xs opacity-60">
                {[
                  b.atividade,
                  b.situacao,
                  b.categoriaRisco && `risco ${b.categoriaRisco.toLowerCase()}`,
                  b.danoPotencial && `dano potencial ${b.danoPotencial.toLowerCase()}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
