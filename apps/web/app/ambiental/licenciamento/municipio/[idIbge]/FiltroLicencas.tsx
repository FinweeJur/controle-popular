"use client";

import { useMemo, useState } from "react";
import { formatCNPJRaiz, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import type { LicencaAmbiental } from "@/lib/db/queries/ambiental-licenciamento";

/**
 * Filtro por setor/modalidade/classe + lista, dentro de UM município.
 *
 * Diferente de `ListaProposicoes` (5.562 linhas/16 MiB, precisa do índice
 * fatiado + Route Handler), o maior município desta tabela tem ~650
 * licenças (Uberlândia, medido 2026-08-11) — cabe inteiro nas props do
 * Server Component, sem `fetch` nem `TabelaEstatica`. O filtro é só
 * `useState`/`useMemo` sobre o array que já chegou pronto.
 */
const ROTULO_DOCUMENTO: Record<string, string> = {
  cnpj_redigido_pela_fonte: "raiz do CNPJ (a fonte já redige o restante)",
  cnpj_nao_redigido: "raiz do CNPJ (restante mascarado por este portal)",
  cpf: "pessoa física",
  indeterminado_tratado_como_pf: "documento ambíguo — tratado como pessoa física",
  corrompido_na_fonte: "documento ilegível na própria fonte",
};

export default function FiltroLicencas({ licencas }: { licencas: LicencaAmbiental[] }) {
  const [setor, setSetor] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [classe, setClasse] = useState("");

  const opcoes = useMemo(() => {
    const setores = new Map<string, string>();
    const modalidades = new Set<string>();
    const classes = new Set<number>();
    for (const l of licencas) {
      setores.set(l.setorLetra, l.setorRotulo);
      modalidades.add(l.modalidade);
      if (l.classe !== null) classes.add(l.classe);
    }
    return {
      setores: [...setores.entries()].sort(([a], [b]) => a.localeCompare(b)),
      modalidades: [...modalidades].sort(),
      classes: [...classes].sort((a, b) => a - b),
    };
  }, [licencas]);

  const filtradas = useMemo(() => {
    return licencas.filter((l) => {
      if (setor && l.setorLetra !== setor) return false;
      if (modalidade && l.modalidade !== modalidade) return false;
      if (classe && String(l.classe) !== classe) return false;
      return true;
    });
  }, [licencas, setor, modalidade, classe]);

  const filtroAtivo = Boolean(setor || modalidade || classe);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4">
        <label className="text-sm">
          <span className="mr-2 opacity-75">Setor</span>
          <select
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
          >
            <option value="">Todos</option>
            {opcoes.setores.map(([letra, rotulo]) => (
              <option key={letra} value={letra}>
                {letra} — {rotulo}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2 opacity-75">Modalidade</span>
          <select
            value={modalidade}
            onChange={(e) => setModalidade(e.target.value)}
            className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
          >
            <option value="">Todas</option>
            {opcoes.modalidades.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mr-2 opacity-75">Classe</span>
          <select
            value={classe}
            onChange={(e) => setClasse(e.target.value)}
            className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
          >
            <option value="">Todas</option>
            {opcoes.classes.map((c) => (
              <option key={c} value={String(c)}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {filtroAtivo && (
          <button
            type="button"
            onClick={() => {
              setSetor("");
              setModalidade("");
              setClasse("");
            }}
            className="text-sm underline"
          >
            limpar
          </button>
        )}
        <p className="ml-auto font-tabular text-xs opacity-60">
          {formatNumberBR(filtradas.length)} de {formatNumberBR(licencas.length)}
        </p>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-6 rounded-lg border border-[var(--cp-border)] p-5 text-sm opacity-80">
          Nenhuma licença bate com este filtro.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filtradas.map((l) => (
            <li key={l.idFonte} className="rounded-lg border border-[var(--cp-border)] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {l.ehPessoaFisica
                    ? "Pessoa física"
                    : l.nomeEmpreendimento ?? "(nome não informado pela fonte)"}
                </p>
                <span
                  className="shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium"
                  style={{ borderColor: "var(--cp-tertiary)" }}
                >
                  {l.setorLetra} · {l.subsetor}
                </span>
              </div>

              <p className="mt-1 text-sm opacity-80">{l.atividadeDescricao ?? l.atividadeCodigo}</p>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-70">
                <span>Modalidade: {l.modalidade}</span>
                {l.classe !== null && <span>Classe {l.classe}</span>}
                <span>Fase: {l.faseLicenciamento}</span>
                <span>Situação: {l.situacao}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-70">
                {l.dataEmissao && <span>Emitida em {formatDateBR(l.dataEmissao)}</span>}
                {l.dataValidade && <span>Válida até {formatDateBR(l.dataValidade)}</span>}
                {l.cnpjRaiz && <span className="font-tabular">CNPJ {formatCNPJRaiz(l.cnpjRaiz)}</span>}
                <span className="opacity-60">{ROTULO_DOCUMENTO[l.documentoClassificacao]}</span>
              </div>

              {l.latitude !== null && l.longitude !== null ? (
                <p className="mt-2 text-xs">
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${l.latitude}&mlon=${l.longitude}#map=15/${l.latitude}/${l.longitude}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="underline opacity-80 hover:opacity-100"
                  >
                    Ver localização no mapa ↗
                  </a>
                </p>
              ) : null}

              {l.numeroProcesso ? (
                <p className="mt-2 font-mono text-xs opacity-70">Processo {l.numeroProcesso}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
