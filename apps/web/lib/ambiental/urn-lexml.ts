import type { LegislacaoAmbientalRow } from "@/lib/db/queries/legislacao-ambiental";

/**
 * URN LexML e link canônico de `normas.leg.br` para as normas que
 * `/ambiental/legislacao` já publica.
 *
 * Lógica PURA (sem React, sem banco, sem rede) — mesmo padrão de
 * `lib/ambiental/legislacao-unificada.ts`: dá para testar cada formato de
 * URN com `vitest` sem montar componente e sem tocar em servidor nenhum.
 * Quem mede a resolução de verdade é `scripts/verificar-urn-lexml.mts`,
 * que chama o portal; aqui só se MONTA o identificador.
 *
 * ═══ POR QUE URN, SE O ACERVO JÁ TEM `link_pdf` ═══
 *
 * `link_pdf` é o endereço de HOJE no site do órgão. A auditoria de
 * 2026-08-13 (`scripts/auditoria-links-normas.mjs`) existe justamente
 * porque esses endereços quebram: órgão troca de CMS, o caminho muda, e a
 * norma continua existindo com o link apontando para lugar nenhum. A URN
 * LexML é o identificador do ATO — `urn:lex:br:federal:lei:1998-02-12;9605`
 * é a Lei de Crimes Ambientais e continua sendo, independentemente de qual
 * site a sirva. É isso que esta lib acrescenta ao acervo: não mais norma,
 * e sim endereço que sobrevive à mudança de site.
 *
 * ═══ O QUE FOI MEDIDO EM 2026-08-15 (e o que isso obriga) ═══
 *
 * O relatório completo está em `docs/URN-LEXML-NORMAS-LEG-BR.md`. O que
 * define o código daqui:
 *
 * 1. **`normas.leg.br` é FEDERAL.** O `<title>` do portal é "Normas.leg.br:
 *    Legislação Federal", `/api/public/organizations` devolve 8 órgãos e
 *    todos são federais (STF, Senado, Câmara, Congresso, Presidência,
 *    Imprensa Nacional, Imperador, Assembleia Constituinte), e a URN de uma
 *    lei estadual de Minas medida ao vivo
 *    (`urn:lex:br;minas.gerais:estadual:lei:2026-08-06;26040`, Lei nº
 *    26.040/2026, dado real da API da ALMG) NÃO resolve. Por isso
 *    `esfera !== "nacional"` devolve `null` aqui, e não uma URN bem-formada
 *    que ninguém consegue abrir. São 6.378 normas estaduais do acervo que
 *    não ganham link — o número honesto, não o desejado.
 *
 * 2. **O vocabulário de tipo é fechado e pequeno.** `/api/public/
 *    legislation-types` devolve 77 códigos, e os que são "norma inteira" são
 *    os do processo legislativo federal (lei, decreto, medida.provisoria,
 *    emenda.constitucional...). **Não existe `portaria`, não existe
 *    `instrucao.normativa`, não existe `resolucao` genérica.** Isso exclui
 *    de saída a maior parte do acervo federal deste portal: 2.368 portarias
 *    do Ibama, 2.166 do ICMBio, 1.061 do MMA, 511 Resoluções Conama, as 370
 *    do CNDH. Chutar a autoridade (`urn:lex:br:ministerio.meio.ambiente:
 *    portaria:...`) foi testado e não resolve — chute não vira link.
 *
 * 3. **`decreto.numerado` NÃO é o código de um decreto numerado.** Parece
 *    óbvio pelo nome e está errado: o Decreto nº 47.446/1959 resolve com
 *    `decreto` e não resolve com `decreto.numerado` (medido nos dois
 *    formatos, mesma norma). `decreto.numerado`/`decreto.nao.numerado` são
 *    tipos de nível 2 do vocabulário, para outra coisa. Daí o mapa abaixo
 *    apontar `DECRETO -> decreto`, seco.
 *
 * ⚠️ **HTTP 200 do portal NÃO quer dizer que a norma existe.** Duas
 * armadilhas medidas, que qualquer verificação futura precisa saber:
 * `https://normas.leg.br/?urn=<qualquer coisa>` devolve 200 sempre (é uma
 * SPA Angular: o HTML é a casca, a norma chega depois por JSON), e mesmo a
 * API `/api/public/normas?urn=...&&tipo_documento=maior-detalhe` responde
 * **200 com o corpo `{ "urn": "<a urn que você mandou>" }`** quando não
 * acha nada. O sinal de resolução é o CORPO ter `legislationIdentifier` —
 * nunca o status. Ver `normaResolveu()`.
 */

