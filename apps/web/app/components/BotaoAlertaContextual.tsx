"use client";

import { useState } from "react";
import { Share2, MessageSquare, Send, Bell, Copy, CheckCircle2, ChevronDown } from "lucide-react";

export type TipoAlertaContextual =
  | "licenciamento"
  | "contato"
  | "contrato"
  | "pl"
  | "convenio"
  | "clima"
  | "reparacao"
  | "resumo_pagina";

export interface BotaoAlertaContextualProps {
  tipo: TipoAlertaContextual;
  titulo: string;
  orgaoTerritorio?: string;
  identificador?: string;
  link?: string;
  resumo?: string;
  telefones?: string[];
  emails?: string[];
  variante?: "compacto" | "completo" | "icone";
  rotulo?: string;
}

export default function BotaoAlertaContextual({
  tipo,
  titulo,
  orgaoTerritorio = "Minas Gerais / Brasil",
  identificador = "Dado oficial do Controle Popular",
  link,
  resumo,
  telefones,
  emails,
  variante = "compacto",
  rotulo = "Compartilhar / Alerta",
}: BotaoAlertaContextualProps) {
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Determina URL completa de destino
  const urlFinal =
    link ||
    (typeof window !== "undefined"
      ? window.location.href
      : "https://controlepopular.com.br");

  // Montagem da mensagem estruturada para WhatsApp e Redes
  const gerarMensagemWhatsApp = () => {
    const cabecalhos: Record<TipoAlertaContextual, string> = {
      licenciamento: "🌿 *ALERTA DE LICENCIAMENTO AMBIENTAL*",
      contato: "📞 *CANAL INSTITUCIONAL & CONTATOS ÚTEIS*",
      contrato: "💼 *ALERTA DE CONTRATO PÚBLICO*",
      pl: "📜 *ALERTA LEGISLATIVO — CÂMARA / CONGRESSO*",
      convenio: "🤝 *ALERTA DE REPASSE & CONVÊNIO*",
      clima: "🌧️ *AVISO DE RISCO SOCIOAMBIENTAL*",
      reparacao: "⚖️ *ACOMPANHAMENTO DE REPARAÇÃO*",
      resumo_pagina: "📊 *DADOS PÚBLICOS & FISCALIZAÇÃO CIDADÃ*",
    };

    const header = cabecalhos[tipo] || "🔔 *ALERTA DE CONTROLE POPULAR*";

    let texto = `${header}
📍 *Território / Órgão:* ${orgaoTerritorio}
📌 *Assunto:* ${titulo}
🔢 *Identificação:* ${identificador}`;

    if (resumo) {
      texto += `\n\n🔎 *Resumo dos dados:*\n${resumo}`;
    }

    if (telefones && telefones.length > 0) {
      texto += `\n\n📞 *Contatos / Telefones:*\n${telefones.map((t) => `• ${t}`).join("\n")}`;
    }

    if (emails && emails.length > 0) {
      texto += `\n\n📧 *E-mails:*\n${emails.map((e) => `• ${e}`).join("\n")}`;
    }

    texto += `\n\n🔗 *Confira o documento e os dados oficiais no portal:*\n${urlFinal}

_Fonte: Dados públicos oficiais organizados pelo portal independente Controle Popular (controlepopular.com.br)._`;

    return texto;
  };

  const textoPronto = gerarMensagemWhatsApp();
  const linkWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    textoPronto
  )}`;
  const linkTelegram = `https://t.me/share/url?url=${encodeURIComponent(
    urlFinal
  )}&text=${encodeURIComponent(`🔔 ${titulo} (${orgaoTerritorio}):`)}`;

  // Link para abrir o planejador na Central de Alertas com todos os parâmetros
  const paramsCentral = new URLSearchParams({
    tipo,
    titulo,
    orgao: orgaoTerritorio,
    num: identificador,
    link: urlFinal,
    resumo: resumo || "",
  });
  const linkCentralAlertas = `/alertas?${paramsCentral.toString()}`;

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoPronto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  if (variante === "icone") {
    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
          title="Compartilhar ou Criar Alerta"
          aria-expanded={aberto}
        >
          <Share2 className="h-3.5 w-3.5 text-primary" />
        </button>

        {aberto && (
          <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-border bg-surface p-2 shadow-xl">
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Enviar no WhatsApp</span>
            </a>
            <a
              href={linkTelegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#229ED9] hover:bg-sky-50 dark:hover:bg-sky-950/40"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Enviar no Telegram</span>
            </a>
            <button
              onClick={copiarTexto}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-2"
            >
              {copiado ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted" />}
              <span>{copiado ? "Copiado!" : "Copiar Texto Formatado"}</span>
            </button>
            <a
              href={linkCentralAlertas}
              className="flex items-center gap-2 rounded-lg border-t border-border px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Abrir na Central de Alertas</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:bg-surface"
        aria-expanded={aberto}
      >
        <Share2 className="h-3.5 w-3.5 text-primary" />
        <span>{rotulo}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 rounded-xl border border-border bg-surface p-2.5 shadow-2xl">
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            Divulgar & Alertar
          </p>

          <a
            href={linkWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Disparar no WhatsApp</span>
          </a>

          <a
            href={linkTelegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-[#229ED9] hover:bg-sky-50 dark:hover:bg-sky-950/40"
          >
            <Send className="h-4 w-4" />
            <span>Compartilhar no Telegram</span>
          </a>

          <button
            onClick={copiarTexto}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-foreground hover:bg-surface-2"
          >
            {copiado ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Texto Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-muted" />
                <span>Copiar Mensagem Pronta</span>
              </>
            )}
          </button>

          <div className="mt-1.5 border-t border-border pt-1.5">
            <a
              href={linkCentralAlertas}
              onClick={() => setAberto(false)}
              className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>Personalizar na Central de Alertas →</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
