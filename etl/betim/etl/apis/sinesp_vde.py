"""etl.apis.sinesp_vde — importa o SINESP VDE (BancoVDE) para a tabela
`seguranca_ocorrencias` (já existente desde a migration 0001).

Fonte: SINESP VDE (Vítimas de Eventos Delituosos), download via PowerBI.
Arquivos xlsx na pasta etl/betim/dados/temp/BancoVDE_YYYY.xlsx.

ARMADILHAS:
1. Encoding corrompido no xlsx — acentos viram U+FFFD. Normalizar com
   unicodedata + sem_acento antes de casar com o mapeamento.
2. O xlsx NÃO tem código IBGE — só uf + municipio. Junção via
   apps/web/data/mapeamento_municipios.csv (nome_sem_acento → ibge7).
3. data_referencia vem como datetime — extrair ano/mes.
4. Eventos com "não informado" como município são descartados.
5. Todas as colunas de contagem podem ser None — tratar como 0.
"""
import csv
import os
import sys
import time
import unicodedata

from openpyxl import load_workbook

# ──────────────────────── normalização ────────────────────────


def _sem_acento(s: str) -> str:
    """Remove acentos via NFD — 'Belo Horizonte' → 'Belo Horizonte',
    'ABAETÉ' → 'ABAETE'."""
    nfd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn")


def _normalizar_nome(nome: str) -> str:
    """Normaliza nome de município para casamento com o mapeamento.
    'Abadia dos Dourados/MG' → 'abadia dos dourados'"""
    return _sem_acento(nome).strip().lower()


# ──────────────────────── mapeamento ────────────────────────


def _carregar_mapeamento(raiz: str) -> dict[str, str]:
    """Carrega o CSV de mapeamento → dict nome_sem_acento → ibge7."""
    caminho = os.path.join(raiz, "apps", "web", "data", "mapeamento_municipios.csv")
    mapeamento: dict[str, str] = {}
    with open(caminho, encoding="utf-8") as f:
        for row in csv.reader(f, delimiter="|"):
            if row[0] == "municipio_sem_acento":
                continue
            mapeamento[row[0]] = row[1]
    return mapeamento


# ──────────────────────── leitura xlsx ────────────────────────


def _ler_xlsx(caminho: str) -> list[dict]:
    """Lê um BancoVDE xlsx e retorna lista de dicts normalizados.

    Colunas: uf, municipio, evento, data_referencia, feminino,
    masculino, nao_informado, total_vitima, abrangencia.
    """
    wb = load_workbook(caminho, read_only=True, data_only=True)
    ws = wb.active
    rows: list[dict] = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        if len(row) < 11:
            continue
        uf, municipio, evento, data_ref = row[0], row[1], row[2], row[3]
        feminino = row[7] or 0
        masculino = row[8] or 0
        nao_informado = row[9] or 0
        total_vitima = row[10] or 0
        abrangencia = row[13] if len(row) > 13 else None

        if not uf or uf != "MG":
            continue
        if not municipio or municipio.strip().upper() == "NAO INFORMADO":
            continue
        if not evento:
            continue

        ano = data_ref.year if data_ref else None
        mes = data_ref.month if data_ref else None
        if not ano or not mes:
            continue

        rows.append(
            {
                "uf": uf,
                "municipio_original": (municipio or "").strip(),
                "municipio_norm": _normalizar_nome(municipio or ""),
                "evento": (evento or "").strip(),
                "ano": ano,
                "mes": mes,
                "feminino": int(feminino),
                "masculino": int(masculino),
                "nao_informado": int(nao_informado),
                "total_vitima": int(total_vitima),
                "abrangencia": (abrangencia or "").strip() if abrangencia else None,
            }
        )
    wb.close()
    return rows


# ──────────────────────── join + upsert ────────────────────────


