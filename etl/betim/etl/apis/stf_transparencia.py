# -*- coding: utf-8 -*-
"""Transparencia do STF: o mapa das 78 secoes e os relatorios da Comissao de Etica.

═══ O QUE ESTA FONTE DERRUBA (DE NOVO) ═══

Este projeto afirmou duas vezes que nao havia dado correicional sobre o STF:
primeiro que "o STF nao e' inspecionado" (verdade parcial), depois que "o que
existe e' auditoria de contrato e conta, nao de vara e fila" (falso pela
metade).

**A pagina de Transparencia e Prestacao de Contas do STF tem 78 secoes**, e
entre elas ha uma chamada **"Acoes de Correicao"**, com os relatorios anuais da
**Comissao de Etica** -- o orgao que apura desvio etico, PAD, PAR e sindicancia
dentro do proprio Tribunal.

⚠️ **A LICAO, PELA TERCEIRA VEZ NO MESMO DIA: nao e' que o dado nao existia --
e' que eu procurei no lugar errado.** As tentativas anteriores bateram no
GraphQL do CMS e no `publicacao.asp`, tomaram **HTTP 202 com corpo vazio** do
WAF da AWS e concluiram que a fonte estava fechada. Ela nao estava: o caminho
era a pagina de transparencia, lida num NAVEGADOR.

═══ POR QUE PRECISA DE NAVEGADOR PARA ACHAR, E DE CURL PARA BAIXAR ═══

⚠️ As paginas `.asp` do portal respondem **200 com 62.711 bytes de casca** --
byte-identicas entre paginas diferentes. O conteudo e' montado por JS, e os
links vivem dentro de **accordions do Bootstrap** (`.accordion-item`), colapsados
mas presentes no DOM. Sem navegador, `curl` ve a casca e conclui "nao ha nada".

Ja os PDFs moram em `cms.stf.jus.br/wp-content/uploads/` e baixam por `curl`
normalmente -- **com `-L`**: sem seguir redirecionamento, o http:// devolve
**301 com 134 bytes de HTML**, que um coletor desatento grava como se fosse PDF.

Medido em 2026-08-22.
"""
import argparse
import io
import json
import os
import re
import subprocess

AQUI = os.path.dirname(os.path.abspath(__file__))
DADOS = os.path.abspath(os.path.join(AQUI, "..", "..", "dados"))
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

# Relatorios anuais da Comissao de Etica, colhidos do accordion "Acoes de
# Correicao" da pagina de transparencia. ⚠️ O de 2025 NAO segue o padrao de
# nome dos outros (`SEI_3311232_Relatorio-5.pdf`): adivinhar a URL do proximo
# ano a partir da anterior nao funciona aqui.
RELATORIOS_ETICA = {
    2022: "https://cms.stf.jus.br/wp-content/uploads/2025/06/Atividades-da-Comissao-de-Etica-2022.pdf",
    2023: "https://cms.stf.jus.br/wp-content/uploads/2025/06/Atividades-da-Comissao-de-Etica-2023.pdf",
    2024: "https://cms.stf.jus.br/wp-content/uploads/2025/06/Atividades-da-Comissao-de-Etica-2024.pdf",
    2025: "https://cms.stf.jus.br/wp-content/uploads/2026/07/SEI_3311232_Relatorio-5.pdf",
}

# A frase que o Tribunal repete, e que e' o achado.
RE_SEM_INSTAURACAO = re.compile(
    r"[Nn]o exerc[íi]cio n[ãa]o houve instaura[çc][ãa]o de processo administrativo "
    r"para apura[çc][ãa]o de desvios [ée]ticos")
# Numero de processo administrativo interno do STF: NNNNNN/AAAA.
RE_PROC_SEI = re.compile(r"\b(\d{6}/20\d{2})\b")
RE_CONCLUSAO = re.compile(
    r"(ARQUIVAMENTO|ENCAMINHAMENTO AO DIRETOR-GERAL|TERMO DE AJUSTAMENTO)", re.I)


def baixar(url, alvo):
    """⚠️ `-L` obrigatorio: sem ele o http:// devolve 301 com 134 bytes de HTML,
    e um coletor que so' olha o status grava a pagina de redirecionamento com
    extensao .pdf."""
    subprocess.run(["curl", "-sSL", "-m", "180", "-A", UA, "-o", alvo, url],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                   timeout=240)
    cabeca = io.open(alvo, "rb").read(5) if os.path.exists(alvo) else b""
    if cabeca != b"%PDF-":
        raise SystemExit("PARE: %s nao e' PDF (comeca com %r)" % (url, cabeca))
    return os.path.getsize(alvo)


