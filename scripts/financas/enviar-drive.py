# -*- coding: utf-8 -*-
"""Envia nota fiscal ou planilha para o Google Drive, com escopo minimo.

Papel no projeto: parte final do fluxo de documentos do bot Financas
(Trenzim): o arquivo e guardado LOCAL primeiro; o Drive recebe depois, com
aprovacao do dono. Plano em docs/planos/BOT-FINANCAS-TRENZIM.md.

Fonte das regras: AGENTS.md 5.8 (segredo nunca em log) e o plano do Trenzim.

Decisoes tecnicas nao triviais:
- Escopo `drive.file`: o app enxerga apenas o que ele mesmo criou. Nao le a
  vida inteira do Drive do dono.
- Cria (ou reusa) a pasta "Trenzim" no Drive e sobe o arquivo dentro dela.
- O token fica fora do repositorio, em .config/mausbot/google.
- Nada e impresso alem do nome do arquivo e do link.

Uso:
    python scripts/financas/enviar-drive.py nota.jpg
    python scripts/financas/enviar-drive.py planilha.csv --pasta Trenzim/2026-10
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PASTA_TOKENS = Path(os.environ.get("USERPROFILE", ".")) / ".config" / "mausbot" / "google"
PASTA_PADRAO = "Trenzim"


def servico(token: Path):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    cred = Credentials.from_authorized_user_file(str(token))
    return build("drive", "v3", credentials=cred)


def achar_ou_criar(drive, caminho_pasta: str) -> str:
    """Devolve o id da pasta, criando cada nivel que faltar."""
    pai = "root"
    for parte in [p for p in caminho_pasta.split("/") if p]:
        consulta = (
            f"name = '{parte}' and mimeType = 'application/vnd.google-apps.folder' "
            f"and '{pai}' in parents and trashed = false"
        )
        achados = drive.files().list(q=consulta, fields="files(id)", spaces="drive").execute().get("files", [])
        if achados:
            pai = achados[0]["id"]
        else:
            criada = (
                drive.files()
                .create(
                    body={"name": parte, "mimeType": "application/vnd.google-apps.folder", "parents": [pai]},
                    fields="id",
                )
                .execute()
            )
            pai = criada["id"]
    return pai


def enviar(caminho: Path, pasta: str) -> dict:
    from googleapiclient.http import MediaFileUpload

    token = PASTA_TOKENS / "token-pessoal.json"
    if not token.exists():
        raise FileNotFoundError(f"token do Google ausente em {token}")
    drive = servico(token)
    destino = achar_ou_criar(drive, pasta)
    midia = MediaFileUpload(str(caminho), resumable=False)
    arquivo = (
        drive.files()
        .create(body={"name": caminho.name, "parents": [destino]}, media_body=midia, fields="id, webViewLink")
        .execute()
    )
    return {"id": arquivo.get("id"), "link": arquivo.get("webViewLink"), "pasta": pasta}


def main() -> int:
    parser = argparse.ArgumentParser(description="Envia arquivo para o Google Drive (escopo drive.file).")
    parser.add_argument("arquivo", help="arquivo local a enviar")
    parser.add_argument("--pasta", default=PASTA_PADRAO, help=f"pasta no Drive (padrao {PASTA_PADRAO})")
    args = parser.parse_args()

    caminho = Path(args.arquivo)
    if not caminho.exists():
        print(f"arquivo nao encontrado: {caminho}", file=sys.stderr)
        return 2
    try:
        resultado = enviar(caminho, args.pasta)
    except (FileNotFoundError, RuntimeError) as erro:
        print(f"falha no envio: {erro}", file=sys.stderr)
        return 2
    except Exception as erro:  # noqa: BLE001 - queremos o motivo no stderr
        print(f"falha no envio ({type(erro).__name__}): {erro}", file=sys.stderr)
        return 2
    print(f"✅ {caminho.name} enviado para {resultado['pasta']}")
    if resultado.get("link"):
        print(f"🔗 {resultado['link']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
