# -*- coding: utf-8 -*-
"""Coleta os atos normativos do CNJ pela API pública do portal de atos.

O QUE E: baixa metadados de resoluções, provimentos, portarias, instruções
normativas, enunciados, recomendações e afins, com o texto compilado quando o
ato determina regra. Grava um JSON único para consulta e para o RAG.

FONTE OFICIAL: https://atos.cnj.jus.br — o portal onde o CNJ publica os
próprios atos. A API (`/api/atos`) devolve JSON com ementa e texto compilado,
sem login, sem captcha e sem raspagem de HTML de resultado.

DECISÃO DE COLETA (08/11/2026), conforme AGENTS/COLETA-ETICA:

- `atos.cnj.jus.br/robots.txt` responde `Disallow:` vazio: coleta liberada.
- `www.cnj.jus.br/robots.txt` responde `Allow: /` para `User-agent: *`.
  Ainda assim este coletor NÃO toca `/download/`, `/dje/`, `/sei/`, `/wiki/`
  nem área autenticada — usa só a API de atos.
- User-Agent honesto: `finweejur/github artur colito`.
- Pausa de 1,5 s entre páginas; 50 atos por página; nada em paralelo.
- Checkpoint por (tipo, página): queda não recomeça do zero.

POR QUE ASSIM

1. O texto já vem na API (`url_txt_compilado`), então não há uma segunda
   requisição por PDF. Menos carga no servidor e menos dado pessoal em trânsito.
2. Portaria é 4.422 dos 6.009 atos e a maior parte é ato de efeito interno
   (designa sessão, nomeia grupo de trabalho). O campo `normativo` separa o
   que determina regra do que só movimenta a máquina: entra texto completo só
   para o primeiro grupo, o resto fica com ementa e link.
3. A heurística é declarada, não escondida: `NORMATIVO` e `ADMINISTRATIVO`
   estão no topo do arquivo e o JSON diz quantos caíram em cada lado.

Uso:
    python scripts/coletar-cnj-atos.py
    python scripts/coletar-cnj-atos.py --tipos 7,20 --limite-paginas 2
"""
from __future__ import annotations

import argparse
import html
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
SAIDA = RAIZ / "apps" / "web" / "public" / "data" / "cnj-atos.json"
ESTADO = RAIZ / "logs" / "cnj-atos-progresso.json"
BASE = "https://atos.cnj.jus.br/api/atos"
UA = "finweejur/github artur colito"
PAUSA = 1.5
POR_PAGINA = 50
TENTATIVAS = 4

TIPOS = {
    7: "Resolução",
    8: "Instrução Normativa",
    9: "Portaria",
    10: "Enunciado Administrativo",
    11: "Portaria Conjunta",
    13: "Recomendação",
    19: "Resolução Conjunta",
    20: "Provimento",
    25: "Instrução Normativa Conjunta",
}

# Verbos que indicam regra geral ou alteração de regra existente.
NORMATIVO = re.compile(
    r"\b(disp[oõ]e|regulamenta|estabelece|fixa|aprova|altera|revoga|define|"
    r"disciplina|normatiza|regula|institui|extingue|atualiza|autoriza|veda|"
    r"determina|cria|consolida|uniformiza)\b",
    re.I,
)
# Efeito interno: não determina regra para quem está fora do CNJ.
ADMINISTRATIVO = re.compile(
    r"\b(designa|nomeia|exonera|delega|convoca|sess[ãa]o|grupo de trabalho|"
    r"comit[êe]|elogio|dispensa|substitui|prorroga|composi[çc][ãa]o|"
    r"agradece|instaura|abre inscri[çc][õo]es|resultado|gabarito|"
    r"justificativa|pauta)\b",
    re.I,
)
TAGS = re.compile(r"<[^>]+>")
ESPACOS = re.compile(r"\s+")
# Teto por ato: o Código Nacional de Normas chega a 80 mil caracteres e sozinho
# dobraria o arquivo. O corte fica declarado no registro (`textoTruncado`).
LIMITE_TEXTO = 20000


def limpar(html_bruto: str | None) -> str:
    """HTML do portal vira texto corrido; entidade vira caractere."""
    if not html_bruto:
        return ""
    texto = html.unescape(TAGS.sub(" ", html_bruto))
    return ESPACOS.sub(" ", texto).strip()


def e_normativo(ementa: str) -> bool:
    """Determina regra? Exclusão administrativa vem antes do verbo normativo."""
    if ADMINISTRATIVO.search(ementa):
        return False
    return bool(NORMATIVO.search(ementa))


