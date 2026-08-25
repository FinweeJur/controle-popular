import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import {
  ACHADOS_POR_TEMA,
  ACHADOS_POR_TIPO_UNIDADE,
  COBERTURA_INSPECOES,
  GABINETES_NOMEADOS,
  PENDENCIAS_POR_ANO,
  SERIE_TJMG,
  TEMA_ROTULOS,
} from "@/lib/judiciario/inspecoes-cnj";
import {
  COBRANCAS_POR_INSPECAO,
  ORGAOS_INSPECIONADOS,
  PENDENCIAS_TJMG,
  RELATORIOS_TJMG,
} from "@/lib/judiciario/inspecoes-cnj-dados";
import TabelaAchados from "./TabelaAchados";

/**
 * `/judiciario/inspecoes` — o que a Corregedoria Nacional de Justiça encontrou
 * dentro do Tribunal de Justiça de Minas Gerais.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ═══
 *
 * O eixo `/judiciario` sabia dizer **quem ocupa a cadeira** (composição, quinto
 * constitucional, projeção de vacância). Não sabia dizer **se a instituição
 * está funcionando**. O acervo de inspeções do CNJ responde isso, unidade por
 * unidade — e estava a uma rota de distância de onde a sondagem procurou.
 *
 * ═══ RESUMO PRÓPRIO, NUNCA CÓPIA ═══
 *
 * O relatório de 2026 tem 1.388 páginas e 2,9 milhões de caracteres. Este
 * portal **não hospeda o PDF**: publica trecho (até 600 caracteres por seção),
 * contagem própria e link permanente para o CNJ. Duas razões, e as duas são
 * medidas: é obra de terceiro, e o CNJ publicou **6 CPFs de particulares**
 * dentro do documento — já redigidos na origem pelo coletor, mas espelhar o
 * PDF reintroduziria o problema por outra porta.
 *
 * ═══ O VIÉS QUE A PÁGINA TEM DE DECLARAR ═══
 *
 * A equipe de inspeção **escolheu** quais unidades visitar. "A vara X tem mais
 * achados" pode significar que ela foi mais olhada. Por isso não há ranking de
 * "pior vara" em lugar nenhum desta página — há distribuição por tipo de
 * unidade, com a ressalva na mesma frase.
 */

const C = COBERTURA_INSPECOES;

export const metadata: Metadata = metadataEditavel("/judiciario/inspecoes", {
  title: "O que o CNJ encontrou dentro do TJMG — Controle Popular · Judiciário",
  description:
    `A Corregedoria Nacional de Justiça inspeciona o Tribunal de Justiça de Minas Gerais e publica o que encontra, unidade por unidade. São ${RELATORIOS_TJMG.length} relatórios de 2012 a 2026; o mais recente tem ${formatNumberBR(C.tjmg.paginas2026)} páginas e examinou ${C.tjmg.unidadesDistintas} unidades. Resumo próprio, com link para o documento oficial.`,
});

const TEMAS_ORDENADOS = Object.entries(ACHADOS_POR_TEMA).sort((a, b) => b[1] - a[1]);
const MAX_TEMA = Math.max(...TEMAS_ORDENADOS.map(([, n]) => n), 1);

const TIPOS_ORDENADOS = Object.entries(ACHADOS_POR_TIPO_UNIDADE).sort(
  (a, b) => b[1].secoes - a[1].secoes,
);

/** Minas Gerais primeiro (e' o recorte do portal), depois por volume. */
const ORGAOS_ORDENADOS = [...ORGAOS_INSPECIONADOS].sort((a, b) => {
  const mgA = a.slug.includes("minas-gerais") ? 0 : 1;
  const mgB = b.slug.includes("minas-gerais") ? 0 : 1;
  return mgA - mgB || b.relatorios - a.relatorios;
});

const ROTULO_TIPO: Record<string, string> = {
  vara: "Varas",
  juizado: "Juizados",
  gabinete: "Gabinetes de desembargador",
  turma: "Turmas recursais",
  serventia: "Serventias extrajudiciais",
  "orgao-central": "Órgãos centrais do tribunal",
  outra: "Outras",
};

