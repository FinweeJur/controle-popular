import { describe, expect, test } from "vitest";

import {
  APELIDOS,
  TABELAS,
  arquivoRepasse,
  centavosDe,
  indiceDaMalha,
  inteiroDe,
  lerPaginaRepasse,
  malhaMinas,
  normalizarNome,
  repasseDoMunicipio,
  textoDaCelula,
  validarPaginaRepasse,
  type FonteTabela,
} from "./repasse";

/**
 * Estes testes rodam sobre o ARQUIVO REAL (`data/repasse-brumadinho-mg.json`,
 * 853 municípios, versionado) — mesma escolha de `lib/comunicabr/mg.test.ts`,
 * e pela mesma razão: o que está sendo travado não é aritmética, é a
 * afirmação da tela sobre para onde foi R$ 1,65 bilhão de dinheiro público.
 *
 * Cada `describe` abaixo é uma armadilha medida na fonte em 15/08/2026. Neste
 * repositório a armadilha vira teste, não comentário: comentário não falha
 * quando alguém mexe.
 *
 * Se o arquivo sumir, os testes FALHAM em vez de passar vazios.
 */

const arq = arquivoRepasse();

/* ══════════════════ o acervo, e os três totais ══════════════════ */

describe("o arquivo tem as três tabelas e os totais fecham", () => {
  test("853 municípios distintos, nenhum sem rateio", () => {
    expect(arq).not.toBeNull();
    expect(arq!.municipios.length).toBe(853);
    expect(arq!.municipios.filter((m) => !m.rateio).length).toBe(0);
    // Códigos IBGE distintos: se dois nomes casassem com a mesma cidade, o
    // dinheiro de um deles teria sido somado no outro sem ninguém notar.
    expect(new Set(arq!.municipios.map((m) => m.ibge7)).size).toBe(853);
  });

  test("os três repasses têm 853 / 142 / 219 municípios", () => {
    const por = new Map(arq!.tabelas.map((t) => [t.fonte, t]));
    expect(por.get("rateio")!.municipios).toBe(853);
    expect(por.get("segov38")!.municipios).toBe(142);
    expect(por.get("segov28")!.municipios).toBe(219);
  });

  /**
   * Em centavos, e não em reais: 853 somas em ponto flutuante que fecham hoje
   * podem não fechar depois de uma linha nova. O TOTAL impresso na página é a
   * única testemunha independente de que o parser leu a coluna certa — um
   * seletor errado devolve linhas plausíveis, e só o total denuncia.
   */
  test("os totais somam R$ 1.645.796.000,00, medido linha a linha", () => {
    const por = new Map(arq!.tabelas.map((t) => [t.fonte, t.centavos]));
    expect(por.get("rateio")).toBe(149_825_000_000);
    expect(por.get("segov38")).toBe(5_930_000_000);
    expect(por.get("segov28")).toBe(8_824_600_000);
    expect(arq!.totalCentavos).toBe(164_579_600_000);

    const somado = arq!.municipios.reduce((a, m) => a + m.centavos, 0);
    expect(somado).toBe(arq!.totalCentavos);
  });

  test("as três parcelas de cada cidade somam o total dela", () => {
    for (const m of arq!.municipios) {
      const p = m.rateio!.parcelas.reduce((a, b) => a + b, 0);
      expect(p, `${m.nome} (${m.ibge7})`).toBe(m.rateio!.centavos);
    }
    // 40% / 30% / 30% no agregado, como a própria página rotula as colunas.
    const soma = (i: number) =>
      arq!.municipios.reduce((a, m) => a + m.rateio!.parcelas[i], 0);
    expect(soma(0)).toBe(59_930_000_000);
    expect(soma(1)).toBe(44_947_500_000);
    expect(soma(2)).toBe(44_947_500_000);
  });

  test("361 cidades receberam complementar, e nenhuma recebeu as duas", () => {
    const comp = arq!.municipios.filter((m) => m.complementares.length > 0);
    expect(comp.length).toBe(361); // 142 + 219, sem interseção
    expect(comp.filter((m) => m.complementares.length > 1).length).toBe(0);
  });

  /**
   * A base legal viaja junto com o valor. São três repasses distintos, com
   * três normas distintas; um número sozinho na tela vira "Brumadinho mandou
   * R$ X para esta cidade" sem dizer por qual lei, e é a lei que diz no que
   * pode ser gasto.
   */
  test("todo valor complementar carrega a norma que o criou", () => {
    for (const m of arq!.municipios) {
      for (const c of m.complementares) {
        expect(c.baseLegal).toBe(TABELAS[c.fonte as FonteTabela].baseLegal);
        expect(c.baseLegal).toMatch(/Resolução SEGOV nº (28|38)/);
      }
    }
    expect(TABELAS.rateio.baseLegal).toContain("23.830/2021");
  });

  test("a data que a fonte declara é 11/08/2026", () => {
    expect(arq!.atualizado_na_fonte).toBe("2026-08-11");
  });
});

