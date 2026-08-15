import { describe, expect, test } from "vitest";
import {
  cpfValido,
  temCpfValido,
  temIniciais,
  temContatoPessoal,
  temNotaDePesar,
  ehTipoPessoal,
  ehTemaSaude,
  precisaRedigirResumo,
} from "./triagem";
import { DOCUMENTOS_PROCESSO, COBERTURA_DOCUMENTOS_PROCESSO } from "./documentos";

/**
 * `scripts/checar-dado-pessoal.py` varre código-fonte, não dado ingerido em
 * massa — `docs/PLANO-INTEGRACAO-BRUMADINHO.md` (seção 3) registra a
 * lacuna. Esta régua (`triagem.ts`) é o que fecha essa lacuna para o
 * acervo de documentos da UFMG, e este arquivo prova que ela reconhece os
 * casos reais medidos na ingestão — não só os sintéticos óbvios.
 */
describe("cpfValido", () => {
  test("aceita o CPF sintético canônico do projeto (mesmo whitelisted em checar-dado-pessoal.py)", () => {
    // "123.456.789-09" é o CPF de teste padrão no Brasil, mod-11 válido, e
    // está em `SINTETICOS` do script Python especificamente para permitir
    // testar o validador sem disparar o guarda de push.
    expect(cpfValido("12345678909")).toBe(true);
  });

  test("rejeita 11 dígitos iguais", () => {
    expect(cpfValido("11111111111")).toBe(false);
  });

  test("rejeita dígito verificador errado", () => {
    expect(cpfValido("12345678900")).toBe(false);
  });

  test("rejeita string com tamanho errado", () => {
    expect(cpfValido("123456789")).toBe(false);
  });
});

describe("temCpfValido", () => {
  test("acha CPF formatado dentro de um texto maior", () => {
    expect(temCpfValido("Requerente: João, CPF 123.456.789-09, residente em...")).toBe(true);
  });

  test("não acha CPF inválido (11 dígitos que não passam no mod-11)", () => {
    expect(temCpfValido("processo 12345678901, sem nenhum CPF de verdade")).toBe(false);
  });

  test("texto vazio ou nulo não acha nada", () => {
    expect(temCpfValido(null)).toBe(false);
    expect(temCpfValido("")).toBe(false);
  });
});

describe("temIniciais", () => {
  test("acha o padrão real medido no acervo (nome reduzido a iniciais)", () => {
    expect(temIniciais("Documentos de comprovação apresentados por L.H.M.G: comprovante...")).toBe(
      true
    );
  });

  test("não confunde abreviação comum (S.A.) com iniciais de pessoa", () => {
    // "S.A." termina em PONTO seguido de espaço — o `\b` final do padrão
    // exige que o trecho termine numa letra (a última inicial, sem ponto),
    // como acontece no caso real "L.H.M.G:" abaixo. Uma sigla societária
    // que sempre fecha em ponto (S.A., Ltda.) nunca bate por causa disso —
    // efeito colateral bem-vindo do formato real medido, não ajuste feito
    // pra fazer este teste passar.
    expect(temIniciais("Vale S.A. apresentou petição")).toBe(false);
  });

  test("texto comum sem iniciais não aciona", () => {
    expect(temIniciais("Certidão de audiência realizada em Belo Horizonte")).toBe(false);
  });
});

describe("temContatoPessoal", () => {
  test("acha o caso real da ingestão (id 73161271_1): nome do desaparecido + endereço e telefone", () => {
    expect(
      temContatoPessoal(
        "Relação das famílias residentes do município de Mário Campos-MG com entes desaparecidos no rompimento da barragem, elaborada pela Prefeitura do município. O documento contém lista com nome do desaparecido, endereço e telefone para contato com algum dos familiares."
      )
    ).toBe(true);
  });

  test("menção agregada a vítimas, sem nome nem contato, não aciona", () => {
    expect(
      temContatoPessoal(
        "Ofício informando os danos ocasionados em Mário Campos, dentre os quais reporta o número de vítimas desaparecidas ou com óbito já declarado."
      )
    ).toBe(false);
  });

  test("texto vazio não aciona", () => {
    expect(temContatoPessoal(null)).toBe(false);
  });
});

