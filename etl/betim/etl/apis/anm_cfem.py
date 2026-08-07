"""etl.apis.anm_cfem — royalties da mineração (CFEM) por município, lendo os
relatórios públicos da **ANM** (Agência Nacional de Mineração).

Fonte: `https://sistemas.anm.gov.br/arrecadacao/extra/Relatorios/` — dois
relatórios ASP.NET WebForms, sem chave e sem login:

  * `arrecadacao_cfem_substancia.aspx` — série 2004→hoje, **por substância e
    por mês**. É o que mostra o lítio (`ESPODUMÊNIO`) nascendo em Araçuaí e
    Itinga.
  * `cfem/arrecadadores.aspx` — **quem pagou**: razão social, valor da
    operação, CFEM recolhida e a alíquota efetiva. É o que dá nome à
    empresa por trás do número.

POR QUE RASPAR WEBFORMS E NÃO UM DADO ABERTO. Foram medidos e descartados,
nesta ordem: `dados.gov.br` (exige chave de API por conjunto), o espelho
oficial da ANM no HuggingFace (**existe e está vazio**) e a Base dos Dados
(não tem conjunto da ANM). O relatório WebForms é a única via pública.

═══ AS ARMADILHAS MEDIDAS AO VIVO (2026-08-07) ═══

1. **A MESMA GUIA É CONTADA INTEIRA EM DOIS MUNICÍPIOS.** Em 2024,
   `SIGMA MINERACAO S.A.` aparece com *1 título*, R$ 268.606.086,50 de
   operação e R$ 6.290.155,84 de CFEM **tanto em Itinga quanto em Araçuaí** —
   o mesmo título, com o valor inteiro nos dois lados, não rateado. Cada
   município fecha certo consigo mesmo (o total bate com o relatório por
   substância), mas **somar municípios dupla-conta**. Por isso este módulo
   grava por município e a tabela avisa, no comentário da migration, que
   `sum()` entre cidades não é um número válido.

2. **CÉLULA DE MÊS VAZIA É OMITIDA NO TEXTO, NÃO NO HTML.** A grade tem 12
   colunas fixas e os meses sem arrecadação vêm como `<td></td>`. Qualquer
   parse que colapse texto e depois divida por espaço **desloca os meses**:
   uma linha com 10 valores viraria jan-out em vez dos meses certos. O parse
   aqui é POSICIONAL por célula e confere a largura da linha.

3. **O DROPDOWN DE MUNICÍPIO TEM 6 CÓDIGOS FANTASMA EM MG.** São 859 opções
   para os 853 municípios que o IBGE reconhece; as 6 sobrando têm o nome
   MASCARADO (`***` + tabulações, para o ASP.NET não colapsar itens de texto
   igual) e o código **não existe na lista do IBGE**. Casar município por
   NOME acharia `***`; casar por código vindo de `municipios` nunca cai
   nelas. A boa notícia é que o `value` do dropdown É o código IBGE
   (3103405 = Araçuaí), então o guarda de identidade fica direto.

4. **A CASCATA É OBRIGATÓRIA E O POSTBACK É EXIGENTE.** O `<select>` de
   município nasce VAZIO: só é populado pelo postback do `<select>` de UF.
   E o POST tem de reproduzir o formulário INTEIRO como o navegador o manda
   (os radios, `__LASTFOCUS`, e nenhum select vazio) — faltando qualquer
   peça o IIS devolve **HTTP 500**, não uma mensagem de validação.

5. **O RODAPÉ DA PÁGINA É LATIN-1 NUMA PÁGINA DECLARADA UTF-8.** O conteúdo
   do relatório é utf-8 correto; só o rodapé estático tem byte inválido.
   Deixar o `requests` decidir por sniffing (`apparent_encoding`) é apostar
   que o chute não vire latin-1 e transforme "ARAÇUAÍ" em mojibake numa
   rodada e não na outra. A decodificação aqui é **fixada em utf-8**, e o
   rodapé (que não lemos) fica com U+FFFD, que é o resultado certo.

6. **RELATÓRIO VAZIO É DADO.** Cidade sem mineração devolve grade vazia. Isso
   é "não há CFEM", não "o coletor quebrou" — e o log tem de dizer qual dos
   dois, senão os dois se parecem.

═══ O QUE ESTE MÓDULO ESCREVE ═══

- `royalties_cfem` — uma linha por (município, ano, mês, substância).
- `royalties_cfem_empresas` — uma linha por (município, ano, empresa).

Ambas por refresh total filtrado por `id_municipio`, com o guarda de redução
de `refresh_completo_seguro`.

Uso:

    python -m etl.apis.anm_cfem --id-municipio 3103405
    python -m etl.apis.anm_cfem --id-municipio 3134004 --desde 2020
    python -m etl.apis.anm_cfem --id-municipio 3121605 --partes substancias
    python -m etl.apis.anm_cfem --id-municipio 3103405 --sondar
"""
import argparse
import datetime as dt
import html
import re
import sys
import time
import unicodedata
from decimal import Decimal, InvalidOperation

