import { writeFileSync } from "node:fs";
import path from "node:path";
import { DOCUMENTOS_PROCESSO } from "../lib/paraopeba/documentos";

const destino = path.resolve(process.cwd(), "public", "data", "documentos-paraopeba.json");
writeFileSync(destino, JSON.stringify(DOCUMENTOS_PROCESSO), "utf-8");
console.log(`documentos-paraopeba.json: ${DOCUMENTOS_PROCESSO.length} documentos -> ${destino}`);
