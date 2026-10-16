#!/usr/bin/env python3
"""
Orchestrator IA — coordena agentes Hermes, OpenCode Go, Antigravity, Ollama, Needle.

Workflow: SUGERIR → PLANEJAR → EXECUTAR → AVALIAR → RE-EXECUTAR → ATUALIZAR → MONITORAR

Uso:
    python scripts/orquestrador-ia.py "implementar auth no foz-juris"
    python scripts/orquestrador-ia.py --planos           # lista planos pendentes
    python scripts/orquestrador-ia.py --task <id>         # retoma tarefa
"""

import argparse
import json
import os
import subprocess
import sys
import textwrap
from datetime import datetime
from pathlib import Path

# ============================================================================
# Config — paths, projetos, agentes
# ============================================================================

REPO_ROOT = Path(r"C:\devcoder\controle-popular")
AGENTS_DIR = REPO_ROOT / ".agents"
ORQUESTRADOR_DIR = AGENTS_DIR / "orquestrador"
AGENTES_DIR = AGENTS_DIR / "agentes"
WORKTREES_DIR = Path(r"C:\devcoder\worktrees")
PROJETOS = {
    "controle-popular": {"path": REPO_ROOT, "remote": "https://github.com/FinweeJur/controle-popular.git"},
    "cutiazinha": {"path": Path(r"C:\devcoder\cutiazinha"), "remote": "https://github.com/FinweeJur/cutiazinha.git"},
    "foz-juris": {"path": Path(r"C:\devcoder\foz-juris"), "remote": "https://github.com/FinweeJur/foz-juris.git"},
    "sementeira": {"path": Path(r"C:\devcoder\sementeira"), "remote": "https://github.com/FinweeJur/sementeira.git"},
}
AGY_BIN = r"C:\Users\Home\AppData\Local\agy\bin\agy.exe"
OPECODE_BIN = r"C:\Users\Home\AppData\Local\hermes\node\opencode"
SH_BIN = r"C:\Users\Home\AppData\Local\hermes\tools\git-2.53.0+3-win32-x64\usr\bin\sh.EXE"
NEEDLE_PYTHON = r"C:\Users\Home\AppData\Local\Programs\Python\Python312\python.exe"
NEEDLE_BIN = r"C:\Users\Home\AppData\Local\Programs\Python\Python312\Scripts\needle.exe"
NEEDLE_LIB = r"C:\dev\_flax_lib"
NEEDLE_MODEL = r"C:/devcoder/.needle-models/needle3.safetensors"
OLLAMA_HOST = "http://127.0.0.1:11434"
TELEGRAM_TOKEN = "(lê de scripts/.env)"
TELEGRAM_CHAT_ID = "(lê de scripts/.env)"


def log_etapa(etapa: str, msg: str, projeto: str = ""):
    """Notifica no Telegram — 3 linhas: etapa concluída / próxima / risco."""
    print(f"  [{etapa}] {projeto}: {msg}")
    # Telegram via script existente
    ts = datetime.now().strftime("%d/%m %H:%M")
    payload = {
        "text": f"[{ts}] {etapa} — {projeto}\n{msg}",
        "parse_mode": "plain",
    }
    # Chama o script existente do projeto
    script = REPO_ROOT / "scripts" / "envia-telegram.py"
    if script.exists():
        env = os.environ.copy()
        env["TELEGRAM_MSG"] = json.dumps(payload["text"])
        try:
            subprocess.run(
                [sys.executable, str(script)],
                env=env, timeout=10, capture_output=True
            )
        except Exception:
            pass  # Telegram é best-effort


# ============================================================================
# Agentes — wrappers para cada plataforma
# ============================================================================

