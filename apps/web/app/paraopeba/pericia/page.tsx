import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { lerAcervoPericia, lerResultadosPericia, lerResumoDoAcervo } from "@/lib/paraopeba/acervos-dados";
import {
  SECAO_PERICIA_LABEL,
} from "@/lib/paraopeba/pericia-ufmg";

/** Sinônimos — o dado agora vive no loader server-only (acervos-dados). */
const ACERVO_PERICIA = lerAcervoPericia();
const RESULTADOS_PERICIA = lerResultadosPericia();
const RESUMO_DO_ACERVO = lerResumoDoAcervo();
import { TEMA_AJRI_LABEL } from "@/lib/paraopeba/auditoria-ajri";
import { SINTESE_PERICIA } from "@/lib/paraopeba/sintese-pericia";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import AcervoPericia from "./AcervoPericia";

/**
 * `/paraopeba/pericia` — o que a perícia judicial da UFMG produziu sobre o
 * rompimento da Barragem I (Brumadinho, 25/01/2019).
 *
 * ═══ É O QUARTO ACERVO DA FRENTE, E CONFUNDIR OS QUATRO APAGA QUEM FALA ═══
 *
 * · `/paraopeba/documentos` — os AUTOS: petição, laudo, decisão, do índice
 *   público da *Plataforma* Brumadinho UFMG.
 * · `/paraopeba/biblioteca` — o que as ASSESSORIAS TÉCNICAS produziram para
 *   as pessoas atingidas: cartilha, boletim, jornal.
 * · `/paraopeba/auditoria` — o que a AUDITORA INDEPENDENTE (AECOM) escreveu
 *   fiscalizando a execução do Acordo.
 * · esta — o que os PESQUISADORES da UFMG mediram, sob encomenda do juízo.
 *
 * A confusão mais fácil é entre esta página e `/paraopeba/documentos`: as
 * duas dizem "UFMG". Mas uma traz peça de processo e a outra traz resultado
 * técnico, e são sites diferentes (`plataforma.` contra o site do projeto).
 *
 * ═══ POR QUE A PÁGINA DIZ "445 ARQUIVOS, 7 DE RESULTADO" LOGO NO TOPO ═══
 *
 * O acervo público tem 445 arquivos, e anunciar isso sem qualificar seria
 * mentir por omissão: 101 são editais de chamada, 262 são papelada por
 * chamada, ~34 são listas de equipe e 8 são perfis de divulgação. O que traz
 * RESULTADO são os 7 documentos publicados em nov/2025. Quem chega procurando
 * o laudo precisa saber disso na primeira tela, não depois de abrir trinta
 * PDFs de edital.
 */

export const metadata: Metadata = metadataEditavel("/paraopeba/pericia", {
  title: "Perícia judicial da UFMG — Brumadinho | Controle Popular",
  description:
    "O que a perícia da UFMG mediu sobre o rompimento da Barragem I: os 7 documentos de resultado, o acervo completo de 445 arquivos e a ligação com a auditoria independente do Acordo.",
});

