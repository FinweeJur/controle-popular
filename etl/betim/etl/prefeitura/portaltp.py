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

1. **A GRADE (a versão em HTML da consulta) TEM TABELAS ANINHADAS QUE NÃO SÃO
   DADO**, e só interessa a quem for depurar visualmente pelo navegador: este
   módulo não lê mais a grade, ver a armadilha 6.

2. **O CPF VEM MASCARADO PELA FONTE** (`***.286.286-**`) e mesmo assim NÃO é
   gravado: a tabela `servidores` é `orgao, nome, cargo, lotacao, vinculo` —
   sem CPF e sem remuneração. O portal expõe os dois (a API "Dados Abertos"
   inclusive expõe salário por rubrica); o schema não os recebe, e essa
   decisão é anterior a este módulo (é a mesma de Betim).

3. **UMA PESSOA APARECE MAIS DE UMA VEZ.** O grão da fonte é (servidor ×
   matrícula) — o mesmo nome sai duas vezes quando tem dois contratos (medido:
   46 pares duplicados em 1.354 linhas). A deduplicação é por `(nome, cargo)`,
   que é exatamente a chave de conflito do upsert de `servidores`; sem ela o
   upsert quebra com "ON CONFLICT DO UPDATE command cannot affect row a
   second time".

4. **A FONTE MISTURA ATIVO E LICENÇA/FÉRIAS/DESLIGADO.** O campo `situacao`
   tem valores como "Ativo", "Funcionario de Ferias", "Licenca Para
   Tratamento de Saude", "Demitido - ...". Só as linhas cujo `situacao`
   COMEÇA com "ativo" entram — o mesmo corte que a versão anterior deste
   módulo já fazia lendo a grade, preservado aqui de propósito: quem está de
   férias ou licença continua vinculado, mas não é o que "quem está na ativa
   agora" pretende contar, e mudar esse corte é decisão de produto, não de
   coletor.

5. **A COMPETÊNCIA (ano/mês) NÃO É "TODOS".** A fonte tem uma tabela por
   competência, e pedir `ano=0&mes=0` ("Todos" no combo) devolve o HISTÓRICO
   INTEIRO — medido ao vivo: 256 MB de JSON, uma linha por servidor por mês
   desde 2011. Este módulo pede só a competência que a própria grade usa como
   padrão (ver armadilha 6): a última com folha fechada, 1.354 linhas em vez
   de milhões.

