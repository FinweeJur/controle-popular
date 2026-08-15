"""Mede se os links de fonte ainda respondem, e quanto pesaria arquivá-los.

    py -3 scripts/medir_links_fonte.py dados/legislacao-mma.json --amostra 100

É o **primeiro passo** de `docs/PLANO-ARQUIVO-DE-FONTES.md`, que pede medir
antes de arquivar qualquer coisa. Sem isto, a conta de custo do R2 sairia de
um chute de "quanto pesa um PDF".

═══ SÓ HEAD. NUNCA BAIXA O ARQUIVO ═══

O plano quer duas informações — *o link ainda vive?* e *quanto ele pesa?* —
e `HEAD` responde as duas pelo `Content-Length`, sem transferir corpo. Baixar
8.345 PDFs para descobrir o tamanho custaria a mesma banda que o arquivamento
inteiro, feita duas vezes, e para uma medição que é preliminar à decisão de
arquivar. Enquanto essa decisão não estiver tomada, a regra do projeto para
acervo de terceiro continua valendo: **metadado e link, nunca o arquivo**.

═══ POR QUE AMOSTRA, E NÃO O ACERVO INTEIRO ═══

8.345 requisições contra `pesquisa.in.gov.br` e `ibama.gov.br` é carga que um
portal de governo sente. A amostra é sistemática (passo fixo sobre a lista
ordenada), não aleatória, para que duas execuções na mesma entrada meçam o
MESMO conjunto — sem isso não dá para dizer se um link quebrou entre uma
medição e outra, que é justamente o fenômeno que o plano quer acompanhar.

═══ O QUE UM ERRO AQUI SIGNIFICA — E AS DUAS ARMADILHAS MEDIDAS ═══

`405` e `403` **não** querem dizer link morto: parte dos portais recusa HEAD
mas serve GET. Ficam num balde próprio, `inconclusivo`, em vez de contarem
como quebra — inflar a contagem de links mortos justificaria o arquivamento
com um número falso.

**1. `planalto.gov.br` derruba a conexão do User-Agent do projeto.** Medido em
2026-08-15: `ConnectionError` em 100% das tentativas com o UA identificável,
e **200** no mesmo instante com UA de Chrome. É a mesma armadilha já
registrada para `conama.mma.gov.br` na docstring de `legislacao_mma`. Por isso
toda falha é **repetida com UA de navegador** antes de ser contada como
quebra, e o resultado sai separado (`só-com-navegador`): é bloqueio de agente,
não link morto — e confundir os dois faria o Planalto inteiro, 577 URLs,
aparecer como acervo perdido.

**2. `pesquisa.in.gov.br` é INTERMITENTE, e a diferença importa.** Duas
execuções da MESMA amostra de 100, com minutos de intervalo, deram **56** e
depois **22** falhas. Não é rajada nossa (uma sonda lenta, 4 s entre pedidos,
com HEAD e GET e os dois User-Agents, manteve o 502 em URLs específicas), mas
também não é serviço morto: o host oscila. São 3.298 das 7.138 URLs do acervo
federal — 46% — dependendo de um serviço que responde às vezes.

Consequência para quem for arquivar: **uma execução só não mede link morto**,
mede o humor do servidor naquele minuto. Rode duas ou três vezes e considere
quebrado o que falhar em todas — senão o arquivamento vai atrás de 2.000 URLs
que estavam apenas de mau humor, e a conta de custo sai inflada na mesma
proporção.
"""
import argparse
import collections
import json
import sys
from urllib.parse import urlparse

import requests

UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
# Usado SÓ para reteste de falha, para distinguir bloqueio por agente de link
# morto. Não é disfarce para coletar: nada é baixado aqui, e a coleta de
# verdade continua se identificando com o `UA` acima.
UA_NAVEGADOR = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)
TIMEOUT = 20


