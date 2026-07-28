import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import { getNotaTransparenciaData, type AvaliacaoPntp } from "@/lib/betim/notaTransparencia";

export const metadata = {
  title: "Nota Betim (PNTP) — Controle Popular Betim",
  description: "Nota de transparência de Betim no ranking estadual (PNTP/ATRICON).",
};

const NIVEL_COR: Record<string, string> = {
  Diamante: "text-accent",
  Ouro: "text-accent",
  Elevado: "text-accent",
  Prata: "text-text",
  Intermediário: "text-text",
  Básico: "text-alert",
  Inicial: "text-alert",
};

function CardAvaliacao({ titulo, avaliacao }: { titulo: string; avaliacao: AvaliacaoPntp }) {
  const cor = NIVEL_COR[avaliacao.nivelTransparencia] ?? "text-text";
  return (
    <DataCard
      title={titulo}
      source={{ label: "PNTP / ATRICON", url: "https://radardatransparencia.atricon.org.br/" }}
    >
      <p className={`font-tabular text-2xl font-bold ${cor}`}>{avaliacao.nivelTransparencia}</p>
      <p className="text-xs">
        índice de transparência{" "}
        <strong className="font-tabular text-text">
          {(avaliacao.indiceTransparencia * 100).toFixed(1)}%
        </strong>{" "}
        ({avaliacao.ano})
      </p>
      {avaliacao.posicaoRankingMg && avaliacao.totalAvaliadosMg && (
        <p className="mt-1 text-xs">
          <strong className="font-tabular text-text">{avaliacao.posicaoRankingMg}º</strong> de{" "}
          {avaliacao.totalAvaliadosMg} avaliados em Minas Gerais
        </p>
      )}
      {avaliacao.historicoNivel && (
        <p className="mt-1 text-xs">
          Variação: {avaliacao.historicoNivel}
          {avaliacao.variacaoNivel === "Subiu" && " ↑"}
          {avaliacao.variacaoNivel === "Desceu" && " ↓"}
        </p>
      )}
    </DataCard>
  );
}

export default async function NotaBetimPage() {
  const { configured, ok, prefeitura, camara } = await getNotaTransparenciaData();
  const temDados = configured && ok && (prefeitura || camara);

  if (!temDados) {
    return (
      <PaginaEmBreve
        titulo="Nota Betim"
        descricao="Nota de transparência de Betim no Programa Nacional de Transparência Pública (PNTP/ATRICON), com ranking entre os municípios de Minas Gerais."
        motivo="Fonte confirmada 2026-07-23 (radardatransparencia.atricon.org.br disponibiliza ZIPs de dados por ano, sem necessidade de scraping) — migration 0018_nota_transparencia.sql ainda não rodada neste ambiente."
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/dados" className="hover:text-primary">
          Betim em Dados
        </Link>{" "}
        · <span className="text-text">Nota Betim</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Nota Betim — Transparência Pública
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Todo ano, o Programa Nacional de Transparência Pública (PNTP) avalia
        se prefeituras e câmaras publicam o que a Lei de Acesso à Informação
        exige — e quão fácil é achar. Abaixo, a nota de Betim e sua posição
        entre os 853 municípios de Minas Gerais avaliados.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {prefeitura && <CardAvaliacao titulo="Prefeitura de Betim" avaliacao={prefeitura} />}
        {camara && <CardAvaliacao titulo="Câmara Municipal de Betim" avaliacao={camara} />}
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          O que este dado é — e o que não é
        </h2>
        <p className="mt-2">
          O <strong className="font-semibold text-text">PNTP</strong> é
          conduzido pela ATRICON (Associação dos Membros dos Tribunais de
          Contas do Brasil) em parceria com os Tribunais de Contas
          estaduais — é uma avaliação técnica de transparência ativa e
          passiva (o que é publicado sem pedir, e como responde a um
          pedido via LAI), não uma nota de qualidade de gestão ou de
          honestidade.
        </p>
        <p className="mt-2">
          Os níveis vão de <strong className="font-semibold text-text">Inicial</strong> (pior) a{" "}
          <strong className="font-semibold text-text">Diamante</strong> (melhor), passando por
          Básico, Intermediário, Elevado, Prata e Ouro conforme o índice
          calculado a partir de um questionário público.
        </p>
        <p className="mt-2">
          Prefeitura e Câmara são avaliadas separadamente porque são
          órgãos distintos, cada um responsável pela própria transparência
          — não é incomum que um esteja bem à frente do outro.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent bg-accent/10 px-6 py-5">
        <div>
          <strong className="text-[1.05em]">Quer conferir na fonte?</strong>
          <p className="mt-1 text-sm text-text-soft">
            O Radar da Transparência da ATRICON publica a metodologia
            completa e os dados de todos os municípios do Brasil.
          </p>
        </div>
        <Link
          href="https://radardatransparencia.atricon.org.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          Radar da Transparência ↗
        </Link>
      </div>
    </div>
  );
}