6. **A PAGINAÇÃO NÃO FUNCIONAVA EM NAVEGADOR HEADLESS — E A CAUSA ERA A
   PERGUNTA ERRADA.** Duas rodadas de investigação (2026-08-10) mediram:

       window.grdDataClient.GotoPage(1)  -> nao emite requisicao nenhuma
       clique no "Proximo" (Playwright)  -> o veu de carregamento intercepta
       __doPostBack(...)                 -> ReferenceError: nao definido
       clicar no item ".csv" ESCONDIDO   -> POST de verdade, mas SEM
                                             __EVENTTARGET/__EVENTARGUMENT;
                                             __EVENTVALIDATION recusa o alvo
                                             forjado e devolve pagina sem grade

   A pista que resolveu (2026-08-11): abrir o dropdown "Imprimir Relatório"
   pelo BOTÃO certo (`..._DXCTMenu0_DXI2_T`, não o item `.csv` escondido
   direto) faz o clique passar pelo handler do DevExpress — mas mesmo assim
   o POST resultante volta como PÁGINA NORMAL (a mesma grade, HTML, sem
   `Content-Disposition`), não como arquivo. **Esse caminho continua morto,
   documentado aqui para quem for tentar de novo não repetir a mesma hora.**

   O que resolveu de verdade foi um botão VIZINHO, "Dados Abertos" (ícone de
   banco de dados, ao lado de "Imprimir Relatório", texto do title: "Baixar
   os dados abertos desta consulta."). Ele não abre menu nenhum — navega
   direto para `/api/pessoal/api-servidores.aspx`, uma página SEPARADA com um
   formulário "EXPORTAR DADOS" (combos Ano/Mês/Formato + um
   `<button type="submit">`, ASP.NET WebForms comum, sem DevExpress grid).
   Submeter ESSE formulário — com `requests` puro, sem navegador — devolve o
   arquivo de verdade: `Content-Disposition: attachment`,
   `Content-Type: application/json`, um objeto por servidor por competência,
   já com `situacao`/`nome`/`cargo`/`secretaria`/`regime` nomeados. Não é
   pagination resolvida — é uma ROTA DIFERENTE que sempre existiu, pensada
   para consumo automatizado, ao lado da que só serve a tela.

   **Consequência prática:** este módulo não usa mais Playwright. Um
   navegador headless nunca foi necessário para ESTE dado — só para a grade,
   que era o caminho errado.

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

Não remove quem saiu. O `servidores` é escrito por upsert em
`(id_municipio, orgao, nome, cargo)` — mesma semântica de Betim —, então um
servidor que deixa a prefeitura continua na tabela até alguém apagar. É
limitação herdada e conhecida, e trocá-la por refresh total exigiria decidir o
mesmo para Betim, que tem 9.803 linhas.
"""
from __future__ import annotations

import argparse
import re
import sys

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

LOG = "[etl.prefeitura.portaltp]"

# A grade (HTML) só é lida para descobrir a competência PADRÃO do portal — ver
# armadilha 6. O dado em si vem de CAMINHO_API_SERVIDORES.
CAMINHO_SERVIDORES = "consultas/pessoal/servidores.aspx"
CAMINHO_API_SERVIDORES = "api/pessoal/api-servidores.aspx"

ID_CBX_ANO = "ctl00_containerCorpo_cbxAno"
ID_CBX_MES = "ctl00_containerCorpo_cbxMes"

# Identificação honesta com o portal. É município pequeno, servidor modesto, e
# um agente identificado pode ser avisado antes de ser bloqueado.
AGENTE = "controle-popular/1.0 (+https://controlepopular.com.br) transparencia publica"

# Só quem está na ativa. Ver armadilha 4.
PREFIXO_ATIVO = "ativo"


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
    return host.rstrip("/")


def _campo_oculto(html: str, id_campo: str) -> str:
    """Valor de um `<input type="hidden">` do ASP.NET (`__VIEWSTATE` e afins).

    Regex e não um parser de HTML de verdade: os três campos que este módulo
    lê (`__VIEWSTATE`, `__VIEWSTATEGENERATOR`, `__EVENTVALIDATION`) são
    sempre `id="..." value="..."` num único atributo, e trazer uma
    dependência de parsing para três campos previsíveis é peso que a tarefa
    não pede.
    """
    m = re.search(rf'id="{re.escape(id_campo)}" value="([^"]*)"', html)
    if not m:
        raise RuntimeError(
            f"campo oculto '{id_campo}' não encontrado — o portal mudou de estrutura "
            "(ou não é mais ASP.NET WebForms nessa página)."
        )
    return m.group(1)


def _combo_padrao(html: str, unique_id: str) -> str:
    """O valor SELECIONADO POR PADRÃO de um `ASPxComboBox` (ex.: `cbxAno`).

    Vem do `lastSuccessValue` que o próprio DevExpress embute no script de
    inicialização do controle — é o mesmo valor que apareceria pré-marcado
    pra um humano abrindo a página num navegador. Este módulo usa o padrão do
    PORTAL (normalmente a última competência com folha fechada) em vez de
    escolher um ano/mês por conta própria: ver armadilha 5 — pedir "Todos" é
    o histórico inteiro, e chutar uma competência às cegas arrisca pedir um
    mês que a prefeitura ainda não fechou.
    """
    m = re.search(
        rf"BootstrapClientComboBox,'{re.escape(unique_id)}'.*?lastSuccessValue':'([^']*)'",
        html,
        re.S,
    )
    if not m:
        raise RuntimeError(
            f"não achei o valor padrão de '{unique_id}' — o portal mudou de estrutura."
        )
    return m.group(1)


def mapear(item: dict, id_municipio: str) -> dict | None:
    """Um registro do JSON "Dados Abertos" vira uma linha de `servidores` —
    ou `None`.

    Devolve `None` para quem não está na ativa (armadilha 4) e para o
    registro sem nome ou sem cargo, que são as duas coisas que o upsert
    precisa ter. Função pura de propósito: é a única parte deste módulo que
    dá para conferir sem rede.
    """
    situacao = (item.get("situacao") or "").strip().lower()
    if not situacao.startswith(PREFIXO_ATIVO):
        return None
    nome = (item.get("nome") or "").strip()
    cargo = (item.get("cargo") or "").strip()
    if not nome or not cargo:
        return None
    return {
        "id_municipio": id_municipio,
        # "prefeitura" literal, como em `b3106705`: a coluna distingue
        # prefeitura de câmara, não uma secretaria da outra (isso é `lotacao`).
        "orgao": "prefeitura",
        "nome": nome,
        "cargo": cargo,
        # "secretaria" é o nível mais alto da hierarquia que a fonte expõe
        # (existem também `local`/`divisao`/`secao`, mais finos); é o análogo
        # mais direto da única coluna "Lotação" que a grade mostrava.
        "lotacao": (item.get("secretaria") or "").strip() or None,
        # "regime" é como a fonte chama o tipo de vínculo (Efetivo,
        # Comissionado, Contrato Determinado, ...) — mesmo conceito que
        # `ServidorVinculo` em `b3106705`, nome diferente por fornecedor.
        "vinculo": (item.get("regime") or "").strip() or None,
    }


def colher(host: str, id_municipio: str) -> tuple[list[dict], dict]:
    """Baixa o export "Dados Abertos" (JSON) da competência padrão do portal.

    Um request de leitura (para achar a competência padrão) e um POST (para
    baixar o arquivo) — sem navegador, sem paginação. Ver armadilha 6 no
    cabeçalho do módulo para a história de por que isto substitui a leitura
    da grade em Playwright que existia antes.
    """
    import requests

    url_grade = f"{host}/{CAMINHO_SERVIDORES}"
    url_api = f"{host}/{CAMINHO_API_SERVIDORES}"

    diag = {"ano": None, "mes": None, "total_lido": 0, "descartados": 0}

    with requests.Session() as sessao:
        sessao.headers["User-Agent"] = AGENTE

        r_grade = sessao.get(url_grade, timeout=30)
        r_grade.raise_for_status()
        ano = _combo_padrao(r_grade.text, ID_CBX_ANO)
        mes = _combo_padrao(r_grade.text, ID_CBX_MES)
        if ano == "0" or mes == "0":
            # "0" é o valor de "Todos" nos dois combos (ver armadilha 5). Se o
            # portal um dia passar a default nisso, seguir em frente pediria
            # o histórico inteiro sem ninguém ter decidido isso.
            raise RuntimeError(
                f"o filtro padrão da grade voltou 'Todos' (ano={ano!r}, mes={mes!r}) — "
                "pedir o histórico inteiro custaria centenas de MB. Conferir "
                f"manualmente em {url_grade} antes de seguir."
            )
        diag["ano"], diag["mes"] = ano, mes

        r_api = sessao.get(url_api, timeout=30)
        r_api.raise_for_status()
        campos = {
            "__VIEWSTATE": _campo_oculto(r_api.text, "__VIEWSTATE"),
            "__VIEWSTATEGENERATOR": _campo_oculto(r_api.text, "__VIEWSTATEGENERATOR"),
            "__EVENTVALIDATION": _campo_oculto(r_api.text, "__EVENTVALIDATION"),
            "ctl00$containerCorpo$cbxAno": ano,
            "ctl00$containerCorpo$cbxMes": mes,
            "ctl00$containerCorpo$cbxFormato": "JSON",
            "ctl00$containerCorpo$btnAplicFiltro": "Exportar",
        }
        resp = sessao.post(url_api, data=campos, timeout=120)
        resp.raise_for_status()

    tipo = resp.headers.get("Content-Type", "")
    if "json" not in tipo.lower():
        raise RuntimeError(
            f"esperava JSON de {url_api} e vim Content-Type={tipo!r} — o export mudou "
            "de formato, ou o formulário não validou e voltou a página normal. "
            f"Primeiros 300 bytes da resposta: {resp.text[:300]!r}"
        )
    brutos = resp.json()
    if not isinstance(brutos, list):
        raise RuntimeError(
            f"esperava uma LISTA JSON de {url_api}, vim {type(brutos).__name__}."
        )
    diag["total_lido"] = len(brutos)

    linhas: list[dict] = []
    vistos: set[tuple[str, str]] = set()
    for item in brutos:
        linha = mapear(item, id_municipio)
        if linha is None:
            diag["descartados"] += 1
            continue
        chave = (linha["nome"], linha["cargo"])
        if chave in vistos:
            continue
        vistos.add(chave)
        linhas.append(linha)

    return linhas, diag


def sincronizar(id_municipio: str, *, sondar: bool = False) -> int:
    municipio = carregar_municipio(id_municipio)
    host = _host(municipio)
    print(f"{LOG} {municipio['nome']}/{municipio['uf']} — {host}")

    linhas, diag = colher(host, id_municipio)
    print(
        f"{LOG} competencia={diag['mes']}/{diag['ano']} total_lido={diag['total_lido']} "
        f"descartados={diag['descartados']} ativos_unicos={len(linhas)}"
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

    client = get_supabase_client()
    client.table("servidores").upsert(linhas, on_conflict="id_municipio,orgao,nome,cargo").execute()
    print(f"{LOG} id_municipio={id_municipio} servidores gravados={len(linhas)}")
    return len(linhas)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Servidores de prefeituras clientes do PortalTP.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--sondar", action="store_true", help="lê e relata, NÃO grava")
    args = parser.parse_args()

    try:
        sincronizar(args.id_municipio, sondar=args.sondar)
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise SystemExit(1)
