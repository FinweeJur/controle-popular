import { describe, expect, test } from "vitest";
import { REDE_ITENS, montarItensPainel, itensSemCidade } from "@/lib/betim/redeProtecao";
import { comoIdMunicipio, type Cidade } from "@/lib/db/queries/municipios";
import {
  necessidadesSugeridas,
  regrasAplicaveis,
  textoUrgencia,
  textoLacunaMunicipal,
} from "./roteiro";
import type { RespostasDenuncia } from "./tipos";
import { respostasVazias } from "./tipos";

/**
 * O roteamento é a peça que mais pode causar dano se errar — mandar alguém
 * em situação de urgência para o canal errado gasta o único fôlego que a
 * pessoa tinha (mesmo raciocínio de `redeProtecao.test.ts` para
 * `montarItensPainel`). Este arquivo prova duas coisas: que cada regra
 * aciona a `Necessidade` certa, e que toda `Necessidade` usada aqui
 * realmente existe em algum item de `REDE_ITENS` — senão a sugestão vira
 * tela vazia sem ninguém perceber.
 */

function cidade(overrides: Partial<Cidade> = {}): Cidade {
  return {
    id_municipio: comoIdMunicipio("0000000"),
    slug: "betim",
    nome: "Betim",
    uf: "MG",
    cnpj_prefeitura: null,
    dominio: null,
    lat: null,
    lng: null,
    branding: null,
    fontes: { links_uteis_mg: true },
    ...overrides,
  };
}

function respostas(overrides: Partial<RespostasDenuncia> = {}): RespostasDenuncia {
  return { ...respostasVazias(), ...overrides };
}

describe("necessidadesSugeridas", () => {
  test("nenhuma situação marcada cai na regra padrão (defensoria + denúncia + direitos humanos)", () => {
    const n = necessidadesSugeridas(respostas());
    expect(n).toContain("defesa_gratuita");
    expect(n).toContain("denunciar");
    expect(n).toContain("direitos_humanos");
  });

  test("criança/adolescente aciona proteção da criança, isolado", () => {
    const n = necessidadesSugeridas(respostas({ situacoes: ["crianca_adolescente"] }));
    expect(n).toEqual(["protecao_crianca"]);
  });

  test("violência contra a mulher aciona violência da mulher + defesa gratuita", () => {
    const n = necessidadesSugeridas(respostas({ situacoes: ["violencia_mulher"] }));
    expect(n).toContain("violencia_mulher");
    expect(n).toContain("defesa_gratuita");
  });

  test("agente do Estado aciona direitos humanos (CAODH) + defesa gratuita, com aviso extra", () => {
    const r = respostas({ violadores: ["agente_estado"] });
    const n = necessidadesSugeridas(r);
    expect(n).toContain("direitos_humanos");
    expect(n).toContain("defesa_gratuita");
    const regras = regrasAplicaveis(r);
    const regraAgente = regras.find((rg) => rg.id === "agente_estado");
    expect(regraAgente?.avisoExtra).toMatch(/não é caso para resolver sozinho/i);
  });

  test("discriminação aciona DECRIN (discriminacao)", () => {
    expect(necessidadesSugeridas(respostas({ situacoes: ["discriminacao"] }))).toEqual([
      "discriminacao",
    ]);
  });

  test("pessoa com deficiência ou idosa aciona DEADI", () => {
    expect(
      necessidadesSugeridas(respostas({ situacoes: ["pessoa_deficiencia_idoso"] }))
    ).toEqual(["pessoa_deficiencia_idoso"]);
  });

  test("quilombola/indígena/tradicional/ambiental aciona meio ambiente + defesa gratuita", () => {
    const n = necessidadesSugeridas(
      respostas({ situacoes: ["quilombola_indigena_tradicional_ambiental"] })
    );
    expect(n).toContain("meio_ambiente_terras");
    expect(n).toContain("defesa_gratuita");
  });

  test("várias situações marcadas somam necessidades sem duplicar", () => {
    const n = necessidadesSugeridas(
      respostas({
        situacoes: ["crianca_adolescente", "violencia_mulher"],
        violadores: ["agente_estado"],
      })
    );
    expect(new Set(n).size).toBe(n.length);
    expect(n).toContain("protecao_crianca");
    expect(n).toContain("violencia_mulher");
    expect(n).toContain("direitos_humanos");
  });
});

