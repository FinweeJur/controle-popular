/**
 * O segundo passo do assistente, e o único que é caro: procurar DOCUMENTO
 * no índice estático da `/busca`, sob demanda e interrompível.
 *
 * ═══ POR QUE ISTO É UM PASSO SEPARADO, E OPCIONAL ═══
 *
 * `navegacao.ts` responde "para onde ir" em **0,35 ms medidos** (média de
 * 5.000 chamadas por frase, node 20, esta máquina) a partir de um catálogo
 * que já está no chunk. Não há o que interromper ali: a resposta existe
 * antes de o dedo sair da tecla.
 *
 * Procurar documento é o oposto. O índice da `/busca` foi medido contra o
 * Postgres local (commit `1ce7f77`): **docs 3.614 KB + vocabulário 1.188 KB
 * + formas 264 KB ≈ 5,0 MB não comprimidos**, em 4 fatias, e o vocabulário
 * cresceu depois (11.561 → 31.375 lexemas, commit `b086743`). Isso é uma
 * espera real numa conexão ruim — e é por isso que o botão de interromper
 * do N8 tem de interromper de verdade, não esconder a resposta: quem está
 * num 3G de periferia precisa poder abortar 5 MB, não fingir que abortou.
 *
 * Daí as duas decisões desta camada:
 *
 * 1. **Nunca carrega sozinho.** Só quando a pessoa pede. Baixar 5 MB para
 *    descobrir que "saúde em BH" é `/bh/saude` seria pagar o acervo inteiro
 *    por uma tabela de rotas.
 * 2. **Carrega uma vez por sessão.** O índice fica em memória no módulo; o
 *    segundo pedido não paga nada.
 *
 * ═══ POR QUE UM CARREGADOR PRÓPRIO, E NÃO `carregarIndiceBusca` ═══
 *
 * `lib/busca/carregarIndice.ts` faz exatamente este trabalho, e melhor —
 * mas o `fetch()` dele não recebe `AbortSignal`. Envolver aquela promessa
 * numa corrida com o sinal faria o botão PARECER que interrompeu enquanto
 * as fatias continuariam chegando: o modo de falha exato que o N8 proíbe
 * por escrito. Aquele arquivo é território do worktree `cp-busca`
 * (`docs/worktrees.md`), então acrescentar o parâmetro lá não é uma opção
 * desta frente.
 *
 * O que NÃO é reimplementado aqui: o formato do manifesto (`ManifestoFatias`),
 * o nome do arquivo (`NOME_MANIFESTO`), a remontagem dos três grupos
 * (`montarIndiceDeGrupos`) e a busca em si (`buscar`) vêm todos importados.
 * O que este arquivo acrescenta são as ~30 linhas do laço com sinal.
 */

import { NOME_MANIFESTO } from "@/lib/estatico/emitir";
import type { ManifestoFatias } from "@/lib/estatico/fatiar";
import { montarIndiceDeGrupos } from "@/lib/busca/carregarIndice";
import { buscar, type DocumentoIndexado, type IndiceBusca, type Resultado } from "@/lib/busca/indice";

/** Onde `scripts/gerar-indice-busca.mts` grava os três grupos fatiados. */
export const BASE_INDICE = "/busca-indice";

/** Progresso somado dos três grupos, para a barra não travar sem explicação. */
export interface Progresso {
  bytesCarregados: number;
  bytesTotais: number;
}

/**
 * Erro de índice ausente — distinto de erro de rede.
 *
 * A distinção não é preciosismo: `public/busca-indice/**` é ARTEFATO DE
 * BUILD e fica fora do git (ver o cabeçalho de
 * `scripts/gerar-indice-busca.mts`). Num `next dev` sem Postgres — que é o
 * estado normal de qualquer worktree desta máquina — o manifesto responde
 * 404, e isso não é falha: é "esta cópia do site não publicou o índice".
 * Dizer "erro de conexão" ali mandaria alguém depurar a rede por meia hora.
 */
export class IndiceIndisponivel extends Error {
  constructor(readonly status: number) {
    super(
      status === 404
        ? "O índice de documentos não foi publicado nesta cópia do portal. A navegação por páginas continua funcionando."
        : `O índice de documentos respondeu HTTP ${status}.`
    );
    this.name = "IndiceIndisponivel";
  }
}

async function buscarJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const r = await fetch(url, { signal });
  if (!r.ok) throw new IndiceIndisponivel(r.status);
  return (await r.json()) as T;
}

