r"""etl.prefeitura.cidadesmg — quadro de servidores de qualquer prefeitura que
publique a folha de pagamento no portal do fornecedor **CidadesMG**
(`cidadesmg.com.br/portaltransparencia`).

Alvo inicial: Itinga-MG (3134004).

    python -m etl.prefeitura.cidadesmg --id-municipio 3134004
    python -m etl.prefeitura.cidadesmg --id-municipio 3134004 --sondar

═══ POR QUE ESTE MÓDULO É POR FORNECEDOR (mesma resposta do portaltp.py) ═══

A tarefa original supunha que Itinga usasse "CidadesMG" e Diamantina usasse
"PortalTransp, mesmo fornecedor de Araçuaí" — conferido ao vivo em
2026-08-11: a suposição sobre Itinga bateu, a de Diamantina não. O portal de
Diamantina (`portaltransp.com.br`) é WordPress + PHP puro; o de Araçuaí
(`portaltp.com.br`, ver `etl.prefeitura.portaltp`) é ASP.NET WebForms +
DevExpress. Nomes parecidos, fornecedores diferentes — daí Diamantina ganhar
o módulo `etl.prefeitura.portaltransp`, não uma reconfiguração deste aqui ou
do `portaltp.py`. CidadesMG é o terceiro fornecedor do trio, e este módulo é
só dele.

═══ MULTI-TENANT POR QUERY STRING, NÃO POR SUBDOMÍNIO ═══

Ao contrário do PortalTP (cada cliente ganha um subdomínio,
`aracuai-mg.portaltp.com.br`), o CidadesMG serve TODAS as prefeituras
clientes do MESMO domínio (`cidadesmg.com.br/portaltransparencia`),
distinguindo a cidade por um parâmetro `Param` na URL (`?Param=Itinga`). O
host sai do banco como sempre (ver `_host_e_param`), mas aqui o "endereço da
cidade" são DOIS valores — host do fornecedor e código da cidade dentro
dele —, não um host único por cliente.

═══ AS ARMADILHAS, MEDIDAS AO VIVO (2026-08-11) ═══

1. **A TELA É JSF/PRIMEFACES COM VIEWSTATE, NÃO REST.** Cada busca é um POST
   ajax (`javax.faces.partial.ajax=true`) que carrega `javax.faces.ViewState`
   — o equivalente JSF do `__VIEWSTATE` do ASP.NET que o portaltp.py já
   enfrentou. Medido: o mesmo valor de ViewState serve para a consulta E para
   toda a paginação seguinte dentro da mesma sessão (cookie `JSESSIONID`);
   não precisa reextrair a cada request, só na abertura da sessão.

2. **O COMBO "MÊS" DA TELA NÃO TEM "PADRÃO INTELIGENTE" — E ISSO QUEBRA A
   TÉCNICA DO portaltp.py.** O portaltp confia no valor pré-selecionado pelo
   próprio portal (armadilha 5 daquele módulo); aqui o combo sempre abre em
   "Ano corrente / Janeiro", INDEPENDENTE de existir dado publicado. Medido
   em 2026-08-11: Itinga não tem UMA linha de folha desde janeiro/2025 —
   nenhum mês de 2025 ou 2026 devolve resultado, mas outubro, novembro e
   dezembro/2024 devolvem (34, 33 e 66 páginas). A prefeitura simplesmente
   parou de publicar depois da troca de gestão (eleição municipal de
   outubro/2024, posse em janeiro/2025); não há como saber isso adivinhando
   o combo. Por isso este módulo NÃO confia em nenhum padrão do portal:
   `descobrir_competencia` varre para trás a partir do mês corrente,
   mês a mês, até achar o primeiro com resultado — robusto tanto a este
   hiato quanto a Itinga voltar a publicar no futuro.

3. **"VÍNCULO" MISTURA TIPO DE CONTRATO COM SITUAÇÃO (ativo/inativo).** Não
   existe um campo "situação" separado como no portaltp (armadilha 4 de
   lá). O combo "Vínculo" desta fonte tem, lado a lado, tipos de contrato
   (efetivo, celetista, comissionado, contrato administrativo, estagiário,
   ...) E categorias que são estado, não contrato: "PENSIONISTA" (não é
   servidor, é dependente recebendo pensão), "INATIVO AUX. DOENÇA" e
   "INATIVOS APOSENTADO" (aposentados/afastados). `VINCULOS_FORA_DA_ATIVA`
   documenta esse bloqueio — é a mesma decisão de produto que o portaltp
   materializa com o prefixo "ativo", só que aqui não dá para fazer com um
   único prefixo porque a fonte não separa os dois eixos.

4. **DEZEMBRO DUPLICA TODO MUNDO (folha normal + 13º salário).** A
   competência de dezembro tem uma linha "12" e outra "12(13º Sal.)" por
   servidor — mesmo nome, mesmo cargo, valores diferentes. Não é o mesmo
   fenômeno da armadilha 3 do portaltp (duplo vínculo/matrícula); aqui é o
   MESMO vínculo pago duas vezes no mês. A deduplicação por `(nome, cargo)`
   — igual à do portaltp — resolve os dois casos com o mesmo código.

5. **"CSV"/"TXT" DA TELA NÃO SÃO TABELA — SÃO HOLERITE.** Os botões de
   exportação (`form:j_idt37/38/39` = PDF/CSV/TXT) devolvem um extrato de
   contracheque por servidor (rubrica a rubrica: salário base, insalubridade,
   descontos...), não a tabela columnar que a tela mostra. Testado ao vivo:
   CSV de Itinga/dez-2024 veio como "RELATÓRIO FOLHA DE PAGAMENTO ... /
   Matricula/Nome: 13;PAULO GOMES ALVES / Cargo: ... / 100;SALARIO BASE;...".
   Não seria impossível de parsear, mas exigiria reconstruir por rubrica
   além de dar exatamente o dado (remuneração) que este projeto decidiu não
   gravar (ver `servidores` no schema). Por isso este módulo lê a GRADE da
   tela (via os mesmos POSTs ajax que a paginação usa), que já vem em
   `nome, cargo, vínculo, dpto` limpos — mais barato e sem a informação que
   a tabela `servidores` nunca teve coluna para guardar.

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

Não grava remuneração (armadilha 5) nem matrícula/CPF (a fonte nem expõe
CPF nesta tela). Não remove quem saiu — mesma limitação herdada do
portaltp.py e do b3106705, upsert por `(id_municipio, orgao, nome, cargo)`.
"""
from __future__ import annotations

