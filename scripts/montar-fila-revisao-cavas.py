# -*- coding: utf-8 -*-
"""Monta a FILA DE REVISÃO da calibração de cavas (Fase 4 do plano).

Cruza o checkpoint do coletor (tipo, cena, bbox, processo, nuvem física) com
a triagem do VLM local (qwen3-vl:2b, escore 0-100, legenda) e escreve:

1. fila-revisao.jsonl  — todo item com estado "pendente", ordenado por
   prioridade. É a fila que o revisor humano (dono) consome e promove para
   revisado/descartado/publicável (critério de pronto da Fase 4).
2. fila-revisao.html   — galeria local com miniaturas para a revisão
   humana da amostra de 100 exemplos (critério de pronto da Fase 2:
   "precisão medida + revisão de 100 exemplos"). Cada imagem abre num
   visualizador de ampliação: roda do mouse dá zoom onde o cursor está,
   botões de centro 2× e 1:1, setas ← → trocam de imagem — a cava pode
   ocupar menos de 1/8 do recorte de 512 px (pedido do dono, 30/09).
3. amostra-100.jsonl   — amostra estratificada determinística (semente 42)
   para a revisão do gate: positivos de baixa pontuação (possíveis falsos
   positivos) + negativos de alta pontuação (possíveis cavas perdidas)
   + preenchimento proporcional.

Regras de prioridade (por que assim, não adianta jogar tudo no revisor):
- positivo com escore < 50: o VLM discordou do rótulo — revisar primeiro;
- negativo com escore >= 70: o VLM "viu mineração" onde o rótulo diz
  vegetação/solo — pode ser cava perdida na calibração;
- faixa 50-69: discordância fraca; <50 neg / >=70 pos: reforço de rótulo.

Rodar de novo é barato: sobrescreve os três arquivos e segue o
checkpoint que cresce com a coleta noturna. Sem escrita fora do cache.
"""

from __future__ import annotations

import argparse
import html
import json
import random
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CACHE = RAIZ / "scripts" / ".cache" / "cavas-calibracao"
TRIAGEM_PADRAO = Path.home() / (
    "AppData/Local/Temp/opencode/cavas/triagem/triagem.jsonl"
)
SEMENTE = 42  # amostra estável entre rodadas: mesmo caminho de revisão


def ler_jsonl(caminho: Path) -> list[dict]:
    """Lê JSONL ignorando linhas corrompidas (coleta interrompida no meio)."""
    itens = []
    if not caminho.exists():
        return itens
    for linha in caminho.read_text(encoding="utf-8", errors="replace").splitlines():
        linha = linha.strip()
        if not linha:
            continue
        try:
            itens.append(json.loads(linha))
        except json.JSONDecodeError:
            continue
    return itens


def prioridade(tipo: str, escore: int | None) -> str:
    """Bucket de revisão de um item (ver docstring — a lógica é do plano)."""
    if escore is None:
        return "sem-triagem"
    if tipo == "positivo":
        if escore < 50:
            return "alta"      # rótulo disse cava, VLM discordou
        if escore < 70:
            return "media"
        return "baixa"
    if escore >= 70:
        return "alta"          # rótulo disse não-cava, VLM discordou
    if escore >= 50:
        return "media"
    return "baixa"


def montar(checkpoint: Path, triagem: Path) -> list[dict]:
    """Junta checkpoint × triagem por arquivo e devolve a fila ordenada."""
    tri = {t["arquivo"]: t for t in ler_jsonl(triagem) if t.get("arquivo")}
    fila: list[dict] = []
    for it in ler_jsonl(checkpoint):
        arq = it.get("arquivo", "")
        t = tri.get(arq, {})
        escore = t.get("escore")
        prio = prioridade(it.get("tipo", ""), escore)
        fila.append({
            "arquivo": arq,
            "tipo": it.get("tipo"),
            "prioridade": prio,
            "estado": "pendente",
            "escore": escore,
            "confianca": t.get("confianca"),
            "legenda": t.get("legenda") or "",
            "erro_vlm": t.get("erro"),
            "nuvem_vlm": t.get("nuvem"),
            "nuvem_indice": it.get("nuvem"),
            "processo": it.get("processo"),
            "fase": it.get("fase"),
            "cena": it.get("cena"),
            "data_cena": it.get("data") or t.get("data_cena"),
            "bbox": it.get("bbox"),
        })
    ordem = {"alta": 0, "media": 1, "baixa": 2, "sem-triagem": 3}

    def chave(x: dict) -> tuple:
        """Ordena dentro do bucket: positivo com escore mais BAIXO primeiro
        (discordou do rótulo), negativo com escore mais ALTO primeiro
        (possível cava perdida); sem triagem sempre no fim do bucket."""
        e = x["escore"]
        if e is None:
            sec = 101 if x["tipo"] == "positivo" else 10 ** 6
        elif x["tipo"] == "positivo":
            sec = e
        else:
            sec = -e
        return (ordem[x["prioridade"]], sec, x["arquivo"])

    fila.sort(key=chave)
    return fila