/**
 * Carrega um grupo fatiado com o sinal em TODA requisição.
 *
 * O `signal` vai no manifesto e em cada fatia, não só na primeira: abortar
 * entre a fatia 1 e a 2 tem de parar a 2. Um sinal só na abertura deixaria
 * o resto do download correndo depois do clique em "interromper".
 */
async function carregarGrupo<T>(
  base: string,
  signal: AbortSignal,
  onFatia: (bytes: number, totais: number) => void
): Promise<T[]> {
  const manifesto = await buscarJson<ManifestoFatias>(`${base}/${NOME_MANIFESTO}`, signal);
  const bytesTotais = manifesto.bytesPorFatia.reduce((a, b) => a + b, 0);
  const linhas: T[] = [];
  let carregados = 0;
  for (let i = 0; i < manifesto.fatias; i++) {
    const fatia = await buscarJson<T[]>(`${base}/${i}.json`, signal);
    linhas.push(...fatia);
    carregados += manifesto.bytesPorFatia[i] ?? 0;
    onFatia(carregados, bytesTotais);
  }
  return linhas;
}

/**
 * O índice já carregado nesta sessão.
 *
 * Módulo, não `useState`: desmontar e remontar o componente (trocar de aba,
 * voltar no menu) não pode custar 5 MB de novo. `null` significa "ainda não
 * carregou", e um abort NÃO grava nada aqui — índice pela metade não serve
 * para busca nenhuma (um termo pode estar só na última fatia do
 * vocabulário, como o cabeçalho de `lib/busca/carregarIndice.ts` registra).
 */
let indiceEmMemoria: IndiceBusca | null = null;

/** `true` se o próximo `procurarDocumentos` responde sem tocar na rede. */
export function indiceJaCarregado(): boolean {
  return indiceEmMemoria !== null;
}

/**
 * Carrega o índice inteiro (os três grupos em paralelo), respeitando o
 * sinal. Relança `AbortError` para quem chamou distinguir "a pessoa
 * interrompeu" de "deu erro" — são estados diferentes na tela, e mostrar
 * "erro" para quem clicou em interromper seria culpar a pessoa pelo que ela
 * pediu.
 */
export async function carregarIndice(
  signal: AbortSignal,
  onProgresso?: (p: Progresso) => void
): Promise<IndiceBusca> {
  if (indiceEmMemoria) return indiceEmMemoria;

  const porGrupo = new Map<string, Progresso>();
  const relatar = (nome: string) => (bytesCarregados: number, bytesTotais: number) => {
    porGrupo.set(nome, { bytesCarregados, bytesTotais });
    if (!onProgresso) return;
    let c = 0;
    let t = 0;
    for (const p of porGrupo.values()) {
      c += p.bytesCarregados;
      t += p.bytesTotais;
    }
    onProgresso({ bytesCarregados: c, bytesTotais: t });
  };

  const [docs, vocabulario, formas] = await Promise.all([
    carregarGrupo<DocumentoIndexado>(`${BASE_INDICE}/docs`, signal, relatar("docs")),
    carregarGrupo<[string, number[]]>(`${BASE_INDICE}/vocabulario`, signal, relatar("vocabulario")),
    carregarGrupo<[string, number]>(`${BASE_INDICE}/formas`, signal, relatar("formas")),
  ]);

  indiceEmMemoria = montarIndiceDeGrupos(docs, vocabulario, formas);
  return indiceEmMemoria;
}

/**
 * Procura documentos, carregando o índice se ainda não estiver em memória.
 *
 * `limite` baixo de propósito: isto vira botão na resposta, ao lado dos
 * destinos de navegação, e o N8 pede opção para escolher — não uma segunda
 * página de resultados dentro do assistente. Quem quer a lista inteira tem
 * a `/busca`, e o componente oferece esse link.
 */
export async function procurarDocumentos(
  consulta: string,
  signal: AbortSignal,
  onProgresso?: (p: Progresso) => void,
  limite = 5
): Promise<Resultado[]> {
  const indice = await carregarIndice(signal, onProgresso);
  if (signal.aborted) throw new DOMException("Interrompido", "AbortError");
  return buscar(consulta, indice, { limite });
}

/** Só para teste: esquece o índice em memória entre casos. */
export function esquecerIndice(): void {
  indiceEmMemoria = null;
}
