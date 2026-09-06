"""Lê cabeçalho e 3 primeiras linhas de um xlsx."""
import sys
from openpyxl import load_workbook

path = sys.argv[1] if len(sys.argv) > 1 else r"C:\DevCoder\controle-popular\etl\betim\dados\temp\BancoVDE 2025.xlsx"
wb = load_workbook(path, read_only=True, data_only=True)
ws = wb.active
rows = list(ws.iter_rows(max_row=5, values_only=True))
wb.close()
for i, row in enumerate(rows):
    print(f"Linha {i+1}: {row}")
