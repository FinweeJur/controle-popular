"use client";

import { useState } from "react";
import { CLASSIFICADO_CATEGORIAS, CLASSIFICADO_CATEGORIA_LABELS } from "@/lib/betim/classificados";
import { useCaminhoDaCidade } from "@/lib/betim/basePath";

export default function ClassificadoForm() {
  const caminho = useCaminhoDaCidade();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    // See ZapForm.tsx: e.currentTarget goes null after an await, so it must
    // be captured here for the .reset() call below.
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const body = {
      titulo: form.get("titulo"),
      descricao: form.get("descricao"),
      categoria: form.get("categoria"),
      preco: form.get("preco"),
      contato_whatsapp: form.get("contato_whatsapp"),
      site: form.get("site"),
    };

    try {
      const res = await fetch(caminho("/api/classificados"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao publicar.");
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
        <p className="font-semibold text-text">Anúncio enviado! ✅</p>
        <p className="mt-1 text-text-soft">
          Fica visível por 60 dias após a aprovação da moderação.
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
        Anuncie grátis
      </h3>

      <input
        type="text"
        name="site"
        tabIndex={-1}
        autoComplete="off"
        className="absolute h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <label className="col-span-full text-sm">
        Título
        <input
          name="titulo"
          required
          minLength={3}
          maxLength={150}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        />
      </label>

      <label className="text-sm">
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
          {CLASSIFICADO_CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {CLASSIFICADO_CATEGORIA_LABELS[c]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        Preço (opcional)
        <input
          name="preco"
          type="number"
          min={0}
          step="0.01"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        />
      </label>

      <label className="col-span-full text-sm">
        Descrição
        <textarea
          name="descricao"
          required
          minLength={5}
          maxLength={1000}
          rows={4}
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        />
      </label>

      <label className="col-span-full text-sm">
        WhatsApp para contato
        <input
          name="contato_whatsapp"
          required
          placeholder="(31) 9xxxx-xxxx"
          className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-text"
        />
      </label>

      {error ? <p className="col-span-full text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={status === "sending"}
        className="col-span-full cursor-pointer rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-primary-ink disabled:opacity-60"
      >
        {status === "sending" ? "Enviando…" : "Publicar anúncio"}
      </button>
    </form>
  );
}
