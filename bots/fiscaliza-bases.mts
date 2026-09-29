#!/usr/bin/env node

/**
 * 🤖 Bot de Fiscalização de Bases — auditoria automática do acervo JSON
 *
 * ═══ O QUE ESTE MÓDULO É ═══
 *
 * Fiscaliza as bases de dado versionadas em `apps/web/data` (JSON, recursivo)
 * e acusa problemas de qualidade antes que virem página pública. É o irmão
 * JS/TS do `scripts/checar-dado-pessoal-em-dado.py`: aquele barra CPF no
 * DADO ingerido no pre-push/CI; este audita shape, campos obrigatórios,
 * código IBGE, duplicatas, URL de fonte e valores monetários — as "seis
 * qualidades" do AGENTS.md §8.
 *
 * ═══ REGRAS DE DADO QUE ELE PROTEGE (AGENTS.md) ═══
 *
 * - §5.2: dado pessoal é DADO, não só código. Zero CPF no repositório.
 * - §8: linkável/filtrável/ordenável/resumível/chatbot/exportável.
 * - Editorial: "número errado é dano" e "lacuna é informação".
 *   Por isso valor monetário nulo ou zerado vira achado, não silêncio.
 *
 * ═══ DECISÕES NÃO TRIVIAIS ═══
 *
 * - CPF só é acusado quando passa no mod-11 (mesmo critério do script Python).
 *   Código IBGE de 7 dígitos e id de protocolo passam batidos, como lá.
 * - O CPF NUNCA é impresso inteiro — só a máscara `123.***.***-09`.
 * - A lista SINTETICOS espelha `scripts/checar-dado-pessoal-em-dado.py`
 *   (CPFs canônicos de teste e falsos positivos conhecidos, ex. IBGE de
 *   Betim `00003106705` e nº de processo da ANA). Sem ela o exit code daria
 *   1 à toa. ⚠️ É a QUARTA cópia dessa lista: mexer numa, mexer nas três.
 * - Sem dependência nova: só node:fs/node:path e tsx, como os outros bots.
 *
 * Uso:
 *   npx tsx bots/fiscaliza-bases.mts                 # varre apps/web/data inteiro
 *   npx tsx bots/fiscaliza-bases.mts --foco          # só as bases-foco
 *   npx tsx bots/fiscaliza-bases.mts --telegram      # + aviso no Telegram
 *   npx tsx bots/fiscaliza-bases.mts --self-test     # prova que a régua vê
 *
 * Sai com 1 se houver achado `critico`; 0 caso contrário.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = resolve(RAIZ, "apps/web/data");
const RELATORIO_DIR = resolve(RAIZ, "docs/relatorios-automacao");

/** Bases que o plano põe em foco. Recebem checagem de schema (chaves mínimas). */
const BASES_FOCO = [
  "destinacoes-uniao-mg.json",
  "ppp-mg.json",
  "contratos-pncp-consolidado.json",
];
/** Diretórios em foco (varridos recursivamente). */
const DIRS_FOCO = ["conselhos", "outorgas"];

/** Schema mínimo conhecido das bases-foco. Fora daqui a checagem é genérica. */
const ESQUEMAS: Record<string, { colecao: string; obrigatorios: string[]; chaveNatural: string[] }> = {
  "destinacoes-uniao-mg.json": {
    colecao: "imoveis",
    obrigatorios: ["id", "municipio"],
    chaveNatural: ["id"],
  },
  "ppp-mg.json": {
    colecao: "contratos",
    obrigatorios: ["id", "numeroContrato", "ano"],
    chaveNatural: ["id"],
  },
  "contratos-pncp-consolidado.json": {
    colecao: "contratos",
    obrigatorios: ["id", "numero_controle_pncp", "link_pncp"],
    chaveNatural: ["numero_controle_pncp"],
  },
};

/** Teto de achados guardados por base e no relatório (o resto só é contado). */
const LIMITE_POR_BASE = 50;
const LIMITE_RELATORIO = 500;

// ---------------------------------------------------------------------------
// Régua de CPF (mod-11) — igual à do script Python, por decisão consciente.
// A lista SINTETICOS é copiada de scripts/checar-dado-pessoal-em-dado.py.
// ---------------------------------------------------------------------------
const RE_CPF = /\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b|\b[0-9]{11}\b/g;

