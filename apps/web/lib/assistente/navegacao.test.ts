import { describe, it, expect } from "vitest";
import { interpretar, LIMITE_CANDIDATOS } from "./navegacao";
import { CIDADES, ROTAS_GERAIS, SUFIXOS_DE_CIDADE } from "./catalogo";

/**
 * Os testes deste arquivo pesam de propósito para o lado do VAZIO.
 *
 * A funcionalidade só é útil se ela puder recusar: um assistente de
 * navegação que sempre devolve alguma coisa é um gerador de palpites com
 * cara de resposta. Por isso `descreve("nao adivinha")` é o bloco maior, e
 * cada caso lá é uma frase que um leitor real digitaria.
 *
 * Nenhum teste toca banco nem rede — `interpretar()` é função pura sobre um
 * catálogo congelado no módulo.
 */

const hrefs = (texto: string) => interpretar(texto).map((c) => c.destino.href);

describe("interpretar — navega", () => {
  it("saude em BH vai para a pagina de saude de BH", () => {
    expect(hrefs("saúde em BH")).toEqual(["/bh/saude"]);
  });

  it("abrir Betim no mapa oferece as terras de Betim e o globo 3D", () => {
    // Duas respostas legitimas para a mesma frase, e por isso duas opcoes:
    // a camada de terras da cidade e o mapa geral. Escolher uma sozinho
    // seria exatamente o palpite que o N8 proibe.
    expect(hrefs("abrir Betim no mapa")).toEqual(["/betim/terras", "/funcaosocialterra/mapa"]);
  });

  it("cidade nomeada sem assunto devolve a capa daquela cidade", () => {
    expect(hrefs("abrir Diamantina")).toEqual(["/diamantina"]);
  });

  it("rota mais funda ganha da rasa quando as duas empatam em pontos", () => {
    // "licitacoes" e "prefeitura" casam com uma palavra cada. A pagina que a
    // pessoa escreveu por extenso vem primeiro; o menu vem depois.
    expect(hrefs("licitações da prefeitura de Betim")[0]).toBe("/betim/prefeitura/licitacoes");
  });

  it("assunto de cidade sem cidade vira uma opcao por cidade atendida", () => {
    // A resposta honesta para "contratos" e "em qual cidade?", feita de
    // botoes — nao a escolha de uma cidade por nossa conta.
    const r = hrefs("contratos");
    expect(r).toHaveLength(CIDADES.length);
    expect(new Set(r)).toEqual(new Set(CIDADES.map((c) => `/${c.slug}/prefeitura/contratos`)));
  });

  it("termo de duas palavras ganha do termo de uma", () => {
    // "meio ambiente" (2 pontos) acima de qualquer casamento de 1 palavra.
    expect(hrefs("meio ambiente em Betim")[0]).toBe("/betim/meio-ambiente");
  });

  it("acha rota geral sem cidade nenhuma", () => {
    expect(hrefs("parlamentares")).toEqual(["/congresso/parlamentares"]);
  });

  it("nunca passa do teto de candidatos", () => {
    // "mapa" casa com a camada de terras das 6 cidades mais o globo geral.
    expect(interpretar("mapa").length).toBeLessThanOrEqual(LIMITE_CANDIDATOS);
  });
});

describe("interpretar — acento e caixa", () => {
  it("com acento e sem acento dao o mesmo resultado", () => {
    expect(hrefs("saúde em BH")).toEqual(hrefs("saude em bh"));
    expect(hrefs("educação em São Paulo")).toEqual(hrefs("educacao em sao paulo"));
  });

  it("caixa alta, baixa e misturada dao o mesmo resultado", () => {
    expect(hrefs("SAÚDE EM BH")).toEqual(hrefs("saúde em bh"));
    expect(hrefs("LiCiTaÇõEs Em BeTiM")).toEqual(hrefs("licitações em betim"));
  });

  it("cedilha e til no nome da cidade casam nas duas grafias", () => {
    // Araçuaí e o caso que quebra normalizacao escrita a mao: c-cedilha
    // seguido de i-agudo. As duas grafias tem de chegar na mesma cidade.
    expect(hrefs("saúde em Araçuaí")).toEqual(["/aracuai/saude"]);
    expect(hrefs("saude em aracuai")).toEqual(["/aracuai/saude"]);
  });

  it("nome por extenso e apelido chegam na mesma cidade", () => {
    expect(hrefs("saúde em Belo Horizonte")).toEqual(["/bh/saude"]);
    expect(hrefs("saúde em beagá")).toEqual(["/bh/saude"]);
    expect(hrefs("saúde em sampa")).toEqual(["/sp/saude"]);
  });

  it("grafia mais longa da cidade ganha da mais curta", () => {
    // "sao paulo" (2 palavras) e mais especifico que o slug "sp" (1).
    expect(hrefs("contratos em São Paulo")).toEqual(["/sp/prefeitura/contratos"]);
  });
});

