"""etl.inteiro_teor — baixa e extrai o texto integral das proposições.

Rodar:
  python -m etl.inteiro_teor --limite 50
  python -m etl.inteiro_teor --id-externo 2641484
  python -m etl.inteiro_teor --url <url>   # teste avulso, sem banco

POR QUE ISTO IMPORTA MAIS DO QUE PARECE: sem o inteiro teor, a análise
enxerga só a ementa — e ementa é resumo escrito pelo próprio autor, que
frequentemente descreve a intenção e não o efeito. "Altera a Lei X para
aperfeiçoar o instituto Y" não diz se amplia ou restringe direito nenhum.
É no texto que está o verbo que a rubrica precisa.

FORMATO: `urlInteiroTeor` devolve **PDF** na Câmara (verificado ao vivo:
`content-type: application/pdf`, ~110 KB para um PL curto). Alguns
documentos antigos vêm em RTF ou DOC. PDF e RTF são tratados; DOC antigo
(binário OLE) é registrado como não extraído em vez de gerar texto lixo —
melhor a análise rodar só com a ementa e saber disso do que com uma sopa
de bytes que o modelo vai tentar interpretar.

TETO DE TAMANHO: PDFs de PLs grandes (códigos inteiros, LDO) chegam a
centenas de páginas. Guardamos até `MAX_CHARS`; o prompt já corta em 20k
de qualquer forma, e texto além disso só engorda o banco.
"""
import argparse
import io
import re

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from etl.common import fetch_all, get_supabase_client, upsert_em_lotes

MAX_CHARS = 200_000
MAX_PAGINAS = 120

_session = requests.Session()
_session.headers.update(
    {"User-Agent": "ControlePopular-Congresso/0.1 (+https://controlepopular.br)"}
)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=20))
def _baixar(url: str) -> tuple[bytes, str]:
    resp = _session.get(url, timeout=120, allow_redirects=True)
    resp.raise_for_status()
    return resp.content, (resp.headers.get("content-type") or "").lower()


def _limpar(texto: str) -> str:
    """Normaliza o texto extraído.

    Quebra de linha a cada linha visual do PDF transforma uma frase em
    várias — e o modelo, ao ser instruído a citar um `trecho` LITERAL,
    devolveria o trecho picotado. Juntamos linhas que continuam a mesma
    frase e preservamos parágrafos.
    """
    texto = texto.replace("\r\n", "\n").replace("\xa0", " ")
    texto = re.sub(r"[ \t]+", " ", texto)
    # Junta linha que não terminou em pontuação com a seguinte.
    texto = re.sub(r"(?<![.:;!?\n])\n(?![\n•\-–—\d])", " ", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    return texto.strip()


def extrair_texto(conteudo: bytes, content_type: str, url: str = "") -> tuple[str | None, str]:
    """Devolve (texto, motivo). `texto` é None quando não deu para extrair."""
    alvo = f"{content_type} {url}".lower()

    if "pdf" in alvo or conteudo[:5] == b"%PDF-":
        try:
            from pypdf import PdfReader
        except ImportError:
            return None, "pypdf não instalado"
        try:
            leitor = PdfReader(io.BytesIO(conteudo))
            paginas = [(p.extract_text() or "") for p in leitor.pages[:MAX_PAGINAS]]
            texto = _limpar("\n".join(paginas))
            if len(texto) < 200:
                # PDF de imagem escaneada: extrai quase nada. Sem OCR não
                # há o que fazer, e devolver 50 caracteres de cabeçalho
                # seria pior que devolver nada.
                return None, "pdf sem camada de texto (provável digitalização)"
            return texto[:MAX_CHARS], "pdf"
        except Exception as e:
            return None, f"falha ao ler pdf: {e}"

    if "rtf" in alvo or conteudo[:5] == b"{\\rtf":
        try:
            from striprtf.striprtf import rtf_to_text
        except ImportError:
            return None, "striprtf não instalado"
        try:
            return _limpar(rtf_to_text(conteudo.decode("latin-1", "ignore")))[:MAX_CHARS], "rtf"
        except Exception as e:
            return None, f"falha ao ler rtf: {e}"

    if "html" in alvo:
        texto = re.sub(r"<script.*?</script>|<style.*?</style>", " ", conteudo.decode("utf-8", "ignore"), flags=re.S)
        texto = re.sub(r"<[^>]+>", "\n", texto)
        return _limpar(texto)[:MAX_CHARS], "html"

    if conteudo[:8] == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
        return None, "doc binário antigo (OLE) — não suportado"

    return None, f"content-type não tratado: {content_type!r}"


def sync(limite: int = 50, id_externo: str | None = None) -> int:
    sb = get_supabase_client()

    def query():
        q = (
            sb.table("proposicoes")
            .select("id, id_externo, identificacao, url_inteiro_teor")
            .not_.is_("url_inteiro_teor", "null")
        )
        return q.eq("id_externo", id_externo) if id_externo else q.is_("texto_integral", "null")

    pendentes = fetch_all(query)[:limite]
    print(f"[inteiro_teor] {len(pendentes)} proposições sem texto extraído")

    atualizacoes: list[dict] = []
    falhas: dict[str, int] = {}

    for prop in pendentes:
        try:
            conteudo, tipo = _baixar(prop["url_inteiro_teor"])
        except Exception as e:
            print(f"  [download] {prop['identificacao']}: {e}")
            falhas["download"] = falhas.get("download", 0) + 1
            continue

        texto, motivo = extrair_texto(conteudo, tipo, prop["url_inteiro_teor"])
        if not texto:
            print(f"  [pular] {prop['identificacao']}: {motivo}")
            falhas[motivo.split(":")[0]] = falhas.get(motivo.split(":")[0], 0) + 1
            continue

        atualizacoes.append(
            {
                "casa_id": "camara",
                "id_externo": prop["id_externo"],
                "texto_integral": texto,
            }
        )
        print(f"  [ok] {prop['identificacao']}: {len(texto)} chars ({motivo})")

    if atualizacoes:
        upsert_em_lotes(
            sb, "proposicoes", atualizacoes, tamanho=50, on_conflict="casa_id,id_externo"
        )

    print(f"[inteiro_teor] {len(atualizacoes)} textos gravados")
    if falhas:
        print(f"[inteiro_teor] não extraídos: {falhas}")
    return len(atualizacoes)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--limite", type=int, default=50)
    p.add_argument("--id-externo")
    p.add_argument("--url", help="testa a extração numa URL avulsa, sem tocar no banco")
    args = p.parse_args()

    if args.url:
        conteudo, tipo = _baixar(args.url)
        texto, motivo = extrair_texto(conteudo, tipo, args.url)
        print(f"tipo: {tipo} | motivo: {motivo} | chars: {len(texto or '')}")
        print((texto or "")[:1500])
    else:
        sync(args.limite, args.id_externo)
