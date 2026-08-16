/**
 * Junção incentivador cultural (Lei Rouanet) × fornecedor de contrato público.
 *
 * Só funções puras: nada de banco, nada de rede, nada de leitura de arquivo.
 * Quem lê o acervo é `lib/cultura/incentivadores-mg.ts`; quem consulta o banco
 * é `fornecedoresPorCnpj` em `lib/db/queries/betim.ts`. Aqui mora o que dá
 * para testar e medir sem nenhum dos dois — e, principalmente, o TEXTO que a
 * tela é obrigada a dizer junto com o resultado.
 *
 * ═══ O QUE ESTA JUNÇÃO AFIRMA, E É SÓ ISSO ═══
 *
 * **Esta empresa aparece nos dois acervos.** Nada além. Pôr lado a lado "doou
 * pela Rouanet" e "tem contrato com a prefeitura" convida o leitor a concluir
 * troca de favor, e o dado não sustenta essa conclusão: a Lei Rouanet é
 * renúncia fiscal aberta a qualquer empresa tributada pelo lucro real, e
 * fornecer para prefeitura é o resultado de uma licitação. As duas coisas
 * acontecerem na mesma empresa é o esperado para empresa grande, não anomalia.
 *
 * É o mesmo cuidado do repasse de Brumadinho (`RepasseBrumadinho.tsx`), que
 * precisa dizer que receber valor não significa ter sido atingido. Por isso as
 * ressalvas abaixo são CONSTANTES EXPORTADAS e não texto solto de componente:
 * o teste garante que elas existem e que viajam coladas ao número.
 *
 * ═══ TRÊS COISAS QUE A TELA NÃO PODE DIZER ═══
 *
 * 1. **Que o dinheiro doado foi para aquela cidade.** `total_doado` é do
 *    incentivador no BRASIL inteiro (`observacao_total_doado` no próprio
 *    arquivo). A API não publica recorte por UF do projeto financiado.
 * 2. **Para onde o dinheiro foi.** A trilha doação→projeto não existe:
 *    `_links.doacoes` devolveu HTTP 404 em 9 de 9 testes em 15/08/2026.
 * 3. **Que uma coisa explica a outra.** Não há data, não há valor comparável e
 *    não há vínculo entre o contrato e a doação. Só há o CNPJ em comum.
 *
 * ═══ A CHAVE, E POR QUE ELA É SÓ O CNPJ ═══
 *
 * `contratos.fornecedor_nome` existe e é tentador quando `fornecedor_cnpj` é
 * nulo. Casar por nome aqui seria um erro grave: `agregarPorCgccpf` já mediu
 * quatro grafias do Banco do Brasil em quatro UFs, e nome de empresa não é
 * identidade. Um falso positivo nesta junção não é uma linha errada numa
 * tabela — é uma empresa apontada por engano ao lado da palavra "contrato".
 * Registro sem CNPJ fica de fora e é CONTADO à parte.
 */

/** Pesos do 1º dígito verificador do CNPJ (mod-11). O 2º acrescenta o 6 na frente. */
const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, ...PESOS_DV1];

/**
 * Dígitos verificadores de CNPJ (mod-11).
 *
 * NÃO é filtro da junção, e essa distinção decide o comportamento: um CNPJ que
 * falha no DV pode ser erro de digitação no cadastro do MinC, e descartá-lo
 * calado esconderia justamente o registro que alguém precisa conferir. Serve
 * para MEDIR a qualidade da chave e para a tela poder marcar a linha. Medido
 * em 15/08/2026: 1 dos 2.261 CNPJs de MG reprova aqui.
 */
