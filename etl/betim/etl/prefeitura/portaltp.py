r"""etl.prefeitura.portaltp — quadro de servidores de qualquer prefeitura que
rode o portal da transparência do fornecedor **PortalTP**.

Alvo inicial: Araçuaí-MG (3103405), `https://aracuai-mg.portaltp.com.br/`.

    python -m etl.prefeitura.portaltp --id-municipio 3103405
    python -m etl.prefeitura.portaltp --id-municipio 3103405 --sondar

═══ POR QUE ESTE MÓDULO É POR FORNECEDOR, E NÃO "etl.prefeitura.aracuai" ═══

O §20 registrava que `servidores` estava zerada nas três cidades do Vale e que
"ninguém sabe qual coletor a preenche". A resposta, achada em 2026-08-10, é que
**não existe e nunca existiu um coletor genérico**: `etl.prefeitura.b3106705` é
a API REST do portal de Betim, `etl.pbh.folha` é a da PBH, `etl.psp.servidores`
é a de São Paulo. Folha de pagamento municipal não tem fonte federal — é um
portal por prefeitura, e prefeitura pequena compra o portal de um fornecedor.

Daí o eixo certo ser o FORNECEDOR, como já é em `etl.camaras.sapl` e
`etl.camaras.syssolution`: o host sai de `municipios.fontes`, e a mesma classe
de código atende qualquer cliente do PortalTP. As três do Vale usam três
fornecedores DIFERENTES (Araçuaí PortalTP, Itinga CidadesMG, Diamantina
PortalTransp), então este módulo resolve uma das três — e as outras duas ficam
com o endereço mapeado no §21 para quem escrever os outros dois.

═══ AS ARMADILHAS, MEDIDAS AO VIVO (2026-08-10) ═══

1. **O HTML DA PRIMEIRA REQUISIÇÃO NÃO TEM O DADO.** `servidores.aspx` devolve
   264 KB com os cabeçalhos da tabela e ZERO linhas de servidor: é ASP.NET
   WebForms com grade DevExpress, e as linhas chegam por postback. `requests`
   pega a casca. Por isso Playwright, que é o que este repo já usa quando o
   portal não tem API (`etl.camaras.betim`, `etl.camaras.diarias`).

2. **A GRADE TEM TABELAS ANINHADAS QUE NÃO SÃO DADO.** Dentro da própria
   `DXMainTable` há um widget de calendário, com dezenas de `<tr>` de dias do
   mês. Varrer `table tr` devolve "linhas" como `['31','26','27',...]` — que
   parecem dado e não são. As linhas de verdade são **filhas diretas** do
   `<tbody>` e têm id `..._grdData_DXDataRow{n}`.

3. **O CPF VEM MASCARADO PELA FONTE** (`***.286.286-**`) e mesmo assim NÃO é
   gravado: a tabela `servidores` é `orgao, nome, cargo, lotacao, vinculo` —
   sem CPF e sem remuneração. O portal expõe os dois; o schema não os recebe, e
   essa decisão é anterior a este módulo (é a mesma de Betim).

4. **UMA PESSOA APARECE MAIS DE UMA VEZ.** O grão da grade é (servidor ×
   matrícula × competência) — o mesmo nome sai duas vezes quando tem dois
   contratos. A deduplicação é por `(nome, cargo)`, que é exatamente a chave de
   conflito do upsert de `servidores`; sem ela o upsert quebra com "ON CONFLICT
   DO UPDATE command cannot affect row a second time".

5. **A GRADE MISTURA ATIVO E DESLIGADO.** Em Araçuaí são 1.761 linhas: 960
   ativos e 801 desligados, e a coluna `Situação Funcional` diz qual é qual
   ("Ativo" vs "Demitido - Termino - Contrato de Trabalho - ..."). Só os ativos
   entram, para o número significar a mesma coisa que o de Betim.

6. **A PAGINAÇÃO NÃO FUNCIONA EM NAVEGADOR HEADLESS, E EU NÃO DESCOBRI POR
   QUÊ.** É o que falta para este módulo servir, e está medido:

       window.grdDataClient existe e GetPageIndex() devolve 0
       GotoPage(1)      -> nao lanca erro, nao emite NENHUMA requisicao,
                           GetPageIndex() continua 0
       click no "Proximo" (Playwright) -> o veu #..._grdData_LD intercepta
       click() em JS no link "2"       -> nao muda nada
       __doPostBack(...) -> ReferenceError: __doPostBack is not defined

   Um `grdDataClient` que existe ao lado de um `__doPostBack` que NÃO existe é
   a assinatura de inicialização pela metade: o objeto cliente foi construído,
   a máquina de postback do WebForms não. A suspeita é recurso de script
   (`WebResource.axd`) que não carrega no headless — não confirmada.

   **Consequência prática, e por isso o módulo se recusa a gravar parcial:**
   hoje ele lê a página 1 (10 linhas, 3 ativos) de 177. Gravar isso encheria
   `servidores` de Araçuaí com 3 nomes e daria à tela um ar de completa. O
   guarda em `sincronizar` compara páginas lidas com páginas do portal e
   **aborta sem escrever** se não bateu.

   **Navegador com cabeça (`headless=False`) NÃO resolve** — testado, mesmo
   resultado, `__doPostBack` continua indefinido. Então não é detecção de
   headless nem recurso bloqueado por falta de janela.

   Caminhos não tentados, para quem retomar: interceptar a requisição real que
   o portal faz ao trocar de página num navegador comum (abrir o DevTools na
   mão e olhar a aba Rede é o passo mais barato, e resolve a dúvida em um
   minuto) ou, melhor, **o botão de exportação** — a página oferece .csv e
   .xlsx, e um download resolveria paginação e formato de uma vez só.

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

Não remove quem saiu. O `servidores` é escrito por upsert em
`(id_municipio, orgao, nome, cargo)` — mesma semântica de Betim —, então um
servidor que deixa a prefeitura continua na tabela até alguém apagar. É
limitação herdada e conhecida, e trocá-la por refresh total exigiria decidir o
mesmo para Betim, que tem 9.803 linhas.
"""
from __future__ import annotations

