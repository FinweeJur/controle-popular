# -*- coding: utf-8 -*-
"""Coletor Google da Secretaria pessoal: agenda + Gmail, em JSON.

Papel no projeto: entregar a materia-prima do relatorio diario da Secretaria
(AGENTS.md §5.15, degrau local). O bot NAO fala com a API direto: ele chama
este script e resume o JSON.

Fonte das regras: AGENTS.md §5.8 (nunca expor segredo nem dado pessoal bruto).
Por isso o script NUNCA imprime corpo de e-mail nem contato: so remetente,
assunto, data e se esta nao lido.

Decisoes tecnicas nao triviais:
- Um token por conta (token-<conta>.json); o script le todos os que existirem.
- Gmail: janela de 2 dias e fora de Promocoes/Social, para nao afogar o resumo.
- Agenda: eventos de hoje e dos proximos N dias (padrao 7), em ordem de hora.
- Saida em JSON no stdout; erro vai para stderr e devolve codigo 2.

Uso:
    python scripts/secretaria/coletar-google.py
    python scripts/secretaria/coletar-google.py --dias 7 --limite-email 25
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path

DIR_PADRAO = Path.home() / ".config" / "mausbot" / "google"


def _servicos(token: Path):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    cred = Credentials.from_authorized_user_file(str(token))
    return (
        build("gmail", "v1", credentials=cred),
        build("calendar", "v3", credentials=cred),
    )


def _agenda(cal, dias: int) -> dict:
    agora = dt.datetime.now(dt.timezone.utc)
    fim = agora + dt.timedelta(days=dias)
    itens = (
        cal.events()
        .list(
            calendarId="primary",
            timeMin=agora.isoformat(),
            timeMax=fim.isoformat(),
            singleEvents=True,
            orderBy="startTime",
            maxResults=50,
        )
        .execute()
        .get("items", [])
    )
    eventos = []
    for e in itens:
        inicio = e["start"].get("dateTime", e["start"].get("date"))
        eventos.append(
            {
                "inicio": inicio,
                "titulo": e.get("summary", "(sem titulo)"),
                "local": e.get("location", ""),
                "link": e.get("hangoutLink", ""),
            }
        )
    hoje = dt.datetime.now().date().isoformat()
    return {
        "hoje": [e for e in eventos if str(e["inicio"]).startswith(hoje)],
        "proximos": eventos,
    }


def _emails(gmail, limite: int) -> list[dict]:
    consulta = "newer_than:2d -category:promotions -category:social"
    ids = (
        gmail.users()
        .messages()
        .list(userId="me", q=consulta, maxResults=limite)
        .execute()
        .get("messages", [])
    )
    saida = []
    for item in ids:
        msg = (
            gmail.users()
            .messages()
            .get(
                userId="me",
                id=item["id"],
                format="metadata",
                metadataHeaders=["From", "Subject", "Date"],
            )
            .execute()
        )
        cabecalhos = {
            h["name"].lower(): h["value"] for h in msg["payload"].get("headers", [])
        }
        saida.append(
            {
                "de": cabecalhos.get("from", ""),
                "assunto": cabecalhos.get("subject", "(sem assunto)"),
                "data": cabecalhos.get("date", ""),
                "nao_lido": "UNREAD" in msg.get("labelIds", []),
            }
        )
    return saida


def coletar(dir_base: Path, dias: int, limite: int) -> list[dict]:
    relatorios = []
    for token in sorted(dir_base.glob("token-*.json")):
        conta = token.stem.replace("token-", "")
        try:
            gmail, cal = _servicos(token)
            relatorios.append(
                {
                    "conta": conta,
                    "agenda": _agenda(cal, dias),
                    "emails": _emails(gmail, limite),
                }
            )
        except Exception as erro:  # noqa: BLE001 - relatorio precisa seguir
            relatorios.append({"conta": conta, "erro": type(erro).__name__})
    return relatorios


def main() -> int:
    parser = argparse.ArgumentParser(description="Coleta agenda e Gmail para a Secretaria.")
    parser.add_argument("--dir", default=str(DIR_PADRAO), help="pasta dos tokens")
    parser.add_argument("--dias", type=int, default=7, help="janela da agenda em dias")
    parser.add_argument("--limite-email", type=int, default=20, help="maximo de e-mails")
    args = parser.parse_args()

    relatorios = coletar(Path(args.dir), args.dias, args.limite_email)
    if not relatorios:
        print("nenhum token encontrado na pasta", file=sys.stderr)
        return 2
    print(json.dumps(relatorios, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
