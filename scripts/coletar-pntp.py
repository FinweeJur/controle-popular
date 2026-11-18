"""coletar-pntp.py — índice de transparência do PNTP/Atricon, recorte de MG.

O QUE ESTE SCRIPT FAZ
---------------------
Baixa os pacotes anuais do **PNTP — Programa Nacional de Transparência Pública**
(Atricon + Tribunais de Contas), extrai só a planilha de avaliações
(`avaliacoes_pntp_<ano>.xlsx`) e grava dois JSON para o portal:

1. `apps/web/data/pntp/avaliacoes-mg.json`
   uma linha por ente público de **Minas Gerais**, nos ciclos 2022 a 2025:
   órgão, poder, esfera, município, índice de transparência (ITP, 0 a 100),
   % das essenciais, nível e as duas marcas de avaliação (validada e
   certificável). É o que permite a página de município mostrar "seu portal
   tirou 82,5 no PNTP" com a fonte ao lado.
2. `apps/web/data/pntp/resumo-brasil.json`
   **só agregado nacional**: contagem de entes, avaliados e não avaliados,
   média de ITP e recorte por esfera e por poder, ano a ano. Serve de régua:
   compara o município com o país sem expor linha individual.

FONTE OFICIAL
-------------
- Portal de dados abertos: https://pntp.atricon.org.br/dados-abertos/
- Pacotes anuais (medidos em 18/11/2026, `Last-Modified` 17/08/2026):
  `https://cdn.atricon.org.br/2026/08/dados_pntp_<ano>.zip`
  — 2022: 83 MB · 2023: 183 MB · 2024: 202 MB · 2025: 323 MB.
- Cada ZIP traz `pntp_<ano>/avaliacoes_pntp_<ano>.xlsx` (a tabela que
  interessa) e `pntp_<ano>/respostas/respostas_pntp_<ano>_<UF>.xlsx` (o
  formulário respondido, critério por critério). **A pasta `respostas/` não é
  lida**: é 30× maior, traz texto livre de servidor e não alimenta nenhuma
  página do portal.
- Licença: a página de dados abertos não declara licença Creative Commons;
  publica os pacotes como dado aberto, e o dado em si já é público (portais
  oficiais avaliados). Uso com atribuição à Atricon/PNTP. Detalhe em
  `docs/06-fontes/PNTP-ATRICON.md`.
- `robots.txt` do portal (medido 18/11/2026): libera `/dados-abertos/`;
  `Disallow` só em `/wp-admin/`, `/wp-json/` e busca. `Crawl-delay: 10` vale
  para rastreadores de IA — mantemos 2 s entre downloads, e são 4 no total.
- Cadastro, token ou chave? **Não.** Download direto do CDN.

DECISÕES NÃO TRIVIAIS (e o porquê)
----------------------------------
1. **Não existe coluna `Município` estável nos quatro ciclos — e o schema
   mudou em 2023.** Medido: 2022 tem 15 colunas (`Estado`, `Órgão`, `Poder do
   Ente Público`); 2023 em diante tem 21 (`UF`, `Unidade Gestora`, `Poder`).
   O script resolve o nome da coluna por sinônimo, ciclo a ciclo, em
   `COLUNAS`, em vez de assumir uma posição fixa.
2. **`Órgão` de 2022 é genérico** ("Prefeitura", "Câmara dos Vereadores") e
   repete 72 vezes em MG. Como a chave publicada é `ano + orgao`, o nome do
   ente municipal de 2022 é composto com o município ("Prefeitura de Ouro
   Preto"). De 2023 em diante o campo já é o nome completo da unidade gestora
   ("Prefeitura Municipal de Sumé") e vai como está.
3. **Índice vem em fração (0 a 1), não em porcentagem.** Multiplicamos por
   100 e arredondamos em 1 decimal: 0,8252788 vira 82,5. Arredondar aqui é o
   que mantém o JSON abaixo do teto de payload (regra 5.1) sem perder
   precisão útil ao leitor.
4. **`Não Avaliado` fica com `itp: null`, nunca `itp: 0`.** A planilha da
   fonte grava índice 0 para ente que não foi avaliado; publicar esse 0 seria
   dizer "transparência zero" de quem apenas não entregou o formulário. O
   nível `"Não Avaliado"` acompanha a linha, e o teste do JSON exige a
   correspondência (`itp` nulo se e só se o nível for `"Não Avaliado"`). O
   caso é grande em MG: em 2023 foram 1.698 dos 1.712 entes.
5. **`Intermediário*` de 2022 é preservado com o asterisco.** Medido: essa
   faixa cobre ITP de 0,75 a 0,99 — é a banda que em 2023 passou a se chamar
   `Elevado`. Trocar o rótulo por "Intermediário" (sem asterisco) faria um
   índice de 82,5 aparecer como "Intermediário", que é meia-verdade; e
   reclassificar seria inventar nível que a fonte não publicou. O rótulo fica
   literal, com nota no documento da fonte.
6. **Média nacional exclui `Não Avaliado` e inclui `Inexistente` como zero.**
   É a regra que a própria página do PNTP explica ("a média bruta engana") e a
   que reproduz o número publicado: medido em 18/11/2026, o cálculo deste
   script devolve **66,6%** para 2025 (e 57,34% na média bruta, que sai como
   conferência). Se um dia divergir do site, o script está errado.
7. **Nenhum dado pessoal é lido para o JSON.** A planilha traz
   `Preenchido por:`, `Nome Responsável` e `E-mail Responsável` — nome e
   e-mail de servidor que preencheu o formulário. Esses campos **não entram
   em nenhuma estrutura de saída** e o arquivo gravado passa por varredura de
   e-mail e de CPF (mod-11) antes de ser escrito (regras 5.2 e 5.8).
8. **Rerodar não cria diff.** O coletor compara o conteúdo novo com o que já
   está no disco, ignorando o carimbo de coleta: se o dado é o mesmo, mantém
   o `coletadoEm` anterior e não reescreve o arquivo. Idempotente de verdade,
   não só "roda de novo".
9. **Cache de ZIP em pasta temporária, fora do repositório.** Os pacotes
   somam ~830 MB; nenhum `.zip` ou `.xlsx` é versionado (ver `.gitignore`).
   Com o cache quente, rodar de novo não baixa nada.

PRIVACIDADE
-----------
Campos publicados por ente, e só estes: `ano`, `orgao`, `poder`, `esfera`,
`estado`, `municipio`, `itp`, `pctEssenciais`, `nivel`, `validada`,
`certificavel`, mais a procedência (`fonte`, `coletadoEm`). Nome, e-mail e
quem preencheu ficam na fonte oficial, onde já são públicos.

USO
---
    python scripts/coletar-pntp.py                  # 4 ciclos, baixa o que falta
    python scripts/coletar-pntp.py --ano 2025       # só um ciclo
    python scripts/coletar-pntp.py --refazer        # ignora o cache e baixa de novo

Dependência: `openpyxl` (já usada no repositório). Roda fora da CI.
"""
from __future__ import annotations