import requests

from etl.common import (
    ID_MUNICIPIO_DEFAULT,
    carregar_municipio,
    get_supabase_client,
    refresh_completo_seguro,
)

LOG = "[etl.apis.anm_cfem]"

BASE = "https://sistemas.anm.gov.br/arrecadacao/extra/"
URL_SUBSTANCIA = BASE + "relatorios/arrecadacao_cfem_substancia.aspx"
URL_ARRECADADORES = BASE + "Relatorios/cfem/arrecadadores.aspx"

# Prefixo dos controles nas duas páginas (mesma master page).
P = "ctl00$ContentPlaceHolder1$"

# A série de `arrecadacao_cfem_substancia.aspx` começa em 2004 — é o primeiro
# ano do dropdown, e não um palpite. `--desde` só ENCURTA a janela.
ANO_INICIAL = 2004

TIMEOUT = 120
# Pausa entre postbacks. Não é rate limit publicado; é cortesia com um IIS que
# monta cada resposta por consulta ao banco.
PAUSA = 0.7

_UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"


class SemDadoNaFonte(RuntimeError):
    """A fonte respondeu, e a resposta é "não há CFEM aqui"."""


# ────────────────────────── WebForms: o mínimo ───────────────────────


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = _UA
    return s


def _texto(resp: requests.Response) -> str:
    """Decodificação FIXA em utf-8 (armadilha 5)."""
    return resp.content.decode("utf-8", errors="replace")


def _campo_oculto(pagina: str, nome: str) -> str | None:
    m = re.search(rf'name="{re.escape(nome)}"[^>]*value="([^"]*)"', pagina)
    return html.unescape(m.group(1)) if m else None


def _selects(pagina: str) -> dict[str, list[tuple[str, str]]]:
    """`{nome do select: [(value, rótulo), ...]}`, rótulos já sem entidade."""
    saida: dict[str, list[tuple[str, str]]] = {}
    for m in re.finditer(r'(?s)<select[^>]*name="([^"]+)"[^>]*>(.*?)</select>', pagina):
        saida[m.group(1)] = [
            (v, " ".join(html.unescape(rot).split()))
            for v, rot in re.findall(
                r'<option[^>]*value="([^"]*)"[^>]*>([^<]*)</option>', m.group(2)
            )
        ]
    return saida


def _opcao_marcada(pagina: str, nome: str) -> str | None:
    m = re.search(rf'(?s)<select[^>]*name="{re.escape(nome)}"[^>]*>(.*?)</select>', pagina)
    if not m:
        return None
    sel = re.search(r'<option[^>]*selected="selected"[^>]*value="([^"]*)"', m.group(1))
    if sel:
        return html.unescape(sel.group(1))
    ops = re.findall(r'value="([^"]*)"', m.group(1))
    return html.unescape(ops[0]) if ops else None


