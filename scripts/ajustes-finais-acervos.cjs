// Ajustes finais: imprensa no hook, early-return de rel, useEffect import.
const fs = require("fs");

function edit(p, fn) {
  let t = fs.readFileSync(p, "utf8");
  const antes = t;
  t = fn(t);
  if (t === antes) throw new Error("nenhuma mudança em " + p);
  fs.writeFileSync(p, t, "utf8");
  console.log("ok", p);
}

// ── AuditoriaClient: imprensa entra nos extras + early return
edit("app/paraopeba/auditoria/AuditoriaClient.tsx", (t) => {
  t = t.replace(
    'let cachePericia: Promise<EstudoPericiaComTema[]> | null = null;',
    'let cachePericia: Promise<EstudoPericiaComTema[]> | null = null;\n' +
      'let cacheImprensa: Promise<NoticiaClipping[]> | null = null;'
  );
  if (!t.includes('import { type NoticiaClipping }')) {
    t = t.replace(
      'import { type EstudoPericiaComTema } from "@/lib/paraopeba/pericia-ufmg";',
      'import { type EstudoPericiaComTema } from "@/lib/paraopeba/pericia-ufmg";\n' +
        'import { type NoticiaClipping } from "@/lib/paraopeba/clipping";'
    );
  }
  t = t.replace(
    /function useAcervosExtras\(\): \{([^}]+)\} \| null \{/,
    (m, campos) => {
      const comVirgula = campos.trimEnd().endsWith(",") ? campos : campos + ",\n";
      return (
        "function useAcervosExtras(): {" +
        comVirgula +
        "\n  imprensa: NoticiaClipping[];\n} | null {"
      );
    }
  );
  t = t.replace(
    'if (!cachePericia) cachePericia = baixarAcervo("/data/estudos-pericia.json", "ACERVO_PERICIA");',
    'if (!cachePericia) cachePericia = baixarAcervo("/data/estudos-pericia.json", "ACERVO_PERICIA");\n' +
      '    if (!cacheImprensa) cacheImprensa = baixarAcervo("/data/clipping-paraopeba.json", "CLIPPING_PARAOPEBA");'
  );
  t = t.replace(
    /\.then\(\(\[ati, ij, pericia\]\) => \{ if \(vivo\) setExtras\(\{ ati, ij, pericia \}\); \}\)/,
    ".then(([ati, ij, pericia, imprensa]) => {\n" +
      "      if (vivo) setExtras({ ati, ij, pericia, imprensa });\n" +
      "    })"
  );
  t = t.replace(
    /(const rel = useMemo\(\r?\n\s*\(\) => \(extras \? relacionadosDaFicha\(doc, acervo, extras\) : null\),\r?\n\s*\[doc, acervo, extras\]\r?\n\s*\);)/,
    "$1\n  if (!rel) return null;"
  );
  // tipo do estado inicial inclui imprensa
  t = t.replace(
    /useState<\{ ati: NoticiaAti\[\]; ij: NoticiaInstituicaoJustica\[\]; pericia: EstudoPericiaComTema\[\] \} \| null>\(null\);/,
    "useState<{ ati: NoticiaAti[]; ij: NoticiaInstituicaoJustica[]; pericia: EstudoPericiaComTema[]; imprensa: NoticiaClipping[] } | null>(null);"
  );
  return t;
});

// ── ClippingClient: useEffect no import do react
edit("app/paraopeba/clipping/ClippingClient.tsx", (t) => {
  return t.replace(
    'import { useMemo, useState } from "react";',
    'import { useEffect, useMemo, useState } from "react";'
  );
});