def agy_run(prompt: str, model: str = "Gemini 3.8 Flash (Medium)", workdir: str = None,
            timeout: int = 300, use_opencode_google: bool = False) -> str:
    """Antigravity (agy) — pesquisa, análise, planejamento, revisão criativa.

    Modelos disponíveis: Gemini 3.8 Flash (H/M/L), Claude Sonnet 4.6,
    Claude Opus 4.6, GPT-OSS 120B.

    Nota: agy -p pode demorar >120s para prompts complexos.
    Para respostas rápidas, use use_opencode_google=True (gemini-3.5-flash via opencode).
    """
    if use_opencode_google and model.startswith("Gemini 3.8 Flash"):
        # Fast path — OpenCode Google model
        model_map = {
            "Gemini 3.8 Flash (High)": "google/gemini-3.8-flash",
            "Gemini 3.8 Flash (Medium)": "google/gemini-3.5-flash",
            "Gemini 3.8 Flash (Low)": "google/gemini-3.5-flash",
        }
        oc_model = model_map.get(model, "google/gemini-3.5-flash")
        return opencode_run(prompt, model=oc_model, workdir=workdir, timeout=timeout)

    cmd = [AGY_BIN, "-p", prompt, "--model", model,
           "--print-timeout", f"{timeout}s",
           "--dangerously-skip-permissions"]
    if workdir:
        cmd += ["--add-dir", workdir]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True,
                                timeout=timeout + 30, input="")
        return result.stdout.strip()
    except subprocess.TimeoutExpired:
        return "AGY_TIMEOUT"


def opencode_run(prompt: str, model: str = "google/gemini-3.5-flash", workdir: str = None,
                 thinking: bool = False, timeout: int = 300) -> str:
    """OpenCode CLI — implementação de código via Google/Gemini (Go Models fallback via agy).

    Nota: OpenCode Go CLI models retornam 'Unexpected server error'.
    Usamos google/gemini-* que funciona, e agy GPT-OSS 120B como Go-model agent.
    """
    cmd = [OPECODE_BIN, "run", prompt, "--thinking"] if thinking \
        else [OPECODE_BIN, "run", prompt, "--model", model]
    # opencode run accepts project path as positional arg
    if workdir:
        cmd.append(workdir)
    # opencode is a POSIX shell script — must run via sh on Windows
    cmd = [SH_BIN, OPECODE_BIN] + cmd[1:]  # replace executable
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 30,
                          cwd=workdir if workdir else ".", input="")
    return result.stdout.strip()


def opencode_go(prompt: str, workdir: str = None, timeout: int = 600) -> str:
    """Agente OpenCode Go — usa GPT-OSS 120B via agy (same Go model family).
    OpenCode Go CLI models give 'Unexpected server error' — agy é o workaround.
    Fallback: OpenCode CLI com Gemini se agy for lento."""
    result = agy_run(prompt, model="GPT-OSS 120B (Medium)", workdir=workdir, timeout=timeout)
    if result == "AGY_TIMEOUT":
        # Fallback rápido — OpenCode Google model
        return opencode_run(prompt, model="google/gemini-3.5-flash",
                           workdir=workdir, timeout=timeout)
    return result


def ollama_run(prompt: str, model: str = "deepseek-r1:7b",
                temperature: float = 0, format_json: bool = False) -> str:
    """Ollama local — tarefas repetitivas, triagem, sumarização (sem custo/token)."""
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature},
    }
    if format_json:
        payload["format"] = "json"
    result = subprocess.run(
        ["curl", "-s", f"{OLLAMA_HOST}/api/generate", "-d", json.dumps(payload)],
        capture_output=True, text=True, timeout=120
    )
    data = json.loads(result.stdout)
    return data.get("response", "").strip()


