import { describe, expect, test } from "vitest";
import {
  COBERTURA_DECISOES_CGE,
  DECISOES_CGE_POR_TIPO_ANO,
} from "./decisoes-cge";
import { lerDecisoesCgeMg } from "./decisoes-cge-dados";

/**
 * `decisoes-cge.ts` é GERADO por `scripts/coletar-decisoes-cge-mg.mts` a
 * partir de `acessoainformacao.mg.gov.br/sistema/site/busca_decisao.aspx`.
 *
 * Cada teste aqui trava uma armadilha medida ao vivo em 2026-08-21 — o
 * cabeçalho do coletor documenta a investigação completa.
 */
describe("decisões de recurso de LAI da CGE-MG", () => {
  test("zero é resultado LEGÍTIMO, não ausência — Provimento em 2020 é 0, não undefined", () => {
    // A fonte troca `lblTotal` pela mensagem "Nenhum resultado encontrado"
    // quando o filtro não acha nada. Um parser ingênuo lê isso como falha e
    // ou inventa um erro, ou pula o ano/tipo sem registrar o zero — que aqui
    // é informação (não há Provimento em 2020), não buraco de coleta.
    const ano2020 = DECISOES_CGE_POR_TIPO_ANO.find((a) => a.ano === 2020);
    expect(ano2020).toBeDefined();
    expect(ano2020?.porTipo.provimento).toBe(0);
    expect(ano2020?.porTipo.provimentoParcial).toBe(0);
    // E o ano continua batendo 100% mesmo com dois tipos zerados.
    expect(ano2020?.somaTipos).toBe(ano2020?.total);
  });

  test("a paginação real são 20 itens por página, não o que `lblPagina` sugere", () => {
    // `lblPagina` ("Página 1 de N") é um bug do site: N é o TOTAL DE
    // REGISTROS do ano, não o total de páginas — 2023 mostra "Página 1 de
    // 204" mesmo paginando de 20 em 20 (11 páginas reais). Provar isso aqui
    // é indireto: se o coletor tivesse usado N como contagem de páginas (ou
    // ficado preso relendo a página 1), a contagem por ano bateria errado.
    for (const anoInfo of DECISOES_CGE_POR_TIPO_ANO) {
      const doAno = lerDecisoesCgeMg().filter((d) => d.ano === anoInfo.ano);
      expect(doAno.length, `ano ${anoInfo.ano}`).toBe(anoInfo.total);
    }
  });

  test("a soma por tipo fecha em 2020/2021/2026 e NÃO fecha em 2022–2025 — lacuna não resolvida", () => {
    // Medido em 2026-08-21 (docs/FONTES.md e o cabeçalho do coletor). Números
    // cravados: 2023 é o ano citado por nome na docstring do arquivo gerado,
    // então este teste também garante que a docstring continua verdadeira.
    const ano2023 = DECISOES_CGE_POR_TIPO_ANO.find((a) => a.ano === 2023);
    expect(ano2023?.total).toBe(204);
    expect(ano2023?.porTipo).toEqual({
      desprovimento: 30,
      naoConhecimento: 59,
      perdaDeObjeto: 5,
      perdaParcialDeObjeto: 0,
      provimento: 3,
      provimentoParcial: 2,
    });
    expect(ano2023?.somaTipos).toBe(99);
    expect(ano2023?.semTipo).toBe(105);

    expect(COBERTURA_DECISOES_CGE.anosQueFecham).toEqual([2020, 2021, 2026]);
    expect(COBERTURA_DECISOES_CGE.anosComLacuna).toEqual([2022, 2023, 2024, 2025]);
    for (const ano of COBERTURA_DECISOES_CGE.anosQueFecham) {
      const info = DECISOES_CGE_POR_TIPO_ANO.find((a) => a.ano === ano);
      expect(info?.semTipo, `ano ${ano} deveria fechar`).toBe(0);
    }
    for (const ano of COBERTURA_DECISOES_CGE.anosComLacuna) {
      const info = DECISOES_CGE_POR_TIPO_ANO.find((a) => a.ano === ano);
      expect(info?.semTipo, `ano ${ano} deveria ter lacuna`).toBeGreaterThan(0);
    }
  });

  test("nenhum ano tem soma por tipo MAIOR que o total — isso seria impossível", () => {
    for (const a of DECISOES_CGE_POR_TIPO_ANO) {
      expect(a.somaTipos, `ano ${a.ano}`).toBeLessThanOrEqual(a.total);
      expect(a.semTipo, `ano ${a.ano}`).toBeGreaterThanOrEqual(0);
    }
  });

  test("duas estruturas de pasta convivem — órgão/tipo só existe onde a pasta antiga existe", () => {
    // orgaoSigla e tipoPasta vêm da MESMA detecção estrutural do link; um sem
    // o outro seria contraditório (a pasta ou tem os dois segmentos, ou não
    // tem nenhum).
    for (const d of lerDecisoesCgeMg()) {
      if (d.orgaoSigla !== null) expect(d.tipoPasta, d.arquivo).not.toBeNull();
      if (d.tipoPasta !== null) expect(d.orgaoSigla, d.arquivo).not.toBeNull();
    }
    const comPasta = lerDecisoesCgeMg().filter((d) => d.orgaoSigla !== null).length;
    expect(comPasta).toBe(COBERTURA_DECISOES_CGE.registrosComOrgaoETipoNaPasta);
    // 2020, 2021 e 2026 são 100% estrutura antiga (medido); 2022-2025 são mistos.
    for (const ano of [2020, 2021, 2026]) {
      const doAno = lerDecisoesCgeMg().filter((d) => d.ano === ano);
      expect(doAno.every((d) => d.orgaoSigla !== null), `ano ${ano}`).toBe(true);
    }
  });

  test("`linkProvavelmenteQuebrado` é true só para a estrutura App_Data, que devolveu 404 em toda amostra testada", () => {
    // Medido ao vivo em 2026-08-21: 11/11 URLs com `App_Data` no caminho
    // devolveram HTTP 404 (pasta reservada do ASP.NET, nunca servida); 6/6
    // URLs da estrutura antiga devolveram HTTP 200. O sinal aqui é inferido
    // do padrão da URL, não verificado registro a registro — por isso o nome
    // do campo é "provavelmente", não "confirmado".
    for (const d of lerDecisoesCgeMg()) {
      expect(d.linkProvavelmenteQuebrado, d.arquivo).toBe(d.url.includes("App_Data"));
    }
    const quebrados = lerDecisoesCgeMg().filter((d) => d.linkProvavelmenteQuebrado).length;
    expect(quebrados).toBe(COBERTURA_DECISOES_CGE.registrosComLinkProvavelmenteQuebrado);
    expect(quebrados).toBeGreaterThan(0);
    // A estrutura antiga nunca devolveu 404 na amostra — nenhum registro com
    // órgão/tipo na pasta deveria estar marcado como quebrado.
    for (const d of lerDecisoesCgeMg()) {
      if (d.orgaoSigla !== null) expect(d.linkProvavelmenteQuebrado, d.arquivo).toBe(false);
    }
  });

  test("toda URL usa o prefixo /sistema — sem ele o link cai em 404 mesmo na estrutura que funciona", () => {
    // `href` da fonte é relativo à raiz do site IIS (`/Downloads\...`), não à
    // raiz da aplicação (`/sistema/Downloads\...`). Testado ao vivo: SEM o
    // prefixo, até a estrutura antiga (que normalmente devolve 200) cai para
    // 404 direto.
    for (const d of lerDecisoesCgeMg()) {
      expect(d.url.startsWith("https://www.acessoainformacao.mg.gov.br/sistema/"), d.arquivo).toBe(
        true,
      );
    }
  });

  test("a URL nunca carrega a barra invertida `\\` do caminho bruto da fonte", () => {
    // A fonte manda o separador do Windows (`\`) no atributo href — se o
    // coletor esquecesse de normalizar, o link ficaria tecnicamente inválido
    // como caminho de URL.
    for (const d of lerDecisoesCgeMg()) {
      expect(d.url.includes("\\"), d.arquivo).toBe(false);
    }
  });

  test("seiId, quando presente, é só dígitos e vem do nome do arquivo", () => {
    for (const d of lerDecisoesCgeMg()) {
      if (d.seiId !== null) {
        expect(d.seiId, d.arquivo).toMatch(/^\d+$/);
        expect(d.arquivo.startsWith(`SEI_${d.seiId}_`), d.arquivo).toBe(true);
      }
    }
  });

  test("a cobertura literal bate com o array e com o por-tipo-ano — nada digitado à mão", () => {
    expect(COBERTURA_DECISOES_CGE.totalGeral).toBe(lerDecisoesCgeMg().length);
    expect(COBERTURA_DECISOES_CGE.totalGeral).toBe(
      DECISOES_CGE_POR_TIPO_ANO.reduce((t, a) => t + a.total, 0),
    );
    expect(COBERTURA_DECISOES_CGE.totalComTipoOficial).toBe(
      DECISOES_CGE_POR_TIPO_ANO.reduce((t, a) => t + a.somaTipos, 0),
    );
    expect(COBERTURA_DECISOES_CGE.totalSemTipoOficial).toBe(
      COBERTURA_DECISOES_CGE.totalGeral - COBERTURA_DECISOES_CGE.totalComTipoOficial,
    );
    expect(COBERTURA_DECISOES_CGE.anoInicial).toBe(Math.min(...lerDecisoesCgeMg().map((d) => d.ano)));
    expect(COBERTURA_DECISOES_CGE.anoFinal).toBe(Math.max(...lerDecisoesCgeMg().map((d) => d.ano)));
    // 7 anos, 2020 a 2026, sem buraco.
    const anos = new Set(lerDecisoesCgeMg().map((d) => d.ano));
    expect(anos.size).toBe(7);
  });

  test("cada ano do por-tipo-ano tem o `percentualSemTipo` coerente com `semTipo`/`total`", () => {
    for (const a of DECISOES_CGE_POR_TIPO_ANO) {
      const esperado = a.total > 0 ? Number(((a.semTipo / a.total) * 100).toFixed(1)) : 0;
      expect(a.percentualSemTipo, `ano ${a.ano}`).toBeCloseTo(esperado, 1);
    }
  });

  test("nenhum arquivo ou órgão vem vazio quando o campo não é null", () => {
    for (const d of lerDecisoesCgeMg()) {
      expect(d.arquivo.length, JSON.stringify(d)).toBeGreaterThan(0);
      if (d.orgaoSigla !== null) expect(d.orgaoSigla.length).toBeGreaterThan(0);
      if (d.tipoPasta !== null) expect(d.tipoPasta.length).toBeGreaterThan(0);
    }
  });
});
