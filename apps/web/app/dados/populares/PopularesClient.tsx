"use client";

import { useEffect, useState } from "react";
import { formatDateBR } from "@/lib/betim/format";
import { rotularPath, type CidadeRotulo } from "@/lib/pageviews/rotulos";

const LIMITE_EXIBIDO = 15;
// Busca uma janela bem maior que o exibido: `page_views` grava TODA página
// (inclusive perfil de vereador, norma específica — ver a migration
// `0059_page_views.sql`), então o topo bruto por contagem pode ter várias
// páginas de entidade individual antes da 15ª página "principal" conhecida
// por `rotularPath`.
const LIMITE_BUSCADO = 300;

type LinhaApi = { path: string; contagem: number; atualizado_em: string };
type LinhaRotulada = LinhaApi & { rotulo: string };

type Estado =
  | { tipo: "carregando" }
  | { tipo: "erro" }
  | { tipo: "pronto"; linhas: LinhaRotulada[] };

export default function PopularesClient({ cidades }: { cidades: CidadeRotulo[] }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/pageview?limit=${LIMITE_BUSCADO}`)
      .then((r) => r.json())
      .then((dados: { rows?: LinhaApi[] }) => {
        if (cancelado) return;
        const linhas: LinhaRotulada[] = [];
        for (const r of dados.rows ?? []) {
          const rotulo = rotularPath(r.path, cidades);
          if (rotulo) linhas.push({ ...r, rotulo });
          if (linhas.length >= LIMITE_EXIBIDO) break;
        }
        setEstado({ tipo: "pronto", linhas });
      })
      .catch(() => {
        if (!cancelado) setEstado({ tipo: "erro" });
      });
    return () => {
      cancelado = true;
    };
  }, [cidades]);

  if (estado.tipo === "carregando") {
    return <p className="mt-8 text-text-soft">Carregando ranking…</p>;
  }
  if (estado.tipo === "erro") {
    return <p className="mt-8 text-text-soft">Não foi possível carregar o ranking agora.</p>;
  }
  if (estado.linhas.length === 0) {
    return <p className="mt-8 text-text-soft">Ainda não há visualizações registradas.</p>;
  }

  return (
    <ol className="mt-8 flex flex-col gap-2">
      {estado.linhas.map((linha, i) => (
        <li
          key={linha.path}
          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3"
        >
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="w-6 shrink-0 text-right text-[.85em] text-text-soft">{i + 1}.</span>
            <a href={linha.path} className="truncate font-medium text-text hover:text-primary">
              {linha.rotulo}
            </a>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-display font-semibold text-text">
              {linha.contagem.toLocaleString("pt-BR")}
            </div>
            <div className="text-[.75em] text-text-soft">
              atualizado {formatDateBR(linha.atualizado_em)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
