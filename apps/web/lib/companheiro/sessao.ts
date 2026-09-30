/**
 * Sessão pareada do companheiro Seu Nonô — estado em memória.
 *
 * PAPEL NO PROJETO
 * ----------------
 * O widget do site cria uma sessão curta e mostra um código. O companheiro de
 * desktop (bichinho-preguiça) entra UMA vez com esse código (pareamento), e a
 * partir daí os dois passam a receber o mesmo turno: o chat do site abre o
 * link e o companheiro recebe os "galhos". O transporte é
 * `POST criar -> POST parear -> GET eventos (SSE) -> POST perguntar`.
 *
 * FONTE / REGRA DE NEGÓCIO
 * ------------------------
 * Desenho travado no `docs/planos/PLANO-COMPANHEIRO-SEU-NONO.md`. Uma pergunta
 * gera UM turno, resolvido por `responderComoCompanheiro` (a MESMA regra do
 * site) — este módulo só guarda a sessão e distribui o evento, nunca responde.
 *
 * DECISÃO TÉCNICA
 * ---------------
 * `Map` em memória por processo. Correto aqui porque o portal roda em UMA
 * instância (Guara) e o RAG do assistente já é em memória. O código é o gesto
 * humano de pareamento; o `id` (aleatório) é a credencial das rotas seguintes.
 * O estado é de vida curta: a sessão expira sozinha e a limpeza é preguiçosa.
 *
 * Sem dado pessoal: a sessão guarda só id, código e horários.
 */

/** Eventos que a sessão publica para quem estiver inscrito no SSE. */
export type TipoEventoSessao = "aberta" | "pareada" | "turno" | "fechada";

export interface EventoSessao {
  tipo: TipoEventoSessao;
  /** Epoch ms em que o evento foi publicado — a UI e o log datam por aqui. */
  em: number;
  /** Carga do evento. No `turno` é a `RespostaCompanheiro` completa. */
  dados?: unknown;
}

export interface SessaoCompanheiro {
  id: string;
  /** Código humano mostrado no site, no formato `ABC-123`. */
  codigo: string;
  criadaEm: number;
  expiraEm: number;
  pareada: boolean;
  pareadaEm?: number;
}

/** O que a rota de criação devolve ao widget. */
export interface ResumoSessao {
  id: string;
  codigo: string;
  expiraEm: number;
}

/** Vida da sessão: curta de propósito (pareamento + um turno). */
export const TTL_SESSAO_MS = 5 * 60 * 1000;
/** Teto de sessões vivas ao mesmo tempo, para o `Map` não crescer sem fim. */
export const MAX_SESSOES = 500;
/**
 * Alfabeto do código sem caracteres ambíguos (sem I, O, 0 e 1): quem lê e
 * digita o código à mão não troca letra por número.
 */
const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

type Ouvinte = (evento: EventoSessao) => void;

const sessoes = new Map<string, SessaoCompanheiro>();
const idPorCodigo = new Map<string, string>();
const ouvintes = new Map<string, Set<Ouvinte>>();

/** Normaliza o código para busca: maiúsculas, sem espaços nem separadores. */
export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function momento(agora?: number): number {
  return agora ?? Date.now();
}

/** Sorteia um código `ABC-123` do alfabeto sem ambíguos. */
export function gerarCodigo(aleatorio: () => number = Math.random): string {
  const bloco = () =>
    Array.from(
      { length: 3 },
      () => ALFABETO_CODIGO[Math.floor(aleatorio() * ALFABETO_CODIGO.length)]
    ).join("");
  return `${bloco()}-${bloco()}`;
}

/** Id opaco não adivinhável — a credencial das rotas seguintes. */
function gerarId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function remover(id: string): void {
  const sessao = sessoes.get(id);
  if (sessao) idPorCodigo.delete(normalizarCodigo(sessao.codigo));
  sessoes.delete(id);
  ouvintes.delete(id);
}

function limparExpiradas(agora: number): void {
  for (const [id, sessao] of sessoes) {
    if (agora > sessao.expiraEm) remover(id);
  }
}

