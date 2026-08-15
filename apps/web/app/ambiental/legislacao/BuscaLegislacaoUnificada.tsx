"use client";

import { useMemo, useState } from "react";
import { semAcento } from "@/lib/busca/normalizar";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import type { FonteLegislacaoAmbiental, LegislacaoAmbientalRow } from "@/lib/db/queries/legislacao-ambiental";
import type {
  NormaDireitoCriticoRow,
  PrecedenteDireitoCriticoRow,
} from "@/lib/db/queries/direito-critico";
import {
  contarPorTema,
  ESFERA_LABEL,
  filtrarItens,
  TEMA_LABEL_UNIFICADO,
  TEMA_ORDEM_UNIFICADO,
  unificarItens,
  type ClasseItemLegislacao,
  type EsferaLegislacao,
} from "@/lib/ambiental/legislacao-unificada";
import { RESOLVEDOR_NORMAS_LEG_BR, urnLexmlDaNorma } from "@/lib/ambiental/urn-lexml";

/**
 * Busca unificada de `/ambiental/legislacao` — legislação ambiental
 * estadual (ALMG + Semad + Siam) e FEDERAL (MMA/Conama + CNDH, migration
 * 0073), legislação nacional/internacional curada e precedentes judiciais,
 * NUMA busca só, filtrável por esfera, tema (vocabulário unificado, ver
 * `lib/ambiental/legislacao-unificada.ts`) e tipo/classe.
 *
 * Nasceu da fusão de `BuscaLegislacaoAmbiental.tsx` (o painel de 6.378
 * normas estaduais) com `BuscaDireitoCritico.tsx` (o painel de 30 normas +
 * 15 precedentes por tema de direito protegido) — o pedido do dono foi
 * "unificar... filtrável por temas", preservando o que cada um fazia bem:
 * a dica de sobreposição entre fontes (estadual), a distinção visível
 * lei-vs-precedente (crítico), o chip de tema mesmo com contagem zero
 * (crítico). Os três sobrevivem abaixo.
 *
 * Continua sem `useSearchParams()` — mesmo motivo dos dois originais
 * (`output: 'export'` não roda Server Component com searchParams, ver
 * F0-discovery.md §7). Filtro em `useState` puro; a lógica de filtro em si
 * é `filtrarItens` de `lib/ambiental/legislacao-unificada.ts`, testada
 * sem React.
 */

const FONTE_LABEL: Record<FonteLegislacaoAmbiental, string> = {
  almg: "ALMG",
  semad: "Semad",
  siam: "Siam",
  mma: "MMA",
  cndh: "CNDH",
};

const FONTE_LABEL_LONGO: Record<FonteLegislacaoAmbiental, string> = {
  almg: "Assembleia Legislativa de MG",
  semad: "Banco de Legislação Ambiental (Semad)",
  siam: "Siam — arquivo histórico",
  mma: "Ministério do Meio Ambiente e Mudança do Clima — inclui as Resoluções Conama",
  cndh: "Conselho Nacional dos Direitos Humanos",
};

// As duas fontes federais reusam as cores das estaduais de propósito: o
// que separa esfera é o selo "Nacional"/"Estadual" ao lado, não a cor —
// inventar duas cores novas faria a paleta competir com o selo.
const FONTE_COR: Record<FonteLegislacaoAmbiental, string> = {
  almg: "var(--cp-primary)",
  semad: "var(--cp-tertiary)",
  siam: "var(--cp-secondary)",
  mma: "var(--cp-primary)",
  cndh: "var(--cp-secondary)",
};

const FONTE_COR_INK: Record<FonteLegislacaoAmbiental, string> = {
  almg: "var(--cp-primary-ink)",
  semad: "var(--cp-tertiary-ink)",
  siam: "var(--cp-secondary-ink)",
  mma: "var(--cp-primary-ink)",
  cndh: "var(--cp-secondary-ink)",
};

