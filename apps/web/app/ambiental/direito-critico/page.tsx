import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import {
  listarNormasDireitoCritico,
  listarPrecedentesDireitoCritico,
} from "@/lib/db/queries/direito-critico";
import BuscaDireitoCritico from "./BuscaDireitoCritico";

export const metadata: Metadata = {
  title: "Legislação e precedentes por tema — Controle Popular · Ambiental",
  description:
    "Legislação nacional e internacional e precedentes judiciais, filtrados por tema de direito protegido: rios, povos indígenas, quilombolas, comunidades tradicionais e direitos humanos.",
};

/**
 * `/ambiental/direito-critico` — seção "legislação e precedentes por tema
 * de direito protegido" pedida pelo dono, migration `0067`.
 *
 * ═══ POR QUE EM `/ambiental`, NÃO EM `/congresso` ═══
 *
 * `/congresso` é o eixo da ATIVIDADE LEGISLATIVA federal — proposições,
 * bancadas, votações; um fluxo de trabalho parlamentar em andamento. Este
 * acervo é o oposto: normas já vigentes e decisões já julgadas, cruzadas
 * por ASSUNTO (rios, indígena, quilombola...), não por tramitação. O
 * critério de organização é o mesmo que já rege `/ambiental` inteiro
 * (COPAM, licenciamento, barragens, legislação estadual): território e
 * proteção ambiental/de direitos, não a hierarquia da norma. Que boa parte
 * das 30 leis seja federal ou internacional não muda isso — a Constituição
 * e o PIDESC também vivem aqui, ao lado da legislação estadual, pela mesma
 * razão que uma Portaria ANM sobre segurança de barragens vive.
 *
 * ═══ POR QUE UMA PÁGINA SÓ, NÃO DUAS (legislação / precedentes) ═══
 *
 * O pedido foi explícito: "consultar legislação E precedentes" na mesma
 * busca. `BuscaDireitoCritico` faz isso sem achatar os dois tipos — cada
 * item mantém sua forma própria (lei tem artigos; precedente tem
 * tribunal/ementa), só compartilha o filtro de tema/natureza.
 */
export default async function DireitoCriticoIndex() {
  const [normas, precedentes] = await Promise.all([
    listarNormasDireitoCritico(),
    listarPrecedentesDireitoCritico(),
  ]);
  const total = normas.length + precedentes.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Nacional e internacional · Legislação e precedentes
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Legislação e precedentes por tema de direito protegido
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Leis, tratados, declarações e decisões de tribunais nacionais e internacionais, numa
          busca só, filtrável por tema de direito protegido — proteção de rios, de povos
          indígenas, de comunidades quilombolas, de povos e comunidades tradicionais, e normas
          de direitos humanos.
        </p>

        {total === 0 ? (
          <p className="max-w-2xl rounded-lg border border-dashed border-border px-4 py-3 text-[.95em] text-text-soft">
            Nada coletado ainda. O ingestor (
            <code className="font-mono text-[.85em]">
              etl.apis.direito_critico_popular
            </code>
            ) ainda não rodou contra este banco.
          </p>
        ) : (
          <p
            className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
            style={{ borderColor: "var(--cp-tertiary)" }}
          >
            <strong className="font-tabular">{formatNumberBR(normas.length)}</strong> instrumentos
            normativos e <strong className="font-tabular">{formatNumberBR(precedentes.length)}</strong>{" "}
            precedentes judiciais coletados — a carga inicial deste acervo.
          </p>
        )}
      </header>

      <section className="mt-10">
        <BuscaDireitoCritico normas={normas} precedentes={precedentes} />
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">
          Por que este acervo é desigual entre temas
        </h2>
        <p className="mt-3 text-[.92em] text-text-soft">
          A carga inicial deste acervo veio de um único material curado — &quot;Direito Crítico
          Popular&quot;, um guia de conceitos e microssistema de proteção montado inteiramente em
          torno de barragens e populações atingidas (Mariana, Brumadinho, o Movimento dos
          Atingidos por Barragens). Os temas que o filtro oferece são mais largos do que esse
          recorte — e por isso a cobertura entre eles NÃO é uniforme: direitos humanos, proteção
          indígena e rios têm instrumentos catalogados; proteção de serras e de espécies da flora
          e fauna, medido, têm zero — nenhuma ocorrência das duas categorias no material fonte.
        </p>
        <p className="mt-3 text-[.92em] text-text-soft">
          Os dois temas sem nenhum instrumento continuam no filtro de propósito: escolher um
          deles mostra &quot;nenhum instrumento catalogado ainda&quot;, não some da lista fingindo
          que o tema não existe. Um mesmo instrumento pode proteger vários temas ao mesmo
          tempo — a Constituição Federal, por exemplo, entra em proteção indígena, quilombola e
          direitos humanos simultaneamente, porque o texto sustenta os três.
        </p>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">Como o tema de cada item é decidido</h2>
        <p className="mt-3 text-[.92em] text-text-soft">
          Diferente da legislação ambiental estadual (que classifica por palavra-chave
          reproduzível na ementa), aqui não existe campo de tema nenhum na fonte — cada
          atribuição veio de leitura humana do texto de cada lei/precedente, registrada linha a
          linha em{" "}
          <code className="font-mono text-[.85em]">etl/temas_direito_critico.py</code>, com o
          trecho que sustenta cada tema. É reexecutável (o mesmo HTML fonte mais o mesmo
          dicionário sempre produz o mesmo resultado), mas é curadoria declarada como tal — não
          um indício automático por palavra solta.
        </p>
      </section>
    </div>
  );
}
