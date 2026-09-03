import { describe, it, expect } from "vitest";
import {
  carregarInspecoesDefensoria,
  listarOrgaosInspecionados,
  obterEstatisticasJudiciario,
  obterDadosDefensoriaMG,
  obterOrgaoPorSigla,
} from "./inspecoes-defensoria";

describe("transparência do Judiciário e Defensoria (PLANO-TRANSPARENCIA-JUSTICA.md)", () => {
  it("carrega estatísticas consolidadas das inspeções do CNJ e Defensoria", () => {
    const totais = obterEstatisticasJudiciario();
    expect(totais.total_relatorios_cnj).toBe(343);
    expect(totais.orgaos_correcionados).toBe(33);
    expect(totais.total_comarcas_mg).toBe(298);
    expect(totais.comarcas_com_defensoria_mg).toBe(120);
    expect(totais.deficit_comarcas_mg_percentual).toBe(59.7);
  });

  it("recupera o relatório e achados detalhados do TJMG", () => {
    const tjmg = obterOrgaoPorSigla("TJMG");
    expect(tjmg).toBeDefined();
    expect(tjmg?.nome).toBe("Tribunal de Justiça de Minas Gerais");
    expect(tjmg?.total_relatorios).toBe(13);
    expect(tjmg?.ultimo_relatorio_ano).toBe(2026);
    expect(tjmg?.paginas_ultimo_relatorio).toBe(1388);
    expect(tjmg?.achados_destaque.length).toBeGreaterThanOrEqual(4);
  });

  it("analisa o déficit histórico da Defensoria Pública por comarca", () => {
    const def = obterDadosDefensoriaMG();
    expect(def.total_comarcas).toBe(298);
    expect(def.atendidas_presencialmente).toBe(120);
    expect(def.nao_atendidas).toBe(176);
    expect(def.evolucao_historica.length).toBe(3);

    const comarcas = def.comarcas_desassistidas_destaque;
    expect(comarcas.some((c) => c.comarca === "Águas Formosas")).toBe(true);
  });
});