/* ══════════ ARMADILHA 1 — casar por nome pega a cidade errada ══════════ */

describe("armadilha 1: o nome não é chave, o código IBGE é", () => {
  /**
   * A fonte não publica código IBGE. A grafia muda entre as três tabelas e
   * dentro da mesma tabela: 361 nomes em CAIXA ALTA, 44 de 142 acentuados na
   * tabela 2, ZERO de 219 na tabela 3. Este teste é a medição, congelada.
   */
  test("normalizar resolve caixa, acento, hífen e apóstrofo", () => {
    expect(normalizarNome("São Tomé das Letras")).toBe("SAO TOME DAS LETRAS");
    expect(normalizarNome("SAO TOME DAS LETRAS")).toBe("SAO TOME DAS LETRAS");
    expect(normalizarNome("CARMÉSIA")).toBe(normalizarNome("CARMESIA"));
    expect(normalizarNome("ANGELANDIA")).toBe(normalizarNome("Angelândia"));
    expect(normalizarNome("Olhos-d'Água")).toBe("OLHOS D AGUA");
    expect(normalizarNome("  Belo   Horizonte ")).toBe("BELO HORIZONTE");
  });

  /**
   * O casamento é UM-PARA-UM: 853 nomes normalizados, 853 chaves. Se dois
   * municípios de Minas colidissem depois de perder o acento, normalizar
   * deixaria de ser seguro e passaria a ser a própria armadilha.
   */
  test("nenhum dos 853 nomes de Minas colide depois de normalizado", () => {
    const malha = malhaMinas();
    expect(malha.length).toBe(853);
    expect(new Set(malha.map((m) => normalizarNome(m.nome))).size).toBe(853);
  });

  /**
   * Cinco grafias em 1.214 linhas não são nome de município de Minas. Elas
   * estão resolvidas à mão, com o código escrito por extenso, e NÃO por
   * similaridade — `"CÓRREGO DANTAS"` tem três vizinhos plausíveis em Minas
   * (Córrego do Bom Jesus, Córrego Fundo, Córrego Novo) e uma distância de
   * edição escolheria entre eles sozinha, num arquivo que move meio milhão de
   * reais por linha.
   */
  test("as cinco grafias divergentes são resolvidas à mão, não por aproximação", () => {
    expect(Object.keys(APELIDOS).length).toBe(5);
    expect(APELIDOS["SAO THOME DAS LETRAS"]).toBe("3165206"); // IBGE: São Tomé
    expect(APELIDOS["DONA EUSEBIA"]).toBe("3122900"); // IBGE: Dona Euzébia
    expect(APELIDOS["AMPARO DA SERRA"]).toBe("3102506"); // IBGE: Amparo do Serra
    expect(APELIDOS["SANTA RITA DO IBITIPOCA"]).toBe("3159407"); // IBGE: de Ibitipoca
    expect(APELIDOS["CORREGO DANTAS"]).toBe("3119807"); // IBGE: Córrego Danta

    // Toda chave está normalizada e todo alvo é um dos 853 — apelido que
    // aponta para código inexistente entraria calado no índice.
    const codigos = new Set(malhaMinas().map((m) => m.ibge7));
    for (const [grafia, ibge7] of Object.entries(APELIDOS)) {
      expect(normalizarNome(grafia)).toBe(grafia);
      expect(codigos.has(ibge7), grafia).toBe(true);
    }
  });

  /**
   * A prova de que os apelidos são NECESSÁRIOS, e não decoração: sem eles,
   * cinco linhas ficariam de fora. O teste falha se alguém "limpar" a lista.
   */
  test("sem os apelidos, cinco linhas da fonte não casariam", () => {
    const malha = malhaMinas();
    const soNome = new Set(malha.map((m) => normalizarNome(m.nome)));
    const divergentes = Object.keys(APELIDOS).filter((g) => !soNome.has(g));
    expect(divergentes.length).toBe(5);

    // E com eles, o índice cobre as 858 grafias (853 + 5).
    expect(indiceDaMalha(malha).size).toBe(858);
  });

  /**
   * O contrato do coletor: o que não casa é RELATADO, não aproximado. Hoje a
   * lista está vazia porque as cinco divergências têm apelido — mas o campo
   * existe, e o teste garante que, quando ele encher, cada recusa chega com
   * motivo em vez de sumir.
   */
  test("o que não casar vai para `naoCasaram` com motivo, e hoje não sobrou nada", () => {
    expect(arq!.naoCasaram).toEqual([]);
    for (const r of arq!.naoCasaram as { motivo: string; nomeNaFonte: string }[]) {
      expect(r.motivo.length).toBeGreaterThan(20);
      expect(r.nomeNaFonte).toBeTruthy();
    }
    // Todas as 1.214 linhas viraram dinheiro atribuído a alguma cidade:
    // 853 + 142 + 219 valores, e nada perdido no caminho.
    const linhas = arq!.municipios.reduce(
      (a, m) => a + (m.rateio ? 1 : 0) + m.complementares.length,
      0
    );
    expect(linhas).toBe(853 + 142 + 219);
  });

  test("o nome como a fonte escreveu fica gravado, para auditar o casamento", () => {
    const stl = arq!.municipios.find((m) => m.ibge7 === "3165206")!;
    expect(stl.nome).toBe("São Tomé das Letras"); // o do IBGE vai para a tela
    expect(stl.nomeNaFonte).toBe("São Thomé das Letras"); // o da fonte fica no arquivo
  });
});

