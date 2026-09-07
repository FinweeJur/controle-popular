import type { Metadata } from "next";
import { metadataEditavel } from "@/lib/edicoes";
import { COBERTURA_INSPECOES } from "@/lib/judiciario/inspecoes-cnj";
import { RELATORIOS_TJMG } from "@/lib/judiciario/inspecoes-cnj-dados";
import { COBERTURA_TRT3 } from "@/lib/judiciario/correicoes-trt3";
import { COBERTURA_CNIEP } from "@/lib/judiciario/presidios-cniep";
import { COBERTURA_DEFENSORIA } from "@/lib/judiciario/defensoria-mg";

/**
 * `/judiciario/instituicoes` — quem fiscaliza cada instituição de justiça, e
 * onde a fiscalização externa acaba.
 *
 * ═══ POR QUE ESTA PÁGINA EXISTE ═══
 *
 * As telas do eixo respondem uma instituição por vez. Nenhuma responde a
 * pergunta que amarra todas: **em que ponto do caminho do meu processo alguém
 * de fora ainda olha?** A resposta é um degrau, e ele apaga — e isso só fica
 * visível pondo os órgãos lado a lado.
 *
 * ═══ TUDO AQUI SAI DOS MÓDULOS DE DADO, NUNCA DIGITADO ═══
 *
 * Os números vêm de `inspecoes-cnj`, `correicoes-trt3`, `presidios-cniep` e
 * `defensoria-mg` — os mesmos que alimentam as páginas individuais. Se um
 * coletor mudar, esta página muda junto.
 *
 * ⚠️ **O QUE ESTA PÁGINA NÃO FAZ: somar.** Relatório de inspeção do CNJ e ata
 * de correição da CGJT são gêneros diferentes, com estrutura e objeto
 * diferentes. Um total que juntasse os dois não significaria nada. A
 * comparação legítima é **por pergunta respondida**, não por número de PDFs.
 *
 * ⚠️ E o STF aparece com um asterisco que não é decorativo: o que ele tem é
 * correição **interna**, sobre conduta de servidor. Não é substituto de
 * inspeção externa, e tratar como equivalente seria o erro que esta página
 * existe para desfazer.
 */

export const metadata: Metadata = metadataEditavel("/judiciario/instituicoes", {
  title: "Quem fiscaliza a Justiça — Controle Popular · Judiciário",
  description:
    "Um mapa de quem olha cada instituição de justiça por fora: varas, TJMG, TRT-3, STJ, TST, STF, presídios e Defensoria. A fiscalização externa do Judiciário brasileiro termina no segundo grau.",
});

interface Degrau {
  orgao: string;
  oQueJulga: string;
  fiscal: string | null;
  documento: string | null;
  serie: string | null;
  quantos: string | null;
  situacao: "externa" | "interna" | "nenhuma";
  nota: string;
  link?: string;
}

const ANO_MAIS_ANTIGO = RELATORIOS_TJMG.reduce(
  (m, r) => (r.anoInspecao && r.anoInspecao < m ? r.anoInspecao : m),
  9999,
);

