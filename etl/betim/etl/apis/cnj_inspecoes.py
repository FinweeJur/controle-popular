# -*- coding: utf-8 -*-
"""Inspecoes e correicoes da Corregedoria Nacional de Justica (CNJ).

═══ O QUE ESTA FONTE DERRUBA ═══

A sondagem de 22/08/2026 tinha REPROVADO a frente correicional inteira: as
paginas HTML do CNJ sobre inspecoes tinham 270 KB e linkavam regimento interno
e organograma. A conclusao ("nao ha achado consultavel") estava certa sobre
aquelas paginas e ERRADA sobre o CNJ.

O acervo existe, em outro lugar: a biblioteca de documentos do WordPress
(plugin WPFD), que responde **JSON puro** e lista **467 relatorios, ~2 GB**,
uma categoria por tribunal -- os 27 TJs, mais TRFs e TRTs.

Licao que vale fora daqui: **medir a pagina que fala do assunto nao mede a
fonte.** O acervo estava a uma rota de distancia, sem login e sem captcha.

═══ AS DUAS ARMADILHAS DA ROTA ═══

1. ⚠️ **O `token` da URL de download ROTACIONA.** A URL que um humano copia do
   navegador (`...&token=56ae71a6...&preview=1`) traz um token que NAO e' o que
   a API devolve minutos depois (`...&token=89a9bcdb...`). Guardar essa URL e'
   guardar link que morre. O campo `linkdownload` do proprio JSON e' um
   **permalink sem token** -- conferido: mesmo arquivo, 14.970.417 bytes.
   **So' o `linkdownload` entra no dado.**

2. ⚠️ **Nao ha rota de listagem de categorias.** `task=categories.getCategories`
   devolve **HTTP 500** ("erro critico no seu site") e
   `task=category.getCategories` devolve `{"category":false}`. O universo se
   descobre varrendo id, e por isso a varredura registra o intervalo que olhou
   -- um numero de "categorias achadas" sem o intervalo mente por omissao.

═══ E A ARMADILHA QUE NAO E' DA ROTA, E' DO CONTEUDO ═══

⚠️ **O CNJ publica CPF de pessoa fisica dentro do relatorio.** Medido no TJMG
2026: **5 CPFs validos por digito verificador**, de particulares (compradores e
vendedores de um lote, um delegatario com pendencia fiscal), na secao de
serventias extrajudiciais. Nao e' hipotese: os numeros passam no mod-11.

Por isso a redacao acontece **na origem**, aqui, antes de qualquer arquivo ser
gravado -- e por digito verificador sobre o texto, nunca por formato nem por
rotulo da fonte. Ver `flag_de_pessoa_fisica_mente`.

Fonte: https://www.cnj.jus.br/corregedoria/  (biblioteca WPFD)
Medido em 2026-08-22.
"""
import argparse
import io
import json
import os
import re
import subprocess
import time

AQUI = os.path.dirname(os.path.abspath(__file__))
DADOS = os.path.abspath(os.path.join(AQUI, "..", "..", "dados"))
AJAX = ("https://www.cnj.jus.br/wp-admin/admin-ajax.php"
        "?juwpfisadmin=false&action=wpfd&task=files.getFiles&view=files&id=%d")
UA = "controle-popular/1.0 (+https://github.com/FinweeJur/controle-popular)"

# Intervalo varrido. Registrado no dado: contagem sem intervalo mente por
# omissao.
#
# ⚠️ OS IDS NAO SAO CONTIGUOS. A primeira varredura cobriu 2630-2700, achou o
# bloco alfabetico dos TJs em 2650-2678 e pareceu completa. **Estava
# incompleta**: o TJ de Roraima mora sozinho no **2796**, a 118 ids do bloco.
# Uma varredura estreita teria publicado "27 tribunais" faltando um, sem
# nenhum sinal de erro. Por isso a faixa e' larga e fica gravada no dado.
FAIXA = (2400, 2950)
PAUSA_S = 1.0