import argparse
import io
import json
import re
import shutil
import sys
import tempfile
import time
import urllib.request
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator

import openpyxl

# Console do Windows abre em cp1252 e quebra ao imprimir "✔️"/"❌"; o relatório
# deste script é lido por gente, então força UTF-8 na saída padrão.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

RAIZ = Path(__file__).resolve().parent.parent
SAIDA_DIR = RAIZ / "apps" / "web" / "data" / "pntp"

# User-Agent honesto exigido pelo AGENTS.md global (nunca UA de navegador).
USER_AGENT = "finweejur/github artur colito"

FONTE_PORTAL = "https://pntp.atricon.org.br/dados-abertos/"
BASE_CDN = "https://cdn.atricon.org.br/2026/08/"

ANOS = (2022, 2023, 2024, 2025)
URL_ZIP = {ano: f"{BASE_CDN}dados_pntp_{ano}.zip" for ano in ANOS}

PAUSA_CORTESIA_S = 2.0  # 1–2 s por host, como manda o AGENTS.md
UF_ALVO = "MINAS GERAIS"  # a fonte grava o nome do estado por extenso
UF_SIGLA = "MG"

# Nome da coluna em cada ciclo. O schema mudou em 2023 (ver decisão 1):
# a chave é o nome canônico publicado, o valor são os nomes aceitos na planilha.
COLUNAS: dict[str, tuple[str, ...]] = {
    "orgao": ("Unidade Gestora", "Órgão"),
    "poder": ("Poder", "Poder do Ente Público"),
    "esfera": ("Esfera",),
    "estado": ("UF", "Estado"),
    "municipio": ("Município",),
    "validada": ("Avaliação Validada?",),
    "certificavel": ("Avaliação Certificável?",),
    "itp": ("Índice de Transparência",),
    "pct": ("% das Essenciais",),
    "nivel": ("Nível de Transparência",),
}