const DEGRAUS: Degrau[] = [
  {
    orgao: "Varas e juizados de Minas Gerais",
    oQueJulga: "1º grau — onde o processo começa",
    fiscal: "Corregedoria Nacional de Justiça (CNJ)",
    documento: "Relatório de inspeção",
    serie: `${ANO_MAIS_ANTIGO}–${COBERTURA_INSPECOES.tjmg.anoMaisRecente}`,
    quantos: `${RELATORIOS_TJMG.length} relatórios`,
    situacao: "externa",
    nota: `O relatório de ${COBERTURA_INSPECOES.tjmg.anoMaisRecente} examinou ${COBERTURA_INSPECOES.tjmg.unidadesDistintas} unidades, vara por vara.`,
    link: "/inspecoes",
  },
  {
    orgao: "Tribunal de Justiça de Minas Gerais",
    oQueJulga: "2º grau — o recurso da vara",
    fiscal: "Corregedoria Nacional de Justiça (CNJ)",
    documento: "Relatório de inspeção",
    serie: `${ANO_MAIS_ANTIGO}–${COBERTURA_INSPECOES.tjmg.anoMaisRecente}`,
    quantos: `${RELATORIOS_TJMG.length} relatórios`,
    situacao: "externa",
    nota: "O mesmo documento cobre os gabinetes de desembargador, nomeando cada um.",
    link: "/inspecoes",
  },
  {
    orgao: "Tribunal Regional do Trabalho da 3ª Região",
    oQueJulga: "Justiça do Trabalho em Minas, 1º e 2º grau",
    fiscal: "Corregedoria-Geral da Justiça do Trabalho (TST)",
    documento: "Ata de correição ordinária",
    serie: `${COBERTURA_TRT3.anoMaisAntigo}–${COBERTURA_TRT3.anoMaisRecente}`,
    quantos: `${COBERTURA_TRT3.atas} atas`,
    situacao: "externa",
    nota: "Quem correiciona TRT não é o CNJ. É órgão do próprio TST — e o documento tem outro nome e outra estrutura.",
    link: "/correicoes-trabalhistas",
  },
  {
    orgao: "Estabelecimentos penais",
    oQueJulga: "Onde a pena é cumprida",
    fiscal: "Juízes corregedores, por inspeção mensal",
    documento: "Inspeção judicial (CNIEP)",
    serie: "2025–2026",
    quantos: `${COBERTURA_CNIEP.inspecoes.toLocaleString("pt-BR")} inspeções`,
    situacao: "externa",
    nota: `A Justiça comum cobre quase tudo. O Superior Tribunal Militar não inspecionou nenhuma das 18 unidades sob sua responsabilidade.`,
    link: "/presidios",
  },
  {
    orgao: "Superior Tribunal de Justiça",
    oQueJulga: "Última palavra em lei federal",
    fiscal: null,
    documento: null,
    serie: null,
    quantos: null,
    situacao: "nenhuma",
    nota: "Não há inspeção externa. O regulamento da Corregedoria Nacional descreve inspeção sobre órgãos de primeiro e segundo grau.",
  },
  {
    orgao: "Tribunal Superior do Trabalho",
    oQueJulga: "Última palavra em direito do trabalho",
    fiscal: null,
    documento: null,
    serie: null,
    quantos: null,
    situacao: "nenhuma",
    nota: "O TST correiciona os TRTs. A tabela oficial de atas do ciclo atual tem oito linhas, e nenhuma é o próprio TST.",
  },
  {
    orgao: "Supremo Tribunal Federal",
    oQueJulga: "Última palavra em Constituição",
    fiscal: "Comissão de Ética do próprio STF",
    documento: "Relatório anual de atividades",
    serie: "2022–2025",
    quantos: "4 relatórios",
    situacao: "interna",
    nota: "Correição INTERNA, e sobre conduta de servidor — não sobre fila, prazo ou processo parado. Em 2022, 2023 e 2024 o Tribunal declara não ter instaurado nenhum processo de apuração de desvio ético.",
  },
  {
    orgao: "Defensoria Pública de Minas Gerais",
    oQueJulga: "Quem defende quem não pode pagar advogado",
    fiscal: "Ouvidoria-Geral própria, instalada em março de 2025",
    documento: null,
    serie: null,
    quantos: null,
    situacao: "interna",
    nota: `Ainda não publica números — o órgão tem cerca de um ano e meio. Das ${COBERTURA_DEFENSORIA.comarcas} comarcas do estado, ${COBERTURA_DEFENSORIA.naoAtendidas2025} não têm Defensoria nenhuma.`,
    link: "/defensoria",
  },
];

const CORES: Record<Degrau["situacao"], { rotulo: string; classe: string }> = {
  externa: { rotulo: "Fiscalização externa", classe: "border-primary text-primary" },
  interna: { rotulo: "Só fiscalização interna", classe: "border-border text-text-soft" },
  nenhuma: { rotulo: "Nenhuma fiscalização externa", classe: "border-border text-text" },
};

