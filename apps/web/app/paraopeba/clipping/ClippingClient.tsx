"use client";

import { useEffect, useMemo, useState } from "react";
import {  TIPO_NOTICIA_LABEL,
  type NoticiaClipping,
  type TipoNoticia,  ATI_LABEL,
  ATI_REGIOES,
  TEMA_ATI_LABEL,
  TEMA_ATI_ORDEM,
  PERIODO_CLIPPING_ATI,
  type NoticiaAti,
  type SiglaAti,
  type TemaAti,  INSTITUICAO_JUSTICA_LABEL,
  INSTITUICAO_JUSTICA_NOME,
  TEMA_CLIPPING_IJ_LABEL,
  TEMA_CLIPPING_IJ_ORDEM,
  PERIODO_CLIPPING_IJ,
  type NoticiaInstituicaoJustica,
  type SiglaInstituicaoJustica,
  type TemaClippingIj,
} from "@/lib/paraopeba";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

/** Os três acervos saíram do bundle e viram assets estáticos buscados aqui
 * (mesmo padrão dos resumos da AJRI). Teto de 3 MiB gzip do Worker, 10027. */
let cacheParaopeba: Promise<NoticiaClipping[]> | null = null;
let cacheAti: Promise<NoticiaAti[]> | null = null;
let cacheIj: Promise<NoticiaInstituicaoJustica[]> | null = null;

async function baixar<T>(url: string, chave: string): Promise<T[]> {
  const r = await fetch(url);
  const j = (await r.json()) as Record<string, T[]>;
  return j[chave];
}

function useClippingParaopeba(): NoticiaClipping[] {
  const [l, setL] = useState<NoticiaClipping[] | null>(null);
  useEffect(() => { let vivo = true; if (!cacheParaopeba) cacheParaopeba = baixar("/data/clipping-paraopeba.json", "CLIPPING_PARAOPEBA"); cacheParaopeba.then((d) => { if (vivo) setL(d); }); return () => { vivo = false; }; }, []);
  return l ?? [];
}
function useClippingAti(): NoticiaAti[] {
  const [l, setL] = useState<NoticiaAti[] | null>(null);
  useEffect(() => { let vivo = true; if (!cacheAti) cacheAti = baixar("/data/clipping-ati.json", "CLIPPING_ATI"); cacheAti.then((d) => { if (vivo) setL(d); }); return () => { vivo = false; }; }, []);
  return l ?? [];
}
function useClippingIj(): NoticiaInstituicaoJustica[] {
  const [l, setL] = useState<NoticiaInstituicaoJustica[] | null>(null);
  useEffect(() => { let vivo = true; if (!cacheIj) cacheIj = baixar("/data/clipping-ij.json", "CLIPPING_IJ"); cacheIj.then((d) => { if (vivo) setL(d); }); return () => { vivo = false; }; }, []);
  return l ?? [];
}

