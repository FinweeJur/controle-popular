import { describe, expect, it } from "vitest";
import {
  CLASSE_ESTUDO_LABEL,
  contarPorClasseEstudo,
  contarPorRepositorio,
  dataParaOrdenacao,
  filtrarEstudos,
  opcoesDeFiltro,
  ESTADO_LINK_LABEL,
  REPOSITORIO_LABEL,
  type EstudoLinha,
} from "./estudos";

function linha(overrides: Partial<EstudoLinha> = {}): EstudoLinha {
  return {
    id_fonte: 1,
    empreendimento: "Mineração Exemplo Ltda.",
    municipio: "Conceição do Mato Dentro",
    municipios: ["Conceição do Mato Dentro"],
    municipios_ids: ["3117876"],
    unidade_regional: "Unidade Regional de Regularização Ambiental Central",
    classe: 4,
    modalidade: "LAC - LAC1 (LP+LI+LO)",
    atividades: ["Lavra a céu aberto"],
    data_publicacao: "10/03/2020",
    ano: 2020,
    data_limite: "25/03/2020",
    processo: "12345/2020/001/2020",
    link_ficha: "https://sistemas.meioambiente.mg.gov.br/licenciamento/site/view-audiencia?id=1",
    nome_arquivo: "eia-rima-exemplo.pdf",
    classe_estudo: "eia",
    classe_estudo_rotulo: "EIA",
    url: "https://drive.google.com/exemplo",
    repositorio: "drive",
    repositorio_rotulo: "Google Drive",
    data_publicacao_iso: "2020-03-10",
    data_limite_iso: "2020-03-25",
    link_repositorio: "https://drive.google.com/exemplo",
    link_estado: "ok",
    link_estado_rotulo: "Abre",
    ...overrides,
  };
}

describe("filtrarEstudos — busca por texto", () => {
  it("acha sem acento ('Conceicao' acha 'Conceição')", () => {
    const linhas = [linha({ municipio: "Conceição do Mato Dentro" })];
    expect(filtrarEstudos(linhas, { texto: "Conceicao" })).toHaveLength(1);
  });

  it("casa também contra empreendimento, nome do arquivo e processo", () => {
    const linhas = [linha()];
    expect(filtrarEstudos(linhas, { texto: "mineracao" })).toHaveLength(1);
    expect(filtrarEstudos(linhas, { texto: "eia-rima-exemplo" })).toHaveLength(1);
    expect(filtrarEstudos(linhas, { texto: "12345/2020" })).toHaveLength(1);
    expect(filtrarEstudos(linhas, { texto: "nada-a-ver" })).toHaveLength(0);
  });

  it("nome_arquivo null entra na busca como vazio, sem quebrar", () => {
    const linhas = [linha({ nome_arquivo: null })];
    expect(() => filtrarEstudos(linhas, { texto: "qualquer" })).not.toThrow();
    expect(filtrarEstudos(linhas, { texto: "qualquer" })).toHaveLength(0);
  });
});

describe("filtrarEstudos — filtros combinados", () => {
  const linhas = [
    linha({ municipio: "Betim", classe: 4, classe_estudo: "eia" }),
    linha({ municipio: "Betim", classe: 6, classe_estudo: "rima" }),
    linha({ municipio: "Brumadinho", classe: 4, classe_estudo: "eia" }),
  ];

  it("município + classe combina com E lógico", () => {
    const achados = filtrarEstudos(linhas, { municipio: "Betim", classe: 4 });
    expect(achados).toHaveLength(1);
    expect(achados[0].municipio).toBe("Betim");
    expect(achados[0].classe).toBe(4);
  });

  it("filtro vazio devolve tudo", () => {
    expect(filtrarEstudos(linhas, {})).toHaveLength(3);
  });

  it("campo undefined não filtra nada", () => {
    expect(filtrarEstudos(linhas, { municipio: undefined, texto: undefined })).toHaveLength(3);
  });
});

describe("filtrarEstudos — somenteComArquivo", () => {
  it("exclui linha com nome_arquivo null", () => {
    const linhas = [
      linha({ id_fonte: 1, nome_arquivo: "arquivo.pdf" }),
      linha({ id_fonte: 2, nome_arquivo: null }),
    ];
    const achados = filtrarEstudos(linhas, { somenteComArquivo: true });
    expect(achados).toHaveLength(1);
    expect(achados[0].id_fonte).toBe(1);
  });

  it("sem o filtro, as duas linhas aparecem — lacuna não é escondida por padrão", () => {
    const linhas = [
      linha({ id_fonte: 1, nome_arquivo: "arquivo.pdf" }),
      linha({ id_fonte: 2, nome_arquivo: null }),
    ];
    expect(filtrarEstudos(linhas, {})).toHaveLength(2);
  });
});

