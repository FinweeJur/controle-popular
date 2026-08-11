r"""etl.prefeitura.portaltransp — quadro de servidores de qualquer prefeitura
que publique a folha de pagamento no fornecedor **Portal Transparência**
(`portaltransp.com.br`).

Alvo inicial: Diamantina-MG (3121605).

    python -m etl.prefeitura.portaltransp --id-municipio 3121605
    python -m etl.prefeitura.portaltransp --id-municipio 3121605 --sondar

═══ "MESMO FORNECEDOR DE ARAÇUAÍ" NÃO BATEU — E É POR ISSO QUE ESTE MÓDULO
    EXISTE, EM VEZ DE UM PARÂMETRO NOVO NO portaltp.py ═══

A tarefa original supunha Diamantina como cliente do PortalTP (mesmo
fornecedor de Araçuaí, "instância/config diferente"). Conferido ao vivo em
2026-08-11: o link "Remuneração" do portal oficial de Diamantina
(diamantina.mg.gov.br/portal/transparencia) aponta para `portaltransp.com.br`
— WordPress + exportadores PHP, sem rastro de ASP.NET/DevExpress. O de
Araçuaí (`etl.prefeitura.portaltp`) é `aracuai-mg.portaltp.com.br` —
domínio parecido, produto diferente. Cada um fica com o próprio módulo,
mesma lógica que já separa `etl.camaras.sapl` de `etl.camaras.syssolution`.

═══ MULTI-TENANT POR QUERY STRING (`data=`), IGUAL AO CIDADESMG ═══

O domínio é ÚNICO (`portaltransp.com.br`) para todas as prefeituras
clientes; a cidade é selecionada por um parâmetro `data` (medido: Diamantina
é `data=pdmt`) que fixa a prefeitura NA SESSÃO (cookie `PHPSESSID`) assim
que a primeira página é carregada com aquele valor. Igual ao CidadesMG
(`?Param=Itinga`), diferente do PortalTP (subdomínio por cliente) — ver
`_host_e_param` e o cabeçalho de `cidadesmg.py`.

═══ AS ARMADILHAS, MEDIDAS AO VIVO (2026-08-11) ═══

1. **O EXPORT SÓ FUNCIONA COM A SESSÃO "AQUECIDA" — E PRECISA DO REFERER.**
   Chamar `exportador/ExportadorRemuneracao_csv.php` direto (sem visitar
   antes `remuneracao/servidores/?data=pdmt`) devolve `"Não há servidor."`
   mesmo com o cookie de sessão certo. Só depois de um GET na página de
   listagem COM `data=pdmt` (que grava a prefeitura escolhida na sessão
   PHP) E com o header `Referer` apontando pra essa mesma página é que o
   exportador devolve o arquivo de verdade. Testado par a par: faltando
   qualquer um dos dois (visita prévia OU Referer), volta o aviso de "sem
   servidor" com HTTP 200 — sem erro nenhum que denuncie a causa.

2. **"CSV"/"TXT" NÃO SÃO OS BOTÕES CERTOS — SÃO HOLERITE, IGUAL AO
   CIDADESMG (armadilha 5 de lá).** Os links "PDF"/"Excel"/"CSV" do topo da
   tela de servidores (`ExportadorRemuneracao_{pdf,excel,csv}.php`) trazem
   um extrato de contracheque por rubrica, não a tabela columnar. O que
   este módulo usa é o link "CSV" ao lado — mesmo endpoint, mas ele SÓ
   existe assim porque, medido ao vivo, o `ExportadorRemuneracao_csv.php`
   desta fonte específica devolve a tabela em si (referência, matrícula,
   servidor, cargo, CPF mascarado, lotação, admissão, exoneração/inativação)
   quando chamado do jeito da armadilha 1 — é o comportamento correto
   PRA ESTA fonte, mas não presuma o mesmo de outro fornecedor com botão de
   nome parecido sem medir de novo.

3. **A CODIFICAÇÃO DO CSV É cp1252 (Windows-1252), NÃO UTF-8** — mesmo o
   servidor respondendo `Content-Type: ...charset=utf-8`. Medido: o byte
   `\xed` (í em Latin-1) aparece cru no meio de "Nível", e decodificar como
   UTF-8 estoura `UnicodeDecodeError` na hora. O cabeçalho do Content-Type
   está simplesmente errado; este módulo decodifica como `cp1252` sempre.

4. **A PRIMEIRA CÉLULA DE CADA LINHA (Referência) VEM COM UM `\t` GRUDADO
   ANTES DAS ASPAS**, o que quebra o reconhecimento de campo citado do
   módulo `csv` só PRA ELA — as outras 7 colunas vêm limpas. Como a
   competência já é conhecida antes de parsear (é o parâmetro que este
   módulo escolheu), a coluna 0 é simplesmente ignorada em vez de
   remendada.

5. **NÃO HÁ COLUNA "SITUAÇÃO" NEM "VÍNCULO" NESTA EXPORTAÇÃO** — diferente
   do portaltp (que tem `situacao`) e do CidadesMG (que tem `Vínculo`, ainda
   que misturado com situação). O único sinal de quem saiu é a coluna
   "Exoneração / Inativação": em branco = ativo, com data = desligado
   naquela competência (medido: 25 de 1.998 linhas de dez/2024 tinham data
   preenchida). É o filtro de "ativa" desta fonte; `vinculo` fica `None`
   porque a fonte não expõe esse dado nesta tela.

6. **A COMPETÊNCIA "PADRÃO" AQUI É CONFIÁVEL — DIFERENTE DO CIDADESMG.**
   O combo de referência da tela vem com o mês mais recente já publicado
   como a PRIMEIRA opção (sem atributo `selected` no HTML — o navegador
   escolhe a primeira por padrão, e é assim que a página se apresenta pra
   um visitante comum). Testado: em 2026-08-11 a primeira opção era
   "07/2026", não "08/2026" nem "Todos" — o portal já corta pra competência
   fechada, igual ao padrão que o portaltp.py lê do combo do PortalTP.
   Diferente de Itinga/CidadesMG (armadilha 2 de `cidadesmg.py`), aqui não
   foi preciso varrer meses pra trás.

═══ O QUE ESTE MÓDULO NÃO FAZ ═══

Não grava CPF (mascarado pela fonte) nem remuneração — mesmo corte de LGPD
de todo o eixo `servidores`. Não remove quem saiu; upsert por
`(id_municipio, orgao, nome, cargo)`, mesma limitação herdada do portaltp.py
e do b3106705.
"""
from __future__ import annotations

