import yfinance as yf
import json
from datetime import datetime, date

ticker = yf.Ticker("SGML")
hist = ticker.history(start="2022-01-01")

cotacoes = []
for date_idx, row in hist.iterrows():
    cotacoes.append({
        "data": date_idx.strftime("%Y-%m-%d"),
        "abertura": round(float(row["Open"]), 2),
        "maxima": round(float(row["High"]), 2),
        "minima": round(float(row["Low"]), 2),
        "fechamento": round(float(row["Close"]), 2),
        "volume": int(row["Volume"])
    })

result = {
    "fonte": "Yahoo Finance - SGML NASDAQ",
    "ultima_atualizacao": date.today().isoformat(),
    "total": len(cotacoes),
    "moeda": "USD",
    "cotacoes": cotacoes
}

import os
out_path = os.path.join(os.path.dirname(__file__), "..", "data", "sgml-cotacoes.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Saved {len(cotacoes)} records to {out_path}")
if cotacoes:
    print(f"Range: {cotacoes[0]['data']} to {cotacoes[-1]['data']}")
    print(f"Latest close: ${cotacoes[-1]['fechamento']}")
