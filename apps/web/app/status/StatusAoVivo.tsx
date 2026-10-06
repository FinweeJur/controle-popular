"use client";

/**
 * Checagem AO VIVO do portal para a página /status.
 *
 * O QUE É: componente de cliente que, no navegador de quem abriu a página,
 * faz uma requisição curta a dois endereços oficiais e mostra "No ar" ou
 * "Fora do ar", com a latência. Roda de novo sozinho a cada 60 s e no botão
 * "Verificar de novo".
 *
 * POR QUE RODA NO NAVEGADOR (e não no servidor): o valor desta página é
 * continuar respondendo QUANDO O PORTAL ESTÁ FORA. Se ela dependesse de um
 * servidor para medir, o servidor cairia junto. Assim, a cópia publicada no
 * GitHub Pages (outro provedor) mede o portal de fora para dentro.
 *
 * AS DUAS TENTATIVAS DE CADA CHECAGEM — e por que as duas:
 * 1. Requisição normal: funciona quando a página roda no MESMO domínio do
 *    alvo (a cópia servida pelo próprio portal). Aí o navegador deixa LER o
 *    corpo, e o /api/saude confirma a hora da aplicação.
 * 2. Requisição opaca (`mode: "no-cors"`): o navegador bloqueia a LEITURA por
 *    CORS — caso da cópia no GitHub Pages, domínio diferente —, mas ainda
 *    deixa saber que a RESPOSTA CHEGOU. Chegar já prova que o host responde.
 *    Por isso o rótulo honesto "alcançável; não deu para ler o corpo".
 *
 * O QUE ESTA PÁGINA MEDE (05/10/2026): os TRÊS servidores do portal, cada um
 * com as páginas e o /api/saude:
 * - Guara Cloud (site oficial, www.controlepopular.com.br);
 * - home-pc (servidor 2, túnel em backup.controlepopular.com.br);
 * - Azure (espelho, www.controlepopular.tech).
 *
 * O QUE AINDA NÃO MEDE (lacuna declarada, não escondida): o banco de dados
 * por trás do portal — o /api/saude é leve de propósito. Se um dia precisar,
 * é rota separada; não inventar "ok" sem medir.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Rótulo de estado. "no-ar" cobre tanto resposta legível quanto opaca. */
type Estado = "verificando" | "no-ar" | "fora";

interface Alvo {
  id: string;
  nome: string;
  descricao: string;
  url: string;
}

interface Resultado {
  estado: Estado;
  ms: number | null;
  detalhe: string;
}

/**
 * Endereços oficiais vigiados. São ABSOLUTOS de propósito: a cópia no GitHub
 * Pages está em outro domínio e precisa saber onde fica o portal de verdade.
 * Cada servidor entra com DOIS alvos: as páginas e o /api/saude.
 */
const ALVOS: Alvo[] = [
  // Servidor 1 — Guara Cloud (site oficial).
  {
    id: "guara-paginas",
    nome: "Guara — páginas",
    descricao: "A home do site oficial, www.controlepopular.com.br.",
    url: "https://www.controlepopular.com.br/",
  },
  {
    id: "guara-saude",
    nome: "Guara — aplicação",
    descricao: "O /api/saude confirma que o servidor do site oficial está de pé.",
    url: "https://www.controlepopular.com.br/api/saude",
  },
  // Servidor 2 — home-pc (túnel fixo em backup.controlepopular.com.br).
  {
    id: "homepc-paginas",
    nome: "Casa (home-pc) — páginas",
    descricao: "O servidor 2, no PC de casa, exposto pelo túnel backup.controlepopular.com.br.",
    url: "https://backup.controlepopular.com.br/",
  },
  {
    id: "homepc-saude",
    nome: "Casa (home-pc) — aplicação",
    descricao: "O /api/saude confirma que o servidor 2 (home-pc) está de pé.",
    url: "https://backup.controlepopular.com.br/api/saude",
  },
  // Servidor 3 — espelho no Azure Container Apps.
  {
    id: "azure-paginas",
    nome: "Azure (espelho) — páginas",
    descricao: "O espelho no Azure Container Apps, www.controlepopular.tech.",
    url: "https://www.controlepopular.tech/",
  },
  {
    id: "azure-saude",
    nome: "Azure (espelho) — aplicação",
    descricao: "O /api/saude confirma que o espelho no Azure (.tech) está de pé.",
    url: "https://www.controlepopular.tech/api/saude",
  },
];

/**
 * Acima disso a checagem é dada como sem resposta (evita travar a tela).
 * 20 s e não 8: o espelho no Azure (`.tech`) escala a zero, e o cold start
 * passa de 8 s — com o teto antigo ele aparecia "Fora do ar" enquanto dormia,
 * que é alarme falso. As checagens correm em paralelo, então o teto é por
 * alvo, não somado.
 */
const TIMEOUT_MS = 20000;

