"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  DESTINOS_SEM_ASSISTENTE,
  TEXTO_SEM_ASSISTENTE,
  TITULO_SEM_ASSISTENTE,
  lerJsonDaRota,
  lerRespostaDoAssistente,
} from "@/lib/rota-ausente";

/**
 * Barra de busca + assistente, compartilhada pelas TRÊS zonas
 * (`/cidades`, `/congresso`, `/judiciario`).
 *
 * Comporta-se como a barra de um navegador: a pessoa digita, sugestões
 * aparecem embaixo enquanto ela digita, as setas percorrem a lista, Enter
 * abre a sugestão selecionada — e se nada estiver selecionado, Enter manda a
 * frase para o assistente da zona.
 *
 * POR QUE UM COMPONENTE SÓ, e não um por zona: o comportamento (debounce,
 * teclado, aborto de requisição em voo, estados de pensando/erro,
 * acessibilidade do combobox) é onde estão os detalhes difíceis, e são
 * idênticos nas três. O que muda entre zonas é APENAS o que se busca — e
 * isso entra por props (`endpointSugestoes`, `endpointChat`, `exemplos`).
 * Três cópias divergiriam no primeiro ajuste, como já aconteceu com os oito
 * `.replace(/_/g," ")` espalhados que o /judiciario teve de centralizar.
 *
 * DUAS CÓPIAS DO SITE, E UMA DELAS NÃO TEM AS ROTAS: `endpointSugestoes` e
 * `endpointChat` apontam para arquivos `*.din.ts`, que só existem no alvo
 * Cloudflare. No alvo GitHub Pages (`output: 'export'`) as duas somem, e este
 * componente passa a operar no modo `semRotas`: sem fetch por tecla, sem
 * "Consultando os dados…", e com o painel dizendo que o assistente não foi
 * publicado nesta cópia — com link para `/busca` e `/assistente`, que
 * funcionam lá. Antes disso, o 404 caía no `catch` e virava "Falha de
 * conexão", mandando o leitor investigar a própria rede. Ver
 * `lib/rota-ausente.ts`.
 *
 * ACESSIBILIDADE: padrão ARIA de combobox com listbox — `aria-expanded`,
 * `aria-activedescendant`, `aria-controls`, e `role="option"` em cada item.
 * O leitor de tela anuncia o item ao navegar com as setas; sem
 * `aria-activedescendant` ele só anunciaria o campo de texto, e a navegação
 * por teclado seria muda.
 */

export interface Sugestao {
  /** Rótulo do grupo: "Proposição", "Comissão", "Ministro"… */
  tipo: string;
  titulo: string;
  subtitulo?: string | null;
  /** Caminho absoluto dentro do site (já com o prefixo da zona). */
  href: string;
}

interface Resposta {
  sugestoes?: Sugestao[];
  perguntas?: string[];
  erro?: string;
}

type Estado =
  | { fase: "parado" }
  | { fase: "sugerindo" }
  | { fase: "pensando" }
  | { fase: "resposta"; texto: string; semIa?: boolean }
  | { fase: "erro"; texto: string }
  // Separado de `erro` porque a saída é outra: `erro` oferece "tentar de
  // novo", e aqui tentar de novo não tem como funcionar — as rotas não
  // foram publicadas nesta cópia do site. Ver `lib/rota-ausente.ts`.
  | { fase: "ausente" };

const DEBOUNCE_MS = 180;
const MIN_CARACTERES = 2;

