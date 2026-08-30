import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API pública · Controle Popular",
  description:
    "Os dados agregados do portal em JSON aberto, sem chave: catálogo, documentação interativa (Swagger UI) e spec OpenAPI.",
};

/**
 * /api — porta de entrada da API pública.
 *
 * A API é 100% estática (gerada por scripts/gerar-api-publica.mjs no prebuild
 * para public/api/v1/), então esta página é só a apresentação: o que é, as
 * regras e o Swagger UI vendorizado em public/api/docs/. Nada de JSON grande
 * importado aqui — a regra do teto de payload vale também para docs.
 */
export default function ApiPublica() {
  return (
    <>
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">API pública</h1>
        <p className="opacity-80">
          Os dados agregados do portal, em JSON aberto, <strong>sem chave e sem
          cadastro</strong>. É o mesmo dado que aparece nas telas — com a
          fonte, a data da medição e as ressalvas viajando junto, porque número
          sem ressalva não sai daqui.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Começar</h2>
        <ul className="list-disc space-y-2 pl-6 opacity-80">
          <li>
            <code className="rounded bg-black/5 px-1 py-0.5 text-sm dark:bg-white/10">
              GET /api/v1/manifesto.json
            </code>{" "}
            — o catálogo: todos os datasets, com fonte e ressalvas.
          </li>
          <li>
            <code className="rounded bg-black/5 px-1 py-0.5 text-sm dark:bg-white/10">
              GET /api/v1/status.json
            </code>{" "}
            — status do build e a lista de endpoints publicados.
          </li>
          <li>
            <code className="rounded bg-black/5 px-1 py-0.5 text-sm dark:bg-white/10">
              GET /api/v1/datasets/{"{id}"}.json
            </code>{" "}
            — o conteúdo de um dataset (os ids estão no manifesto).
          </li>
          <li>
            <a className="underline" href="/api/openapi.yaml">
              /api/openapi.yaml
            </a>{" "}
            — a spec OpenAPI 3.0 completa.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Regras</h2>
        <ul className="list-disc space-y-2 pl-6 opacity-80">
          <li>
            <strong>Contrato estável:</strong> o que está em{" "}
            <code className="rounded bg-black/5 px-1 py-0.5 text-sm dark:bg-white/10">/api/v1/</code>{" "}
            não muda de formato; mudança quebrante vira{" "}
            <code className="rounded bg-black/5 px-1 py-0.5 text-sm dark:bg-white/10">/api/v2/</code>.
          </li>
          <li>
            <strong>A ressalva faz parte do dado.</strong> Cada dataset declara
            o que a fonte não cobre. O repasse de Brumadinho, por exemplo, foi
            para as 853 cidades de MG — e 827 delas não têm relação com a
            bacia. Quem consome a API recebe essa ressalva no manifesto.
          </li>
          <li>
            <strong>Só agregados públicos.</strong> O DataJud do CNJ não está
            aqui: a licença dele veda redistribuir derivado. O que está aqui é
            o que o portal já publica em tela.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">
          Documentação interativa
        </h2>
        <p className="opacity-80">
          Abaixo, a spec aberta no Swagger UI — dá para testar cada endpoint
          com o botão <em>Try it out</em>, sem sair da página. Prefere tela
          cheia?{" "}
          <a className="underline" href="/api/docs/" target="_blank" rel="noreferrer">
            Abrir a documentação em página própria
          </a>
          .
        </p>
      </section>
    </div>

    {/* Swagger UI vendorizado (public/api/docs/) — fora da coluna de leitura
        porque a ferramenta pede largura. O iframe é same-origin e estático. */}
    <div className="border-t border-black/10 dark:border-white/10">
      <iframe
        src="/api/docs/"
        title="Documentação interativa da API pública (Swagger UI)"
        className="h-[80vh] w-full"
      />
    </div>
  </>
  );
}
