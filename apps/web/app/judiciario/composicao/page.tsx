import type { Metadata } from "next";
import Link from "next/link";
import { PainelFacetas } from "@/app/components/PainelFacetas";
import {
  listarNomeacoes,
  listarTribunais,
  proximasVacancias,
  type Nomeacao,
  type Ocupacao,
  type Tribunal,
} from "@/lib/judiciario/tribunais";
import { rotuloCota, rotuloResultado } from "@/lib/judiciario/rotulos";
import { resumoProcedencia, type ResumoProcedencia } from "@/lib/judiciario/procedencia";
import FonteRodape, {
  FONTE_REGUA,
  FONTE_SENADO,
} from "@/app/judiciario/components/FonteRodape";

/**
 * @file `/judiciario/composicao` — painel único da composição dos tribunais.
 *
 * O QUE MUDOU (02/11/2026): eram três rotas irmãs — `/judiciario/tribunais`,
 * `/judiciario/vagas` e `/judiciario/indicacoes` — respondendo três perguntas
 * sobre a MESMA entidade, a cadeira do tribunal: quem ocupa, quando vaga e
 * quem indicou. Agora é uma URL canônica com `?lente=`, e cada lente mostra
 * os números e a lista que saem do mesmo recorte.
 *
 * ARQUITETURA (e por quê): a faceta é LINK, com estado na URL, e a página é
 * renderizada no servidor — nada de `useState` segurando coleção (AGENTS
 * §5.1) e a casca não desmonta entre um clique e outro (§5.13). Cada lente
 * fica compartilhável e funciona sem JavaScript.
 *
 * POR QUE ESTAS TRÊS E NÃO O EIXO INTEIRO: as demais rotas do Judiciário têm
 * dado próprio, tabela própria ou cliente próprio — contatos (catálogo de
 * 990 unidades), instituições (diretório com cliente), inspeções,
 * correições, presídios, defensoria, números, SIRENEJud e recomendações.
 * Juntá-las por prefixo faria um painel que não é irmão de si mesmo.
 *
 * NÚMEROS: nenhum número fixo nesta página. Os cards saem de
 * `listarTribunais`, `proximasVacancias` e `listarNomeacoes`, e o N de cada
 * faceta é medido no mesmo array que alimenta a lista daquela lente. Onde há
 * percentual, o denominador aparece na mesma frase.
 */

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Metadata ESTÁTICA, de propósito: no alvo `output: 'export'` a página é
 * gerada uma vez, sem `searchParams`, e metadata dinâmica ali é promessa que
 * o alvo não cumpre. O canonical de cada lente entra como `<link>` no corpo,
 * que o React promove ao `<head>` — mesmo recurso da página-ponte.
 */
export const metadata: Metadata = {
  title: "Composição dos tribunais — Controle Popular · Judiciário",
  description:
    "Painel único do Judiciário: quem ocupa cada tribunal, quando cada cadeira vaga pela aposentadoria aos 75 anos e quem indicou cada ministro ao Senado.",
};

type Lente = "tribunais" | "vagas" | "indicacoes";

/** Facetas válidas. `tribunais` é a lente padrão e a URL sem query. */
const LENTES: { slug: Lente; rotulo: string }[] = [
  { slug: "tribunais", rotulo: "Tribunais" },
  { slug: "vagas", rotulo: "Próximas vagas" },
  { slug: "indicacoes", rotulo: "Indicações" },
];

function lenteDe(valor: string | string[] | undefined): Lente {
  const bruto = Array.isArray(valor) ? valor[0] : valor;
  return LENTES.some((l) => l.slug === bruto) ? (bruto as Lente) : "tribunais";
}

/** URL canônica da lente. A padrão não carrega query — uma URL só por conteúdo. */
function hrefLente(lente: Lente): string {
  return lente === "tribunais"
    ? "/judiciario/composicao"
    : `/judiciario/composicao?lente=${lente}`;
}

const fmtData = (d: string | null) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR") : "—";

/** Teto da consulta. Se bater no teto, a tela diz que a lista foi truncada. */
const LIMITE_VAGAS = 1000;