let SINTETICOS = new Set([
  "00000000000", "000.000.000-00", "11111111111", "12345678900",
  "12345678909", "123.456.789-09", "47018614139",
  "00003106705",
  "05042570640", "23010001762", "16201000968", "23010000103",
  "93015091999", "99059511999", "16201001425", "16153332668",
  "84351260645", "843.512.606-45", "05982413615", "059.824.136-15",
  "23010000448", "23010004001", "23010000286", "23010000871", "23010001509",
  "88140000000", "52400000000", "33400000000",
]);

/** Dígito verificador por mod-11. Falso para 11 dígitos iguais. */
function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11 || new Set(digitos).size === 1) return false;
  const dv = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

/** Mascara o CPF: mostra a raiz e o DV, esconde o miolo. Nunca o inteiro. */
function mascararCpf(valor: string): string {
  const d = valor.replace(/\D/g, "");
  return `${d.slice(0, 3)}.***.***-${d.slice(9, 11)}`;
}

// ---------------------------------------------------------------------------
// Código IBGE: 7 dígitos, 2 primeiros = UF. Cobre 11..53 (as UFs existentes).
// ---------------------------------------------------------------------------
const UFS_VALIDAS = new Set([
  11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  31, 32, 33, 35, 41, 42, 43, 50, 51, 52, 53,
]);

function validarIbge(valor: unknown): boolean {
  const s = String(valor).replace(/\D/g, "");
  return s.length === 7 && UFS_VALIDAS.has(Number(s.slice(0, 2)));
}

// ---------------------------------------------------------------------------
// Tipos do relatório
// ---------------------------------------------------------------------------
type Severidade = "critico" | "atencao" | "info";

interface Achado {
  severidade: Severidade;
  base: string;
  tipo: string;
  onde: string;
  detalhe: string;
}

interface BaseResultado {
  arquivo: string;
  bytes: number;
  shape: string;
  colecoes: number;
  registros: number;
  contagem: Record<Severidade, number>;
  camposVazios: number;
  camposVaziosPorChave: Record<string, number>;
  duplicatas: number;
  achados: Achado[];
}

interface Estado {
  resumo: Record<Severidade, number>;
  porTipo: Record<string, number>;
  achados: Achado[];
  bases: BaseResultado[];
  registrosTotais: number;
  arquivos: number;
}

function novoEstado(): Estado {
  return {
    resumo: { critico: 0, atencao: 0, info: 0 },
    porTipo: {},
    achados: [],
    bases: [],
    registrosTotais: 0,
    arquivos: 0,
  };
}

/** Registra um achado: conta sempre, guarda até o teto. */
function registrar(
  estado: Estado,
  base: BaseResultado,
  severidade: Severidade,
  tipo: string,
  onde: string,
  detalhe: string,
): void {
  estado.resumo[severidade]++;
  estado.porTipo[tipo] = (estado.porTipo[tipo] ?? 0) + 1;
  base.contagem[severidade]++;
  const achado: Achado = { severidade, base: base.arquivo, tipo, onde, detalhe };
  if (base.achados.length < LIMITE_POR_BASE) base.achados.push(achado);
  if (estado.achados.length < LIMITE_RELATORIO) estado.achados.push(achado);
}

// ---------------------------------------------------------------------------
// Descoberta de arquivos
// ---------------------------------------------------------------------------
function listarJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const saida: string[] = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === "node_modules" || entrada.name === ".git") continue;
      saida.push(...listarJson(p));
    } else if (entrada.isFile() && entrada.name.endsWith(".json")) {
      saida.push(p);
    }
  }
  return saida;
}

function caminhoPosix(p: string): string {
  return relative(DATA_DIR, p).split("\\").join("/");
}

function ehFoco(rel: string): boolean {
  if (BASES_FOCO.includes(rel)) return true;
  return DIRS_FOCO.some((d) => rel.startsWith(d + "/"));
}

// ---------------------------------------------------------------------------
// Varredura genérica
// ---------------------------------------------------------------------------

/**
 * Acha coleções (arrays de registros) em qualquer profundidade. Cobre os dois
 * shapes do repo: array puro e `{metadados, <colecao>}` — e, de quebra, o
 * aninhado (ex. `municipios.<id>.conselho.membros`).
 */
