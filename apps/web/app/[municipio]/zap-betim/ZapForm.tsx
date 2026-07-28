"use client";

import { useState } from "react";
import { ZAP_CATEGORIAS, ZAP_CATEGORIA_LABELS } from "@/lib/betim/zap";
import { useCaminhoDaCidade } from "@/lib/betim/basePath";

export default function ZapForm() {
  const caminho = useCaminhoDaCidade();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    // Captured before the `await` below: React nulls out `e.currentTarget`
    // once the synchronous handler returns, even without event pooling —
    // calling `e.currentTarget.reset()` after an await throws (confirmed
    // live 2026-07-21: submission succeeded but the UI showed "Erro de
    // conexão" because the throw happened in the try block, after the
    // insert).
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const body = {
      nome: form.get("nome"),
      whatsapp: form.get("whatsapp"),
      categoria: form.get("categoria"),
      descricao: form.get("descricao"),
      bairro: form.get("bairro"),
      site: form.get("site"), // honeypot
    };

    try {
      const res = await fetch(caminho("/api/zap"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      formEl.reset();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm">
        <p className="font-semibold text-text">Cadastro enviado! ✅</p>
        <p className="mt-1 text-text-soft">
          Seu negócio entra na fila de revisão e aparece na lista assim que
          for aprovado.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2"
    >
      <h3 className="col-span-full font-display text-base font-semibold">
        Cadastre seu negócio
      </h3>

      <input
        type="text"
        name="site"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <label className="text-sm">
        Nome do negócio
        <input
          name="nome"
          required
          minLength={2}
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        />
      </label>

      <label className="text-sm">
        WhatsApp (com DDD)
        <input
          name="whatsapp"
          required
          placeholder="(31) 9xxxx-xxxx"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        />
      </label>

      <label className="col-span-full text-sm">
        Categoria
        <select
          name="categoria"
          required
          defaultValue=""
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        >
          <option value="" disabled>
            Selecione…
          </option>
          {ZAP_CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {ZAP_CATEGORIA_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Bairro (opcional)
        <input
          name="bairro"
          maxLength={80}
          placeholder="Ex: Citrolândia"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        />
      </label>

      <label className="col-span-full text-sm">
        Descrição (opcional)
        <textarea
          name="descricao"
          maxLength={500}
          rows={3}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        />
      </label>

      {error ? <p className="col-span-full text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="col-span-full cursor-pointer rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-primary-ink disabled:opacity-60"
      >
        {status === "sending" ? "Enviando…" : "Enviar cadastro"}
      </button>
    </form>
  );
}
