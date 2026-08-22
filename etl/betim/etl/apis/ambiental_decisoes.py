r"""etl.apis.ambiental_decisoes — as DECISÕES de licenciamento ambiental de
Minas Gerais, do mesmo módulo público que serve as audiências de EIA/RIMA.

Fonte: `sistemas.meioambiente.mg.gov.br/licenciamento/site/consulta-licenca`
Irmão: `etl.apis.ambiental_audiencias` (mesmo host, mesmo grid Yii2, mesmas
regras de privacidade e de parada). Leia aquele antes deste.

═══ POR QUE ESTA BASE EXISTE, TENDO O WFS DE LICENÇAS ═══

O WFS do IDE-Sisema (`ambiental_licenciamento`) traz 19.713 empreendimentos
**licenciados e georreferenciados**. Aqui são **43.555 decisões**, e a
diferença não é de volume, é de conteúdo: esta base inclui o que foi
**Indeferido, Arquivado e Cancelado** — exatamente o que some quando só se
olha para quem recebeu licença. Numa amostra de 520 decisões já colhidas:
444 deferidas, 42 arquivamentos, 31 indeferidas, 3 canceladas.

Traz também, por decisão, os PDFs que o Estado **hospeda de verdade**
(`/licenciamento/uploads/<token>.pdf`, medido: HTTP 206, `application/pdf`) —
Certificado e "Outros Documentos". É o contraponto da descoberta do módulo de
audiências, onde o EIA/RIMA mora na nuvem do empreendedor e 27% não abrem.

═══ AQUI PAGINAR É O MÉTODO CERTO — E ISSO NÃO É ÓBVIO ═══

O módulo irmão NÃO pode paginar: o grid de audiências anuncia "2.287 itens" e
rende 8 linhas por página em janelas de 20, porque a contagem sai de uma
junção antes do agrupamento. Por isso lá o coletor enumera ids.

**Aqui a paginação é honesta**, medido em 2026-08-20: página 1 = "A exibir
1-20 de 43.555" com 20 linhas; página 100 = "1.981-2.000" com 20; página
2.178 = "43.541-43.555" com 15 (a cauda). O total declarado bate com o que as
páginas rendem. Não copie a estratégia de ids para cá, nem a de páginas para
lá — são fontes com defeitos diferentes.

═══ HTTP 500 INTERMITENTE (a armadilha que decide o desenho) ═══

Na MESMA rodada, páginas 1 e 100 responderam 200 enquanto 2 e 3 deram 500 — e
minutos antes a 2 respondia 200. Em 4 tentativas seguidas na mesma URL:
500 · 200 · 200 · 200. Com 2.178 páginas, um coletor que aceitasse o primeiro
500 como verdade perderia centenas de páginas **em silêncio**.

Daí: retentativa com espera crescente (5s, 15s, 45s) e página que esgota as
tentativas vai para `paginas_perdidas` no relatório final — nunca pulada sem
deixar rastro. E a guarda de conteúdo lê o CORPO (`<div class="summary">`),
não o status: este host já devolveu 200 com página de erro.

═══ PRIVACIDADE ═══

A coluna CNPJ/CPF publica os dois. **CPF nunca é gravado**: vira
`eh_pessoa_fisica=True` com `cnpj_raiz=None`, mesma doutrina de
`ambiental_licenciamento` e `ambiental_audiencias`. O repositório é público e
tem trava de CI (`lib/sem-cpf-no-repo.test.ts`) que recusa CPF válido em
arquivo versionado.

═══ A ATIVIDADE VEM COLADA AO CÓDIGO ═══

`F-02-01-1-Transporte rodoviário de produtos perigosos`. Cortar no primeiro
hífen quebra (há descrição com hífen). O corte é pelo PADRÃO do código da DN
COPAM 217/2017 — letra, 2 dígitos, 2 dígitos, 1 dígito. Sem o padrão, tudo
vira descrição: melhor descrição inteira do que código inventado.

Uso:
    python -m etl.apis.ambiental_decisoes --sondar
    python -m etl.apis.ambiental_decisoes --fase grid --saida dados/ambiental-decisoes.json
    python -m etl.apis.ambiental_decisoes --fase fichas --casar dados/ambiental-estudos.json
"""
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import unicodedata
from pathlib import Path

import requests

