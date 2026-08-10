"""Canário de limites — Neon, Cloudflare e disponibilidade real do site.

Rodar: `python .github/scripts/canario_limites.py`
(no CI: `.github/workflows/canario-limites.yml`, cron de 4/4h)

POR QUE ISTO EXISTE: nem Cloudflare nem Neon alertam nos planos free. O
plano da migração aceita o site CAIR em vez de gerar fatura — mas só com
notificação. Sem este canário, descobrir o teto significa descobrir pelo
site fora do ar.

O QUE ELE NÃO FAZ: adivinhar. Cada checagem que não consegue dado real diz
"indisponível" em vez de reportar 0% — um canário que informa "tudo bem"
porque a chave estava errada é pior que não ter canário (a mesma lição do
verificador de alucinação do Congresso: falso alarme, ou falsa calma,
ensina a ignorar a métrica).
"""
import json
import os
import sys
import urllib.parse

import requests

LIMIAR = 0.70  # alerta em 70% de qualquer teto

# Tetos dos planos free, das fontes primárias (ver tabela do plano).
NEON_CU_H_MES = 100.0
NEON_STORAGE_BYTES = 0.5 * 1024**3
# Confirmado pela própria API (`branch_logical_size_limit_bytes` = 536870912).
NEON_EGRESS_BYTES_MES = 5 * 10**9
CF_REQ_DIA = 100_000

TIMEOUT = 30


def _pct(usado: float, teto: float) -> float:
    return 0.0 if teto <= 0 else usado / teto


class Achados:
    def __init__(self) -> None:
        self.alertas: list[str] = []
        self.infos: list[str] = []
        self.indisponiveis: list[str] = []

    def medir(self, nome: str, usado: float, teto: float, unidade: str) -> None:
        p = _pct(usado, teto)
        linha = f"{nome}: {usado:.4g}/{teto:.4g} {unidade} ({p:.0%})"
        (self.alertas if p >= LIMIAR else self.infos).append(linha)

    def sem_dado(self, nome: str, motivo: str) -> None:
        self.indisponiveis.append(f"{nome}: {motivo}")