def _formulario(pagina: str, escolhas: dict[str, str], radios: dict[str, str]) -> dict[str, str]:
    """Reproduz o formulário inteiro, como o navegador o enviaria.

    ARMADILHA 4: o IIS responde **500** — não uma validação — se faltar um
    campo oculto, um radio ou se um `<select>` ainda vazio for enviado com
    valor. Por isso: todo select entra com o que está marcado, select sem
    opção NÃO entra, e os radios vêm sempre.
    """
    form: dict[str, str] = {}
    for oculto in ("__VIEWSTATE", "__VIEWSTATEGENERATOR", "__EVENTVALIDATION"):
        v = _campo_oculto(pagina, oculto)
        if v is not None:
            form[oculto] = v
    form.update(
        {"__EVENTTARGET": "", "__EVENTARGUMENT": "", "__LASTFOCUS": "",
         "__SCROLLPOSITIONX": "0", "__SCROLLPOSITIONY": "0"}
    )
    for nome, opcoes in _selects(pagina).items():
        if nome in escolhas:
            form[nome] = escolhas[nome]
        elif opcoes:
            marcada = _opcao_marcada(pagina, nome)
            if marcada is not None:
                form[nome] = marcada
    form.update(radios)
    for chave, valor in escolhas.items():
        # `__EVENTTARGET` e o botão de submit não são selects e entram aqui.
        if chave.startswith("__") or chave.endswith("btnGera"):
            form[chave] = valor
    return form


def _postar(sessao: requests.Session, url: str, pagina: str, escolhas, radios) -> str:
    time.sleep(PAUSA)
    resp = sessao.post(url, data=_formulario(pagina, escolhas, radios), timeout=TIMEOUT)
    if resp.status_code != 200:
        raise RuntimeError(
            f"{url}: postback devolveu HTTP {resp.status_code}. O IIS da ANM responde 500 "
            "quando o formulário chega incompleto — confira `_formulario` (armadilha 4)."
        )
    return _texto(resp)


def _linhas_de_tabela(fragmento: str) -> list[list[str]]:
    """`<tr>`s como listas de células, **preservando as vazias** (armadilha 2)."""
    linhas = []
    for tr in re.findall(r"(?s)<tr[^>]*>(.*?)</tr>", fragmento):
        celulas = [
            " ".join(html.unescape(re.sub(r"<[^>]+>", "", c)).split())
            for c in re.findall(r"(?s)<t[dh][^>]*>(.*?)</t[dh]>", tr)
        ]
        if celulas:
            linhas.append(celulas)
    return linhas


def _resultado(pagina: str) -> str:
    """O trecho da página que é o relatório — nunca o formulário inteiro."""
    m = re.search(r'(?s)<div id="ctl00_ContentPlaceHolder1_dvResultado">(.*)', pagina)
    corte = m.group(1) if m else pagina[pagina.find("btnGera") :]
    return corte[: corte.rfind("</form>")] if "</form>" in corte else corte


# ─────────────────────────── números e nomes ─────────────────────────


def _valor(texto: str) -> Decimal | None:
    """`"1.689.156,58"` -> `Decimal("1689156.58")`. Célula vazia -> None."""
    limpo = (texto or "").replace("\xa0", " ").strip().rstrip("%").strip()
    if not limpo or limpo in ("-", "·"):
        return None
    try:
        return Decimal(limpo.replace(".", "").replace(",", "."))
    except InvalidOperation:
        raise RuntimeError(f"célula não numérica onde se esperava valor: {texto!r}")


def _sem_acento(texto: str) -> str:
    base = unicodedata.normalize("NFD", texto or "")
    return "".join(c for c in base if unicodedata.category(c) != "Mn")


def _mesma_cidade(rotulo: str, nome: str) -> bool:
    return _sem_acento(rotulo).upper().strip() == _sem_acento(nome).upper().strip()


