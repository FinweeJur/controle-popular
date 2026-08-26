// PainelTac passa a buscar os acordos como asset (hook + shadow local).
const fs = require("fs");
const p = "apps/web/app/ambiental/tac/PainelTac.tsx";
let t = fs.readFileSync(p, "utf8");

const ancora =
  'import { TAC_ACORDOS_PROJETOS, contratosParaCsv } from "@/lib/ambiental/tac-agregados";';
if (!t.includes(ancora)) throw new Error("âncora não achada");

t = t.replace(
  ancora,
  'import { contratosParaCsv, type AcordoTacContrato } from "@/lib/ambiental/tac-agregados";\n' +
    'import { useEffect, useMemo, useState } from "react";\n\n' +
    '/** Os 106 acordos saíram do bundle e viram asset estático\n' +
    ' * (public/data/tac-projetos.json) — teto de 3 MiB gzip do Worker, 10027. */\n' +
    'let cacheAcordos: Promise<AcordoTacContrato[]> | null = null;\n' +
    'function buscarAcordos(): Promise<AcordoTacContrato[]> {\n' +
    '  if (!cacheAcordos) cacheAcordos = fetch("/data/tac-projetos.json").then(\n' +
    '    (r) => r.json() as Promise<{ TAC_ACORDOS_PROJETOS: AcordoTacContrato[] }>\n' +
    '  ).then((d) => d.TAC_ACORDOS_PROJETOS);\n' +
    '  return cacheAcordos;\n' +
    '}\n' +
    'function useTacAcordos(): AcordoTacContrato[] {\n' +
    '  const [l, setL] = useState<AcordoTacContrato[] | null>(null);\n' +
    '  useEffect(() => { let vivo = true; buscarAcordos().then((d) => { if (vivo) setL(d); }); return () => { vivo = false; }; }, []);\n' +
    '  return l ?? [];\n' +
    '}'
);

// sombreia dentro do componente principal
t = t.replace(
  /export default function PainelTac\(\) \{\r?\n/,
  "export default function PainelTac() {\n  const TAC_ACORDOS_PROJETOS = useTacAcordos();\n"
);

fs.writeFileSync(p, t, "utf8");
console.log(
  "ok PainelTac | hook:",
  t.includes("useTacAcordos();"),
  "| usos restantes do import antigo:",
  (t.match(/TAC_ACORDOS_PROJETOS/g) || []).length
);
