"use client";

import { useCallback, useEffect, useRef, useState } from "react";
// `next/link` DIRETO, e não o `<Link>` de zona (`lib/link-zona.tsx`): esta
// página mora na RAIZ do domínio, então todo caminho que sai daqui já é
// absoluto e o wrapper de zona só teria como estragá-lo (`/congresso/bh/saude`
// a partir de `/bh/saude`). Mesma escolha, pelo mesmo motivo, de
// `app/termos/page.tsx`. `<a>` cru também não serve: perde o pré-carregamento
// da rota, e o lint do Next reprova com razão.
import Link from "next/link";
import { interpretar, type Candidato } from "@/lib/assistente/navegacao";
import {
  IndiceIndisponivel,
  carregarIndice,
  indiceJaCarregado,
  type Progresso,
} from "@/lib/assistente/documentos";
import {
  cidadeDaResposta,
  compor,
  interpretarComposicao,
  type IntentComposicao,
  type RespostaComposicao,
} from "@/lib/assistente/compor";
import { buscar, type Resultado } from "@/lib/busca/indice";

/**
 * Assistente de navegação do portal — a metade DETERMINÍSTICA do N8.
 *
 * ═══ O QUE ELE FAZ, E O QUE ELE SE RECUSA A FAZER ═══
 *
 * Ele leva a pessoa a uma página. Ele não afirma dado: nenhum número desta
 * tela é escrito aqui: os botões são títulos de página e caminhos, e o que
 * afirma o dado é a página que abre. É a mesma disciplina de
 * `REGRAS_COMUNS` em `lib/chat-comum.ts`, só que aqui ela é estrutural —
 * `lib/assistente/catalogo.ts` não tem onde guardar um número, e
 * `navegacao.test.ts` reprova título com dígito.
 *
 * Quando não reconhece a intenção, ele diz que não reconheceu. `interpretar()`
 * devolve `[]` para texto sem intenção e para cidade que o portal não
 * atende, e esta tela mostra isso como resposta, não como falha.
 *
 * ═══ O TERCEIRO PASSO: COMPOSIÇÃO ═══
 *
 * "compare Betim e Belo Horizonte" e "o que falta em Betim" são respondidos
 * por regra escrita (`lib/assistente/compor.ts`) sobre o índice de
 * documentos JÁ carregado do degrau 1 — sem modelo, sem rede além dele. A
 * disciplina de não afirmar número continua: as contagens que a composição
 * mostra vêm do índice, e o texto da resposta diz que vêm dele. "Compare
 * Betim e Contagem" tem resposta honesta: Contagem não é atendida.
 *
 * ═══ POR QUE O CATÁLOGO É IMPORTADO AQUI E NÃO VEM COMO PROP ═══
 *
 * `page.tsx` não passa NADA para este componente. O catálogo entra por
 * `import`, dentro do módulo `"use client"`, e por isso vive no chunk JS
 * (uma vez, minificado, servido com gzip) em vez de no payload da rota.
 * Passá-lo como prop o serializaria duas vezes — HTML e RSC flight — com o
 * nome de todo campo repetido por linha: é a inflação de **7,5×** medida em
 * `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`, que levou `/ambiental/legislacao` a
 * gerar um `.cache` de 35,5 MiB contra o teto de 25 MiB do Workers e travou
 * o deploy do dia 15/08.
 *
 * ═══ POR QUE NENHUMA ANIMAÇÃO NOVA ═══
 *
 * Todas as microanimações daqui — `.cp-pensando-ponto`, `.cp-varredura`,
 * `.cp-tremor` — já existem em `app/globals.css`, e o bloco
 * `@media (prefers-reduced-motion: reduce)` de lá já as desliga (e deixa a
 * barra de varredura CHEIA e estática, para o "pensando" continuar
 * visível sem movimento). Reusá-las custa zero byte de bundle e herda o
 * respeito ao reduced-motion de graça; escrever `@keyframes` novo aqui
 * criaria uma animação fora daquele bloco, que é exatamente o modo de
 * falha que o N8 proíbe — o portal é lido por quem está sob estresse.
 *
 * Nenhuma biblioteca de animação foi acrescentada. O `package.json` não foi
 * tocado (é território proibido, `docs/worktrees.md`).
 *
 * ═══ AS DUAS VELOCIDADES, E POR ISSO O BOTÃO DE INTERROMPER ═══
 *
 * Navegar é instantâneo: `interpretar()` roda em **0,35 ms medidos** sobre
 * o catálogo que já está no chunk. Não há o que interromper ali.
 *
 * Procurar DOCUMENTO é caro: o índice da `/busca` foi medido em **~5,0 MB**
 * (commit `1ce7f77`) e só é baixado quando a pessoa pede, com
 * `AbortController` de verdade — ver `lib/assistente/documentos.ts`. É por
 * isso que "Interromper" existe e por que ele aparece só nesse passo:
 * botão de interromper que não interrompe nada seria enfeite, e o N8 exige
 * por escrito que ele interrompa de verdade.
 */

