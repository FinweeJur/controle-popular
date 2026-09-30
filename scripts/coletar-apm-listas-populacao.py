#!/usr/bin/env python3
"""
coletar-apm-listas-populacao.py — as listas nominativas do APM (Fase G/P1 do
PLANO-HISTORIA-CAMADAS-GLOBO-3D.md).

O que é: a coleção "Mapas de População" do Arquivo Público Mineiro — **listas
nominativas** de 1838-1840 (relação de habitantes, fogos, idade, estado civil,
nacionalidade, alfabetização e **emprego/ocupação**). São a fonte primária da
população da província, incluindo a **população escravizada** — é o que a Fase G
procura para caracterizar e localizar.

O QUE ESTE COLETOR FAZ, E O QUE NÃO FAZ:
  - coleta da LISTA (17 páginas, 2 s de pausa) o `cid` e o período;
  - abre o DETALHE de cada item e lê `Título`, `Notação`, `Conteúdo`, `Data`,
    `Local` e `Assunto` — é no detalhe que mora o LUGAR ("Curral del Rei",
    "Matozinhos, Município de Sabará");
  - resolve o município quando o Local traz "Município de X" ou quando o nome
    casa exatamente com um município de MG (dicionário com os nomes de época
    documentados); o resto fica declarado, sem chute.
  - **NÃO** extrai contagem de escravizados: isso exige ler/OCR do documento,
    que é imagem. A ficha diz "lista nominativa", não "N pessoas escravizadas".

Retomável: grava um JSONL de checkpoint; reexecutar continua de onde parou.
`robots.txt` do host: 404 (sem declaração) → UA honesto e pausa de 2 s.

Uso: python scripts/coletar-apm-listas-populacao.py
"""
from __future__ import annotations

import json
import re
import time
import unicodedata
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parents[1]
BASE = "https://www.siaapm.cultura.mg.gov.br"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
PAUSA = 2.0

CHECKPOINT = RAIZ / "scripts" / ".cache" / "apm-listas-populacao.jsonl"
INDICE = RAIZ / "apps" / "web" / "data" / "apm-listas-populacao.json"
CAMADA = RAIZ / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas" / "hist-listas-populacao.geojson"
CENTROIDES = RAIZ / "apps" / "web" / "data" / "municipios-centroides.json"

ITEM = re.compile(r"<a href='([^']*cid=(\d+))'>(.*?)<span class='busca_data'>\(?([^)<]*)\)?</span></a>", re.S)
MUNICIPIO_DE = re.compile(r"Munic[íi]pio de ([^.,]+)", re.I)

# Nome de época -> município do IBGE. Só o que a fonte escreve e a história
# documenta; o resto NÃO casa (fica declarado). Fontes: IBGE (municípios que
# mudaram de nome) e a bibliografia do plano.
ALIASES_MUNICIPIO = {
    "queluz": "Conselheiro Lafaiete",
    "curral del rei": "Belo Horizonte",
    "curral d'el rei": "Belo Horizonte",
    "villa rica": "Ouro Preto",
    "vila rica": "Ouro Preto",
    "são josé del rei": "Tiradentes",
    "são josé": "Tiradentes",
    "arraial do tijuco": "Diamantina",
    "tijuco": "Diamantina",
    "paracatu do príncipe": "Paracatu",
    "vila do príncipe": "Serro",
    "príncipe": "Serro",
    "vila nova de lima": "Lima Duarte",
    "presídio": "Rio Preto",
}


def slug(nome: str, uf: str = "MG") -> str:
    limpo = unicodedata.normalize("NFD", nome).encode("ascii", "ignore").decode().lower()
    return f"{re.sub(r'[^a-z0-9]', '', limpo)}_{uf.lower()}"


def linhas(html: str) -> list[str]:
    sem = re.sub(r"<script.*?</script>", " ", html, flags=re.S | re.I)
    sem = re.sub(r"<style.*?</style>", " ", sem, flags=re.S | re.I)
    sem = re.sub(r"<[^>]+>", "\n", sem)
    sem = re.sub(r"&nbsp;?", " ", sem)
    return [l.strip() for l in sem.split("\n") if len(l.strip()) > 1]


def campo(ls: list[str], rotulo: str) -> str | None:
    """Valor do campo, na tela de detalhe (rótulo em uma linha, valor na
    seguinte). O rótulo aparece sozinho; `--&gt;` fecha o bloco."""
    for i, l in enumerate(ls):
        if l == rotulo and i + 1 < len(ls):
            return ls[i + 1]
    return None


def carregar_checkpoint() -> dict[int, dict]:
    feito: dict[int, dict] = {}
    if CHECKPOINT.exists():
        for linha in CHECKPOINT.read_text(encoding="utf-8").splitlines():
            try:
                r = json.loads(linha)
                feito[r["cid"]] = r
            except json.JSONDecodeError:
                continue
    return feito


