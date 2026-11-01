/** Diagnóstico do gabarito: por que algumas perguntas não acham o documento. */
import { buscarDocumentos } from "../lib/assistente/documentos-rag/carregar";
import doc from "../public/data/documentos-rag/trechos.json" with { type: "json" };

const alvo = "probrumadinho:pb-acordo-judicial-de-reparacao-texto";
const trechos = (doc as { trechos: { docId: string; texto: string }[] }).trechos;
const doAcordo = trechos.filter((t) => t.docId === alvo);
console.log(`trechos do Acordo: ${doAcordo.length}`);
console.log(`amostra: ${(doAcordo[0]?.texto ?? "").slice(0, 220)}`);

const consultas = [
  "acordo judicial de reparação Brumadinho",
  "quais obrigações a Vale assumiu no acordo",
  "valor total do acordo de reparação",
  "papel da Defensoria Pública no acordo",
  "povos e comunidades tradicionais",
  "agricultura familiar nos relatórios",
  "reassentamento de famílias rurais",
  "como denunciar descumprimento do acordo",
];

for (const consulta of consultas) {
  const r = await buscarDocumentos(consulta, { limite: 3 });
  console.log(`\n> ${consulta}`);
  for (const item of r) console.log(`   ${item.score.toFixed(3)} ${item.trecho.docId}`);
}