// Cópia TS de `TAG_LABELS` em `etl/temas_ambientais.py` — mesma razão de
// sempre: componente cliente não importa Python.
const TAG_LABEL: Record<string, string> = {
  mineracao_geral: "Mineração",
  energia_geral: "Energia",
  agropecuaria_geral: "Agropecuária",
  barragem: "Barragem",
  recursos_hidricos_geral: "Recursos Hídricos",
  bacia_hidrografica: "Bacia Hidrográfica",
  residuos_solidos: "Resíduos Sólidos",
  reciclagem: "Reciclagem",
  unidade_conservacao: "Unidade de Conservação",
  area_protecao_ambiental: "Área de Proteção Ambiental",
  rppn: "Reserva Particular (RPPN)",
  fauna: "Fauna",
  // Criada em 2026-08-15 junto com a carga das normas federais: pesca é um
  // bloco inteiro do acervo federal (136 ementas medidas) que não existia no
  // estadual de Minas. Sem rótulo aqui, a tag apareceria pelo slug cru.
  pesca: "Pesca e Aquicultura",
  flora_florestal: "Flora e Política Florestal",
  licenciamento_ambiental: "Licenciamento Ambiental",
  fiscalizacao_ambiental: "Fiscalização Ambiental",
  mudanca_climatica: "Mudança Climática",
  desastre_ambiental: "Desastre Ambiental",
  serra_relevo: "Serra",
  // Lugares com nome, criados em 2026-08-15. `serra_relevo` responde "fala de
  // alguma serra"; não responde "quais normas tratam da Serra do Curral", que
  // é a pergunta que alguém de fato faz.
  serra_curral: "Serra do Curral",
  serra_caraca: "Serra da Caraça",
  serra_gandarela: "Serra do Gandarela",
  serra_cipo: "Serra do Cipó",
  serra_espinhaco: "Serra do Espinhaço",
  serra_canastra: "Serra da Canastra",
  parque_nacional: "Parque Nacional",
  parque_estadual: "Parque Estadual",
};

// A chave `estadual` é o nome da CLASSE (linha de `ambiental_legislacao`) e
// ficou desde a versão em que essa tabela só tinha Minas; desde a migration
// 0073 ela abriga também MMA/Conama e CNDH, por isso o RÓTULO fala das
// duas esferas. Renomear a chave quebraria o filtro já publicado sem
// ganhar nada — o rótulo é o que o leitor vê.
const CLASSE_LABEL: Record<ClasseItemLegislacao, string> = {
  estadual: "Norma ambiental (MG e federal)",
  critica: "Legislação nacional/internacional",
  precedente: "Precedente judicial",
};

// Temas cuja cobertura hoje é ZERO no acervo semente do direito crítico —
// ver docstring de `page.tsx` (a natureza dessa lacuna não mudou com a
// unificação, só ganhou vizinhos com dado real ao lado).
const TEMAS_SEM_INSTRUMENTO_CRITICO = new Set(["especies"]);

const PAGINA = 40;

interface Props {
  estaduais: LegislacaoAmbientalRow[];
  criticas: NormaDireitoCriticoRow[];
  precedentes: PrecedenteDireitoCriticoRow[];
}