# Nível que a fonte usa para ente que não entregou/validou avaliação.
NIVEL_NAO_AVALIADO = "Não Avaliado"

# Piso de sanidade: coleta que devolve menos que isto é falha de leitura, não
# mudança de mundo — e não sobrescreve arquivo bom (disciplina dos coletores).
MIN_LINHAS_BRASIL = 5_000
MIN_LINHAS_MG = 100

# Linhas em que a fonte gravou a porcentagem já multiplicada por 100 (medido:
# 5 linhas de `% das Essenciais` no ciclo 2025). Contadas para o relatório.
ESCALA_AJUSTADA: Counter[tuple[int, str]] = Counter()


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------
def baixar_zip(ano: int, cache: Path, refazer: bool = False) -> Path:
    """Baixa o pacote do ciclo `ano` para `cache`, com retomada por cache.

    Reaproveita o arquivo já baixado quando ele é um ZIP válido: são 830 MB no
    total e a fonte republica os pacotes uma vez por ciclo, não por dia.
    """
    destino = cache / f"dados_pntp_{ano}.zip"
    if destino.exists() and not refazer and zipfile.is_zipfile(destino):
        print(f"· {ano}: usando cache {destino.name} "
              f"({destino.stat().st_size / 1_048_576:.0f} MB)")
        return destino

    destino.parent.mkdir(parents=True, exist_ok=True)
    parcial = destino.with_suffix(".part")
    print(f"· {ano}: baixando {URL_ZIP[ano]}")
    req = urllib.request.Request(URL_ZIP[ano], headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=600) as resposta, parcial.open("wb") as saida:
        shutil.copyfileobj(resposta, saida, length=1 << 20)
    if not zipfile.is_zipfile(parcial):
        parcial.unlink(missing_ok=True)
        raise RuntimeError(f"{ano}: o download não é um ZIP válido")
    parcial.replace(destino)
    print(f"  → {destino.stat().st_size / 1_048_576:.0f} MB")
    time.sleep(PAUSA_CORTESIA_S)
    return destino


def abrir_planilha(caminho_zip: Path, ano: int) -> Iterator[dict[str, Any]]:
    """Itera as linhas da planilha de avaliações, com o cabeçalho como chave.

    Lê só `avaliacoes_pntp_<ano>.xlsx`; as planilhas de `respostas/` por UF
    ficam de fora (decisão do cabeçalho). `read_only` mantém a memória baixa.
    """
    with zipfile.ZipFile(caminho_zip) as pacote:
        alvos = [
            n for n in pacote.namelist()
            if n.endswith(f"avaliacoes_pntp_{ano}.xlsx") and "/respostas/" not in n
        ]
        if len(alvos) != 1:
            raise RuntimeError(f"{ano}: esperava 1 planilha de avaliações, achei {alvos}")
        with pacote.open(alvos[0]) as bruto:
            livro = openpyxl.load_workbook(
                io.BytesIO(bruto.read()), read_only=True, data_only=True
            )
            try:
                aba = livro[livro.sheetnames[0]]
                linhas = aba.iter_rows(values_only=True)
                cabecalho = [str(c).strip() if c is not None else "" for c in next(linhas)]
                for linha in linhas:
                    if not any(v is not None for v in linha):
                        continue
                    yield dict(zip(cabecalho, linha))
            finally:
                livro.close()


