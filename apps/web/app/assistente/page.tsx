import type { Metadata } from "next";
import AssistenteNavegacao from "./AssistenteNavegacao";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * A casa do assistente de navegação (N8, metade determinística).
 *
 * ═══ POR QUE NA RAIZ, E NÃO DENTRO DE UMA CIDADE ═══
 *
 * Já existe `/[municipio]/assistente` (`AssistenteChat.tsx`), e ele é outra
 * coisa: pergunta em linguagem livre sobre UMA cidade, respondida por
 * modelo via `app/[municipio]/api/chat/route.din.ts`. Este aqui atravessa o
 * portal inteiro — leva para Congresso, Judiciário, ambiental, terras,
 * Paraopeba e as 6 cidades — e é justamente por isso que não cabe embaixo
 * de um `[municipio]`: a rota de cidade obrigaria a escolher uma cidade
 * antes de perguntar, que é a informação que a pergunta ainda vai dar.
 *
 * Sem colisão com `/[municipio]`: segmento estático vence dinâmico no Next,
 * e `generateStaticParams` daquela rota só enumera slugs reais
 * (`CIDADES_DO_BUILD`), onde não existe cidade chamada "assistente".
 *
 * ═══ ESTA PÁGINA NÃO PASSA NENHUMA PROP, E ISSO É A DECISÃO ═══
 *
 * O catálogo de destinos é importado pelo componente de cliente, não
 * entregue por aqui. Prop viraria payload serializado duas vezes (HTML +
 * RSC flight), com o nome de todo campo repetido em cada linha — a inflação
 * de 7,5× medida em `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`, que gerou um
 * `.cache` de 35,5 MiB contra o teto de 25 MiB do Workers e travou o deploy
 * de 15/08. Ver o cabeçalho de `lib/assistente/catalogo.ts`.
 *
 * Consequência boa e deliberada: a página não consulta banco nenhum. Ela é
 * estática nos DOIS alvos de publicação (Workers e `output: 'export'`), e
 * roda com a Neon fora do ar — que é o estado de hoje (402).
 */

export const metadata: Metadata = metadataEditavel("/assistente", {
  title: "Assistente de navegação — Controle Popular",
  description:
    "Diga para onde quer ir e o assistente leva você à página certa do portal: cidades, Congresso, Judiciário, ambiental, terras e Paraopeba. Funciona sem rede e sem modelo de linguagem.",
});

export default function AssistentePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Para onde você quer ir?
      </h1>
      <p className="mt-2 mb-6 max-w-2xl text-[1.02em] text-[var(--cp-text-soft)]">
        Escreva o assunto e, se quiser, a cidade — &quot;saúde em BH&quot;,
        &quot;contratos de Betim&quot;. O assistente devolve as páginas que
        casam com o pedido, para você escolher. Ele não responde com números:
        quem responde é a página.
      </p>
      <AssistenteNavegacao />
    </div>
  );
}