const ROTULO: Record<Estado, string> = {
  verificando: "Verificando…",
  "no-ar": "No ar",
  fora: "Fora do ar",
};

/** Cor é apoio visual; o texto e o glifo é que carregam o significado. */
const COR: Record<Estado, string> = {
  verificando: "var(--cp-tertiary)",
  "no-ar": "var(--cp-accent)",
  fora: "var(--cp-alert)",
};

const GLIFO: Record<Estado, string> = {
  verificando: "…",
  "no-ar": "✓",
  fora: "✕",
};

/** Aborta a requisição depois de `ms`; `cancelar` limpa o temporizador. */
function comTimeout(ms: number): { signal: AbortSignal; cancelar: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancelar: () => clearTimeout(id) };
}

/** Mede um alvo. Ver o cabeçalho do arquivo para o sentido das duas tentativas. */
async function verificar(alvo: Alvo): Promise<Resultado> {
  const inicio = performance.now();

  {
    const { signal, cancelar } = comTimeout(TIMEOUT_MS);
    try {
      const resp = await fetch(alvo.url, { cache: "no-store", signal });
      const ms = Math.round(performance.now() - inicio);
      let detalhe = `respondeu HTTP ${resp.status}`;
      if (alvo.id.endsWith("saude")) {
        try {
          const corpo = (await resp.json()) as { t?: string };
          if (corpo?.t) {
            detalhe = `aplicação confirmou às ${new Date(corpo.t).toLocaleTimeString("pt-BR")}`;
          }
        } catch {
          // Não era JSON legível — mantém "respondeu HTTP ...".
        }
      }
      return { estado: resp.ok ? "no-ar" : "fora", ms, detalhe };
    } catch {
      // CORS ou rede: cai para a tentativa opaca abaixo.
    } finally {
      cancelar();
    }
  }

  {
    const { signal, cancelar } = comTimeout(TIMEOUT_MS);
    try {
      await fetch(alvo.url, { mode: "no-cors", cache: "no-store", signal });
      const ms = Math.round(performance.now() - inicio);
      return {
        estado: "no-ar",
        ms,
        detalhe: "alcançável; o navegador não deixou ler o corpo (CORS)",
      };
    } catch {
      return { estado: "fora", ms: null, detalhe: "sem resposta em até 20 s" };
    } finally {
      cancelar();
    }
  }
}

/** Resultado inicial: tudo "verificando", para a tela nunca começar vazia. */
function resultadoInicial(): Record<string, Resultado> {
  return Object.fromEntries(
    ALVOS.map((a) => [a.id, { estado: "verificando", ms: null, detalhe: "" } as Resultado]),
  );
}

export default function StatusAoVivo() {
  const [resultados, setResultados] = useState<Record<string, Resultado>>(resultadoInicial);
  const [verificadoEm, setVerificadoEm] = useState<Date | null>(null);
  // Guarda contra rodadas sobrepostas (clique + temporizador ao mesmo tempo).
  const emAndamento = useRef(false);

  const rodar = useCallback(async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setResultados(resultadoInicial());
    const pares = await Promise.all(
      ALVOS.map(async (a) => [a.id, await verificar(a)] as const),
    );
    setResultados(Object.fromEntries(pares));
    setVerificadoEm(new Date());
    emAndamento.current = false;
  }, []);

  useEffect(() => {
    void rodar();
    const id = setInterval(() => void rodar(), 60000);
    return () => clearInterval(id);
  }, [rodar]);

  return (
    <section aria-labelledby="status-titulo" className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="status-titulo" className="font-display text-lg font-semibold">
          Verificação ao vivo
        </h2>
        <button
          type="button"
          onClick={() => void rodar()}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cp-primary)]"
        >
          Verificar de novo
        </button>
      </div>

      <ul className="mt-4 space-y-3" aria-live="polite">
        {ALVOS.map((alvo) => {
          const r = resultados[alvo.id];
          return (
            <li
              key={alvo.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold"
                style={{
                  color: COR[r.estado],
                  backgroundColor: `color-mix(in srgb, ${COR[r.estado]} 15%, transparent)`,
                }}
              >
                {GLIFO[r.estado]}
              </span>
              <div className="min-w-0">
                <p className="font-medium">
                  {alvo.nome} — {ROTULO[r.estado]}
                  {r.ms !== null ? ` (${r.ms} ms)` : ""}
                </p>
                <p className="text-sm text-text-soft">{alvo.descricao}</p>
                {r.detalhe ? (
                  <p className="mt-1 text-sm text-text-soft">{r.detalhe}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-sm text-text-soft" role="status">
        {verificadoEm
          ? `Última verificação: ${verificadoEm.toLocaleTimeString("pt-BR")}. `
          : "Verificando… "}
        A checagem roda no seu navegador a cada 60 s; nada é gravado.
      </p>
    </section>
  );
}
