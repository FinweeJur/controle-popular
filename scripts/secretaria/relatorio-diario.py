# -*- coding: utf-8 -*-
"""Relatorio diario deterministico da Secretaria (sem LLM por padrao).

Papel no projeto: montar os quatro blocos do relatorio do dono — agenda,
contatos, prazos e sugestoes — a partir de fontes locais, sem chamar modelo
nenhum. O plano completo esta em docs/planos/RELATORIO-DETERMINISTICO.md.

Fonte das regras: AGENTS.md §5.8 (segredo nunca em log), §5.12 (Ollama local)
e §5.15 (soberania: dado pessoal fica na maquina).

Decisoes tecnicas nao triviais:
- Nenhum modelo por padrao: o dado vem pronto; o texto e montado por regra.
- `--revisar` liga uma segunda passada em modelo LOCAL (Ollama) so para
  ritmo e emoji; uma trava de fatos descarta a revisao que perder numero,
  nome, data, e-mail ou telefone.
- WhatsApp indisponivel nao derruba o relatorio: o bloco 2 degrada com aviso
  (medido em 18/10/2026: a lib do WhatsApp Web falhava com erro minificado).
- Saida em UTF-8 na forca, porque o console do Windows nasce em cp1252.

Uso:
    python scripts/secretaria/relatorio-diario.py
    python scripts/secretaria/relatorio-diario.py --json
    python scripts/secretaria/relatorio-diario.py --revisar
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DIR = Path(__file__).resolve().parent
PYTHON = sys.executable
OLLAMA = "http://127.0.0.1:11434"
WHATSAPP = "http://127.0.0.1:8899"
MODELO_LOCAL = "qwen2.5:3b-instruct"

MESES = {
    1: "jan", 2: "fev", 3: "mar", 4: "abr", 5: "mai", 6: "jun",
    7: "jul", 8: "ago", 9: "set", 10: "out", 11: "nov", 12: "dez",
}

# ---------------------------------------------------------------- utilidades


def agora_local() -> dt.datetime:
    """Agora no fuso de Sao Paulo, sem depender de tzdata do sistema."""
    return dt.datetime.now(dt.timezone(dt.timedelta(hours=-3)))


def quando(iso: str) -> str:
    """Converte ISO ou data RFC-2822 (cabecalho Date do Gmail) em 'DD/MM HH:MM'."""
    if not iso:
        return "sem data"
    texto = iso.strip()
    # Cabecalho Date do Gmail vem no formato RFC-2822 ("Sun, 18 Oct 2026 ...").
    try:
        from email.utils import parsedate_to_datetime

        d = parsedate_to_datetime(texto)
        if d is not None:
            d = d.astimezone(dt.timezone(dt.timedelta(hours=-3)))
            return f"{d.day:02d}/{d.month:02d} {d.hour:02d}:{d.minute:02d}"
    except (TypeError, ValueError):
        pass
    try:
        d = dt.datetime.fromisoformat(texto.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=dt.timezone.utc)
        d = d.astimezone(dt.timezone(dt.timedelta(hours=-3)))
        return f"{d.day:02d}/{d.month:02d} {d.hour:02d}:{d.minute:02d}"
    except ValueError:
        return "sem data"


def separar_remetente(de: str) -> tuple[str, str]:
    """'Maria Souza <m@x.com>' vira ('Maria Souza', 'm@x.com')."""
    m = re.match(r"\s*(.*?)\s*<([^>]+)>\s*$", de or "")
    if m:
        return (m.group(1).strip().strip('"') or m.group(2), m.group(2).strip())
    return (de.strip(), de.strip())


# Remetente automatico nao e "quem procurou o dono": boletim, aviso, robô.
RE_BULK = re.compile(
    r"no-?reply|noreply|nao-?responda|naoresponda|notify|newsletter|bounce|"
    r"mailer-daemon|accounts@|push|@google\.com|@proton\.me|@hotmart\.com|"
    r"@substack|@mailchimp|@sendgrid|@jus\.br|pje@",
    re.I,
)


def eh_pessoa(de: str) -> bool:
    """Diz se o remetente parece gente. Filtra robo e boletim."""
    _, email = separar_remetente(de)
    return not RE_BULK.search(email or de)


def resumo(texto: str, limite: int = 120) -> str:
    """Primeira frase util, cortada no limite. Sem opiniao, sem acrescimo."""
    limpo = re.sub(r"\s+", " ", (texto or "")).strip()
    if not limpo:
        return "sem texto"
    corte = re.split(r"(?<=[.!?])\s", limpo)[0]
    return corte[:limite] + ("..." if len(corte) > limite else "")


def primeiro_nome(nome: str) -> str:
    """'Maria Souza <m@x.com>' vira 'Maria'. Serve para a proposta de resposta."""
    base = re.split(r"[<@]", nome or "")[0].strip()
    return (base.split(" ")[0] or "tudo bem") if base else "tudo bem"


def proposta(texto: str, nome: str) -> str:
    """Rascunho por regra fixa. Nunca promete o que o dono nao disse."""
    t = (texto or "").lower()
    quem = primeiro_nome(nome)
    if any(p in t for p in ("pagamento", "vencimento", "fatura", "boleto", "pix")):
        return f"Oi {quem}, recebi. Confirmo o pagamento e te aviso quando estiver feito."
    if any(p in t for p in ("reuniao", "reunião", "convite", "agenda", "call")):
        return f"Oi {quem}, recebi o convite. Confirmo presenca e me organizo."
    if any(p in t for p in ("urgente", "hoje", "agora", "prazo")):
        return f"Oi {quem}, vi sua mensagem e ja estou olhando isso."
    if "?" in (texto or "") or any(p in t for p in ("quando", "como", "qual", "quanto")):
        return f"Oi {quem}, recebi sua mensagem. Verifico e te respondo hoje."
    return f"Oi {quem}, recebi sua mensagem. Respondo em breve."


# ------------------------------------------------------------------- coletas


def coletar_google(dias: int, limite: int) -> list[dict]:
    """Chama o coletor existente e devolve a lista de contas (ou erro)."""
    script = DIR / "coletar-google.py"
    ambiente = dict(os.environ, PYTHONIOENCODING="utf-8")
    try:
        saida = subprocess.run(
            [PYTHON, str(script), "--dias", str(dias), "--limite-email", str(limite)],
            capture_output=True, text=True, encoding="utf-8", env=ambiente, timeout=180,
        )
        if saida.returncode != 0:
            return [{"conta": "?", "erro": (saida.stderr or "").strip()[:200]}]
        return json.loads(saida.stdout or "[]")
    except (subprocess.SubprocessError, ValueError) as erro:
        return [{"conta": "?", "erro": f"coletor falhou: {erro}"}]


def coletar_whatsapp(horas: int = 24) -> tuple[list[dict], str]:
    """Le o servico local. Devolve (conversas, aviso)."""
    try:
        with urllib.request.urlopen(f"{WHATSAPP}/conversas?horas={horas}", timeout=60) as r:
            dados = json.loads(r.read().decode("utf-8"))
        return dados.get("conversas", []), dados.get("aviso", "")
    except (urllib.error.URLError, ValueError) as erro:
        return [], f"servico fora do ar ({erro})"


def ler_prazos() -> list[dict]:
    """Prazos do arquivo local, ordenados por data."""
    arquivo = DIR / "prazos.json"
    if not arquivo.exists():
        return []
    try:
        dados = json.loads(arquivo.read_text(encoding="utf-8"))
    except ValueError:
        return []
    prazos = [p for p in dados.get("prazos", []) if p.get("data")]
    prazos.sort(key=lambda p: p.get("data", ""))
    return prazos


# ------------------------------------------------------------------ montagem


def bloco_agenda(contas: list[dict]) -> list[str]:
    linhas = ["📅 AGENDA — hoje e os proximos 7 dias"]
    achou = False
    for conta in contas:
        if conta.get("erro"):
            linhas.append(f"⚠️ conta {conta.get('conta')}: {conta['erro']}")
            continue
        for ev in conta.get("agenda", {}).get("proximos", []):
            achou = True
            partes = [quando(ev.get("inicio", "")), ev.get("titulo", "(sem titulo)")]
            partes.append(f"📍 {ev['local']}" if ev.get("local") else "📍 sem endereco")
            if ev.get("link"):
                partes.append(f"🔗 {ev['link']}")
            linhas.append("• " + " · ".join(partes))
    if not achou:
        linhas.append("• sem dado · agenda vazia")
    return linhas


def bloco_contatos(contas: list[dict], conversas: list[dict], aviso: str) -> list[str]:
    linhas = ["📩 CONTATOS — quem procurou voce"]
    achou = False
    for conversa in conversas:
        achou = True
        nome = conversa.get("nome", "sem nome")
        numero = conversa.get("numero", "")
        hora = quando(conversa.get("ultima_hora", ""))
        texto = conversa.get("ultimo_trecho", "")
        linhas.append(f"• {nome} · 💬 {numero} · {hora} · {resumo(texto)}")
        linhas.append(f"  💡 {proposta(texto, nome)}")
    for conta in contas:
        if conta.get("erro"):
            continue
        vistos = set()
        for mail in conta.get("emails", []):
            de = mail.get("de", "")
            assunto = mail.get("assunto", "")
            if not eh_pessoa(de):
                continue
            chave = (de.lower(), assunto.lower())
            if chave in vistos:
                continue
            vistos.add(chave)
            achou = True
            nome, email = separar_remetente(de)
            marca = " · nao lido" if mail.get("nao_lido") else ""
            linhas.append(
                f"• {nome} · ✉️ {email} · {quando(mail.get('data', ''))} · "
                f"{resumo(assunto)}{marca}"
            )
            linhas.append(f"  💡 {proposta(assunto, nome)}")
    if aviso:
        linhas.append(f"⚠️ WhatsApp indisponivel: {aviso}")
    if not achou:
        linhas.append("• sem dado · ninguem novo nas ultimas 24h")
    return linhas


def bloco_prazos(prazos: list[dict]) -> list[str]:
    linhas = ["⏰ PRAZOS — vencem em ate 7 dias"]
    hoje = agora_local().date()
    limite = hoje + dt.timedelta(days=7)
    achou = False
    for prazo in prazos:
        try:
            data = dt.date.fromisoformat(prazo["data"])
        except ValueError:
            continue
        if data > limite:
            continue
        achou = True
        dias = (data - hoje).days
        quando_txt = "hoje" if dias == 0 else ("amanha" if dias == 1 else f"em {dias} dias")
        fogo = " 🔥" if dias <= 1 else ""
        valor = f" · 💰 {prazo['valor']}" if prazo.get("valor") else ""
        linhas.append(
            f"• {data.day:02d}/{data.month:02d} ({quando_txt}){fogo} · "
            f"{prazo.get('titulo', '(sem titulo)')}{valor}"
        )
    if not achou:
        linhas.append("• sem dado · nada vence nos proximos 7 dias")
    return linhas


def bloco_sugestoes(contas: list[dict], conversas: list[dict], prazos: list[dict]) -> list[str]:
    linhas = ["💡 SUGESTOES"]
    total = 0
    ja_sugerido: set[str] = set()

    def vale(nome: str) -> bool:
        chave = (nome or "").strip().lower()
        if not chave or chave in ja_sugerido:
            return False
        ja_sugerido.add(chave)
        return True

    for conversa in conversas[:2]:
        nome = conversa.get("nome", "contato")
        if vale(nome):
            total += 1
            linhas.append(f"• Responder {nome} no WhatsApp.")
    for conta in contas:
        for mail in conta.get("emails", []):
            if not mail.get("nao_lido") or not eh_pessoa(mail.get("de", "")):
                continue
            nome, _ = separar_remetente(mail.get("de", ""))
            if total < 3 and vale(nome):
                total += 1
                linhas.append(f"• Responder {nome} no Gmail.")
    hoje = agora_local().date()
    for prazo in prazos:
        try:
            data = dt.date.fromisoformat(prazo["data"])
        except ValueError:
            continue
        if (data - hoje).days <= 3 and total < 4:
            total += 1
            linhas.append(f"• Confirmar {prazo.get('titulo', 'prazo')} ({data.day:02d}/{data.month:02d}).")
    if total == 0:
        linhas.append("• sem dado · nada pedindo acao agora")
    return linhas


def revisar(texto: str) -> tuple[str, str]:
    """Segunda passada opcional em modelo local. Devolve (texto, nota).

    A trava de fatos e dura: se a revisao perder numero, data, e-mail ou
    telefone do original, ela e descartada e vale o original.
    """
    instrucao = (
        "Reescreva o relatorio abaixo mantendo TODOS os fatos.\n"
        "Regras: quebra de linha por item; frases de ate 13 palavras; ordem\n"
        "sujeito-verbo-objeto; emoji ligado ao tema; portugues do Brasil correto.\n"
        "PROIBIDO: mudar numero, nome, data, hora, endereco, valor ou e-mail;\n"
        "inventar fato; opinar; acrescentar item. Responda so o relatorio.\n\n"
    )
    corpo = json.dumps(
        {
            "model": MODELO_LOCAL,
            "messages": [{"role": "user", "content": instrucao + texto}],
            "stream": False,
            "options": {"temperature": 0, "num_predict": 700},
        }
    ).encode("utf-8")
    pedido = urllib.request.Request(
        f"{OLLAMA}/api/chat", data=corpo, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(pedido, timeout=300) as r:
            dados = json.loads(r.read().decode("utf-8"))
        revisado = (dados.get("message", {}).get("content") or "").strip()
    except (urllib.error.URLError, ValueError):
        return texto, "revisao indisponivel: valendo o original"
    if not revisado:
        return texto, "revisao vazia: valendo o original"
    # Trava de fatos: todo numero, data, e-mail e telefone precisa reaparecer.
    padrao = r"\d{1,2}/\d{1,2}|\d{1,2}:\d{2}|[\w.+-]+@[\w-]+\.[\w.]+|\+?\d{10,}"
    antes = set(re.findall(padrao, texto))
    depois = set(re.findall(padrao, revisado))
    faltando = antes - depois
    if faltando:
        return texto, f"revisao descartada: perdeu {len(faltando)} fato(s)"
    return revisado, f"revisado por {MODELO_LOCAL}"


def montar(dias: int, limite_email: int) -> dict:
    contas = coletar_google(dias, limite_email)
    conversas, aviso = coletar_whatsapp()
    prazos = ler_prazos()
    linhas: list[str] = []
    linhas += bloco_agenda(contas)
    linhas.append("")
    linhas += bloco_contatos(contas, conversas, aviso)
    linhas.append("")
    linhas += bloco_prazos(prazos)
    linhas.append("")
    linhas += bloco_sugestoes(contas, conversas, prazos)
    linhas.append("")
    linhas.append(f"Leitura: {quando(agora_local().isoformat())} · fontes: Gmail, Agenda, WhatsApp")
    return {
        "linhas": linhas,
        "texto": "\n".join(linhas),
        "contas": len([c for c in contas if not c.get("erro")]),
        "conversas": len(conversas),
        "prazos": len(prazos),
        "aviso_whatsapp": aviso,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Relatorio diario deterministico da Secretaria.")
    parser.add_argument("--dias", type=int, default=7)
    parser.add_argument("--limite-email", type=int, default=20)
    parser.add_argument("--json", action="store_true", help="saida maquina-legivel")
    parser.add_argument("--revisar", action="store_true", help="segunda passada em modelo local")
    args = parser.parse_args()

    relatorio = montar(args.dias, args.limite_email)
    nota = ""
    if args.revisar:
        relatorio["texto"], nota = revisar(relatorio["texto"])
        relatorio["revisao"] = nota

    if args.json:
        print(json.dumps(relatorio, ensure_ascii=False, indent=2))
    else:
        print(relatorio["texto"])
        if nota:
            print(f"\n({nota})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
