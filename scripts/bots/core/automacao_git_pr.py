#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/bots/core/automacao_git_pr.py

Automação autônoma de Git e Pull Request via GitHub CLI (gh).

═══ REGRAS DO REPOSITÓRIO (AGENTS.md) ═══
- § 5.3: '--force' nunca.
- § 5.4: Worktree ou branch própria para sessões autônomas.
- § 5.5: Commit por pathspec explícito ('git commit --only ...' ou 'git add <arquivos>').
- § 5.6: Mensagem de commit por ARQUIVO (-F), nunca -m. Trailer obrigatório com MODELO e PLATAFORMA.
- Execução do GitHub CLI ('gh pr create') para abertura de PR sem intervenção manual.
"""

import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent


def executar_shell(cmd: str) -> subprocess.CompletedProcess:
    """Executa um comando de shell dentro da raiz do repositório."""
    print(f"⚙️  [Shell] {cmd}")
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=str(REPO_ROOT))


def submeter_pull_request_autonomo(
    modulo: str,
    arquivos: List[Path],
    titulo_pr: str,
    resumo_md: str,
    modelo_nome: str = "Ollama Local",
    branch_personalizada: str = ""
) -> bool:
    """
    Empacota as alterações em branch dedicada, commita com trailer oficial e abre PR via 'gh'.
    """
    if not arquivos:
        print("ℹ️  [Git] Nenhum arquivo para commitar. Cancelando submissão.")
        return False

    timestamp = datetime.now().strftime("%Y%m%d-%H%M")
    branch_name = branch_personalizada or f"feat/bot-{modulo.lower()}-{timestamp}"

    # 1. Criação e checkout da branch
    print(f"🌿 [Git] Criando branch {branch_name}...")
    executar_shell(f"git checkout -b {branch_name}")

    # 2. Preparação do arquivo de commit
    commit_file = REPO_ROOT / f"commit_msg_bot_{modulo.lower()}.txt"
    with open(commit_file, "w", encoding="utf-8") as f:
        f.write(f"{titulo_pr}\n\n")
        f.write(f"- Atualização automatizada pelo módulo de inteligência cívica: {modulo}.\n")
        f.write(f"- Arquivos sincronizados e higienizados contra dados pessoais (zero CPFs).\n")
        f.write(f"- Compactação em disco e indexação dos atos oficiais com link canônico.\n\n")
        f.write(f"Co-Authored-By: {modelo_nome} <noreply@ollama.ai>\n")
        f.write("Co-Authored-By: opencode <noreply@opencode.ai>\n")

    # 3. Add com pathspec explícito
    caminhos_rel = " ".join([f'"{str(p.relative_to(REPO_ROOT))}"' for p in arquivos])
    executar_shell(f"git add {caminhos_rel}")

    # 4. Commit via arquivo (-F)
    res_commit = executar_shell(f'git commit -F "{commit_file}"')
    if res_commit.returncode != 0:
        print(f"⚠️  [Git Commit] Alerta/Erro: {res_commit.stderr or res_commit.stdout}")

    # 5. Push da branch
    print(f"📤 [Git Push] Enviando branch {branch_name} ao GitHub...")
    res_push = executar_shell(f"git push -u origin {branch_name}")
    if res_push.returncode != 0:
        print(f"❌ [Git Push] Falha ao enviar: {res_push.stderr}")
        if commit_file.exists(): commit_file.unlink()
        return False

    # 6. Criação do Pull Request via GitHub CLI (gh)
    pr_body_file = REPO_ROOT / f"pr_body_{modulo.lower()}.md"
    with open(pr_body_file, "w", encoding="utf-8") as f:
        f.write(f"# 🏛️ {titulo_pr}\n\n")
        f.write(f"Este Pull Request foi aberto de forma autônoma pelo bot **{modulo}** do Controle Popular.\n\n")
        f.write(resumo_md)
        f.write("\n\n---\n")
        f.write("🔍 *Auditoria Cívica Popular • Regra das Seis Qualidades • Zero CPFs no Acervo*\n")

    print(f"🤖 [gh CLI] Abrindo Pull Request no repositório...")
    res_pr = executar_shell(
        f'gh pr create --title "{titulo_pr}" --body-file "{pr_body_file}" --base main --head {branch_name}'
    )

    sucesso = False
    if res_pr.returncode == 0:
        print(f"🎉 [Sucesso] Pull Request criado:\n{res_pr.stdout}")
        sucesso = True
    else:
        print(f"⚠️  [gh CLI] Falha na abertura do PR: {res_pr.stderr}")

    # Limpeza
    if commit_file.exists(): commit_file.unlink()
    if pr_body_file.exists(): pr_body_file.unlink()

    # Retorna para a branch original após finalizar a submissão
    print("🔄 [Git] Retornando para a branch principal (main)...")
    executar_shell("git checkout main")

    return sucesso
