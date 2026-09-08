import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import CartoesResumo from "@/app/components/CartoesResumo";
import GraficoBarrasSvg from "@/app/components/GraficoBarrasSvg";
import { COBERTURA_SIGBM, BARRAGENS_SIGBM } from "@/lib/ambiental/barragens-sigbm";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import TabelaSigbm from "../TabelaSigbm";

export const metadata: Metadata = {
  title: "Monitor Nacional de Barragens (SIGBM / ANM) — Controle Popular",
  description:
    "Cadastro consolidado das barragens de mineração em Minas Gerais e no Brasil pela Agência Nacional de Mineração (ANM). Níveis de emergência 1–3, Dano Potencial Associado (DPA) e projetos de descaracterização.",
};

export default function BarragensSigbmPage() {
  const itensCartoes = [
    {
      rotulo: "Total de Barragens em MG",
      valor: COBERTURA_SIGBM.total,
      detalhe: `${COBERTURA_SIGBM.municipios} municípios com barragens`,
      destaque: true,
    },
    {
      rotulo: "Em Nível de Emergência (1 a 3)",
      valor: COBERTURA_SIGBM.emEmergencia,
      detalhe: `${COBERTURA_SIGBM.porNivelEmergencia[3]?.total ?? 0} no Nível 3 (iminência de ruptura)`,
      alerta: true,
    },
    {
      rotulo: "Em Nível de Alerta",
      valor: COBERTURA_SIGBM.emAlerta,
      detalhe: "Instrumento preventivo preliminar da ANM",
    },
    {
      rotulo: "Em Descaracterização",
      valor: COBERTURA_SIGBM.emDescaracterizacao,
      detalhe: `${COBERTURA_SIGBM.inativas} inativas e ${COBERTURA_SIGBM.ativas} ativas`,
    },
    {
      rotulo: "Categoria de Risco Alta (CRI)",
      valor: COBERTURA_SIGBM.categoriaRiscoAlta,
      detalhe: "Avaliação técnica da estrutura física",
      alerta: true,
    },
  ];

  const itensGraficoEmergencia = COBERTURA_SIGBM.porNivelEmergencia.map((n) => ({
    rotulo: n.valor,
    valor: n.total,
    cor:
      n.valor.includes("3")
        ? "var(--color-alert, #ef4444)"
        : n.valor.includes("2") || n.valor.includes("1")
          ? "var(--color-warning, #f59e0b)"
          : n.valor.includes("Alerta")
            ? "var(--color-info, #3b82f6)"
            : "var(--color-primary, #10b981)",
  }));

  const itensGraficoSituacao = COBERTURA_SIGBM.porSituacao.map((s) => ({
    rotulo: s.valor,
    valor: s.total,
    cor: s.valor === "Em Descaracterização" ? "var(--color-primary)" : undefined,
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
        ·{" "}
        <Link href="/ambiental/barragens" className="hover:text-primary">
          Barragens
        </Link>{" "}
        · <span className="text-text">SIGBM / ANM</span>
      </nav>

      <header className="mb-8 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Ambiental · Federal · Mineração
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Monitor de Barragens de Mineração (SIGBM / ANM)
        </h1>
        <p className="max-w-3xl text-base text-text-soft">
          Cadastro oficial da Agência Nacional de Mineração (ANM) contendo todas as{" "}
          <strong>{formatNumberBR(COBERTURA_SIGBM.total)}</strong> barragens de mineração registradas
          em Minas Gerais (de {formatNumberBR(COBERTURA_SIGBM.totalBrasil)} no Brasil).
        </p>
      </header>

      {/* Regra 2: Cartões de Topo / KPIs */}
      <section className="mb-10">
        <CartoesResumo itens={itensCartoes} colunas={5} />
      </section>

      {/* Regra 1: Gráficos de Distribuição SVG inline */}
      <section className="mb-12 grid gap-6 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
        <div>
          <GraficoBarrasSvg
            itens={itensGraficoEmergencia}
            titulo="Distribuição por Nível de Emergência"
            subtitulo="Classificação oficial da ANM para o estado de MG"
            orientacao="horizontal"
            altura={220}
          />
        </div>
        <div>
          <GraficoBarrasSvg
            itens={itensGraficoSituacao}
            titulo="Situação Operacional"
            subtitulo="Barragens ativas, inativas e em descaracterização"
            orientacao="horizontal"
            altura={220}
          />
        </div>
      </section>

      {/* Ressalva Editorial Obrigatória */}
      <div className="mb-8 rounded-2xl border border-alert/30 bg-surface-2 p-5 text-sm text-text-soft">
        <p className="font-semibold text-text">Nota metodológica de segurança:</p>
        <p className="mt-1">
          O <strong>Nível de Alerta</strong> é uma medida preventiva interna e não se confunde com os{" "}
          <strong>Níveis de Emergência 1, 2 e 3</strong> (onde o Nível 3 representa risco iminente de
          ruptura). O cadastro do SIGBM não soma diretamente com os números do inventário estadual da
          FEAM devido a escopos e critérios normativos distintos.
        </p>
      </div>

      {/* Regras 3, 4 e 5: Tabela Filtrável, Ordenável com Exportação CSV BOM */}
      <section className="mb-12">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold text-text">
            Acervo Completo de Barragens em MG
          </h2>
          <p className="text-xs text-text-soft">
            Última atualização na fonte: {formatDateBR(COBERTURA_SIGBM.ultimaAtualizacao)} · Coletado em:{" "}
            {formatDateBR(COBERTURA_SIGBM.coletadoEm)}
          </p>
        </div>
        <TabelaSigbm />
      </section>

      <footer className="border-t border-border pt-8 text-sm text-text-soft">
        <p>
          Fonte: <strong>Agência Nacional de Mineração (ANM)</strong> — Sistema Integrado de Gestão de
          Segurança de Barragens de Mineração. Dados de domínio público disponibilizados em conformidade
          com a Lei de Acesso à Informação.
        </p>
        <div className="mt-6">
          <FooterGlobal />
        </div>
      </footer>
    </main>
  );
}
