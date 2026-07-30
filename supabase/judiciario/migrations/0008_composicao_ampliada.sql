-- 0008 — composição além do STF: 2ª instância e integrante sem cadeira numerada.
--
-- DOIS PROBLEMAS REAIS que este arquivo resolve.
--
-- (1) A CADEIRA NUMERADA NÃO EXISTE EM TODO TRIBUNAL. O modelo do projeto é
-- "modelar a cadeira, não a pessoa", e isso funciona nos superiores: o STJ
-- publica a linha sucessória cadeira por cadeira, com a cota de origem de
-- cada uma. Já o TJMG (148 desembargadores) e o TRF6 (18) NÃO numeram cadeira
-- por desembargador em fonte pública, e o TST publica os 27 ministros sem
-- dizer quem entrou pelo quinto e quem veio da carreira.
-- Sem um lugar para guardar "esta pessoa integra este tribunal", a única
-- saída seria inventar número e cota de cadeira — ou seja, produzir contagem
-- errada de "vagas por cota", que é exatamente o número que este produto
-- existe para acertar. `magistrados.tribunal_atual` é esse lugar: registra a
-- integração sem afirmar cadeira, e a `ocupacoes` continua reservada ao caso
-- em que a cadeira e a cota foram VERIFICADAS.
--
-- (2) Faltavam os tribunais. TJMG e TRF6 não existiam em `tribunais`, então
-- nem os 148 desembargadores já coletados pelo scraper (F8) tinham onde
-- entrar.
set search_path = judiciario, public;

alter table judiciario.magistrados
  add column if not exists tribunal_atual text references judiciario.tribunais(id),
  -- 'ministro' nos superiores, 'desembargador' na 2ª instância. O rótulo é
  -- do cargo, não decorativo: chamar desembargador de ministro é erro de
  -- domínio que um portal de controle social não pode cometer.
  add column if not exists cargo text,
  -- De onde veio o dado desta pessoa. Fica na linha porque a curadoria é
  -- incremental e por tribunal: sem isto, em seis meses ninguém sabe se um
  -- nome veio de fonte oficial ou de um scraper frágil.
  add column if not exists fonte_curadoria text;

create index if not exists magistrados_tribunal_atual_idx
  on judiciario.magistrados (tribunal_atual) where tribunal_atual is not null;

comment on column judiciario.magistrados.tribunal_atual is
  'Tribunal que a pessoa integra hoje, para os casos em que a fonte NÃO numera cadeira individual (2ª instância, e superiores cuja cota por cadeira não foi verificada). Quando a cadeira é conhecida, o vínculo canônico é `ocupacoes` — ver migration 0008.';

-- ── Tribunais novos ────────────────────────────────────────────────────
-- `n_cadeiras` só é preenchido quando o número foi VERIFICADO. TRF6: 18,
-- confirmado em duas fontes independentes (Lei 14.226/2021 noticiada pelo
-- CJF/STJ, e a própria página de composição do TRF6, que lista 18 nomes).
-- TJMG fica NULO de propósito: o scraper coletou 148 desembargadores ativos,
-- mas o total de cargos previsto em lei estadual não foi conferido aqui, e
-- 148 é quem está em exercício, não o tamanho da corte.
insert into judiciario.tribunais
  (id, ramo, instancia, esfera, nome, sigla, uf, n_cadeiras,
   autoridade_nomeante, exige_sabatina_senado, base_legal, url_composicao, ativo)
values
  ('trf6', 'federal', 'segunda', 'federal',
   'Tribunal Regional Federal da 6ª Região', 'TRF6', 'MG', 18,
   'Presidente da República', false,
   'Lei 14.226/2021; CF art. 94 (quinto) e art. 107',
   'https://portal.trf6.jus.br/composicao-trf6/', true),
  ('tjmg', 'estadual', 'segunda', 'estadual',
   'Tribunal de Justiça de Minas Gerais', 'TJMG', 'MG', null,
   'Governador de Minas Gerais', false,
   'CF art. 94 (quinto) e art. 93, II (carreira)',
   'https://www.tjmg.jus.br/portal-tjmg/institucional/magistratura/desembargadores.htm', true)
on conflict (id) do update set
  nome = excluded.nome,
  n_cadeiras = excluded.n_cadeiras,
  url_composicao = excluded.url_composicao,
  base_legal = excluded.base_legal;

-- ── Cota real das cadeiras do STJ ──────────────────────────────────────
-- As 33 cadeiras foram semeadas em BLOCOS por cota (1–11 TRF, 12–22 TJ,
-- 23–28 OAB, 29–33 MP), porque `regras.json` só diz quantas são de cada.
-- A linha sucessória oficial do STJ diz QUAL cadeira é de qual cota, e a
-- contagem dela bate exata com a régua (11 TRF, 11 TJ, 6 OAB, 5 MP) — é
-- essa concordância que autoriza confiar no mapa.
--
-- Renumerar para o oficial é o certo, não cosmético: o número da cadeira é a
-- identidade durável da vaga, e é por ele que uma sucessão se acompanha ao
-- longo de décadas. Seguro agora porque `ocupacoes` do STJ está vazia — feito
-- depois, com ocupante já ligado, exigiria migrar os vínculos.
update judiciario.cadeiras c set cota = v.cota, observacao = v.origem
from (values
  (1,'terco_oab','OAB/DF'), (2,'terco_mp','MPPR'), (3,'terco_tj','TJAL'),
  (4,'terco_mp','MPDF'), (5,'terco_oab','OAB/SP'), (6,'terco_mp','MPAM'),
  (7,'terco_mp','MPAL'), (8,'terco_tj','TJCE'), (9,'terco_trf','TRF 1ª'),
  (10,'terco_tj','TJRJ'), (11,'terco_trf','TRF 2ª'), (12,'terco_trf','TRF 4ª'),
  (13,'terco_oab','OAB/SP'), (14,'terco_trf','TRF 2ª'), (15,'terco_trf','TRF 1ª'),
  (16,'terco_trf','TRF 5ª'), (17,'terco_trf','TRF 5ª'), (18,'terco_oab','OAB/DF'),
  (19,'terco_oab','OAB/DF'), (20,'terco_tj','TJCE'), (21,'terco_trf','TRF 3ª'),
  (22,'terco_trf','TRF 5ª'), (23,'terco_trf','TRF 1ª'), (24,'terco_oab','OAB/DF'),
  (25,'terco_mp','MPSP'), (26,'terco_trf','TRF 3ª'), (27,'terco_tj','TJMG'),
  (28,'terco_tj','TJDFT'), (29,'terco_tj','TJSC'), (30,'terco_tj','TJRJ'),
  (31,'terco_tj','TJRJ'), (32,'terco_tj','TJSP'), (33,'terco_tj','TJPE')
) as v(numero, cota, origem)
where c.tribunal_id = 'stj' and c.numero = v.numero;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on judiciario.tribunais, judiciario.magistrados to anon;
  end if;
end $$;
