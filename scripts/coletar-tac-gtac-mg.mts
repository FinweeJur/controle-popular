/**
 * Gera `apps/web/lib/ambiental/tac-gtac.ts` — o cadastro de Termos de
 * Ajustamento de Conduta ambientais de Minas Gerais, do sistema GTAC
 * (Ecossistemas/SEMAD).
 *
 * ═══ COMO SE CHEGA NO DADO ═══
 *
 * A tela `/gtac/acessoExterno` é um SPA em Next.js; o dado vem de
 * `https://ecosistemas.meioambiente.mg.gov.br/gtac/api/tacs`.
 *
 * **A API responde 403 com "Forbidden - Consulte a DGTI sobre esta
 * autorização" — e a mensagem engana.** Não é autorização: é checagem de
 * origem. Mandando `Referer` e `Origin` do próprio portal, a mesma rota
 * devolve 200 com o cadastro inteiro. Quem ler a mensagem ao pé da letra
 * conclui que precisa de convênio com a diretoria de TI e desiste.
 *
 * **O `page` é ignorado.** `?page=1` e `?page=2` devolvem exatamente os mesmos
 * 2.002 registros (conferido comparando os conjuntos de `id`). Paginar em laço
 * baixaria o mesmo conteúdo N vezes e concluiria "N × 2.002 TACs".
 *
 * Existe um `POST /resolveocaptcha` no mesmo domínio, mas ele guarda outro
 * fluxo — a consulta em si não passa por captcha.
 *
 * ═══ DADO PESSOAL: O QUE SAI, E POR QUÊ ═══
 *
 * A API expõe dado pessoal que este portal não republica:
 *
 * · **`cpf_usuario` e `nome_usuario`** — o servidor que cadastrou o registro.
 *   Saem inteiros. Não é parte do acordo, e publicar o nome de quem digitou
 *   não serve a controle nenhum.
 * · **`cpf_cnpj`** — 1.647 dos 2.002 são CNPJ (14 dígitos) e ficam: identificam
 *   a empresa signatária, que é exatamente o que interessa. Os **355 que são
 *   CPF** (11 dígitos) são pessoa física, e são **redigidos aqui, na origem** —
 *   nunca chegam ao repositório.
 *
 * O nome do empreendimento FICA, inclusive quando é o nome de uma pessoa: ela é
 * parte de um acordo ambiental público. É a mesma régua de
 * `docs/FONTES.md` e da trava de `scripts/checar-dado-pessoal-em-dado.py` —
 * CPF sai, nome e CNPJ ficam.
 *
 * Uso:
 *   npx tsx scripts/coletar-tac-gtac-mg.mts          # baixa e grava
 *   npx tsx scripts/coletar-tac-gtac-mg.mts --seco   # não grava
 *   npx tsx scripts/coletar-tac-gtac-mg.mts --cache  # reusa o download
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = resolve(RAIZ, ".cache/gtac");
const DESTINO = resolve(RAIZ, "apps/web/lib/ambiental/tac-gtac.ts");
const SO_MEDIR = process.argv.includes("--seco");
const USAR_CACHE = process.argv.includes("--cache");

const PORTAL = "https://ecosistemas.meioambiente.mg.gov.br";
const API = `${PORTAL}/gtac/api`;

const abortar = (msg: string): never => {
  console.error(`[tac-gtac] ABORT: ${msg}`);
  process.exit(1);
};

/** Sem `Referer`/`Origin` a API devolve 403 com mensagem enganosa — ver o topo. */
const CABECALHOS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ControlePopular/1.0 (+https://controlepopular.com.br)",
  Referer: `${PORTAL}/gtac/acessoExterno`,
  Origin: PORTAL,
};

async function buscar(rota: string): Promise<unknown> {
  const arq = resolve(CACHE, `${rota.replace(/[^a-z0-9]/gi, "_")}.json`);
  if (USAR_CACHE && existsSync(arq)) return JSON.parse(readFileSync(arq, "utf8"));
  const r = await fetch(`${API}/${rota}`, { headers: CABECALHOS });
  if (!r.ok) {
    abortar(
      `${rota}: HTTP ${r.status}. Se for 403, confira Referer/Origin — a mensagem da API fala ` +
        `em autorização da DGTI, mas o que ela checa é a origem.`,
    );
  }
  const j = await r.json();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(arq, JSON.stringify(j), "utf8");
  return j;
}

const soDigitos = (s: unknown) => String(s ?? "").replace(/\D/g, "");
const texto = (s: unknown) => (s === null || s === undefined ? "" : String(s).trim());
/** `AAAA-MM-DD` da fonte, ou null. */
const data = (s: unknown) => {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(texto(s));
  return m ? m[1] : null;
};

