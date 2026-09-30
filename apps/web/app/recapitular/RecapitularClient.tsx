"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Printer } from "lucide-react";
import { type CidadeComparavel, resumoTexto } from "@/lib/comparador/cidades";

/**
 * Recapitulação compartilhável ("cartão da cidade").
 *
 * ═══ O QUE É ═══
 *
 * Escolhe uma cidade e monta um resumo curto, pronto para copiar e colar no
 * WhatsApp ou no e-mail: população, PIB, repasses, saúde e escolas, com a
 * fonte e a data coladas ao número. Sem cadastro e sem imagem — texto que
 * abre em qualquer aparelho.
 *
 * ═══ POR QUE TEXTO, E NÃO IMAGEM ═══
 *
 * Imagem exige geração no servidor (custo) ou canvas (acessibilidade pior).
 * O texto copia, cola, lê em voz alta e cabe no SMS. É o formato que o leitor
 * sob estresse consegue usar de fato.
 */

interface Props {
  cidades: CidadeComparavel[];
  dataAcervo: string | null;
}

export default function RecapitularClient({ cidades, dataAcervo }: Props) {
  const [id, setId] = useState(() => cidades.find((c) => c.id === "3106200")?.id ?? cidades[0]?.id ?? "");
  const [copiado, setCopiado] = useState(false);

  const cidade = useMemo(() => cidades.find((c) => c.id === id), [cidades, id]);
  const texto = useMemo(() => (cidade ? resumoTexto(cidade, dataAcervo) : ""), [cidade, dataAcervo]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  const rotaCidade = cidade ? (cidade.slug ? `/${cidade.slug}` : `/terra-e-territorios/cidades/${cidade.id}`) : "/cidades";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Escolha a cidade</span>
          <select
            value={id}
            onChange={(e) => setId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {cidades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}/{c.uf}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copiar}
            disabled={!cidade}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {copiado ? (
              <>
                <Check size={14} aria-hidden="true" /> Copiado
              </>
            ) : (
              <>
                <Copy size={14} aria-hidden="true" /> Copiar resumo
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground transition-colors hover:text-primary"
          >
            <Printer size={14} aria-hidden="true" /> Imprimir
          </button>
        </div>
      </div>

      {cidade && (
        <>
          <pre
            aria-live="polite"
            className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-border bg-surface-2/60 p-5 text-sm leading-relaxed text-foreground"
          >
            {texto}
          </pre>

          <Link
            href={rotaCidade}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Ver a página de {cidade.nome} <ExternalLink size={12} aria-hidden="true" />
          </Link>
        </>
      )}
    </div>
  );
}