def _conferir_identidade(pagina: str, cidade: dict, campo_municipio: str) -> None:
    """Prova que a grade lida é a do município pedido — pelo rótulo ECOADO.

    POR QUE ISTO EXISTE. É o mesmo guarda de `etl.camaras.sapl`, pelo mesmo
    motivo do defeito de 2026-08-03 (`etl.apis.anp` gravou os postos de Betim
    com o id de São Paulo). Aqui a prova é mais forte do que lá: a ANM ECOA o
    filtro aplicado num bloco "Filtros" acima da grade, então dá para conferir
    o que o servidor ENTENDEU, e não o que mandamos.

    Cidade com nome mascarado (`***`, armadilha 3) aborta de propósito: sem o
    rótulo não há prova de identidade, e gravar royalties na cidade errada é
    exatamente o dano que este guarda existe para impedir.
    """
    linhas = _linhas_de_tabela(_resultado(pagina))
    rotulo = None
    for celulas in linhas:
        if len(celulas) >= 2 and celulas[0].rstrip(": ").lower().startswith("munic"):
            rotulo = celulas[1]
            break
    if rotulo is None:
        raise RuntimeError(
            f"a resposta não ecoou o filtro de município ({campo_municipio}). Recuso "
            "gravar sem a prova de que a grade lida é a da cidade pedida."
        )
    if rotulo.strip("* \t") == "":
        raise RuntimeError(
            f"a ANM devolve o nome de {cidade['id_municipio']} MASCARADO ({rotulo!r}). "
            "Sem rótulo não há como provar identidade — ver armadilha 3."
        )
    if not _mesma_cidade(rotulo, cidade["nome"]):
        raise RuntimeError(
            f"a ANM ecoou o município {rotulo!r} para o código {campo_municipio}, mas "
            f"`municipios` diz {cidade['nome']!r}. Recuso gravar: royalties da cidade "
            "errada é dano silencioso."
        )


def _abrir_com_uf(sessao: requests.Session, url: str, cidade: dict, escolhas_uf: dict) -> str:
    """GET + o postback de UF que popula o dropdown de município (armadilha 4)."""
    time.sleep(PAUSA)
    resp = sessao.get(url, timeout=TIMEOUT)
    resp.raise_for_status()
    return _postar(sessao, url, _texto(resp), escolhas_uf, {})


def _conferir_no_dropdown(pagina: str, campo: str, cidade: dict) -> None:
    """O código IBGE da cidade tem de estar entre as opções — e com o nome certo.

    Código ausente aqui não é "cidade sem mineração": é cidade que a ANM não
    conhece por esse código, e postá-lo assim mesmo devolveria a grade de
    outra coisa (ou um 500) sem que nada dissesse por quê.
    """
    opcoes = dict(_selects(pagina).get(campo, []))
    id_municipio = cidade["id_municipio"]
    if id_municipio not in opcoes:
        raise RuntimeError(
            f"o código {id_municipio} não está no dropdown de município da ANM para "
            f"{cidade['uf']} ({len(opcoes)} opção(ões)). O postback de UF falhou ou a "
            "ANM não conhece esta cidade — não posto um código que ela não ofereceu."
        )
    rotulo = opcoes[id_municipio]
    if not _mesma_cidade(rotulo, cidade["nome"]):
        raise RuntimeError(
            f"o dropdown da ANM chama {id_municipio} de {rotulo!r}, mas `municipios` diz "
            f"{cidade['nome']!r}. Ver armadilha 3 (há 6 códigos fantasma em MG)."
        )


# ───────────────────── relatório 1: por substância ───────────────────

_RADIOS_SUBSTANCIA = {P + "rdOrdem": "subs_nome_substancia"}


def _coletar_substancias(cidade: dict, anos: list[int]) -> list[dict]:
    sessao = _sessao()
    id_municipio, uf = cidade["id_municipio"], cidade["uf"]
    escolhas_uf = {
        "__EVENTTARGET": P + "unfe_sigla_uf",
        P + "nu_ano": str(anos[0]),
        P + "unfe_sigla_uf": uf,
    }
    pagina = _abrir_com_uf(sessao, URL_SUBSTANCIA, cidade, escolhas_uf)
    _conferir_no_dropdown(pagina, P + "muni_cod_municipio", cidade)

    hoje = dt.date.today().isoformat()
    linhas: list[dict] = []
    anos_vazios: list[int] = []
    for ano in anos:
        pagina = _postar(
            sessao,
            URL_SUBSTANCIA,
            pagina,
            {
                P + "nu_ano": str(ano),
                P + "unfe_sigla_uf": uf,
                P + "muni_cod_municipio": id_municipio,
                P + "btnGera": "Gera",
            },
            _RADIOS_SUBSTANCIA,
        )
        _conferir_identidade(pagina, cidade, id_municipio)
        do_ano = _ler_grade_substancias(pagina, cidade, ano, hoje)
        if not do_ano:
            anos_vazios.append(ano)
        linhas.extend(do_ano)

    if anos_vazios:
        print(
            f"{LOG} {len(anos_vazios)} ano(s) sem CFEM em {cidade['nome']} "
            f"({anos_vazios[0]}-{anos_vazios[-1]}): a fonte respondeu e a grade veio "
            "vazia — é ausência de arrecadação, não falha de coleta (armadilha 6)."
        )
    return linhas


