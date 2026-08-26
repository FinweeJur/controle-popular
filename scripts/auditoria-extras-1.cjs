// AuditoriaClient: hooks dos acervos extras + extras no relacionadosDaFicha.
const fs = require("fs");
const p = "app/paraopeba/auditoria/AuditoriaClient.tsx";
let t = fs.readFileSync(p, "utf8");

const ancora = "import { relacionadosDaFicha } from \"@/lib/paraopeba/relacionados\";";
if (!t.includes(ancora)) throw new Error("âncora não achada");

t = t.replace(
  ancora,
  ancora +
    '\nimport { type NoticiaAti } from "@/lib/paraopeba/clipping-ati";\n' +
    'import { type NoticiaInstituicaoJustica } from "@/lib/paraopeba/clipping-ij";\n' +
    'import { type EstudoPericiaComTema } from "@/lib/paraopeba/pericia-ufmg";\n\n' +
    '/** Assets dos acervos usados pelos "relacionados" — buscados uma vez. */\n' +
    'let cacheAti: Promise<NoticiaAti[]> | null = null;\n' +
    'let cacheIj: Promise<NoticiaInstituicaoJustica[]> | null = null;\n' +
    'let cachePericia: Promise<EstudoPericiaComTema[]> | null = null;\n\n' +
    'async function baixarAcervo<T>(url: string, chave: string): Promise<T[]> {\n' +
    '  const r = await fetch(url);\n' +
    '  const j = (await r.json()) as Record<string, T[]>;\n' +
    '  return j[chave];\n' +
    '}\n\n' +
    'function useAcervosExtras(): { ati: NoticiaAti[]; ij: NoticiaInstituicaoJustica[]; pericia: EstudoPericiaComTema[] } | null {\n' +
    '  const [extras, setExtras] = useState<{ ati: NoticiaAti[]; ij: NoticiaInstituicaoJustica[]; pericia: EstudoPericiaComTema[] } | null>(null);\n' +
    '  useEffect(() => {\n' +
    '    let vivo = true;\n' +
    '    if (!cacheAti) cacheAti = baixarAcervo("/data/clipping-ati.json", "CLIPPING_ATI");\n' +
    '    if (!cacheIj) cacheIj = baixarAcervo("/data/clipping-ij.json", "CLIPPING_IJ");\n' +
    '    if (!cachePericia) cachePericia = baixarAcervo("/data/estudos-pericia.json", "ACERVO_PERICIA");\n' +
    '    Promise.all([cacheAti, cacheIj, cachePericia])\n' +
    '      .then(([ati, ij, pericia]) => { if (vivo) setExtras({ ati, ij, pericia }); })\n' +
    '      .catch(() => {});\n' +
    '    return () => { vivo = false; };\n' +
    '  }, []);\n' +
    '  return extras;\n' +
    '}'
);

// RelacionadosDaFicha: recebe extras e passa adiante
t = t.replace(
  /function RelacionadosDaFicha\(\{\r?\n  doc,\r?\n  acervo,\r?\n\}: \{\r?\n  doc: DocumentoAuditoriaAjri;\r?\n  acervo: DocumentoAuditoriaAjri\[\];\r?\n\}\) \{/,
  "function RelacionadosDaFicha({\n  doc,\n  acervo,\n  extras,\n}: {\n  doc: DocumentoAuditoriaAjri;\n  acervo: DocumentoAuditoriaAjri[];\n  extras: { ati: NoticiaAti[]; ij: NoticiaInstituicaoJustica[]; pericia: EstudoPericiaComTema[] } | null;\n}) {"
);
t = t.replace(
  /const rel = useMemo\(\(\) => relacionadosDaFicha\(doc, acervo\), \[doc, acervo\]\);/,
  "const rel = useMemo(\n    () => (extras ? relacionadosDaFicha(doc, acervo, extras) : null),\n    [doc, acervo, extras]\n  );"
);

// Ficha propaga extras
t = t.replace(
  /<RelacionadosDaFicha doc=\{doc\} \/>\r?\n/,
  "<RelacionadosDaFicha doc={doc} acervo={acervo} extras={extras} />\n"
);
t = t.replace(
  /function Ficha\(\{\r?\n  doc,\r?\n  acervo,\r?\n\}: \{\r?\n  doc: DocumentoAuditoriaAjri;\r?\n  acervo: DocumentoAuditoriaAjri\[\];\r?\n  extras:/,
  "function Ficha({\n  doc,\n  acervo,\n  extras,\n}: {\n  doc: DocumentoAuditoriaAjri;\n  acervo: DocumentoAuditoriaAjri[];\n  extras:"
);

fs.writeFileSync(p, t, "utf8");
console.log("ok AuditoriaClient (parte 1)");
