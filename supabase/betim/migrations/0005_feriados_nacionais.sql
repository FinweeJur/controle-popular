-- Betim.ai — national holidays (BrasilAPI feriados/v1)
-- Unlike every other table in this schema, this one is NOT per-município —
-- national holidays are the same for every city, so there's no id_municipio
-- FK here. Useful downstream for: "contrato assinado em feriado" style
-- checks, citizen-service calendars (coleta de lixo, farmácias de plantão).
create table feriados_nacionais (
  data date primary key,
  nome text not null,
  tipo text not null   -- always 'national' per BrasilAPI, kept for forward-compat
);
