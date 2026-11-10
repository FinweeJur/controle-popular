import Link from "next/link";

/**
 * Tema 1.280/STJ — a decisão que equipara atingido a consumidor.
 *
 * POR QUE EXISTE
 *
 * O resumo da jurisprudência fala em "prazo prescricional" e "CDC", mas o
 * leitor precisa poder conferir a fonte primária. Este bloco traz a tese,
 * o que ela resolve e o PDF do acórdão numa sanfona — sem sair da página.
 *
 * O PDF é o documento oficial (REsp 2124701/MG), copiado para
 * `public/docs/jurisprudencia/`; o iframe só o exibe. O link de download
 * fica visível para quem abre no celular, onde o visualizador embutido
 * nem sempre funciona.
 */

export function TeseTema1280() {
  return (
    <section
      aria-labelledby="tema-1280"
      className="rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-5 sm:p-7"
    >
      <p className="text-[.7rem] font-semibold uppercase tracking-[.18em] text-primary">
        Tese nova · Tema 1.280/STJ
      </p>
      <h2
        id="tema-1280"
        className="mt-2 font-display text-[clamp(1.25rem,2.8vw,1.55rem)] font-bold leading-tight tracking-tight"
      >
        Desastre ambiental é acidente de consumo — e o prazo é de 5 anos
      </h2>
      <p className="mt-2 text-xs text-text-soft">
        2ª Seção do STJ · REsp 2124701/MG · rel. Min. Moura Ribeiro · julgado
        em 15/10/2026, por unanimidade · publicado em 22/10/2026
      </p>

      <blockquote className="mt-5 border-l-4 border-[var(--cp-primary)] pl-4 font-display text-[1.08rem] font-medium leading-relaxed text-text sm:text-[1.18rem]">
        “Em danos individuais oriundos de desastre ambiental vinculado a
        atividade empresarial potencialmente poluidora, configura-se acidente
        de consumo, com equiparação das vítimas a consumidores (art. 17 do
        CDC). O prazo prescricional é o quinquenal do art. 27 do CDC,
        afastando-se a regra do art. 206, § 3º, V, do CC.”
      </blockquote>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="font-tabular text-2xl font-bold text-[var(--cp-primary)]">5 anos</p>
          <p className="mt-1 text-xs leading-snug text-text-soft">
            prazo do CDC (art. 27), não os 3 anos do Código Civil
          </p>
        </div>
        <div>
          <p className="font-tabular text-2xl font-bold text-[var(--cp-primary)]">Art. 17</p>
          <p className="mt-1 text-xs leading-snug text-text-soft">
            vítima do desastre equiparada a consumidor
          </p>
        </div>
        <div>
          <p className="font-tabular text-2xl font-bold text-[var(--cp-primary)]">Tema 1.280</p>
          <p className="mt-1 text-xs leading-snug text-text-soft">
            julgamento repetitivo: vale para os casos semelhantes
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2 text-sm leading-relaxed text-text-soft">
        <p>
          <strong className="text-text">O que resolve:</strong> a dúvida sobre
          qual prazo corre para quem pede indenização individual por dano de
          desastre ambiental. O STJ afirmou o prazo de cinco anos do CDC e
          rejeitou o prazo de três anos do Código Civil.
        </p>
        <p>
          <strong className="text-text">O que não resolve:</strong> a decisão
          trata do prazo, não do mérito. Continuar no prazo não garante
          indenização; ainda é preciso provar o dano e o nexo causal no caso
          concreto.
        </p>
      </div>

      <details className="mt-6 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-4">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Abrir PDF do acórdão
        </summary>
        <div className="mt-4">
          <iframe
            src="/docs/jurisprudencia/stj-resp-2124701.pdf"
            title="Acórdão do STJ no REsp 2124701/MG"
            loading="lazy"
            className="h-[70vh] w-full rounded-lg border border-[var(--cp-border)]"
          />
          <p className="mt-3 text-xs text-text-soft">
            Se o visualizador não abrir no celular,{" "}
            <a
              href="/docs/jurisprudencia/stj-resp-2124701.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-2"
            >
              baixe o PDF
            </a>
            . Também há um{" "}
            <Link
              href="/noticias/stj-tema-1280-desastre-ambiental-acidente-de-consumo"
              className="font-semibold text-primary underline underline-offset-2"
            >
              post no blog
            </Link>{" "}
            explicando a decisão.
          </p>
        </div>
      </details>
    </section>
  );
}
