import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import CartoesResumo from "@/app/components/CartoesResumo";
import GraficoBarrasSvg from "@/app/components/GraficoBarrasSvg";
import {
  COBERTURA_IBAMA_MG,
  LICENCAS_IBAMA,
  INFRACOES_IBAMA,
} from "@/lib/ambiental/ibama";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import TabelaIbamaClient from "./TabelaIbamaClient";

export const metadata: Metadata = {
  title: "Licenciamento e Fiscalização Federal (IBAMA em MG) — Controle Popular",
  description:
    "Painel de licenciamento ambiental federal, autos de infração e julgamentos de penalidades aplicadas pelo IBAMA no estado de Minas Gerais.",
};

export default function IbamaIndexPage() {
  const itensCartoes = [
    {
      rotulo: "Licenças Federais Monitoradas",
      valor: COBERTURA_IBAMA_MG.totalLicencas,
      detalhe: `${COBERTURA_IBAMA_MG.licencasVigentes} com validade vigente`,
    },
    {
      rotulo: "Autos de Infração Julgados",
      valor: COBERTURA_IBAMA_MG.totalInfracoes,
      detalhe: "Grandes empreendimentos em MG",
      alerta: true,
    },
    {
      rotulo: "Montante de Multas Aplicadas",
      valor: formatCurrencyBRL(COBERTURA_IBAMA_MG.montanteMultas),
      detalhe: "Valores brutos autuados na fonte",
    },
    {
      rotulo: "Municípios Mineiros Impactados",
      valor: COBERTURA_IBAMA_MG.municipiosAtendidos,
      detalhe: "Compreende bacias do Doce, Paraopeba e Jequitinhonha",
    },
  ];

  const dadosGraficoLicencas = COBERTURA_IBAMA_MG.licencasPorTipo.map((item) => ({
    rotulo: item.tipo === "LO" ? "Operação (LO)" : item.tipo === "LI" ? "Instalação (LI)" : item.tipo === "LP" ? "Prévia (LP)" : item.tipo,
    valor: Number(item.total),
  }));

  const dadosGraficoInfracoes = COBERTURA_IBAMA_MG.infracoesPorStatus.map((item) => ({
    rotulo: item.status,
    valor: Number(item.total),
    cor:
      item.status === "Julgado Procedente"
        ? "var(--color-primary, #10b981)"
        : item.status === "Recurso Pendente"
          ? "var(--color-warning, #f59e0b)"
          : "var(--color-info, #3b82f6)",
  }));

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-6 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/ambiental" className="hover:text-primary">
          Ambiental
        </Link>{" "}
        · <span className="text-text">IBAMA em MG</span>
      </nav>

      <header className="mb-8 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Ambiental · Federal · Fiscalização e Licenciamento
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Licenciamento e Fiscalização Federal (IBAMA) em Minas Gerais
        </h1>
        <p className="max-w-3xl text-base text-text-soft">
          Acompanhamento das licenças ambientais federais de grandes complexos industriais e minerários,
          autuações por infrações ambientais e histórico de julgamentos pelo IBAMA.
        </p>
      </header>

      {/* Regra 2: Cartões de Topo / KPIs */}
      <section className="mb-10">
        <CartoesResumo itens={itensCartoes} colunas={4} />
      </section>

      {/* Regra 1: Gráficos SVG inline */}
      <section className="mb-12 grid gap-6 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <GraficoBarrasSvg
            itens={dadosGraficoLicencas}
            titulo="Licenças por Tipologia"
            subtitulo="Distribuição entre Licenças Prévias, Instalação e Operação"
            orientacao="horizontal"
            altura={200}
          />
        </div>
        <div>
          <GraficoBarrasSvg
            itens={dadosGraficoInfracoes}
            titulo="Julgamentos de Infrações"
            subtitulo="Status processual dos autos de infração ambiental"
            orientacao="horizontal"
            altura={200}
          />
        </div>
      </section>

      {/* Ressalva Editorial */}
      <div className="mb-8 rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
        <p className="font-semibold text-text">Nota sobre competência e sigilo:</p>
        <p className="mt-1">
          O IBAMA licencia empreendimentos de impacto regional ou nacional e aqueles situados em terras
          da União. As autuações e valores expressam penalidades administrativas aplicadas pelo órgão
          fiscalizador, não constituindo condenações na esfera penal ou civil de competência do Judiciário.
        </p>
      </div>

      {/* Regras 3, 4 e 5: Tabela interativa, filtros, ordenação e CSV com BOM UTF-8 */}
      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-text">
          Acervo e Histórico Processual
        </h2>
        <TabelaIbamaClient
          licencas={LICENCAS_IBAMA}
          infracoes={INFRACOES_IBAMA}
        />
      </section>

      <footer className="border-t border-border pt-8 text-sm text-text-soft">
        <p>
          Fonte: <strong>Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA)</strong>.
          Dados abertos consolidados em conformidade com a Lei de Acesso à Informação (Lei 12.527/2011).
        </p>
        <div className="mt-6">
          <FooterGlobal />
        </div>
      </footer>
    </main>
  );
}