import argparse
import sys

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

LOG = "[etl.prefeitura.portaltp]"

CAMINHO_SERVIDORES = "consultas/pessoal/servidores.aspx"

# Identificação honesta com o portal. É município pequeno, servidor modesto, e
# um agente identificado pode ser avisado antes de ser bloqueado.
AGENTE = "controle-popular/1.0 (+https://controlepopular.com.br) transparencia publica"

# Posição das colunas na grade, medida em 2026-08-10. Índice e não nome porque
# a grade não rotula as células — o cabeçalho é uma linha à parte.
COL_NOME = 3
COL_LOTACAO = 5
COL_VINCULO = 6
COL_CARGO = 7
COL_SITUACAO = 8
COLUNAS_ESPERADAS = 17

# Só quem está na ativa. Ver armadilha 5.
PREFIXO_ATIVO = "ativo"

# JS que colhe as linhas de dado. Fica aqui, e não num `page.query_selector_all`,
# por causa da armadilha 2: a filtragem por FILHA DIRETA do tbody é o que separa
# servidor de dia-de-calendário, e isso não se expressa em seletor CSS.
JS_LINHAS = """
() => {
  const t = document.getElementById('ctl00_containerCorpo_grdData_DXMainTable');
  if (!t || !t.tBodies.length) return null;
  return Array.from(t.tBodies[0].children)
    .filter(e => e.tagName === 'TR' && (e.id || '').includes('DXDataRow'))
    .map(tr => Array.from(tr.children)
      .filter(c => c.tagName === 'TD')
      .map(td => td.innerText.trim()));
}
"""

# A grade expõe o objeto cliente do DevExpress como `window.grdDataClient`, com
# `GotoPage/GetPageIndex/GetPageCount`. Paginar por ele, e não clicando em
# "Próximo", resolve duas coisas de uma vez:
#
#   - o clique NÃO funciona. O DevExpress cobre a grade com o véu
#     `#..._grdData_LD` durante a repintura, e o Playwright fica tentando
#     clicar debaixo dele até estourar com "intercepts pointer events" — um
#     erro que fala de ponteiro e manda procurar no lugar errado;
#   - `GetPageIndex()` é sinal de PRONTO confiável. Esperar o véu sumir não é:
#     em parte das repinturas ele é removido do DOM em vez de escondido, e o
#     `state="hidden"` nunca resolve.
JS_ESTADO = """
() => {
  const o = window.grdDataClient;
  if (!o) return null;
  return {pagina: o.GetPageIndex(), total: o.GetPageCount()};
}
"""

# Tamanho de página. A grade oferece 10 (padrão), 20, 50, 100, 200 e "Todos".
# 200 e não "Todos" de propósito: são 1.761 linhas em Araçuaí e a diferença
# entre 9 requisições e 1 não paga o risco de derrubar o portal de uma
# prefeitura pequena com uma renderização de tudo de uma vez.
TAMANHO_PAGINA = 200

