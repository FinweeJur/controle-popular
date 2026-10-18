# -*- coding: utf-8 -*-
"""Autenticacao Google (Gmail + Agenda) por conta, para a Secretaria pessoal.

Papel no projeto: dar a UMA bot (a Secretaria) acesso de LEITURA ao Gmail e a
Agenda de duas contas do dono. Nenhum outro bot recebe esse token.

Fonte das regras: AGENTS.md secao 5.8 (nunca expor segredo) e secao 5.15
(soberania: dado pessoal fica nesta maquina).

Decisoes tecnicas nao triviais:
- Escopos minimos: gmail.readonly + gmail.compose (rascunho, nao envio) +
  calendar.readonly. Enviar e-mail continua exigindo card de aprovacao, e
  por isso nao pedimos gmail.send.
- Um arquivo de token por conta, fora de qualquer repositorio, com permissao
  so do usuario (o aplicador de ACL e o setup do dono).
- O cliente OAuth precisa ser do tipo "Desktop app": o fluxo abre o navegador
  local e recebe o codigo em 127.0.0.1.
- Nunca imprime token nem refresh_token; imprime apenas caminho e escopos.

Uso:
    python scripts/secretaria/autenticar-google.py --conta pessoal
    python scripts/secretaria/autenticar-google.py --conta trabalho

Pre-requisito: client_secret.json em C:\\Users\\<voce>\\.config\\mausbot\\google\\
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ESCOPOS = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/calendar.readonly",
]

DIR_PADRAO = Path(os.environ.get("USERPROFILE", ".")) / ".config" / "mausbot" / "google"


def autenticar(conta: str, dir_base: Path) -> int:
    from google_auth_oauthlib.flow import InstalledAppFlow

    cliente = dir_base / "client_secret.json"
    if not cliente.exists():
        print(f"falta o client_secret.json em {dir_base}")
        print("crie um cliente OAuth do tipo Desktop no Google Cloud e salve com esse nome")
        return 2

    destino = dir_base / f"token-{conta}.json"
    flow = InstalledAppFlow.from_client_secrets_file(str(cliente), ESCOPOS)
    credenciais = flow.run_local_server(port=0, prompt="consent")
    destino.write_text(credenciais.to_json(), encoding="utf-8")
    print(f"conta '{conta}': token gravado em {destino}")
    print(f"escopos: {', '.join(ESCOPOS)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="OAuth Google por conta (Gmail + Agenda).")
    parser.add_argument("--conta", required=True, help="rotulo da conta, ex.: pessoal")
    parser.add_argument("--dir", default=str(DIR_PADRAO), help="pasta dos tokens e do client_secret.json")
    args = parser.parse_args()
    return autenticar(args.conta, Path(args.dir))


if __name__ == "__main__":
    sys.exit(main())
