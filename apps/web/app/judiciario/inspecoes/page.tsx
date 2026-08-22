import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { metadataEditavel } from "@/lib/edicoes";
import {
  ACHADOS_POR_TEMA,
  ACHADOS_POR_TIPO_UNIDADE,
  COBERTURA_INSPECOES,
  ORGAOS_INSPECIONADOS,
  RELATORIOS_TJMG,
  TEMA_ROTULOS,
} from "@/lib/judiciario/inspecoes-cnj";
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
          nota={`de ${RELATORIOS_TJMG[RELATORIOS_TJMG.length - 1]?.publicadoEm.slice(0, 4)} a ${RELATORIOS_TJMG[0]?.publicadoEm.slice(0, 4)}`}
        />
        <Cartao
          valor={String(C.tjmg.unidadesDistintas)}
          rotulo="unidades examinadas em 2026"
          nota="varas, juizados, gabinetes e órgãos centrais"
        />
        <Cartao
          valor={String(C.tjmg.secoesComConteudo)}
          rotulo="seções com achado"
          nota={`${C.tjmg.secoesSemAchado} seções dizem que não há achado`}
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
            <strong className="text-text">Foram lidas {C.tjmg.secoesLidasNoCorpo} das{" "}
            {C.tjmg.secoesNoSumario} seções</strong> que o sumário do próprio relatório lista
            ({Math.round((C.tjmg.secoesLidasNoCorpo / C.tjmg.secoesNoSumario) * 100)}%). O que
            faltou está declarado, não escondido.
          </li>
          <li>
            <strong className="text-text">Só o relatório de 2026 está aberto aqui.</strong> Os
            outros {RELATORIOS_TJMG.length - 1} têm formatos diferentes entre si e a extração deles
            está em andamento — e um deles, de 2017, é digitalizado e não tem texto que possa ser
            lido por máquina.
          </li>
        </ul>
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

      {/* ═══ OS OUTROS RELATÓRIOS DO TJMG ═══ */}
      <section aria-labelledby="serie-tjmg" className="mt-14">
        <h2 id="serie-tjmg" className="font-display text-xl font-bold text-text">
          Os {RELATORIOS_TJMG.length} relatórios sobre o TJMG
        </h2>
        <p className="mt-2 max-w-3xl text-[.92em] leading-relaxed text-text-soft">
          O CNJ cobra, na inspeção seguinte, o que determinou na anterior — por isso a série
          importa mais que qualquer relatório isolado. Todos são públicos e baixam sem cadastro.
        </p>
        <ul className="mt-5 divide-y divide-border rounded-2xl border border-border">
          {RELATORIOS_TJMG.map((r) => (
            <li key={r.url} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3">
              <span className="tabular-nums text-[.85em] text-text-soft">{r.publicadoEm}</span>
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
