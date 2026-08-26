// Mescla ACERVO_PERICIA (dump anterior) com RESUMO_DO_ACERVO extraído do
// HEAD, gerando o bundle final estudos-pericia-bundle.json.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// sobe do cwd até achar scripts/.env (marca da raiz do repo)
let raiz = process.cwd();
for (let i = 0; i < 6 && !fs.existsSync(path.join(raiz, "scripts", ".env")); i++) {
  raiz = path.dirname(raiz);
}
const alvoModulo = path.join(raiz, "apps/web/lib/paraopeba/pericia-ufmg.ts");
const head = execSync(`git show HEAD:${"apps/web/lib/paraopeba/pericia-ufmg.ts"}`, {
  encoding: "utf8",
  cwd: raiz,
});

// versão temporária idêntica à do HEAD, mas exportando também o BRUTO
const tmpTs = path.join(raiz, "apps/web/lib/paraopeba/__tmp-head-pericia.ts");
fs.writeFileSync(tmpTs, head.replace("const BRUTO =", "export const BRUTO ="), "utf8");

try {
  const mod = await import("file:///" + tmpTs.replaceAll("\\", "/"));
  const bruto = (mod as unknown as { BRUTO: Record<string, unknown> }).BRUTO;
  const acervoPath = path.join(
    raiz,
    "etl/betim/dados/estudos-pericia-bundle.json"
  );
  const anterior = JSON.parse(fs.readFileSync(acervoPath, "utf8")) as {
    ACERVO_PERICIA: unknown[];
  };
  const acervo = anterior.ACCERVO_PERICIA ?? anterior.ACERVO_PERICIA;

  // recomputa os contadores que o RESUMO original carregava
  const comTema = (acervo as { temas: unknown[] }[]).filter((e) => e.temas.length > 0)
    .length;
  const resultados = (acervo as { secao: string }[]).filter(
    (e) => e.secao === "apresentacao_de_resultados"
  ).length;

  const resumo = {
    coletadoEm: bruto.coletado_em,
    fonte: bruto.fonte,
    total: bruto.total,
    paginasNaFilaAoParar: bruto.paginas_na_fila_ao_parar,
    porSecao: bruto.por_secao,
    comTema,
    resultados,
  };

  fs.writeFileSync(
    acervoPath,
    JSON.stringify({ ACERVO_PERICIA: acervo, RESUMO_DO_ACERVO: resumo })
  );
  console.log("OK resumo:", JSON.stringify(resumo).slice(0, 160));
} finally {
  fs.rmSync(tmpTs, { force: true });
}
