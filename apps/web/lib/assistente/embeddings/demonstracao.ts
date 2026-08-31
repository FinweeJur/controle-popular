/**
 * Demonstração fim-a-fim do pipeline "vetorizar + buscar" sobre um
 * DOCUMENTO REAL — a prova de conceito pedida na tarefa. Liga `pedacos.ts`
 * (fatiar) + `ollama.ts` (vetorizar) + `similaridade.ts` (rankear); a
 * GERAÇÃO de resposta (LLM) não existe aqui, de propósito — ver docstring
 * de `ollama.ts`.
 *
 * ═══ QUAL É O DOCUMENTO, E POR QUE ESTE ═══
 *
 * `etl/betim/dados/legislacao-mma.json` (7,2 MB, 8.570 normas federais
 * ambientais, medido em 22/08/2026) já está versionado no repositório — é o
 * dado bruto por trás de `ambiental_legislacao`/`direito_critico` (ver
 * `lib/ambiental/legislacao-unificada.ts`), hoje servido pelo Postgres, que
 * nesta máquina está em HTTP 402 (ver `AGENTS.md`). O JSON no disco é a
 * fonte original, não passa pelo banco — dá pra demonstrar o pipeline sem
 * depender da Neon.
 *
 * O recorte usado aqui é toda norma cuja `ementa` cita "barragem de Fund"
 * (cobre "barragem de Fundão", o rompimento de Mariana/MG em 05/11/2015) —
 * norma federal já publicada em Diário Oficial, texto de ato público. Filtro
 * documentado e reproduzível — qualquer um pode rodar o mesmo `.includes()`
 * contra o arquivo fonte e chegar nas mesmas linhas.
 *
 * Sobre dado pessoal: `etl/betim/dados/` NÃO está em `DIRETORIOS_DADO` de
 * `scripts/checar-dado-pessoal-em-dado.py` (só `apps/web/data` e
 * `docs/dados` — conferido lendo o script, não suposto), então a guarda
 * automática NÃO cobre este arquivo. A segurança aqui é por CONTEÚDO, do
 * jeito que `AGENTS.md` pede ("varrer o DADO, não só o código"): as 4
 * ementas usadas neste recorte (lidas por inteiro antes de escrever este
 * módulo) descrevem atos administrativos — número de portaria, órgão,
 * data, o STF, o nome da barragem — nenhuma cita nome de pessoa física ou
 * CPF. Se algum dia este filtro passar a puxar OUTRA fatia do arquivo (o
 * `.includes()` mudar, o arquivo fonte mudar), rode a guarda contra este
 * caminho com `--extra` antes de confiar de novo. `demonstracao.test.ts`
 * trava a ausência de CPF válido (mesmo regex mod-11 da guarda) nas ementas
 * carregadas, pra este raciocínio não apodrecer em comentário se o arquivo
 * fonte mudar.
 *
 * ═══ POR QUE `readFileSync`, NÃO `import` ═══
 *
 * `lib/ambiental/estudos.ts` importa `etl/betim/dados/ambiental-estudos.json`
 * (453 linhas) direto como módulo — mas aquele arquivo é pequeno.
 * `legislacao-mma.json` tem 8.570 linhas / 7,2 MB inteiro; `import` estático
 * paga o parse inteiro no carregamento do MÓDULO, para QUALQUER coisa que
 * importe este arquivo (inclusive quem só quer `fatiarTexto`/`vetorizar` e
 * nunca chama a demo). `readFileSync` dentro da função só paga quem
 * realmente chama `carregarNormasDeExemplo()` — e é assim que
 * `lib/edicoes.ts` e `lib/clima/risco.ts` já leem JSON versionado fora do
 * fluxo de `import`. Efeito colateral: isto só roda em Node (não em Worker
 * publicado) — aceitável aqui porque é ferramenta de demonstração/teste,
 * não rota servida (ver ressalva equivalente em `comunicabr/mg.ts` para o
 * caso que SERIA servido).
 *
 * O caminho é resolvido a partir de `process.cwd()`, NÃO de `__dirname`:
 * `__dirname` mediu ERRADO nesta própria tarefa (22/08/2026) rodando por
 * `tsx` — o bundler dele empacota este módulo junto com quem o importa
 * numa `data:` URL só, e `__dirname` sai apontando para outro diretório do
 * grafo, não o deste arquivo (`ENOENT` direto, medido). `process.cwd()` já
 * é a convenção documentada do repo para isto — ver `//test` em
 * `apps/web/package.json`: "os testes carregam fixture por caminho
 * relativo ao cwd", e é por isso que `npm test`/`vitest run` SEMPRE correm
 * com cwd = `apps/web` (o `package.json` que declara o script). Dois
 * `..` bastam daqui: `apps/web` -> `apps` -> raiz do repo.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fatiarTexto, type OpcoesFatiamento, type Pedaco } from "./pedacos";
import { vetorizar, vetorizarLote } from "./ollama";
import { similaridadeCosseno } from "./similaridade";

// `process.cwd()` mediu errado em worktree (saiu em `.claude/` ao inves da raiz
// do checkout). `import.meta.dirname` segue o arquivo, nao o processo — sobe
// 5 niveis de `apps/web/lib/assistente/embeddings/` ate a raiz do repo.
// NOTA: `import.meta.dirname` pode ser undefined durante `next build` (coleta
// de paginas); usamos `process.cwd()` como fallback seguro.
function encontrarRaizRepo(): string {
  if (import.meta.dirname) {
    return path.resolve(import.meta.dirname, "..", "..", "..", "..", "..");
  }
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    try {
      const pkgPath = path.join(dir, "package.json");
      if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if (pkg.name === "controle-popular") return dir;
      }
    } catch { /* ignora */ }
    const pai = path.dirname(dir);
    if (pai === dir) break;
    dir = pai;
  }
  return process.cwd();
}