def checar_neon(a: Achados) -> None:
    chave = os.environ.get("NEON_API_KEY")
    projeto = os.environ.get("NEON_PROJECT_ID")
    if not chave or not projeto:
        a.sem_dado("Neon", "NEON_API_KEY/NEON_PROJECT_ID ausentes")
        return
    try:
        r = requests.get(
            f"https://console.neon.tech/api/v2/projects/{projeto}",
            headers={"Authorization": f"Bearer {chave}", "Accept": "application/json"},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        proj = r.json().get("project", {})
    except Exception as e:  # rede, 401, JSON inesperado
        a.sem_dado("Neon", f"{type(e).__name__}: {e}")
        return

    # Nomes de campo conferidos contra a resposta real na primeira execução;
    # se a API mudar, cai em "indisponível" em vez de reportar 0%.
    storage = proj.get("synthetic_storage_size")
    if isinstance(storage, (int, float)):
        a.medir("Neon storage", float(storage), NEON_STORAGE_BYTES, "bytes")
    else:
        a.sem_dado("Neon storage", "campo synthetic_storage_size ausente")

    consumo = proj.get("compute_time_seconds")
    if isinstance(consumo, (int, float)):
        # CU-h: a franquia é medida em compute-hours; segundos/3600.
        a.medir("Neon compute", float(consumo) / 3600.0, NEON_CU_H_MES, "CU-h")
    else:
        a.sem_dado("Neon compute", "campo compute_time_seconds ausente")

    # EGRESS é, de longe, a métrica mais perto do teto neste projeto, e por
    # pouco não ficou de fora deste canário: na primeira medição real
    # (2026-07-30) storage estava em 16% e compute em 2%, mas o egress em
    # **90,6%** — porque cada `next build` lê o banco inteiro para
    # pré-renderizar ~486 páginas, e num dia de migração isso roda muitas
    # vezes. Vigiar só storage/compute daria "tudo verde" no dia em que o
    # site parasse.
    egresso = proj.get("data_transfer_bytes")
    if isinstance(egresso, (int, float)):
        a.medir("Neon egress", float(egresso), NEON_EGRESS_BYTES_MES, "bytes")
    else:
        a.sem_dado("Neon egress", "campo data_transfer_bytes ausente")


def checar_cloudflare(a: Achados) -> None:
    token = os.environ.get("CLOUDFLARE_API_TOKEN")
    conta = os.environ.get("CLOUDFLARE_ACCOUNT_ID")
    if not token or not conta:
        a.sem_dado("Cloudflare", "CLOUDFLARE_API_TOKEN/ACCOUNT_ID ausentes")
        return

    # GraphQL Analytics: requisições do Worker nas últimas 24h.
    consulta = """
    query($conta: String!, $desde: Time!) {
      viewer {
        accounts(filter: {accountTag: $conta}) {
          workersInvocationsAdaptive(limit: 10000, filter: {datetime_geq: $desde}) {
            sum { requests errors }
          }
        }
      }
    }
    """
    from datetime import datetime, timedelta, timezone

    desde = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        r = requests.post(
            "https://api.cloudflare.com/client/v4/graphql",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={"query": consulta, "variables": {"conta": conta, "desde": desde}},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        corpo = r.json()
        if corpo.get("errors"):
            a.sem_dado("Cloudflare", f"GraphQL: {json.dumps(corpo['errors'])[:200]}")
            return
        contas = corpo["data"]["viewer"]["accounts"]
        if not contas:
            a.sem_dado("Cloudflare", "conta não retornada (token sem escopo de analytics?)")
            return
        linhas = contas[0]["workersInvocationsAdaptive"]
    except Exception as e:
        a.sem_dado("Cloudflare", f"{type(e).__name__}: {e}")
        return

    requisicoes = sum(l["sum"]["requests"] for l in linhas)
    erros = sum(l["sum"]["errors"] for l in linhas)
    a.medir("Cloudflare req/24h", float(requisicoes), float(CF_REQ_DIA), "req")
    if erros:
        a.alertas.append(f"Cloudflare: {erros} invocações com erro nas últimas 24h")


def sondar_urls(a: Achados) -> None:
    """Um GET em cada URL. 1027 (limite diário) e 1102 (CPU) só aparecem em
    requisição real — nenhuma API de consumo os reporta."""
    brutas = os.environ.get("URLS_SONDA", "").strip()
    if not brutas:
        a.sem_dado("Sonda HTTP", "variable URLS_SONDA não configurada")
        return
    for url in [u.strip() for u in brutas.replace("\n", ",").split(",") if u.strip()]:
        try:
            r = requests.get(url, timeout=TIMEOUT, allow_redirects=True)
        except Exception as e:
            a.alertas.append(f"Sonda {url}: {type(e).__name__}: {e}")
            continue
        texto = r.text[:4000]
        if r.status_code >= 500 or "Error 1027" in texto or "Error 1102" in texto:
            codigo = "1027" if "1027" in texto else ("1102" if "1102" in texto else str(r.status_code))
            a.alertas.append(f"Sonda {url}: FORA DO AR (indício {codigo})")
        elif r.status_code >= 400:
            a.alertas.append(f"Sonda {url}: HTTP {r.status_code}")
        else:
            a.infos.append(f"Sonda {url}: HTTP {r.status_code} ok")


def avisar(mensagem: str) -> bool:
    """Telegram. Devolve False se não estiver configurado — o chamador então
    falha o job, para o e-mail de falha do GitHub servir de alerta."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        return False
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat, "text": mensagem, "disable_web_page_preview": True},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        return True
    except Exception as e:
        print(f"[canario] falha ao enviar Telegram: {type(e).__name__}: {e}", file=sys.stderr)
        return False


def main() -> int:
    a = Achados()
    # `checar_neon` NÃO é chamada desde 2026-08-10, e a ausência é deliberada:
    # o banco saiu da Neon e virou o Postgres da máquina de build. A função
    # fica no arquivo porque a lógica está certa e volta a valer se um banco
    # gerenciado voltar — mas chamá-la hoje seria pior que inútil.
    #
    # Sem projeto na Neon ela cai em `sem_dado`, e `sem_dado` dispara alerta de
    # "canário cego" (linha 216) — de 4 em 4 horas, para sempre. Seriam seis
    # avisos por dia sobre um sistema que não existe, e é exatamente assim que
    # se ensina alguém a ignorar o canário. O que o canário ainda vigia de
    # verdade — Cloudflare e o site no ar — continua abaixo.
    checar_cloudflare(a)
    sondar_urls(a)

    for linha in a.infos:
        print(f"[ok]    {linha}")
    for linha in a.indisponiveis:
        print(f"[?]     {linha}")
    for linha in a.alertas:
        print(f"[ALERTA] {linha}")

    if not a.alertas and not a.indisponiveis:
        return 0

    partes = []
    if a.alertas:
        partes.append("⚠️ Controle Popular — limite/disponibilidade:\n" + "\n".join(a.alertas))
    if a.indisponiveis:
        # Indisponível NÃO é "tudo bem": é o canário cego. Ele avisa também.
        partes.append("Sem dado (canário cego nestes pontos):\n" + "\n".join(a.indisponiveis))
    mensagem = "\n\n".join(partes)

    enviado = avisar(mensagem)
    if not enviado:
        print(
            "\n[canario] alerta NÃO entregue (Telegram ausente ou falhou) — "
            "falhando o job de propósito, para o e-mail de falha do GitHub "
            "virar o canal de último recurso.",
            file=sys.stderr,
        )
        return 1

    # Entregue: o job passa, mesmo com alerta real.
    #
    # Deliberado, e a primeira execução no CI mostrou por quê: o egress em 91%
    # é um alerta legítimo que vai durar dias, e falhar o job por causa dele
    # deixaria a aba Actions permanentemente vermelha. Vermelho constante vira
    # papel de parede — a mesma razão pela qual um verificador de alucinação
    # com falso positivo ensina a ignorar a métrica.
    #
    # Assim o vermelho fica reservado para o que ninguém mais avisaria: o
    # canário parou de conseguir medir. O alerta de negócio vive no Telegram,
    # que é onde ele é lido.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
