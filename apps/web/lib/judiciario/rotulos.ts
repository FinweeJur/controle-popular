/**
 * Rótulos em português acessível para os valores internos (enums) que o
 * banco grava em inglês-de-código: `cota`, `resultado`, `motivo_vacancia`,
 * `motivo` de vaga/alerta.
 *
 * ANTES desta lib: 8 lugares diferentes faziam `valor.replace(/_/g, " ")`,
 * o que troca `_` por espaço mas deixa o jargão técnico intacto — a tela
 * mostrava "terco trf", "eletiva stf", "voluntaria ou compulsoria" (sem
 * acento, porque o slug nunca teve) direto pro visitante leigo. Achado na
 * revisão de copy-editing de 2026-07-25.
 *
 * Fonte única: se um enum novo aparecer (tribunal novo, resultado novo da
 * API do Senado), a tela mostra o slug cru como fallback — feio, mas
 * visível, o que força adicionar aqui em vez de passar despercebido
 * (mesma filosofia de "falhar alto" do resto do projeto).
 */

export const ROTULO_COTA: Record<string, string> = {
  livre: "Vaga livre — sem cota constitucional",
  terco_trf: "Terço da carreira — juízes de Tribunal Regional Federal",
  terco_tj: "Terço da carreira — desembargadores de Tribunal de Justiça",
  terco_oab: "Terço da advocacia — indicado pela OAB",
  terco_mp: "Terço do Ministério Público",
  quinto_oab_mpt: "Quinto constitucional — advocacia ou Ministério Público do Trabalho",
  carreira_trt: "Carreira — juiz de TRT promovido",
  militar_marinha: "Vaga militar — Marinha",
  militar_exercito: "Vaga militar — Exército",
  militar_aeronautica: "Vaga militar — Aeronáutica",
  civil_stm: "Vaga civil",
  eletiva_stf: "Eleito pelo STF",
  eletiva_stj: "Eleito pelo STJ",
  advogado_lista_stf: "Advogado — indicado por lista do STF",
};

export const ROTULO_RESULTADO: Record<string, string> = {
  aprovada_no_plenario: "Aprovada pelo Senado",
  rejeitado_plenario: "Rejeitada pelo Senado",
  retirado_pelo_autor: "Retirada pelo Presidente antes da votação",
  em_tramitacao: "Ainda em análise no Senado",
};

export const ROTULO_MOTIVO_VACANCIA: Record<string, string> = {
  voluntaria_ou_compulsoria: "aposentadoria",
  falecimento: "falecimento",
  renuncia: "renúncia",
  exoneracao: "exoneração",
  transferencia_reserva: "transferência para a reserva",
  promocao: "promoção",
  fim_mandato: "fim de mandato",
  remocao: "remoção",
};

export const ROTULO_MOTIVO_ALERTA: Record<string, string> = {
  vaga_aberta: "Vaga aberta",
  vacancia_projetada: "Aposentadoria projetada dentro do prazo",
  sabatina_concluida: "Senado decidiu sobre a indicação",
  nova_indicacao: "Nova indicação enviada ao Senado",
};

/** Rótulo legível, com fallback visível (não silencioso) para valor não mapeado. */
function rotular(dicionario: Record<string, string>, valor: string | null | undefined): string {
  if (!valor) return "—";
  return dicionario[valor] ?? valor.replace(/_/g, " ");
}

export const rotuloCota = (v: string | null | undefined) => rotular(ROTULO_COTA, v);
export const rotuloResultado = (v: string | null | undefined) => rotular(ROTULO_RESULTADO, v);
export const rotuloMotivoVacancia = (v: string | null | undefined) => rotular(ROTULO_MOTIVO_VACANCIA, v);
export const rotuloMotivoAlerta = (v: string | null | undefined) => rotular(ROTULO_MOTIVO_ALERTA, v);
