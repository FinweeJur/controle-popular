// _direito_critico_popular_extrair.mjs — extrai os arrays `LAWS` e `JURIS`
// embutidos em `etl/betim/dados-seed/direito-critico-popular.html` e
// imprime `{laws: [...], juris: [...]}` em JSON no stdout.
//
// POR QUE NODE, NUM ETL QUE É TODO PYTHON: os dois arrays são LITERAL JS
// (chaves sem aspas, comentários `//` dentro do array `JURIS`), não JSON —
// não dá para `json.loads` direto. Um parser JS "de mão" em Python correria
// risco real de interpretar errado pontuação de texto jurídico em português
// (aspas, dois-pontos, vírgulas dentro de frase). O motor que já entende
// esse JS de forma correta e testada é o próprio Node — que este repo já
// carrega como dependência dura (`apps/web`) — então usá-lo aqui pra UMA
// extração estrutural, sem lógica de negócio nenhuma, é mais seguro que
// reimplementar um parser. Este script não decide nada: `direito_critico_popular.py`
// (o ingestor real) é quem sanitiza, classifica por tema e grava.
import fs from "node:fs";

const caminho = process.argv[2];
if (!caminho) {
  console.error("uso: node _direito_critico_popular_extrair.mjs <html>");
  process.exit(1);
}

const html = fs.readFileSync(caminho, "utf8");

const lawsIdx = html.indexOf("const LAWS=");
const jurisIdx = html.indexOf("const JURIS=");
const jurisEnd = html.indexOf("\nconst ALL_PAGES");
if (lawsIdx < 0 || jurisIdx < 0 || jurisEnd < 0) {
  console.error("marcador `const LAWS=`/`const JURIS=`/`const ALL_PAGES` não encontrado — o HTML semente mudou de formato?");
  process.exit(1);
}

const src = html.slice(lawsIdx, jurisEnd) + "\nglobalThis.__LAWS=LAWS;globalThis.__JURIS=JURIS;";
// `new Function`, não `eval`: escopo próprio, mesma técnica usada para
// medir o dado antes de escrever a migration. Fonte é o HTML curado deste
// repo, não conteúdo de terceiro — não é uma superfície de execução de
// código não confiável.
new Function(src)();

process.stdout.write(JSON.stringify({ laws: globalThis.__LAWS, juris: globalThis.__JURIS }));