# ---------------------------------------------------------------------------
# Normalização
# ---------------------------------------------------------------------------
def campo(linha: dict[str, Any], chave: str) -> Any:
    """Lê a coluna canônica `chave` aceitando o nome de cada ciclo."""
    for nome in COLUNAS[chave]:
        if nome in linha:
            return linha[nome]
    return None


def texto(valor: Any) -> str:
    """Texto limpo: sem espaços sobrando, sem quebra de linha, sem None."""
    if valor is None:
        return ""
    return re.sub(r"\s+", " ", str(valor)).strip()


# Conectores que ficam minúsculos no meio de nome de município.
CONECTORES = {"de", "da", "do", "das", "dos", "e", "del"}


def titulo(valor: str) -> str:
    """Capitaliza nome que a fonte gravou em CAIXA ALTA (2022 inteiro).

    De 2023 em diante o município já vem capitalizado; nesse caso o valor é
    devolvido como está — reescrever nome próprio que a fonte acertou é como
    se cria divergência silenciosa entre o JSON e o portal oficial.
    """
    if not valor or valor.upper() != valor:
        return valor
    palavras = []
    for i, palavra in enumerate(valor.lower().split(" ")):
        if i > 0 and palavra in CONECTORES:
            palavras.append(palavra)
        else:
            palavras.append(palavra[:1].upper() + palavra[1:])
    return " ".join(palavras)


def booleano(valor: Any) -> bool | None:
    """Converte 'Sim'/'Não', '✔️'/'❌' e '-' em booleano — ou None sem resposta.

    A fonte usa três dialetos: emoji com seletor de variação em 2022, Sim/Não
    em 2023+, e '-' quando o ente não foi avaliado. O '-' vira None de
    propósito: "não avaliado" não é "não válido".
    """
    if valor is None:
        return None
    bruto = str(valor).strip()
    if bruto in {"", "-", "–", "—"}:
        return None
    if bruto[0] in {"✔", "✓"}:
        return True
    if bruto[0] in {"❌", "✗", "✘"}:
        return False
    minusculo = bruto.lower()
    if minusculo == "sim":
        return True
    if minusculo == "não" or minusculo == "nao":
        return False
    return None


def percentual(valor: Any, ano: int, campo_nome: str) -> float | None:
    """Fração 0–1 da fonte → porcentagem 0–100 com 1 decimal.

    A planilha publica 0,8252788; o portal publica 82,5. Fora da faixa é erro
    de leitura, não dado: aborta em vez de publicar número impossível.

    Exceção medida e contada: **5 linhas do ciclo 2025** trazem
    `% das Essenciais` já em escala de porcentagem (5 · 6,6 · 4,2 · 2,2),
    enquanto a coluna inteira usa fração. Ler 5 como fração daria 500%, que
    não existe; ler como 5% é a única leitura possível. O ajuste entra no
    relatório da coleta e no documento da fonte — corrigir em silêncio seria
    publicar número que a fonte não disse sem deixar rastro.
    """
    if valor is None or valor == "":
        return None
    try:
        numero = float(str(valor).replace(",", "."))
    except (TypeError, ValueError):
        return None
    if 0.0 <= numero <= 1.0:
        return round(numero * 100, 1)
    if 1.0 < numero <= 100.0:
        ESCALA_AJUSTADA[(ano, campo_nome)] += 1
        return round(numero, 1)
    raise ValueError(f"índice fora de 0–100 na fonte ({ano}/{campo_nome}): {valor!r}")



