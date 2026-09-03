"use client";

import { useState } from "react";
import {
  Bell,
  Send,
  MessageSquare,
  Mail,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldAlert,
  FileText,
  Landmark,
  CloudRain,
  Scale,
} from "lucide-react";

interface CentralAlertasProps {
  municipioInicial?: string;
  temaInicial?: string;
}

export default function CentralAlertasClient({
  municipioInicial = "",
  temaInicial = "todos",
}: CentralAlertasProps) {
  const [abaAtiva, setAbaAtiva] = useState<"inscricao" | "planejador" | "temas">(
    "inscricao"
  );

  // Estados da Inscrição
  const [canalTelegram, setCanalTelegram] = useState(true);
  const [canalEmail, setCanalEmail] = useState(true);
  const [municipioAlerta, setMunicipioAlerta] = useState(municipioInicial);
  const [temasSelecionados, setTemasSelecionados] = useState<string[]>([
    "pl",
    "contratos",
    "convenios",
    "clima",
    "justica",
  ]);

  // Estados do Planejador de Disparo (WhatsApp / Telegram)
  const [tipoMensagem, setTipoMensagem] = useState<
    "contrato" | "pl" | "convenio" | "clima" | "reparacao"
  >("contrato");
  const [cidadeMensagem, setCidadeMensagem] = useState("Betim, MG");
  const [tituloFato, setTituloFato] = useState(
    "Contrato emergencial sem licitação no valor de R$ 4,8 milhões"
  );
  const [numeroReferencia, setNumeroReferencia] = useState("Dispensa nº 42/2026");
  const [linkPortal, setLinkPortal] = useState(
    "https://controlepopular.com.br/betim/prefeitura/contratos"
  );
  const [detalheExtra, setDetalheExtra] = useState(
    "Empresa vencedora foi aberta há menos de 6 meses segundo a Receita Federal."
  );
  const [copiado, setCopiado] = useState(false);

  // Alternância de temas na inscrição
  const toggleTema = (tema: string) => {
    setTemasSelecionados((prev) =>
      prev.includes(tema) ? prev.filter((t) => t !== tema) : [...prev, tema]
    );
  };

  // Gerador de mensagem para WhatsApp / Redes
  const gerarTextoWhatsApp = () => {
    const emojis = {
      contrato: "🚨 *ALERTA DE CONTRATO PÚBLICO*",
      pl: "📜 *ALERTA LEGISLATIVO — CÂMARA / CONGRESSO*",
      convenio: "🤝 *ALERTA DE REPASSE & CONVÊNIO*",
      clima: "🌧️ *AVISO DE RISCO SOCIOAMBIENTAL*",
      reparacao: "⚖️ *ACOMPANHAMENTO DE REPARAÇÃO*",
    };

    const cabecalho = emojis[tipoMensagem];

    return `${cabecalho}
📍 *Território:* ${cidadeMensagem}
📌 *Assunto:* ${tituloFato}
🔢 *Identificação Oficial:* ${numeroReferencia}

🔎 *Detalhes para fiscalização:*
${detalheExtra}

🔗 *Confira o documento e os dados oficiais no portal:*
${linkPortal}

_Fonte: Dados públicos oficiais organizados pelo portal independente Controle Popular (controlepopular.com.br). Compartilhe com quem precisa saber!_`;
  };

  const textoGerado = gerarTextoWhatsApp();
  const linkWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    textoGerado
  )}`;
  const linkTelegramShare = `https://t.me/share/url?url=${encodeURIComponent(
    linkPortal
  )}&text=${encodeURIComponent(
    `🚨 ${tituloFato} (${cidadeMensagem}). Confira no Controle Popular:`
  )}`;

  const copiarTexto = () => {
    navigator.clipboard.writeText(textoGerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // Montagem do link mailto para o canal e-mail
  const gerarMailtoInscricao = () => {
    const assunto = encodeURIComponent(
      `Inscrição em Alertas Cidadãos — ${municipioAlerta || "Brasil"}`
    );
    const corpo = encodeURIComponent(`Olá,

Gostaria de me inscrever para receber alertas e boletins de fiscalização cidadã:
- Território de interesse: ${municipioAlerta || "Nacional / Geral"}
- Temas selecionados: ${temasSelecionados.join(", ")}

Autorizo o uso do meu e-mail exclusivamente para receber notificações de dados públicos do Controle Popular, conforme a LGPD.

