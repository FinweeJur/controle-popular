import { describe, it, expect } from "vitest";
import {
  DIALOGOS_CATALOGO,
  obterDialogosPorRota,
  obterTopicoDialogo,
  gerarPontesAutomaticas,
} from "./dialogos";

describe("Diálogos Inter-Frentes (Painéis-Sanfona)", () => {
  it("nenhuma rota devolve mais de 3 pontes ativas (regra editorial do portal)", () => {
    for (const dialogo of DIALOGOS_CATALOGO) {
      const pontes = obterDialogosPorRota(dialogo.rotaOrigem);
      expect(pontes.length).toBeGreaterThan(0);
      expect(pontes.length).toBeLessThanOrEqual(3);
    }
  });

  it("todas as pontes possuem razão editorial e nível de confiança declarados", () => {
    for (const dialogo of DIALOGOS_CATALOGO) {
      for (const ponte of dialogo.pontes) {
        expect(ponte.id.trim().length).toBeGreaterThan(0);
        expect(ponte.rotuloAmigavel.trim().length).toBeGreaterThan(5);
        expect(ponte.razaoEditorial.trim().length).toBeGreaterThan(15);
        expect(["fato_documentado", "sinal_investigacao"]).toContain(ponte.nivelConfianca);
        expect(ponte.rotaDestino.startsWith("/")).toBe(true);
        expect(ponte.rotaOrigem.startsWith("/")).toBe(true);
      }
    }
  });

  it("as 6 cidades iniciais possuem pontes curadas ativas", () => {
    const iniciais = ["/diamantina", "/betim", "/bh", "/aracuai", "/itinga", "/sp"];
    for (const rota of iniciais) {
      const pontes = obterDialogosPorRota(rota);
      expect(pontes.length).toBe(3);
    }
  });

  it("São Paulo conecta a mananciais, Serra da Cantareira e bancada paulista", () => {
    const pontesSp = obterDialogosPorRota("/sp");
    expect(pontesSp.length).toBe(3);

    const frentes = pontesSp.map((p) => p.frenteDestino);
    expect(frentes).toContain("ambiental");
    expect(frentes).toContain("congresso");

    const ponteMananciais = pontesSp.find((p) => p.id === "sp-mananciais-tiete");
    expect(ponteMananciais?.ressalva).toBeDefined();
  });

  it("capitais do Sudeste (Rio de Janeiro e Vitória) possuem pontes específicas", () => {
    const pontesRio = obterDialogosPorRota("/rio-de-janeiro");
    expect(pontesRio.length).toBe(3);
    expect(pontesRio.some((p) => p.rotaDestino.includes("guandu"))).toBe(true);

    const pontesVitoria = obterDialogosPorRota("/vitoria");
    expect(pontesVitoria.length).toBe(3);
    expect(pontesVitoria.some((p) => p.rotaDestino.includes("rio-doce"))).toBe(true);
  });

  it("polos do interior (Brumadinho, Mariana, Valadares, Montes Claros, Uberlândia) possuem pontes", () => {
    const polos = ["/brumadinho", "/mariana", "/governador-valadares", "/montes-claros", "/uberlandia"];
    for (const rota of polos) {
      const pontes = obterDialogosPorRota(rota);
      expect(pontes.length).toBe(3);
    }
  });

  it("Diamantina possui pontes ativas para ONSA, Executivo e Congresso", () => {
    const pontesDiamantina = obterDialogosPorRota("/diamantina");
    expect(pontesDiamantina.length).toBe(3);

    const frentesDestino = pontesDiamantina.map((p) => p.frenteDestino);
    expect(frentesDestino).toContain("ambiental");
    expect(frentesDestino).toContain("executivo_estadual");
    expect(frentesDestino).toContain("congresso");

    const ponteExecutivo = pontesDiamantina.find((p) => p.frenteDestino === "executivo_estadual");
    expect(ponteExecutivo?.ressalva).toBeDefined();
    expect(ponteExecutivo?.ressalva?.toLowerCase()).toContain("concessão");
  });

  it("Rio Paraopeba possui ponte para reparação judicial e cidades banhadas", () => {
    const pontes = obterDialogosPorRota("/ambiental/nossos-rios/rio-paraopeba");
    expect(pontes.length).toBe(3);

    const frentes = pontes.map((p) => p.frenteDestino);
    expect(frentes).toContain("paraopeba");
    expect(frentes).toContain("cidades");
  });

  it("motor de pontes automáticas gera até 3 conexões para qualquer município por código IBGE", () => {
    // Cidade hipotética sem curadoria manual (ex: código IBGE de Mário Campos: 3140159)
    const pontesAuto = gerarPontesAutomaticas("/mario-campos", "3140159", "Mário Campos");
    expect(pontesAuto.length).toBeGreaterThanOrEqual(2);
    expect(pontesAuto.length).toBeLessThanOrEqual(3);

    // Deve ter conectado com Rio Paraopeba porque intercepta a bacia
    const temParaopeba = pontesAuto.some((p) => p.rotaDestino.includes("rio-paraopeba"));
    expect(temParaopeba).toBe(true);

    // Deve ter conectado com o Congresso
    const temCongresso = pontesAuto.some((p) => p.frenteDestino === "congresso");
    expect(temCongresso).toBe(true);
  });

  it("obterTopicoDialogo devolve tópico curado ou gerado amigável", () => {
    const topicoCurado = obterTopicoDialogo("/diamantina");
    expect(topicoCurado).toContain("Biribiri");

    const topicoGenerico = obterTopicoDialogo("/cidade-nova", "Passos");
    expect(topicoGenerico).toContain("Passos");
  });

  it("rota sem pontes cadastradas e sem IBGE devolve array vazio com segurança", () => {
    const pontes = obterDialogosPorRota("/rota-que-nao-existe");
    expect(pontes).toEqual([]);
  });
});
