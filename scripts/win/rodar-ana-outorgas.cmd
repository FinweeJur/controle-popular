@echo off
rem ANA outorgas (nacional, cobre o PA) com checkpoint por dataset.
rem Chave de 2 em 2 horas pelo Agendador: quando todos os datasets estiverem
rem concluidos, a rodada seguinte pula todos e sai rapido.
cd /d C:\DevCoder\controle-popular
python scripts\coletar-ana-outorgas.py --limit 0 >> logs\ana-outorgas.log 2>&1
