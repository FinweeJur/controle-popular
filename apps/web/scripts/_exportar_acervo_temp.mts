import { writeFileSync } from "node:fs";
import { montarAcervoDetalhado } from "../lib/assistente/acervo";

const acervo = montarAcervoDetalhado();
const saida = process.argv[2];
writeFileSync(
  saida,
  JSON.stringify(
    {
      geradoEm: new Date().toISOString().slice(0, 10),
      total: acervo.fontes.length,
      cobertura: acervo.cobertura,
      fontes: acervo.fontes,
    },
    null,
    0
  )
);
console.log("acervo:", acervo.fontes.length, "pecas");