/** Resolvedor público, legível por humano. É este que vai para a tela. */
export const RESOLVEDOR_NORMAS_LEG_BR = "https://normas.leg.br/?urn=";

/**
 * Endpoint JSON-LD (schema.org `Legislation`) que a própria SPA do portal
 * consome — descoberto lendo a rede dela em 2026-08-15, não documentado.
 * O `&&` duplo é como o portal monta a URL; o parâmetro `tipo_documento`
 * NÃO é opcional (sem ele a API devolve 400 até para a Lei nº 9.605/1998,
 * que existe). A URN vai CRUA, sem `encodeURIComponent`: `:` e `;` são
 * legais em query string, e percent-encodá-los faz a API responder 400.
 */
export function urlApiNormasLegBr(urn: string): string {
  return `https://normas.leg.br/api/public/normas?urn=${urn}&&tipo_documento=maior-detalhe`;
}

/**
 * Tipos do acervo -> `urnCode` de `/api/public/legislation-types`.
 *
 * A chave é o `tipo` NORMALIZADO (maiúsculo, sem acento, espaço único) —
 * a mesma receita de `etl.apis._legislacao_ambiental.normalizar_tipo`,
 * porque as fontes escrevem o mesmo tipo de jeitos diferentes ("Portaria
 * IBAMA" e "PORTARIA IBAMA" convivem no acervo do MMA, medido).
 *
 * Os quatro primeiros são os que EXISTEM no acervo federal hoje e foram
 * conferidos contra o portal com norma real. Os quatro últimos vêm do
 * vocabulário do próprio portal e estão aqui para o dia em que uma fonte
 * federal os trouxer — não foram exercitados com norma real porque o
 * acervo não tem nenhuma. A distinção fica escrita para ninguém ler este
 * mapa inteiro como "medido".
 */
export const TIPO_PARA_URN_FEDERAL: Record<string, string> = {
  // conferidos com norma real do acervo (ver docs/URN-LEXML-NORMAS-LEG-BR.md)
  LEI: "lei",
  DECRETO: "decreto",
  "DECRETO-LEI": "decreto.lei",
  "MEDIDA PROVISORIA": "medida.provisoria",
  // do vocabulário do portal, sem norma no acervo para exercitar
  "LEI COMPLEMENTAR": "lei.complementar",
  "LEI DELEGADA": "lei.delegada",
  "DECRETO LEGISLATIVO": "decreto.legislativo",
  "EMENDA CONSTITUCIONAL": "emenda.constitucional",
};

/** Maiúsculo, sem acento, espaço único — e "DECRETO LEI" vira "DECRETO-LEI"
 *  para o mapa ter uma entrada só. Não usa `semAcento` de `lib/busca` de
 *  propósito: aquele baixa para minúscula (é normalização de BUSCA), e aqui
 *  a chave do mapa é maiúscula, igual à do ETL. */
