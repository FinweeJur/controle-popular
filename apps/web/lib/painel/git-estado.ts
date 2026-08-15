import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * O que o painel precisa saber do git antes de deixar alguém editar.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * `docs/PLANO-PAINEL-EDICAO.md`, seção "Duas máquinas, um painel": o histórico
 * já registrou **duas colisões entre sessões em 12/08** — trabalho de uma
 * máquina sobrescrito pela outra. O mecanismo é o mesmo risco de dois editores
 * humanos ao mesmo tempo, e a causa-raiz é a mesma: nenhuma das duas sabia que
 * a outra tinha escrito antes de escrever por cima.
 *
 * A regra do plano, literal: **antes de aceitar uma edição nova, faz
 * `git fetch` e recusa se `origin/main` andou desde o último `pull` local.**
 * Não em silêncio — avisa e obriga a atualizar. É lock otimista de wiki, sem
 * serviço de coordenação novo.
 *
 * ═══ POR QUE `execFileSync` E NÃO `exec` ═══
 *
 * `exec` passa a linha por um shell, e qualquer valor que venha da tela viraria
 * comando. Aqui nenhum argumento vem do usuário, mas a forma segura é a que
 * continua segura quando alguém acrescentar um argumento amanhã.
 */

/** Raiz do repositório: `apps/web` -> `..` -> `..`. */
const RAIZ = path.resolve(process.cwd(), "..", "..");

function git(...args: string[]): string {
  return execFileSync("git", args, {
    cwd: RAIZ,
    encoding: "utf-8",
    timeout: 30_000,
  }).trim();
}

export interface EstadoDoRepo {
  ramo: string;
  /** SHA curto do HEAD local — para comparar com o commit buildado. */
  head: string;
  /** Commits que `origin/main` tem e o local não. > 0 = precisa atualizar. */
  atras: number;
  /** Commits locais ainda não publicados. */
  aFrente: number;
  /** Arquivos modificados e não commitados, por caminho. */
  sujos: string[];
  /** `true` quando é seguro editar: nada atrás. */
  podeEditar: boolean;
  /** Mensagem pronta para a tela quando `podeEditar` é falso. */
  aviso?: string;
  /** `false` quando o `git fetch` não completou (sem rede, por exemplo). */
  sincronizado: boolean;
}

/**
 * Lê o estado, tentando `fetch` antes.
 *
 * Se o `fetch` falhar (máquina sem rede, tailnet fora), NÃO bloqueia a edição:
 * bloquear aí transformaria uma queda de rede em painel inutilizável, e o dado
 * local continua íntegro. Mas devolve `sincronizado: false` para a tela dizer
 * que a comparação é contra a última informação conhecida, não contra o agora.
 */
export function lerEstadoDoRepo(): EstadoDoRepo {
  let sincronizado = true;
  try {
    git("fetch", "--quiet", "origin");
  } catch {
    sincronizado = false;
  }

  const ramo = git("rev-parse", "--abbrev-ref", "HEAD");
  const head = git("rev-parse", "--short", "HEAD");
  const sujos = git("status", "--porcelain")
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3));

  let atras = 0;
  let aFrente = 0;
  try {
    const contagem = git("rev-list", "--left-right", "--count", "origin/main...HEAD");
    const [esq, dir] = contagem.split(/\s+/);
    atras = Number(esq) || 0;
    aFrente = Number(dir) || 0;
  } catch {
    // Sem `origin/main` (clone raso, repo novo) não há com o que colidir.
  }

  const podeEditar = atras === 0;
  return {
    ramo,
    head,
    atras,
    aFrente,
    sujos,
    podeEditar,
    sincronizado,
    aviso: podeEditar
      ? undefined
      : `A outra máquina publicou ${atras} ${atras === 1 ? "mudança" : "mudanças"} desde a sua última atualização. Rode \`git pull\` antes de editar — senão a sua edição entra por cima da dela.`,
  };
}