export default function BuscaUniversal({
  endpointSugestoes,
  endpointChat,
  placeholder = "Buscar ou perguntar…",
  exemplos = [],
  aviso,
  className = "",
}: {
  endpointSugestoes: string;
  endpointChat: string;
  placeholder?: string;
  /** Perguntas de exemplo, mostradas com o campo vazio e em foco. */
  exemplos?: string[];
  /** Ressalva exibida abaixo da resposta do assistente. */
  aviso?: string;
  className?: string;
}) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [perguntas, setPerguntas] = useState<string[]>([]);
  const [indice, setIndice] = useState(-1);
  const [estado, setEstado] = useState<Estado>({ fase: "parado" });
  // Uma vez descoberto que as rotas não existem neste build, não desdescobre:
  // para de disparar fetch a cada tecla e para de prometer resposta. As duas
  // rotas (`api/busca` e `api/chat`) são `*.din.ts` e somem JUNTAS no alvo
  // estático, então a descoberta por qualquer uma delas vale para as duas.
  const [semRotas, setSemRotas] = useState(false);

  const idBase = useId();
  const idLista = `${idBase}-lista`;
  const raiz = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  // Uma requisição em voo por vez. Sem abortar, a resposta de "sau" pode
  // chegar DEPOIS da de "saude" e sobrescrever a lista com o resultado de
  // um prefixo antigo — o bug clássico de autocomplete, invisível em rede
  // rápida e constante em rede lenta.
  const emVoo = useRef<AbortController | null>(null);

  /** Itens navegáveis pelo teclado: sugestões primeiro, perguntas depois. */
  const itens: { chave: string; acao: () => void; rotulo: string }[] = [
    ...sugestoes.map((s) => ({
      chave: `s:${s.href}`,
      rotulo: s.titulo,
      acao: () => {
        window.location.href = s.href;
      },
    })),
    ...perguntas.map((p) => ({
      chave: `p:${p}`,
      rotulo: p,
      acao: () => perguntar(p),
    })),
  ];

  // Fecha ao clicar fora. `mousedown` e não `click`: com `click`, clicar
  // numa sugestão fecharia o painel antes do handler do item rodar.
  useEffect(() => {
    function fora(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  useEffect(() => {
    const q = texto.trim();
    // Sem rotas neste build, digitar não pode produzir sugestão nenhuma —
    // não gasta uma requisição por tecla para descobrir de novo o que já se
    // sabe (e para de encher o console de 404).
    if (semRotas || q.length < MIN_CARACTERES) {
      setSugestoes([]);
      setPerguntas([]);
      if (estado.fase === "sugerindo") setEstado({ fase: "parado" });
      return;
    }
    const timer = setTimeout(async () => {
      emVoo.current?.abort();
      const ctrl = new AbortController();
      emVoo.current = ctrl;
      setEstado({ fase: "sugerindo" });
      try {
        const res = await fetch(`${endpointSugestoes}?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const leitura = await lerJsonDaRota<Resposta>(res);
        if (leitura.tipo === "ausente") {
          // Antes isto caía no `catch` abaixo e sumia em silêncio: a lista
          // ficava vazia, como se nada casasse com o termo. Quem digitasse
          // concluiria que o portal não tem o assunto — quando o que não há
          // é a rota. Silêncio aqui é uma resposta errada, não a ausência
          // de resposta.
          setSemRotas(true);
          setSugestoes([]);
          setPerguntas([]);
          setEstado({ fase: "parado" });
          return;
        }
        setSugestoes(leitura.dados.sugestoes ?? []);
        setPerguntas(leitura.dados.perguntas ?? []);
        setIndice(-1);
        setEstado({ fase: "parado" });
      } catch (e) {
        // Abortar é o caminho normal (a pessoa continuou digitando), não
        // uma falha para mostrar.
        if ((e as Error).name === "AbortError") return;
        setSugestoes([]);
        setEstado({ fase: "parado" });
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `estado` de propósito fora das deps: ele muda DENTRO do efeito e
    // incluí-lo religaria o debounce a cada transição, disparando fetch em
    // loop. `semRotas` ENTRA: ele só vai de false para true uma vez, e a
    // religada serve justamente para o efeito passar a cair no atalho acima.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, endpointSugestoes, semRotas]);

  async function perguntar(pergunta: string) {
    const q = pergunta.trim();
    if (q.length < 3) return;
    setTexto(q);
    setAberto(true);
    // Já se sabe que não há rota: mostra o aviso na hora, sem o "Consultando
    // os dados do portal…" que seria encenação — não há consulta nenhuma.
    if (semRotas) {
      setEstado({ fase: "ausente" });
      return;
    }
    setEstado({ fase: "pensando" });
    try {
      const res = await fetch(endpointChat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pergunta: q }),
      });
      const leitura = await lerRespostaDoAssistente(res);
      if (leitura.tipo === "ausente") {
        setSemRotas(true);
        setEstado({ fase: "ausente" });
        return;
      }
      if (leitura.tipo === "resposta") {
        setEstado({ fase: "resposta", texto: leitura.texto, semIa: leitura.semIa });
        return;
      }
      setEstado({ fase: "erro", texto: leitura.texto });
    } catch {
      // `fetch` rejeitado é falha de rede DE VERDADE (offline, DNS, TLS), e
      // aí "verifique a rede" é o conselho certo. O 404 da cópia estática
      // não chega mais aqui — `lerRespostaDoAssistente` o separa antes.
      setEstado({
        fase: "erro",
        texto: "Falha de conexão. Verifique a rede e tente de novo.",
      });
    }
  }

  function teclado(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (itens.length === 0) return;
      e.preventDefault();
      setAberto(true);
      const passo = e.key === "ArrowDown" ? 1 : -1;
      // Circular, e -1 significa "nenhum selecionado" para Enter cair no
      // assistente com o texto digitado.
      setIndice((i) => {
        const proximo = i + passo;
        if (proximo >= itens.length) return -1;
        if (proximo < -1) return itens.length - 1;
        return proximo;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (indice >= 0 && itens[indice]) itens[indice].acao();
      else perguntar(texto);
      return;
    }
    if (e.key === "Escape") {
      setAberto(false);
      setIndice(-1);
    }
  }

  const mostraPainel =
    aberto &&
    (itens.length > 0 ||
      estado.fase === "pensando" ||
      estado.fase === "resposta" ||
      estado.fase === "erro" ||
      estado.fase === "ausente" ||
      // Com as rotas ausentes não há sugestão nem resposta para mostrar, e
      // os "exemplos" viraram convite para o que não funciona — o painel de
      // campo vazio some junto.
      (!semRotas && texto.trim().length === 0 && exemplos.length > 0));

  return (
    <div ref={raiz} className={`relative ${className}`}>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-2 focus-within:border-[var(--cp-primary)]">
        <span aria-hidden="true" className="opacity-60">
          {/* Lupa em SVG inline: um ícone de biblioteca aqui custaria um
              bundle para um glifo. */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="6.8" cy="6.8" r="4.6" />
            <path d="M10.3 10.3 14 14" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={campo}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAberto(true);
            if (estado.fase === "resposta" || estado.fase === "erro") {
              setEstado({ fase: "parado" });
            }
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={teclado}
          placeholder={placeholder}
          maxLength={500}
          className="min-w-0 flex-1 bg-transparent text-[var(--cp-text)] outline-none"
          role="combobox"
          aria-expanded={mostraPainel}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-activedescendant={indice >= 0 ? `${idBase}-op-${indice}` : undefined}
          // `aria-label` e não placeholder como nome: placeholder some ao
          // digitar e alguns leitores de tela não o anunciam.
          aria-label="Buscar no portal ou perguntar ao assistente"
        />
        {estado.fase === "sugerindo" ? (
          <span className="text-xs opacity-60" aria-hidden="true">
            …
          </span>
        ) : null}
        {texto ? (
          <button
            type="button"
            onClick={() => {
              setTexto("");
              setSugestoes([]);
              setPerguntas([]);
              setEstado({ fase: "parado" });
              campo.current?.focus();
            }}
            className="cursor-pointer rounded px-1 text-sm opacity-60 hover:opacity-100"
            aria-label="Limpar busca"
          >
            ✕
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => perguntar(texto)}
          disabled={texto.trim().length < 3 || estado.fase === "pensando"}
          className="cursor-pointer rounded-lg bg-[var(--cp-primary)] px-3 py-1 text-sm font-medium text-[var(--cp-primary-ink)] disabled:opacity-40"
        >
          Perguntar
        </button>
      </div>

      {mostraPainel ? (
        <div className="cp-painel-entra absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-[var(--cp-border)] bg-[var(--cp-surface)] shadow-lg">
          {estado.fase === "pensando" ? (
            <div className="relative h-0.5 overflow-hidden bg-[var(--cp-surface-2)]">
              <div className="cp-varredura absolute inset-0" />
            </div>
          ) : null}

          <ul
            id={idLista}
            role="listbox"
            aria-label="Sugestões"
            className="max-h-72 overflow-y-auto"
          >
            {sugestoes.map((s, i) => (
              <li
                // Sugestão de "contrato" não tem página por item — todo card
                // aponta pro MESMO `href` (`.../prefeitura/contratos`), então
                // `s.href` sozinho colide. O índice é único mesmo quando o
                // href se repete. Medido: React avisava "dois filhos com a
                // mesma key" ao digitar termo que retorna >1 contrato.
                key={`s:${i}:${s.href}`}
                id={`${idBase}-op-${i}`}
                role="option"
                aria-selected={indice === i}
                className={indice === i ? "bg-[var(--cp-surface-2)]" : ""}
              >
                <a
                  href={s.href}
                  onMouseEnter={() => setIndice(i)}
                  className="flex items-baseline gap-2 px-3 py-2 text-sm no-underline"
                >
                  <span className="shrink-0 rounded border border-[var(--cp-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide opacity-70">
                    {s.tipo}
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">{s.titulo}</span>
                    {s.subtitulo ? (
                      <span className="ml-1 opacity-70">— {s.subtitulo}</span>
                    ) : null}
                  </span>
                </a>
              </li>
            ))}

            {perguntas.map((p, k) => {
              const i = sugestoes.length + k;
              return (
                <li
                  key={`p:${p}`}
                  id={`${idBase}-op-${i}`}
                  role="option"
                  aria-selected={indice === i}
                  className={indice === i ? "bg-[var(--cp-surface-2)]" : ""}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setIndice(i)}
                    onClick={() => perguntar(p)}
                    className="flex w-full cursor-pointer items-baseline gap-2 px-3 py-2 text-left text-sm"
                  >
                    <span className="shrink-0 rounded border border-[var(--cp-border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide opacity-70">
                      perguntar
                    </span>
                    <span>{p}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {!semRotas && texto.trim().length === 0 && exemplos.length > 0 ? (
            <div className="border-t border-[var(--cp-border)] p-3">
              <p className="text-xs uppercase tracking-wide opacity-60">Experimente</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {exemplos.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => perguntar(ex)}
                    className="cursor-pointer rounded-full border border-[var(--cp-border)] px-3 py-1 text-sm hover:border-[var(--cp-primary)]"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {estado.fase === "pensando" ? (
            <div
              className="flex items-center gap-2 border-t border-[var(--cp-border)] p-3 text-sm opacity-80"
              role="status"
              aria-live="polite"
            >
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
              Consultando os dados do portal…
            </div>
          ) : null}

          {estado.fase === "resposta" ? (
            <div
              className="border-t border-[var(--cp-border)] p-3 text-sm"
              role="status"
              aria-live="polite"
            >
              <p className="whitespace-pre-wrap">{estado.texto}</p>
              {aviso ? <p className="mt-2 text-xs opacity-65">{aviso}</p> : null}
            </div>
          ) : null}

          {estado.fase === "erro" ? (
            <div
              className="cp-tremor border-t border-[var(--cp-alert)] p-3 text-sm"
              role="alert"
            >
              <p className="font-medium text-[var(--cp-alert)]">{estado.texto}</p>
              <button
                type="button"
                onClick={() => perguntar(texto)}
                className="mt-2 cursor-pointer rounded-md border border-[var(--cp-border)] px-3 py-1 text-sm hover:border-[var(--cp-primary)]"
              >
                Tentar de novo
              </button>
            </div>
          ) : null}

          {/* Sem `cp-tremor` e sem `role="alert"`: o tremor e a interrupção do
              leitor de tela anunciam "algo deu errado agora", e aqui nada deu
              errado agora — esta cópia do portal nunca teve essas rotas. E sem
              "Tentar de novo", que é o botão que não pode funcionar. */}
          {estado.fase === "ausente" ? (
            <div
              className="border-t border-[var(--cp-border)] p-3 text-sm"
              role="status"
              aria-live="polite"
            >
              <p className="font-medium">{TITULO_SEM_ASSISTENTE}</p>
              <p className="mt-1 opacity-75">{TEXTO_SEM_ASSISTENTE}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {DESTINOS_SEM_ASSISTENTE.map((d) => (
                  // Caminho de raiz e `<a>` cru: `/busca` e `/assistente` são
                  // as duas páginas que existem FORA das zonas, e este
                  // componente roda dentro das três — mesma regra dos `href`
                  // de sugestão logo acima.
                  <a
                    key={d.href}
                    href={d.href}
                    title={d.descricao}
                    className="rounded-full border border-[var(--cp-border)] px-3 py-1 text-sm no-underline hover:border-[var(--cp-primary)]"
                  >
                    {d.rotulo}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
