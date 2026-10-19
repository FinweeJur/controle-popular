# -*- coding: utf-8 -*-
"""Caderno local de tarefas e prazos da Secretaria, offline e nativo.

Papel no projeto: as tarefas nao vem so do Google Tasks. Chegam por mensagem
no WhatsApp, no Telegram, por e-mail ou digitadas a mao — e sao registradas
AQUI, no PC, sem nuvem. O relatorio diario le este arquivo junto das Google
Tasks e dos eventos da Agenda.

Fonte das regras: docs/planos/RELATORIO-DETERMINISTICO.md e
docs/planos/PENDENCIAS-AGENTES-19-10.md.

Decisoes tecnicas nao triviais:
- Arquivo unico em .config/mausbot/tarefas.json, fora de qualquer repositorio.
- A data aceita "20/10", "20/10/2026" e "2026-10-20"; sem ano, assume o
  proximo que ainda nao passou (mes vencido cai no ano seguinte).
- Toda tarefa guarda a FONTE (whatsapp, telegram, email, google, manual):
  auditoria de onde o compromisso veio.
- Status: aberta ou feita. Nada e apagado; tarefa feita sai do relatorio.
- Sem LLM: parse de data e de valor e por regra.

Uso:
    python scripts/secretaria/tarefas.py add "pagar luz" --data 20/10 --tipo pagamento --valor 320 --fonte whatsapp
    python scripts/secretaria/tarefas.py list
    python scripts/secretaria/tarefas.py done 3
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import uuid
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

ARQUIVO = Path(os.environ.get("USERPROFILE", ".")) / ".config" / "mausbot" / "tarefas.json"


def carregar() -> list[dict]:
    if not ARQUIVO.exists():
        return []
    try:
        dados = json.loads(ARQUIVO.read_text(encoding="utf-8"))
    except ValueError:
        return []
    return dados.get("tarefas", [])


def gravar(tarefas: list[dict]) -> None:
    ARQUIVO.parent.mkdir(parents=True, exist_ok=True)
    ARQUIVO.write_text(
        json.dumps({"tarefas": tarefas}, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def interpretar_data(bruto: str) -> str:
    """'20/10' vira a proxima ocorrencia de 20/10; '20/10/2026' fica igual."""
    texto = (bruto or "").strip()
    if not texto:
        return ""
    hoje = dt.date.today()
    for formato in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return dt.datetime.strptime(texto, formato).date().isoformat()
        except ValueError:
            continue
    m = re.match(r"^(\d{1,2})[/-](\d{1,2})$", texto)
    if m:
        dia, mes = int(m.group(1)), int(m.group(2))
        ano = hoje.year
        try:
            data = dt.date(ano, mes, dia)
        except ValueError:
            return ""
        if data < hoje:
            try:
                data = dt.date(ano + 1, mes, dia)
            except ValueError:
                return ""
        return data.isoformat()
    return ""


def valor_br(bruto: str) -> float:
    texto = (bruto or "").strip().replace("R$", "").replace(" ", "")
    if not texto:
        return 0.0
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    try:
        return round(float(texto), 2)
    except ValueError:
        return 0.0


def add(args) -> int:
    tarefas = carregar()
    data = interpretar_data(args.data) if args.data else ""
    tarefa = {
        "id": uuid.uuid4().hex[:8],
        "titulo": args.titulo,
        "data": data,
        "tipo": args.tipo,
        "valor": valor_br(args.valor) if args.valor else 0.0,
        "fonte": args.fonte,
        "criado_em": dt.datetime.now().isoformat(timespec="seconds"),
        "status": "aberta",
    }
    tarefas.append(tarefa)
    gravar(tarefas)
    quando = data or "sem data"
    print(f"✅ anotado: {tarefa['titulo']} · {quando} · fonte {tarefa['fonte']} (id {tarefa['id']})")
    return 0


def listar(args) -> int:
    tarefas = [t for t in carregar() if t.get("status") == "aberta"]
    tarefas.sort(key=lambda t: (t.get("data") or "9999", t.get("titulo", "")))
    if not tarefas:
        print("sem tarefas abertas")
        return 0
    hoje = dt.date.today()
    for t in tarefas:
        data = t.get("data") or ""
        marca = ""
        if data:
            try:
                dias = (dt.date.fromisoformat(data) - hoje).days
                marca = "hoje" if dias == 0 else ("amanha" if dias == 1 else f"em {dias} dias")
                if dias < 0:
                    marca = f"atrasada {abs(dias)} dias"
            except ValueError:
                marca = ""
        valor = f" · R$ {t['valor']:.2f}" if t.get("valor") else ""
        print(f"[{t['id']}] {data or 'sem data'} ({marca}) · {t['titulo']}{valor} · fonte {t.get('fonte','')}")
    print(f"\n{len(tarefas)} tarefa(s) aberta(s) · arquivo {ARQUIVO}")
    return 0


def done(args) -> int:
    tarefas = carregar()
    achou = False
    for t in tarefas:
        if t.get("id") == args.id:
            t["status"] = "feita"
            t["feita_em"] = dt.datetime.now().isoformat(timespec="seconds")
            achou = True
    if not achou:
        print(f"tarefa {args.id} nao encontrada", file=sys.stderr)
        return 2
    gravar(tarefas)
    print(f"✅ tarefa {args.id} marcada como feita")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Caderno local de tarefas (offline).")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_add = sub.add_parser("add", help="anota uma tarefa")
    p_add.add_argument("titulo")
    p_add.add_argument("--data", default="")
    p_add.add_argument("--tipo", default="tarefa", choices=["tarefa", "pagamento", "evento"])
    p_add.add_argument("--valor", default="")
    p_add.add_argument("--fonte", default="manual", choices=["manual", "whatsapp", "telegram", "email", "google"])
    p_add.set_defaults(func=add)

    p_list = sub.add_parser("list", help="lista as tarefas abertas")
    p_list.set_defaults(func=listar)

    p_done = sub.add_parser("done", help="marca como feita")
    p_done.add_argument("id")
    p_done.set_defaults(func=done)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
