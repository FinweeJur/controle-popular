import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import { notFound } from "next/navigation";
import AnaliseAuditavel from "@/app/congresso/components/AnaliseAuditavel";
import VicioAuditavel from "@/app/congresso/components/VicioAuditavel";
import { obterProposicao, listarProposicoes } from "@/lib/congresso/proposicoes";
import { exportandoEstatico, TETO_PAGINAS_ESTATICAS } from "@/lib/alvo-de-build";

/**
 * 5.500+ proposições — pré-render total no build seria caro demais (ao
 * contrário de `comissoes/[sigla]`/`bancadas/[id]`, com dezenas de ids).
 * Devolver vazio + `dynamicParams` (default `true`) faz o Next tratar
 * qualquer id não listado aqui como render sob demanda COM cache: a 1ª
 * visita renderiza e grava, as seguintes servem do cache — sem cair de
 * volta pro `ƒ` (dinâmico a cada request) que tínhamos antes.
 *
 * O `revalidate = 900` que ficava aqui saiu na Fase 6 (junto com os outros
 * 14 do app), e o cache passa a não expirar. É o certo neste runtime: o
 * incrementalCache do Worker é o de Static Assets, READ-ONLY, então a
 * revalidação nunca teve como acontecer — passados 15 min ela falhava a
 * CADA request, logando "Failed to revalidate" + "Dummy queue is not
 * implemented" e queimando CPU num Worker que já tem aperto de CPU. A
 * atualização vem do rebuild agendado (`.github/workflows/rebuild.yml`).
 * Conferido por diff da tabela de rotas antes/depois: continua `●`.
 */
export async function generateStaticParams() {
  // No Cloudflare, lista vazia + `dynamicParams` (default `true`) é
  // deliberado: 5.500+ proposições, render sob demanda com cache. Em
  // `output: 'export'` não existe sob demanda — o que não sair daqui vira
  // 404 permanente —, então o alvo estático precisa da lista de verdade.
  if (!exportandoEstatico) return [];

  const pagina = await listarProposicoes({ porPagina: TETO_PAGINAS_ESTATICAS });
  const itens = pagina?.itens ?? [];
  if ((pagina?.total ?? 0) > itens.length) {
    // Truncar em silêncio faria o site parecer completo. Ver
    // `TETO_PAGINAS_ESTATICAS`.
    console.warn(
      `[export] proposições do Congresso truncadas: ${itens.length} de ${pagina?.total} ` +
        `páginas geradas (teto de ${TETO_PAGINAS_ESTATICAS}).`
    );
  }
  return itens.map((p) => ({ id: String(p.id) }));
}

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const dados = await obterProposicao(id);
  if (!dados) return { title: "Proposição — Controle Popular · Congresso" };
  return {
    title: `${dados.proposicao.identificacao} — Controle Popular · Congresso`,
    description: dados.proposicao.ementa ?? undefined,
  };
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

