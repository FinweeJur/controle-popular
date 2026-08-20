import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  COBERTURA_AUDITORIA_AJRI,
  AUTOR_AUDITORIA_AJRI,
  FONTE_AUDITORIA_AJRI,
  INSTRUMENTO_AJRI_ORDEM,
  PERIODO_AUDITORIA_AJRI,
  TEMA_AJRI_ORDEM,
  TIPO_DOCUMENTO_AJRI_LABEL,
  TIPO_DOCUMENTO_AJRI_ORDEM,
} from "@/lib/paraopeba/auditoria-ajri";
import { COBERTURA_RESUMO_AJRI } from "@/lib/paraopeba/resumo-ajri";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import AuditoriaClient from "./AuditoriaClient";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/paraopeba/auditoria` — catálogo da auditoria socioambiental independente
 * (AECOM) prevista no Acordo Judicial de Reparação Integral de Brumadinho.
 *
 * ═══ POR QUE ESTA PÁGINA É SEPARADA DE `/paraopeba/documentos` ═══
 *
 * São três acervos de documento na frente, e confundi-los apaga quem fala:
 *
 * · `/paraopeba/documentos` — os AUTOS. Petição, laudo, decisão, do índice
 *   público da Plataforma Brumadinho UFMG.
 * · `/paraopeba/biblioteca` — o que as ASSESSORIAS produziram para as pessoas
 *   atingidas: cartilha, boletim, jornal.
 * · esta — o que a AUDITORA INDEPENDENTE escreveu fiscalizando a execução do
 *   Acordo. Não é peça de parte nem material de comunicação: é o parecer de
 *   quem verifica a Vale e as instituições de justiça.
 *
 * ═══ POR QUE A DECLARAÇÃO DE FINALIDADE FICA NO TOPO, E NÃO NO RODAPÉ ═══
 *
 * Os Termos de Uso do portal-fonte dizem que o material é propriedade da
 * auditora e que não é permitido modificar nem usar comercialmente. Publicar
 * catálogo + link é compatível com isso — mas só se quem chega souber, ANTES
 * de ler as fichas, que a autoria não é deste portal e onde está o original.
 * Um aviso de rodapé chega depois de a pessoa já ter lido 467 descrições
 * escritas por outra pessoa jurídica.
 *
 * Nenhum número desta página é digitado: todos saem da contagem real de
 * `lib/paraopeba/auditoria-ajri.ts`.
 */

const Por = (tipo: (typeof TIPO_DOCUMENTO_AJRI_ORDEM)[number]): number =>
  COBERTURA_AUDITORIA_AJRI.porTipo[tipo];

// `AuditoriaClient` lê `?q=` (deep-link das fichas relacionadas) com
// `useSearchParams()` dentro de `<Suspense>` — mesma armadilha de
// `[municipio]/meio-ambiente/paraopeba/page.tsx`: sem `force-static`,
// `output: export` trata a rota como dinâmica e aborta o build.
export const dynamic = "force-static";

/**
 * "Nota Técnica" → "Notas Técnicas": em português o plural vai em TODAS as
 * palavras do sintagma, e um `+ "s"` no fim escreveria "Nota Técnicas". Os
 * dois rótulos que existem hoje terminam em vogal, então a regra simples
 * basta — se o portal criar um tipo terminado em consoante, é aqui que muda.
 */
const plural = (rotulo: string) =>
  rotulo
    .split(" ")
    .map((p) => `${p}s`)
    .join(" ");

export const metadata: Metadata = metadataEditavel("/paraopeba/auditoria", {
  title: "Auditoria socioambiental — Paraopeba | Controle Popular",
  description: `Catálogo dos ${formatNumberBR(COBERTURA_AUDITORIA_AJRI.total)} documentos da auditoria socioambiental independente (${AUTOR_AUDITORIA_AJRI}) do Acordo Judicial de Reparação Integral de Brumadinho, de ${formatDateBR(PERIODO_AUDITORIA_AJRI.de)} a ${formatDateBR(PERIODO_AUDITORIA_AJRI.ate)} — filtrável por instrumento jurídico, tipo, tema e período, com resumo em linguagem comum de ${formatNumberBR(COBERTURA_RESUMO_AJRI.total)} deles e link para a fonte oficial em cada registro.`,
});

export default function AuditoriaAjriPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Auditoria socioambiental</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        A auditoria independente do Acordo, documento a documento
      </h1>

      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        O Acordo Judicial de Reparação Integral de{" "}
        <strong className="text-text">R$ 37,6 bilhões</strong>, assinado em 04/02/2021, previu uma{" "}
        <strong className="text-text">auditoria socioambiental independente</strong> para fiscalizar
        a execução da reparação. Quem a conduz é a{" "}
        <strong className="text-text">{AUTOR_AUDITORIA_AJRI}</strong>, e este é o catálogo do que
        ela publicou: <strong className="text-text">{formatNumberBR(COBERTURA_AUDITORIA_AJRI.total)} documentos</strong> —{" "}
        {TIPO_DOCUMENTO_AJRI_ORDEM.map((t, i) => (
          <span key={t}>
            {i > 0 ? " e " : ""}
            {formatNumberBR(Por(t))}{" "}
            {Por(t) === 1 ? TIPO_DOCUMENTO_AJRI_LABEL[t] : plural(TIPO_DOCUMENTO_AJRI_LABEL[t])}
          </span>
        ))}{" "}
        —, de <strong className="text-text">{formatDateBR(PERIODO_AUDITORIA_AJRI.de)}</strong> a{" "}
        <strong className="text-text">{formatDateBR(PERIODO_AUDITORIA_AJRI.ate)}</strong>,
        distribuídos em {formatNumberBR(INSTRUMENTO_AJRI_ORDEM.length)} instrumentos jurídicos e{" "}
        {formatNumberBR(TEMA_AJRI_ORDEM.length)} temas —{" "}
        <strong className="text-text">
          {formatNumberBR(COBERTURA_RESUMO_AJRI.total)} com resumo em linguagem comum
        </strong>
        .
      </p>

      {/* ═══ DECLARAÇÃO — as quatro coisas que esta página tem que dizer ═══
          Autoria alheia, finalidade não comercial, o que NÃO está aqui (o
          arquivo), e por onde pedir correção. As três primeiras vêm dos Termos
          de Uso do portal-fonte; a quarta é a regra da casa (`/termos`, §5). */}
      <section
        aria-labelledby="declaracao-auditoria"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-auditoria" className="font-display text-base font-semibold text-text">
          De quem é este material, e para que esta página existe
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <li>
            <strong className="text-text">A autoria é da {AUTOR_AUDITORIA_AJRI}</strong>, não do
            Controle Popular. Cada ficha traz o crédito e a descrição escrita pela própria auditora,
            transcrita sem edição. O portal não reclassifica e não recalcula nada daqui.
          </li>
          <li>
            <strong className="text-text">O resumo é obra deste portal, e a ficha separa as duas
            vozes.</strong>{" "}
            {formatNumberBR(COBERTURA_RESUMO_AJRI.total)} fichas trazem resumo em linguagem comum —
            paráfrase nova, escrita por este projeto a partir do documento, com a citação literal
            que sustenta cada veredito. Onde a AECOM não escreve veredito, o resumo diz{" "}
            <em className="text-text">não declarado</em>, e não inventa um. A palavra da auditora
            continua em toda ficha, transcrita sem edição.
          </li>
          <li>
            <strong className="text-text">Finalidade acadêmica e informativa, não comercial.</strong>{" "}
            Este é um projeto de controle social sem anúncio, sem paywall e sem uso em produto pago.
            O que se publica aqui é o catálogo — metadado e link —, não o conteúdo dos documentos.
          </li>
          <li>
            <strong className="text-text">O arquivo continua na fonte oficial.</strong> Nenhum PDF é
            baixado, copiado ou reservido: cada registro leva ao{" "}
            <a
              href={FONTE_AUDITORIA_AJRI.repositorio}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              repositório do portal da auditoria ↗
            </a>
            , que exige cadastro e gera o documento na hora. Vale ler também os{" "}
            <a
              href={FONTE_AUDITORIA_AJRI.termos}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              termos de uso da fonte ↗
            </a>{" "}
            e o{" "}
            <a
              href={FONTE_AUDITORIA_AJRI.acordo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              texto do Acordo ↗
            </a>
            .
          </li>
          <li>
            <strong className="text-text">Correção ou remoção:</strong> o caminho, as regras e o
            limite do que este portal pode tirar estão em{" "}
            <a href="/termos" className="text-primary underline underline-offset-2 hover:text-accent">
              /termos
            </a>{" "}
            (seções 5 e 6). Para pedido que envolva dado pessoal, o canal reservado é{" "}
            <a
              href="mailto:contato@controlepopular.com.br"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              contato@controlepopular.com.br
            </a>{" "}
            — e não o relato público do repositório, que serve para erro factual: abrir uma issue
            com o dado que se quer remover republica exatamente o que se pretende tirar.
          </li>
        </ul>
      </section>

      <AuditoriaClient />

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </main>
  );
}
