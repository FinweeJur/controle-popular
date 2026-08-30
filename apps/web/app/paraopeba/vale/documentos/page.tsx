import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { formatNumberBR } from "@/lib/betim/format";
import { carregarCvmVale } from "@/lib/paraopeba/cvm-vale-dados";
import { metadataEditavel } from "@/lib/edicoes";
import CvmValeClient from "./CvmValeClient";

/**
 * `/paraopeba/vale/documentos` — documentos que a Vale S.A. protocolou na
 * CVM (ITR, DFP e formulário de referência), do cadastro e dos acervos em
 * massa de dados abertos da CVM.
 *
 * ═══ O QUE ESTA PÁGINA É, E O QUE ELA NÃO É ═══
 *
 * É um catálogo de DOCUMENTOS, não o conteúdo deles. Cada linha aponta para o
 * documento protocolado (rad.cvm.gov.br) e para o zip anual em massa de onde o
 * registro saiu. Os números das demonstrações financeiras não entram aqui —
 * quem quiser o balanço abre o documento.
 *
 * ═══ O QUE A COLUNA "VERSÃO" ESCONDE ═══
 *
 * A CVM recebe republicações do mesmo período. A Vale protocolou o FRE de
 * 2025 dezessete vezes e a DFP de 2025 duas vezes; cada período aparece na
 * tabela UMA vez, na versão mais recente. O total de protocolações (incluindo
 * as republicações) está nos cartões, para o leitor não concluir que "17
 * documentos" são 17 períodos.
 *
 * ═══ DADO AUSENTE ═══
 *
 * O arquivo `apps/web/data/cvm-vale.json` é lido no build. Num checkout limpo
 * antes da primeira coleta, a página diz que a coleta não rodou — nunca finge
 * que a Vale não protocolou nada.
 */
export const metadata: Metadata = metadataEditavel("/paraopeba/vale/documentos", {
  title: "Documentos da Vale na CVM — Paraopeba | Controle Popular",
  description:
    "ITRs, DFPs e formulários de referência que a Vale S.A. protocolou na Comissão de Valores Mobiliários entre 2015 e 2025, com link direto ao documento e ao arquivo em massa da fonte — dados abertos da CVM.",
});

const TIPO_ROTULO: Record<string, string> = {
  ITR: "ITR — informações trimestrais",
  DFP: "DFP — demonstrações financeiras",
  FRE: "FRE — formulário de referência",
};

export default function ValeDocumentosPage() {
  const cvm = carregarCvmVale();

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Documentos da Vale na CVM</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Documentos da Vale na CVM
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        Os documentos que a Vale S.A. (CNPJ {cvm?.cnpj ?? "33.592.510/0001-54"}) envia à
        Comissão de Valores Mobiliários: informações trimestrais (ITR), demonstrações
        financeiras anuais (DFP) e o formulário de referência (FRE) — o dossiê anual que
        a companhia mantém atualizado perante a CVM.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-5">
        <p className="text-[.95em] font-semibold text-text">
          Fonte: CVM — dados abertos.
        </p>
        <p className="mt-2 text-[.92em] text-text-soft">
          Documentos enviados pela companhia à Comissão de Valores Mobiliários, baixados
          do catálogo de dados abertos da CVM (CIA_ABERTA). Cada linha é uma protocolação;
          o link leva ao documento original no sistema da CVM.
        </p>
      </div>

      {cvm === null ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-5 text-sm text-text-soft">
          A coleta do catálogo ainda não rodou nesta instalação — o que não diz nada sobre
          a Vale, só sobre esta cópia do site. O coletor é{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5">etl/betim/etl/apis/cvm_ciaberta.py</code>.
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-[.8em] text-text-soft">Documentos no acervo</p>
              <p className="mt-1 font-tabular text-xl font-bold text-text">
                {formatNumberBR(cvm.total_documentos)}
              </p>
              <p className="mt-1 text-[.78em] text-text-soft">
                períodos cobertos: {cvm.anos_cobertos ?? "—"}
              </p>
            </div>
            {(["ITR", "DFP", "FRE"] as const).map((tipo) => (
              <div key={tipo} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-[.8em] text-text-soft">{TIPO_ROTULO[tipo]}</p>
                <p className="mt-1 font-tabular text-xl font-bold text-text">
                  {formatNumberBR(cvm.por_tipo[tipo] ?? 0)}
                </p>
                <p className="mt-1 text-[.78em] text-text-soft">
                  {tipo === "ITR"
                    ? "um por trimestre civil"
                    : "um por exercício"}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[.85em] text-text-soft">
            <strong className="text-text">Republicações contam à parte:</strong> a fonte tem{" "}
            {formatNumberBR(cvm.versoes_totais_na_fonte)} protocolações da Vale entre 2015 e
            2025, mas {formatNumberBR(cvm.total_documentos)} períodos distintos — a tabela
            mostra a versão mais recente de cada período.
          </p>

          <CvmValeClient documentos={cvm.documentos} />

          <section className="mt-12 border-t border-border pt-8">
            <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
            <p className="mt-2 max-w-3xl text-[.93em] text-text-soft">
              Catálogo de{" "}
              <a
                href={cvm.url_fonte}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:underline"
              >
                dados abertos da CVM — companhias abertas ↗
              </a>{" "}
              ({cvm.fonte}). O coletor{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-[.9em]">
                etl/betim/etl/apis/cvm_ciaberta.py
              </code>{" "}
              baixa o cadastro (para achar o código CVM da Vale pelo CNPJ) e os zips anuais
              de ITR, DFP e FRE, filtrando os registros da companhia. Coleta de{" "}
              <strong className="text-text">{cvm.ultima_atualizacao}</strong>. Nenhum
              número desta página foi digitado à mão — todos saem dos arquivos publicados
              pela CVM.
            </p>
            <ul className="mt-3 max-w-3xl list-disc space-y-1 pl-5 text-[.85em] text-text-soft">
              {cvm.ressalvas.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {cvm.falhas.length > 0 && (
              <p className="mt-3 max-w-3xl text-[.85em] text-text-soft">
                ⚠️ {formatNumberBR(cvm.falhas.length)} ano(s) falharam na última coleta:{" "}
                {cvm.falhas.join("; ")}.
              </p>
            )}
          </section>
        </>
      )}

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