export default async function ProposicaoDetalhe({ params }: { params: Params }) {
  const { id } = await params;
  const dados = await obterProposicao(id);
  if (!dados) notFound();

  const { proposicao: p, analise, itens, vicio, vicioItens, autoriaCompleta, tramitacoes } = dados;

  // Destinatários sugeridos vêm da tramitação REAL, não do autor: quem
  // decide a proposição agora é o colegiado onde ela está parada. Mandar
  // ofício para o autor de um PL que já saiu da mão dele é gastar tiro.
  const orgaoAtual = p.orgao_atual;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <nav className="text-sm">
        <Link href="/proposicoes" className="underline">
          ← todas as proposições
        </Link>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">{p.identificacao}</h1>
        <p className="text-lg opacity-90">{p.ementa}</p>
        {p.ementa_detalhada ? (
          <p className="opacity-75">{p.ementa_detalhada}</p>
        ) : null}

        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="inline opacity-70">Apresentada em: </dt>
            <dd className="inline">{formatarData(p.data_apresentacao)}</dd>
          </div>
          <div>
            <dt className="inline opacity-70">Situação: </dt>
            <dd className="inline">{p.situacao ?? "não registrada"}</dd>
          </div>
          <div>
            <dt className="inline opacity-70">Onde está agora: </dt>
            <dd className="inline">{orgaoAtual ?? "—"}</dd>
          </div>
          <div>
            <dt className="inline opacity-70">Última movimentação: </dt>
            <dd className="inline">{formatarData(p.data_ultima_tramitacao)}</dd>
          </div>
        </dl>

        {p.temas_oficiais?.length ? (
          <div className="flex flex-wrap gap-2">
            {p.temas_oficiais.map((t) => (
              <Link
                key={t}
                href={{ pathname: "/proposicoes", query: { tema: t } }}
                className="rounded-md border border-[var(--cp-border)] px-2 py-0.5 text-xs"
              >
                {t}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 text-sm">
          {p.url_fonte ? (
            <a href={p.url_fonte} target="_blank" rel="noopener noreferrer" className="underline">
              Ver na fonte oficial ↗
            </a>
          ) : null}
          {p.url_inteiro_teor ? (
            <a
              href={p.url_inteiro_teor}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Inteiro teor (PDF) ↗
            </a>
          ) : null}
        </div>
      </header>

      {/* Lista a autoria COMPLETA (`autoriaCompleta`), não só a parlamentar
          (`autores`). Esta seção ficava em branco em toda proposição do
          Poder Executivo ou de comissão — 1.117 delas neste banco. */}
      {autoriaCompleta.length ? (
        <section>
          <h2 className="font-display text-xl font-semibold">
            Autoria{" "}
            <span className="font-normal opacity-70">({autoriaCompleta.length})</span>
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {autoriaCompleta.map((a) => (
              <li
                key={a.nome}
                className="rounded-md border border-[var(--cp-border)] px-3 py-1"
                title={a.tipo ?? undefined}
              >
                {a.parlamentar_id ? (
                  <Link href={`/parlamentares/${a.parlamentar_id}`} className="underline">
                    {a.nome}
                  </Link>
                ) : (
                  a.nome
                )}
                {a.partido ? ` (${a.partido}${a.uf ? `/${a.uf}` : ""})` : ""}
                {a.institucional ? (
                  <span className="ml-1 opacity-70">· {a.tipo?.toLowerCase()}</span>
                ) : null}
                {a.proponente ? <span className="ml-1 opacity-70">· proponente</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AnaliseAuditavel analise={analise} itens={itens} />

      <VicioAuditavel vicio={vicio} itens={vicioItens} />

      <section className="rounded-lg border border-[var(--cp-border)] p-5">
        <h2 className="font-display text-xl font-semibold">Manifestar-se sobre esta proposição</h2>
        <p className="mt-2 opacity-80">
          Gerar ofício de apoio, de repúdio ou pedido de vista, endereçado a quem decide
          esta proposição agora
          {orgaoAtual ? ` (${orgaoAtual})` : ""} — exportável em TXT, PDF e DOCX.
        </p>
        <Link
          href={`/proposicoes/${p.id}/oficio`}
          className="mt-4 inline-block rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-[var(--cp-primary-ink)]"
        >
          Gerar ofício
        </Link>
      </section>

      {tramitacoes.length ? (
        <section>
          <h2 className="font-display text-xl font-semibold">
            Tramitação{" "}
            <span className="font-normal opacity-70">({tramitacoes.length} eventos)</span>
          </h2>
          <ol className="mt-3 space-y-3 border-l border-[var(--cp-border)] pl-4">
            {tramitacoes.slice(0, 20).map((t) => (
              <li key={t.sequencia}>
                <p className="text-sm font-medium">
                  {formatarData(t.data_hora)} · {t.sigla_orgao}
                </p>
                <p className="text-sm opacity-85">{t.descricao}</p>
                {t.despacho ? (
                  <p className="mt-1 text-sm opacity-65">{t.despacho}</p>
                ) : null}
              </li>
            ))}
          </ol>
          {tramitacoes.length > 20 ? (
            <p className="mt-2 text-sm opacity-70">
              Mostrando os 20 eventos mais recentes de {tramitacoes.length}.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
