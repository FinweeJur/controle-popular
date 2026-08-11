"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@/lib/congresso/link";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import VicioBadge from "@/app/congresso/components/VicioBadge";
import Autoria from "@/app/congresso/components/Autoria";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import type { Proposicao, Analise } from "@/lib/congresso/proposicoes";
import type { AutoriaResumo } from "@/lib/db/queries/congresso";
import { RUBRICA, labelDoRotulo } from "@/lib/congresso/rubrica";
import type { NivelGravidade } from "@/lib/congresso/rubrica_vicio";

/**
 * Tabela de `/congresso/proposicoes`, com filtro/busca/paginação movidos do
 * SERVIDOR para o NAVEGADOR — a primeira das oito páginas pesadas (ver
 * `docs/deploy-github-pages.md` §9.2).
 *
 * ═══ POR QUE ESTA E NÃO UMA DAS "FILTRAR NO CLIENTE" ═══
 *
 * As quatro páginas leves (`camara/legislacao`, `congresso/{agenda,alertas}`)
 * já buscavam o conjunto inteiro no servidor. Aqui não: `paginaDeProposicoes`
 * sempre foi paginada de verdade (`LIMIT`/`OFFSET`, `count(*) over ()`), e o
 * conjunto inteiro é 5.562 linhas / 16,16 MiB — grande demais para embutir no
 * HTML (ver o porquê em `dados/[arquivo]/route.ts`). Por isso usa
 * `lib/estatico/fatiar.ts` (via o Route Handler) + `TabelaEstatica`.
 *
 * ═══ O FILTRO `autor` FOI REMOVIDO, NÃO SÓ ESCONDIDO ═══
 *
 * A versão original tinha um quarto filtro (`?autor=`, alimentado por uma
 * busca de autor "vinda da barra de busca ao escolher um autor nas
 * sugestões" — comentário do código original). Ele NUNCA teve um link real
 * apontando pra cá: `grep -rn "autor="` em `app/` não encontra nenhum
 * chamador. E replicar no cliente exigiria dado que o índice não tem —
 * `autoriaDeProposicoes` traz só os 2 PRIMEIROS autores por proposição
 * (`AutoriaResumo.autores`), e o SQL original buscava entre TODOS
 * (`PEC 3/2026` tem 224). Um filtro de autor client-side sobre só os 2
 * primeiros responderia errado pros outros 222 — pareceria funcionar e
 * mentiria. Sem chamador nenhum pra justificar inflar o índice com a lista
 * completa de autores de toda proposição, o filtro foi removido.
 *
 * ═══ TEMA E CLASSIFICAÇÃO ═══
 *
 * `tema`/`rotulo` continuam replicando exatamente o que o SQL fazia
 * (`temas_oficiais @> ARRAY[...]` e `analise.rotulo = ...`) — ver `filtrar`
 * abaixo. `RUBRICA`/`labelDoRotulo` só leem `rubrica.json`, seguro de
 * importar direto no cliente.
 *
 * ═══ `tramitando` E `ano` — INVISÍVEIS NO FORMULÁRIO ORIGINAL, MAS REAIS ═══
 *
 * O form original não tinha campo nenhum para os dois, mas o servidor os
 * lia de `searchParams` assim mesmo — só alcançáveis digitando a URL. O que
 * importa preservar é `tramitando`: SEM parâmetro nenhum, a página sempre
 * filtrava `tramitando: true` (só o que ainda tramita); só `?tramitando=0`
 * mostrava as 5.562 inteiras. Ou seja, o filtro "só em tramitação" era o
 * padrão de fato de todo mundo que usa o formulário visível, não um caso de
 * borda — buscar tudo sem filtro nenhum teria mudado o que a maioria das
 * pessoas vê na primeira visita. `ano` não tinha esse efeito (não muda o
 * padrão, só filtra quando alguém pede), mas o dado já está em toda linha e
 * dar um campo visível pra ele custa uma linha de UI — em vez de descartar,
 * ele ganhou o campo que nunca teve.
 */

// A interseção com `Record<string, unknown>` é só para satisfazer o
// parâmetro genérico de `TabelaEstatica` (`T extends Record<string,
// unknown>`) — uma interface fechada não tem assinatura de índice implícita,
// e sem isso o TypeScript recusa `TabelaEstatica<LinhaProposicao>`. Os campos
// nomeados continuam com o tipo específico; só chave desconhecida cai em
// `unknown`.
export type LinhaProposicao = Proposicao & {
  analise: Analise | null;
  vicioNivelGravidade: NivelGravidade | null;
  autoria?: AutoriaResumo;
} & Record<string, unknown>;

export interface ListaProposicoesProps {
  base: string;
  temas: string[];
}

