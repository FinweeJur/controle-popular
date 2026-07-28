"use client";

import type { ZapEstabelecimento } from "@/lib/betim/zap";
import { withBasePath } from "@/lib/betim/basePath";

export default function ZapCard({ item }: { item: ZapEstabelecimento }) {
  function handleClick() {
    fetch(withBasePath(`/api/zap/${item.id}/clique`), { method: "POST" }).catch(() => {});
  }

  const waUrl = `https://wa.me/${item.whatsapp}?text=${encodeURIComponent(
    `Olá! Vi seu contato no Zap Betim (controlepopular.br/betim) e quero saber mais.`
  )}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="cp-card-hover flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
    >
      <span className="font-display text-base font-semibold text-text">{item.nome}</span>
      {item.descricao ? (
        <span className="text-sm text-text-soft">{item.descricao}</span>
      ) : null}
      <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent">
        Chamar no WhatsApp →
      </span>
    </a>
  );
}