const CAMINHO_LEGISLACAO_MMA = path.resolve(encontrarRaizRepo(), "etl", "betim", "dados", "legislacao-mma.json");

/** Uma linha de `etl/betim/dados/legislacao-mma.json` — só os campos que
 *  este módulo lê (a linha real tem mais: `fonte`, `esfera`, `data`,
 *  `orgao`, `link_pdf`, `situacao`, `id_ibge_municipio`, `indexacao`; nomes
 *  em snake_case porque são os da fonte, sem remapear — mesma escolha de
 *  `EstudoLinha` em `lib/ambiental/estudos.ts`). */
export interface NormaMma {
  tipo: string;
  numero: string;
  ano: number;
  ementa: string | null;
  chave_dedup: string;
}

const FILTRO_EMENTA = "barragem de fund";

/**
 * Carrega, do arquivo REAL, as normas cuja ementa cita a barragem de
 * Fundão — ver docstring do módulo para o porquê deste recorte. Ordenado
 * por ano pra o texto do documento (ver `montarDocumento`) sair
 * determinístico entre execuções.
 *
 * Lança se o arquivo não existir ou se o filtro não achar nada — mesma
 * filosofia de `lib/brumadinho/repasse.test.ts`: teste sobre dado real
 * FALHA se o dado sumir, nunca passa vazio calado.
 */
export function carregarNormasDeExemplo(): NormaMma[] {
  const bruto = readFileSync(CAMINHO_LEGISLACAO_MMA, "utf-8");
  const doc = JSON.parse(bruto) as { linhas: NormaMma[] };
  const normas = doc.linhas
    .filter((l) => l.ementa && l.ementa.toLowerCase().includes(FILTRO_EMENTA))
    .sort((a, b) => a.ano - b.ano);
  if (normas.length === 0) {
    throw new Error(
      `carregarNormasDeExemplo: nenhuma norma com "${FILTRO_EMENTA}" na ementa em ${CAMINHO_LEGISLACAO_MMA} — o arquivo mudou?`
    );
  }
  return normas;
}

/**
 * Monta o texto do "documento" a partir das normas: um parágrafo por
 * norma, identificação + ementa completa — a citação anda colada ao número
 * (mesma disciplina de `chat-comum.ts`/`REGRAS_COMUNS`: "quando usar um
 * número, diga de onde ele veio"). A linha em branco entre parágrafos é o
 * que `fatiarTexto` usa como fronteira (regra 1 do módulo).
 */
export function montarDocumento(normas: NormaMma[]): string {
  return normas.map((n) => `${n.tipo} nº ${n.numero}, de ${n.ano} — ${n.ementa}`).join("\n\n");
}

export interface IndiceDeExemplo {
  pedacos: Pedaco[];
  vetores: number[][];
}

/**
 * Indexa o documento de exemplo: carrega as normas reais, monta o texto,
 * fatia e vetoriza CADA pedaço numa chamada só (`vetorizarLote`). Separado
 * de `buscar` para que o custo de rede de indexar pague uma vez só, mesmo
 * quando o teste faz várias perguntas sobre o mesmo documento — indexar de
 * novo a cada pergunta seria pipeline errado (num sistema real o corpus é
 * indexado uma vez e consultado muitas).
 */
export async function indexarDocumentoDeExemplo(opcoes: OpcoesFatiamento = {}): Promise<IndiceDeExemplo> {
  const normas = carregarNormasDeExemplo();
  const documento = montarDocumento(normas);
  const pedacos = fatiarTexto(documento, opcoes);
  const vetores = await vetorizarLote(pedacos.map((p) => p.texto));
  return { pedacos, vetores };
}

export interface ResultadoRankeado {
  indice: number;
  texto: string;
  score: number;
}

/**
 * Vetoriza `pergunta` e rankeia os pedaços já indexados por similaridade
 * de cosseno, do mais para o menos parecido. `ranking[0]` é "o pedaço que
 * vence" — o que a tarefa pede pra mostrar.
 */
export async function buscarMaisSimilar(pergunta: string, indice: IndiceDeExemplo): Promise<ResultadoRankeado[]> {
  const vetorPergunta = await vetorizar(pergunta);
  return indice.pedacos
    .map((p, i) => ({ indice: p.indice, texto: p.texto, score: similaridadeCosseno(vetorPergunta, indice.vetores[i]) }))
    .sort((a, b) => b.score - a.score);
}