function expulsarMaisAntiga(): void {
  let maisAntiga: SessaoCompanheiro | null = null;
  for (const sessao of sessoes.values()) {
    if (!maisAntiga || sessao.criadaEm < maisAntiga.criadaEm) maisAntiga = sessao;
  }
  if (maisAntiga) remover(maisAntiga.id);
}

/**
 * Cria uma sessão nova. `id`/`codigo` são injetáveis para o teste ser
 * determinístico; em produção saem de `crypto` e do sorteio do alfabeto.
 */
export function criarSessao(opcoes: {
  agora?: number;
  id?: string;
  codigo?: string;
} = {}): ResumoSessao {
  const em = momento(opcoes.agora);
  limparExpiradas(em);
  if (sessoes.size >= MAX_SESSOES) expulsarMaisAntiga();

  let codigo = opcoes.codigo ?? gerarCodigo();
  while (idPorCodigo.has(normalizarCodigo(codigo))) codigo = gerarCodigo();

  const id = opcoes.id ?? gerarId();
  const sessao: SessaoCompanheiro = {
    id,
    codigo,
    criadaEm: em,
    expiraEm: em + TTL_SESSAO_MS,
    pareada: false,
  };
  sessoes.set(id, sessao);
  idPorCodigo.set(normalizarCodigo(codigo), id);
  return { id, codigo, expiraEm: sessao.expiraEm };
}

/** Devolve uma cópia da sessão, ou `null` se não existe/expirou. */
export function obterSessao(id: string, agora = Date.now()): SessaoCompanheiro | null {
  const sessao = sessoes.get(id);
  if (!sessao) return null;
  if (agora > sessao.expiraEm) {
    remover(id);
    return null;
  }
  return { ...sessao };
}

/**
 * Pareia a sessão pelo código. Recusa a segunda entrada (o companheiro entra
 * uma vez) e publica o evento `pareada` para o widget.
 */
export function parearSessao(codigo: string, agora = Date.now()): SessaoCompanheiro | null {
  limparExpiradas(agora);
  const id = idPorCodigo.get(normalizarCodigo(codigo));
  if (!id) return null;
  const sessao = sessoes.get(id);
  if (!sessao || sessao.pareada) return null;
  sessao.pareada = true;
  sessao.pareadaEm = agora;
  publicarEvento(id, { tipo: "pareada", em: agora });
  return { ...sessao };
}

/**
 * Inscreve um ouvinte no SSE da sessão. Devolve a função de cancelamento, ou
 * `null` se a sessão não existe mais (a rota responde 404 nesse caso).
 */
export function inscreverSessao(
  id: string,
  ouvinte: Ouvinte,
  agora = Date.now()
): (() => void) | null {
  if (!obterSessao(id, agora)) return null;
  let conjunto = ouvintes.get(id);
  if (!conjunto) {
    conjunto = new Set();
    ouvintes.set(id, conjunto);
  }
  conjunto.add(ouvinte);
  const alvo = conjunto;
  return () => {
    alvo.delete(ouvinte);
    if (alvo.size === 0) ouvintes.delete(id);
  };
}

/**
 * Publica um evento para todos os ouvintes da sessão. Um ouvinte que lança não
 * derruba os demais — a falha de um stream não pode calar o outro.
 */
export function publicarEvento(id: string, evento: EventoSessao, agora = Date.now()): void {
  if (!obterSessao(id, agora)) return;
  const conjunto = ouvintes.get(id);
  if (!conjunto) return;
  for (const ouvinte of [...conjunto]) {
    try {
      ouvinte(evento);
    } catch {
      // Ouvinte morto: segue para os outros. O stream fecha pelo seu próprio cancel.
    }
  }
}

/** Anuncia `fechada` e descarta a sessão. */
export function fecharSessao(id: string, agora = Date.now()): void {
  publicarEvento(id, { tipo: "fechada", em: agora }, agora);
  remover(id);
}

/** Quantas sessões vivas existem agora — usado em teste e diagnóstico. */
export function contarSessoes(): number {
  return sessoes.size;
}

/** Esquece todo o estado entre casos de teste (mesmo padrão de `rag.ts`). */
export function _resetarSessoes(): void {
  sessoes.clear();
  idPorCodigo.clear();
  ouvintes.clear();
}
