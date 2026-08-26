// Reponta os últimos consumidores de dados inline para os loaders.
const fs = require("fs");

function edit(p, fn) {
  let t = fs.readFileSync(p, "utf8");
  const antes = t;
  t = fn(t);
  if (t === antes) throw new Error("nenhuma mudança em " + p);
  fs.writeFileSync(p, t, "utf8");
  console.log("ok", p);
}

// ── dados.test.ts: três clippings via loaders (alias mantém os nomes)
edit("lib/paraopeba/dados.test.ts", (t) => {
  t = t.replace(/(\r?\n)  CLIPPING_PARAOPEBA,/, "$1");
  t = t.replace(/(\r?\n)  CLIPPING_IJ,/, "$1");
  t = t.replace(
    'import { COBERTURA_CLIPPING_ATI, CLIPPING_ATI } from "./clipping-ati";',
    'import { COBERTURA_CLIPPING_ATI } from "./clipping-ati";\n' +
      'import {\n  lerClippingParaopeba,\n  lerClippingAti,\n  lerClippingIj,\n} from "./acervos-dados";\n\n' +
      '/** Sinônimos — o dado agora vive nos loaders server-only. */\n' +
      'const CLIPPING_PARAOPEBA = lerClippingParaopeba();\n' +
      'const CLIPPING_ATI = lerClippingAti();\n' +
      'const CLIPPING_IJ = lerClippingIj();'
  );
  return t;
});

// ── sintese-integrada.ts (+ .test): perícia via loader
for (const p of ["lib/paraopeba/sintese-integrada.ts"]) {
  edit(p, (t) =>
    t.replace(
      /import \{ ESTUDOS_PERICIA_COM_TEMA, RESULTADOS_PERICIA, type EstudoPericiaComTema \} from "\.\/pericia-ufmg";/,
      'import { type EstudoPericiaComTema } from "./pericia-ufmg";\n' +
        'import {\n  lerEstudosPericiaComTema,\n  lerResultadosPericia,\n} from "./acervos-dados";\n\n' +
        '/** Sinônimos — o dado agora vive no loader server-only. */\n' +
        'const ESTUDOS_PERICIA_COM_TEMA = lerEstudosPericiaComTema();\n' +
        'const RESULTADOS_PERICIA = lerResultadosPericia();'
    )
  );
}

// ── estudo-e-noticia.ts: CLIPPING_ATI via loader
edit("lib/paraopeba/estudo-e-noticia.ts", (t) =>
  t.replace(
    'import { CLIPPING_ATI, type NoticiaAti } from "./clipping-ati";',
    'import { type NoticiaAti } from "./clipping-ati";\nimport { lerClippingAti } from "./acervos-dados";\n\n/** Sinônimo — o dado agora vive no loader server-only. */\nconst CLIPPING_ATI = lerClippingAti();'
  )
);

// ── relacionados.test.ts: extras + ESTUDOS via loader + helper R()
edit("lib/paraopeba/relacionados.test.ts", (t) => {
  t = t.replace(
    'import { ESTUDOS_PERICIA_COM_TEMA } from "./pericia-ufmg";',
    'import { type DocumentoAuditoriaAjri } from "./auditoria-ajri";\n' +
      'import {\n  lerClippingAti,\n  lerClippingIj,\n  lerClippingParaopeba,\n  lerEstudosPericiaComTema,\n} from "./acervos-dados";\n\n' +
      'const EXTRAS = {\n  ati: lerClippingAti(),\n  ij: lerClippingIj(),\n  imprensa: lerClippingParaopeba(),\n  pericia: lerEstudosPericiaComTema(),\n};\n\n' +
      '/** Helper: relacionadas com os acervos reais dos loaders. */\n' +
      'function R(doc: DocumentoAuditoriaAjri): ReturnType<typeof relacionadosDaFicha> {\n' +
      '  return relacionadosDaFicha(doc, AUDITORIA_AJRI, EXTRAS);\n}'
  );
  // chamadas existentes -> R(...)
  t = t.replace(/relacionadosDaFicha\(([^,\r\n]+), AUDITORIA_AJRI\)/g, "R($1)");
  // ESTUDOS direto -> loader
  t = t.split("ESTUDOS_PERICIA_COM_TEMA").join("EXTRAS.pericia");
  return t;
});
