import type { Metadata } from "next";
import NextLink from "next/link";
import { CATALOGO_EIXOS } from "@/lib/eixos/catalogo";
import { listarCidades } from "@/lib/db/queries/municipios";
import { obterEstatisticasPortal } from "@/lib/betim/estatisticas-portal";
import { formatNumberBR } from "@/lib/betim/format";
import FooterGlobal from "@/app/components/FooterGlobal";
import TaxaDeErroTerras from "@/app/[municipio]/components/TaxaDeErroTerras";
import { metadataEditavel } from "@/lib/edicoes";
import { Epigrafe } from "@/app/components/Epigrafe";
import { citacaoPorId } from "@/lib/citacoes";

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

  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl space-y-14 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <NextLink href="/" className="hover:text-primary">
          Início
        </NextLink>{" "}
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
          O Controle Popular é o portal público do ONSA — Observatório Nacional
          Socioambiental. Com raízes na História e Geografia, este portal se utiliza da
          tecnologia da Inteligência Artificial pra somar na busca por justiça
          socioambiental e fiscalização cidadã, acessível pela internet, gratuitamente
          e sem cadastro, por qualquer celular ou computador.
        </p>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Reunindo dezenas de portais e dados públicos, estamos cobrindo milhares de
          contratos, convênios, licenciamentos ambientais, pesquisas e autorizações
          minerárias e de barragens, legislação ambiental e de direitos humanos
          unificada, e o orçamento detalhado das prefeituras, governo de Minas,
          Congresso Brasileiro e Instituições de Justiça.
        </p>
        {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (/sobre · abertura) */}
        <Epigrafe
          citacao={citacaoPorId("carolina-mundo-modificar")!}
          variante="inicio"
          className="max-w-2xl"
        />
      </header>

      <SecaoInspiracoes />
      {/* ═══ 1. O QUE É ═══ */}
      <section className="space-y-3">
        <p className="rounded-lg border border-border bg-surface-2 p-4 text-[.95em] text-text-soft">
          A regra que organiza o projeto inteiro: <strong className="text-text">todo
          número exibido tem fonte identificável, e todo número que resulta de estimativa
          aparece com a taxa de erro ao lado</strong>. Quando não há dado, a tela diz que não
          há — não preenche o espaço com uma aproximação silenciosa. Um portal que cobra
          procedência dos outros não pode publicar número sem procedência própria.
        </p>
      </section>

      <SecaoHonestidadeIA />
      <SecaoEixos totalCidades={cidades.length} nomesCidades={nomesCidades} stats={stats} />
      {/* O card "Inspirações e Referências" foi movido para logo após a
          epígrafe da Carolina Maria de Jesus, no topo desta página. */}

      <SecaoMetodologia stats={stats} />
      <SecaoTecnica />
      <SecaoFalta />
      <FooterGlobal />
    </main>
  );
}

/**
 * Estatisticas do build, como vieram de obterEstatisticasPortal().
 * O guard `(stats && ...)` de cada secao ja trata o caso de banco fora.
 */
type StatsPortal = Awaited<ReturnType<typeof obterEstatisticasPortal>>;

/**
 * Secao: inspiracoes e referencias das organizacoes que embasaram o portal.
 * Conteudo editorial estatico (sem banco). Extraiu de SobrePage porque o
 * metodo tinha ~590 linhas — hotspot CodeScene, saude 7.27 (PENDENCIAS-07-10).
 */
