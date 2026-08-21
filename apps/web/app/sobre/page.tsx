import type { Metadata } from "next";
import { ZONAS_PUBLICADAS, contagemZonasPublicadas } from "@/lib/zonas";
import { listarCidades } from "@/lib/db/queries/municipios";
import { obterEstatisticasPortal } from "@/lib/betim/estatisticas-portal";
import { formatNumberBR } from "@/lib/betim/format";
import TaxaDeErroTerras from "@/app/[municipio]/components/TaxaDeErroTerras";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/sobre` — a apresentação do Controle Popular, na RAIZ do domínio.
 *
 * FICA NA RAIZ, fora de `[municipio]`/`congresso`/`judiciario`/`ambiental`
 * (mesmo motivo de `app/busca/page.tsx` e `app/dados/populares/page.tsx`):
 * o assunto é o portal INTEIRO, e uma versão dentro de uma zona descreveria
 * só um recorte. Cada zona já tem a sua própria página "Sobre" ou
 * "Metodologia" (`/judiciario/sobre`, `/[municipio]/sobre`, `/congresso/
 * metodologia`, `/judiciario/metodologia`) — essas continuam existindo e
 * continuam falando só da zona delas. Esta é a única que fala das cinco
 * juntas.
 *
 * Sem `layout.tsx` próprio (fora das quatro zonas) — precisa do `<main>`
 * explícito para o botão global "Ouvir esta página" (`OuvirPagina.tsx`)
 * achar conteúdo, mesma razão documentada em `app/busca/page.tsx`.
 *
 * CONTEÚDO: porte de `docs/APRESENTACAO.md` (1.121 linhas, uso interno) —
 * não reescrita. O que muda aqui é o alcance: os números não são texto
 * datado, são medidos de novo a cada build por `obterEstatisticasPortal()`,
 * porque um documento interno pode dizer "conferido em 2026-08-12" e uma
 * página pública não pode carregar essa validade.
 *
 * `#metodologia` é o alvo do link "Metodologia" do rodapé padrão
 * (`FooterGlobal.tsx`) em qualquer zona — inclusive as que não têm
 * `/metodologia` própria (`/ambiental`, `/funcaosocialterra`).
 */
export const metadata: Metadata = metadataEditavel("/sobre", {
  title: "Sobre o Controle Popular — o que é, de onde vem o dado, e o papel da IA",
  description:
    "O que é o Controle Popular, como cada dado chega ao portal, a separação entre o que o modelo de linguagem extrai e o que o código calcula, e por que o portal está em revisão.",
});

