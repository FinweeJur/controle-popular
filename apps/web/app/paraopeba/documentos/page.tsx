import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { COBERTURA_DOCUMENTOS_PROCESSO } from "@/lib/paraopeba";
import { formatNumberBR } from "@/lib/betim/format";
import DocumentosClient from "./DocumentosClient";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/paraopeba/documentos` — documentos do processo judicial da reparação
 * que citam cada município da Bacia do Paraopeba, direto do índice público
 * da Plataforma Brumadinho UFMG.
 *
 * ═══ A COBERTURA É PARCIAL, E A TELA DIZ ISSO PRIMEIRO ═══
 *
 * `places` (o único campo geográfico do índice da UFMG) é texto livre,
 * preenchido em só 18,2% do acervo — e cruzando contra os 853 municípios
 * de MG, só 6,6% do acervo INTEIRO tem um valor que bate. Não é "os
 * documentos do processo": é uma fatia medida, e a tela declara a fração,
 * nunca só a contagem absoluta.
 *
 * ═══ "CITA", NUNCA "É SOBRE" ═══
 *
 * `places` é anotação de apoio à busca da própria UFMG, não geocodificação
 * do fato — um documento marcado "brumadinho-mg" pode ser sobre um evento
 * ali, sobre pessoa residente lá, ou um trecho que só MENCIONA o
 * município. Todo texto desta tela (e de `DocumentosClient.tsx`) diz
 * "cita", nunca "é sobre" ou "aconteceu em".
 */
export const metadata: Metadata = metadataEditavel("/paraopeba/documentos", {
  title: "Documentos do processo — Paraopeba | Controle Popular",
  description: `${formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.publicados)} documentos do processo judicial da reparação de Brumadinho que citam um município da Bacia do Paraopeba, com link para o original e citação da fonte — Plataforma Brumadinho UFMG.`,
});

export default function DocumentosPage() {
  const c = COBERTURA_DOCUMENTOS_PROCESSO;

  // ⟲ 13/08, revisão de onboarding: era `<div>` — mesmo conserto de
  // `clipping/page.tsx` (ver o comentário lá).
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Documentos do processo</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Documentos do processo que citam cada município
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        O processo judicial da reparação tem {formatNumberBR(c.totalAcervo)} documentos
        indexados pela Plataforma Brumadinho UFMG. Só {formatNumberBR(c.comLocalPreenchido)}{" "}
        ({((c.comLocalPreenchido / c.totalAcervo) * 100).toFixed(1)}%) têm o campo de local
        preenchido, e destes só {formatNumberBR(c.comMunicipioIdentificado)} citam, por nome,
        um dos municípios de Minas Gerais — os outros são nome de barragem, comunidade, rio ou
        bacia, não município.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <p className="font-tabular text-3xl font-bold text-text">
          {formatNumberBR(c.publicados)} de {formatNumberBR(c.totalAcervo)}
        </p>
        <p className="mt-1 text-sm text-text-soft">
          <strong className="text-text">{c.percentualPublicado}% do acervo inteiro</strong> —
          esta página cobre uma fatia medida, não o processo completo. Cada item tem link para o
          documento original e citação da fonte; sem os dois, o item não entra.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-5 text-sm text-text-soft">
        <p>
          <strong className="text-text">&ldquo;Cita&rdquo;, não &ldquo;é sobre&rdquo;:</strong>{" "}
          o campo que liga documento a município é texto livre da própria UFMG, para apoiar
          busca — não geocodificação do fato. Um documento marcado com um município pode ser
          sobre um evento ali, sobre pessoa residente lá, ou um trecho que só menciona o nome.
        </p>
        <p className="mt-2">
          <strong className="text-text">Triagem de dado pessoal:</strong>{" "}
          {formatNumberBR(c.resumosRedigidosPelaTriagem)} destes {formatNumberBR(c.publicados)}{" "}
          documentos tiveram o resumo removido antes de publicar — o item continua na lista, com
          metadado e link, sem o texto que a triagem identificou como risco.
        </p>
      </div>

      <DocumentosClient />

      <section className="mt-10 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">De onde vem o dado</h2>
        <p className="mt-2">
          Cada documento vem do índice público (Solr) da{" "}
          <a
            href="http://plataforma.projetobrumadinho.ufmg.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Plataforma Brumadinho UFMG ↗
          </a>{" "}
          (o domínio ainda não usa conexão segura). O resumo de cada documento foi escrito pela
          equipe do projeto e é reproduzido aqui como citação, com atribuição — não reescrito. O
          link aponta para o PDF do documento individual na própria Plataforma.
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