export default function PericiaPage() {
  const porSecao = RESUMO_DO_ACERVO.porSecao;
  const administrativos =
    (porSecao.chamada ?? 0) + (porSecao.processo ?? 0) + (porSecao.subprojeto ?? 0);

  // `id`/`tabIndex` que faltavam aqui — achado ao verificar o cabeçalho novo
  // da zona (22/08): as outras 10 rotas de /paraopeba já tinham os dois
  // desde a revisão de 13/08 (skip-link "Pular para o conteúdo" e "Ouvir
  // esta página" apontam para #conteudo-principal, definido em
  // app/layout.tsx) — só esta página tinha ficado de fora.
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Perícia judicial da UFMG</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        A perícia da UFMG: o que foi medido, e o que o acervo não é
      </h1>

      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Por determinação judicial, a{" "}
        <strong className="text-text">Universidade Federal de Minas Gerais</strong> conduziu a
        perícia técnica sobre os efeitos do rompimento da Barragem I da Mina Córrego do Feijão. O
        site público do projeto reúne{" "}
        <strong className="text-text">{formatNumberBR(RESUMO_DO_ACERVO.total)} arquivos</strong> —
        mas <strong className="text-text">{RESUMO_DO_ACERVO.resultados} deles</strong> são os que
        apresentam <strong className="text-text">resultado</strong>. Os outros{" "}
        {formatNumberBR(administrativos)} são editais de chamada, papelada de contratação e listas
        de equipe.
      </p>

      {/* ═══ A DECLARAÇÃO FICA NO TOPO PORQUE É ELA QUE EVITA O ENGANO ═══
          Um acervo de 445 itens insinua 445 laudos. Dizer o contrário depois
          da lista seria tarde: a pessoa já teria tirado a conclusão errada. */}
      <section
        aria-labelledby="declaracao-pericia"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-pericia" className="font-display text-base font-semibold text-text">
          De quem é este material, e o que ele é
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] text-text-soft">
          <li>
            <strong className="text-text">A autoria é dos pesquisadores da UFMG</strong>, não do
            Controle Popular. Este portal cataloga e liga; não reescreve laudo e não recalcula
            medição.
          </li>
          <li>
            <strong className="text-text">Perícia não é peça de processo.</strong> Os autos —
            petição, decisão, laudo juntado — estão em{" "}
            <a href="/paraopeba/documentos" className="text-primary hover:underline">
              Documentos do processo
            </a>
            , que vem de outra fonte da própria UFMG. Aqui está o que os pesquisadores mediram.
          </li>
          <li>
            <strong className="text-text">
              {formatNumberBR(RESUMO_DO_ACERVO.total)} arquivos, {RESUMO_DO_ACERVO.resultados} de
              resultado.
            </strong>{" "}
            A varredura do site foi completa — {formatNumberBR(RESUMO_DO_ACERVO.total)} arquivos em{" "}
            {formatNumberBR(555)} páginas, sem fila pendente —, e é justamente por ser completa que
            dá para dizer a proporção com segurança.
          </li>
          <li>
            <strong className="text-text">Perícia não decide nada.</strong> Ela mede e informa o
            juízo. O que vale como decisão está no processo, não aqui.
          </li>
          <li>
            Coleta de <strong className="text-text">{formatDateBR(RESUMO_DO_ACERVO.coletadoEm.slice(0, 10))}</strong>{" "}
            em{" "}
            <a
              href={RESUMO_DO_ACERVO.fonte}
              className="text-primary hover:underline"
              rel="noreferrer noopener"
              target="_blank"
            >
              projetobrumadinho.ufmg.br
            </a>
            . Achou erro?{" "}
            <a href="/termos" className="text-primary hover:underline">
              Como pedir correção
            </a>
            .
          </li>
        </ul>
      </section>

      {/* ═══ A SÍNTESE — o que a perícia apurou, cruzado com a auditoria ═══
          Gerada a partir dos 7 resumos já auditados (Haiku resume, Sonnet
          audita até 2 rodadas, Opus sintetiza) e checada de novo contra o
          material de origem antes de publicar — mesmo padrão do resto do
          acervo: número sem lastro não entra, e o que ficou com ressalva
          carrega o aviso junto, não escondido em rodapé. */}
      <section aria-labelledby="sintese" className="mt-10">
        <h2 id="sintese" className="font-display text-xl font-semibold text-text">
          {SINTESE_PERICIA.titulo}
        </h2>
        <div className="mt-3 space-y-3 text-[.95em] leading-relaxed text-text-soft">
          {SINTESE_PERICIA.concluiu.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <details className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
          <summary className="cursor-pointer font-medium text-text">
            Onde a perícia e a auditoria dizem a mesma coisa ({SINTESE_PERICIA.mesmaCoisa.length})
          </summary>
          <ul className="mt-3 space-y-3 text-[.9em] text-text-soft">
            {SINTESE_PERICIA.mesmaCoisa.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </details>

        <details className="mt-3 rounded-xl border border-border bg-surface-2 p-4">
          <summary className="cursor-pointer font-medium text-text">Onde divergem</summary>
          <div className="mt-3 space-y-3 text-[.9em] text-text-soft">
            {SINTESE_PERICIA.divergem.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>

        <details className="mt-3 rounded-xl border border-border bg-surface-2 p-4">
          <summary className="cursor-pointer font-medium text-text">
            O que nenhuma das duas responde ({SINTESE_PERICIA.naoRespondem.length})
          </summary>
          <ul className="mt-3 space-y-3 text-[.9em] text-text-soft">
            {SINTESE_PERICIA.naoRespondem.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </details>

        <p className="mt-4 text-[.82em] text-text-soft italic">{SINTESE_PERICIA.observacaoDeMetodo}</p>
      </section>

      {/* ═══ OS 7 QUE IMPORTAM ═══ */}
      <section aria-labelledby="resultados" className="mt-10">
        <h2 id="resultados" className="font-display text-xl font-semibold text-text">
          Os {RESULTADOS_PERICIA.length} documentos de resultado
        </h2>
        <p className="mt-1 text-[.92em] text-text-soft">
          Publicados em novembro de 2025, é a apresentação dos achados por eixo. São o núcleo do
          acervo.
        </p>
        <ul className="mt-4 space-y-3">
          {RESULTADOS_PERICIA.map((doc) => (
            <li
              key={doc.url}
              className="rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40"
            >
              <a
                href={doc.url}
                className="font-medium text-text hover:text-primary"
                rel="noreferrer noopener"
                target="_blank"
              >
                {decodeURIComponent(doc.nomeArquivo).replace(/\.pdf$/i, "").replace(/_/g, " ")}
              </a>
              {doc.temas.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {doc.temas.map((tema) => (
                    <a
                      key={tema}
                      href={`/paraopeba/auditoria?tema=${tema}`}
                      className="rounded-full border border-border px-2 py-0.5 text-[.78em] text-text-soft hover:border-primary hover:text-primary"
                      title="Ver o que a auditoria independente acompanhou neste eixo"
                    >
                      {TEMA_AJRI_LABEL[tema]}
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* ═══ A PONTE PARA A AUDITORIA — o outro sentido está na página de lá ═══ */}
      <section className="mt-8 rounded-2xl border border-border bg-surface-2 p-5">
        <h2 className="font-display text-base font-semibold text-text">
          A mesma reparação, vista por quem fiscaliza
        </h2>
        <p className="mt-2 text-[.92em] text-text-soft">
          A perícia mede; a auditoria independente acompanha a execução do Acordo. São olhares
          distintos sobre os mesmos eixos — água, solo, saúde, fauna, compensação. Cada eixo acima
          leva ao que a auditoria publicou sobre ele.
        </p>
        <a
          href="/paraopeba/auditoria"
          className="mt-3 inline-block rounded-lg border border-primary px-4 py-2 text-[.9em] font-medium text-primary transition hover:bg-primary hover:text-white"
        >
          Ver a auditoria socioambiental →
        </a>
      </section>

      {/* ═══ O ACERVO INTEIRO, COM O QUE ELE É DITO NO RÓTULO ═══ */}
      <section aria-labelledby="acervo" className="mt-10">
        <h2 id="acervo" className="font-display text-xl font-semibold text-text">
          O acervo completo
        </h2>
        <p className="mt-1 text-[.92em] text-text-soft">
          Tudo o que o site do projeto publica, por seção. O rótulo diz o que cada grupo é — para
          ninguém confundir edital de bolsa com laudo.
        </p>
        <AcervoPericia documentos={ACERVO_PERICIA} rotulos={SECAO_PERICIA_LABEL} />
      </section>

      <FooterGlobal />
    </main>
  );
}
