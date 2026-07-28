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
          dispositivo constitucional citado na Mensagem de indicação, e monta o grafo de{" "}
          <strong>poder de indicação</strong>: que fração de cada tribunal foi nomeada por qual
          autoridade.
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
          com partido político. Todo dado vem de fonte oficial pública, com link para a fonte
          em cada página. As fórmulas — nunca opiniões escondidas em número — estão publicadas
          por inteiro em{" "}
          <Link href="/metodologia" className="underline">
            Metodologia
          </Link>
          .
        </p>
        <p className="opacity-80">
          Código aberto:{" "}
          <a
            href="https://github.com/FinweeJur/controle-popular-judiciario"
            className="underline"
            target="_blank"
            rel="noreferrer noopener"
          >
            github.com/FinweeJur/controle-popular-judiciario
          </a>
          . Dados de contas de usuário tratados conforme a{" "}
          <Link href="/privacidade" className="underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
