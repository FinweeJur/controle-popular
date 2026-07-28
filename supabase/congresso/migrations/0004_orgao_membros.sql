-- Membros de órgãos (comissões): quem de fato decide uma proposição agora.
--
-- Existe porque `sugerirDestinatarios()` (geração de ofício) só tinha o
-- AUTOR do PL para sugerir como destinatário — e pedir para o autor de um
-- projeto aprovar o próprio projeto não serve para nada. Quem decide é o
-- colegiado onde a matéria está parada: presidência, vice-presidências e
-- membros titulares da comissão. Mesmo padrão de `bancada_membros`
-- (0001), só que para `orgaos` em vez de `bancadas`.
--
-- Rode DEPOIS de 0001-0003, no mesmo projeto/schema. Arquivo inteiro de
-- uma vez — o `set search_path` vale para a sessão.

set search_path = congresso, public, extensions;

create table congresso.orgao_membros (
  orgao_id uuid not null references congresso.orgaos(id) on delete cascade,
  parlamentar_id uuid not null references congresso.parlamentares(id) on delete cascade,
  -- "Presidente" | "1º Vice-Presidente" | "Titular" | "Suplente" — vem
  -- literal do campo `titulo` da API da Câmara.
  papel text,
  primary key (orgao_id, parlamentar_id)
);

alter table congresso.orgao_membros enable row level security;
create policy orgao_membros_select_publico on congresso.orgao_membros
  for select to anon, authenticated using (true);

-- Conferência: deve devolver 0 linhas (tabela vazia) sem erro. Se der erro
-- de relação inexistente, o create table acima não rodou.
select count(*) from congresso.orgao_membros;
