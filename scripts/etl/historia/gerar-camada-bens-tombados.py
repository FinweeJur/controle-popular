#!/usr/bin/env python3
"""
gerar-camada-bens-tombados.py — camada dos bens tombados pelo IPHAN (federal).

Fonte oficial: a base que o IPHAN publica em
`/iphan/pt-br/patrimonio-cultural/patrimonio-material/bens-tombados` —
`anexo-base-de-dados-tombamento-cgid.xlsx` (medida em 30/09/2026: 2.542 linhas).
⚠️ O download exige o sufixo `/@@download/file` (o `.xlsx` direto devolve HTML).

O QUE A CAMADA É: o bem tombado federal, com UF, Município, classificação,
processo e ano — geolocalizado no centroide do MUNICÍPIO (o acervo não traz
coordenada do bem). Marca `fazenda_engenho` quando o nome atribuído casa com
fazenda/engenho/usina/café — é o que responde ao pedido do dev (Fase H).

⚠️ O QUE NÃO É: o universo de fazendas e engenhos do país. É o que está TOMBADO
no plano federal; o estadual (IEPHA) já está na camada `hist-fazendas-engenhos`.

Uso: python scripts/etl/historia/gerar-camada-bens-tombados.py
"""
from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

import openpyxl
import requests

RAIZ = Path(__file__).resolve().parents[3]
BASE = "https://www.gov.br/iphan/pt-br/patrimonio-cultural/patrimonio-material/bens-tombados"
XLSX = "anexo-base-de-dados-tombamento-cgid.xlsx"
UA = "ControlePopular/1.0 (+controlepopular.com.br; transparencia)"
CACHE = RAIZ / "scripts" / ".cache" / "iphan-tombamento.xlsx"
INDICE = RAIZ / "apps" / "web" / "data" / "iphan-bens-tombados.json"
CAMADA = RAIZ / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas" / "hist-bens-tombados.geojson"
CENTROIDES = RAIZ / "apps" / "web" / "data" / "municipios-centroides.json"

TIPO_RURAL = re.compile(r"fazenda|engenho|usina|moinho|ro[cç]a|caf[eé]|canav", re.I)


def slug(nome: str, uf: str) -> str:
    limpo = unicodedata.normalize("NFD", nome).encode("ascii", "ignore").decode().lower()
    return f"{re.sub(r'[^a-z0-9]', '', limpo)}_{uf.lower()}"


def baixar() -> Path:
    if CACHE.exists() and CACHE.stat().st_size > 100_000:
        return CACHE
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    r = requests.get(f"{BASE}/{XLSX}/@@download/file", headers={"User-Agent": UA}, timeout=180)
    r.raise_for_status()
    if r.content[:4] != b"PK\x03\x04":  # assinatura de zip/xlsx
        raise SystemExit("o download não veio como xlsx (veio HTML?)")
    CACHE.write_bytes(r.content)
    return CACHE


def ler_linhas(caminho: Path) -> tuple[list[str], list[dict]]:
    wb = openpyxl.load_workbook(caminho, read_only=True)
    ws = wb.active
    it = ws.iter_rows(values_only=True)
    # a base traz DUAS linhas de cabeçalho (grupos + campos); acha a dos campos
    cabecalho, grupos = None, None
    for _ in range(6):
        linha = next(it)
        vals = [str(v).strip() if v is not None else "" for v in linha]
        if "UF" in vals and "Município" in vals:
            cabecalho = vals
            break
        grupos = vals
    if cabecalho is None:
        raise SystemExit("não achei o cabeçalho (UF/Município) — a planilha mudou")
    idx = {nome: i for i, nome in enumerate(cabecalho) if nome}
    regs = []
    for linha in it:
        if all(v is None for v in linha):
            continue
        def pega(nome, opcional=False):
            i = idx.get(nome)
            return str(linha[i]).strip() if i is not None and linha[i] is not None else None
        regs.append({
            "grupo": grupos[idx.get("UF", 0) - 2] if grupos and idx.get("UF", 0) >= 2 else None,
            "uf": pega("UF"),
            "municipio": pega("Município"),
            "classificacao": pega("Classificação (relacionada à figura de proteção)") or pega("Classificação"),
            "nome": pega("Nome atribuído"),
            "processo_t": pega('Processo "T"'),
            "ano": pega("Ano de abertura"),
            "processo": pega("Processo administrativo"),
        })
    return cabecalho, regs


def main() -> int:
    caminho = baixar()
    cabecalho, regs = ler_linhas(caminho)
    centroides = json.loads(CENTROIDES.read_text(encoding="utf-8"))
    print(f"linhas: {len(regs)} | campos: {[c for c in cabecalho if c][:8]}")

    features, sem_coord, rurais = [], 0, 0
    for r in regs:
        if TIPO_RURAL.search(r.get("nome") or ""):
            rurais += 1
        mun, uf = r.get("municipio"), (r.get("uf") or "").upper()
        if not mun or len(uf) != 2:
            continue
        c = centroides.get(slug(mun, uf))
        if not c:
            sem_coord += 1
            continue
        r["tipo_rural"] = bool(TIPO_RURAL.search(r.get("nome") or ""))
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [c[1], c[0]]},
            "properties": {
                "nome": r["nome"],
                "municipio": mun,
                "uf": uf,
                "classificacao": r["classificacao"],
                "processo_t": r["processo_t"],
                "ano": r["ano"],
                "fazenda_engenho": r["tipo_rural"],
                "fonte": "IPHAN — base de bens tombados (CGID)",
                "fonte_url": f"{BASE}/{XLSX}/@@download/file",
                "natureza": "bem TOMBADO federal; ponto no centroide do município — piso",
            },
        })

    INDICE.write_text(json.dumps({
        "fonte": "IPHAN — Base de Dados de Bens Tombados (CGID)",
        "fonte_url": f"{BASE}/{XLSX}",
        "coletado_em": "2026-09-30",
        "total": len(regs),
        "com_municipio_e_uf": sum(1 for r in regs if r.get("municipio") and len((r.get("uf") or "")) == 2),
        "no_mapa": len(features),
        "sem_centroide_no_ibge": sem_coord,
        "rurais_por_nome": rurais,
        "ressalva": "Bem tombado federal; ponto no centroide do município (o acervo não tem coordenada do bem).",
        "registros": regs,
    }, ensure_ascii=False, indent=1), encoding="utf-8")

    CAMADA.write_text(json.dumps({
        "type": "FeatureCollection",
        "_nota": (
            "Bens tombados pelo IPHAN (federal), de 2.542 linhas da base oficial, "
            "geolocalizados no centroide do município. 'fazenda_engenho' marca o que "
            "responde ao pedido do dev. É o que está TOMBADO no plano federal."
        ),
        "features": features,
    }, ensure_ascii=False), encoding="utf-8")

    print(f"no mapa: {len(features)} | sem centroide: {sem_coord} | nomes rurais: {rurais}")
    print(f"  {INDICE.name} ({INDICE.stat().st_size/1024:.0f} KB), {CAMADA.name} ({CAMADA.stat().st_size/1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
