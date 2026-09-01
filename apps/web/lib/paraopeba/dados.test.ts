import { describe, expect, test } from "vitest";
import {

  PERIODO_CLIPPING,
  TIPO_NOTICIA_LABEL,
  COBERTURA_CLIPPING,
} from "./clipping";
import {
  MARCOS_PARAOPEBA,
  ROTULO_TIPO_MARCO,
  formatarDataMarco,
  tipoDeMarco,
  type TipoMarco,
} from "./linha-do-tempo";
import { ATORES_REPARACAO, CATEGORIA_ATOR_LABEL } from "./atores";
import { PAGAMENTOS_PARAOPEBA, RESUMO_AUXILIO_PARAOPEBA } from "./auxilio";
import {

  PERIODO_CLIPPING_IJ,
  INSTITUICAO_JUSTICA_LABEL,
  TEMA_CLIPPING_IJ_LABEL,
  TEMA_CLIPPING_IJ_ORDEM,
  COBERTURA_CLIPPING_IJ,
} from "./clipping-ij";
import { COBERTURA_CLIPPING_ATI } from "./clipping-ati";
import {
  lerClippingParaopeba,
  lerClippingAti,
  lerClippingIj,
} from "./acervos-dados";

/** Sinônimos — o dado agora vive nos loaders server-only. */
const CLIPPING_PARAOPEBA = lerClippingParaopeba();
const CLIPPING_ATI = lerClippingAti();
const CLIPPING_IJ = lerClippingIj();
import { DOCUMENTOS_PROCESSO, COBERTURA_DOCUMENTOS_PROCESSO } from "./documentos";
import {
  AUTOR_AUDITORIA_AJRI,
  COBERTURA_AUDITORIA_AJRI,
  FONTE_AUDITORIA_AJRI,
  INSTRUMENTO_AJRI_LABEL,
  INSTRUMENTO_AJRI_ORDEM,
  PERIODO_AUDITORIA_AJRI,
  TEMAS_AJRI_FUNDIDOS,
  TEMA_AJRI_LABEL,
  TEMA_AJRI_ORDEM,
  TIPO_DOCUMENTO_AJRI_LABEL,
  TIPO_DOCUMENTO_AJRI_ORDEM,
  urlDocumentoAjri,
} from "./auditoria-ajri";
import { lerAuditoriaAjri } from "./auditoria-ajri-dados";
import { COBERTURA_EXECUCAO_FGV } from "./execucao-fgv";
import { MUNICIPIOS_EXECUCAO_FGV, STATUS_PROJETOS_FGV } from "./execucao-fgv-dados";
import {
  COBERTURA_RESUMO_AJRI,
  VEREDITO_AJRI_LABEL,
  type VereditoAjri,
} from "./resumo-ajri";
import { lerResumosAjri } from "./resumo-ajri-dados";

const AUDITORIA_AJRI = lerAuditoriaAjri();

/**
 * `clipping.ts`, `linha-do-tempo.ts`, `atores.ts` e `auxilio.ts` foram
 * GERADOS a partir de `painel-paraopeba.html` — um arquivo entregue à mão,
 * fora do repositório (não faz sentido versioná-lo: é o mesmo tratamento
 * que o projeto já dá a outras fontes externas de uso único). O que este
 * arquivo trava é o CONTRATO entre o parsing e o que `docs/PLANO-INGESTAO-
 * PARAOPEBA.md` mediu contando programaticamente sobre o HTML — se alguém
 * regenerar os arquivos e a contagem mudar sem querer (ex.: um item
 * duplicado, um array cortado pela metade), estes testes travam mesmo sem
 * o HTML original em mãos.
 */