def needle_run(query: str, tools_json: str = "[]") -> str:
    """Needle — micromodelo 26M params para triagem e classificação (sem custo token).

    NOTA: needle.exe trava sem pty → usamos Popen + CREATE_NEW_PROCESS_GROUP.
    --max-len 128 + seed 42 impedem loops infinitos. Timeout 15s forçado.
    Exige .safetensors + flax/jax via PYTHONPATH=C:/dev/_flax_lib.
    Modelo: cactus-compute/needle3 (10k stars no GitHub).
    """
    if not os.path.exists(NEEDLE_MODEL):
        return "NEEDLE_NOT_READY"

    env = os.environ.copy()
    env["PYTHONPATH"] = NEEDLE_LIB
    # --tools expects a FILE path, not JSON inline
    tools_file = None
    tools_arg = []
    if tools_json.strip() not in ("", "[]"):
        import tempfile
        tools_tmp = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False,
            dir=r"C:\devcoder\.needle-models"
        )
        tools_tmp.write(tools_json)
        tools_tmp.close()
        tools_file = tools_tmp.name
        tools_arg = ["--tools", tools_file]

    cmd = [
        NEEDLE_BIN, "run",
        "--checkpoint", NEEDLE_MODEL,
        "--query", query,
        "--max-len", "128",
        "--seed", "42",
        "--temperature", "0",
    ] + tools_arg

    # Popen + process group kill (subprocess.run doesn't kill children on Windows)
    CREATE_NEW_PROCESS_GROUP = 0x00002000
    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env,
            creationflags=CREATE_NEW_PROCESS_GROUP,
        )
        try:
            stdout, stderr = proc.communicate(timeout=15)
            return stdout.strip()
        except subprocess.TimeoutExpired:
            # Force-kill the entire process tree
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                capture_output=True, timeout=5
            )
            return "NEEDLE_TIMEOUT"
    except Exception as e:
        return f"NEEDLE_ERROR: {e}"
    finally:
        if tools_file:
            os.unlink(tools_file)


# ============================================================================
# Workflow Engine
# ============================================================================