export default function BuscaLegislacaoUnificada({ estaduais, criticas, precedentes }: Props) {
  const [q, setQ] = useState("");
  const [esfera, setEsfera] = useState<EsferaLegislacao | "">("");
  const [classe, setClasse] = useState<ClasseItemLegislacao | "">("");
  const [fonte, setFonte] = useState<FonteLegislacaoAmbiental | "">("");
  const [ano, setAno] = useState<string>("");
  const [tema, setTema] = useState<string>("");
  const [visiveis, setVisiveis] = useState(PAGINA);

  const itens = useMemo(
    () => unificarItens(estaduais, criticas, precedentes),
    [estaduais, criticas, precedentes]
  );

  // chaveDedup -> fontes distintas que a compartilham — a dica "também
  // consta em" do painel original, que só faz sentido dentro da mesma
  // classe (ALMG/Semad/Siam duplicam entre si; crítica/precedente nunca
  // duplicam nada).
  //
  // A chave do mapa inclui a ESFERA desde a entrada das fontes federais:
  // `chave_dedup` é "TIPO:NÚMERO:ANO", e um Decreto federal nº 6.040/2007
  // e um Decreto estadual de mesmo número e ano geram a MESMA string sem
  // serem nem parentes. Sem a esfera na chave, o card anunciaria "também
  // consta em MMA" para uma norma de Minas — uma afirmação falsa com cara
  // de conferência.
  const fontesPorDedup = useMemo(() => {
    const mapa = new Map<string, Set<FonteLegislacaoAmbiental>>();
    for (const l of estaduais) {
      if (!l.chaveDedup) continue;
      const chave = `${l.esfera}||${l.chaveDedup}`;
      const s = mapa.get(chave) ?? new Set<FonteLegislacaoAmbiental>();
      s.add(l.fonte);
      mapa.set(chave, s);
    }
    return mapa;
  }, [estaduais]);

  const anos = useMemo(() => {
    const s = new Set<number>();
    for (const l of estaduais) if (l.ano) s.add(l.ano);
    return [...s].sort((a, b) => b - a);
  }, [estaduais]);

  const termoNormalizado = semAcento(q.trim());

  // Contagem de tema sobre o corpus filtrado por TUDO MENOS tema — os
  // chips refletem o resto do filtro atual, não o corpus inteiro parado.
  const itensParaContagemTema = useMemo(
    () =>
      filtrarItens(itens, { termoNormalizado, esfera, classe, fonte }, semAcento),
    [itens, termoNormalizado, esfera, classe, fonte]
  );
  const temasContagem = useMemo(() => contarPorTema(itensParaContagemTema), [itensParaContagemTema]);

  const filtrados = useMemo(() => {
    let base = filtrarItens(itens, { termoNormalizado, esfera, classe, fonte, tema }, semAcento);
    if (ano) base = base.filter((it) => it.classe !== "estadual" || String(it.row.ano ?? "") === ano);
    return base;
  }, [itens, termoNormalizado, esfera, classe, fonte, tema, ano]);

  const temFiltro = Boolean(q || esfera || classe || fonte || ano || tema);
  const visiveisAtuais = filtrados.slice(0, visiveis);
  const temaSemInstrumento = tema !== "" && TEMAS_SEM_INSTRUMENTO_CRITICO.has(tema) && filtrados.length === 0;

  function limpar() {
    setQ("");
    setEsfera("");
    setClasse("");
    setFonte("");
    setAno("");
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
            placeholder="ex.: recursos hídricos, barragem, consulta prévia..."
            className="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="esfera" className="mb-1 text-xs font-medium text-text-soft">
            Esfera
          </label>
          <select
            id="esfera"
            value={esfera}
            onChange={(e) => {
              setEsfera(e.target.value as EsferaLegislacao | "");
              setVisiveis(PAGINA);
            }}
            className="w-40 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Todas</option>
            <option value="estadual">{ESFERA_LABEL.estadual}</option>
            <option value="nacional">{ESFERA_LABEL.nacional}</option>
            <option value="internacional">{ESFERA_LABEL.internacional}</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label htmlFor="classe" className="mb-1 text-xs font-medium text-text-soft">
            Tipo
          </label>
          <select
            id="classe"
            value={classe}
            onChange={(e) => {
              setClasse(e.target.value as ClasseItemLegislacao | "");
              setVisiveis(PAGINA);
            }}
            className="w-52 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
          >
            <option value="">Norma + precedente</option>
            <option value="estadual">{CLASSE_LABEL.estadual}</option>
            <option value="critica">{CLASSE_LABEL.critica}</option>
            <option value="precedente">{CLASSE_LABEL.precedente}</option>
          </select>
        </div>

        {/* O seletor de fonte só some quando NENHUMA linha de
            `ambiental_legislacao` pode aparecer: com classe crítica/
            precedente, ou com esfera "internacional" (que nenhuma das cinco
            fontes tem). Antes ele sumia também em esfera "nacional" — o que
            deixou de valer quando MMA e CNDH, que SÃO nacionais, passaram a
            viver nesta mesma tabela. */}
        {esfera !== "internacional" && classe !== "critica" && classe !== "precedente" && (
          <div className="flex flex-col">
            <label htmlFor="fonte" className="mb-1 text-xs font-medium text-text-soft">
              Fonte
            </label>
            <select
              id="fonte"
              value={fonte}
              onChange={(e) => {
                setFonte(e.target.value as FonteLegislacaoAmbiental | "");
                setVisiveis(PAGINA);
              }}
              className="w-44 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todas</option>
              <option value="almg">ALMG (MG)</option>
              <option value="semad">Semad (MG)</option>
              <option value="siam">Siam (MG)</option>
              <option value="mma">MMA/Conama (federal)</option>
              <option value="cndh">CNDH (federal)</option>
            </select>
          </div>
        )}

        {classe !== "critica" && classe !== "precedente" && esfera !== "internacional" && (
          <div className="flex flex-col">
            <label htmlFor="ano" className="mb-1 text-xs font-medium text-text-soft">
              Ano
            </label>
            <select
              id="ano"
              value={ano}
              onChange={(e) => {
                setAno(e.target.value);
                setVisiveis(PAGINA);
              }}
              className="w-28 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text"
            >
              <option value="">Todos</option>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}

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
        <span className="text-xs font-medium text-text-soft">Tema:</span>
        {TEMA_ORDEM_UNIFICADO.map((t) => {
          const n = temasContagem.get(t) ?? 0;
          // Nunca some do filtro por contagem zero — pedido explícito herdado
          // do painel de direito crítico original (clicar mostra "nenhum
          // catalogado", não esconde o botão), agora valendo pros 15 temas.
          return (
            <button
              key={t}
              type="button"
              onClick={() => alternarTema(t)}
              aria-pressed={tema === t}
              className="cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              style={
                tema === t
                  ? { background: "var(--cp-tertiary)", color: "var(--cp-tertiary-ink)", borderColor: "var(--cp-tertiary)" }
                  : { borderColor: "var(--border)", color: "var(--color-text-soft, inherit)", opacity: n === 0 ? 0.7 : 1 }
              }
            >
              {TEMA_LABEL_UNIFICADO[t]} ({formatNumberBR(n)})
            </button>
          );
        })}
      </div>

      {temaSemInstrumento ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
          Nenhum instrumento catalogado ainda para &quot;{TEMA_LABEL_UNIFICADO[tema]}&quot; com este filtro.
          O acervo de legislação nacional/internacional foi curado a partir de um único material sobre
          barragens e populações atingidas — não cobre este tema por enquanto. O filtro continua
          oferecendo o tema de propósito, em vez de escondê-lo.
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-text-soft">
            <strong className="font-tabular text-text">{formatNumberBR(filtrados.length)}</strong>{" "}
            {filtrados.length === 1 ? "item encontrado" : "itens encontrados"}
            {temFiltro ? " com este filtro" : ""} — de{" "}
            <strong className="font-tabular text-text">{formatNumberBR(itens.length)}</strong> ao todo (
            {formatNumberBR(estaduais.length)} normas ambientais de Minas e federais,{" "}
            {formatNumberBR(criticas.length)} instrumentos nacionais/internacionais,{" "}
            {formatNumberBR(precedentes.length)} precedentes).
          </p>

          {filtrados.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
              Nenhum item para esse filtro.
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {visiveisAtuais.map((item) => {
                if (item.classe === "estadual") {
                  const l = item.row;
                  const outras = l.chaveDedup
                    ? [...(fontesPorDedup.get(`${l.esfera}||${l.chaveDedup}`) ?? [])].filter(
                        (f) => f !== l.fonte
                      )
                    : [];
                  return (
                    <CardEstadual
                      key={item.chave}
                      linha={l}
                      esfera={item.esfera}
                      outrasFontes={outras}
                    />
                  );
                }
                if (item.classe === "critica") {
                  return <CardCritica key={item.chave} lei={item.row} />;
                }
                return <CardPrecedente key={item.chave} precedente={item.row} />;
              })}
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
    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: cor, color: ink }}>
      {children}
    </span>
  );
}