def nome_do_ente(ano: int, esfera: str, orgao: str, municipio: str) -> str:
    """Nome publicável do ente (decisão 2).

    Em 2022 o `Órgão` municipal é genérico ("Prefeitura") e se repete em todos
    os municípios; compor com o município é o que garante chave única. Em
    2023+ o nome completo já vem na planilha e é preservado.
    """
    if ano == 2022 and esfera == "Municipal" and municipio and municipio not in orgao:
        return f"{orgao} de {municipio}"
    return orgao


def normalizar(ano: int, linha: dict[str, Any]) -> dict[str, Any] | None:
    """Uma linha crua da planilha → registro publicável, ou None se inútil."""
    esfera = texto(campo(linha, "esfera"))
    orgao_bruto = texto(campo(linha, "orgao"))
    municipio = titulo(texto(campo(linha, "municipio")))
    if not orgao_bruto or not esfera:
        return None

    nivel = texto(campo(linha, "nivel"))
    nao_avaliado = nivel == NIVEL_NAO_AVALIADO
    registro = {
        "ano": ano,
        "orgao": nome_do_ente(ano, esfera, orgao_bruto, municipio),
        "poder": texto(campo(linha, "poder")),
        "esfera": esfera,
        "estado": UF_SIGLA if texto(campo(linha, "estado")).upper() == UF_ALVO else texto(campo(linha, "estado")),
        "municipio": municipio,
        # Decisão 4: não avaliado não é zero.
        "itp": None if nao_avaliado else percentual(campo(linha, "itp"), ano, "itp"),
        "pctEssenciais": None if nao_avaliado else percentual(campo(linha, "pct"), ano, "pctEssenciais"),
        "nivel": nivel,
        "validada": booleano(campo(linha, "validada")),
        "certificavel": booleano(campo(linha, "certificavel")),
    }
    return registro


# ---------------------------------------------------------------------------
# Agregação nacional
# ---------------------------------------------------------------------------
def media(valores: Iterable[float]) -> float | None:
    """Média simples com 1 decimal; None quando não há valor."""
    lista = [v for v in valores if v is not None]
    if not lista:
        return None
    return round(sum(lista) / len(lista), 1)


def recorte(linhas: list[dict[str, Any]], chave: str) -> list[dict[str, Any]]:
    """Contagem e média de ITP por valor de `chave` (esfera ou poder).

    A média usa só os avaliados: ente com nível `Não Avaliado` entra na
    contagem de `entes`, não na média (decisão 6).
    """
    grupos: dict[str, list[dict[str, Any]]] = {}
    for linha in linhas:
        grupos.setdefault(linha[chave] or "Não informado", []).append(linha)
    saida = []
    for nome in sorted(grupos):
        do_grupo = grupos[nome]
        avaliados = [l for l in do_grupo if l["nivel"] != NIVEL_NAO_AVALIADO]
        saida.append({
            chave: nome,
            "entes": len(do_grupo),
            "avaliados": len(avaliados),
            "itpMedio": media(l["itp"] for l in avaliados),
        })
    return saida


def agregado_do_ano(ano: int, linhas: list[dict[str, Any]]) -> dict[str, Any]:
    """Resumo agregado de um ciclo — nada de linha individual."""
    avaliados = [l for l in linhas if l["nivel"] != NIVEL_NAO_AVALIADO]
    return {
        "ano": ano,
        "entes": len(linhas),
        "avaliados": len(avaliados),
        "naoAvaliados": len(linhas) - len(avaliados),
        "itpMedio": media(l["itp"] for l in avaliados),
        "porEsfera": recorte(linhas, "esfera"),
        "porPoder": recorte(linhas, "poder"),
    }


# ---------------------------------------------------------------------------
# Privacidade e gravação
# ---------------------------------------------------------------------------
RE_EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
RE_ONZE_DIGITOS = re.compile(r"\b[0-9]{11}\b")

