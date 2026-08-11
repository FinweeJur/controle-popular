"use client";

import { useMemo, useState } from "react";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import type { MunicipioComLicenciamento } from "@/lib/db/queries/ambiental-licenciamento";

/**
 * Filtro em memória sobre a lista de municípios com licença — mesmo padrão
 * de `app/ambiental/copam/BuscaMunicipio.tsx` (algumas centenas de linhas
 * de id+nome+contagem cabem inteiras no cliente; gerar 1 página estática
 * por município é o que resolve a navegação, isto aqui só ajuda a achar
 * qual).
 */
export default function BuscaMunicipioLicenciamento({
  municipios,
}: {
  municipios: MunicipioComLicenciamento[];
}) {
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
      <label htmlFor="busca-municipio-licenciamento" className="sr-only">
        Buscar município
      </label>
      <input
        id="busca-municipio-licenciamento"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Digite o nome de uma cidade de Minas Gerais…"
        className="w-full rounded-lg border border-[var(--cp-border)] bg-transparent px-4 py-2.5 text-[.95em] outline-none focus:border-[var(--cp-tertiary)]"
      />

      {filtrados.length === 0 ? (
        <p className="mt-4 text-sm opacity-70">
          Nenhum município com licença ambiental coletada bate com &quot;{termo}&quot;.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {filtrados.map((m) => (
            <li key={m.idIbge}>
              <Link
                href={`/licenciamento/municipio/${m.idIbge}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--cp-border)] px-3 py-2 text-sm hover:border-[var(--cp-tertiary)]"
              >
                <span>{m.nome}</span>
                <span className="shrink-0 font-tabular text-xs opacity-60">
                  {formatNumberBR(m.total)} {m.total === 1 ? "licença" : "licenças"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!termo && municipios.length > filtrados.length ? (
        <p className="mt-3 text-xs opacity-60">
          Mostrando os {filtrados.length} municípios com mais licenças, de{" "}
          {formatNumberBR(municipios.length)} no total. Digite para buscar outro.
        </p>
      ) : null}
    </div>
  );
}