function EsferaBadge({ esfera }: { esfera: EsferaLegislacao }) {
  return (
    <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
      {ESFERA_LABEL[esfera]}
    </span>
  );
}

function TemasDoItem({ temas }: { temas: string[] }) {
  if (temas.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {temas.map((t) => (
        <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[.72em] text-text-soft">
          {TEMA_LABEL_UNIFICADO[t] ?? t}
        </span>
      ))}
    </div>
  );
}

/** "REVOGADO" e "ATO EXAURIDO" precisam saltar aos olhos — uma portaria
 *  revogada com a mesma cara de norma em vigor é desinformação, não
 *  detalhe. O texto é o da FONTE, sem tradução; quando a fonte não informa
 *  (as três estaduais, e o CNDH), o selo simplesmente não aparece — a
 *  ausência não vira "vigente". */
function SituacaoBadge({ situacao }: { situacao: string | null }) {
  if (!situacao) return null;
  const alerta = /REVOGA|SEM EFEITO|EXAURIDO|SUSPENS|ENCERRAD/i.test(situacao);
  return (
    <span
      title="Situação declarada pela fonte oficial"
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
      style={
        alerta
          ? { background: "var(--cp-secondary)", color: "var(--cp-secondary-ink)" }
          : { background: "var(--surface-2, transparent)", color: "var(--color-text-soft, inherit)" }
      }
    >
      {situacao}
    </span>
  );
}