function SecaoInspiracoes() {
  return (
    <>
          {/* ═══ INSPIRAÇÕES E REFERÊNCIAS — logo após a Carolina Maria de Jesus ═══ */}
    <section className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold">
        Inspirações e Referências
      </h2>
      <p className="text-text-soft">
        O nome <strong className="text-text">Controle Popular</strong> não é
        invenção de marketing. Vem de uma palavra de ordem do{" "}
        <a
          href="https://mab.org.br/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          Movimento dos Atingidos por Barragens (MAB)
        </a>
        : &ldquo;Água e energia com soberania, distribuição da riqueza e
        controle popular&rdquo;.
      </p>
      <p className="text-text-soft">
        Do MAB vem a postura da frente ambiental. Ele nos ensinou a cobrar
        reparação pelos{" "}
        <NextLink
          href="/ambiental/crimes-socioambientais"
          className="text-primary hover:text-accent"
        >
          crimes socioambientais
        </NextLink>
        , reunidos num acervo aberto; a acompanhar as outorgas de água; a{" "}
        <NextLink href="/ambiental/barragens" className="text-primary hover:text-accent">
          fiscalizar as barragens
        </NextLink>{" "}
        e a vigiar o{" "}
        <NextLink href="/ambiental/licenciamento" className="text-primary hover:text-accent">
          licenciamento ambiental
        </NextLink>
        .
      </p>
      <p className="text-text-soft">
        A{" "}
        <NextLink
          href="/direitos-em-movimento/educacao"
          className="text-primary hover:text-accent"
        >
          página de educação
        </NextLink>
        , entre outras, foi inspirada no{" "}
        <a
          href="https://levante.org.br/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          Levante Popular da Juventude
        </a>
        . A{" "}
        <NextLink
          href="/direitos-em-movimento/saude-publica"
          className="text-primary hover:text-accent"
        >
          página de saúde
        </NextLink>
        , entre outras, foi inspirada no{" "}
        <a
          href="https://brasilpopular.org/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          Movimento Brasil Popular
        </a>
        . E a inspiração{" "}
        <NextLink href="/tecnologia" className="text-primary hover:text-accent">
          tecnológica
        </NextLink>{" "}
        hacker pra criar redes mais justas e{" "}
        <NextLink
          href="/tecnologia#catalogo-titulo"
          className="text-primary hover:text-accent"
        >
          software livre
        </NextLink>{" "}
        mais acessível veio da{" "}
        <a
          href="https://codigonaobinario.org/"
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary hover:text-accent"
        >
          Código Não Binário
        </a>
        , organização que bate de frente com as Big Techs quando é pra falar de
        IA.
      </p>
      <p className="text-text-soft">
        E ao <strong className="text-text">Instituto Esperança Maria</strong>, pelas
        experiências em educação ambiental de direitos humanos, que agora dão luz
        a esse portal. Sem essas organizações cobrando por justiça e direitos nas
        florestas, nas águas, no campo, na cidade e nas redes, esse portal não
        existiria.
      </p>
    </section>
    </>
  );
}

/**
 * Secao: honestidade sobre IA — a doutrina "o modelo extrai, o programa
 * calcula". Estatica; ver comentario de SecaoInspiracoes.
 */
function SecaoHonestidadeIA() {
  return (
    <>
          {/* ═══ 2. HONESTIDADE SOBRE IA — a seção mais importante desta página ═══ */}
    <section className="space-y-4 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
      <h2 className="font-display text-2xl font-semibold">
        Site em desenvolvimento e uso de Inteligência Artificial
      </h2>
      <p className="text-text-soft">
        Site em desenvolvimento, aberto para acesso, colaboração e revisão. Os
        dados ainda estão sendo conferidos e podem conter erros.
      </p>
      <p className="text-text-soft">
        O site foi feito com auxílio de Inteligência Artificial - IA, como
        modelos de linguagem como <strong className="text-text">Deepseek</strong>,{" "}
        <strong className="text-text">Mimo</strong>,{" "}
        <strong className="text-text">Claude</strong> e ferramentas como{" "}
        <strong className="text-text">OpenCode</strong>, entre outras.
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
        <NextLink href="/ambiental/legislacao" className="text-primary hover:text-accent">
          /ambiental/legislacao
        </NextLink>{" "}
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
        A atribuição de tema da legislação é o exemplo do padrão que este projeto adota
        consigo mesmo: até 13/08/2026, a página de{" "}
        <NextLink href="/ambiental/legislacao" className="text-primary hover:text-accent">
          legislação e precedentes por tema de direito
        </NextLink>{" "}
        chamava a atribuição de tema de &ldquo;leitura humana&rdquo;; hoje a página diz o
        que é — leitura assistida por IA, registrada linha a linha com o trecho que
        sustenta cada tema — e declara que está em revisão. Quem cobra procedência dos
        outros deve o mesmo padrão sobre si: dizer de onde cada coisa vem, na própria
        tela em que aparece.
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
    </>
  );
}

/**
 * Secao: os 4 eixos, subfrentes e o volume publicado (tabelas do banco).
 * stats null/undefined = banco fora do build; publica so a lista de cidades.
 */
