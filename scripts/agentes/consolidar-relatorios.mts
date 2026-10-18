/**
 * scripts/agentes/consolidar-relatorios.mts — inventário dos relatórios de agente.
 *
 * Papel no portal: responder "o que cada agente entregou e o que ficou aberto?"
 * sem obrigar ninguém a varrer 255 arquivos de `docs/`. É a Fase 1 do
 * PLANO-RADAR-AGENTES-HOTSPOTS-18-10.md: o inventário é GERADO, o julgamento
 * de prioridade fica no RADAR-HOTSPOTS.md, que é curado.
 *
 * Fontes lidas (todas locais, nenhuma rede):
 * 1. transcrições de subagente `agent-*.jsonl` em `%USERPROFILE%\.claude`
 *    (fora do repo; o resumo destilado é o que entra no documento);
 * 2. `docs/historico/entregas/`, `docs/HANDOFF-*.md` e `handoffs/`;
 * 3. `docs/planos/` — só planos com sinal de pendência aberta;
 * 4. `docs/relatorios-automacao/` e `docs/dominios/`;
 * 5. `git worktree list` — cada worktree é uma linha de trabalho de agente.
 *
 * Decisões não triviais:
 * - O resumo do subagente vem do bloco `StructuredOutput.input.resumo` quando
 *   existe. É o contrato usado pelos fluxos de trabalho deste repo. Quando não
 *   existe, cai para a última mensagem de texto do agente.
 * - Nenhum segredo é lido: os caminhos de `.env*` e credenciais ficam fora.
 * - CPF é barrado por mod-11 antes de escrever. O repo é público (§5.2 do
 *   AGENTS.md) e transcrição de agente pode ter colado dado pessoal sem querer.
 * - `--check` compara o documento com uma nova geração ignorando o carimbo de
 *   hora. Serve para a CI da Fase 3 sem transformar o inventário em ruído.
 *
 * Uso:
 *   npx tsx scripts/agentes/consolidar-relatorios.mts
 *   npx tsx scripts/agentes/consolidar-relatorios.mts --check
 *   npx tsx scripts/agentes/consolidar-relatorios.mts --transcricoes "C:\caminho"
 *
 * Saída: `docs/02-estado/RELATORIOS-AGENTES.md`.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SAIDA_PADRAO = path.join(RAIZ, "docs", "02-estado", "RELATORIOS-AGENTES.md");
const TRANSCRICOES_PADRAO = path.join(os.homedir(), ".claude", "projects");

interface Opcoes {
  saida: string;
  transcricoes: string;
  check: boolean;
}

interface MetaDoc {
  titulo: string;
  tipo: string;
  dominio: string;
  data: string;
  resumo: string;
  caminhoRelativo: string;
}

interface PlanoDoc extends MetaDoc {
  status: string;
  pendencias: number;
}

interface Subagente {
  data: string;
  projeto: string;
  agente: string;
  tarefa: string;
  resumo: string;
  arquivos: string[];
  commit: string;
  transcricao: string;
}

interface Worktree {
  branch: string;
  caminho: string;
  commit: string;
  data: string;
  assunto: string;
  distancia: string;
}

function lerOpcoes(argv: string[]): Opcoes {
  const opcoes: Opcoes = {
    saida: SAIDA_PADRAO,
    transcricoes: TRANSCRICOES_PADRAO,
    check: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--check") {
      opcoes.check = true;
      continue;
    }
    if (arg === "--saida" && argv[i + 1]) {
      opcoes.saida = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--transcricoes" && argv[i + 1]) {
      opcoes.transcricoes = path.resolve(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--ajuda" || arg === "--help") {
      console.log("Uso: npx tsx scripts/agentes/consolidar-relatorios.mts [--check] [--saida arquivo] [--transcricoes pasta]");
      process.exit(0);
    }
  }

  return opcoes;
}

function caminhoRelativo(absoluto: string): string {
  return path.relative(RAIZ, absoluto).split(path.sep).join("/");
}

/**
 * Caminho declarado pelo agente pode vir absoluto de outro checkout
 * (`X:\DevCoder\controle-popular`) ou relativo. Só normaliza quando cai dentro
 * deste repo; fora dele, preserva o texto original para não inventar caminho.
 */