CAMPOS_PROIBIDOS = ("nomeResponsavel", "emailResponsavel", "preenchidoPor",
                    "Nome Responsável", "E-mail Responsável", "Preenchido por")


def cpf_valido(digitos: str) -> bool:
    """Dígito verificador mod-11 — a mesma régua de `sem-cpf-no-repo`."""
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False

    def dv(ate: int) -> int:
        soma = sum(int(digitos[i]) * (ate + 1 - i) for i in range(ate))
        resto = (soma * 10) % 11
        return 0 if resto == 10 else resto

    return dv(9) == int(digitos[9]) and dv(10) == int(digitos[10])


def conferir_privacidade(texto_json: str, rotulo: str) -> None:
    """Aborta se o arquivo a publicar tiver e-mail, CPF ou campo de responsável.

    É a mesma ideia do `lib/sem-cpf-no-repo.test.ts`, aplicada na hora de
    escrever: dado pessoal que nunca devia ter entrado no dicionário não chega
    ao disco nem por acidente de refatoração.
    """
    emails = RE_EMAIL.findall(texto_json)
    cpfs = [d for d in RE_ONZE_DIGITOS.findall(texto_json) if cpf_valido(d)]
    proibidos = [c for c in CAMPOS_PROIBIDOS if c in texto_json]
    if emails or cpfs or proibidos:
        raise RuntimeError(
            f"{rotulo}: varredura de privacidade reprovou — "
            f"e-mails={emails[:3]} cpf={cpfs[:3]} campos={proibidos}"
        )


def serializar(obj: Any) -> str:
    """JSON compacto de uma linha, UTF-8 preservado (mesmo padrão de data/)."""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n"


def sem_carimbo(obj: Any) -> Any:
    """Cópia do payload sem `coletadoEm` (topo e linhas) — base da idempotência."""
    copia = json.loads(json.dumps(obj))
    copia.pop("coletadoEm", None)
    for linha in copia.get("entes", []):
        linha.pop("coletadoEm", None)
    return copia


def gravar(caminho: Path, payload: dict[str, Any]) -> tuple[bool, int]:
    """Grava o payload; mantém o carimbo antigo se o dado não mudou.

    Devolve (mudou, bytes). Rerodar o coletor com a mesma fonte não gera
    commit de uma linha só porque o relógio andou (decisão 8).
    """
    if caminho.exists():
        antigo = json.loads(caminho.read_text(encoding="utf-8"))
        if sem_carimbo(antigo) == sem_carimbo(payload):
            payload["coletadoEm"] = antigo.get("coletadoEm", payload["coletadoEm"])
    # Linha sem carimbo recebe o do arquivo; linha herdada de outro ciclo
    # (ver `mesclar_entes`) mantém o carimbo da coleta em que foi lida.
    for linha in payload.get("entes", []):
        linha.setdefault("coletadoEm", payload["coletadoEm"])

    texto_json = serializar(payload)
    conferir_privacidade(texto_json, caminho.name)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    if caminho.exists() and caminho.read_text(encoding="utf-8") == texto_json:
        return False, caminho.stat().st_size
    # `newline="\n"`: no Windows o write_text padrão grava CRLF, e o mesmo
    # coletor produziria bytes diferentes por sistema operacional.
    caminho.write_text(texto_json, encoding="utf-8", newline="\n")
    return True, caminho.stat().st_size


