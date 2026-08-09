import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { temFonte, type Cidade } from "@/lib/db/queries/municipios";
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

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Serviços ao Cidadão — ${c.nome} | ${nomePortal(c)}`,
  (c) => `Zap ${c.nome}, Compra e Venda, coleta de lixo, farmácias de plantão, postos de combustível e clima.`
);

/**
 * `fonte` é a chave de `municipios.fontes` que decide se o item existe
 * naquela cidade. Sem ela o card apareceria para todo mundo e levaria a um
 * 404 — os `notFound()` das páginas em questão já estão lá, e um menu que
 * aponta para 404 é pior que um menu curto.
 */
type ItemServico = {
  href: string;
  nome: string;
  desc: string;
  icon: LucideIcon;
  fonte?: string;
};

const servicos = (cidade: Cidade): ItemServico[] => [
  { href: "/zap", nome: `Zap ${cidade.nome}`, desc: "Cadastro de negócios locais no WhatsApp", icon: MessageCircle },
  { href: "/citrolandia", nome: "Citrolândia", desc: "Bairros da região e negócios locais", icon: MapPin, fonte: "citrolandia" },
  { href: "/compra-e-venda", nome: "Compra e Venda", desc: "Classificados gratuitos", icon: ShoppingBag },
  { href: "/coleta-lixo", nome: "Coleta de Lixo", desc: "Dias por bairro + lembrete no calendário", icon: Trash2 },
  { href: "/plantao-farmacias", nome: "Farmácias de Plantão", desc: "Escala da semana + rota no Waze", icon: Pill },
  { href: "/supermercados-farmacias", nome: "Supermercados e Farmácias", desc: "Lista pública de comércios essenciais", icon: ShoppingCart },
  { href: "/postos-combustivel", nome: "Postos de Combustível", desc: "Cadastro ANP com nota de conformidade", icon: Fuel },
  { href: "/clima", nome: "Clima", desc: "Previsão e chuva acumulada", icon: CloudSun },
  { href: "/defesa-civil", nome: "Defesa Civil", desc: "Alertas de chuva forte e emergências", icon: ShieldAlert },
  { href: "/contatos", nome: "Contatos Úteis", desc: "Telefones de emergência e órgãos públicos", icon: Phone },
  { href: "/links-uteis-mg", nome: "Links Úteis do Estado", desc: `Fontes oficiais de ${cidade.uf} por tema`, icon: Landmark, fonte: "links_uteis_mg" },
];

export default async function ServicosPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Serviços ao Cidadão
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Utilidades do dia a dia de {cidade.nome}, num só lugar.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {servicos(cidade)
          .filter((s) => !s.fonte || temFonte(cidade, s.fonte))
          .map((s) => (
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
