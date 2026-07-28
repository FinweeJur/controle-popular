-- Notificações por tema, multi-canal (pedido do usuário 2026-07-21,
-- decidido 2026-07-24: MVP = e-mail + Telegram; WhatsApp/Instagram
-- ficam de fora por ora -- ver TODO.md "Notificações por tema").
--
-- `newsletter_inscritos` (0001) era tudo-ou-nada (um e-mail = uma
-- newsletter geral); ganha `temas text[]` pra virar "só me avisa de
-- Saúde e Câmara", null/vazio continua significando "tudo" (compatível
-- com quem já assinou antes desta migration).
alter table newsletter_inscritos add column if not exists temas text[];

-- Telegram identifica por chat_id numérico, não e-mail -- schema
-- separado em vez de forçar o mesmo shape de `newsletter_inscritos`.
-- `confirmado` fica sempre true aqui: a confirmação do Telegram é o
-- próprio usuário mandar /start pro bot (não precisa de double opt-in
-- por link como o e-mail).
create table telegram_inscritos (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  chat_id bigint not null,
  temas text[],
  ativo boolean default true,
  criado_em timestamptz default now(),
  unique (id_municipio, chat_id)
);

alter table telegram_inscritos enable row level security;
create policy telegram_inscritos_service_role_all on telegram_inscritos for all to service_role using (true) with check (true);
-- Sem policy de leitura pública -- chat_id é identificador pessoal do
-- Telegram, não deve ser exposto via PostgREST anon key.

-- Sistema de "Seguir" (vereador, tema ou contrato específico) -- a peça
-- que dá granularidade real ao "por tema" acima. `entidade_id` fica
-- solto (não é FK pra 3 tabelas diferentes ao mesmo tempo) porque o
-- tipo já diz qual tabela consultar na aplicação.
create table seguidores (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  entidade_tipo text not null,   -- vereador | tema | contrato
  entidade_id text not null,     -- uuid do vereador/contrato, ou slug do tema
  canal text not null,           -- email | telegram
  contato text not null,         -- e-mail ou chat_id (como texto)
  criado_em timestamptz default now(),
  unique (id_municipio, entidade_tipo, entidade_id, canal, contato)
);

alter table seguidores enable row level security;
create policy seguidores_service_role_all on seguidores for all to service_role using (true) with check (true);
-- Sem policy de leitura pública pelo mesmo motivo do telegram_inscritos
-- (contato pode ser e-mail) -- o contador agregado ("N pessoas seguem")
-- deve ser exposto via uma view/RPC que devolve só o count, não as linhas.
create view seguidores_contagem as
  select id_municipio, entidade_tipo, entidade_id, count(*) as total
  from seguidores
  group by id_municipio, entidade_tipo, entidade_id;
grant select on seguidores_contagem to anon;
