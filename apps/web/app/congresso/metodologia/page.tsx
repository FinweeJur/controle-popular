import type { Metadata } from "next";
import { RUBRICA, VERSAO_RUBRICA } from "@/lib/congresso/rubrica";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/metodologia", {
  title: "Metodologia — Controle Popular · Congresso",
  description:
    "Como classificamos um projeto de lei como garantista ou reducionista: taxonomia de direitos, mecanismos, pesos e o cálculo do score. Régua declarada e auditável.",
});

/**
 * Esta página é renderizada A PARTIR de `rubrica/rubrica.json` — a mesma
 * fonte que alimenta o prompt do modelo e o cálculo do score. Não há texto
 * descritivo escrito à mão sobre a taxonomia: se a rubrica mudar e esta
 * página não acompanhar, o portal estaria publicando uma metodologia que
 * não é a que ele aplica. Num produto cujo argumento inteiro é "a régua é
 * transparente", essa divergência seria o pior defeito possível.
 */
export default function Metodologia() {
  const direitos = Object.entries(RUBRICA.direitos);
  const mecanismos = Object.entries(RUBRICA.mecanismos);
  const ampliativos = mecanismos.filter(([, m]) => m.direcao === "amplia");
  const restritivos = mecanismos.filter(([, m]) => m.direcao === "restringe");

  // As faixas guardam só o piso de cada rótulo (é o que o cálculo precisa),
  // mas ler "Fortemente reducionista: a partir de -999999" é inútil. O teto
  // de cada faixa é o piso da faixa anterior — derivamos o intervalo aqui em
  // vez de escrever os números à mão, para que mudar a rubrica atualize esta
  // página sozinha. As faixas extremas viram "acima de" / "abaixo de", porque
  // seus limites são sentinelas, não valores com significado.
  const faixasComIntervalo = RUBRICA.faixas.map((f, i, todas) => {
    const anterior = todas[i - 1];
    const intervalo =
      i === 0
        ? `score ${f.min} ou mais`
        : i === todas.length - 1
          ? `score abaixo de ${anterior.min}`
          : // "a menos de" e não "a": o teto pertence à faixa de cima. Num
            // portal cujo argumento é a auditabilidade, um intervalo ambíguo
            // na própria página de metodologia seria um mau começo.
            `score de ${f.min} a menos de ${anterior.min}`;
    return { ...f, intervalo };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Metodologia</h1>
        <p className="opacity-80">
          Versão da rubrica <strong>{VERSAO_RUBRICA}</strong>. Toda análise publicada
          registra a versão que a gerou, então é sempre possível saber sob qual régua um
          rótulo foi atribuído.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">A régua é declarada</h2>
        <p className="opacity-80">
          Este portal não finge neutralidade. Ele adota uma régua pró-direitos: uma
          proposição é <strong>garantista</strong> quando amplia direitos fundamentais e{" "}
          <strong>reducionista</strong> quando os restringe. Essa é uma escolha de valor,
          e está declarada aqui em vez de escondida atrás de uma aparência de
          imparcialidade.
        </p>
        <p className="opacity-80">
          O que impede isso de virar palpite é a separação entre fato e juízo. A{" "}
          <strong>ficha técnica</strong> descreve o que a proposição muda na letra da lei.
          O <strong>parecer crítico</strong> aplica a régua e vem rotulado como opinião. E
          o rótulo em si não é escrito por ninguém: é calculado.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">
          A inteligência artificial não decide o rótulo
        </h2>
        <p className="opacity-80">
          Este é o ponto central. O modelo de linguagem não recebe a pergunta &ldquo;este
          projeto é garantista ou reducionista?&rdquo;. Ele recebe uma tarefa de extração:
          apontar quais direitos a proposição afeta, em que direção, por qual mecanismo,
          em que grau — e, obrigatoriamente, <strong>citar o dispositivo legal</strong>{" "}
          que fundamenta cada apontamento, junto com o trecho literal do projeto que o
          embasa.
        </p>
        <p className="opacity-80">
          Item que não cita dispositivo válido é <strong>descartado antes de contar</strong>.
          O score sai de uma fórmula fixa sobre os itens que sobraram. Por isso a mesma
          proposição, com a mesma rubrica, produz sempre o mesmo resultado — e por isso
          você pode clicar no score e chegar até a frase do projeto que o gerou.
        </p>
        {/* A separação acima (o modelo extrai, o programa calcula) é real e
            é o que torna o rótulo auditável — mas não é imunidade a erro.
            Sem este parágrafo a página lia como blindagem: "a IA não decide
            o rótulo" sugeria que a IA não influi no resultado. Ela influi:
            é a origem dos itens que a fórmula soma. Mesma correção feita em
            `/sobre` em 13/08 (achado da auditoria de discurso do mesmo dia)
            — aqui era a página que mais precisava dela, por ser o destino
            de "ver a metodologia" em toda tela do Congresso e das cidades. */}
        <p className="opacity-80">
          Essa separação não torna a IA inofensiva. <strong>Se a extração erra — se o
          modelo aponta um direito que o texto não afeta, ou cita um dispositivo que não
          sustenta o item —, o rótulo calculado a partir dela também erra</strong>, porque
          a fórmula confia no que o formulário diz. É por isso que confiança baixa marca a
          análise inteira como &ldquo;requer revisão&rdquo; e a tira dos rankings, mesmo
          continuando publicada ao lado do rótulo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Como o score é calculado</h2>
        <div className="rounded-lg border border-[var(--cp-border)] p-5">
          <p className="font-tabular">
            peso do item = grau × direção × confiança
          </p>
          <p className="mt-3 text-sm opacity-80">
            grau:{" "}
            {Object.entries(RUBRICA.pesos.grau)
              .map(([k, v]) => `${k} = ${v}`)
              .join(" · ")}
          </p>
          <p className="text-sm opacity-80">
            direção: amplia = +1 · restringe = −1 · neutro = 0
          </p>
          <p className="mt-3">score = soma dos pesos de todos os itens válidos</p>
        </div>
        <ul className="list-disc space-y-1 pl-5 opacity-80">
          {faixasComIntervalo.map((f) => (
            <li key={f.rotulo}>
              <strong>{f.label}</strong>: {f.intervalo}
            </li>
          ))}
          <li>
            <strong>Misto</strong>: quando a proposição amplia um direito e restringe
            outro com peso relevante. Não somamos os dois num número só — a soma daria
            perto de zero e apareceria como &ldquo;neutro&rdquo;, que é a leitura errada:
            a proposta é controversa, não inócua. Nesse caso mostramos os dois lados.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">
          Constitucionalidade não entra no score
        </h2>
        <p className="opacity-80">
          Dois selos são sinalizados à parte: <strong>cláusula pétrea</strong> (art. 60,
          §4º da Constituição) e <strong>vedação do retrocesso</strong> (redução de um
          patamar de direito social já conquistado). Eles não somam nem subtraem pontos
          porque são questão de constitucionalidade, não de grau — misturá-los ao score
          produziria um número sem significado.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">
          Direitos e suas âncoras legais
        </h2>
        <p className="opacity-80">
          A lista é fechada. Cada direito tem âncoras — os dispositivos que o
          fundamentam no ordenamento brasileiro. Quando a proposição não indica um artigo
          específico, a citação recai sobre uma dessas âncoras.
        </p>
        <div className="space-y-3">
          {direitos.map(([slug, d]) => (
            <div key={slug} className="rounded-lg border border-[var(--cp-border)] p-4">
              <p className="font-semibold">{d.rotulo}</p>
              <p className="mt-1 text-sm opacity-70">{d.ancoras.join(" · ")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Mecanismos</h2>
        <p className="opacity-80">
          O <em>como</em> — é isto que separa análise de opinião. Não basta dizer que uma
          proposta &ldquo;prejudica trabalhadores&rdquo;; é preciso dizer por qual
          mecanismo.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold">Ampliam direitos</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-80">
              {ampliativos.map(([slug, m]) => (
                <li key={slug}>{m.rotulo}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Restringem direitos</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm opacity-80">
              {restritivos.map(([slug, m]) => (
                <li key={slug}>{m.rotulo}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-lg border border-[var(--cp-border)] p-5">
          <h3 className="font-semibold">Sobre pena e criminalização</h3>
          <p className="mt-2 text-sm opacity-80">{RUBRICA._nota_mecanismos}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Limites que assumimos</h2>
        <ul className="list-disc space-y-2 pl-5 opacity-80">
          <li>
            A análise parte da ementa e do texto do projeto — não do debate político em
            torno dele, nem de emendas apresentadas depois.
          </li>
          <li>
            Um projeto pode mudar bastante durante a tramitação. A análise reflete a
            versão que consta na fonte oficial na data indicada.
          </li>
          <li>
            Classificações com baixa confiança do extrator ficam marcadas como{" "}
            <strong>requer revisão</strong> em vez de receber rótulo. Preferimos não
            classificar a classificar mal.
          </li>
          <li>
            Toda análise tem um botão para você registrar discordância. Contestação
            recorrente sobre o mesmo tipo de caso é o que faz a rubrica evoluir.
          </li>
        </ul>
      </section>
    </div>
  );
}