function SecaoEixos({
  totalCidades,
  nomesCidades,
  stats,
}: {
  totalCidades: number;
  nomesCidades: string;
  stats: StatsPortal;
}) {
  const N = formatNumberBR;

  return (
    <>
          {/* ═══ 3. OS 4 EIXOS E AS SUBFRENTES ═══ (era "as 6 frentes") */}
    <section className="space-y-5">
      <h2 className="font-display text-2xl font-semibold">
        Os 4 Grandes Eixos e as subfrentes
      </h2>
      <p className="text-text-soft">
        O portal se organiza em <strong className="text-text">quatro grandes eixos
        temáticos</strong> e mais de <strong className="text-text">36 subfrentes</strong>.
        Cada subfrente é uma porta de entrada para dado concreto — clique para abrir. A
        lista canônica vive em{" "}
        <code className="font-mono text-[.85em]">lib/eixos/catalogo.ts</code>.
      </p>

      <div className="space-y-6">
        {Object.values(CATALOGO_EIXOS).map((eixo) => (
          <div key={eixo.id}>
            <h3 className="font-display text-lg font-semibold">{eixo.titulo}</h3>
            <p className="text-[.9em] text-text-soft">{eixo.subtitulo}</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {eixo.subfrentes.map((sub) => {
                const href =
                  sub.rotaLegada ??
                  (eixo.id === "terra"
                    ? `/terra-e-territorios/${sub.slug}`
                    : eixo.id === "estado"
                      ? `/estado-e-economia/${sub.slug}`
                      : eixo.id === "central"
                        ? `/central/${sub.slug}`
                        : `/direitos-em-movimento/${sub.slug}`);
                return (
                  <a
                    key={sub.id}
                    href={href}
                    className="group rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary"
                  >
                    <span className="font-display text-[.95em] font-semibold group-hover:text-primary">
                      {sub.titulo}
                    </span>
                    <span className="block text-[.82em] text-text-soft">
                      {sub.descricao}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ TERMO DE USO DE IA — unificado logo após os links das subfrentes ═══ */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-lg font-semibold">
          Termo de uso de Inteligência Artificial
        </h3>
        <p className="mt-1 text-[.95em] text-text-soft">
          O portal usa IA para <strong className="text-text">ler texto</strong> e extrair
          campos — nunca para escrever número nem opinar. A política completa, com onde a
          IA entra e onde ela não entra, está em{" "}
          <NextLink href="/politica-de-ia" className="text-primary hover:text-accent">
            /politica-de-ia
          </NextLink>
          .
        </p>
      </div>

      <p className="text-[.9em] text-text-soft">
        {totalCidades} cidades estão publicadas hoje: <strong className="text-text">{nomesCidades}</strong>.
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
    </>
  );
}

/**
 * Secao: metodologia (fonte do dado, garantista, vicio, taxa de erro).
 * Precisa de stats para as coberturas; guard `stats &&` cuida do resto.
 */
function SecaoMetodologia({ stats }: { stats: StatsPortal }) {
  const N = formatNumberBR;

  return (
    <>
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
              &ldquo;neutro&rdquo; entre os analisados tem explicação direta: boa parte da produção
              legislativa municipal é denominação de rua e ato administrativo, e a instrução
              do modelo manda devolver lista vazia nesses casos em vez de forçar uma
              classificação que não existe.
            </p>
          </>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">
          A análise de vício legislativo
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
          autodeclaratório, então ausência de declaração não é ausência de titular, e muito
          menos prova de que a terra é pública.
        </p>
        <TaxaDeErroTerras />
      </div>
    </section>
    </>
  );
}

/**
 * Secao: a parte tecnica (pre-renderizacao, stack, repositorio).
 * Estatica; ver comentario de SecaoInspiracoes.
 */
function SecaoTecnica() {
  return (
    <>
          {/* ═══ 5. A PARTE TÉCNICA ═══ */}
    <section className="space-y-5">
      <h2 className="font-display text-2xl font-semibold">A parte técnica</h2>

      <div className="space-y-3">
        <h3 className="font-display text-lg font-semibold">O site é pré-renderizado</h3>
        <p className="text-text-soft">
          Uma visita ao site não consulta banco nenhum. O comando de build lê o Postgres
          (hoje no Guara Cloud, num datacenter em São Paulo) uma única vez e transforma tudo
          em HTML pré-renderizado. A vantagem é dupla: sem consulta ao banco em cada visita
          não há custo por acesso nem indisponibilidade por sobrecarga; a contrapartida é
          que o site só muda quando alguém reconstrói, o que roda numa rotina agendada
          (coleta → build → trava de contagem de páginas → publicação), que recusa publicar
          se a contagem de páginas cair abaixo de um piso ou encolher demais em relação à
          publicação anterior — o sinal de que a coleta precisa de revisão antes de virar
          número na tela.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-[.85em]">
          <tbody>
            {[
              ["Aplicação web", "Next.js (App Router), React"],
              ["Acesso a dados", "Drizzle ORM sobre PostgreSQL"],
              ["Publicação", "Guara Cloud (principal) e Cloudflare Workers (fallback)"],
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
    </>
  );
}

/**
 * Secao: o que ainda falta — declaracao de lacunas de cobertura.
 * Estatica; ver comentario de SecaoInspiracoes.
 */
function SecaoFalta() {
  return (
    <>
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
      {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (/sobre · travessia) */}
      <Epigrafe citacao={citacaoPorId("rosa-travessia")!} variante="inicio" />
      {/* EPÍGRAFE EDITORIAL — citação autorizada no PLANO-COPY-VOZ.md (/sobre · fecho) */}
      <Epigrafe citacao={citacaoPorId("evaristo-abrir-caminhos")!} variante="inicio" />
    </section>
    </>
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
