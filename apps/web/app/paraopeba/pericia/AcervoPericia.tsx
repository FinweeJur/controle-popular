"use client";

import { useMemo, useState } from "react";
import {
  SECAO_PERICIA_ORDEM,
  type EstudoPericiaComTema,
  type SecaoPericia,
} from "@/lib/paraopeba/pericia-rotulos";

/**
 * Navegação do acervo da perícia: busca por nome e filtro por seção.
 *
 * A seção é o filtro principal, e não o tema, porque **o tema quase não
 * existe neste acervo** — 21 dos 445 documentos têm eixo atribuível. Oferecer
 * filtro por tema como porta de entrada devolveria lista vazia quase sempre e
 * daria a impressão de que o acervo é irrelevante, quando o que acontece é
 * que ele é majoritariamente administrativo.
 *
 * O contador por seção fica visível no próprio botão: é o que faz "101
 * editais" ser um fato na tela em vez de uma nota de rodapé.
 */

export default function AcervoPericia({
  documentos,
  rotulos,
}: {
  documentos: EstudoPericiaComTema[];
  rotulos: Record<SecaoPericia, string>;
}) {
  const [busca, setBusca] = useState("");
  const [secao, setSecao] = useState<SecaoPericia | "todas">("todas");

  const contagem = useMemo(() => {
    const c = new Map<SecaoPericia, number>();
    for (const d of documentos) c.set(d.secao, (c.get(d.secao) ?? 0) + 1);
    return c;
  }, [documentos]);

  const nomeLegivel = (nome: string) => {
    try {
      return decodeURIComponent(nome);
    } catch {
      return nome;
    }
  };

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return documentos.filter((d) => {
      if (secao !== "todas" && d.secao !== secao) return false;
      if (!termo) return true;
      return nomeLegivel(d.nomeArquivo).toLowerCase().includes(termo);
    });
  }, [documentos, busca, secao]);

  const secoesPresentes = SECAO_PERICIA_ORDEM.filter((s) => (contagem.get(s) ?? 0) > 0);

  return (
    <div className="mt-4">
      <label className="block">
        <span className="sr-only">Buscar no acervo da perícia</span>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome do arquivo…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-[.95em] text-text placeholder:text-text-soft focus:border-primary focus:outline-none"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSecao("todas")}
          aria-pressed={secao === "todas"}
          className={`rounded-full border px-3 py-1 text-[.82em] transition ${
            secao === "todas"
              ? "border-primary bg-primary text-white"
              : "border-border text-text-soft hover:border-primary hover:text-primary"
          }`}
        >
          Todas ({documentos.length})
        </button>
        {secoesPresentes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSecao(s)}
            aria-pressed={secao === s}
            className={`rounded-full border px-3 py-1 text-[.82em] transition ${
              secao === s
                ? "border-primary bg-primary text-white"
                : "border-border text-text-soft hover:border-primary hover:text-primary"
            }`}
          >
            {rotulos[s]} ({contagem.get(s)})
          </button>
        ))}
      </div>

      <p className="mt-3 text-[.85em] text-text-soft" role="status" aria-live="polite">
        {filtrados.length === documentos.length
          ? `${documentos.length} arquivos`
          : `${filtrados.length} de ${documentos.length} arquivos`}
      </p>

      <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
        {filtrados.slice(0, 200).map((d) => (
          <li key={d.url} className="px-4 py-3">
            <a
              href={d.url}
              className="text-[.94em] text-text hover:text-primary"
              rel="noreferrer noopener"
              target="_blank"
            >
              {nomeLegivel(d.nomeArquivo)}
            </a>
            <div className="mt-1 text-[.8em] text-text-soft">
              {rotulos[d.secao]}
              {d.anoMes ? ` · ${d.anoMes}` : ""}
            </div>
          </li>
        ))}
      </ul>

      {filtrados.length > 200 && (
        /* Teto declarado: lista longa demais trava o navegador, e cortar em
           silêncio faria o acervo parecer menor do que é. */
        <p className="mt-3 text-[.85em] text-text-soft">
          Mostrando os 200 primeiros de {filtrados.length}. Use a busca ou o filtro por seção para
          chegar ao que procura.
        </p>
      )}

      {filtrados.length === 0 && (
        <p className="mt-3 text-[.9em] text-text-soft">Nenhum arquivo com esse termo.</p>
      )}
    </div>
  );
}