def _ler_grade_substancias(pagina: str, cidade: dict, ano: int, hoje: str) -> list[dict]:
    """A grade `#  Substância  Jan..Dez  Total.`, conferindo as duas somas.

    A conferência é o ponto: a soma dos 12 meses tem de bater com o total
    IMPRESSO na linha, e a soma das linhas com a linha `Total:`. É o que
    transforma um deslocamento de coluna (armadilha 2) em erro visível em vez
    de valor errado gravado com aparência de certo.
    """
    linhas_html = _linhas_de_tabela(_resultado(pagina))
    saida: list[dict] = []
    total_impresso: list[str] | None = None
    for celulas in linhas_html:
        if celulas[0].strip().rstrip(":").lower() == "total":
            total_impresso = celulas[1:]
            continue
        # Linha de dado: `#` numérico, nome da substância, 12 meses e o total.
        if not celulas[0].strip().isdigit() or len(celulas) != 15:
            continue
        substancia = celulas[1].strip()
        meses = [_valor(c) for c in celulas[2:14]]
        total = _valor(celulas[14])
        somado = sum(v for v in meses if v is not None)
        if total is not None and somado != total:
            raise RuntimeError(
                f"{cidade['nome']}/{ano}/{substancia}: os 12 meses somam {somado} mas a "
                f"linha imprime {total}. Não gravo — as colunas podem estar deslocadas "
                "(armadilha 2)."
            )
        for mes, valor in enumerate(meses, start=1):
            if valor is None:
                continue
            saida.append(
                {
                    "id_municipio": cidade["id_municipio"],
                    "ano": ano,
                    "mes": mes,
                    "substancia": substancia,
                    "valor": str(valor),
                    "atualizado_em": hoje,
                }
            )

    if total_impresso and saida:
        # A última célula da linha `Total:` é o total do ano.
        anual = _valor(total_impresso[-1])
        somado = sum(Decimal(r["valor"]) for r in saida)
        if anual is not None and somado != anual:
            raise RuntimeError(
                f"{cidade['nome']}/{ano}: as substâncias somam {somado} mas a linha "
                f"`Total:` imprime {anual}. Alguma linha da grade não foi lida."
            )
    return saida


# ──────────────────── relatório 2: arrecadadores ─────────────────────

_RADIOS_ARRECADADORES = {
    P + "rdComparacao": "dsc_nome_razao",  # agrupar por EMPRESA
    P + "rdOrdenacao": "vlr_recolhido",
}

_REGIAO_DA_UF = {
    "AC": "N ", "AP": "N ", "AM": "N ", "PA": "N ", "RO": "N ", "RR": "N ", "TO": "N ",
    "AL": "NE", "BA": "NE", "CE": "NE", "MA": "NE", "PB": "NE", "PE": "NE", "PI": "NE",
    "RN": "NE", "SE": "NE",
    "DF": "CO", "GO": "CO", "MT": "CO", "MS": "CO",
    "ES": "SE", "MG": "SE", "RJ": "SE", "SP": "SE",
    "PR": "S ", "RS": "S ", "SC": "S ",
}


