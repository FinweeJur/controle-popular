"use client";

import { useState } from "react";
import type { DocumentoDenuncia } from "@/lib/denuncia/compor";

/**
 * Botão de "Baixar .docx" — carregado com `next/dynamic({ ssr: false })`
 * pelo `Facilitador.tsx`, no mesmo padrão de `BotoesBinarios.tsx`
 * (`app/congresso/proposicoes/[id]/oficio/`). O isolamento é o que garante
 * a ausência: `docx` (~150 KiB gzip) só entra num chunk de cliente, baixado
 * no clique — nunca no HTML inicial da página, nunca no bundle do Worker.
 *
 * NÃO tem "enviar". Só "baixar" — é a regra que decide a arquitetura
 * inteira deste facilitador (`docs/PLANO-ACAO-CIDADA.md`): nenhuma rota
 * `route.din.ts` deste site recebe o `documento` que chega aqui.
 */
export default function BaixarDocumento({ documento }: { documento: DocumentoDenuncia }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function baixar() {
    setOcupado(true);
    setErro(null);
    try {
      const { renderDocxDenuncia, nomeArquivoDenuncia, MIME_DOCX } = await import(
        "@/lib/denuncia/render-binario"
      );
      const bytes = await renderDocxDenuncia(documento);
      const blob = new Blob([bytes as unknown as BlobPart], { type: MIME_DOCX });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeArquivoDenuncia();
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErro("Não foi possível gerar o arquivo. Tente de novo — nada foi perdido.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={ocupado}
        onClick={baixar}
        className="rounded-xl px-6 py-3 font-display text-base font-semibold text-white shadow-sm disabled:opacity-60"
        style={{ background: "var(--cp-primary)" }}
      >
        {ocupado ? "Gerando o arquivo…" : "Baixar registro em .docx"}
      </button>
      {erro && (
        <p className="mt-2 text-sm" style={{ color: "var(--cp-alert)" }}>
          {erro}
        </p>
      )}
      <p className="mt-2 text-[.8em] text-text-soft">
        O arquivo é montado agora, no seu navegador — nada foi enviado a nenhum servidor até
        aqui, e nada será enviado quando você clicar.
      </p>
    </div>
  );
}
