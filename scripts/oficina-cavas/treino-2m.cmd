@echo off
REM Supervisor de retreino e calibracao 2 m no logon.
REM O treinador tem lock proprio; o supervisor nao duplica o loop.
cd /d X:\DevCoder\OpenCode\controle-popular
"C:\Users\teste\AppData\Local\hermes\hermes-agent\venv\Scripts\pythonw.exe" scripts\oficina-cavas\supervisor-treino-2m.py --intervalo 1200 --min-novos 20 --min-pos 250 >> docs\relatorios-automacao\logs\treino-2m.log 2>&1
