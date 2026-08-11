"use client";

import { useMemo, useState } from "react";
import Link from "@/lib/ambiental/link";
import { formatNumberBR } from "@/lib/betim/format";
import type { MunicipioComItensCopam } from "@/lib/db/queries/copam";

/**
 * Filtro em memória sobre a lista de municípios com item de pauta — cabe
 * inteira no cliente (algumas centenas de linhas, ~id+nome+contagem), sem
 * precisar do padrão de JSON fatiado que `congresso/proposicoes` usa para
 * 5.500+ itens (ver `ListaProposicoes`). Gerar 1 página estática por
 * município é o que resolve a navegação; isto aqui só ajuda a achar qual.
 */
export default function BuscaMunicipio({
  municipios,
}: {
  municipios: MunicipioComItensCopam[];
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
      <label htmlFor="busca-municipio-copam" className="sr-only">
        Buscar município
      </label>
      <input
        id="busca-municipio-copam"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Digite o nome de uma cidade de Minas Gerais…"
        className="w-full rounded-lg border border-[var(--cp-border)] bg-transparent px-4 py-2.5 text-[.95em] outline-none focus:border-[var(--cp-primary)]"
      />

      {filtrados.length === 0 ? (
        <p className="mt-4 text-sm opacity-70">
          Nenhum município com item de pauta do COPAM bate com &quot;{termo}&quot;.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {filtrados.map((m) => (
            <li key={m.idIbge}>
              <Link
                href={`/copam/municipio/${m.idIbge}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--cp-border)] px-3 py-2 text-sm hover:border-[var(--cp-primary)]"
              >
                <span>{m.nome}</span>
                <span className="shrink-0 font-tabular text-xs opacity-60">
                  {formatNumberBR(m.qtdItens)} {m.qtdItens === 1 ? "item" : "itens"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!termo && municipios.length > filtrados.length ? (
        <p className="mt-3 text-xs opacity-60">
          Mostrando os {filtrados.length} municípios com mais itens, de {formatNumberBR(municipios.length)} no total. Digite para buscar outro.
        </p>
      ) : null}
    </div>
  );
}
