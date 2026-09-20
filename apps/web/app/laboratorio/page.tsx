import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import LabExplorador from "./LabExplorador";
import {
  resumoBarragens,
  resumoLicencas,
  resumoEducacao,
  resumoEconomia,
  resumoCongresso,
  resumoJudiciario,
  resumoClima,
  resumoEsg,
} from "./lab-dados";

export const metadata: Metadata = {
  title: "Laboratório de Dados — Controle Popular",
  description:
    "Explorador interativo de dados públicos: barragens, licenciamento, educação, economia, Congresso, Judiciário, clima e ESG.",
};

export default function LaboratorioPage() {
  const datasets = {
    barragens: resumoBarragens(),
    licencas: resumoLicencas(),
    educacao: resumoEducacao(),
    economia: resumoEconomia(),
    congresso: resumoCongresso(),
    judiciario: resumoJudiciario(),
    clima: resumoClima(),
    esg: resumoEsg(),
  };

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
          Explore os acervos públicos do portal. Clique num ícone do dock para
          carregar um conjunto de dados. As janelas são independentes — cada
          uma pode mostrar um dado diferente.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-text-soft">Carregando...</p>}>
        <LabExplorador datasets={datasets} />
      </Suspense>
    </main>
  );
}
