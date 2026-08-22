/**
 * Gera `apps/web/lib/paraopeba/sintese-pericia.ts` a partir de
 * `X:\DevCoder\_lote-ambiental\analise\sintese-final.md` — a síntese que cruza
 * os 7 documentos de resultado da perícia da UFMG com os eixos da auditoria
 * AECOM e as notícias das ATIs.
 *
 * ═══ POR QUE A FONTE FICA FORA DO REPO ═══
 *
 * Mesma decisão de `gerar-sintese-ajri.mts`: o texto de trabalho não é
 * versionado ao lado do `.ts` gerado, senão existem duas cópias e alguém edita
 * a que não está publicada. Só o `.ts` gerado + este script entram no repo.
 *
 * ═══ O QUE ESTE SCRIPT CONFERE ═══
 *
 * A síntese-fonte passou por um ciclo de checagem próprio antes de chegar
 * aqui: cada um dos 7 resumos foi auditado (Sonnet, até 2 rodadas — 4 ficaram
 * com ressalva registrada), e a síntese final também foi auditada contra o
 * material de origem (mesmo padrão, focado em data/número/ressalva omitida).
 * O que este script garante é que a INTEGRAÇÃO não corte a estrutura:
 *
 * 1. As quatro seções (o que concluiu, onde concordam, onde divergem, o que
 *    nenhuma responde) têm que existir e ter pelo menos um item — seção vazia
 *    vira bloco mudo na página.
 * 2. A observação de método final (que declara quais dos 7 documentos ficaram
 *    com ressalva) tem que existir — é o aviso que evita apresentar número
 *    parcialmente verificado como fato assentado.
 * 3. Varredura de mojibake no arquivo gravado, relido do disco.
 *
 * Uso:
 *   npx tsx scripts/gerar-sintese-pericia.mts            # grava
 *   npx tsx scripts/gerar-sintese-pericia.mts --conferir # só mede, não grava
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FONTE = "X:/DevCoder/_lote-ambiental/analise/sintese-final.md";
const DESTINO = resolve(RAIZ, "lib/paraopeba/sintese-pericia.ts");

function extrairSecao(md: string, tituloExato: string): string {
  const marca = `## ${tituloExato}`;
  const inicio = md.indexOf(marca);
  if (inicio === -1) throw new Error(`seção ausente: "${tituloExato}"`);
  const resto = md.slice(inicio + marca.length);
  // a última seção não tem "## " seguinte para limitar o corte — sem parar
  // também em "---" (delimitador antes do rodapé), ela engole a observação
  // de método inteira como se fosse mais um item da lista.
  const candidatos = [resto.search(/\n## /), resto.search(/\n---/)].filter((i) => i !== -1);
  const fim = candidatos.length ? Math.min(...candidatos) : -1;
  return (fim === -1 ? resto : resto.slice(0, fim)).trim();
}

function paragrafos(bloco: string): string[] {
  return bloco
    .split(/\n\s*\n/)
    .map((p) => p.replace(/^-\s*/, "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function conferirMojibake(texto: string, onde: string) {
  // sequencia classica de UTF-8 relido como Latin-1/CP1252: 0xC3 ou 0xC2
  // seguido de um byte de continuacao, cada um virando 1 char Unicode.
  for (let i = 0; i < texto.length - 1; i++) {
    const a = texto.codePointAt(i)!;
    const b = texto.codePointAt(i + 1)!;
    if ((a === 0xc3 || a === 0xc2) && b >= 0x80 && b <= 0xbf) {
      throw new Error(`mojibake detectado em ${onde} -- verifique o encoding da fonte`);
    }
  }
}

function gerar() {
  const md = readFileSync(FONTE, "utf-8");
  conferirMojibake(md, "fonte");

  const concluiu = paragrafos(extrairSecao(md, "O que a perícia concluiu"));
  const mesmaCoisa = paragrafos(extrairSecao(md, "Onde a perícia e a auditoria dizem a mesma coisa"));
  const divergem = paragrafos(extrairSecao(md, "Onde divergem"));
  const naoRespondem = paragrafos(extrairSecao(md, "O que nenhuma das duas responde"));

  const rodape = md.slice(md.lastIndexOf("---") + 3).trim();
  const observacaoDeMetodo = rodape.replace(/^Observação de método:\s*/, "");

  for (const [nome, lista] of [
    ["O que a perícia concluiu", concluiu],
    ["Onde concordam", mesmaCoisa],
    ["Onde divergem", divergem],
    ["O que nenhuma responde", naoRespondem],
  ] as const) {
    if (lista.length === 0) throw new Error(`seção "${nome}" ficou sem itens`);
  }
  if (!observacaoDeMetodo) throw new Error("observação de método ausente");

  const tituloMd = md.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";

  return { titulo: tituloMd, concluiu, mesmaCoisa, divergem, naoRespondem, observacaoDeMetodo };
}

function serializar(v: string): string {
  return JSON.stringify(v);
}

function main() {
  const dados = gerar();
  const conferir = process.argv.includes("--conferir");

  console.log(`título: ${dados.titulo}`);
  console.log(`concluiu: ${dados.concluiu.length} parágrafo(s)`);
  console.log(`concordam: ${dados.mesmaCoisa.length} item(ns)`);
  console.log(`divergem: ${dados.divergem.length} item(ns)`);
  console.log(`não respondem: ${dados.naoRespondem.length} item(ns)`);

  if (conferir) {
    console.log("--conferir: nada gravado.");
    return;
  }

  const ts = `/**
 * GERADO por \`scripts/gerar-sintese-pericia.mts\` a partir de
 * ${FONTE} — não editar à mão; edite a fonte e rode o script de novo.
 *
 * A síntese cruza os 7 documentos de resultado da perícia da UFMG com os
 * eixos da auditoria AECOM e as notícias das ATIs. Passou por checagem em
 * duas camadas: cada resumo-fonte foi auditado individualmente (4 dos 7
 * ficaram com ressalva registrada, citada inline onde o número aparece), e a
 * síntese final foi auditada de novo contra o material de origem.
 */

export interface SintesePericia {
  titulo: string;
  /** "O que a perícia concluiu" — um item por parágrafo. */
  concluiu: string[];
  /** "Onde a perícia e a auditoria dizem a mesma coisa" — um item por achado. */
  mesmaCoisa: string[];
  /** "Onde divergem" — um item por ponto de tensão. */
  divergem: string[];
  /** "O que nenhuma das duas responde" — as lacunas que sobram dos dois acervos. */
  naoRespondem: string[];
  /** Nota final: quais documentos-fonte ficaram com ressalva de checagem. */
  observacaoDeMetodo: string;
}

export const SINTESE_PERICIA: SintesePericia = {
  titulo: ${serializar(dados.titulo)},
  concluiu: ${JSON.stringify(dados.concluiu, null, 2)},
  mesmaCoisa: ${JSON.stringify(dados.mesmaCoisa, null, 2)},
  divergem: ${JSON.stringify(dados.divergem, null, 2)},
  naoRespondem: ${JSON.stringify(dados.naoRespondem, null, 2)},
  observacaoDeMetodo: ${serializar(dados.observacaoDeMetodo)},
};
`;

  writeFileSync(DESTINO, ts, "utf-8");
  conferirMojibake(readFileSync(DESTINO, "utf-8"), "arquivo gravado");
  console.log(`gravado: ${DESTINO}`);
}

main();
