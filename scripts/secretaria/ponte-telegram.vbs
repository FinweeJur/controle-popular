' Sobe a ponte de comando do Telegram sem abrir janela.
' Roda no logon via atalho na pasta Startup do usuario.
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = "X:\DevCoder\controle-popular"
sh.Run "cmd /c scripts\secretaria\ponte-telegram.cmd", 0, False
