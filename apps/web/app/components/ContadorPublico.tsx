"use client";

import { useEffect, useState } from "react";

/**
 * Mostrador público do contador de envios/downloads/inscrições
 * (PLANO-NAVEGACAO-E-NOTIFICACOES.md).
 *
 * Lê `/api/contador` (D1) no carregamento e exibe os totais no rodapé.
 * Enquanto não carrega (ou sem D1), renderiza nada — contador é enfeite de
 * confiança, não bloqueia nada.
 */
export default function ContadorPublico() {
  const [dados, setDados] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let ativo = true;
    fetch("/api/contador")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (ativo && j && j.contadores) setDados(j.contadores as Record<string, number>);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  if (!dados) return null;
  const pedidos = dados.pedido ?? 0;
  const downloads = dados.download ?? 0;
  const inscricoes = dados.notificacao ?? 0;

  return (
    <p className="mt-2 text-text-soft" aria-live="polite">
      📧 {pedidos} {pedidos === 1 ? "pedido" : "pedidos"} · ⬇ {downloads}{" "}
      {downloads === 1 ? "download" : "downloads"} · 🔔 {inscricoes}{" "}
      {inscricoes === 1 ? "inscrição" : "inscrições"}
    </p>
  );
}