JS_TAMANHO_PAGINA = """
(n) => {
  const c = window.ASPx && ASPx.GetControlCollection
    ? ASPx.GetControlCollection().Get('ctl00_containerCorpo_grdData_DXPagerBottom_PSP')
    : null;
  if (!c || typeof c.SetValue !== 'function') return false;
  c.SetValue(String(n));
  if (typeof c.RaiseValueChangedEvent === 'function') c.RaiseValueChangedEvent();
  return true;
}
"""


def _host(municipio: dict) -> str:
    """O endereço do portal sai do BANCO, nunca da linha de comando.

    É a lição de 2026-08-03 (ver `carregar_municipio`): módulo que aceita a
    cidade por `--id-municipio` mas o host por outro argumento coleta o dado de
    uma cidade e o grava com o id de outra, sem erro nenhum. Aqui o id é a
    única coisa que o operador escolhe.
    """
    fontes = municipio.get("fontes") or {}
    sistema = fontes.get("prefeitura_transparencia_sistema")
    host = fontes.get("prefeitura_transparencia_host")
    if sistema != "portaltp" or not host:
        raise RuntimeError(
            f"{municipio['nome']} ({municipio['id_municipio']}) não está registrada como "
            f"cliente do PortalTP. Esperado em `municipios.fontes`: "
            f'prefeitura_transparencia_sistema="portaltp" e prefeitura_transparencia_host. '
            f"Achado: sistema={sistema!r}, host={host!r}."
        )
    return host.rstrip("/") + "/" + CAMINHO_SERVIDORES


def mapear(celulas: list[str], id_municipio: str) -> dict | None:
    """Uma linha da grade vira uma linha de `servidores` — ou `None`.

    Devolve `None` para o desligado e para a linha sem nome ou sem cargo, que
    são as duas coisas que o upsert precisa ter. Função pura de propósito: é a
    única parte deste módulo que dá para conferir sem rede nem navegador.
    """
    if len(celulas) < COLUNAS_ESPERADAS:
        return None
    situacao = (celulas[COL_SITUACAO] or "").strip().lower()
    if not situacao.startswith(PREFIXO_ATIVO):
        return None
    nome = (celulas[COL_NOME] or "").strip()
    cargo = (celulas[COL_CARGO] or "").strip()
    if not nome or not cargo:
        return None
    return {
        "id_municipio": id_municipio,
        # "prefeitura" literal, como em `b3106705`: a coluna distingue
        # prefeitura de câmara, não uma secretaria da outra (isso é `lotacao`).
        "orgao": "prefeitura",
        "nome": nome,
        "cargo": cargo,
        "lotacao": (celulas[COL_LOTACAO] or "").strip() or None,
        "vinculo": (celulas[COL_VINCULO] or "").strip() or None,
    }


def _esperar_pagina(pag, alvo: int, timeout_ms: int = 90_000) -> dict:
    """Espera a grade terminar de repintar NA página pedida.

    O sinal é `GetPageIndex()` do próprio objeto cliente, não o véu de
    carregamento: o véu às vezes é removido do DOM em vez de escondido, e aí
    esperar por `hidden` nunca resolve.
    """
    passo, gasto = 250, 0
    while gasto < timeout_ms:
        estado = pag.evaluate(JS_ESTADO)
        if estado and estado["pagina"] == alvo:
            return estado
        pag.wait_for_timeout(passo)
        gasto += passo
    raise RuntimeError(
        f"a grade não chegou na página {alvo} em {timeout_ms // 1000}s. "
        "Portal fora do ar, ou a estrutura mudou."
    )


