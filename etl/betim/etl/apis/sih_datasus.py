"""etl.apis.sih_datasus — download SIH-SUS (internacoes) via DATASUS FTP.

Fonte: ftp://ftp2.datasus.gov.br/public/sistemas/dsweb/SIHD/Programas/DSIHD017/
Arquivos DSIHD017 por UF e competencia (ZIP contendo DBF).

ATENCAO: O servidor FTP do DATASUS e lento e pode estar indisponivel.
Os arquivos DBF precisam do dbfread (pip install dbfread).

Campos extraidos: ANO_CMPT, MES_CMPT, MUNIC_RES (residencia), MUNIC_MOV
(hospital), CAR_INT (caracter), DIAG_PRINC (CID-10), MORTE, DIAS_PERM,
VAL_TOT, ESPEC.

Escopo: AIHs pagas de pacientes de um municipio (MUNIC_RES).

Saida: apps/web/data/sih-internacoes-{id_municipio}.json

Uso:
  python -m etl.apis.sih_datasus --id-municipio 3106705 --uf 31
  python -m etl.apis.sih_datasus --id-municipio 3106705 --uf 31 --ano 2024 --mes 12
  python -m etl.apis.sih_datasus --id-municipio 3106705 --uf 31 --json
"""
import argparse
import io
import json
import os
import sys
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone

USER_AGENT = "ControlePopular/1.0 (coletor publico; contato: controlepopular@controlepopular.com.br)"
FTP_BASE = "ftp://ftp2.datasus.gov.br/public/sistemas/dsweb/SIHD/Programas/DSIHD017"

CODIGOS_UF = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA",
    "16": "AP", "17": "TO", "21": "MA", "22": "PI", "23": "CE",
    "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE",
    "29": "BA", "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
    "41": "PR", "42": "SC", "43": "RS", "50": "MS", "51": "MT",
    "52": "GO", "53": "DF",
}


def _verificar_dbfread():
    try:
        import dbfread  # noqa: F401
        return True
    except ImportError:
        return False


def _url_arquivo(uf: str, competencia: str) -> str:
    """Monta URL FTP do arquivo DSIHD017."""
    return f"{FTP_BASE}/DSIHD017_{uf}_{competencia}.ZIP"


def _competencias(ano: int | None = None, mes: int | None = None) -> list[str]:
    """Gera lista de competencias (YYYYMM) para download."""
    if ano and mes:
        return [f"{ano}{mes:02d}"]

    now = datetime.now()
    competencias = []
    for i in range(12):
        dt = now.month - i
        y = now.year + (dt - 1) // 12
        m = (dt - 1) % 12 + 1
        competencias.append(f"{y}{m:02d}")
    return competencias


def _download_dbf(url: str) -> list[dict]:
    """Baixa um ZIP do DATASUS via FTP e extrai registros do DBF."""
    from dbfread import DBF

    print(f"[sih_datasus] baixando {url}")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=120) as response:
            ZIP_bytes = response.read()
    except Exception as e:
        print(f"[sih_datasus] falha no download: {e}")
        return []

    with zipfile.ZipFile(io.BytesIO(ZIP_bytes)) as zf:
        nomes_dbf = [n for n in zf.namelist() if n.upper().endswith(".DBF")]
        if not nomes_dbf:
            print(f"[sih_datasus] nenhum DBF encontrado no ZIP")
            return []

        registros = []
        for nome_dbf in nomes_dbf:
            with zf.open(nome_dbf) as f:
                dbf = DBF(io.BytesIO(f.read()))
                registros.extend(dict(row) for row in dbf)

        return registros


def _datasus6_para_7(codigo_6: str) -> str:
    """Converte codigo DATASUS de 6 digitos para IBGE de 7."""
    if len(codigo_6) != 6:
        return codigo_6
    pesos = [1, 2, 3, 4, 5, 6, 7, 8]
    soma = sum(int(codigo_6[i]) * pesos[i] for i in range(6))
    resto = soma % 11
    if resto > 1:
        dv = 11 - resto
    elif resto == 1:
        dv = 1
    else:
        dv = 0
    return codigo_6 + str(dv)