describe("interpretar — nao adivinha", () => {
  it("texto vazio ou so espaco devolve nada", () => {
    expect(interpretar("")).toEqual([]);
    expect(interpretar("   ")).toEqual([]);
    expect(interpretar("\n\t")).toEqual([]);
  });

  it("saudacao e conversa fiada devolvem nada", () => {
    expect(interpretar("bom dia, tudo bem?")).toEqual([]);
    expect(interpretar("oi")).toEqual([]);
    expect(interpretar("kkkkk")).toEqual([]);
    expect(interpretar("valeu, era só isso")).toEqual([]);
  });

  it("pontuacao e simbolos sozinhos devolvem nada", () => {
    expect(interpretar("???")).toEqual([]);
    expect(interpretar("!!! ... ---")).toEqual([]);
  });

  it("CIDADE QUE O PORTAL NAO ATENDE devolve nada, nao outra cidade", () => {
    // O caso que a guarda de lugar existe para pegar. Sem ela, "saude" casa
    // com a rota de saude das 6 cidades e a resposta seriam 6 botoes,
    // nenhum deles Uberlandia — o assistente teria trocado a cidade da
    // pergunta em silencio.
    expect(interpretar("saúde em Uberlândia")).toEqual([]);
    expect(interpretar("contratos de Contagem")).toEqual([]);
    expect(interpretar("licitações em Ouro Preto")).toEqual([]);
  });

  it("cidade parecida com uma atendida nao vira a atendida", () => {
    // "Sao Joao del Rei" comeca com a mesma palavra que "Sao Paulo".
    // Exigir sequencia contigua e o que impede o "sao" solto de mandar a
    // pessoa para a capital paulista.
    expect(interpretar("contratos em São João del Rei")).toEqual([]);
    expect(interpretar("saúde em Belo Vale")).toEqual([]);
  });

  it("nome de cidade nao atendida sozinho devolve nada", () => {
    expect(interpretar("Uberlândia")).toEqual([]);
    expect(interpretar("Rio de Janeiro")).toEqual([]);
  });

  it("assunto que o portal nao cobre devolve nada", () => {
    expect(interpretar("previsão do jogo do Cruzeiro")).toEqual([]);
    expect(interpretar("receita de bolo de fubá")).toEqual([]);
  });

  it("numero depois de preposicao e filtro, nao lugar desconhecido", () => {
    // "contratos de 2024" continua respondendo: 2024 e recorte de tempo, e
    // tratar todo numero como lugar calaria a pergunta boa.
    expect(hrefs("contratos de 2024").length).toBeGreaterThan(0);
  });

  it("possessivo e generico depois de preposicao nao calam a resposta", () => {
    expect(hrefs("saúde na minha cidade").length).toBeGreaterThan(0);
    expect(hrefs("contratos do meu município").length).toBeGreaterThan(0);
  });
});

describe("catalogo", () => {
  it("todo href gerado comeca com barra e nao tem barra dupla", () => {
    // `href` vai em `<a>` cru (ver o cabecalho de catalogo.ts). Barra dupla
    // ou caminho relativo aqui viraria link quebrado so em producao.
    const amostra = [
      ...hrefs("saúde em BH"),
      ...hrefs("contratos"),
      ...hrefs("parlamentares"),
      ...hrefs("barragens em Betim"),
      ...hrefs("mapa"),
    ];
    expect(amostra.length).toBeGreaterThan(0);
    for (const h of amostra) {
      expect(h.startsWith("/")).toBe(true);
      expect(h).not.toContain("//");
    }
  });

  it("nenhum titulo do catalogo afirma dado", () => {
    // O assistente navega; ele nao diz numero. Titulo com digito seria uma
    // contagem congelada no bundle, envelhecendo em silencio — a mesma
    // regra de REGRAS_COMUNS em lib/chat-comum.ts.
    for (const e of [...SUFIXOS_DE_CIDADE, ...ROTAS_GERAIS]) {
      expect(e.titulo).not.toMatch(/\d/);
    }
  });

  it("nenhum sufixo de cidade colide com outro", () => {
    const vistos = new Set<string>();
    for (const e of SUFIXOS_DE_CIDADE) {
      expect(vistos.has(e.sufixo)).toBe(false);
      vistos.add(e.sufixo);
    }
  });

  it("interpretar e barato o bastante para rodar a cada tecla", () => {
    // O componente chama isto a cada digitacao. Medir aqui e o que impede
    // alguem de acrescentar 5 mil entradas no catalogo sem perceber o custo.
    const inicio = performance.now();
    for (let i = 0; i < 200; i++) interpretar("licitações da prefeitura de Betim em 2024");
    const porChamada = (performance.now() - inicio) / 200;
    expect(porChamada).toBeLessThan(5);
  });
});
