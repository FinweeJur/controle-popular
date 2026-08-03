-- `posicao_ranking_mg` e `total_avaliados_mg` passam a se chamar
-- `posicao_ranking_uf` e `total_avaliados_uf`.
--
-- O sufixo `_mg` nasceu quando Betim era a única cidade e a planilha do PNTP
-- parecia ser de Minas Gerais. Ela é NACIONAL — 11.697 avaliações — e com
-- São Paulo no ar as colunas passaram a guardar a posição entre os 645
-- municípios paulistas sob um nome que diz Minas Gerais.
--
-- Nome de coluna que mente é como o defeito volta: o próximo a ler
-- `posicao_ranking_mg` vai supor MG, e o dado não vai contradizê-lo — 256 é
-- um número perfeitamente plausível para um ranking mineiro.
--
-- `if exists` nos dois lados para a migration poder rodar de novo sem
-- estourar em base que já foi migrada.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'nota_transparencia'
       and column_name = 'posicao_ranking_mg'
  ) then
    alter table nota_transparencia rename column posicao_ranking_mg to posicao_ranking_uf;
  end if;

  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'nota_transparencia'
       and column_name = 'total_avaliados_mg'
  ) then
    alter table nota_transparencia rename column total_avaliados_mg to total_avaliados_uf;
  end if;
end $$;