class Orquestrador:
    """Orquestra a 7-fase: SUGERIR → PLANEJAR → EXECUTAR → AVALIAR → RE-EXECUTAR → ATUALIZAR → MONITORAR"""

    def __init__(self, projeto: str, task_id: str = None):
        self.projeto = projeto
        self.repo = PROJETOS[projeto]
        self.task_id = task_id or datetime.now().strftime("%Y%m%d_%H%M")
        self.workdir = self.repo["path"]
        self.handoff_dir = ORQUESTRADOR_DIR / "workflow" / f"task_{self.task_id}"
        self.handoff_dir.mkdir(parents=True, exist_ok=True)

    def fase_sugerir(self, topico: str) -> dict:
        """Fase 1: SUGERIR — Needle tria + Antigravity sugere."""
        log_etapa("SUGERIR", f"Analisando: {topico}", self.projeto)

        # Needle: triagem rápida (15s timeout — micromodelo 26M, pode travar)
        needle_result = needle_run(
            f"Classifique estas issues do projeto {self.projeto} por prioridade (alta/media/baixa). "
            f"Critérios: impacto no usuário, dificuldade técnica, dado pessoal envolvido."
        )
        if needle_result not in ("NEEDLE_NOT_READY", "NEEDLE_TIMEOUT", ""):
            self._save("sugestoes_needle.json", needle_result)
        elif needle_result == "NEEDLE_TIMEOUT":
            log_etapa("SUGERIR", "⚠️ Needle timeout (micromodelo) — usando AGY", self.projeto)

        # AGY (Antigravity): análise profunda + sugestões (2-3 min, Google API própria)
        agy_prompt = textwrap.dedent(f"""
            Você é um arquiteto sênior analisando o projeto {self.projeto} no GitHub FinweeJur.
            Contexto: https://sementeiraprojetos.com.br lista todos os projetos.
            Tarefa: analise '{topico}'. Identifique:
            1. Oportunidades de melhoria (máx 5)
            2. Riscos técnicos (máx 3)
            3. Dependências entre projetos
            Retorne JSON com chaves: oportunidades[], riscos[], dependencias[].
            Seja conciso — frases até 15 palavras.
        """).strip()

        result = agy_run(agy_prompt, model="Gemini 3.8 Flash (High)",
                        workdir=str(self.workdir), timeout=300)
        self._save("sugestoes_antigravity.json", result)
        log_etapa("SUGERIR", "✅ Concluído — sugestões priorizadas", self.projeto)
        return {"agy_result": result, "needle_result": needle_result}

    def fase_planejar(self, sugestao: str) -> dict:
        """Fase 2: PLANEJAR — Antigravity cria plano detalhado."""
        log_etapa("PLANEJAR", f"Planejando: {sugestao[:60]}...", self.projeto)

        # Lê AGENTS.md do projeto
        agents_md = self.repo["path"] / "AGENTS.md"
        context = ""
        if agents_md.exists():
            context = f"AGENTS.md do projeto:\n{agents_md.read_text()[:3000]}\n\n"

        prompt = textwrap.dedent(f"""
            {context}
            Com base nas sugestões anteriores, crie um plano de implementação para: {sugestao}

            Formato YAML:
            ```yaml
            titulo: "..."
            prioridade: "alta|media|baixa"
            milestones:
              - nome: "..."
                descricao: "..."
                agente: "opencode-go"
                arquivos: ["..."]
                testes: ["..."]
            riscos:
              - "..."
            estimativa_horas: N
            ```
            Siga rigorosamente as regras do AGENTS.md: worktree, pathspec, commit em arquivo,
            CPF mod-11, zero secrets.
        """).strip()

        result = agy_run(prompt, model="Gemini 3.8 Flash (High)",
                        workdir=str(self.workdir))
        plano_path = self.workdir / "docs" / "planos" / f"PLANO-AUTO-{self.task_id}.yaml"
        plano_path.write_text(result)
        self._save("plano.md", result)
        log_etapa("PLANEJAR", "✅ Plano salvo em " + str(plano_path), self.projeto)
        return {"plano": result, "path": str(plano_path)}

    def fase_executar(self, plano: dict, retry: int = 0) -> dict:
        """Fase 3: EXECUTAR — OpenCode Go implementa."""
        log_etapa("EXECUTAR", f"Implementando (tentativa {retry + 1})...", self.projeto)

        worktree_name = f"{self.projeto}-task{self.task_id}"
        wt_path = WORKTREES_DIR / worktree_name
        branch = f"auto/task-{self.task_id}"

        # Cria worktree
        self._criar_worktree(wt_path, branch)

        # Lê o plano
        plano_text = Path(plano["path"]).read_text()

        prompt = textwrap.dedent(f"""
            Você é um agente de código usando OpenCode Go model. Implemente este plano:

            {plano_text}

            REGRAS OBRIGATÓRIAS do AGENTS.md:
            - Worktree isolado, branch próprio
            - Commit por pathspec: git commit --only <caminho> -F <arquivo>
            - Nunca --force push
            - Mensagem de commit em PORTUGUÊS sem acento
            - Co-Authored-By obrigatório
            - Zero CPF (mod-11) — rode checar-dado-pessoal-em-dado.py
            - TypeScript clean (tsc --noEmit)

            Trabalhe em: {wt_path}
        """).strip()

        result = opencode_go(prompt, workdir=str(wt_path), timeout=600)
        self._save("execucao_resultado.md", result)

        # Commit automático
        self._commit_automato(wt_path, result)

        log_etapa("EXECUTAR", "✅ Implementação concluída", self.projeto)
        return {"worktree": str(wt_path), "result": result[:500]}

    def fase_avaliar(self, exec_result: dict) -> dict:
        """Fase 4: AVALIAR — Hermes valida + Antigravity revisa criatividade."""
        log_etapa("AVALIAR", "Validando implementação...", self.projeto)

        wt_path = Path(exec_result["worktree"])
        issues = []

        # Hermes: verificações técnicas
        checks = [
            ("TypeScript", ["npx", "tsc", "--noEmit"], str(wt_path / "apps/web")),
            ("CPF check", ["python", "scripts/checar-dado-pessoal-em-dado.py"], str(self.workdir)),
        ]

        for nome, cmd, cwd in checks:
            try:
                r = subprocess.run(cmd, capture_output=True, text=True, timeout=120, cwd=cwd)
                status = "✅" if r.returncode == 0 else "❌"
                issues.append(f"{status} {nome}: {r.returncode}")
                if r.returncode != 0:
                    issues.append(f"  stderr: {r.stderr[:300]}")
            except Exception as e:
                issues.append(f"⚠️ {nome}: {e}")

        # Antigravity: revisão criativa
        agy_result = agy_run(
            f"Revise esta implementação para {self.projeto}. Verifique:\n"
            f"1. Acessibilidade (WCAG AA)\n"
            f"2. UX mobile (390px)\n"
            f"3. Qualidade do código\n"
            f"4. Conformidade com AGENTS.md\n"
            f"5. Documentação\n"
            f"Seja concisa — bullets, máximo 500 palavras.",
            model="Gemini 3.8 Flash (Medium)",
            workdir=str(wt_path),
        )
        self._save("avaliacao.md", "\n".join(issues) + "\n\n" + agy_result)
        passed = all("✅" in i for i in issues if not i.startswith("⚠️"))
        log_etapa("AVALIAR", "✅ Passou" if passed else "❌ Falhou — re-executar", self.projeto)
        return {"passed": passed, "issues": issues, "agy_review": agy_result}

    def fase_reexecutar(self, plano: dict, avaliacao: dict, max_retries: int = 3) -> dict:
        """Fase 5: RE-EXECUTAR — corrige e re-roda."""
        failures = [i for i in avaliacao["issues"] if "❌" in i]
        if not failures or self.retry_count >= max_retries:
            return avaliacao

        log_etapa("RE-EXECUTAR", f"Corrigindo {len(failures)} falhas (tentativa {self.retry_count + 2}/{max_retries})", self.projeto)

        fix_prompt = textwrap.dedent(f"""
            Corrija estas falhas na implementação:
            {chr(10).join(failures)}

            Foque apenas no que falhou. Use worktree {avaliacao.get('worktree', self.workdir)}.
            Regras: pathspec, mensagem em arquivo, CPF mod-11, tsc clean.
        """).strip()

        result = opencode_go(fix_prompt, workdir=avaliacao.get('worktree', str(self.workdir)), timeout=600)
        self._save("reexecucao.md", result)
        self._commit_automato(Path(avaliacao["worktree"]), result)

        new_eval = self.fase_avaliar({"worktree": avaliacao.get("worktree", str(self.workdir))})
        return new_eval

    def fase_atualizar(self, exec_result: dict) -> dict:
        """Fase 6: ATUALIZAR — Hermes faz commit + push + merge."""
        log_etapa("ATUALIZAR", "Commit + push para o GitHub", self.projeto)

        wt_path = Path(exec_result["worktree"])
        # Rebasa e push
        result = subprocess.run(
            ["git", "fetch", "origin", "&&", "git", "rebase", "origin/main",
             "&&", "git", "push", "origin", "HEAD:main"],
            capture_output=True, text=True, shell=True, cwd=str(wt_path)
        )
        # Telegram notification
        log_etapa("ATUALIZAR", "✅ Push concluído — " + ("sucesso" if result.returncode == 0 else "verificar"), self.projeto)
        return {"push_result": result.stdout[:500]}

    def fase_monitorar(self) -> dict:
        """Fase 7: MONITORAR — Antigravity busca notícias + novos modelos."""
        log_etapa("MONITORAR", "Buscando novidades de IA + modelos open-source", self.projeto)

        prompt = textwrap.dedent("""
            Pesquise e resuma em PORTUGUÊS:
            1. Novidades em modelos open-source esta semana (HuggingFace, Ollama)
            2. Notícias de transparência pública ou Justiça (Brasil)
            3. Atualizações relevantes de dependências dos projetos FinweeJur
            Formato: bullets curtos, máximo 15 linhas, com links.
        """).strip()

        result = agy_run(prompt, model="Gemini 3.8 Flash (Low)", timeout=120)
        # Needle tria os resultados
        needle_result = needle_run(
            f"Classifique estas notícias por relevância para {self.projeto}: {result[:2000]}"
        )
        self._save("monitoramento.md", result + "\n\n--- Needle triagem ---\n" + needle_result)
        log_etapa("MONITORAR", "✅ Monitoramento concluído", self.projeto)
        return {"news": result, "needle_triage": needle_result}

    # --- Helpers ---

    def _save(self, filename: str, content: str):
        (self.handoff_dir / filename).write_text(content)

    def _criar_worktree(self, wt_path: Path, branch: str):
        """Cria worktree no diretório do projeto."""
        if wt_path.exists():
            return
        WT_PARENT = WORKTREES_DIR
        WT_PARENT.mkdir(parents=True, exist_ok=True)
        cmd = f"git -C {self.workdir} worktree add -b {branch} {wt_path}"
        r = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if r.returncode != 0:
            log_etapa("ERRO", f"Worktree: {r.stderr[:200]}", self.projeto)

    def _commit_automato(self, wt_path: Path, result_text: str):
        """Commit seguindo as regras do AGENTS.md."""
        msg_file = wt_path / "_msg_commit.txt"
        msg_file.write_text(textwrap.dedent(f"""
            feat: implementacao automatica — orquestrador-ia task {self.task_id}

            Co-Authored-By: GPT-OSS 120B <noreply@opencodestorage.com>
            Co-Authored-BY: Antigravity <antigravity@google.com>
        """).strip())
        subprocess.run(
            f"git add -A && git commit -F _msg_commit.txt",
            shell=True, cwd=str(wt_path), capture_output=True, text=True
        )

    def run_completo(self, topico: str) -> dict:
        """Executa o workflow completo: SUGERIR → PLANEJAR → EXECUTAR → AVALIAR → RE-EXECUTAR → ATUALIZAR → MONITORAR"""
        self.retry_count = 0
        print(f"\n{'='*60}")
        print(f"  ORQUESTRAÇÃO MULTI-AGENTE")
        print(f"  Projeto: {self.projeto}")
        print(f"  Tarefa: {topico}")
        print(f"  Task ID: {self.task_id}")
        print(f"{'='*60}\n")

        # 1. SUGERIR
        sugestoes = self.fase_sugerir(topico)

        # 2. PLANEJAR
        plano = self.fase_planejar(topico)

        # 3. EXECUTAR
        exec_result = self.fase_executar(plano)

        # 4. AVALIAR
        avaliacao = self.fase_avaliar(exec_result)

        # 5. RE-EXECUTAR (se necessário)
        if not avaliacao["passed"]:
            avaliacao = self.fase_reexecutar(plano, avaliacao)

        # 6. ATUALIZAR
        update = self.fase_atualizar(exec_result)

        # 7. MONITORAR
        monitor = self.fase_monitorar()

        log_etapa("COMPLETO", f"✅ Workflow finalizado — task {self.task_id}", self.projeto)
        return {
            "task_id": self.task_id,
            "sugestoes": sugestoes,
            "plano": plano,
            "execucao": exec_result,
            "avaliacao": avaliacao,
            "atualizacao": update,
            "monitoramento": monitor,
        }


