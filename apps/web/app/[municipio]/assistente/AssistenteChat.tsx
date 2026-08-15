"use client";

import { useState, useRef, useEffect } from "react";
import { useCaminhoDaCidade } from "@/lib/betim/basePath";
import { useCidade } from "@/lib/betim/cidade-cliente";
import { lerRespostaDoAssistente } from "@/lib/rota-ausente";
import AvisoSemAssistente from "./AvisoSemAssistente";

interface Mensagem {
  papel: "usuario" | "assistente";
  texto: string;
}

const sugestoes = (cidade: { nome: string }) => [
  "Quanto a Prefeitura gasta em saúde?",
  "Quais os maiores contratos da Prefeitura?",
  "O que a Câmara propôs sobre mobilidade?",
  `Quantos habitantes tem ${cidade.nome}?`,
];

export default function AssistenteChat() {
  const cidade = useCidade();
  const caminho = useCaminhoDaCidade();
  const SUGESTOES = sugestoes(cidade);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [carregando, setCarregando] = useState(false);
  // A rota `api/chat` não existe nesta cópia do site (ver `lib/rota-ausente.ts`).
  // Estado próprio, e não mais uma mensagem na conversa, porque a consequência
  // é diferente: o formulário SAI da tela. Continuar oferecendo o campo depois
  // de saber que ninguém responde é a mesma desonestidade de antes, só mais
  // educada.
  const [semAssistente, setSemAssistente] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, carregando, semAssistente]);

  async function enviar(pergunta: string) {
    const q = pergunta.trim();
    if (!q || carregando || semAssistente) return;
    setMensagens((m) => [...m, { papel: "usuario", texto: q }]);
    setTexto("");
    setCarregando(true);
    try {
      const res = await fetch(caminho("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: q }),
      });
      const leitura = await lerRespostaDoAssistente(res);
      if (leitura.tipo === "ausente") {
        // A pergunta fica na tela — ela é do visitante, e é o que ele vai
        // levar para a busca. Some é o campo de digitar.
        setSemAssistente(true);
        return;
      }
      setMensagens((m) => [...m, { papel: "assistente", texto: leitura.texto }]);
    } catch {
      // Só chega aqui quando o `fetch` REJEITA — offline, DNS, TLS. Aí a rede
      // é mesmo o problema e "tente de novo" é o conselho certo. O 404 da
      // cópia estática não passa mais por aqui: `lerRespostaDoAssistente` o
      // separa antes, porque mandar a pessoa conferir a conexão por causa de
      // uma rota que aquele build nunca teve é o defeito que isto conserta.
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
            Faça uma pergunta sobre os dados de {cidade.nome}. Experimente:
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

      {semAssistente ? (
        <AvisoSemAssistente />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
