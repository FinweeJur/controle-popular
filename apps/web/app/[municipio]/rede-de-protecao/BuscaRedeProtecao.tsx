"use client";

import { useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import {
  NECESSIDADE_LABEL,
  NECESSIDADE_ORDEM,
  ABRANGENCIA_LABEL,
  NATUREZA_LABEL,
  type ItemPainel,
  type Necessidade,
  type Abrangencia,
  type Natureza,
} from "@/lib/betim/redeProtecao";

/**
 * Busca de `/[municipio]/rede-de-protecao`. Mesmo padrão de filtro-no-cliente
 * de `BuscaDireitoCritico.tsx` — corpus pequeno (< 40 itens por cidade), sem
 * `searchParams` (quebra `output: 'export'`).
 *
 * O filtro principal é por NECESSIDADE ("o que a pessoa precisa"), não por
 * sigla de órgão — ninguém acorda pensando "preciso de um CREAS". Tipo
 * (peço informação / busco ajuda), abrangência e natureza são filtros
 * secundários, para quem já sabe o que procura.
 */

const TIPO_LABEL: Record<ItemPainel["tipo"], string> = {
  informacao: "Peço informação (LAI)",
  ajuda: "Busco ajuda",
};

function textoBusca(it: ItemPainel): string {
  return semAcento(
    [it.nome, it.oQueAtende, it.nota].filter(Boolean).join(" ")
  );
}

interface Props {
  itens: ItemPainel[];
  cidadeNome: string;
  cidadeEhMG: boolean;
  cidadeEhBH: boolean;
}

export default function BuscaRedeProtecao({ itens, cidadeNome, cidadeEhMG, cidadeEhBH }: Props) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<string>("");
  const [necessidade, setNecessidade] = useState<string>("");
  const [abrangencia, setAbrangencia] = useState<string>("");
  const [natureza, setNatureza] = useState<string>("");

  const necessidadeContagem = useMemo(() => {
    const cont = new Map<string, number>();
    for (const n of NECESSIDADE_ORDEM) cont.set(n, 0);
    for (const it of itens) {
      for (const n of it.necessidades) cont.set(n, (cont.get(n) ?? 0) + 1);
    }
    return cont;
  }, [itens]);

  const termoNormalizado = semAcento(q.trim());

  const filtrados = useMemo(() => {
    return itens.filter((it) => {
      if (tipo && it.tipo !== tipo) return false;
      if (necessidade && !it.necessidades.includes(necessidade as Necessidade)) return false;
      if (abrangencia && it.abrangencia !== (abrangencia as Abrangencia)) return false;
      if (natureza && it.natureza !== (natureza as Natureza)) return false;
      if (termoNormalizado && !textoBusca(it).includes(termoNormalizado)) return false;
      return true;
    });
  }, [itens, tipo, necessidade, abrangencia, natureza, termoNormalizado]);

  const temFiltro = Boolean(q || tipo || necessidade || abrangencia || natureza);

  function limpar() {
    setQ("");
    setTipo("");
    setNecessidade("");
    setAbrangencia("");
    setNatureza("");
  }

  function alternarNecessidade(n: string) {
    setNecessidade((atual) => (atual === n ? "" : n));
  }

  return (
    <div>
      {!cidadeEhBH && (
        <div className="mb-6 rounded-2xl border border-dashed border-accent bg-accent/10 px-5 py-4 text-sm text-text">
          <strong>Cobertura desigual — declarada, não escondida.</strong> A maior parte da
          rede confirmada aqui (delegacias especializadas, clínica jurídica da UFMG,
          Comissões de Direitos Humanos da OAB) está concentrada em Belo Horizonte.{" "}
          {cidadeEhMG ? (
            // Cada `{" "}` explícito existe porque o JSX apara o espaço à
            // esquerda de um texto que começa uma nova linha dentro do
            // mesmo nó — sem ele, "Em {cidadeNome} nem" virava
            // "Em Betimnem" na tela (medido).
            <>
              Em {cidadeNome}{" "}
              nem tudo abaixo tem porta física perto — os itens com abrangência
              &quot;Estadual&quot; funcionam por telefone/site mesmo de longe, mas atendimento
              presencial especializado pode exigir viajar até a capital.
            </>
          ) : (
            <>
              {cidadeNome}{" "}
              não é de Minas Gerais: os itens estaduais de MG (Defensoria, MPMG,
              delegacias, ALMG) não aparecem aqui porque apontariam para o órgão errado do
              estado errado — só os canais municipais e federais servem.
            </>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4"
      >
        <div className="flex min-w-[220px] flex-1 flex-col">
          <label htmlFor="q" className="mb-1 text-xs font-medium text-text-soft">
            Palavra-chave
          </label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ex.: mulher, criança, informação, mineração..."
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="tipo" className="mb-1 text-xs font-medium text-text-soft">
            O que você quer
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-48 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Informação + ajuda</option>
            <option value="informacao">{TIPO_LABEL.informacao}</option>
            <option value="ajuda">{TIPO_LABEL.ajuda}</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="abrangencia" className="mb-1 text-xs font-medium text-text-soft">
            Abrangência
          </label>
          <select
            id="abrangencia"
            value={abrangencia}
            onChange={(e) => setAbrangencia(e.target.value)}
            className="w-40 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todas</option>
            <option value="municipal">{ABRANGENCIA_LABEL.municipal}</option>
            <option value="estadual">{ABRANGENCIA_LABEL.estadual}</option>
            <option value="federal">{ABRANGENCIA_LABEL.federal}</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="natureza" className="mb-1 text-xs font-medium text-text-soft">
            Natureza
          </label>
          <select
            id="natureza"
            value={natureza}
            onChange={(e) => setNatureza(e.target.value)}
            className="w-52 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Oficial + popular + acadêmica</option>
            <option value="oficial">{NATUREZA_LABEL.oficial}</option>
            <option value="popular">{NATUREZA_LABEL.popular}</option>
            <option value="academico">{NATUREZA_LABEL.academico}</option>
          </select>
        </div>

        {temFiltro && (
          <button
            type="button"
            onClick={limpar}
            className="cursor-pointer pb-1.5 text-sm text-text-soft hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-text-soft">O que você precisa:</span>
        {NECESSIDADE_ORDEM.map((n) => {
          const contagem = necessidadeContagem.get(n) ?? 0;
          if (contagem === 0) return null;
          return (
            <button
              key={n}
              type="button"
              onClick={() => alternarNecessidade(n)}
              aria-pressed={necessidade === n}
              className="cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                necessidade === n
                  ? {
                      background: "var(--cp-tertiary)",
                      color: "var(--cp-tertiary-ink)",
                      borderColor: "var(--cp-tertiary)",
                    }
                  : { borderColor: "var(--border)", color: "var(--color-text-soft, inherit)" }
              }
            >
              {NECESSIDADE_LABEL[n]} ({formatNumberBR(contagem)})
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-text-soft">
        <strong className="font-tabular text-text">{formatNumberBR(filtrados.length)}</strong>{" "}
        {filtrados.length === 1 ? "resultado" : "resultados"}
        {temFiltro ? " com este filtro" : ""} — de{" "}
        <strong className="font-tabular text-text">{formatNumberBR(itens.length)}</strong> no total.
      </p>

      {filtrados.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          Nenhum resultado para esse filtro.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {filtrados.map((it) => (
            <CardItem key={it.id} item={it} />
          ))}
        </ul>
      )}
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

const NATUREZA_COR: Record<Natureza, { cor: string; ink: string }> = {
  oficial: { cor: "var(--cp-primary)", ink: "var(--cp-primary-ink)" },
  popular: { cor: "var(--cp-secondary)", ink: "var(--cp-secondary-ink)" },
  academico: { cor: "var(--cp-tertiary)", ink: "var(--cp-tertiary-ink)" },
};

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