import argparse
import datetime
import re
import sys

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

# Console do Windows não é UTF-8 por padrão: sem isto, `print` de nome/cargo
# acentuado (a fonte manda "SERVIÇOS", "SAÚDE" etc.) vira "�" mesmo com o
# dado certo na memória — medido ao vivo gravando o log e reabrindo o
# arquivo. Só afeta o que aparece no terminal/log; o que vai para o banco
# passa por outro caminho (psycopg, UTF-8 sempre) e nunca foi afetado.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

LOG = "[etl.prefeitura.cidadesmg]"

AGENTE = "controle-popular/1.0 (+https://controlepopular.com.br) transparencia publica"

# Quantos meses, no máximo, este módulo anda para trás procurando a última
# competência publicada (ver armadilha 2). Medido: Itinga precisou andar uns
# 20 meses (jan/2025 até ago/2026, achando parada em dez/2024); a folga aqui
# é para não ficar preso num hiato ainda maior sem nunca desistir.
MAX_MESES_RETROCEDER = 36

# Ver armadilha 3: categorias do combo "Vínculo" que são situação (não
# contrato), então não contam como "está na ativa hoje". Comparação é feita
# já em maiúsculas/sem espaços nas pontas.
VINCULOS_FORA_DA_ATIVA = {
    "PENSIONISTA",
    "INATIVO AUX. DOENÇA",
    "INATIVOS APOSENTADO",
}

_RE_VIEWSTATE_HTML = re.compile(
    r'id="j_id1:javax\.faces\.ViewState:0" value="([^"]*)"'
)
_RE_VIEWSTATE_CDATA = re.compile(
    r'<update id="j_id1:javax\.faces\.ViewState:0"><!\[CDATA\[([^\]]*)\]\]></update>'
)
_RE_PAGINA = re.compile(r"gina:\s*(\d+)\s*de\s*(\d+)")
_RE_SEM_RESULTADO = re.compile(r"encontrados")
_RE_UPDATE_CDATA = re.compile(r"<update id=\"[^\"]*\"><!\[CDATA\[(.*?)\]\]></update>", re.S)


def _host_e_param(municipio: dict) -> tuple[str, str]:
    """Host do fornecedor + código da cidade dentro dele. Ver `_host` do
    portaltp.py para a lição de 2026-08-03 que isto reaplica: os dois saem
    do BANCO, nunca de argumento de linha de comando."""
    fontes = municipio.get("fontes") or {}
    sistema = fontes.get("prefeitura_transparencia_sistema")
    host = fontes.get("prefeitura_transparencia_host")
    param = fontes.get("prefeitura_transparencia_param")
    if sistema != "cidadesmg" or not host or not param:
        raise RuntimeError(
            f"{municipio['nome']} ({municipio['id_municipio']}) não está registrada como "
            f"cliente do CidadesMG. Esperado em `municipios.fontes`: "
            f'prefeitura_transparencia_sistema="cidadesmg", prefeitura_transparencia_host '
            f"e prefeitura_transparencia_param. Achado: sistema={sistema!r}, host={host!r}, "
            f"param={param!r}."
        )
    return host.rstrip("/"), param