# So' entram categorias cujo nome e' de orgao. As demais da faixa sao colecoes
# por ano ("2013", "abril") e nao sao acervo por tribunal.
RE_ORGAO = re.compile(r"^tribunal-|^conselho-|^superior-", re.I)


def _curl(url, alvo, timeout=180):
    """Baixa para ARQUIVO.

    ⚠️ Nao usar `urllib`: o socket do Python e' barrado nesta maquina
    (WinError 10013). ⚠️ Nao usar `capture_output`: trava em
    `_wait_for_tstate_lock` e o `timeout=` nao salva. Ver
    `subprocess_capture_output_trava`.
    """
    subprocess.run(["curl", "-sSL", "-m", str(timeout), "-A", UA, "-o", alvo, url],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                   timeout=timeout + 60)


# ─────────────────────────── CPF: redacao na origem ────────────────────────

def _cpf_valido(digitos):
    """mod-11. Formato nao prova nada; digito verificador prova."""
    if len(digitos) != 11 or len(set(digitos)) == 1:
        return False
    for k in (9, 10):
        v = sum(int(digitos[i]) * ((k + 1) - i) for i in range(k)) * 10 % 11 % 10
        if v != int(digitos[k]):
            return False
    return True


RE_CPF = re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|(?<!\d)\d{11}(?!\d)")


def redigir_cpf(texto):
    """Troca todo CPF VALIDO por marcador. Devolve (texto, quantidade).

    Roda sobre o TEXTO, nao sobre um campo rotulado -- no relatorio o CPF
    aparece no meio de frase corrida ("<Nome da pessoa> - CPF 000.000.000-00"),
    onde nenhum rotulo de fonte ajudaria.

    CNPJ FICA. Pessoa juridica em ato oficial e' informacao publica.

    ⚠️ **O EXEMPLO ACIMA E' FICTICIO, E ISSO NAO E' FRESCURA.** A primeira
    versao deste comentario trazia um CPF REAL, copiado do relatorio para
    ilustrar o formato -- e foi commitado num repositorio PUBLICO. Quem pegou
    foi `apps/web/lib/sem-cpf-no-repo.test.ts`, que valida por mod-11 tudo o
    que esta escrito a mao, nao so' o dado coletado. A licao: o coletor redigia
    o dado corretamente e o VAZAMENTO SAIU PELA DOCUMENTACAO DO PROPRIO
    REDATOR. Exemplo em comentario, mensagem de commit e docs sao superficie de
    vazamento igual ao dado. Use sempre 000.000.000-00.
    """
    n = [0]

    def troca(m):
        s = m.group(0)
        if _cpf_valido(re.sub(r"\D", "", s)):
            n[0] += 1
            return "[CPF REDIGIDO]"
        return s

    return RE_CPF.sub(troca, texto), n[0]


# ─────────────────────────────── catalogo ──────────────────────────────────

