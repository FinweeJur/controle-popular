"use client";

import { useMemo, useState } from "react";
import type { Cidade } from "@/lib/db/queries/municipios";
import {
  NECESSIDADE_LABEL,
  NECESSIDADE_ORDEM,
  ABRANGENCIA_LABEL,
  NATUREZA_LABEL,
  NAO_VERIFICADO,
  montarItensPainel,
  itensSemCidade,
  type ItemPainel,
  type Necessidade,
  type Natureza,
} from "@/lib/betim/redeProtecao";

/**
 * Seletor de duas perguntas — "o que você precisa" e "onde você está" —
 * NESSA ORDEM, para as portas "Onde buscar ajuda" e "Como pedir informação"
 * de `/direitos-em-movimento`. Decisão do dono, `docs/PLANO-DIREITOS-EM-
 * MOVIMENTO.md`: quem sofreu violação não sabe em que aba do site está,
 * sabe o que aconteceu com ele — perguntar a cidade primeiro inverteria a
 * ordem do problema real.
 *
 * NÃO reimplementa a regra de quem aparece por cidade: `montarItensPainel`
 * (a mesma função de `/[municipio]/rede-de-protecao`) decide isso. Este
 * componente só decide OUANDO perguntar a cidade e o que mostrar antes
 * dela — `itensSemCidade()`, para quem ainda não respondeu.
 *
 * `necessidadeFixa` existe para a porta de LAI (`/direitos-em-movimento/
 * informacao`): ali a necessidade já É "pedir_informacao", perguntar de
 * novo seria o mesmo passo em duplicidade.
 */

const TIPO_LABEL: Record<ItemPainel["tipo"], string> = {
  informacao: "Peço informação (LAI)",
  ajuda: "Busco ajuda",
};

const NATUREZA_COR: Record<Natureza, { cor: string; ink: string }> = {
  oficial: { cor: "var(--cp-primary)", ink: "var(--cp-primary-ink)" },
  popular: { cor: "var(--cp-secondary)", ink: "var(--cp-secondary-ink)" },
  academico: { cor: "var(--cp-tertiary)", ink: "var(--cp-tertiary-ink)" },
};

interface Props {
  cidades: Cidade[];
  necessidadeFixa?: Necessidade;
}

