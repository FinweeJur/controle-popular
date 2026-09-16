/**
 * Nota numérica agregada de parlamentar FEDERAL — versão 1.
 *
 * Só medir o que o banco já tem. Vista do equilíbrio dos eixos:
 *
 *   nota = 100 × (0,40 × autoria normativa + 0,10 × produção ampla
 *               + 0,25 × coerência        + 0,25 × presença)
 *
 * Onde o fator NÃO estava medido (`medido = false` em FatorAtuacao) ou o
 * parlamentar não tem dado suficiente, o peso dele é redistribuído entre os
 * medidos — dialeticamente o mesmo princípio de FatorAtuacao: não medido
 * nunca vale 0 (castigo por falha do nosso raspador) nem 1 (crédito) — é
 * REMOVIDO da média, e o rótulo `eixoParcial` viaja junto da nota.
 *
 * Lacuna honesta: "produção ampla" conta requerimento PROTOCOLADO
 * (audiência pública e fiscalização), não audiência realizada — o dado
 * público sustenta o pedido, não o resultado. A página deve dizer
 * "requerimentos" e não "audiências puxadas".
 */
export const RANK_VERSAO = "1";

const PESO_NORMATIVA = 0.4;
const PESO_AMPLA = 0.1;
const PESO_COERENCIA = 0.25;
const PESO_PRESENCA = 0.25;

/** Âncora fixa do saldo normativo: 10 pontos de saldo ponderado = nota
 * máxima do eixo. ENCAIXE — recalibrar para o percentil 95 do saldo real
 * dos 513 deputados (consulta ao banco, só na máquina home-pc) antes de
 * tratar 100 como honorável. */
const ANCORA_SALDO = 10;

/** Pontos da produção ampla: cap em 5 para quem assina em série. */
const ANCORA_PRODUCAO_AMPLA = 5;
export const PONTO_REQ_AUDIENCIA = 0.3;
export const PONTO_REQ_FISCALIZACAO = 0.3;

/** Mínimo de proposições analisadas para a nota existir. Nota sobre pouco
 * dado é insinuação — mostra "dados insuficientes" em vez de número. */
const MINIMO_PROPOSICOES = 5;

/** Ponto por requerimento, via regex AUDITÁVEL (não modelo). Dúvida não
 * conta: marcar audiência que era menção formal viraria produção falsa. */
export function classificarRequerimento(ementa: string | null): "audiencia" | "fiscalizacao" | null {
  if (!ementa) return null;
  if (/audi[êe]ncia/i.test(ementa)) return "audiencia";
  if (/fiscaliza[cç][ãa]o|comiss[ãa]o externa|provid[êe]ncias/i.test(ementa)) return "fiscalizacao";
  return null;
}

/** Autoria normativa 0..1 — saldo ponderado contra a âncora, com teto. */
export function componenteNormativa(saldo: number): number {
  return 0.5 + 0.5 * Math.max(-1, Math.min(1, saldo / ANCORA_SALDO));
}

/** Produção ampla 0..1 — pontos de requerimentos ÷ âncora, com teto. */
export function componenteProducaoAmpla(qtdAudiencia: number, qtdFiscalizacao: number): number {
  const pontos = qtdAudiencia * PONTO_REQ_AUDIENCIA + qtdFiscalizacao * PONTO_REQ_FISCALIZACAO;
  return Math.min(1, pontos / ANCORA_PRODUCAO_AMPLA);
}

export interface EntradaNota {
  /** Saldo ponderado de autoria (peso por tipo, `PESO_TIPO_CONGRESSO`). */
  saldoAutoria: number;
  /** Nº de proposições da pessoa COM rótulo da rubrica. */
  nProposicoesAnalisadas: number;
  /** Fatores 0..1; `medido = false` remove o peso da média. */
  coerencia: { valor: number; medido: boolean };
  presenca: { valor: number; medido: boolean };
  /** Pontos de produção ampla já agregados (componenteProducaoAmpla). */
  producaoAmpla: number;
}

export interface Nota {
  /** 0..100, ou null quando os dados não bastam. */
  nota: number | null;
  /** Verdadeiro quando algum eixo medido ficou fora da média. */
  eixoParcial: boolean;
  versao: string;
  /** Decomposição para exibir — a nota nunca aparece sem isto. */
  componentes: { normativa: number; amplia: number; coerencia: number | null; presenca: number | null };
}

/** Regra central: peso de eixo não medido REDISTRIBUI entre os medidos,
 * proporcionalmente — nunca conta como 0 nem como 1. */
export function calcularNota(entrada: EntradaNota): Nota {
  const normativa = componenteNormativa(entrada.saldoAutoria);
  const coeficientes: Array<[number, number]> = [[PESO_NORMATIVA, normativa]];

  let eixoParcial = false;
  if (entrada.coerencia.medido) coeficientes.push([PESO_COERENCIA, entrada.coerencia.valor]);
  else eixoParcial = true;
  if (entrada.presenca.medido) coeficientes.push([PESO_PRESENCA, entrada.presenca.valor]);
  else eixoParcial = true;
  coeficientes.push([PESO_AMPLA, entrada.producaoAmpla]);

  const somaPesos = coeficientes.reduce((total, [peso]) => total + peso, 0);
  const media = coeficientes.reduce((total, [peso, val]) => total + peso * val, 0) / somaPesos;

  const basta = entrada.nProposicoesAnalisadas >= MINIMO_PROPOSICOES;
  return {
    nota: basta ? Math.round(media * 100) : null,
    eixoParcial,
    versao: RANK_VERSAO,
    componentes: {
      normativa,
      amplia: entrada.producaoAmpla,
      coerencia: entrada.coerencia.medido ? entrada.coerencia.valor : null,
      presenca: entrada.presenca.medido ? entrada.presenca.valor : null,
    },
  };
}
