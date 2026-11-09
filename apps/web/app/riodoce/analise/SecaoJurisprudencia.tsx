import { MarkdownResumo } from "@/app/components/ResumoRealidade";
import { formatNumberBR } from "@/lib/betim/format";
import {
  JURIS,
  METODO_JURIS,
  TESES_COMPARADAS,
  TESES_SENTIDO,
} from "./dados";
import { Botao, CabecalhoSecao, Marca } from "./Componentes";

/**
 * "Jurisprudência": o que os acórdãos dizem, comparando Brumadinho e Rio
 * Doce com a mesma rubrica. As tabelas vêm do markdown da análise; o
 * buscador geral é a porta para o acervo processo a processo.
 */
export function SecaoJurisprudencia() {
  return (
    <section
      id="jurisprudencia"
      aria-labelledby="titulo-jurisprudencia"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <CabecalhoSecao
        id="titulo-jurisprudencia"
        numero="06"
        titulo="O que a jurisprudência diz"
        descricao="Duas leituras: a comparação entre Brumadinho e Rio Doce, com a mesma rubrica de temas e teses, e a distribuição dos achados do Rio Doce entre o que favorece a empresa, o que favorece o atingido e o neutro."
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-soft">
            Acervo do buscador · TJES
          </p>
          <p className="mt-1 font-tabular text-2xl font-bold">
            {formatNumberBR(JURIS.tjes)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-soft">
            Decisões do Espírito Santo no acervo de 2008–2026, que cobre os
            dois desastres. Não é o recorte só do Rio Doce.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs uppercase tracking-wide text-text-soft">
            Acervo do buscador · TJMG
          </p>
          <p className="mt-1 font-tabular text-2xl font-bold">
            {formatNumberBR(JURIS.tjmg)}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-soft">
            Decisões de Minas no mesmo acervo. A tabela abaixo usa só a
            rubrica medida do TJMG sobre o Rio Doce e Brumadinho.
          </p>
        </div>
      </div>

      <details className="mt-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <summary className="cursor-pointer text-sm font-semibold text-primary">
          Como as tabelas de jurisprudência são medidas
        </summary>
        <div className="mt-2 text-text-soft">
          <MarkdownResumo markdown={METODO_JURIS} />
        </div>
      </details>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <MarkdownResumo markdown={TESES_COMPARADAS} />
      </div>

      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-soft">
        A unidade da tabela é o <strong>achado</strong> — um trecho de ementa
        classificado com um tema e uma tese —, não o processo. Um mesmo
        processo pode aparecer em mais de um tema.{" "}
        <Marca tipo="medido" />
      </p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <MarkdownResumo markdown={TESES_SENTIDO} />
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Botao href="/jurisprudencia?tribunal=TJES&estado=ES#lista">
          Acórdãos do TJES sobre o Fundão
        </Botao>
        <Botao
          href="/jurisprudencia?frente=riodoce&tribunal=TJMG#lista"
          variante="contorno"
        >
          Acórdãos do TJMG sobre o Rio Doce
        </Botao>
      </div>
    </section>
  );
}
