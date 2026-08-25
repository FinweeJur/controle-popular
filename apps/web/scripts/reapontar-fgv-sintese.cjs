// Reaponta consumidores para os loaders server-only (migração 3 MiB).
const fs = require("fs");

function edit(p, fn) {
  let t = fs.readFileSync(p, "utf8");
  const antes = t;
  t = fn(t);
  if (t === antes) throw new Error("nenhuma mudança em " + p);
  fs.writeFileSync(p, t, "utf8");
  console.log("ok", p);
}

for (const p of [
  "lib/paraopeba/sintese-integrada.ts",
  "lib/paraopeba/sintese.test.ts",
]) {
  edit(p, (t) =>
    t.replace(
      'import { SINTESE_AJRI } from "./sintese-ajri";',
      'import { lerSinteseAjri } from "./sintese-ajri-dados";\n\n/** Sinônimo — dado agora no loader server-only. */\nconst SINTESE_AJRI = lerSinteseAjri();'
    )
  );
}

edit("lib/paraopeba/dados.test.ts", (t) =>
  t.replace(
    'import {\n  COBERTURA_EXECUCAO_FGV,\n  MUNICIPIOS_EXECUCAO_FGV,\n  STATUS_PROJETOS_FGV,\n} from "./execucao-fgv";',
    'import { COBERTURA_EXECUCAO_FGV } from "./execucao-fgv";\nimport { MUNICIPIOS_EXECUCAO_FGV, STATUS_PROJETOS_FGV } from "./execucao-fgv-dados";'
  )
);

edit("lib/paraopeba/execucao-fgv.test.ts", (t) =>
  t.replace(
    'import {\n  MUNICIPIOS_EXECUCAO_FGV,\n  PROJETOS_EXECUCAO_FGV,\n  PROJETOS_ESPECIAIS_FGV,\n  STATUS_PROJETOS_FGV,\n  REFERENCIA_EXECUCAO_FGV,\n  TOTAL_EXECUCAO_FGV,\n} from "./execucao-fgv";',
    'import {\n  MUNICIPIOS_EXECUCAO_FGV,\n  PROJETOS_EXECUCAO_FGV,\n  PROJETOS_ESPECIAIS_FGV,\n  STATUS_PROJETOS_FGV,\n} from "./execucao-fgv-dados";\nimport { REFERENCIA_EXECUCAO_FGV, TOTAL_EXECUCAO_FGV } from "./execucao-fgv";'
  )
);
