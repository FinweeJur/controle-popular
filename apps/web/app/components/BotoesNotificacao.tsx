"use client";

const MAILTO_NOVIDADES = `mailto:contato@controlepopular.com.br?subject=${encodeURIComponent(
  "Quero receber novidades \u2014 Controle Popular"
)}&body=${encodeURIComponent(
  "Ol\u00e1,\n\nQuero receber novidades do portal (novas p\u00e1ginas, dados e corre\u00e7\u00f5es).\nMeu nome:\nE-mail para envio:\n\nAutorizo o uso deste e-mail apenas para novidades do portal. (LGPD)"
)}`;

export default function BotoesNotificacao() {
  const registrarCliqueNotificacao = () => {
    try {
      fetch("/api/contador?tipo=notificacao", {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    } catch {
      // fogo-e-esqueça silencioso
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      <a
        href="https://t.me/ControlePopularBOT"
        target="_blank"
        rel="noopener"
        onClick={registrarCliqueNotificacao}
        className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
        aria-label="Receber notificações no Telegram"
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
          <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"></path>
        </svg>
        Receber no Telegram
      </a>

      <a
        href={MAILTO_NOVIDADES}
        onClick={registrarCliqueNotificacao}
        className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-accent"
        aria-label="Receber novidades por e-mail"
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
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"></path>
        </svg>
        Receber novidades por e-mail
      </a>
    </div>
  );
}