# ---------------------------------------------------------------------------
# Coleta
# ---------------------------------------------------------------------------
def coletar_ano(ano: int, cache: Path, refazer: bool) -> list[dict[str, Any]]:
    """Coleta um ciclo inteiro (Brasil). A lista devolvida traz todos os entes."""
    caminho_zip = baixar_zip(ano, cache, refazer)
    registros: list[dict[str, Any]] = []
    ignoradas = 0
    for bruta in abrir_planilha(caminho_zip, ano):
        registro = normalizar(ano, bruta)
        if registro is None:
            ignoradas += 1
            continue
        registros.append(registro)

    if len(registros) < MIN_LINHAS_BRASIL:
        raise RuntimeError(
            f"{ano}: só {len(registros)} linhas (piso {MIN_LINHAS_BRASIL}) — "
            "leitura suspeita, arquivo existente não será sobrescrito"
        )
    if ignoradas:
        print(f"  ⚠️ {ano}: {ignoradas} linha(s) sem órgão/esfera ignorada(s)")
    for (ano_ref, campo_nome), quantas in sorted(ESCALA_AJUSTADA.items()):
        if ano_ref == ano:
            print(f"  ⚠️ {ano}: {quantas} linha(s) de {campo_nome} já em escala 0–100 na fonte")
    return registros


def conferir_chave_unica(registros: list[dict[str, Any]]) -> None:
    """A chave publicada é ano+orgao: duplicata é defeito, não detalhe."""
    vistos: dict[tuple[int, str], int] = {}
    repetidos: list[str] = []
    for registro in registros:
        chave = (registro["ano"], registro["orgao"])
        vistos[chave] = vistos.get(chave, 0) + 1
        if vistos[chave] == 2:
            repetidos.append(f"{chave[0]} · {chave[1]}")
    if repetidos:
        raise RuntimeError(
            "chave ano+orgao repetida em " + str(len(repetidos)) + " caso(s): "
            + "; ".join(repetidos[:5])
        )


def mesclar_entes(caminho: Path, novos: list[dict[str, Any]],
                  anos_coletados: set[int]) -> list[dict[str, Any]]:
    """Junta os ciclos recém-coletados ao arquivo, sem apagar os que ficaram de fora.

    `--ano 2025` existe para atualizar um ciclo. Se a gravação substituísse o
    arquivo inteiro, atualizar 2025 apagaria 2022–2024 do repositório — perda
    silenciosa de dado já publicado. O coletor troca só o que remedeu.
    """
    if not caminho.exists():
        return novos
    antigo = json.loads(caminho.read_text(encoding="utf-8"))
    herdados = [e for e in antigo.get("entes", []) if e.get("ano") not in anos_coletados]
    return herdados + novos


def mesclar_resumo(caminho: Path, novos: list[dict[str, Any]],
                   anos_coletados: set[int]) -> list[dict[str, Any]]:
    """Mesma regra do arquivo de entes, aplicada à lista de ciclos do resumo."""
    if not caminho.exists():
        return novos
    antigo = json.loads(caminho.read_text(encoding="utf-8"))
    herdados = [a for a in antigo.get("anos", []) if a.get("ano") not in anos_coletados]
    return sorted(herdados + novos, key=lambda agregado: agregado["ano"])


