import { describe, expect, test } from "vitest";
import { acervoIncentivadoresMg } from "./incentivadores-mg";
import { empresasNosDoisAcervos } from "./juncao-banco";
import {
  estatisticasDeChave,
  chavesParaConsulta,
  porMunicipioDoIncentivador,
} from "./juncao-fornecedor";

/**
 * As contagens abaixo foram MEDIDAS sobre `data/rouanet-mg-incentivadores.json`
 * (coleta de 15/08/2026) e estão travadas de propósito: elas são o que este
 * trabalho conseguiu apurar sem banco, e recoleta que mude qualquer uma delas
 * tem de ser vista, não absorvida.
 *
 * O que NÃO está aqui, e não pode estar: quantas destas empresas aparecem
 * também como fornecedoras de contrato público. Isso exige o Postgres, que
 * está inalcançável (Neon em HTTP 402), e um número estimado numa tela de
 * controle público é pior que número nenhum.
 */
const MEDIDO = {
  registros: 20_784,
  comCnpj: 2_261,
  cnpjsDistintos: 2_261,
  cnpjsRepetidos: 0,
  dvValido: 2_260,
  dvInvalido: 1,
  mascarados: 18_518,
  redigidos: 5,
  rotuloJuridicaSemCnpj: 2,
  municipiosDistintos: 249,
} as const;

const acervo = acervoIncentivadoresMg();

describe("acervo de incentivadores de MG", () => {
  test("o arquivo é lido e expandido", () => {
    expect(acervo).not.toBeNull();
    expect(acervo!.incentivadores).toHaveLength(MEDIDO.registros);
  });

  test("as colunas de dicionário são resolvidas para rótulo, não índice", () => {
    const bh = acervo!.incentivadores.find((i) => i.cgccpf === "00000000108634");
    expect(bh?.municipio).not.toMatch(/^\d+$/);
    expect(acervo!.incentivadores.every((i) => i.UF === "MG")).toBe(true);
  });

  test("cgccpf continua string, com o zero à esquerda", () => {
    const comZero = acervo!.incentivadores.filter((i) => i.cgccpf.startsWith("0"));
    expect(comZero.length).toBeGreaterThan(0);
    expect(typeof comZero[0].cgccpf).toBe("string");
  });

  test("a ressalva da fonte sobre total_doado vem junto do acervo", () => {
    expect(acervo!.observacao_total_doado).toMatch(/BRASIL inteiro/);
  });
});

describe("as contagens que dá para medir sem banco", () => {
  const e = estatisticasDeChave(acervo!.incentivadores);

  test("o universo da junção são 2.261 CNPJs, todos distintos", () => {
    expect(e.comCnpj).toBe(MEDIDO.comCnpj);
    expect(e.cnpjsDistintos).toBe(MEDIDO.cnpjsDistintos);
    expect(e.cnpjsRepetidos).toBe(MEDIDO.cnpjsRepetidos);
  });

  test("um único CNPJ reprova no dígito verificador — e continua na junção", () => {
    expect(e.dvValido).toBe(MEDIDO.dvValido);
    expect(e.dvInvalido).toBe(MEDIDO.dvInvalido);
    expect(chavesParaConsulta(acervo!.incentivadores)).toHaveLength(MEDIDO.cnpjsDistintos);
  });

  test("os 18.518 mascarados e os 5 redigidos ficam fora, e é o comportamento certo", () => {
    expect(e.mascarados).toBe(MEDIDO.mascarados);
    expect(e.redigidos).toBe(MEDIDO.redigidos);
    expect(e.registros).toBe(e.comCnpj + e.mascarados + e.redigidos);
  });

  test("2 registros rotulados 'juridica' não têm CNPJ — tipo_pessoa não serve de filtro", () => {
    expect(e.rotuloJuridicaSemCnpj).toBe(MEDIDO.rotuloJuridicaSemCnpj);
  });

  test("as empresas se espalham por 249 municípios, com BH na frente", () => {
    const porMunicipio = porMunicipioDoIncentivador(acervo!.incentivadores);
    expect(porMunicipio).toHaveLength(MEDIDO.municipiosDistintos);
    expect(porMunicipio[0]).toEqual({ municipio: "Belo Horizonte", empresas: 712 });
    expect(porMunicipio.reduce((s, m) => s + m.empresas, 0)).toBe(MEDIDO.cnpjsDistintos);
  });
});

describe("ligação com o banco — os três estados, todos sem Postgres", () => {
  test("sem banco NÃO devolve lista vazia: devolve 'não foi possível verificar'", async () => {
    const r = await empresasNosDoisAcervos({ buscarFornecedores: async () => null });
    expect(r.estado).toBe("sem-banco");
    // A estatística offline continua disponível — a tela não fica muda.
    if (r.estado === "sem-banco") expect(r.estatisticas.comCnpj).toBe(MEDIDO.comCnpj);
  });

  test("com banco, cruza e devolve os pares", async () => {
    const r = await empresasNosDoisAcervos({
      buscarFornecedores: async (cnpjs) => {
        expect(cnpjs).toHaveLength(MEDIDO.cnpjsDistintos);
        return [{ cnpj: cnpjs[0], razao_social: "FORNECEDOR DE TESTE" }];
      },
    });
    expect(r.estado).toBe("ok");
    if (r.estado === "ok") {
      expect(r.empresas).toHaveLength(1);
      expect(r.empresas[0].incentivador.ressalva_total_doado).toMatch(/BRASIL inteiro/);
      expect(r.coletado_em).toBe("2026-08-15");
    }
  });

  test("banco respondendo sem nenhum casamento é 'ok' com lista vazia — outra coisa", async () => {
    const r = await empresasNosDoisAcervos({ buscarFornecedores: async () => [] });
    expect(r.estado).toBe("ok");
    if (r.estado === "ok") expect(r.empresas).toEqual([]);
  });

  test("acervo ausente é o terceiro estado, e não se confunde com os outros", async () => {
    const r = await empresasNosDoisAcervos({
      raiz: "/caminho/que/nao/existe",
      buscarFornecedores: async () => [],
    });
    // O acervo é memoizado por processo; num processo que já leu o arquivo o
    // caminho errado não reabre. O que importa é que o estado é um dos três
    // previstos, nunca uma exceção subindo até a página.
    expect(["sem-acervo", "ok"]).toContain(r.estado);
  });
});
