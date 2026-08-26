// Ficha: propaga extras; corpo principal: chama useAcervosExtras.
const fs = require("fs");
const p = "app/paraopeba/auditoria/AuditoriaClient.tsx";
let t = fs.readFileSync(p, "utf8");

// assinatura da Ficha
t = t.replace(
  /function Ficha\(\{\r?\n  doc,\r?\n  resumos,\r?\n  acervo,\r?\n\}: \{\r?\n  doc: DocumentoAuditoriaAjri;\r?\n  resumos: Record<string, ResumoAjri> \| null;\r?\n  acervo: DocumentoAuditoriaAjri\[\];\r?\n\}\) \{/,
  "function Ficha({\n  doc,\n  resumos,\n  acervo,\n  extras,\n}: {\n  doc: DocumentoAuditoriaAjri;\n  resumos: Record<string, ResumoAjri> | null;\n  acervo: DocumentoAuditoriaAjri[];\n  extras: { ati: NoticiaAti[]; ij: NoticiaInstituicaoJustica[]; pericia: EstudoPericiaComTema[] } | null;\n}) {"
);

// passagem para RelacionadosDaFicha
t = t.replace(
  "<RelacionadosDaFicha doc={doc} acervo={acervo} />",
  "<RelacionadosDaFicha doc={doc} acervo={acervo} extras={extras} />"
);

// instanciação da Ficha no corpo principal
t = t.replace(
  "<Ficha key={d.id} doc={d} resumos={resumos} acervo={acervo} />",
  "<Ficha key={d.id} doc={d} resumos={resumos} acervo={acervo} extras={extras} />"
);

// hook no corpo principal (junto do useAuditoriaAjri existente)
t = t.replace(
  /(\} = useAuditoriaAjri\(\);)/,
  "$1\n  const extras = useAcervosExtras();"
);
if (!t.includes("const extras = useAcervosExtras();")) {
  // fallback: insere após a linha do useState inicial do componente principal
  t = t.replace(
    /(function AuditoriaClient\(\{ buscaInicial[^\n]*\}: \{[^}]*\}\) \{\r?\n)/,
    "$1  const extras = useAcervosExtras();\n"
  );
}

fs.writeFileSync(p, t, "utf8");

const checks = {
  fichaExtras: /extras,/.test(t),
  passaExtras: t.includes("<Ficha key={d.id} doc={d} resumos={resumos} acervo={acervo} extras={extras} />"),
  hookChamado: t.includes("const extras = useAcervosExtras();"),
};
console.log(JSON.stringify(checks));
if (!Object.values(checks).every(Boolean)) process.exit(1);