def catalogo(faixa=FAIXA):
    achados = []
    tmp = os.path.join(DADOS, "_cnj_cat.tmp")
    for cid in range(faixa[0], faixa[1] + 1):
        _curl(AJAX % cid, tmp, timeout=60)
        try:
            corpo = io.open(tmp, encoding="utf-8", errors="replace").read()
            d = json.loads(corpo)
        except Exception:
            # Validar o CORPO, nunca o status: o 500 do WordPress chega como
            # HTML de erro com aparencia de resposta.
            time.sleep(PAUSA_S)
            continue
        fs = d.get("files") or []
        if not fs:
            time.sleep(PAUSA_S)
            continue
        nome = fs[0].get("catname", "")
        if not RE_ORGAO.match(nome):
            time.sleep(PAUSA_S)
            continue
        achados.append({
            "categoriaId": cid,
            "orgao": nome,
            "orgaoTitulo": fs[0].get("cattitle") or nome,
            "relatorios": [{
                "id": f["ID"],
                "titulo": f.get("post_title", ""),
                "extensao": f.get("ext", ""),
                "tamanhoBytes": f.get("size", 0),
                "publicadoEm": f.get("created_time", ""),
                # SO' o permalink. O `openpdflink` traz token que rotaciona.
                "url": f.get("linkdownload", ""),
            } for f in fs],
        })
        time.sleep(PAUSA_S)
    if os.path.exists(tmp):
        os.remove(tmp)

    total = sum(len(a["relatorios"]) for a in achados)
    return {
        "fonte": "Corregedoria Nacional de Justiça (CNJ) — biblioteca de relatórios de inspeção e correição",
        "url": "https://www.cnj.jus.br/corregedoria/",
        "extraidoEm": "2026-08-22",
        "faixaDeIdsVarrida": {"de": faixa[0], "ate": faixa[1]},
        "avisoCobertura": (
            "Não existe rota de listagem de categorias no CNJ "
            "(task=categories.getCategories responde HTTP 500). O universo foi "
            "descoberto varrendo ids no intervalo acima. Pode haver categoria "
            "de órgão fora dele — a contagem é piso, não total."
        ),
        "avisoLink": (
            "Só o permalink sem token entra aqui. A URL com `token=` que o "
            "navegador mostra rotaciona e morre."
        ),
        "orgaos": achados,
        "totalOrgaos": len(achados),
        "totalRelatorios": total,
        "totalBytes": sum(r["tamanhoBytes"] for a in achados for r in a["relatorios"]),
    }


# ──────────────────────── achados de um relatorio ──────────────────────────

RE_RODAPE = re.compile(
    r"Num\. \d+ - Pág\. \d+\s*Assinado eletronicamente por:.*?"
    r"Número do documento: \d+", re.S)
# Linha de sumario: termina em pontilhado + numero de pagina.
RE_LINHA_SUMARIO = re.compile(r"^.*\.{3,}\s*\d+\s*$", re.M)
RE_SECAO_ACHADO = re.compile(
    r"^[ \t]*(\d+(?:\.\d+)*)\.[ \t]*\n?[ \t]*"
    r"(Achados[ \t\n]+e[ \t\n]+Determina[çc][õo]es|Recomenda[çc][õo]es)"
    r"[ \t]*$", re.M)
RE_ITEM = re.compile(
    r"(?:^|[ \t])(ACHADO|DETERMINA[ÇC][ÃA]O|RECOMENDA[ÇC][ÃA]O)"
    r"[ \t]*(\d+)?[ \t]*:", re.M)
# "Nao ha." tem VARIANTES: "Nao ha achados dignos de registro...", "Nao ha, no
# sentir da Equipe de Inspecao, recomendacoes...". Contar essas como conteudo
# publicaria "178 secoes com achados" quando a maioria diz que nao achou nada.
RE_VAZIA = re.compile(r"^N[ãa]o\s+h[áa]\b", re.I)
LIMITE_VAZIA_CHARS = 400


def sumario(doc, ate_pagina=40):
    """Indice do proprio documento: {numero: titulo}.

    ⚠️ POR QUE NAO LER O TITULO DO CORPO: no corpo o cabecalho quebra em varias
    linhas, as vezes uma palavra por linha ("4.6. / GABINETE / DO /
    DESEMBARGADOR / DELVAN / BARCELOS JUNIOR"). Casar por linha falha em
    silencio e a secao herda a unidade ANTERIOR -- ou seja, **atribui o achado
    ao desembargador errado**. Medido: as secoes 4.6.4 e 4.6.5 saiam com o nome
    da desembargadora do 4.5.

    O sumario e' a renderizacao independente do mesmo documento -- a mesma
    tatica que pegou o pareamento errado no relatorio do JUSTA.
    """
    bruto = "\n".join(doc[i].get_text() for i in range(min(ate_pagina, doc.page_count)))
    # Junta a continuacao: entrada nova sempre comeca por "N. " ou "N.N. ".
    junto = re.sub(r"\n(?!\s*\d+(?:\.\d+)*\.\s)", " ", bruto)
    saida = {}
    for num, tit, _pag in re.findall(
            r"(\d+(?:\.\d+)*)\.\s+(.+?)\s*\.{3,}\s*(\d+)", junto):
        saida.setdefault(num, re.sub(r"\s+", " ", tit).strip())
    return saida


