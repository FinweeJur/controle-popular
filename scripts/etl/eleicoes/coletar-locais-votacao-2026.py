"""
ETL de locais de votacao alterados — Eleicoes 2026 (TSE).

O que faz: baixa o arquivo oficial `eleitorado_local_votacao_2026.zip`
(Dados Abertos do TSE, canal por CDN), exclui o CSV `BRASIL.csv`
(duplicata das UFs — medido em 18/10/2026: 1.034.358 linhas = soma das
UFs separadas), marca como ALTERADA toda secao cujo local de votacao
atual difere do que o TSE registrou como original (`NR_LOCAL_VOTACAO`,
`NM_LOCAL_VOTACAO` ou `DS_ENDERECO` diferentes) e grava um JSON
compactado para a pagina
`/eleicoes/2026/locais-votacao-alterados`.

Por que via dado aberto e nao pelo portal SIG-Eleicao
(https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao/home): o portal
HTML devolve 403 para cliente nao-navegador — inclusive no robots.txt
(medido em 18/10/2026, curl com UA honesto). Sedes bloqueadas nao se
burlam (regra de coleta etica, COLETA-ETICA.md). O MESMO dado oficial
esta publicado com licenca aberta em
https://dadosabertos.tse.jus.br/dataset/eleitorado-2026
("Eleitorado por local de votacao - 2026"), incluindo as colunas
`NR_LOCAL_VOTACAO_ORIGINAL`, `NM_LOCAL_VOTACAO_ORIGINAL` e
`DS_ENDERECO_LOCVT_ORIGINAL`, que registram de onde a secao veio.

Fonte oficial: TSE. Eleitorado por local de votacao — 2026. Brasilia:
Tribunal Superior Eleitoral, 2026. Disponivel em:
<https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip>.
Acesso em 18 out. 2026.

Coleta etica: User-Agent honesto, 1 (uma) requisicao por execucao com no
maximo 3 tentativas com re-tentativa progressiva, sem burlar acesso e sem
varredura. Comando-Windows-compatible (PowerShell); sem dependencia
externa: py, stdlib.
"""

from __future__ import annotations

import csv
import io
import json
import sys
import time
import zipfile
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

USER_AGENT = "FinweeJur/Github Artur colito"
URL_FONTE = (
    "https://cdn.tse.jus.br/estatistica/sead/odsele/"
    "eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip"
)

RAIZ = Path(__file__).resolve().parents[3]
PASTA_ZIP = RAIZ / "scripts" / "dados" / "sig-locais-2026"
ARQUIVO_ZIP = PASTA_ZIP / "eleitorado_local_votacao_2026.zip"
PASTA_SAIDA = RAIZ / "apps" / "web" / "data" / "eleicoes" / "2026"
ARQUIVO_SAIDA = PASTA_SAIDA / "locais-votacao-alterados.json"

LINHAS_POR_FATIA_IDEAL = 400


