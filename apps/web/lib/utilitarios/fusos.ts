/**
 * Fusos horários para a ferramenta "horário mundial" da página `/tecnologia`.
 *
 * ═══ O QUE É ═══
 *
 * Uma lista curada de países/cidades (o Brasil primeiro) com o identificador
 * IANA de fuso (ex.: `America/Sao_Paulo`) e funções que formatam a hora e a
 * data usando `Intl.DateTimeFormat`.
 *
 * ═══ POR QUE É DADO ZERO ═══
 *
 * O navegador já embute o banco mundial de fusos e o horário de verão de cada
 * lugar. Por isso a ferramenta não precisa de backend, não faz requisição e
 * não fica desatualizada no horário: só a LISTA curada de lugares é que mora
 * no código. A hora exata sai do relógio do aparelho de quem lê.
 *
 * ═══ POR QUE O BRASIL PRIMEIRO ═══
 *
 * O leitor é brasileiro e o portal é de transparência brasileira. Ter os
 * quatro fusos do país no topo (Brasília, Manaus, Rio Branco e Fernando de
 * Noronha) resolve o caso mais comum — saber a hora de uma cidade do próprio
 * país — antes de qualquer outro lugar do mundo.
 *
 * ⚠️ Fuso é identificador técnico, não decisão política de fronteira; a lista
 * usa as cidades de referência do próprio banco IANA.
 */

export interface Fuso {
  /** País em português. */
  pais: string;
  /** Cidade de referência do fuso. */
  cidade: string;
  /** Identificador IANA aceito por `Intl.DateTimeFormat`. */
  fuso: string;
  /** Região do mundo, para agrupar/filtrar na tela. */
  regiao: "América" | "Europa" | "Ásia" | "África" | "Oceania";
}

/** Lista curada de fusos, com o Brasil no topo. */
export const FUSOS: Fuso[] = [
  { pais: "Brasil", cidade: "Brasília", fuso: "America/Sao_Paulo", regiao: "América" },
  { pais: "Brasil", cidade: "Manaus", fuso: "America/Manaus", regiao: "América" },
  { pais: "Brasil", cidade: "Rio Branco", fuso: "America/Rio_Branco", regiao: "América" },
  { pais: "Brasil", cidade: "Fernando de Noronha", fuso: "America/Noronha", regiao: "América" },
  { pais: "Estados Unidos", cidade: "Nova York", fuso: "America/New_York", regiao: "América" },
  { pais: "Estados Unidos", cidade: "Los Angeles", fuso: "America/Los_Angeles", regiao: "América" },
  { pais: "Canadá", cidade: "Toronto", fuso: "America/Toronto", regiao: "América" },
  { pais: "México", cidade: "Cidade do México", fuso: "America/Mexico_City", regiao: "América" },
  { pais: "Argentina", cidade: "Buenos Aires", fuso: "America/Argentina/Buenos_Aires", regiao: "América" },
  { pais: "Chile", cidade: "Santiago", fuso: "America/Santiago", regiao: "América" },
  { pais: "Colômbia", cidade: "Bogotá", fuso: "America/Bogota", regiao: "América" },
  { pais: "Peru", cidade: "Lima", fuso: "America/Lima", regiao: "América" },
  { pais: "França", cidade: "Paris", fuso: "Europe/Paris", regiao: "Europa" },
  { pais: "Portugal", cidade: "Lisboa", fuso: "Europe/Lisbon", regiao: "Europa" },
  { pais: "Reino Unido", cidade: "Londres", fuso: "Europe/London", regiao: "Europa" },
  { pais: "Alemanha", cidade: "Berlim", fuso: "Europe/Berlin", regiao: "Europa" },
  { pais: "Rússia", cidade: "Moscou", fuso: "Europe/Moscow", regiao: "Europa" },
  { pais: "China", cidade: "Pequim", fuso: "Asia/Shanghai", regiao: "Ásia" },
  { pais: "Japão", cidade: "Tóquio", fuso: "Asia/Tokyo", regiao: "Ásia" },
  { pais: "Índia", cidade: "Nova Délhi", fuso: "Asia/Kolkata", regiao: "Ásia" },
  { pais: "Emirados Árabes", cidade: "Dubai", fuso: "Asia/Dubai", regiao: "Ásia" },
  { pais: "Egito", cidade: "Cairo", fuso: "Africa/Cairo", regiao: "África" },
  { pais: "Nigéria", cidade: "Lagos", fuso: "Africa/Lagos", regiao: "África" },
  { pais: "Angola", cidade: "Luanda", fuso: "Africa/Luanda", regiao: "África" },
  { pais: "Moçambique", cidade: "Maputo", fuso: "Africa/Maputo", regiao: "África" },
  { pais: "África do Sul", cidade: "Joanesburgo", fuso: "Africa/Johannesburg", regiao: "África" },
  { pais: "Austrália", cidade: "Sydney", fuso: "Australia/Sydney", regiao: "Oceania" },
];

/**
 * Formata só a hora (HH:MM:SS) no fuso indicado.
 * Usa `hourCycle: "h23"` para nunca devolver "24:00" à meia-noite.
 */
export function formatarHoraFuso(fuso: string, data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(data);
}

/** Formata só a data (dia da semana + dia + mês) no fuso indicado. */
export function formatarDataFuso(fuso: string, data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: fuso,
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(data);
}
