/**
 * @file privacidade-internacional.ts
 * @description Guardas de privacidade e anonimização para dados públicos dos EUA e Canadá.
 *
 * Papel no portal:
 * Assim como o Controle Popular barra CPFs brasileiros por cálculo de dígito verificador (Mod-11)
 * antes de qualquer persistência em JSON aberto, este módulo implementa a proteção equivalente
 * para identificadores de pessoas físicas da América do Norte:
 * 1. Estados Unidos (SSN — Social Security Number, 9 dígitos no formato XXX-XX-XXXX):
 *    validado pelas regras de alocação da Social Security Administration (SSA).
 * 2. Canadá (SIN — Social Insurance Number, 9 dígitos no formato XXX-XXX-XXX):
 *    validado matematicamente pelo algoritmo de Luhn (Mod-10 com pesos alternados 1 e 2).
 *
 * Decisões técnicas e restrições:
 * - Identificadores de Pessoas Jurídicas (empresas, órgãos e fundos) são públicos e NÃO devem
 *   ser bloqueados: CIK (10 dígitos com zeros à esquerda na SEC), EIN (XX-XXXXXXX nos EUA),
 *   UEI (12 caracteres alfanuméricos no USAspending.gov) e BN (Business Number de 9 dígitos
 *   da Canada Revenue Agency).
 * - Por que o SIN canadense usa Luhn: o governo do Canadá (Employment and Social Development Canada)
 *   define oficialmente que todo SIN válido de 9 dígitos satisfaz a soma de Luhn divisível por 10,
 *   e o primeiro dígito indica a província de registro (1..7 ou 9 para residentes temporários;
 *   0 e 8 não são emitidos para pessoas físicas no SIN padrão).
 */

/**
 * Verifica se uma sequência de 9 dígitos (ou formatada XXX-XXX-XXX) é um SIN
 * (Social Insurance Number) canadense matematicamente válido pelo algoritmo de Luhn.
 *
 * @param entrada String contendo o candidato a SIN (com ou sem hífens/espaços).
 * @returns `true` se passar na validação estrutural e no dígito verificador de Luhn.
 */
export function sinCanadenseValido(entrada: string): boolean {
  const digitos = entrada.replace(/[\s-]/g, "");
  if (!/^[0-9]{9}$/.test(digitos)) return false;

  // Números com todos os dígitos iguais (ex.: 000000000, 111111111) são sintéticos/inválidos
  if (/^([0-9])\1{8}$/.test(digitos)) return false;

  // No Canadá, prefixos 0 e 8 não são atribuídos a SIN de pessoas físicas
  // (8 é reservado para Business Number / CRA de empresas)
  const primeiroDigito = Number(digitos[0]);
  if (primeiroDigito === 0 || primeiroDigito === 8) return false;

  // Algoritmo de Luhn (pesos 1, 2, 1, 2, 1, 2, 1, 2, 1):
  // Se o produto de um dígito por 2 for >= 10, somam-se os dois algarismos (equivalente a subtrair 9).
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = Number(digitos[i]);
    if (i % 2 === 1) {
      valor *= 2;
      if (valor > 9) valor -= 9;
    }
    soma += valor;
  }

  return soma % 10 === 0;
}

/**
 * Verifica se uma string no formato XXX-XX-XXXX obedece às regras de alocação
 * de SSN (Social Security Number) da Social Security Administration (SSA) dos EUA.
 *
 * Regras da SSA para Area-Group-Serial (AAA-GG-SSSS):
 * - Area (AAA): não pode ser 000, 666 nem estar na faixa 900–999 (reservada para ITIN/fins fiscais).
 * - Group (GG): não pode ser 00.
 * - Serial (SSSS): não pode ser 0000.
 *
 * @param entrada Candidato formatado como XXX-XX-XXXX.
 * @returns `true` se for estruturalmente um SSN válido nos EUA.
 */
export function ssnAmericanoValido(entrada: string): boolean {
  const match = /^([0-9]{3})-([0-9]{2})-([0-9]{4})$/.exec(entrada.trim());
  if (!match) return false;

  const area = Number(match[1]);
  const grupo = Number(match[2]);
  const serial = Number(match[3]);

  if (area === 0 || area === 666 || area >= 900) return false;
  if (grupo === 0) return false;
  if (serial === 0) return false;

  // Excluir números de teste universais conhecidos (ex.: 123-45-6789 e série promocional 078-05-1120)
  const limpo = `${match[1]}${match[2]}${match[3]}`;
  if (limpo === "123456789" || limpo === "078051120") return false;

  return true;
}

/**
 * Sanitiza um texto livre oriundo de fontes dos EUA ou Canadá, mascarando qualquer
 * ocorrência de SSN americano ou SIN canadense válido antes de gravar em disco.
 *
 * @param texto Texto bruto vindo do coletor.
 * @returns Texto com eventuais identificadores pessoais substituídos por máscara explícita.
 */
export function sanitizarDadoPessoalInternacional(texto: string): string {
  if (!texto) return texto;

  // 1. Mascara SSN americano no formato XXX-XX-XXXX
  let limpo = texto.replace(/\b([0-9]{3}-[0-9]{2}-[0-9]{4})\b/g, (candidato) => {
    if (ssnAmericanoValido(candidato)) {
      return "[SSN-PROTEGIDO]";
    }
    return candidato;
  });

  // 2. Mascara SIN canadense no formato XXX-XXX-XXX
  limpo = limpo.replace(/\b([0-9]{3}-[0-9]{3}-[0-9]{3})\b/g, (candidato) => {
    if (sinCanadenseValido(candidato)) {
      return "[SIN-PROTEGIDO]";
    }
    return candidato;
  });

  return limpo;
}
