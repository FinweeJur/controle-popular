"""Verificador da navegacao com a radio tocando (Controle Popular).

O QUE E ESTE MODULO
-------------------
Script de ponta a ponta no navegador que responde a uma pergunta so:
"o audio do player persistente sobrevive quando o leitor CLICA nos links
do portal?" O player vive no layout raiz (`PlayerRadio` -> `<audio>`), entao
ele so e destruido de dois jeitos: (a) navegacao de pagina inteira (reload),
tipica de `<a href>` interno cru; ou (b) desmontagem do layout. Este script
toca uma estacao em `/radio`, percorre 4 eixos + subfrentes + as 100 paginas
do top-100 clicando nos links e mede o estado do `<audio>` depois de cada
salto.

FONTE DAS ROTAS (nada digitado a mao)
-------------------------------------
- Subfrentes: campo `rotaLegada` de `apps/web/lib/eixos/catalogo.ts`;
- Top-100: coluna `href` de `apps/web/data/top-100-paginas.json`;
- Eixos: hubs de primeiro nivel que espelham as chaves de `CATALOGO_EIXOS`
  (`/terra-e-territorios`, `/direitos-em-movimento`, `/estado-e-economia`,
  `/central`). Sao as quatro pastas de rota de eixo do App Router.

REGRA DE MEDICAO (por que confiar no resultado)
-----------------------------------------------
Depois de cada clique o script confere tres coisas, nesta ordem:
1. o elemento `<audio>` ainda existe? (reload troca o elemento)
2. `!audio.paused`? (reload nasce pausado)
3. `currentTime` avancou entre duas amostras? (stream vivo)
Se as tres falharem juntas, o salto MATOU o audio. A primeira ocorrencia
vira o "primeiro culpado" do relatorio.

DECISOES TECNICAS
-----------------
- Playwright sincrono + Chromium com `--autoplay-policy=no-user-gesture-required`:
  o play nasce de clique real, mas o restart pos-quebra tambem precisa ser
  confiavel; a flag tira o bloqueio de autoplay do navegador.
- O script e o MESMO para baseline (antes da correcao) e reteste (depois):
  o rotulo (`--rotulo baseline|reteste`) so muda o nome do relatorio.
- Se a pagina atual nao tem link para o proximo alvo, o script carrega
  `/indice` (a pagina de indice do site) e clica de la; isso mantem o
  percurso por clique em vez de `page.goto` direto no alvo.
- Audio de stream ao vivo (MP3) demora a encher o buffer; os limites de
  espera sao generosos (90 s de navegacao, 45 s de buffer) de proposito.
- Nada de segredo aqui: o script so le rotas publicas e o .env nao e lido.

SAIDA
-----
- `docs/relatorios-automacao/radio-navegacao-<rotulo>-<AAAA-MM-DD-HHMM>.md`
- o mesmo nome com `.json` (dados crus para comparacao automatica)

USO
---
    python scripts/verificar-radio-navegacao.py --base http://localhost:3047 \
        --rotulo baseline
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from playwright.sync_api import Page, sync_playwright  # noqa: E402

RAIZ = Path(__file__).resolve().parents[1]
ARQUIVO_CATALOGO = RAIZ / "apps/web/lib/eixos/catalogo.ts"
ARQUIVO_TOP100 = RAIZ / "apps/web/data/top-100-paginas.json"
DIR_SAIDA = RAIZ / "docs/relatorios-automacao"

# Hubs de primeiro nivel dos 4 eixos (pastas de rota reais em apps/web/app/).
# O catalogo (`catalogo.ts`) guarda as chaves, nao a URL do hub; por isso a
# lista mora aqui, curta e conferivel contra as pastas.
HUBS_EIXOS = [
    "/terra-e-territorios",
    "/direitos-em-movimento",
    "/estado-e-economia",
    "/central",
]

# Extensoes que NUNCA sao pagina do App Router: arquivo, API ou dados.
# Link para elas fica em `<a>` de proposito e nao entra no percurso.
SUFIXOS_ARQUIVO = (
    ".pdf", ".json", ".csv", ".xml", ".zip", ".png", ".jpg", ".jpeg",
    ".webp", ".svg", ".gif", ".mp3", ".mp4", ".txt", ".xlsx", ".ods",
)

ESTACAO_PADRAO = "radio-brasil-de-fato"
NOME_ESTACAO_PADRAO = "Rádio Brasil de Fato"


def normalizar(caminho: str) -> str:
    """Normaliza um caminho interno para comparacao (tira hash, barra final).

    `/sobre#metodologia/` e `/sobre` viram a mesma chave; `/` fica `/`.
    """
    caminho = caminho.split("#", 1)[0].split("?", 1)[0]
    if len(caminho) > 1 and caminho.endswith("/"):
        caminho = caminho.rstrip("/")
    return caminho or "/"


def ler_subfrentes() -> list[str]:
    """Le os `rotaLegada` unicos do catalogo de eixos, na ordem do arquivo."""
    texto = ARQUIVO_CATALOGO.read_text(encoding="utf-8")
    rotas: list[str] = []
    for bruta in re.findall(r"rotaLegada:\s*'([^']+)'", texto):
        rota = normalizar(bruta)
        if rota not in rotas:
            rotas.append(rota)
    return rotas


def ler_top100() -> list[str]:
    """Le os `href` internos do top-100, na ordem do JSON, sem repetir."""
    dados = json.loads(ARQUIVO_TOP100.read_text(encoding="utf-8"))
    rotas: list[str] = []
    for item in dados:
        href = item.get("href") or ""
        if not href.startswith("/") or href.startswith("//"):
            continue
        rota = normalizar(href)
        if rota not in rotas:
            rotas.append(rota)
    return rotas


def montar_alvos() -> list[tuple[str, str]]:
    """Monta a fila (rota, grupo) na ordem de percurso: eixos, subfrentes, top-100."""
    alvos: list[tuple[str, str]] = []
    vistos: set[str] = set()

    def adicionar(rota: str, grupo: str) -> None:
        rota = normalizar(rota)
        if rota in vistos:
            return
        vistos.add(rota)
        alvos.append((rota, grupo))

    for rota in HUBS_EIXOS:
        adicionar(rota, "eixo")
    for rota in ler_subfrentes():
        adicionar(rota, "subfrente")
    for rota in ler_top100():
        adicionar(rota, "top100")
    return alvos


def abrir_navegador(playwright, cabeado: bool):
    """Abre o Chromium tentando o navegador baixado e, na falta, Edge/Chrome.

    O pacote Python do Playwright pode estar instalado sem o binario
    (`playwright install` nunca rodou). Em vez de exigir download, o script
    cai para o Edge ou o Chrome do sistema — os dois falam o mesmo protocolo
    e servem para este teste. A ordem preserva o Chromium do Playwright
    quando ele existe.
    """
    argumentos = ["--autoplay-policy=no-user-gesture-required", "--mute-audio"]
    erros: list[str] = []
    for extra in ({}, {"channel": "msedge"}, {"channel": "chrome"}):
        try:
            return playwright.chromium.launch(
                headless=not cabeado, args=argumentos, **extra
            )
        except Exception as exc:  # noqa: BLE001 - tentativa seguinte cobre
            erros.append(f"{extra or 'chromium'}: {type(exc).__name__}")
    raise RuntimeError("nenhum navegador disponivel: " + "; ".join(erros))


def estado_audio(page: Page) -> dict | None:
    """Le o estado do `<audio>` do player. None quando o elemento nao existe."""
    return page.evaluate(
        """() => {
          const a = document.querySelector('audio');
          if (!a) return null;
          return {
            paused: a.paused,
            currentTime: a.currentTime,
            readyState: a.readyState,
            src: (a.currentSrc || a.src || '').slice(0, 120),
            erro: a.error ? a.error.code : null,
          };
        }"""
    )


def audio_vivo(page: Page) -> bool:
    """Confere se o audio esta tocando E avancando (duas amostras)."""
    est = estado_audio(page)
    if not est or est["paused"]:
        return False
    if est["currentTime"] <= 0.05:
        return False
    t1 = est["currentTime"]
    time.sleep(1.2)
    est2 = estado_audio(page)
    if not est2 or est2["paused"]:
        return False
    return est2["currentTime"] > t1


def garantir_audio(page: Page, id_estacao: str = ESTACAO_PADRAO, tentativas: int = 2) -> bool:
    """Garante o audio tocando; pede a estacao pelo evento publico do player.

    O pedido vai por `cp:radio-tocar` — o MESMO evento que o cartao da
    `/radio` dispara (`lib/radio/eventos.ts`). O clique real no botao
    flutuante foi tentado e nao e confiavel sob automacao (o alvo e
    interceptado por outros componentes da pilha flutuante); o evento e o
    contrato publico do player e nao depende de camada visual nenhuma.
    """
    for _ in range(tentativas):
        if audio_vivo(page):
            return True
        try:
            page.evaluate(
                """(id) => window.dispatchEvent(
                       new CustomEvent('cp:radio-tocar', { detail: { id } })
                   )""",
                id_estacao,
            )
        except Exception:
            pass
        limite = time.time() + 45
        while time.time() < limite:
            est = estado_audio(page)
            if est and not est["paused"] and est["currentTime"] > 0.5:
                if audio_vivo(page):
                    return True
            time.sleep(0.8)
    return False


def clicar_alvo(page: Page, alvo: str) -> str | None:
    """Marca e clica no primeiro `<a href>` interno que aponta para `alvo`.

    Retorna o href cru do link clicado, ou None se a pagina nao tem o link.
    O clique e real (Playwright), nao `el.click()` por script: queremos o
    comportamento de ponteiro igual ao do leitor.
    """
    alvo_norm = normalizar(alvo)

    def casar(href: str | None) -> bool:
        if not href or not href.startswith("/") or href.startswith("//"):
            return False
        return normalizar(href) == alvo_norm

    marcado = page.evaluate(
        """(alvo) => {
          const limpar = (h) => h.split('#')[0].split('?')[0].replace(/\\/$/, '') || '/';
          // Limpa marcador de passos anteriores: sem isto o querySelector
          // acharia a ancora velha (ja fora da tela/pagina) e clicaria errado.
          document.querySelectorAll('[data-cp-radio-alvo]').forEach((x) =>
            x.removeAttribute('data-cp-radio-alvo'));
          const links = [...document.querySelectorAll('a[href]')];
          for (const a of links) {
            const href = a.getAttribute('href') || '';
            if (!href.startsWith('/') || href.startsWith('//')) continue;
            if (limpar(href) === alvo) {
              a.setAttribute('data-cp-radio-alvo', '1');
              return href;
            }
          }
          return null;
        }""",
        alvo_norm,
    )
    if not marcado:
        return None
    # Clique por script (`el.click()`), nao o clique "acionavel" do Playwright:
    # o alvo pode estar num menu fechado (a barra de eixos so abre no hover) e
    # a espera de visibilidade travava 15 s por salto sem testar nada. O evento
    # e o mesmo e o InterceptadorLinks/next/link tratam igual.
    page.evaluate(
        """() => {
          const a = document.querySelector('[data-cp-radio-alvo="1"]');
          if (a) a.click();
        }"""
    )
    return marcado


def esperar_destino(
    page: Page, alvo: str, origem_url: str, timeout_ms: int = 15000
) -> bool:
    """Espera a URL sair da pagina de origem (ou ja ser o alvo).

    Antes de 03/10/2026 exigia igualdade com o alvo. Navegacao que redireciona
    (ou que cai no 404 depois de um `<a>` quebrado) ficava 90 s pendurada e o
    passo virava `ERRO-NAV` sem sequer medir o audio. Agora o criterio e "a URL
    mudou": qualquer navegacao de documento troca a URL e, para este teste, o
    que importa e se ela MATOU o audio.
    """
    alvo_norm = normalizar(alvo)
    limite = time.time() + timeout_ms / 1000
    url_atual = ""
    atual = ""
    while time.time() < limite:
        try:
            url_atual = page.url
            atual = normalizar(urlparse(url_atual).path)
        except Exception:
            url_atual, atual = "", ""
        if atual == alvo_norm or (url_atual and url_atual != origem_url):
            return True
        time.sleep(0.3)
    print(
        f"    [nav-timeout] alvo={alvo_norm} origem={origem_url} atual={url_atual}",
        flush=True,
    )
    return False


def carregar_indice(page: Page, base: str) -> bool:
    """Carrega `/indice` numa navegacao completa e deixa o audio tocando.

    Tolera falha de rede/timeout: o percurso continua (a pagina pode estar
    lenta no servidor) em vez de derrubar o relatorio inteiro.
    """
    try:
        page.goto(base + "/indice", wait_until="domcontentloaded", timeout=90000)
    except Exception:
        return False
    return garantir_audio(page)


def escrever_relatorio(
    rotulo: str,
    base: str,
    alvos: list[tuple[str, str]],
    passos: list[dict],
    sem_link: list[str],
    falha_audio_global: bool,
) -> tuple[Path, Path]:
    """Escreve o relatorio em Markdown + JSON e devolve os dois caminhos."""
    DIR_SAIDA.mkdir(parents=True, exist_ok=True)
    agora = datetime.now()
    marca = agora.strftime("%Y-%m-%d-%H%M")
    nome = f"radio-navegacao-{rotulo}-{marca}"
    caminho_md = DIR_SAIDA / f"{nome}.md"
    caminho_json = DIR_SAIDA / f"{nome}.json"

    mortes = [p for p in passos if p["resultado"] == "MORTA"]
    primeira = mortes[0] if mortes else None

    linhas: list[str] = []
    linhas.append(f"# Radio + navegacao — {rotulo}")
    linhas.append("")
    linhas.append("> **Tipo:** RELATORIO")
    linhas.append("> **Dominio:** global")
    linhas.append(f"> **Ultima medicao:** {agora.strftime('%Y-%m-%d %H:%M')}")
    linhas.append("> **Leitura estimada:** curta (2-5 min)")
    linhas.append(
        "> **Relacionados:** "
        "[AGENTS.md](/AGENTS.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md)"
    )
    linhas.append(
        "> **Palavras-chave:** radio, audio, navegacao, link, reload, link, "
        "playwright, baseline, reteste"
    )
    linhas.append("")
    linhas.append("## Sumario")
    linhas.append("")
    linhas.append("- [Resultado](#resultado)")
    linhas.append("- [Percurso](#percurso)")
    linhas.append("- [Passos](#passos)")
    linhas.append("")
    linhas.append("## Resultado")
    linhas.append("")
    linhas.append(f"- Base testada: `{base}`")
    linhas.append(f"- Estacao tocada: `{ESTACAO_PADRAO}` ({NOME_ESTACAO_PADRAO})")
    linhas.append(f"- Alvos no percurso: {len(alvos)}")
    linhas.append(f"- Saltos por clique: {sum(1 for p in passos if p['href'])}")
    linhas.append(f"- Paginas sem link interno para o alvo: {len(sem_link)}")
    linhas.append(f"- Saltos que MATARAM o audio: {len(mortes)}")
    if falha_audio_global:
        linhas.append(
            "- AVISO: nao foi possivel iniciar o audio em algum momento — "
            "os passos afetados estao marcados no detalhe."
        )
    if primeira:
        linhas.append(
            f"- Primeiro culpado: `{primeira['origem']}` -> `{primeira['href']}` "
            f"(alvo `{primeira['alvo']}`)"
        )
    else:
        linhas.append("- Nenhum salto matou o audio.")
    linhas.append("")
    linhas.append("## Percurso")
    linhas.append("")
    linhas.append(
        "A fila vem de `catalogo.ts` (rotaLegada), dos 4 hubs de eixo e de "
        "`top-100-paginas.json`, nessa ordem."
    )
    linhas.append("")
    for rota, grupo in alvos:
        linhas.append(f"- {grupo}: `{rota}`")
    linhas.append("")
    linhas.append("## Passos")
    linhas.append("")
    linhas.append("| # | Origem | Alvo | Href clicado | Resultado | Detalhe |")
    linhas.append("|---|---|---|---|---|---|")
    for i, p in enumerate(passos, 1):
        detalhe = p.get("detalhe", "").replace("|", "/")
        linhas.append(
            f"| {i} | `{p['origem']}` | `{p['alvo']}` | `{p.get('href') or '-'}` "
            f"| {p['resultado']} | {detalhe} |"
        )
    if sem_link:
        linhas.append("")
        linhas.append("### Paginas sem link interno para o alvo")
        linhas.append("")
        for rota in sem_link:
            linhas.append(f"- `{rota}`")
    linhas.append("")
    linhas.append("## Metodo")
    linhas.append("")
    linhas.append(
        "Cada passo comeca com o audio tocando. O script marca o primeiro "
        "`<a href>` interno que aponta para o alvo, clica nele e espera a URL "
        "mudar. Depois confere: `<audio>` existe, `!paused` e `currentTime` "
        "avancando. Qualquer uma das tres falhando significa reload de pagina "
        "inteira — o player do layout raiz morreu junto."
    )
    linhas.append("")
    linhas.append(
        f"Gerado por `scripts/verificar-radio-navegacao.py` em "
        f"{agora.strftime('%d/%m/%Y %H:%M')}."
    )
    linhas.append("")

    caminho_md.write_text("\n".join(linhas), encoding="utf-8")
    caminho_json.write_text(
        json.dumps(
            {
                "rotulo": rotulo,
                "base": base,
                "estacao": ESTACAO_PADRAO,
                "gerado_em": agora.isoformat(timespec="seconds"),
                "total_alvos": len(alvos),
                "mortes": len(mortes),
                "primeiro_culpado": primeira,
                "passos": passos,
                "sem_link": sem_link,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return caminho_md, caminho_json


def executar(args: argparse.Namespace) -> int:
    """Executa o percurso completo e devolve o codigo de saida do processo."""
    alvos = montar_alvos()
    if args.limite:
        alvos = alvos[: args.limite]
    print("=" * 72, flush=True)
    print(f"RADIO + NAVEGACAO — rotulo={args.rotulo} base={args.base}", flush=True)
    print(f"alvos: {len(alvos)} (eixos, subfrentes, top100)", flush=True)
    print("=" * 72, flush=True)

    passos: list[dict] = []
    sem_link: list[str] = []
    falha_global = False

    with sync_playwright() as p:
        navegador = abrir_navegador(p, args.cabeado)
        page = navegador.new_page(viewport={"width": 1366, "height": 900})
        page.set_default_timeout(120000)

        # 1) Abre /radio e toca a estacao clicando no cartao (gesto real).
        print("[1] abrindo /radio e tocando a estacao...", flush=True)
        page.goto(args.base + "/radio", wait_until="domcontentloaded", timeout=120000)
        try:
            page.locator(
                f'button[aria-label="Tocar {NOME_ESTACAO_PADRAO}"]'
            ).first.click(timeout=8000)
        except Exception:
            # Clique por script: alguns componentes flutuantes interceptam o
            # ponteiro na automacao; o evento de clique continua disparando.
            try:
                page.evaluate(
                    """(nome) => {
                      const b = [...document.querySelectorAll('button[aria-label]')]
                        .find((x) => x.getAttribute('aria-label') === `Tocar ${nome}`);
                      if (b) b.click();
                    }""",
                    NOME_ESTACAO_PADRAO,
                )
            except Exception:
                pass
        if not garantir_audio(page):
            print("    AVISO: audio nao iniciou em /radio; seguindo mesmo assim.", flush=True)
            falha_global = True
        else:
            print(f"    audio no ar (estacao {ESTACAO_PADRAO}).", flush=True)

        # 2) Percurso por clique.
        for indice, (alvo, grupo) in enumerate(alvos, 1):
            origem = normalizar(urlparse(page.url).path)
            if origem == alvo:
                passos.append(
                    {
                        "origem": origem,
                        "alvo": alvo,
                        "grupo": grupo,
                        "href": None,
                        "resultado": "PULADO",
                        "detalhe": "ja estava na pagina",
                    }
                )
                continue

            if not garantir_audio(page):
                falha_global = True

            origem_url = page.url
            href = clicar_alvo(page, alvo)
            if href is None:
                # Pagina atual nao tem o link: tenta o indice do site.
                if not carregar_indice(page, args.base):
                    falha_global = True
                origem = normalizar(urlparse(page.url).path)
                origem_url = page.url
                href = clicar_alvo(page, alvo)
            if href is None:
                # Ultimo recurso: carrega o alvo direto, sem clique.
                sem_link.append(alvo)
                try:
                    page.goto(args.base + alvo, wait_until="domcontentloaded", timeout=90000)
                except Exception:
                    pass
                if not garantir_audio(page):
                    falha_global = True
                passos.append(
                    {
                        "origem": origem,
                        "alvo": alvo,
                        "grupo": grupo,
                        "href": None,
                        "resultado": "SEM-LINK",
                        "detalhe": "carregado direto (sem clique)",
                    }
                )
                print(f"[{indice}/{len(alvos)}] SEM-LINK {alvo}", flush=True)
                continue

            if not esperar_destino(page, alvo, origem_url):
                # A URL pode demorar (RSC de pagina dinamica frio). O que
                # importa de verdade e o AUDIO: mede mesmo sem a URL mudar.
                time.sleep(0.8)
                vivo_tardio = audio_vivo(page)
                if vivo_tardio:
                    resultado = "VIVA"
                    detalhe = "URL nao mudou no prazo, mas o audio seguiu vivo"
                else:
                    resultado = "MORTA"
                    detalhe = "o clique matou o audio antes da URL mudar"
                    garantir_audio(page)
                passos.append(
                    {
                        "origem": origem,
                        "alvo": alvo,
                        "grupo": grupo,
                        "href": href,
                        "resultado": resultado,
                        "detalhe": detalhe,
                    }
                )
                print(f"[{indice}/{len(alvos)}] {resultado} (nav lenta) {origem} -> {alvo}", flush=True)
                if resultado == "MORTA" and args.parar_na_primeira:
                    print("    --parar-na-primeira: baseline fechado no 1o culpado.", flush=True)
                    break
                continue

            time.sleep(1.0)
            vivo = audio_vivo(page)
            est = estado_audio(page) or {}
            if vivo:
                resultado = "VIVA"
                detalhe = (
                    f"audio ativo em {est.get('currentTime', 0):.1f}s"
                )
            else:
                resultado = "MORTA"
                if est is None:
                    detalhe = "elemento <audio> nao existe"
                elif est.get("paused"):
                    detalhe = "novo <audio> nasceu pausado (reload)"
                elif not est.get("currentTime"):
                    detalhe = "currentTime zerado (reload)"
                else:
                    detalhe = "currentTime nao avancou"
                garantir_audio(page)
            passos.append(
                {
                    "origem": origem,
                    "alvo": alvo,
                    "grupo": grupo,
                    "href": href,
                    "resultado": resultado,
                    "detalhe": detalhe,
                }
            )
            print(f"[{indice}/{len(alvos)}] {resultado} {origem} -> {alvo}", flush=True)
            if resultado == "MORTA" and args.parar_na_primeira:
                print("    --parar-na-primeira: baseline fechado no 1o culpado.", flush=True)
                break

        navegador.close()

    caminho_md, caminho_json = escrever_relatorio(
        args.rotulo, args.base, alvos, passos, sem_link, falha_global
    )
    mortes = sum(1 for p in passos if p["resultado"] == "MORTA")
    print("=" * 72, flush=True)
    print(f"RESULTADO: {mortes} salto(s) mataram o audio.", flush=True)
    print(f"relatorio: {caminho_md}", flush=True)
    print(f"dados:     {caminho_json}", flush=True)
    print("=" * 72, flush=True)
    return 1 if mortes else 0


def main() -> int:
    """Entrada do script: le argumentos e delega para `executar`."""
    parser = argparse.ArgumentParser(
        description="Percorre o portal clicando nos links com a radio tocando."
    )
    parser.add_argument(
        "--base",
        default="http://localhost:3047",
        help="URL base do site (padrao: http://localhost:3047).",
    )
    parser.add_argument(
        "--rotulo",
        default="baseline",
        help="Nome do cenario: baseline (antes) ou reteste (depois).",
    )
    parser.add_argument(
        "--limite",
        type=int,
        default=0,
        help="Testa so os primeiros N alvos (0 = todos).",
    )
    parser.add_argument(
        "--cabeado",
        action="store_true",
        help="Abre o navegador com janela (debug visual).",
    )
    parser.add_argument(
        "--parar-na-primeira",
        action="store_true",
        help="Fecha o relatorio no primeiro salto que matar o audio (baseline).",
    )
    return executar(parser.parse_args())


if __name__ == "__main__":
    raise SystemExit(main())
