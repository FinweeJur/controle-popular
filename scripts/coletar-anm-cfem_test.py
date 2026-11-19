"""coletar-anm-cfem_test.py — teste do parser e da agregação da CFEM (sem pytest).

Roda: python scripts/coletar-anm-cfem_test.py
O módulo tem hífen no nome, então entra por importlib.
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ARQ = Path(__file__).resolve().parent / "coletar-anm-cfem.py"
spec = importlib.util.spec_from_file_location("coletar_anm_cfem", ARQ)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

falhas = 0


def ok(cond, rotulo):
    global falhas
    if cond:
        print(f"  ok   {rotulo}")
    else:
        falhas += 1
        print(f"  FALHA {rotulo}")


print("== parser de valor brasileiro ==")
ok(mod.parse_valor_br("1.234,56") == 1234.56, "'1.234,56' -> 1234.56")
ok(mod.parse_valor_br("286,507") == 286.507, "'286,507' -> 286.507")
ok(mod.parse_valor_br("198607,5585") == 198607.5585, "valor grande sem milhar")
ok(mod.parse_valor_br("0,00") == 0.0, "'0,00' -> 0.0")
ok(mod.parse_valor_br("-") is None, "'-' -> None")
ok(mod.parse_valor_br("") is None, "vazio -> None")
ok(mod.parse_valor_br("1.234.567,89") == 1234567.89, "dois pontos de milhar")
ok(mod.parse_valor_br("1.234") == 1234.0, "'1.234' é milhar")
ok(mod.parse_valor_br("1.5") == 1.5, "'1.5' continua decimal")

print("== agregação por município/ano ==")
# NúmeroDeDistribuição, Ano, Mês, Ente, SiglaEstado, CodigoEnte, NomeEnte,
# TipoDistribuição, Substância, TipoAfetamento, Valor, DataCriacao
linhas = [
    ["244", "2007", "1", "Município", "PA", "1505551", "PARAUAPEBAS",
     "Produtor", "FERRO", "-", "1.000,10", "2006-08-31 00:00:00"],
    ["244", "2008", "1", "Município", "PA", "1505551", "PARAUAPEBAS",
     "Produtor", "FERRO", "-", "500,00", "2006-09-30 00:00:00"],
    ["244", "2007", "1", "Estado", "PA", "15", "PARÁ",
     "Produtor", "FERRO", "-", "300,50", "2006-08-31 00:00:00"],
    ["244", "2007", "1", "União", "", "", "",
     "Compensatória", "FERRO", "-", "200,00", "2006-08-31 00:00:00"],
    ["244", "2007", "1", "Município", "MG", "3106200", "BELO HORIZONTE",
     "Produtor", "FERRO", "-", "0,40", "2006-08-31 00:00:00"],
    ["lixo"],                                     # linha curta: ignorada
    ["244", "sem-ano", "1", "Município", "PA", "1505551", "X", "Produtor",
     "FERRO", "-", "9,99", "2006-08-31 00:00:00"],  # ano inválido: ignorada
]
agg = mod.agregar(linhas)

ok(agg["linhas"] == 5, f"5 linhas válidas lidas (veio {agg['linhas']})")
ok(agg["total_micro"] == 2_001_000_000, "total em micro-reais exato")
ok(len(agg["municipios"]) == 2, "2 municípios com código IBGE")
ok(agg["linhas_sem_codigo_municipal"] == 2, "estado e União não contam município")
pb = agg["municipios"]["1505551"]
ok(pb["micro"] == 1_500_100_000, "soma do município 1505551")
ok(pb["por_ano"] == {2007: 1_000_100_000, 2008: 500_000_000}, "soma do município por ano")
ok(agg["por_ano"][2007][0] == 1_501_000_000, "soma do ano 2007")
ok(agg["por_uf"]["PA"]["micro"] == 1_800_600_000, "soma da UF PA")
ok(agg["por_uf"]["BR"]["micro"] == 200_000_000, "União cai em BR")
ok(len(agg["por_uf"]["PA"]["_mun"]) == 1, "UF conta municípios distintos")

print("== JSON final ==")
dados = mod.montar_json(agg, {"bytes_origem": 1, "etag": "x", "last_modified": "",
                              "cache": "teste"})
ok(dados["total_brasil"] == 2001.0, "total Brasil formatado em reais")
ok(dados["municipios_com_repasse"] == 2, "contagem de municípios no JSON")
ok(dados["conferencia"]["fecha_com_total"] is True, "soma por UF e por ano fecha com o total")
ok(dados["municipios"][0]["total"] == 1500.1, "maior município primeiro")
ok(list(dados["municipios"][0]["por_ano"]) == ["2007", "2008"], "anos em ordem, como texto")
ok(dados["resumo_por_ente"]["Município"]["total"] == 1500.5, "resumo por tipo de ente")
ok("ressalva_editorial" in dados and "truncado" in dados, "chaves editoriais presentes")

print()
if falhas:
    print(f"{falhas} falha(s)")
    sys.exit(1)
print("todos os testes passaram")
