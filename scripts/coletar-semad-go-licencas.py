"""coletar-semad-go-licencas.py — licenciamento da SEMAD-GO (Sistema Ipê / SIGA).

Coleta os datasets "Licenças Ambientais Estaduais Emitidas – SGA" publicados
no catálogo aberto do SIGA (GeoNode do SEMAD-GO) e grava JSON compacto em
apps/web/data/semad-go-licencas.json.

Sistema Ipê / Portal Ambiental em https://meioambiente.go.gov.br — o SIGA é o
sistema de gestão ambiental e o catálogo do GeoNode publica as camadas.

Rodar:
    python scripts/coletar-semad-go-licencas.py --dry-run     # só contagens
    python scripts/coletar-semad-go-licencas.py               # até --limit
    python scripts/coletar-semad-go-licencas.py --limit 0     # tudo
    python scripts/coletar-semad-go-licencas.py --scan-cpf    # varredor no fim

## Fontes e sondagem (2026-09-17, ~12 requisições de descoberta)

- Catálogo aberto do SIGA: https://siga.meioambiente.go.gov.br/catalogue
  (GeoNode). START FROM HERE — recursos abertos, downloads públicos.
  Datasets de licenciamento encontrados varrendo /api/v2/resources (total do
  catálogo: 248 recursos; título "Licenças Ambientais Estaduais Emitidas – SGA"
  em 3 camadas por geometria):
      pk 106  geonode:vw_sga_ponto_publico     (pontos, 2.627 feições)
      pk 105  geonode:vw_sga_linha_publico     (linhas,   131 feições)
      pk 104  geonode:vw_sga_poligono_publico  (polígonos, 987 feições)
  Soma medida em 17/09/2026: 3.745 feições.
- Caminhado por WFS 2.0.0 GetFeature JSON em https://siga.meioambiente.go.gov.br/geoserver/ows
  (DescribeFeatureType verificado: codigosolicitacao, nome_tipo, nome_atividade,
  numero_processo_sga, dt_abertura_processo, licenciado, excluido, numero_licenca,
  dt_validade_inicio/fim, municipioibge, dt_registro).
- ⚠️ robots.txt de siga.meioambiente.go.gov.br (verificado ao vivo) proíbe
  apenas /cgi-bin/, /api/, /static/ e /uploaded/. O Geoserver em /geoserver/ows
  NÃO está nas regras — caminho seguido aqui é permitido. Os endpoints
  /api/v2 usados durante a DESCOBERTA ficam só no cabeçalho deste script; o
  coletor não os usais.
- ⚠️ WAF: GetCapabilities responde HTTP 403 (portal já chegou a 429 para robôs,
  "Acesso Negado"); DescribeFeatureType e GetFeature respondem 200 com a mesma
  UA honesta. Regra adotada: se qualquer GET bater 403/429, espera 30 s e re-tenta
  1×; falhando de novo, DESISTE com mensagem clara — nada é compilado nem
  inventado. GetCapabilities não é precisa por este coletor.
- Recurso alternativo com os mesmos dados: dataset 1404 ("PERS — Panorama das
  Licenças de Funcionamento da SEMAD") no mesmo catálogo — tema de resíduos,
  NÃO usado aqui.
- não encontra "empresa" nem "cnpj" na camada pública — nome do empreendedor e
  documento não acompanham a feição no WFS público. Ficam null; consulta por
  código (codigosolicitacao) é o caminho no Portal Ipê.
- Filtrado: `excluido=false` (feições marcadas excluídas ficam fora).

## PRIVACIDADE (padrão SEMA-MT/SEMA-MA/IGAM)

- Todo campo de texto é varrido por runs de 11 dígitos (CPF): apagado na hora
  ("[CPF redigido]").
- CNPJ completo (14 dígitos) é preservado; mascarado/incompleto → null +
  doc_redigido=1 no registro.
- `--scan-cpf` roda o varredor oficial (scripts/checar-dado-pessoal-em-dado.py)
  sobre o arquivo final; achado = código 2 e NÃO sobrescreve.

## RESSALVA EDITORIAL

Camada mostra EXCLUSIVAMENTE licenças AMBIENTAIS e de FUNCIONAMENTO emitidas
pela SEMAD no SGA (fonte: texto do próprio recurso no catálogo). Geometria
ponto/linha/polígono descreve a localização do empreendimento. Registro na
camada NÃO significa conformidade atual — validade tem data de fim (campo
num controle próprio) e a camada é o retrato da SEMAD.
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "https://siga.meioambiente.go.gov.br"
OWS = HOST + "/geoserver/ows"
CATALOGO = HOST + "/catalogue"
UA = "ControlePopular/1.0 (+controlepopular.com.br; dado publico governamental)"
PAUSA = 2  # s entre requisições
UF = "GO"
LIMITE_PADRAO = 5000
PAGE = 1000  # feições por bloco WFS
SAIDA = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "semad-go-licencas.json"
CACHE = Path(__file__).resolve().parent / ".cache" / "semad-go"
MUN_GO = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "municipios-go.json"

# camadas WFS (geometria) — pk do recurso no catálogo para link de fonte
CAMADAS = [
    ("geonode:vw_sga_ponto_publico", 106, "ponto"),
    ("geonode:vw_sga_linha_publico", 105, "linha"),
    ("geonode:vw_sga_poligono_publico", 104, "poligono"),
]

FONTES = {
    "catalogo_siga": CATALOGO,
    "recurso_ponto": f"{CATALOGO}/#/resource/106",
    "recurso_linha": f"{CATALOGO}/#/resource/105",
    "recurso_poligono": f"{CATALOGO}/#/resource/104",
    "wfs": OWS,
    "robots_status": "siga.meioambiente.go.gov.br: /cgi-bin/, /api/, /static/, "
                     "/uploaded/ Disallow; /geoserver/ows NÃO está nas regras "
                     "(caminho usado aqui). GetCapabilities responde 403 (WAF); "
                     "GetFeature/DescribeFeatureType respondem 200.",
}

RESSALVA = ("Licenças ambientais e de funcionamento EMITIDAS pela SEMAD-GO, no "
            "âmbito do SGA (Sistema de Gestão Ambiental), conforme catálogo "
            "aberto do SIGA. Registro na camada não significa conformidade "
            "atual: validade tem data de fim (dt_validade_fim) e a base é "
            "retrato das emissões. Consulta por código: "
            "https://siga.meioambiente.go.gov.br/catalogue")


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------

try:
    import truststore
    _CTX = truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
except Exception:
    _CTX = ssl.create_default_context()


def _get(url: str, timeout: int = 120) -> bytes:
    """GET com UA honesto. 403/429: espera 30s, tenta 1× mais; falha de novo = sair claro."""
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    tent = 0
    while True:
        try:
            with urllib.request.urlopen(req, timeout=timeout, context=_CTX) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                tent += 1
                print(f"  [!] {e.code} em {url.split('?')[0]} — esperando 30s...")
                time.sleep(30)
                if tent >= 2:
                    print(f"\n[cancelado] {e.code} de novo após 1 retry + 30s. "
                          f"WAF bloqueou a coleta — NADA foi compilado nem inventado.")
                    sys.exit(2)
            else:
                raise


# ---------------------------------------------------------------------------
# sanitização (padrão IGAM/IBAMA/SEMA-MT/SEMA-MA)
# ---------------------------------------------------------------------------

RE_11D = re.compile(r"\d[\d .\-/]{7,24}\d")


def _cpf_valido(dig: str) -> bool:
    if not dig.isdigit() or len(dig) != 11 or len(set(dig)) == 1:
        return False
    for n in (9, 10):
        s = sum(int(x) * w for x, w in zip(dig[:n], range(n, 0, -1)))
        if (s * 10) % 11 % 10 != int(dig[n]):
            return False
    return True


def _apagar_cpf_em_texto(texto: str) -> str:
    def _apagar(m):
        s = m.group(0)
        dig = re.sub(r"\D", "", s)
        if len(dig) == 14:
            return s
        if len(dig) == 11:
            return "[CPF redigido]"
        if len(dig) in (12, 13) and any(_cpf_valido(dig[i:i + 11]) for i in range(len(dig) - 10)):
            return "[CPF redigido]"
        return s
    return RE_11D.sub(_apagar, texto)


def _limpar(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s and s.lower() not in ("nan", "none") else None


# ---------------------------------------------------------------------------
# mapeamento código IBGE -> nome (apps/web/data/municipios-go.json)
# ---------------------------------------------------------------------------

def _mapa_municipios() -> "dict[str, str]":
    try:
        return {str(m["id"]): m["nome"] for m in json.loads(MUN_GO.read_text(encoding="utf-8"))}
    except Exception as e:
        print(f"  [!] municipios-go.json indisponível ({e}); município fica como código IBGE")
        return {}


def _situacao(p) -> str:
    if p.get("excluido"):
        return "Feição excluída na base SEMAD"
    if p.get("licenciado"):
        return "Licença emitida (SEMAD)"
    return "Licenciamento cadastrado, sem licença na camada"


def _feicao_para_registro(p: dict, geom: str, pk: int, mun: "dict[str, str]") -> "dict | None":
    proc = _limpar(p.get("numero_processo_sga"))
    lic = _limpar(p.get("numero_licenca"))
    cod = _limpar(p.get("codigosolicitacao"))
    mun_codigo = _limpar(p.get("municipioibge"))
    municipio = mun.get(mun_codigo or "", None)
    data = (_limpar(p.get("dt_abertura_processo")) or "").split(" ")[0] or None
    reg = {
        "processo": proc,
        "tipo": _limpar(p.get("nome_tipo")),
        "empresa": None,   # não vem na camada pública do WFS
        "cnpj": None,      # não vem na camada pública do WFS
        "municipio": municipio if municipio else mun_codigo,
        "uf": UF,
        "data": data,
        "situacao": _situacao(p),
        "atividade": _limpar(p.get("nome_atividade")),
        "no_licenca": lic,
        "validade_inicio": (_limpar(p.get("dt_validade_inicio")) or "")[:10] or None,
        "validade_fim": (_limpar(p.get("dt_validade_fim")) or "")[:10] or None,
        "fonte_url": f"{CATALOGO}/#/resource/{pk}",
    }
    valido = reg["processo"] or reg["no_licenca"] or cod
    if not valido:
        return None
    for k, v in list(reg.items()):   # dado ingerido: varre TODO campo de texto (AGENTS)
        if isinstance(v, str):
            reg[k] = _apagar_cpf_em_texto(v)
    return reg


def _checkpoint() -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    arq = CACHE / "checkpoint.json"
    if arq.exists():
        try:
            return json.loads(arq.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {"chunks": [], "concluido": False}


def _salvar_checkpoint(ckpt: dict) -> None:
    arq = CACHE / "checkpoint.json"
    ckpt["ata"] = datetime.now(timezone.utc).isoformat()
    tmp = arq.with_suffix(".parcial")
    tmp.write_text(json.dumps(ckpt, ensure_ascii=False), encoding="utf-8")
    tmp.replace(arq)


def _wdx(nome: str) -> str:
    return re.sub(r"[^A-Za-z0-9]", "_", nome) or "arquivo"


def _carregar_camada(layer: str, pk: int, geom: str, ckpt: dict,
                     mun: "dict[str, str]", limite_restante: int) -> "list[dict]":
    """Baixa a camada inteira em blocos; limite_restante < 0 = sem limite."""
    regs: "list[dict]" = []
    inicio = 0
    chunk = 1
    while True:
        chave = f"{layer}#{chunk:04d}"
        arq = CACHE / f"{_wdx(chave)}.json"
        if chave in ckpt["chunks"] and arq.exists():
            try:
                bloco = json.loads(arq.read_text(encoding="utf-8"))
                regs.extend(bloco)
                if limite_restante >= 0:
                    limite_restante -= len(bloco)
                    if limite_restante <= 0:
                        break
                inicio += PAGE
                chunk += 1
                continue
            except Exception:
                ckpt["chunks"].discard(chave)
        count = min(PAGE, limite_restante) if limite_restante >= 0 else PAGE
        q = dict(service="WFS", version="2.0.0", request="GetFeature",
                 typeNames=layer, outputFormat="application/json",
                 count=count, startIndex=inicio)
        if "_ponto_" in layer:  # só a camada ponto tem campo `id` (linha/polígono 400 no sortBy)
            q["sortBy"] = "id"
        bruto = _get(OWS + "?" + urllib.parse.urlencode(q))
        if bruto.lstrip().startswith(b"<"):
            print("  [cancelado] WFS respondeu XML (esperado JSON) na camada "
                  f"{layer} bloco {chunk} — WAF negou? Nada inventado.")
            sys.exit(2)
        d = json.loads(bruto)
        feats = d.get("features") or []
        nr = [_feicao_para_registro(f.get("properties") or {}, geom, pk, mun)
              for f in feats]
        nr = [r for r in nr if r]
        arq.parent.mkdir(parents=True, exist_ok=True)
        arq.write_text(json.dumps(nr, ensure_ascii=False), encoding="utf-8")
        ckpt["chunks"].append(chave)
        regs.extend(nr)
        if limite_restante >= 0:
            limite_restante -= len(nr)
        _salvar_checkpoint(ckpt)
        print(f"    {layer}: bloco {chunk} (+{len(nr):,}, acumulado {len(regs):,})", flush=True)
        if limite_restante <= 0:
            break
        if len(feats) < PAGE:  # fim da camada
            break
        inicio += PAGE
        chunk += 1
        time.sleep(PAUSA)
    return regs


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Coleta SEMAD-GO licenciamento (WFS do catálogo SIGA/Ipê)")
    parser.add_argument("--dry-run", action="store_true", help="só conta (1 GET/camada)")
    parser.add_argument("--limit", type=int, default=LIMITE_PADRAO, help="trunca registros (0 = tudo)")
    parser.add_argument("--scan-cpf", action="store_true", help="roda o varredor de CPF ao final")
    args = parser.parse_args()

    mun = _mapa_municipios()

    print("=== SEMAD-GO licenciamento (SIGA / Sistema Ipê, catálogo GeoNode) ===\n")
    print(f"  fonte  : {OWS} (WFS — camadas vw_sga_*_publico)")
    print(f"  limite : {'sem limite' if args.limit == 0 else args.limit}")
    print(f"  robots : geoserver/ows fora das regras Disallow do host — "
          f"pausa {PAUSA}s, UA honesto")
    print(f"  saida  : {SAIDA}")

    contagens = {}
    try:
        for layer, pk, geom in CAMADAS:
            url = (OWS + "?" + urllib.parse.urlencode(
                dict(service="WFS", version="2.0.0", request="GetFeature",
                     typeNames=layer, outputFormat="application/json",
                     resultType="hits")))
            bruto = _get(url).decode("utf-8", "replace")
            m = re.search(r'numberMatched="(\d+)"', bruto)
            if not m:
                raise RuntimeError(f"WFS não devolveu numberMatched para {layer}: {bruto[:200]}")
            contagens[layer] = int(m.group(1))
            print(f"  sonde  : {layer} -> {contagens[layer]:>6,} feições", flush=True)
            time.sleep(PAUSA)
    except Exception as e:
        print(f"\n[cancelado] contagem falhou: {e}")
        print("  Nada coletado ou inventado. Verificar serviço e re-rodar.")
        sys.exit(2)
    total_fonte = sum(contagens.values())
    print(f"  total de feições na fonte: {total_fonte:,}")

    if args.dry_run:
        print("  (dry-run: nada além destas contagens foi baixado)")
        return

    time.sleep(PAUSA)
    ckpt = _checkpoint()
    todos: "list[dict]" = []
    for layer, pk, geom in CAMADAS:
        resto = -1 if args.limit == 0 else max(0, args.limit - len(todos))
        if resto == 0:
            break
        parte = _carregar_camada(layer, pk, geom, ckpt, mun, resto)
        todos.extend(parte)
        print(f"  [ok] {layer}: +{len(parte):,}", flush=True)
        time.sleep(PAUSA)

    vistos = set()
    dedup: "list[dict]" = []
    for r in todos:
        k = (r.get("processo"), r.get("no_licenca"), r.get("municipio"), r.get("tipo"))
        if k not in vistos:
            vistos.add(k)
            dedup.append(r)
    todos = dedup
    print(f"  total coletado: {len(todos):,} (após dedup)")

    resumo_tipo = {}
    for r in todos:
        t = r["tipo"] or "(sem tipo)"
        resumo_tipo[t] = resumo_tipo.get(t, 0) + 1

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": FONTES["wfs"],
        "fontes": FONTES,
        "camadas": [{"camada": c, "pk": p, "geometria": g,
                     "total_fonte": contagens[c]} for c, p, g in CAMADAS],
        "total_fonte": total_fonte,
        "truncado": bool(args.limit) and len(todos) < total_fonte,
        "colunas": ["processo", "tipo", "empresa", "cnpj", "municipio", "uf",
                    "data", "situacao", "atividade", "no_licenca",
                    "validade_inicio", "validade_fim", "fonte_url"],
        "obs": "empresa e cnpj não vêm na camada pública do WFS (ficam null). "
               "CPF (11 dígitos) nunca é gravado: [CPF redigido]. "
               "municipio resolve pelo código IBGE em municipios-go.json; "
               "código não reconhecido fica como número de 7 dígitos.",
        "ressalva_editorial": RESSALVA,
        "resumo_por_tipo": dict(sorted(resumo_tipo.items(), key=lambda kv: -kv[1])),
        "linhas": todos,
    }

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    tam_kb = SAIDA.stat().st_size / 1024
    print(f"\n[ok] {len(todos):,} registros -> {SAIDA.name} ({tam_kb:,.0f} KB)"
          + ("" if not dados["truncado"] else " — TRUNCADO (use --limit 0)"))

    ckpt["concluido"] = not dados["truncado"]
    _salvar_checkpoint(ckpt)

    if args.scan_cpf:
        print("\n  rodando o varredor de CPF sobre a saída...")
        r = subprocess.run(
            [sys.executable, "scripts/checar-dado-pessoal-em-dado.py", "--extra", str(SAIDA)])
        if r.returncode != 0:
            print("  [!] CPF achado no JSON — limpar campo no coletor e re-rodar.")
            sys.exit(2)
        print("  scan clean.")


if __name__ == "__main__":
    main()
