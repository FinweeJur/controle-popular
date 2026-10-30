import type { Metadata } from "next";
import Link from "next/link";
import DataColeta from "@/app/components/DataColeta";
import CartoesResumo from "@/app/components/CartoesResumo";
import MeioAmbienteRelacionado from "@/app/components/MeioAmbienteRelacionado";
import { formatCurrencyBRL, formatNumberBR } from "@/lib/betim/format";
import { resumoRecentes } from "@/lib/ambiental/autos-recentes";
import BuscaAutos from "./BuscaAutos";

/**
 * /ambiental/autuacoes — autos de infração ambiental de MG, janela 2024–2026.
 *
 * ⚠️ POR QUE ESTA JANELA PRIMEIRO
 * O foco pedido é o triênio recente. A entidade do Sisema
 * (`Autos_Infracao_Completa`) tem os 36 mil autos de 2024–2026 com número,
 * data, órgão, município, valor e situação — e nenhum titular.
 *
 * ⚠️ O QUE FICA PARA A PRÓXIMA ETAPA
 * Empresa/CNPJ, medidas (embargo, reflorestamento, suspensão) e o histórico
 * desde 1992 estão no CAP da SEMAD, que vai até 2023. O CAP é outra fonte,
 * outro período: os dois recortes nunca se somam.
 */

export const metadata: Metadata = {
  title: "Autos de infração ambiental em Minas Gerais (2024–2026) | Controle Popular",
  description:
    "Busque os autos de infração ambiental de Minas Gerais por município, ano, situação e valor. Número do auto, data, órgão e valor lavrado, sem nome de autuado.",
};

export default function AutosSemadPage() {
  const resumo = resumoRecentes();
  const anos = Object.keys(resumo.porAno).sort();
  const situacoes = Object.keys(resumo.porSituacao);
  const municipios = resumo.porMunicipio.map((m) => m.municipio);
  const emProcessamento = resumo.porSituacao["Em processamento"] ?? 0;

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16"
    >
      <nav className="mb-6 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ›{" "}
        <Link href="/ambiental" className="hover:text-primary">
          Ambiental
        </Link>{" "}
        › <span className="text-text">Autos de infração</span>
      </nav>

      <header className="mb-4 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Ambiental › Estadual › Fiscalização
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Autos de infração ambiental em Minas Gerais
        </h1>
        <p className="max-w-3xl text-base text-text-soft">
          Os autos lavrados pela fiscalização estadual entre <strong>2024 e 2026</strong>:
          busque por município, ano, situação do processo ou faixa de valor e abra os
          metadados de cada auto.{" "}
          <strong className="text-text">
            Auto lavrado não é dano provado nem multa paga
          </strong>{" "}
          — o processo pode ser anulado, e por isso a situação acompanha cada cifra.
        </p>
      </header>

      <DataColeta
        coletadoEm={resumo.geradoEm}
        fonte="Painel de Indicadores do Sisema (Power BI público) — aba Autos de Infração"
        competencia="atualização mensal declarada pela fonte"
      />

      <section className="mb-10 mt-6">
        <CartoesResumo
          colunas={4}
          itens={[
            {
              rotulo: "Autos (2024–2026)",
              valor: formatNumberBR(resumo.totalAutos),
              detalhe: "Ato lavrado — não é multa paga",
            },
            {
              rotulo: "Valor lavrado",
              valor: formatCurrencyBRL(resumo.valorTotal),
              detalhe: "Soma dos autos, sem correção",
            },
            {
              rotulo: "Municípios com auto",
              valor: formatNumberBR(resumo.porMunicipio.length),
              detalhe: "No recorte do painel",
            },
            {
              rotulo: "Em processamento",
              valor: formatNumberBR(emProcessamento),
              detalhe: "Ainda sem decisão final",
            },
          ]}
        />
      </section>

      <BuscaAutos
        municipios={municipios}
        situacoes={situacoes}
        anos={anos}
        fonteUrl={resumo.fonteUrl}
        totalGeral={resumo.totalAutos}
      />

      <div className="mt-10 space-y-3 rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
        <p>
          <strong className="text-text">Sem titular.</strong> O portal publica o ato,
          nunca a pessoa: a entidade coletada não traz nome, CPF/CNPJ nem RG
          (AGENTS § 5.2).
        </p>
        <p>
          <strong className="text-text">Valor.</strong> É multa{" "}
          <strong>lavrada, não paga</strong>. A situação do processo diz se o valor
          foi quitado, virou dívida ativa ou ainda está em análise.
        </p>
        <p>
          <strong className="text-text">O que este recorte não tem.</strong> Empresa,
          CNPJ e medidas determinadas (embargo, reflorestamento, suspensão) não
          existem na entidade publicada do Sisema; eles estão no CAP da SEMAD, que
          cobre 1992–2023. São fontes e períodos diferentes — os totais não se somam.
        </p>
        <p>
          <strong className="text-text">Fonte e coleta.</strong> {resumo.fonte}.{" "}
          Coletor:{" "}
          <code className="text-xs">etl/betim/etl/apis/sisema_autos_infracao.py</code>.
        </p>
      </div>

      <footer className="border-t border-border pt-8 text-sm text-text-soft">
        <p>
          Fonte: <strong>Sisema/SEMAD-MG</strong> — Painel de Indicadores do Sisema,
          aba Autos de Infração. Dado público, sem login.
        </p>
        <div className="mt-6">
          <MeioAmbienteRelacionado />
        </div>
      </footer>
    </main>
  );
}