def _preparar_rows(
    rows: list[dict], mapeamento: dict[str, str]
) -> tuple[list[dict], list[dict]]:
    """Junta dados do xlsx com o mapeamento IBGE7.

    Retorna (rows_gravaveis, rows_sem_mapeamento).
    """
    gravaveis = []
    sem_mapeamento = []
    for r in rows:
        ibge7 = mapeamento.get(r["municipio_norm"])
        if not ibge7:
            sem_mapeamento.append(r)
            continue
        gravaveis.append(
            {
                "id_municipio": ibge7,
                "ano": r["ano"],
                "mes": r["mes"],
                "natureza": r["evento"],
                "qtd": r["total_vitima"],
                "feminino": r["feminino"],
                "masculino": r["masculino"],
                "nao_informado": r["nao_informado"],
                "fonte": "sinesp_vde",
            }
        )
    return gravaveis, sem_mapeamento


def _upsert_verificado(client, id_municipio: str, rows: list[dict], rotulo: str) -> int:
    """Upsert com verificação pós-escrita (mesmo padrão de crimes_mg.py)."""
    esperado = len(rows)
    max_tentativas = 4
    for tentativa in range(1, max_tentativas + 1):
        client.table("seguranca_ocorrencias").upsert(
            rows, on_conflict="id_municipio,ano,mes,natureza"
        ).execute()
        resp = (
            client.table("seguranca_ocorrencias")
            .select("id", count="exact")
            .eq("id_municipio", id_municipio)
            .execute()
        )
        if resp.count == esperado:
            return esperado
        print(
            f"[etl.apis.sinesp_vde] {rotulo}: esperava {esperado}, "
            f"achou {resp.count} (tentativa {tentativa}/{max_tentativas})"
        )
        time.sleep(1.5)
    print(
        f"[etl.apis.sinesp_vde] AVISO: {rotulo} ficou com {resp.count}/{esperado}"
    )
    return resp.count if resp else 0


# ──────────────────────── sync ────────────────────────


def sync(dados_dir: str | None = None) -> None:
    """Importa todos os BancoVDE_YYYY.xlsx de dados_dir para o Postgres.

    Parâmetros:
    - dados_dir: pasta com os xlsx. Padrão: etl/betim/dados/temp/.
    """
    from etl.betim.etl.common import get_supabase_client

    raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
    if dados_dir is None:
        dados_dir = os.path.join(raiz, "etl", "betim", "dados", "temp")

    mapeamento = _carregar_mapeamento(raiz)
    print(f"[etl.apis.sinesp_vde] mapeamento: {len(mapeamento)} municipios")

    arquivos = sorted(
        f for f in os.listdir(dados_dir) if f.startswith("BancoVDE") and f.endswith(".xlsx")
    )
    if not arquivos:
        print("[etl.apis.sinesp_vde] nenhum BancoVDE*.xlsx encontrado em", dados_dir)
        return

    client = get_supabase_client()
    total_gravado = 0
    total_sem_map = 0

    for arquivo in arquivos:
        caminho = os.path.join(dados_dir, arquivo)
        print(f"[etl.apis.sinesp_vde] lendo {arquivo}...")
        rows = _ler_xlsx(caminho)
        print(f"[etl.apis.sinesp_vde] {arquivo}: {len(rows)} linhas MG")

        gravaveis, sem_map = _preparar_rows(rows, mapeamento)
        if sem_map:
            nomes_unicos = sorted(set(r["municipio_original"] for r in sem_map))
            print(
                f"[etl.apis.sinesp_vde] {arquivo}: {len(sem_map)} linhas "
                f"sem mapeamento ({len(nomes_unicos)} municipios): "
                f"{nomes_unicos[:5]}"
            )
            total_sem_map += len(sem_map)

        if not gravaveis:
            print(f"[etl.apis.sinesp_vde] {arquivo}: nada para gravar")
            continue

        # Agrupar por id_municipio para upsert com verificação
        por_municipio: dict[str, list[dict]] = {}
        for g in gravaveis:
            por_municipio.setdefault(g["id_municipio"], []).append(g)

        gravado = 0
        for ibge7, grupo in por_municipio.items():
            g = _upsert_verificado(client, ibge7, grupo, f"{arquivo}/{ibge7}")
            gravado += g
            time.sleep(0.5)

        total_gravado += gravado
        print(f"[etl.apis.sinesp_vde] {arquivo}: {gravado} registros gravados")

    print(
        f"[etl.apis.sinesp_vde] TOTAL: {total_gravado} gravados, "
        f"{total_sem_map} sem mapeamento"
    )


