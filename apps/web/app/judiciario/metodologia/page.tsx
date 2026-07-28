import {
  REGRAS,
  TRIBUNAIS,
  COMPULSORIA_ANOS,
  TETO_INDICACAO_ANOS,
} from "@/lib/judiciario/regras";
import { rotuloCota } from "@/lib/judiciario/rotulos";

export const metadata = {
  title: "Metodologia · Controle Popular — Judiciário",
  description:
    "Como cada número deste site é calculado: a regra da aposentadoria aos 75 anos, a origem de cada cadeira e o cálculo do poder de indicação — sem opinião escondida em número.",
};

export default function Metodologia() {
  const comp = REGRAS.idades.aposentadoria_compulsoria;
  const teto = REGRAS.idades.teto_indicacao;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Metodologia</h1>
        <p className="opacity-80">
          Nenhum número deste site sai de inteligência artificial ou de opinião. Toda data,
          toda categoria e toda estatística são o resultado de uma conta fixa, sempre a
          mesma, explicada abaixo — qualquer pessoa pode refazer a conta e chegar ao mesmo
          resultado.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Quando cada ministro se aposenta</h2>
        <p className="opacity-80">
          A lei obriga todo magistrado a se aposentar aos <strong>{COMPULSORIA_ANOS} anos</strong>
          , sem exceção ({comp.base_legal}). {comp.nota} Por isso a conta é simples:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-[var(--cp-border)] p-4 font-tabular text-sm">
          data de aposentadoria = data de nascimento + {COMPULSORIA_ANOS} anos
        </pre>
        <p className="text-sm opacity-70">
          É o <strong>prazo máximo</strong>, não uma previsão exata: a cadeira pode vagar
          antes disso, se o ministro decidir se aposentar por conta própria, morrer ou
          renunciar. Quando não sabemos a data de nascimento de alguém, o site mostra
          “data não localizada” em vez de arriscar um chute.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Quem pode ser indicado</h2>
        <p className="opacity-80">
          Só pode ser indicado a um tribunal superior quem tem entre 35 e{" "}
          <strong>{TETO_INDICACAO_ANOS} anos</strong> ({teto.base_legal}, que subiu esse
          limite de 65 para 70 anos).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Por que cada cadeira tem uma origem fixa</h2>
        <p className="opacity-80">
          Este site acompanha a <strong>cadeira</strong>, não só a pessoa que a ocupa hoje —
          porque a Constituição reserva cada cadeira a um tipo de carreira (juiz de
          carreira, advogado, membro do Ministério Público, militar, conforme o tribunal).
          Essa reserva está escrita no próprio texto que o Presidente envia ao Senado para
          pedir a aprovação do nome — o site lê esse texto oficial, não adivinha.
        </p>
        <div className="space-y-4">
          {Object.entries(TRIBUNAIS).map(([sigla, t]) => (
            <div key={sigla} className="rounded-lg border border-[var(--cp-border)] p-4">
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold">
                  <span className="uppercase">{sigla}</span> · {t.nome}
                </h3>
                <span className="font-tabular text-sm opacity-60">{t.cadeiras} cadeiras</span>
              </div>
              <p className="mt-1 text-sm opacity-60">{t.base_legal}</p>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {Object.entries(t.cotas).map(([cota, n]) => (
                  <li
                    key={cota}
                    className="rounded border border-[var(--cp-border)] px-2 py-0.5"
                  >
                    {rotuloCota(cota)}: <span className="font-tabular">{n}</span>
                  </li>
                ))}
              </ul>
              {t.nota && <p className="mt-2 text-sm opacity-70">{t.nota}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Quem indicou quantas cadeiras</h2>
        <p className="opacity-80">
          Para cada tribunal, o site conta quantas das cadeiras hoje ocupadas foram
          preenchidas por indicação de qual Presidente:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-[var(--cp-border)] p-4 font-tabular text-sm">
          poder de indicação ={"\n"}
          {"  "}cadeiras indicadas por essa pessoa ÷ total de cadeiras do tribunal
        </pre>
        <p className="text-sm opacity-70">
          O site sempre mostra os dois números da conta (quantas cadeiras e de quantas no
          total), não só a porcentagem — e avisa quando faltam dados suficientes para
          afirmar qualquer tendência. Nunca é uma média ou uma pontuação: é uma contagem
          simples, que qualquer pessoa pode conferir clicando.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Por que não usamos inteligência artificial nos números</h2>
        <p className="opacity-80">
          Data de aposentadoria, quem pode ser indicado, a origem de cada cadeira e quem
          indicou quantas — tudo isso é conta, não interpretação. Qualquer pessoa com os
          mesmos dados públicos chega ao mesmo resultado, inclusive conferindo à mão. A
          inteligência artificial só é usada, em partes do site, para escrever texto sobre
          um fato que já foi verificado dessa forma — nunca para decidir um número.
        </p>
      </section>
    </div>
  );
}
