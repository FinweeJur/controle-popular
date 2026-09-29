"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import {
  FONTE_ANM_PROCESSOS,
  centroBBox,
  type EstadoCava,
  type ItemAmostra,
} from "@/lib/cavas/serie";

/**
 * Tabela da amostra datada de cavas — busca, filtro por estado, ordenação por
 * coluna e CSV do que está filtrado (as regras 2, 3 e 6 do AGENTS § 8).
 *
 * ═══ POR QUE A COLEÇÃO VEM COMO PROP ═══
 *
 * São centenas de bytes por linha: nada a ver com o caso de
 * `/ambiental/legislacao`, que serializou 35,5 MiB de lista inteira. Aqui o
 * conjunto cabe na página e o recorte é no navegador — mais simples e mais
 * rápido que um índice fatiado, e o AGENTS § 5.1 fixa o teto em ~2 mil linhas.
 *
 * ═══ O LINK DE CADA LINHA ═══
 *
 * Processo da ANM leva ao formulário oficial de consulta (sem parâmetro que
 * pré-preencha, checado em 13/08). A localização leva ao OpenStreetMap pelo
 * centro do bbox com o buffer de 80 m. **Não há imagem com data aqui**: a
 * série Sentinel está bloqueada, e a página diz isso em vez de fingir.
 */

const ROTULO_ESTADO: Record<EstadoCava, string> = {
  em_operacao: "Em operação",
  indicio_processual: "Indício processual",
  sem_cadastro_anm: "Sem cadastro na ANM",
};

type Chave = "id" | "ano_primeira_deteccao" | "area" | "estado";

const fmt = (n: number, casas = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });

