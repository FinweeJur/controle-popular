"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

/**
 * Receitas prontas da API pública (`/api`) — o "experimente aqui" para quem
 * não é dev.
 *
 * ═══ O QUE É ═══
 *
 * O Swagger UI já deixa testar cada endpoint. Estas receitas são o atalho
 * didático: as três chamadas que quase todo mundo quer primeiro, com o comando
 * pronto para copiar e um botão para abrir o JSON no navegador.
 *
 * ═══ POR QUE NO CLIENTE ═══
 *
 * Copiar usa a área de transferência do navegador. A URL absoluta é montada no
 * clique, a partir da origem atual — assim a receita funciona no domínio que
 * estiver servindo a página.
 */

interface Receita {
  titulo: string;
  descricao: string;
  caminho: string;
}

const RECEITAS: Receita[] = [
  {
    titulo: "Catálogo de datasets",
    descricao: "Todos os conjuntos publicados, com fonte e ressalvas.",
    caminho: "/api/v1/manifesto.json",
  },
  {
    titulo: "Status do build",
    descricao: "A data do build e os endpoints que estão no ar.",
    caminho: "/api/v1/status.json",
  },
  {
    titulo: "Um dataset",
    descricao: "Troque {id} por um id do manifesto para pegar o conteúdo.",
    caminho: "/api/v1/datasets/{id}.json",
  },
];

export default function ExemplosApi() {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(receita: Receita) {
    const origem = typeof window === "undefined" ? "" : window.location.origin;
    const comando = `curl ${origem}${receita.caminho}`;
    try {
      await navigator.clipboard.writeText(comando);
      setCopiado(receita.caminho);
      window.setTimeout(() => setCopiado((atual) => (atual === receita.caminho ? null : atual)), 2000);
    } catch {
      setCopiado(null);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold">Receitas prontas</h2>
      <p className="opacity-80">
        As três chamadas mais pedidas, prontas para copiar. Cole no terminal ou
        abra no navegador.
      </p>
      <ul className="space-y-3">
        {RECEITAS.map((receita) => (
          <li
            key={receita.caminho}
            className="rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{receita.titulo}</p>
                <p className="text-sm opacity-80">{receita.descricao}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copiar(receita)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:text-primary dark:border-white/20"
                >
                  {copiado === receita.caminho ? (
                    <>
                      <Check size={13} aria-hidden="true" /> Copiado
                    </>
                  ) : (
                    <>
                      <Copy size={13} aria-hidden="true" /> Copiar curl
                    </>
                  )}
                </button>
                <a
                  href={receita.caminho}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-medium transition-colors hover:text-primary dark:border-white/20"
                >
                  <ExternalLink size={13} aria-hidden="true" /> Abrir
                </a>
              </div>
            </div>
            <code className="mt-2 block truncate rounded bg-black/5 px-2 py-1 text-xs dark:bg-white/10">
              GET {receita.caminho}
            </code>
          </li>
        ))}
      </ul>
    </section>
  );
}