function encontrarColecoes(raiz: unknown, max = 50): Array<{ caminho: string; registros: unknown[] }> {
  const saida: Array<{ caminho: string; registros: unknown[] }> = [];
  const visitar = (v: unknown, caminho: string): void => {
    if (saida.length >= max) return;
    if (Array.isArray(v)) {
      const deObjetos = v.length === 0 ||
        (v[0] !== null && typeof v[0] === "object" && !Array.isArray(v[0]));
      if (deObjetos) saida.push({ caminho, registros: v });
      return; // não desce em array (registro não guarda coleção)
    }
    if (v && typeof v === "object") {
      for (const [k, item] of Object.entries(v as Record<string, unknown>)) {
        visitar(item, caminho === "$" ? k : `${caminho}.${k}`);
      }
    }
  };
  visitar(raiz, "$");
  return saida;
}

function valorVazio(v: unknown): boolean {
  if (v === null || v === undefined || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

function numeroOuNulo(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const RE_URL_CAMPO = /url|link|href/i;
const RE_MONETARIO_CAMPO = /valor|montante|orcamento|receita|preco/i;
const RE_IBGE_CAMPO = /ibge/i;

/** Varre CPF em todo valor string/número do JSON. Alerta crítico; mascara. */
function varrerCpf(estado: Estado, base: BaseResultado, valor: unknown, caminho: string): void {
  if (typeof valor === "string" || typeof valor === "number") {
    const texto = String(valor);
    if (!/\.\d{3}\.\d{3}|\d{11}/.test(texto)) return;
    for (const m of texto.matchAll(RE_CPF)) {
      const achado = m[0];
      if (SINTETICOS.has(achado)) continue;
      const digitos = achado.replace(/\D/g, "");
      if (cpfValido(digitos)) {
        registrar(estado, base, "critico", "cpf", caminho, `CPF mod-11 válido: ${mascararCpf(achado)}`);
      }
    }
    return;
  }
  if (Array.isArray(valor)) {
    valor.forEach((item, i) => varrerCpf(estado, base, item, `${caminho}[${i}]`));
    return;
  }
  if (valor && typeof valor === "object") {
    for (const [k, item] of Object.entries(valor as Record<string, unknown>)) {
      varrerCpf(estado, base, item, `${caminho}.${k}`);
    }
  }
}

/** Escolhe a chave natural de um registro (config explícita ou heurística). */
function chaveDeRegistro(reg: Record<string, unknown>, preferidos?: string[]): string | null {
  const candidatos = preferidos ?? ["id", "numero_controle_pncp", "numeroControlePNCP", "numeroContrato"];
  const partes: string[] = [];
  for (const c of candidatos) {
    if (reg[c] === undefined || reg[c] === null || reg[c] === "") return null;
    partes.push(String(reg[c]));
    if (c === "numeroContrato" && reg["ano"] !== undefined) partes.push(String(reg["ano"]));
  }
  return partes.length ? partes.join("|") : null;
}

/**
 * Analisa um arquivo JSON e devolve o resultado da base. Faz shape, chaves
 * mínimas, CPF, IBGE, duplicatas, URL, monetário e contagem de lacunas.
 */
function analisarArquivo(estado: Estado, abs: string, rel: string): BaseResultado {
  const bytes = statSync(abs).size;
  const base: BaseResultado = {
    arquivo: rel,
    bytes,
    shape: "desconhecido",
    colecoes: 0,
    registros: 0,
    contagem: { critico: 0, atencao: 0, info: 0 },
    camposVazios: 0,
    camposVaziosPorChave: {},
    duplicatas: 0,
    achados: [],
  };

  let raiz: unknown;
  try {
    raiz = JSON.parse(readFileSync(abs, "utf8"));
  } catch (e) {
    base.shape = "invalido";
    registrar(estado, base, "critico", "json-invalido", rel, `JSON não parseável: ${(e as Error).message.slice(0, 120)}`);
    return base;
  }

  // CPF é varrido em TODO o arquivo, inclusive metadados e campos aninhados.
  varrerCpf(estado, base, raiz, "$");

  // Shape de topo.
  const colecoes = encontrarColecoes(raiz);
  base.colecoes = colecoes.length;
  if (Array.isArray(raiz)) {
    base.shape = "array";
  } else if (raiz && typeof raiz === "object") {
    const obj = raiz as Record<string, unknown>;
    if ("metadados" in obj && colecoes.length === 1) base.shape = "metadados+colecao";
    else base.shape = "objeto";
  } else {
    base.shape = "escalar";
    registrar(estado, base, "atencao", "shape-invalido", rel, "Topo não é array nem objeto");
  }
  if (base.shape === "objeto") {
    registrar(
      estado, base, "info", "shape-nao-catalogado", rel,
      `Topo objeto com ${colecoes.length} coleção(ões) — fora do padrão {metadados, <colecao>}`,
    );
  }

  const esquema = ESQUEMAS[rel];

  for (const col of colecoes) {
    const registros = col.registros.filter(
      (r): r is Record<string, unknown> => r !== null && typeof r === "object" && !Array.isArray(r),
    );
    base.registros += registros.length;
    estado.registrosTotais += registros.length;
    if (!registros.length) continue;

    // Campos de URL/monetário/IBGE que EXISTEM na base (união das chaves).
    const camposUrl = new Set<string>();
    const camposMonetario = new Set<string>();
    for (const reg of registros) {
      for (const k of Object.keys(reg)) {
        if (RE_URL_CAMPO.test(k)) camposUrl.add(k);
        if (RE_MONETARIO_CAMPO.test(k)) camposMonetario.add(k);
      }
    }

    const vistos = new Map<string, number>();
    const chavePreferida = esquema?.chaveNatural;

    for (let i = 0; i < registros.length; i++) {
      const reg = registros[i];
      const ref = `${col.caminho}[${i}]`;

      // Registro vazio.
      if (Object.keys(reg).length === 0 || Object.values(reg).every(valorVazio)) {
        registrar(estado, base, "atencao", "registro-vazio", ref, "Registro sem nenhum valor");
      }

      // Chaves mínimas esperadas (bases-foco) + lacunas por campo.
      if (esquema && col.caminho === esquema.colecao) {
        for (const chave of esquema.obrigatorios) {
          if (valorVazio(reg[chave])) {
            registrar(estado, base, "atencao", "campo-obrigatorio", `${ref}.${chave}`, `Campo obrigatório ausente/vazio`);
          }
        }
      }

      // CPF por registro (já coberto no arquivo; aqui dá o caminho exato).

      // IBGE.
      for (const k of Object.keys(reg)) {
        if (!RE_IBGE_CAMPO.test(k)) continue;
        const v = reg[k];
        if (valorVazio(v)) {
          registrar(estado, base, "info", "ibge-lacuna", `${ref}.${k}`, "Código IBGE ausente");
          continue;
        }
        const digitos = String(v).replace(/\D/g, "");
        if (digitos.length === 7) {
          if (!validarIbge(v)) {
            registrar(estado, base, "atencao", "ibge-invalido", `${ref}.${k}`, `IBGE inválido (UF ${digitos.slice(0, 2)}): ${digitos}`);
          }
        } else if (digitos.length === 6) {
          registrar(estado, base, "info", "ibge-6-digitos", `${ref}.${k}`, `IBGE em 6 dígitos (forma sem DV): ${digitos}`);
        } else {
          registrar(estado, base, "atencao", "ibge-invalido", `${ref}.${k}`, `IBGE fora do padrão de 6/7 dígitos: ${digitos}`);
        }
      }

      // URL de fonte.
      for (const k of camposUrl) {
        const v = reg[k];
        if (valorVazio(v)) {
          registrar(estado, base, "info", "url-ausente", `${ref}.${k}`, "URL de fonte ausente");
        } else if (!/^https?:\/\//i.test(String(v))) {
          registrar(estado, base, "atencao", "url-invalida", `${ref}.${k}`, `URL não começa com http: ${String(v).slice(0, 60)}`);
        }
      }

      // Monetário.
      for (const k of camposMonetario) {
        if (!(k in reg)) continue;
        const v = reg[k];
        if (valorVazio(v)) {
          registrar(estado, base, "info", "monetario-lacuna", `${ref}.${k}`, "Valor monetário nulo/vazio");
          continue;
        }
        const n = numeroOuNulo(v);
        if (n === null) {
          registrar(estado, base, "atencao", "monetario-invalido", `${ref}.${k}`, `Valor monetário não numérico: ${String(v).slice(0, 40)}`);
        } else if (n <= 0) {
          registrar(estado, base, "atencao", "monetario-nao-positivo", `${ref}.${k}`, `Valor monetário <= 0: ${n}`);
        }
      }

      // Lacunas (campos vazios) — contagem agregada por base.
      base.camposVazios += Object.values(reg).filter(valorVazio).length;
      for (const [k, v] of Object.entries(reg)) {
        if (valorVazio(v)) base.camposVaziosPorChave[k] = (base.camposVaziosPorChave[k] ?? 0) + 1;
      }

      // Duplicatas por chave natural.
      const chave = chaveDeRegistro(reg, chavePreferida);
      if (chave) {
        if (vistos.has(chave)) {
          base.duplicatas++;
          registrar(estado, base, "atencao", "duplicata", ref, `Chave natural repetida (1ª em ${col.caminho}[${vistos.get(chave)}]): ${chave.slice(0, 60)}`);
        } else {
          vistos.set(chave, i);
        }
      }
    }
  }

  if (base.camposVazios > 0) {
    const top = Object.entries(base.camposVaziosPorChave)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, n]) => `${k}=${n}`)
      .join(", ");
    registrar(estado, base, "info", "lacunas", rel, `${base.camposVazios} campo(s) vazio(s) em ${base.registros} registro(s). Top: ${top}`);
  }

  return base;
}

