/**
 * Gera `apps/web/lib/ambiental/convenios-federais-mg.ts` — os convênios da
 * União com proponentes de Minas Gerais, do Transferegov (ex-SICONV).
 *
 * ═══ POR QUE ESTA FONTE IMPORTA ═══
 *
 * O portal de MG publica um arquivo de meta e etapa por convênio e o entrega
 * **vazio** (ver `docs/FONTES.md`). O Transferegov federal publica os mesmos
 * conceitos — inclusive `DIA_FIM_VIGENC_ORIGINAL_CONV` e
 * `VALOR_GLOBAL_ORIGINAL_CONV`, ou seja, prazo e valor ORIGINAIS ao lado dos
 * atuais, além de um contador explícito de prorrogações (`QTD_PRORROGA`).
 * Dá para medir, no dinheiro federal que entra em Minas, o que a base estadual
 * não deixa medir.
 *
 * ═══ QUATRO ARMADILHAS MEDIDAS EM 2026-08-21 ═══
 *
 * 1. **O `siconv.zip` completo tem 3,34 GB.** Baixar o pacote para pegar três
 *    tabelas é desperdício; os arquivos individuais ficam no mesmo diretório.
 *
 * 2. **`siconv_meta.csv.zip` e `siconv_etapa.csv.zip` dão 404.** Os nomes reais
 *    são `siconv_meta_crono_fisico.csv.zip` (103 MB) e
 *    `siconv_etapa_crono_fisico.csv.zip` (183 MB). A documentação lista os
 *    conceitos como "Meta" e "Etapa", que não são os nomes dos arquivos.
 *
 * 3. **Os CSV são UTF-8, e ler como latin-1 quebra DUAS coisas de uma vez.**
 *    Além dos acentos, o BOM `EF BB BF` decodificado em latin-1 vira três
 *    caracteres (`ï»¿`) grudados no nome da PRIMEIRA coluna — então
 *    `row["ID_PROPOSTA"]` devolve `undefined`, o join não casa nada, e o
 *    resultado é "1 proposta em Minas" em vez de 98.949. O erro não lança: dá
 *    um número pequeno e plausível.
 *
 * 4. **`VALOR_GLOBAL_ORIGINAL_CONV` só está preenchido em 37,7% dos
 *    registros.** Somar o valor atual de TODOS contra o original de alguns dá
 *    crescimento de 3,3× — número falso e alarmante. No mesmo subconjunto, o
 *    crescimento real é +39,6%. Por isso este script calcula a comparação
 *    **apenas sobre os convênios que têm os dois valores**, e publica quantos
 *    são.
 *
 * ═══ COMO RECORTAR MINAS ═══
 *
 * `siconv_convenio` não traz UF. `siconv_proposta` traz `UF_PROPONENTE`
 * direto — é por ali, e não pelo cruzamento com `siconv_proponentes`, que
 * usa outro identificador.
 *
 * Uso:
 *   npx tsx scripts/coletar-convenios-federais-mg.mts           # baixa (196 MB) e grava
 *   npx tsx scripts/coletar-convenios-federais-mg.mts --cache   # reusa o download
 *   npx tsx scripts/coletar-convenios-federais-mg.mts --seco    # não grava
 */
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = resolve(RAIZ, ".cache/transferegov");
const DESTINO = resolve(RAIZ, "apps/web/lib/ambiental/convenios-federais-mg.ts");
const SO_MEDIR = process.argv.includes("--seco");
const USAR_CACHE = process.argv.includes("--cache");

const BASE = "https://repositorio.dados.gov.br/seges/detru";
const AGENTE = "ControlePopular/1.0 (+https://controlepopular.com.br)";

const abortar = (msg: string): never => {
  console.error(`[convenios-federais] ABORT: ${msg}`);
  process.exit(1);
};

/** Baixa e descompacta um `.csv.zip` do repositório, devolvendo o texto UTF-8.
 *  Descompacta com `Expand-Archive` do PowerShell para não trazer dependência
 *  nova só por isto. **Não usar `tar`**: o `tar` que responde neste ambiente é
 *  o do Git Bash, que recusa zip ("This does not look like a tar archive") e
 *  ainda assim sai com código 0 — falha silenciosa. O bsdtar do Windows leria,
 *  mas não é ele que está no PATH. */