def principal() -> int:
    """Ponto de entrada: coleta, agrega, confere e grava. Devolve o código de saída."""
    parser = argparse.ArgumentParser(
        description="Baixa o PNTP/Atricon e grava o recorte de MG + resumo do Brasil."
    )
    parser.add_argument(
        "--ano", type=int, nargs="+", choices=ANOS, default=list(ANOS),
        help="ciclo(s) a coletar (padrão: todos: 2022 2023 2024 2025)",
    )
    parser.add_argument(
        "--refazer", action="store_true",
        help="ignora o cache de ZIP e baixa de novo",
    )
    parser.add_argument(
        "--cache", type=Path, default=Path(tempfile.gettempdir()) / "cp-pntp",
        help="pasta temporária dos ZIPs (padrão: %%TEMP%%\\cp-pntp)",
    )
    parser.add_argument(
        "--saida", type=Path, default=SAIDA_DIR,
        help="pasta dos JSON (padrão: apps/web/data/pntp)",
    )
    args = parser.parse_args()

    anos = sorted(set(args.ano))
    carimbo = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    todos: list[dict[str, Any]] = []
    for ano in anos:
        registros = coletar_ano(ano, args.cache, args.refazer)
        print(f"  {ano}: {len(registros)} entes no Brasil")
        todos.extend(registros)

    conferir_chave_unica([r for r in todos if r["estado"] == UF_SIGLA])
    mg = [r for r in todos if r["estado"] == UF_SIGLA]
    for ano in anos:
        do_ano = [r for r in mg if r["ano"] == ano]
        if len(do_ano) < MIN_LINHAS_MG:
            raise RuntimeError(
                f"{ano}: só {len(do_ano)} entes de {UF_SIGLA} (piso {MIN_LINHAS_MG})"
            )

    # Ordem estável: ciclo, esfera, poder, órgão — diff previsível entre coletas.
    # A mesclagem preserva os ciclos que esta execução não recoletou (--ano).
    caminho_mg = args.saida / "avaliacoes-mg.json"
    mg = mesclar_entes(caminho_mg, mg, set(anos))
    mg.sort(key=lambda r: (r["ano"], r["esfera"], r["poder"], r["orgao"]))
    conferir_chave_unica(mg)
    for registro in mg:
        registro["fonte"] = URL_ZIP[registro["ano"]]

    anos_no_arquivo = sorted({r["ano"] for r in mg})
    payload_mg = {
        "titulo": "PNTP/Atricon — índice de transparência dos entes públicos de Minas Gerais",
        "fonte": "Atricon — Programa Nacional de Transparência Pública (dados abertos)",
        "fonteUrl": FONTE_PORTAL,
        "licenca": "dado público publicado pela Atricon; uso com atribuição (sem licença CC declarada)",
        "escopo": (
            "entes públicos de MG nos ciclos " + ", ".join(str(a) for a in anos_no_arquivo)
            + "; itp e pctEssenciais em % (0–100); itp nulo quando o nível é 'Não Avaliado'"
        ),
        "coletadoEm": carimbo,
        "total": len(mg),
        "entes": mg,
    }

    agregados = mesclar_resumo(
        args.saida / "resumo-brasil.json",
        [agregado_do_ano(ano, [r for r in todos if r["ano"] == ano]) for ano in anos],
        set(anos),
    )
    payload_resumo = {
        "titulo": "PNTP/Atricon — resumo nacional por ciclo, esfera e poder",
        "fonte": "Atricon — Programa Nacional de Transparência Pública (dados abertos)",
        "fonteUrl": FONTE_PORTAL,
        "nota": (
            "Média de ITP calculada só sobre entes avaliados; 'Não Avaliado' fora da média "
            "e 'Inexistente' entrando com índice zero — a mesma regra da página do PNTP"
        ),
        "coletadoEm": carimbo,
        "anos": agregados,
    }

    mudou_mg, bytes_mg = gravar(args.saida / "avaliacoes-mg.json", payload_mg)
    mudou_resumo, bytes_resumo = gravar(args.saida / "resumo-brasil.json", payload_resumo)

    print()
    print("== Resultado")
    for ano in anos:
        do_ano = [r for r in mg if r["ano"] == ano]
        avaliados = [r for r in do_ano if r["nivel"] != NIVEL_NAO_AVALIADO]
        itps = [r["itp"] for r in avaliados if r["itp"] is not None]
        media_mg = round(sum(itps) / len(itps), 1) if itps else None
        print(f"  {ano}: {len(do_ano)} entes de MG · {len(avaliados)} avaliados · "
              f"ITP médio {media_mg}")
    for agregado in agregados:
        print(f"  Brasil {agregado['ano']}: {agregado['entes']} entes · "
              f"ITP médio {agregado['itpMedio']}")
    print(f"  avaliacoes-mg.json: {bytes_mg / 1_048_576:.2f} MB "
          f"({'gravado' if mudou_mg else 'sem mudança'})")
    print(f"  resumo-brasil.json: {bytes_resumo / 1_024:.1f} KB "
          f"({'gravado' if mudou_resumo else 'sem mudança'})")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(principal())
    except (RuntimeError, ValueError) as erro:
        print(f"❌ {erro}", file=sys.stderr)
        raise SystemExit(1)