// ---------------------------------------------------------------------------
// Self-test: prova que a régua vê e não é cega. Nenhum arquivo do repo tocado.
// ---------------------------------------------------------------------------
function selfTest(): number {
  let falhas = 0;
  const verifica = (rotulo: string, ok: boolean, detalhe = ""): void => {
    if (ok) {
      console.log(`✓ ${rotulo}`);
    } else {
      falhas++;
      console.log(`✗ ${rotulo} ${detalhe}`);
    }
  };

  // 1. Régua de CPF nos dois sentidos.
  verifica("cpfValido aceita 12345678909", cpfValido("12345678909"));
  verifica("cpfValido rejeita 12345678900", !cpfValido("12345678900"));
  verifica("cpfValido rejeita 00000000000", !cpfValido("00000000000"));
  verifica("cpfValido rejeita IBGE 3106705", !cpfValido("3106705"));

  // 2. Máscara nunca revela o CPF inteiro.
  const mascara = mascararCpf("12345678909");
  verifica("mascararCpf esconde o miolo", mascara === "123.***.***-09" && !mascara.includes("4567890"), `→ ${mascara}`);

  // 3. IBGE válido e inválido.
  verifica("validarIbge aceita 3106705 (MG)", validarIbge("3106705"));
  verifica("validarIbge rejeita 0000000", !validarIbge("0000000"));
  verifica("validarIbge rejeita 9999999", !validarIbge("9999999"));

  // 4. Duplicata detectada.
  const fixture = [
    { id: "a", numero_controle_pncp: "X-1" },
    { id: "b", numero_controle_pncp: "X-2" },
    { id: "c", numero_controle_pncp: "X-1" },
  ];
  const vistos = new Set<string>();
  let dup = 0;
  for (const r of fixture) {
    const k = chaveDeRegistro(r, ["numero_controle_pncp"])!;
    if (vistos.has(k)) dup++;
    else vistos.add(k);
  }
  verifica("duplicata por chave natural detectada", dup === 1, `→ ${dup}`);

  // 5. CPF válido em estrutura aninhada é achado; IBGE/CNPJ não.
  //    O set é esvaziado temporariamente, como no self-test do script Python:
  //    o CPF canônico de teste mora em SINTETICOS por design.
  const novaBase = (): BaseResultado => ({
    arquivo: "<teste>", bytes: 0, shape: "objeto", colecoes: 1, registros: 1,
    contagem: { critico: 0, atencao: 0, info: 0 }, camposVazios: 0,
    camposVaziosPorChave: {}, duplicatas: 0, achados: [],
  });
  const guardado = SINTETICOS;
  SINTETICOS = new Set();
  const estado = novoEstado();
  const base = novaBase();
  varrerCpf(estado, base, { nome: "Fulano", doc: "12345678909", ibge: "3106705", cnpj: "12345678000195" }, "$");
  verifica("scanner acha CPF válido e ignora IBGE/CNPJ", base.contagem.critico === 1, `→ ${base.contagem.critico}`);
  SINTETICOS = guardado;

  // 6. Com a lista de volta, o mesmo CPF fica isento.
  const estado2 = novoEstado();
  const base2 = novaBase();
  varrerCpf(estado2, base2, { doc: "12345678909" }, "$");
  verifica("scanner respeita SINTETICOS", base2.contagem.critico === 0, `→ ${base2.contagem.critico}`);

  if (falhas) {
    console.log(`\n${falhas} verificação(ões) falharam — a régua está cega.`);
    return 1;
  }
  console.log("\n✓ a régua vê CPF válido, ignora sintético/IBGE/CNPJ e mascara o achado");
  return 0;
}