export default async function SobrePage() {
  const [cidades, stats] = await Promise.all([listarCidades(), obterEstatisticasPortal()]);
  const nomesCidades = cidades.map((c) => `${c.nome}-${c.uf}`).join(", ");
  const N = formatNumberBR;

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <a href="/" className="hover:text-primary">
          Início
        </a>{" "}
        · <span className="text-text">Sobre</span>
      </nav>

      <header className="space-y-4">
        <p className="font-display text-[1.1em] font-bold text-text">
          controlepopular<span className="text-primary">.br</span>
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O que é o Controle Popular
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Um portal independente de transparência pública. Ele não produz informação nova:
          reúne o que órgãos públicos já publicam — espalhado por dezenas de sistemas, em
          linguagem administrativa — e apresenta em um só endereço, organizado por cidade e
          por tema, em português comum.
        </p>
      </header>

      {/* ═══ 1. O QUE É ═══ */}
      <section className="space-y-3">
        <p className="text-text-soft">
          O dado sobre um contrato de prefeitura já é público: está no Portal Nacional de
          Contratações Públicas. O dado sobre um projeto de lei federal já é público: está na
          API de Dados Abertos da Câmara dos Deputados. O que não existia era o lugar onde um
          morador encontra as duas coisas sem saber de antemão que os dois sistemas existem,
          como se chamam e qual campo consultar. O portal é esse lugar.
        </p>
        <p className="text-text-soft">
          O público-alvo é o cidadão sem formação jurídica ou estatística — é por isso que
          termo técnico é explicado na própria tela em que aparece, e não numa página de
          glossário que ninguém abre.
        </p>
        <p className="rounded-lg border border-border bg-surface-2 p-4 text-[.95em] text-text-soft">
          A regra que organiza o projeto inteiro: <strong className="text-text">todo
          número exibido tem fonte identificável, e todo número que resulta de estimativa
          aparece com a taxa de erro ao lado</strong>. Quando não há dado, a tela diz que não
          há — não preenche o espaço com uma aproximação silenciosa. Um portal que cobra
          procedência dos outros não pode publicar número sem procedência própria.
        </p>
      </section>

      {/* ═══ 2. HONESTIDADE SOBRE IA — a seção mais importante desta página ═══ */}
      <section className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
        <h2 className="font-display text-2xl font-semibold">
          Este portal usa inteligência artificial — e o portal está em revisão
        </h2>
        <p className="text-text-soft">
          Sem enfeite: parte do dado que você lê aqui foi lido, extraído ou classificado com
          o auxílio de modelos de linguagem — as ferramentas usadas na construção do projeto
          foram <strong className="text-text">Claude Code</strong>,{" "}
          <strong className="text-text">Kimi Code</strong> e{" "}
          <strong className="text-text">ZaiCode</strong>. E, por causa disso,{" "}
          <strong className="text-text">o portal está em revisão</strong> — não é um estado
          transitório que vai acabar numa data marcada, é uma condição permanente de um
          projeto que usa IA na coleta e pede para ser conferido.
        </p>
        <p className="text-text-soft">
          Isso não significa que os números são palpite. O projeto segue uma doutrina que
          separa duas coisas que costumam ser confundidas:{" "}
          <strong className="text-text">o modelo extrai, o programa calcula</strong>. Na
          análise garantista do Congresso, por exemplo, o modelo de linguagem nunca recebe a
          pergunta &ldquo;este projeto é garantista ou reducionista?&rdquo;. Ele recebe uma
          tarefa de extração: apontar quais direitos a proposta afeta, em que direção, por
          qual mecanismo — e, obrigatoriamente, citar o dispositivo legal e o trecho literal
          que sustentam cada apontamento. O rótulo final (garantista, reducionista, misto...)
          não sai do modelo: é aritmética sobre esse formulário, feita por código
          determinístico e reexecutável. A mesma separação organiza a análise de vício
          legislativo e a atribuição de tema da legislação em{" "}
          <a href="/ambiental/legislacao" className="text-primary hover:text-accent">
            /ambiental/legislacao
          </a>{" "}
          (até 13/08/2026, <code className="text-[.85em]">/ambiental/direito-critico</code> — unificada
          com a legislação estadual num painel só, a URL antiga redireciona pra cá).
        </p>
        <p className="text-text-soft">
          A analogia é a do escrivão e do juiz: o modelo é escrivão, preenche um formulário de
          campos fechados e anota de onde tirou cada informação; o rótulo é aritmética sobre
          esse formulário. Isso não torna a IA inofensiva —{" "}
          <strong className="text-text">
            se a extração erra, o rótulo calculado a partir dela também erra
          </strong>
          , porque o código confia no que o formulário diz. É por isso que item com confiança
          baixa não vira manchete: fica marcado na tela como{" "}
          <strong className="text-text">&ldquo;requer revisão humana&rdquo;</strong> e sai dos
          rankings de alerta e de bom exemplo, mesmo continuando publicado ao lado do rótulo.
        </p>
        <p className="text-text-soft">
          Isso já falhou em público, e a correção ficou na própria página em vez de sumir no
          histórico do código. Até 13/08/2026, a página de{" "}
          <a href="/ambiental/legislacao" className="text-primary hover:text-accent">
            legislação e precedentes por tema de direito
          </a>{" "}
          afirmava que a atribuição de tema de cada lei e precedente &ldquo;veio de leitura
          humana&rdquo;. Não veio — veio de leitura assistida por IA, registrada linha a linha
          com o trecho que sustenta cada tema. A página hoje diz o que é, mantém o que
          continua verdadeiro (é reexecutável e auditável item a item pelo trecho citado) e
          declara que está em revisão. Quem cobra procedência dos outros deve o mesmo padrão
          sobre si — e isso inclui dizer em público que errou.
        </p>
        <p className="text-[.9em] text-text-soft">
          Nenhum número do portal é <em>escrito</em> por modelo de linguagem: o assistente de
          conversa de cada zona responde só com o contexto que vem do banco, e o registro de
          camadas do mapa 3D bloqueia e conta qualquer feição marcada como demonstração antes
          de exportar. O que a IA faz é ler texto não estruturado — ementa de lei, inteiro
          teor de projeto — e transformar em campos que o código então soma, filtra e rotula
          por regra fixa, nunca por opinião do modelo.
        </p>
      </section>

      {/* ═══ 3. AS CINCO FRENTES ═══ (nome da seção fica — a CONTAGEM no
          texto abaixo é que vem de `contagemZonasPublicadas()`, não mais
          cravada à mão) */}
      <section className="space-y-5">
        <h2 className="font-display text-2xl font-semibold">
          As {contagemZonasPublicadas()} frentes
        </h2>
        <p className="text-text-soft">
          O portal se organiza em {contagemZonasPublicadas()} frentes, chamadas internamente de <em>zonas</em>. A
          descrição de cada uma vive num arquivo único —{" "}
          <code className="font-mono text-[.85em]">lib/zonas.ts</code> — lido tanto pela home
          quanto pelo rodapé de cada zona, para que o mesmo texto não precise ser corrigido em
          quatro telas quando algo muda.
        </p>

        <div className="space-y-4">
          {ZONAS_PUBLICADAS.map((z) => (
            <a
              key={z.id}
              href={z.href}
              className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"
            >
              <span
                className="text-[.8em] font-semibold uppercase tracking-wide"
                style={{ color: z.cor }}
              >
                {z.etiqueta}
              </span>
              <h3 className="mt-1 font-display text-lg font-semibold group-hover:text-primary">
                {z.titulo}
              </h3>
              <p className="mt-1 text-[.9em] text-text-soft">{z.resumo}</p>
            </a>
          ))}
        </div>

        <p className="text-[.9em] text-text-soft">
          Seis cidades estão publicadas hoje: <strong className="text-text">{nomesCidades}</strong>.
          A cobertura varia muito entre elas — a seção &ldquo;O que ainda falta&rdquo;, mais
          abaixo, mostra a diferença em vez de escondê-la.
        </p>

        {stats && (
          <div className="space-y-6 text-[.88em]">
            <p className="text-text-soft">
              Volume publicado, medido no banco do portal no momento em que esta página foi
              gerada:
            </p>

            <TabelaVolume
              titulo="Municipal (seis cidades)"
              linhas={[
                ["Contratos", stats.municipal.contratos],
                ["Licitações", stats.municipal.licitacoes],
                ["Atos oficiais (leis, decretos, portarias)", stats.municipal.atosOficiais],
                ["Proposições de câmaras municipais", stats.municipal.proposicoes],
                ["Vínculos de servidores", stats.municipal.servidores],
                ["Vereadores", stats.municipal.vereadores],
                ["Escolas", stats.municipal.escolas],
                ["Estabelecimentos de saúde", stats.municipal.saudeEstabelecimentos],
                ["Obras", stats.municipal.obras],
                ["Contratos com alerta de risco", stats.municipal.contratosComAlerta],
              ]}
            />

            <TabelaVolume
              titulo="Congresso Nacional"
              linhas={[
                ["Proposições", stats.congresso.proposicoes],
                ["Parlamentares", stats.congresso.parlamentares],
                ["Bancadas e frentes parlamentares", stats.congresso.bancadas],
                ["Vínculos de parlamentar com bancada", stats.congresso.bancadaMembros],
                ["Comissões e demais órgãos", stats.congresso.orgaos],
                ["Votações nominais", stats.congresso.votacoes],
              ]}
            />

            <TabelaVolume
              titulo="Judiciário"
              linhas={[
                ["Tribunais", stats.judiciario.tribunais],
                ["Magistrados cadastrados", stats.judiciario.magistrados],
                [
                  "Destes, com data de nascimento levantada",
                  stats.judiciario.magistradosComNascimento,
                ],
                ["Indicações registradas", stats.judiciario.indicacoes],
                ["Cadeiras com ocupação registrada", stats.judiciario.ocupacoes],
              ]}
            />
            <p className="text-[.85em] text-text-soft">
              A data de aposentadoria compulsória só é calculável para os{" "}
              {N(stats.judiciario.magistradosComNascimento)} magistrados com data de
              nascimento levantada, de {N(stats.judiciario.magistrados)} cadastrados — o
              restante é curadoria manual em andamento.
            </p>

            <TabelaVolume
              titulo="Ambiental (Minas Gerais)"
              linhas={[
                ["Licenças ambientais", stats.ambiental.licencas],
                ["Normas ambientais (ALMG, SEMAD, SIAM)", stats.ambiental.normas],
                [
                  `Destas, com tema atribuído (${((stats.ambiental.normasComTema / stats.ambiental.normas) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`,
                  stats.ambiental.normasComTema,
                ],
                ["Reuniões do COPAM", stats.ambiental.reunioesCopam],
                ["Itens de pauta", stats.ambiental.itensPauta],
                ["Barragens (FEAM)", stats.ambiental.barragensFeam],
                ["Barragens (SNISB)", stats.ambiental.barragensSnisb],
                ["Autos de infração estaduais (CAP/SEMAD)", stats.ambiental.autosEstaduais],
                ["Autos de infração federais (IBAMA)", stats.ambiental.autosFederais],
              ]}
            />
          </div>
        )}
      </section>

      {/* ═══ 4. METODOLOGIA ═══ */}
      <section id="metodologia" className="scroll-mt-6 space-y-8">
        <h2 className="font-display text-2xl font-semibold">Metodologia</h2>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">De onde vem o dado</h3>
          <p className="text-text-soft">
            Entre a fonte pública e a tela existe um conjunto de programas em Python que o
            projeto chama de <strong className="text-text">ETL</strong> — extrair da fonte,
            ajustar o formato, gravar no banco. Contratos e licitações vêm do PNCP; população,
            PIB e malha territorial, do IBGE; despesas e receitas municipais, do SICONFI;
            proposições e parlamentares, das APIs da Câmara dos Deputados e do Senado;
            licenciamento e autuação ambiental, da CAP/SEMAD-MG e do IBAMA; barragens, do
            SNISB (ANA) e da FEAM. Cada tabela do banco declara, no próprio coletor, a fonte
            exata que consulta.
          </p>
          <p className="text-text-soft">
            Uma prática que vale destacar: cada coletor documenta, no cabeçalho do próprio
            arquivo, não só a fonte e as armadilhas medidas nela, mas{" "}
            <strong className="text-text">o que ele deliberadamente não coleta</strong>
            {" "}— para que a ausência de um dado não seja lida como afirmação de que o fato não existe.
            &ldquo;Zero barragens da FEAM&rdquo; num município, por exemplo, não é &ldquo;nenhuma
            barragem no município&rdquo;: é só o recorte que aquele coletor cobre.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">
            A análise garantista: o modelo extrai, o programa calcula
          </h3>
          <p className="text-text-soft">
            O portal classifica leis e projetos de lei conforme os direitos que ampliam ou
            restringem — <strong className="text-text">garantista</strong> quando ampliam,{" "}
            <strong className="text-text">reducionista</strong> quando restringem. É uma
            escolha de valor, declarada como tal em vez de escondida atrás de uma aparência de
            imparcialidade.
          </p>
          <p className="text-text-soft">
            A régua que decide isso é um arquivo único, com 24 direitos e 17 mecanismos, cada
            direito com as suas âncoras legais. O mesmo arquivo é lido pelo programa que monta
            a instrução do modelo, pelo programa que valida a resposta e pela página que
            explica a metodologia — se a régua mudar, as três mudam juntas, porque um portal
            cujo argumento é a régua transparente não pode publicar uma metodologia diferente
            da que aplica.
          </p>
          <p className="text-text-soft">
            Item que não cita dispositivo legal válido é descartado antes de contar — a coluna
            do banco que guarda essa citação nem aceita valor vazio. Item com confiança abaixo
            de 0,5 continua sendo calculado e publicado, mas marca a análise como{" "}
            <strong className="text-text">&ldquo;requer revisão humana&rdquo;</strong> e sai
            dos rankings de alerta e de bom exemplo.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">
            Cobertura é amostra, não censo
          </h3>
          <p className="text-text-soft">
            O portal não analisou toda a legislação nem todo projeto de lei — analisou uma
            parte, e essa parte precisa aparecer sempre que um rótulo aparecer.
          </p>
          {stats && (
            <>
              <TabelaVolume
                titulo="Cobertura da análise garantista"
                linhas={[
                  [
                    `Atos oficiais municipais analisados (universo ${N(stats.municipal.atosOficiais)})`,
                    stats.municipal.analisesDeAtos,
                  ],
                  [
                    `Proposições municipais analisadas (universo ${N(stats.municipal.proposicoes)})`,
                    stats.municipal.analisesDeProposicoes,
                  ],
                  [
                    `Proposições federais analisadas (universo ${N(stats.congresso.proposicoes)})`,
                    stats.congresso.analises,
                  ],
                ]}
              />
              <p className="text-[.85em] text-text-soft">
                {N(stats.municipal.analises + stats.congresso.analises)} análises publicadas ao
                todo —{" "}
                {(
                  ((stats.municipal.analises + stats.congresso.analises) /
                    (stats.municipal.atosOficiais +
                      stats.municipal.proposicoes +
                      stats.congresso.proposicoes)) *
                  100
                ).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}
                % do universo combinado das três origens. A predominância de rótulos
                &ldquo;neutro&rdquo; entre os analisados não é falha: boa parte da produção
                legislativa municipal é denominação de rua e ato administrativo, e a instrução
                do modelo manda devolver lista vazia nesses casos em vez de forçar uma
                classificação que não existe.
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">
            A análise de vício legislativo — em construção
          </h3>
          <p className="text-text-soft">
            Pergunta diferente da anterior: não <em>o que a norma faz com os direitos</em>, mas{" "}
            <em>se ela foi feita do jeito certo, por quem tinha competência para fazê-la</em>.
            Cinco categorias — vício de iniciativa, vício de competência, inconstitucionalidade
            material, vício formal, contrabando legislativo (&ldquo;jabuti&rdquo;, ainda
            documentado mas não aplicado por falta de dado de tramitação). A palavra{" "}
            <strong className="text-text">&ldquo;indício&rdquo;</strong>
            {" "}é obrigatória na
            própria régua: nada aqui pode virar veredito — controle de constitucionalidade é
            função do Judiciário, e a lista de rótulos possíveis nem contém a palavra
            &ldquo;inconstitucional&rdquo;. Cobertura hoje:{" "}
            {stats
              ? `${N(stats.municipal.vicios)} análises municipais e ${N(stats.congresso.vicios)} do Congresso`
              : "uma primeira leva de calibração"}{" "}
            — é calibração, não levantamento.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">
            A taxa de erro do mapa 3D de terras públicas
          </h3>
          <p className="text-text-soft">
            É a única frente do portal cujo número principal é estimativa de método próprio, e
            não leitura direta de fonte oficial — por isso é a única que publica a taxa de erro
            dentro do próprio cartão de apresentação. &ldquo;Vazio cadastral&rdquo; significa
            área que nenhum imóvel rural declarou no Cadastro Ambiental Rural; o CAR é
            autodeclaratório, então ausência de declaração não é ausência de dono, e muito
            menos prova de que a terra é pública.
          </p>
          <TaxaDeErroTerras />
        </div>
      </section>

      {/* ═══ 5. A PARTE TÉCNICA ═══ */}
      <section className="space-y-5">
        <h2 className="font-display text-2xl font-semibold">A parte técnica</h2>

        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">O portal é estático</h3>
          <p className="text-text-soft">
            Não há banco de dados em produção. O comando de build lê o Postgres uma única vez
            e transforma tudo em HTML pré-renderizado, publicado como arquivo — uma visita ao
            site não toca em banco nenhum. A vantagem é dupla: sem banco em produção não há
            custo de banco nem indisponibilidade por sobrecarga de consulta; a contrapartida é
            que o site só muda quando alguém reconstrói, o que roda numa rotina agendada
            (coleta → build → trava de contagem de páginas → publicação), que recusa publicar
            se a contagem de páginas cair abaixo de um piso ou encolher demais em relação à
            publicação anterior — o sinal de que algo saiu errado na coleta, não no build.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-[.85em]">
            <tbody>
              {[
                ["Aplicação web", "Next.js (App Router), React"],
                ["Acesso a dados", "Drizzle ORM sobre PostgreSQL"],
                ["Publicação", "Cloudflare Workers, via adaptador OpenNext"],
                ["Coleta", "Python 3.12, ~150 arquivos em três pacotes de ETL"],
                ["Esquema do banco", "migrations SQL numeradas, em quatro pacotes"],
                ["Testes automatizados", "biblioteca TypeScript + suíte do globo 3D"],
                ["Publicação alternativa", "export estático para GitHub Pages, sem servidor"],
                ["Código", "AGPL-3.0-or-later, repositório público"],
              ].map(([k, v]) => (
                <tr key={k} className="border-t border-border first:border-t-0">
                  <td className="px-3 py-2 font-medium text-text">{k}</td>
                  <td className="px-3 py-2 text-text-soft">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-text-soft">
          O dado é público; o código que o organiza também —{" "}
          <a
            href="https://github.com/FinweeJur/controle-popular"
            target="_blank"
            rel="noreferrer noopener"
            className="text-primary hover:text-accent"
          >
            github.com/FinweeJur/controle-popular
          </a>
          .
        </p>
      </section>

      {/* ═══ 6. O QUE AINDA FALTA ═══ */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">O que ainda falta</h2>
        <p className="text-text-soft">
          Parte do produto, não um apêndice. A cobertura entre as seis cidades é desigual —
          algumas lacunas são de acesso (fonte que exige protocolo ou tem certificado
          incompleto), outras são limite estrutural da própria fonte (um sistema municipal que
          devolve total por órgão, não nome por nome). Votações nominais do Congresso e de
          câmaras municipais estão em zero linhas hoje: a frente anuncia a função, e o código
          da rota registra que a tabela ainda está vazia. A projeção de vacância do Judiciário
          é parcial, porque depende de data de nascimento levantada nome a nome. A cobertura da
          análise garantista é de poucos por cento do acervo total — ampliá-la é trabalho de
          execução, o método já está validado.
        </p>
        <p className="text-[.85em] text-text-soft">
          Declarar a lacuna é conteúdo; disfarçá-la é defeito. É a mesma régua que rege todo o
          resto desta página.
        </p>
      </section>
    </main>
  );
}

function TabelaVolume({
  titulo,
  linhas,
}: {
  titulo: string;
  linhas: [string, number][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <caption className="border-b border-border bg-surface-2 px-3 py-2 text-left font-semibold text-text">
          {titulo}
        </caption>
        <tbody>
          {linhas.map(([label, valor]) => (
            <tr key={label} className="border-t border-border first:border-t-0">
              <td className="px-3 py-1.5 text-text-soft">{label}</td>
              <td className="px-3 py-1.5 text-right font-mono text-text">
                {formatNumberBR(valor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