def _normalizar_linha(row: dict, id_municipio: str) -> dict | None:
    """Converte uma linha DBF para o formato do portal."""
    munic_res = str(row.get("MUNIC_RES", "")).strip()
    if not munic_res:
        return None

    codigo_7 = _datasus6_para_7(munic_res) if len(munic_res) == 6 else munic_res
    if codigo_7 != id_municipio:
        return None

    morte = int(row.get("MORTE", 0) or 0)
    dias_perm = int(row.get("DIAS_PERM", 0) or 0)
    val_tot = float(row.get("VAL_TOT", 0) or 0)

    return {
        "ano": str(row.get("ANO_CMPT", "")).strip(),
        "mes": str(row.get("MES_CMPT", "")).strip(),
        "especialidade": str(row.get("ESPEC", "")).strip(),
        "carater": str(row.get("CAR_INT", "")).strip(),
        "diag_princ": str(row.get("DIAG_PRINC", "")).strip(),
        "obito": morte == 1,
        "dias_permanencia": dias_perm,
        "valor_total": val_tot,
        "municipio_hospital": str(row.get("MUNIC_MOV", "")).strip(),
    }


def _agregar(linhas: list[dict]) -> list[dict]:
    """Agrega internacoes por ano, mes, carater e diagnostico."""
    agg = defaultdict(lambda: {"qtd": 0, "obitos": 0, "dias_total": 0, "valor_total": 0.0})

    for l in linhas:
        chave = (l["ano"], l["mes"], l["carater"], l["diag_princ"])
        agg[chave]["qtd"] += 1
        agg[chave]["obitos"] += 1 if l["obito"] else 0
        agg[chave]["dias_total"] += l["dias_permanencia"]
        agg[chave]["valor_total"] += l["valor_total"]

    resultado = []
    for (ano, mes, carater, diag), v in sorted(agg.items()):
        resultado.append({
            "ano": ano,
            "mes": mes,
            "carater": carater,
            "diagnostico": diag,
            "internacoes": v["qtd"],
            "obitos": v["obitos"],
            "dias_permanencia_total": v["dias_total"],
            "permanencia_media": round(v["dias_total"] / v["qtd"], 1) if v["qtd"] else 0,
            "valor_total": round(v["valor_total"], 2),
        })

    return resultado


def main():
    if not _verificar_dbfread():
        print(
            "[sih_datasus] ABORT: dbfread nao esta instalado. "
            "Instale com: pip install dbfread",
            file=sys.stderr,
        )
        sys.exit(1)

    parser = argparse.ArgumentParser(description="Coleta SIH-SUS via DATASUS")
    parser.add_argument("--id-municipio", required=True, help="Codigo IBGE de 7 digitos")
    parser.add_argument("--uf", required=True, help="Codigo UF (2 digitos, ex: 31=MG)")
    parser.add_argument("--ano", type=int, help="Ano de competencia (ex: 2024)")
    parser.add_argument("--mes", type=int, help="Mes de competencia (1-12)")
    parser.add_argument("--json", action="store_true", help="Salvar JSON em apps/web/data/")
    args = parser.parse_args()

    uf = args.uf.zfill(2)
    if uf not in CODIGOS_UF:
        print(f"[sih_datasus] ABORT: UF '{uf}' invalida", file=sys.stderr)
        sys.exit(1)

    competencias = _competencias(args.ano, args.mes)
    print(f"[sih_datasus] municipio={args.id_municipio} uf={uf} ({CODIGOS_UF[uf]})")
    print(f"[sih_datasus] competencias={competencias}")

    todas_linhas = []
    for comp in competencias:
        url = _url_arquivo(uf, comp)
        try:
            registros = _download_dbf(url)
            linhas = [_normalizar_linha(r, args.id_municipio) for r in registros]
            linhas = [l for l in linhas if l is not None]
            print(f"[sih_datasus] competencia={comp}: {len(registros)} registros, {len(linhas)} do municipio")
            todas_linhas.extend(linhas)
        except Exception as e:
            print(f"[sih_datasus] erro na competencia {comp}: {e}")

    print(f"[sih_datasus] total bruto={len(todas_linhas)}")

    agregadas = _agregar(todas_linhas)
    print(f"[sih_datasus] agregadas={len(agregadas)}")

    if not agregadas:
        print("[sih_datasus] nenhuma internacao encontrada")
        return

    if args.json:
        raiz = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
        caminho = os.path.join(raiz, "apps", "web", "data", f"sih-internacoes-{args.id_municipio}.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        pacote = {
            "fonte": "sih-datasus",
            "municipio": args.id_municipio,
            "uf": uf,
            "competencias_consultadas": competencias,
            "total_registros_brutos": len(todas_linhas),
            "total_agregados": len(agregadas),
            "internacoes": agregadas,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
        }
        tmp = caminho + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(pacote, f, ensure_ascii=False, indent=2)
        os.replace(tmp, caminho)
        print(f"[sih_datasus] JSON salvo: {len(agregadas)} registros em {caminho}")
        return

    for r in agregadas[:10]:
        print(json.dumps(r, ensure_ascii=False)[:200])
    print(f"[sih_datasus] total={len(agregadas)}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        print(f"[sih_datasus] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