LOG = "[etl.apis.ambiental_decisoes]"
BASE = "https://sistemas.meioambiente.mg.gov.br/licenciamento/site"
GRID = BASE + "/consulta-licenca?page=%d"
FICHA = BASE + "/view-externo?id=%s"
UA = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)"
TIMEOUT = 60
ATRASO_ENTRE_REQUISICOES = 2.5
ESPERAS_DE_RETENTATIVA = (5, 15, 45)
POR_PAGINA = 20

RE_LINHA = re.compile(r'<tr data-key="([^"]*)">(.*?)</tr>', re.S)
RE_TD = re.compile(r"<td[^>]*>(.*?)</td>", re.S)
RE_TAG = re.compile(r"<[^>]+>")
RE_SUMMARY = re.compile(r'<div class="summary">(.*?)</div>', re.S)
RE_TOTAL = re.compile(r"de\s+([\d.,]+)\s+itens", re.I)
RE_COD_ATIVIDADE = re.compile(r"^([A-H]-\d{2}-\d{2}-\d)-(.*)$", re.S)
RE_DIGITO = re.compile(r"\d")
RE_PDF = re.compile(r'href="(/licenciamento/(?:uploads|ata)/[^"]+)"')

CAMINHO_MUNICIPIOS = (
    # etl/betim/etl/apis/x.py -> parents[4] e' a raiz do repo
    Path(__file__).resolve().parents[4]
    / "apps" / "web" / "public" / "terras" / "globo" / "dados" / "camadas"
    / "municipios-mg.geojson"
)


class BloqueadoPelaFonte(RuntimeError):
    """403/429/CAPTCHA: para a coleta, não contorna."""


class RespostaInesperada(RuntimeError):
    """Corpo sem a marca esperada — nunca gravar linha vazia como se fosse dado."""


def _sessao() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


def _guardar_contra_bloqueio(status: int, corpo: str, onde: str) -> None:
    if status in (403, 429):
        raise BloqueadoPelaFonte(
            f"{LOG} HTTP {status} em {onde} — a fonte pode estar bloqueando o acesso. "
            "Pare a coleta e avise o operador; não retentar, não trocar User-Agent, "
            "não contornar."
        )
    if "captcha" in corpo.lower():
        raise BloqueadoPelaFonte(
            f"{LOG} corpo de {onde} contém desafio de CAPTCHA — pare e avise o operador."
        )


def _texto(bruto: str) -> str:
    return " ".join(html.unescape(RE_TAG.sub(" ", bruto)).split())


def _normalizar(s: str) -> str:
    base = unicodedata.normalize("NFD", _texto(s))
    return "".join(c for c in base if unicodedata.category(c) != "Mn").lower()


def _buscar(sessao: requests.Session, url: str, onde: str, marca: re.Pattern) -> str:
    """Uma resposta boa, ou exceção. A retentativa existe por causa do 500
    intermitente descrito na docstring do módulo."""
    ultimo = ""
    for espera in (0,) + ESPERAS_DE_RETENTATIVA:
        if espera:
            time.sleep(espera)
        r = sessao.get(url, timeout=TIMEOUT)
        _guardar_contra_bloqueio(r.status_code, r.text, onde)
        ultimo = f"HTTP {r.status_code}"
        if r.status_code == 200 and marca.search(r.text):
            return r.text
    raise RespostaInesperada(
        f"{LOG} {onde} não devolveu página válida em "
        f"{1 + len(ESPERAS_DE_RETENTATIVA)} tentativas (última: {ultimo})."
    )


def carregar_municipios() -> dict[str, str]:
    """Nome normalizado → código IBGE, do catálogo LOCAL. Nada de banco: a
    Neon está em HTTP 402 até 2026-09-01 e o coletor não pode depender dela."""
    dados = json.loads(CAMINHO_MUNICIPIOS.read_text(encoding="utf-8"))
    return {
        _normalizar(f["properties"]["nome"]): f["properties"]["geocodigo"]
        for f in dados["features"]
    }