import argparse
import csv
import datetime
import re
import sys

from etl.common import ID_MUNICIPIO_DEFAULT, carregar_municipio, get_supabase_client

# Ver cidadesmg.py: mesmo motivo (console do Windows não é UTF-8 por
# padrão), mesmo remendo, mesma ressalva de que só afeta o log.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except AttributeError:
    pass

LOG = "[etl.prefeitura.portaltransp]"

AGENTE = "controle-popular/1.0 (+https://controlepopular.com.br) transparencia publica"

CAMINHO_SERVIDORES = "remuneracao/servidores/"
CAMINHO_EXPORT_CSV = "exportador/ExportadorRemuneracao_csv.php/"

_RE_REFERENCIA_PRIMEIRA_OPCAO = re.compile(
    r'<select name="referencia"><option value=\s*([0-9/]+)\s*[>]'
)


def _host_e_param(municipio: dict) -> tuple[str, str]:
    """Host do fornecedor + código da cidade dentro dele. Mesma ideia (e
    mesmo motivo) de `_host_e_param` em `cidadesmg.py`."""
    fontes = municipio.get("fontes") or {}
    sistema = fontes.get("prefeitura_transparencia_sistema")
    host = fontes.get("prefeitura_transparencia_host")
    param = fontes.get("prefeitura_transparencia_param")
    if sistema != "portaltransp" or not host or not param:
        raise RuntimeError(
            f"{municipio['nome']} ({municipio['id_municipio']}) não está registrada como "
            f"cliente do Portal Transparência. Esperado em `municipios.fontes`: "
            f'prefeitura_transparencia_sistema="portaltransp", prefeitura_transparencia_host '
            f"e prefeitura_transparencia_param. Achado: sistema={sistema!r}, host={host!r}, "
            f"param={param!r}."
        )
    return host.rstrip("/"), param


def _referencia_padrao(html: str) -> str:
    """A primeira opção do combo `referencia` — ver armadilha 6: sem
    `selected` no HTML, mas é o valor que a própria tela usa como padrão
    para quem chega sem filtrar nada."""
    m = _RE_REFERENCIA_PRIMEIRA_OPCAO.search(html)
    if not m:
        raise RuntimeError(
            "não achei a primeira opção do combo 'referencia' — a tela do "
            "Portal Transparência mudou de estrutura."
        )
    return m.group(1).strip()