/* ═════════ ARMADILHA 2 — 7 dígitos no IBGE, 6 no ComunicaBR ═════════ */

describe("armadilha 2: o código de 6 dígitos é de outra numeração", () => {
  /**
   * ⚠️ **Este teste existe porque o exemplo da armadilha circula ERRADO.**
   *
   * A anotação que abriu esta rodada dizia "Betim é `3106200` (7) e `310670`
   * (6)". `3106200` é **Belo Horizonte**. O código de Betim é `3106705`, e é
   * dele que sai `310670`, tirando o dígito verificador.
   *
   * O erro atravessou o enunciado inteiro sem ninguém tropeçar — dois códigos
   * de sete dígitos começados em `3106` ocupam o mesmo lugar na frase, e
   * ninguém decora código de município. Quem o pegou foi este teste, por
   * comparar o código com o NOME em vez de comparar código com código.
   *
   * Por isso os dois pares ficam escritos aqui por extenso: o teste não trava
   * só a leitura do arquivo, trava a afirmação sobre qual código é de quem.
   */
  test("Betim é 3106705/310670, e Belo Horizonte é 3106200/310620", () => {
    const betim = repasseDoMunicipio("3106705");
    expect(betim).not.toBeNull();
    expect(betim!.nome).toBe("Betim");
    expect(betim!.populacao2019).toBe(439_340);
    expect(betim!.rateio!.centavos).toBe(1_500_000_000); // R$ 15 milhões
    expect("3106705".slice(0, 6)).toBe("310670"); // o de 6 é o de 7 sem o verificador

    const bh = repasseDoMunicipio("3106200");
    expect(bh!.nome).toBe("Belo Horizonte"); // NÃO é Betim
    expect("3106200".slice(0, 6)).toBe("310620");
  });

  /**
   * Recebendo 6 dígitos, LANÇA. Devolver `null` seria indistinguível de "esta
   * cidade não recebeu nada", e é assim que a troca de código vira uma tela
   * afirmando, com cara de dado, que Betim ficou de fora do rateio.
   */
  test("6 dígitos lançam, em vez de virar `null` silencioso", () => {
    expect(() => repasseDoMunicipio("310670")).toThrow(/7 dígitos/); // Betim no ComunicaBR
    expect(() => repasseDoMunicipio("310620")).toThrow(/7 dígitos/);
    expect(() => repasseDoMunicipio("")).toThrow(/7 dígitos/);
    // 7 dígitos que não existem em Minas: aí `null` é a resposta honesta.
    expect(repasseDoMunicipio("3500000")).toBeNull();
  });

  test("o arquivo não publica nenhum código de 6 dígitos", () => {
    for (const m of arq!.municipios) {
      expect(m.ibge7).toMatch(/^\d{7}$/);
      expect(m).not.toHaveProperty("ibge6");
      expect(m.ibge7.startsWith("31")).toBe(true); // Minas, sempre
    }
  });

  /**
   * A malha vem de junção EXATA entre dois arquivos do repositório, sem casar
   * nome nenhum: o prefixo de 6 do código IBGE de `risco-climatico.json` casa
   * com o `cod` de `comunicabr-31.json`. Se um dia deixar de ser 853/853, o
   * coletor aborta em vez de gravar uma malha furada.
   */
  test("a malha de Minas é 853, e cada código tem 7 dígitos", () => {
    const malha = malhaMinas();
    expect(malha.length).toBe(853);
    expect(new Set(malha.map((m) => m.ibge7)).size).toBe(853);
    for (const m of malha) expect(m.ibge7).toMatch(/^31\d{5}$/);
    expect(malha.find((m) => m.nome === "Belo Horizonte")!.ibge7).toBe("3106200");
    expect(malha.find((m) => m.nome === "Serra da Saudade")!.ibge7).toBe("3166600");
  });
});