describe("clipping.ts — parsing de NEWS_DATA (149 itens medidos)", () => {
  test("tem exatamente 149 notícias, o número medido em docs/PLANO-INGESTAO-PARAOPEBA.md", () => {
    expect(CLIPPING_PARAOPEBA.length).toBe(149);
  });

  test("todo item tem id, título, data, portal, tipo e url — nenhum campo obrigatório vazio", () => {
    for (const n of CLIPPING_PARAOPEBA) {
      expect(n.id, "id ausente").toBeGreaterThan(0);
      expect(n.titulo, `notícia ${n.id} sem título`).toBeTruthy();
      expect(n.data, `notícia ${n.id} sem data`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.portal, `notícia ${n.id} sem portal`).toBeTruthy();
      expect(n.url, `notícia ${n.id} sem url`).toMatch(/^https?:\/\//);
      expect(Object.keys(TIPO_NOTICIA_LABEL)).toContain(n.tipo);
    }
  });

  test("ids são únicos (o painel-fonte tem lacunas na numeração, mas nunca repete)", () => {
    const ids = CLIPPING_PARAOPEBA.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("a distribuição por tipo bate com a contagem medida no HTML (12/81/16/40)", () => {
    const contagem: Record<string, number> = {};
    for (const n of CLIPPING_PARAOPEBA) contagem[n.tipo] = (contagem[n.tipo] ?? 0) + 1;
    expect(contagem["institucional"]).toBe(12);
    expect(contagem["imprensa"]).toBe(81);
    expect(contagem["movimento"]).toBe(16);
    expect(contagem["assessoria"]).toBe(40);
  });

  test("PERIODO_CLIPPING é o mínimo e o máximo reais de CLIPPING_PARAOPEBA.data — nunca digitado solto", () => {
    const datas = CLIPPING_PARAOPEBA.map((n) => n.data).sort();
    expect(PERIODO_CLIPPING.de).toBe(datas[0]);
    expect(PERIODO_CLIPPING.ate).toBe(datas[datas.length - 1]);
  });
});

describe("linha-do-tempo.ts — 17 marcos de MILESTONES + 6 pré-2025 de EDU_TIMELINE", () => {
  test("tem exatamente 23 marcos — os 17 medidos em MILESTONES mais os 6 que faltavam", () => {
    expect(MARCOS_PARAOPEBA.length).toBe(23);
  });

  test("todo marco tem data, título, descrição e cor", () => {
    for (const m of MARCOS_PARAOPEBA) {
      // `YYYY-MM` é válido de propósito: a fonte de três marcos não tem o dia.
      expect(m.data, `data em formato inesperado: ${m.data}`).toMatch(/^\d{4}-\d{2}(-\d{2})?$/);
      expect(m.titulo).toBeTruthy();
      expect(m.descricao).toBeTruthy();
      expect(m.cor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test("os marcos estão em ordem cronológica — o painel-fonte já entregou assim, e a tela de linha do tempo confia nisso", () => {
    const datas = MARCOS_PARAOPEBA.map((m) => m.data);
    const ordenadas = [...datas].sort();
    expect(datas).toEqual(ordenadas);
  });

  /**
   * O buraco que a fusão de 15/08/2026 fechou. Sem o rompimento, a linha do
   * tempo de um acervo sobre a reparação de Brumadinho começava na ação
   * judicial contra o corte do auxílio, seis anos depois do fato.
   */
  test("a lista começa no rompimento, não na ACP de 2025", () => {
    expect(MARCOS_PARAOPEBA[0].data).toBe("2019-01-25");
    expect(MARCOS_PARAOPEBA[0].titulo).toContain("Rompimento");
  });

  test("são 6 os marcos anteriores a 2025 — se virar 5, algum sumiu numa regeneração", () => {
    expect(MARCOS_PARAOPEBA.filter((m) => m.data < "2025").length).toBe(6);
  });

  /**
   * Trava contra "completar o formato": três marcos vêm do painel com mês e
   * sem dia, e a tentação de gravar `2020-01-01` para uniformizar daria a um
   * dia inventado a mesma aparência de fato que 25/01/2019 tem.
   */
  test("os 3 marcos sem dia continuam sem dia", () => {
    const semDia = MARCOS_PARAOPEBA.filter((m) => /^\d{4}-\d{2}$/.test(m.data)).map((m) => m.data);
    expect(semDia).toEqual(["2020-01", "2021-11", "2024-11"]);
  });

  test("o Acordo de R$ 37,6 bi entrou com a mesma data que clipping-ij.ts registra", () => {
    const acordo = MARCOS_PARAOPEBA.find((m) => m.titulo.includes("37,6"));
    expect(acordo?.data).toBe("2021-02-04");
    const noClipping = CLIPPING_IJ.filter((n) => n.grupo === "CG_acordo_2021");
    expect(noClipping.length).toBeGreaterThan(0);
    for (const n of noClipping) expect(n.data).toBe(acordo?.data);
  });
});

describe("formatarDataMarco — a forma da data avisa a precisão dela", () => {
  test("data completa sai em dd/mm/aaaa", () => {
    expect(formatarDataMarco("2019-01-25")).toBe("25/01/2019");
  });

  test("data de mês sai por extenso, e nunca com um dia inventado", () => {
    expect(formatarDataMarco("2020-01")).toBe("janeiro de 2020");
    expect(formatarDataMarco("2024-11")).toBe("novembro de 2024");
  });

  test("entrada que não é data nenhuma vira travessão, não 'Invalid Date'", () => {
    expect(formatarDataMarco("")).toBe("—");
    expect(formatarDataMarco("Nov/2024")).toBe("—");
  });

  test("todo marco real rende um rótulo legível — nenhum cai no travessão", () => {
    for (const m of MARCOS_PARAOPEBA) {
      expect(formatarDataMarco(m.data), `marco "${m.titulo}" sem rótulo`).not.toBe("—");
    }
  });
});

describe("tipoDeMarco — a régua que agrupa a cor do painel em três tipos", () => {
  test("verde (favorável aos atingidos) cai em 'favoravel'", () => {
    expect(tipoDeMarco("#2D6A4F")).toBe("favoravel");
    expect(tipoDeMarco("#3A6B10")).toBe("favoravel");
  });

  test("vermelho (desfavorável) cai em 'desfavoravel'", () => {
    expect(tipoDeMarco("#9B1C1C")).toBe("desfavoravel");
  });

  test("azul e demais cores caem em 'neutro'", () => {
    expect(tipoDeMarco("#1A5FA8")).toBe("neutro");
    expect(tipoDeMarco("#8B5E00")).toBe("neutro");
    expect(tipoDeMarco("#7C4DBC")).toBe("neutro");
  });

  test("a comparação ignora caixa — cor digitada diferente não quebra o filtro", () => {
    expect(tipoDeMarco("#9b1c1c")).toBe("desfavoravel");
    expect(tipoDeMarco(" #2d6a4f ")).toBe("favoravel");
  });

  test("toda cor usada por um marco real tem tipo e rótulo — nenhum marco fica sem grupo", () => {
    const tipos: Record<TipoMarco, number> = { favoravel: 0, desfavoravel: 0, neutro: 0 };
    for (const m of MARCOS_PARAOPEBA) {
      const t = tipoDeMarco(m.cor);
      tipos[t] += 1;
      expect(ROTULO_TIPO_MARCO[t], `sem rótulo para ${t}`).toBeTruthy();
    }
    // Medido em 01/09/2026 contra os 23 marcos: 9 favoráveis, 7 desfavoráveis, 7 neutros.
    // Se um marco novo nascer com cor fora da régua, este teste acusa antes da tela.
    expect(tipos).toEqual({ favoravel: 9, desfavoravel: 7, neutro: 7 });
  });
});

describe("atores.ts — parsing de INST_DATA (18 itens em 5 categorias medidas)", () => {
  test("tem exatamente 18 atores, o número medido (3 judiciário + 3 mp + 1 gestora + 7 mov + 4 pub)", () => {
    expect(ATORES_REPARACAO.length).toBe(18);
  });

  test("a contagem por categoria bate com a estrutura real de INST_DATA no HTML", () => {
    const contagem: Record<string, number> = {};
    for (const a of ATORES_REPARACAO) contagem[a.categoria] = (contagem[a.categoria] ?? 0) + 1;
    expect(contagem["judiciario"]).toBe(3);
    expect(contagem["mp"]).toBe(3);
    expect(contagem["gestora"]).toBe(1);
    expect(contagem["mov"]).toBe(7);
    expect(contagem["pub"]).toBe(4);
  });

  test("toda categoria usada tem rótulo em CATEGORIA_ATOR_LABEL", () => {
    for (const a of ATORES_REPARACAO) {
      expect(CATEGORIA_ATOR_LABEL[a.categoria]).toBeTruthy();
    }
  });

  test("nomes de ator são únicos — sem duplicata de parsing", () => {
    const nomes = ATORES_REPARACAO.map((a) => a.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });
});

describe("auxilio.ts — parsing de PAYMENTS e DATA_PANEL (9 pagamentos medidos)", () => {
  test("tem exatamente 9 pagamentos mensais", () => {
    expect(PAGAMENTOS_PARAOPEBA.length).toBe(9);
  });

  test("todo pagamento tem mês, valor, status e observação", () => {
    for (const p of PAGAMENTOS_PARAOPEBA) {
      expect(p.mes).toBeTruthy();
      expect(p.valor).toBeTruthy();
      expect(p.status).toBeTruthy();
      expect(p.observacao).toBeTruthy();
    }
  });

  test("RESUMO_AUXILIO_PARAOPEBA carrega a nota de proveniência do painel-fonte, sem edição", () => {
    // A `nota` é o que garante que os números-resumo não viraram fato
    // apurado por este portal (`docs/PLANO-INGESTAO-PARAOPEBA.md`, 1.6) —
    // se ela sumir, alguém removeu a única ressalva de proveniência.
    expect(RESUMO_AUXILIO_PARAOPEBA.nota.length).toBeGreaterThan(20);
  });
});

describe("clipping-ij.ts — parsing de CLIPPING_DATA (59 itens medidos)", () => {
  test("tem exatamente 59 matérias, o número medido em docs/HANDOFF-PAINEL-PARAOPEBA-PAGINAS-PERDIDAS.md §3", () => {
    expect(CLIPPING_IJ.length).toBe(59);
  });

  test("todo item tem id, título, resumo, data, fonte e url — nenhum campo obrigatório vazio", () => {
    for (const n of CLIPPING_IJ) {
      expect(n.id, "id ausente").toBeTruthy();
      expect(n.titulo, `matéria ${n.id} sem título`).toBeTruthy();
      expect(n.resumo, `matéria ${n.id} sem resumo`).toBeTruthy();
      expect(n.data, `matéria ${n.id} sem data`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.fonte, `matéria ${n.id} sem fonte`).toBeTruthy();
      expect(n.url, `matéria ${n.id} sem url`).toMatch(/^https?:\/\//);
      expect(Object.keys(INSTITUICAO_JUSTICA_LABEL)).toContain(n.instituicao);
      expect(Object.keys(TEMA_CLIPPING_IJ_LABEL)).toContain(n.tema);
    }
  });

  test("ids são únicos", () => {
    const ids = CLIPPING_IJ.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("a distribuição por instituição bate com a contagem medida no HTML (MPMG 25 · DPMG 20 · MPF 14)", () => {
    const contagem: Record<string, number> = {};
    for (const n of CLIPPING_IJ) contagem[n.instituicao] = (contagem[n.instituicao] ?? 0) + 1;
    expect(contagem["mpmg"]).toBe(25);
    expect(contagem["dpmg"]).toBe(20);
    expect(contagem["mpf"]).toBe(14);
  });

  test("a distribuição por tema bate com a medida (ptr_auxilio 24 · indenizacao 11 · acordo 9 · acao_penal 9 · consulta_popular 6)", () => {
    const contagem: Record<string, number> = {};
    for (const n of CLIPPING_IJ) contagem[n.tema] = (contagem[n.tema] ?? 0) + 1;
    expect(contagem["ptr_auxilio"]).toBe(24);
    expect(contagem["indenizacao"]).toBe(11);
    expect(contagem["acordo"]).toBe(9);
    expect(contagem["acao_penal"]).toBe(9);
    expect(contagem["consulta_popular"]).toBe(6);
  });

  test("PERIODO_CLIPPING_IJ é o mínimo e o máximo reais de CLIPPING_IJ.data — nunca digitado solto", () => {
    const datas = CLIPPING_IJ.map((n) => n.data).sort();
    expect(PERIODO_CLIPPING_IJ.de).toBe(datas[0]);
    expect(PERIODO_CLIPPING_IJ.ate).toBe(datas[datas.length - 1]);
  });

  test("TEMA_CLIPPING_IJ_ORDEM cobre todos os temas usados — senão um filtro some da tela sem aviso", () => {
    const usados = new Set(CLIPPING_IJ.map((n) => n.tema));
    for (const t of usados) expect(TEMA_CLIPPING_IJ_ORDEM).toContain(t);
    // E o contrário: ordem que promete tema sem item vira filtro vazio.
    for (const t of TEMA_CLIPPING_IJ_ORDEM) expect(usados).toContain(t);
  });

  test("o campo `grupo` amarra 36 matérias a 13 fatos, e todo grupo tem mais de um item", () => {
    // É a chave que nenhum outro acervo do portal tem: a mesma decisão
    // noticiada por MPMG, MPF e DPMG em paralelo. Grupo de um item só seria
    // erro de parsing — o painel-fonte só marca quando há repetição de fato.
    const comGrupo = CLIPPING_IJ.filter((n) => n.grupo);
    expect(comGrupo.length).toBe(36);

    const porGrupo: Record<string, number> = {};
    for (const n of comGrupo) porGrupo[n.grupo!] = (porGrupo[n.grupo!] ?? 0) + 1;
    expect(Object.keys(porGrupo).length).toBe(13);
    for (const [g, n] of Object.entries(porGrupo)) {
      expect(n, `grupo ${g} tem um item só`).toBeGreaterThan(1);
    }
  });

  test("é acervo novo, não duplicata de clipping.ts — no máximo 1 url em comum, nenhum título", () => {
    // O que justifica os dois arrays conviverem sem deduplicação
    // (HANDOFF §3). Se esta trava cair, alguém está reingerindo o mesmo
    // material sob outra classificação.
    const chave = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const urls = new Set(CLIPPING_PARAOPEBA.map((n) => chave(n.url)));
    const titulos = new Set(CLIPPING_PARAOPEBA.map((n) => chave(n.titulo)));
    expect(CLIPPING_IJ.filter((n) => urls.has(chave(n.url))).length).toBe(1);
    expect(CLIPPING_IJ.filter((n) => titulos.has(chave(n.titulo))).length).toBe(0);
  });

  test("cobre 5 anos a mais que o clipping geral — é o único acervo que alcança o Acordo de 2021", () => {
    expect(PERIODO_CLIPPING_IJ.de < PERIODO_CLIPPING.de).toBe(true);
    expect(CLIPPING_IJ.some((n) => n.data < "2021-03-01")).toBe(true);
  });
});

describe("documentos.ts — cobertura declarada bate com o acervo publicado", () => {
  test("o total publicado bate com COBERTURA_DOCUMENTOS_PROCESSO.publicados", () => {
    expect(DOCUMENTOS_PROCESSO.length).toBe(COBERTURA_DOCUMENTOS_PROCESSO.publicados);
  });

  test("471 de 7.107 é 6,6% — a fração declarada na tela vem da mesma conta, não digitada solta", () => {
    const c = COBERTURA_DOCUMENTOS_PROCESSO;
    expect(c.comMunicipioIdentificado).toBe(471);
    expect(c.totalAcervo).toBe(7107);
    const percentualReal = Math.round((c.comMunicipioIdentificado / c.totalAcervo) * 1000) / 10;
    expect(c.percentualPublicado).toBe(percentualReal);
    expect(c.percentualPublicado).toBe(6.6);
  });

  test("todo documento cita pelo menos um município", () => {
    for (const d of DOCUMENTOS_PROCESSO) {
      expect(d.municipios.length, `documento ${d.id} sem município`).toBeGreaterThan(0);
    }
  });

  test("ids são únicos", () => {
    const ids = DOCUMENTOS_PROCESSO.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/**
 * `auditoria-ajri.ts` é GERADO por `scripts/extrair-auditoria-ajri.mts` a
 * partir do catálogo que `scripts/coletor_auditoria.py` raspa do portal da
 * auditoria socioambiental. O JSON não é versionado — de propósito, para não
 * existirem duas cópias do mesmo acervo —, então estes testes são a única
 * régua que sobra no repositório: eles travam contra o portal-fonte o que foi
 * medido em 15/08/2026, e falham se uma regeneração cortar, duplicar ou
 * reclassificar documento sem ninguém notar.
 */
describe("auditoria-ajri.ts — catálogo da auditoria independente (467 documentos medidos)", () => {
  test("tem exatamente 467 documentos, o número medido no portal em 15/08/2026", () => {
    expect(AUDITORIA_AJRI.length).toBe(467);
  });

  test("a distribuição por tipo bate com a medida (391 Relatórios · 76 Notas Técnicas)", () => {
    const contagem: Record<string, number> = {};
    for (const d of AUDITORIA_AJRI) contagem[d.tipo] = (contagem[d.tipo] ?? 0) + 1;
    expect(contagem["relatorio"]).toBe(391);
    expect(contagem["nota-tecnica"]).toBe(76);
    expect(Object.keys(contagem).length).toBe(Object.keys(TIPO_DOCUMENTO_AJRI_LABEL).length);
  });

  test("a distribuição pelos 7 instrumentos jurídicos bate com as facetas do portal", () => {
    const contagem: Record<string, number> = {};
    for (const d of AUDITORIA_AJRI) contagem[d.instrumento] = (contagem[d.instrumento] ?? 0) + 1;
    expect(contagem).toEqual({
      "acordo-de-reparacao": 93,
      "acoes-emergenciais": 87,
      monitoramento: 85,
      "aguas-e-seguranca-hidrica": 84,
      "estudo-de-risco": 82,
      "seguranca-das-estruturas": 30,
      "estudo-da-producao-agropecuaria": 6,
    });
    // A soma das facetas TEM que fechar com o acervo: se o portal ganhar um
    // instrumento novo e a coleta não o pegar, é aqui que aparece.
    const soma = Object.values(contagem).reduce((a, b) => a + b, 0);
    expect(soma).toBe(AUDITORIA_AJRI.length);
  });

  test("todo documento tem id, código, descrição, data, tema e rótulos conhecidos", () => {
    for (const d of AUDITORIA_AJRI) {
      expect(d.id, "id ausente").toBeGreaterThan(0);
      expect(d.codigo, `documento ${d.id} sem código`).toBeTruthy();
      expect(d.descricao, `documento ${d.id} sem descrição`).toBeTruthy();
      expect(d.data, `documento ${d.id} sem data`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(d.temas.length, `documento ${d.id} sem tema`).toBeGreaterThan(0);
      expect(INSTRUMENTO_AJRI_LABEL[d.instrumento]).toBeTruthy();
      expect(TIPO_DOCUMENTO_AJRI_LABEL[d.tipo]).toBeTruthy();
      for (const t of d.temas) expect(TEMA_AJRI_LABEL[t], `tema órfão: ${t}`).toBeTruthy();
    }
  });

  test("ids e códigos são únicos — 467 de cada", () => {
    expect(new Set(AUDITORIA_AJRI.map((d) => d.id)).size).toBe(467);
    expect(new Set(AUDITORIA_AJRI.map((d) => d.codigo)).size).toBe(467);
  });

  /**
   * O código carrega `RP` (Relatório) ou `TN` (Nota Técnica) na 5ª parte, e
   * `projeto`/`disciplina`/`ano` nas outras. Se a geração trocar o mapa de
   * tipos, o código e o campo divergem — e a ficha passa a dizer uma coisa
   * com o carimbo da outra.
   */
  test("o código de cada documento concorda com tipo, projeto, disciplina e ano", () => {
    const sigla: Record<string, string> = { relatorio: "RP", "nota-tecnica": "TN" };
    for (const d of AUDITORIA_AJRI) {
      const p = d.codigo.split("-");
      expect(p.length, `código fora do formato: ${d.codigo}`).toBe(8);
      expect(p[0]).toBe(d.projeto);
      expect(p[3]).toBe(d.disciplina);
      expect(p[4]).toBe(sigla[d.tipo]);
      expect(p[7]).toBe(d.ano);
    }
  });

  test("PERIODO_AUDITORIA_AJRI é o mínimo e o máximo reais das datas — nunca digitado solto", () => {
    const datas = AUDITORIA_AJRI.map((d) => d.data).sort();
    expect(PERIODO_AUDITORIA_AJRI.de).toBe(datas[0]);
    expect(PERIODO_AUDITORIA_AJRI.ate).toBe(datas[datas.length - 1]);
    expect(PERIODO_AUDITORIA_AJRI.de).toBe("2019-02-28");
    expect(PERIODO_AUDITORIA_AJRI.ate).toBe("2026-07-31");
  });

  /**
   * O acervo alcança um mês depois do rompimento (25/01/2019) e dois anos
   * antes do Acordo de R$ 37,6 bi (04/02/2021) — a auditoria das ações
   * emergenciais começou muito antes de existir Acordo para auditar.
   */
  test("começa em 2019, antes do Acordo — e o primeiro documento é das Ações Emergenciais", () => {
    const primeiro = [...AUDITORIA_AJRI].sort((a, b) => a.data.localeCompare(b.data))[0];
    expect(primeiro.data < "2021-02-04").toBe(true);
    expect(primeiro.instrumento).toBe("acoes-emergenciais");
  });

  /**
   * O que a normalização de tema fundiu, travado no dado. O portal cadastra
   * `Risco Saúde Pública` duas vezes (uma sem acento) e `Segurança do
   * Alimento` duas vezes com o mesmo nome; sem a fusão a tela teria 27
   * filtros, dois deles fantasmas com 3 e 1 documento.
   */
  test("as 27 facetas do portal viraram 25 temas, e as 2 fusões estão declaradas", () => {
    expect(TEMA_AJRI_ORDEM.length).toBe(25);
    expect(Object.keys(TEMA_AJRI_LABEL).length).toBe(25);
    expect(TEMAS_AJRI_FUNDIDOS.length).toBe(2);
    const facetas = TEMAS_AJRI_FUNDIDOS.reduce((s, f) => s + f.facetas.length, 0);
    // 25 slugs, 2 deles vindos de 2 facetas cada = 27 facetas na origem.
    expect(TEMA_AJRI_ORDEM.length - TEMAS_AJRI_FUNDIDOS.length + facetas).toBe(27);

    const saude = TEMAS_AJRI_FUNDIDOS.find((f) => f.slug === "risco-saude-publica");
    expect(saude?.grafias).toEqual(["Risco Saúde Publica", "Risco Saúde Pública"]);
    // Vence a grafia mais frequente (79 documentos), não a primeira que aparece (3).
    expect(TEMA_AJRI_LABEL["risco-saude-publica"]).toBe("Risco Saúde Pública");

    const alimento = TEMAS_AJRI_FUNDIDOS.find((f) => f.slug === "seguranca-do-alimento");
    // Nome idêntico, faceta dobrada — é registro duplicado, não erro de acento.
    expect(alimento?.grafias.length).toBe(1);
    expect(alimento?.facetas.length).toBe(2);
  });

  test("os temas fundidos somam o que as duas facetas somavam (82 e 6)", () => {
    const conta = (slug: string) =>
      AUDITORIA_AJRI.filter((d) => (d.temas as string[]).includes(slug)).length;
    expect(conta("risco-saude-publica")).toBe(79 + 3);
    expect(conta("seguranca-do-alimento")).toBe(5 + 1);
  });

  test("nenhuma ficha repete tema depois da normalização", () => {
    for (const d of AUDITORIA_AJRI) {
      expect(new Set(d.temas).size, `documento ${d.id} com tema repetido`).toBe(d.temas.length);
    }
  });

  test("TEMA_AJRI_ORDEM e INSTRUMENTO_AJRI_ORDEM não prometem filtro vazio", () => {
    const temasUsados = new Set(AUDITORIA_AJRI.flatMap((d) => d.temas));
    for (const t of TEMA_AJRI_ORDEM) expect(temasUsados, `tema sem documento: ${t}`).toContain(t);
    for (const t of temasUsados) expect(TEMA_AJRI_ORDEM).toContain(t);

    const instrumentosUsados = new Set(AUDITORIA_AJRI.map((d) => d.instrumento));
    for (const i of INSTRUMENTO_AJRI_ORDEM) expect(instrumentosUsados).toContain(i);
    for (const i of instrumentosUsados) expect(INSTRUMENTO_AJRI_ORDEM).toContain(i);
  });

  /**
   * A regra de conteúdo que não é negociável: material de terceiro só entra
   * com crédito e com link canônico para a fonte oficial. `autor` é constante
   * porque os 467 documentos são da AECOM (conferido registro a registro na
   * geração), e a URL é derivada do id — se ela deixar de apontar para o
   * portal, o catálogo vira republicação sem fonte.
   */
  test("todo registro rende um link canônico para o portal da auditoria", () => {
    expect(AUTOR_AUDITORIA_AJRI).toBe("AECOM");
    expect(FONTE_AUDITORIA_AJRI.autor).toBe("AECOM");
    expect(FONTE_AUDITORIA_AJRI.repositorio).toMatch(
      /^https:\/\/portal\.auditoriasocioambiental\.com\.br\//
    );
    for (const d of AUDITORIA_AJRI) {
      const url = urlDocumentoAjri(d.id);
      expect(url).toBe(`${FONTE_AUDITORIA_AJRI.repositorio}/${d.id}/download_cover`);
      expect(url).toMatch(/^https:\/\//);
    }
    expect(new Set(AUDITORIA_AJRI.map((d) => urlDocumentoAjri(d.id))).size).toBe(467);
  });

  /**
   * Trava de payload. `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`: o deploy de
   * 15/08/2026 morreu porque uma rota serializou o corpus inteiro e o asset
   * passou de 25 MiB. Aqui o acervo é importado (não vai por prop), mas o
   * texto ainda pesa — 155 KB de descrição. Se alguém dobrar isso sem paginar
   * a tela, é melhor descobrir no teste do que no deploy.
   *
   * Medido em 15/08/2026: 308.788 bytes serializados (24 KB em gzip — a
   * descrição repete muita fórmula contratual). O teto de 400 KB dá folga
   * para uns 200 documentos novos e ainda assim avisa antes de dobrar.
   */
  test("o texto do acervo continua abaixo de 400 KB — teto de payload da rota", () => {
    const bytes = new TextEncoder().encode(JSON.stringify(AUDITORIA_AJRI)).length;
    expect(bytes).toBeLessThan(400_000);
    // Piso também: um corte acidental na regeneração encolheria o acervo, e
    // "menos dado" não falha em nenhum outro teste de conteúdo.
    expect(bytes).toBeGreaterThan(250_000);
  });
});

/**
 * `resumo-ajri.ts` é GERADO por `scripts/gerar-resumo-ajri.mts` a partir dos
 * 337 resumos auditados em `X:\DevCoder\_ajri\resumo\` (fora do repo, de
 * propósito). O gerador revalida o schema do `validar.py` do acervo e a
 * paridade com o catálogo antes de gravar; estes testes são a régua que
 * sobra no repositório — falham se uma regeneração cortar, duplicar ou
 * misturar resumo sem ninguém notar, e travam o teto de payload do chunk.
 */
describe("resumo-ajri.ts — resumos em linguagem comum (337 medidos)", () => {
  test("tem exatamente 337 resumos, e a cobertura literal bate com o catálogo", () => {
    expect(Object.keys(lerResumosAjri()).length).toBe(337);
    expect(Object.keys(lerResumosAjri()).length).toBe(COBERTURA_RESUMO_AJRI.total);
    expect(COBERTURA_RESUMO_AJRI.semResumo).toBe(AUDITORIA_AJRI.length - 337);
  });

  test("todo resumo existe no catálogo, e a chave é o código do documento", () => {
    const codigos = new Set(AUDITORIA_AJRI.map((d) => d.codigo));
    for (const [chave, r] of Object.entries(lerResumosAjri())) {
      expect(codigos.has(chave), `resumo órfão: ${chave}`).toBe(true);
      expect(r.codigo, `chave ≠ codigo interno em ${chave}`).toBe(chave);
    }
  });

  test("veredito afirmado tem citação; não-declarado nunca tem", () => {
    for (const r of Object.values(lerResumosAjri())) {
      const declarado = r.veredito !== "nao-declarado";
      expect(Boolean(r.citacao), `veredito ${r.veredito} de ${r.codigo} sem citação`).toBe(
        declarado
      );
    }
  });

  test("todo resumo tem de 3 a 6 blocos, cada um com título e texto", () => {
    for (const r of Object.values(lerResumosAjri())) {
      expect(r.resumo.length, `${r.codigo} com ${r.resumo.length} blocos`).toBeGreaterThanOrEqual(3);
      expect(r.resumo.length, `${r.codigo} com ${r.resumo.length} blocos`).toBeLessThanOrEqual(6);
      for (const b of r.resumo) {
        expect(b.titulo, `bloco sem título em ${r.codigo}`).toBeTruthy();
        expect(b.texto, `bloco sem texto em ${r.codigo}`).toBeTruthy();
      }
    }
  });

  test("todo veredito usado tem rótulo, e todo rótulo tem documento", () => {
    const usados = new Set(Object.values(lerResumosAjri()).map((r) => r.veredito));
    for (const v of usados) expect(VEREDITO_AJRI_LABEL[v], `rótulo órfão: ${v}`).toBeTruthy();
    for (const v of Object.keys(VEREDITO_AJRI_LABEL) as VereditoAjri[]) {
      expect(usados.has(v), `rótulo ${v} sem documento`).toBe(true);
    }
  });

  test("periodo: `de` é sempre ISO; `ate` é ISO ou null (nunca o contrário)", () => {
    for (const r of Object.values(lerResumosAjri())) {
      if (r.periodo === null) continue;
      expect(r.periodo.de, `${r.codigo}: de inválido`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (r.periodo.ate !== null) {
        expect(r.periodo.ate, `${r.codigo}: ate inválido`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  /**
   * Trava de payload, na mesma doutrina do teste do catálogo: o chunk é de
   * CLIENTE (importado só em `AuditoriaClient.tsx`), então o teto não é o de
   * 3 MiB do Worker nem o de 25 MiB de asset — mas um corte acidental na
   * regeneração encolheria os resumos sem falhar em teste de conteúdo, e um
   * descontrole dobraria o peso da página para todo mundo.
   *
   * Medido em 20/08/2026: 2.091.557 bytes serializados (350 KiB em gzip).
   */
  test("o texto dos resumos fica entre 1,5 e 3,5 MiB — nem cortado, nem dobrado", () => {
    const bytes = new TextEncoder().encode(JSON.stringify(lerResumosAjri())).length;
    expect(bytes).toBeLessThan(3_500_000);
    expect(bytes).toBeGreaterThan(1_500_000);
  });
});

/* ═══════ coberturas literais — a paridade com o array é o teste ═══════ */

describe("as coberturas literais batem com o array real (Worker usa as coberturas)", () => {
  test("COBERTURA_CLIPPING.total", () => {
    expect(CLIPPING_PARAOPEBA.length).toBe(COBERTURA_CLIPPING.total);
  });
  test("COBERTURA_CLIPPING_ATI.total", () => {
    expect(CLIPPING_ATI.length).toBe(COBERTURA_CLIPPING_ATI.total);
  });
  test("COBERTURA_CLIPPING_IJ.total", () => {
    expect(CLIPPING_IJ.length).toBe(COBERTURA_CLIPPING_IJ.total);
  });
  test("COBERTURA_AUDITORIA_AJRI.total e porTipo", () => {
    expect(AUDITORIA_AJRI.length).toBe(COBERTURA_AUDITORIA_AJRI.total);
    for (const t of TIPO_DOCUMENTO_AJRI_ORDEM) {
      const real = AUDITORIA_AJRI.filter((d) => d.tipo === t).length;
      expect(real).toBe(COBERTURA_AUDITORIA_AJRI.porTipo[t]);
    }
    expect(INSTRUMENTO_AJRI_ORDEM.length).toBe(COBERTURA_AUDITORIA_AJRI.instrumentos);
    expect(TEMA_AJRI_ORDEM.length).toBe(COBERTURA_AUDITORIA_AJRI.temas);
  });
  test("COBERTURA_EXECUCAO_FGV.municipios e projetosDistintos", () => {
    expect(MUNICIPIOS_EXECUCAO_FGV.length).toBe(COBERTURA_EXECUCAO_FGV.municipios);
    const distintos = new Set(STATUS_PROJETOS_FGV.map((s) => s.idFdi)).size;
    expect(distintos).toBe(COBERTURA_EXECUCAO_FGV.projetosDistintos);
  });
});
