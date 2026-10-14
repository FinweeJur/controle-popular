@echo off
REM Coleta de negativos da Oficina de Cavas — chamado pelo schtasks a cada 4h.
REM Motivo de existir: o /TR do schtasks tem teto de 261 caracteres e o
REM caminho absoluto do python + args + log passa disso. Este .cmd mora no
REM repo (pasta ja excluida do Bitdefender pelo dono) e encurta o comando.
cd /d X:\DevCoder\OpenCode\controle-popular
"C:\Users\teste\AppData\Local\hermes\hermes-agent\venv\Scripts\python.exe" scripts\oficina-cavas\oficina.py rodar --estagio coletar --tipo negativo --limite 10 >> docs\relatorios-automacao\logs\oficina-coleta.log 2>&1
