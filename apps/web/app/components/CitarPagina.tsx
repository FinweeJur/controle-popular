"use client";

import { useState } from "react";
import { Check, Copy, Quote } from "lucide-react";

/**
 * "Citar esta página" — o botão de citação (padrão Wikipedia).
 *
 * ═══ O QUE É ═══
 *
 * Gera uma citação da página aberta no formato ABNT e um registro BibTeX, com
 * o título, o endereço e a data de acesso. Um clique copia. É o que jornalista,
 * estudante e pesquisador precisam para usar o dado com a fonte no lugar certo.
 *
 * ═══ POR QUE NO RODAPÉ, E NO CLIENTE ═══
 *
 * Fica no rodapé global, como o "Achou erro?", para valer em toda página. O
 * título e o endereço só existem no navegador; a citação é montada no clique —
 * sem divergência de hidratação e sem enviar nada a servidor.
 *
 * ═══ EDITORIAL ═══
 *
 * A citação aponta para a PÁGINA, não substitui a fonte oficial do dado. É o
 * portal como veículo; a fonte primária continua no botão "Fonte" de cada dado.
 */

type FormatoCitacao = "abnt" | "bibtex";

/** Título da página sem o sufixo de marca do portal. */
function tituloDaPagina(): string {
  return document.title.replace(/\s*[|—-]\s*(Controle Popular|ControlePopular).*$/i, "").trim();
}

/** Citação ABNT para página da web (referência + acesso). */
function gerarAbnt(): string {
  const titulo = tituloDaPagina();
  const url = window.location.href;
  const acesso = new Date().toLocaleDateString("pt-BR");
  return `CONTROLE POPULAR. ${titulo}. [S.I.]: Controle Popular. Disponível em: ${url}. Acesso em: ${acesso}.`;
}

/** Registro BibTeX para página da web. */
function gerarBibtex(): string {
  const titulo = tituloDaPagina();
  const url = window.location.href;
  const ano = new Date().getFullYear();
  const acesso = new Date().toLocaleDateString("pt-BR");
  return [
    "@misc{controlepopular,",
    `  title        = {${titulo}},`,
    "  author       = {Controle Popular},",
    `  year         = {${ano}},`,
    `  url          = {${url}},`,
    `  note         = {Acesso em: ${acesso}}`,
    "}",
  ].join("\n");
}

export default function CitarPagina() {
  const [aberto, setAberto] = useState(false);
  const [formato, setFormato] = useState<FormatoCitacao>("abnt");
  const [texto, setTexto] = useState("");
  const [copiado, setCopiado] = useState(false);

  function atualizar(fmt: FormatoCitacao) {
    setFormato(fmt);
    setTexto(fmt === "abnt" ? gerarAbnt() : gerarBibtex());
    setCopiado(false);
  }

  function alternar() {
    if (aberto) {
      setAberto(false);
      return;
    }
    setTexto(formato === "abnt" ? gerarAbnt() : gerarBibtex());
    setAberto(true);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
        title="Gerar a citação desta página"
      >
        <Quote size={13} aria-hidden="true" /> Citar esta página
      </button>

      {aberto && (
        <span className="mt-1 block w-full rounded-xl border border-border bg-surface-2 p-3 text-xs">
          <span className="mb-2 flex flex-wrap gap-1.5">
            {(["abnt", "bibtex"] as FormatoCitacao[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => atualizar(f)}
                aria-pressed={formato === f}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  formato === f ? "bg-primary text-white" : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                {f === "abnt" ? "ABNT" : "BibTeX"}
              </button>
            ))}
            <button
              type="button"
              onClick={copiar}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:text-primary"
            >
              {copiado ? (
                <>
                  <Check size={12} aria-hidden="true" /> Copiado
                </>
              ) : (
                <>
                  <Copy size={12} aria-hidden="true" /> Copiar
                </>
              )}
            </button>
          </span>
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-muted">
            {texto}
          </pre>
        </span>
      )}
    </span>
  );
}