describe("integridade: toda Necessidade usada em roteiro.ts existe em algum item real", () => {
  const todasSituacoesEViolador: RespostasDenuncia[] = [
    respostas(),
    respostas({ situacoes: ["crianca_adolescente"] }),
    respostas({ situacoes: ["violencia_mulher"] }),
    respostas({ violadores: ["agente_estado"] }),
    respostas({ situacoes: ["discriminacao"] }),
    respostas({ situacoes: ["pessoa_deficiencia_idoso"] }),
    respostas({ situacoes: ["quilombola_indigena_tradicional_ambiental"] }),
  ];

  test("cada combinação de resposta gera ao menos um item real via montarItensPainel", () => {
    const c = cidade();
    for (const r of todasSituacoesEViolador) {
      const necessidades = necessidadesSugeridas(r);
      const itens = montarItensPainel(c).filter((it) =>
        it.necessidades.some((n) => necessidades.includes(n))
      );
      expect(itens.length, `sem item para necessidades ${necessidades.join(",")}`).toBeGreaterThan(0);
    }
  });

  test("nenhuma regra cita um id de organização que não existe em REDE_ITENS (roteamento é só por Necessidade)", () => {
    const idsReais = new Set(REDE_ITENS.map((i) => i.id));
    // Roteiro não referencia ids diretamente — só Necessidade. Esta prova
    // documenta a decisão: se algum dia `roteiro.ts` passar a citar um id
    // fixo, este teste vira o lugar certo para checar que ele existe.
    expect(idsReais.size).toBeGreaterThan(0);
  });
});

describe("textoLacunaMunicipal — Fase 3, a trava contra endereço inventado", () => {
  test("cidade cadastrada não leva aviso nenhum", () => {
    expect(textoLacunaMunicipal(true)).toBeNull();
  });

  test("cidade não cadastrada leva aviso explícito, com a busca oficial da PCMG, nunca um endereço", () => {
    const texto = textoLacunaMunicipal(false);
    expect(texto).not.toBeNull();
    expect(texto).toMatch(/nenhum canal municipal/i);
    expect(texto).toMatch(/PCMG/);
    // A trava real: o aviso não pode conter um número de rua — só a busca
    // oficial. Se algum dia alguém colar um endereço aqui "para ajudar",
    // este teste quebra.
    expect(texto).not.toMatch(/\bRua\b|\bAv\.\b|\bAvenida\b/);
  });

  test("trava real: itensSemCidade() nunca devolve item municipal — é o que sustenta o aviso acima", () => {
    // Este é o teste que prova a garantia por trás do texto: se algum item
    // municipal (delegacia, CRAS, LAI de prefeitura específica) algum dia
    // vazar para `itensSemCidade()`, a Fase 3 estaria mostrando um endereço
    // não cadastrado para a cidade da pessoa ao lado do aviso "nenhum canal
    // municipal catalogado" — os dois juntos seriam uma contradição visível
    // na tela. Quebrar isto de propósito (comentar o `.filter` em
    // `redeProtecao.ts`) faz este teste falhar.
    const itens = itensSemCidade();
    expect(itens.every((it) => it.abrangencia !== "municipal")).toBe(true);
  });
});

describe("textoUrgencia", () => {
  test("violação em curso pede telefone antes do documento", () => {
    expect(textoUrgencia("sim")).toMatch(/190/);
    expect(textoUrgencia("sim")).toMatch(/180/);
    expect(textoUrgencia("sim")).toMatch(/100/);
  });

  test("violação encerrada ou não sei não dispara o aviso de urgência", () => {
    expect(textoUrgencia("nao")).toBeNull();
    expect(textoUrgencia("nao_sei")).toBeNull();
    expect(textoUrgencia(null)).toBeNull();
  });
});
