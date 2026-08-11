-- Semeia o início do mandato em curso de São Paulo, que faltava.
--
-- `etl/psp/legislacao.py` já documentava "2025 em São Paulo" na própria
-- docstring (RECORTE — ANOS) desde que o módulo foi escrito, mas essa
-- migration nunca existiu: `fontes.legislatura` sempre esteve nula para
-- 3550308. Sem ela, `python -m etl.psp.legislacao` sem `--desde-ano`
-- aborta com RuntimeError ("não declara fontes.legislatura.inicio") --
-- e é exatamente assim que o cron semanal roda, sem flag nenhuma. Achado
-- ao vivo em 2026-08-11, rodando o módulo pela primeira vez contra o
-- banco local (auditoria 2026-08-11, item "vale a pena" #V1).
--
-- Mandato 2025-2028 (eleição municipal de 2024), mesmo ciclo já semeado
-- para Araçuaí/Itinga/Diamantina em 0043. Sem `ordinal`: não confirmado
-- em fonte oficial para São Paulo (as outras três leram o número direto
-- da API do SAPL/legislatura; aqui não há SAPL).
--
-- Guarda de existência com `?`, igual 0034: uma segunda execução não
-- sobrescreve um valor que alguém tenha ajustado à mão.

update municipios
set fontes = fontes || jsonb_build_object(
      'legislatura', jsonb_build_object('inicio', 2025, 'fim', 2028)
    )
where id_municipio = '3550308'
  and not (coalesce(fontes, '{}'::jsonb) ? 'legislatura');
