/**
 * ═══ EXTRATOR DE ENTIDADES ESTRUTURADAS E ANONIMIZADOR LGPD ═══
 *
 * Módulo puro em TypeScript para processar o texto integral ou ementa
 * de atos oficiais de diários municipais, extraindo metadados estruturados
 * (valores monetários, CNPJs, números de atos/processos e objetos)
 * e garantindo a anonimização determinística de CPFs de pessoas físicas
 * via validação Mod-11 antes de qualquer persistência ou emissão de JSON.
 */

export interface EntidadesAto {
  /** Todos os valores monetários encontrados em reais (R$) */
  valoresMonetarios: number[];
  /** Valor monetário principal (maior valor ou valor global/total) */
  valorPrincipal: number | null;
  /** CNPJs de fornecedores ou conveniados validados por Mod-11 formatados (XX.XXX.XXX/YYYY-ZZ) */
  cnpjs: string[];
  /** Número do processo licitatório ou administrativo (ex: "08/2026", "14/2025") */
  numeroProcesso: string | null;
  /** Número do edital, pregão, dispensa ou chamamento (ex: "Pregão Eletrônico 08/2026", "015/2026") */
  numeroEdital: string | null;
  /** Número do contrato, termo aditivo ou convênio (ex: "100/2026", "019/2025") */
  numeroContrato: string | null;
  /** Descrição resumida do objeto do ato */
  objeto: string | null;
}

/**
 * CPFs sintéticos permitidos para testes e exemplos.
 * Em estrita sincronia com scripts/checar-dado-pessoal-em-dado.py e apps/web/lib/sem-cpf-no-repo.test.ts.
 */
export const SINTETICOS: ReadonlySet<string> = new Set([
  "00000000000",
  "000.000.000-00",
  "11111111111",
  "12345678900",
  "12345678909",
  "123.456.789-09",
  "47018614139",
]);

/**
 * Validação de CPF pelo algoritmo oficial Mod-11.
 * Retorna falso para sequências de 11 dígitos iguais.
 */
