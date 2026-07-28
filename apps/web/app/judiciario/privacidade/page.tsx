import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";

export const metadata: Metadata = {
  title: "Privacidade · Controle Popular — Judiciário",
  description:
    "O que este app coleta, por quê, e com que base legal — dado público de agente em função pública e dado de conta de usuário, sem CPF, filiação ou endereço.",
};

export default function Privacidade() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Privacidade</h1>
        <p className="opacity-80">
          Resumo direto do que este app coleta, por quê, e com que base legal — sem juridiquês.
          A versão completa da Lei Geral de Proteção de Dados (Lei 13.709/2018) aplicada aqui
          é a que este documento descreve.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">1. Dado sobre magistrados (público)</h2>
        <p className="opacity-80">
          Nome, data de nascimento, data de posse, tribunal, cota de origem e histórico de
          nomeação de ministros e desembargadores. É <strong>dado de agente público no
          exercício de função pública</strong>, coletado de fontes oficiais (Senado Federal,
          tribunais). Base legal: <strong>interesse público e transparência</strong> (LGPD art.
          7º, VI e IX) — o mesmo fundamento que sustenta a publicidade dos atos de nomeação em
          si.
        </p>
        <p className="opacity-80">
          <strong>O que este app NUNCA coleta ou grava</strong> sobre magistrados: CPF, endereço,
          filiação partidária ou familiar, dados bancários. Data de nascimento é o único dado
          sensível-por-uso que gravamos, e só porque é o insumo da projeção de vacância — a
          razão de existir do produto (ver{" "}
          <Link href="/metodologia" className="underline">
            metodologia
          </Link>
          ).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">2. Dado da sua conta (se você se cadastra)</h2>
        <p className="opacity-80">
          Login é por <strong>link mágico</strong>: você digita seu e-mail, recebe um link,
          clica e entra — sem senha. Guardamos:
        </p>
        <ul className="list-disc space-y-1 pl-6 text-sm opacity-80">
          <li>Seu e-mail (autenticação via Supabase Auth — provedor terceiro, mesma base técnica dos apps irmãos do Controle Popular)</li>
          <li>Os monitoramentos que você cria (tribunais, cotas e horizonte de aviso escolhidos)</li>
          <li>Os alertas gerados para você e se já foram lidos</li>
          <li>Rascunhos de ofício/nota que você gerar, se optar por essa função</li>
        </ul>
        <p className="opacity-80">
          Base legal: <strong>execução do serviço solicitado</strong> (LGPD art. 7º, V) — você
          pede o monitoramento, guardamos o necessário pra ele funcionar. A sessão de login fica
          no <code>localStorage</code> do seu navegador, não em cookie de rastreamento.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">3. O que não fazemos</h2>
        <ul className="list-disc space-y-1 pl-6 text-sm opacity-80">
          <li>Não vendemos, alugamos ou compartilhamos e-mail ou dado de conta com terceiros</li>
          <li>Não usamos publicidade nem rastreamento entre sites</li>
          <li>Não enviamos e-mail de indicado a parlamentar/tribunal em massa sem confirmação explícita sua, por ofício</li>
          <li>Não usamos modelo de linguagem para decidir nenhum número (vacância, cota, poder de indicação) — só para redigir texto sobre fato já verificado, sempre revisável antes de sair</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">4. Seus direitos</h2>
        <p className="opacity-80">
          Acesso, correção e exclusão dos seus dados de conta (LGPD art. 18) — escreva para o
          contato abaixo pedindo a exclusão; apagamos a conta e os monitoramentos associados.
          Dado público de magistrado não é excluído a pedido (é registro histórico de fato
          público), mas correção de erro factual é sempre bem-vinda — use o botão de contestar
          quando disponível na tela, ou o mesmo contato.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">5. Infraestrutura</h2>
        <p className="opacity-80">
          Banco de dados hospedado no Supabase (Postgres gerenciado). Hospedagem do site no
          Vercel. Nenhum dado deste app é usado para treinar modelo de linguagem de terceiros.
        </p>
      </section>

      <p className="text-sm opacity-60">
        Dúvida ou pedido sobre seus dados: abra uma issue no{" "}
        <a
          href="https://github.com/FinweeJur/controle-popular-judiciario"
          className="underline"
          target="_blank"
          rel="noreferrer noopener"
        >
          repositório do projeto
        </a>
        .
      </p>
    </div>
  );
}