def _unidade_de(indice, numero):
    """Sobe pelos prefixos do numero da secao ate' achar um titulo de UNIDADE.

    Unidade e' titulo em CAIXA ALTA ("4.6. GABINETE DO DESEMBARGADOR ...",
    "6.48. 5a VARA DE FAMILIA ..."). Subsecao em caixa mista ("Analise da
    equipe de inspecao") NAO e' unidade -- usa-la como rotulo produzia
    "unidade: Analise da equipe de inspecao", que nao identifica nada.
    """
    partes = numero.split(".")
    for corte in range(len(partes) - 1, 0, -1):
        pref = ".".join(partes[:corte])
        t = indice.get(pref)
        if t and t == t.upper():
            return pref, t
    raiz = partes[0]
    t = indice.get(raiz)
    return (raiz, t) if t else (None, None)


def achados_do_relatorio(caminho_pdf, meta):
    import fitz

    doc = fitz.open(caminho_pdf)
    indice = sumario(doc)
    bruto = "\n".join(p.get_text() for p in doc)
    paginas = doc.page_count
    doc.close()

    # ⚠️ PDF DIGITALIZADO NAO E' PDF VAZIO -- e' PDF que precisa de OCR, e a
    # diferenca importa porque o resto do parser trata os dois igual: sem
    # texto, nenhum regex casa, a conferencia contra o sumario compara 0 com 0
    # e PASSA, e o arquivo e' gravado com `achados: []`. Medido: o
    # `Relatorio_Inspecao_Sistema_Judiciais_Processuais_TJMG_2017.pdf` tem 16
    # paginas e **zero caractere**. Sem esta guarda, ele entraria na serie como
    # "ano sem nenhum achado" -- que e' uma afirmacao sobre o TJMG, e falsa.
    if len(bruto.strip()) < 1000:
        raise SystemExit(
            "PARE: %s tem %d paginas e so' %d caracteres de texto. E' "
            "digitalizado (imagem), nao vazio. Sem OCR nao ha o que extrair -- "
            "e gravar um JSON com lista vazia afirmaria que o ano nao teve "
            "achado nenhum."
            % (os.path.basename(caminho_pdf), paginas, len(bruto.strip())))

    texto, n_cpf = redigir_cpf(bruto)
    texto = RE_RODAPE.sub("\n", texto)
    texto = RE_LINHA_SUMARIO.sub("", texto)

    secoes = list(RE_SECAO_ACHADO.finditer(texto))
    registros, vazias, sem_unidade = [], 0, 0
    for i, m in enumerate(secoes):
        fim = secoes[i + 1].start() if i + 1 < len(secoes) else len(texto)
        corpo = texto[m.end():fim]
        # A secao termina onde comeca o proximo titulo numerado -- que pode vir
        # quebrado, por isso o corte tolera espaco/quebra depois do numero.
        corte = re.search(r"\n[ \t]*\d+(?:\.\d+)*\.[ \t\n]", corpo)
        if corte:
            corpo = corpo[:corte.start()]
        corpo = re.sub(r"[ \t]+", " ", corpo)
        corpo = re.sub(r"\n{2,}", "\n", corpo).strip()

        if RE_VAZIA.match(corpo) and len(corpo) <= LIMITE_VAZIA_CHARS:
            vazias += 1
            continue

        numero = m.group(1)
        u_num, u_tit = _unidade_de(indice, numero)
        if not u_tit:
            sem_unidade += 1
        itens = []
        marcas = list(RE_ITEM.finditer(corpo))
        for k, mm in enumerate(marcas):
            f = marcas[k + 1].start() if k + 1 < len(marcas) else len(corpo)
            itens.append({
                "tipo": mm.group(1).upper(),
                "numero": int(mm.group(2)) if mm.group(2) else None,
                "texto": re.sub(r"\s+", " ", corpo[mm.end():f]).strip(),
            })
        registros.append({
            "secao": numero,
            "tipoSecao": ("achados" if "Achado" in m.group(2)
                          else "recomendacoes"),
            "unidadeNumero": u_num,
            "unidade": u_tit,
            "itens": itens or [{"tipo": None, "numero": None,
                                "texto": re.sub(r"\s+", " ", corpo).strip()}],
        })

    # ─── conferencia contra o sumario, ANTES de gravar ───────────────────
    esperadas = sum(1 for n, t in indice.items()
                    if re.match(r"^(Achados e Determina|Recomenda)", t))
    achadas = len(secoes)
    if achadas < esperadas * 0.9:
        raise SystemExit(
            "PARE: o sumario lista %d secoes de achados/recomendacoes e o corpo "
            "rendeu %d (%.0f%%). O parser esta perdendo secao em silencio."
            % (esperadas, achadas, 100.0 * achadas / max(esperadas, 1)))

    return {
        "secoesNoSumario": esperadas,
        "secoesLidasNoCorpo": achadas,
        "secoesSemUnidadeIdentificada": sem_unidade,
        "fonte": "Corregedoria Nacional de Justiça (CNJ)",
        "relatorio": meta,
        "extraidoEm": "2026-08-22",
        "paginas": paginas,
        "cpfsRedigidos": n_cpf,
        "avisoDadoPessoal": (
            "%d CPF válido por dígito verificador foi encontrado no PDF "
            "original e REDIGIDO aqui. Os CPFs são de pessoas físicas "
            "(particulares em atos de cartório), publicados pelo próprio CNJ. "
            "O PDF original NÃO é espelhado por este projeto." % n_cpf
        ),
        "avisoNominal": (
            "As unidades incluem gabinetes identificados pelo nome do "
            "desembargador. São agentes públicos em função oficial, e o texto "
            "é de relatório público do CNJ — mas atribuir descumprimento de "
            "meta a pessoa nomeada é decisão editorial, não automática."
        ),
        "secoesVazias": vazias,
        "secoesComConteudo": len(registros),
        "achados": registros,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--catalogo", action="store_true",
                    help="varre as categorias e grava o índice de relatórios")
    ap.add_argument("--achados", metavar="PDF",
                    help="extrai achados/determinações de um relatório")
    ap.add_argument("--saida", help="caminho do JSON de saída")
    a = ap.parse_args()

    if a.catalogo:
        pacote = catalogo()
        destino = a.saida or os.path.join(DADOS, "cnj-inspecoes-catalogo.json")
        json.dump(pacote, io.open(destino, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print("órgãos: %d | relatórios: %d | %.0f MB"
              % (pacote["totalOrgaos"], pacote["totalRelatorios"],
                 pacote["totalBytes"] / 1e6))
        print("gravado:", destino)

    elif a.achados:
        meta = {
            "titulo": "Relatório de Inspeção Ordinária TJMG 2026",
            "orgao": "Tribunal de Justiça do Estado de Minas Gerais",
            "processoCnj": "0000675-79.2026.2.00.0000",
            "portaria": "Portaria nº 3, de 02/02/2026",
            "assinadoEm": "2026-07-08",
            "url": ("https://www.cnj.jus.br/download/2664/"
                    "tribunal-de-justica-do-estado-de-minas-gerais/419313/"
                    "relatorio-de-inspecao-ordinaria-tjmg-2026-2"),
        }
        pacote = achados_do_relatorio(a.achados, meta)
        destino = a.saida or os.path.join(DADOS, "cnj-inspecao-tjmg-2026.json")
        json.dump(pacote, io.open(destino, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print("páginas: %d | seções com conteúdo: %d | vazias: %d | CPFs redigidos: %d"
              % (pacote["paginas"], pacote["secoesComConteudo"],
                 pacote["secoesVazias"], pacote["cpfsRedigidos"]))
        print("gravado:", destino)

    else:
        ap.error("escolha --catalogo ou --achados PDF")
