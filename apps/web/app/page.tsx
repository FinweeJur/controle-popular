import type { Metadata } from "next";
import { ZONAS } from "@/lib/zonas";
import { listarCidades } from "@/lib/db/queries/municipios";

/**
 * Home da marca Controle Popular, na raiz do domínio.
 *
 * Antes vivia em `app/hub/` dentro do repo do Betim e chegava em `/` por
 * um rewrite, porque `controlepopular.vercel.app` era o domínio
 * auto-gerado do projeto Vercel do Betim e domínio `.vercel.app` não se
 * transfere entre projetos — então quem atendia a raiz era o Betim.
 *
 * Com o monorepo isso deixou de ser verdade: as três zonas são
 * diretórios do mesmo build e a raiz é uma rota como outra qualquer. O
 * `ForaDoHub`, que escondia o cabeçalho do Betim aqui, saiu junto — como
 * o próprio comentário dele previa.
 *
 * Os links para as zonas usam `<a>` cru, não o `<Link>` de zona: daqui
 * eles apontam para `/betim`, `/congresso` e `/judiciario`, que são
 * caminhos absolutos e não devem receber prefixo nenhum.
 *
 * A ZONA DE CIDADES LISTA AS CIDADES, e não é enfeite: ela apontava para
 * `/betim` e só. Belo Horizonte e São Paulo entraram no ar e ficaram
 * inalcançáveis a partir da raiz — quem chegasse em controlepopular sem
 * saber a URL de cor só encontrava Betim. A lista vem de `listarCidades()`,
 * a mesma fonte que gera as rotas, então abrir a próxima cidade a faz
 * aparecer aqui sozinha, sem ninguém lembrar de editar esta página.
 */

export const metadata: Metadata = {
  title: "Controle Popular — dados públicos que dá para usar",
  description:
    "Transparência do orçamento e dos contratos de Betim-MG, monitoramento do que o Congresso Nacional decide sobre direitos, e quem ocupa cada cadeira do Judiciário. Portal independente.",
};

// A cópia das três frentes mora em `lib/zonas.ts`, porque o bloco de
// remissão no pé de cada zona (`app/components/OutrasFrentes.tsx`) descreve
// as mesmas frentes — duplicar aqui garantiria deriva entre as duas telas.
const SECOES = ZONAS;

export default async function Hub() {
  const cidades = await listarCidades();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p className="font-display text-[1.4em] font-bold tracking-tight">
          controlepopular<span className="text-primary">.br</span>
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Dados públicos que dá para usar
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Informação oficial sobre dinheiro público e sobre as leis que mexem com a sua
          vida, reunida e explicada. Portal independente, sem vínculo com nenhum governo,
          câmara ou partido.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SECOES.map((s) =>
          s.id === "cidades" ? (
            // O card de cidades não é UM link: é um cartão com N destinos.
            // Aninhar <a> dentro de <a> é HTML inválido e o navegador
            // "conserta" fechando o de fora — o que quebraria os links das
            // cidades em vez de dar erro visível.
            <div
              key={s.id}
              className="flex flex-col rounded-lg border border-border bg-surface p-6"
            >
              <span
                className="text-[.88em] font-semibold uppercase tracking-wide"
                style={{ color: s.cor }}
              >
                {s.etiqueta}
              </span>
              <h2 className="mt-2 font-display text-xl font-semibold">{s.titulo}</h2>
              <p className="mt-2 text-[.95em] text-text-soft">{s.descricao}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {cidades.map((c) => (
                  <li key={c.slug}>
                    <a
                      href={`/${c.slug}`}
                      className="flex items-baseline justify-between gap-2 rounded-md border border-border px-3 py-2 text-[.95em] font-medium transition-colors hover:border-primary hover:text-primary"
                    >
                      <span>
                        {c.nome}
                        <span className="text-text-soft"> · {c.uf}</span>
                      </span>
                      <span aria-hidden="true">→</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
          // <a> puro, não next/link: estes caminhos estão FORA do basePath
          // deste app (`/betim`), e o next/link prefixaria, gerando
          // `/betim/congresso`. É a mesma classe de bug que já mordeu aqui.
          <a
            key={s.href}
            href={s.href}
            className="group flex flex-col rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary"
          >
            <span
              className="text-[.88em] font-semibold uppercase tracking-wide"
              style={{ color: s.cor }}
            >
              {s.etiqueta}
            </span>
            <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-primary">
              {s.titulo}
            </h2>
            <p className="mt-2 text-[.95em] text-text-soft">{s.descricao}</p>
            <ul className="mt-4 space-y-1.5 text-[.9em] text-text-soft">
              {s.itens.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" style={{ color: s.cor }}>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <span className="mt-5 font-medium text-primary">Entrar →</span>
          </a>
          )
        )}
      </div>

      <section className="mt-12 rounded-lg border border-border p-6">
        <h2 className="font-display text-lg font-semibold">Por que três portais</h2>
        <p className="mt-2 text-[.95em] text-text-soft">
          O poder público se divide em três frentes, e cada uma decide algo diferente: o
          dinheiro é executado na prefeitura e na câmara municipal, os direitos são
          definidos — e às vezes reduzidos — no Congresso, e é o Judiciário quem interpreta
          essas leis e resolve os conflitos, sem que ninguém tenha votado em quem ocupa
          essas cadeiras. Acompanhar só uma frente deixa boa parte da história de fora.
        </p>
      </section>

      <footer className="mt-10 space-y-2 text-[.85em] text-text-soft">
        <p>
          Todos os dados vêm de fontes oficiais e cada número mostra de onde saiu. As
          classificações de ampliação ou restrição de direitos seguem uma régua declarada
          e auditável, publicada na seção do Congresso; a data de aposentadoria de cada
          ministro segue a mesma disciplina, publicada na seção do Judiciário.
        </p>
      </footer>
    </div>
  );
}