Nome: 
E-mail: `);
    return `mailto:contato@controlepopular.com.br?subject=${assunto}&body=${corpo}`;
  };

  return (
    <div className="space-y-6">
      {/* SELETOR DE ABAS */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setAbaAtiva("inscricao")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            abaAtiva === "inscricao"
              ? "bg-primary text-primary-foreground"
              : "bg-surface-2 text-muted hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Receber Alertas Automáticos</span>
        </button>

        <button
          onClick={() => setAbaAtiva("planejador")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            abaAtiva === "planejador"
              ? "bg-primary text-primary-foreground"
              : "bg-surface-2 text-muted hover:text-foreground"
          }`}
        >
          <Share2 className="h-4 w-4" />
          <span>Planejador WhatsApp & Redes</span>
        </button>

        <button
          onClick={() => setAbaAtiva("temas")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            abaAtiva === "temas"
              ? "bg-primary text-primary-foreground"
              : "bg-surface-2 text-muted hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Temas & Fontes Monitoradas</span>
        </button>
      </div>

      {/* ABA 1: INSCRIÇÃO E AUTOMAÇÃO */}
      {abaAtiva === "inscricao" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-foreground">
              Configure Seus Alertas Cidadãos
            </h3>
            <p className="mt-1 text-sm text-muted">
              Escolha por onde quer receber os alertas e quais temas são mais
              urgentes para o seu território.
            </p>

            {/* 1. SELEÇÃO DE CANAIS */}
            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                1. Canais de Envio Desejados
              </label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    canalTelegram
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface-2/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={canalTelegram}
                    onChange={(e) => setCanalTelegram(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Send className="h-4 w-4 text-[#229ED9]" />
                      Telegram (@ControlePopularBOT)
                    </span>
                    <p className="mt-0.5 text-xs text-muted">
                      Mensagens instantâneas diretas no seu Telegram a cada novo
                      contrato, votação ou aviso de risco.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    canalEmail
                      ? "border-primary bg-primary/5"
                      : "border-border bg-surface-2/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={canalEmail}
                    onChange={(e) => setCanalEmail(e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Mail className="h-4 w-4 text-emerald-600" />
                      Boletim por E-mail (Mailing Cidadão)
                    </span>
                    <p className="mt-0.5 text-xs text-muted">
                      Resumos periódicos em texto, planilhas CSV e alertas de
                      urgência na sua caixa de entrada.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 2. CIDADE / TERRITÓRIO */}
            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                2. Município ou Região de Foco
              </label>
              <input
                type="text"
                placeholder="Ex: Betim, Belo Horizonte, Mariana, São Paulo (ou deixe vazio para Nacional)"
                value={municipioAlerta}
                onChange={(e) => setMunicipioAlerta(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>

            {/* 3. TEMAS / MATÉRIAS */}
            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                3. Selecione os Assuntos de Interesse
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    id: "contratos",
                    icon: Landmark,
                    label: "Contratos & Licitações",
                    desc: "Dispensas, aditivos, valores atípicos e novos fornecedores.",
                  },
                  {
                    id: "pl",
                    icon: FileText,
                    label: "Projetos de Lei & Votos",
                    desc: "Pautas da Câmara Municipal, Congresso e votações nominais.",
                  },
                  {
                    id: "convenios",
                    icon: Share2,
                    label: "Convênios & Repasses",
                    desc: "Transferências federais (Transferegov), emendas e Siconfi.",
                  },
                  {
                    id: "clima",
                    icon: CloudRain,
                    label: "Clima, Risco & Chuvas",
                    desc: "Alertas do INMET, pluviômetros CEMADEN e barragens.",
                  },
                  {
                    id: "justica",
                    icon: Scale,
                    label: "Judiciário & Reparação",
                    desc: "Execução do Acordo da Vale, Samarco e litígios ambientais.",
                  },
                  {
                    id: "novidades",
                    icon: Bell,
                    label: "Dados Novos no Portal",
                    desc: "Avisos quando novas bases ou páginas municipais forem ao ar.",
                  },
                ].map((t) => {
                  const sel = temasSelecionados.includes(t.id);
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTema(t.id)}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 transition-all ${
                        sel
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border bg-surface hover:border-border/80 opacity-70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => {}}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                          {t.label}
                        </span>
                        <p className="mt-1 text-[11px] text-muted leading-tight">
                          {t.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BOTÕES DE CONFIRMAÇÃO */}
            <div className="mt-8 flex flex-wrap gap-4 border-t border-border pt-5">
              {canalTelegram && (
                <a
                  href="https://t.me/ControlePopularBOT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                  <span>Conectar no Telegram (@ControlePopularBOT)</span>
                </a>
              )}

              {canalEmail && (
                <a
                  href={gerarMailtoInscricao()}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <Mail className="h-4 w-4" />
                  <span>Confirmar Inscrição por E-mail</span>
                </a>
              )}
            </div>
            <p className="mt-3 text-[11px] text-muted">
              🔒 <strong>Garantia de Privacidade:</strong> Não enviamos spam. Seus dados nunca são vendidos nem compartilhados. Saia a qualquer momento com o comando /parar no Telegram ou respondendo &quot;cancelar&quot; no e-mail.
            </p>
          </div>
        </div>
      )}

      {/* ABA 2: PLANEJADOR DE DISPARO (WHATSAPP, TELEGRAM, REDES) */}
      {abaAtiva === "planejador" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* COLUNA ESQUERDA: FORMULÁRIO DO FATO */}
          <div className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-foreground">
              Compositor de Disparo Cidadão
            </h3>
            <p className="text-xs text-muted">
              Crie mensagens estruturadas para WhatsApp, grupos comunitários e
              listas de transmissão com provas e links oficiais do portal.
            </p>

            <div>
              <label className="text-xs font-semibold text-muted uppercase">
                Tipo do Assunto
              </label>
              <select
                value={tipoMensagem}
                onChange={(e) => setTipoMensagem(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-border bg-surface py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="contrato">💼 Contrato / Licitação Pública</option>
                <option value="pl">📜 Projeto de Lei / Votação</option>
                <option value="convenio">🤝 Convênio / Repasse de Recursos</option>
                <option value="clima">🌧️ Alerta Socioambiental / Clima</option>
                <option value="reparacao">⚖️ Acordo de Reparação / Indenização</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase">
                Município ou Região
              </label>
              <input
                type="text"
                value={cidadeMensagem}
                onChange={(e) => setCidadeMensagem(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase">
                Resumo do Fato (O que aconteceu?)
              </label>
              <input
                type="text"
                value={tituloFato}
                onChange={(e) => setTituloFato(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase">
                Número do Processo / Contrato / PL
              </label>
              <input
                type="text"
                value={numeroReferencia}
                onChange={(e) => setNumeroReferencia(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase">
                Link da Página no Controle Popular
              </label>
              <input
                type="text"
                value={linkPortal}
                onChange={(e) => setLinkPortal(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted uppercase">
                Detalhes de Apoio / Observação Cidadã
              </label>
              <textarea
                rows={3}
                value={detalheExtra}
                onChange={(e) => setDetalheExtra(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-surface py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* COLUNA DIREITA: PREVIEW DO WHATSAPP E BOTÕES DE DISPARO */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600">
                  <MessageSquare className="h-4 w-4" />
                  Prévia da Mensagem (WhatsApp / Telegram)
                </span>
                <button
                  onClick={copiarTexto}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  {copiado ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Texto</span>
                    </>
                  )}
                </button>
              </div>

              {/* TELA DE SIMULAÇÃO WHATSAPP */}
              <div className="mt-4 rounded-xl border border-border bg-[#efeae2] p-4 text-sm text-gray-900 shadow-inner dark:bg-zinc-900 dark:text-zinc-100">
                <pre className="font-sans whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                  {textoGerado}
                </pre>
              </div>
            </div>

            {/* AÇÕES DE DISPARO IMEDIATO */}
            <div className="mt-6 space-y-3 pt-4 border-t border-border">
              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Disparar / Compartilhar no WhatsApp</span>
              </a>

              <div className="flex gap-3">
                <a
                  href={linkTelegramShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar no Telegram</span>
                </a>

                <button
                  onClick={copiarTexto}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  <Copy className="h-3.5 w-3.5 text-muted" />
                  <span>{copiado ? "Copiado!" : "Copiar para Mailing"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: FONTES E TEMAS MONITORADOS */}
      {abaAtiva === "temas" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              titulo: "Contratos & Compras Públicas",
              orgaos: "PNCP, Diários Oficiais e Tribunais de Contas",
              descricao: "Monitoramento de termos de dispensa, inexigibilidade, licitações homologadas e contratos com valores superiores à média histórica.",
              frequencia: "Diária (após publicação nos diários)",
            },
            {
              titulo: "Projetos de Lei & Votações",
              orgaos: "Câmaras Municipais, Câmara dos Deputados e Senado",
              descricao: "Acompanhamento da tramitação de propostas com impacto orçamentário, direitos sociais ou ambientais.",
              frequencia: "Semanal e em dias de sessão",
            },
            {
              titulo: "Convênios & Transferências",
              orgaos: "Transferegov, Siconfi e Governo de Minas Gerais",
              descricao: "Avisos de novas ordens bancárias, emendas parlamentares empenhadas e convênios municipais firmados.",
              frequencia: "Semanal",
            },
            {
              titulo: "Alertas de Clima & Risco",
              orgaos: "INMET, CEMADEN e Defesa Civil Estadual",
              descricao: "Avisos meteorológicos de tempestade e chuvas intensas cruzados com os polígonos BATER de moradores em áreas de encosta e várzea.",
              frequencia: "Em tempo real (quando emitido)",
            },
            {
              titulo: "Reparação e Acordos Judiciais",
              orgaos: "Auditoria FGV (Brumadinho) e TRF-6 (Rio Doce)",
              descricao: "Atualizações sobre o cumprimento de metas de desembolso, projetos executados e cronogramas de entrega de obras.",
              frequencia: "Mensal",
            },
            {
              titulo: "Atualizações de Bases de Dados",
              orgaos: "Portal Controle Popular",
              descricao: "Avisos automáticos quando um município ganha novas consultas de saúde (SUS), receitas ou transparência ativa.",
              frequencia: "A cada atualização do portal",
            },
          ].map((item) => (
            <div
              key={item.titulo}
              className="rounded-xl border border-border bg-surface p-5 text-left shadow-sm"
            >
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {item.orgaos}
              </span>
              <h4 className="mt-2 font-display text-base font-bold text-foreground">
                {item.titulo}
              </h4>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                {item.descricao}
              </p>
              <div className="mt-4 border-t border-border pt-2 text-[11px] text-muted">
                <strong>Frequência:</strong> {item.frequencia}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