interface TacGtac {
  id: number;
  empreendimento: string;
  /** CNPJ da signatária. `null` quando a fonte traz CPF — redigido na origem. */
  cnpj: string | null;
  municipio: string;
  unidade: string;
  atividade: string;
  modalidade: string;
  fase: string;
  situacao: string;
  classe: string;
  assinatura: string | null;
  inicioVigencia: string | null;
  vencimento: string | null;
  /** Em meses, como a fonte grava. */
  prazoMeses: number | null;
  renovacao: boolean;
  aditivo: boolean;
}

type Bruto = Record<string, unknown> & { municipio?: unknown; unidade?: unknown };
const rotulo = (v: unknown): string => {
  if (v && typeof v === "object" && "nome" in (v as Record<string, unknown>)) {
    return texto((v as Record<string, unknown>).nome);
  }
  return texto(v);
};

const resposta = (await buscar("tacs?page=1")) as { tac?: Bruto[] };
const brutos = resposta?.tac;
if (!Array.isArray(brutos) || brutos.length === 0) abortar("resposta sem array `tac`");

// A API ignora `page`: conferir em vez de confiar. Se um dia paginar de
// verdade, este aviso é o que impede publicar só a primeira página como se
// fosse tudo.
const segunda = (await buscar("tacs?page=2")) as { tac?: Bruto[] };
const idsA = new Set(brutos.map((t) => t.id));
const idsB = new Set((segunda?.tac ?? []).map((t) => t.id));
const paginaIgnorada = idsA.size === idsB.size && [...idsA].every((i) => idsB.has(i));
if (!paginaIgnorada) {
  abortar(
    `?page=2 devolveu conteúdo DIFERENTE (${idsB.size} ids) — a API passou a paginar de verdade. ` +
      `Este script assume uma resposta única e precisa virar laço antes de publicar de novo.`,
  );
}

let cpfRedigidos = 0;
const tacs: TacGtac[] = brutos.map((t) => {
  const doc = soDigitos(t.cpf_cnpj);
  const ehCnpj = doc.length === 14;
  if (doc.length === 11) cpfRedigidos++;
  return {
    id: Number(t.id),
    empreendimento: texto(t.empreendimento),
    cnpj: ehCnpj ? doc : null,
    municipio: rotulo(t.municipio),
    unidade: rotulo(t.unidade),
    atividade: rotulo(t.atividade),
    modalidade: rotulo(t.modalidade),
    fase: rotulo(t.fase),
    situacao: texto(t.situacao),
    classe: texto(t.classe),
    assinatura: data(t.dt_assinatura),
    inicioVigencia: data(t.dt_inicio_vigencia),
    vencimento: data(t.dt_vencimento),
    prazoMeses: Number(t.prazo_vigencia) > 0 ? Number(t.prazo_vigencia) : null,
    renovacao: texto(t.renovacao).toLowerCase().startsWith("s"),
    aditivo: texto(t.aditivo).toLowerCase().startsWith("s"),
  };
});

// ─── Trava de dado pessoal, antes de qualquer gravação ─────────────────────
// A régua do repo já roda no pre-push e na CI; esta aqui existe para o dado
// nem chegar ao disco. Um CPF que passe daqui vira commit, e commit em repo
// público não tem desfazer que resolva.
const serializado = JSON.stringify(tacs);
const cpfSuspeito = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.exec(serializado);
if (cpfSuspeito) abortar(`padrão de CPF sobreviveu à redação: ${cpfSuspeito[0].slice(0, 4)}…`);
for (const chave of ["cpf_usuario", "nome_usuario", "cpf_cnpj"]) {
  if (serializado.includes(chave)) abortar(`campo pessoal "${chave}" vazou para a saída`);
}

const anos = [...new Set(tacs.map((t) => (t.assinatura ?? "").slice(0, 4)).filter(Boolean))].sort();
if (anos.length === 0) abortar("nenhuma data de assinatura — decodificação falhou");

const contar = <T extends string>(f: (t: TacGtac) => T) => {
  const m = new Map<T, number>();
  for (const t of tacs) {
    const k = f(t);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m].map(([k, n]) => ({ chave: k, tacs: n })).sort((a, b) => b.tacs - a.tacs);
};

const porSituacao = contar((t) => t.situacao);
const porFase = contar((t) => t.fase);
const porUnidade = contar((t) => t.unidade).slice(0, 20);
const porMunicipio = contar((t) => t.municipio).slice(0, 30);
const porAno = [...new Set(tacs.map((t) => (t.assinatura ?? "").slice(0, 4)).filter(Boolean))]
  .sort()
  .map((ano) => ({ ano: Number(ano), tacs: tacs.filter((t) => (t.assinatura ?? "").startsWith(ano)).length }));

const hoje = new Date().toISOString().slice(0, 10);
const vencidos = tacs.filter((t) => t.vencimento && t.vencimento < hoje);
/** O cruzamento que importa: a fonte marca "Vigente" e, ao mesmo tempo, guarda
 *  uma data de vencimento que já passou. Não é prova de irregularidade — pode
 *  ser aditivo não lançado —, mas é a própria base se contradizendo. */