function Cartao({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="font-display text-[1.9em] leading-none font-bold text-text tabular-nums">
        {valor}
      </p>
      <p className="mt-2 text-[.92em] font-semibold text-text">{rotulo}</p>
      {nota && <p className="mt-1 text-[.82em] leading-relaxed text-text-soft">{nota}</p>}
    </div>
  );
}

export default function InspecoesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/judiciario" className="hover:text-primary">
          Judiciário
        </a>{" "}
        · <span className="text-text">Inspeções da Corregedoria Nacional</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Judiciário · Fiscalização
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          O que o CNJ encontrou dentro do Tribunal de Justiça de Minas Gerais
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          De tempos em tempos, uma equipe da Corregedoria Nacional de Justiça entra num tribunal,
          abre processo por processo em varas escolhidas e escreve o que achou. O documento é
          público e ninguém lê: o mais recente sobre o TJMG tem{" "}
          <strong className="text-text">{formatNumberBR(C.tjmg.paginas2026)} páginas</strong>. Esta
          página é o resumo — com o link para o original em cada linha.
        </p>
      </header>

      {/* ═══ CARTÕES ═══ */}
      <section aria-label="Números do acervo" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          valor={String(RELATORIOS_TJMG.length)}
          rotulo="relatórios sobre o TJMG"
          nota={`inspeções de ${C.tjmg.anoMaisAntigo} a ${C.tjmg.anoMaisRecente}`}
        />
        <Cartao
          valor={String(C.tjmg.unidadesDistintas)}
          rotulo="unidades examinadas em 2026"
          nota="varas, juizados, gabinetes e órgãos centrais"
        />
        <Cartao
          valor={String(C.tjmg.secoesComConteudo)}
          rotulo="seções com achado"
          nota={`mais ${C.tjmg.secoesSemAchado} em que a equipe registrou não haver achado`}
        />
        <Cartao
          valor={formatNumberBR(C.totalRelatorios)}
          rotulo="relatórios no Brasil"
          nota={`${C.totalOrgaos} órgãos, 2008 a 2026`}
        />
      </section>

      {/* ═══ DECLARAÇÃO ═══ */}
      <section
        aria-labelledby="declaracao-inspecoes"
        className="mt-8 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="declaracao-inspecoes" className="font-display text-base font-semibold text-text">
          De quem é este documento, e o que esta página não faz
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] leading-relaxed text-text-soft">
          <li>
            <strong className="text-text">O documento é do CNJ, não deste portal.</strong>{" "}
            Relatório de Inspeção Ordinária no TJMG, processo{" "}
            <span className="tabular-nums">{C.tjmg.processoCnj}</span>, {C.tjmg.portaria}, assinado
            em 08/07/2026.{" "}
            <a
              href={C.tjmg.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-accent"
            >
              Baixar o PDF oficial ↗
            </a>
          </li>
          <li>
            <strong className="text-text">Não hospedamos cópia.</strong> Cada linha traz um trecho
            de até 600 caracteres e o link para a origem. O relatório inteiro tem 2,9 milhões de
            caracteres.
          </li>
          <li>
            <strong className="text-text">A equipe escolheu quais unidades visitar.</strong> Uma
            unidade com muitos achados pode simplesmente ter sido mais olhada — por isso esta
            página mostra <em>distribuição</em>, e não ranking de &ldquo;pior vara&rdquo;. O
            documento não explica o critério de escolha.
          </li>
          <li>
            <strong className="text-text">
              Foram lidas {C.tjmg.secoesLidasNoCorpo} seções
            </strong>{" "}
            — mais do que as {C.tjmg.secoesNoSumario} que o sumário lista, porque parte dos
            achados das unidades administrativas fica em subseções que o sumário não indexa.
            Uma primeira versão desta leitura perdia os capítulos de Precatórios, unidades
            administrativas e tecnologia inteiros: <strong className="text-text">cerca de 45% do
            relatório</strong>. Está corrigido, e o registro fica aqui porque um leitor tem
            direito de saber que a conta já esteve errada.
          </li>
          <li>
            <strong className="text-text">Só o relatório de 2026 está aberto aqui.</strong> Os
            outros {RELATORIOS_TJMG.length - 1} têm formatos diferentes entre si e a extração deles
            está em andamento — e um deles, de 2017, é digitalizado e não tem texto que possa ser
            lido por máquina.
          </li>
        </ul>
      </section>

      {/* ═══ O QUE ESTÁ ESCRITO LÁ DENTRO ═══ */}
      <section aria-labelledby="leitura" className="mt-12">
        <h2 id="leitura" className="font-display text-xl font-bold text-text">
          O que está escrito lá dentro
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Quatro achados do relatório de 2026, com as palavras do próprio CNJ. Não são os únicos
          — são os que mexem com liberdade e com dinheiro de quem espera.
        </p>

        <div className="mt-5 space-y-5">
          {[
            {
              titulo: "Quem é preso em flagrante em Belo Horizonte dorme mais uma noite preso",
              corpo:
                "Nas duas Varas de Garantias da capital, a pessoa presa só é conduzida à audiência de custódia no dia seguinte. Quando o juiz concede liberdade com tornozeleira, ela volta ao presídio — porque o monitoramento só é instalado no dia posterior. O CNJ calcula que isso atinge 46% dos presos em flagrante.",
              citacao:
                "quase 500(quinhentos) presos são incluídos mensalmente no sistema prisional desnecessariamente. A rotina é claramente contraproducente",
            },
            {
              titulo: "Pedidos de fim de pena parados há anos",
              corpo:
                "Na Vara de Execuções Penais de Belo Horizonte, no regime aberto, o relatório registra 5.226 incidentes pendentes de decisão há mais de 90 dias — o mais antigo desde janeiro de 2018. Entre as pendências detalhadas há 1.544 pedidos de término de pena, 921 de progressão e 495 de livramento condicional.",
              citacao: null,
            },
            {
              titulo: "O CNJ mandou, e sete anos depois repete a mesma frase",
              corpo:
                "No capítulo de Precatórios, sob o título “Não cumprimento de determinações nas inspeções ano 2019, 2022 e 2023”, o relatório de 2026 registra que determinações de três inspeções anteriores continuam pendentes.",
              citacao:
                "passados sete anos desde a primeira inspeção, não foram adotadas providências efetivas pela Presidência do Tribunal de Justiça de Minas Gerais",
            },
            {
              titulo: "O tribunal não conseguiu informar sobre si mesmo",
              corpo:
                "Num dos juizados de violência doméstica, a equipe de inspeção tentou descobrir quantas ações penais foram distribuídas no ano. O painel de dados do próprio TJMG não respondeu, e a chefia de cartório informou que também não tinha o número. A informação só apareceu depois de intervenção junto ao tribunal.",
              citacao: null,
            },
          ].map((a) => (
            <article key={a.titulo} className="rounded-2xl border border-border p-5">
              <h3 className="font-display text-[1.05em] font-semibold text-text">{a.titulo}</h3>
              <p className="mt-2 text-[.94em] leading-relaxed text-text-soft">{a.corpo}</p>
              {a.citacao && (
                <blockquote className="mt-3 border-l-2 border-primary pl-4 text-[.94em] leading-relaxed text-text">
                  “{a.citacao}”
                  <footer className="mt-1 text-[.85em] text-text-soft">
                    — Relatório de Inspeção Ordinária no TJMG, CNJ, 2026
                  </footer>
                </blockquote>
              )}
            </article>
          ))}
        </div>

      </section>

      {/* ═══ OS GABINETES NOMEADOS ═══ */}
      <section aria-labelledby="gabinetes" className="mt-12">
        <h2 id="gabinetes" className="font-display text-xl font-bold text-text">
          Os {GABINETES_NOMEADOS.length} gabinetes que o relatório nomeia
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Em segunda instância, o processo fica no gabinete de um desembargador. O relatório
          examina gabinete por gabinete e diz de quem é cada achado — quem não atingiu a Meta 1
          do CNJ, quem tem réu preso esperando julgamento, quem acumula processo sem decisão.
          Abaixo, com as palavras do próprio CNJ.
        </p>
        <p className="mt-3 max-w-3xl text-[.9em] leading-relaxed text-text-soft">
          <strong className="text-text">Isto não é um ranking, e a diferença importa:</strong> a
          equipe escolheu quais gabinetes visitar, então estar nesta lista significa ter sido
          examinado — não significa ser o pior. Quem não aparece pode simplesmente não ter
          recebido visita.
        </p>

        <ul className="mt-5 space-y-4">
          {GABINETES_NOMEADOS.map((g) => (
            <li key={`${g.titular}-${g.secao}`} className="rounded-2xl border border-border p-4">
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-display text-[1.02em] font-semibold text-text">
                  Desembargador(a) {g.titular}
                </span>
                <span className="text-[.85em] text-text-soft">§ {g.secao}</span>
              </p>
              <p className="mt-2 text-[.92em] leading-relaxed text-text-soft">{g.trecho}</p>
              <a
                href={C.tjmg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-[.85em] text-primary underline underline-offset-2 hover:text-accent"
              >
                Ler no relatório oficial do CNJ (PDF) ↗
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-5 max-w-3xl text-[.88em] leading-relaxed text-text-soft">
          <strong className="text-text">Por que nomeamos.</strong> São agentes públicos no
          exercício da função, o fato está num relatório público do Conselho Nacional de Justiça,
          e cada linha traz o link do documento. Descrever o achado sem dizer de quem ele é
          protegeria o magistrado — não a pessoa cujo processo está parado.
        </p>
        <p className="mt-3 max-w-3xl text-[.88em] leading-relaxed text-text-soft">
          Achou erro factual? O caminho, as regras e o limite do que este portal pode corrigir ou
          remover estão em{" "}
          <a href="/termos" className="text-primary underline underline-offset-2 hover:text-accent">
            /termos
          </a>{" "}
          (seções 5 e 6). Para pedido que envolva dado pessoal, o canal reservado é{" "}
          <a
            href="mailto:contato@controlepopular.com.br"
            className="text-primary underline underline-offset-2 hover:text-accent"
          >
            contato@controlepopular.com.br
          </a>
          .
        </p>
      </section>

      {/* ═══ GRÁFICO: temas ═══ */}
      <section aria-labelledby="temas-inspecao" className="mt-12">
        <h2 id="temas-inspecao" className="font-display text-xl font-bold text-text">
          Sobre o que o CNJ escreveu
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          Cada seção pode tratar de mais de um assunto, então a soma passa do total de seções. A
          classificação é por regra fixa de vocabulário, aplicada igual a todos os anos — não por
          leitura de IA, que rotularia de forma diferente em documentos diferentes e inventaria
          tendência.
        </p>

        <ul className="mt-5 space-y-2">
          {TEMAS_ORDENADOS.map(([chave, n]) => (
            <li key={chave} className="flex items-center gap-3 text-[.92em]">
              <span className="w-64 shrink-0 text-text-soft">{TEMA_ROTULOS[chave] ?? chave}</span>
              <span
                className="h-4 rounded-sm bg-primary"
                style={{ width: `${Math.max(2, (n / MAX_TEMA) * 100)}%`, maxWidth: "60%" }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-text">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══ DISTRIBUIÇÃO POR TIPO DE UNIDADE ═══ */}
      <section aria-labelledby="onde-inspecao" className="mt-12">
        <h2 id="onde-inspecao" className="font-display text-xl font-bold text-text">
          Onde estão os achados
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          A maior parte do que a equipe escreveu está na{" "}
          <strong className="text-text">primeira instância</strong> — nas varas e juizados por onde
          passa o processo de quem procura a Justiça, e não nos gabinetes de desembargador. Vale
          lembrar, na mesma frase, que a equipe escolheu onde entrar: isto descreve o que foi
          inspecionado, não o tribunal inteiro.
        </p>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[36em] border-collapse text-left text-[.92em]">
            <thead className="bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold text-text">
                  Tipo de unidade
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold text-text">
                  Unidades
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold text-text">
                  Seções com achado
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold text-text">
                  Texto escrito
                </th>
              </tr>
            </thead>
            <tbody>
              {TIPOS_ORDENADOS.map(([tipo, d]) => (
                <tr key={tipo} className="border-t border-border">
                  <td className="px-3 py-2 text-text">{ROTULO_TIPO[tipo] ?? tipo}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-soft">{d.unidades}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-soft">{d.secoes}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-soft">
                    {formatNumberBR(d.caracteres)} car.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ═══ A TABELA COMPLETA (cliente) ═══ */}
      <TabelaAchados />

      {/* ═══ A SÉRIE ═══ */}
      <section aria-labelledby="serie" className="mt-14">
        <h2 id="serie" className="font-display text-xl font-bold text-text">
          Quanto o CNJ escreveu, ano a ano
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Cada barra é o número de determinações e recomendações que a equipe registrou naquela
          inspeção. Não é medida de qualidade do tribunal: uma inspeção que visita mais unidades
          escreve mais, e o CNJ decide a cada vez onde entrar e quanto detalhar.
        </p>

        <ul className="mt-5 space-y-3">
          {SERIE_TJMG.map((a) => (
            <li key={a.ano} className="flex items-center gap-3 text-[.92em]">
              <span className="w-12 shrink-0 tabular-nums font-semibold text-text">{a.ano}</span>
              <span
                className="h-5 rounded-sm bg-primary"
                style={{
                  width: `${Math.max(2, ((a.itens ?? 0) / Math.max(...SERIE_TJMG.map((x) => x.itens ?? 0))) * 100)}%`,
                  maxWidth: "58%",
                }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-text">{a.itens}</span>
              <span className="text-text-soft">
                itens em {a.unidades} unidades{" "}
                {a.semTema !== null && a.semTema > 0.2 && (
                  <span className="ml-2 text-[.9em]">
                    · {Math.round(a.semTema * 100)}% sem tema reconhecido
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-5 text-[.9em] leading-relaxed text-text-soft">
          <p>
            <strong className="text-text">Faltam anos nesta série, e o motivo é nosso.</strong>{" "}
            Três relatórios ficaram de fora porque a extração automática
            não se sustenta neles — cada ano tem um formato diferente, e forçar produziria número
            falso. Publicar 2017 ao lado de 2023 desenharia uma queda que seria defeito do nosso
            programa, não do tribunal.
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <strong className="text-text">2017</strong> — os dois relatórios daquele ano
              escrevem as determinações em prosa corrida, sem numerar item por item. Sem
              numeração não há como o programa saber onde um termina e o outro começa, nem como
              conferir se perdeu algum. Dos dois, saíram 3 unidades — de 149 que o sumário lista.
            </li>
            <li>
              <strong className="text-text">2017 (Sistemas Judiciais)</strong> — o PDF é
              digitalizado: 16 páginas de imagem, sem uma letra que uma máquina consiga ler.
            </li>
            <li>
              <strong className="text-text">2026</strong> — está fora <em>desta</em> contagem, e
              não do portal: por ter um formato próprio, ganhou leitura dedicada, que é a que
              alimenta o resto desta página. Somar os dois contaria o mesmo relatório duas vezes.
            </li>
          </ul>
          <p className="mt-3">
            <strong className="text-text">
              E os anos que entraram também não são igualmente comparáveis.
            </strong>{" "}
            A classificação por tema foi calibrada no vocabulário de 2026: em 2012 ela deixa 32%
            dos achados sem tema, contra 5% em 2023. Não é que 2012 tratasse de outra coisa — é que
            o CNJ escrevia com outras palavras.
          </p>
        </div>
      </section>

      {/* ═══ O QUE NÃO MUDOU ═══ */}
      <section aria-labelledby="pendencias" className="mt-14">
        <h2 id="pendencias" className="font-display text-xl font-bold text-text">
          O que não mudou de uma inspeção para a outra
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] leading-relaxed text-text-soft">
          Esta é a parte mais dura do documento, e não é conclusão nossa: em cada unidade, o
          relatório abre uma seção chamada{" "}
          <strong className="text-text">&ldquo;Pendências da última inspeção&rdquo;</strong>, lista
          o que a Corregedoria já tinha mandado fazer e registra o que continua por fazer. É o
          órgão cobrando a si mesmo, por escrito.
        </p>
        <p className="mt-3 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          São <strong className="text-text">{PENDENCIAS_POR_ANO[2023]} seções assim em 2023</strong>{" "}
          e <strong className="text-text">{PENDENCIAS_POR_ANO[2022]} em 2022</strong>.{" "}
          <strong className="text-text">Não publicamos aqui um placar</strong>{" "}
          de
          &ldquo;cumpridas&rdquo; contra &ldquo;não cumpridas&rdquo;: a palavra
          &ldquo;cumprida&rdquo; aparece dentro de &ldquo;não cumprida&rdquo;, e contar por busca de
          palavra produziria uma estatística inventada. O que está abaixo é o que o CNJ escreveu.
        </p>

        <ul className="mt-5 space-y-4">
          {/* ⚠️ Ordenar por TAMANHO traz as piores para ler: as seções mais longas
              são listas de número de processo ("(D.1) Supervisione os processos n.
              1.0000.06.439109/7-005, …"), que ocupam milhares de caracteres e não
              dizem nada a quem lê. O critério aqui é DENSIDADE DE PROSA — proporção
              de letras sobre o total —, que sobe as seções em que a Corregedoria
              efetivamente escreveu o que encontrou. */}
          {PENDENCIAS_TJMG.filter((p) => p.caracteres > 700)
            .map((p) => ({
              p,
              prosa: (p.trecho.replace(/[^A-Za-zÀ-ÿ ]/g, "").length / p.trecho.length),
            }))
            .sort((a, b) => b.prosa - a.prosa)
            .map(({ p }) => p)
            .slice(0, 6)
            .map((p) => (
              <li key={`${p.ano}-${p.secao}`} className="rounded-2xl border border-border p-4">
                <p className="flex flex-wrap items-baseline gap-x-3 text-[.88em]">
                  <span className="font-semibold tabular-nums text-text">{p.ano}</span>
                  <span className="font-medium text-text">{p.unidade}</span>
                  <span className="text-text-soft">§ {p.secao}</span>
                </p>
                <p className="mt-2 text-[.92em] leading-relaxed text-text-soft">{p.trecho}</p>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[.85em] text-primary underline underline-offset-2 hover:text-accent"
                >
                  Ler no relatório de {p.ano} (PDF do CNJ) ↗
                </a>
              </li>
            ))}
        </ul>

        <h3 className="mt-8 font-display text-lg font-semibold text-text">
          Quantas vezes o CNJ voltou a cobrar a mesma coisa
        </h3>
        <ul className="mt-3 space-y-2">
          {COBRANCAS_POR_INSPECAO.map((c) => (
            <li key={c.ano} className="flex items-center gap-3 text-[.92em]">
              <span className="w-12 shrink-0 tabular-nums font-semibold text-text">{c.ano}</span>
              <span
                className="h-4 rounded-sm bg-primary"
                style={{
                  width: `${Math.max(1, (c.cobrancas / 52) * 100)}%`,
                  maxWidth: "55%",
                }}
                aria-hidden="true"
              />
              <span className="tabular-nums text-text">{c.cobrancas}</span>
              <span className="text-text-soft">
                {c.ano === 2012
                  ? "— foi a primeira inspeção: não havia nada a cobrar"
                  : "trechos cobrando determinação anterior"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-3xl text-[.88em] leading-relaxed text-text-soft">
          <strong className="text-text">Estes números não se comparam entre si sem cuidado.</strong>{" "}
          Só 2022 e 2023 têm seções com o nome &ldquo;Pendências da última inspeção&rdquo;; 2019 e
          2026 cobram sem esse nome — em 2026, sob o título &ldquo;Não cumprimento de determinações
          nas inspeções ano 2019, 2022 e 2023&rdquo;. Contamos trechos de cobrança em cada
          documento, e cada documento escreve de um jeito.
        </p>

        <p className="mt-4 max-w-3xl text-[.88em] leading-relaxed text-text-soft">
          <strong className="text-text">A série tem dois pontos, não seis.</strong> Só os
          relatórios de 2022 e 2023 trazem seções com esse nome. Os de 2012, 2017, 2019 e 2026
          cobram a inspeção anterior de outras formas, e a extração desses ainda não está pronta.
        </p>
      </section>

      {/* ═══ OS OUTROS RELATÓRIOS DO TJMG ═══ */}
      <section aria-labelledby="serie-tjmg" className="mt-14">
        <h2 id="serie-tjmg" className="font-display text-xl font-bold text-text">
          Os {RELATORIOS_TJMG.length} relatórios sobre o TJMG
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          O CNJ cobra, na inspeção seguinte, o que determinou na anterior — por isso a série
          importa mais que qualquer relatório isolado. Todos são públicos e baixam sem cadastro.
          O ano ao lado é o da <strong className="text-text">inspeção</strong>, lido do título do
          documento: a data que o CNJ registra no acervo é a do dia em que ele subiu o arquivo, e
          dez dos treze foram carregados de uma vez só, em 30/09/2019.
        </p>
        <ul className="mt-5 divide-y divide-border rounded-2xl border border-border">
          {RELATORIOS_TJMG.map((r) => (
            <li key={r.url} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
              <span className="w-12 shrink-0 tabular-nums text-[.85em] font-semibold text-text">
                {r.anoInspecao ?? "—"}
              </span>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-[.95em] text-primary underline underline-offset-2 hover:text-accent"
              >
                {r.titulo} ↗
              </a>
              <span className="tabular-nums text-[.85em] text-text-soft">{r.megabytes} MB</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ═══ O ACERVO NACIONAL ═══ */}
      <section aria-labelledby="acervo-nacional" className="mt-14">
        <h2 id="acervo-nacional" className="font-display text-xl font-bold text-text">
          E os outros tribunais
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          O mesmo acervo cobre <strong className="text-text">{C.totalOrgaos} órgãos</strong> e{" "}
          <strong className="text-text">{formatNumberBR(C.totalRelatorios)} relatórios</strong>, de
          2008 a 2026. Este portal abriu por enquanto só o de Minas Gerais.
        </p>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[34em] border-collapse text-left text-[.9em]">
            <thead className="bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold text-text">
                  Órgão
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold text-text">
                  Relatórios
                </th>
              </tr>
            </thead>
            <tbody>
              {ORGAOS_ORDENADOS.map((o) => (
                <tr key={o.categoriaId} className="border-t border-border">
                  <td className="px-3 py-2 text-text-soft">{o.titulo}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-text-soft">
                    {o.relatorios}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-3xl text-[.88em] leading-relaxed text-text-soft">
          <strong className="text-text">Esta lista é piso, não total.</strong> O CNJ não publica
          rota que liste as categorias do acervo, então o universo foi descoberto varrendo
          identificadores de {C.faixaDeIdsVarrida.de} a {C.faixaDeIdsVarrida.ate} — e eles não são
          sequenciais: o Tribunal de Justiça de Roraima está sozinho num identificador a 118 de
          distância do bloco dos demais. Pode haver órgão fora da faixa varrida.
        </p>
        <p className="mt-3 max-w-3xl text-[.88em] leading-relaxed text-text-soft">
          <strong className="text-text">
            Não há inspeção da Corregedoria Nacional sobre STJ, TST ou STF.
          </strong>{" "}
          O regulamento da Corregedoria descreve inspeção sobre órgãos de primeiro e segundo grau;
          tribunal superior fica de fora. Quem faz correição em Tribunal Regional do Trabalho é a
          Corregedoria-Geral da Justiça do Trabalho, órgão do TST — e o produto se chama ata de
          correição, não relatório de inspeção.
        </p>
      </section>
    </div>
  );
}