const COLUNAS: ColunaTabela<LinhaProposicao>[] = [
  {
    chave: "identificacao",
    rotulo: "Proposição",
    formatar: (p) => (
      <div className="flex flex-col gap-1">
        <Link
          href={`/proposicoes/${p.id}`}
          className="font-display font-semibold underline-offset-2 hover:underline"
        >
          {p.identificacao}
        </Link>
        <div className="flex flex-wrap gap-1.5">
          <RotuloBadge rotulo={p.analise?.rotulo} score={p.analise?.score} tamanho="sm" />
          <VicioBadge nivel={p.vicioNivelGravidade} tamanho="sm" />
        </div>
      </div>
    ),
  },
  {
    chave: "ementa",
    rotulo: "Ementa",
    formatar: (p) => <span className="line-clamp-3">{p.ementa}</span>,
  },
  {
    chave: "autoria",
    rotulo: "Autoria",
    formatar: (p) => <Autoria autoria={p.autoria} className="text-xs" />,
  },
  {
    chave: "situacao",
    rotulo: "Situação",
    formatar: (p) => (
      <div className="flex flex-col gap-0.5 text-xs opacity-85">
        {p.orgao_atual ? <span>{p.orgao_atual}</span> : null}
        <span>{p.situacao ?? "situação não registrada"}</span>
      </div>
    ),
  },
  {
    chave: "data_apresentacao",
    rotulo: "Data",
    formatar: (p) =>
      p.data_apresentacao ? new Date(p.data_apresentacao).toLocaleDateString("pt-BR") : "—",
  },
];

export default function ListaProposicoes({ base, temas }: ListaProposicoesProps) {
  const [tema, setTema] = useState<string | undefined>(undefined);
  const [rotulo, setRotulo] = useState<string | undefined>(undefined);
  const [ano, setAno] = useState<string>("");
  // Mesmo padrão do original: sem filtro nenhum, só o que ainda tramita.
  const [soTramitando, setSoTramitando] = useState(true);

  const primeiraRenderizacao = useRef(true);

  // Estado inicial vindo da URL, uma vez, depois da hidratação — mesmo
  // padrão de `TabelaEstatica` (não usa `useSearchParams()`, ver o porquê
  // no topo daquele arquivo).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTema(sp.get("tema") ?? undefined);
    setRotulo(sp.get("rotulo") ?? undefined);
    setAno(sp.get("ano") ?? "");
    setSoTramitando(sp.get("tramitando") !== "0");
  }, []);

  // Espelha de volta na URL, sem entrar no histórico — o link continua
  // compartilhável mesmo sem `useSearchParams()`.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    tema ? sp.set("tema", tema) : sp.delete("tema");
    rotulo ? sp.set("rotulo", rotulo) : sp.delete("rotulo");
    ano ? sp.set("ano", ano) : sp.delete("ano");
    soTramitando ? sp.delete("tramitando") : sp.set("tramitando", "0");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [tema, rotulo, ano, soTramitando]);

  const filtrar = useCallback(
    (p: LinhaProposicao) => {
      if (tema && !(p.temas_oficiais ?? []).includes(tema)) return false;
      if (rotulo && p.analise?.rotulo !== rotulo) return false;
      if (ano && p.ano !== Number(ano)) return false;
      if (soTramitando && p.tramitando !== true) return false;
      return true;
    },
    [tema, rotulo, ano, soTramitando]
  );

  return (
    <TabelaEstatica<LinhaProposicao>
      base={base}
      colunas={COLUNAS}
      camposBusca={["ementa", "keywords", "identificacao"]}
      vazio="Nenhuma proposição sincronizada ainda."
      filtrar={filtrar}
      controles={() => (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4">
          <label className="text-sm">
            <span className="mr-2 opacity-75">Tema oficial</span>
            <select
              value={tema ?? ""}
              onChange={(e) => setTema(e.target.value || undefined)}
              className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
            >
              <option value="">Todos</option>
              {temas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mr-2 opacity-75">Classificação</span>
            <select
              value={rotulo ?? ""}
              onChange={(e) => setRotulo(e.target.value || undefined)}
              className="rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
            >
              <option value="">Todas</option>
              {RUBRICA.faixas.map((f) => (
                <option key={f.rotulo} value={f.rotulo}>
                  {f.label}
                </option>
              ))}
              <option value="misto">{labelDoRotulo("misto")}</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mr-2 opacity-75">Ano</span>
            <input
              type="number"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              placeholder="2026"
              className="w-24 rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={soTramitando}
              onChange={(e) => setSoTramitando(e.target.checked)}
              className="size-4"
            />
            Só em tramitação
          </label>
          {(tema || rotulo || ano || !soTramitando) && (
            <button
              type="button"
              onClick={() => {
                setTema(undefined);
                setRotulo(undefined);
                setAno("");
                setSoTramitando(true);
              }}
              className="text-sm underline"
            >
              limpar
            </button>
          )}
        </div>
      )}
    />
  );
}
