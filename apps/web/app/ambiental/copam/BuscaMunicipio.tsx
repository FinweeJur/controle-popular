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