def _coletar_arrecadadores(cidade: dict, anos: list[int]) -> list[dict]:
    """Quem pagou, por ano. Cascata de TRÊS níveis: região -> UF -> município.

    Os valores de região trazem espaço à direita (`"N "`, `"S "`) porque o
    campo é `char(2)` no banco da ANM e o ASP.NET devolve o padding no
    `value`. Aparar isso faz o postback voltar com o dropdown de UF vazio.
    """
    uf = cidade["uf"]
    regiao = _REGIAO_DA_UF.get(uf)
    if regiao is None:
        raise RuntimeError(f"UF {uf!r} fora do mapa de regiões — complete `_REGIAO_DA_UF`.")

    sessao = _sessao()
    time.sleep(PAUSA)
    resp = sessao.get(URL_ARRECADADORES, timeout=TIMEOUT)
    resp.raise_for_status()
    pagina = _texto(resp)
    pagina = _postar(
        sessao, URL_ARRECADADORES, pagina,
        {"__EVENTTARGET": P + "regiao", P + "nu_Ano": str(anos[0]), P + "regiao": regiao},
        _RADIOS_ARRECADADORES,
    )
    pagina = _postar(
        sessao, URL_ARRECADADORES, pagina,
        {"__EVENTTARGET": P + "Estado", P + "nu_Ano": str(anos[0]),
         P + "regiao": regiao, P + "Estado": uf},
        _RADIOS_ARRECADADORES,
    )
    _conferir_no_dropdown(pagina, P + "Municipio", cidade)

    hoje = dt.date.today().isoformat()
    linhas: list[dict] = []
    for ano in anos:
        pagina = _postar(
            sessao, URL_ARRECADADORES, pagina,
            {P + "nu_Ano": str(ano), P + "regiao": regiao, P + "Estado": uf,
             P + "Municipio": cidade["id_municipio"], P + "btnGera": "Gera"},
            _RADIOS_ARRECADADORES,
        )
        _conferir_identidade(pagina, cidade, cidade["id_municipio"])
        linhas.extend(_ler_grade_arrecadadores(pagina, cidade, ano, hoje))
    return linhas


def _ler_grade_arrecadadores(pagina: str, cidade: dict, ano: int, hoje: str) -> list[dict]:
    """`#  Empresa  Qtde Títulos  Operação  CFEM  % `, com a mesma conferência.

    ATENÇÃO ao que estas linhas NÃO são: o valor de uma empresa aqui pode
    estar repetido em outro município (armadilha 1). Vale por município.
    """
    saida: list[dict] = []
    total_impresso = None
    for celulas in _linhas_de_tabela(_resultado(pagina)):
        if celulas[0].strip().rstrip(":").lower() == "total":
            total_impresso = celulas
            continue
        if not celulas[0].strip().isdigit() or len(celulas) != 6:
            continue
        saida.append(
            {
                "id_municipio": cidade["id_municipio"],
                "ano": ano,
                "empresa": celulas[1].strip(),
                "qtde_titulos": int(_valor(celulas[2]) or 0),
                "valor_operacao": str(_valor(celulas[3]) or 0),
                "valor_cfem": str(_valor(celulas[4]) or 0),
                "pct_recolhimento": str(_valor(celulas[5]) or 0),
                "atualizado_em": hoje,
            }
        )
    if total_impresso and saida:
        # A linha `Total` não tem a coluna `#` nem `Qtde`: [rótulo, operação,
        # cfem, %]. Confiro pela CFEM, que é a coluna que a tela vai somar.
        esperado = _valor(total_impresso[-2])
        somado = sum(Decimal(r["valor_cfem"]) for r in saida)
        if esperado is not None and somado != esperado:
            raise RuntimeError(
                f"{cidade['nome']}/{ano}: as empresas somam {somado} de CFEM mas a linha "
                f"`Total` imprime {esperado}. Alguma linha não foi lida."
            )
    return saida


# ─────────────────────────────── sondar ──────────────────────────────


