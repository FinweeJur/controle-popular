/**
 * @file scripts/agent-tools/bot-fact-checker-pr.mts
 * @description Bot Coletor e Fact-Checker Cívico com geração automatizada de Pull Requests.
 *
 * Papel no portal:
 * Executa a checagem factual rigorosa de novos conjuntos de dados e atualizações públicas
 * antes de qualquer integração, seguindo os padrões do IFCN e a regra editorial (AGENTS.md §7).
 *
 * Fluxo de Trabalho:
 * 1. Audita a consistência de cada afirmação, citação de ementa e link oficial das fontes.
 * 2. Se a taxa de aprovação for $\ge 95\%$ e 100% dos links oficiais forem canônicos e válidos:
 *    - Cria branch isolada `dados/atualizacao-<tema>-<timestamp>`.
 *    - Comita as alterações com mensagem formal por arquivo (AGENTS.md §5.5 e §5.6).
 *    - Abre Pull Request no GitHub contendo o Selo de Checagem Cívica e a ficha completa de fontes.
 * 3. Notifica o Telegram com resumo em 2 a 3 linhas (§12).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checarFatoCivico, type FontePrimariaChecagem, type ParecerFactChecking } from "../../apps/web/lib/assistente/fact-checking-civico.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export interface ItemParaFactChecking {
  id: string;
  tema: string;
  afirmacao: string;
  fontes: FontePrimariaChecagem[];
  arquivosModificados: string[];
}

export interface ResultadoLoteFactChecking {
  aprovadoParaPR: boolean;
  totalItens: number;
  itensComprovados: number;
  itensComRessalva: number;
  itensRejeitados: number;
  pareceres: { id: string; parecer: ParecerFactChecking }[];
}

/**
 * Avalia um lote de dados e afirmações antes de submeter proposta de Pull Request.
 */
export function avaliarLoteFactChecking(itens: ItemParaFactChecking[]): ResultadoLoteFactChecking {
  const pareceres: { id: string; parecer: ParecerFactChecking }[] = [];
  let comprovados = 0;
  let comRessalva = 0;
  let rejeitados = 0;

  for (const item of itens) {
    const parecer = checarFatoCivico(item.afirmacao, item.fontes);
    pareceres.push({ id: item.id, parecer });

    if (parecer.grau === "FATO_COMPROVADO") {
      comprovados++;
    } else if (parecer.grau === "IMPRECISO" || parecer.grau === "SEM_CONTEXTO") {
      comRessalva++;
    } else {
      rejeitados++;
    }
  }

  const taxaAprovacao = itens.length > 0 ? (comprovados / itens.length) * 100 : 0;
  const aprovadoParaPR = taxaAprovacao >= 95 && rejeitados === 0;

  return {
    aprovadoParaPR,
    totalItens: itens.length,
    itensComprovados: comprovados,
    itensComRessalva: comRessalva,
    itensRejeitados: rejeitados,
    pareceres,
  };
}

/**
 * Cria branch e abre Pull Request no GitHub caso o lote seja aprovado pelo fact-checking.
 */
