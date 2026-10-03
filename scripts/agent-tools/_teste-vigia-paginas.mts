/**
 * Teste temporário da lógica de aviso do vigia-paginas (sem rede, sem estado,
 * sem Telegram). Roda uma vez e é apagado — não é código de produção.
 *
 * Uso: npx tsx scripts/agent-tools/_teste-vigia-paginas.mts
 */
import { decidirAviso, type EstadoPaginas, type ResumoVarredura } from "./vigia-paginas.mts";

const ESTADO_ZERO: EstadoPaginas = {
  versao: 1,
  ultimaVarreduraEm: null,
  ultimaVarredura: null,
  assinatura: "",
  falhas: [],
  avisoEnviadoEm: null,
  avisado: false,
};

function resumo(falhas: string[], total = 100): ResumoVarredura {
  const lista = falhas.map((rota) => ({ rota, status: rota === "/x" ? 0 : 404 }));
  return {
    base: "https://www.controlepopular.com.br",
    total,
    ok: total - lista.length,
    falhas: lista,
    siteInteiroFora: lista.length / total > 0.5,
    inicioEm: new Date(1_770_000_000_000).toISOString(),
    terminoEm: new Date(1_770_000_100_000).toISOString(),
    duracaoMs: 100_000,
  };
}

const T0 = Date.parse("2026-10-03T12:00:00-03:00");
const MIN = 60_000;
let falhas = 0;

const verifica = (nome: string, ok: boolean, extra = ""): void => {
  if (!ok) falhas++;
  console.log(`${ok ? "PASSOU" : "FALHOU"} — ${nome}${extra ? ` (${extra})` : ""}`);
};

// 1. Duas páginas quebradas de 100 → aviso detalhado, não "site inteiro".
const r1 = resumo(["/editais", "/sobre"]);
const p1 = decidirAviso(r1, ESTADO_ZERO, T0);
verifica("aviso detalhado na primeira falha", !!p1.mensagem && p1.mensagem.includes("2 de 100"));
verifica("não é o aviso de site inteiro", !!p1.mensagem && !p1.mensagem.includes("Site inteiro fora"));
verifica("mostra a rota e o status", !!p1.mensagem && p1.mensagem.includes("/editais → HTTP 404"));
console.log("--- aviso 1 ---\n" + p1.mensagem + "\n--------------");

// 2. Mesmo conjunto, 10 min depois → silêncio (anti-spam).
const p2 = decidirAviso(r1, p1.estado, T0 + 10 * MIN);
verifica("sem repetição antes de 1 h", p2.mensagem === null);
verifica("estado segue marcado como avisado", p2.estado.avisado === true);

// 3. Mesmo conjunto, 61 min depois → repete (a falha persistiu).
const p3 = decidirAviso(r1, p2.estado, T0 + 61 * MIN);
verifica("repete depois de 1 h", !!p3.mensagem && p3.mensagem.includes("2 de 100"));

// 4. Conjunto muda → aviso imediato, mesmo dentro da hora.
const r4 = resumo(["/editais", "/sobre", "/x"]);
const p4 = decidirAviso(r4, p3.estado, T0 + 62 * MIN);
verifica("aviso imediato quando o conjunto muda", !!p4.mensagem && p4.mensagem.includes("3 de 100"));
verifica("falha sem resposta descrita como tal", !!p4.mensagem && p4.mensagem.includes("/x → sem resposta"));

// 5. Mais de 50% fora → aviso único agregado.
const muitas = Array.from({ length: 60 }, (_, i) => `/rota-${i}`);
const r5 = resumo(muitas, 100);
const p5 = decidirAviso(r5, p4.estado, T0 + 70 * MIN);
verifica("degradação: aviso agregado", !!p5.mensagem && p5.mensagem.includes("Site inteiro fora"));
verifica("degradação: conta, não lista", !!p5.mensagem && p5.mensagem.includes("60 de 100 páginas falharam"));
verifica("degradação: não lista rota por rota", !!p5.mensagem && !p5.mensagem.includes("/rota-0"));
console.log("--- aviso degradação ---\n" + p5.mensagem + "\n-----------------------");

// 6. Tudo volta → uma restauração, e só uma.
const r6 = resumo([]);
const p6 = decidirAviso(r6, p5.estado, T0 + 80 * MIN);
verifica("restauração anunciada", !!p6.mensagem && p6.mensagem.includes("Páginas restauradas"));
verifica("restauração limpa o estado", p6.estado.avisado === false && p6.estado.assinatura === "");
const p7 = decidirAviso(r6, p6.estado, T0 + 81 * MIN);
verifica("segunda restauração não repete", p7.mensagem === null);
console.log("--- restauração ---\n" + p6.mensagem + "\n------------------");

// 7. Primeira rodada sem nada quebrado → silêncio total.
const p8 = decidirAviso(resumo([]), ESTADO_ZERO, T0);
verifica("ciclo saudável é silencioso", p8.mensagem === null);

// 8. Linhas do aviso respeitam a regra de 13 palavras do dono.
const avisos = [p1.mensagem, p5.mensagem, p6.mensagem].filter((m): m is string => !!m);
let pior = 0;
for (const aviso of avisos) {
  for (const linha of aviso.split("\n")) {
    const palavras = linha.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
    pior = Math.max(pior, palavras);
  }
}
verifica("nenhuma linha passa de 13 palavras", pior <= 13, `pior linha: ${pior} palavras`);

console.log(`\n${falhas === 0 ? "TODOS OS TESTES PASSARAM" : `${falhas} TESTE(S) FALHARAM`}`);
process.exit(falhas === 0 ? 0 : 1);
