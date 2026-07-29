"use client";

import { useState } from "react";
import { useNomePortal } from "@/lib/betim/cidade-cliente";

export interface DataCardSource {
  label: string;
  url?: string;
}

export interface DataCardProps {
  title: string;
  source?: DataCardSource;
  /** Absolute URL to share; falls back to the current page URL when omitted. */
  shareId?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable wrapper for every data block on the site. Renders the title,
 * children, a "Compartilhar" button (Web Share API with clipboard
 * fallback), and a "Ver fonte" link when a source URL is provided.
 */
export default function DataCard({
  title,
  source,
  shareId,
  children,
  className,
}: DataCardProps) {
  const nomePortal = useNomePortal();
  const [copied, setCopied] = useState(false);

  function getShareUrl() {
    return shareId ?? (typeof window !== "undefined" ? window.location.href : "");
  }

  async function handleShare() {
    const shareUrl = getShareUrl();
    const shareData = {
      title: `${nomePortal} — ${title}`,
      text: title,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled the share sheet, or the platform rejected it —
        // fall through to the clipboard fallback below.
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API unavailable/blocked — nothing more we can do
        // gracefully, so just no-op.
      }
    }
  }

  function handleWhatsappShare() {
    // Built at click-time (not as a static href) so the server-rendered
    // markup never encodes window.location.href — computing it during SSR
    // (where window is undefined) vs. hydration (where it's real) is a
    // classic hydration mismatch, confirmed live in this component.
    const url = `https://wa.me/?text=${encodeURIComponent(
      `${title} — controlepopular.br/betim ${getShareUrl()}`
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <section
      className={`cp-card-hover rounded-2xl border border-border bg-surface p-5 shadow-sm ${className ?? ""}`}
    >
      <header className="mb-3">
        <h3 className="font-display text-base font-semibold text-text">{title}</h3>
      </header>

      <div className="text-sm text-text-soft [&_strong]:font-tabular [&_strong]:font-semibold [&_strong]:text-text">
        {children}
      </div>

      <footer className="mt-4 flex flex-wrap items-center gap-4 border-t border-border/60 pt-3 text-xs text-text-soft">
        <button
          type="button"
          onClick={handleShare}
          className="cp-btn-anim inline-flex items-center gap-1 font-medium text-accent hover:underline"
        >
          {copied ? "Link copiado!" : "Compartilhar"}
        </button>
        <button
          type="button"
          onClick={handleWhatsappShare}
          className="cp-btn-anim font-medium hover:text-accent"
        >
          WhatsApp
        </button>
        {source?.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:text-accent"
          >
            Fonte: {source.label ?? "ver origem"} ↗
          </a>
        ) : source?.label ? (
          <span>Fonte: {source.label}</span>
        ) : null}
      </footer>
    </section>
  );
}