def _estado() -> dict:
    if ESTADO.exists():
        try:
            return json.loads(ESTADO.read_text(encoding="utf-8"))
        except ValueError:
            pass
    return {"paginas": {}, "atos": {}}


def _salvar_estado(estado: dict) -> None:
    ESTADO.parent.mkdir(parents=True, exist_ok=True)
    ESTADO.write_text(json.dumps(estado, ensure_ascii=False), encoding="utf-8")


def buscar_pagina(tipo: int, pagina: int) -> dict:
    """Uma página da API, com retry e espera crescente."""
    url = f"{BASE}?tipoAto={tipo}&per_page={POR_PAGINA}&page={pagina}"
    motivo = ""
    for tentativa in range(TENTATIVAS):
        pedido = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(pedido, timeout=90) as resposta:
                return json.load(resposta)
        except (urllib.error.HTTPError, OSError, ValueError) as erro:
            motivo = str(erro)[:120]
            time.sleep(3 * (tentativa + 1))
    raise RuntimeError(f"tipo {tipo} pagina {pagina}: {motivo}")


def converter(ato: dict) -> dict:
    """Registro enxuto: o que a consulta e o RAG precisam, nada além."""
    ementa = limpar(ato.get("ementa"))
    normativo = e_normativo(ementa)
    arquivo = ato.get("url_ato") or ""
    texto = limpar(ato.get("url_txt_compilado")) if normativo else ""
    return {
        "id": ato.get("id"),
        "tipo": ato.get("tipo"),
        "numero": ato.get("numero"),
        "data": ato.get("data_publicacao"),
        "situacao": ato.get("situacao"),
        "orgao": (ato.get("orgao_origem_ato") or {}).get("dsc_orgao_origem"),
        "ementa": ementa,
        "normativo": normativo,
        "fonte": (ato.get("fonte") or "").strip(),
        "url": f"https://atos.cnj.jus.br/atos/detalhar/{ato.get('id')}",
        "pdf": f"https://atos.cnj.jus.br/files/{arquivo}" if arquivo else None,
        "texto": texto[:LIMITE_TEXTO],
        "textoTruncado": len(texto) > LIMITE_TEXTO,
    }


def coletar(tipos: list[int], limite_paginas: int) -> None:
    estado = _estado()
    paginas = estado.setdefault("paginas", {})
    atos = estado.setdefault("atos", {})
    for tipo in tipos:
        pagina = int(paginas.get(str(tipo), 0)) + 1
        while True:
            dados = buscar_pagina(tipo, pagina)
            ultima = int(dados.get("last_page") or 1)
            for bruto in dados.get("data") or []:
                registro = converter(bruto)
                atos[str(registro["id"])] = registro
            paginas[str(tipo)] = pagina
            _salvar_estado(estado)
            print(f"{TIPOS.get(tipo, tipo)}: página {pagina}/{ultima} | "
                  f"{len(atos)} atos", flush=True)
            if pagina >= ultima or (limite_paginas and pagina >= limite_paginas):
                break
            pagina += 1
            time.sleep(PAUSA)


def publicar() -> dict:
    estado = _estado()
    atos = sorted(estado.get("atos", {}).values(),
                  key=lambda ato: (ato.get("data") or "", ato.get("tipo") or ""),
                  reverse=True)
    normativos = [ato for ato in atos if ato.get("normativo")]
    resumo = {
        "geradoEm": time.strftime("%Y-%m-%d"),
        "fonte": "https://atos.cnj.jus.br",
        "userAgent": UA,
        "total": len(atos),
        "normativos": len(normativos),
        "comTexto": sum(1 for ato in atos if ato.get("texto")),
        "porTipo": {},
        "atos": atos,
    }
    for ato in atos:
        chave = ato.get("tipo") or "—"
        resumo["porTipo"][chave] = resumo["porTipo"].get(chave, 0) + 1
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(resumo, ensure_ascii=False, indent=1), encoding="utf-8")
    return resumo


def main() -> int:
    ap = argparse.ArgumentParser(description="Coleta atos do CNJ pela API pública.")
    ap.add_argument("--tipos", default=",".join(str(t) for t in sorted(TIPOS)))
    ap.add_argument("--limite-paginas", type=int, default=0)
    opcoes = ap.parse_args()
    tipos = [int(item) for item in opcoes.tipos.split(",") if item.strip()]
    coletar(tipos, opcoes.limite_paginas)
    resumo = publicar()
    print(json.dumps({chave: resumo[chave] for chave in
                      ("total", "normativos", "comTexto", "porTipo")},
                     ensure_ascii=False, indent=1))
    print(f"arquivo: {SAIDA}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