def amostra_100(fila: list[dict], n: int) -> list[dict]:
    """Amostra estratificada para o gate: 40 altas-pos, 40 altas-neg,
    resto por prioridade. Determinística (semente fixa) para a revisão
    ser repetível entre máquinas."""
    rng = random.Random(SEMENTE)
    alta_pos = [x for x in fila if x["prioridade"] == "alta" and x["tipo"] == "positivo"]
    alta_neg = [x for x in fila if x["prioridade"] == "alta" and x["tipo"] == "negativo"]
    resto = [x for x in fila if x["prioridade"] != "alta"]
    escolhidos = alta_pos[: n // 2] + alta_neg[: n // 2]
    falta = n - len(escolhidos)
    if falta > 0:
        rng.shuffle(resto)
        escolhidos += resto[:falta]
    rng.shuffle(escolhidos)
    return escolhidos[:n]


def _cartao(x: dict, num: int | None = None) -> str:
    """Um <figure> com miniatura, legenda do VLM e metadados do recorte."""
    img = f"recortes/{x['tipo']}/{html.escape(x['arquivo'])}"
    esc = x["escore"] if x["escore"] is not None else "-"
    nuvem = x.get("nuvem_indice")
    nuvem_s = f"{nuvem:.0%}" if isinstance(nuvem, (int, float)) else "?"
    num_s = f"<b>#{num}</b> · " if num is not None else ""
    # Eco do prompt: o VLM devolveu a própria instrução no lugar da
    # descrição (1.117 de 3.012 no lote fechado, medido 29/09). Marcado
    # em vermelho para o revisor digitar a legenda dele.
    eco = "uma linha curta em portugu" in x["legenda"][:70]
    eco_s = (
        '<b style="color:#b3261e">⚠ legenda da IA veio errada — '
        "digite a sua embaixo</b><br>"
        if eco
        else ""
    )
    return (
        f'<figure><img class="mini" src="{img}" '
        f'alt="recorte {html.escape(x["arquivo"])}" '
        f'loading="lazy" width="256" height="256" '
        f'title="clique para ampliar">'
        f"<figcaption>{num_s}<b>{x['tipo']}</b> · escore {esc} · "
        f"nuvem {nuvem_s} · <i>clique na imagem p/ ampliar</i><br>"
        f"{eco_s}"
        f"{html.escape(x['legenda'][:220])}<br>"
        f'<small>processo {html.escape(str(x.get("processo") or "—"))} · '
        f'cena {html.escape(str(x.get("cena") or "—"))} · '
        f'{html.escape(str(x.get("data_cena") or "—"))}</small>'
        "</figcaption></figure>"
    )


# Visualizador de ampliação (pedido do dono 30/09/2026: "falta zoom, a cava
# pode ocupar menos de 1/8 da imagem"). Sem biblioteca: JS e CSS embutidos,
# como o resto da página. Regras: roda do mouse amplia onde o cursor está
# (mantém o ponto fixo), arrastar move, 1:1 mostra o pixel nativo, ajustar
# devolve a imagem inteira, ← → trocam de imagem, Esc fecha. Só abre em
# clique — quem está digitando legenda no textarea não abre por acidente.
CSS_LUZ = (
    "#luz{position:fixed;inset:0;background:rgba(0,0,0,.93);display:none;"
    "z-index:50;font-family:system-ui,sans-serif;color:#eee}"
    "#luz.aberta{display:block}"
    "#luz .barra{position:absolute;top:0;left:0;right:0;display:flex;"
    "gap:.5rem;align-items:center;padding:.5rem .7rem;background:#111;"
    "flex-wrap:wrap;font-size:.85rem}"
    "#luz .barra button{font-size:.85rem;padding:.25rem .6rem;"
    "cursor:pointer;border:1px solid #555;background:#222;color:#eee;"
    "border-radius:4px}"
    "#luz .barra button:hover{background:#333}"
    "#luz .palco{position:absolute;inset:38px 0 30px 0;overflow:hidden;"
    "cursor:grab;touch-action:none}"
    "#luz .palco.arrastando{cursor:grabbing}"
    "#luz .palco img{position:absolute;left:50%;top:50%;"
    "transform-origin:0 0;image-rendering:pixelated;"
    "max-width:none;max-height:none;user-select:none;-webkit-user-drag:none}"
    "#luz .dica{position:absolute;left:0;right:0;bottom:0;margin:0;"
    "padding:.35rem .7rem;background:#111;font-size:.75rem;color:#bbb;"
    "text-align:center}"
    ".mini{cursor:zoom-in}"
)

JS_LUZ = r"""
(function(){
  const mini=[...document.querySelectorAll('img.mini')];
  if(!mini.length) return;
  let idx=0, esc=1, tx=0, ty=0, fit=1, nat=512, arr=false, mx=0, my=0;
  const luz=document.createElement('div');
  luz.id='luz';
  luz.innerHTML='<div class=barra>'+
    '<button data-a="menos">−</button><button data-a="mais">+</button>'+
    '<button data-a="centro">centro 2×</button>'+
    '<button data-a="real">1:1</button>'+
    '<button data-a="ajustar">ajustar</button>'+
    '<span class=pos></span>'+
    '<button data-a="anterior">← anterior</button>'+
    '<button data-a="proxima">próxima →</button>'+
    '<span style="flex:1"></span>'+
    '<button data-a="fechar">fechar (Esc)</button></div>'+
    '<div class=palco><img alt="recorte ampliado"></div>'+
    '<p class=dica>roda do mouse = amplia onde o cursor está · '+
    'arrastar = mover · ← → trocam de imagem · Esc fecha</p>';
  document.body.appendChild(luz);
  const img=luz.querySelector('img'), palco=luz.querySelector('.palco'),
        pos=luz.querySelector('.pos'),
        fundo=luz.querySelector('.palco').parentNode;
  function aplicar(){img.style.transform='translate('+tx+'px,'+ty+'px) scale('+esc+')';}
  function ajustar(){
    fit=Math.min(palco.clientWidth,palco.clientHeight)/nat;
    esc=fit; tx=0; ty=0; aplicar();
  }
  function abrir(i){
    idx=(i+mini.length)%mini.length;
    img.src=mini[idx].currentSrc||mini[idx].src;
    nat=mini[idx].naturalWidth||512;
    luz.classList.add('aberta');
    ajustar();
    pos.textContent=(idx+1)+' de '+mini.length;
  }
  function fechar(){luz.classList.remove('aberta');}
  function zoom(fator,cx,cy){
    const novo=Math.max(fit*0.9,Math.min(esc*fator,fit*80));
    tx=cx-(cx-tx)*(novo/esc); ty=cy-(cy-ty)*(novo/esc);
    esc=novo; aplicar();
  }
  function centroCX(){return palco.clientWidth/2;}
  function centroCY(){return palco.clientHeight/2;}
  mini.forEach((m,i)=>m.addEventListener('click',()=>abrir(i)));
  luz.addEventListener('click',e=>{
    const a=e.target.dataset&&e.target.dataset.a;
    if(a==='fechar')fechar();
    else if(a==='mais')zoom(1.6,centroCX(),centroCY());
    else if(a==='menos')zoom(1/1.6,centroCX(),centroCY());
    else if(a==='centro'){esc=fit*2;tx=0;ty=0;aplicar();}
    else if(a==='real'){esc=1;tx=0;ty=0;aplicar();}
    else if(a==='ajustar')ajustar();
    else if(a==='anterior')abrir(idx-1);
    else if(a==='proxima')abrir(idx+1);
    else if(e.target===fundo)fechar();
  });
  palco.addEventListener('wheel',e=>{
    e.preventDefault();
    const r=palco.getBoundingClientRect();
    zoom(e.deltaY<0?1.35:1/1.35,
        e.clientX-r.left-r.width/2, e.clientY-r.top-r.height/2);
  },{passive:false});
  palco.addEventListener('mousedown',e=>{arr=true;mx=e.clientX;my=e.clientY;
    palco.classList.add('arrastando');e.preventDefault();});
  window.addEventListener('mousemove',e=>{
    if(!arr)return; tx+=e.clientX-mx; ty+=e.clientY-my;
    mx=e.clientX; my=e.clientY; aplicar();});
  window.addEventListener('mouseup',()=>{arr=false;
    palco.classList.remove('arrastando');});
  document.addEventListener('keydown',e=>{
    if(!luz.classList.contains('aberta'))return;
    if(e.key==='Escape')fechar();
    else if(e.key==='ArrowLeft')abrir(idx-1);
    else if(e.key==='ArrowRight')abrir(idx+1);
    else if(e.key==='+'||e.key==='=')zoom(1.6,centroCX(),centroCY());
    else if(e.key==='-')zoom(1/1.6,centroCX(),centroCY());
  });
})();
"""


def escrever_html(fila: list[dict], destino: Path) -> None:
    """Galeria estática para a revisão humana abrir no navegador — sem
    biblioteca (só o visualizador de ampliação embutido). Caminhos
    relativos: o HTML fica no mesmo cache das imagens."""
    cores = {"alta": "#b3261e", "media": "#8a5a00", "baixa": "#1b5e20",
             "sem-triagem": "#444"}
    blocos = []
    for prio in ("alta", "media", "baixa", "sem-triagem"):
        itens = [x for x in fila if x["prioridade"] == prio]
        if not itens:
            continue
        cartoes = [_cartao(x) for x in itens]
        blocos.append(
            f'<section><h2 style="color:{cores[prio]}">prioridade {prio} '
            f'({len(itens)})</h2><div class="grade">{"".join(cartoes)}</div></section>'
        )
    doc = (
        "<!doctype html><html lang=pt-BR><head><meta charset=utf-8>"
        "<title>Fila de revisão — cavas de calibração</title><style>"
        "body{font-family:system-ui,sans-serif;margin:1.5rem;background:#fafafa}"
        ".grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));"
        "gap:1rem}figure{margin:0;background:#fff;border:1px solid #ddd;"
        "border-radius:8px;padding:.5rem}img{width:100%;height:auto;"
        "image-rendering:pixelated;border-radius:4px}"
        "figcaption{font-size:.8rem;line-height:1.35;margin-top:.4rem}"
        "h1{font-size:1.3rem}h2{font-size:1.05rem}"
        + CSS_LUZ + "</style></head><body>"
        f"<h1>Fila de revisão — {len(fila)} recortes da calibração MG</h1>"
        "<p>Ordem: prioridade alta primeiro. Estado inicial: pendente. "
        "Leia a legenda da IA e olhe a imagem — a IA nunca publica sozinha. "
        "Clique numa imagem para ampliar.</p>"
        + "".join(blocos)
        + f"<script>{JS_LUZ}</script></body></html>"
    )
    destino.write_text(doc, encoding="utf-8")


def escrever_html_amostra(amostra: list[dict], destino: Path) -> None:
    """Folha de revisão dos 100 exemplos do gate (Fase 2 do plano).

    Cada cartão numerado tem um seletor de estado (pendente/revisado/
    descartado/publicável) que o navegador guarda em localStorage — o
    revisor pode fechar e voltar — e um botão que exporta o estado em
    JSON para devolver ao fluxo. Imagem e legenda são o essencial; a
    ampliação (zoom com a roda do mouse, ← →, Esc) vem do mesmo
    visualizador da galeria, sem biblioteca."""
    cartoes = []
    for i, x in enumerate(amostra, start=1):
        seletor = (
            f'<div class="estado"><label for="e{i}">estado:</label> '
            f'<select id="e{i}" data-id="{html.escape(x["arquivo"])}">'
            "<option>pendente</option><option>revisado</option>"
            "<option>descartado</option><option>publicável</option>"
            "</select></div>"
        )
        # Campo aberto para o revisor digitar a legenda dele (pedido do
        # dono 29/09); o valor vai no mesmo JSON exportado, por recorte.
        correcao = (
            f'<div class="correcao"><label for="t{i}">'
            f"<b>sua legenda</b> (você digita):</label>"
            f'<textarea id="t{i}" rows="2" data-id="{html.escape(x["arquivo"])}"'
            ' placeholder="descreva o que se vê na foto"></textarea></div>'
        )
        # O seletor e o campo entram DENTRO do <figure>: como eram irmãos
        # do card na grade, viravam célula solta e apareciam ao lado da
        # figura sem par (formato esquisito, medido pelo dono 29/09).
        cartoes.append(
            _cartao(x, num=i).replace(
                "</figure>", seletor + correcao + "</figure>"
            )
        )
    js = (
        "const K='amostra100-estados';"
        "let est=JSON.parse(localStorage.getItem(K)||'{}');"
        # migracao: formato antigo guardava so a string do estado
        "for(const k in est){if(typeof est[k]==='string')"
        "est[k]={estado:est[k],legenda:''};}"
        "const sels=[...document.querySelectorAll('select[data-id]')];"
        "const its=[...document.querySelectorAll('textarea[data-id]')];"
        "function salvar(){localStorage.setItem(K,JSON.stringify(est));conta();}"
        "function conta(){const n=sels.filter(s=>"
        "est[s.dataset.id].estado!=='pendente').length;"
        "document.getElementById('conta').textContent=n+' de '+sels.length;}"
        "sels.forEach(s=>{const id=s.dataset.id;"
        "est[id]=est[id]||{estado:'pendente',legenda:''};"
        "s.value=est[id].estado;"
        "s.addEventListener('change',()=>{est[id].estado=s.value;salvar();});});"
        "its.forEach(t=>{const id=t.dataset.id;"
        "t.value=est[id]?est[id].legenda:'';"
        "t.addEventListener('input',()=>{est[id].legenda=t.value;salvar();});});"
        "document.getElementById('exportar').addEventListener('click',()=>{"
        "const b=new Blob([JSON.stringify(est,null,1)],{type:'application/json'});"
        "const a=document.createElement('a');a.href=URL.createObjectURL(b);"
        "a.download='amostra-100-estados.json';a.click();});"
        "conta();"
    )
    doc = (
        "<!doctype html><html lang=pt-BR><head><meta charset=utf-8>"
        "<title>Amostra de 100 — gate das cavas</title><style>"
        "body{font-family:system-ui,sans-serif;margin:1.5rem;background:#fafafa}"
        ".grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));"
        "gap:1rem}figure{margin:0;background:#fff;border:1px solid #ddd;"
        "border-radius:8px;padding:.5rem}img{width:100%;height:auto;"
        "image-rendering:pixelated;border-radius:4px}"
        "figcaption{font-size:.8rem;line-height:1.35;margin-top:.4rem}"
        ".estado{margin-top:.45rem;padding-top:.4rem;"
        "border-top:1px dashed #ccc;font-size:.85rem}"
        ".estado label{font-weight:600}"
        "select{font-size:.9rem;margin-left:.25rem}"
        ".correcao{margin-top:.4rem;font-size:.8rem}"
        ".correcao textarea{width:100%;box-sizing:border-box;"
        "font-family:inherit;font-size:.85rem;padding:.3rem;"
        "border:1px solid #bbb;border-radius:4px;resize:vertical}"
        "h1{font-size:1.3rem}"
        + CSS_LUZ + "</style></head><body>"
        f"<h1>Amostra de {len(amostra)} — revisão humana do gate</h1>"
        "<p>O gate do plano exige precisão medida <b>e</b> revisão de 100 "
        "exemplos. Marque o estado de cada recorte; o navegador guarda na "
        "máquina. <span id=conta></span> revisados. "
        "<button id=exportar>Exportar estados (JSON)</button></p>"
        f'<div class="grade">{"".join(cartoes)}</div>'
        f"<script>{JS_LUZ}</script>"
        f"<script>{js}</script></body></html>"
    )
    destino.write_text(doc, encoding="utf-8")


def principal() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--checkpoint", type=Path, default=CACHE / "checkpoint.jsonl")
    ap.add_argument("--triagem", type=Path, default=TRIAGEM_PADRAO)
    ap.add_argument("--saida", type=Path, default=CACHE)
    ap.add_argument("--amostra", type=int, default=100)
    args = ap.parse_args()
    args.saida.mkdir(parents=True, exist_ok=True)

    fila = montar(args.checkpoint, args.triagem)
    if not fila:
        print("fila vazia: checkpoint ou triagem sem dados")
        return 1

    fila_jsonl = args.saida / "fila-revisao.jsonl"
    fila_jsonl.write_text(
        "".join(json.dumps(x, ensure_ascii=False) + "\n" for x in fila),
        encoding="utf-8",
    )
    amostra = amostra_100(fila, args.amostra)
    (args.saida / "amostra-100.jsonl").write_text(
        "".join(json.dumps(x, ensure_ascii=False) + "\n" for x in amostra),
        encoding="utf-8",
    )
    escrever_html_amostra(amostra, args.saida / "amostra-100.html")
    escrever_html(fila, args.saida / "fila-revisao.html")

    cont = Counter((x["prioridade"], x["tipo"]) for x in fila)
    sem_tri = sum(1 for x in fila if x["prioridade"] == "sem-triagem")
    erro = sum(1 for x in fila if x.get("erro_vlm"))
    print(f"fila: {len(fila)} itens")
    for prio in ("alta", "media", "baixa", "sem-triagem"):
        p = cont.get((prio, "positivo"), 0)
        n = cont.get((prio, "negativo"), 0)
        print(f"  {prio:12s} pos {p:5d} | neg {n:5d}")
    print(f"  sem triagem {sem_tri} | erros do VLM {erro}")
    print(f"amostra do gate: {len(amostra)} itens")
    print(f"saidas em: {args.saida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
