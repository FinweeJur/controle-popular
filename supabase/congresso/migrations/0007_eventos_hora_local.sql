-- 0007 — a hora do evento é hora de BRASÍLIA, não instante UTC.
--
-- BUG REAL, medido no banco depois da primeira carga: a API publica
-- `"dataHoraInicio": "2026-08-03T15:00"` — SEM offset. É hora de parede de
-- Brasília, que é como a Câmara convoca uma audiência. Guardado em
-- `timestamptz` numa sessão com `TimeZone = GMT` (o padrão do Neon), o
-- Postgres interpretou 15:00 como 15:00 UTC. Renderizado depois em fuso do
-- Brasil, o portal anunciaria a audiência para **12:00** — três horas antes
-- da hora real, num dado cuja única função é a pessoa chegar na hora.
--
-- A correção certa é o tipo, não uma conversão espalhada pelas telas:
-- `timestamp` (sem fuso) diz exatamente o que a fonte diz — "às 15h em
-- Brasília" — e não convida ninguém a converter. Somar `-03:00` na ingestão
-- seria a outra opção, mas fixa um offset que não valeu sempre (o Brasil
-- tinha horário de verão até 2019) e voltaria a mentir num backfill antigo.
--
-- O `using inicio at time zone 'UTC'` recupera a hora original: o valor foi
-- gravado como 15:00 UTC, então lê-lo em UTC devolve o 15:00 de parede que
-- a fonte publicou. Nada se perde.
set search_path = congresso, public;

alter table congresso.eventos
  alter column inicio type timestamp using inicio at time zone 'UTC',
  alter column fim    type timestamp using fim    at time zone 'UTC';

comment on column congresso.eventos.inicio is
  'Hora de parede de Brasília, como a Câmara convoca. NÃO é instante UTC — ver migration 0007.';