async function garantirCsv(nome: string): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const zip = resolve(CACHE, `${nome}.csv.zip`);
  const csv = resolve(CACHE, `${nome}.csv`);
  if (USAR_CACHE && existsSync(csv)) return csv;
  if (!(USAR_CACHE && existsSync(zip))) {
    const r = await fetch(`${BASE}/${nome}.csv.zip`, { headers: { "User-Agent": AGENTE } });
    if (!r.ok) abortar(`${nome}: HTTP ${r.status}`);
    writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
    console.log(`[convenios-federais] baixado ${nome}`);
  }
  execFileSync(
    "powershell",
    [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Path '${zip.replace(/'/g, "''")}' -DestinationPath '${CACHE.replace(/'/g, "''")}' -Force`,
    ],
    { stdio: "ignore" },
  );
  if (!existsSync(csv)) abortar(`${nome}: o zip nao continha ${nome}.csv`);
  return csv;
}

/**
 * Lê um CSV `;` com aspas EM FLUXO, chamando `aoLer` para cada linha.
 *
 * Não devolve string nem array: `siconv_proposta.csv` tem ~700 MB e
 * `readFileSync(…, "utf8")` estoura o limite de string do V8
 * (`ERR_STRING_TOO_LONG`, teto de ~512 MB) — a mesma armadilha que os CSV do
 * TSE já provocaram neste repo. O parser guarda o estado de aspas ENTRE os
 * pedaços, porque um campo citado pode atravessar a fronteira de chunk; quebrar
 * por linha ingenuamente cortaria o registro no meio de um texto com `;`.
 */
async function lerCsvEmFluxo(
  caminho: string,
  aoLer: (linha: Record<string, string>) => void,
): Promise<number> {
  let chaves: string[] | null = null;
  let campos: string[] = [];
  let campo = "";
  let aspas = false;
  let n = 0;

  const fecharLinha = () => {
    campos.push(campo.replace(/\r$/, ""));
    campo = "";
    if (!chaves) {
      chaves = campos.map((c) => c.trim());
    } else if (campos.length > 1) {
      const o: Record<string, string> = {};
      for (let k = 0; k < chaves.length; k++) o[chaves[k]] = (campos[k] ?? "").trim();
      aoLer(o);
      n++;
    }
    campos = [];
  };

  // `utf8` no stream já descarta o BOM na primeira leitura; ainda assim o
  // cabeçalho passa por `replace` abaixo, porque BOM colado no nome da primeira
  // coluna é justamente o defeito que faz o join devolver zero.
  let primeiro = true;
  for await (const pedaco of createReadStream(caminho, { encoding: "utf8" })) {
    let texto = pedaco as string;
    if (primeiro) {
      texto = texto.replace(/^\uFEFF/, "");
      primeiro = false;
    }
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (aspas) {
        if (c === '"') {
          if (texto[i + 1] === '"') {
            campo += '"';
            i++;
          } else aspas = false;
        } else campo += c;
        continue;
      }
      if (c === '"') aspas = true;
      else if (c === ";") {
        campos.push(campo);
        campo = "";
      } else if (c === "\n") fecharLinha();
      else campo += c;
    }
  }
  if (campo || campos.length) fecharLinha();
  return n;
}

/** "1234,56" ou "1234.56" → number. Vazio → 0. */
const num = (s: string | undefined) => {
  const n = Number((s ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
/** `DD/MM/AAAA` → `AAAA-MM-DD`, ou null. */
const data = (s: string | undefined) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((s ?? "").trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

// ─────────────────────────────────────────────────────────────────────────────

const propostasMg = new Map<string, { municipio: string; ibge: string; orgaoSuperior: string }>();
const lidasProposta = await lerCsvEmFluxo(await garantirCsv("siconv_proposta"), (r) => {
  if (r.UF_PROPONENTE !== "MG") return;
  propostasMg.set(r.ID_PROPOSTA, {
    municipio: r.MUNIC_PROPONENTE ?? "",
    ibge: r.COD_MUNIC_IBGE ?? "",
    orgaoSuperior: r.DESC_ORGAO_SUP ?? "",
  });
});
console.log(`[convenios-federais] propostas lidas: ${lidasProposta}`);
if (propostasMg.size < 10_000) {
  abortar(
    `só ${propostasMg.size} propostas de MG — quase certamente o BOM grudou no nome da ` +
      `primeira coluna (ver armadilha 3). Esperado: ~99 mil.`,
  );
}

interface Conv {
  proposta: string;
  situacao: string;
  ano: number;
  municipio: string;
  orgaoSuperior: string;
  valorGlobal: number;
  valorGlobalOriginal: number;
  desembolsado: number;
  prorrogacoes: number;
  aditivos: number;
  fimVigencia: string | null;
  fimVigenciaOriginal: string | null;
}
const convenios: Conv[] = [];
await lerCsvEmFluxo(await garantirCsv("siconv_convenio"), (r) => {
  const p = propostasMg.get(r.ID_PROPOSTA);
  if (!p) return;
  convenios.push({
    proposta: r.ID_PROPOSTA,
    situacao: r.SIT_CONVENIO ?? "",
    ano: Number(r.ANO) || 0,
    municipio: p.municipio,
    orgaoSuperior: p.orgaoSuperior,
    valorGlobal: num(r.VL_GLOBAL_CONV),
    valorGlobalOriginal: num(r.VALOR_GLOBAL_ORIGINAL_CONV),
    desembolsado: num(r.VL_DESEMBOLSADO_CONV),
    prorrogacoes: Number(r.QTD_PRORROGA) || 0,
    aditivos: Number(r.QTD_TA) || 0,
    fimVigencia: data(r.DIA_FIM_VIGENC_CONV),
    fimVigenciaOriginal: data(r.DIA_FIM_VIGENC_ORIGINAL_CONV),
  });
});
if (convenios.length < 1000) abortar(`só ${convenios.length} convênios de MG — join falhou`);

const total = convenios.length;
const valorGlobal = convenios.reduce((t, c) => t + c.valorGlobal, 0);
const desembolsado = convenios.reduce((t, c) => t + c.desembolsado, 0);
const comProrrogacao = convenios.filter((c) => c.prorrogacoes > 0).length;

// Só os que têm os DOIS valores — ver armadilha 4.
const comparaveis = convenios.filter((c) => c.valorGlobalOriginal > 0 && c.valorGlobal > 0);
const atualComparavel = comparaveis.reduce((t, c) => t + c.valorGlobal, 0);
const originalComparavel = comparaveis.reduce((t, c) => t + c.valorGlobalOriginal, 0);

const agrupar = <T extends string | number>(chave: (c: Conv) => T) => {
  const m = new Map<T, { n: number; valor: number; desembolsado: number; prorrogados: number }>();
  for (const c of convenios) {
    const k = chave(c);
    const a = m.get(k) ?? { n: 0, valor: 0, desembolsado: 0, prorrogados: 0 };
    a.n++;
    a.valor += c.valorGlobal;
    a.desembolsado += c.desembolsado;
    if (c.prorrogacoes > 0) a.prorrogados++;
    m.set(k, a);
  }
  return m;
};

const porOrgao = [...agrupar((c) => c.orgaoSuperior)]
  .filter(([k]) => k)
  .map(([orgaoSuperior, v]) => ({ orgaoSuperior, ...v }))
  .sort((a, b) => b.valor - a.valor)
  .slice(0, 20);

const porMunicipio = [...agrupar((c) => c.municipio)]
  .filter(([k]) => k)
  .map(([municipio, v]) => ({ municipio, ...v }))
  .sort((a, b) => b.valor - a.valor)
  .slice(0, 30);

const porSituacao = [...agrupar((c) => c.situacao)]
  .filter(([k]) => k)
  .map(([situacao, v]) => ({ situacao, convenios: v.n }))
  .sort((a, b) => b.convenios - a.convenios);

const anos = [...new Set(convenios.map((c) => c.ano))].filter((a) => a > 1990).sort((a, b) => a - b);
const porAno = anos.map((ano) => {
  const doAno = convenios.filter((c) => c.ano === ano);
  return {
    ano,
    convenios: doAno.length,
    valor: doAno.reduce((t, c) => t + c.valorGlobal, 0),
    desembolsado: doAno.reduce((t, c) => t + c.desembolsado, 0),
  };
});

const pct = (a: number, b: number) => Number(((a / b) * 100).toFixed(1));
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

console.log(`[convenios-federais] propostas de MG: ${propostasMg.size}`);
console.log(`[convenios-federais] sem ano válido: ${total - convenios.filter((c) => c.ano > 1990).length}`);
console.log(`[convenios-federais] convênios: ${total} · municípios: ${porMunicipio.length >= 30 ? "30+ (top 30 publicados)" : porMunicipio.length}`);
console.log(`[convenios-federais] valor global: R$ ${brl(valorGlobal)} · desembolsado R$ ${brl(desembolsado)} (${pct(desembolsado, valorGlobal)}%)`);
console.log(`[convenios-federais] com prorrogação: ${comProrrogacao} (${pct(comProrrogacao, total)}%)`);
console.log(`[convenios-federais] valor original disponível em ${comparaveis.length} (${pct(comparaveis.length, total)}%) — crescimento nesse subconjunto: ${pct(atualComparavel - originalComparavel, originalComparavel)}%`);

if (SO_MEDIR) process.exit(0);

const s = (t: unknown) => JSON.stringify(t);
const conteudo = `/**
 * Convênios da União com proponentes de Minas Gerais (Transferegov, ex-SICONV).
 * ARQUIVO GERADO — não editar à mão. Ver \`scripts/coletar-convenios-federais-mg.mts\`.
 *
 * ═══ SÓ AGREGADOS, DE PROPÓSITO ═══
 *
 * São ${total} convênios; publicar a lista inteira não caberia no teto do Worker
 * e não é o que a página precisa. O que está aqui são os cortes por órgão
 * superior, município, ano e situação — todos medidos do conjunto completo.
 *
 * ═══ O NÚMERO QUE PRECISA DE RESSALVA ═══
 *
 * \`VALOR_GLOBAL_ORIGINAL_CONV\` está preenchido em só ${pct(comparaveis.length, total)}% dos
 * convênios. Comparar o valor atual de todos contra o original de alguns produz
 * crescimento de 3,3× — falso. Por isso \`crescimentoDeValor\` é calculado
 * **apenas sobre os ${comparaveis.length} que têm os dois valores**, e
 * \`conveniosComValorOriginal\` diz quantos são. Nunca publicar um sem o outro.
 */

export const COBERTURA_CONVENIOS_FEDERAIS_MG = {
  convenios: ${total},
  propostas: ${propostasMg.size},
  anoInicial: ${anos[0]},
  /**
   * Convênios sem ano válido na fonte — ficam FORA de \`CONVENIOS_FEDERAIS_POR_ANO\`.
   * Declarado porque a série por ano soma menos que o total, e a diferença
   * precisa ter nome: some em silêncio, vira "sumiram convênios".
   */
  conveniosSemAno: ${total - convenios.filter((c) => c.ano > 1990).length},
  anoFinal: ${anos[anos.length - 1]},
  valorGlobal: ${valorGlobal},
  desembolsado: ${desembolsado},
  percentualDesembolsado: ${pct(desembolsado, valorGlobal)},
  comProrrogacao: ${comProrrogacao},
  percentualComProrrogacao: ${pct(comProrrogacao, total)},
  /** Quantos têm valor original declarado — o denominador de \`crescimentoDeValor\`. */
  conveniosComValorOriginal: ${comparaveis.length},
  percentualComValorOriginal: ${pct(comparaveis.length, total)},
  valorOriginalComparavel: ${originalComparavel},
  valorAtualComparavel: ${atualComparavel},
  /** Em %, SÓ sobre os convênios que declaram os dois valores. */
  crescimentoDeValor: ${pct(atualComparavel - originalComparavel, originalComparavel)},
} as const;

export const CONVENIOS_FEDERAIS_POR_ORGAO = ${s(porOrgao)} as const;
export const CONVENIOS_FEDERAIS_POR_MUNICIPIO = ${s(porMunicipio)} as const;
export const CONVENIOS_FEDERAIS_POR_ANO = ${s(porAno)} as const;
export const CONVENIOS_FEDERAIS_POR_SITUACAO = ${s(porSituacao)} as const;
`;

writeFileSync(DESTINO, conteudo, "utf8");
if (readFileSync(DESTINO, "utf8").includes("�")) abortar("mojibake no arquivo gravado");
console.log(
  `[convenios-federais] gravado: ${DESTINO} (${(Buffer.byteLength(conteudo, "utf8") / 1024).toFixed(1)} KiB)`,
);
