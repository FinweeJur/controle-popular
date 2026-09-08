"""etl.apis.cnes_aberto — download CNES estabelecimentos via download bulk.

Fonte: https://dadosabertos.saude.gov.br/dataset/cnes-cadastro-nacional-de-estabelecimentos-de-saude
Download: s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/CNES/cnes_estabelecimentos_json.zip

O arquivo ZIP contem TODOS os estabelecimentos do Brasil em JSON (~200MB descompactado).
O script baixa, extrai em memoria e filtra por codigo_municipio.

Saida: apps/web/data/cnes-estabelecimentos-{id_municipio}.json

Uso:
  python -m etl.apis.cnes_aberto --id-municipio 3106705
  python -m etl.apis.cnes_aberto --id-municipio 3106705 --json
"""
import argparse
import io
import json
import os
import sys
import zipfile
from datetime import datetime, timezone

import requests

USER_AGENT = "ControlePopular/1.0 (coletor publico; contato: controlepopular@controlepopular.com.br)"
BULK_URL = "https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/CNES/cnes_estabelecimentos_json.zip"


def _baixar_e_filtrar(id_municipio: str) -> list[dict]:
    """Baixa o ZIP bulk e filtra estabelecimentos do municipio."""
    id_6 = id_municipio[:6]

    print(f"[cnes_aberto] baixando {BULK_URL} (pode demorar)...")
    r = requests.get(BULK_URL, headers={"User-Agent": USER_AGENT}, timeout=600, stream=True)
    r.raise_for_status()

    ZIP_bytes = io.BytesIO()
    total = 0
    for chunk in r.iter_content(chunk_size=1024 * 1024):
        ZIP_bytes.write(chunk)
        total += len(chunk)
        if total % (10 * 1024 * 1024) == 0:
            print(f"[cnes_aberto] baixado {total / 1024 / 1024:.0f} MB...")

    print(f"[cnes_aberto] total baixado: {total / 1024 / 1024:.1f} MB")

    ZIP_bytes.seek(0)
    filtrados = []

    with zipfile.ZipFile(ZIP_bytes) as zf:
        nomes = zf.namelist()
        print(f"[cnes_aberto] arquivos no ZIP: {nomes}")

        for nome in nomes:
            if not nome.endswith(".json"):
                continue
            print(f"[cnes_aberto] processando {nome}...")
            with zf.open(nome) as f:
                dados = json.loads(f.read())

            if isinstance(dados, dict) and "estabelecimentos" in dados:
                estab_list = dados["estabelecimentos"]
            elif isinstance(dados, list):
                estab_list = dados
            else:
                continue

            for estab in estab_list:
                cod_mun = str(estab.get("codigo_municipio", "")).strip()
                if cod_mun.startswith(id_6) or cod_mun == id_municipio:
                    filtrados.append(estab)

    return filtrados


def normalizar(estab: dict) -> dict:
    """Normaliza os campos da API para o formato do portal."""
    return {
        "id_cnes": str(estab.get("codigo_cnes", "")),
        "cnpj": estab.get("numero_cnpj_entidade", ""),
        "nome": estab.get("nome_fantasia", "") or estab.get("nome_razao_social", ""),
        "razao_social": estab.get("nome_razao_social", ""),
        "tipo": estab.get("codigo_tipo_unidade"),
        "esfera": estab.get("descricao_esfera_administrativa", ""),
        "gestao": estab.get("tipo_gestao", ""),
        "natureza": estab.get("descricao_natureza_juridica_estabelecimento", ""),
        "cod_ibge": str(estab.get("codigo_municipio", "")),
        "uf": estab.get("codigo_uf"),
        "bairro": estab.get("bairro_estabelecimento", ""),
        "logradouro": estab.get("endereco_estabelecimento", ""),
        "numero": estab.get("numero_estabelecimento", ""),
        "cep": estab.get("codigo_cep_estabelecimento", ""),
        "telefone": estab.get("numero_telefone_estabelecimento", ""),
        "email": estab.get("endereco_email_estabelecimento", ""),
        "lat": estab.get("latitude_estabelecimento_decimo_grau"),
        "lng": estab.get("longitude_estabelecimento_decimo_grau"),
        "turno": estab.get("descricao_turno_atendimento", ""),
        "tem_cirurgico": estab.get("estabelecimento_possui_centro_cirurgico", 0) == 1,
        "tem_obstetrico": estab.get("estabelecimento_possui_centro_obstetrico", 0) == 1,
        "tem_neonatal": estab.get("estabelecimento_possui_centro_neonatal", 0) == 1,
        "tem_hospitalar": estab.get("estabelecimento_possui_atendimento_hospitalar", 0) == 1,
        "tem_ambulatorial_sus": estab.get("estabelecimento_faz_atendimento_ambulatorial_sus", "NAO") == "SIM",
    }


def main():
    parser = argparse.ArgumentParser(description="Coleta CNES via download bulk")
    parser.add_argument("--id-municipio", required=True, help="Codigo IBGE de 7 digitos")
    parser.add_argument("--json", action="store_true", help="Salvar JSON em apps/web/data/")
    args = parser.parse_args()

    print(f"[cnes_aberto] municipio={args.id_municipio}")
    raw = _baixar_e_filtrar(args.id_municipio)
    print(f"[cnes_aberto] filtrados={len(raw)}")

    estab = [normalizar(e) for e in raw]
    print(f"[cnes_aberto] normalizados={len(estab)}")

    if not estab:
        print("[cnes_aberto] nenhum estabelecimento encontrado")
        return

    if args.json:
        raiz = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
        caminho = os.path.join(raiz, "apps", "web", "data", f"cnes-estabelecimentos-{args.id_municipio}.json")
        os.makedirs(os.path.dirname(caminho), exist_ok=True)
        pacote = {
            "fonte": "cnes-dados-abertos-sus",
            "municipio": args.id_municipio,
            "total": len(estab),
            "estabelecimentos": estab,
            "coletadoEm": datetime.now(timezone.utc).isoformat(),
        }
        tmp = caminho + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(pacote, f, ensure_ascii=False, indent=2)
        os.replace(tmp, caminho)
        print(f"[cnes_aberto] JSON salvo: {len(estab)} estabelecimentos em {caminho}")
        return

    for e in estab[:5]:
        print(json.dumps(e, ensure_ascii=False)[:200])
    print(f"[cnes_aberto] total={len(estab)}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as e:
        print(f"[cnes_aberto] ABORT: {e}", file=sys.stderr)
        sys.exit(1)
