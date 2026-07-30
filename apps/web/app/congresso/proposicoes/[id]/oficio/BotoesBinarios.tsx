"use client";

import { useState } from "react";
import type { Bloco, Oficio } from "@/lib/congresso/oficio/compor";
import { MIME, nomeArquivo } from "@/lib/congresso/oficio/render";

/**
 * Botões de "Baixar PDF" e "Baixar DOCX" — carregado com
 * `next/dynamic({ ssr: false })` pelo `FormularioOficio`, e é ESSE
 * isolamento que justifica o componente existir.
 *
 * `docx` + `pdf-lib` custam ~300 KiB gzip. Enquanto o `await import()`
 * delas morava dentro do `FormularioOficio` (que é renderizado no
 * servidor para o HTML inicial), o Next compilava as duas libs para o
 * grafo de SSR também — medido: elas estavam DENTRO do `handler.mjs`, e o
 * bundle do Worker ficou em 3.252 KiB contra o teto de 3.072 KiB (3 MB) do
 * Cloudflare Workers Free, com o deploy recusado.
 *
 * `ssr: false` é o que tira este módulo do render de servidor — mover o
 * `await import()` sozinho não bastou. As libs viram chunk de cliente,
 * baixado só quando alguém clica em baixar.
 */
export default function BotoesBinarios({
  oficio,
  blocos,
  onErro,
}: {
  oficio: Oficio;
  blocos: Bloco[];
  onErro: (mensagem: string | null) => void;
}) {
  const [ocupado, setOcupado] = useState(false);

  async function baixar(formato: "docx" | "pdf") {
    setOcupado(true);
    onErro(null);
    try {
      const { renderDocx, renderPdf } = await import("@/lib/congresso/oficio/render-binario");
      const bytes =
        formato === "docx" ? await renderDocx(oficio, blocos) : await renderPdf(oficio, blocos);
      const blob = new Blob([bytes as unknown as BlobPart], { type: MIME[formato] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivo(oficio, formato);
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      onErro("não foi possível gerar o arquivo");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => baixar("pdf")}
        className="rounded-md border border-[var(--cp-border)] px-4 py-2 font-medium disabled:opacity-60"
      >
        Baixar PDF
      </button>
      <button
        type="button"
        disabled={ocupado}
        onClick={() => baixar("docx")}
        className="rounded-md border border-[var(--cp-border)] px-4 py-2 font-medium disabled:opacity-60"
      >
        Baixar DOCX
      </button>
    </>
  );
}
