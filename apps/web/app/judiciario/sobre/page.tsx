import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";

export const metadata: Metadata = {
  title: "Sobre · Controle Popular — Judiciário",
  description:
    "Por que este app existe: mapear quem ocupa, quem indicou e quando vaga cada cadeira do Judiciário — o único Poder cujos membros ninguém elege.",
};

export default function Sobre() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Sobre</h1>
      </header>

      <section className="space-y-3">
        <p className="opacity-80">
          O Judiciário é o único Poder da República cujos membros não passam por eleição
          popular em nenhum grau. As vagas se abrem, se preenchem e mudam a composição dos
          tribunais por um processo — indicação, sabatina, lista — que é público, mas
          inacessível na prática: para saber quantas cadeiras do STJ o próximo Presidente vai
          preencher, seria preciso abrir dezenas de páginas biográficas, somar 75 anos à data
          de nascimento de cada ministro, e cruzar isso com a cota de origem de cada vaga.
        </p>
        <p className="opacity-80">
          Este app faz essa conta — de forma <strong>determinística e auditável</strong>, nunca
          com modelo de linguagem decidindo um número. Projeta vacância pela aposentadoria
          compulsória aos 75 anos, extrai a cota de origem de cada cadeira do próprio
          dispositivo constitucional citado na Mensagem de indicação, e conta o{" "}
          <strong>poder de indicação</strong>: quantas cadeiras de cada tribunal foram
          nomeadas por qual autoridade.
        </p>
        <p className="opacity-80">
          Esse poder de indicação aparece como uma <strong>lista</strong>, na página de cada
          tribunal, ordenada por número de cadeiras e sempre com os dois números da conta
          (quantas cadeiras e de quantas no total), além da cobertura — quantas cadeiras têm
          nomeante conhecido. Não há visualização de rede, e o app não desenha ligação entre
          autoridade e magistrado que a fonte não registre: cadeira sem nomeante identificado
          rebaixa a cobertura em vez de ser preenchida por dedução.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">O eixo</h2>
        <p className="opacity-80">
          É o terceiro eixo da marca <strong>Controle Popular</strong>: o executivo municipal
          (transparência de contratos e orçamento) e o legislativo federal (monitoramento de
          projetos de lei) já existiam — este é o judiciário, o Poder que faltava.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Independência e método</h2>
        <p className="opacity-80">
          Portal independente, sem vínculo com qualquer tribunal, com o CNJ, com o Senado ou
          com partido político. Todo dado vem de fonte oficial pública — os processos de
          indicação do Senado Federal, as páginas de composição dos próprios tribunais, e a
          Constituição e as leis de organização para a régua de cadeiras e cotas —, e cada
          página que exibe dado credita no rodapé as fontes de que se serve. O{" "}
          <strong>documento</strong> de
          origem aparece na linha de cada indicação quando o Senado o publica; quando não
          publica, fica a identificação oficial do processo, e a página de Indicações declara
          em quantas o documento existe. As fórmulas — nunca opiniões escondidas em número —
          estão publicadas por inteiro em{" "}
          <Link href="/metodologia" className="underline">
            Metodologia
          </Link>
          .
        </p>
        {/* Correção pública e datada, no mesmo padrão do erro de procedência
            de `/ambiental/legislacao` (registrado em `docs/DIARIO-2026-08-13.md`
            §2 e admitido no `/sobre` geral): a correção fica na página, não só
            no histórico do git. */}
        <p className="rounded-lg border border-[var(--cp-border)] p-4 text-sm opacity-80">
          {/* `{" "}` explícito depois de cada tag inline: o espaço solto no
              início de um nó de texto que continua na linha seguinte é comido
              na compilação, e sai "2026.Até" / "grafode" na tela. Medido no
              DOM, não suposto. */}
          <strong>Correção de 15/08/2026.</strong>{" "}
          Até esta data, esta página dizia que o app &ldquo;monta o <em>grafo</em>{" "}
          de poder de indicação&rdquo; e que todo dado vinha de
          fonte oficial &ldquo;com link para a fonte em cada página&rdquo;. Nenhuma das duas
          era verdade. O poder de indicação sempre foi uma contagem exibida como lista, nunca
          um grafo — não existia, e continua não existindo, nenhuma visualização de rede neste
          eixo. E o único componente capaz de exibir link de fonte nunca chegou a ser usado em
          tela nenhuma: a promessa estava no texto e não no produto. As duas frases foram
          reescritas para o que existe, e o link de fonte passou a ser exibido de fato — no
          rodapé de cada página e na linha de cada indicação cujo documento o Senado publica.
          Quem cobra procedência dos outros deve o mesmo padrão sobre si, e isso inclui dizer
          em público que errou.
        </p>
        <p className="opacity-80">
          Código aberto:{" "}
          <a
            href="https://github.com/FinweeJur/controle-popular"
            className="underline"
            target="_blank"
            rel="noreferrer noopener"
          >
            github.com/FinweeJur/controle-popular
          </a>
          . Como tratamos dado está na{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
