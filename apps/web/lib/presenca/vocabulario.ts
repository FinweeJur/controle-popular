/**
 * Vocabulário de presença — lado TypeScript.
 *
 * Lê `vocabulario.json`, a MESMA fonte canônica que o ETL lê em Python
 * (`etl/congresso/etl/camara/presenca.py`). A lista não é duplicada aqui de
 * propósito: se o coletor contasse "Decisão da Mesa" como justificada e a
 * tela a contasse como falta, a divergência não daria erro nenhum — só um
 * número diferente em cada lugar, sem ninguém saber qual está certo. É a
 * mesma disciplina de `lib/congresso/rubrica.ts`.
 */
import vocabulario from "./vocabulario.json";

export const VOCABULARIO_PRESENCA = vocabulario;
export const VERSAO_VOCABULARIO: string = vocabulario.versao;

/** Como um dia de plenário do Congresso é contado. */
export type SituacaoDia = "presente" | "justificada" | "falta" | "desconhecida";

/** Como o registro de um vereador numa votação municipal é contado. */
export type SituacaoVoto =
  | "registrou_voto"
  | "presente_sem_votar"
  | "ausente"
  | "nao_e_voto"
  | "desconhecida";

/**
 * Minúsculo, sem acento, espaços colapsados — a forma em que os rótulos são
 * comparados. `NFD` + remoção dos diacríticos combinantes é o equivalente do
 * `unicodedata.normalize("NFKD")` do lado Python; as duas implementações
 * precisam concordar, e é por isso que ambas normalizam antes de comparar em
 * vez de listarem as variantes acentuadas.
 */
export function normalizarRotulo(texto: string | null | undefined): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function casaPrefixo(rotulo: string, prefixos: readonly string[]): boolean {
  return prefixos.some((p) => rotulo.startsWith(p));
}

/**
 * Classifica `presencas_plenario.situacao_dia`.
 *
 * Rótulo novo da Câmara volta `"desconhecida"` — e quem chama tem de
 * EXCLUÍ-LO do denominador, não somá-lo à falta. Um rótulo que ninguém
 * catalogou ainda não é prova de ausência de ninguém.
 */
export function classificarDia(situacao: string | null | undefined): SituacaoDia {
  const s = normalizarRotulo(situacao);
  if (!s) return "desconhecida";
  const v = vocabulario.presenca_dia;
  if (casaPrefixo(s, v.presente)) return "presente";
  if (casaPrefixo(s, v.justificada)) return "justificada";
  if (casaPrefixo(s, v.falta)) return "falta";
  return "desconhecida";
}

/** Classifica `votos_camara.voto`. */
export function classificarVoto(voto: string | null | undefined): SituacaoVoto {
  const s = normalizarRotulo(voto);
  if (!s) return "desconhecida";
  const v = vocabulario.voto_municipal;
  // `nao_e_voto` PRIMEIRO: quem preside não vota por regra regimental, e
  // "Presidência" não pode cair em nenhum dos outros baldes.
  if (casaPrefixo(s, v.nao_e_voto)) return "nao_e_voto";
  if (casaPrefixo(s, v.ausente)) return "ausente";
  if (casaPrefixo(s, v.presente_sem_votar)) return "presente_sem_votar";
  if (casaPrefixo(s, v.registrou_voto)) return "registrou_voto";
  return "desconhecida";
}

/**
 * A fonte desta cidade DECLARA a ausência, ou ela só seria inferida por
 * omissão?
 *
 * É o interruptor que impede São Paulo de entrar na mesma frase que Betim.
 * Em SP o XML lista só quem votou: chamar de "falta" quem não aparece
 * confundiria ausência com um dia em que a casa não abriu o painel, com uma
 * votação simbólica e com uma falha da nossa própria coleta. Cidade que não
 * declara não recebe taxa de falta — e a tela diz por quê, em vez de exibir
 * um traço mudo.
 *
 * Cidade ausente do mapa devolve `false`: o padrão seguro é NÃO afirmar.
 */
export function fonteDeclaraAusencia(idMunicipio: string): boolean {
  const mapa = vocabulario.ausencia_declarada_por_cidade as Record<string, unknown>;
  return mapa[idMunicipio] === true;
}
