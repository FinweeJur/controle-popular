"use client";

import { useState, useRef, useEffect } from "react";
import { withBasePath } from "@/lib/betim/basePath";

interface Mensagem {
  papel: "usuario" | "assistente";
  texto: string;
}

const SUGESTOES = [
  "Quanto a Prefeitura gasta em saúde?",
  "Quais os maiores contratos da Prefeitura?",
  "O que a Câmara propôs sobre mobilidade?",
  "Quantos habitantes tem Betim?",
];

export default function AssistenteChat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando]);

  async function enviar(pergunta: string) {
    const q = pergunta.trim();
    if (!q || carregando) return;
    setMensagens((m) => [...m, { papel: "usuario", texto: q }]);
    setTexto("");
    setCarregando(true);
    try {
      const res = await fetch(withBasePath("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: q }),
      });
      const data = (await res.json()) as { resposta?: string; erro?: string };
      setMensagens((m) => [
        ...m,
        {
          papel: "assistente",
          texto: data.resposta ?? data.erro ?? "Não consegui responder agora.",
        },
      ]);
    } catch {
      setMensagens((m) => [
        ...m,
        { papel: "assistente", texto: "Falha de conexão. Tente de novo." },
      ]);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {mensagens.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-6">
          <p className="text-sm text-text-soft">
            Faça uma pergunta sobre os dados de Betim. Experimente:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="cursor-pointer rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text hover:border-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {mensagens.map((m, i) => (
            <li
              key={i}
              className={m.papel === "usuario" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.papel === "usuario"
                    ? "bg-primary text-primary-ink"
                    : "border border-border bg-surface text-text"
                }`}
              >
                {m.texto}
              </div>
            </li>
          ))}
          {carregando && (
            <li className="flex justify-start">
              <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-text-soft">
                Consultando os dados…
              </div>
            </li>
          )}
        </ul>
      )}
      <div ref={fimRef} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="sticky bottom-4 flex gap-2"
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pergunte sobre contratos, gastos, vereadores…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-text shadow-sm"
          maxLength={500}
        />
        <button
          type="submit"
          disabled={carregando || !texto.trim()}
          className="cursor-pointer rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-primary-ink disabled:opacity-50"
        >
          Perguntar
        </button>
      </form>

      <p className="text-xs text-text-soft">
        O assistente responde com base nos dados já reunidos no portal e pode
        errar. Confira sempre na página e na fonte oficial.
      </p>
    </div>
  );
}
