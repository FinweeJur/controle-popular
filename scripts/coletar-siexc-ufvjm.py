#!/usr/bin/env python3
"""Coletor dos projetos de extensão em andamento da UFVJM (SIEXC).

Fonte oficial: https://siexc.ufvjm.edu.br/projetosfluxocontinuo
- `robots.txt` do host responde `Disallow:` vazio (coleta permitida).
- User-Agent honesto: `finweejur/github artur colito`.
- Ritmo: ~1,2 s entre requisições, sem paralelismo.
- Recorte: somente ações do tipo "Projeto" com Data Fim igual ou posterior
  à data da coleta. Projeto encerrado não entra — o leitor quer contato vivo.
- Contato: o SIEXC não publica e-mail/telefone do projeto; o cartão do portal
  cai no contato institucional da UFVJM, sempre rotulado.

O que o script grava: `apps/web/lib/universidades/dados-extensao-ufvjm.ts`,
um módulo tipado com `PROJETOS_EXTENSAO_UFVJM`. Dado gerado não se edita à
mão: rode o script de novo.

Uso:
    python scripts/coletar-siexc-ufvjm.py
"""

from __future__ import annotations

import html
import json
import re
import sys
import tempfile
import time
from datetime import date
from pathlib import Path

import requests

BASE = "https://siexc.ufvjm.edu.br/projetosfluxocontinuo"
UA = "finweejur/github artur colito"
PAUSA = 1.2
DESTINO = (
    Path(__file__).resolve().parent.parent
    / "apps"
    / "web"
    / "lib"
    / "universidades"
    / "dados-extensao-ufvjm.ts"
)


def buscar(url: str) -> str:
    """Baixa uma página do SIEXC e devolve o HTML já decodificado.

    O servidor declara UTF-8 no cabeçalho e serve UTF-8 de verdade. O console
    do Windows engana: imprimir o texto acentuado aparece quebrado, mas a
    decodificação está certa. Se algum dia vier latin-1, o fallback evita
    perder a página inteira.
    """
    r = requests.get(url, headers={"User-Agent": UA}, timeout=60)
    r.raise_for_status()
    time.sleep(PAUSA)
    try:
        return r.content.decode("utf-8")
    except UnicodeDecodeError:
        return r.content.decode("latin-1")


def texto(fragmento: str) -> str:
    """Converte um trecho HTML em texto limpo de entidades e espaços."""
    limpo = re.sub(r"<[^>]+>", " ", fragmento)
    limpo = html.unescape(limpo)
    return re.sub(r"\s+", " ", limpo).strip()


def ler_linha(tr: str) -> tuple[str, dict[str, str]] | None:
    """Extrai id e campos de uma `<tr>` da listagem; `None` se não casar."""
    m = re.search(rf"{BASE}/(\d+)", tr)
    tds = re.findall(r"<td[^>]*>(.*?)</td>", tr, flags=re.S)
    if not m or len(tds) < 5:
        return None
    pid = m.group(1)
    return pid, {
        "id": pid,
        "edital": texto(tds[1]),
        "titulo": texto(tds[2]).strip('"“” ‘\''),
        "inicio": texto(tds[3]),
        "fim": texto(tds[4]),
    }


def linhas_da_lista() -> dict[str, dict[str, str]]:
    """Percorre a listagem paginada e devolve as linhas por id de inscrição.

    A listagem é guardada em cache no diretório temporário: se a coleta de
    fichas falhar, não é preciso varrer as 63 páginas de novo. `--renovar`
    ignora o cache.
    """
    cache = Path(tempfile.gettempdir()) / "siexc-listagem.json"
    if cache.exists() and "--renovar" not in sys.argv:
        dados = json.loads(cache.read_text(encoding="utf-8"))
        print(f"  listagem do cache: {len(dados)} ações")
        return dados

    achados: dict[str, dict[str, str]] = {}
    for pagina in range(1, 200):
        url = f"{BASE}?projeto" + (f"&page={pagina}" if pagina > 1 else "")
        t = buscar(url)
        corpo = t[t.find("<tbody") : t.find("</tbody>")]
        novas = 0
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", corpo, flags=re.S):
            item = ler_linha(tr)
            if not item or item[0] in achados:
                continue
            achados[item[0]] = item[1]
            novas += 1
        print(f"  página {pagina}: {novas} novas, {len(achados)} no total")
        if novas == 0:
            break

    cache.write_text(json.dumps(achados, ensure_ascii=False), encoding="utf-8")
    return achados


def em_andamento(fim: str, hoje: date) -> bool:
    """Diz se a data final (dd/mm/aaaa) ainda não passou."""
    try:
        d, m, a = (int(p) for p in fim.split("/"))
        return date(a, m, d) >= hoje
    except (ValueError, TypeError):
        return False


def iso(data_br: str) -> str:
    """Converte dd/mm/aaaa em aaaa-mm-dd; devolve vazio se não casar."""
    try:
        d, m, a = (int(p) for p in data_br.split("/"))
        return f"{a:04d}-{m:02d}-{d:02d}"
    except (ValueError, TypeError):
        return ""


CAMPOS = {
    "area": "Área de Conhecimento",
    "tematica": "Área Temática Principal",
    "linha": "Linha de Extensão",
    "abrangencia": "Abrangência",
    "coordenador": "Nome do Coordenador",
    "tipo": "Tipo da Ação",
    "situacao": "Situação",
    "inicio": "Data Inicio",
    "fim": "Data Fim",
}


