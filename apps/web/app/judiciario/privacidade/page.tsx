import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/judiciario/privacidade", {
  title: "Privacidade · Controle Popular — Judiciário",
  description:
    "O que este app coleta, por quê, e com que base legal — dado público de agente em função pública, sem CPF, filiação ou endereço.",
});

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
        <h2 className="font-display text-xl font-semibold">2. O que não fazemos</h2>
        <ul className="list-disc space-y-1 pl-6 text-sm opacity-80">
          <li>Não pedimos login nem cadastro — não há conta de usuário neste app</li>
          <li>Não usamos publicidade nem rastreamento entre sites</li>
          <li>Não enviamos e-mail de indicado a parlamentar/tribunal em massa sem confirmação explícita sua, por ofício</li>
          <li>Não usamos modelo de linguagem para decidir nenhum número (vacância, cota, poder de indicação) — só para redigir texto sobre fato já verificado, sempre revisável antes de sair</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">3. Seus direitos</h2>
        <p className="opacity-80">
          Dado público de magistrado não é excluído a pedido (é registro histórico de fato
          público), mas correção de erro factual é sempre bem-vinda — use o botão de contestar
          quando disponível na tela, ou o contato abaixo.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">4. Infraestrutura</h2>
        <p className="opacity-80">
          Banco de dados hospedado na Neon (Postgres gerenciado). Site publicado em Cloudflare
          Workers. Nenhum dado deste app é usado para treinar modelo de linguagem de terceiros.
        </p>
      </section>

      <p className="text-sm opacity-60">
        Dúvida ou pedido sobre seus dados: abra uma issue no{" "}
        <a
          href="https://github.com/FinweeJur/controle-popular"
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