function caminhoDeclarado(declarado: string): string {
  const absoluto = path.isAbsolute(declarado) ? path.resolve(declarado) : path.resolve(RAIZ, declarado);
  const relativo = path.relative(RAIZ, absoluto);
  if (relativo.startsWith("..") || path.isAbsolute(relativo)) return declarado;
  return relativo.split(path.sep).join("/");
}

function lerArquivo(caminho: string): string {
  return fs.readFileSync(caminho, "utf8");
}

function listarMarkdown(pasta: string): string[] {
  if (!fs.existsSync(pasta)) return [];
  const encontrados: string[] = [];
  for (const entrada of fs.readdirSync(pasta, { withFileTypes: true })) {
    const completo = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) {
      encontrados.push(...listarMarkdown(completo));
    } else if (entrada.isFile() && entrada.name.endsWith(".md")) {
      encontrados.push(completo);
    }
  }
  return encontrados.sort();
}

function pegarTitulo(texto: string): string {
  const linha = texto.split(/\r?\n/).find((l) => /^#\s+/.test(l));
  return linha ? linha.replace(/^#\s+/, "").trim() : "(sem título)";
}

function pegarMeta(texto: string, rotulo: string): string {
  const escape = rotulo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`>\\s*\\*\\*${escape}:\\*\\*\\s*(.+)`, "i").exec(texto);
  return match ? match[1].trim() : "";
}

function limparMarkdown(texto: string): string {
  return texto
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function resumoDoTexto(texto: string, limite = 360): string {
  const secoes = texto.split(/\r?\n/);
  const paragrafos: string[] = [];
  const todosParagrafos: string[] = [];
  let acumulado: string[] = [];
  let dentroDeSecaoUtil = false;

  const fecharParagrafo = (): void => {
    if (!acumulado.length) return;
    const paragrafo = acumulado.join(" ");
    todosParagrafos.push(paragrafo);
    if (dentroDeSecaoUtil) paragrafos.push(paragrafo);
    acumulado = [];
  };

  for (const linha of secoes) {
    if (/^##\s+/.test(linha)) {
      const titulo = linha.toLowerCase();
      fecharParagrafo();
      dentroDeSecaoUtil = /prop[oó]sito|resumo|s[ií]ntese|achados|contexto|resultado/.test(titulo);
      continue;
    }
    const limpa = linha.trim();
    if (
      !limpa ||
      limpa.startsWith(">") ||
      limpa.startsWith("|") ||
      limpa.startsWith("-") ||
      limpa.startsWith("```") ||
      limpa.startsWith("<!--") ||
      limpa.startsWith("<!--".slice(0, 2))
    ) {
      fecharParagrafo();
      continue;
    }
    acumulado.push(limpa);
  }
  fecharParagrafo();

  const bom = (p: string): boolean => limparMarkdown(p).length > 40;
  const escolhido = paragrafos.find(bom) ?? todosParagrafos.find(bom) ?? paragrafos[0] ?? todosParagrafos[0] ?? "";
  return recortar(limparMarkdown(escolhido), limite);
}

function recortar(texto: string, limite: number): string {
  const limpo = texto.trim();
  if (limpo.length <= limite) return limpo;
  return `${limpo.slice(0, limite).replace(/\s+\S*$/, "")}…`;
}

function lerMetaDoc(caminho: string): MetaDoc {
  const texto = lerArquivo(caminho);
  const data = pegarMeta(texto, "Última medição") || formatarData(fs.statSync(caminho).mtime);
  return {
    titulo: pegarTitulo(texto),
    tipo: pegarMeta(texto, "Tipo"),
    dominio: pegarMeta(texto, "Domínio"),
    data,
    resumo: resumoDoTexto(texto),
    caminhoRelativo: caminhoRelativo(caminho),
  };
}

function formatarData(data: Date): string {
  const iso = data.toISOString();
  return iso.slice(0, 10);
}

function normalizarData(valor: string): string {
  const match = /(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : "";
}

function contarPendencias(texto: string): number {
  const caixas = (texto.match(/^- \[ \]/gm) ?? []).length;
  const secao = /##\s+Pend[êe]ncias[\s\S]*?(?=\n##\s|$)/i.exec(texto)?.[0] ?? "";
  const linhas = secao
    .split(/\r?\n/)
    .filter((linha) => /^\|\s*[A-Z]?\d+/.test(linha) && !/encerrada/i.test(linha)).length;
  return caixas + linhas;
}

function lerPlanos(): PlanoDoc[] {
  const pasta = path.join(RAIZ, "docs", "planos");
  return listarMarkdown(pasta)
    .map((caminho) => {
      const texto = lerArquivo(caminho);
      const base = lerMetaDoc(caminho);
      const status =
        /\*\*Status:\*\*\s*([^\n]+)/i.exec(texto)?.[1]?.trim() ??
        (/\[CONCLU[IÍ]DA\]/i.test(texto) ? "concluída" : "");
      return { ...base, status: limparMarkdown(status), pendencias: contarPendencias(texto) };
    })
    .filter((plano) => {
      const status = plano.status.toLowerCase();
      if (/conclu|entregue|arquivad|superad/.test(status)) return false;
      return plano.pendencias > 0 || /aberta|andamento|pendente|bloquead|🚧|⛔|⏳/.test(status);
    })
    .sort((a, b) => (b.data || "").localeCompare(a.data || "") || a.titulo.localeCompare(b.titulo));
}

function lerHandoffs(): MetaDoc[] {
  const pastas = [
    path.join(RAIZ, "docs", "historico", "entregas"),
    path.join(RAIZ, "handoffs"),
  ];
  const avulsos = fs
    .readdirSync(path.join(RAIZ, "docs"), { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.startsWith("HANDOFF") && e.name.endsWith(".md"))
    .map((e) => path.join(RAIZ, "docs", e.name));

  const arquivos = [...pastas.flatMap(listarMarkdown), ...avulsos];
  return arquivos
    .map(lerMetaDoc)
    .sort((a, b) => (b.data || "").localeCompare(a.data || "") || a.titulo.localeCompare(b.titulo));
}

function lerAutomacao(): MetaDoc[] {
  return listarMarkdown(path.join(RAIZ, "docs", "relatorios-automacao"))
    .map(lerMetaDoc)
    .sort((a, b) => (b.data || "").localeCompare(a.data || "") || a.titulo.localeCompare(b.titulo));
}

function lerDominios(): MetaDoc[] {
  return listarMarkdown(path.join(RAIZ, "docs", "dominios"))
    .map(lerMetaDoc)
    .sort((a, b) => a.caminhoRelativo.localeCompare(b.caminhoRelativo));
}

function ehCpfValido(digitos: string): boolean {
  if (!/^\d{11}$/.test(digitos) || /^(\d)\1{10}$/.test(digitos)) return false;
  const calcular = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i += 1) soma += Number(digitos[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(9) === Number(digitos[9]) && calcular(10) === Number(digitos[10]);
}

/** Remove CPF válido antes de publicar texto vindo de transcrição. */
function redigirDadoPessoal(texto: string): string {
  return texto.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, (bruto) => {
    const digitos = bruto.replace(/\D/g, "");
    return ehCpfValido(digitos) ? "[CPF removido]" : bruto;
  });
}

function textoDaMensagem(mensagem: unknown): string {
  if (typeof mensagem === "string") return mensagem;
  if (Array.isArray(mensagem)) {
    return mensagem
      .map((bloco) => {
        if (bloco && typeof bloco === "object" && "text" in bloco) {
          const texto = (bloco as { text?: unknown }).text;
          return typeof texto === "string" ? texto : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

interface RegistroTranscricao {
  type?: string;
  message?: { role?: string; content?: unknown };
}

function lerSubagente(caminho: string): Subagente | null {
  let linhas: string[];
  try {
    linhas = lerArquivo(caminho).split(/\r?\n/).filter(Boolean);
  } catch {
    return null;
  }

  let tarefa = "";
  let resumo = "";
  let ultimoTexto = "";
  let arquivos: string[] = [];
  let commit = "";

  for (const linha of linhas) {
    let registro: RegistroTranscricao;
    try {
      registro = JSON.parse(linha) as RegistroTranscricao;
    } catch {
      continue;
    }

    if (!tarefa && registro.type === "user") {
      const texto = textoDaMensagem(registro.message?.content).trim();
      if (texto && !texto.startsWith("<")) tarefa = texto;
    }

    if (registro.type === "assistant" && Array.isArray(registro.message?.content)) {
      for (const bloco of registro.message.content as Array<Record<string, unknown>>) {
        if (bloco.type === "text" && typeof bloco.text === "string" && bloco.text.trim()) {
          ultimoTexto = bloco.text.trim();
        }
        if (bloco.type === "tool_use" && bloco.name === "StructuredOutput") {
          const entrada = bloco.input as Record<string, unknown> | undefined;
          if (entrada && typeof entrada.resumo === "string") {
            resumo = entrada.resumo;
            if (Array.isArray(entrada.arquivosNovosOuMudados)) {
              arquivos = entrada.arquivosNovosOuMudados.filter((item): item is string => typeof item === "string");
            }
            if (typeof entrada.commitHash === "string") commit = entrada.commitHash;
          }
        }
      }
    }
  }

  if (!resumo) resumo = ultimoTexto;
  if (!tarefa && !resumo) return null;

  const nomeProjeto = caminho.split(`${path.sep}projects${path.sep}`)[1]?.split(path.sep)[0] ?? "";
  const projeto = nomeProjeto
    .replace(/^X--DevCoder-controle-popular/, "controle-popular")
    .replace(/--claude-worktrees-/, " · worktree ")
    .replace(/^C--Users-teste$/, "home-pc") || "controle-popular";

  return {
    data: formatarData(fs.statSync(caminho).mtime),
    projeto,
    agente: path.basename(caminho, ".jsonl"),
    tarefa: recortar(redigirDadoPessoal(limparMarkdown(tarefa)), 420),
    resumo: redigirDadoPessoal(recortar(limparMarkdown(resumo), 2400)),
    arquivos: arquivos.map(caminhoDeclarado),
    commit,
    transcricao: caminho,
  };
}

function listarTranscricoes(pasta: string): string[] {
  if (!fs.existsSync(pasta)) return [];
  const arquivos: string[] = [];
  for (const entrada of fs.readdirSync(pasta, { withFileTypes: true })) {
    const completo = path.join(pasta, entrada.name);
    if (entrada.isDirectory()) {
      if (completo.toLowerCase().includes("controle-popular")) {
        arquivos.push(...listarTranscricoes(completo));
      }
    } else if (entrada.isFile() && /^agent-.*\.jsonl$/.test(entrada.name)) {
      arquivos.push(completo);
    }
  }
  return arquivos.sort();
}

function lerSubagentes(pasta: string): Subagente[] {
  return listarTranscricoes(pasta)
    .map(lerSubagente)
    .filter((item): item is Subagente => item !== null)
    .sort((a, b) => b.data.localeCompare(a.data) || a.agente.localeCompare(b.agente));
}

function git(caminho: string, args: string[]): string {
  try {
    return execFileSync("git", ["-C", caminho, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function lerWorktrees(): Worktree[] {
  const bruto = git(RAIZ, ["worktree", "list", "--porcelain"]);
  if (!bruto) return [];

  const blocos = bruto.split(/\r?\n\r?\n/);
  const worktrees: Worktree[] = [];

  for (const bloco of blocos) {
    const linhas = bloco.split(/\r?\n/);
    const caminho = linhas.find((l) => l.startsWith("worktree "))?.slice("worktree ".length) ?? "";
    const normalizado = caminho ? path.resolve(caminho.replace(/\//g, path.sep)) : "";
    const relativo = normalizado ? path.relative(RAIZ, normalizado) : "";
    const foraDoRepo = !normalizado || relativo.startsWith("..") || path.isAbsolute(relativo);
    if (foraDoRepo || relativo === "" || !fs.existsSync(normalizado)) continue;

    const branch = linhas.find((l) => l.startsWith("branch "))?.replace("branch refs/heads/", "") ?? "detached";
    const commit = linhas.find((l) => l.startsWith("HEAD "))?.slice("HEAD ".length) ?? "";
    const ultimo = git(normalizado, ["log", "-1", "--format=%h%x09%ad%x09%s", "--date=short"]).split("\t");
    const distancia = git(normalizado, ["rev-list", "--left-right", "--count", "origin/main...HEAD"]).split(/\s+/);

    worktrees.push({
      branch,
      caminho: relativo.split(path.sep).join("/"),
      commit: ultimo[0] || commit.slice(0, 8),
      data: ultimo[1] || "",
      assunto: ultimo[2] || "",
      distancia: distancia.length === 2 ? `atrás ${distancia[0]} · à frente ${distancia[1]}` : "sem origin/main",
    });
  }

  return worktrees.sort((a, b) => b.data.localeCompare(a.data) || a.branch.localeCompare(b.branch));
}

function celula(valor: string): string {
  return valor.replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim();
}

function link(caminhoRelativoDoc: string, rotulo?: string): string {
  const destino = caminhoRelativoDoc.startsWith("/") ? caminhoRelativoDoc : `/${caminhoRelativoDoc}`;
  return `[${rotulo ?? caminhoRelativoDoc}](${destino})`;
}

function secaoSubagentes(subagentes: Subagente[]): string {
  if (!subagentes.length) return "_Nenhuma transcrição de subagente encontrada no caminho varrido._";
  return subagentes
    .map((item) => {
      const arquivos = item.arquivos.length
        ? item.arquivos.map((arquivo) => `- \`${arquivo}\``).join("\n")
        : "- (não declarados no resumo)";
      const commit = item.commit ? `\`${item.commit.slice(0, 12)}\`` : "(sem commit declarado)";
      return [
        `### ${item.data} — ${item.projeto}`,
        "",
        `- **Agente:** \`${item.agente}\``,
        `- **Commit:** ${commit}`,
        `- **Transcrição (fora do repo):** \`${item.transcricao}\``,
        "",
        `**Tarefa:** ${item.tarefa || "(não capturada)"}`,
        "",
        `**Resumo final:** ${item.resumo || "(vazio)"}`,
        "",
        "**Arquivos declarados:**",
        arquivos,
        "",
      ].join("\n");
    })
    .join("\n");
}

function tabelaDocs(docs: MetaDoc[], rotuloData = "Data"): string {
  if (!docs.length) return "_Nenhum documento encontrado._";
  const linhas = [
    `| ${rotuloData} | Documento | Domínio | Resumo |`,
    "|---|---|---|---|",
    ...docs.map(
      (doc) =>
        `| ${celula(doc.data || "—")} | ${link(doc.caminhoRelativo, doc.titulo)} | ${celula(doc.dominio || "—")} | ${celula(
          doc.resumo || "—",
        )} |`,
    ),
  ];
  return linhas.join("\n");
}

function tabelaPlanos(planos: PlanoDoc[]): string {
  if (!planos.length) return "_Nenhum plano com sinal de pendência aberta._";
  const linhas = [
    "| Última medição | Plano | Status | Pendências abertas | Resumo |",
    "|---|---|---|---|---|",
    ...planos.map(
      (plano) =>
        `| ${celula(plano.data || "—")} | ${link(plano.caminhoRelativo, plano.titulo)} | ${celula(
          plano.status || "sem status",
        )} | ${plano.pendencias} | ${celula(plano.resumo || "—")} |`,
    ),
  ];
  return linhas.join("\n");
}

function tabelaWorktrees(worktrees: Worktree[]): string {
  if (!worktrees.length) return "_Nenhuma worktree encontrada._";
  const linhas = [
    "| Branch | Último commit | Data | Assunto | Distância de origin/main | Caminho |",
    "|---|---|---|---|---|---|",
    ...worktrees.map(
      (item) =>
        `| \`${item.branch}\` | \`${item.commit}\` | ${item.data || "—"} | ${celula(item.assunto || "—")} | ${celula(
          item.distancia,
        )} | \`${item.caminho}\` |`,
    ),
  ];
  return linhas.join("\n");
}

function resumoSessoesOpencode(): string {
  const extrato = path.join(RAIZ, "docs", "relatorios-automacao", "opencode-sessoes-cp.md");
  const link = "[opencode-sessoes-cp.md](../relatorios-automacao/opencode-sessoes-cp.md)";
  if (!fs.existsSync(extrato)) {
    return [
      "Extrato ainda não gerado. Rode `npm run radar:opencode` (lê o banco local do",
      "opencode em modo somente-leitura, sem gastar token de modelo).",
    ].join("\n");
  }
  const texto = lerArquivo(extrato);
  const total = /Sessões encontradas no banco:\s*\*\*(\d+)\*\*/.exec(texto)?.[1] ?? "?";
  const filhos = /subagentes:\s*\*\*(\d+)\*\*/.exec(texto)?.[1] ?? "?";
  return [
    `Extrato de prompt e conclusão de **${total}** sessões (**${filhos}** subagentes),`,
    `direto do banco local do opencode: ${link}.`,
    "Leitura somente-leitura, CPF e segredo redigidos, sem custo de modelo.",
  ].join("\n");
}

function blocoAnterior(caminho: string, titulo: string): string {
  if (!fs.existsSync(caminho)) return "";
  const texto = lerArquivo(caminho);
  const marcador = `## ${titulo}`;
  const inicio = texto.indexOf(marcador);
  if (inicio < 0) return "";
  const inicioCorpo = inicio + marcador.length;
  const fim = texto.indexOf("\n## ", inicioCorpo);
  return texto.slice(inicioCorpo, fim < 0 ? undefined : fim).trim();
}

function montarDocumento(opcoes: Opcoes): string {
  const subagentes = lerSubagentes(opcoes.transcricoes);
  const handoffs = lerHandoffs();
  const planos = lerPlanos();
  const worktrees = lerWorktrees();
  const automacao = lerAutomacao();
  const dominios = lerDominios();
  const agora = new Date();

  const anterior = blocoAnterior(opcoes.saida, "Subagentes com resumo final");
  const preservado =
    subagentes.length === 0 && anterior && !anterior.startsWith("_Nenhuma")
      ? `${anterior}\n\n_Bloco preservado da geração anterior: nenhuma transcrição encontrada nesta máquina._`
      : "";
  const blocoSubagentes = preservado || secaoSubagentes(subagentes);

  return [
    "<!-- GERADO POR scripts/agentes/consolidar-relatorios.mts — NÃO EDITE À MÃO. -->",
    "",
    "# Relatórios finais de agentes — inventário",
    "",
    "> **Tipo:** ESTADO",
    "> **Domínio:** global (coordenação de agentes, entregas e pendências)",
    `> **Última medição:** ${formatarData(agora)}`,
    "> **Leitura estimada:** média (5–15 min)",
    "> **Relacionados:** [ESTADO.md](ESTADO.md), [RADAR-HOTSPOTS.md](RADAR-HOTSPOTS.md), [PLANO-RADAR-AGENTES-HOTSPOTS-18-10.md](../planos/PLANO-RADAR-AGENTES-HOTSPOTS-18-10.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md)",
    "> **Palavras-chave:** agentes, subagentes, relatorios, resumo, entregas, handoffs, worktrees, pendencias, inventario",
    "",
    "## Sumário",
    "",
    "- [Propósito](#propósito)",
    "- [Como ler](#como-ler)",
    "- [Cobertura da varredura](#cobertura-da-varredura)",
    "- [Subagentes com resumo final](#subagentes-com-resumo-final)",
    "- [Sessões do opencode](#sessões-do-opencode)",
    "- [Entregas e handoffs](#entregas-e-handoffs)",
    "- [Planos com pendência aberta](#planos-com-pendência-aberta)",
    "- [Worktrees e linhas de trabalho](#worktrees-e-linhas-de-trabalho)",
    "- [Relatórios automáticos](#relatórios-automáticos)",
    "- [Documentos de domínio](#documentos-de-domínio)",
    "",
    "## Propósito",
    "",
    "Juntar num lugar só o que cada agente entregou e o que ficou aberto.",
    "O documento é **gerado**: a fonte é a transcrição, o handoff ou o plano.",
    "Para decidir prioridade, use o [RADAR-HOTSPOTS.md](RADAR-HOTSPOTS.md).",
    "",
    "## Como ler",
    "",
    "- **Subagentes:** o resumo é a declaração final do próprio agente.",
    "  Confira o commit e o arquivo antes de tratar como fato.",
    "- **Entregas e handoffs:** documento datado; o número vale para a data dele.",
    "- **Planos:** só entram os que têm sinal de pendência aberta.",
    "- **Worktrees:** mostram trabalho que existe no disco e pode não estar na `main`.",
    "- **Sessões do opencode:** o extrato de prompt e conclusão mora em",
    "  [opencode-sessoes-cp.md](../relatorios-automacao/opencode-sessoes-cp.md).",
    "- **Transcrição bruta** fica fora do repo; o inventário guarda o resumo.",
    "",
    "## Cobertura da varredura",
    "",
    "| Fonte | Encontrados |",
    "|---|---|",
    `| Transcrições de subagente | **${subagentes.length}** |`,
    `| Entregas e handoffs | **${handoffs.length}** |`,
    `| Planos com pendência aberta | **${planos.length}** |`,
    `| Worktrees | **${worktrees.length}** |`,
    `| Relatórios automáticos | **${automacao.length}** |`,
    `| Documentos de domínio | **${dominios.length}** |`,
    "",
    `**Cobertura de agentes (18/10/2026):** ${subagentes.length} transcrições de`,
    "subagente em arquivo + as sessões do opencode no extrato",
    "[opencode-sessoes-cp.md](../relatorios-automacao/opencode-sessoes-cp.md)",
    "(`npm run radar:opencode`, local, sem custo de modelo). O resto do trabalho",
    "de agente aparece nos handoffs, planos e worktrees. O extrato é lido do banco",
    "local; não roda na CI.",
    "",
    `Gerado em: ${agora.toISOString()}`,
    "",
    "## Subagentes com resumo final",
    "",
    blocoSubagentes,
    "",
    "## Sessões do opencode",
    "",
    resumoSessoesOpencode(),
    "",
    "## Entregas e handoffs",
    "",
    tabelaDocs(handoffs),
    "",
    "## Planos com pendência aberta",
    "",
    tabelaPlanos(planos),
    "",
    "## Worktrees e linhas de trabalho",
    "",
    tabelaWorktrees(worktrees),
    "",
    "## Relatórios automáticos",
    "",
    tabelaDocs(automacao),
    "",
    "## Documentos de domínio",
    "",
    tabelaDocs(dominios),
    "",
  ].join("\n");
}

function semCarimbo(texto: string): string {
  return texto.replace(/^Gerado em: .*$/m, "Gerado em: <ignorado>");
}

function principal(): void {
  const opcoes = lerOpcoes(process.argv.slice(2));
  const documento = montarDocumento(opcoes);

  if (opcoes.check) {
    if (!fs.existsSync(opcoes.saida)) {
      console.error(`Inventário ausente: ${caminhoRelativo(opcoes.saida)}. Rode npm run radar.`);
      process.exit(1);
    }
    const atual = lerArquivo(opcoes.saida);
    if (semCarimbo(atual) !== semCarimbo(documento)) {
      console.error("Inventário desatualizado. Rode npm run radar e revise o diff.");
      process.exit(1);
    }
    console.log("Inventário em dia.");
    return;
  }

  fs.mkdirSync(path.dirname(opcoes.saida), { recursive: true });
  fs.writeFileSync(opcoes.saida, documento, "utf8");
  console.log(`Inventário atualizado: ${caminhoRelativo(opcoes.saida)}`);
}

principal();
