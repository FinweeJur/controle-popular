/**
 * Verificadores de dígito de documentos públicos brasileiros.
 *
 * ═══ O QUE É ═══
 *
 * Funções puras que conferem o dígito verificador de CPF, CNPJ e código de
 * município do IBGE (7 dígitos). Nenhuma delas consulta rede ou banco: o
 * cálculo roda inteiro no navegador de quem usa a ferramenta da página
 * `/tecnologia`. É de propósito — o portal não recebe, não registra e não
 * transmite o número digitado (regra de privacidade do AGENTS.md § 5.8).
 *
 * ═══ POR QUE EXISTE ═══
 *
 * O leitor sob estresse (denúncia, remoção, barragem) precisa conferir se um
 * número que recebeu é plausível antes de agir com ele. Um CPF, CNPJ ou código
 * IBGE errado derruba um pedido de LAI, um contrato ou uma denúncia. Aqui ele
 * confere sozinho, offline e sem entregar o dado a ninguém.
 *
 * ═══ COMO CADA DÍGITO É CALCULADO (e por quê) ═══
 *
 * - CPF: módulo 11, com pesos decrescentes (10..2 no primeiro dígito e 11..2
 *   no segundo). Resto menor que 2 vira 0; senão, o dígito é 11 menos o resto.
 * - CNPJ: mesmo módulo 11, com a tabela de pesos própria (5..2 e depois 9..2).
 * - Código IBGE de 7 dígitos: módulo 10, com **pesos 1 e 2** aplicados da
 *   esquerda para a direita nos seis primeiros dígitos. O motivo do módulo 10
 *   (e não 11) é que este código foi desenhado para digitação humana: a soma
 *   dos dígitos de cada produto (ex.: 6×2 = 12 → 1+2 = 3) barra o erro comum
 *   de trocar dois algarismos de posição, que é o engano real de quem copia
 *   código à mão — não o erro de inventar um dígito.
 *
 * ⚠️ O verificador diz só se o NÚMERO é bem-formado; ele não diz se a pessoa
 * ou a empresa existe. Repassar essa distinção é parte da ferramenta.
 */

/** Remove tudo que não for dígito. Aceita número com ou sem máscara. */
export function apenasDigitos(valor: string): string {
  return (valor ?? "").replace(/\D/g, "");
}

/**
 * Confere o dígito verificador de um CPF (11 dígitos, módulo 11).
 * Devolve `false` também para os 11 dígitos repetidos, que passariam na conta
 * mas nunca são CPF válido.
 */
export function validarCPF(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  const digito = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * (ate + 1 - i);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

/**
 * Confere o dígito verificador de um CNPJ (14 dígitos, módulo 11).
 * CNPJ é dado público de empresa, então este verificador pode ser usado sem
 * a mesma cautela que o de CPF.
 */
export function validarCNPJ(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const digito = (ate: number): number => {
    const pesos =
      ate === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(d[i]) * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return digito(12) === Number(d[12]) && digito(13) === Number(d[13]);
}

/**
 * Confere o dígito verificador do código de município do IBGE (7 dígitos).
 * Explica a lógica completa no cabeçalho do arquivo (módulo 10, pesos 1 e 2).
 */
export function validarCodigoIBGE(valor: string): boolean {
  const d = apenasDigitos(valor);
  if (d.length !== 7) return false;

  const pesos = [1, 2, 1, 2, 1, 2];
  let soma = 0;
  for (let i = 0; i < 6; i++) {
    const produto = Number(d[i]) * pesos[i];
    soma += produto >= 10 ? produto - 9 : produto;
  }

  const dv = (10 - (soma % 10)) % 10;
  return dv === Number(d[6]);
}

/** Tipos de documento que a ferramenta de verificação aceita. */
export type TipoDocumento = "cpf" | "cnpj" | "ibge";

/** Nome legível de cada tipo, para rótulo de tela. */
export const NOME_DOCUMENTO: Record<TipoDocumento, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  ibge: "Código IBGE do município",
};

/** Despacha para o validador certo conforme o tipo escolhido na ferramenta. */
export function verificarDocumento(tipo: TipoDocumento, valor: string): boolean {
  if (tipo === "cpf") return validarCPF(valor);
  if (tipo === "cnpj") return validarCNPJ(valor);
  return validarCodigoIBGE(valor);
}
