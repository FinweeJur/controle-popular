import React from "react";
import { FileText, ExternalLink, ShieldCheck, Download } from "lucide-react";

export interface DocumentoItem {
  titulo: string;
  descricao: string;
  url: string;
  tipo?: "oficial" | "estudo" | "legislacao" | "dados" | "noticia";
  orgao?: string;
  formato?: string;
}

interface DocumentosRelacionadosProps {
  documentos: DocumentoItem[];
  titulo?: string;
  subtitulo?: string;
  className?: string;
}

export default function DocumentosRelacionados({
  documentos,
  titulo = "Documentos Relacionados & Fontes Primárias",
  subtitulo = "Atos oficiais, dados abertos e fontes públicas auditadas para verificação direta pelo cidadão.",
  className = "",
}: DocumentosRelacionadosProps) {
  if (!documentos || documentos.length === 0) return null;

  return (
    <section
      aria-label={titulo}
      className={`rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-text">
            {titulo}
          </h2>
          <p className="mt-1 text-xs text-text-soft">{subtitulo}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
          <ShieldCheck size={13} aria-hidden="true" />
          <span>{documentos.length} fontes verificadas</span>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {documentos.map((doc, idx) => {
          const isExterno = doc.url.startsWith("http");
          return (
            <div
              key={doc.titulo + idx}
              className="flex flex-col justify-between rounded-xl border border-border/70 bg-surface-2/30 p-4 transition-all duration-150 hover:border-primary/50 hover:bg-surface-2/60"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded border border-border px-1.5 py-0.5 text-[0.68em] font-semibold uppercase tracking-wider text-text-soft">
                    {doc.orgao ?? doc.tipo ?? "Fonte Oficial"}
                  </span>
                  {doc.formato && (
                    <span className="font-mono text-[0.65em] font-bold text-text-soft">
                      {doc.formato}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-display text-sm font-bold text-text">
                  {doc.titulo}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-text-soft">
                  {doc.descricao}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-border/40">
                <a
                  href={doc.url}
                  target={isExterno ? "_blank" : undefined}
                  rel={isExterno ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
                >
                  <span>Acessar documento</span>
                  {isExterno ? (
                    <ExternalLink size={12} aria-hidden="true" />
                  ) : (
                    <FileText size={12} aria-hidden="true" />
                  )}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