function CardEstadual({
  linha: l,
  esfera,
  outrasFontes,
}: {
  linha: LegislacaoAmbientalRow;
  esfera: EsferaLegislacao;
  outrasFontes: FonteLegislacaoAmbiental[];
}) {
  // A esfera vem do PROP (já resolvida por `esferaDaLegislacao`), não de
  // `l.esfera` cru: linha lida de banco anterior à migration 0073 não tem a
  // coluna, e aí o `undefined` derrubaria a URN de uma norma federal boa.
  const paraUrn = { esfera, tipo: l.tipo, numero: l.numero, data: l.data };
  const urn = urnLexmlDaNorma(paraUrn);
  const linkCanonico = urn ? `${RESOLVEDOR_NORMAS_LEG_BR}${urn}` : null;

  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            title={FONTE_LABEL_LONGO[l.fonte]}
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: FONTE_COR[l.fonte], color: FONTE_COR_INK[l.fonte] }}
          >
            {FONTE_LABEL[l.fonte]}
          </span>
          <EsferaBadge esfera={esfera} />
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
            {l.tipo}
          </span>
          <SituacaoBadge situacao={l.situacao} />
        </div>
        {l.data && <span className="font-tabular text-xs text-text-soft">{formatDateBR(l.data)}</span>}
      </div>

      <p className="mt-2 font-medium text-text">
        {l.tipo} {l.numero ? `nº ${l.numero}` : ""}
        {l.ano ? `/${l.ano}` : ""}
        {l.orgao ? <span className="font-normal text-text-soft"> — {l.orgao}</span> : null}
      </p>
      {l.ementa && <p className="mt-1 text-sm text-text-soft">{l.ementa}</p>}

      <TemasDoItem temas={l.temas} />

      {l.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {l.tags.map((t) => (
            <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft">
              {TAG_LABEL[t] ?? t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {l.linkPdf && (
          <a
            href={l.linkPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent hover:underline"
          >
            Ver documento na fonte oficial →
          </a>
        )}
        {/* Endereço canônico LexML. Só aparece quando a URN pôde ser montada
            — `linkCanonicoDaNorma` devolve null para 14.667 das 15.318 linhas
            do acervo (toda a estadual, toda portaria/resolução, e o que não
            tem data ou número). Renderizar o link mesmo assim levaria o leitor
            a uma página sem norma nenhuma, que é pior do que não ter link:
            o portal responde HTTP 200 até para URN inexistente. Ver
            `docs/URN-LEXML-NORMAS-LEG-BR.md` — 16 de 17 da amostra resolvem. */}
        {linkCanonico && (
          <a
            href={linkCanonico}
            target="_blank"
            rel="noopener noreferrer"
            title={`Identificador permanente: ${urn}`}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Endereço permanente (LexML) →
          </a>
        )}
        {outrasFontes.length > 0 && (
          <span className="text-xs text-text-soft">
            também consta em: {outrasFontes.map((f) => FONTE_LABEL[f]).join(", ")}
          </span>
        )}
      </div>
    </li>
  );
}

function CardCritica({ lei }: { lei: NormaDireitoCriticoRow }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge cor="var(--cp-primary)" ink="var(--cp-primary-ink)">
          Legislação
        </Badge>
        <EsferaBadge esfera={lei.natureza} />
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
      <p className="mt-2 text-sm text-text-soft" dangerouslySetInnerHTML={{ __html: lei.relevanciaHtml }} />

      <TemasDoItem temas={lei.temas} />

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
        <EsferaBadge esfera={p.natureza} />
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
            <span key={`tema-${t}`} className="rounded-full border border-border px-2 py-0.5 text-[.72em] text-text-soft">
              {TEMA_LABEL_UNIFICADO[t] ?? t}
            </span>
          ))}
          {p.tags.map((t) => (
            <span key={`tag-${t}`} className="rounded-full bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft">
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
