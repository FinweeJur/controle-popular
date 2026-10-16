#!/usr/bin/env python3
"""
bot-orquestrador.py — Bridge Telegram ↔ Orquestrador IA

Conversa no grupo. Cada agente responde pelo seu prefixo:
  !sugestir <topico>      → SUGERIR (Needle→AGY fallback)
  !planejar <topico>      → PLANEJAR (AGY)
  !executar <task_id>     → EXECUTAR (AGY Claude Sonnet)
  !avaliar <task_id>       → AVALIAR (tsc + axe-core)
  !monitorar <topico>      → MONITORAR (AGY + Needle)
  !agentes                  → lista agentes e status

Bots virtuais (no mesmo grupo, diferenciados pelo prefixo):
  @NeedleBOT    → !needle <query>
  @AgntBOT      → !agy <query>
  @OpencodeBOT  → !opencode <query>
  @OllamaBOT    → !ollama <query>

Config: scripts/.env  (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
Run: python scripts/bot-orquestrador.py  (long-poll, ~12h ciclo)
"""
import json, os, re, time, sys, subprocess, signal
from pathlib import Path
from datetime import datetime
import urllib.request, urllib.error

REPO = Path(__file__).resolve().parents[1]
ENV_PATH = REPO / "scripts" / ".env"
WORKTREES_DIR = REPO / "C:\\devcoder\\worktrees"

