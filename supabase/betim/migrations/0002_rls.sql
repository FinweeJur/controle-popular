-- Betim.ai — Row Level Security
-- Pattern (plan §4): public SELECT on all data tables; writes restricted to service_role.
-- Exceptions: anuncios / zap_estabelecimentos / classificados expose only ativo/aprovado = true rows publicly.
-- Public INSERT allowed only on: zap_estabelecimentos, classificados, newsletter_inscritos (land unapproved).

do $$
declare
  t text;
  public_select_tables text[] := array[
    'municipios','licitacoes','contratos','fornecedores','socios','grupos_economicos',
    'vereadores','proposicoes','subsidios','diarias','doacoes_campanha','processos_judiciais',
    'pautas_atas','receitas','despesas','servidores','folha_pagamento','atos_oficiais','obras',
    'indicadores','saude_estabelecimentos','saude_internacoes','arboviroses','mortalidade',
    'escolas','beneficios_sociais','seguranca_ocorrencias','meio_ambiente','emendas','pntp',
    'postos_anp','farmacias_plantao','coleta_lixo','contatos_uteis','embeddings','fontes_externas',
    'clima_cache'
  ];
begin
  foreach t in array public_select_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (true)', t || '_public_select', t);
    execute format('create policy %I on %I for all to service_role using (true) with check (true)', t || '_service_role_all', t);
  end loop;
end $$;

-- Moderated public tables: public sees only approved/active rows; public can insert (lands unapproved)
alter table zap_estabelecimentos enable row level security;
create policy zap_estabelecimentos_public_select on zap_estabelecimentos for select using (aprovado = true);
create policy zap_estabelecimentos_public_insert on zap_estabelecimentos for insert to anon with check (aprovado = false);
create policy zap_estabelecimentos_service_role_all on zap_estabelecimentos for all to service_role using (true) with check (true);

alter table classificados enable row level security;
create policy classificados_public_select on classificados for select using (aprovado = true);
create policy classificados_public_insert on classificados for insert to anon with check (aprovado = false);
create policy classificados_service_role_all on classificados for all to service_role using (true) with check (true);

alter table anuncios enable row level security;
create policy anuncios_public_select on anuncios for select using (ativo = true);
create policy anuncios_service_role_all on anuncios for all to service_role using (true) with check (true);

-- Newsletter: no public select (contains emails), public insert only
alter table newsletter_inscritos enable row level security;
create policy newsletter_public_insert on newsletter_inscritos for insert to anon with check (confirmado = false);
create policy newsletter_service_role_all on newsletter_inscritos for all to service_role using (true) with check (true);

-- cache_ia: internal only, no public access
alter table cache_ia enable row level security;
create policy cache_ia_service_role_all on cache_ia for all to service_role using (true) with check (true);

-- Storage buckets: public read, service-role write
insert into storage.buckets (id, name, public) values ('banners', 'banners', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('fotos', 'fotos', true) on conflict do nothing;

create policy banners_public_read on storage.objects for select using (bucket_id = 'banners');
create policy banners_service_role_write on storage.objects for insert to service_role with check (bucket_id = 'banners');
create policy fotos_public_read on storage.objects for select using (bucket_id = 'fotos');
create policy fotos_service_role_write on storage.objects for insert to service_role with check (bucket_id = 'fotos');
