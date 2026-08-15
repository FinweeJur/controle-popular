import { fornecedoresPorCnpj } from "@/lib/db/queries/betim";
import { acervoIncentivadoresMg } from "@/lib/cultura/incentivadores-mg";
import {
  chavesParaConsulta,
  estatisticasDeChave,
  juntarPorCnpj,
  type EmpresaNosDoisAcervos,
  type EstatisticasDeChave,
  type FornecedorChaveavel,
} from "@/lib/cultura/juncao-fornecedor";

/**
 * A ligação entre o acervo da Rouanet e a tabela `fornecedores` do Postgres.
 *
 * É a única peça desta junção que toca banco, e ela existe para que a tela não
 * precise saber que há banco atrás. Funciona sozinha assim que houver
 * `DATABASE_URL`; sem ela, degrada com honestidade.
 *
 * ═══ POR QUE UM ESTADO, E NÃO UMA LISTA VAZIA ═══
 *
 * `fornecedoresPorCnpj` devolve `null` quando não há banco (`getDb()` null) —
 * e `null` do banco é indistinguível de "consultei e não achei nenhuma" se o
 * chamador colapsar os dois em `[]`. Na tela isso vira uma seção vazia que
 * PARECE resposta: "nenhuma empresa aparece nos dois acervos". Seria falso, e
 * falso na direção que mais engana, porque o leitor conclui que está limpo.
 *
 * Por isso o retorno é discriminado por `estado`. O componente escreve
 * `SEM_BANCO` no caso `sem-banco` e a lista (ainda que vazia) no caso `ok`.
 *
 * ═══ POR QUE A CONSULTA É INJETÁVEL ═══
 *
 * `buscarFornecedores` é parâmetro para que o teste exercite a junção inteira
 * sem Postgres — é o que permite ter teste dos três estados numa suíte que
 * roda offline. O padrão não é decorativo: a Neon está em HTTP 402 e não há
 * credencial local, então sem injeção esta função não teria teste nenhum.
 *
 * ═══ O NÚMERO QUE ESTA FUNÇÃO PRODUZ NÃO FOI MEDIDO ═══
 *
 * Quantas das 2.261 empresas aparecem também como fornecedoras é EXATAMENTE o
 * que só sai com banco. Nada neste arquivo estima, arredonda ou chuta esse
 * número, e o relatório também não deve: o único valor honesto até a máquina
 * de build rodar é "não medido".
 */

export type ResultadoJuncao =
  | { estado: "sem-acervo" }
  | { estado: "sem-banco"; estatisticas: EstatisticasDeChave }
  | {
      estado: "ok";
      empresas: EmpresaNosDoisAcervos[];
      estatisticas: EstatisticasDeChave;
      coletado_em: string;
    };

export async function empresasNosDoisAcervos(
  opcoes: {
    raiz?: string;
    buscarFornecedores?: (cnpjs: string[]) => Promise<FornecedorChaveavel[] | null>;
  } = {}
): Promise<ResultadoJuncao> {
  const { raiz = process.cwd(), buscarFornecedores = fornecedoresPorCnpj } = opcoes;

  const acervo = acervoIncentivadoresMg(raiz);
  if (!acervo) return { estado: "sem-acervo" };

  const estatisticas = estatisticasDeChave(acervo.incentivadores);
  const chaves = chavesParaConsulta(acervo.incentivadores);

  // Acervo sem nenhuma chave utilizável não é "sem banco": é cruzamento com
  // conjunto vazio, e a resposta correta é `ok` com lista vazia.
  if (chaves.length === 0) {
    return { estado: "ok", empresas: [], estatisticas, coletado_em: acervo.coletado_em };
  }

  const fornecedores = await buscarFornecedores(chaves);
  if (fornecedores === null) return { estado: "sem-banco", estatisticas };

  return {
    estado: "ok",
    empresas: juntarPorCnpj(acervo.incentivadores, fornecedores),
    estatisticas,
    coletado_em: acervo.coletado_em,
  };
}
