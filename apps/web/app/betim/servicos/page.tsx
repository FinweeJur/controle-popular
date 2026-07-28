import Link from "@/lib/betim/link";
import {
  MessageCircle,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Pill,
  Fuel,
  CloudSun,
  ShieldAlert,
  Phone,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export const metadata = {
  title: "Serviços ao Cidadão — Betim | Controle Popular Betim",
  description: "Zap Betim, Compra e Venda, coleta de lixo, farmácias de plantão, postos de combustível e clima.",
};

const SERVICOS: { href: string; nome: string; desc: string; icon: LucideIcon }[] = [
  { href: "/zap-betim", nome: "Zap Betim", desc: "Cadastro de negócios locais no WhatsApp", icon: MessageCircle },
  { href: "/citrolandia", nome: "Citrolândia", desc: "Bairros da região e negócios locais", icon: MapPin },
  { href: "/compra-e-venda", nome: "Compra e Venda", desc: "Classificados gratuitos", icon: ShoppingBag },
  { href: "/coleta-lixo", nome: "Coleta de Lixo", desc: "Dias por bairro + lembrete no calendário", icon: Trash2 },
  { href: "/plantao-farmacias", nome: "Farmácias de Plantão", desc: "Escala da semana + rota no Waze", icon: Pill },
  { href: "/supermercados-farmacias", nome: "Supermercados e Farmácias", desc: "Lista pública, Centro e Citrolândia em destaque", icon: ShoppingCart },
  { href: "/postos-combustivel", nome: "Postos de Combustível", desc: "Cadastro ANP com nota de conformidade", icon: Fuel },
  { href: "/clima", nome: "Clima", desc: "Previsão e chuva acumulada", icon: CloudSun },
  { href: "/defesa-civil", nome: "Defesa Civil", desc: "Alertas de chuva forte e emergências", icon: ShieldAlert },
  { href: "/contatos", nome: "Contatos Úteis", desc: "Telefones de emergência e órgãos públicos", icon: Phone },
  { href: "/links-uteis-mg", nome: "Links Úteis do Estado", desc: "Fontes oficiais de Minas Gerais por tema", icon: Landmark },
];

export default function ServicosPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Serviços ao Cidadão
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Utilidades do dia a dia de Betim, num só lugar.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {SERVICOS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="cp-card-hover flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon size={20} strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <p className="font-display font-semibold text-text">{s.nome}</p>
              <p className="mt-1 text-sm text-text-soft">{s.desc}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
