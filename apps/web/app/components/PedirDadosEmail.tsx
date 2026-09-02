"use client";

/**
 * Botão "Pedir dados por e-mail" — Tier 0 do plano de pedidos
 * (PLANO-NAVEGACAO-E-NOTIFICACOES.md).
 *
 * Abre o cliente de e-mail do visitante com o pedido pré-preenchido para
 * contato@controlepopular.com.br. No clique, dispara um beacon para o
 * contador público (/api/contador?tipo=pedido) — "pedido iniciado", não
 * e-mail enviado (no Tier 0 o envio é do cliente do visitante).
 */
const MAILTO = `mailto:contato@controlepopular.com.br?subject=${encodeURIComponent(
  "Pedido de dados \u2014 Controle Popular"
)}&body=${encodeURIComponent(
  "Ol\u00e1,\n\nGostaria de receber os dados desta p\u00e1gina: [COLE O LINK AQUI]\n\nFormato desejado (opcional): CSV / PDF / resumo em texto\nMeu nome:\nE-mail para envio:\n\nAutorizo o uso deste e-mail apenas para este envio. (LGPD)"
)}`;

export default function PedirDadosEmail() {
  return (
    <a
      href={MAILTO}
      onClick={() => {
        fetch("/api/contador?tipo=pedido", { method: "POST", keepalive: true }).catch(() => {});
      }}
      className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
      aria-label="Pedir dados desta página por e-mail"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
        <path d="m22 7-10 6L2 7"></path>
      </svg>
      Pedir dados por e-mail
    </a>
  );
}