def ler_detalhe(pid: str) -> dict[str, str]:
    """Lê a ficha pública do projeto e devolve os campos que interessam.

    A ficha do SIEXC repete o padrão
    `<small class="text-primary">RÓTULO</small> ... <b>VALOR</b>`.
    Só o que está nesse padrão é lido; o resto (membros, resumo) fica fora.
    """
    t = buscar(f"{BASE}/{pid}")
    dados: dict[str, str] = {}
    for chave, rotulo in CAMPOS.items():
        padrao = (
            r"<small[^>]*>\s*"
            + re.escape(rotulo)
            + r"\s*</small>.*?<b[^>]*>(.*?)</b>"
        )
        m = re.search(padrao, t, flags=re.S)
        dados[chave] = texto(m.group(1)) if m else ""
    return dados


def main() -> int:
    hoje = date.today()
    print(f"Coletando listagem do SIEXC/UFVJM (recorte: fim >= {hoje:%d/%m/%Y})")
    lista = linhas_da_lista()

    vivos = {
        pid: linha
        for pid, linha in lista.items()
        if em_andamento(linha["fim"], hoje)
    }
    # O próprio anúncio da listagem traz o tipo ("Ações : Projeto"). Filtrar
    # aqui evita abrir ficha de evento, curso ou oficina só para descartar.
    projetos = {
        pid: linha
        for pid, linha in vivos.items()
        if "Projeto" in linha["edital"]
    }
    print(
        f"{len(lista)} ações na listagem, {len(vivos)} em andamento, "
        f"{len(projetos)} do tipo projeto"
    )

    registros = coletar_registros(projetos)
    registros.sort(key=lambda r: r["nome"].casefold())

    corpo = ",\n".join(
        "  " + json.dumps(r, ensure_ascii=False) for r in registros
    )

    DESTINO.write_text(molde(registros, hoje, corpo), encoding="utf-8")
    print(f"{len(registros)} projetos gravados em {DESTINO}")
    return 0


def montar_registro(pid: str, linha: dict[str, str], detalhe: dict[str, str]) -> dict[str, str]:
    """Junta a linha da listagem com os campos da ficha pública."""
    return {
        "id": pid,
        "nome": linha["titulo"],
        "url": f"{BASE}/{pid}",
        "area": detalhe.get("area", ""),
        "tematica": detalhe.get("tematica", ""),
        "linha": detalhe.get("linha", ""),
        "abrangencia": detalhe.get("abrangencia", ""),
        "coordenador": detalhe.get("coordenador", ""),
        "inicio": iso(detalhe.get("inicio") or linha["inicio"]),
        "fim": iso(detalhe.get("fim") or linha["fim"]),
    }


def coletar_registros(projetos: dict[str, dict[str, str]]) -> list[dict[str, str]]:
    """Abre a ficha de cada projeto em andamento e monta o registro final."""
    registros: list[dict[str, str]] = []
    for n, (pid, linha) in enumerate(sorted(projetos.items()), start=1):
        detalhe = ler_detalhe(pid)
        if "Projeto" not in detalhe.get("tipo", ""):
            continue
        registros.append(montar_registro(pid, linha, detalhe))
        if n % 20 == 0:
            print(f"  {n}/{len(projetos)} fichas lidas", flush=True)
    return registros


def molde(registros: list[dict[str, str]], hoje: date, corpo: str) -> str:
    """Monta o módulo TS gerado, com cabeçalho de procedência."""
    return f'''/**
 * @file apps/web/lib/universidades/dados-extensao-ufvjm.ts
 * @description Projetos de extensão EM ANDAMENTO da UFVJM, lidos do SIEXC.
 *
 * GERADO por `scripts/coletar-siexc-ufvjm.py` em {hoje:%d/%m/%Y}.
 * Não edite à mão: rode o coletor de novo.
 *
 * Fonte oficial: https://siexc.ufvjm.edu.br/projetosfluxocontinuo
 * Recorte: ações do tipo "Projeto" com Data Fim >= {hoje:%d/%m/%Y}.
 * O SIEXC não publica e-mail nem telefone do projeto; por isso o cartão do
 * portal usa o contato institucional da UFVJM, sempre rotulado como tal.
 *
 * Campos vazios significam "a fonte não informou" — nunca suposição.
 */

import type {{ ProjetoExtensao }} from "./tipos";

/** Data em que o SIEXC foi lido. */
export const UFVJM_EXTENSAO_DATA_ACESSO = "{hoje:%Y-%m-%d}";

/** Página-mãe da listagem de fluxo contínuo. */
export const UFVJM_EXTENSAO_FONTE =
  "https://siexc.ufvjm.edu.br/projetosfluxocontinuo";

interface RegistroSiExc {{
  id: string;
  nome: string;
  url: string;
  area: string;
  tematica: string;
  linha: string;
  abrangencia: string;
  coordenador: string;
  inicio: string;
  fim: string;
}}

const REGISTROS: RegistroSiExc[] = [
{corpo}
];

/** Converte o registro bruto do SIEXC no tipo público do índice. */
export const PROJETOS_EXTENSAO_UFVJM: ProjetoExtensao[] = REGISTROS.map((r) => ({{
  instituicao: "UFVJM",
  nome: r.nome,
  area: r.area || undefined,
  areaTematicaFonte: r.tematica || undefined,
  linhaExtensao: r.linha || undefined,
  abrangencia: r.abrangencia || undefined,
  coordenador: r.coordenador || undefined,
  inicio: r.inicio || undefined,
  fim: r.fim || undefined,
  url: r.url,
  plataforma: "SIEXC",
  fonteUrl: UFVJM_EXTENSAO_FONTE,
  dataAcesso: UFVJM_EXTENSAO_DATA_ACESSO,
}}));
'''


if __name__ == "__main__":
    sys.exit(main())
