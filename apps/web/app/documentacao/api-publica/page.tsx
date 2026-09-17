import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = metadataEditavel("/documentacao/api-publica", {
  title: "API Publica — Documentacao Controle Popular",
  description:
    "Endpoints JSON publicos do portal: municipios, editais, Paraopeba. Sem autenticacao, sem chave de API.",
});

const ENDPOINTS = [
  {
    metodo: "GET",
    path: "/api/v1/municipios",
    descricao: "Lista dos 199 municipios estrategicos monitorados com codigo IBGE, nome e estado",
    exemplo: '{"codigo":"3106705","nome":"Betim","uf":"MG"}',
  },
  {
    metodo: "GET",
    path: "/api/v1/editais",
    descricao: "Ultimos editais e chamamentos publicos do Diario Oficial de MG",
    exemplo: '{"id":"edital-001","titulo":"Chamamento Publico Cultura","orgao":"SECULT-MG"}',
  },
  {
    metodo: "GET",
    path: "/api/v1/paraopeba",
    descricao: "Repasses financeiros do Acordo de Brumadinho por municipio da bacia",
    exemplo: '{"municipio":"Brumadinho","codigo":"3109006","repasse_total":120000000}',
  },
  {
    metodo: "GET",
    path: "/api/v1/bases",
    descricao: "Catalogo unificado das 18 bases de dados oficiais do portal com volumetria e fontes",
    exemplo: '{"totalBases":18,"bases":[{"id":"editais-mg","nome":"Radar de Editais"}]}',
  },
];

export default function ApiPublicaPage() {
  return (
    <>
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <nav className="text-sm text-text-soft">
          <Link href="/" className="hover:text-primary">Inicio</Link>{" "}·{" "}
          <Link href="/documentacao" className="hover:text-primary">Documentacao</Link>{" "}·{" "}
          <span className="text-text">API publica</span>
        </nav>

        <header className="space-y-3">
          <p className="font-mono text-xs text-text-soft">03 / api-publica</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            API publica
          </h1>
          <p className="text-text-soft">
            Endpoints JSON sem autenticacao e sem chave de API. Para pesquisa,
            jornalismo e integracao civica. Limite sugerido: 1 requisicao por
            segundo; identifique seu cliente no header <code className="text-xs">User-Agent</code>.
          </p>
        </header>

        <section className="space-y-2">
          <p className="text-sm text-text-soft">
            <strong>Base URL:</strong>{" "}
            <code className="rounded bg-surface-2/80 px-1.5 py-0.5 text-xs">
              https://controlepopular.com.br/api/v1
            </code>
          </p>
          <p className="text-sm text-text-soft">
            <strong>Formato:</strong> JSON, UTF-8.{" "}
            <strong>Autenticacao:</strong> nenhuma.{" "}
            <strong>CORS:</strong> aberto para origem qualquer.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Endpoints</h2>
          <div className="space-y-4">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="rounded-xl border border-border bg-surface-2/40 p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-semibold text-primary">
                    {ep.metodo}
                  </span>
                  <code className="text-sm font-medium">{ep.path}</code>
                </div>
                <p className="text-sm text-text-soft">{ep.descricao}</p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-text-soft hover:text-text">
                    Exemplo de resposta
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded bg-surface-2/80 p-3 text-xs">
                    {ep.exemplo}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-2/40 p-5 space-y-2">
          <h2 className="font-display text-base font-semibold">Uso etico</h2>
          <p className="text-sm text-text-soft">
            Esta API existe para transparencia civica. Veda-se o uso para
            vigilancia, perfilamento de pessoas ou revenda de dado. Veja a
            politica completa em <Link href="/termos" className="underline hover:text-primary">/termos</Link>.
          </p>
        </section>

        <nav className="flex justify-between text-sm">
          <Link href="/documentacao/fontes-e-coletas" className="text-text-soft hover:text-primary">
            ← Fontes e coletas
          </Link>
          <Link href="/documentacao/editorial" className="text-text-soft hover:text-primary">
            Principios editoriais →
          </Link>
        </nav>
      </main>
      <FooterGlobal />
    </>
  );
}
