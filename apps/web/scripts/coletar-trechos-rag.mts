#!/usr/bin/env node
/**
 * Coleta os trechos do RAG que sustentam a síntese dos temas gerais.
 *
 * POR QUE EXISTE
 *
 * A síntese precisa de duas coisas ao mesmo tempo: a tabela medida (contagem
 * do acervo) e o que as fontes primárias realmente dizem. O primeiro vem do
 * `temas-gerais.json`; o segundo, daqui. Cada tema tem uma pergunta fixa, e a
 * resposta guarda documento, página, URL e trecho literal.
 *
 * REGRA: só entra trecho com página > 0. O `pagina: 0` é o metadado/resumo do
 * manifesto, que já foi gerado por modelo e não serve como fonte. Quando o
 * tema só tem metadado, o registro sai com `semTexto: true` — e a síntese é
 * obrigada a dizer "não dá para concluir".
 *
 * Uso (em apps/web):
 *     npx tsx scripts/coletar-trechos-rag.mts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buscarDocumentos } from "../lib/assistente/documentos-rag/carregar";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DESTINO = path.resolve(
  AQUI,
  "..",
  "..",
  "..",
  "..",
  "tjmg-jurimetria",
  "relatorios",
  "trechos-rag.json"
);

interface Consulta {
  tema: string;
  pergunta: string;
}

const CONSULTAS: Consulta[] = [
  { tema: "A1", pergunta: "perícia judicial prevalece sobre laudo particular" },
  { tema: "A2", pergunta: "inversão do ônus da prova por hipossuficiência" },
  { tema: "A4", pergunta: "cerceamento de defesa por indeferimento de prova" },
  { tema: "B1", pergunta: "gratuidade de justiça das pessoas atingidas" },
  { tema: "B3", pergunta: "legitimidade ativa do atingido" },
  { tema: "B4", pergunta: "ação civil pública e coisa julgada coletiva" },
  { tema: "B7", pergunta: "prescrição da pretensão indenizatória" },
  { tema: "B8", pergunta: "coisa julgada e acordo de reparação" },
  { tema: "C1", pergunta: "nexo causal e prova do dano individual" },
  { tema: "C3", pergunta: "dano moral e critérios de fixação" },
  { tema: "C5", pergunta: "honorários sucumbenciais e princípio da causalidade" },
  { tema: "D1", pergunta: "auxílio emergencial e programa de transferência de renda" },
  { tema: "D2", pergunta: "acordo judicial de reparação integral e TAP" },
  { tema: "ENT", pergunta: "indenização individual das pessoas atingidas" },
  { tema: "ENT", pergunta: "matriz de danos e reparação integral" },
  { tema: "CNJ", pergunta: "precedentes qualificados e gestão de casos" },
];

async function coletar(): Promise<void> {
  const saida: Record<string, unknown[]> = {};
  for (const consulta of CONSULTAS) {
    const resultados = await buscarDocumentos(consulta.pergunta, { limite: 6 });
    const comTexto = resultados.filter((item) => item.trecho.pagina > 0);
    const registro = {
      pergunta: consulta.pergunta,
      semTexto: comTexto.length === 0,
      trechos: comTexto.map((item) => ({
        score: Number(item.score.toFixed(3)),
        titulo: item.trecho.titulo,
        orgao: item.trecho.orgao,
        pagina: item.trecho.pagina,
        url: item.trecho.urlOriginal,
        texto: item.trecho.texto.slice(0, 1200),
      })),
    };
    saida[consulta.tema] = [...(saida[consulta.tema] ?? []), registro];
    console.log(
      `${consulta.tema}: ${comTexto.length} trechos | ${consulta.pergunta}`
    );
  }
  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(
    DESTINO,
    JSON.stringify({ geradoEm: new Date().toISOString(), consultas: saida }, null, 1),
    "utf-8"
  );
  console.log(`arquivo: ${DESTINO}`);
}

coletar().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
