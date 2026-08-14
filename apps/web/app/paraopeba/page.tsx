import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import { ZONAS } from "@/lib/zonas";
import { formatNumberBR } from "@/lib/betim/format";
import {
  CLIPPING_PARAOPEBA,
  PERIODO_CLIPPING,
  MARCOS_PARAOPEBA,
  ATORES_REPARACAO,
  PAGAMENTOS_PARAOPEBA,
  DOCUMENTOS_PROCESSO,
  COBERTURA_DOCUMENTOS_PROCESSO,
} from "@/lib/paraopeba";

/**
 * Home da frente /paraopeba — acompanhamento da reparação pelo rompimento
 * da barragem da Vale em Brumadinho (25/01/2019, 270 mortes).
 *
 * ═══ DUAS FONTES, NUNCA MISTURADAS ═══
 *
 * Clipping, linha do tempo, atores e auxílio vêm de um painel entregue à
 * mão pelo dono (`painel-paraopeba.html`) — acervo datado, sem API por
 * trás. Os documentos do processo vêm do índice Solr público da Plataforma
 * Brumadinho UFMG, cruzado por município via o campo `places` que a
 * própria UFMG preenche. `docs/PLANO-INGESTAO-PARAOPEBA.md` mede as duas.
 *
 * Nenhum número aqui é digitado — todos vêm da contagem real dos arquivos
 * de `lib/paraopeba/`.
 */
export const metadata: Metadata = {
  title: "Paraopeba — Controle Popular",
  description:
    "Acompanhamento da reparação pelo rompimento da barragem da Vale em Brumadinho: clipping de notícias, linha do tempo do processo, quem atua na reparação e o auxílio emergencial pago mês a mês.",
};

const ZONA = ZONAS.find((z) => z.id === "paraopeba")!;

export default function ParaopebaHome() {
  const tiposDeAtor = new Set(ATORES_REPARACAO.map((a) => a.categoria));

  const BLOCOS = [
    {
      titulo: "Clipping",
      linha: `${formatNumberBR(CLIPPING_PARAOPEBA.length)} notícias`,
      texto: `Cobertura de imprensa, institucional e de assessoria sobre o caso, de ${PERIODO_CLIPPING.de.slice(0, 4)} a ${PERIODO_CLIPPING.ate.slice(0, 4)} — filtrável por tipo e período, com link para a fonte original em cada item.`,
      href: "/paraopeba/clipping",
      linkTexto: "Ver o clipping →",
    },
    {
      titulo: "Linha do tempo",
      linha: `${formatNumberBR(MARCOS_PARAOPEBA.length)} marcos`,
      texto:
        "Do corte de 50% do auxílio, em março de 2025, à confirmação do pagamento de agosto de 2026 — cada decisão judicial e cada resposta da Vale, em ordem.",
      href: "/paraopeba/linha-do-tempo",
      linkTexto: "Ver a linha do tempo →",
    },
    {
      titulo: "Quem atua na reparação",
      linha: `${formatNumberBR(ATORES_REPARACAO.length)} órgãos e organizações`,
      texto: `Judiciário, Ministério Público, a gestora dos pagamentos e as organizações que assessoram quem foi atingido — ${tiposDeAtor.size} categorias diferentes, com contato direto.`,
      href: "/paraopeba/quem-atua",
      linkTexto: "Ver quem atua →",
    },
    {
      titulo: "Auxílio emergencial",
      linha: `${formatNumberBR(PAGAMENTOS_PARAOPEBA.length)} pagamentos mensais`,
      texto:
        "O Novo Auxílio Emergencial, pago pela FGV desde dezembro de 2025 — mês a mês, com os números-resumo e a fonte de cada um.",
      href: "/paraopeba/auxilio",
      linkTexto: "Ver o auxílio →",
    },
    {
      titulo: "Documentos do processo",
      linha: `${formatNumberBR(COBERTURA_DOCUMENTOS_PROCESSO.publicados)} documentos, ${COBERTURA_DOCUMENTOS_PROCESSO.percentualPublicado}% do acervo`,
      texto:
        "Documentos do processo judicial da reparação que citam cada município da bacia, direto do índice público da Plataforma Brumadinho UFMG — com link e citação em cada um.",
      href: "/paraopeba/documentos",
      linkTexto: "Ver os documentos →",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: ZONA.cor }}
        >
          {ZONA.etiqueta}
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{ZONA.titulo}</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">{ZONA.descricao}</p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {BLOCOS.map((b) => (
          <a
            key={b.titulo}
            href={b.href}
            className="cp-card-hover flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-current"
          >
            <h2 className="font-display text-lg font-semibold">{b.titulo}</h2>
            <p className="mt-1 font-medium" style={{ color: ZONA.cor }}>
              {b.linha}
            </p>
            <p className="mt-2 flex-1 text-[.92em] text-text-soft">{b.texto}</p>
            <p className="mt-3 text-[.85em] font-semibold" style={{ color: ZONA.cor }}>
              {b.linkTexto}
            </p>
          </a>
        ))}
      </div>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Clipping, linha do tempo, quem atua na reparação e auxílio emergencial vêm de um
          painel de acompanhamento entregue ao Controle Popular — acervo datado, sem
          atualização automática. O Instituto Guaicuy mantém o Painel da Reparação{" "}
          <a
            href="https://guaicuy.org.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            atualizado em guaicuy.org.br ↗
          </a>{" "}
          — é a fonte viva; aqui é o retrato auditável. Os documentos do processo vêm do
          índice público da{" "}
          <a
            href="http://plataforma.projetobrumadinho.ufmg.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent hover:underline"
          >
            Plataforma Brumadinho UFMG ↗
          </a>{" "}
          (o domínio ainda não usa conexão segura).
        </p>
      </section>

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </div>
  );
}
