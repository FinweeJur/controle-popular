import type { Metadata } from "next";
import { listarCidades } from "@/lib/db/queries/municipios";
import SeletorRedeGeral from "../components/SeletorRedeGeral";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/direitos-em-movimento/informacao` — porta "Como pedir informação", 3 de 4.
 *
 * A ÚNICA das quatro portas cujo "passo a passo" já existe como
 * COMPONENTE, não só como dado: `PedidoLAI.tsx`, dentro de cada cidade
 * (`/[municipio]/prefeitura/contratos`, `/camara/proposicoes` etc.), monta
 * o rascunho de pedido pronto pra copiar. Esta porta não reimplementa
 * aquilo — ela é o CATÁLOGO de canais (estadual, federal, e o municipal de
 * `cidade.fontes`), que faltava ter endereço próprio; o rascunho pronto
 * continua vivendo dentro de cada cidade, perto do contrato/proposição que
 * motivou o pedido.
 *
 * `necessidadeFixa="pedir_informacao"` pula a pergunta 1 do
 * `SeletorRedeGeral`: aqui a necessidade já é sabida pelo nome da porta.
 */
export const metadata: Metadata = metadataEditavel("/direitos-em-movimento/informacao", {
  title: "Como pedir informação — Direitos em Movimento | Controle Popular",
  description:
    "Lei de Acesso à Informação: os canais estaduais e federais, e o canal municipal de cada cidade cadastrada. Qualquer cidadão pode pedir, é gratuito.",
});

export default async function InformacaoPage() {
  const cidades = await listarCidades();

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <a href="/" className="hover:text-primary">
          Início
        </a>{" "}
        ·{" "}
        <a href="/direitos-em-movimento" className="hover:text-primary">
          Direitos em Movimento
        </a>{" "}
        · <span className="text-text">Como pedir informação</span>
      </nav>

      <header className="mt-4 space-y-3">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Como pedir informação</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Pela Lei de Acesso à Informação (Lei nº 12.527/2011), qualquer cidadão pode pedir
          detalhe por escrito a qualquer órgão público — é gratuito, e o órgão tem prazo legal
          para responder. Escolha sua cidade para ver também o canal da Prefeitura e da
          Câmara, quando cadastrado.
        </p>
        <p className="max-w-2xl rounded-lg border border-border bg-surface-2 p-4 text-[.9em] text-text-soft">
          Já tem um contrato ou proposição específicos em mente? Dentro da página da sua
          cidade, em Contratos, Licitações, Proposições e Votações, existe um botão que monta
          o rascunho do pedido pronto pra copiar — aqui é só o catálogo de canais.
        </p>
      </header>

      <section className="mt-8">
        <SeletorRedeGeral cidades={cidades} necessidadeFixa="pedir_informacao" />
      </section>
    </main>
  );
}