const RAMO_NOME: Record<string, string> = {
  constitucional: "Constitucional",
  superior: "Superior",
  trabalho: "Trabalho",
  militar: "Militar",
  eleitoral: "Eleitoral",
};

function CartaoTribunal({ tribunal }: { tribunal: Tribunal }) {
  return (
    <Link
      href={`/judiciario/tribunais/${tribunal.id}`}
      className="rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">
          <span className="uppercase">{tribunal.id}</span>
        </h3>
        {/* `n_cadeiras` é NULO quando o total legal não foi conferido
            (TJMG). Sem o `?`, o card imprimia " cadeiras" sem número —
            lido como zero, ou como bug. */}
        <span className="font-tabular text-sm opacity-60">
          {tribunal.n_cadeiras
            ? `${tribunal.n_cadeiras} cadeiras`
            : "total de cadeiras não conferido"}
        </span>
      </div>
      <p className="text-sm opacity-80">{tribunal.nome}</p>
      <p className="mt-1 text-xs opacity-60">
        {RAMO_NOME[tribunal.ramo] ?? tribunal.ramo}
        {/* Três casos, não dois: "não exige sabatina" não é o mesmo que
            "membros eleitos". TJ e TRF são nomeados pelo Executivo sem
            passar pelo Senado — dizer "membros eleitos" ali é falso. */}
        {tribunal.exige_sabatina_senado
          ? " · sabatina do Senado"
          : tribunal.instancia === "segunda"
            ? " · nomeação sem sabatina do Senado"
            : " · membros eleitos"}
        {tribunal.base_legal ? ` · ${tribunal.base_legal}` : ""}
      </p>
    </Link>
  );
}