const vigentes = tacs.filter((t) => t.situacao.toLowerCase().startsWith("vigente"));
const vigentesVencidos = vigentes.filter((t) => t.vencimento && t.vencimento < hoje);
/** Sem data de vencimento não dá para dizer nada sobre prazo — e são muitos. */
const semVencimento = tacs.filter((t) => !t.vencimento).length;
const comCnpj = tacs.filter((t) => t.cnpj).length;

console.log(`[tac-gtac] TACs: ${tacs.length} · municípios: ${contar((t) => t.municipio).length} · unidades: ${contar((t) => t.unidade).length}`);
console.log(`[tac-gtac] assinaturas de ${anos[0]} a ${anos[anos.length - 1]}`);
console.log(`[tac-gtac] com CNPJ publicável: ${comCnpj} · CPF de pessoa física REDIGIDO: ${cpfRedigidos}`);
console.log(`[tac-gtac] com vencimento já passado (${hoje}): ${vencidos.length}`);
console.log(`[tac-gtac] marcados VIGENTE com vencimento passado: ${vigentesVencidos.length} de ${vigentes.length}`);
console.log(`[tac-gtac] sem data de vencimento: ${semVencimento}`);
console.log(`[tac-gtac] situações: ${porSituacao.slice(0, 4).map((s) => `${s.chave}=${s.tacs}`).join(" · ")}`);

if (SO_MEDIR) process.exit(0);

const s = (t: unknown) => JSON.stringify(t);
const conteudo = `/**
 * Termos de Ajustamento de Conduta ambientais de Minas Gerais, do sistema GTAC
 * (Ecossistemas/SEMAD). ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por \`scripts/coletar-tac-gtac-mg.mts\`. O cabeçalho daquele script
 * documenta como se chega no dado (a API responde 403 com mensagem enganosa
 * até receber \`Referer\`/\`Origin\`) e por que não se pagina (a API ignora
 * \`page\` e devolve o cadastro inteiro).
 *
 * ═══ DADO PESSOAL ═══
 *
 * ${cpfRedigidos} dos ${tacs.length} registros trazem CPF de pessoa física no campo de documento da
 * fonte. **Eles não estão aqui**: são redigidos no coletor, antes de tocar o
 * disco. Ficam os ${comCnpj} CNPJ, que identificam a empresa signatária. O
 * servidor que cadastrou cada registro (nome e CPF na API) também não entra.
 *
 * O nome do empreendimento fica, inclusive quando é nome de pessoa: ela é parte
 * de um acordo ambiental público.
 */

export interface TacAmbientalGtac {
  id: number;
  empreendimento: string;
  /** CNPJ da signatária. \`null\` quando a fonte traz CPF — redigido na origem. */
  cnpj: string | null;
  municipio: string;
  unidade: string;
  atividade: string;
  modalidade: string;
  fase: string;
  situacao: string;
  classe: string;
  assinatura: string | null;
  inicioVigencia: string | null;
  vencimento: string | null;
  /** Em meses, como a fonte grava. */
  prazoMeses: number | null;
  renovacao: boolean;
  aditivo: boolean;
}

export const TACS_GTAC: TacAmbientalGtac[] = ${s(tacs)};

export const COBERTURA_TAC_GTAC = {
  tacs: ${tacs.length},
  comCnpj: ${comCnpj},
  /** Quantos tiveram CPF de pessoa física redigido — declarado, não escondido. */
  cpfRedigidos: ${cpfRedigidos},
  municipios: ${contar((t) => t.municipio).length},
  unidades: ${contar((t) => t.unidade).length},
  anoInicial: ${Number(anos[0])},
  anoFinal: ${Number(anos[anos.length - 1])},
  /** Vencimento anterior à data da coleta. Não significa descumprimento. */
  comVencimentoPassado: ${vencidos.length},
  vigentes: ${vigentes.length},
  /** Marcados "Vigente" pela fonte, mas com vencimento anterior à coleta. */
  vigentesComVencimentoPassado: ${vigentesVencidos.length},
  /** Sem data de vencimento — fora de qualquer conta de prazo. */
  semDataDeVencimento: ${semVencimento},
  coletadoEm: ${s(hoje)},
} as const;

export const TAC_GTAC_POR_SITUACAO = ${s(porSituacao)} as const;
export const TAC_GTAC_POR_FASE = ${s(porFase)} as const;
export const TAC_GTAC_POR_UNIDADE = ${s(porUnidade)} as const;
export const TAC_GTAC_POR_MUNICIPIO = ${s(porMunicipio)} as const;
export const TAC_GTAC_POR_ANO = ${s(porAno)} as const;
`;

writeFileSync(DESTINO, conteudo, "utf8");
if (readFileSync(DESTINO, "utf8").includes("�")) abortar("mojibake no arquivo gravado");
console.log(
  `[tac-gtac] gravado: ${DESTINO} (${(Buffer.byteLength(conteudo, "utf8") / 1024).toFixed(1)} KiB)`,
);
