/**
 * Detecção, NO CLIENTE, de rota de API que não existe neste build.
 *
 * ═══ O DEFEITO QUE ISTO CONSERTA ═══
 *
 * As rotas que dependem da Request moram em arquivos `*.din.ts`, e o
 * `next.config.ts` só inclui essa extensão em `pageExtensions` no alvo
 * Cloudflare. No alvo GitHub Pages (`output: 'export'`, quando
 * `PAGES_BASE_PATH` está definido) a lista é `["tsx", "ts"]` — então
 * `app/[municipio]/api/chat/route.din.ts`, as irmãs de /congresso e
 * /judiciario, e as três `api/busca` não são geradas. Isso NÃO é bug: é a
 * decisão documentada no próprio `next.config.ts` ("a ausência fica
 * declarada num lugar só").
 *
 * O bug era o que o visitante via. `fetch()` numa rota que não existe recebe
 * o 404 do host, que é uma página HTML; `res.json()` engasga com o HTML e cai
 * no `catch`, cujo texto era "Falha de conexão. Tente de novo." — mandando a
 * pessoa depurar a própria rede por causa de uma função que aquela cópia do
 * site nunca teve. E "tente de novo" ali não vai funcionar nunca: não há o
 * que tentar.
 *
 * ═══ POR QUE PELA RESPOSTA HTTP, E NÃO PELO `exportandoEstatico` ═══
 *
 * `lib/alvo-de-build.ts` já sabe o alvo, mas é constante de SERVIDOR, lida de
 * `process.env` no momento do build. Componente `"use client"` não a enxerga
 * sem alguém passar prop desde um componente de servidor — e `BuscaUniversal`
 * é montado em quatro lugares (`app/[municipio]/components/Header.tsx` e os
 * layouts de /congresso e /judiciario), dos quais `congresso/layout.tsx` já
 * colidiu entre worktrees paralelos três vezes. A resposta HTTP conta a mesma
 * verdade sem tocar em nenhum deles.
 *
 * E conta um pouco mais: cobre também a rota que suma por OUTRO motivo (erro
 * de deploy, asset podado, rota renomeada) no alvo Cloudflare, onde a flag de
 * build diria "existe" e a rota não estaria lá. A flag descreve a intenção do
 * build; a resposta descreve o site que a pessoa está usando agora.
 *
 * Onde a flag continua sendo o instrumento certo é no SERVIDOR, antes de
 * desenhar a tela — ver `app/[municipio]/assistente/page.tsx`, que no alvo
 * estático nem chega a montar o chat.
 */

/** Rota respondeu com JSON, ou não existe neste build. */
export type LeituraDeRota<T> = { tipo: "ok"; dados: T } | { tipo: "ausente" };

/**
 * Lê o JSON de uma rota do portal distinguindo "não existe aqui" de
 * "existe e respondeu".
 *
 * NÃO cobre o `fetch()` que REJEITA — esse é o caso de falha de rede de
 * verdade (offline, DNS, TLS), e quem chama precisa mantê-lo separado, com a
 * mensagem de rede que ele sempre teve. A diferença entre os dois é
 * exatamente o que o visitante precisa saber: um pede para tentar de novo, o
 * outro pede para desistir e ir a outro lugar.
 */
export async function lerJsonDaRota<T>(res: Response): Promise<LeituraDeRota<T>> {
  // 404 é o caso do GitHub Pages: caminho que não foi emitido no export.
  // 405 cobre o host estático que reconhece o caminho mas recusa o POST —
  // para o visitante dá no mesmo, a função não está publicada ali.
  if (res.status === 404 || res.status === 405) return { tipo: "ausente" };

  try {
    return { tipo: "ok", dados: (await res.json()) as T };
  } catch {
    // Corpo que não é JSON. TODA resposta das rotas deste portal sai de
    // `NextResponse.json`, inclusive as de erro — 400, 429 e 502 em
    // `lib/chat-comum.ts` — então corpo não-JSON não veio de rota nossa:
    // veio da página de erro do host, em HTML.
    return { tipo: "ausente" };
  }
}