export function submeterPullRequestFactChecked(
  tema: string,
  arquivos: string[],
  resultado: ResultadoLoteFactChecking,
  dryRun = false
): { sucesso: boolean; mensagem: string; prUrl?: string } {
  if (!resultado.aprovadoParaPR) {
    return {
      sucesso: false,
      mensagem: `Submissão barrada: taxa de comprovação (${resultado.itensComprovados}/${resultado.totalItens}) inferior a 95% ou há itens rejeitados.`,
    };
  }

  const timestamp = Date.now();
  const nomeBranch = `dados/atualizacao-${tema.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${timestamp}`;

  if (dryRun) {
    return {
      sucesso: true,
      mensagem: `[DRY-RUN] Lote aprovado com sucesso (${resultado.itensComprovados}/${resultado.totalItens} fatos comprovados). Branch simulada: ${nomeBranch}.`,
    };
  }

  try {
    // 1. Criar e mudar para a nova branch
    const branchRes = spawnSync("git", ["checkout", "-b", nomeBranch], { cwd: RAIZ, encoding: "utf-8" });
    if (branchRes.status !== 0) {
      return { sucesso: false, mensagem: `Falha ao criar branch: ${branchRes.stderr}` };
    }

    // 2. Stage explícito dos arquivos
    for (const arq of arquivos) {
      spawnSync("git", ["add", arq], { cwd: RAIZ });
    }

    // 3. Criar arquivo temporário de commit
    const msgArquivo = path.join(RAIZ, `.commit-pr-${timestamp}.txt`);
    const corpoMsg = [
      `dados(${tema}): atualizacao factual checada por bot com fontes oficiais`,
      "",
      `- Fatos comprovados: ${resultado.itensComprovados}/${resultado.totalItens}`,
      `- Metodologia: Fact-Checking Civico IFCN / Lupa / Aos Fatos`,
      `- Fontes oficiais com link canônico e integridade numerica validada`,
      "",
      "Co-Authored-By: BotFactChecker <bot@controlepopular.com.br>",
    ].join("\n");

    fs.writeFileSync(msgArquivo, corpoMsg, "utf-8");

    // 4. Commit por arquivo com pathspec explícito
    const commitArgs = ["commit", "--only", ...arquivos, "-F", msgArquivo];
    const commitRes = spawnSync("git", commitArgs, { cwd: RAIZ, encoding: "utf-8" });
    if (fs.existsSync(msgArquivo)) fs.unlinkSync(msgArquivo);

    if (commitRes.status !== 0) {
      spawnSync("git", ["checkout", "main"], { cwd: RAIZ });
      return { sucesso: false, mensagem: `Falha no commit: ${commitRes.stderr}` };
    }

    // 5. Push da branch
    const pushRes = spawnSync("git", ["push", "-u", "origin", nomeBranch], { cwd: RAIZ, encoding: "utf-8" });
    if (pushRes.status !== 0) {
      spawnSync("git", ["checkout", "main"], { cwd: RAIZ });
      return { sucesso: false, mensagem: `Falha no push: ${pushRes.stderr}` };
    }

    // 6. Criar Pull Request via CLI do GitHub (gh)
    const tituloPR = `[Fact-Checked] Atualizacao de dados: ${tema}`;
    const corpoPR = [
      `## 🔍 Relatório de Fact-Checking Cívico`,
      `Atualização automática auditada contra as bases oficiais de dados públicos.`,
      "",
      `### Métricas de Verificação:`,
      `- **Total de afirmações avaliadas:** ${resultado.totalItens}`,
      `- **Fatos Comprovados:** ${resultado.itensComprovados}`,
      `- **Itens com Ressalva:** ${resultado.itensComprovados}`,
      `- **Itens Rejeitados / Falsos:** 0`,
      "",
      `### Próximo Passo:`,
      `O Bot Juiz de Segurança (Hermes) auditará este PR (LGPD Mod-11, testes, anti-prompt injection) antes de autorizar o merge.`,
    ].join("\n");

    const prRes = spawnSync("gh", ["pr", "create", "--title", tituloPR, "--body", corpoPR, "--head", nomeBranch, "--base", "main"], {
      cwd: RAIZ,
      encoding: "utf-8",
    });

    // Retorna para main
    spawnSync("git", ["checkout", "main"], { cwd: RAIZ });

    return {
      sucesso: prRes.status === 0,
      mensagem: prRes.status === 0 ? "Pull Request criado com sucesso." : `Erro ao criar PR via gh: ${prRes.stderr}`,
      prUrl: prRes.stdout?.trim(),
    };
  } catch (err) {
    spawnSync("git", ["checkout", "main"], { cwd: RAIZ });
    return { sucesso: false, mensagem: `Exceção ao submeter PR: ${String(err)}` };
  }
}

// Execução de teste
if (process.argv[1] && process.argv[1].endsWith("bot-fact-checker-pr.mts")) {
  console.log("🔍 Testando motor de fact-checking e PR cívico...");
  const exemplo: ItemParaFactChecking = {
    id: "exemplo-licenca-1",
    tema: "licenciamento",
    afirmacao: "A SEMAD aprovou a licença de operação corretiva com compensação de R$ 4.500.000.",
    fontes: [
      {
        url: "https://siam.meioambiente.mg.gov.br/licencas/1024",
        orgaoOuAutor: "SEMAD",
        tituloOuEmenta: "Parecer LOC 1024",
        textoCompleto: "Conselho deferiu LOC com compensação de R$ 4.500.000 para mineração.",
      },
    ],
    arquivosModificados: [],
  };

  const resultado = avaliarLoteFactChecking([exemplo]);
  const submissao = submeterPullRequestFactChecked("licenciamento", [], resultado, true);
  console.log(JSON.stringify(submissao, null, 2));
}