def main() -> int:
    s = requests.Session()
    s.headers.update({"User-Agent": UA})
    feito = carregar_checkpoint()
    print(f"checkpoint: {len(feito)} itens já coletados")

    # 1) lista os cids de todas as páginas
    cids: list[tuple[int, str]] = []
    for pagina in range(40):
        r = s.get(f"{BASE}/modules/mapas_populacao/search.php",
                  params={"query": "", "andor": "AND", "ordenar": "30", "asc_desc": "10",
                          "submit": "Executar pesquisa", "action": "results", "start": pagina * 20},
                  timeout=90)
        r.raise_for_status()
        achados = ITEM.findall(r.text)
        if not achados:
            break
        for _, cid, _bruto, periodo in achados:
            cids.append((int(cid), periodo.strip()))
        time.sleep(PAUSA)
    else:
        raise SystemExit("teto de páginas sem provar o fim — recuso seguir")
    print(f"itens na coleção: {len(cids)}")

    # 2) detalhe de cada um (retomável)
    CHECKPOINT.parent.mkdir(parents=True, exist_ok=True)
    novos = 0
    with CHECKPOINT.open("a", encoding="utf-8") as f:
        for cid, periodo in cids:
            if cid in feito:
                continue
            time.sleep(PAUSA)
            try:
                r = s.get(f"{BASE}/modules/mapas_populacao/brtacervo.php", params={"cid": cid}, timeout=60)
                ls = linhas(r.text)
                reg = {
                    "cid": cid,
                    "titulo": campo(ls, "Título"),
                    "notacao": campo(ls, "Notação"),
                    "conteudo": campo(ls, "Conteúdo"),
                    "data": campo(ls, "Data") or periodo,
                    "local": campo(ls, "Local"),
                    "assunto": campo(ls, "Assunto"),
                    "url": f"{BASE}/modules/mapas_populacao/brtacervo.php?cid={cid}",
                }
            except Exception as e:  # rede: registra e segue; reexecutar retoma
                reg = {"cid": cid, "erro": str(e)[:120]}
            f.write(json.dumps(reg, ensure_ascii=False) + "\n")
            f.flush()
            feito[cid] = reg
            novos += 1
            if novos % 25 == 0:
                print(f"  {novos} novos (total {len(feito)})")
    print(f"coletados agora: {novos} | total: {len(feito)}")

    # 3) resolve município e monta índice + camada
    centroides = json.loads(CENTROIDES.read_text(encoding="utf-8"))
    registros, features, sem_local, sem_casar = [], [], 0, []
    for reg in feito.values():
        if reg.get("erro"):
            continue
        local = (reg.get("local") or "").strip().rstrip(".")
        if not local:
            sem_local += 1
            continue
        municipio = None
        m = MUNICIPIO_DE.search(local)
        if m:
            # A fonte AFIRMA o município ("Conquista, Município de Queluz"):
            # passa pelo dicionário de nomes de época (Queluz -> Conselheiro Lafaiete).
            bruto = m.group(1).strip()
            municipio = ALIASES_MUNICIPIO.get(bruto.lower(), bruto)
        else:
            # Freguesia/distrito/termo: tira o rótulo e tenta casar o nome.
            nome = re.sub(
                r"^(par[óo]quia|freguesia|distrito|termo|vila|arraial|capela|aplica[çc][ãa]o|"
                r"julgado|curato)\s+(de|do|da|dos|das)\s+",
                "", local, flags=re.I,
            )
            nome = re.split(r"[,/]", nome)[0].strip()
            candidato = ALIASES_MUNICIPIO.get(nome.lower(), nome)
            municipio = candidato if centroides.get(slug(candidato)) else None
        c = centroides.get(slug(municipio)) if municipio else None
        reg["municipio"] = municipio
        registros.append(reg)
        if c:
            features.append({
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [c[1], c[0]]},
                "properties": {
                    "local": local,
                    "municipio": municipio,
                    "data": reg.get("data"),
                    "conteudo": reg.get("conteudo"),
                    "notacao": reg.get("notacao"),
                    "fonte": "Arquivo Público Mineiro — Coleção Mapas de População (listas nominativas)",
                    "url": reg.get("url"),
                    "natureza": "documento (lista nominativa); ponto no centroide do município — piso",
                },
            })
        else:
            sem_casar.append(local)

    INDICE.write_text(json.dumps({
        "fonte": "Arquivo Público Mineiro (SIAAPM) — Coleção Mapas de População",
        "coletado_em": time.strftime("%Y-%m-%d"),
        "total": len(registros),
        "com_municipio_resolvido": len(features),
        "local_nao_resolvido": len(sem_casar),
        "ressalva": (
            "Listas nominativas (1838-1840): a fonte primária da população, incluindo a "
            "escravizada. O acervo cataloga o DOCUMENTO e o seu Local; NÃO traz a contagem "
            "de pessoas escravizadas (essa exigiria ler/imagem do documento). Local que não "
            "resolve em município fica sem ponto, declarado."
        ),
        "registros": registros,
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    CAMADA.write_text(json.dumps({
        "type": "FeatureCollection",
        "_nota": (
            "Listas nominativas de 1838-1840 (APM) cujo Local resolveu em município de MG. "
            "É a fonte primária da população da província, incluindo a escravizada — mas o "
            "ponto marca o MUNICÍPIO do documento, não o sítio, e o acervo não traz contagem."
        ),
        "features": features,
    }, ensure_ascii=False), encoding="utf-8")

    print(f"índice: {len(registros)} registros | camada: {len(features)} pontos | "
          f"sem Local: {sem_local} | Local não resolvido: {len(sem_casar)}")
    print(f"  {INDICE.name} ({INDICE.stat().st_size/1024:.0f} KB), {CAMADA.name} ({CAMADA.stat().st_size/1024:.0f} KB)")
    if sem_casar:
        print("  exemplos não resolvidos:", sem_casar[:12])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
