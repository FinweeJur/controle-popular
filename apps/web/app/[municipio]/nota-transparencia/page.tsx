import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import { getNotaTransparenciaData, type AvaliacaoPntp } from "@/lib/betim/notaTransparencia";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { formatNumberBR } from "@/lib/betim/format";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

const UF_POR_EXTENSO: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia",
  RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe",
  TO: "Tocantins",
};

export const generateMetadata = metadataDaCidade(
  (c) => `Nota ${c.nome} (PNTP) — ${nomePortal(c)}`,
  (c) => `Nota de transparência de ${c.nome} no ranking estadual (PNTP/ATRICON).`
);

const NIVEL_COR: Record<string, string> = {
  Diamante: "text-accent",
  Ouro: "text-accent",
  Elevado: "text-accent",
  Prata: "text-text",
  Intermediário: "text-text",
  Básico: "text-alert",
  Inicial: "text-alert",
};

/**
 * `ufExtenso` chega por prop porque a frase é "X de N avaliados em <estado>",
 * e o estado era o literal "Minas Gerais" — que a página de São Paulo exibia
 * sobre um ranking de 645 municípios paulistas. A planilha do PNTP é
 * nacional; só o recorte é estadual.
 */
function CardAvaliacao({
  titulo,
  avaliacao,
  ufExtenso,
}: {
  titulo: string;
  avaliacao: AvaliacaoPntp;
  ufExtenso: string;
}) {
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
      {avaliacao.posicaoRankingUf && avaliacao.totalAvaliadosUf && (
        <p className="mt-1 text-xs">
          <strong className="font-tabular text-text">{avaliacao.posicaoRankingUf}º</strong> de{" "}
          {avaliacao.totalAvaliadosUf} avaliados em {ufExtenso}
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

export default async function NotaBetimPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  // Mesmo de-para do ETL (`etl/apis/pntp.py`): a sigla vem de `municipios` e
  // a frase pede o nome por extenso. Sem entrada, cai na sigla — dizer "em
  // SP" é feio, dizer "em Minas Gerais" numa página de São Paulo é falso.
  const ufExtenso = UF_POR_EXTENSO[cidade.uf] ?? cidade.uf;
  const { configured, ok, prefeitura, camara } = await getNotaTransparenciaData(cidade.id_municipio);
  const totalAvaliados = prefeitura?.totalAvaliadosUf ?? camara?.totalAvaliadosUf ?? null;
  const temDados = configured && ok && (prefeitura || camara);

  if (!temDados) {
    return (
      <PaginaEmBreve
        titulo={`Nota ${cidade.nome}`}
        descricao={`Nota de transparência de ${cidade.nome} no Programa Nacional de Transparência Pública (PNTP/ATRICON), com ranking entre os municípios do estado.`}
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
          {cidade.nome} em Dados
        </Link>{" "}
        · <span className="text-text">Nota {cidade.nome}</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Nota {cidade.nome} — Transparência Pública
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Todo ano, o Programa Nacional de Transparência Pública (PNTP) avalia
        se prefeituras e câmaras publicam o que a Lei de Acesso à Informação
        exige — e quão fácil é achar. Abaixo, a nota de {cidade.nome} e sua
        {/* "os 853 municípios de Minas Gerais" estava escrito à mão e
            aparecia na página de São Paulo, cujo ranking é entre 645
            paulistas. O total vem do próprio dado — é o mesmo número que os
            cards exibem, então não há como os dois discordarem. */}
        {totalAvaliados
          ? ` posição entre os ${formatNumberBR(totalAvaliados)} municípios de ${ufExtenso} avaliados.`
          : ` posição no ranking de ${ufExtenso}.`}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {prefeitura && (
          <CardAvaliacao
            titulo={`Prefeitura de ${cidade.nome}`}
            avaliacao={prefeitura}
            ufExtenso={ufExtenso}
          />
        )}
        {camara && (
          <CardAvaliacao
            titulo={`Câmara Municipal de ${cidade.nome}`}
            avaliacao={camara}
            ufExtenso={ufExtenso}
          />
        )}
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
