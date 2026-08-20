"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AUDITORIA_AJRI,
  INSTRUMENTO_AJRI_LABEL,
  INSTRUMENTO_AJRI_ORDEM,
  PERIODO_AUDITORIA_AJRI,
  TEMA_AJRI_LABEL,
  TEMA_AJRI_ORDEM,
  TIPO_DOCUMENTO_AJRI_LABEL,
  TIPO_DOCUMENTO_AJRI_ORDEM,
  urlDocumentoAjri,
  type DocumentoAuditoriaAjri,
  type InstrumentoAjri,
  type TemaAjri,
  type TipoDocumentoAjri,
} from "@/lib/paraopeba/auditoria-ajri";
import { ATI_LABEL } from "@/lib/paraopeba/clipping-ati";
import { INSTITUICAO_JUSTICA_LABEL } from "@/lib/paraopeba/clipping-ij";
import { relacionadosDaFicha } from "@/lib/paraopeba/relacionados";
import { fichaLegivelAjri } from "@/lib/paraopeba/ficha-legivel-ajri";
import {
  RESUMO_AJRI,
  VEREDITO_AJRI_LABEL,
  type ResumoAjri,
  type VereditoAjri,
} from "@/lib/paraopeba/resumo-ajri";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";

/**
 * `/paraopeba/auditoria` — os 467 documentos da auditoria independente,
 * filtráveis por instrumento jurídico, tipo, tema e período.
 *
 * ═══ POR QUE A LISTA É PAGINADA E O CLIPPING NÃO É ═══
 *
 * `ClippingClient.tsx` desenha os 254 itens dos três acervos de uma vez, e
 * cabe. Aqui são 467 fichas com descrição longa (332 caracteres em média,
 * 619 no maior) — desenhar todas de saída põe ~155 KB de texto no HTML da
 * rota, e `docs/HANDOFF-PAYLOAD-LEGISLACAO.md` é o registro de um deploy que
 * morreu por payload de rota em 15/08/2026. `POR_PAGINA` corta isso na
 * origem: o filtro roda sobre os 467 em memória (o contador diz o total real),
 * mas só o pedaço visível vira DOM.
 *
 * ═══ POR QUE O DADO NÃO CHEGA POR PROP ═══
 *
 * O acervo é importado AQUI, no componente de cliente, e não passado pela
 * `page.tsx`. É a mesma escolha de `ClippingClient.tsx`, e a razão está no
 * mesmo handoff: prop de componente de cliente é serializada no payload da
 * rota (HTML + flight), e foi assim que 4,7 MiB de ementas viraram 35,5 MiB
 * de asset. Importado, o acervo é um chunk de JS compartilhado.
 *
 * ═══ CRÉDITO DA AECOM EM CADA FICHA, E NÃO SÓ NO TOPO ═══
 *
 * O material é de autoria da auditora. Cada card diz isso, com o link para a
 * fonte oficial ao lado — mesmo tratamento que `clipping-ij.ts` dá aos
 * resumos do painel-fonte. Um aviso único no cabeçalho não acompanha a ficha
 * quando alguém copia, imprime ou compartilha um documento específico.
 * ═══ O RESUMO VIVE NUM CHUNK PRÓPRIO, SÓ NO CLIENTE ═══
 *
 * Os 337 resumos (2,09 MiB de TS, 350 KiB em gzip) moram em
 * `lib/paraopeba/resumo-ajri.ts`, em record chaveado por `codigo`, e são
 * importados AQUI junto com o catálogo — nunca na página de servidor nem em
 * prop de rota (a lição de `docs/_historico/HANDOFF-PAYLOAD-LEGISLACAO.md`).
 * A ficha só monta o resumo quando `RESUMO_AJRI[doc.codigo]` existe: 337 de
 * 467 — os 130 restantes nunca foram baixados na fase de conteúdo.
 */

type Ordem = "recente" | "antigo" | "codigo";

/** 24 cabe em duas telas e mantém o HTML da rota na casa dos KB. */
const POR_PAGINA = 24;