def ler(caminho):
    import fitz
    d = fitz.open(caminho)
    t = "\n".join(p.get_text() for p in d)
    n = d.page_count
    d.close()
    return re.sub(r"[ \t]+", " ", t), n


def averiguacoes(texto):
    """As averiguacoes preliminares, com numero de processo e desfecho.

    ⚠️ Numero de processo administrativo NAO e' dado pessoal, mas leva a um:
    quem consulta o SEI com ele chega ao nome do servidor investigado. Por isso
    o campo existe no dado (e' o que permite alguem conferir) e a decisao de
    exibir em tela fica para o editorial -- do mesmo jeito que a pauta do CNJ.
    """
    saida = []
    for m in RE_PROC_SEI.finditer(texto):
        janela = texto[m.end():m.end() + 420]
        conc = RE_CONCLUSAO.search(janela)
        saida.append({
            "processo": m.group(1),
            "desfecho": conc.group(1).upper() if conc else None,
            "trecho": re.sub(r"\s+", " ", janela[:300]).strip(),
        })
    # Dedup por numero, guardando a primeira ocorrencia (a da tabela).
    vistos, unicos = set(), []
    for a in saida:
        if a["processo"] in vistos:
            continue
        vistos.add(a["processo"])
        unicos.append(a)
    return unicos


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--pasta", default=r"X:\DevCoder\_lote-ambiental\stf")
    ap.add_argument("--saida")
    a = ap.parse_args()
    os.makedirs(a.pasta, exist_ok=True)

    anos = []
    for ano, url in sorted(RELATORIOS_ETICA.items()):
        alvo = os.path.join(a.pasta, "etica-%d.pdf" % ano)
        tam = os.path.getsize(alvo) if os.path.exists(alvo) else baixar(url, alvo)
        texto, paginas = ler(alvo)
        anos.append({
            "ano": ano,
            "url": url,
            "bytes": tam,
            "paginas": paginas,
            "caracteres": len(texto),
            "semInstauracaoDeclarada": bool(RE_SEM_INSTAURACAO.search(texto)),
            "averiguacoesPreliminares": averiguacoes(texto),
        })

    pacote = {
        "fonte": "Supremo Tribunal Federal — Transparência e Prestação de Contas, seção “Ações de Correição”",
        "url": "https://portal.stf.jus.br/transparencia/",
        "orgao": "Comissão de Ética do STF (Resolução STF 711/2020)",
        "extraidoEm": "2026-08-22",
        "oQueEh": (
            "A Comissão de Ética é o órgão de correição interna do STF: apura "
            "desvio ético, processo administrativo disciplinar (PAD), processo "
            "administrativo de responsabilização (PAR) e sindicância. Publica "
            "relatório anual de atividades."
        ),
        "avisoNaoEhInspecao": (
            "Isto NÃO é inspeção externa. A Corregedoria Nacional de Justiça não "
            "inspeciona tribunal superior — seu regulamento descreve inspeção "
            "sobre órgãos de primeiro e segundo grau. O que existe no STF é "
            "correição INTERNA, feita por comissão do próprio Tribunal. As duas "
            "coisas não se substituem e não se somam."
        ),
        "avisoObjeto": (
            "O objeto é conduta de SERVIDOR, não atividade jurisdicional. Nenhum "
            "destes relatórios trata de fila, prazo ou processo parado."
        ),
        "avisoCaminho": (
            "Os links vivem em accordions do Bootstrap na página de "
            "transparência. As páginas .asp respondem 200 com 62.711 bytes de "
            "casca idêntica entre si — sem navegador, um coletor conclui que "
            "não há fonte. Foi o que aconteceu na primeira tentativa."
        ),
        "relatorios": anos,
    }
    destino = a.saida or os.path.join(DADOS, "stf-comissao-etica.json")
    json.dump(pacote, io.open(destino, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    for r in anos:
        print("%d: %d pág, %d averiguações, sem instauração declarada: %s"
              % (r["ano"], r["paginas"], len(r["averiguacoesPreliminares"]),
                 r["semInstauracaoDeclarada"]))
    print("gravado:", destino)
