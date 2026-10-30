import type { Metadata } from "next";
import Link from "next/link";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  LEGISLACAO,
  ROTULO_STATUS,
  ROTULO_TIPO,
  type ItemLegislacao,
  type RegiaoLegal,
} from "@/lib/europa-litigios/legislacao";

/**
 * Legislação e precedentes que permitem responsabilizar transnacionais.
 *
 * Papel: explicar os quatro caminhos (jurisdição, responsabilidade civil,
 * diligência devida e relatório) e listar, por país, o instrumento e a fonte
 * oficial. O status é o que a fonte oficial dizia em 30/10/2026; onde o
 * acesso automatizado foi bloqueado, aparece "a confirmar".
 */

export const metadata: Metadata = {
  title: "Legislação transnacional | Controle Popular",
  description:
    "Reino Unido, Países Baixos, Alemanha, França, União Europeia, Suíça, Noruega, EUA, Canadá e Austrália: leis e precedentes que permitem responsabilizar multinacionais.",
};

const REGIOES: Array<{ id: RegiaoLegal; titulo: string; resumo: string }> = [
  {
    id: "europa",
    titulo: "Europa",
    resumo:
      "Onde os casos de Mariana e Brumadinho tramitam: Inglaterra, Países Baixos e Alemanha.",
  },
  {
    id: "norte_global",
    titulo: "Norte Global",
    resumo:
      "Instrumentos dos Estados Unidos, Canadá e Austrália, com limites próprios.",
  },
];

function CartaoInstrumento({ item }: { item: ItemLegislacao }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
          {ROTULO_TIPO[item.tipo]}
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-text-soft">
          {ROTULO_STATUS[item.status]}
        </span>
        <span className="text-text-soft">{item.pais}</span>
      </div>
      <h3 className="text-sm font-semibold text-text">{item.instrumento}</h3>
      <p className="mt-1 text-sm text-text-soft">{item.oQuePermite}</p>
      {item.observacao ? (
        <p className="mt-2 text-xs text-text-soft">{item.observacao}</p>
      ) : null}
      <a
        href={item.fonteOficial}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        Fonte oficial ↗
      </a>
      {item.casos.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-text-soft">
          {item.casos.map((caso) => (
            <li key={caso.citacao}>
              <a
                href={caso.fonte}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-2 hover:underline"
              >
                {caso.nome}
              </a>{" "}
              — {caso.citacao}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function BlocoRegiao({ id }: { id: RegiaoLegal }) {
  const regiao = REGIOES.find((r) => r.id === id);
  const itens = LEGISLACAO.filter((i) => i.regiao === id);
  const paises = [...new Set(itens.map((i) => i.pais))];
  if (!regiao) return null;
  return (
    <section className="mb-10">
      <h2 className="mb-1 text-xl font-bold text-text">{regiao.titulo}</h2>
      <p className="mb-4 text-sm text-text-soft">{regiao.resumo}</p>
      <div className="space-y-6">
        {paises.map((pais) => (
          <div key={pais}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-text-soft">
              {pais}
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {itens
                .filter((i) => i.pais === pais)
                .map((item) => (
                  <CartaoInstrumento key={item.id} item={item} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PaginaLegislacao() {
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
          Legislação que alcança a matriz
        </h1>
        <p className="mt-3 text-base text-text-soft">
          Quatro caminhos: jurisdição sobre a matriz, responsabilidade civil,
          diligência devida e relatório. Cada item traz a fonte oficial e o
          status em 30/10/2026.
        </p>
      </header>

      <div className="mb-8 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-soft">
        <p className="mb-2">
          <strong className="text-text">Como ler.</strong> “Diligência devida”
          obriga a empresa a mapear e prevenir riscos; nem sempre cria ação
          direta para a vítima. “Jurisdição” diz onde se pode processar.
          “Responsabilidade civil” é o que permite condenar.
        </p>
        <p>
          Onde a fonte oficial bloqueou leitura automatizada, o status aparece
          como “a confirmar”. Não completamos lacuna com suposição.
        </p>
      </div>

      <BlocoRegiao id="europa" />
      <BlocoRegiao id="norte_global" />

      <p className="mb-8 text-sm text-text-soft">
        Para os casos concretos, veja a{" "}
        <Link
          href="/europa/litigios-transnacionais"
          className="text-primary underline-offset-2 hover:underline"
        >
          linha do tempo dos litígios
        </Link>
        .
      </p>

      <FooterGlobal />
    </main>
  );
}