def classificar_documento(bruto: str) -> dict:
    """CNPJ fica (só a raiz de 8 dígitos), CPF sai. Ver a docstring do módulo."""
    digitos = "".join(RE_DIGITO.findall(bruto or ""))
    if len(digitos) == 14:
        return {"cnpj_raiz": digitos[:8], "eh_pessoa_fisica": False,
                "documento_classificacao": "cnpj"}
    if len(digitos) == 11:
        return {"cnpj_raiz": None, "eh_pessoa_fisica": True,
                "documento_classificacao": "cpf"}
    return {"cnpj_raiz": None, "eh_pessoa_fisica": True,
            "documento_classificacao": "indeterminado_tratado_como_pf"}


def separar_atividade(bruto: str) -> tuple[str | None, str | None]:
    m = RE_COD_ATIVIDADE.match((bruto or "").strip())
    if m:
        return m.group(1), m.group(2).strip() or None
    return None, (bruto or "").strip() or None


def _data_iso(br: str) -> str | None:
    if not br or br.count("/") != 2:
        return None
    dia, mes, ano = br.split("/")
    return f"{ano}-{mes.zfill(2)}-{dia.zfill(2)}"


def total_declarado(pagina_html: str) -> int | None:
    m = RE_SUMMARY.search(pagina_html)
    if not m:
        return None
    achado = RE_TOTAL.search(_texto(m.group(1)))
    if not achado:
        return None
    return int(re.sub(r"\D", "", achado.group(1)))


def ler_pagina(pagina_html: str, municipios: dict[str, str]) -> list[dict]:
    linhas = []
    for chave, corpo in RE_LINHA.findall(pagina_html):
        celulas = [_texto(c) for c in RE_TD.findall(corpo)]
        if len(celulas) < 13:
            # Linha sem o número de colunas esperado não é dado: é mudança de
            # layout. Reportar, nunca completar com vazio.
            print(f"{LOG} AVISO: linha {chave} com {len(celulas)} colunas (esperado ≥13) — ignorada.")
            continue
        codigo, descricao = separar_atividade(celulas[8])
        municipio = celulas[1]
        linhas.append({
            "id_fonte": int(chave) if chave.isdigit() else None,
            "regional": celulas[0] or None,
            "municipio_nome": municipio or None,
            "municipio_id": municipios.get(_normalizar(municipio)) if municipio else None,
            "nome_empreendimento": celulas[2] or None,
            **classificar_documento(celulas[3]),
            "numero_processo": celulas[4] or None,
            "numero_protocolo": celulas[5] or None,
            "modalidade": celulas[6] or None,
            "classe": int(re.sub(r"\D", "", celulas[7]) or 0) or None,
            "atividade_codigo": codigo,
            "atividade_descricao": descricao,
            "ano": int(celulas[9]) if celulas[9].isdigit() else None,
            "mes": celulas[10] or None,
            "data_publicacao": celulas[11] or None,
            "data_publicacao_iso": _data_iso(celulas[11]),
            "decisao": celulas[12] or None,
            "link_ficha": FICHA % chave,
            "link_certificado": None,
            "links_outros_documentos": [],
        })
    return linhas


