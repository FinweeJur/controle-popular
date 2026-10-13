#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Painel da Oficina de Cavas — FastAPI em localhost + bandeja pystray.

O que é: um servidor web pequeno (127.0.0.1:8787, SEM expor na rede) que
mostra o estado dos estágios, o tail do log JSONL (inclusive erros) e
permite disparar cada estágio com um botão. Junto roda um ícone de bandeja
(pystray) com "Abrir painel" e "Rodar agora".

Por que localhost e sem token no repo: o painel é ferramenta do dono neste
PC. Bind em 127.0.0.1 garante que ninguém de fora acesse; nenhum segredo é
lido ou impresso (regra de privacidade do repo).

O painel DISPARA estágios em subprocesso com a trava de instância — se já
houver uma oficina rodando, o disparo é recusado com mensagem clara, nunca
derruba a coleta em andamento.

Uso:
    python scripts/oficina/painel.py            # servidor + bandeja
    python scripts/oficina/painel.py --so-web   # só o servidor (sem bandeja)
"""
from __future__ import annotations

import argparse
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path

_OFICINA_DIR = Path(__file__).resolve().parent
_RAIZ = _OFICINA_DIR.parents[1]
sys.path.insert(0, str(_OFICINA_DIR))

from estado import resumo_estado  # noqa: E402
from logger import ler_ultimos  # noqa: E402

_CACHE = _RAIZ / "scripts" / ".cache" / "cavas-calibracao"
_LOG = _CACHE / "oficina.jsonl"
_OFICINA_PY = _OFICINA_DIR / "oficina.py"
_PORTA = 8787

# Thread que roda um estágio — evita travar o servidor durante coleta longa.
_proceso_andamento: dict = {}


def _rodar_estagio_em_thread(estagio: str, extra: list[str]) -> None:
    """Dispara `oficina.py rodar --estagio X` em subprocesso, fora do request."""
    cmd = [sys.executable, str(_OFICINA_PY), "rodar",
           "--estagio", estagio] + extra
    proc = subprocess.Popen(cmd, cwd=str(_RAIZ),
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            text=True)
    _proceso_andamento["pid"] = proc.pid
    _proceso_andamento["estagio"] = estagio
    try:
        saida, _ = proc.communicate()
        _proceso_andamento["saida"] = (saida or "")[-2000:]
        _proceso_andamento["rc"] = proc.returncode
    finally:
        _proceso_andamento.pop("pid", None)


def montar_app():
    """Cria e devolve a aplicação FastAPI do painel."""
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse, JSONResponse

    app = FastAPI(title="Oficina de Cavas")

    @app.get("/", response_class=HTMLResponse)
    def index():
        return _HTML

    @app.get("/api/estado")
    def api_estado():
        return JSONResponse(resumo_estado())

    @app.get("/api/log")
    def api_log(n: int = 60):
        return JSONResponse({"linhas": ler_ultimos(_LOG, n)})

    @app.post("/api/rodar/{estagio}")
    def api_rodar(estagio: str):
        if estagio not in ("coletar", "analisar", "separar"):
            return JSONResponse({"ok": False, "erro": "estagio invalido"},
                                status_code=400)
        if "pid" in _proceso_andamento:
            return JSONResponse(
                {"ok": False,
                 "erro": f"estagio {_proceso_andamento.get('estagio')} "
                         f"ja rodando (pid {_proceso_andamento['pid']})"},
                status_code=409)
        extra: list[str] = []
        if estagio == "coletar":
            extra = ["--tipo", "negativo", "--limite", "10"]
        t = threading.Thread(target=_rodar_estagio_em_thread,
                             args=(estagio, extra), daemon=True)
        t.start()
        return JSONResponse({"ok": True, "estagio": estagio})

    return app


_HTML = """<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Oficina de Cavas</title>
<style>
 body{font-family:system-ui,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}
 .wrap{max-width:900px;margin:0 auto;padding:16px}
 h1{font-size:20px} h2{font-size:16px;margin-top:24px}
 .cards{display:flex;gap:8px;flex-wrap:wrap}
 .card{background:#1e293b;border-radius:8px;padding:10px 14px;flex:1;min-width:140px}
 .card .k{font-size:12px;color:#94a3b8}.card .v{font-size:18px;font-weight:600}
 button{background:#2563eb;color:#fff;border:0;border-radius:6px;padding:8px 14px;cursor:pointer;font-size:14px;margin:4px 4px 4px 0}
 button:disabled{background:#475569;cursor:not-allowed}
 table{width:100%;border-collapse:collapse;font-size:13px}
 td,th{border-bottom:1px solid #334155;padding:4px 6px;text-align:left;vertical-align:top}
 .err{color:#f87171}.ok{color:#4ade80}.warn{color:#fbbf24}
 .badge{padding:1px 6px;border-radius:4px;font-size:11px}
 .run{background:#2563eb}.pend{background:#475569}.okb{background:#16a34a}.errb{background:#dc2626}
 code{background:#1e293b;padding:1px 4px;border-radius:3px}
</style></head><body><div class="wrap">
<h1>Oficina de Cavas</h1>
<div class="cards" id="cards"></div>
<h2>Estágios</h2>
<div id="botoes"></div>
<h2>Log (últimas linhas)</h2>
<table id="log"><thead><tr><th>ts</th><th>estágio</th><th>evento</th><th>detalhe</th></tr></thead><tbody></tbody></table>
</div>
<script>
const ESTAGIOS=[["coletar","Coletar"],["analisar","Analisar recortes"],["separar","Separar resultados"]];
async function refresh(){
  const e=await (await fetch('/api/estado')).json();
  const cards=document.getElementById('cards');
  const est=e.estagios||{};
  let h='<div class="card"><div class="k">Trava</div><div class="v '+(e.trava_ativa?'warn':'ok')+'">'+(e.trava_ativa?('ativa pid '+e.pid_trava):'livre')+'</div></div>';
  for(const [k,label] of ESTAGIOS){const s=est[k]||{};const st=s.status||'pendente';
    const cls=st==='ok'?'okb':st==='erro'?'errb':st==='rodando'?'run':'pend';
    h+='<div class="card"><div class="k">'+label+'</div><div class="v"><span class="badge '+cls+'">'+st+'</span></div></div>';}
  cards.innerHTML=h;
  const bt=document.getElementById('botoes');let b='';
  for(const [k,label] of ESTAGIOS){const rodando=e.trava_ativa;
    b+='<button '+(rodando?'disabled':'')+' onclick="rodar(\\''+k+'\\')">'+label+'</button>';}
  bt.innerHTML=b;
  const log=await (await fetch('/api/log?n=60')).json();
  const tb=document.querySelector('#log tbody');tb.innerHTML='';
  for(const l of log.linhas.reverse()){
    const cls=l.erro?'err':'';
    const det=l.mensagem||l.detalhe||l.novos||l.feitos||'';
    tb.innerHTML+='<tr class="'+cls+'"><td>'+(l.ts||'').slice(11,19)+'</td><td>'+(l.estagio||'')+'</td><td>'+(l.evento||'')+'</td><td>'+det+'</td></tr>';
  }
}
async function rodar(est){
  const r=await fetch('/api/rodar/'+est,{method:'POST'});
  const j=await r.json();
  if(!j.ok) alert(j.erro||'falhou');
  setTimeout(refresh,500);
}
refresh();setInterval(refresh,3000);
</script></body></html>"""


def _bandeja(app_url: str) -> None:
    """Ícone de bandeja com 'Abrir painel'. Só roda se pystray+Pillow."""
    try:
        import pystray
        from PIL import Image, ImageDraw
    except Exception as e:
        print(f"bandeja indisponível ({e}) — painel segue no navegador.",
              flush=True)
        return
    # Ícone minimalista: quadrado azul com "C".
    img = Image.new("RGB", (64, 64), "#2563eb")
    d = ImageDraw.Draw(img)
    d.text((22, 18), "C", fill="#fff")
    menu = pystray.Menu(
        pystray.MenuItem("Abrir painel",
                         lambda: webbrowser.open(app_url), default=True),
        pystray.MenuItem("Rodar análise",
                         lambda: _rodar_estagio_em_thread("analisar", [])),
        pystray.MenuItem(pystray.MenuItem.SEPARATOR, None),
        pystray.MenuItem("Sair", lambda icon, item: (
            icon.stop(), sys.exit(0))),
    )
    icon = pystray.Icon("oficina-cavas", img, "Oficina de Cavas", menu)
    threading.Thread(target=icon.run, daemon=True).start()
    return icon


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--porta", type=int, default=_PORTA)
    ap.add_argument("--so-web", action="store_true",
                    help="só o servidor, sem bandeja (para teste)")
    ap.add_argument("--sem-browser", action="store_true",
                    help="não abre o navegador automaticamente")
    args = ap.parse_args(argv)

    import uvicorn
    app = montar_app()
    url = f"http://127.0.0.1:{args.porta}/"
    if not args.sem_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    if not args.so_web:
        _bandeja(url)
    print(f"Painel da Oficina de Cavas em {url}", flush=True)
    # uvicorn bloqueia aqui. Só localhost (host=127.0.0.1) — nunca 0.0.0.0.
    uvicorn.run(app, host="127.0.0.1", port=args.porta, log_level="warning")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