export function validarCpf(digitosOuFormatado: string | null | undefined): boolean {
  if (!digitosOuFormatado) return false;
  const d = digitosOuFormatado.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) {
      soma += Number(d[i]) * (ate + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

/**
 * Validação de CNPJ pelo algoritmo oficial Mod-11 (14 dígitos).
 * Retorna falso para sequências de 14 dígitos iguais.
 */
export function validarCnpj(cnpjOuFormatado: string | null | undefined): boolean {
  if (!cnpjOuFormatado) return false;
  const d = cnpjOuFormatado.replace(/\D/g, "");
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const pesosDv1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesosDv2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let soma1 = 0;
  for (let i = 0; i < 12; i++) {
    soma1 += Number(d[i]) * pesosDv1[i];
  }
  const resto1 = soma1 % 11;
  const dv1 = resto1 < 2 ? 0 : 11 - resto1;
  if (dv1 !== Number(d[12])) return false;

  let soma2 = 0;
  for (let i = 0; i < 13; i++) {
    soma2 += Number(d[i]) * pesosDv2[i];
  }
  const resto2 = soma2 % 11;
  const dv2 = resto2 < 2 ? 0 : 11 - resto2;
  return dv2 === Number(d[13]);
}

/**
 * Formata sequência de 14 dígitos como CNPJ padrão: XX.XXX.XXX/YYYY-ZZ.
 */
export function formatarCnpj(cnpj: string): string {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

/**
 * Substitui CPFs válidos de pessoas físicas por máscara protegida (***.***.***-** ou 000.000.000-00),
 * preservando números sintéticos e não afetando CNPJs ou IDs de processo.
 */
export function anonimizarCpfs(
  texto: string | null | undefined,
  mascara: string = "***.***.***-**"
): string {
  if (!texto) return "";

  // Regex cobrindo CPFs formatados (000.000.000-00) e sequências de 11 dígitos
  const regexCpf = /\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b|\b[0-9]{11}\b/g;

  return texto.replace(regexCpf, (match) => {
    if (SINTETICOS.has(match)) {
      return match;
    }
    const digitos = match.replace(/\D/g, "");
    if (validarCpf(digitos)) {
      return mascara;
    }
    return match;
  });
}

/**
 * Extrai valores monetários em formato numérico a partir do texto do ato.
 */
function extrairValoresMonetarios(texto: string): { valores: number[]; principal: number | null } {
  const valores: number[] = [];
  const vistos = new Set<number>();

  // Padrão 1: Valores com R$ explícito (ex: R$ 150.000,00 ou R$ 1.500,50)
  // Padrão 2: "VALOR TOTAL DE R$ ...", "VALOR GLOBAL: ...", "VALOR DE ..."
  const regexMoeda = /(?:R\$\s*|VALOR(?:\s+GLOBAL|\s+TOTAL)?(?:\s+ESTIMADO)?(?:\s+DE)?\s*:?\s*R?\$?\s*)([0-9]{1,3}(?:\.[0-9]{3})*,\s*[0-9]{2})/gi;

  let match: RegExpExecArray | null;
  let matchValorTotal: number | null = null;

  while ((match = regexMoeda.exec(texto)) !== null) {
    const rawNum = match[1].replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");
    const num = parseFloat(rawNum);
    if (!isNaN(num) && num > 0) {
      if (!vistos.has(num)) {
        vistos.add(num);
        valores.push(num);
      }
      // Se tiver prefixo de total/global, priorizar como valor principal
      const contexto = match[0].toUpperCase();
      if (contexto.includes("TOTAL") || contexto.includes("GLOBAL")) {
        matchValorTotal = num;
      }
    }
  }

  const principal = matchValorTotal ?? (valores.length > 0 ? Math.max(...valores) : null);
  return { valores, principal };
}

/**
 * Extrai todos os CNPJs válidos encontrados no texto.
 */
function extrairCnpjs(texto: string): string[] {
  const cnpjsEncontrados: string[] = [];
  const vistos = new Set<string>();

  // CNPJs formatados e sem formatação (14 dígitos)
  const regexCnpj = /\b[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/[0-9]{4}-[0-9]{2}\b|\b[0-9]{14}\b/g;
  let match: RegExpExecArray | null;

  while ((match = regexCnpj.exec(texto)) !== null) {
    const raw = match[0];
    const digitos = raw.replace(/\D/g, "");
    if (validarCnpj(digitos)) {
      const formatado = formatarCnpj(digitos);
      if (!vistos.has(formatado)) {
        vistos.add(formatado);
        cnpjsEncontrados.push(formatado);
      }
    }
  }

  return cnpjsEncontrados;
}

/**
 * Extrai o número do processo licitatório ou administrativo.
 */
function extrairNumeroProcesso(texto: string): string | null {
  const padroesProcesso = [
    /(?:PROCESSO\s+LICITAT[ÓO]RIO|PROCESSO\s+ADMINISTRATIVO|PROC\.\s*ADM\.|PROCESSO|PL|PA)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\.[0-9]+)*(?:\/[0-9]{2,4})?)/i,
    /(?:PROCESSO\s*(?:N[ºO°\.]?\s*)?)([0-9]+(?:\/[0-9]{2,4})?)/i,
  ];

  for (const padrao of padroesProcesso) {
    const m = padrao.exec(texto);
    if (m && m[1]) {
      const num = m[1].trim();
      // Descartar sequências que são apenas anos ou dígitos únicos
      if (num.length >= 2) {
        return num;
      }
    }
  }
  return null;
}

/**
 * Extrai o número do edital, pregão, dispensa, etc.
 */
function extrairNumeroEdital(texto: string): string | null {
  const padroes = [
    /(?:ATA\s+DE\s+REGISTRO\s+DE\s+PRE[ÇC]OS?)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:EDITAL(?:\s+DE\s+LICITA[ÇC][ÃA]O)?)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:PREG[ÃA]O\s+ELETR[ÔO]NICO|PREG[ÃA]O\s+PRESENCIAL|PREG[ÃA]O)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:DISPENSA(?:\s+DE\s+LICITA[ÇC][ÃA]O)?)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:INEXIGIBILIDADE(?:\s+DE\s+LICITA[ÇC][ÃA]O)?)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:CHAMAMENTO\s+P[ÚU]BLICO)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:TOMADA\s+DE\s+PRE[ÇC]OS|CONCORR[ÊE]NCIA)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
  ];

  let melhor: { pos: number; num: string } | null = null;
  for (const padrao of padroes) {
    const m = padrao.exec(texto);
    if (m && m[1]) {
      const num = m[1].trim();
      if (num.length >= 2) {
        if (!melhor || m.index < melhor.pos) {
          melhor = { pos: m.index, num };
        }
      }
    }
  }
  return melhor ? melhor.num : null;
}