/**
 * O passo atual da conversa.
 *
 * União discriminada por `fase`, e não um punhado de booleanos: com
 * booleanos existem estados impossíveis representáveis (`carregando &&
 * erro`), e foi assim que a versão antiga de outra tela chegou a mostrar
 * "pensando" em cima de uma resposta pronta.
 *
 * `ms` viaja DENTRO do passo de propósito. O N8 exige que a contagem de
 * tempo permaneça visível depois da resposta — num portal de transparência,
 * quanto demorou é informação — e um cronômetro guardado à parte seria
 * zerado pelo passo seguinte.
 */
type Passo =
  | { fase: "menu" }
  | {
      fase: "pensando";
      pergunta: string;
      candidatos: Candidato[];
      /** Marca de início. O decorrido sai SEMPRE de `now - inicio`, nunca de
       *  somar tiques: somar erraria junto com o `setInterval` (que atrasa
       *  quando a aba perde foco), e a contagem de tempo do portal estaria
       *  mentindo justamente sobre lentidão. */
      inicio: number;
      decorrido: number;
      progresso: Progresso | null;
    }
  | { fase: "resposta"; pergunta: string; candidatos: Candidato[]; documentos: Resultado[] | null; composicao: RespostaComposicao | null; ms: number }
  | { fase: "interrompido"; pergunta: string; candidatos: Candidato[]; ms: number }
  | { fase: "erro"; pergunta: string; candidatos: Candidato[]; texto: string; ms: number };

const SUGESTOES = [
  "saúde em BH",
  "contratos da prefeitura de Betim",
  "compare Betim e Belo Horizonte",
  "o que falta em Betim",
  "abrir Diamantina no mapa",
  "proposições da câmara em São Paulo",
  "parlamentares",
];

/**
 * Duração em palavra humana.
 *
 * "menos de 1 ms" em vez de "0 ms": zero seria mentira (o trabalho
 * aconteceu) e "0,35 ms" seria precisão falsa numa tela — a medição fina
 * mora no teste, não aqui.
 */
function formatarDuracao(ms: number): string {
  if (ms < 1) return "menos de 1 ms";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
}

function formatarBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export default function AssistenteNavegacao() {
  const [texto, setTexto] = useState("");
  const [passo, setPasso] = useState<Passo>({ fase: "menu" });
  /** Pilha do "voltar". Cada resposta empilha o passo anterior. */
  const [pilha, setPilha] = useState<Passo[]>([]);
  const emVoo = useRef<AbortController | null>(null);

  /**
   * Cronômetro vivo do passo "pensando".
   *
   * A leitura do relógio acontece DENTRO do callback do intervalo, nunca no
   * corpo do componente: `performance.now()` é impura, e chamá-la durante a
   * renderização dá um número que muda a cada redesenho que o React resolver
   * fazer por outro motivo (a regra `react-hooks/purity` reprova, e reprovou
   * a primeira versão deste arquivo).
   *
   * 100 ms porque é o passo em que a leitura ainda parece contínua sem pedir
   * um quadro a cada 16 ms de uma máquina que já está baixando 5 MB.
   */
  useEffect(() => {
    if (passo.fase !== "pensando") return;
    const t = setInterval(
      () =>
        setPasso((atual) =>
          atual.fase === "pensando"
            ? { ...atual, decorrido: performance.now() - atual.inicio }
            : atual
        ),
      100
    );
    return () => clearInterval(t);
  }, [passo.fase]);

  /** Aborta o que estiver em voo ao desmontar — a pessoa saiu da página. */
  useEffect(() => () => emVoo.current?.abort(), []);

  const irPara = useCallback((novo: Passo) => {
    setPilha((p) => [...p, passo]);
    setPasso(novo);
  }, [passo]);

  /**
   * Passo 1: navegar. Determinístico, sem rede, sem modelo.
   *
   * Uma exceção instantânea: quando a intenção é "cidade não atendida"
   * ("compare Betim e Contagem"), a resposta não precisa do índice — é uma
   * regra escrita sobre o catálogo, e sai sem "pensando".
   */
  function perguntar(pergunta: string) {
    const q = pergunta.trim();
    if (!q) return;
    const inicio = performance.now();
    const candidatos = interpretar(q);
    const intencao = interpretarComposicao(q);
    if (intencao?.tipo === "cidadeNaoAtendida") {
      irPara({
        fase: "resposta",
        pergunta: q,
        candidatos,
        documentos: null,
        composicao: {
          tipo: "cidadeNaoAtendida",
          nome: intencao.nome,
          cidade: intencao.cidade ? cidadeDaResposta(intencao.cidade) : null,
        },
        ms: performance.now() - inicio,
      });
      setTexto("");
      return;
    }
    irPara({
      fase: "resposta",
      pergunta: q,
      candidatos,
      documentos: null,
      composicao: null,
      ms: performance.now() - inicio,
    });
    setTexto("");
  }

  /**
   * Passo 2, opcional: procurar documento — e o degrau 2, COMPOR.
   *
   * Os dois custam o mesmo: o índice da `/busca` (~5 MB) entra por
   * `carregarIndice`, interrompível de verdade. Sem intenção de composição,
   * o índice alimenta a busca de documentos; com intenção (comparar,
   * lacuna), ele alimenta `compor()` — que é pura e determinística, nada
   * além do índice entra na resposta.
   */
  async function procurar(pergunta: string, candidatos: Candidato[], intencao?: IntentComposicao) {
    emVoo.current?.abort();
    const ctrl = new AbortController();
    emVoo.current = ctrl;
    const inicio = performance.now();
    setPilha((p) => [...p, passo]);
    setPasso({ fase: "pensando", pergunta, candidatos, inicio, decorrido: 0, progresso: null });

    try {
      const indice = await carregarIndice(ctrl.signal, (progresso) =>
        setPasso((atual) => (atual.fase === "pensando" ? { ...atual, progresso } : atual))
      );
      const composicao = intencao ? compor(intencao, indice) : null;
      const documentos = intencao ? null : buscar(pergunta, indice, { limite: 5 });
      setPasso({
        fase: "resposta",
        pergunta,
        candidatos,
        documentos,
        composicao,
        ms: performance.now() - inicio,
      });
    } catch (e) {
      const ms = performance.now() - inicio;
      // Interromper é o caminho que a pessoa PEDIU, não uma falha para
      // mostrar em vermelho. Estado próprio, e o tempo que rodou até parar
      // continua visível — é a informação de "quanto eu teria esperado".
      if ((e as Error)?.name === "AbortError") {
        setPasso({ fase: "interrompido", pergunta, candidatos, ms });
        return;
      }
      const texto =
        e instanceof IndiceIndisponivel
          ? e.message
          : "Não consegui carregar o índice de documentos agora. A navegação por páginas continua funcionando.";
      setPasso({ fase: "erro", pergunta, candidatos, texto, ms });
    } finally {
      if (emVoo.current === ctrl) emVoo.current = null;
    }
  }

  /**
   * Voltar. Aborta o que estiver em voo antes de sair do passo: voltar com
   * um download de 5 MB correndo em segundo plano seria o mesmo defeito do
   * botão de interromper que não interrompe.
   */
  function voltar() {
    emVoo.current?.abort();
    // O passo anterior é lido de `pilha` FORA do updater, e o updater só
    // encurta a pilha. A primeira versão chamava `setPasso` de dentro do
    // updater de `setPilha`: em StrictMode o React invoca updater duas
    // vezes de propósito, e updater com efeito dentro é a receita do bug
    // que só aparece em produção (ou só em dev), nunca nos dois.
    const anterior = pilha.length > 0 ? pilha[pilha.length - 1] : { fase: "menu" as const };
    setPasso(anterior);
    setPilha((p) => p.slice(0, -1));
  }

  const noMenu = passo.fase === "menu";

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          perguntar(texto);
        }}
        className="flex gap-2"
      >
        <label htmlFor="assistente-campo" className="sr-only">
          Para onde você quer ir no portal?
        </label>
        <input
          id="assistente-campo"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex.: saúde em BH, contratos de Betim, abrir o mapa…"
          maxLength={200}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-4 py-3 text-[var(--cp-text)]"
        />
        <button
          type="submit"
          disabled={!texto.trim()}
          className="cursor-pointer rounded-xl border border-[var(--cp-primary)] bg-[var(--cp-primary)] px-5 py-3 font-semibold text-[var(--cp-primary-ink)] disabled:opacity-50"
        >
          Ir
        </button>
      </form>

      {/* ── Prompts sugeridos ── */}
      {noMenu ? (
        <div className="rounded-2xl border border-dashed border-[var(--cp-border)] bg-[var(--cp-surface-2)] p-5">
          <p className="text-sm text-[var(--cp-text-soft)]">
            Escreva para onde quer ir. O assistente leva você à página — ele não
            responde com números; quem responde é a página. Experimente:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => perguntar(s)}
                className="cursor-pointer rounded-full border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5 text-sm text-[var(--cp-text)] hover:border-[var(--cp-primary)]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Pensando: microanimação + progresso + interromper ── */}
      {passo.fase === "pensando" ? (
        <div
          className="rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-5"
          role="status"
          aria-live="polite"
        >
          <div className="relative mb-4 h-0.5 overflow-hidden rounded bg-[var(--cp-surface-2)]">
            <div className="cp-varredura absolute inset-0" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm">
              <span className="flex gap-1" aria-hidden="true">
                <span className="cp-pensando-ponto size-1.5 rounded-full bg-[var(--cp-primary)]" />
                <span
                  className="cp-pensando-ponto size-1.5 rounded-full bg-[var(--cp-primary)]"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="cp-pensando-ponto size-1.5 rounded-full bg-[var(--cp-primary)]"
                  style={{ animationDelay: "0.3s" }}
                />
              </span>
              Procurando nos documentos…
              <span className="font-tabular text-[var(--cp-text-soft)]">
                {formatarDuracao(passo.decorrido)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => emVoo.current?.abort()}
              className="cursor-pointer rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm text-[var(--cp-text)] hover:border-[var(--cp-alert)]"
            >
              Interromper
            </button>
          </div>
          {passo.progresso && passo.progresso.bytesTotais > 0 ? (
            <p className="mt-2 font-tabular text-xs text-[var(--cp-text-soft)]">
              {formatarBytes(passo.progresso.bytesCarregados)} de{" "}
              {formatarBytes(passo.progresso.bytesTotais)}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ── Resposta ── */}
      {passo.fase === "resposta" ? (
        <div
          className="rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-5"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm text-[var(--cp-text-soft)]">
            Você pediu: <span className="text-[var(--cp-text)]">{passo.pergunta}</span>
          </p>

          {passo.candidatos.length > 0 ? (
            <>
              <p className="mt-3 text-sm">
                {passo.candidatos.length === 1
                  ? "Achei esta página:"
                  : "Achei estas páginas — escolha uma:"}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {passo.candidatos.map((c) => (
                  <li key={c.destino.href}>
                    <Link
                      href={c.destino.href}
                      className="flex flex-wrap items-baseline gap-x-2 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface-2)] px-4 py-3 hover:border-[var(--cp-primary)]"
                    >
                      <span className="font-semibold text-[var(--cp-text)]">
                        {c.destino.titulo}
                      </span>
                      {c.destino.contexto ? (
                        <span className="text-sm text-[var(--cp-text-soft)]">
                          · {c.destino.contexto}
                        </span>
                      ) : null}
                      <span className="font-tabular ml-auto text-xs text-[var(--cp-text-soft)]">
                        {c.destino.href}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : passo.composicao ? null : (
            <p className="mt-3 text-sm">
              Não reconheci um destino nessa frase. O assistente só leva a
              páginas que existem — ele não tenta adivinhar a cidade nem o
              assunto. Tente nomear a página (&quot;contratos&quot;,
              &quot;vereadores&quot;) e a cidade.
            </p>
          )}

          {/* ── Degrau 2: composição (comparar / lacuna / não atendida) ── */}
          {passo.composicao ? (
            <div className="mt-5 border-t border-[var(--cp-border)] pt-4">
              {passo.composicao.tipo === "comparacao" ? (
                <>
                  <p className="text-sm font-semibold">Comparação no índice de documentos:</p>
                  <p className="mt-1 text-sm">
                    {passo.composicao.a.nome}: {passo.composicao.a.total} documento
                    {passo.composicao.a.total === 1 ? "" : "s"} · {passo.composicao.b.nome}:{" "}
                    {passo.composicao.b.total} documento
                    {passo.composicao.b.total === 1 ? "" : "s"}
                  </p>
                  {passo.composicao.linhas.length > 0 ? (
                    <table className="mt-3 w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--cp-border)] text-left text-[var(--cp-text-soft)]">
                          <th scope="col" className="py-1.5 pr-3 font-normal">Tema</th>
                          <th scope="col" className="py-1.5 pr-3 font-normal">
                            {passo.composicao.a.nome}
                          </th>
                          <th scope="col" className="py-1.5 font-normal">
                            {passo.composicao.b.nome}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {passo.composicao.linhas.map((l) => (
                          <tr key={l.tema} className="border-b border-[var(--cp-border)] last:border-0">
                            <td className="py-1.5 pr-3">{l.tema}</td>
                            <td className="font-tabular py-1.5 pr-3">{l.a}</td>
                            <td className="font-tabular py-1.5">{l.b}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="mt-2 text-sm">
                      Nenhum documento das duas cidades tem tema cadastrado — só as
                      contagens valem.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-[var(--cp-text-soft)]">
                    Contagem do índice de documentos do portal, que cobre leis municipais e
                    proposições. Há páginas além dele — quem afirma o dado é a página.
                  </p>
                </>
              ) : null}

              {passo.composicao.tipo === "lacuna" ? (
                <>
                  <p className="text-sm font-semibold">
                    Lacunas no índice de documentos de {passo.composicao.cidade.nome}:
                  </p>
                  {passo.composicao.faltando.length > 0 ? (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {passo.composicao.faltando.map((f) => (
                        <li key={f.tema} className="text-sm">
                          <span className="font-semibold">{f.tema}</span>
                          <span className="text-[var(--cp-text-soft)]">
                            {" "}
                            — exemplo: {f.exemplo.nome} ({f.exemplo.total} documento
                            {f.exemplo.total === 1 ? "" : "s"})
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm">
                      Nenhum tema com documento em outra cidade atendida e zero em{" "}
                      {passo.composicao.cidade.nome}.
                    </p>
                  )}
                  <p className="mt-3 text-xs text-[var(--cp-text-soft)]">
                    A ausência é de documento no índice, não de página — {passo.composicao.cidade.nome}{" "}
                    tem todas as páginas do portal. O índice cobre leis municipais e proposições.
                  </p>
                </>
              ) : null}

              {passo.composicao.tipo === "cidadeNaoAtendida" ? (
                <>
                  <p className="text-sm font-semibold">
                    &quot;{passo.composicao.nome}&quot; não é atendida pelo portal.
                  </p>
                  {passo.composicao.cidade ? (
                    <>
                      <p className="mt-1 text-sm text-[var(--cp-text-soft)]">
                        O portal atende {passo.composicao.cidade.nome} — ele não tenta adivinhar
                        cidade fora da lista de atendidas.
                      </p>
                      <Link
                        href={`/${passo.composicao.cidade.slug}`}
                        className="mt-3 inline-block rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm hover:border-[var(--cp-primary)]"
                      >
                        Ir para {passo.composicao.cidade.nome}
                      </Link>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--cp-text-soft)]">
                      Atendemos: Betim, Belo Horizonte, São Paulo, Araçuaí, Diamantina e Itinga.
                    </p>
                  )}
                </>
              ) : null}
            </div>
          ) : null}

          {passo.documentos ? (
            <div className="mt-5 border-t border-[var(--cp-border)] pt-4">
              <p className="text-sm font-semibold">
                {passo.documentos.length > 0
                  ? "Documentos com esse termo:"
                  : "Nenhum documento com esse termo no índice."}
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {passo.documentos.map((r) => (
                  <li key={`${r.doc.i}`}>
                    <Link
                      href={r.doc.h}
                      className="block rounded-xl border border-[var(--cp-border)] px-4 py-2.5 text-sm hover:border-[var(--cp-primary)]"
                    >
                      <span className="font-semibold">{r.doc.t}</span>
                      {r.doc.e ? (
                        <span className="block text-[var(--cp-text-soft)]">{r.doc.e}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : passo.composicao ? null : (
            <button
              type="button"
              onClick={() => procurar(passo.pergunta, passo.candidatos, interpretarComposicao(passo.pergunta) ?? undefined)}
              className="mt-4 cursor-pointer rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm hover:border-[var(--cp-primary)]"
            >
              Procurar nos documentos
              {/* O aviso de peso é parte da decisão, não letra miúda: são
                  ~5 MB medidos, e quem está numa conexão ruim tem direito de
                  saber ANTES de clicar. Depois do primeiro carregamento o
                  índice fica em memória e o aviso deixa de fazer sentido. */}
              {indiceJaCarregado() ? null : (
                <span className="text-[var(--cp-text-soft)]"> (baixa ~5 MB)</span>
              )}
            </button>
          )}

          {/* Contagem de tempo que PERMANECE — exigência escrita do N8. */}
          <p className="font-tabular mt-4 text-xs text-[var(--cp-text-soft)]">
            Respondido em {formatarDuracao(passo.ms)}
            {passo.documentos === null && passo.composicao === null
              ? " · sem rede, sem modelo"
              : " · índice de documentos"}
          </p>
        </div>
      ) : null}

      {/* ── Interrompido ── */}
      {passo.fase === "interrompido" ? (
        <div
          className="rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)] p-5"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold">Busca interrompida.</p>
          <p className="mt-1 text-sm text-[var(--cp-text-soft)]">
            O download do índice foi cancelado de verdade — nada continuou
            baixando em segundo plano.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => procurar(passo.pergunta, passo.candidatos, interpretarComposicao(passo.pergunta) ?? undefined)}
              className="cursor-pointer rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm hover:border-[var(--cp-primary)]"
            >
              Tentar de novo
            </button>
          </div>
          <p className="font-tabular mt-4 text-xs text-[var(--cp-text-soft)]">
            Rodou {formatarDuracao(passo.ms)} antes de parar
          </p>
        </div>
      ) : null}

      {/* ── Erro ── */}
      {passo.fase === "erro" ? (
        <div
          className="cp-tremor rounded-2xl border border-[var(--cp-alert)] bg-[var(--cp-surface)] p-5"
          role="alert"
        >
          <p className="text-sm font-semibold text-[var(--cp-alert)]">{passo.texto}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => procurar(passo.pergunta, passo.candidatos, interpretarComposicao(passo.pergunta) ?? undefined)}
              className="cursor-pointer rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm hover:border-[var(--cp-primary)]"
            >
              Tentar de novo
            </button>
            <Link
              href="/busca"
              className="rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm hover:border-[var(--cp-primary)]"
            >
              Ir para a busca
            </Link>
          </div>
          <p className="font-tabular mt-4 text-xs text-[var(--cp-text-soft)]">
            Falhou depois de {formatarDuracao(passo.ms)}
          </p>
        </div>
      ) : null}

      {/* ── Voltar no menu ── */}
      {noMenu ? null : (
        <div>
          <button
            type="button"
            onClick={voltar}
            className="cursor-pointer rounded-lg border border-[var(--cp-border)] px-3 py-1.5 text-sm text-[var(--cp-text)] hover:border-[var(--cp-primary)]"
          >
            ← Voltar{pilha.length === 0 ? " ao início" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