describe("opcoesDeFiltro", () => {
  it("não inventa valor que não está nas linhas", () => {
    const linhas = [linha({ municipio: "Betim" }), linha({ municipio: "Brumadinho" })];
    const opcoes = opcoesDeFiltro(linhas);
    expect(opcoes.municipios).toEqual(["Betim", "Brumadinho"]);
    expect(opcoes.municipios).not.toContain("Belo Horizonte");
  });

  it("não traz null nas listas de classe_estudo", () => {
    const linhas = [linha({ classe_estudo: "eia" }), linha({ classe_estudo: null })];
    const opcoes = opcoesDeFiltro(linhas);
    expect(opcoes.classesEstudo).toEqual(["eia"]);
    expect(opcoes.classesEstudo).not.toContain(null);
  });

  it("listas saem ordenadas e sem repetição", () => {
    const linhas = [
      linha({ municipio: "Sabará" }),
      linha({ municipio: "Betim" }),
      linha({ municipio: "Betim" }),
    ];
    const opcoes = opcoesDeFiltro(linhas);
    expect(opcoes.municipios).toEqual(["Betim", "Sabará"]);
  });
});

describe("dataParaOrdenacao", () => {
  it("31/12/2024 ordena DEPOIS de 01/01/2025 (não ordena por dia)", () => {
    const a = dataParaOrdenacao("31/12/2024");
    const b = dataParaOrdenacao("01/01/2025");
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect([a, b].sort()).toEqual([a, b]);
    expect(a! < b!).toBe(true);
  });

  it("converte dd/mm/aaaa para aaaa-mm-dd", () => {
    expect(dataParaOrdenacao("25/08/2018")).toBe("2018-08-25");
  });

  it("devolve null no que não casa o formato", () => {
    expect(dataParaOrdenacao("2018-08-25")).toBeNull();
    expect(dataParaOrdenacao("")).toBeNull();
    expect(dataParaOrdenacao("data inválida")).toBeNull();
  });
});

describe("contarPorRepositorio", () => {
  it("soma igual ao total de linhas", () => {
    const linhas = [
      linha({ repositorio: "drive" }),
      linha({ repositorio: "drive" }),
      linha({ repositorio: "dropbox" }),
    ];
    const cont = contarPorRepositorio(linhas);
    const soma = Object.values(cont).reduce((a, b) => a + b, 0);
    expect(soma).toBe(linhas.length);
    expect(cont.drive).toBe(2);
    expect(cont.dropbox).toBe(1);
  });
});

describe("contarPorClasseEstudo", () => {
  it("soma igual ao total de linhas, incluindo as sem classificação", () => {
    const linhas = [
      linha({ classe_estudo: "eia" }),
      linha({ classe_estudo: null }),
      linha({ classe_estudo: null }),
    ];
    const cont = contarPorClasseEstudo(linhas);
    const soma = Object.values(cont).reduce((a, b) => a + b, 0);
    expect(soma).toBe(linhas.length);
    expect(cont.eia).toBe(1);
    expect(cont.sem_classificacao).toBe(2);
  });
});

describe("rótulos", () => {
  it("REPOSITORIO_LABEL e CLASSE_ESTUDO_LABEL cobrem os valores usados nas fixtures", () => {
    expect(REPOSITORIO_LABEL.drive).toBe("Google Drive");
    expect(REPOSITORIO_LABEL.dropbox).toBe("Dropbox");
    expect(CLASSE_ESTUDO_LABEL.eia).toBe("EIA");
    expect(CLASSE_ESTUDO_LABEL.rima).toBe("RIMA");
  });
});

describe("filtro pelo estado do link", () => {
  const linhas = [
    linha({ id_fonte: 1, link_estado: "ok" }),
    linha({ id_fonte: 2, link_estado: "morto_404" }),
    linha({ id_fonte: 3, link_estado: "morto_dns" }),
    linha({ id_fonte: 4, link_estado: "bloqueado" }),
    linha({ id_fonte: 5, link_estado: "sem_resposta" }),
  ];

  it("somenteLinkQuebrado pega 404 e domínio morto — e SÓ eles", () => {
    // `bloqueado` e `sem_resposta` ficam de fora de propósito: o primeiro pode
    // existir e estar fechado, o segundo pode ser a rede de quem mediu. É o
    // mesmo recorte do pedido de LAI — se isto afrouxar, o pedido passa a
    // acusar o órgão por coisa que não se sustenta.
    const r = filtrarEstudos(linhas, { somenteLinkQuebrado: true });
    expect(r.map((l) => l.id_fonte)).toEqual([2, 3]);
  });

  it("linkEstado filtra por um estado específico", () => {
    expect(filtrarEstudos(linhas, { linkEstado: "bloqueado" })).toHaveLength(1);
  });

  it("opcoesDeFiltro lista os estados que existem, sem inventar", () => {
    const o = opcoesDeFiltro(linhas);
    expect(o.estadosDeLink).toEqual(
      ["bloqueado", "morto_404", "morto_dns", "ok", "sem_resposta"]
    );
  });

  it("todo estado presente nos dados tem rótulo humano", () => {
    for (const e of opcoesDeFiltro(linhas).estadosDeLink) {
      expect(ESTADO_LINK_LABEL[e]).toBeTruthy();
    }
  });
});
