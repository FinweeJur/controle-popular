import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import { notFound } from "next/navigation";
import FormularioOficio from "./FormularioOficio";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import { obterProposicao } from "@/lib/congresso/proposicoes";
import { obterOrgao } from "@/lib/congresso/orgaos";
import { sugerirDestinatarios } from "@/lib/congresso/oficio/compor";

/**
 * Mesmo padrão de `proposicoes/[id]` (Fase 5 — estaticização): 5.500+
 * proposições, pré-render total inviável no build. Vazio + `dynamicParams`
 * (default `true`) = render sob demanda com cache em vez de `ƒ` a cada
 * request. O formulário em si (`FormularioOficio`) já é client component
 * sem estado de sessão — cachear o shell do servidor é seguro.
 *
 * Sem `revalidate` desde a Fase 6, pelo mesmo motivo de `proposicoes/[id]`:
 * cache read-only no Worker torna a revalidação em runtime impossível, e
 * tentá-la só gerava erro e CPU gasta. Atualização = rebuild agendado.
 */
export async function generateStaticParams() {
  return [];
}

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const dados = await obterProposicao(id);
  return {
    title: `Ofício sobre ${dados?.proposicao.identificacao ?? "proposição"} — Controle Popular · Congresso`,
  };
}

export default async function PaginaOficio({ params }: { params: Params }) {
  const { id } = await params;
  const dados = await obterProposicao(id);
  if (!dados) notFound();

  const { proposicao: p, analise, itens, autores } = dados;
  // Membros da comissão onde a matéria está agora — é quem decide, não o
  // autor do PL. `obterOrgao` degrada para null se a migration dos
  // membros ainda não rodou; `sugerirDestinatarios` trata isso como lista
  // vazia e o formulário sobra só com o(s) autor(es), sem quebrar.
  const orgao = p.orgao_atual ? await obterOrgao(p.orgao_atual) : null;
  const destinatarios = sugerirDestinatarios(p, autores, orgao?.membros ?? []);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <nav className="text-sm">
        <Link href={`/proposicoes/${id}`} className="underline">
          ← voltar para {p.identificacao}
        </Link>
      </nav>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">Manifestar-se sobre {p.identificacao}</h1>
        <p className="opacity-85">{p.ementa}</p>
        <div className="flex flex-wrap items-center gap-3">
          <RotuloBadge rotulo={analise?.rotulo} score={analise?.score} tamanho="sm" />
          {p.orgao_atual ? (
            <span className="text-sm opacity-70">tramitando em {p.orgao_atual}</span>
          ) : null}
        </div>
      </header>

      <section className="rounded-lg border border-[var(--cp-border)] p-5 text-sm">
        <h2 className="font-semibold">Como este documento é montado</h2>
        <p className="mt-2 opacity-85">
          O ofício é composto por regra fixa a partir de dados oficiais: a identificação e
          a ementa vêm da fonte da casa legislativa, a situação vem da tramitação real, e
          a fundamentação vem dos{" "}
          {itens.length > 0 ? (
            <Link href={`/proposicoes/${id}`} className="underline">
              {itens.length} itens da análise
            </Link>
          ) : (
            "itens da análise"
          )}
          , cada um com o dispositivo legal que o sustenta e a citação literal do projeto.
        </p>
        {itens.length === 0 ? (
          <p className="mt-2 opacity-85">
            Esta proposição ainda não tem análise, então o ofício sai sem a seção de
            fundamentação jurídica — use o campo de parágrafo próprio para escrever a sua.
          </p>
        ) : null}
        <p className="mt-2 opacity-85">
          Nenhuma afirmação jurídica é escrita por inteligência artificial. A IA entra, se
          você quiser, apenas para melhorar a redação — e é impedida de acrescentar lei,
          artigo, data ou número; se tentar, a revisão é descartada e você recebe o texto
          original.
        </p>
      </section>

      <FormularioOficio
        proposicaoId={id}
        identificacao={p.identificacao ?? ""}
        destinatariosSugeridos={destinatarios}
      />
    </div>
  );
}
