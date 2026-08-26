// Converte ClippingClient para buscar os três acervos como assets.
const fs = require("fs");
const p = "app/paraopeba/clipping/ClippingClient.tsx";
let t = fs.readFileSync(p, "utf8");

// 1) remove os três nomes do import do barril
for (const n of ["CLIPPING_PARAOPEBA", "CLIPPING_ATI", "CLIPPING_IJ"]) {
  t = t.replace(new RegExp("^\\s*" + n + ",\\r?\\n", "m"), "");
}

// 2) hooks + caches após os imports
const ancora = 'import { formatDateBR, formatNumberBR } from "@/lib/betim/format";';
if (!t.includes(ancora)) throw new Error("âncora não achada");
t = t.replace(
  ancora,
  ancora +
    '\n\n/** Os três acervos saíram do bundle e viram assets estáticos buscados aqui\n' +
    ' * (mesmo padrão dos resumos da AJRI). Teto de 3 MiB gzip do Worker, 10027. */\n' +
    'let cacheParaopeba: Promise<NoticiaClipping[]> | null = null;\n' +
    'let cacheAti: Promise<NoticiaAti[]> | null = null;\n' +
    'let cacheIj: Promise<NoticiaInstituicaoJustica[]> | null = null;\n\n' +
    'async function baixar<T>(url: string, chave: string): Promise<T[]> {\n' +
    '  const r = await fetch(url);\n' +
    '  const j = (await r.json()) as Record<string, T[]>;\n' +
    '  return j[chave];\n' +
    '}\n\n' +
    'function useClippingParaopeba(): NoticiaClipping[] {\n' +
    '  const [l, setL] = useState<NoticiaClipping[] | null>(null);\n' +
    '  useEffect(() => { let vivo = true; if (!cacheParaopeba) cacheParaopeba = baixar("/data/clipping-paraopeba.json", "CLIPPING_PARAOPEBA"); cacheParaopeba.then((d) => { if (vivo) setL(d); }); return () => { vivo = false; }; }, []);\n' +
    '  return l ?? [];\n' +
    '}\n' +
    'function useClippingAti(): NoticiaAti[] {\n' +
    '  const [l, setL] = useState<NoticiaAti[] | null>(null);\n' +
    '  useEffect(() => { let vivo = true; if (!cacheAti) cacheAti = baixar("/data/clipping-ati.json", "CLIPPING_ATI"); cacheAti.then((d) => { if (vivo) setL(d); }); return () => { vivo = false; }; }, []);\n' +
    '  return l ?? [];\n' +
    '}\n' +
    'function useClippingIj(): NoticiaInstituicaoJustica[] {\n' +
    '  const [l, setL] = useState<NoticiaInstituicaoJustica[] | null>(null);\n' +
    '  useEffect(() => { let vivo = true; if (!cacheIj) cacheIj = baixar("/data/clipping-ij.json", "CLIPPING_IJ"); cacheIj.then((d) => { if (vivo) setL(d); }); return () => { vivo = false; }; }, []);\n' +
    '  return l ?? [];\n' +
    '}'
);

// 3) sombreia o nome dentro de cada Seção
t = t.replace("function SecaoAti() {", "function SecaoAti() {\n  const CLIPPING_ATI = useClippingAti();");
t = t.replace("function SecaoIj() {", "function SecaoIj() {\n  const CLIPPING_IJ = useClippingIj();");
t = t.replace("function SecaoClipping() {", "function SecaoClipping() {\n  const CLIPPING_PARAOPEBA = useClippingParaopeba();");

fs.writeFileSync(p, t, "utf8");
console.log("ok ClippingClient");
