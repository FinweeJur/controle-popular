"use client";

import { useMemo, useState } from "react";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import type { MunicipioComBarragens } from "@/lib/db/queries/barragens";

/**
 * Filtro em memória sobre a lista de municípios com barragem — mesmo padrão
 * de `ambiental/copam/BuscaMunicipio.tsx` (algumas centenas de linhas cabem
 * no cliente inteiras). A diferença é mostrar as DUAS contagens lado a
 * lado: um município pode ter só FEAM, só SNISB, ou as duas — nunca somadas
 * (ver `lib/db/queries/barragens.ts`).
 */
export default function BuscaMunicipio({ municipios }: { municipios: MunicipioComBarragens[] }) {
  const [termo, setTermo] = useState("");
  // Limite inicial; o botão "Ver +" acrescenta de 48 em 48 até mostrar tudo.
  const [visiveis, setVisiveis] = useState(24);
  const PASSO = 48;
  // Mudou a busca? Volta ao corte inicial.
  const [termoAnterior, setTermoAnterior] = useState(termo);
  if (termo !== termoAnterior) {
    setTermoAnterior(termo);
    setVisiveis(24);
  }

  const correspondentes = useMemo(() => {
    const alvo = termo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
    if (!alvo) return municipios;
    return municipios.filter((m) =>
      m.nome
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .includes(alvo)
    );
  }, [termo, municipios]);

  const filtrados = correspondentes.slice(0, visiveis);

  return (
    <div>
      <label htmlFor="busca-municipio-barragens" className="sr-only">
        Buscar município
      </label>
      <input
        id="busca-municipio-barragens"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Digite o nome de uma cidade de Minas Gerais…"
        className="w-full rounded-lg border border-[var(--cp-border)] bg-transparent px-4 py-2.5 text-[.95em] outline-none focus:border-[var(--cp-primary)]"
      />

      {filtrados.length === 0 ? (
        <p className="mt-4 text-sm opacity-70">
          Nenhum município com barragem cadastrada bate com &quot;{termo}&quot;.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {filtrados.map((m) => (
            <li key={m.idIbge}>
              <Link
                href={`/barragens/municipio/${m.idIbge}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--cp-border)] px-3 py-2 text-sm hover:border-[var(--cp-primary)]"
              >
                <span>{m.nome}</span>
                <span className="shrink-0 font-tabular text-xs opacity-60">
                  {m.totalFeam > 0 ? `${m.totalFeam} FEAM` : null}
                  {m.totalFeam > 0 && m.totalSnisb > 0 ? " · " : null}
                  {m.totalSnisb > 0 ? `${m.totalSnisb} SNISB` : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {filtrados.length < correspondentes.length ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setVisiveis((v) => v + PASSO)}
            className="rounded-lg border border-[var(--cp-border)] bg-surface px-5 py-2.5 text-sm font-medium hover:border-[var(--cp-primary)] transition-colors"
          >
            Ver + ({formatNumberBR(correspondentes.length - filtrados.length)} restantes)
          </button>
          <p className="text-xs opacity-60">
            Mostrando {formatNumberBR(filtrados.length)} de {formatNumberBR(correspondentes.length)}
            {termo ? " que batem com a busca" : ""}.
          </p>
        </div>
      ) : null}
    </div>
  );
}
