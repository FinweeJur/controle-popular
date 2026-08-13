"use client";

import { useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatNumberBR } from "@/lib/betim/format";
import type {
  NaturezaDireitoCritico,
  NormaDireitoCriticoRow,
  PrecedenteDireitoCriticoRow,
} from "@/lib/db/queries/direito-critico";

/**
 * Busca unificada de `/ambiental/direito-critico` — legislação E precedente
 * na mesma busca, mas nunca achatados: cada item carrega `tipo` e o card
 * muda de forma conforme o tipo (uma lei tem artigos; um precedente tem
 * tribunal/ementa). Mesmo padrão de filtro-no-cliente de
 * `BuscaLegislacaoAmbiental.tsx` (corpus pequeno, sem `searchParams`).
 *
 * ═══ OS 7 TEMAS, E OS DOIS SEM NENHUM INSTRUMENTO ═══
 *
 * Mesmos slugs/rótulos de `etl/temas_direito_critico.py` (`TEMA_LABELS`),
 * copiados aqui pela mesma razão que `BuscaLegislacaoAmbiental.tsx` copia
 * os dela — o componente cliente não importa Python, e 7 entradas dá pra
 * conferir de olho quando um dos dois lados mudar.
 *
 * `serras` e `especies` ficam no filtro mesmo com contagem zero — clicar
 * neles mostra "nenhum instrumento catalogado ainda" em vez de suprimir o
 * botão, porque o pedido explícito da tarefa foi não deixar o tema sumir
 * da lista silenciosamente.
 */

const TEMA_LABEL: Record<string, string> = {
  rios: "Rios e recursos hídricos",
  indigena: "Proteção indígena",
  quilombola: "Proteção quilombola",
  povos_tradicionais: "Povos e comunidades tradicionais",
  direitos_humanos: "Direitos humanos",
  serras: "Proteção de serras",
  especies: "Espécies (flora e fauna)",
};

const TEMA_ORDEM = Object.keys(TEMA_LABEL);
const TEMAS_SEM_INSTRUMENTO = new Set(["serras", "especies"]);

const NATUREZA_LABEL: Record<NaturezaDireitoCritico, string> = {
  nacional: "Nacional",
  internacional: "Internacional",
};

type ItemLei = { tipo: "lei"; row: NormaDireitoCriticoRow };
type ItemPrecedente = { tipo: "precedente"; row: PrecedenteDireitoCriticoRow };
type Item = ItemLei | ItemPrecedente;

const PAGINA = 30;

interface Props {
  normas: NormaDireitoCriticoRow[];
  precedentes: PrecedenteDireitoCriticoRow[];
}

function textoBuscaLei(l: NormaDireitoCriticoRow): string {
  return semAcento(
    [l.numero, l.nomeCurto, l.nomeCompleto, l.artigos.map((a) => a.titulo).join(" ")]
      .filter(Boolean)
      .join(" ")
  );
}

function textoBuscaPrecedente(p: PrecedenteDireitoCriticoRow): string {
  return semAcento(
    [p.tribunal, p.titulo, p.referencia, p.ementa, p.tags.join(" ")].filter(Boolean).join(" ")
  );
}

