import regras from "@/lib/judiciario/regras.json";

// Régua canônica, lida do MESMO arquivo que o ETL Python lê
// (`regras.json`). Nunca reimplementar estes valores em TS: a
// única fonte de verdade é o JSON, e duplicar geraria deriva silenciosa
// entre a tela e o cálculo do ETL — a lição que a rubrica do /congresso
// deixou.

export const REGRAS = regras;
export const VERSAO_REGRA = regras.versao;

export const COMPULSORIA_ANOS = regras.idades.aposentadoria_compulsoria.anos;
export const TETO_INDICACAO_ANOS = regras.idades.teto_indicacao.anos;
export const MINIMA_INDICACAO_ANOS = regras.idades.minima_indicacao.anos;

export type Tribunal = {
  nome: string;
  ramo: string;
  cadeiras: number;
  sabatina_senado: boolean;
  base_legal: string;
  cotas: Record<string, number>;
  nota?: string;
};

export const TRIBUNAIS = regras.tribunais as unknown as Record<string, Tribunal>;

/**
 * Projeção determinística de vacância por aposentadoria compulsória.
 * nascimento + 75 anos. Devolve `null` quando a data de nascimento é
 * desconhecida — que é estado legítimo e exibido como tal, NUNCA chutado.
 *
 * Espelha exatamente `etl/vacancia.py`; as duas leem `COMPULSORIA_ANOS`
 * do mesmo JSON, então não há como uma divergir da outra sem bump de
 * versão da régua.
 */
export function vacanciaCompulsoria(dataNascimento: string | null): string | null {
  if (!dataNascimento) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataNascimento);
  if (!m) return null;
  const ano = Number(m[1]) + COMPULSORIA_ANOS;
  const mes = Number(m[2]);
  let dia = Number(m[3]);
  // 29/fev + N anos cai em ano não-bissexto → 28/fev. É como o Postgres
  // (`+ interval '75 years'`) e o etl/vacancia.py resolvem; alinhar aqui
  // impede a view, o ETL e a tela de discordarem num nascido em bissexto.
  if (mes === 2 && dia === 29) {
    const bissexto = ano % 4 === 0 && (ano % 100 !== 0 || ano % 400 === 0);
    if (!bissexto) dia = 28;
  }
  const pad = (x: number) => String(x).padStart(2, "0");
  return `${ano}-${pad(mes)}-${pad(dia)}`;
}

/** Janela de elegibilidade para indicação: 35 ≤ idade < 70, na data dada. */
export function elegivelIndicacao(dataNascimento: string | null, emData: Date): boolean {
  if (!dataNascimento) return false;
  const n = new Date(dataNascimento);
  if (Number.isNaN(n.getTime())) return false;
  let idade = emData.getFullYear() - n.getFullYear();
  const m = emData.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && emData.getDate() < n.getDate())) idade--;
  return idade >= MINIMA_INDICACAO_ANOS && idade < TETO_INDICACAO_ANOS;
}
