import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const raiz = join(fileURLToPath(new URL("..", import.meta.url)));
const saidaDir = join(raiz, ".claude", "manha");

function corpo() {
  const hoje = new Date().toISOString().slice(0, 10);
  const agora = new Date().toLocaleTimeString("pt-BR");

  const linhas: string[] = [];
  linhas.push(`# Estagio do app em ${hoje} ${agora}`);
  linhas.push("");

  const estadoPath = join(raiz, "docs", "02-estado", "ESTADO.md");
  let ultimaMedicao = "(nao encontrada)";
  try {
    const texto = readFileSync(estadoPath, "utf8");
    const m = texto.match(/^\|\*\*Última medição:\*\*\|\s*([^\n]+)/m) ?? texto.match(/\>\s*\*\*Última medição:\*\*\s*([^\n]+)/i);
    if (m) ultimaMedicao = m[1].trim();
  } catch {
    /* ESTADO.md ausente: reporta ao final */
  }

  linhas.push(`- **Fonte do estado:** \`docs/02-estado/ESTADO.md\` (medição: ${ultimaMedicao})`);

  const ramo = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  linhas.push(`- **Branch:** ${ramo}`);

  const status = git(["status", "--short"]);
  const arquivos = status.split("\n").filter(Boolean);
  const mod = arquivos.filter((a) => !a.startsWith("??") && !a.startsWith(" D") && !a.startsWith("D ")).length;
  const novos = arquivos.filter((a) => a.startsWith("??")).length;
  const removidos = arquivos.filter((a) => /^ ?D /.test(a)).length;
  const pendentes = arquivos.length;
  linhas.push(`- **Trabalho em andamento:** ${pendentes} alterações não commitadas (${novos} novos, ${mod} modificados${removidos ? `, ${removidos} removidos` : ""})`);

  const ultimoCommit = git(["log", "-1", "--format=%h %s"]);
  linhas.push(`- **Último commit:** \`${ultimoCommit}\``);

  const desc = git(["log", "--oneline", "-3"]);
  linhas.push("");
  linhas.push("### Entregas recentes");
  linhas.push("```text");
  linhas.push(desc);
  linhas.push("```");

  linhas.push("");
  linhas.push("### Bloqueios ativos (do ESTADO.md)");
  try {
    const texto = readFileSync(estadoPath, "utf8");
    const bloq = texto.split(/\n(?=\|)/).find((b) => /Bloqueio\|/.test(b)) ?? "";
    const linhasBloq = bloq.split("\n").slice(2).filter((b) => b.trim().startsWith("|"));
    if (linhasBloq.length) {
      for (const lb of linhasBloq.slice(0, 6)) {
        const cel = lb.split("|").map((c) => c.trim()).filter(Boolean);
        const nome = (cel[0] ?? "").replace(/\*\*/g, "");
        const ate = cel[1] ?? "";
        linhas.push(`- **${nome}**${ate && ate !== "—" ? ` — até ${ate}` : ""}`);
      }
    } else {
      linhas.push("- (nenhum listado)");
    }
  } catch {
    linhas.push("- (ESTADO.md ausente)");
  }

  return linhas.join("\n");
}

function git(args: string[]): string {
  try {
    return execSync(`git ${args.join(" ")}`, { cwd: raiz, encoding: "utf8" }).trim();
  } catch {
    return "(git indisponivel)";
  }
}

function publicar(texto: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  mkdirSync(saidaDir, { recursive: true });
  const caminho = join(saidaDir, `RELATORIO-${hoje}.md`);
  writeFileSync(caminho, texto, "utf8");

  try {
    const opencode = process.env.OPENCODE ?? "opencode";
    const tmp = mkdtempSync(join(tmpdir(), "relatorio-manha-"));
    const promptFile = join(tmp, "prompt.md");
    const instrucao = [
      "Sociedade de manutencao do repositorio. Um relatorio curto de estagio do app foi gerado",
      "(arquivo abaixo). Apresente-o ao dono de forma concisa, destacando: o que esta no ar,",
      "o que tem trabalho em andamento nao commitado, e o que esta bloqueado. Nao execute",
      "nenhuma acao de codigo — somente reporte.",
      "",
      "---",
      texto,
    ].join("\n");
    writeFileSync(promptFile, instrucao, "utf8");
    const saida = execSync(`"${opencode}" run -f "${promptFile}" --title "Estagio do app ${hoje}"`, {
      cwd: raiz,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    process.stdout.write(saida);
    rmSync(tmp, { recursive: true, force: true });
  } catch {
    // Fallback: relatorio segue no arquivo .claude/manha/ sem entrega no chat.
  }
}

const texto = corpo();
process.stdout.write("### Relatorio de estagio\n\n");
process.stdout.write(texto);
process.stdout.write("\n\n");
publicar(texto);
