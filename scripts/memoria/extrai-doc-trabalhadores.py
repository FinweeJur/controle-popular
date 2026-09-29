import re
from pathlib import Path
ORIGEM = Path(r"C:\Users\teste\Downloads\Calendário Histórico dos Trabalhadores_revisadomarcojoana.doc")
DESTINO = Path(r"C:\Users\teste\AppData\Local\Temp\opencode\calendario-trabalhadores.txt")
bruto = ORIGEM.read_bytes()
melhor = ""
for enc in ("utf-16-le", "utf-16-be", "cp1252", "utf-8"):
    txt = bruto.decode(enc, errors="replace")
    trechos = re.findall(r"[^\x00-\x1f\x7f-\x9f\ufffd]{6,}", txt)
    limpos = [t.strip() for t in trechos if len(t.strip()) >= 6]
    total = sum(len(t) for t in limpos)
    print(f"{enc}: {len(limpos)} trechos, {total} chars", flush=True)
    if total > len(melhor):
        melhor = "\n".join(limpos)
DESTINO.write_text(melhor, encoding="utf-8")
print("--- amostra do melhor ---", flush=True)
print(melhor[:1500], flush=True)