#!/usr/bin/env python3
"""Download CNES health establishment data for MG (UF=31) from official sources."""

import json
import sys
import tempfile
import zipfile
from datetime import datetime
from pathlib import Path

import requests

CNES_URL = "https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/CNES/cnes_estabelecimentos_json.zip"
MG_UF = "31"
OUTPUT = Path(__file__).resolve().parent.parent / "apps" / "web" / "data" / "cnes-mg.json"


def main():
    with tempfile.TemporaryDirectory() as tmp:
        zip_path = Path(tmp) / "cnes.zip"

        print("Downloading ~200 MB from saude.gov.br S3...")
        r = requests.get(CNES_URL, stream=True, timeout=600)
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        written = 0
        with open(zip_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 16):
                f.write(chunk)
                written += len(chunk)
                if total:
                    pct = written / total * 100
                    mb = written / 1048576
                    tmb = total / 1048576
                    print(f"\r  {mb:.0f}/{tmb:.0f} MB ({pct:.0f}%)", end="", flush=True)
        print()

        print("Extracting and filtering CO_UF == '31'...")
        with zipfile.ZipFile(zip_path) as zf:
            with zf.open("cnes_estabelecimentos.json") as f:
                all_records = json.load(f)

        print(f"  Total records: {len(all_records)}")

        mg = [r for r in all_records if str(r.get("CO_UF", "")).strip() == MG_UF]
        print(f"  MG records (CO_UF=31): {len(mg)}")

        if not mg:
            print("ERROR: No MG records found. Aborting.")
            sys.exit(1)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    output = {
        "fonte": "cnes-saude-gov-br",
        "url": CNES_URL,
        "data_coleta": datetime.now().isoformat(),
        "uf": MG_UF,
        "uf_nome": "Minas Gerais",
        "total": len(mg),
        "estabelecimentos": mg,
    }

    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"\nSaved to {OUTPUT}")
    print(f"  Records: {len(mg)}")
    print(f"  File size: {size_kb:.0f} KB")


if __name__ == "__main__":
    main()
