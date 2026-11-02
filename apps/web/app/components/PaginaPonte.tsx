import Link from "next/link";

/**
 * @file Página-ponte genérica para URL antiga que continua indexada.
 *
 * POR QUE EXISTE: o mesmo código serve dois destinos. Onde há servidor
 * (Azure/standalone, Cloudflare Workers), quem redireciona é `redirects()` do
 * `next.config.ts`. No alvo estático (`PAGES_BASE_PATH` definido → GitHub
 * Pages, `output: 'export'`) essa função **nem é aplicada**: não há servidor
 * para responder 301, e o Next não avisa — a rota antiga vira 404 em produção.
 * A ponte é o equivalente que funciona nos dois: o próprio HTML carrega
 * `<meta http-equiv="refresh">` com `content="0"`, que os navegadores tratam
 * como redirect, e o `canonical` consolida o sinal nos buscadores.
 *
 * O `<a>` visível não é decoração: se o refresh for bloqueado (extensão,
 * leitor de tela em modo texto), a página ainda precisa levar a algum lugar. O
 * texto explica o que aconteceu em vez de só piscar.
 *
 * `destino` é caminho absoluto do site (`/x/y?filtro=z`), nunca URL externa.
 *
 * A versão por município mora em `app/[municipio]/components/PaginaPonte.tsx`
 * e existe por outro motivo: lá a ponte é gated pela fonte da cidade. Esta é a
 * ponte de rota global, que vale para todo mundo.
 */
export default function PaginaPonte({
  destino,
  titulo,
  descricao,
  semMain = false,
}: {
  /** Caminho novo, absoluto no site, com a query quando houver. */
  destino: string;
  titulo: string;
  /** Uma frase dizendo para onde o conteúdo foi. */
  descricao: string;
  /**
   * `true` quando o layout da zona já entrega o `<main id="conteudo-principal">`
   * (caso de `/congresso`). Sem isto, a ponte criaria um segundo `<main>` e
   * dois elementos com o mesmo `id` — HTML inválido e dois landmarks iguais
   * para o leitor de tela.
   */
  semMain?: boolean;
}) {
  const conteudo = (
    <>
      <h1 className="font-display text-2xl font-semibold text-text">{titulo}</h1>
      <p className="mt-3 text-sm text-text-soft">{descricao}</p>
      <Link
        href={destino}
        className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white"
      >
        Ir para a página nova
      </Link>
    </>
  );
  return (
    <>
      <meta httpEquiv="refresh" content={`0; url=${destino}`} />
      <link rel="canonical" href={destino} />
      <meta name="robots" content="noindex, follow" />
      {semMain ? (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">{conteudo}</div>
      ) : (
        <main
          id="conteudo-principal"
          className="mx-auto max-w-2xl px-4 py-20 text-center"
        >
          {conteudo}
        </main>
      )}
    </>
  );
}