describe("temNotaDePesar", () => {
  test("acha o padrão real do feed do Guaicuy: Nota de pesar + nome completo", () => {
    expect(temNotaDePesar("Nota de pesar: Maria Aparecida da Silva Santos")).toBe(true);
  });

  test("acha sem os dois-pontos", () => {
    expect(temNotaDePesar("Nota de pesar João Pereira Lima")).toBe(true);
  });

  test("nome só com uma palavra não aciona (pode ser título de evento, não pessoa)", () => {
    expect(temNotaDePesar("Nota de pesar: Vitória")).toBe(false);
  });

  test("texto comum não aciona", () => {
    expect(temNotaDePesar("Reunião da comissão em Abaeté discute repasse")).toBe(false);
  });
});

describe("ehTipoPessoal", () => {
  test.each([
    "documento de identificação",
    "Documento de Identificação",
    "comprovante de residência",
    "declaração de hipossuficiência",
  ])("exclui o tipo pessoal confirmado: %s", (tipo) => {
    expect(ehTipoPessoal(tipo)).toBe(true);
  });

  test.each(["petição", "decisão", "documentos comprobatórios", "outros documentos", "ofício"])(
    "não exclui tipo processual comum: %s",
    (tipo) => {
      expect(ehTipoPessoal(tipo)).toBe(false);
    }
  );
});

describe("precisaRedigirResumo", () => {
  test("tema saúde + tipo catch-all aciona a redação", () => {
    expect(
      precisaRedigirResumo({
        tipo: "documentos comprobatórios",
        titulo: "x",
        resumo: "Relatório médico sobre atendimento à população local.",
        temas: ["saúde da população", "meio ambiente"],
      })
    ).toBe(true);
  });

  test("tema saúde SEM tipo catch-all não aciona sozinho", () => {
    expect(
      precisaRedigirResumo({
        tipo: "ofício",
        titulo: "x",
        resumo: "Ofício sobre a rede de saúde do município.",
        temas: ["saúde da população"],
      })
    ).toBe(false);
  });

  test("documento processual comum, sem nenhum sinal de risco, não aciona", () => {
    expect(
      precisaRedigirResumo({
        tipo: "decisão",
        titulo: "Decisão judicial",
        resumo: "Decisão que mantém o pagamento do auxílio emergencial aos atingidos.",
        temas: ["trâmites processuais"],
      })
    ).toBe(false);
  });
});

/**
 * Regressão sobre o dado publicado de verdade em `documentos.ts` — não só
 * sobre casos sintéticos. Se alguém regenerar o arquivo sem rodar a
 * triagem, ou trocar a regra sem medir de novo, estes testes travam.
 */
describe("DOCUMENTOS_PROCESSO — a triagem foi aplicada, não só escrita em comentário", () => {
  test("nenhum documento publicado tem CPF válido no título ou na citação", () => {
    for (const d of DOCUMENTOS_PROCESSO) {
      const achou = temCpfValido(`${d.titulo} ${d.citacao ?? ""}`);
      expect(achou, `documento ${d.id} tem CPF válido em texto publicado`).toBe(false);
    }
  });

  test("nenhum documento publicado é de tipo pessoal", () => {
    for (const d of DOCUMENTOS_PROCESSO) {
      expect(ehTipoPessoal(d.tipo), `documento ${d.id} tem tipo pessoal: ${d.tipo}`).toBe(false);
    }
  });

  test("o caso real que motivou a régua de contato pessoal está redigido (citacao: null)", () => {
    const doc = DOCUMENTOS_PROCESSO.find((d) => d.id === "73161271_1");
    expect(doc, "documento 73161271_1 deveria estar no acervo publicado").toBeDefined();
    expect(doc?.citacao).toBeNull();
  });

  test("todo documento com tema saúde + tipo catch-all está redigido", () => {
    for (const d of DOCUMENTOS_PROCESSO) {
      if (ehTemaSaude(d.temas) && /^(documentos comprobatórios|outros documentos)$/i.test(d.tipo)) {
        expect(d.citacao, `documento ${d.id} (saúde + ${d.tipo}) deveria ter citacao null`).toBeNull();
      }
    }
  });

  test("todo documento tem link — nunca publica sem link", () => {
    for (const d of DOCUMENTOS_PROCESSO) {
      expect(d.link, `documento ${d.id} sem link`).toBeTruthy();
      expect(d.link.startsWith("http://plataforma.projetobrumadinho.ufmg.br/api/static/proceedings/frag/")).toBe(
        true
      );
    }
  });

  test("a contagem de itens redigidos bate com a cobertura declarada", () => {
    const redigidos = DOCUMENTOS_PROCESSO.filter((d) => d.citacao === null).length;
    expect(redigidos).toBe(COBERTURA_DOCUMENTOS_PROCESSO.resumosRedigidosPelaTriagem);
  });
});