const TODOS_OS_INSTRUMENTOS = INSTRUMENTO_AJRI_ORDEM;
const TODOS_OS_TIPOS = TIPO_DOCUMENTO_AJRI_ORDEM;

/** Vazio = sem limite. Compara ISO como string: `2025-03-14` ordena sozinho. */
function dentroDoIntervalo(data: string, de: string, ate: string): boolean {
  if (de && data < de) return false;
  if (ate && data > ate) return false;
  return true;
}

/** Busca no que a ficha mostra: descrição, código, temas e resumo. */
function casaBusca(termo: string, doc: DocumentoAuditoriaAjri): boolean {
  const t = termo.toLowerCase().trim();
  if (!t) return true;
  if (doc.descricao.toLowerCase().includes(t)) return true;
  if (doc.codigo.toLowerCase().includes(t)) return true;
  if (doc.temas.some((tema) => TEMA_AJRI_LABEL[tema].toLowerCase().includes(t))) return true;
  const resumo = RESUMO_AJRI[doc.codigo];
  if (!resumo) return false;
  if (resumo.objeto.toLowerCase().includes(t)) return true;
  if (
    resumo.resumo.some(
      (b) => b.texto.toLowerCase().includes(t) || b.titulo.toLowerCase().includes(t)
    )
  ) {
    return true;
  }
  if (resumo.constatacoes.some((c) => c.toLowerCase().includes(t))) return true;
  if (resumo.pendencias.some((p) => p.toLowerCase().includes(t))) return true;
  return false;
}

const FAIXA = {
  min: PERIODO_AUDITORIA_AJRI.de,
  max: PERIODO_AUDITORIA_AJRI.ate,
};

/** Contagem por tema, medida uma vez — o `select` mostra o volume de cada um. */
const TOTAL_POR_TEMA = TEMA_AJRI_ORDEM.reduce<Record<string, number>>((acc, tema) => {
  acc[tema] = AUDITORIA_AJRI.filter((d) => d.temas.includes(tema)).length;
  return acc;
}, {});

const TOTAL_POR_INSTRUMENTO = INSTRUMENTO_AJRI_ORDEM.reduce<Record<string, number>>((acc, i) => {
  acc[i] = AUDITORIA_AJRI.filter((d) => d.instrumento === i).length;
  return acc;
}, {});

export default function AuditoriaClientEnvolto() {
  return (
    <Suspense fallback={<AuditoriaClient />}>
      <AuditoriaClientComQuery />
    </Suspense>
  );
}

/**
 * Lê `?q=` (o link "mesmo tema" das fichas relacionadas chega aqui) e
 * repassa como busca inicial. O `<Suspense>` acima é obrigatório — sem ele o
 * `next build` aborta (ver o comentário do cabeçalho de `ListaProjetos.tsx`,
 * que documenta o mesmo contrato); o fallback é a lista completa sem busca,
 * quem chega sem JavaScript continua vendo tudo.
 */
function AuditoriaClientComQuery() {
  const searchParams = useSearchParams();
  return <AuditoriaClient buscaInicial={searchParams.get("q") ?? ""} />;
}