/** Forma do corpo das três rotas de chat (ver `lib/chat-comum.ts`). */
export interface CorpoDoAssistente {
  resposta?: string;
  erro?: string;
  /** Rota respondeu sem LLM, só com o dado do banco. Não é falha. */
  semIa?: boolean;
}

export type LeituraDoAssistente =
  | { tipo: "resposta"; texto: string; semIa?: boolean }
  | { tipo: "ausente" }
  | { tipo: "erro"; texto: string };

/**
 * Interpreta a resposta de `api/chat` nas três zonas.
 *
 * O `erro` de uma rota que EXISTE continua chegando inteiro ao visitante:
 * "Muitas perguntas em pouco tempo" (429) e "O assistente está indisponível
 * no momento" (502) são estados reais e temporários, onde tentar de novo é o
 * conselho certo. Só o `ausente` é permanente naquela cópia do site.
 */
export async function lerRespostaDoAssistente(
  res: Response
): Promise<LeituraDoAssistente> {
  const leitura = await lerJsonDaRota<CorpoDoAssistente>(res);
  if (leitura.tipo === "ausente") return { tipo: "ausente" };

  const { resposta, erro, semIa } = leitura.dados ?? {};
  if (resposta) return { tipo: "resposta", texto: resposta, semIa };
  if (erro) return { tipo: "erro", texto: erro };
  return { tipo: "erro", texto: "Não consegui responder agora." };
}

/**
 * Para onde mandar quem caiu na cópia sem assistente.
 *
 * Os dois destinos foram escolhidos por uma razão só: eles FUNCIONAM no alvo
 * estático, e isso é verificável no código, não uma esperança.
 *
 * - `/busca` é `dynamic = "force-static"` e busca no NAVEGADOR, sobre o
 *   índice fatiado que `scripts/gerar-indice-busca.mts` gera no prebuild.
 * - `/assistente` é o assistente de NAVEGAÇÃO: catálogo importado pelo
 *   bundle, sem consulta a banco e sem modelo de linguagem. O cabeçalho de
 *   `app/assistente/page.tsx` registra que ele é estático nos dois alvos.
 *
 * Mandar para uma terceira página "que costuma ter isso" seria repetir em
 * outra forma o defeito que este arquivo conserta.
 *
 * CAMINHO ABSOLUTO DE RAIZ, e é intencional: as duas páginas ficam FORA das
 * zonas (`/[municipio]`, `/congresso`, `/judiciario`). Prefixar com a cidade
 * atual — o reflexo natural dentro de `AssistenteChat`, que tem o
 * `caminho()` da cidade à mão — produziria `/betim/busca`, que não existe.
 */
export const DESTINOS_SEM_ASSISTENTE = [
  {
    href: "/busca",
    rotulo: "Busca do portal",
    descricao: "Leis, proposições e tribunais por tema, palavra e cidade.",
  },
  {
    href: "/assistente",
    rotulo: "Assistente de navegação",
    descricao: "Diga o assunto e ele leva à página certa. Sem IA, sem rede.",
  },
] as const;

/** Título do aviso. Curto porque vai em painel estreito também. */
export const TITULO_SEM_ASSISTENTE =
  "O assistente por IA não está publicado nesta cópia do portal.";

/**
 * Diz o MOTIVO, não só o sintoma. A pessoa que lê isso precisa saber que não
 * é a rede dela e que voltar mais tarde não resolve — esta cópia do site é
 * estática, e assistente por IA precisa de servidor.
 */
export const TEXTO_SEM_ASSISTENTE =
  "Esta versão do site é publicada como páginas estáticas, sem servidor para " +
  "responder perguntas. Não é falha da sua conexão. Estas duas funcionam aqui:";
