@echo off
REM ============================================================
REM  compactar-backup.cmd — backup/compactacao do repo
REM
REM  Gera em C:\Backups\:
REM   1) controle-popular-<data>.bundle  -> historico git COMPLETO
REM      (todas as branches/commits/tags; restaura com
REM       `git clone backup.bundle pasta`)
REM   2) controle-popular-env-<data>.zip -> secrets locais
REM      (scripts\.env + apps\web\.env.local; NAO vao pro git)
REM
REM  O tar do working tree foi abandonado em 01/09: com node_modules
REM  e acervo-documentos o arquivo ficava em 0 bytes por muito tempo
REM  (compressao de zips/PDFs grandes) e competia com o build.
REM  O git bundle e mais completo e muito mais rapido.
REM  Ver docs/05-operacao/CAMINHOS-DESTA-MAQUINA.md.
REM ============================================================
setlocal
set "REPO=C:\DevCoder\controle-popular"
set "DESTDIR=C:\Backups"
if not exist "%DESTDIR%" mkdir "%DESTDIR%"

for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmm"`) do set "STAMP=%%I"
set "BUNDLE=%DESTDIR%\controle-popular-%STAMP%.bundle"
set "ENVZIP=%DESTDIR%\controle-popular-env-%STAMP%.zip"

echo [1/2] git bundle (historico completo)...
git -C "%REPO%" bundle create "%BUNDLE%" --all
if %errorlevel%==0 (echo   OK: %BUNDLE%) else (echo   ERRO no bundle)

echo [2/2] zip dos .env locais...
powershell -NoProfile -Command "Compress-Archive -Path '%REPO%\scripts\.env','%REPO%\apps\web\.env.local' -DestinationPath '%ENVZIP%' -Force"
if exist "%ENVZIP%" (echo   OK: %ENVZIP%) else (echo   ERRO no zip de env)

endlocal