/**
 * `/paraopeba/clipping` — três acervos, três filtros, um componente.
 *
 * ═══ POR QUE AS ATIs VÊM PRIMEIRO ═══
 *
 * Pedido do dono, e ele tem razão de conteúdo: as três Assessorias Técnicas
 * Independentes foram **eleitas pelas comunidades atingidas** e escrevem do
 * lado de quem foi atingido. O clipping geral é cobertura sobre o caso; o
 * das ATIs é a voz da assessoria da população. Ordem de leitura importa.
 *
 * ═══ POR QUE AS INSTITUIÇÕES DE JUSTIÇA VÊM NO MEIO ═══
 *
 * MPMG, MPF e DPMG são as três signatárias do Acordo pelo lado público. O que
 * elas publicam não é cobertura de terceiro — é a palavra de quem assinou, e
 * por isso não pertence ao clipping geral. Mas também não é a voz das
 * atingidas, que é o das ATIs. Fica entre os dois, que é onde está.
 *
 * É também o acervo mais fundo dos três: começa em 05/04/2019 contra
 * 08/04/2024 do geral. A assinatura do Acordo de R$ 37,6 bi, em fevereiro de
 * 2021, só existe no portal por causa dele.
 *
 * ═══ POR QUE OS FILTROS VOLTARAM ═══
 *
 * O painel-fonte tinha busca, intervalo de data, ordenação, recorte por
 * fonte e por tema, com contador e "limpar filtros" — e a primeira ingestão
 * trouxe só um `select` de ano. Com 46 + 59 + 149 itens, sem filtro a página
 * é uma parede: o acervo existe mas não é consultável. Aqui os três blocos
 * têm a mesma barra (Buscar · De · Até · Ordenar · contador · Limpar), o
 * que muda são os recortes próprios de cada acervo.
 *
 * Estado local, sem `useSearchParams()`: não precisa de link compartilhável
 * e evita o `<Suspense>` que `ListaProjetos.tsx` precisa por ler a query.
 * Os três acervos cabem em memória (~254 itens), filtrar aqui é suficiente.
 */

type Ordem = "recente" | "antigo" | "az";

const TODOS_OS_TIPOS = Object.keys(TIPO_NOTICIA_LABEL) as TipoNoticia[];
const TODAS_AS_ATIS = Object.keys(ATI_LABEL) as SiglaAti[];
const TODAS_AS_IJS = Object.keys(INSTITUICAO_JUSTICA_LABEL) as SiglaInstituicaoJustica[];

/** Vazio = sem limite. Compara ISO como string: `2025-03-14` ordena sozinho. */
function dentroDoIntervalo(data: string, de: string, ate: string): boolean {
  if (de && data < de) return false;
  if (ate && data > ate) return false;
  return true;
}

/** Busca no que o painel-fonte buscava: título, resumo, fonte e tags. */
function casaBusca(termo: string, campos: string[], tags: string[]): boolean {
  const t = termo.toLowerCase().trim();
  if (!t) return true;
  return (
    campos.some((c) => c.toLowerCase().includes(t)) ||
    tags.some((tag) => tag.toLowerCase().includes(t))
  );
}

function faixaDeDatas(datas: string[]): { min: string; max: string } {
  const ordenadas = [...datas].sort();
  return { min: ordenadas[0], max: ordenadas[ordenadas.length - 1] };
}