def mapear(campos: list[str], id_municipio: str) -> dict | None:
    """Uma linha do CSV de exportação (ver `colher`) vira uma linha de
    `servidores` — ou `None` para quem já saiu (armadilha 5) ou sem
    nome/cargo. `campos` é a linha já parseada pelo módulo `csv`
    (delimiter=';'); o índice 0 (referência) é ignorado de propósito —
    armadilha 4."""
    if len(campos) < 8:
        return None
    _referencia, _matricula, servidor, cargo, _cpf, lotacao, _admissao, exoneracao = campos[:8]

    if exoneracao.strip().strip("/").strip():
        return None  # tem data de exoneração/inativação: já não está na ativa.

    nome = servidor.strip()
    cargo = cargo.strip()
    if not nome or not cargo:
        return None
    return {
        "id_municipio": id_municipio,
        "orgao": "prefeitura",
        "nome": nome,
        "cargo": cargo,
        "lotacao": lotacao.strip() or None,
        "vinculo": None,  # a fonte não expõe vínculo nesta tela — armadilha 5.
    }


def colher(host: str, param: str, id_municipio: str) -> tuple[list[dict], dict]:
    """Aquece a sessão na cidade certa, lê a competência padrão da tela e
    baixa o CSV (ver armadilhas 1 e 6)."""
    import requests

    ano_atual = datetime.date.today().year
    url_listagem = f"{host}/{CAMINHO_SERVIDORES}?data={param}&valuable={ano_atual}"
    url_export = f"{host}/{CAMINHO_EXPORT_CSV}"

    diag = {"referencia": None, "total_lido": 0, "descartados": 0}

    with requests.Session() as sessao:
        sessao.headers["User-Agent"] = AGENTE

        r_listagem = sessao.get(url_listagem, timeout=30)
        r_listagem.raise_for_status()
        referencia = _referencia_padrao(r_listagem.text)
        diag["referencia"] = referencia
        ano = referencia.split("/")[-1]

        params_export = {
            "data": param,
            "exercicio": ano,
            "tabela": "1",
            "matricula": "",
            "servidor": "",
            "cargo": "",
            "cpf": "",
            "lotacao": "",
            "referencia": referencia,
            "ordenado": "1",
        }
        resp = sessao.get(
            url_export,
            params=params_export,
            headers={"Referer": url_listagem},
            timeout=60,
        )
        resp.raise_for_status()

    disposicao = resp.headers.get("Content-Disposition", "")
    if "attachment" not in disposicao.lower():
        raise RuntimeError(
            f"esperava um download (Content-Disposition: attachment) de {url_export} e "
            f"vim {disposicao!r} — a sessão não 'aqueceu' (armadilha 1) ou o export mudou "
            f"de formato. Primeiros 300 bytes: {resp.content[:300]!r}"
        )

    # Ver armadilha 3: o Content-Type anuncia UTF-8, o conteúdo real é cp1252.
    texto = resp.content.decode("cp1252")
    linhas_brutas = texto.splitlines()
    if len(linhas_brutas) < 3:
        raise RuntimeError(
            f"CSV de {url_export} veio com {len(linhas_brutas)} linha(s) — esperava um "
            "cabeçalho de 2 linhas mais os servidores."
        )
    leitor = csv.reader(linhas_brutas[2:], delimiter=";", quotechar='"')
    diag["total_lido"] = 0

    resultado: list[dict] = []
    vistos: set[tuple[str, str]] = set()
    for campos in leitor:
        if not campos:
            continue
        diag["total_lido"] += 1
        linha = mapear(campos, id_municipio)
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
    print(f"{LOG} {municipio['nome']}/{municipio['uf']} — {host} (data={param})")

    linhas, diag = colher(host, param, id_municipio)
    print(
        f"{LOG} referencia={diag['referencia']} total_lido={diag['total_lido']} "
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
    parser = argparse.ArgumentParser(description="Servidores de prefeituras clientes do Portal Transparência.")
    parser.add_argument("--id-municipio", default=ID_MUNICIPIO_DEFAULT)
    parser.add_argument("--sondar", action="store_true", help="lê e relata, NÃO grava")
    args = parser.parse_args()

    try:
        sincronizar(args.id_municipio, sondar=args.sondar)
    except Exception as e:  # noqa: BLE001
        print(f"{LOG} ERRO: {e}", file=sys.stderr)
        raise SystemExit(1)