export default function TabelaCavas({
  itens,
  dataColeta,
}: {
  itens: ItemAmostra[];
  dataColeta: string;
}) {
  const [busca, setBusca] = useState("");
  const [estado, setEstado] = useState<"todos" | EstadoCava>("todos");
  const [ordem, setOrdem] = useState<{ chave: Chave; dir: "asc" | "desc" }>({
    chave: "ano_primeira_deteccao",
    dir: "desc",
  });

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const base = itens.filter((i) => {
      if (estado !== "todos" && i.estado !== estado) return false;
      if (!termo) return true;
      const varredura = [
        String(i.id),
        i.ano_primeira_deteccao,
        ROTULO_ESTADO[i.estado],
        i.frase,
        ...i.fases,
        ...i.processos,
      ]
        .join(" ")
        .toLowerCase();
      return varredura.includes(termo);
    });
    const numero = (i: ItemAmostra, chave: Chave) =>
      chave === "ano_primeira_deteccao"
        ? Number(i.ano_primeira_deteccao)
        : chave === "area"
          ? Number(i.area)
          : chave === "id"
            ? i.id
            : i.estado;
    return [...base].sort((a, b) => {
      const va = numero(a, ordem.chave);
      const vb = numero(b, ordem.chave);
      const cmp = typeof va === "number" && typeof vb === "number"
        ? va - vb
        : String(va).localeCompare(String(vb), "pt-BR");
      return ordem.dir === "asc" ? cmp : -cmp;
    });
  }, [itens, busca, estado, ordem]);

  const colunas: ColunaCsv<ItemAmostra>[] = [
    { chave: "id", rotulo: "Polígono (mining_age)" },
    { chave: "ano_primeira_deteccao", rotulo: "Primeira detecção" },
    {
      chave: "area",
      rotulo: "Área (ha)",
      formatar: (v) => String(Number(v)).replace(".", ","),
    },
    { chave: "estado", rotulo: "Estado", formatar: (v) => ROTULO_ESTADO[v as EstadoCava] },
    { chave: "dentro_sigmine", rotulo: "Dentro de processo da ANM", formatar: (v) => (v ? "sim" : "não") },
    { chave: "fases", rotulo: "Fases da ANM", formatar: (v) => (v as string[]).join(" | ") },
    { chave: "processos", rotulo: "Processos da ANM", formatar: (v) => (v as string[]).join(" | ") },
  ];

  function ordenarPor(chave: Chave) {
    setOrdem((o) => (o.chave === chave ? { chave, dir: o.dir === "asc" ? "desc" : "asc" } : { chave, dir: "asc" }));
  }

  const seta = (chave: Chave) => (ordem.chave === chave ? (ordem.dir === "asc" ? " ▲" : " ▼") : "");

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Amostra de cavas conferidas com a ANM</h2>
          <p className="mt-1 text-sm text-text-soft">
            {filtradas.length} de {itens.length} linhas · coleta de{" "}
            {new Date(dataColeta).toLocaleDateString("pt-BR")} · semente fixa, reproduzível
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <label className="flex items-center gap-2 text-sm">
            <span>Buscar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="processo, fase, estado…"
              className="w-44 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span>Estado</span>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as "todos" | EstadoCava)}
              className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="em_operacao">Em operação</option>
              <option value="indicio_processual">Indício processual</option>
              <option value="sem_cadastro_anm">Sem cadastro na ANM</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => baixarCsv(colunas, filtradas, "cavas-mg-amostra")}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-ink"
          >
            Baixar CSV do filtrado
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {([
                ["id", "Polígono"],
                ["ano_primeira_deteccao", "1ª detecção"],
                ["area", "Área (ha)"],
                ["estado", "Estado"],
              ] as const).map(([chave, rotulo]) => (
                <th key={chave} scope="col" className="py-2 pr-4 font-semibold">
                  <button
                    type="button"
                    onClick={() => ordenarPor(chave)}
                    className="underline-offset-2 hover:underline"
                    aria-label={`Ordenar por ${rotulo}`}
                  >
                    {rotulo}
                    {seta(chave)}
                  </button>
                </th>
              ))}
              <th scope="col" className="py-2 pr-4 font-semibold">Fases da ANM</th>
              <th scope="col" className="py-2 pr-4 font-semibold">Processos</th>
              <th scope="col" className="py-2 font-semibold">Local</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((i) => {
              const c = centroBBox(i.bbox);
              return (
                <tr key={i.id} className="border-b border-border/50 align-top">
                  <th scope="row" className="py-2 pr-4 text-left font-medium tabular-nums">{i.id}</th>
                  <td className="py-2 pr-4 tabular-nums">{i.ano_primeira_deteccao}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{fmt(Number(i.area), 3)}</td>
                  <td className="py-2 pr-4">
                    <span className="whitespace-nowrap">{ROTULO_ESTADO[i.estado]}</span>
                    <span className="mt-0.5 block max-w-[22rem] text-xs text-text-soft">{i.frase}</span>
                  </td>
                  <td className="py-2 pr-4 text-xs">{i.fases.length ? i.fases.join(", ") : "—"}</td>
                  <td className="py-2 pr-4 text-xs">
                    {i.processos.length ? (
                      <a
                        href={FONTE_ANM_PROCESSOS}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                        title="Consulta oficial da ANM — digite o número no campo NUP"
                      >
                        {i.processos.slice(0, 2).join(", ")}
                        {i.processos.length > 2 ? ` +${i.processos.length - 2}` : ""}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-xs">
                    {c ? (
                      <a
                        href={`https://www.openstreetmap.org/#map=14/${c[1].toFixed(4)}/${c[0].toFixed(4)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap underline"
                      >
                        ver no mapa
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {filtradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-text-soft">
                  Nenhuma linha com estes filtros — lacuna é informação, não erro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-soft print:hidden">
        Ordenação crescente/decrescente em cada coluna; a busca varre processo, fase, estado e identificador.
        O CSV leva exatamente estas {filtradas.length} linhas, com <code>;</code> e BOM UTF-8.
      </p>
    </div>
  );
}
