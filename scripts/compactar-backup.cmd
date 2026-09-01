@echo off
REM ============================================================
REM  compactar-backup.cmd — backup/compactacao do repo
REM  Gera um .zip em C:\Backups\ com o codigo e a documentacao,
REM  sem node_modules, .next, .git, logs e .claude (usa o tar do
REM  Windows, que respeita --exclude por padrao).
REM  Ver docs/05-operacao/CAMINHOS-DESTA-MAQUINA.md.
REM ============================================================
setlocal
set "REPO=C:\DevCoder\controle-popular"
set "DESTDIR=C:\Backups"
if not exist "%DESTDIR%" mkdir "%DESTDIR%"

REM Data/hora compacta: AAAAMMDD-HHMM (locale-independente via wmic/powershell)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value ^| find "="') do set "DT=%%I"
set "STAMP=%DT:~0,8%-%DT:~8,4%"
set "DEST=%DESTDIR%\controle-popular-%STAMP%.zip"

echo Compactando %REPO% -> %DEST%
tar -a -c -f "%DEST%" ^
  --exclude=node_modules ^
  --exclude=.next ^
  --exclude=.git ^
  --exclude=logs ^
  --exclude=.claude ^
  --exclude=_tgz ^
  -C "C:\DevCoder" controle-popular

if %errorlevel%==0 (
  echo OK: %DEST%
) else (
  echo ERRO ao compactar. tar devolveu %errorlevel%.
)
endlocal