export default function SeletorRedeGeral({ cidades, necessidadeFixa }: Props) {
  const [necessidade, setNecessidade] = useState<Necessidade | "">(necessidadeFixa ?? "");
  const [cidadeSlug, setCidadeSlug] = useState<string>("");
  const [outraCidadeNome, setOutraCidadeNome] = useState<string>("");

  const necessidadeAtual = necessidadeFixa ?? necessidade;
  const cidadeEscolhida = cidades.find((c) => c.slug === cidadeSlug) ?? null;
  const respondeuOutra = cidadeSlug === "__outra__";

  const itensBase = useMemo(
    () => (cidadeEscolhida ? montarItensPainel(cidadeEscolhida) : itensSemCidade()),
    [cidadeEscolhida]
  );

  const itens = useMemo(
    () =>
      necessidadeAtual
        ? itensBase.filter((it) => it.necessidades.includes(necessidadeAtual))
        : itensBase,
    [itensBase, necessidadeAtual]
  );

  return (
    <div>
      {!necessidadeFixa && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-[.9em] font-semibold text-text">1. O que você precisa?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {NECESSIDADE_ORDEM.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNecessidade((atual) => (atual === n ? "" : n))}
                aria-pressed={necessidade === n}
                className="cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
                style={
                  necessidade === n
                    ? { background: "var(--cp-tertiary)", color: "var(--cp-tertiary-ink)", borderColor: "var(--cp-tertiary)" }
                    : { borderColor: "var(--border)" }
                }
              >
                {NECESSIDADE_LABEL[n]}
              </button>
            ))}
          </div>
        </div>
      )}

      {!necessidadeAtual ? (
        <p className="mt-6 text-sm text-text-soft">
          Escolha o que você precisa acima para ver os canais — estadual e federal aparecem
          na hora, sem precisar dizer onde você está.
        </p>
      ) : (
        <>
          <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
            <p className="text-[.9em] font-semibold text-text">
              {necessidadeFixa ? "Canais de pedido de informação" : "2. Onde você está?"}
            </p>
            {!necessidadeFixa && (
              <p className="mt-1 text-sm text-text-soft">
                Opcional — o estadual e o federal abaixo já servem sem essa resposta. Só
                responda para ver o canal municipal da sua cidade.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {cidades.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => {
                    setCidadeSlug((atual) => (atual === c.slug ? "" : c.slug));
                    setOutraCidadeNome("");
                  }}
                  aria-pressed={cidadeSlug === c.slug}
                  className="cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
                  style={
                    cidadeSlug === c.slug
                      ? { background: "var(--cp-tertiary)", color: "var(--cp-tertiary-ink)", borderColor: "var(--cp-tertiary)" }
                      : { borderColor: "var(--border)" }
                  }
                >
                  {c.nome} · {c.uf}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCidadeSlug((atual) => (atual === "__outra__" ? "" : "__outra__"))}
                aria-pressed={respondeuOutra}
                className="cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
                style={
                  respondeuOutra
                    ? { background: "var(--cp-tertiary)", color: "var(--cp-tertiary-ink)", borderColor: "var(--cp-tertiary)" }
                    : { borderColor: "var(--border)" }
                }
              >
                Outra cidade
              </button>
            </div>

            {respondeuOutra && (
              <div className="mt-3">
                <label htmlFor="outra-cidade" className="text-xs font-medium text-text-soft">
                  Nome da sua cidade (só para o texto abaixo — não muda o resultado)
                </label>
                <input
                  id="outra-cidade"
                  type="text"
                  value={outraCidadeNome}
                  onChange={(e) => setOutraCidadeNome(e.target.value)}
                  placeholder="ex.: Uberlândia"
                  className="mt-1 block w-full max-w-xs rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
                />
                <p className="mt-2 max-w-2xl rounded-lg border border-dashed border-accent bg-accent/10 px-3 py-2 text-[.85em] text-text">
                  {(outraCidadeNome.trim() || "Sua cidade")} não está entre as 6 cidades que
                  este portal tem cadastradas hoje — <strong>isso não significa que não
                  existe canal municipal aí</strong>, só que o Controle Popular ainda não o
                  levantou. O estadual e o federal abaixo continuam valendo normalmente.
                </p>
              </div>
            )}

            {cidadeEscolhida && (
              <p className="mt-3 text-[.85em] text-text-soft">
                Mostrando também o que é específico de{" "}
                <strong className="text-text">
                  {cidadeEscolhida.nome} · {cidadeEscolhida.uf}
                </strong>
                .
              </p>
            )}
          </div>

          <div className="mt-6">
            <p className="text-sm text-text-soft">
              <strong className="font-tabular text-text">{itens.length}</strong>{" "}
              {itens.length === 1 ? "canal encontrado" : "canais encontrados"}
              {!cidadeEscolhida && " (estadual e federal — sem depender de cidade)"}.
            </p>
            {itens.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
                Nenhum canal catalogado para esta combinação ainda.
              </div>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {itens.map((it) => (
                  <CardItem key={it.id} item={it} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-lg font-semibold text-text">
          Não verificado — não confie sem religar antes
        </h2>
        <p className="mt-2 max-w-[65ch] text-sm text-text-soft">
          Estes canais foram pesquisados, mas não foi possível confirmar que funcionam hoje
          (site fora do ar, bloqueio de acesso automatizado, ou nenhum contato formal
          encontrado). Ficam aqui como pista de pesquisa, isolados do restante — mandar
          alguém em situação de urgência para um telefone não confirmado é pior que dizer
          &quot;confirme antes de ir&quot;.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {NAO_VERIFICADO.map((n) => (
            <li
              key={n.titulo}
              className="rounded-xl border border-dashed border-border bg-surface-2 p-4 text-sm"
            >
              <p className="font-medium text-text">{n.titulo}</p>
              <p className="mt-1 text-text-soft">{n.nota}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Badge({ children, cor, ink }: { children: React.ReactNode; cor: string; ink: string }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: cor, color: ink }}>
      {children}
    </span>
  );
}

function CardItem({ item }: { item: ItemPainel }) {
  const corNatureza = NATUREZA_COR[item.natureza];
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          cor={item.tipo === "informacao" ? "var(--cp-primary)" : "var(--cp-secondary)"}
          ink={item.tipo === "informacao" ? "var(--cp-primary-ink)" : "var(--cp-secondary-ink)"}
        >
          {TIPO_LABEL[item.tipo]}
        </Badge>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {ABRANGENCIA_LABEL[item.abrangencia]}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: corNatureza.cor, color: corNatureza.ink, opacity: 0.85 }}
        >
          {NATUREZA_LABEL[item.natureza]}
        </span>
        {item.gratuito && (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
            Gratuito
          </span>
        )}
      </div>

      <p className="mt-2 font-medium text-text">{item.nome}</p>
      <p className="mt-1 text-sm text-text-soft">{item.oQueAtende}</p>

      {item.prazo && (
        <p className="mt-1 text-xs text-text-soft">
          <span className="font-medium text-text">Prazo: </span>
          {item.prazo}
        </p>
      )}
      {item.endereco && (
        <p className="mt-1 text-xs text-text-soft">
          <span className="font-medium text-text">Endereço: </span>
          {item.endereco}
        </p>
      )}
      {item.telefone && (
        <p className="mt-1 text-xs text-text-soft">
          <span className="font-medium text-text">Telefone: </span>
          {item.telefone}
        </p>
      )}
      {item.nota && (
        <p className="mt-2 text-xs text-text-soft">
          <span className="font-medium text-text">Nota: </span>
          {item.nota}
        </p>
      )}

      {item.necessidades.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {item.necessidades.map((n) => (
            <span key={n} className="rounded-full border border-border px-2 py-0.5 text-[.72em] text-text-soft">
              {NECESSIDADE_LABEL[n]}
            </span>
          ))}
        </div>
      )}

      {item.site && (
        <div className="mt-3">
          <a
            href={item.site}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Abrir site oficial →
          </a>
        </div>
      )}

      <p className="mt-2 text-[.7em] text-text-soft">Verificado em {item.verificadoEm}</p>
    </li>
  );
}
