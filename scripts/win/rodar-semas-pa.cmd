@echo off
rem Rodada do SIMLAM-PA ate o catalogo fechar, retomando do checkpoint.
rem Existe porque processo iniciado da sessao do agente morre quando a sessao
rem acaba: quem garante a noite e o Agendador de Tarefas do Windows, que chama
rem este .cmd a cada 30 min. A trava de instancia do supervisor impede que a
rem chamada seguinte atropele a que ja esta rodando.
cd /d C:\DevCoder\controle-popular
python scripts\rodar-semas-pa-ate-concluir.py >> logs\semas-pa-supervisor.log 2>&1