def _extrair_cdatas(xml_texto: str) -> str:
    """Concatena o conteúdo de todos os blocos `<update>...<![CDATA[...]]>`
    de uma resposta ajax do JSF. A resposta tem um `<update>` por região
    redesenhada (o formulário inteiro na consulta, só `form:pgtee` na
    paginação) — juntar os dois cobre ambos os casos com o mesmo parser."""
    return "\n".join(_RE_UPDATE_CDATA.findall(xml_texto))


def _linhas_da_pagina(fragmento_html: str) -> list[list[str]]:
    """As linhas de dado (12 células) da grade de folha, numa página.

    12 é o número de colunas que a tela mostra (Matricula, Ano, Mês,
    Servidor, Data Admissão, Cargo/Função, Vínculo, Dpto, Local, Valor
    Bruto, Valor Desconto, Valor Líquido) — filtra fora o `<tr role="row">`
    do cabeçalho (que não tem `<td>`, só `<th>`) sem precisar distinguir
    thead de tbody.
    """
    from lxml import html

    if not fragmento_html.strip():
        return []
    arvore = html.fromstring(fragmento_html)
    linhas = []
    for tr in arvore.xpath('//tr[@role="row"]'):
        celulas = [c.text_content().strip() for c in tr.xpath("./td")]
        if len(celulas) == 12:
            linhas.append(celulas)
    return linhas


def mapear(celulas: list[str], id_municipio: str) -> dict | None:
    """Uma linha da grade (12 células, ver `_linhas_da_pagina`) vira uma
    linha de `servidores` — ou `None` para quem não está na ativa (armadilha
    3) ou sem nome/cargo."""
    (
        _matricula,
        _ano,
        _mes,
        servidor,
        _data_admissao,
        cargo,
        vinculo,
        dpto,
        _local,
        _bruto,
        _desconto,
        _liquido,
    ) = celulas

    vinculo = vinculo.strip()
    if vinculo.upper() in VINCULOS_FORA_DA_ATIVA:
        return None
    nome = servidor.strip()
    cargo = cargo.strip()
    if not nome or not cargo:
        return None
    return {
        "id_municipio": id_municipio,
        "orgao": "prefeitura",
        "nome": nome,
        "cargo": cargo,
        "lotacao": dpto.strip() or None,
        "vinculo": vinculo or None,
    }


def _post_ajax(
    sessao,
    url: str,
    *,
    ano: str,
    mes: str,
    view_state: str,
    fonte_evento: str,
    executar: str,
    renderizar: str,
) -> tuple[str, str]:
    """Um POST ajax do formulário de folha (Consultar ou paginação).

    Devolve `(cdata_concatenado, view_state_atualizado)` — o ViewState quase
    nunca muda (armadilha 1), mas ler de volta o que o servidor mandar é
    mais seguro que assumir que fica igual para sempre.
    """
    dados = {
        "form": "form",
        "form:j_idt13": ano,
        "form:j_idt16": mes,
        "form:nrIn": "",
        "form:nrFIn": "",
        "form:nomeServ": "",
        "form:nomeCargo": "",
        "form:j_idt25": "0",  # Vínculo: TODOS — o filtro de ativa é feito em `mapear`.
        "form:nomeDpto": "",
        "form:nomeLocal": "",
        "javax.faces.ViewState": view_state,
        "javax.faces.partial.ajax": "true",
        "javax.faces.source": fonte_evento,
        "javax.faces.partial.execute": executar,
        "javax.faces.partial.render": renderizar,
        fonte_evento: fonte_evento,
    }
    resp = sessao.post(
        url,
        data=dados,
        headers={"Faces-Request": "partial/ajax", "Referer": url},
        timeout=30,
    )
    resp.raise_for_status()
    texto = resp.text
    m = _RE_VIEWSTATE_CDATA.search(texto)
    novo_view_state = m.group(1) if m else view_state
    return _extrair_cdatas(texto), novo_view_state