// ---------------------------------------------------------------------------
// Telegram — reusa o padrão de bots/notifica-telegram.mts. Nunca imprime segredo.
// ---------------------------------------------------------------------------
function carregarEnv(): void {
  const envPath = join(RAIZ, "scripts", ".env");
  if (!existsSync(envPath)) return;
  for (const linha of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

async function notificarTelegram(texto: string): Promise<boolean> {
  carregarEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const dono = process.env.TELEGRAM_CHAT_ID;
  if (!token || !dono) {
    console.log("ℹ️  Telegram não configurado — pulando aviso");
    return false;
  }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: dono, text: texto, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    if (!r.ok) {
      console.error(`❌ Falha no envio: HTTP ${r.status}`);
      return false;
    }
    console.log("✅ Aviso enviado ao Telegram");
    return true;
  } catch (e) {
    console.error("❌ Erro no envio:", (e as Error).message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    process.exit(selfTest());
  }

  const apenasFoco = args.includes("--foco");
  const enviarTelegram = args.includes("--telegram");
  const inicio = Date.now();

  const todos = listarJson(DATA_DIR);
  const alvos = apenasFoco ? todos.filter((p) => ehFoco(caminhoPosix(p))) : todos;

  console.log("═".repeat(60));
  console.log("🤖 Bot de Fiscalização de Bases");
  console.log("═".repeat(60));
  console.log(`Raiz: ${DATA_DIR}`);
  console.log(`Escopo: ${apenasFoco ? "bases-foco" : "todas as bases *.json"} (${alvos.length} arquivo(s))\n`);

  const estado = novoEstado();
  for (const abs of alvos.sort()) {
    const base = analisarArquivo(estado, abs, caminhoPosix(abs));
    estado.bases.push(base);
    estado.arquivos++;
  }

  const duracaoMs = Date.now() - inicio;
  const relatorio = {
    gerado_em: new Date().toISOString(),
    duracao_ms: duracaoMs,
    escopo: apenasFoco ? "foco" : "completo",
    raiz: "apps/web/data",
    arquivos_varridos: estado.arquivos,
    registros_totais: estado.registrosTotais,
    resumo: estado.resumo,
    resumo_por_tipo: estado.porTipo,
    amostra_achados_truncada: estado.resumo.critico + estado.resumo.atencao + estado.resumo.info > estado.achados.length,
    bases: estado.bases,
    achados: estado.achados,
  };

  mkdirSync(RELATORIO_DIR, { recursive: true });
  const data = new Date().toISOString().slice(0, 10);
  const caminhoRelatorio = resolve(RELATORIO_DIR, `fiscaliza-bases-${data}.json`);
  writeFileSync(caminhoRelatorio, JSON.stringify(relatorio, null, 2), "utf8");

  console.log(`${estado.arquivos} arquivo(s) varrido(s), ${estado.registrosTotais} registro(s)`);
  console.log(`Achados: ${estado.resumo.critico} crítico(s), ${estado.resumo.atencao} atenção, ${estado.resumo.info} info`);
  console.log(`Relatório: ${relative(RAIZ, caminhoRelatorio).split("\\").join("/")}`);
  const tipos = Object.entries(estado.porTipo).sort((a, b) => b[1] - a[1]);
  if (tipos.length) console.log(`Por tipo: ${tipos.map(([t, n]) => `${t}=${n}`).join(", ")}`);
  console.log(`Duração: ${(duracaoMs / 1000).toFixed(1)}s`);

  if (enviarTelegram) {
    const emoji = estado.resumo.critico > 0 ? "⛔" : "✅";
    const texto =
      `${emoji} <b>Fiscalização de bases</b>\n` +
      `${estado.arquivos} arquivos, ${estado.registrosTotais} registros.\n` +
      `Crítico=${estado.resumo.critico}, atenção=${estado.resumo.atencao}, info=${estado.resumo.info}.\n` +
      `Relatório: docs/relatorios-automacao/fiscaliza-bases-${data}.json`;
    await notificarTelegram(texto);
  }

  process.exit(estado.resumo.critico > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});
