@echo off
REM Coleta continua de positivos 2 m no logon (1 worker, para no G1).
REM O supervisor tem lock proprio; o gerador tem lock proprio. Rodar de novo
REM nao duplica hash nem trunca PNG.
cd /d X:\DevCoder\OpenCode\controle-popular
"C:\Users\teste\AppData\Local\hermes\hermes-agent\venv\Scripts\pythonw.exe" scripts\oficina-cavas\supervisor-coleta-2m.py --meta 300 --lote 24 --workers 1 --intervalo 60 >> docs\relatorios-automacao\logs\coleta-2m.log 2>&1
