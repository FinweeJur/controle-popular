import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import LabExplorador from "./LabExplorador";
import { montarCamadasCatalogo, listarCamadasLab } from "./lab-camadas";
import { resumoBarragens, resumoLicencas, resumoEducacao, resumoEconomia, resumoCongresso, resumoJudiciario, resumoClima, resumoEsg } from "./lab-dados";

export const metadata: Metadata = {
  title: "Laboratório de Dados — Controle Popular",
  description:
    "Explorador interativo de dados públicos: 23 camadas ativáveis (barragens, licenciamento, salários, PNCP, educação, economia e mais).",
};

export default function LaboratorioPage() {
  // 23 camadas do catálogo (PowerBI-style) + os resumos históricos
  // (nomes legados usados pelo buscador `?q=` e URLs antigas).
  const camadasCatalogo = montarCamadasCatalogo();
  const datasets = {
    ...camadasCatalogo,
    barragens: resumoBarragens(),
    licencas: resumoLicencas(),
    educacao: resumoEducacao(),
    economia: resumoEconomia(),
    congresso: resumoCongresso(),
    judiciario: resumoJudiciario(),
    clima: resumoClima(),
    esg: resumoEsg(),
  };

  const camadas = listarCamadasLab();

  return (
    <main
      id="conteudo-principal"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-12 sm:py-16"
    >
      <nav className="mb-6 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">Laboratório</span>
      </nav>

      <header className="mb-8 space-y-2">
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
          Laboratório de Dados
        </h1>
        <p className="max-w-2xl text-sm text-text-soft">
          {camadas.length} camadas ativáveis — ligue e desligue no painel do
          Seu Nonô, escolha o tipo de gráfico por janela. Cada camada é um
          agregado; o acervo bruto fica no servidor.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-text-soft">Carregando...</p>}>
        <LabExplorador datasets={datasets} camadas={camadas} />
      </Suspense>
    </main>
  );
}
