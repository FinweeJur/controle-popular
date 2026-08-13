"use client";

import { useState } from "react";
import type { DocumentoDenuncia } from "@/lib/denuncia/compor";

type Formato = "docx" | "pdf";

/**
 * Botões de "Baixar .docx" / "Baixar .pdf" — carregado com
 * `next/dynamic({ ssr: false })` pelo `Facilitador.tsx`, no mesmo padrão de
 * `BotoesBinarios.tsx` (`app/congresso/proposicoes/[id]/oficio/`). O
 * isolamento é o que garante a ausência: `docx` e `pdf-lib` (~304 KiB gzip
 * juntos) só entram num chunk de cliente, baixado no clique — e cada um só
 * quando o SEU botão é clicado (`await import()` por formato, não os dois
 * juntos) — nunca no HTML inicial da página, nunca no bundle do Worker.
 *
 * Dois formatos, motivos diferentes: `.docx` supõe um editor instalado;
 * `.pdf` abre em qualquer celular e serve para MOSTRAR na tela a alguém
 * (Defensoria, delegacia), não só arquivar.
 *
 * NÃO tem "enviar". Só "baixar" — é a regra que decide a arquitetura
 * inteira deste facilitador (`docs/PLANO-ACAO-CIDADA.md`): nenhuma rota
 * `route.din.ts` deste site recebe o `documento` que chega aqui.
 */
export default function BaixarDocumento({ documento }: { documento: DocumentoDenuncia }) {
  const [ocupado, setOcupado] = useState<Formato | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function baixar(formato: Formato) {
    setOcupado(formato);
    setErro(null);
    try {
      const { renderDocxDenuncia, renderPdfDenuncia, nomeArquivoDenuncia, MIME_DOCX, MIME_PDF } =
        await import("@/lib/denuncia/render-binario");
      const bytes =
        formato === "docx" ? await renderDocxDenuncia(documento) : await renderPdfDenuncia(documento);
      const blob = new Blob([bytes as unknown as BlobPart], {
        type: formato === "docx" ? MIME_DOCX : MIME_PDF,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivoDenuncia(formato);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro("Não foi possível gerar o arquivo. Tente de novo — nada foi perdido.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={ocupado !== null}
          onClick={() => baixar("docx")}
          className="rounded-xl px-6 py-3 font-display text-base font-semibold text-white shadow-sm disabled:opacity-60"
          style={{ background: "var(--cp-primary)" }}
        >
          {ocupado === "docx" ? "Gerando o arquivo…" : "Baixar registro em .docx"}
        </button>
        <button
          type="button"
          disabled={ocupado !== null}
          onClick={() => baixar("pdf")}
          className="rounded-xl border-2 px-6 py-3 font-display text-base font-semibold shadow-sm disabled:opacity-60"
          style={{ borderColor: "var(--cp-primary)", color: "var(--cp-primary)" }}
        >
          {ocupado === "pdf" ? "Gerando o arquivo…" : "Baixar registro em .pdf"}
        </button>
      </div>
      {erro && (
        <p className="mt-2 text-sm" style={{ color: "var(--cp-alert)" }}>
          {erro}
        </p>
      )}
      <p className="mt-2 text-[.8em] text-text-soft">
        O .docx precisa de um editor de texto para abrir; o .pdf abre em qualquer celular e é
        mais fácil de mostrar na tela para alguém. Os dois são montados agora, no seu navegador —
        nada foi enviado a nenhum servidor até aqui, e nada será enviado quando você clicar.
      </p>
    </div>
  );
}
