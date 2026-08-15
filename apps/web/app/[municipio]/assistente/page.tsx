import { paramsDasCidades } from "@/lib/betim/staticParams";
import AssistenteChat from "@/app/[municipio]/assistente/AssistenteChat";
import AvisoSemAssistente from "@/app/[municipio]/assistente/AvisoSemAssistente";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { exportandoEstatico } from "@/lib/alvo-de-build";

/**
 * ═══ ESTA PÁGINA NÃO EXISTE INTEIRA NOS DOIS ALVOS ═══
 *
 * O chat depende de `api/chat/route.din.ts`, e `*.din.ts` só entra em
 * `pageExtensions` no alvo Cloudflare (ver `next.config.ts`). No alvo
 * `output: 'export'` a rota não é gerada, e a pergunta não tem para onde ir.
 *
 * Aqui a decisão é ANTES da tela: com `exportandoEstatico`, a página nem
 * monta o chat — mostra o aviso e os dois caminhos que funcionam ali. A
 * alternativa (deixar o campo na tela e explicar depois do 404) cobra da
 * pessoa uma pergunta escrita e uma espera para então dizer que ninguém
 * ouviu. `AssistenteChat` mantém a mesma detecção pelo 404 como rede de
 * segurança para o alvo Cloudflare — ver `lib/rota-ausente.ts`.
 */

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) =>
    exportandoEstatico
      ? `Busca e navegação — ${nomePortal(c)}`
      : `Pergunte ao portal — ${nomePortal(c)}`,
  // A descrição segue o alvo pela mesma razão que o corpo da página: ela vai
  // para buscador e para prévia de link compartilhado. Prometer "pergunte em
  // linguagem natural" numa cópia que não tem o assistente é a mesma mentira
  // do formulário morto, só que ela chega antes da visita.
  (c) =>
    exportandoEstatico
      ? `Esta cópia estática do ${nomePortal(c)} não publica o assistente por IA. Use a busca do portal e o assistente de navegação.`
      : `Assistente do ${nomePortal(c)}: pergunte em linguagem natural sobre contratos, gastos, vereadores e dados de ${c.nome}.`
);

export default async function AssistentePage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        {exportandoEstatico ? "Encontrar no portal" : "Pergunte ao portal"}
      </h1>
      {exportandoEstatico ? (
        <>
          <p className="mt-2 mb-6 max-w-2xl text-[1.02em] text-text-soft">
            Nesta cópia do portal não há assistente por IA para responder sobre{" "}
            {cidade.nome}. O que existe aqui leva você à página com o dado.
          </p>
          <AvisoSemAssistente />
        </>
      ) : (
        <>
          <p className="mt-2 mb-6 max-w-2xl text-[1.02em] text-text-soft">
            Escreva uma pergunta sobre {cidade.nome} — contratos, gastos, atuação
            da Câmara — e o assistente responde com base nos dados oficiais já
            reunidos aqui.
          </p>
          <AssistenteChat />
        </>
      )}
    </div>
  );
}