export function cnpjValidoPorDv(digitos: string): boolean {
  if (!/^\d{14}$/.test(digitos)) return false;
  // Repetição (00000000000000) passa no mod-11 e não é CNPJ de ninguém.
  if (/^(\d)\1{13}$/.test(digitos)) return false;
  const n = digitos.split("").map(Number);
  const dv = (pesos: number[]) => {
    let soma = 0;
    for (let i = 0; i < pesos.length; i++) soma += n[i] * pesos[i];
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return dv(PESOS_DV1) === n[12] && dv(PESOS_DV2) === n[13];
}

/**
 * Normaliza um CNPJ vindo de QUALQUER dos dois lados para a chave da junção.
 *
 * Os três casos do lado do contrato, todos presentes em `contratos`:
 *  - com pontuação (`"12.345.678/0001-95"`) — o PNCP grava formatado;
 *  - NULO — `fornecedor_cnpj` é coluna opcional;
 *  - vazio/só ruído — a linha tem `fornecedor_nome` e nada mais.
 *
 * E um do lado do SALIC: a máscara de pessoa física (`"***008317**"`), que
 * sobra com 6 dígitos. Devolver esses 6 dígitos seria catastrófico — casariam
 * com qualquer coisa. Comprimento diferente de 14 é sempre `null`.
 *
 * CPF de 11 dígitos também vira `null` AQUI, ao contrário de
 * `normalizarCgccpf` de `salic.ts`, que preserva os dois comprimentos porque é
 * normalização de coleta. Esta função é a CHAVE DA JUNÇÃO, e a junção é entre
 * empresas: `fornecedores.cnpj` é CNPJ. Aceitar 11 dígitos aqui abriria a
 * porta para casar pessoa física, que é exatamente quem o portal não persegue.
 *
 * `String(valor)` e não `Number`: `Number("00000000000191")` come o zero à
 * esquerda e a junção falha calada.
 */
export function normalizarCnpjChave(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const digitos = String(valor).replace(/\D/g, "");
  return digitos.length === 14 ? digitos : null;
}

/** Um incentivador do acervo do SALIC, já no formato expandido. */
export interface IncentivadorChaveavel {
  nome: string;
  municipio: string;
  UF: string;
  /** Total do incentivador no BRASIL inteiro. Ver `RESSALVA_TOTAL_DOADO`. */
  total_doado: number;
  tipo_pessoa: string;
  cgccpf: string;
}

/** O mínimo que `fornecedoresPorCnpj` devolve e que esta junção usa. */
export interface FornecedorChaveavel {
  cnpj: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnae_descricao?: string | null;
  municipio_sede?: string | null;
  uf_sede?: string | null;
}

/**
 * Uma empresa presente nos DOIS acervos.
 *
 * Repare no nome do campo do valor e no campo de ressalva ao lado dele: os
 * dois são obrigatórios de propósito. `total_doado_brasil` diz no próprio nome
 * que não é daquela cidade, e `ressalva_total_doado` carrega o texto que tem
 * de aparecer junto. Se a tela não tiver onde colar a ressalva, ela não exibe
 * o valor — é a regra, e o teste guarda o campo.
 */
export interface EmpresaNosDoisAcervos {
  cnpj: string;
  /** `false` marca a linha na tela; NÃO exclui da junção. Ver `cnpjValidoPorDv`. */
  cnpj_valido_por_dv: boolean;
  incentivador: {
    nome: string;
    municipio: string;
    uf: string;
    total_doado_brasil: number;
    ressalva_total_doado: string;
  };
  fornecedor: FornecedorChaveavel & { cnpj: string };
}

/** O que a junção afirma — e é só isso. Vai NA TELA, com todas as letras. */
export const AFIRMACAO_DA_JUNCAO =
  "Esta empresa aparece nos dois acervos: como incentivadora da Lei Rouanet e como " +
  "fornecedora de contrato público. É só isso que o dado diz. A coincidência não " +
  "indica troca de favor, não indica irregularidade e não liga uma coisa à outra — " +
  "é ponto de partida para quem for investigar, não achado.";

/** Viaja colada ao número, sempre. Sem lugar para ela, o valor não é exibido. */
export const RESSALVA_TOTAL_DOADO =
  "Valor doado pela empresa pela Lei Rouanet no BRASIL inteiro, em todos os anos. " +
  "Não é o valor doado nesta cidade nem neste estado: a fonte não publica esse " +
  "recorte. Não tem relação com o contrato ao lado.";

/** Por que não há "para onde foi o dinheiro". */
export const SEM_TRILHA_DE_DOACAO =
  "Não é possível dizer quais projetos culturais esta empresa financiou: a fonte " +
  "publica o total doado, mas o link que traria a lista por projeto não responde.";

/** O que a tela diz quando não há banco — nunca uma tabela vazia sem explicação. */
export const SEM_BANCO =
  "A base de fornecedores de contratos não está disponível nesta publicação, " +
  "então o cruzamento não pôde ser feito. Isso não significa que nenhuma empresa " +
  "apareça nos dois acervos — significa que não foi possível verificar.";

/**
 * As chaves a mandar para `fornecedoresPorCnpj`, sem repetição e ordenadas.
 *
 * Ordena porque a lista vira `IN (...)` no banco: ordem estável dá plano de
 * consulta e cache estáveis entre builds. Deduplica porque o `IN` com repetido
 * não erra, mas cresce o corpo da requisição à toa.
 */
export function chavesParaConsulta(incentivadores: readonly IncentivadorChaveavel[]): string[] {
  const chaves = new Set<string>();
  for (const inc of incentivadores) {
    const chave = normalizarCnpjChave(inc.cgccpf);
    if (chave) chaves.add(chave);
  }
  return [...chaves].sort();
}

/**
 * A junção em si.
 *
 * Contrato de vazio, e ele é DELIBERADO: qualquer lado vazio devolve `[]`, e
 * `[]` significa "cruzei e não achei nenhuma". Quem não conseguiu cruzar (sem
 * banco) NÃO chama esta função — devolve o estado `sem-banco` de
 * `juncao-banco.ts`, porque `[]` e "não sei" na mesma tela seriam a mesma
 * coisa para o leitor, e não são.
 *
 * Um incentivador por CNPJ: o acervo de MG tem os 2.261 CNPJs distintos
 * (medido), então não há o que agregar aqui. Se um dia repetir, fica o de
 * maior `total_doado` — e a repetição é contada por `estatisticasDeChave`,
 * onde ela é visível em vez de silenciosa.
 */
export function juntarPorCnpj(
  incentivadores: readonly IncentivadorChaveavel[],
  fornecedores: readonly FornecedorChaveavel[]
): EmpresaNosDoisAcervos[] {
  if (incentivadores.length === 0 || fornecedores.length === 0) return [];

  const porCnpj = new Map<string, IncentivadorChaveavel>();
  for (const inc of incentivadores) {
    const chave = normalizarCnpjChave(inc.cgccpf);
    if (!chave) continue;
    const atual = porCnpj.get(chave);
    if (!atual || Number(inc.total_doado) > Number(atual.total_doado)) porCnpj.set(chave, inc);
  }

  const saida: EmpresaNosDoisAcervos[] = [];
  const jaVistos = new Set<string>();
  for (const forn of fornecedores) {
    const chave = normalizarCnpjChave(forn.cnpj);
    if (!chave || jaVistos.has(chave)) continue;
    const inc = porCnpj.get(chave);
    if (!inc) continue;
    jaVistos.add(chave);
    saida.push({
      cnpj: chave,
      cnpj_valido_por_dv: cnpjValidoPorDv(chave),
      incentivador: {
        nome: String(inc.nome ?? "").trim(),
        municipio: String(inc.municipio ?? "").trim(),
        uf: String(inc.UF ?? "").trim(),
        total_doado_brasil: Number(inc.total_doado) || 0,
        ressalva_total_doado: RESSALVA_TOTAL_DOADO,
      },
      fornecedor: { ...forn, cnpj: chave },
    });
  }
  // Ordem por nome do incentivador, não por valor: ranking por valor doado ao
  // lado de "tem contrato" é justamente a leitura acusatória que o dado não
  // sustenta. Quem quiser ordenar por valor faz isso na tela, com a ressalva.
  return saida.sort((a, b) => a.incentivador.nome.localeCompare(b.incentivador.nome, "pt-BR"));
}

/** O que dá para medir sem banco nenhum. Todos os campos são contagens. */
export interface EstatisticasDeChave {
  /** Registros lidos do acervo. */
  registros: number;
  /** Registros com CNPJ de 14 dígitos — o universo real da junção. */
  comCnpj: number;
  /** CNPJs distintos entre eles. */
  cnpjsDistintos: number;
  /** CNPJs que aparecem em mais de um registro. */
  cnpjsRepetidos: number;
  /** Dos distintos, quantos passam no dígito verificador. */
  dvValido: number;
  /** Dos distintos, quantos reprovam. Não são excluídos da junção. */
  dvInvalido: number;
  /** Pessoa física mascarada na origem (`***008317**`). Fica fora, e é o certo. */
  mascarados: number;
  /** Documento redigido pelo próprio coletor antes de gravar. */
  redigidos: number;
  /**
   * Registros que a fonte rotula `tipo_pessoa: "juridica"` mas cujo documento
   * NÃO é CNPJ de 14 dígitos. Medido: 2 em MG, ambos com CPF mascarado. É a
   * prova de que `tipo_pessoa` não serve de filtro — quem decide é a chave.
   */
  rotuloJuridicaSemCnpj: number;
}

/** Contagens da chave. Offline, e é o número que o relatório pode citar. */
export function estatisticasDeChave(
  incentivadores: readonly IncentivadorChaveavel[]
): EstatisticasDeChave {
  const contagem = new Map<string, number>();
  let mascarados = 0;
  let redigidos = 0;
  let rotuloJuridicaSemCnpj = 0;

  for (const inc of incentivadores) {
    const bruto = String(inc.cgccpf ?? "");
    const chave = normalizarCnpjChave(bruto);
    if (chave) {
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
    } else {
      const digitos = bruto.replace(/\D/g, "");
      if (digitos.length === 0) redigidos += 1;
      else mascarados += 1;
      if (String(inc.tipo_pessoa ?? "").toLowerCase() === "juridica") rotuloJuridicaSemCnpj += 1;
    }
  }

  const distintos = [...contagem.keys()];
  const dvValido = distintos.filter(cnpjValidoPorDv).length;
  return {
    registros: incentivadores.length,
    comCnpj: [...contagem.values()].reduce((s, n) => s + n, 0),
    cnpjsDistintos: distintos.length,
    cnpjsRepetidos: [...contagem.values()].filter((n) => n > 1).length,
    dvValido,
    dvInvalido: distintos.length - dvValido,
    mascarados,
    redigidos,
    rotuloJuridicaSemCnpj,
  };
}

/**
 * Distribuição por município do INCENTIVADOR — e o nome do campo importa.
 *
 * É o município que o SALIC grava como sede/endereço do incentivador, não o
 * município do projeto financiado (a fonte não publica isso) nem o da
 * prefeitura contratante. Rotular esta contagem como "doações na cidade X"
 * seria inventar recorte geográfico que o dado não tem.
 *
 * Só conta quem tem CNPJ: é o universo da junção, e misturar as 18.523 pessoas
 * físicas mascaradas mudaria o ranking sem que a coluna significasse o mesmo.
 */
export function porMunicipioDoIncentivador(
  incentivadores: readonly IncentivadorChaveavel[]
): Array<{ municipio: string; empresas: number }> {
  const contagem = new Map<string, Set<string>>();
  for (const inc of incentivadores) {
    const chave = normalizarCnpjChave(inc.cgccpf);
    if (!chave) continue;
    const municipio = String(inc.municipio ?? "").trim() || "(não informado)";
    const conj = contagem.get(municipio) ?? new Set<string>();
    conj.add(chave);
    contagem.set(municipio, conj);
  }
  return [...contagem.entries()]
    .map(([municipio, conj]) => ({ municipio, empresas: conj.size }))
    .sort((a, b) => b.empresas - a.empresas || a.municipio.localeCompare(b.municipio, "pt-BR"));
}
