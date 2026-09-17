import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import {
  ITENS_EDITAIS,
  COBERTURA_EDITAIS,
  POR_ORGAO,
  listarOrgaos,
  listarModalidades,
  listarAnos,
} from "@/lib/editais/dados";
import { metadataEditavel } from "@/lib/edicoes";
import PainelEditais from "./PainelEditais";
import FooterGlobal from "@/app/components/FooterGlobal";
import { DatasetJsonLd } from "@/app/components/DatasetJsonLd";

export const metadata: Metadata = metadataEditavel("/editais", {
  title: "Editais e Chamamentos Públicos de Minas Gerais — Controle Popular",
  description: `Radar diário de editais, licitações, leilões e chamamentos de interesse social publicados no Diário Oficial de Minas Gerais: ${formatNumberBR(
    COBERTURA_EDITAIS.total
  )} certames monitorados, com busca, filtros por órgão e download em CSV.`,
});

function formatarDataIso(iso: string): string {
  if (!iso || !iso.includes("-")) return iso;
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export default function EditaisPage() {
  const orgaos = listarOrgaos();
  const modalidades = listarModalidades();
  const anos = listarAnos();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <DatasetJsonLd
        name="Radar de Editais e Chamamentos Públicos de Minas Gerais"
        description="Dataset público e aberto com 50+ editais, licitações e chamamentos de interesse social coletados do Diário Oficial de Minas Gerais."
        url="/editais"
        keywords={["editais", "licitações", "compras públicas", "diário oficial", "minas gerais", "transparência"]}
      />
      {/* ─── CABEÇALHO DA PÁGINA ───────────────────────────────────────── */}
      <header className="space-y-4">
        <p className="text-[.82em] font-semibold tracking-wide text-text-soft uppercase">
          Radar do Diário Oficial · Transparência & Controle Social
        </p>
        <h1 className="font-display text-[clamp(1.8em,4vw,2.5em)] font-bold tracking-tight text-text">
          Editais, Chamamentos e Licitações Públicas de Minas Gerais
        </h1>
        <p className="max-w-3xl text-[1.05em] leading-relaxed text-text-soft">
          Monitoramento contínuo das publicações do Diário Oficial Eletrônico do Estado (Jornal Minas Gerais).
          Identificamos chamamentos públicos, credenciamentos em saúde e educação, editais de conselhos civis,
          alienações do Detran e termos de parceria para garantir ampla transparência e oportunidade cívica de participação.
        </p>
      </header>

      {/* ─── CARTÕES DE TOPO (STATUS & AGREGADOS) ─────────────────────── */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-soft uppercase">Total de Certames</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-primary">
            {formatNumberBR(COBERTURA_EDITAIS.total)}
          </p>
          <p className="mt-1 text-[11px] text-text-soft">atos oficiais catalogados</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-soft uppercase">Órgãos Monitorados</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-text">
            {COBERTURA_EDITAIS.orgaosCount}
          </p>
          <p className="mt-1 text-[11px] text-text-soft">secretarias, fundações e institutos</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-soft uppercase">Modalidades Ativas</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-text">
            {COBERTURA_EDITAIS.modalidadesCount}
          </p>
          <p className="mt-1 text-[11px] text-text-soft">chamamentos, credenciamentos e pregões</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold text-text-soft uppercase">Última Edição</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-text">
            {formatarDataIso(COBERTURA_EDITAIS.ultimaData)}
          </p>
          <p className="mt-1 text-[11px] text-text-soft">rastreamento diário automatizado</p>
        </div>
      </div>

      {/* ─── METODOLOGIA E RESSALVA EDITORIAL ─────────────────────────── */}
      <div className="mt-6 rounded-xl border border-border/80 bg-surface-2/50 p-4 text-xs text-text-soft">
        <p className="leading-relaxed">
          <strong className="text-text">Metodologia e Verificação Dupla:</strong> O radar de editais varre
          determinística e diariamente as edições do Diário Oficial de Minas Gerais (caderno executivo).
          A detecção prioriza atos com potencial de interesse social — participação popular, conselhos de direitos,
          repasses a entidades civis, saúde pública e fomento à educação. Todos os números de CPF são anonimizados
          por algoritmo de verificação mod-11 antes de qualquer publicação no portal.
        </p>
      </div>

      {/* ─── COMPONENTE CLIENTE INTERATIVO ───────────────────────────── */}
      <PainelEditais
        itens={ITENS_EDITAIS}
        orgaos={orgaos}
        modalidades={modalidades}
        anos={anos}
        distribuicaoOrgaos={POR_ORGAO}
      />

      {/* ─── PÁGINAS RELACIONADAS ────────────────────────────────────── */}
      <nav aria-label="Páginas relacionadas" className="mt-8 border-t border-border pt-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-soft">
          Páginas relacionadas
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/ambiental", titulo: "Meio Ambiente", desc: "TACs, COPAM, licenciamentos e legislação ambiental de MG." },
            { href: "/estudos-rurais", titulo: "Estudos Rurais", desc: "Reforma agrária, assentamentos e territórios em MG." },
            { href: "/documentacao", titulo: "Documentação Técnica", desc: "Como o radar de editais funciona: fontes, coleta e API." },
          ].map((p) => (
            <a
              key={p.href}
              href={p.href}
              className="group rounded-lg border border-border bg-surface-2/50 p-3 text-sm transition hover:border-primary hover:bg-surface-2"
            >
              <p className="font-medium text-text group-hover:text-primary">{p.titulo}</p>
              <p className="mt-0.5 text-xs text-text-soft">{p.desc}</p>
            </a>
          ))}
        </div>
      </nav>

      <FooterGlobal />
    </div>
  );
}