def sync_json(dados_dir: str | None = None) -> None:
    """Gera JSON dos dados SINESP VDE sem banco de dados."""
    from datetime import datetime, timezone
    import json

    raiz = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
    if dados_dir is None:
        dados_dir = os.path.join(raiz, "etl", "betim", "dados", "temp")

    mapeamento = _carregar_mapeamento(raiz)
    print(f"[etl.apis.sinesp_vde] mapeamento: {len(mapeamento)} municipios")

    arquivos = sorted(
        f for f in os.listdir(dados_dir) if f.startswith("BancoVDE") and f.endswith(".xlsx")
    )
    if not arquivos:
        print("[etl.apis.sinesp_vde] nenhum BancoVDE*.xlsx encontrado em", dados_dir)
        return

    todos_itens = []
    total_gravado = 0
    total_sem_map = 0

    for arquivo in arquivos:
        caminho = os.path.join(dados_dir, arquivo)
        print(f"[etl.apis.sinesp_vde] lendo {arquivo}...")
        rows = _ler_xlsx(caminho)
        print(f"[etl.apis.sinesp_vde] {arquivo}: {len(rows)} linhas MG")

        gravaveis, sem_map = _preparar_rows(rows, mapeamento)
        if sem_map:
            nomes_unicos = sorted(set(r["municipio_original"] for r in sem_map))
            print(
                f"[etl.apis.sinesp_vde] {arquivo}: {len(sem_map)} linhas "
                f"sem mapeamento ({len(nomes_unicos)} municipios): "
                f"{nomes_unicos[:5]}"
            )
            total_sem_map += len(sem_map)

        if not gravaveis:
            print(f"[etl.apis.sinesp_vde] {arquivo}: nada para gravar")
            continue

        for g in gravaveis:
            g["arquivo_origem"] = arquivo
            todos_itens.append(g)

        total_gravado += len(gravaveis)
        print(f"[etl.apis.sinesp_vde] {arquivo}: {len(gravaveis)} registros preparados")

    caminho_json = os.path.join(raiz, "apps", "web", "data", "sinesp-vde.json")
    os.makedirs(os.path.dirname(caminho_json), exist_ok=True)
    with open(caminho_json, "w", encoding="utf-8") as f:
        json.dump({
            "fonte": "sinesp-vde",
            "itens": todos_itens,
            "geradoEm": datetime.now(timezone.utc).isoformat(),
            "totalRegistros": total_gravado,
            "totalSemMapeamento": total_sem_map,
        }, f, ensure_ascii=False, indent=2)

    print(
        f"[etl.apis.sinesp_vde] TOTAL: {total_gravado} registros, "
        f"{total_sem_map} sem mapeamento → {caminho_json}"
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Importa SINESP VDE (BancoVDE)")
    parser.add_argument(
        "--dados-dir",
        default=None,
        help="Pasta com os xlsx (padrão: etl/betim/dados/temp/)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Gerar JSON sem banco de dados",
    )
    args = parser.parse_args()
    try:
        if args.json:
            sync_json(args.dados_dir)
        else:
            sync(args.dados_dir)
    except Exception as e:
        print(f"[etl.apis.sinesp_vde] ERRO: {e}", file=sys.stderr)
        sys.exit(1)
