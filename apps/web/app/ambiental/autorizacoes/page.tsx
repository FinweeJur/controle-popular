/**
 * Página "Destinações de Imóveis da União em Minas Gerais" (rota /ambiental/autorizacoes).
 *
 * Papel: apresentar o cadastro público dos imóveis da União em MG, com
 * destinação, classe, proprietário e área de cada um, de forma auditável.
 *
 * Fonte oficial: SPU — Secretaria do Patrimônio da União (Ministério da Gestão
 * e Inovação), Painel de Transparência Ativa, aba "Imóveis da União" (UF=MG).
 *
 * Decisão técnica: a página é de servidor e só carrega o JSON no build; o
 * componente de cliente recebe `metadados` e `imoveis` prontos e cuida de
 * busca, filtro, ordenação e export CSV sem rede. A rota mantém o nome
 * `autorizacoes` por compatibilidade, embora o conteúdo seja de destinações.
 */

import { carregarDestinacoesUniaoMg } from "@/lib/ambiental/destinacoes-uniao-dados";
import AutorizacoesClient from "./AutorizacoesClient";
import Link from "next/link";

export const metadata = {
  title: "Destinações de Imóveis da União em MG | Controle Popular",
  description:
    "Cadastro público dos imóveis da União em Minas Gerais: destinação, classe, proprietário e área, com fonte na SPU.",
};

export default function PageAutorizacoes() {
  const { metadados, imoveis } = carregarDestinacoesUniaoMg();

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <nav aria-label="Você está em" className="text-sm text-text-soft mb-2">
          <Link href="/">Controle Popular</Link> {" > "}{" "}
          <Link href="/ambiental">Ambiental</Link> {" > "}{" "}
          <span>Destinações de Imóveis da União</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight">
          Destinações de Imóveis da União em Minas Gerais
        </h1>
        <p className="mt-2 text-text-soft max-w-3xl">
          {metadados.total} imóveis da União em {metadados.totalMunicipios}{" "}
          municípios mineiros, com a destinação e o regime de cada um. Dado
          público da Secretaria do Patrimônio da União (SPU), aberto para
          auditoria cidadã.
        </p>
      </header>

      <AutorizacoesClient metadados={metadados} imoveis={imoveis} />

      <footer className="mt-8 border-t border-border pt-4 text-xs text-text-soft flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          🛡️ Controle Popular — dados públicos abertos para auditoria cidadã.
        </p>
        <a
          href={metadados.fonteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          SPU / Painel de Transparência Ativa ↗
        </a>
      </footer>
    </article>
  );
}