export function normalizarTipo(tipo: string | null | undefined): string {
  const base = (tipo ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase();
  return base.replace(/\s+/g, " ").trim().replace(/^DECRETO LEI\b/, "DECRETO-LEI");
}

/** `"1.035"` e `"01035"` -> `"1035"`; `"S/N"` -> `null`. Mesma regra de
 *  `normalizar_numero` no ETL: a URN LexML numera sem pontuação e sem zero
 *  à esquerda. Um número que não tem dígito nenhum não vira URN — vira
 *  `null`, porque `;` sem número é URN quebrada, não URN parcial. */
export function normalizarNumero(numero: string | null | undefined): string | null {
  const digitos = (numero ?? "").replace(/\D/g, "");
  if (!digitos) return null;
  const semZeros = digitos.replace(/^0+/, "");
  return semZeros || null;
}

/** A data tem que ser dia certo, no formato ISO. `"1998"` e `"1998-02"` são
 *  recusados: a URN LexML é chaveada por data COMPLETA, e completar com 1º
 *  de janeiro inventaria um ato que não existe — a mesma regra que o
 *  coletor do MMA já segue ao gravar `data` nula em 855 das 8.570 normas. */
function dataIsoValida(data: string | null | undefined): string | null {
  if (!data) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data.trim());
  if (!m) return null;
  const [, ano, mes, dia] = m;
  const d = new Date(`${ano}-${mes}-${dia}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  // 2026-02-31 vira 03-03 no Date; comparar de volta rejeita data que não existe.
  if (d.toISOString().slice(0, 10) !== `${ano}-${mes}-${dia}`) return null;
  return `${ano}-${mes}-${dia}`;
}

/** O mínimo que uma linha precisa ter. Aceita `LegislacaoAmbientalRow`
 *  inteira, mas não a exige — assim o script de verificação passa o JSON
 *  cru do coletor sem montar a linha do banco. */
export type NormaParaUrn = Pick<LegislacaoAmbientalRow, "esfera" | "tipo" | "numero" | "data">;

/**
 * A URN LexML da norma, ou `null` quando não dá para montar uma que
 * resolva. `null` é resposta legítima e o caso MAIS COMUM (medido: 651 de
 * 15.318 linhas do acervo passam por aqui) — a tela tem de tratá-lo como
 * "sem link canônico", nunca renderizar link quebrado.
 *
 * Os quatro motivos de `null`, todos observados no acervo real:
 *   - esfera diferente de `nacional` (6.378 estaduais);
 *   - tipo fora do vocabulário do portal (portaria, resolução, recomendação
 *     — 8.226 das 8.940 federais);
 *   - sem data completa (855 no MMA, 33 no CNDH);
 *   - sem número em dígitos (33 no MMA gravam algo sem dígito; 30 no CNDH
 *     não têm número).
 */
export function urnLexmlDaNorma(norma: NormaParaUrn): string | null {
  if (norma.esfera !== "nacional") return null;

  const tipoUrn = TIPO_PARA_URN_FEDERAL[normalizarTipo(norma.tipo)];
  if (!tipoUrn) return null;

  const data = dataIsoValida(norma.data);
  if (!data) return null;

  const numero = normalizarNumero(norma.numero);
  if (!numero) return null;

  return `urn:lex:br:federal:${tipoUrn}:${data};${numero}`;
}

/** O link canônico para a tela — `null` pelos mesmos motivos da URN. */
export function linkCanonicoDaNorma(norma: NormaParaUrn): string | null {
  const urn = urnLexmlDaNorma(norma);
  return urn ? `${RESOLVEDOR_NORMAS_LEG_BR}${urn}` : null;
}

/**
 * Resposta da API do portal para uma URN que ele NÃO conhece:
 * `{ "urn": "<a que você mandou>" }`, com HTTP **200**. Resolveu mesmo é
 * quando volta o objeto schema.org com `legislationIdentifier`. Esta função
 * é o que separa "existe" de "eco" — e é o motivo de o verificador não
 * poder contar status 200 como acerto.
 */
export function normaResolveu(corpo: unknown): boolean {
  if (!corpo || typeof corpo !== "object") return false;
  const c = corpo as Record<string, unknown>;
  return typeof c.legislationIdentifier === "string" && c.legislationIdentifier.length > 0;
}