/* ══════ ARMADILHA 3 — 302 eleitoral que vira 200 dizendo "indisponível" ══════ */

describe("armadilha 3: quem valida status grava zero e reporta sucesso", () => {
  const PAGINA_BOA = [
    "<html><body>",
    "x".repeat(60_000),
    "<h1>ACORDO JUDICIAL DE REPARAÇÃO DE BRUMADINHO</h1>",
    "<p>REPASSE AOS MUNICÍPIOS CONFORME ART. 5º E ANEXO V DA LEI Nº 23.830/2021</p>",
    "<table><tbody>",
    "<tr><td>MUNICÍPIO</td><td>POPULAÇÃO</td><td>VALOR</td><td>1ª</td><td>2ª</td><td>3ª</td></tr>",
    "<tr><td>Betim</td><td>439.340</td><td>R$ 15.000.000,00</td>",
    "<td>R$ 6.000.000,00</td><td>R$ 4.500.000,00</td><td>R$ 4.500.000,00</td></tr>",
    "<tr><td>TOTAL</td><td>&nbsp;</td><td>R$ 15.000.000,00</td>",
    "<td>R$ 6.000.000,00</td><td>R$ 4.500.000,00</td><td>R$ 4.500.000,00</td></tr>",
    "</tbody></table>",
    "<table><tbody>",
    "<tr><td>MUNICÍPIO&nbsp;</td><td>VALOR TOTAL REPASSE - PARCELA ÚNICA&nbsp;</td></tr>",
    "<tr><td><p>AGUA COMPRIDA&nbsp;</p></td><td><p>R$ 150.000,00&nbsp;</p></td></tr>",
    "<tr><td><h6>TOTAL&nbsp;</h6></td><td><h6>R$ 150.000,00&nbsp;</h6></td></tr>",
    "</tbody></table>",
    "<table><tbody>",
    "<tr><td>MUNICÍPIO&nbsp;</td><td>VALOR TOTAL REPASSE - PARCELA ÚNICA&nbsp;</td></tr>",
    "<tr><td><p>ACUCENA&nbsp;</p></td>",
    "<td><p>&nbsp;R$&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 500.000,00&nbsp;&nbsp;</p></td></tr>",
    "<tr><td><h6>TOTAL&nbsp;</h6></td>",
    "<td><h6>&nbsp;R$&nbsp;&nbsp;&nbsp; 500.000,00&nbsp;</h6></td></tr>",
    "</tbody></table>",
    "</body></html>",
  ].join("\n");

  /**
   * A tela de bloqueio eleitoral responde **200** e tem 67.514 bytes — tamanho
   * de página cheia. Só o CONTEÚDO a separa da página certa.
   */
  const PAGINA_ELEITORAL =
    "<html><head><title>Período Eleitoral | Pró-Brumadinho</title></head><body>" +
    "<p>Conteúdo indisponível durante o período eleitoral.</p>" +
    "y".repeat(66_000) +
    "</body></html>";

  test("a página de bloqueio eleitoral é recusada, apesar do 200", () => {
    expect(validarPaginaRepasse(PAGINA_ELEITORAL)).toMatch(/bloqueio eleitoral/);
    expect(() => lerPaginaRepasse(PAGINA_ELEITORAL)).toThrow(/recusada/);
  });

  test("página truncada e página sem as três tabelas também são recusadas", () => {
    expect(validarPaginaRepasse("<html></html>")).toMatch(/corpo curto/);
    const semUma = PAGINA_BOA.replace(/<table>[\s\S]*?<\/table>/, "");
    expect(validarPaginaRepasse(semUma)).toMatch(/esperava 3 tabelas, achei 2/);
  });

  test("a página boa passa e lê as três tabelas", () => {
    expect(validarPaginaRepasse(PAGINA_BOA)).toBeNull();
    const t = lerPaginaRepasse(PAGINA_BOA);
    expect(t.map((x) => x.fonte)).toEqual(["rateio", "segov38", "segov28"]);
    expect(t.map((x) => x.linhas.length)).toEqual([1, 1, 1]);
  });

  /**
   * A linha TOTAL vira `totalDeclarado`, não um município chamado "TOTAL", e o
   * cabeçalho não vira município nenhum. Um parser que contasse `<tr>` diria
   * 3 municípios onde há 1 — e o número bateria com nada.
   */
  test("cabeçalho e linha TOTAL não viram município", () => {
    const [rateio, s38, s28] = lerPaginaRepasse(PAGINA_BOA);
    expect(rateio.linhas.map((l) => l.nome)).toEqual(["Betim"]);
    expect(rateio.totalDeclarado).toBe(1_500_000_000);
    expect(s38.linhas[0].nome).toBe("AGUA COMPRIDA");
    expect(s38.totalDeclarado).toBe(15_000_000);
    // A tabela 3 escreve o valor entre uma fileira de &nbsp; — se a limpeza
    // falhar, o valor vira `null` e a linha some sem erro nenhum.
    expect(s28.linhas[0].centavos).toBe(50_000_000);
    expect(s28.totalDeclarado).toBe(50_000_000);
  });
});