function SecaoTribunais({ tribunais }: { tribunais: Tribunal[] }) {
  const comTotal = tribunais.filter((t) => (t.n_cadeiras ?? 0) > 0);
  const totalCadeiras = comTotal.reduce((soma, t) => soma + (t.n_cadeiras ?? 0), 0);
  const semTotal = tribunais.length - comTotal.length;

  return (
    <section aria-labelledby="titulo-tribunais" className="space-y-4">
      <div>
        <h2 id="titulo-tribunais" className="font-display text-2xl font-bold text-foreground">
          Tribunais acompanhados
        </h2>
        <p className="text-sm text-muted">
          {tribunais.length} tribunais; {totalCadeiras} cadeiras legais em {comTotal.length} deles
          com total conferido.
          {semTotal > 0
            ? ` Nos outros ${semTotal}, o total legal ainda não foi conferido e não é estimado.`
            : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {tribunais.map((t) => (
          <CartaoTribunal key={t.id} tribunal={t} />
        ))}
      </div>

      <p className="text-sm opacity-70">
        A 2ª instância (27 TJs, TRFs, TRTs) entra por adoção incremental. Ver{" "}
        <Link href="/judiciario/metodologia" className="underline">
          metodologia
        </Link>
        .
      </p>
    </section>
  );
}

function LinhasVagas({ vagas }: { vagas: Ocupacao[] }) {
  return (
    <>
      {/* Desktop: tabela. */}
      <div className="hidden overflow-hidden rounded-lg border border-[var(--cp-border)] sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--cp-border)] text-left">
              <th className="px-3 py-2">Tribunal</th>
              <th className="px-3 py-2">Ministro(a)</th>
              <th className="px-3 py-2">Cota</th>
              <th className="px-3 py-2">Vacância projetada</th>
            </tr>
          </thead>
          <tbody>
            {vagas.map((o) => (
              <tr key={o.ocupacao_id} className="border-b border-[var(--cp-border)] last:border-0">
                <td className="px-3 py-2">
                  <Link
                    href={`/judiciario/tribunais/${o.tribunal_id}`}
                    className="uppercase underline"
                  >
                    {o.tribunal_id}
                  </Link>
                </td>
                <td className="px-3 py-2">{o.magistrado_nome}</td>
                <td className="px-3 py-2 opacity-70">{rotuloCota(o.cota)}</td>
                <td className="px-3 py-2 font-tabular">{fmtData(o.vacancia_projetada)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Celular: o mesmo dado em cartão, sem rolagem lateral (390 px). */}
      <ul className="space-y-3 text-sm sm:hidden">
        {vagas.map((o) => (
          <li key={o.ocupacao_id} className="rounded-lg border border-[var(--cp-border)] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/judiciario/tribunais/${o.tribunal_id}`}
                className="font-semibold uppercase underline"
              >
                {o.tribunal_id}
              </Link>
              <span className="font-tabular text-xs opacity-70">
                {fmtData(o.vacancia_projetada)}
              </span>
            </div>
            <p className="mt-1">{o.magistrado_nome}</p>
            <p className="mt-0.5 text-xs opacity-60">{rotuloCota(o.cota)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

function SecaoVagas({ vagas }: { vagas: Ocupacao[] }) {
  if (vagas.length === 0) {
    return (
      <section aria-labelledby="titulo-vagas" className="space-y-4">
        <h2 id="titulo-vagas" className="font-display text-2xl font-bold text-foreground">
          Próximas vagas por aposentadoria
        </h2>
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          As datas de aposentadoria ainda não estão disponíveis para nenhum tribunal — a composição
          de cada um está sendo conferida nome a nome antes de publicar.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="titulo-vagas" className="space-y-4">
      <div>
        <h2 id="titulo-vagas" className="font-display text-2xl font-bold text-foreground">
          Próximas vagas por aposentadoria
        </h2>
        <p className="max-w-3xl text-sm text-muted">
          {vagas.length} ocupações com data de nascimento conhecida, ordenadas pela vacância
          projetada. A conta é nascimento + 75 anos (LC 152/2015) — é o <strong>mínimo</strong> que
          falta: a cadeira pode vagar antes, por saída, morte ou renúncia.
          {vagas.length === LIMITE_VAGAS
            ? ` A lista foi limitada às ${LIMITE_VAGAS} primeiras — o total pode ser maior.`
            : ""}
        </p>
      </div>
      <LinhasVagas vagas={vagas} />
    </section>
  );
}

function ListaIndicacoes({ nomeacoes }: { nomeacoes: Nomeacao[] }) {
  return (
    <ul className="space-y-3 text-sm">
      {nomeacoes.map((n) => (
        <li key={n.id} className="rounded-lg border border-[var(--cp-border)] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-display font-semibold">{n.senado_identificacao}</span>
            <span className="font-tabular text-xs opacity-60">
              {n.tribunal_id?.toUpperCase()} · votado em {fmtData(n.data_deliberacao)}
            </span>
          </div>
          {n.senado_ementa && <p className="mt-1 opacity-80">{n.senado_ementa}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {n.resultado && (
              <span
                className={
                  n.resultado === "rejeitado_plenario"
                    ? "font-medium text-alert"
                    : "opacity-60"
                }
              >
                {rotuloResultado(n.resultado)}
              </span>
            )}
            {n.dispositivo_vaga && <span className="opacity-60">{n.dispositivo_vaga}</span>}
            {n.antecessor_nome && <span className="opacity-60">vaga de {n.antecessor_nome}</span>}
            {/* A procedência clicável de cada indicação. `url_fonte` já vinha
                do ETL (`url_documento` do processo do Senado). */}
            {n.url_fonte && (
              <a
                href={n.url_fonte}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                documento no Senado ↗
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SecaoIndicacoes({ indicacoes }: { indicacoes: Nomeacao[] }) {
  return (
    <section aria-labelledby="titulo-indicacoes" className="space-y-4">
      <div>
        <h2 id="titulo-indicacoes" className="font-display text-2xl font-bold text-foreground">
          Indicações ao Senado
        </h2>
        <p className="max-w-3xl text-sm text-muted">
          {indicacoes.length} indicações registradas para STF, STJ, TST, STM e demais tribunais com
          sabatina. O TSE não passa pelo Senado: seus membros são escolhidos pelos próprios
          tribunais.
        </p>
      </div>

      {indicacoes.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhuma indicação disponível no momento.
        </p>
      ) : (
        <ListaIndicacoes nomeacoes={indicacoes} />
      )}

      <p className="text-sm opacity-70">
        O voto de cada senador na sabatina é secreto por regra do próprio Senado — só o resultado
        final (aprovado ou rejeitado) é público, e é isso que o app mostra.
      </p>
    </section>
  );
}

function ConteudoLente({
  lente,
  tribunais,
  vagas,
  indicacoes,
}: {
  lente: Lente;
  tribunais: Tribunal[];
  vagas: Ocupacao[];
  indicacoes: Nomeacao[];
}) {
  if (lente === "vagas") return <SecaoVagas vagas={vagas} />;
  if (lente === "indicacoes") return <SecaoIndicacoes indicacoes={indicacoes} />;
  return <SecaoTribunais tribunais={tribunais} />;
}

function RodapeLente({
  lente,
  procedencia,
}: {
  lente: Lente;
  procedencia: ResumoProcedencia;
}) {
  if (lente === "indicacoes") {
    return <FonteRodape fontes={[FONTE_SENADO]} nota={procedencia.frase ?? undefined} />;
  }
  return (
    <FonteRodape
      fontes={[FONTE_REGUA]}
      nota={
        lente === "vagas"
          ? "A data de nascimento de cada ministro vem da composição publicada pelo próprio tribunal, creditada na página dele."
          : "Esta página é só a régua legal — cadeiras e cotas. Quem ocupa, e de que página oficial esse nome foi copiado, é a página de cada tribunal, que credita a própria fonte."
      }
    />
  );
}

export default async function ComposicaoPage({ searchParams }: Props) {
  const params = await searchParams;
  const lente = lenteDe(params.lente);

  // Um único conjunto de consultas alimenta as três lentes e os N dos
  // botões. Nunca há uma segunda contagem para "conferir" a primeira.
  const [tribunais, vagas, nomeacoes] = await Promise.all([
    listarTribunais(),
    proximasVacancias(LIMITE_VAGAS),
    listarNomeacoes(),
  ]);
  const indicacoes = nomeacoes ?? [];
  const procedencia = resumoProcedencia(indicacoes);

  const facetas = [
    { slug: "vagas", rotulo: "Próximas vagas", n: vagas.length },
    { slug: "indicacoes", rotulo: "Indicações", n: indicacoes.length },
  ];

  return (
    <main id="conteudo-principal" className="mx-auto w-full max-w-5xl px-4 py-8">
      <link rel="canonical" href={hrefLente(lente)} />
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/judiciario" className="hover:text-primary transition">
          Judiciário
        </Link>{" "}
        · <span className="text-foreground font-semibold">Composição</span>
      </nav>

      <header className="mt-4 space-y-3">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Judiciário · composição e renovação
        </p>
        <h1 className="text-3xl font-bold">Composição dos tribunais</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
          Quem ocupa cada tribunal, quando cada cadeira vaga pela aposentadoria obrigatória aos 75
          anos e quem indicou cada ministro ao Senado. Escolha a lente e os números e a lista abaixo
          mudam juntos — o N do botão e o da lista saem da mesma consulta.
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <PainelFacetas
          facetas={facetas}
          atual={lente === "tribunais" ? undefined : lente}
          total={tribunais.length}
          hrefDe={(slug) => (slug ? hrefLente(slug as Lente) : hrefLente("tribunais"))}
          titulo="Recorte da composição"
          ariaLabel="Recorte da composição dos tribunais"
          rotuloTodos="Tribunais"
          nota="N = tribunais acompanhados, ocupações com data de nascimento conhecida e indicações registradas no Senado. Cada botão mede o próprio bloco; gavetas diferentes não se somam."
        />

        <ConteudoLente
          lente={lente}
          tribunais={tribunais}
          vagas={vagas}
          indicacoes={indicacoes}
        />

        <RodapeLente lente={lente} procedencia={procedencia} />
      </div>
    </main>
  );
}