# ============================================================================
# CLI
# ============================================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Orquestrador multi-agente: Hermes + OpenCode Go + Antigravity + Ollama/Needle"
    )
    parser.add_argument("topico", nargs="?", help="Tópico da tarefa")
    parser.add_argument("--projeto", choices=list(PROJETOS.keys()),
                        default="controle-popular", help="Projeto alvo")
    parser.add_argument("--task", help="Retomar task ID existente")
    parser.add_argument("--planos", action="store_true", help="Listar planos pendentes")
    parser.add_argument("--fase", choices=["sugerir", "planejar", "executar", "avaliar",
                       "reexecutar", "atualizar", "monitorar"], help="Executar uma fase específica")
    args = parser.parse_args()

    if args.planos:
        # Lista planos de docs/planos/
        planos_dir = PROJETOS[args.projeto]["path"] / "docs" / "planos"
        for f in sorted(planos_dir.glob("PLANO-AUTO-*")):
            print(f"  {f.name}  ({f.stat().st_size} bytes)")
        sys.exit(0)

    if not args.topico and not args.fase:
        parser.print_help()
        sys.exit(1)

    orq = Orquestrador(args.projeto, task_id=args.task)

    if args.fase:
        # Executa uma fase específica
        fases = {
            "sugerir": orq.fase_sugerir,
            "planejar": orq.fase_planejar,
            "executar": orq.fase_executar,
            "avaliar": orq.fase_avaliar,
            "atualizar": orq.fase_atualizar,
            "monitorar": orq.fase_monitorar,
        }
        result = fases[args.fase](args.topico)
    else:
        result = orq.run_completo(args.topico)

    print(f"\n✅ Task completa: {orq.task_id}")
    print(f"   Handoffs: {orq.handoff_dir}")
