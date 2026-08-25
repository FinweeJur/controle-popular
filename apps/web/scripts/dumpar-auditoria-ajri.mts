/**
 * Despeja o catálogo AUDITORIA_AJRI para `public/data/auditoria-ajri.json`.
 *
 * O array é carregado pelo componente de cliente via fetch, em vez de ser
 * embutido no bundle do Worker (teto de 3 MiB gzip do plano Free). Uso único
 * de migração — o arquivo é versionado em `public/data`.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { AUDITORIA_AJRI } from "@/lib/paraopeba/auditoria-ajri";

const destino = path.resolve(process.cwd(), "public", "data", "auditoria-ajri.json");
writeFileSync(destino, JSON.stringify(AUDITORIA_AJRI));
console.log(`✓ ${destino} — ${AUDITORIA_AJRI.length} documentos`);
