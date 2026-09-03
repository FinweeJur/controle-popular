import Link from "next/link";
import CentralAlertasClient from "./CentralAlertasClient";
import PainelDialogo from "@/app/components/PainelDialogo";
import { Bell, Send, MessageSquare, Mail } from "lucide-react";

export const metadata = {
  title: "Central de Alertas e Notificações Cidadãs | Controle Popular",
  description:
    "Receba e planeje alertas automáticos no Telegram, E-mail e WhatsApp sobre contratos municipais, projetos de lei, convênios, clima e reparações.",
};

export default function PaginaCentralAlertas() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Alertas & Notificações</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            Comunicação Cidadã Direta
          </span>
          <span className="rounded-full bg-surface-2 border border-border px-3 py-0.5 text-xs text-muted">
            Telegram · WhatsApp · E-mail
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Central de Alertas e Notificações
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Fiscalize o poder público sem precisar entrar no site todo dia. Inscreva-se
          para receber avisos automáticos no Telegram e por e-mail, ou use nosso planejador
          para disparar resumos verificados com provas diretamente no WhatsApp.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          <p>
            &ldquo;Dado público na gaveta não muda a realidade. Notificação rápida e compartilhamento com fontes oficiais colocam a informação na mão de quem defende a comunidade, sem intermediários.&rdquo;
          </p>
          <p className="mt-1 text-xs not-italic font-medium text-foreground">
            — Diretriz de Ação e Comunicação Cidadã (PLANO-NAVEGACAO-E-NOTIFICACOES.md)
          </p>
        </div>
      </header>

      {/* CARTOES DE STATUS DE CANAIS */}
      <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#229ED9]/10 text-[#229ED9]">
            <Send className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">Telegram</p>
          <p className="mt-1 font-display text-base font-bold text-foreground">
            Tempo Real
          </p>
          <p className="mt-1 text-[11px] text-muted">Bot oficial 24h</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366]">
            <MessageSquare className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">WhatsApp</p>
          <p className="mt-1 font-display text-base font-bold text-foreground">
            Disparo Rápido
          </p>
          <p className="mt-1 text-[11px] text-muted">Grupos e transmissões</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <Mail className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">E-mail</p>
          <p className="mt-1 font-display text-base font-bold text-foreground">
            Mailing & CSV
          </p>
          <p className="mt-1 text-[11px] text-muted">Boletins estruturados</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <Bell className="h-4 w-4" />
          </div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">6 Temas</p>
          <p className="mt-1 font-display text-base font-bold text-foreground">
            Foco Total
          </p>
          <p className="mt-1 text-[11px] text-muted">Você escolhe o que recebe</p>
        </div>
      </section>

      {/* APLICAÇÃO CLIENTE */}
      <section className="mb-10">
        <CentralAlertasClient />
      </section>

      {/* SANFONA DE DIÁLOGO */}
      <section className="mb-8">
        <PainelDialogo
          titulo="Dúvidas Frequentes sobre os Alertas e Notificações"
          perguntas={[
            {
              id: "como-funciona-telegram",
              pergunta: "Como funciona a notificação no Telegram?",
              resposta:
                "Você inicia conversa com o @ControlePopularBOT e seleciona os municípios ou temas desejados. O bot notifica automaticamente quando novos atos, contratos ou avisos de chuva forem identificados pelos coletores do portal.",
            },
            {
              id: "como-funciona-whatsapp",
              pergunta: "O portal envia mensagens sozinho no WhatsApp?",
              resposta:
                "Não. Por razões de privacidade e política contra spam, o portal não armazena listas de números de WhatsApp. Em vez disso, nosso planejador gera a mensagem com visual profissional e você clica no botão para enviar diretamente pelo seu próprio WhatsApp para seus contatos, grupos de bairro ou listas de transmissão.",
            },
            {
              id: "lgpd-email",
              pergunta: "O que o portal faz com o meu e-mail?",
              resposta:
                "Nada além de enviar os dados solicitados. Seguimos a Lei Geral de Proteção de Dados (LGPD): seu e-mail nunca é vendido, transferido nem usado para outros fins. Você pode cancelar sua inscrição com uma única palavra a qualquer momento.",
            },
          ]}
        />
      </section>
    </div>
  );
}