/**
 * Extrai o número do contrato, aditivo ou convênio.
 */
function extrairNumeroContrato(texto: string): string | null {
  const padroes = [
    /(?:TERMO\s+ADITIVO\s+(?:AO\s+CONTRATO\s+)?N[ºO°\.]?\s*)([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:CONTRATO(?:\s+DE\s+[A-ZÇÃÉÊÍÓÔÚ]+|\s+ADMINISTRATIVO)?)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:TERMO\s+DE\s+FOMENTO)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:TERMO\s+DE\s+COLABORA[ÇC][ÃA]O)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:TERMO\s+DE\s+PARCERIA)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:CONV[ÊE]NIO)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
    /(?:ACORDO\s+DE\s+COOPERA[ÇC][ÃA]O(?:\s+T[ÉE]CNICA)?)\s*(?:N[ºO°\.]?\s*)?([0-9]+(?:\/[0-9]{2,4})?)/i,
  ];

  let melhor: { pos: number; num: string } | null = null;
  for (const padrao of padroes) {
    const m = padrao.exec(texto);
    if (m && m[1]) {
      const num = m[1].trim();
      if (num.length >= 2) {
        if (!melhor || m.index < melhor.pos) {
          melhor = { pos: m.index, num };
        }
      }
    }
  }
  return melhor ? melhor.num : null;
}

/**
 * Extrai a descrição resumida do objeto do ato.
 */
function extrairObjeto(texto: string): string | null {
  const padroesObjeto = [
    /(?:OBJETO|OBJETIVO|FINALIDADE)\s*:\s*([^.;\n\r]+(?:[.;]|$))/i,
    /(?:CUJO\s+OBJETO\s+[ÉE]\s*)([^.;\n\r]+(?:[.;]|$))/i,
    /(?:TENDO\s+POR\s+OBJETO\s*)([^.;\n\r]+(?:[.;]|$))/i,
    /(?:COM\s+O\s+OBJETIVO\s+DE\s*)([^.;\n\r]+(?:[.;]|$))/i,
  ];

  for (const padrao of padroesObjeto) {
    const m = padrao.exec(texto);
    if (m && m[1]) {
      const limpo = m[1].replace(/[.;]+$/, "").trim();
      if (limpo.length >= 5) {
        return limpo;
      }
    }
  }
  return null;
}

import { classificarAto, type TipoAto } from "./classificarAto";

/**
 * Extrai todas as entidades estruturadas do texto de um ato oficial.
 */
export function extrairEntidades(
  textoBruto: string | null | undefined,
  tipoInformado?: TipoAto
): EntidadesAto {
  if (!textoBruto) {
    return {
      valoresMonetarios: [],
      valorPrincipal: null,
      cnpjs: [],
      numeroProcesso: null,
      numeroEdital: null,
      numeroContrato: null,
      objeto: null,
    };
  }

  // Primeiro sanitizamos qualquer CPF real para evitar propagação
  const texto = anonimizarCpfs(textoBruto);
  const tipo = tipoInformado ?? classificarAto(texto);

  const { valores, principal } = extrairValoresMonetarios(texto);
  const cnpjs = extrairCnpjs(texto);
  const numeroProcesso = extrairNumeroProcesso(texto);
  const numeroContrato = extrairNumeroContrato(texto);
  const numeroEdital =
    tipo === "contrato" || tipo === "decreto" || tipo === "portaria" || tipo === "lei"
      ? null
      : extrairNumeroEdital(texto);
  const objeto = extrairObjeto(texto);

  return {
    valoresMonetarios: valores,
    valorPrincipal: principal,
    cnpjs,
    numeroProcesso,
    numeroEdital,
    numeroContrato:
      tipo === "edital" || tipo === "decreto" || tipo === "portaria" || tipo === "lei"
        ? null
        : numeroContrato,
    objeto,
  };
}