# --- Carrega .env -----------------------------------------------------------
def carregar_env() -> dict:
    dados = {}
    if ENV_PATH.exists():
        for linha in ENV_PATH.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$", linha)
            if m:
                dados[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    return dados

ENV = carregar_env()
TOKEN = ENV.get("TELEGRAM_BOT_TOKEN", "")
CHAT_ID = str(ENV.get("TELEGRAM_CHAT_ID", ""))

if not TOKEN or not CHAT_ID:
    print("ERRO: TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes", file=sys.stderr)
    sys.exit(2)

BOT_URL = f"https://api.telegram.org/bot{TOKEN}"
POLL_INTERVAL = 3   # segundos entre polls

# --- Telegram API (stdlib only) ---------------------------------------------
def tg_send(method: str, params: dict) -> dict:
    url = f"{BOT_URL}/{method}"
    data = json.dumps(params).encode()
    req = urllib.request.Request(url, data=data, headers={"content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        return {"ok": False, "description": f"HTTP {e.code}: {body}"}
    except Exception as e:
        return {"ok": False, "description": str(e)}

def tg_msg(text: str) -> None:
    """Envia mensagem para o grupo (text only — evita erro 400 de HTML)."""
    r = tg_send("sendMessage", {"chat_id": CHAT_ID, "text": text})
    if not r.get("ok"):
        print(f"⚠️  tg_msg failed: {r.get('description', '?')}", file=sys.stderr)

# --- Command handlers --------------------------------------------------------
def cmd_sugerir(args: str) -> str:
    """!sugestir <topico>"""
    if not args:
        return "Uso: !sugestir <topico>"
    tg_msg(f"🔍 SUGERIR iniciado: {args}")
    r = subprocess.run(
        ["python", str(REPO / "scripts" / "orquestrador-ia.py"),
         args, "--projeto", "controle-popular", "--fase", "sugerir"],
        capture_output=True, text=True, timeout=600, cwd=str(REPO)
    )
    if r.returncode == 0:
        return f"✅ SUGERIR concluído.\n{r.stdout[-500:]}"
    return f"❌ SUGERIR falhou (exit {r.returncode}):\n{r.stderr[-500:]}"

def cmd_planejar(args: str) -> str:
    """!planejar <topico> ou !planejar --task <id>"""
    if not args:
        return "Uso: !planejar <topico>  |  !planejar --task <id>"
    extra = ["--projeto", "controle-popular", "--fase", "planejar"]
    if args.startswith("--task"):
        parts = args.split()
        extra += ["--task", parts[1] if len(parts) > 1 else ""]
    else:
        extra += [args]
    r = subprocess.run(
        ["python", str(REPO / "scripts" / "orquestrador-ia.py")] + extra,
        capture_output=True, text=True, timeout=600, cwd=str(REPO)
    )
    return f"✅ PLANEJAR:\n{r.stdout[-500:]}" if r.returncode == 0 else f"❌ PLANEJAR: {r.stderr[-500:]}"

def cmd_executar(task_id: str) -> str:
    """!executar <task_id>"""
    if not task_id:
        return "Uso: !executar <task_id>"
    tg_msg(f"⚙️ EXECUTAR iniciado: task {task_id}")
    r = subprocess.run(
        ["python", str(REPO / "scripts" / "orquestrador-ia.py"),
         "--task", task_id, "--projeto", "controle-popular", "--fase", "executar"],
        capture_output=True, text=True, timeout=900, cwd=str(REPO)
    )
    return f"✅ EXECUTAR concluído.\n{r.stdout[-600:]}" if r.returncode == 0 else f"❌ EXECUTAR: {r.stderr[-600:]}"

def cmd_avaliar(task_id: str) -> str:
    """!avaliar <task_id>"""
    if not task_id:
        return "Uso: !avaliar <task_id>"
    r = subprocess.run(
        ["python", str(REPO / "scripts" / "orquestrador-ia.py"),
         "--task", task_id, "--projeto", "controle-popular", "--fase", "avaliar"],
        capture_output=True, text=True, timeout=600, cwd=str(REPO)
    )
    return f"✅ AVALIAR:\n{r.stdout[-500:]}" if r.returncode == 0 else f"❌ AVALIAR: {r.stderr[-500:]}"

def cmd_monitorar(args: str) -> str:
    """!monitorar <topico>"""
    if not args:
        return "Uso: !monitorar <topico>"
    r = subprocess.run(
        ["python", str(REPO / "scripts" / "orquestrador-ia.py"),
         args, "--projeto", "controle-popular", "--fase", "monitorar"],
        capture_output=True, text=True, timeout=600, cwd=str(REPO)
    )
    return f"✅ MONITORAR:\n{r.stdout[-500:]}" if r.returncode == 0 else f"❌ MONITORAR: {r.stderr[-500:]}"

def cmd_agentes(_: str) -> str:
    return ("🤖 **Agentes Virtuais (grupo Telegram)**\n\n"
        "Use prefixos:\n"
        "  !sugestir <topico>    → SUGERIR (Needle→AGY)\n"
        "  !planejar <topico>    → PLANEJAR (AGY)\n"
        "  !executar <task_id>   → EXECUTAR (AGY Claude Sonnet)\n"
        "  !avaliar <task_id>    → AVALIAR (tsc+axe)\n"
        "  !monitorar <topico>   → MONITORAR (AGY+Needle)\n"
        "  !agentes             → Esta ajuda\n"
        "  !status              → Status dos agentes")

def cmd_status(_: str) -> str:
    agy = Path(ENV.get("AGY_BIN", r"C:\Users\Home\AppData\Local\agy\bin\agy.exe"))
    openc = Path(ENV.get("OPECODE_BIN", r"C:\Users\Home\AppData\Local\hermes\node\opencode"))
    needle = Path(ENV.get("NEEDLE_BIN", r"C:\Users\Home\AppData\Local\Programs\Python\Python312\Scripts\needle.exe"))
    model = Path(r"C:\devcoder\.needle-models\needle3.safetensors")
    return (
        "📊 **Status dos Agentes**\n\n"
        f"AGY (Antigravity): {'✅' if agy.exists() else '❌'} {agy}\n"
        f"OpenCode CLI:      {'✅' if openc.exists() else '❌'} {openc}\n"
        f"Needle:            {'✅' if needle.exists() else '❌'} {needle}\n"
        f"Needle model:      {'✅' if model.exists() else '❌'} {model}\n"
        f"Orquestrador:      ✅ scripts/orquestrador-ia.py\n"
        f"Bot:               ✅ @ControlePopularBOT\n"
        f"Grupo:             ✅ chat_id={CHAT_ID}"
    )

def cmd_ping(_: str) -> str:
    return f"🏓 Pong! {datetime.now().isoformat(timespec='seconds')}"

COMMANDS = {
    "!sugestir":  cmd_sugerir,
    "!planejar":  cmd_planejar,
    "!executar":  cmd_executar,
    "!avaliar":   cmd_avaliar,
    "!monitorar": cmd_monitorar,
    "!agentes":   cmd_agentes,
    "!status":    cmd_status,
    "!ping":      cmd_ping,
}

# --- Bot handlers (com prefixo de grupo) -------------------------------------
# Bots virtuais respondem quando mencionados ou prefixados
AGENT_BOTS = {
    "needle":  "🔮 NeedleBOT (26M params) — triagem rápida",
    "agy":     "🧠 AGYBOT (Gemini 3.8 Flash) — análise profunda",
    "opencode": "💻 OpenCodeBOT — geração de código",
    "ollama":  "🏠 OllamaBOT — modelo local offline",
}

def handle_message(text: str, from_name: str = "?") -> str | None:
    """Route message to handler, return reply text or None."""
    text = text.strip()

    # Check for main commands
    for prefix, handler in COMMANDS.items():
        if text.startswith(prefix):
            args = text[len(prefix):].strip()
            return handler(args)

    # Check for virtual bot mentions: "bot-needle" or "@NeedleBOT" patterns
    for agent in AGENT_BOTS:
        if f"!{agent}" in text.lower() or f"@{agent}bot" in text.lower():
            return f"🤖 {AGENT_BOTS[agent]}\nUse: !sugestir <topico> ou !planejar <topico>"

    return None

# --- Long-poll loop ----------------------------------------------------------
def main():
    # Delete existing webhook, use getUpdates
    tg_send("deleteWebhook", {"drop_pending_updates": True})

    print(f"🤖 bot-orquestrador.py listening on chat {CHAT_ID}")
    tg_msg("🤖 Bot-orquestrador online! Comandos: !agentes | !status")

    offset = 0
    signal.signal(signal.SIGINT, lambda *_: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))

    while True:
        try:
            r = tg_send("getUpdates", {"offset": offset, "timeout": 60, "limit": 50})
            if not r.get("ok"):
                time.sleep(POLL_INTERVAL)
                continue

            updates = r.get("result", [])
            for u in updates:
                offset = u["update_id"] + 1
                msg = u.get("message", {})
                text = msg.get("text", "").strip()
                from_name = (msg.get("from") or {}).get("first_name", "?")

                if not text:
                    continue

                # Only respond to messages in the group/chat_id
                chat = str(msg.get("chat", {}).get("id", ""))
                if chat != CHAT_ID:
                    continue

                reply = handle_message(text, from_name)
                if reply:
                    tg_msg(reply)

        except KeyboardInterrupt:
            print("\n👋 Shutting down bot-orquestrador")
            tg_msg("👋 Bot-orquestrador offline (Ctrl+C)")
            break
        except Exception as e:
            print(f"⚠️  Error: {type(e).__name__}: {e}", file=sys.stderr)
            time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()