/* ══════════════════ leitura de célula e de dinheiro ══════════════════ */

describe("dinheiro é lido em centavos, e o &nbsp; não passa", () => {
  test("textoDaCelula desmonta marcação e entidade", () => {
    expect(textoDaCelula("<p>AGUA COMPRIDA&nbsp;</p>")).toBe("AGUA COMPRIDA");
    expect(textoDaCelula("<td><strong>MUNIC&Iacute;PIO</strong></td>")).toContain("MUNIC");
    expect(textoDaCelula("<h6>TOTAL&nbsp;</h6>")).toBe("TOTAL");
    expect(textoDaCelula("<td>&nbsp;</td>")).toBe("");
  });

  test("centavosDe lê as três grafias de valor da própria página", () => {
    expect(centavosDe("R$ 50.000.000,00")).toBe(5_000_000_000);
    expect(centavosDe(" R$      500.000,00  ")).toBe(50_000_000);
    expect(centavosDe("R$ 1.498.250.000,00")).toBe(149_825_000_000);
    expect(centavosDe("R$ 750.000,00")).toBe(75_000_000);
    expect(centavosDe("")).toBeNull();
    expect(centavosDe("MUNICÍPIO")).toBeNull();
    expect(centavosDe("&nbsp;")).toBeNull();
  });

  test("população é inteiro, não dinheiro", () => {
    expect(inteiroDe("2.512.070")).toBe(2_512_070);
    expect(inteiroDe("781")).toBe(781);
    expect(inteiroDe("")).toBeNull();
  });
});

/* ══════════════════ o que a tela pode afirmar ══════════════════ */

describe("os extremos do rateio, que a tela não pode explicar errado", () => {
  /**
   * O rateio é proporcional à população **com piso e teto**. Belo Horizonte
   * tem 3.217× a população de Serra da Saudade e recebeu 67× mais. Uma tela
   * que dissesse "proporcional à população", sem mais, estaria errada — e
   * estes números são o que impede a frase de ser escrita.
   */
  test("BH no teto, Serra da Saudade no piso", () => {
    const bh = repasseDoMunicipio("3106200")!;
    const ssa = repasseDoMunicipio("3166600")!;
    expect(bh.rateio!.centavos).toBe(5_000_000_000); // R$ 50 mi, o teto
    expect(ssa.rateio!.centavos).toBe(75_000_000); // R$ 750 mil, o piso
    expect(bh.populacao2019! / ssa.populacao2019!).toBeGreaterThan(3_000);
    expect(bh.rateio!.centavos / ssa.rateio!.centavos).toBeLessThan(100);
  });

  test("o piso de R$ 750.000 é o valor mais comum, e ninguém recebeu menos", () => {
    const menor = Math.min(...arq!.municipios.map((m) => m.rateio!.centavos));
    expect(menor).toBe(75_000_000);
    const maior = Math.max(...arq!.municipios.map((m) => m.rateio!.centavos));
    expect(maior).toBe(5_000_000_000);
  });

  /**
   * A população somada das 853 cidades bate com a estimativa do IBGE para
   * Minas em 2019. É a testemunha de que a coluna lida é população, e não
   * outra coisa — um parser deslocado uma coluna produziria um número que
   * ninguém confere.
   */
  test("a população somada é a de Minas em 2019", () => {
    const total = arq!.municipios.reduce((a, m) => a + (m.populacao2019 ?? 0), 0);
    expect(total).toBe(21_168_791);
  });
});