export default function ClippingClient() {
  return (
    <>
      <SecaoAti />
      <SecaoIj />
      <SecaoClipping />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Bloco 1 — Clipping das ATIs (logo depois da hero)
// ══════════════════════════════════════════════════════════════════════════

function SecaoAti() {
  const CLIPPING_ATI = useClippingAti();
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [atisAtivas, setAtisAtivas] = useState<Set<SiglaAti>>(new Set(TODAS_AS_ATIS));
  const [tema, setTema] = useState<TemaAti | "todos">("todos");

  const faixa = useMemo(() => faixaDeDatas(CLIPPING_ATI.map((n) => n.data)), [CLIPPING_ATI]);

  const lista = useMemo(() => {
    const filtrada = CLIPPING_ATI.filter(
      (n) =>
        atisAtivas.has(n.ati) &&
        (tema === "todos" || n.tema === tema) &&
        dentroDoIntervalo(n.data, de, ate) &&
        casaBusca(busca, [n.titulo, n.resumo, n.fonte], n.tags)
    );
    return ordenar(filtrada, ordem, (n) => ATI_LABEL[n.ati]);
  }, [CLIPPING_ATI, atisAtivas, tema, de, ate, busca, ordem]);

  /**
   * Agrupa por tema como o painel-fonte agrupava — a ordenação escolhida
   * vale dentro de cada tema. É o que torna o acervo legível: 46 itens
   * soltos não mostram que a disputa está concentrada em perícias.
   */
  const grupos = useMemo(
    () =>
      TEMA_ATI_ORDEM.map((t) => ({ tema: t, itens: lista.filter((n) => n.tema === t) })).filter(
        (g) => g.itens.length > 0
      ),
    [lista]
  );

  const filtroAtivo =
    busca !== "" || de !== "" || ate !== "" || ordem !== "recente" || tema !== "todos" ||
    atisAtivas.size !== TODAS_AS_ATIS.length;

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setOrdem("recente");
    setAtisAtivas(new Set(TODAS_AS_ATIS));
    setTema("todos");
  }

  return (
    <section className="mt-10" aria-labelledby="titulo-ati">
      <h2
        id="titulo-ati"
        className="font-display text-[clamp(1.25em,2.6vw,1.6em)] leading-tight font-bold tracking-tight"
      >
        Notícias das assessorias técnicas independentes
      </h2>
      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        As três ATIs foram <strong className="text-text">eleitas pelas comunidades atingidas</strong>{" "}
        e dividem as cinco regiões do processo:{" "}
        {TODAS_AS_ATIS.map((s, i) => (
          <span key={s}>
            {i > 0 ? ", " : ""}
            <strong className="text-text">{ATI_LABEL[s]}</strong> ({ATI_REGIOES[s]})
          </span>
        ))}
        . Acervo de {formatDateBR(PERIODO_CLIPPING_ATI.de)} a{" "}
        {formatDateBR(PERIODO_CLIPPING_ATI.ate)}, classificado por eixo da reparação — como no
        painel-fonte, não recalculado pelo portal.
      </p>

      <BarraFiltros
        idPrefixo="ati"
        busca={busca}
        setBusca={setBusca}
        de={de}
        setDe={setDe}
        ate={ate}
        setAte={setAte}
        ordem={ordem}
        setOrdem={setOrdem}
        rotuloAz="ATI (A–Z)"
        faixa={faixa}
        exibidos={lista.length}
        total={CLIPPING_ATI.length}
        filtroAtivo={filtroAtivo}
        onLimpar={limpar}
      />

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por ATI">
        {TODAS_AS_ATIS.map((sigla) => (
          <BotaoAlternar
            key={sigla}
            ativo={atisAtivas.has(sigla)}
            onClick={() =>
              setAtisAtivas((atual) => {
                const novo = new Set(atual);
                if (novo.has(sigla)) novo.delete(sigla);
                else novo.add(sigla);
                return novo;
              })
            }
          >
            {ATI_LABEL[sigla]}
          </BotaoAlternar>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tema">
        <BotaoAlternar ativo={tema === "todos"} onClick={() => setTema("todos")}>
          Todos os temas
        </BotaoAlternar>
        {TEMA_ATI_ORDEM.map((t) => (
          <BotaoAlternar key={t} ativo={tema === t} onClick={() => setTema(t)}>
            {TEMA_ATI_LABEL[t]}
          </BotaoAlternar>
        ))}
      </div>

      {grupos.map((g) => (
        <div key={g.tema} className="mt-6">
          <h3 className="border-b border-border pb-1.5 font-display text-base font-semibold text-text">
            {TEMA_ATI_LABEL[g.tema]}{" "}
            <span className="font-normal text-text-soft">({formatNumberBR(g.itens.length)})</span>
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {g.itens.map((n) => (
              <ItemAti key={n.id} noticia={n} onTag={setBusca} />
            ))}
          </ul>
        </div>
      ))}

      {lista.length === 0 && <SemResultado onLimpar={limpar} />}
    </section>
  );
}

function ItemAti({ noticia, onTag }: { noticia: NoticiaAti; onTag: (t: string) => void }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">{noticia.titulo}</p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {ATI_LABEL[noticia.ati]}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {formatDateBR(noticia.data)} · {noticia.fonte}
      </p>
      <p className="mt-2 text-sm text-text-soft">{noticia.resumo}</p>
      <ListaTags tags={noticia.tags} onTag={onTag} />
      <a
        href={noticia.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Ver o material na fonte original ↗
      </a>
    </li>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Bloco 2 — Clipping das instituições de justiça (MPMG, MPF, DPMG)
// ══════════════════════════════════════════════════════════════════════════

/** Um FATO do acervo: ou um item solto, ou os que o painel marcou como o mesmo. */
interface FatoIj {
  chave: string;
  itens: NoticiaInstituicaoJustica[];
}

/**
 * Junta os itens que o painel-fonte marcou com o mesmo `grupo`.
 *
 * Sem isto, a assinatura do Acordo de R$ 37,6 bi aparece TRÊS vezes na tela —
 * uma por instituição — e o acervo parece maior do que é: 59 itens que são 36
 * publicações sobre 13 fatos, mais 23 fatos próprios. Quem conta card na tela
 * chegaria a um número de "cobertura" inflado por um detalhe de origem.
 *
 * Preserva a ordem de chegada, então a ordenação escolhida na barra continua
 * valendo: o fato aparece onde apareceria sua publicação mais bem colocada.
 *
 * Agrupa DEPOIS de filtrar, de propósito. Filtrar por DPMG e ver o card do
 * Acordo encolher para uma publicação é a resposta certa — o card mostra o
 * que sobrevive ao filtro, não o grupo inteiro que existia antes dele.
 */
function agruparPorFato(itens: NoticiaInstituicaoJustica[]): FatoIj[] {
  const porGrupo = new Map<string, NoticiaInstituicaoJustica[]>();
  const fatos: FatoIj[] = [];
  for (const item of itens) {
    if (!item.grupo) {
      fatos.push({ chave: item.id, itens: [item] });
      continue;
    }
    const existente = porGrupo.get(item.grupo);
    if (existente) {
      existente.push(item);
      continue;
    }
    const novo = [item];
    porGrupo.set(item.grupo, novo);
    fatos.push({ chave: item.grupo, itens: novo });
  }
  return fatos;
}

function SecaoIj() {
  const CLIPPING_IJ = useClippingIj();
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [ijsAtivas, setIjsAtivas] = useState<Set<SiglaInstituicaoJustica>>(new Set(TODAS_AS_IJS));
  const [tema, setTema] = useState<TemaClippingIj | "todos">("todos");

  const faixa = useMemo(() => faixaDeDatas(CLIPPING_IJ.map((n) => n.data)), [CLIPPING_IJ]);

  const lista = useMemo(() => {
    const filtrada = CLIPPING_IJ.filter(
      (n) =>
        ijsAtivas.has(n.instituicao) &&
        (tema === "todos" || n.tema === tema) &&
        dentroDoIntervalo(n.data, de, ate) &&
        // Sem tags: este acervo não tem o campo. Busca no que ele tem.
        casaBusca(busca, [n.titulo, n.resumo, n.fonte], [])
    );
    return ordenar(filtrada, ordem, (n) => INSTITUICAO_JUSTICA_LABEL[n.instituicao]);
  }, [CLIPPING_IJ, ijsAtivas, tema, de, ate, busca, ordem]);

  const grupos = useMemo(
    () =>
      TEMA_CLIPPING_IJ_ORDEM.map((t) => ({
        tema: t,
        fatos: agruparPorFato(lista.filter((n) => n.tema === t)),
      })).filter((g) => g.fatos.length > 0),
    [lista]
  );

  /**
   * Conta CARD, não publicação e não fato — é o que a pessoa vê na tela, e é
   * a única contagem que fecha com os olhos dela. A diferença aparece em um
   * caso, medido: o edital da nova ATI de 31/10/2025 é um fato só, e o
   * painel-fonte classificou MPMG e MPF sob "PTR / Auxílio" e a DPMG sob
   * "Indenização". Como a tela agrupa por eixo, ele rende dois cards.
   *
   * Contar fato distinto aqui diria "36" com 37 cards à vista. A saída não é
   * escolher o número bonito: é a prosa acima dizer os dois e explicar por quê.
   */
  const cardsExibidos = useMemo(
    () => grupos.reduce((soma, g) => soma + g.fatos.length, 0),
    [grupos]
  );
  const totalDeCards = useMemo(
    () =>
      TEMA_CLIPPING_IJ_ORDEM.reduce(
        (soma, t) => soma + agruparPorFato(CLIPPING_IJ.filter((n) => n.tema === t)).length,
        0
      ),
    []
  );
  /** Fatos distintos de verdade, ignorando o eixo — o número da prosa. */
  const totalDeFatos = useMemo(() => agruparPorFato(CLIPPING_IJ).length, [CLIPPING_IJ]);

  const filtroAtivo =
    busca !== "" || de !== "" || ate !== "" || ordem !== "recente" || tema !== "todos" ||
    ijsAtivas.size !== TODAS_AS_IJS.length;

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setOrdem("recente");
    setIjsAtivas(new Set(TODAS_AS_IJS));
    setTema("todos");
  }

  return (
    <section className="mt-14 border-t border-border pt-10" aria-labelledby="titulo-ij">
      <h2
        id="titulo-ij"
        className="font-display text-[clamp(1.25em,2.6vw,1.6em)] leading-tight font-bold tracking-tight"
      >
        O que as instituições de justiça publicaram
      </h2>
      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        As três signatárias do Acordo pelo lado público —{" "}
        {TODAS_AS_IJS.map((s, i) => (
          <span key={s}>
            {i > 0 ? ", " : ""}
            <strong className="text-text">{INSTITUICAO_JUSTICA_NOME[s]}</strong> (
            {INSTITUICAO_JUSTICA_LABEL[s]})
          </span>
        ))}
        . Acervo de {formatDateBR(PERIODO_CLIPPING_IJ.de)} a{" "}
        {formatDateBR(PERIODO_CLIPPING_IJ.ate)} — o mais fundo dos três desta página, e o único
        que alcança a assinatura do Acordo de R$ 37,6 bilhões, em fevereiro de 2021.
      </p>
      <p className="mt-2 max-w-2xl text-[.9em] text-text-soft">
        São <strong className="text-text">{formatNumberBR(CLIPPING_IJ.length)} publicações</strong>{" "}
        sobre <strong className="text-text">{formatNumberBR(totalDeFatos)} fatos</strong>: quando as
        três noticiam a mesma decisão, elas aparecem num card só, como o painel-fonte marcou —
        senão a mesma decisão contaria três vezes e o acervo pareceria maior do que é.
      </p>
      <p className="mt-1 max-w-2xl text-[.85em] text-text-soft">
        O contador abaixo fecha em {formatNumberBR(totalDeCards)}, não{" "}
        {formatNumberBR(totalDeFatos)}, e a diferença tem uma causa só: o edital da nova
        assessoria técnica, de 31/10/2025, foi classificado pelo painel sob{" "}
        <em>PTR / Auxílio</em> (MPMG e MPF) e sob <em>Indenização</em> (DPMG). É um fato em dois
        eixos, e ele aparece nos dois — a classificação é da fonte, e o portal não a corrige.
      </p>

      <BarraFiltros
        idPrefixo="ij"
        busca={busca}
        setBusca={setBusca}
        de={de}
        setDe={setDe}
        ate={ate}
        setAte={setAte}
        ordem={ordem}
        setOrdem={setOrdem}
        rotuloAz="Instituição (A–Z)"
        faixa={faixa}
        exibidos={cardsExibidos}
        total={totalDeCards}
        filtroAtivo={filtroAtivo}
        onLimpar={limpar}
      />

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por instituição">
        {TODAS_AS_IJS.map((sigla) => (
          <BotaoAlternar
            key={sigla}
            ativo={ijsAtivas.has(sigla)}
            onClick={() =>
              setIjsAtivas((atual) => {
                const novo = new Set(atual);
                if (novo.has(sigla)) novo.delete(sigla);
                else novo.add(sigla);
                return novo;
              })
            }
          >
            {INSTITUICAO_JUSTICA_LABEL[sigla]}
          </BotaoAlternar>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tema">
        <BotaoAlternar ativo={tema === "todos"} onClick={() => setTema("todos")}>
          Todos os temas
        </BotaoAlternar>
        {TEMA_CLIPPING_IJ_ORDEM.map((t) => (
          <BotaoAlternar key={t} ativo={tema === t} onClick={() => setTema(t)}>
            {TEMA_CLIPPING_IJ_LABEL[t]}
          </BotaoAlternar>
        ))}
      </div>

      {grupos.map((g) => (
        <div key={g.tema} className="mt-6">
          <h3 className="border-b border-border pb-1.5 font-display text-base font-semibold text-text">
            {TEMA_CLIPPING_IJ_LABEL[g.tema]}{" "}
            <span className="font-normal text-text-soft">({formatNumberBR(g.fatos.length)})</span>
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {g.fatos.map((f) => (
              <ItemIj key={f.chave} fato={f} />
            ))}
          </ul>
        </div>
      ))}

      {lista.length === 0 && <SemResultado onLimpar={limpar} />}
    </section>
  );
}

/** "MPMG e MPF", "MPMG, MPF e DPMG" — vírgula até o penúltimo, "e" no último. */
function listarPorExtenso(siglas: string[]): string {
  if (siglas.length <= 1) return siglas[0] ?? "";
  return `${siglas.slice(0, -1).join(", ")} e ${siglas[siglas.length - 1]}`;
}

function ItemIj({ fato }: { fato: FatoIj }) {
  const varias = fato.itens.length > 1;
  /**
   * Sem `Set`, um grupo com duas publicações da MESMA instituição imprimia
   * "noticiado por MPMG, MPMG" — medido no grupo do recurso ao STJ, que tem
   * duas do MPMG. Repetir a sigla parece defeito de dado e não é.
   */
  const siglas = [...new Set(fato.itens.map((n) => INSTITUICAO_JUSTICA_LABEL[n.instituicao]))];
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      {varias && (
        /* "Agrupado pelo painel-fonte", não "mesmo fato" seco: o `grupo` às
           vezes junta publicações separadas por mais de um ano sobre a mesma
           linha processual (o recurso ao STJ tem uma de 2024 e outra de 2025).
           Chamar as duas de um fato só seria afirmação nossa; a decisão é da
           fonte, e a tela diz de quem é. */
        <p className="mb-3 text-xs font-medium text-text-soft">
          Agrupado pelo painel-fonte como um fato só —{" "}
          {formatNumberBR(fato.itens.length)} publicações:{" "}
          <strong className="text-text">{listarPorExtenso(siglas)}</strong>
        </p>
      )}
      <div className={varias ? "flex flex-col gap-4" : ""}>
        {fato.itens.map((n) => (
          <div
            key={n.id}
            className={varias ? "border-l-2 border-border pl-3" : ""}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-display font-semibold text-text">{n.titulo}</p>
              <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
                {INSTITUICAO_JUSTICA_LABEL[n.instituicao]}
              </span>
            </div>
            <p className="mt-1 text-xs text-text-soft">
              {formatDateBR(n.data)} · {n.fonte}
            </p>
            <p className="mt-2 text-sm text-text-soft">{n.resumo}</p>
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
            >
              Ver o material na fonte original ↗
            </a>
          </div>
        ))}
      </div>
    </li>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Bloco 3 — Clipping geral (o que já estava no portal)
// ══════════════════════════════════════════════════════════════════════════

function SecaoClipping() {
  const CLIPPING_PARAOPEBA = useClippingParaopeba();
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [tiposAtivos, setTiposAtivos] = useState<Set<TipoNoticia>>(new Set(TODOS_OS_TIPOS));

  const faixa = useMemo(() => faixaDeDatas(CLIPPING_PARAOPEBA.map((n) => n.data)), [CLIPPING_PARAOPEBA]);

  const lista = useMemo(() => {
    const filtrada = CLIPPING_PARAOPEBA.filter(
      (n) =>
        tiposAtivos.has(n.tipo) &&
        dentroDoIntervalo(n.data, de, ate) &&
        casaBusca(busca, [n.titulo, n.resumo, n.portal], n.tags)
    );
    return ordenar(filtrada, ordem, (n) => n.portal);
  }, [CLIPPING_PARAOPEBA, tiposAtivos, de, ate, busca, ordem]);

  const filtroAtivo =
    busca !== "" || de !== "" || ate !== "" || ordem !== "recente" ||
    tiposAtivos.size !== TODOS_OS_TIPOS.length;

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setOrdem("recente");
    setTiposAtivos(new Set(TODOS_OS_TIPOS));
  }

  return (
    <section className="mt-14 border-t border-border pt-10" aria-labelledby="titulo-clipping">
      <h2
        id="titulo-clipping"
        className="font-display text-[clamp(1.25em,2.6vw,1.6em)] leading-tight font-bold tracking-tight"
      >
        Clipping geral — imprensa, instituições e movimento
      </h2>
      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        Cobertura reunida à mão sobre o caso, separada pelo tipo de veículo que publicou.
      </p>

      <BarraFiltros
        idPrefixo="clip"
        busca={busca}
        setBusca={setBusca}
        de={de}
        setDe={setDe}
        ate={ate}
        setAte={setAte}
        ordem={ordem}
        setOrdem={setOrdem}
        rotuloAz="Portal (A–Z)"
        faixa={faixa}
        exibidos={lista.length}
        total={CLIPPING_PARAOPEBA.length}
        filtroAtivo={filtroAtivo}
        onLimpar={limpar}
      />

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar por fonte">
        {TODOS_OS_TIPOS.map((tipo) => (
          <BotaoAlternar
            key={tipo}
            ativo={tiposAtivos.has(tipo)}
            onClick={() =>
              setTiposAtivos((atual) => {
                const novo = new Set(atual);
                if (novo.has(tipo)) novo.delete(tipo);
                else novo.add(tipo);
                return novo;
              })
            }
          >
            {TIPO_NOTICIA_LABEL[tipo]}
          </BotaoAlternar>
        ))}
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {lista.map((n) => (
          <ItemNoticia key={n.id} noticia={n} onTag={setBusca} />
        ))}
      </ul>

      {lista.length === 0 && <SemResultado onLimpar={limpar} />}
    </section>
  );
}

function ItemNoticia({ noticia, onTag }: { noticia: NoticiaClipping; onTag: (t: string) => void }) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">{noticia.titulo}</p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {TIPO_NOTICIA_LABEL[noticia.tipo]}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {formatDateBR(noticia.data)} · {noticia.portal}
      </p>
      <p className="mt-2 text-sm text-text-soft">{noticia.resumo}</p>
      <ListaTags tags={noticia.tags} onTag={onTag} />
      <a
        href={noticia.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Ver a notícia na fonte original ↗
      </a>
    </li>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Peças compartilhadas
// ══════════════════════════════════════════════════════════════════════════

/** Ordena sem mutar o array do módulo — `CLIPPING_*` é constante importada. */
function ordenar<T extends { data: string }>(
  itens: T[],
  ordem: Ordem,
  chaveAz: (item: T) => string
): T[] {
  const copia = [...itens];
  if (ordem === "recente") return copia.sort((a, b) => b.data.localeCompare(a.data));
  if (ordem === "antigo") return copia.sort((a, b) => a.data.localeCompare(b.data));
  return copia.sort(
    (a, b) => chaveAz(a).localeCompare(chaveAz(b), "pt") || b.data.localeCompare(a.data)
  );
}

interface PropsBarra {
  idPrefixo: string;
  busca: string;
  setBusca: (v: string) => void;
  de: string;
  setDe: (v: string) => void;
  ate: string;
  setAte: (v: string) => void;
  ordem: Ordem;
  setOrdem: (v: Ordem) => void;
  rotuloAz: string;
  faixa: { min: string; max: string };
  exibidos: number;
  total: number;
  filtroAtivo: boolean;
  onLimpar: () => void;
}

function BarraFiltros(p: PropsBarra) {
  const campo =
    "rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none";
  return (
    <div
      role="search"
      aria-label="Filtros"
      className="mt-5 rounded-2xl border border-border bg-surface-2 p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[200px] flex-[2] flex-col">
          <label htmlFor={`${p.idPrefixo}-busca`} className="mb-1 text-xs font-medium text-text-soft">
            Buscar
          </label>
          <input
            id={`${p.idPrefixo}-busca`}
            type="search"
            value={p.busca}
            onChange={(e) => p.setBusca(e.target.value)}
            placeholder="Título, resumo, fonte ou tag…"
            className={campo}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor={`${p.idPrefixo}-de`} className="mb-1 text-xs font-medium text-text-soft">
            De
          </label>
          <input
            id={`${p.idPrefixo}-de`}
            type="date"
            value={p.de}
            min={p.faixa.min}
            max={p.faixa.max}
            onChange={(e) => p.setDe(e.target.value)}
            className={campo}
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor={`${p.idPrefixo}-ate`} className="mb-1 text-xs font-medium text-text-soft">
            Até
          </label>
          <input
            id={`${p.idPrefixo}-ate`}
            type="date"
            value={p.ate}
            min={p.faixa.min}
            max={p.faixa.max}
            onChange={(e) => p.setAte(e.target.value)}
            className={campo}
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor={`${p.idPrefixo}-ordem`}
            className="mb-1 text-xs font-medium text-text-soft"
          >
            Ordenar
          </label>
          <select
            id={`${p.idPrefixo}-ordem`}
            value={p.ordem}
            onChange={(e) => p.setOrdem(e.target.value as Ordem)}
            className={campo}
          >
            <option value="recente">Mais recente</option>
            <option value="antigo">Mais antigo</option>
            <option value="az">{p.rotuloAz}</option>
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-text-soft">
          Exibindo <strong className="text-text">{formatNumberBR(p.exibidos)}</strong> de{" "}
          {formatNumberBR(p.total)}
        </p>
        <button
          type="button"
          onClick={p.onLimpar}
          disabled={!p.filtroAtivo}
          className="cp-btn-anim rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-soft transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
        >
          Limpar filtros
        </button>
      </div>
    </div>
  );
}

function BotaoAlternar({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`cp-btn-anim rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        ativo
          ? "border-primary bg-primary text-primary-ink"
          : "border-border bg-surface text-text-soft"
      }`}
    >
      {children}
    </button>
  );
}

/** Tag clicável joga o termo na busca — mesmo gesto do painel-fonte. */
function ListaTags({ tags, onTag }: { tags: string[]; onTag: (t: string) => void }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onTag(t)}
          aria-label={`Filtrar por: ${t}`}
          className="cp-btn-anim rounded-full bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft transition-colors hover:bg-primary hover:text-primary-ink"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function SemResultado({ onLimpar }: { onLimpar: () => void }) {
  return (
    <p className="mt-6 rounded-2xl border border-border bg-surface p-5 text-sm text-text-soft">
      Nenhum resultado para os filtros selecionados.{" "}
      <button
        type="button"
        onClick={onLimpar}
        className="font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Limpar filtros
      </button>
      .
    </p>
  );
}
