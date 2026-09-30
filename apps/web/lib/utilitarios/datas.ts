/**
 * Datas e prazos — lógica pura da ferramenta cívica de datas em `/tecnologia`.
 *
 * ═══ O QUE É ═══
 *
 * Contas de calendário que aparecem no dia a dia de quem fiscaliza: quantos
 * dias entre duas datas, qual a data somando um prazo, a idade em anos e o
 * prazo legal de resposta a um pedido de acesso à informação (LAI).
 *
 * ═══ POR QUE NÃO USAR `new Date()` DIRETO NA TELA ═══
 *
 * `new Date("2026-01-31")` é interpretado como meia-noite UTC; em fuso a
 * oeste disso (Brasil, UTC-3) a data vira 30/01. O erro de um dia em prazo
 * de lei é dano. Por isso `normalizarData` monta a data a partir das partes,
 * no horário local, e as contas usam só ano/mês/dia — sem hora.
 *
 * ═══ FONTE DO PRAZO DA LAI ═══
 *
 * Lei 12.527/2011 (Lei de Acesso à Informação), art. 11: o órgão responde em
 * até 20 dias, prorrogáveis por mais 10 mediante justificativa. A função
 * devolve as duas datas, para a tela mostrar o limite e o teto prorrogado.
 */

/** Data com hora zerada, para contar só dias inteiros. */
function semHoras(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/**
 * Converte texto ou Date em Date local, sem o deslocamento de fuso.
 * Aceita o formato `AAAA-MM-DD` (que é o que `<input type="date">` entrega)
 * e devolve `null` quando a entrada não é uma data válida.
 */
export function normalizarData(valor: string | Date): Date | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }
  const texto = valor.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (iso) {
    const data = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(data.getTime()) ? null : data;
  }
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Dias inteiros entre duas datas (fim − início).
 * Negativo quando o fim é anterior ao início; zero no mesmo dia.
 */
export function diasEntre(inicio: Date, fim: Date): number {
  const ms = semHoras(fim).getTime() - semHoras(inicio).getTime();
  return Math.round(ms / 86_400_000);
}

/** Soma (ou subtrai) dias a uma data, sem hora. */
export function adicionarDias(data: Date, dias: number): Date {
  const base = semHoras(data);
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias);
}

/** Idade em anos completos na data de referência. */
export function idadeEmAnos(nascimento: Date, referencia: Date): number {
  let idade = referencia.getFullYear() - nascimento.getFullYear();
  const mes = referencia.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && referencia.getDate() < nascimento.getDate())) idade--;
  return idade;
}

/** Prazo legal de resposta a um pedido de LAI (Lei 12.527/2011, art. 11). */
export function prazoRespostaLAI(protocolo: Date): {
  dias: number;
  limite: Date;
  prorrogavelAte: Date;
} {
  return {
    dias: 20,
    limite: adicionarDias(protocolo, 20),
    prorrogavelAte: adicionarDias(protocolo, 30),
  };
}

/** Formata a data no padrão brasileiro (dd/mm/aaaa). */
export function formatarDataBR(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}
