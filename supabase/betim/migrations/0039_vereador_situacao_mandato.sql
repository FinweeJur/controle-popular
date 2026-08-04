-- `vereadores.situacao_mandato` — POR QUE alguém não está em exercício.
--
-- `ativo` (boolean) já separava quem está na Câmara de quem saiu, mas não
-- distinguia as duas razões muito diferentes de não estar:
--
--   * o vereador LICENCIADO — que continua sendo o titular da cadeira, segue
--     presidindo/compondo comissão, e volta;
--   * o vereador de legislatura ENCERRADA, que é histórico.
--
-- Isso tinha consequência visível em São Paulo: 8 participações de comissão
-- em vigor não eram graváveis porque o titular estava licenciado e portanto
-- fora dos 55 `ativo = true`, e `comissao_membros.vereador_id` é NOT NULL. O
-- efeito no portal era a vice-presidência da CCJ aparecendo VAZIA — que lê
-- como "a comissão não tem vice", e não como "o vice está licenciado".
--
-- A SAÍDA ÓBVIA ERA ERRADA. Bastaria gravar o licenciado como `ativo = true`
-- e a comissão fecharia — mas aí São Paulo passaria a exibir **58 vereadores
-- para 55 cadeiras**, e toda contagem, média por vereador e ranking herdaria
-- o erro. Quem lê o portal não tem como saber que três daqueles nomes não
-- votam. Daí a coluna: o licenciado ENTRA no banco e FICA FORA da contagem
-- de ativos, com o motivo explícito na linha em vez de implícito num boolean.
--
-- Valores: 'em_exercicio' (o padrão), 'licenciado', 'afastado', 'encerrado'.
-- Texto livre com CHECK em vez de enum: acrescentar um valor a um enum do
-- Postgres exige ALTER TYPE fora de transação, e a lista aqui muda mais do
-- que a estrutura.
alter table vereadores
  add column if not exists situacao_mandato text not null default 'em_exercicio';

alter table vereadores drop constraint if exists vereadores_situacao_mandato_check;
alter table vereadores add constraint vereadores_situacao_mandato_check
  check (situacao_mandato in ('em_exercicio', 'licenciado', 'afastado', 'encerrado'));

-- Coerência entre as duas colunas: quem está `ativo` está em exercício, e
-- quem não está tem de dizer por quê. Sem isto, nada impediria uma coleta
-- gravar `ativo = true` junto de `situacao_mandato = 'licenciado'` — que é
-- exatamente o estado contraditório que esta migration existe para evitar.
alter table vereadores drop constraint if exists vereadores_ativo_coerente_check;
alter table vereadores add constraint vereadores_ativo_coerente_check
  check (
    (ativo is true and situacao_mandato = 'em_exercicio')
    or (ativo is not true and situacao_mandato <> 'em_exercicio')
  );

create index if not exists vereadores_situacao_idx
    on vereadores (id_municipio, situacao_mandato);

comment on column vereadores.situacao_mandato is
  'Por que o vereador nao esta em exercicio: em_exercicio | licenciado | afastado | encerrado. Licenciado continua titular da cadeira e da comissao, mas NAO entra na contagem de ativos — ver 0039.';