def sondar(id_municipio: str, anos: list[int]) -> None:
    """Imprime o que a ANM tem, sem gravar nada. Uma consulta por ano."""
    cidade = carregar_municipio(id_municipio)
    subs = _coletar_substancias(cidade, anos)
    emp = _coletar_arrecadadores(cidade, anos)
    print(f"\n{LOG} {cidade['nome']}-{cidade['uf']} ({id_municipio}) — SEM GRAVAR")
    for ano in anos:
        do_ano = [r for r in subs if r["ano"] == ano]
        if not do_ano:
            continue
        por_substancia: dict[str, Decimal] = {}
        for r in do_ano:
            por_substancia[r["substancia"]] = por_substancia.get(
                r["substancia"], Decimal(0)
            ) + Decimal(r["valor"])
        total = sum(por_substancia.values())
        print(f"  {ano}: R$ {total:,.2f} em {len(por_substancia)} substância(s)")
        for nome, valor in sorted(por_substancia.items(), key=lambda kv: -kv[1])[:5]:
            print(f"       {nome:<28} R$ {valor:>16,.2f}")
        for r in sorted((e for e in emp if e["ano"] == ano),
                        key=lambda e: -Decimal(e["valor_cfem"]))[:3]:
            print(f"       · {r['empresa'][:44]:<44} R$ {Decimal(r['valor_cfem']):>14,.2f}")


# ──────────────────────────────── sync ───────────────────────────────


def sync(id_municipio: str, partes: set[str], anos: list[int], *, permitir_reducao: bool) -> None:
    cidade = carregar_municipio(id_municipio)
    print(f"{LOG} {cidade['nome']}-{cidade['uf']} ({id_municipio}), anos {anos[0]}-{anos[-1]}")

    if "substancias" in partes:
        linhas = _coletar_substancias(cidade, anos)
        _gravar("royalties_cfem", cidade, linhas, permitir_reducao)

    if "empresas" in partes:
        linhas = _coletar_arrecadadores(cidade, anos)
        _gravar("royalties_cfem_empresas", cidade, linhas, permitir_reducao)


def _gravar(tabela: str, cidade: dict, linhas: list[dict], permitir_reducao: bool) -> None:
    if not linhas:
        # ARMADILHA 6: sem linha, refresh total viraria delete puro. Cidade sem
        # mineração não deve APAGAR o que uma rodada anterior gravou.
        print(f"{LOG} {tabela}: nada coletado — NÃO apago o que já existe.")
        return
    # Conexão nova para gravar: a coleta passa vários minutos entre escritas e
    # a Neon derruba conexão ociosa. Mesmo motivo de `etl/camaras/sapl.py`.
    client = get_supabase_client()
    refresh_completo_seguro(
        client,
        tabela,
        {"id_municipio": cidade["id_municipio"]},
        linhas,
        permitir_reducao=permitir_reducao,
        rotulo="etl.apis.anm_cfem",
    )
    print(f"{LOG} {tabela}: {len(linhas)} linha(s) gravada(s).")


PARTES_VALIDAS = {"substancias", "empresas"}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    # `--id-municipio` é a ÚNICA cidade que o operador escolhe: a UF e o nome
    # saem de `municipios`. Ver `scripts/conferir_defaults_de_cidade.py`.
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--partes", default="substancias,empresas",
                        help=f"lista por vírgula: {sorted(PARTES_VALIDAS)}")
    parser.add_argument("--desde", type=int, default=ANO_INICIAL,
                        help=f"primeiro ano da janela (a série da ANM começa em {ANO_INICIAL})")
    parser.add_argument("--permitir-reducao", action="store_true")
    parser.add_argument("--sondar", action="store_true", help="imprime e não grava")
    args = parser.parse_args()

    primeiro = max(args.desde, ANO_INICIAL)
    janela = list(range(primeiro, dt.date.today().year + 1))
    try:
        if args.sondar:
            sondar(args.id_municipio, janela)
        else:
            partes = {p.strip() for p in args.partes.split(",") if p.strip()}
            invalidas = partes - PARTES_VALIDAS
            if invalidas:
                raise RuntimeError(f"parte(s) desconhecida(s): {sorted(invalidas)}")
            sync(args.id_municipio, partes, janela, permitir_reducao=args.permitir_reducao)
    except SemDadoNaFonte as e:
        print(f"{LOG} SEM_DADO: {e}")
        sys.exit(0)
    except RuntimeError as e:
        print(f"{LOG} ABORT: {e}", file=sys.stderr)
        sys.exit(1)
