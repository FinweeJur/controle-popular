import type { Metadata } from "next";
import { ZONAS_PUBLICADAS, contagemZonasPublicadas } from "@/lib/zonas";
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

// A cópia das frentes mora em `lib/zonas.ts`, porque o bloco de remissão no
// pé de cada zona (`app/components/OutrasFrentes.tsx`) descreve as mesmas
// frentes — duplicar aqui garantiria deriva entre as duas telas.
//
// `ZONAS_PUBLICADAS`, não `ZONAS`: zona em construção existe no código e é
// alcançável por URL direta, mas não se anuncia na home antes de ter dado.
const SECOES = ZONAS_PUBLICADAS;

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
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-[.95em]">
          <a href="/busca" className="font-medium text-primary hover:underline">
            Busca por tema, palavra-chave e território →
          </a>
          <a href="/dados/populares" className="font-medium text-primary hover:underline">
            Páginas mais vistas →
          </a>
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

      {/* ═══ DIREITOS EM MOVIMENTO — BLOCO PRÓPRIO, NÃO É UMA FRENTE ═══
          Decisão do dono (13/08): NÃO entra em `ZONAS`/`SECOES` acima. As
          frentes são EIXOS DE PODER — lugares onde alguém decide sobre a
          vida da pessoa (prefeitura/câmara, Congresso, tribunais, COPAM,
          terra, e agora a reparação de Brumadinho). Esta seção não é mais
          um desses lugares de decisão; é o que a pessoa FAZ com o que
          achou nas outras — transversal, não paralela. Entrar em `ZONAS`
          faria a seção reivindicar um estatuto que não tem, e arrastaria
          layout/nav/rodapé de zona que ela não precisa (ver
          `lib/zonas.ts`). Por isso o tratamento visual abaixo é
          deliberadamente diferente do grid de cards acima — cor própria
          (`--cp-alert`, não usada por nenhuma frente) e forma de banner
          largo, não mais um card na grade.
          ⟲ 13/08, Paraopeba: o texto renderizado usa
          `contagemZonasPublicadas()`, não o numeral cravado — a sexta
          frente que motivou essa troca é exatamente esta seção. */}
      <section
        className="mt-10 rounded-lg border-2 p-6"
        style={{ borderColor: "var(--cp-alert)" }}
      >
        <span
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-alert)" }}
        >
          Transversal às {contagemZonasPublicadas()} frentes
        </span>
        <h2 className="mt-2 font-display text-xl font-semibold">Direitos em Movimento</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Sofreu ou viu uma violação de direito? Que lei protege, onde buscar ajuda, como
          pedir informação e como denunciar — reunidos num lugar só, sem precisar saber em
          que frente do site cada resposta mora.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[.85em]">
          <a
            href="/ambiental/direito-critico"
            className="rounded-full border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary"
          >
            Que lei protege isso
          </a>
          <a
            href="/direitos-em-movimento/ajuda"
            className="rounded-full border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary"
          >
            Onde buscar ajuda
          </a>
          <a
            href="/direitos-em-movimento/informacao"
            className="rounded-full border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary"
          >
            Como pedir informação
          </a>
          <a
            href="/direitos-em-movimento/denuncia"
            className="rounded-full border border-border px-3 py-1.5 font-medium hover:border-primary hover:text-primary"
          >
            Como denunciar
          </a>
        </div>
        <a
          href="/direitos-em-movimento"
          className="mt-4 inline-block font-medium"
          style={{ color: "var(--cp-alert)" }}
        >
          Entrar em Direitos em Movimento →
        </a>
      </section>

      {/* ⟲ 13/08: dizia "Por que TRÊS portais", e o texto contava três
          frentes — a herança dos três sites que foram unificados num só.
          Ficou colado embaixo de CINCO cartões, e nessa vizinhança ele lia
          como contagem furada, não como história. O conceito não estava
          errado: os três Poderes continuam sendo três. O que envelheceu foi
          tratar "Poder" e "frente do portal" como a mesma coisa — meio
          ambiente é o estado agindo dentro do Executivo, e terra atravessa
          os três. Agora o texto separa as duas ideias em vez de fingir que
          coincidem, e a contagem sai de `lib/zonas.ts` como em todo lugar. */}
      <section className="mt-8 rounded-lg border border-border p-6">
        <h2 className="font-display text-lg font-semibold">Por que mais de um portal</h2>
        <p className="mt-2 text-[.95em] text-text-soft">
          O poder público se divide, e cada parte decide algo diferente: o dinheiro é
          executado na prefeitura e na câmara municipal, os direitos são definidos — e às
          vezes reduzidos — no Congresso, e é o Judiciário quem interpreta essas leis e
          resolve os conflitos, sem que ninguém tenha votado em quem ocupa essas cadeiras.
          A isso somam-se três frentes que não são um quarto Poder: duas são onde o Estado
          decide sobre o território — o licenciamento ambiental de Minas e quem é dono da
          terra —, e a terceira acompanha se uma reparação já decidida na Justiça está
          sendo paga de verdade, mês a mês. São {contagemZonasPublicadas()} ao todo, e
          acompanhar só uma deixa boa parte da história de fora.
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