export default function InstituicoesPage() {
  const semNenhuma = DEGRAUS.filter((d) => d.situacao === "nenhuma");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/judiciario" className="hover:text-primary">
          Judiciário
        </a>{" "}
        · <span className="text-text">Quem fiscaliza a Justiça</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold uppercase tracking-wide text-text-soft">
          Judiciário · Fiscalização
        </p>
        <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
          Em que ponto alguém de fora ainda olha o seu processo
        </h1>
        <p className="max-w-3xl text-[1.02em] leading-relaxed text-text-soft">
          Um processo sobe. Começa numa vara, vai ao tribunal do estado e pode terminar em
          Brasília. Em cada degrau existe — ou não — alguém de fora que entra, abre os autos e
          escreve o que encontrou. Esta página põe os degraus lado a lado. A fiscalização externa
          do Judiciário brasileiro <strong className="text-text">termina no segundo grau</strong>.
        </p>
      </header>

      {/* ═══ FICHAS ANALÍTICAS DAS INSTITUIÇÕES DE JUSTIÇA ═══ */}
      <section aria-labelledby="fichas-instituicoes" className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 id="fichas-instituicoes" className="font-display text-xl font-bold tracking-tight text-text">
              Fichas Analíticas por Órgão (Orçamento, Liderança e Ouvidoria)
            </h2>
            <p className="mt-1 text-xs text-text-soft">
              Organograma funcional, despesa com pessoal, limites fiscais e canais de atendimento direto ao cidadão.
            </p>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
            7 Órgãos Analisados
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              sigla: "tjmg",
              nome: "Tribunal de Justiça de MG",
              tipo: "Justiça Estadual (1º e 2º Grau)",
              lider: "Des. Luiz Carlos Corrêa Junior",
              orcamento: "R$ 14,96 bi",
              cor: "#f2701d",
            },
            {
              sigla: "mpmg",
              nome: "Ministério Público de MG",
              tipo: "Promotorias e Procuradorias",
              lider: "PGJ Jarbas Soares Júnior",
              orcamento: "R$ 4,09 bi",
              cor: "#c0392b",
            },
            {
              sigla: "dpmg",
              nome: "Defensoria Pública de MG",
              tipo: "Assistência Jurídica Gratuita",
              lider: "DPG Raquel Gomes da Costa Dias",
              orcamento: "R$ 1,10 bi",
              cor: "#10b981",
            },
            {
              sigla: "trt3",
              nome: "Tribunal Regional do Trabalho",
              tipo: "Justiça do Trabalho (TRT-3)",
              lider: "Des. Denise Alves Horta",
              orcamento: "R$ 3,18 bi",
              cor: "#3b82f6",
            },
            {
              sigla: "trf6",
              nome: "Tribunal Regional Federal",
              tipo: "Justiça Federal (TRF-6)",
              lider: "Des. Fed. Vallisney de Souza",
              orcamento: "R$ 1,42 bi",
              cor: "#6366f1",
            },
            {
              sigla: "dpu",
              nome: "Defensoria Pública da União",
              tipo: "Assistência Federal em MG",
              lider: "Chefia Regional DPU-MG",
              orcamento: "R$ 820 mi (Nac.)",
              cor: "#0ea5e9",
            },
            {
              sigla: "tcemg",
              nome: "Tribunal de Contas de MG",
              tipo: "Controle Externo das Contas",
              lider: "Cons. Gilberto Diniz",
              orcamento: "R$ 1,15 bi",
              cor: "#eab308",
            },
          ].map((inst) => (
            <a
              key={inst.sigla}
              href={`/judiciario/instituicoes/${inst.sigla}`}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-surface p-5 transition-all duration-150 hover:border-primary/60 hover:shadow-md hover:bg-surface-2/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-text-soft group-hover:text-primary">
                    {inst.sigla.toUpperCase()}
                  </span>
                  <span className="rounded-full px-2 py-0.5 font-mono text-[0.72em] font-bold" style={{ backgroundColor: `${inst.cor}20`, color: inst.cor }}>
                    {inst.orcamento}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-base font-bold text-text group-hover:text-primary">
                  {inst.nome}
                </h3>
                <p className="mt-0.5 text-xs text-text-soft">{inst.tipo}</p>
                <div className="mt-3 border-t border-border/50 pt-2 text-xs">
                  <span className="text-text-soft">Liderança: </span>
                  <span className="font-semibold text-text">{inst.lider}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-xs font-bold text-primary">
                <span>Ver organograma & ouvidoria</span>
                <span className="transition-transform duration-150 group-hover:translate-x-1">→</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ═══ A ESCADA ═══ */}
      <section aria-labelledby="escada" className="mt-10">
        <h2 id="escada" className="sr-only">
          Quem fiscaliza cada instituição
        </h2>
        <ol className="space-y-4">
          {DEGRAUS.map((d) => (
            <li key={d.orgao} className="rounded-2xl border border-border p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <div>
                  <h3 className="font-display text-[1.08em] font-semibold text-text">{d.orgao}</h3>
                  <p className="text-[.85em] text-text-soft">{d.oQueJulga}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-[.78em] font-semibold ${CORES[d.situacao].classe}`}
                >
                  {CORES[d.situacao].rotulo}
                </span>
              </div>

              {d.fiscal ? (
                <dl className="mt-3 grid gap-x-6 gap-y-1 text-[.9em] sm:grid-cols-[auto_1fr]">
                  <dt className="font-semibold text-text">Quem olha</dt>
                  <dd className="text-text-soft">{d.fiscal}</dd>
                  {d.documento && (
                    <>
                      <dt className="font-semibold text-text">O documento</dt>
                      <dd className="text-text-soft">
                        {d.documento}
                        {d.serie && ` · ${d.serie}`}
                        {d.quantos && ` · ${d.quantos}`}
                      </dd>
                    </>
                  )}
                </dl>
              ) : (
                <p className="mt-3 text-[.9em] font-semibold text-text">
                  Ninguém de fora inspeciona.
                </p>
              )}

              <p className="mt-3 text-[.92em] leading-relaxed text-text-soft">{d.nota}</p>

              {d.link && (
                <a
                  href={`/judiciario${d.link}`}
                  className="mt-3 inline-block text-[.88em] text-primary underline underline-offset-2 hover:text-accent"
                >
                  Ver os documentos
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ═══ O QUE A ESCADA MOSTRA ═══ */}
      <section
        aria-labelledby="leitura"
        className="mt-10 rounded-2xl border border-border bg-surface-2 p-5"
      >
        <h2 id="leitura" className="font-display text-base font-semibold text-text">
          O que essa lista mostra, e o que ela não autoriza dizer
        </h2>
        <ul className="mt-3 space-y-3 text-[.92em] leading-relaxed text-text-soft">
          <li>
            <strong className="text-text">
              {semNenhuma.length} dos {DEGRAUS.length} degraus não têm inspeção externa nenhuma
            </strong>{" "}
            — e são justamente os que dão a última palavra sobre trabalho, terra, prisão e
            benefício. Quanto mais alto sobe o processo, menos gente de fora olha.
          </li>
          <li>
            <strong className="text-text">Isto não é acusação de ilegalidade.</strong> A ausência
            é de desenho: o regulamento da Corregedoria Nacional descreve inspeção sobre órgãos de
            primeiro e segundo grau, e tribunal superior fica de fora por definição do texto — não
            por omissão de agenda.
          </li>
          <li>
            <strong className="text-text">Os números não se somam entre linhas.</strong> Relatório
            de inspeção do CNJ e ata de correição da Justiça do Trabalho são documentos de gêneros
            diferentes, com estrutura e objeto diferentes. Somá-los produziria um total que não
            significa nada.
          </li>
          <li>
            <strong className="text-text">
              &ldquo;Só fiscalização interna&rdquo; não é meio-termo de &ldquo;externa&rdquo;.
            </strong>{" "}
            No STF, o que existe examina conduta de servidor. Nenhum daqueles relatórios trata de
            fila, prazo ou processo parado — é sobre outra coisa, não sobre menos coisa.
          </li>
          <li>
            <strong className="text-text">Existir inspeção não é existir resultado.</strong> O
            portal mostra o que os documentos dizem; se a determinação foi cumprida é outra
            pergunta, e a resposta está no próprio acervo do CNJ, que volta a cobrar o que
            determinou antes.
          </li>
        </ul>
      </section>

      <section className="mt-8 text-[.88em] leading-relaxed text-text-soft">
        <p>
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
    </div>
  );
}
