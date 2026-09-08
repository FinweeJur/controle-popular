#!/usr/bin/env python3
import json, os, urllib.request

RAIZ = r"C:\DevCoder\Controle-Popular"
ENV_PATH = os.path.join(RAIZ, "scripts", ".env")
TEXTO_PATH = os.path.join(RAIZ, "scripts", ".ultimo_report.txt")

env = {}
with open(ENV_PATH, encoding="utf-8") as f:
    for linha in f:
        m = __import__("re").match(r"\s*([\w_]+)\s*=\s*(.*)\s*$", linha)
        if m and m.group(1) not in os.environ:
            os.environ[m.group(1)] = m.group(2).strip().strip('"').strip("'")

TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
CHAT = os.environ.get("TELEGRAM_CHAT_ID", "")
with open(TEXTO_PATH, encoding="utf-8") as f:
    TEXTO = f.read().strip()

if not TOKEN or not CHAT or not TEXTO:
    print("ERRO: dados ausentes")
    exit(2)

body = json.dumps({
    "chat_id": CHAT,
    "text": TEXTO,
    "parse_mode": "HTML",
    "disable_web_page_preview": True,
}).encode()

req = urllib.request.Request(
    f"https://api.telegram.org/bot{TOKEN}/sendMessage",
    data=body,
    headers={"content-type": "application/json"},
)
with urllib.request.urlopen(req, timeout=20) as r:
    print(r.read().decode()[:300])
