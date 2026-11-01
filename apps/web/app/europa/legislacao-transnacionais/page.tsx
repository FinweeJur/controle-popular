import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  LEGISLACAO,
  ROTULO_STATUS,
  ROTULO_TIPO,
  type ItemLegislacao,
  type StatusLegal,
} from "@/lib/europa-litigios/legislacao";

/**
 * Legislação e precedentes que permitem responsabilizar transnacionais.
 *
 * Estrutura pedida pelo dono: resumo primeiro; depois explicação didática;
 * por último tabelas. Cada tabela separa um caminho jurídico: onde processar,
 * diligência devida e relatório/penal.
 */

export const metadata: Metadata = {
  title: "Legislação transnacional | Controle Popular",
  description:
    "Resumo didático e tabelas sobre as leis e precedentes que permitem responsabilizar multinacionais por danos no exterior: Reino Unido, Holanda, Alemanha, França, UE, Suíça, Noruega, EUA, Canadá e Austrália.",
};

const TOTAL = LEGISLACAO.length;
const PAISES = [...new Set(LEGISLACAO.map((i) => i.pais))];
const DESCONHECIDOS = LEGISLACAO.filter((i) => i.status === "desconhecido");

function SeloStatus({ status }: { status: StatusLegal }) {
  const cor =
    status === "em_vigor"
      ? "bg-primary/10 text-primary"
      : status === "vigencia_futura"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "bg-surface-2 text-text-soft";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cor}`}>
      {ROTULO_STATUS[status]}
    </span>
  );
}

function Tabela({
  titulo,
  legenda,
  itens,
}: {
  titulo: string;
  legenda: string;
  itens: readonly ItemLegislacao[];
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-xl font-bold text-text">{titulo}</h2>
      <p className="mb-3 text-sm text-text-soft">{legenda}</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] border-collapse text-left text-xs">
          <caption className="sr-only">{titulo}</caption>
          <thead className="bg-surface-2 text-text-soft">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">País</th>
              <th scope="col" className="px-3 py-2 font-semibold">Instrumento</th>
              <th scope="col" className="px-3 py-2 font-semibold">O que permite</th>
              <th scope="col" className="px-3 py-2 font-semibold">Status</th>
              <th scope="col" className="px-3 py-2 font-semibold">Fonte</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id} className="border-t border-border align-top">
                <td className="px-3 py-3 text-text">{item.pais}</td>
                <td className="px-3 py-3 text-text">
                  {item.instrumento}
                  <span className="mt-1 block text-text-soft">
                    {ROTULO_TIPO[item.tipo]}
                  </span>
                </td>
                <td className="px-3 py-3 text-text-soft">{item.oQuePermite}</td>
                <td className="px-3 py-3">
                  <SeloStatus status={item.status} />
                </td>
                <td className="px-3 py-3">
                  <a
                    href={item.fonteOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    abrir ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Resumo() {
  return (
    <section className="mb-10 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="mb-3 text-xl font-bold text-text">Resumo</h2>
      <p className="mb-4 text-sm text-text-soft">
        Existem quatro caminhos, e eles não se substituem. {TOTAL}{" "}
        instrumentos em {PAISES.length} jurisdições aparecem nas tabelas
        abaixo.
      </p>
      <ul className="mb-4 space-y-2 text-sm text-text-soft">
        <li>
          <strong className="text-text">Jurisdição:</strong> onde a matriz pode
          ser processada. Ex.: Vedanta e Okpabi, no Reino Unido.
        </li>
        <li>
          <strong className="text-text">Responsabilidade civil:</strong> o que
          permite condenar. Ex.: Mariana/BHP em Londres; Braskem em Roterdã.
        </li>
        <li>
          <strong className="text-text">Diligência devida:</strong> obriga a
          empresa a mapear e prevenir riscos. Nem sempre gera ação direta.
        </li>
        <li>
          <strong className="text-text">Relatório e penal:</strong> expõe a
          cadeia e pune crimes, mas não indeniza automaticamente a vítima.
        </li>
      </ul>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-surface-2 p-3 text-sm">
          <p className="font-semibold text-text">Mariana</p>
          <p className="text-text-soft">
            Londres, contra a BHP. Responsabilidade decidida em 2025.
          </p>
        </div>
        <div className="rounded-lg bg-surface-2 p-3 text-sm">
          <p className="font-semibold text-text">Brumadinho</p>
          <p className="text-text-soft">
            Munique, contra a TÜV SÜD. Mais de 1.400 autores.
          </p>
        </div>
        <div className="rounded-lg bg-surface-2 p-3 text-sm">
          <p className="font-semibold text-text">Maceió</p>
          <p className="text-text-soft">
            Roterdã, contra a Braskem. Caso distinto dos dois.
          </p>
        </div>
      </div>
    </section>
  );
}

function Explicacao() {
  return (
    <section className="mb-10">
      <h2 className="mb-2 text-xl font-bold text-text">Como funciona</h2>
      <p className="mb-3 text-sm text-text-soft">
        Primeiro se decide <em>onde</em> processar. Depois,{" "}
        <em>com que fundamento</em>. A lei do lugar do dano costuma valer: no
        Brasil, Lei 6.938/1981 e Código Civil; na Europa, Roma II, art. 7.
      </p>
      <p className="mb-3 text-sm text-text-soft">
        A presença da matriz no país é a porta de entrada. A jurisdição inglesa
        aceitou o caso de Mariana porque a BHP tem sede no Reino Unido. Em
        Munique, a TÜV SÜD é alemã. Em Roterdã, a Braskem tem subsidiárias
        neerlandesas.
      </p>
      <p className="text-sm text-text-soft">
        Será que a empresa deve um dever de cuidado? O tribunal olha controle
        efetivo, promessas públicas e supervisão real. Não basta ser dona.
      </p>
    </section>
  );
}

function Fechamento() {
  return (
    <section className="mb-10 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-soft">
      <h2 className="mb-2 text-lg font-bold text-text">O que ainda falta</h2>
      <p className="mb-2">
        {DESCONHECIDOS.length} instrumentos estão como “a confirmar”: a fonte
        oficial bloqueou leitura automatizada ou não foi localizada. Não
        completamos com suposição.
      </p>
      <p>
        Para os casos concretos e as datas, veja a{" "}
        <Link
          href="/europa/litigios-transnacionais"
          className="text-primary underline-offset-2 hover:underline"
        >
          linha do tempo dos litígios
        </Link>
        . Para as normas ambientais brasileiras, o{" "}
        <Link
          href="/ambiental/legislacao"
          className="text-primary underline-offset-2 hover:underline"
        >
          painel de legislação
        </Link>
        .
      </p>
    </section>
  );
}

export default function PaginaLegislacao() {
  const jurisdicao = LEGISLACAO.filter(
    (i) => i.tipo === "jurisdicao" || i.tipo === "responsabilidade_civil",
  );
  const diligencia = LEGISLACAO.filter((i) => i.tipo === "diligencia_devida");
  const relatorio = LEGISLACAO.filter(
    (i) => i.tipo === "relatorio" || i.tipo === "penal",
  );

  return (
    <main
      id="conteudo-principal"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <nav
        aria-label="Navegação estrutural"
        className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-soft"
      >
        <Link href="/" className="hover:text-primary hover:underline">
          Início
        </Link>
        <span>/</span>
        <Link href="/europa" className="hover:text-primary hover:underline">
          Europa
        </Link>
        <span>/</span>
        <span className="font-semibold text-text">Legislação</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Leis que alcançam a matriz
        </h1>
        <p className="mt-3 max-w-3xl text-base text-text-soft">
          Como uma vítima no Brasil pode processar a empresa-mãe no exterior.
          Resumo, explicação e tabelas com fonte oficial.
        </p>
      </header>

      <Resumo />

      <Explicacao />

      <Tabela
        titulo="Tabela 1. Onde processar e com que fundamento"
        legenda="Jurisdição, responsabilidade civil e casos que já aplicaram a lei brasileira no exterior."
        itens={jurisdicao}
      />
      <Tabela
        titulo="Tabela 2. Diligência devida"
        legenda="Leis que obrigam a empresa a olhar a cadeia. Multa e supervisão variam; ação direta da vítima nem sempre existe."
        itens={diligencia}
      />
      <Tabela
        titulo="Tabela 3. Relatório e penal"
        legenda="Transparência e sanção penal. Ajudam a expor e punir, mas não substituem a ação civil."
        itens={relatorio}
      />

      <Fechamento />

      <FooterGlobal />
    </main>
  );
}