export default function BuscaDireitoCritico({ normas, precedentes }: Props) {
  const [q, setQ] = useState("");
  const [natureza, setNatureza] = useState<string>("");
  const [tipo, setTipo] = useState<string>(""); // "" | "lei" | "precedente"
  const [tema, setTema] = useState<string>("");
  const [visiveis, setVisiveis] = useState(PAGINA);

  const itens: Item[] = useMemo(
    () => [
      ...normas.map((row): Item => ({ tipo: "lei", row })),
      ...precedentes.map((row): Item => ({ tipo: "precedente", row })),
    ],
    [normas, precedentes]
  );

  const temasContagem = useMemo(() => {
    const cont = new Map<string, number>();
    for (const t of TEMA_ORDEM) cont.set(t, 0);
    for (const it of itens) {
      for (const t of it.row.temas) cont.set(t, (cont.get(t) ?? 0) + 1);
    }
    return cont;
  }, [itens]);

  const termoNormalizado = semAcento(q.trim());

  const filtrados = useMemo(() => {
    return itens.filter((it) => {
      if (tipo && it.tipo !== tipo) return false;
      if (natureza && it.row.natureza !== natureza) return false;
      if (tema && !it.row.temas.includes(tema)) return false;
      if (termoNormalizado) {
        const alvo = it.tipo === "lei" ? textoBuscaLei(it.row) : textoBuscaPrecedente(it.row);
        if (!alvo.includes(termoNormalizado)) return false;
      }
      return true;
    });
  }, [itens, tipo, natureza, tema, termoNormalizado]);

  const temFiltro = Boolean(q || natureza || tipo || tema);
  const visiveisAtuais = filtrados.slice(0, visiveis);
  const temaSemInstrumento = tema !== "" && TEMAS_SEM_INSTRUMENTO.has(tema);

  function limpar() {
    setQ("");
    setNatureza("");
    setTipo("");
    setTema("");
    setVisiveis(PAGINA);
  }

  function alternarTema(t: string) {
    setTema((atual) => (atual === t ? "" : t));
    setVisiveis(PAGINA);
  }

  return (
    <div>
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
            onChange={(e) => {
              setQ(e.target.value);
              setVisiveis(PAGINA);
            }}
            placeholder="ex.: barragem, consulta prévia, dano moral coletivo..."
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="tipo" className="mb-1 text-xs font-medium text-text-soft">
            Tipo
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setVisiveis(PAGINA);
            }}
            className="w-40 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Legislação + precedente</option>
            <option value="lei">Só legislação</option>
            <option value="precedente">Só precedente</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="natureza" className="mb-1 text-xs font-medium text-text-soft">
            Natureza
          </label>
          <select
            id="natureza"
            value={natureza}
            onChange={(e) => {
              setNatureza(e.target.value);
              setVisiveis(PAGINA);
            }}
            className="w-40 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Nacional + internacional</option>
            <option value="nacional">Nacional</option>
            <option value="internacional">Internacional</option>
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
        <span className="text-xs font-medium text-text-soft">Tema de direito protegido:</span>
        {TEMA_ORDEM.map((t) => {
          const n = temasContagem.get(t) ?? 0;
          const vazio = TEMAS_SEM_INSTRUMENTO.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => alternarTema(t)}
              aria-pressed={tema === t}
              className="cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                tema === t
                  ? {
                      background: "var(--cp-tertiary)",
                      color: "var(--cp-tertiary-ink)",
                      borderColor: "var(--cp-tertiary)",
                    }
                  : {
                      borderColor: "var(--border)",
                      color: "var(--color-text-soft, inherit)",
                      opacity: vazio ? 0.7 : 1,
                    }
              }
            >
              {TEMA_LABEL[t]} ({formatNumberBR(n)})
            </button>
          );
        })}
      </div>

      {temaSemInstrumento ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          Nenhum instrumento catalogado ainda para &quot;{TEMA_LABEL[tema]}&quot;. O acervo
          semente desta seção foi curado inteiramente em torno de barragens e populações
          atingidas (Mariana, Brumadinho, MAB) — não cobre este tema por enquanto. O filtro
          continua oferecendo o tema de propósito, em vez de escondê-lo.
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-text-soft">
            <strong className="font-tabular text-text">{formatNumberBR(filtrados.length)}</strong>{" "}
            {filtrados.length === 1 ? "resultado" : "resultados"}
            {temFiltro ? " com este filtro" : ""} — de{" "}
            <strong className="font-tabular text-text">{formatNumberBR(normas.length)}</strong>{" "}
            leis/instrumentos e{" "}
            <strong className="font-tabular text-text">{formatNumberBR(precedentes.length)}</strong>{" "}
            precedentes no total.
          </p>

          {filtrados.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
              Nenhum resultado para esse filtro.
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {visiveisAtuais.map((it) =>
                it.tipo === "lei" ? (
                  <CardLei key={`lei-${it.row.idFonte}`} lei={it.row} />
                ) : (
                  <CardPrecedente key={`prec-${it.row.idFonte}`} precedente={it.row} />
                )
              )}
            </ul>
          )}

          {filtrados.length > visiveisAtuais.length && (
            <div className="mt-5 flex justify-center">
              <button
                type="button"
                onClick={() => setVisiveis((v) => v + PAGINA)}
                className="cursor-pointer rounded-lg border border-border bg-surface px-5 py-2 text-sm font-semibold text-text hover:border-current"
              >
                Ver mais {formatNumberBR(Math.min(PAGINA, filtrados.length - visiveisAtuais.length))}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Badge({ children, cor, ink }: { children: React.ReactNode; cor: string; ink: string }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: cor, color: ink }}
    >
      {children}
    </span>
  );
}