def baixar_zip(destino: Path, tentativas: int = 3) -> None:
    """Baixa o zip oficial com UA honesto e re-tentativa progressiva (2s, 4s, 6s)."""
    destino.parent.mkdir(parents=True, exist_ok=True)
    ultimo_erro: Exception | None = None
    for tentativa in range(1, tentativas + 1):
        try:
            pedido = Request(URL_FONTE, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
            with urlopen(pedido, timeout=120) as resposta:
                dados = resposta.read()
            destino.write_bytes(dados)
            print(f"baixou {len(dados)} bytes -> {destino}")
            time.sleep(1)
            return
        except Exception as erro:  # noqa: BLE001
            ultimo_erro = erro
            print(f"tentativa {tentativa} falhou: {erro}")
            time.sleep(2 * tentativa)
    raise SystemExit(f"ERRO: download falhou apos {tentativas} tentativas: {ultimo_erro}")


def eh_alterada(linha: dict[str, str]) -> bool:
    """Alterada = local atual difere do original em numero, nome ou endereco."""
    nr_original = (linha.get("NR_LOCAL_VOTACAO_ORIGINAL") or "").strip()
    nm_original = (linha.get("NM_LOCAL_VOTACAO_ORIGINAL") or "").strip()
    ds_original = (linha.get("DS_ENDERECO_LOCVT_ORIGINAL") or "").strip()
    return (
        (nr_original != "" and nr_original != (linha.get("NR_LOCAL_VOTACAO") or "").strip())
        or (nm_original != "" and nm_original != (linha.get("NM_LOCAL_VOTACAO") or "").strip())
        or (ds_original != "" and ds_original != (linha.get("DS_ENDERECO") or "").strip())
    )


def classificar(linha: dict[str, str]) -> str:
    """Motivo da alteracao: predio (novo lugar), endereco (mesmo lugar, rua nova) ou nome."""
    nr_original = (linha.get("NR_LOCAL_VOTACAO_ORIGINAL") or "").strip()
    if nr_original and nr_original != (linha.get("NR_LOCAL_VOTACAO") or "").strip():
        return "predio"
    ds_original = (linha.get("DS_ENDERECO_LOCVT_ORIGINAL") or "").strip()
    if ds_original and ds_original != (linha.get("DS_ENDERECO") or "").strip():
        return "endereco"
    return "nome"


def processar(caminho_zip: Path) -> dict[str, Any]:
    """Le o zip oficial e devolve a colecao compacta de secoes alteradas.

    Cada secao aparece DUas vezes no CSV oficial (uma por turno: "1o
    Turno" e "2o Turno" — medido em 18/10/2026: 1.034.358 linhas =
    517.179 secoes x 2, conferido contra a proporcao oficial do TSE de
    0,87% para 4.352 secoes alteradas no 2o turno, Uol 18/10/2026).
    Fica UM registro por secao (UF, zona, secao); quando os dois turnos
    existem, vale o registro do 2o turno (o util para o eleitor em
    25/10/2026). Linhas sem turno marcam no campo `g`.
    """
    por_chave: dict[tuple, Any] = {}
    vistas: set[tuple] = set()
    total_secoes = 0
    zip_data = zipfile.ZipFile(caminho_zip)
    nomes_csv = [n for n in zip_data.namelist() if n.endswith(".csv")]
    gerado = ""
    hora = ""
    for nome in sorted(nomes_csv):
        uf = nome.removesuffix(".csv").split("_")[-1]
        if uf == "BRASIL":
            continue  # duplicata das UFs: 1.034.358 linhas = soma das demais (18/10/2026)
        with zip_data.open(nome) as bruto:
            texto = io.TextIOWrapper(bruto, encoding="latin-1", newline="")
            leitor = csv.DictReader(texto, delimiter=";")
            for registro in leitor:
                if not gerado:
                    gerado = (registro.get("DT_GERACAO") or "").strip()
                    hora = (registro.get("HH_GERACAO") or "").strip()
                chave = (
                    uf,
                    (registro.get("NM_MUNICIPIO") or "").strip(),
                    int((registro.get("NR_ZONA") or "0") or 0),
                    int((registro.get("NR_SECAO") or "0") or 0),
                )
                if chave not in vistas:
                    vistas.add(chave)
                    total_secoes += 1
                if not eh_alterada(registro):
                    continue
                turno = (registro.get("DS_ELEICAO") or "").strip()
                item = {
                    "u": uf,
                    "m": (registro.get("NM_MUNICIPIO") or "").strip(),
                    "z": int((registro.get("NR_ZONA") or "0") or 0),
                    "s": int((registro.get("NR_SECAO") or "0") or 0),
                    "e": int((registro.get("QT_ELEITOR_SECAO") or "0") or 0),
                    "l": (registro.get("NM_LOCAL_VOTACAO") or "").strip(),
                    "d": (registro.get("DS_ENDERECO") or "").strip(),
                    "lo": (registro.get("NM_LOCAL_VOTACAO_ORIGINAL") or "").strip(),
                    "do": (registro.get("DS_ENDERECO_LOCVT_ORIGINAL") or "").strip(),
                    "t": classificar(registro),
                    "g": 2 if "2" in turno else 1,
                }
                anterior = por_chave.get((item["u"], item["m"], item["z"], item["s"]))
                if anterior is None or (item["g"] == 2 and anterior["g"] != 2):
                    por_chave[(item["u"], item["m"], item["z"], item["s"])] = item
    linhas = sorted(
        por_chave.values(), key=lambda r: (r["u"], r["m"], r["z"], r["s"])
    )
    return {
        "fonte": {
            "orgao": "Tribunal Superior Eleitoral (TSE)",
            "titulo": "Eleitorado por local de votacao - 2026 (dados abertos)",
            "url": URL_FONTE,
            "dataset": "https://dadosabertos.tse.jus.br/dataset/eleitorado-2026",
        },
        "geradoEm": f"{gerado} {hora}".strip(),
        "totalSecoes": total_secoes,
        "secoesAlteradas": len(linhas),
        "linhas": linhas,
    }


def main() -> int:
    if not ARQUIVO_ZIP.exists() or ARQUIVO_ZIP.stat().st_size < 1_000_000:
        baixar_zip(ARQUIVO_ZIP)
    print("lendo", ARQUIVO_ZIP)
    dados = processar(ARQUIVO_ZIP)
    PASTA_SAIDA.mkdir(parents=True, exist_ok=True)
    ARQUIVO_SAIDA.write_text(
        json.dumps(dados, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(f"ok: {len(dados['linhas'])} secoes alteradas de {dados['totalSecoes']} -> {ARQUIVO_SAIDA}")
    if len(dados["linhas"]) == 0:
        print("AVISO: zero secoes alteradas — conferir se o TSE mudou o formato.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