def colher(url: str, id_municipio: str, *, teto_paginas: int | None = None) -> tuple[list[dict], dict]:
    """Percorre a grade página a página. Devolve (linhas, diagnóstico)."""
    from playwright.sync_api import sync_playwright

    linhas: list[dict] = []
    vistos: set[tuple[str, str]] = set()
    diag = {"paginas_lidas": 0, "paginas_no_portal": None, "celulas_lidas": 0, "descartados": 0}

    with sync_playwright() as p:
        nav = p.chromium.launch(headless=True)
        try:
            pag = nav.new_page(user_agent=AGENTE)
            pag.goto(url, wait_until="networkidle", timeout=90_000)
            pag.wait_for_timeout(3000)

            if pag.evaluate(JS_ESTADO) is None:
                raise RuntimeError(
                    "`window.grdDataClient` não existe — o portal mudou de estrutura. "
                    "Nada foi lido; conferir antes de gravar qualquer coisa."
                )

            if pag.evaluate(JS_TAMANHO_PAGINA, TAMANHO_PAGINA):
                _esperar_pagina(pag, 0)
                diag["tamanho_pagina"] = TAMANHO_PAGINA
            else:
                # Não é fatal: com 10 por página são 177 requisições em vez de
                # 9. Mas fica no log, porque é a diferença entre um minuto e
                # vinte, e é o primeiro sinal de que o pager mudou.
                print(f"{LOG} AVISO: nao consegui ampliar o tamanho da pagina; seguindo no padrao.")

            pagina = 0
            while True:
                estado = _esperar_pagina(pag, pagina)
                diag["paginas_no_portal"] = estado["total"]

                cru = pag.evaluate(JS_LINHAS)
                if cru is None:
                    raise RuntimeError(
                        "a grade `ctl00_containerCorpo_grdData_DXMainTable` sumiu no meio da leitura."
                    )
                diag["celulas_lidas"] += len(cru)
                for celulas in cru:
                    linha = mapear(celulas, id_municipio)
                    if linha is None:
                        diag["descartados"] += 1
                        continue
                    chave = (linha["nome"], linha["cargo"])
                    if chave in vistos:
                        continue
                    vistos.add(chave)
                    linhas.append(linha)

                diag["paginas_lidas"] += 1
                print(f"{LOG} pagina {pagina + 1}/{estado['total']} — "
                      f"{len(linhas)} ativo(s) ate aqui", flush=True)

                if pagina + 1 >= estado["total"]:
                    break
                if teto_paginas and diag["paginas_lidas"] >= teto_paginas:
                    print(f"{LOG} teto de {teto_paginas} pagina(s) atingido (amostra).")
                    break

                pagina += 1
                pag.evaluate("(n) => window.grdDataClient.GotoPage(n)", pagina)
                # Cortesia com o portal de uma prefeitura pequena.
                pag.wait_for_timeout(600)
        finally:
            nav.close()

    return linhas, diag


def sincronizar(id_municipio: str, *, sondar: bool = False, teto_paginas: int | None = None) -> int:
    municipio = carregar_municipio(id_municipio)
    url = _host(municipio)
    print(f"{LOG} {municipio['nome']}/{municipio['uf']} — {url}")

    linhas, diag = colher(url, id_municipio, teto_paginas=teto_paginas)
    print(
        f"{LOG} paginas={diag['paginas_lidas']}/{diag['paginas_no_portal']} "
        f"celulas_lidas={diag['celulas_lidas']} descartados={diag['descartados']} "
        f"ativos_unicos={len(linhas)}"
    )

    if sondar:
        for l in linhas[:5]:
            print(f"{LOG}   {l['nome']} | {l['cargo']} | {l['lotacao']} | {l['vinculo']}")
        print(f"{LOG} --sondar: nada foi gravado.")
        return len(linhas)

    if not linhas:
        raise RuntimeError(
            f"nenhum servidor ATIVO em {municipio['nome']} — improvável para uma prefeitura. "
            "Nada foi gravado. Conferir o portal antes de insistir."
        )

    # O GUARDA QUE IMPEDE O PIOR RESULTADO POSSÍVEL DESTE MÓDULO.
    #
    # Enquanto a armadilha 6 não estiver resolvida, a leitura para na página 1
    # de 177. Gravar isso deixaria `servidores` de Araçuaí com 3 nomes — e uma
    # tabela com 3 nomes não parece quebrada, parece uma cidade pequena. Seria
    # dado errado com aparência de dado certo, que é o defeito que este projeto
    # persegue em todo lugar.
    #
    # Parcial não entra. Ou o coletor leu o portal inteiro, ou não escreve.
    total = diag["paginas_no_portal"]
    if total and diag["paginas_lidas"] < total:
        raise RuntimeError(
            f"li {diag['paginas_lidas']} de {total} páginas e NÃO vou gravar parcial: "
            f"{len(linhas)} servidor(es) contra os {total * 10} registros que o portal declara. "
            "Ver a armadilha 6 no cabeçalho deste arquivo — a paginação ainda não funciona "
            "em navegador headless. Use --sondar para inspecionar sem gravar."
        )

    client = get_supabase_client()
    client.table("servidores").upsert(linhas, on_conflict="id_municipio,orgao,nome,cargo").execute()
    print(f"{LOG} id_municipio={id_municipio} servidores gravados={len(linhas)}")
    return len(linhas)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Servidores de prefeituras clientes do PortalTP.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--sondar", action="store_true", help="lê e relata, NÃO grava")
    parser.add_argument("--paginas", type=int, help="teto de páginas (amostra, para sondagem)")
    args = parser.parse_args()

    try:
        sincronizar(args.id_municipio, sondar=args.sondar, teto_paginas=args.paginas)
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise SystemExit(1)
