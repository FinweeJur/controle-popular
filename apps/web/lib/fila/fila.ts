/**
 * Fila distribuída — o "quem pega o quê" entre as máquinas ligadas.
 *
 * Plano: `docs/planos/PLANO-ORQUESTRACAO-DISTRIBUIDA.md` (F1). O problema é
 * simples de enunciar e fácil de errar: com dois PCs ligados, sem coordenação,
 * os dois pegam a MESMA tarefa e fazem trabalho dobrado (ou batem na mesma
 * fonte ao mesmo tempo). Aqui a coordenação reaproveita o que já é comum às
 * duas máquinas: **o próprio git**. A fila é um arquivo versionado; reivindicar
 * uma tarefa é gravar um `claim` e dar push — quem chega depois leva
 * non-fast-forward e pega a próxima.
 *
 * Lógica PURA (sem rede, sem disco, sem git): recebe a fila, devolve a fila
 * modificada. Quem grava e dá push é `scripts/automacao/rodar-fila.mts`.
 *
 * ═══ A REGRA DE EXCLUSIVIDADE, E POR QUÊ ═══
 *
 * `build`, `deploy` e `indice` mexem no checkout e exigem o Postgres local —
 * coisas que só o `home-pc` tem. Dois deles ao mesmo tempo no mesmo checkout
 * corrompem build/deploy; por isso essas três tarefas são **exclusivas do
 * home-pc**, e o resto é de quem estiver ligado.
 */

/** O que cada máquina é capaz de rodar. */
export type Maquina = "home-pc" | "desktop-fefpddp";

export type TipoTarefa =
  | "fonte" // sonda se a fonte pública responde (PicoClaw)
  | "pagina" // confere rota/página viva (Argus)
  | "link" // acha e confirma link substituto (LinkMender)
  | "dado" // varre CPF/IBGE/duplicata nas bases (fiscaliza-bases)
  | "teste" // roda uma fatia da suíte (vitest)
  | "security" // auditoria de segurança/dados (Hermes)
  | "code-review" // revisão por micro-parte (sessão de agente; NÃO automático)
  | "pr" // abre/atualiza PR verde (bot-seguranca-merge)
  | "indice" // regenera o índice de busca (exige banco)
  | "rag" // regenera acervo + finetuning do Seu Nonô
  | "build" // builda
  | "deploy"; // publica

export type StatusTarefa = "livre" | "em_curso" | "feita" | "falhou";

/** Tipos que SÓ o home-pc roda — dependem do Postgres local ou do checkout único. */
export const TIPOS_EXCLUSIVOS_HOME_PC: readonly TipoTarefa[] = ["build", "deploy", "indice"];

export interface Tarefa {
  /** `"<tipo>:<alvo>"` — determinístico, para a mesma tarefa não virar duas. */
  id: string;
  tipo: TipoTarefa;
  /** Onde a tarefa incide: rota, fonte, módulo, arquivo. */
  alvo: string;
  status: StatusTarefa;
  /** Máquina que reivindicou (só quando `em_curso`/`feita`). */
  claimPor?: Maquina;
  /** ISO-8601 de quando o claim foi gravado. */
  claimEm?: string;
  /** Resumo curto do resultado, para o relatório e o Telegram. */
  resultado?: string;
  /** ISO-8601 da última mudança de estado. */
  atualizadoEm?: string;
}

export interface Fila {
  geradoEm: string;
  tarefas: Tarefa[];
}

/** `"<tipo>:<alvo>"` normalizado — a mesma tarefa tem sempre o mesmo id. */
export function idDaTarefa(tipo: TipoTarefa, alvo: string): string {
  return `${tipo}:${alvo.trim().toLowerCase()}`;
}

/** A máquina pode rodar este tipo? (`build`/`deploy`/`indice` são do home-pc.) */
export function podeRodar(tipo: TipoTarefa, maquina: Maquina): boolean {
  if (maquina === "home-pc") return true;
  return !TIPOS_EXCLUSIVOS_HOME_PC.includes(tipo);
}

/**
 * A próxima tarefa livre que esta máquina pode pegar, na ordem da fila.
 * `null` quando não há nada que caiba nela.
 */
export function proximaTarefa(fila: Fila, maquina: Maquina): Tarefa | null {
  return fila.tarefas.find((t) => t.status === "livre" && podeRodar(t.tipo, maquina)) ?? null;
}

/**
 * Reivindica uma tarefa — devolve uma fila NOVA (não muta a original).
 *
 * Só reivindica o que está `livre` e cabe na máquina: reivindicar tarefa de
 * outra máquina ou já em curso devolveria a mesma fila, e o chamador entende
 * que perdeu a corrida.
 */
export function reivindicar(
  fila: Fila,
  id: string,
  maquina: Maquina,
  agora: string
): Fila {
  return {
    ...fila,
    tarefas: fila.tarefas.map((t) =>
      t.id === id && t.status === "livre" && podeRodar(t.tipo, maquina)
        ? { ...t, status: "em_curso", claimPor: maquina, claimEm: agora, atualizadoEm: agora }
        : t
    ),
  };
}

/** Marca o resultado de uma tarefa (feita ou falhou). */
export function concluir(
  fila: Fila,
  id: string,
  status: "feita" | "falhou",
  resultado: string,
  agora: string
): Fila {
  return {
    ...fila,
    tarefas: fila.tarefas.map((t) =>
      t.id === id ? { ...t, status, resultado, atualizadoEm: agora } : t
    ),
  };
}

export interface ResumoFila {
  livre: number;
  em_curso: number;
  feita: number;
  falhou: number;
  total: number;
  porMaquina: Partial<Record<Maquina, number>>;
}

/** Contagem para o `/fila` do Telegram e o relatório. */
export function resumoFila(fila: Fila): ResumoFila {
  const r: ResumoFila = { livre: 0, em_curso: 0, feita: 0, falhou: 0, total: fila.tarefas.length, porMaquina: {} };
  for (const t of fila.tarefas) {
    r[t.status] += 1;
    if (t.status === "em_curso" && t.claimPor) {
      r.porMaquina[t.claimPor] = (r.porMaquina[t.claimPor] ?? 0) + 1;
    }
  }
  return r;
}

/**
 * Adiciona uma tarefa à fila, se ainda não existir (pelo `id`).
 * Devolve a fila nova. Idempotente: chamar duas vezes com o mesmo alvo não
 * cria duplicata — é o que permite a qualquer máquina "repor" a fila sem medo.
 */
export function enfileirar(
  fila: Fila,
  tipo: TipoTarefa,
  alvo: string,
  agora: string
): Fila {
  const id = idDaTarefa(tipo, alvo);
  if (fila.tarefas.some((t) => t.id === id)) return fila;
  return {
    ...fila,
    tarefas: [...fila.tarefas, { id, tipo, alvo: alvo.trim(), status: "livre", atualizadoEm: agora }],
  };
}
