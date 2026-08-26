// relacionados.ts: acervos por parâmetro (versão CRLF-tolerante).
const fs = require("fs");
const p = "lib/paraopeba/relacionados.ts";
let t = fs.readFileSync(p, "utf8");

function sub(re, para) {
  if (!re.test(t)) throw new Error("padrão não achado: " + re);
  t = t.replace(re, para);
}

sub(/import \{ CLIPPING_ATI, type NoticiaAti, type TemaAti \} from "\.\/clipping-ati";/, 'import { type NoticiaAti, type TemaAti } from "./clipping-ati";');
sub(/import \{\r?\n  CLIPPING_IJ,\r?\n  type NoticiaInstituicaoJustica,\r?\n  type TemaClippingIj,\r?\n\} from "\.\/clipping-ij";/, 'import {\n  type NoticiaInstituicaoJustica,\n  type TemaClippingIj,\n} from "./clipping-ij";');
sub(/import \{ CLIPPING_PARAOPEBA, type NoticiaClipping \} from "\.\/clipping";/, 'import { type NoticiaClipping } from "./clipping";');
sub(/import \{\r?\n  ESTUDOS_PERICIA_COM_TEMA,\r?\n  type EstudoPericiaComTema,\r?\n\} from "\.\/pericia-ufmg";/, 'import { type EstudoPericiaComTema } from "./pericia-ufmg";');

const iface =
  "export interface AcervosExtras {\n" +
  "  ati: NoticiaAti[];\n" +
  "  ij: NoticiaInstituicaoJustica[];\n" +
  "  imprensa: NoticiaClipping[];\n" +
  "  pericia: EstudoPericiaComTema[];\n" +
  "}\n\n";
t = t.replace("export function relacionadosDaFicha(", iface + "export function relacionadosDaFicha(");
sub(/  acervo: DocumentoAuditoriaAjri\[\]\r?\n\): RelacionadosFicha \{/, "  acervo: DocumentoAuditoriaAjri[],\n  acervos: AcervosExtras\n): RelacionadosFicha {");

t = t.split("CLIPPING_ATI.filter").join("acervos.ati.filter");
t = t.split("CLIPPING_IJ.filter").join("acervos.ij.filter");
t = t.split("CLIPPING_PARAOPEBA.filter").join("acervos.imprensa.filter");
t = t.split("ESTUDOS_PERICIA_COM_TEMA.filter").join("acervos.pericia.filter");

fs.writeFileSync(p, t, "utf8");
console.log("ok relacionados.ts");
