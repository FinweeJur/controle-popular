import { describe, expect, it } from "vitest";
import centroides from "@/data/municipios-centroides.json";
import { CALENDARIO_LUTAS } from "./calendario";
import type { EntradaCalendario } from "./tipos";
import {
  DEFINICOES_LOCAIS,
  LOCAIS,
  coberturaDeLocais,
  detectarLocal,
  localDaEntrada,
} from "./locais";

/**
 * O gazetteer da memória. Dois riscos aqui, e os dois viram teste:
 *
 *  1. **toda coordenada confere com o IBGE** — as coordenadas estão embutidas no
 *     módulo (para ele ficar leve no chunk da home), mas quem manda é
 *     `municipios-centroides.json`. O teste compara as duas pontas: erro de
 *     digitação vira falha, não lugar errado no mapa.
 *  2. **"onde" falso é dano.** Palavra comum não pode ancorar um fato no lugar
 *     errado, então os termos ambíguos ficam fora e o teste afirma o NÃO.
 */
const CENTROIDES = centroides as unknown as Record<string, [number, number]>;
const verbo = (p: Partial<EntradaCalendario>) => p as EntradaCalendario;

const slug = (nome: string, uf: string) =>
  `${nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")}_${uf.toLowerCase()}`;

describe("gazetteer", () => {
  it("toda definição existe no módulo resolvido", () => {
    expect(LOCAIS.length).toBe(DEFINICOES_LOCAIS.length);
  });

  it("toda coordenada embutida confere com o centróide do IBGE", () => {
    for (const def of DEFINICOES_LOCAIS) {
      const ibge = CENTROIDES[slug(def.municipioIbge, def.uf)];
      expect(ibge, `IBGE não tem ${def.municipioIbge}/${def.uf}`).toBeTruthy();
      // ~0,05° ≈ 5 km: suficiente para pegar troca de município ou de sinal.
      expect(Math.abs(ibge[0] - def.lat)).toBeLessThan(0.05);
      expect(Math.abs(ibge[1] - def.lon)).toBeLessThan(0.05);
    }
  });
});

describe("detectarLocal", () => {
  it("casa o movimento e devolve o lugar com contexto", () => {
    const l = detectarLocal("A Inconfidência Mineira foi uma conspiração");
    expect(l?.nome).toBe("Ouro Preto (Vila Rica)");
    expect(l?.uf).toBe("MG");
    expect(l?.ctx).toBe("inconfidencia-mineira");
  });

  it("casa sem acento e em qualquer caixa", () => {
    expect(detectarLocal("a CABANAGEM no para")?.uf).toBe("PA");
    expect(detectarLocal("guerra do contestado")?.uf).toBe("SC");
  });

  it("não casa palavra ambígua (onde falso é dano)", () => {
    expect(detectarLocal("os palmares de buriti cobriam a várzea")).toBeNull();
    expect(detectarLocal("os males da seca e os farrapos de pano")).toBeNull();
    expect(detectarLocal("o capataz usava uma chibata de couro")).toBeNull();
    expect(detectarLocal("os alfaiates da rua costuravam")).toBeNull();
    expect(detectarLocal("o território foi contestado pelos vizinhos")).toBeNull();
  });

  it("texto vazio não casa", () => {
    expect(detectarLocal()).toBeNull();
    expect(detectarLocal(undefined, null, "")).toBeNull();
  });

  it("prefere o termo mais longo (mais específico)", () => {
    const l = detectarLocal("Revolta de Vila Rica e depois a Inconfidência");
    expect(l?.ctx).toBe("revolta-de-vila-rica");
  });
});

describe("localDaEntrada e cobertura", () => {
  it("lê o campo `lugar` e também o texto do verbete", () => {
    expect(localDaEntrada(verbo({ lugar: "Canudos" }))?.uf).toBe("BA");
    expect(localDaEntrada(verbo({ titulo: "A Cabanagem" }))?.uf).toBe("PA");
    expect(localDaEntrada(verbo({ titulo: "Um fato sem lugar" }))).toBeNull();
  });

  it("mede a cobertura do acervo (declarada, não maquiada)", () => {
    const c = coberturaDeLocais(CALENDARIO_LUTAS);
    expect(c.total).toBe(CALENDARIO_LUTAS.length);
    // O gazetteer é curado: cobre os movimentos inequívocos, não o acervo
    // inteiro. A maior parte fica sem lugar, e isso é publicado na tela.
    expect(c.comLocal).toBeGreaterThan(0);
    expect(c.comLocal).toBeLessThan(c.total);
    for (const p of c.porLocal) expect(p.nome.length).toBeGreaterThan(0);
  });
});