function AuditoriaClient({ buscaInicial = "" }: { buscaInicial?: string }) {
  const [busca, setBusca] = useState(buscaInicial);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("recente");
  const [instrumentos, setInstrumentos] = useState<Set<InstrumentoAjri>>(
    new Set(TODOS_OS_INSTRUMENTOS)
  );
  const [tipos, setTipos] = useState<Set<TipoDocumentoAjri>>(new Set(TODOS_OS_TIPOS));
  const [tema, setTema] = useState<TemaAjri | "todos">("todos");
  const [visiveis, setVisiveis] = useState(POR_PAGINA);

  // `?q=` muda com a página já aberta (link de "relacionados" clicado na
  // própria ficha): o estado inicial não reage sozinho, então o efeito
  // sincroniza busca e volta a lista ao início — mesmo contrato de quem
  // chega de fora com `?q=` na URL.
  useEffect(() => {
    setBusca(buscaInicial);
    setVisiveis(POR_PAGINA);
  }, [buscaInicial]);

  const lista = useMemo(() => {
    const filtrada = AUDITORIA_AJRI.filter(
      (d) =>
        instrumentos.has(d.instrumento) &&
        tipos.has(d.tipo) &&
        (tema === "todos" || d.temas.includes(tema)) &&
        dentroDoIntervalo(d.data, de, ate) &&
        casaBusca(busca, d)
    );
    const copia = [...filtrada];
    if (ordem === "recente") return copia.sort((a, b) => b.data.localeCompare(a.data));
    if (ordem === "antigo") return copia.sort((a, b) => a.data.localeCompare(b.data));
    return copia.sort((a, b) => a.codigo.localeCompare(b.codigo, "pt"));
  }, [instrumentos, tipos, tema, de, ate, busca, ordem]);

  const filtroAtivo =
    busca !== "" ||
    de !== "" ||
    ate !== "" ||
    ordem !== "recente" ||
    tema !== "todos" ||
    instrumentos.size !== TODOS_OS_INSTRUMENTOS.length ||
    tipos.size !== TODOS_OS_TIPOS.length;

  /** Todo filtro volta ao começo da lista — senão a página 3 de outro recorte. */
  function aoFiltrar<T>(setter: (v: T) => void) {
    return (v: T) => {
      setVisiveis(POR_PAGINA);
      setter(v);
    };
  }

  function limpar() {
    setBusca("");
    setDe("");
    setAte("");
    setOrdem("recente");
    setInstrumentos(new Set(TODOS_OS_INSTRUMENTOS));
    setTipos(new Set(TODOS_OS_TIPOS));
    setTema("todos");
    setVisiveis(POR_PAGINA);
  }

  const campo =
    "rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none";

  return (
    <section className="mt-8" aria-labelledby="titulo-acervo">
      <h2
        id="titulo-acervo"
        className="font-display text-[clamp(1.25em,2.6vw,1.6em)] leading-tight font-bold tracking-tight"
      >
        O acervo da auditoria
      </h2>

      <div
        role="search"
        aria-label="Filtros do acervo da auditoria"
        className="mt-5 rounded-2xl border border-border bg-surface-2 p-4"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-[2] flex-col">
            <label htmlFor="ajri-busca" className="mb-1 text-xs font-medium text-text-soft">
              Buscar
            </label>
            <input
              id="ajri-busca"
              type="search"
              value={busca}
              onChange={(e) => aoFiltrar(setBusca)(e.target.value)}
              placeholder="Descrição, código do documento ou tema…"
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="ajri-de" className="mb-1 text-xs font-medium text-text-soft">
              De
            </label>
            <input
              id="ajri-de"
              type="date"
              value={de}
              min={FAIXA.min}
              max={FAIXA.max}
              onChange={(e) => aoFiltrar(setDe)(e.target.value)}
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="ajri-ate" className="mb-1 text-xs font-medium text-text-soft">
              Até
            </label>
            <input
              id="ajri-ate"
              type="date"
              value={ate}
              min={FAIXA.min}
              max={FAIXA.max}
              onChange={(e) => aoFiltrar(setAte)(e.target.value)}
              className={campo}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="ajri-tema" className="mb-1 text-xs font-medium text-text-soft">
              Tema
            </label>
            {/* `select`, não botão: são 25 temas. Uma parede de 25 pílulas
                empurraria a lista para fora da primeira tela. */}
            <select
              id="ajri-tema"
              value={tema}
              onChange={(e) => aoFiltrar(setTema)(e.target.value as TemaAjri | "todos")}
              className={campo}
            >
              <option value="todos">Todos os temas</option>
              {TEMA_AJRI_ORDEM.map((t) => (
                <option key={t} value={t}>
                  {TEMA_AJRI_LABEL[t]} ({formatNumberBR(TOTAL_POR_TEMA[t])})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="ajri-ordem" className="mb-1 text-xs font-medium text-text-soft">
              Ordenar
            </label>
            <select
              id="ajri-ordem"
              value={ordem}
              onChange={(e) => aoFiltrar(setOrdem)(e.target.value as Ordem)}
              className={campo}
            >
              <option value="recente">Mais recente</option>
              <option value="antigo">Mais antigo</option>
              <option value="codigo">Código (A–Z)</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-text-soft">
            Exibindo <strong className="text-text">{formatNumberBR(lista.length)}</strong> de{" "}
            {formatNumberBR(AUDITORIA_AJRI.length)} documentos
          </p>
          <button
            type="button"
            onClick={limpar}
            disabled={!filtroAtivo}
            className="cp-btn-anim rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-soft transition-colors hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div
        className="mt-3 flex flex-wrap gap-2"
        role="group"
        aria-label="Filtrar por instrumento jurídico"
      >
        {TODOS_OS_INSTRUMENTOS.map((i) => (
          <BotaoAlternar
            key={i}
            ativo={instrumentos.has(i)}
            onClick={() => {
              setVisiveis(POR_PAGINA);
              setInstrumentos(alternar(instrumentos, i));
            }}
          >
            {INSTRUMENTO_AJRI_LABEL[i]}{" "}
            <span className="opacity-70">({formatNumberBR(TOTAL_POR_INSTRUMENTO[i])})</span>
          </BotaoAlternar>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {TODOS_OS_TIPOS.map((t) => (
          <BotaoAlternar
            key={t}
            ativo={tipos.has(t)}
            onClick={() => {
              setVisiveis(POR_PAGINA);
              setTipos(alternar(tipos, t));
            }}
          >
            {TIPO_DOCUMENTO_AJRI_LABEL[t]}
          </BotaoAlternar>
        ))}
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {lista.slice(0, visiveis).map((d) => (
          <Ficha key={d.id} doc={d} />
        ))}
      </ul>

      {lista.length > visiveis && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setVisiveis((v) => v + POR_PAGINA)}
            className="cp-btn-anim rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:border-primary hover:text-primary"
          >
            Mostrar mais {formatNumberBR(Math.min(POR_PAGINA, lista.length - visiveis))} de{" "}
            {formatNumberBR(lista.length - visiveis)} restantes
          </button>
        </div>
      )}

      {lista.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-5 text-sm text-text-soft">
          Nenhum documento para os filtros selecionados.{" "}
          <button
            type="button"
            onClick={limpar}
            className="font-medium text-primary underline underline-offset-2 hover:text-accent"
          >
            Limpar filtros
          </button>
          .
        </p>
      )}

      <p className="mt-8 text-xs text-text-soft">
        Acervo de {formatDateBR(PERIODO_AUDITORIA_AJRI.de)} a{" "}
        {formatDateBR(PERIODO_AUDITORIA_AJRI.ate)}, coletado do repositório público do portal da
        auditoria. Este portal não recalcula, não reclassifica e não atualiza sozinho.
      </p>
    </section>
  );
}

/** Liga/desliga um valor do conjunto sem mutar o estado anterior. */
function alternar<T>(atual: Set<T>, valor: T): Set<T> {
  const novo = new Set(atual);
  if (novo.has(valor)) novo.delete(valor);
  else novo.add(valor);
  return novo;
}

/**
 * ═══ A FICHA LEGÍVEL VEM ANTES DO TEXTO DA AECOM, E ISSO É A ENTREGA ═══
 *
 * A `descricao` original tem **mediana de 346 caracteres** e é escrita em
 * jargão de contrato ("referente aos trabalhos de auditoria das ações
 * emergenciais em desenvolvimento pela VALE para o restabelecimento das
 * captações…"). Quem não é técnico não sabe, lendo isso, o que o documento é.
 *
 * Então o card abre pela ficha — o que é, quando, de onde vem — e guarda o
 * texto original num `<details>` rotulado. Guarda, não descarta: ele continua
 * no DOM, continua sendo o que a busca desta página filtra, e continua sendo a
 * palavra da AECOM, transcrita sem edição. **A ficha nunca substitui a fonte**,
 * e o link para o portal segue em toda ficha.
 *
 * Nada aqui é gerado por modelo: cada frase sai de `fichaLegivelAjri()`, que é
 * função pura sobre os metadados e tem contrato travado em
 * `lib/paraopeba/ficha-legivel-ajri.test.ts`.
 */
function Ficha({ doc }: { doc: DocumentoAuditoriaAjri }) {
  const legivel = fichaLegivelAjri(doc);
  return (
    <li className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-display font-semibold text-text">
          {INSTRUMENTO_AJRI_LABEL[doc.instrumento]}
        </p>
        <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft">
          {TIPO_DOCUMENTO_AJRI_LABEL[doc.tipo]}
        </span>
      </div>
      <p className="mt-1 text-xs text-text-soft">
        {formatDateBR(doc.data)} · <span className="font-mono">{doc.codigo}</span>
      </p>

      <p className="mt-2.5 text-[.97em] leading-snug text-text">{legivel.oQueE}</p>

      {/* `data` é a publicação; o período examinado está DENTRO da descrição e
          costuma ser outro mês — dizer os dois evita ler o relatório de julho
          como se fosse sobre julho. */}
      <p className="mt-1.5 text-sm text-text-soft">
        Publicado em <strong className="font-medium text-text">{legivel.quando}</strong>
        {legivel.periodoExaminado && (
          <>
            {" "}
            · examina o período{" "}
            <strong className="font-medium text-text">{legivel.periodoExaminado.frase}</strong>
          </>
        )}
      </p>

      {/* Crédito na ficha, não só no topo da página — ver o cabeçalho. */}
      <p className="mt-1 text-xs text-text-soft">De onde vem: {legivel.deOndeVem}</p>

      {/* O resumo é obra nova deste portal; a ficha separa as duas vozes — ver
          o cabeçalho do próprio componente ResumoDaFicha. */}
      <ResumoDaFicha doc={doc} />

      <details className="mt-2.5">
        <summary className="cursor-pointer text-xs font-medium text-text-soft hover:text-text">
          Ler a descrição original da AECOM, transcrita sem edição
        </summary>
        <p className="mt-2 text-sm text-text-soft">{doc.descricao}</p>
      </details>

      <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-text-soft">
        Sobre o quê:
        {legivel.sobreOQue.map((rotulo, i) => (
          <span
            key={doc.temas[i]}
            className="rounded-full bg-surface-2 px-2 py-0.5 text-[.92em] text-text-soft"
          >
            {rotulo}
          </span>
        ))}
      </p>
      <a
        href={urlDocumentoAjri(doc.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-accent"
      >
        Abrir o documento no portal da auditoria ↗
      </a>{" "}
      {/* O portal gera o PDF na hora e exige cadastro. Dizer isso antes do
          clique é a diferença entre "link quebrado" e "precisa de login". */}
      <span className="text-xs text-text-soft">
        — o portal exige cadastro e gera o PDF na hora
      </span>

      <RelacionadosDaFicha doc={doc} />
    </li>
  );
}

/**
 * ═══ O RESUMO É OBRA NOVA — E A FICHA DIZ ISSO NA PRÓPRIA FICHA ═══
 *
 * Os 337 resumos são paráfrase em linguagem comum escrita por este projeto,
 * não texto da AECOM: a rubrica da fase de conteúdo
 * (`X:\DevCoder\_ajri\RUBRICA.md`) mandou PREENCHER campos, não escrever
 * texto livre, e cada `citacao` foi conferida literalmente contra o
 * texto-fonte em 3 passadas de crítico + rede de segurança determinística.
 * Por isso o veredito aparece com a citação que o sustenta — e o
 * "não declarado" diz que a AECOM não escreveu veredito, sem que este portal
 * invente um. A palavra da auditora continua logo abaixo, transcrita sem
 * edição, junto do link para a fonte.
 */

/** Data de reunião pode vir só com mês ("AAAA-MM") quando o documento não dá o
 * dia — formata como "agosto de 2021", nunca inventa o dia 1. */
function formatDataReuniaoBR(data: string): string {
  const soMes = /^(\d{4})-(\d{2})$/.exec(data);
  if (soMes) {
    const [, ano, mes] = soMes;
    const nome = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", {
      month: "long",
    });
    return `${nome} de ${ano}`;
  }
  return formatDateBR(data);
}

function ResumoDaFicha({ doc }: { doc: DocumentoAuditoriaAjri }) {
  const resumo = RESUMO_AJRI[doc.codigo];
  if (!resumo) return null;
  return (
    <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
      <p className="text-xs text-text-soft">
        Resumo em linguagem comum, escrito por este portal a partir do documento — obra nova,
        não texto da AECOM. A descrição original, transcrita sem edição, está abaixo.
      </p>

      <p className="text-[.97em] leading-snug text-text">{resumo.objeto}</p>

      {resumo.resumo.map((b) => (
        <div key={b.titulo}>
          <h3 className="font-display text-sm font-semibold text-text">{b.titulo}</h3>
          <p className="mt-0.5 text-sm leading-snug text-text-soft">{b.texto}</p>
        </div>
      ))}

      <VereditoDaFicha resumo={resumo} />

      {resumo.constatacoes.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-text">O que a auditoria verificou</h3>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-text-soft">
            {resumo.constatacoes.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {resumo.pendencias.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-text">O que ficou em aberto</h3>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-text-soft">
            {resumo.pendencias.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {resumo.numeros.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-text">Os números</h3>
          <ul className="mt-1 space-y-1 text-sm text-text-soft">
            {resumo.numeros.map((n) => (
              <li key={n.o_que}>
                <strong className="font-medium text-text">{n.o_que}:</strong> {n.valor}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resumo.quem_participou.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-text">Quem participou</h3>
          <ul className="mt-1 space-y-1.5 text-sm text-text-soft">
            {resumo.quem_participou.map((i, idx) => (
              <li key={`${i.sigla}-${idx}`}>
                <strong className="font-medium text-text">{i.sigla}</strong>
                {" — "}
                {i.nome}
                {i.pessoas.length > 0 && (
                  <span className="block pl-4 text-xs">
                    {i.pessoas.map((p) => `${p.nome} (${p.cargo})`).join(" · ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {resumo.reunioes.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-semibold text-text">Reuniões e inspeções</h3>
          <ul className="mt-1 space-y-1 text-sm text-text-soft">
            {resumo.reunioes.map((e) => (
              <li key={`${e.data}-${e.assunto}`}>
                <strong className="font-medium text-text">{formatDataReuniaoBR(e.data)}</strong> —{" "}
                {e.assunto}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * O veredito que a AECOM escreveu, com a citação que o sustenta. O rótulo é
 * o sinal (a cor só reforça — a11y), e o não-declarado explica o que é:
 * ausência de veredito na fonte, não veredito neutro deste portal.
 */
function VereditoDaFicha({ resumo }: { resumo: ResumoAjri }) {
  const declarado = resumo.veredito !== "nao-declarado";
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
      <p className="text-text">
        {declarado ? (
          <>
            O que a AECOM escreveu como veredito:{" "}
            <span className={VEREDITO_COR[resumo.veredito]}>
              {VEREDITO_AJRI_LABEL[resumo.veredito]}
            </span>
          </>
        ) : (
          <>
            Veredito:{" "}
            <span className={VEREDITO_COR["nao-declarado"]}>
              {VEREDITO_AJRI_LABEL["nao-declarado"]}
            </span>{" "}
            <span className="text-text-soft">
              — a AECOM não escreve veredito neste documento, e este portal não inventa um.
            </span>
          </>
        )}
      </p>
      {resumo.citacao && (
        <blockquote className="mt-2 border-l-2 border-primary pl-3 text-sm italic text-text-soft">
          {resumo.citacao}
        </blockquote>
      )}
    </div>
  );
}

/** Cor de apoio ao rótulo do veredito — nunca o único sinal (a11y). */
const VEREDITO_COR: Record<VereditoAjri, string> = {
  satisfatorio: "font-semibold text-emerald-700",
  "com-ressalvas": "font-semibold text-amber-700",
  insatisfatorio: "font-semibold text-red-700",
  "nao-declarado": "font-medium text-text-soft",
};

/**
 * ═══ O FIM DA FICHA APONTA PARA O QUE O PORTAL JÁ TEM ═══
 *
 * Mesmo tema, até 6 meses antes ou depois, no máximo 3 de cada acervo, os
 * mais próximos no tempo — a régua inteira está em
 * `lib/paraopeba/relacionados.ts`, sem modelo, com os números pinçados em
 * `relacionados.test.ts`. Ficha do mesmo catálogo abre com o código na
 * busca (`?q=`); notícia de ATI, instituição de justiça e imprensa abre na
 * fonte original — o portal nunca copia o conteúdo, só aponta.
 */
function RelacionadosDaFicha({ doc }: { doc: DocumentoAuditoriaAjri }) {
  const rel = useMemo(() => relacionadosDaFicha(doc), [doc]);
  const total =
    rel.mesmosTemas.length +
    rel.noticiasAti.length +
    rel.noticiasIj.length +
    rel.noticiasImprensa.length;

  if (total === 0) return null;

  return (
    <details className="mt-3 border-t border-border/60 pt-3">
      <summary className="cursor-pointer text-xs font-medium text-text hover:text-primary">
        Relacionados ({formatNumberBR(total)})
      </summary>
      <div className="mt-2.5 space-y-3 text-xs text-text-soft">
        {rel.mesmosTemas.length > 0 && (
          <div>
            <p className="font-medium text-text">Neste catálogo, mesmo tema</p>
            <ul className="mt-1 space-y-1">
              {rel.mesmosTemas.map((x) => (
                <li key={x.id}>
                  <a
                    href={`/paraopeba/auditoria?q=${encodeURIComponent(x.codigo)}`}
                    className="font-medium text-primary underline underline-offset-2 hover:text-accent"
                  >
                    {x.codigo}
                  </a>{" "}
                  · {formatDateBR(x.data)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {rel.noticiasAti.length > 0 && (
          <div>
            <p className="font-medium text-text">ATIs</p>
            <ul className="mt-1 space-y-1">
              {rel.noticiasAti.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2 hover:text-accent"
                  >
                    {n.titulo} ↗
                  </a>{" "}
                  · {ATI_LABEL[n.ati]} · {formatDateBR(n.data)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {rel.noticiasIj.length > 0 && (
          <div>
            <p className="font-medium text-text">Instituições de justiça</p>
            <ul className="mt-1 space-y-1">
              {rel.noticiasIj.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2 hover:text-accent"
                  >
                    {n.titulo} ↗
                  </a>{" "}
                  · {INSTITUICAO_JUSTICA_LABEL[n.instituicao]} · {formatDateBR(n.data)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {rel.noticiasImprensa.length > 0 && (
          <div>
            <p className="font-medium text-text">Imprensa</p>
            <ul className="mt-1 space-y-1">
              {rel.noticiasImprensa.map((n) => (
                <li key={n.id}>
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline underline-offset-2 hover:text-accent"
                  >
                    {n.titulo} ↗
                  </a>{" "}
                  · {n.portal} · {formatDateBR(n.data)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="pt-1 text-[.95em] text-text-soft">
          Mesmo tema, até 6 meses antes ou depois, no máximo 3 por acervo — os mais próximos no
          tempo. Regra fixa, sem modelo. Fichas do catálogo abrem com o código na busca.
        </p>
      </div>
    </details>
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