def amostrar(urls: list[str], quantos: int) -> list[str]:
    """Amostra sistemática: passo fixo, resultado estável entre execuções."""
    if quantos >= len(urls):
        return urls
    passo = len(urls) / quantos
    return [urls[int(i * passo)] for i in range(quantos)]


def _uma(url: str, sessao: requests.Session) -> tuple[str, int | None]:
    try:
        r = sessao.head(url, timeout=TIMEOUT, allow_redirects=True)
    except requests.RequestException as e:
        return f"erro: {type(e).__name__}", None
    tamanho = r.headers.get("Content-Length")
    if r.status_code in (405, 403, 501):
        return "inconclusivo", None
    return str(r.status_code), int(tamanho) if tamanho and tamanho.isdigit() else None


def medir(url: str, sessao: requests.Session, sessao_nav: requests.Session) -> tuple[str, int | None]:
    """Tenta com o UA do projeto; se falhar, repete com UA de navegador.

    Sem o reteste, o `planalto.gov.br` inteiro (577 URLs) entraria na conta
    como acervo perdido — quando o que ele recusa é o agente, não o pedido.
    """
    status, tam = _uma(url, sessao)
    if not (status.startswith("erro") or status.startswith("4") or status.startswith("5")):
        return status, tam
    status2, tam2 = _uma(url, sessao_nav)
    if not (status2.startswith("erro") or status2.startswith("4") or status2.startswith("5")):
        return "só-com-navegador", tam2
    return status, tam


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("arquivo", help="JSON exportado por um coletor (--json)")
    p.add_argument("--amostra", type=int, default=100)
    p.add_argument("--campo", default="link_pdf")
    args = p.parse_args()

    linhas = json.load(open(args.arquivo, encoding="utf-8"))["linhas"]
    urls = sorted({(l.get(args.campo) or "").strip() for l in linhas} - {""})
    print(f"{len(urls)} URL(s) distinta(s) em {len(linhas)} linha(s).")

    hosts = collections.Counter(urlparse(u).netloc for u in urls)
    print("hosts mais frequentes:")
    for h, n in hosts.most_common(8):
        print(f"  {n:>5}  {h}")

    alvo = amostrar(urls, args.amostra)
    print(f"\nMedindo {len(alvo)} por HEAD (amostra sistemática, sem baixar corpo)...")

    sessao = requests.Session()
    sessao.headers["User-Agent"] = UA
    sessao_nav = requests.Session()
    sessao_nav.headers["User-Agent"] = UA_NAVEGADOR
    resultados: collections.Counter = collections.Counter()
    tamanhos: list[int] = []
    quebrados: list[tuple[str, str]] = []

    for i, u in enumerate(alvo, 1):
        status, tam = medir(u, sessao, sessao_nav)
        resultados[status] += 1
        if tam:
            tamanhos.append(tam)
        if status.startswith("erro") or status.startswith("4") or status.startswith("5"):
            quebrados.append((status, u))
        if i % 20 == 0:
            print(f"  {i}/{len(alvo)}")

    print("\nresultado:")
    for s, n in resultados.most_common():
        print(f"  {n:>4}  {s}")

    if tamanhos:
        media = sum(tamanhos) / len(tamanhos)
        print(f"\ntamanho medido em {len(tamanhos)} resposta(s) com Content-Length:")
        print(f"  média   {media/1024:.0f} KiB")
        print(f"  mediana {sorted(tamanhos)[len(tamanhos)//2]/1024:.0f} KiB")
        # A projeção usa a MÉDIA e o total de URLs distintas — não o total de
        # linhas: várias normas apontam para o mesmo diário oficial, e contar
        # por linha inflaria o acervo com cópias do mesmo objeto.
        print(f"  projeção para as {len(urls)} URLs: {media*len(urls)/1024**3:.2f} GiB")

    if quebrados:
        print(f"\n{len(quebrados)} de {len(alvo)} não responderam "
              f"({100*len(quebrados)/len(alvo):.0f}%):")
        for s, u in quebrados[:15]:
            print(f"  {s:<24} {u[:88]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
