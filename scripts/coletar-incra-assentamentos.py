r"""coletar-incra-assentamentos.py — projetos de assentamento do Brasil (INCRA/SIPRA).

O QUE É: baixa o CSV nacional de projetos de reforma agrária do INCRA (relatório
SIPRA) e grava `apps/web/data/incra-assentamentos.json` — um registro por
projeto, com município sede, UF, área, famílias de capacidade e residentes,
fase, ato de criação, forma de obtenção — mais um resumo por UF.

FONTE OFICIAL: página
https://www.gov.br/incra/pt-br/assuntos/reforma-agraria/assentamentos-relacao-de-projetos
(recurso `assentamentosgeral.csv`), que em 17/11/2026 apontava para
https://www.gov.br/incra/pt-br/assuntos/reforma-agraria/assentamentosgeral.csv/@@download/file
— **1.412.756 B, gerado em 06/03/2026, fonte declarada SIPRA** dentro do
próprio arquivo. `robots.txt` de `www.gov.br`: 200, só `Disallow: /search` e
`/login` (medido 18/11/2026) — download liberado. User-Agent honesto
`finweejur/github artur colito`. Se o link direto mudar, o coletor descobre a
URL atual na página de dados abertos e registra a descoberta no log.

MEDIÇÃO (18/11/2026, sondagem em
`docs/historico/descobertas/ambiental-PA-fundiario.md`):

- **9.964 projetos** no país, **140.912.141,2 ha**.
- O arquivo NÃO tem campo de UF. Ele vem agrupado por Superintendência
  Regional (30 blocos), e o prefixo do código é da SR, não do estado: em
  Santarém o prefixo é `SM`/`AT`, no Sul do Pará é `MB`. Por isso a UF sai da
  tabela `SR_UF` (número da SR → UFs que ela cobre), com o prefixo como atalho
  quando ele já é sigla de estado e o município sede como desempate nos três
  blocos que cruzam UF (SE/BA, DF/GO/MG, Médio São Francisco/BA-PE).
- **O Pará tem 1.196 projetos / 26.187.344,4 ha**, não 494: a sondagem de
  17/11/2026 contou só os prefixos `PA` e `AT` e perdeu os blocos `MB` (524
  projetos, Sul do Pará) e `SM` (178, Santarém). A área medida com o recorte
  errado (13.216.380 ha) é o mesmo número que a sondagem publicou.

DADO PESSOAL: este arquivo publica o PROJETO, nunca o assentado. A "relação de
beneficiários assentados" do INCRA (nome, CPF, lote) está na mesma página e
**não é coletada** — ver `docs/historico/descobertas/ambiental-PA-fundiario.md`
§11. Nenhum campo deste JSON identifica pessoa.

CHECKPOINT: o CSV bruto fica em `scripts/.cache/incra-assentamentos/`. Cache
válido é usado sem tocar na rede; corpo inválido não sobrescreve cache bom.
`--refetch` ignora o cache; `--dry-run` só conta.

  python scripts/coletar-incra-assentamentos.py
  python scripts/coletar-incra-assentamentos.py --refetch
  python scripts/coletar-incra-assentamentos.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace", line_buffering=True)

LOG = "[coletar-incra-assentamentos]"
URL = ("https://www.gov.br/incra/pt-br/assuntos/reforma-agraria/"
       "assentamentosgeral.csv/@@download/file")
PAGINA = ("https://www.gov.br/incra/pt-br/assuntos/reforma-agraria/"
          "assentamentos-relacao-de-projetos")
UA = "finweejur/github artur colito"
PAUSA = 2  # s entre requisições ao mesmo host
# Piso de corpo válido do CSV (1.412.756 B medido); o teste baixa os dois.
MIN_BYTES = 500_000
MIN_LINHAS = 9_000
RAIZ = Path(__file__).resolve().parent
CACHE = RAIZ / ".cache" / "incra-assentamentos"
BRUTO = CACHE / "assentamentos-geral.csv"
SAIDA = RAIZ.parent / "apps" / "web" / "data" / "incra-assentamentos.json"
MUNICIPIOS = RAIZ.parent / "apps" / "web" / "data" / "municipios-brasil.compact.json"

# Superintendência Regional do SIPRA → UFs que ela cobre (nomes medidos nos 30
# cabeçalhos de bloco do CSV em 18/11/2026). Só três blocos cruzam mais de uma
# UF; os outros 27 são de um estado só.
SR_UF: dict[str, set[str]] = {
    "01": {"PA"}, "02": {"CE"}, "03": {"PE"}, "04": {"GO"}, "05": {"BA"},
    "06": {"MG"}, "07": {"RJ"}, "08": {"SP"}, "09": {"PR"}, "10": {"SC"},
    "11": {"RS"}, "12": {"MA"}, "13": {"MT"}, "14": {"AC"}, "15": {"AM"},
    "16": {"MS"}, "17": {"RO"}, "18": {"PB"}, "19": {"RN"}, "20": {"ES"},
    "21": {"AP"}, "22": {"AL"}, "23": {"SE", "BA"}, "24": {"PI"}, "25": {"RR"},
    "26": {"TO"}, "27": {"PA"}, "28": {"DF", "GO", "MG"}, "29": {"BA", "PE"},
    "30": {"PA"},
}

# Código de UF do IBGE (dois primeiros dígitos do código do município).
COD_UF = {11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
          21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL",
          28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR",
          42: "SC", 43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF"}
UFS_SIGLAS = set(COD_UF.values())

# Fases do dicionário de dados do INCRA (mesma página, `.xls`). O código 07
# aparece em 411 linhas e NÃO está definido no dicionário — fica sem nome.
FASES = {"03": "Criado", "04": "Em Instalação", "05": "Em Estruturação",
         "06": "Em Consolidação"}

RESSALVA = (
    "Projeto de assentamento criado não é projeto ocupado: `familias_capacidade` "
    "é a capacidade declarada e `familias_assentadas` é quem reside, e os dois "
    "números divergem muito. A área é a do projeto, não a já titulada. O INCRA "
    "não publica a UF do projeto: ela é derivada da Superintendência Regional e, "
    "nos blocos que cruzam estado, do município sede — quem precisa de precisão "
    "cadastral confira no SIPRA. Nenhum dado de pessoa assentada entra aqui. "
    "As somas de SP e SE estão infladas por dois registros com área impossível "
    "digitada na fonte, listados em `area_suspeita`.")

_LINHA = re.compile(r"^([A-Z]{2})(\d{7});")


def _norm(texto: str) -> str:
    s = unicodedata.normalize("NFKD", texto or "")
    s = "".join(c for c in s if not unicodedata.combining(c)).upper()
    return re.sub(r"\s+", " ", re.sub(r"[^A-Za-z0-9 ]", " ", s)).strip()


def _get(url: str, nome: str) -> bytes:
    time.sleep(PAUSA)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=300) as r:
        corpo = r.read()
    print(f"{LOG} {nome}: {len(corpo):,} B")
    return corpo


def _descobrir_url() -> str:
    """O link direto do CSV pode mudar de caminho; a página de origem não."""
    html = _get(PAGINA, "página do CSV").decode("utf-8", "replace")
    m = re.search(r'href="([^"]*assentamentosgeral[^"]*@@download/file)"', html)
    if not m:
        raise RuntimeError("nem a URL medida nem a página do INCRA entregaram o CSV")
    achada = m.group(1)
    if not achada.startswith("http"):
        achada = "https://www.gov.br" + achada
    print(f"{LOG} URL descoberta na página: {achada}")
    return achada


def _parece_csv(bruto: bytes) -> bool:
    """Valida o CORPO: 200 com página de erro ou CSV truncado não é sucesso."""
    if len(bruto) < MIN_BYTES:
        return False
    texto = bruto.decode("latin-1")
    if "MUNICIPIO SEDE;AREA (ha)" not in texto:
        return False
    return len([l for l in texto.splitlines() if _LINHA.match(l)]) > MIN_LINHAS


def _baixar(refetch: bool = False) -> str:
    if not refetch and BRUTO.exists():
        bruto = BRUTO.read_bytes()
        if _parece_csv(bruto):
            print(f"{LOG} cache: {BRUTO} ({len(bruto):,} B) — sem refetch")
            return bruto.decode("latin-1")
        print(f"{LOG} cache inválido, baixando de novo")
    try:
        bruto = _get(URL, "CSV")
    except Exception as e:
        print(f"{LOG} URL medida falhou ({e}); procurando na página de origem")
        bruto = _get(_descobrir_url(), "CSV (URL redescoberta)")
    if not _parece_csv(bruto):
        raise RuntimeError(f"corpo de {len(bruto):,} B não é o CSV esperado — "
                           f"cache e JSON anteriores preservados")
    CACHE.mkdir(parents=True, exist_ok=True)
    BRUTO.write_bytes(bruto)
    return bruto.decode("latin-1")


def _num(texto: str) -> float:
    """Área no padrão brasileiro com 4 decimais: `4.356,0000`."""
    s = (texto or "").strip()
    if not s:
        return 0.0
    if "," in s:
        s = s.replace(".", "").replace(",", ".")
    try:
        return round(float(s), 4)
    except ValueError:
        return 0.0


def _int(texto: str) -> int:
    s = (texto or "").strip()
    return int(s) if s.isdigit() else 0


def _mapa_municipios() -> dict[str, set[str]]:
    """Nome normalizado do município → UFs possíveis (base local do IBGE)."""
    if not MUNICIPIOS.exists():
        return {}
    mapa: dict[str, set[str]] = {}
    for m in json.loads(MUNICIPIOS.read_text(encoding="utf-8")):
        uf = COD_UF.get(m["id"] // 100000)
        if uf:
            mapa.setdefault(_norm(m["nome"]), set()).add(uf)
    return mapa


def _uf(prefixo: str, sr: str, municipio: str, mapa: dict[str, set[str]]) -> str | None:
    """UF do projeto: prefixo quando já é sigla, senão a SR, senão o município."""
    ufs_sr = SR_UF.get(sr, set())
    if prefixo in UFS_SIGLAS:
        return prefixo
    if len(ufs_sr) == 1:
        return next(iter(ufs_sr))
    candidatos = mapa.get(_norm(municipio), set()) & ufs_sr
    return next(iter(candidatos)) if len(candidatos) == 1 else None


def _parse(texto: str, mapa: dict[str, set[str]]) -> tuple[list[dict], int]:
    linhas: list[dict] = []
    sem_uf = 0
    sr_nome, sr = "", ""
    for linha in texto.splitlines():
        if linha.startswith("Superintend"):
            sr_nome = linha.split(":", 1)[1].split(";")[0].strip()
            m = re.search(r"SR \((\d+)\)", sr_nome)
            sr = m.group(1) if m else ""
            continue
        m = _LINHA.match(linha)
        if not m:
            continue
        c = linha.split(";")
        c += [""] * (13 - len(c))
        municipio = c[2].strip()
        uf = _uf(m.group(1), sr, municipio, mapa)
        if uf is None:
            sem_uf += 1
        linhas.append({
            "codigo": c[0].strip(),
            "nome": c[1].strip(),
            "municipio": municipio,
            "uf": uf,
            "area_ha": _num(c[3]),
            "familias_capacidade": _int(c[4]),
            "familias_assentadas": _int(c[5]),
            "fase": c[6].strip(),
            "fase_nome": FASES.get(c[6].strip(), ""),
            "tipo": _int(c[7]),
            "numero_ato": c[8].strip(),
            "data_criacao": c[9].strip(),
            "forma_obtencao": c[10].strip(),
            "data_obtencao": c[11].strip(),
            "sr": sr,
            "superintendencia": sr_nome,
        })
    return linhas, sem_uf


def _resumo(linhas: list[dict]) -> tuple[dict, float]:
    por_uf: dict[str, dict] = {}
    for p in linhas:
        item = por_uf.setdefault(p["uf"] or "??", {"projetos": 0, "area_ha": 0.0,
                                                   "familias_capacidade": 0,
                                                   "municipios": set()})
        item["projetos"] += 1
        item["area_ha"] = round(item["area_ha"] + p["area_ha"], 4)
        item["familias_capacidade"] += p["familias_capacidade"]
        item["municipios"].add(_norm(p["municipio"]))
    for item in por_uf.values():
        item["municipios"] = len(item["municipios"])
    return dict(sorted(por_uf.items())), round(sum(v["area_ha"] for v in por_uf.values()), 4)


def main() -> None:
    ap = argparse.ArgumentParser(description="Assentamentos do INCRA (CSV SIPRA)")
    ap.add_argument("--refetch", action="store_true", help="ignora o cache e baixa de novo")
    ap.add_argument("--dry-run", action="store_true", help="só conta, não grava JSON")
    args = ap.parse_args()

    print(f"{LOG} projetos de assentamento do Brasil — SIPRA/INCRA")
    print(f"{LOG} cache: {CACHE}")
    linhas, sem_uf = _parse(_baixar(args.refetch), _mapa_municipios())
    if not linhas:
        raise RuntimeError("nenhum projeto no CSV — não sobrescrevo arquivo bom com zero")
    por_uf, soma_uf = _resumo(linhas)
    total_ha = round(sum(p["area_ha"] for p in linhas), 4)
    # Área acima de 5 Mha não existe em projeto de assentamento: os dois casos
    # do arquivo (SP 34,7 Mha / SE 11,4 Mha) são erro de digitação da FONTE.
    # Sinalizo, não corrijo — número de fonte não se conserta no coletor.
    suspeitas = [{"codigo": p["codigo"], "nome": p["nome"], "uf": p["uf"],
                  "area_ha": p["area_ha"]} for p in linhas if p["area_ha"] > 5_000_000]
    print(f"{LOG} {len(linhas):,} projetos | {total_ha:,.1f} ha | "
          f"{len(por_uf)} UFs | sem UF: {sem_uf} | área suspeita: {len(suspeitas)}")
    for uf, v in por_uf.items():
        print(f"{LOG}   {uf}: {v['projetos']:>4} projetos | {v['area_ha']:>16,.1f} ha"
              f" | {v['municipios']:>3} municípios")

    if args.dry_run:
        print(f"{LOG} dry-run: nada gravado")
        return
    if abs(soma_uf - total_ha) > 1:
        raise RuntimeError(f"soma por UF ({soma_uf}) não fecha com total ({total_ha})")

    dados = {
        "gerado_em": datetime.now(timezone.utc).isoformat(),
        "fonte": "INCRA — SIPRA, relação de projetos de reforma agrária (CSV)",
        "url_fonte": URL,
        "medido_em": "18/11/2026",
        "data_do_relatorio": "06/03/2026",
        "total": len(linhas),
        "total_ha": total_ha,
        "soma_por_uf_ha": soma_uf,
        "projetos_sem_uf": sem_uf,
        "area_suspeita": suspeitas,
        "colunas": ["codigo", "nome", "municipio", "uf", "area_ha",
                    "familias_capacidade", "familias_assentadas", "fase",
                    "fase_nome", "tipo", "numero_ato", "data_criacao",
                    "forma_obtencao", "data_obtencao", "sr", "superintendencia"],
        "obs": ("CSV do SIPRA: uma linha por projeto, agrupado por Superintendência "
                "Regional. O arquivo NÃO tem campo de UF — `uf` é derivada de "
                "`SR_UF` (número da SR → estados), do prefixo do código quando ele "
                "é sigla e, nos blocos SE/BA, DF/GO/MG e Médio São Francisco, do "
                "município sede na base de municípios do IBGE. `codigo` começa com "
                "o prefixo da SR, não do estado (`MB` = SR Sul do Pará, `SM`/`AT` = "
                "Santarém). `tipo` é o código do ato normativo, cru. `fase_nome` só "
                "nomeia 03 a 06: o código 07 existe no arquivo e não está no "
                "dicionário do INCRA. Datas no padrão dd/mm/aaaa da fonte. "
                "Somente projeto e território — a relação de beneficiários "
                "(nome, CPF, lote) não é coletada. `por_uf['??']` são os "
                "projetos cujo município sede não resolve entre as UFs da SR "
                "(grafia própria do SIPRA, ex. `BELEM DE SAO FRANCISCO`); em "
                "`area_suspeita` estão os dois registros com área impossível "
                "digitada na fonte (SP 34,7 Mha; SE 11,4 Mha), mantidos como "
                "vieram e apenas sinalizados."),
        "ressalva_editorial": RESSALVA,
        "por_uf": por_uf,
        "linhas": linhas,
    }
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(dados, ensure_ascii=False, separators=(",", ":")),
                     encoding="utf-8")
    print(f"{LOG} ok -> {SAIDA} ({SAIDA.stat().st_size / 1024:,.0f} KB)")


if __name__ == "__main__":
    main()
