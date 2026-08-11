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

  const filtrados = useMemo(() => {
    const alvo = termo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim();
    if (!alvo) return municipios.slice(0, 24);
    return municipios
      .filter((m) =>
        m.nome
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
          .includes(alvo)
      )
      .slice(0, 40);
  }, [termo, municipios]);

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
      {!termo && municipios.length > filtrados.length ? (
        <p className="mt-3 text-xs opacity-60">
          Mostrando os {filtrados.length} municípios com mais barragens, de{" "}
          {formatNumberBR(municipios.length)} no total. Digite para buscar outro.
        </p>
      ) : null}
    </div>
  );
}