def descobrir_competencia(sessao, url: str, view_state: str) -> tuple[int, int, int, list[list[str]], str]:
    """Varre para trás a partir do mês corrente (armadilha 2) até achar a
    primeira competência com resultado.

    Devolve `(ano, mes, total_paginas, linhas_da_pagina_1, view_state)` —
    a chamada que descobre a competência já é a mesma que traz a página 1,
    então não faz um segundo request só para reobter o que já veio.
    """
    hoje = datetime.date.today()
    ano, mes = hoje.year, hoje.month
    for _ in range(MAX_MESES_RETROCEDER):
        cdata, view_state = _post_ajax(
            sessao,
            url,
            ano=str(ano),
            mes=str(mes),
            view_state=view_state,
            fonte_evento="form:j_idt32",
            executar="@all",
            renderizar="form",
        )
        m_pagina = _RE_PAGINA.search(cdata)
        if m_pagina:
            total_paginas = int(m_pagina.group(2))
            linhas = _linhas_da_pagina(cdata)
            return ano, mes, total_paginas, linhas, view_state
        if not _RE_SEM_RESULTADO.search(cdata):
            # Nem "Página: X de Y" nem "...encontrados": a tela mudou de
            # formato e nenhum dos dois regexes bate mais.
            raise RuntimeError(
                f"resposta de {ano}-{mes:02d} não bateu nem com resultado nem com "
                "'sem resultado' — a tela do CidadesMG mudou de estrutura."
            )
        # "Não foram encontrados resultados": anda um mês para trás.
        mes -= 1
        if mes == 0:
            mes, ano = 12, ano - 1

    raise RuntimeError(
        f"nenhuma competência com dado nos últimos {MAX_MESES_RETROCEDER} meses "
        f"(voltando de {hoje.year}-{hoje.month:02d}). Conferir manualmente em {url}."
    )


def colher(host: str, param: str, id_municipio: str) -> tuple[list[dict], dict]:
    """Descobre a competência publicada mais recente e lê a grade inteira
    (todas as páginas) daquela competência."""
    import requests

    url = f"{host}/faces/user/folha/FFolhaPagamento.xhtml?Param={param}"
    diag = {"ano": None, "mes": None, "paginas": 0, "total_lido": 0, "descartados": 0}

    with requests.Session() as sessao:
        sessao.headers["User-Agent"] = AGENTE

        r0 = sessao.get(url, timeout=30)
        r0.raise_for_status()
        m = _RE_VIEWSTATE_HTML.search(r0.text)
        if not m:
            raise RuntimeError(
                f"ViewState não encontrado na página inicial ({url}) — a tela mudou "
                "de estrutura (ou não é mais JSF/Mojarra)."
            )
        view_state = m.group(1)

        ano, mes, total_paginas, linhas_brutas, view_state = descobrir_competencia(
            sessao, url, view_state
        )
        diag["ano"], diag["mes"], diag["paginas"] = ano, mes, total_paginas

        todas_linhas = list(linhas_brutas)
        for _ in range(total_paginas - 1):
            cdata, view_state = _post_ajax(
                sessao,
                url,
                ano=str(ano),
                mes=str(mes),
                view_state=view_state,
                fonte_evento="form:btProL",
                executar="@all",
                renderizar="form:pgtee",
            )
            todas_linhas.extend(_linhas_da_pagina(cdata))

    diag["total_lido"] = len(todas_linhas)

    resultado: list[dict] = []
    vistos: set[tuple[str, str]] = set()
    for celulas in todas_linhas:
        linha = mapear(celulas, id_municipio)
        if linha is None:
            diag["descartados"] += 1
            continue
        chave = (linha["nome"], linha["cargo"])
        if chave in vistos:
            continue
        vistos.add(chave)
        resultado.append(linha)

    return resultado, diag


def sincronizar(id_municipio: str, *, sondar: bool = False) -> int:
    municipio = carregar_municipio(id_municipio)
    host, param = _host_e_param(municipio)
    print(f"{LOG} {municipio['nome']}/{municipio['uf']} — {host} (Param={param})")

    linhas, diag = colher(host, param, id_municipio)
    print(
        f"{LOG} competencia={diag['mes']}/{diag['ano']} paginas={diag['paginas']} "
        f"total_lido={diag['total_lido']} descartados={diag['descartados']} "
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

    client = get_supabase_client()
    client.table("servidores").upsert(linhas, on_conflict="id_municipio,orgao,nome,cargo").execute()
    print(f"{LOG} id_municipio={id_municipio} servidores gravados={len(linhas)}")
    return len(linhas)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Servidores de prefeituras clientes do CidadesMG.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--sondar", action="store_true", help="lê e relata, NÃO grava")
    args = parser.parse_args()

    try:
        sincronizar(args.id_municipio, sondar=args.sondar)
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise SystemExit(1)