function CardLei({ lei }: { lei: NormaDireitoCriticoRow }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge cor="var(--cp-primary)" ink="var(--cp-primary-ink)">
          Legislação
        </Badge>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {NATUREZA_LABEL[lei.natureza]}
        </span>
        {lei.destaque && (
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
            Instrumento-chave
          </span>
        )}
      </div>

      <p className="mt-2 font-medium text-text">
        {lei.nomeCurto}
        {lei.numero ? <span className="font-normal text-text-soft"> — nº {lei.numero}</span> : null}
      </p>
      <p className="mt-0.5 text-sm text-text-soft">{lei.nomeCompleto}</p>

      {/* `relevanciaHtml` já vem sanitizado do ingestor (só <strong>
          sobrevive) — ver docstring de `direito_critico_popular.py`. Nunca
          renderize aqui um campo que não tenha passado por essa função. */}
      <p
        className="mt-2 text-sm text-text-soft"
        dangerouslySetInnerHTML={{ __html: lei.relevanciaHtml }}
      />

      {lei.temas.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {lei.temas.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border px-2 py-0.5 text-[.72em] text-text-soft"
            >
              {TEMA_LABEL[t] ?? t}
            </span>
          ))}
        </div>
      )}

      {lei.artigos.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-semibold text-accent">
            Ver {formatNumberBR(lei.artigos.length)} artigo(s) selecionado(s)
          </summary>
          <ul className="mt-2 flex flex-col gap-2 border-l border-border pl-3">
            {lei.artigos.map((a) => (
              <li key={a.id} className="text-sm">
                <p className="font-medium text-text">{a.titulo}</p>
                <p className="mt-0.5 text-text-soft">{a.texto}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-3">
        <a
          href={lei.linkOficial}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-accent hover:underline"
        >
          Ver texto oficial →
        </a>
      </div>
    </li>
  );
}

function CardPrecedente({ precedente: p }: { precedente: PrecedenteDireitoCriticoRow }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge cor="var(--cp-secondary)" ink="var(--cp-secondary-ink)">
          Precedente
        </Badge>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {p.tribunal}
        </span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {NATUREZA_LABEL[p.natureza]}
        </span>
      </div>

      <p className="mt-2 font-medium text-text">{p.titulo}</p>
      {p.referencia && <p className="mt-0.5 text-sm text-text-soft">{p.referencia}</p>}

      <p className="mt-2 text-sm text-text-soft">{p.ementa}</p>
      <p className="mt-2 text-sm text-text-soft">
        <span className="font-medium text-text">Por que importa: </span>
        {p.relevancia}
      </p>

      {(p.temas.length > 0 || p.tags.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {p.temas.map((t) => (
            <span
              key={`tema-${t}`}
              className="rounded-full border border-border px-2 py-0.5 text-[.72em] text-text-soft"
            >
              {TEMA_LABEL[t] ?? t}
            </span>
          ))}
          {p.tags.map((t) => (
            <span
              key={`tag-${t}`}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {p.linkOficial && (
        <div className="mt-3">
          <a
            href={p.linkOficial}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Ver decisão oficial →
          </a>
        </div>
      )}
    </li>
  );
}
