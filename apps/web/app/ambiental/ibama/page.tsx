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
import { formatCurrencyBRL } from "@/lib/betim/format";
import TabelaIbamaClient from "./TabelaIbamaClient";
import TabelaIbamaAutos from "./TabelaIbamaAutos";
import { obterIbamaAutos } from "@/lib/server-only/dados-ibama-autos";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";

export const metadata: Metadata = {
  title: "Licenciamento e Fiscalização Federal (IBAMA em MG) — Controle Popular",
  description:
    "Painel de licenciamento ambiental federal, autos de infração e julgamentos de penalidades aplicadas pelo IBAMA no estado de Minas Gerais.",
};

export default function IbamaIndexPage() {
  const autos = obterIbamaAutos();
  const autosMg = autos.registros.filter((r) => r.uf === "MG");
  const fmtInt = (n: number) => n.toLocaleString("pt-BR");
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
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

      {/* ═══ A FISCALIZAÇÃO NACIONAL, MUNICÍPIO A MUNICÍPIO (IBAMA) ═══ */}
      {autos.total_autos > 0 ? (
        <section aria-label="Autos de infração do IBAMA" className="mb-12 space-y-5">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
              Fiscalização federal · autos de infração
            </p>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-semibold text-text">
              Além do empreendimento: a fiscalização do IBAMA, município a município
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
              O bloco acima trata das licenças e dos processos de grandes empreendimentos em Minas. Este traz a
              fiscalização inteira: os autos de infração lavrados pelo IBAMA no Brasil entre {autos.janela}, por
              município — com a tabela recortada para Minas Gerais.{" "}
              <strong className="text-text">Auto lavrado não é condenação:</strong> cabe defesa e recurso, e o
              infrator não é publicado aqui — só o agregado por território.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface-2 p-5">
              <p className="text-2xl font-semibold tabular-nums">{fmtInt(autos.total_autos)}</p>
              <p className="mt-1 text-sm text-text-soft">autos no Brasil ({autos.janela})</p>
              <p className="mt-2 text-xs text-text-soft">em {fmtInt(autos.total_municipios)} municípios</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-5">
              <p className="text-2xl font-semibold tabular-nums">{brl(autos.total_valor)}</p>
              <p className="mt-1 text-sm text-text-soft">em multas autuadas</p>
              <p className="mt-2 text-xs text-text-soft">valor da fonte, sem correção</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-5">
              <p className="text-2xl font-semibold tabular-nums">{fmtInt(autosMg.reduce((s, r) => s + r.autos, 0))}</p>
              <p className="mt-1 text-sm text-text-soft">autos em Minas Gerais</p>
              <p className="mt-2 text-xs text-text-soft">em {fmtInt(autosMg.length)} municípios mineiros</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface-2 p-5">
              <p className="text-2xl font-semibold tabular-nums">
                {fmtInt(autosMg.reduce((s, r) => s + r.com_embargo, 0))}
              </p>
              <p className="mt-1 text-sm text-text-soft">com termo de embargo em MG</p>
              <p className="mt-2 text-xs text-text-soft">área/atividade embargada para paralisar a infração</p>
            </div>
          </div>

          <p className="rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
            <strong>Ressalva.</strong> O IBAMA publica nome e CPF/CNPJ de cada autuado na base de dados; este
            portal publica <strong>só o agregado por município</strong> — nada de infrator identificado. Os biomas
            mais atingidos no país são Amazônia, Mata Atlântica e Cerrado; o número é do ato lavrado, não da
            decisão final.
          </p>

          <TabelaIbamaAutos registros={autosMg} />

          <p className="text-xs text-muted">
            Fonte:{" "}
            <a href={autos.url_fonte} target="_blank" rel="noopener noreferrer" className="underline">
              IBAMA — Dados Abertos (auto de infração, SIFISC)
            </a>
            . Coletor: <code>scripts/etl/ibama/coletar-autos-infracao.py</code>. {autos.metodologia}
          </p>
        </section>
      ) : null}

      <footer className="border-t border-border pt-8 text-sm text-text-soft">
        <p>
          Fonte: <strong>Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis (IBAMA)</strong>.
          Dados abertos consolidados em conformidade com a Lei de Acesso à Informação (Lei 12.527/2011).
        </p>
        <div className="mt-6">
      <MeioAmbienteRelacionado />
          <FooterGlobal />
        </div>
      </footer>
    </main>
  );
}