def coletar_grid(sessao, municipios, de: int = 1, ate: int | None = None) -> dict:
    perdidas: list[int] = []
    decisoes: dict[int, dict] = {}
    total = None
    pagina = de
    while True:
        if ate is not None and pagina > ate:
            break
        try:
            corpo = _buscar(sessao, GRID % pagina, f"página {pagina}", RE_SUMMARY)
        except RespostaInesperada as e:
            print(f"{LOG} {e}")
            perdidas.append(pagina)
            pagina += 1
            time.sleep(ATRASO_ENTRE_REQUISICOES)
            continue
        if total is None:
            total = total_declarado(corpo)
            if total and ate is None:
                ate = -(-total // POR_PAGINA)
                print(f"{LOG} {total} decisões declaradas → {ate} páginas de {POR_PAGINA}.")
        for linha in ler_pagina(corpo, municipios):
            decisoes.setdefault(linha["id_fonte"], linha)
        if pagina % 50 == 0:
            print(f"{LOG} página {pagina}/{ate} — {len(decisoes)} decisões distintas.", flush=True)
        pagina += 1
        time.sleep(ATRASO_ENTRE_REQUISICOES)
    return {"decisoes": list(decisoes.values()), "paginas_perdidas": perdidas,
            "total_declarado": total, "paginas_lidas": (pagina - de) - len(perdidas)}


def coletar_ficha(sessao, id_fonte) -> dict:
    """Os PDFs que o Estado hospeda. Extraídos pelo `href`, nunca pela posição
    da célula: os rótulos Certificado/Outros Documentos vivem em tabela
    aninhada e a célula vem vazia quando não há arquivo."""
    corpo = _buscar(sessao, FICHA % id_fonte, f"ficha {id_fonte}", re.compile(r"<th", re.I))
    pdfs = [BASE.rsplit("/site", 1)[0] + p for p in RE_PDF.findall(corpo)]
    return {"link_certificado": pdfs[0] if pdfs else None,
            "links_outros_documentos": pdfs[1:]}


def _chave_processo(valor: str | None) -> str | None:
    """`00039951/2026` e `39951/2026` são o mesmo processo. Normaliza para
    casar com o número que o módulo de audiências publica."""
    if not valor:
        return None
    m = re.match(r"\s*0*(\d+)\s*/\s*(\d{4})", valor)
    return f"{int(m.group(1))}/{m.group(2)}" if m else None


def main() -> int:
    p = argparse.ArgumentParser(description=f"{LOG} decisões de licenciamento ambiental de MG")
    p.add_argument("--sondar", action="store_true", help="mede a primeira página e sai, sem gravar")
    p.add_argument("--fase", choices=("grid", "fichas"), default="grid")
    p.add_argument("--saida", type=Path)
    p.add_argument("--de", type=int, default=1)
    p.add_argument("--ate", type=int)
    p.add_argument("--casar", type=Path,
                   help="JSON de audiências; na fase fichas, busca só o que casa por processo")
    args = p.parse_args()

    sessao = _sessao()
    municipios = carregar_municipios()

    if args.sondar:
        corpo = _buscar(sessao, GRID % 1, "página 1", RE_SUMMARY)
        linhas = ler_pagina(corpo, municipios)
        print(f"{LOG} total declarado: {total_declarado(corpo)}")
        print(f"{LOG} linhas na página 1: {len(linhas)} (esperado {POR_PAGINA})")
        print(f"{LOG} exemplo: {json.dumps(linhas[0], ensure_ascii=False)[:400]}")
        return 0

    if args.fase == "grid":
        resultado = coletar_grid(sessao, municipios, de=args.de, ate=args.ate)
        if resultado["paginas_perdidas"]:
            print(f"{LOG} ATENÇÃO: {len(resultado['paginas_perdidas'])} páginas perdidas: "
                  f"{resultado['paginas_perdidas'][:20]}")
        pacote = {"coletado_em": time.strftime("%Y-%m-%dT%H:%M:%S"), "fonte": GRID % 1, **resultado}
    else:
        if not args.casar or not args.saida or not args.saida.exists():
            print(f"{LOG} --fase fichas exige --casar e um --saida já existente da fase grid.")
            return 2
        pacote = json.loads(args.saida.read_text(encoding="utf-8"))
        audiencias = json.loads(args.casar.read_text(encoding="utf-8"))
        alvos = {_chave_processo(a.get("numero_processo"))
                 for a in audiencias.get("audiencias", [])}
        alvos.discard(None)
        casadas = [d for d in pacote["decisoes"] if _chave_processo(d["numero_protocolo"]) in alvos
                   or _chave_processo(d["numero_processo"]) in alvos]
        proporcao = len(casadas) / max(1, len(alvos))
        print(f"{LOG} {len(casadas)} decisões casaram com {len(alvos)} processos de audiência "
              f"({proporcao:.0%}).")
        if proporcao < 0.30:
            # O casamento é [VERIFY]: abaixo disso, o join provavelmente está
            # errado, e gravar seria inventar relação que não existe.
            print(f"{LOG} PARE: menos de 30% casou. Não gravo join que não se sustenta.")
            return 3
        for i, d in enumerate(casadas, 1):
            try:
                d.update(coletar_ficha(sessao, d["id_fonte"]))
            except RespostaInesperada as e:
                print(f"{LOG} {e}")
            time.sleep(ATRASO_ENTRE_REQUISICOES)
            if i % 50 == 0:
                print(f"{LOG} ficha {i}/{len(casadas)}", flush=True)

    if args.saida:
        args.saida.parent.mkdir(parents=True, exist_ok=True)
        args.saida.write_text(json.dumps(pacote, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"{LOG} gravado: {args.saida}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
